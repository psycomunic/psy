'use server';

import { randomBytes } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { sessaoAtual, clienteServidor } from '@/lib/supabase/servidor';
import { pode } from '@/lib/papeis';
import { PLANOS, type Plano } from '@/dados/planos';
import { SERVICOS, fichaDoServico, type ServicoEscolhido } from '@/dados/servicos';
import { paraNumero } from '@/lib/numero';
import type { Resultado } from './acoes';

/**
 * Gerador de link de proposta.
 *
 * Escreve com `clienteServidor()`, e não com a service role: o RLS já
 * permite ao comercial criar proposta (`proposta_comercial_cria`), e
 * contornar a proteção onde ela funciona seria trocar segurança por
 * nada. Se a checagem de papel abaixo falhasse, o Postgres ainda
 * recusaria a linha.
 *
 * ============================================================
 * O QUE PROTEGE A PROPOSTA
 * ============================================================
 * O link, e só ele. Isso é obscuridade, não autenticação — quem tiver o
 * endereço entra, e link vaza em encaminhamento de e-mail e print de
 * WhatsApp.
 *
 * Duas consequências, e as duas estão no código:
 *
 * O slug carrega 16 bytes de aleatoriedade real (`randomBytes`, não
 * `Math.random`). Adivinhar por tentativa está fora de questão.
 *
 * A proposta nasce como RASCUNHO. `proposta_por_link()` só devolve
 * status enviada, em análise ou aceita, então gerar o link não publica
 * nada: publicar é um segundo ato, deliberado.
 */

const VALIDADE_PADRAO = 15;

async function exigirComercial() {
  const sessao = await sessaoAtual();
  if (!sessao) throw new Error('Sessão expirada. Entre de novo.');
  if (!pode(sessao.papel, 'propostas', 'editar')) {
    throw new Error('Seu perfil não gera proposta.');
  }
  return sessao;
}

/** Prefixo legível + aleatório. O nome ajuda a achar o link certo entre
    vinte na tela; o aleatório é o que impede adivinhar. */
function gerarSlug(cliente: string) {
  const base = cliente
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 28);

  return `${base || 'proposta'}-${randomBytes(16).toString('base64url')}`;
}

/** Uma linha por texto, sem linha vazia. É como se digita numa textarea. */
const linhas = (v: FormDataEntryValue | null) =>
  String(v ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

export async function gerarProposta(
  _anterior: Resultado | null,
  fd: FormData,
): Promise<Resultado> {
  try {
    const sessao = await exigirComercial();

    const cliente = String(fd.get('cliente') ?? '').trim();
    const contato = String(fd.get('contato') ?? '').trim();
    const modo = String(fd.get('modo') ?? 'plano');
    const plano = String(fd.get('plano') ?? '') as Plano;
    const resumo = String(fd.get('resumo') ?? '').trim();
    const validade = Number(String(fd.get('validade_dias') ?? VALIDADE_PADRAO));
    const leadId = String(fd.get('lead_id') ?? '') || null;

    if (cliente.length < 2) return { ok: false, mensagem: 'Diga o nome do cliente.' };
    if (contato.length < 2) return { ok: false, mensagem: 'Diga com quem você está falando.' };
    if (!Number.isFinite(validade) || validade < 1 || validade > 90) {
      return { ok: false, mensagem: 'A validade precisa ficar entre 1 e 90 dias.' };
    }

    /*
      Uma proposta é OU um pacote OU uma lista de serviços.

      Nunca as duas: seriam dois preços para a mesma coisa, e o cliente
      perguntaria qual vale. A pergunta é justa, e a resposta seria
      constrangedora.
    */
    const servicos: ServicoEscolhido[] = [];

    if (modo === 'servicos') {
      for (const s of SERVICOS) {
        if (fd.get(`servico_${s}`) !== 'on') continue;
        const fee = paraNumero(String(fd.get(`fee_${s}`) ?? ''));
        if (!Number.isFinite(fee) || fee <= 0) {
          return {
            ok: false,
            mensagem: `Informe o valor mensal de ${fichaDoServico(s).nome}.`,
          };
        }
        servicos.push({ id: s, fee });
      }

      if (servicos.length === 0) {
        return { ok: false, mensagem: 'Escolha pelo menos um serviço.' };
      }
    } else if (!PLANOS.includes(plano)) {
      return { ok: false, mensagem: 'Escolha o plano recomendado.' };
    }

    const supabase = await clienteServidor();

    const { data, error } = await supabase
      .from('proposta')
      .insert({
        slug: gerarSlug(cliente),
        lead_id: leadId,
        cliente,
        contato,
        status: 'rascunho',
        resumo:
          resumo ||
          (servicos.length > 0
            ? `Proposta de ${servicos
                .map((x) => fichaDoServico(x.id).nome.toLowerCase())
                .join(' e ')} para ${cliente}.`
            : `Proposta de operação de crescimento para ${cliente}, cobrindo as quatro frentes: gestão, tecnologia, marketing e atendimento com logística.`),
        corpo: {
          /* O plano recomendado é o único campo que a tabela de planos
             precisa. O escopo de cada plano NÃO é copiado para dentro
             da proposta: ele vive em `src/dados/planos.ts`, e duplicar
             faria a proposta de ontem contradizer a de hoje na primeira
             vez que um item mudar. Vale igual para os serviços: aqui
             fica só o id e o valor negociado. */
          plano: servicos.length > 0 ? null : plano,
          servicos,
          diagnostico: linhas(fd.get('diagnostico')),
          proximosPassos: linhas(fd.get('proximos_passos')),
        },
        validade_dias: validade,
        criada_por: sessao.id,
      })
      .select('slug')
      .single();

    if (error) return { ok: false, mensagem: error.message };

    revalidatePath('/painel/propostas');

    return {
      ok: true,
      mensagem: `Rascunho criado: /proposta/${data.slug} — publique para o link começar a abrir.`,
    };
  } catch (e) {
    return { ok: false, mensagem: (e as Error).message };
  }
}

/**
 * Publica ou recolhe.
 *
 * Recolher volta para rascunho, e a partir daí o link responde 404 —
 * é o jeito de tirar do ar uma proposta mandada por engano, sem
 * precisar apagar o histórico dela.
 */
export async function mudarStatusProposta(
  _anterior: Resultado | null,
  fd: FormData,
): Promise<Resultado> {
  try {
    await exigirComercial();

    const id = String(fd.get('id') ?? '');
    const status = String(fd.get('status') ?? '');

    if (!id) return { ok: false, mensagem: 'Proposta não informada.' };
    if (!['rascunho', 'enviada', 'em_analise', 'aceita', 'recusada'].includes(status)) {
      return { ok: false, mensagem: 'Status inválido.' };
    }

    const supabase = await clienteServidor();
    const { error } = await supabase
      .from('proposta')
      .update({
        status,
        /* Marcar a data do aceite aqui, e não deixar para depois: é a
           informação que o financeiro pede primeiro quando o contrato
           entra. */
        ...(status === 'aceita' ? { aceita_em: new Date().toISOString() } : {}),
      })
      .eq('id', id);

    if (error) return { ok: false, mensagem: error.message };

    revalidatePath('/painel/propostas');

    return {
      ok: true,
      mensagem:
        status === 'rascunho'
          ? 'Proposta recolhida. O link parou de abrir.'
          : status === 'enviada'
            ? 'Publicada. O link já abre para quem receber.'
            : 'Status atualizado.',
    };
  } catch (e) {
    return { ok: false, mensagem: (e as Error).message };
  }
}
