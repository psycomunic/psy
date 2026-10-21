'use server';

import { revalidatePath } from 'next/cache';
import { sessaoAtual } from '@/lib/supabase/servidor';
import { sincronizarTudo, desconectarAgenda } from '@/lib/google/agenda';
import type { Resultado } from './acoes';

/**
 * Ações da agenda do Google.
 *
 * A credencial é da AGÊNCIA e vive numa tabela sem política de RLS
 * nenhuma, de propósito, para que token não trafegue até navegador.
 * Como o banco não vai segurar nada aqui, `exigirAdmin` é a proteção
 * de verdade, e é a primeira linha das duas.
 */
async function exigirAdmin() {
  const sessao = await sessaoAtual();
  if (!sessao) throw new Error('Sessão expirada. Entre de novo.');
  if (sessao.papel !== 'administrador') {
    throw new Error('Só o administrador mexe na agenda da agência.');
  }
  return sessao;
}

export async function sincronizarAgenda(): Promise<Resultado> {
  try {
    await exigirAdmin();
    const { levadas, total } = await sincronizarTudo();

    revalidatePath('/painel/configuracoes');
    revalidatePath('/painel/tarefas');

    if (total === 0) {
      return { ok: true, mensagem: 'Nenhuma tarefa em aberto com prazo para levar.' };
    }
    return {
      ok: true,
      mensagem: `${levadas} de ${total} ${total === 1 ? 'tarefa levada' : 'tarefas levadas'} para a agenda.`,
    };
  } catch (e) {
    return { ok: false, mensagem: (e as Error).message };
  }
}

export async function desligarAgenda(): Promise<Resultado> {
  try {
    await exigirAdmin();
    await desconectarAgenda();

    revalidatePath('/painel/configuracoes');
    return {
      ok: true,
      /* O que fica para trás é dito com todas as letras: os eventos
         continuam na agenda, e quem desligou pode achar que apagou
         tudo. Apagar sozinho seria pior: um clique sumindo com
         compromissos é o tipo de surpresa que ninguém perdoa. */
      mensagem: 'Agenda desconectada e token apagado. Os eventos já criados continuam lá.',
    };
  } catch (e) {
    return { ok: false, mensagem: (e as Error).message };
  }
}
