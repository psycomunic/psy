import 'server-only';
import { clienteServico } from '@/lib/supabase/servico';
import { bancoConfigurado } from '@/lib/supabase/ambiente';

/**
 * O carteiro. Uma função, um provedor, nenhuma dependência nova.
 *
 * ============================================================
 * POR QUE `fetch` E NÃO O PACOTE DO RESEND
 * ============================================================
 * A API é um POST com JSON. O pacote oficial embrulha isso em uma
 * árvore de dependências que entra no deploy inteiro para economizar
 * vinte linhas, e é o mesmo raciocínio que já vale para o Asaas e para
 * o Google Agenda neste projeto: cliente de API escrito à mão, com o
 * erro do provedor subindo legível.
 *
 * ============================================================
 * ESTA FUNÇÃO NÃO LEVANTA EXCEÇÃO. NUNCA.
 * ============================================================
 * Ela é chamada depois de gravar o lead, a proposta, o acesso. O
 * trabalho de verdade já aconteceu quando ela roda.
 *
 * Se o Resend estiver fora, se a chave estiver errada, se a rede cair:
 * a inscrição da pessoa continua gravada e o formulário continua
 * dizendo "recebido", porque foi recebido. Um `throw` aqui
 * transformaria "a confirmação não chegou" em "o formulário não
 * funciona", e os dois problemas não têm o mesmo tamanho.
 *
 * Quem quiser saber se saiu, olha o retorno ou a tabela `email_enviado`.
 *
 * ============================================================
 * COM PRAZO, PELO MESMO MOTIVO DO BANCO
 * ============================================================
 * Oito segundos. Um Server Action que espera um provedor pendurado faz
 * a pessoa olhar "Enviando..." até a Vercel cortar a função aos 25
 * segundos, e aí a resposta não chega nem para dizer que deu certo.
 * Ver `src/lib/supabase/rede.ts`: a lição é a mesma, de outubro.
 */

const ENDERECO = 'https://api.resend.com/emails';
const PRAZO_MS = 8_000;

/** Endereço verificado no Resend. Remetente de fora do domínio verificado volta 403. */
export const remetente =
  process.env.EMAIL_REMETENTE ?? 'Psy Comunic <contato@psycomunic.com.br>';

/** Onde chegam os avisos internos. Caixa de gente, não de robô. */
export const caixaDaAgencia = process.env.EMAIL_AGENCIA ?? 'psycomunic@gmail.com';

/** Para onde vai a resposta de quem recebe. */
export const responderPara = process.env.EMAIL_RESPOSTA ?? 'psycomunic@gmail.com';

export const emailConfigurado = Boolean(process.env.RESEND_API_KEY);

export type Envio = {
  /** Modelo usado. Entra no registro e é metade da chave de idempotência. */
  tipo: string;
  para: string | string[];
  assunto: string;
  html: string;
  texto: string;
  /**
   * Identidade deste envio dentro do tipo. Com ela, o mesmo e-mail não
   * sai duas vezes nem que a ação seja repetida. Sem ela, repetir manda
   * de novo, que é o certo para aviso interno.
   */
  chave?: string;
};

export type ResultadoEnvio =
  | { ok: true; id: string | null; repetido?: boolean }
  | { ok: false; erro: string };

/** O e-mail tem cara de e-mail? Barra erro de digitação, não valida existência. */
export function pareceEmail(valor: string) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(valor.trim());
}

/**
 * Reserva a chave antes de mandar.
 *
 * A ordem importa. Gravar DEPOIS do envio deixa a janela em que duas
 * execuções simultâneas passam as duas pela conferência e mandam as
 * duas. Gravar ANTES faz o índice único recusar a segunda, e aí o
 * segundo envio simplesmente não acontece.
 *
 * O preço é conhecido: se o provedor falhar, a linha fica marcada como
 * falha e a chave está gasta. É o lado certo para errar, porque o
 * conserto é olhar o registro e mandar de novo à mão, enquanto o outro
 * lado é a pessoa recebendo o mesmo e-mail duas vezes sem explicação.
 */
async function reservar(e: Envio): Promise<{ segue: boolean; id?: number }> {
  if (!bancoConfigurado || !e.chave) return { segue: true };

  try {
    const s = clienteServico();
    const { data, error } = await s
      .from('email_enviado')
      .insert({
        tipo: e.tipo,
        chave: e.chave,
        destino: Array.isArray(e.para) ? e.para.join(', ') : e.para,
        assunto: e.assunto,
        status: 'enviando',
      })
      .select('id')
      .single();

    /* 23505 é violação de unicidade: este e-mail já saiu. */
    if (error?.code === '23505') return { segue: false };

    /* Qualquer outra falha (tabela ainda não migrada, banco fora) não
       cancela o envio. O registro é para depois; a mensagem é para
       agora. */
    if (error) return { segue: true };

    return { segue: true, id: Number(data.id) };
  } catch {
    return { segue: true };
  }
}

/** Fecha a linha reservada, ou grava uma nova quando não houve reserva. */
async function anotar(
  e: Envio,
  id: number | undefined,
  resultado: { status: 'enviado' | 'falhou'; provedor_id?: string | null; erro?: string },
) {
  if (!bancoConfigurado) return;

  try {
    const s = clienteServico();
    if (id) {
      await s.from('email_enviado').update(resultado).eq('id', id);
      return;
    }
    await s.from('email_enviado').insert({
      tipo: e.tipo,
      chave: e.chave ?? null,
      destino: Array.isArray(e.para) ? e.para.join(', ') : e.para,
      assunto: e.assunto,
      ...resultado,
    });
  } catch {
    /* Registro é trilha, não é a entrega. Perder a linha é ruim; deixar
       a falha dela derrubar a ação que pediu o e-mail é pior. */
  }
}

export async function enviarEmail(e: Envio): Promise<ResultadoEnvio> {
  const chave = process.env.RESEND_API_KEY;
  if (!chave) {
    return { ok: false, erro: 'Falta RESEND_API_KEY no servidor.' };
  }

  const destinos = (Array.isArray(e.para) ? e.para : [e.para])
    .map((x) => x.trim())
    .filter((x) => pareceEmail(x));

  if (destinos.length === 0) return { ok: false, erro: 'Sem destinatário válido.' };

  const reserva = await reservar({ ...e, para: destinos });
  if (!reserva.segue) return { ok: true, id: null, repetido: true };

  try {
    const r = await fetch(ENDERECO, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${chave}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from: remetente,
        to: destinos,
        subject: e.assunto,
        html: e.html,
        text: e.texto,
        reply_to: responderPara,
      }),
      cache: 'no-store',
      signal:
        typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function'
          ? AbortSignal.timeout(PRAZO_MS)
          : undefined,
    });

    const corpo = (await r.json().catch(() => null)) as
      | { id?: string; message?: string; name?: string }
      | null;

    if (!r.ok) {
      /* A mensagem do Resend é específica e salva tempo: "The
         psycomunic.com.br domain is not verified" é meia hora de
         diagnóstico que não precisa acontecer. */
      const erro = corpo?.message ?? `Resend respondeu ${r.status}`;
      console.error('[email]', e.tipo, erro);
      await anotar(e, reserva.id, { status: 'falhou', erro });
      return { ok: false, erro };
    }

    await anotar(e, reserva.id, { status: 'enviado', provedor_id: corpo?.id ?? null });
    return { ok: true, id: corpo?.id ?? null };
  } catch (err) {
    const erro =
      (err as Error).name === 'TimeoutError'
        ? 'O Resend não respondeu em 8 segundos.'
        : (err as Error).message;
    console.error('[email]', e.tipo, erro);
    await anotar(e, reserva.id, { status: 'falhou', erro });
    return { ok: false, erro };
  }
}

/**
 * Vários de uma vez, sem um derrubar o outro.
 *
 * Usado quando a confirmação para a pessoa e o aviso para a agência
 * saem juntos: os dois vão em paralelo, e `allSettled` garante que a
 * ação segue com o resultado dos dois mesmo se um falhar.
 */
export async function enviarTodos(envios: Envio[]): Promise<ResultadoEnvio[]> {
  const r = await Promise.allSettled(envios.map((e) => enviarEmail(e)));
  return r.map((x) =>
    x.status === 'fulfilled' ? x.value : { ok: false as const, erro: 'Falha ao enviar.' },
  );
}
