'use server';

import { clienteServico } from '@/lib/supabase/servico';
import { bancoConfigurado } from '@/lib/supabase/ambiente';
import { FAIXAS_DE_VERBA, CANAIS_HOJE } from '@/conteudo/trafego';

/**
 * O formulário da página de tráfego vira lead no CRM.
 *
 * ============================================================
 * POR QUE A CHAVE PÚBLICA NÃO ESCREVE EM `lead`
 * ============================================================
 * O caminho fácil seria dar `insert` para `anon` e deixar o formulário
 * gravar direto. A chave pública vai no navegador, por definição:
 * qualquer pessoa despejaria linhas na tabela em qualquer volume.
 *
 * CRM entupido de lixo não é só incômodo. É a lista onde alguém procura
 * o cliente que ligou ontem, e ela deixa de servir.
 *
 * Então a tabela continua fechada, e quem grava é `registrar_lead_do_site`,
 * chamada aqui com a service role depois de validar. A superfície
 * pública é esta action, que a gente controla.
 *
 * ============================================================
 * O QUE SEGURA ROBÔ
 * ============================================================
 * Três coisas baratas, porque não há serviço de captcha neste projeto e
 * inventar um seria trocar spam por dependência:
 *
 *   - campo isca, invisível para gente e irresistível para robô;
 *   - tempo mínimo entre abrir e enviar, porque robô preenche em 200ms;
 *   - e, no banco, o mesmo telefone em dez minutos devolve o lead que
 *     já existe em vez de criar outro.
 *
 * Nenhuma delas para um ataque dedicado. As três juntas param o que
 * realmente aparece, que é robô de formulário genérico.
 */

export type ResultadoLead = { ok: boolean; mensagem: string };

/** Só dígitos, e com DDD. Telefone é o campo que a agência vai usar. */
function telefoneValido(bruto: string) {
  const n = bruto.replace(/\D/g, '');
  return n.length >= 10 && n.length <= 13;
}

export async function pedirAnalise(
  _anterior: ResultadoLead | null,
  fd: FormData,
): Promise<ResultadoLead> {
  try {
    /* A isca. Campo escondido no CSS, sem rótulo e fora da ordem de
       tabulação: pessoa nenhuma preenche. Robô preenche tudo.

       Responde SUCESSO de propósito. Dizer "recusado" ensina o robô a
       tentar de novo sem o campo. */
    if (String(fd.get('site_url') ?? '').trim() !== '') {
      return { ok: true, mensagem: 'Recebido. A equipe responde em até 48 horas.' };
    }

    const abertoEm = Number(String(fd.get('aberto_em') ?? '0'));
    if (Number.isFinite(abertoEm) && abertoEm > 0 && Date.now() - abertoEm < 2500) {
      return {
        ok: false,
        mensagem: 'Confere os dados e envia de novo, por favor.',
      };
    }

    const nome = String(fd.get('nome') ?? '').trim();
    const empresa = String(fd.get('empresa') ?? '').trim();
    const telefone = String(fd.get('telefone') ?? '').trim();
    const email = String(fd.get('email') ?? '').trim();
    const faixa = String(fd.get('verba') ?? '').trim();
    const canal = String(fd.get('canal') ?? '').trim();
    const contexto = String(fd.get('contexto') ?? '').trim();

    if (nome.length < 2) return { ok: false, mensagem: 'Diga o seu nome.' };
    if (empresa.length < 2) return { ok: false, mensagem: 'Diga o nome da empresa.' };
    if (!telefoneValido(telefone)) {
      return { ok: false, mensagem: 'Informe um WhatsApp com DDD.' };
    }
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return { ok: false, mensagem: 'Esse e-mail não parece certo.' };
    }

    /* Lista fechada. Um POST manual com faixa inventada não entra como
       verba, entra como nada. */
    const escolhida = FAIXAS_DE_VERBA.find((f) => f.valor === faixa);
    const canalEscolhido = CANAIS_HOJE.find((c) => c.valor === canal);

    if (!bancoConfigurado) {
      return {
        ok: false,
        mensagem: 'O formulário está temporariamente fora do ar. Chame no WhatsApp.',
      };
    }

    /*
      O que a pessoa contou vira observação do lead, e não campos soltos.

      Quem for atender lê isso antes de ligar, e a diferença entre
      "investe entre 5 e 15 mil, roda Google e Meta" e um formulário
      sem contexto é a primeira frase da conversa.
    */
    const observacao = [
      canalEscolhido ? `Anuncia hoje em: ${canalEscolhido.rotulo}.` : null,
      escolhida && escolhida.rotulo !== FAIXAS_DE_VERBA[0].rotulo
        ? `Verba declarada: ${escolhida.rotulo}.`
        : null,
      contexto ? `Contou: ${contexto}` : null,
      'Veio pela página de tráfego pago.',
    ]
      .filter(Boolean)
      .join(' ');

    const supabase = clienteServico();
    const { data, error } = await supabase.rpc('registrar_lead_do_site', {
      p_nome: nome,
      p_empresa: empresa,
      p_telefone: telefone,
      p_email: email || null,
      p_verba: escolhida?.piso ?? null,
      p_origem: 'site-trafego',
      p_contexto: observacao,
    });

    if (error) {
      /* A mensagem do banco não vai para a tela: ela cita nome de
         função e de coluna. Vai para o log do servidor, onde serve. */
      console.error('[lead do site]', error.message);
      return {
        ok: false,
        mensagem:
          'Não consegui registrar agora. Chame no WhatsApp que a gente resolve na hora.',
      };
    }

    return {
      ok: true,
      mensagem: data
        ? 'Recebido. A equipe abre a sua conta e responde em até 48 horas.'
        : 'Recebido. A equipe responde em até 48 horas.',
    };
  } catch (e) {
    console.error('[lead do site]', (e as Error).message);
    return {
      ok: false,
      mensagem: 'Não consegui registrar agora. Chame no WhatsApp que a gente resolve na hora.',
    };
  }
}
