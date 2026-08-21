'use server';

import { revalidatePath } from 'next/cache';
import { sessaoAtual, clienteServidor } from '@/lib/supabase/servidor';
import {
  esquemaNovaTarefa,
  esquemaEditarTarefa,
  esquemaIdTarefa,
  esquemaStatusTarefa,
  validar,
} from '@/lib/validacao/painel';
import type { Resultado } from './acoes';

/**
 * Tarefas.
 *
 * Escreve com `clienteServidor()`: as políticas `tarefa_interno_*` já
 * dão escrita a quem é interno, e passar por cima delas com a service
 * role seria trocar proteção por nada. A checagem aqui existe para a
 * mensagem ser clara; quem impede é o Postgres.
 */

async function exigirInterno() {
  const sessao = await sessaoAtual();
  if (!sessao) throw new Error('Sessão expirada. Entre de novo.');
  if (sessao.papel === 'cliente' || sessao.papel === 'cliente_leitura') {
    throw new Error('Cliente não mexe em tarefa da operação.');
  }
  return sessao;
}

const atualizar = () => {
  revalidatePath('/painel/tarefas');
  revalidatePath('/painel/visao');
  revalidatePath('/painel/contas');
};

export async function criarTarefa(
  _anterior: Resultado | null,
  fd: FormData,
): Promise<Resultado> {
  try {
    const sessao = await exigirInterno();

    const v = validar(esquemaNovaTarefa, fd);
    if (!v.ok) return v;

    /* Recorrência sem prazo não tem de onde calcular a próxima. O banco
       também barra, com uma constraint; aqui é para a mensagem dizer o
       que fazer em vez de vazar o nome da constraint. */
    if (v.dados.recorrencia !== 'nenhuma' && !v.dados.prazo) {
      return {
        ok: false,
        mensagem: 'Tarefa que se repete precisa de prazo: é dele que sai a data da próxima.',
      };
    }

    const supabase = await clienteServidor();
    const { error } = await supabase.from('tarefa').insert({
      titulo: v.dados.titulo,
      detalhe: v.dados.detalhe,
      conta_id: v.dados.conta_id,
      responsavel_id: v.dados.responsavel_id,
      prazo: v.dados.prazo,
      prioridade: v.dados.prioridade,
      recorrencia: v.dados.recorrencia,
      recorrencia_ate: v.dados.recorrencia_ate,
      lembrar_dias: v.dados.lembrar_dias,
      criada_por: sessao.id,
    });

    if (error) return { ok: false, mensagem: error.message };

    atualizar();
    return { ok: true, mensagem: 'Tarefa criada.' };
  } catch (e) {
    return { ok: false, mensagem: (e as Error).message };
  }
}

export async function editarTarefa(
  _anterior: Resultado | null,
  fd: FormData,
): Promise<Resultado> {
  try {
    await exigirInterno();

    const v = validar(esquemaEditarTarefa, fd);
    if (!v.ok) return v;

    if (v.dados.recorrencia !== 'nenhuma' && !v.dados.prazo) {
      return {
        ok: false,
        mensagem: 'Tarefa que se repete precisa de prazo: é dele que sai a data da próxima.',
      };
    }

    const { id, ...campos } = v.dados;
    const supabase = await clienteServidor();
    const { error } = await supabase
      .from('tarefa')
      .update({ ...campos, atualizada_em: new Date().toISOString() })
      .eq('id', id);

    if (error) return { ok: false, mensagem: error.message };

    atualizar();
    return { ok: true, mensagem: 'Tarefa atualizada.' };
  } catch (e) {
    return { ok: false, mensagem: (e as Error).message };
  }
}

/**
 * Conclui, e abre a próxima quando a tarefa se repete.
 *
 * Quem decide isso é a função do Postgres, e não este arquivo: as duas
 * escritas — fechar esta e abrir a seguinte — precisam acontecer na
 * mesma transação. Feito aqui, uma falha entre elas deixaria a
 * recorrência morta sem ninguém perceber.
 */
export async function concluirTarefa(
  _anterior: Resultado | null,
  fd: FormData,
): Promise<Resultado> {
  try {
    await exigirInterno();

    const v = validar(esquemaIdTarefa, fd);
    if (!v.ok) return v;

    const supabase = await clienteServidor();
    const { data, error } = await supabase.rpc('concluir_tarefa', { p_id: v.dados.id });

    if (error) return { ok: false, mensagem: error.message };

    atualizar();
    return {
      ok: true,
      mensagem: data ? 'Concluída. A próxima já está na lista.' : 'Concluída.',
    };
  } catch (e) {
    return { ok: false, mensagem: (e as Error).message };
  }
}

/** Volta uma tarefa para aberta, ou marca como fazendo/cancelada. */
export async function mudarStatusTarefa(
  _anterior: Resultado | null,
  fd: FormData,
): Promise<Resultado> {
  try {
    await exigirInterno();

    const v = validar(esquemaStatusTarefa, fd);
    if (!v.ok) return v;

    const supabase = await clienteServidor();
    const { error } = await supabase
      .from('tarefa')
      .update({
        status: v.dados.status,
        /* Reabrir limpa a conclusão. Sem isto, a tarefa voltaria a
           aberta carregando a data em que foi dada por feita, e o
           histórico passaria a mentir. */
        concluida_em: v.dados.status === 'concluida' ? new Date().toISOString() : null,
        atualizada_em: new Date().toISOString(),
      })
      .eq('id', v.dados.id);

    if (error) return { ok: false, mensagem: error.message };

    atualizar();
    return { ok: true, mensagem: 'Tarefa atualizada.' };
  } catch (e) {
    return { ok: false, mensagem: (e as Error).message };
  }
}

/**
 * Apaga a tarefa.
 *
 * Só administrador, pela política `tarefa_admin_exclui`. Tarefa
 * concluída é registro do que foi feito, e apagar por engano some com a
 * resposta de "isso chegou a ser tratado?".
 */
export async function apagarTarefa(
  _anterior: Resultado | null,
  fd: FormData,
): Promise<Resultado> {
  try {
    const sessao = await exigirInterno();
    if (sessao.papel !== 'administrador') {
      return { ok: false, mensagem: 'Só o administrador exclui tarefa.' };
    }

    const v = validar(esquemaIdTarefa, fd);
    if (!v.ok) return v;

    const supabase = await clienteServidor();
    const { error } = await supabase.from('tarefa').delete().eq('id', v.dados.id);
    if (error) return { ok: false, mensagem: error.message };

    atualizar();
    return { ok: true, mensagem: 'Tarefa removida.' };
  } catch (e) {
    return { ok: false, mensagem: (e as Error).message };
  }
}

/* ------------------------------------------------------------------ */
/* Notificações                                                        */
/* ------------------------------------------------------------------ */

/**
 * Marca os avisos como lidos.
 *
 * A política só deixa mexer nas linhas do próprio perfil, então não há
 * `.eq('perfil_id', ...)` aqui para alguém esquecer: o filtro é do
 * banco.
 */
export async function marcarLidas(
  _anterior: Resultado | null,
): Promise<Resultado> {
  try {
    await sessaoAtual();

    const supabase = await clienteServidor();
    const { error } = await supabase
      .from('notificacao')
      .update({ lida_em: new Date().toISOString() })
      .is('lida_em', null);

    if (error) return { ok: false, mensagem: error.message };

    revalidatePath('/painel', 'layout');
    return { ok: true, mensagem: 'Avisos marcados como lidos.' };
  } catch (e) {
    return { ok: false, mensagem: (e as Error).message };
  }
}
