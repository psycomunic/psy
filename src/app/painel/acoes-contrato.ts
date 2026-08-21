'use server';

import { revalidatePath } from 'next/cache';
import { sessaoAtual, clienteServidor } from '@/lib/supabase/servidor';
import {
  esquemaContrato,
  esquemaReajuste,
  esquemaEncerrar,
  validar,
} from '@/lib/validacao/painel';
import { somarDias } from '@/lib/datas';
import type { Resultado } from './acoes';

/**
 * Contratos.
 *
 * Escreve com `clienteServidor()`, e não com a service role: a política
 * `contrato_financeiro` já concede escrita a administrador e financeiro,
 * e contornar a proteção onde ela funciona seria trocar segurança por
 * nada. A checagem aqui existe para dar mensagem clara; quem impede é o
 * Postgres.
 */

async function exigirFinanceiro() {
  const sessao = await sessaoAtual();
  if (!sessao) throw new Error('Sessão expirada. Entre de novo.');
  if (sessao.papel !== 'administrador' && sessao.papel !== 'financeiro') {
    throw new Error('Só administrador e financeiro mexem em contrato.');
  }
  return sessao;
}

const atualizar = () => {
  revalidatePath('/painel/financeiro');
  revalidatePath('/painel/contas');
  revalidatePath('/painel/visao');
};

export async function criarContrato(
  _anterior: Resultado | null,
  fd: FormData,
): Promise<Resultado> {
  try {
    await exigirFinanceiro();

    const v = validar(esquemaContrato, fd);
    if (!v.ok) return v;

    if (v.dados.fim && v.dados.fim < v.dados.inicio) {
      return { ok: false, mensagem: 'O fim não pode ser antes do início.' };
    }

    const supabase = await clienteServidor();

    /*
      Duas vigências abertas na mesma loja é o começo de uma cobrança
      dupla: a tela de faturar mostraria os dois contratos, e cada um
      geraria a fatura do mês.

      O banco não tem como impedir isso com uma constraint simples —
      seria um índice de exclusão sobre intervalo de datas. A checagem
      aqui cobre o caso real, que é alguém cadastrar de novo sem
      encerrar o anterior.
    */
    const { data: aberto } = await supabase
      .from('contrato')
      .select('id, plano')
      .eq('conta_id', v.dados.conta_id)
      .is('fim', null)
      .maybeSingle();

    if (aberto) {
      return {
        ok: false,
        mensagem: `Esta loja já tem o contrato "${aberto.plano}" sem data de fim. Encerre ou reajuste esse antes de abrir outro.`,
      };
    }

    const { error } = await supabase.from('contrato').insert(v.dados);
    if (error) return { ok: false, mensagem: error.message };

    atualizar();
    return { ok: true, mensagem: 'Contrato cadastrado. Já dá para faturar o mês.' };
  } catch (e) {
    return { ok: false, mensagem: (e as Error).message };
  }
}

/**
 * Reajuste: encerra o contrato atual e abre outro.
 *
 * ============================================================
 * POR QUE NÃO ALTERAR O FEE NO LUGAR
 * ============================================================
 * Porque a fatura aponta para o contrato que a originou. Trocar o fee
 * na linha existente reescreveria o passado: a fatura de março passaria
 * a apontar para um contrato que diz R$ 7.000, quando ela foi emitida
 * por R$ 5.000.
 *
 * Na primeira divergência de cobrança, a pergunta é exatamente essa —
 * "esse mês foi pelo contrato antigo ou pelo novo?" — e com o fee
 * sobrescrito ela não tem resposta.
 *
 * Encerrando um e abrindo outro, o histórico fica: cada fatura continua
 * ligada à vigência sob a qual foi emitida.
 */
export async function reajustarContrato(
  _anterior: Resultado | null,
  fd: FormData,
): Promise<Resultado> {
  try {
    await exigirFinanceiro();

    const v = validar(esquemaReajuste, fd);
    if (!v.ok) return v;
    const { id, fee_mensal, a_partir_de, motivo } = v.dados;

    const supabase = await clienteServidor();

    const { data: atual } = await supabase
      .from('contrato')
      .select('id, conta_id, plano, fee_mensal, inicio, reajuste, observacoes, fim')
      .eq('id', id)
      .maybeSingle();

    if (!atual) return { ok: false, mensagem: 'Contrato não encontrado.' };
    if (atual.fim) return { ok: false, mensagem: 'Este contrato já foi encerrado.' };

    /* O reajuste começa depois do contrato que ele substitui. Antes
       disso, o "encerra na véspera" daria a um contrato uma data de fim
       anterior ao próprio início. */
    if (a_partir_de <= (atual.inicio as string)) {
      return {
        ok: false,
        mensagem: `O reajuste tem de começar depois de ${atual.inicio}, que é o início do contrato atual.`,
      };
    }

    /* O antigo termina na véspera do novo começar. Um dia de sobreposição
       faria a loja aparecer duas vezes na tela de faturar. */
    const { error: eFim } = await supabase
      .from('contrato')
      .update({ fim: somarDias(a_partir_de, -1) })
      .eq('id', id);

    if (eFim) return { ok: false, mensagem: eFim.message };

    const { error: eNovo } = await supabase.from('contrato').insert({
      conta_id: atual.conta_id,
      plano: atual.plano,
      fee_mensal,
      inicio: a_partir_de,
      reajuste: atual.reajuste,
      observacoes: motivo
        ? `Reajuste de ${atual.fee_mensal} para ${fee_mensal}. ${motivo}`
        : `Reajuste de ${atual.fee_mensal} para ${fee_mensal}.`,
    });

    if (eNovo) {
      /* Desfaz o encerramento: com o novo contrato não criado, a loja
         ficaria sem vigência aberta e sumiria da tela de faturar. */
      await supabase.from('contrato').update({ fim: null }).eq('id', id);
      return { ok: false, mensagem: eNovo.message };
    }

    atualizar();
    return {
      ok: true,
      mensagem: `Reajustado a partir de ${a_partir_de}. O contrato anterior fica no histórico, com as faturas dele.`,
    };
  } catch (e) {
    return { ok: false, mensagem: (e as Error).message };
  }
}

/**
 * Encerra o contrato.
 *
 * Não apaga: `contrato` é protegido por `on delete restrict` vindo de
 * `fatura`, e isso está certo. Contrato encerrado continua respondendo
 * por que uma fatura de dois anos atrás tinha aquele valor.
 */
export async function encerrarContrato(
  _anterior: Resultado | null,
  fd: FormData,
): Promise<Resultado> {
  try {
    await exigirFinanceiro();

    const v = validar(esquemaEncerrar, fd);
    if (!v.ok) return v;
    const { id, fim, motivo } = v.dados;

    const supabase = await clienteServidor();

    const { data: atual } = await supabase
      .from('contrato')
      .select('inicio')
      .eq('id', id)
      .maybeSingle();

    if (!atual) return { ok: false, mensagem: 'Contrato não encontrado.' };

    /* Contrato agendado tem "último dia" oferecido na tela, e a data de
       hoje é a resposta natural — só que ela é anterior ao início. A
       constraint do banco também barra; aqui é para a mensagem dizer o
       que fazer. */
    if (fim < (atual.inicio as string)) {
      return {
        ok: false,
        mensagem: `Este contrato só começa em ${atual.inicio}. Para cancelar um contrato que ainda não entrou em vigor, encerre-o na própria data de início.`,
      };
    }

    const { error } = await supabase
      .from('contrato')
      .update({
        fim,
        ...(motivo ? { observacoes: `Encerrado: ${motivo}` } : {}),
      })
      .eq('id', id);

    if (error) return { ok: false, mensagem: error.message };

    atualizar();
    return {
      ok: true,
      mensagem: `Contrato encerrado em ${fim}. As faturas já emitidas continuam no histórico.`,
    };
  } catch (e) {
    return { ok: false, mensagem: (e as Error).message };
  }
}
