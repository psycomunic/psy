'use server';

import { revalidatePath } from 'next/cache';
import { sessaoAtual, clienteServidor } from '@/lib/supabase/servidor';
import {
  esquemaProjeto,
  esquemaSituacaoProjeto,
  esquemaExcluirProjeto,
  validar,
} from '@/lib/validacao/painel';
import type { Resultado } from './acoes';

/**
 * Ações dos projetos.
 *
 * ============================================================
 * SEM CHAVE DE SERVIÇO
 * ============================================================
 * Como em `acoes-crm.ts` e `acoes-prospeccao.ts`: escreve com a sessão
 * do usuário, e o RLS decide. As políticas de `projeto` já permitem ao
 * interno escrever, e contornar a proteção onde ela funciona seria
 * trocar segurança por nada.
 *
 * `exigirInterno()` existe para dar mensagem clara, e não para
 * proteger. Se falhasse, o Postgres ainda recusaria a escrita.
 */
async function exigirInterno() {
  const sessao = await sessaoAtual();
  if (!sessao) throw new Error('Sessão expirada. Entre de novo.');
  if (!['administrador', 'gestor', 'operador', 'comercial'].includes(sessao.papel)) {
    throw new Error('Seu perfil não mexe em projetos.');
  }
  return sessao;
}

/** Depois de escrever, as duas telas que mostram projeto precisam reler. */
function revalidar() {
  revalidatePath('/painel/projetos');
  revalidatePath('/painel/visao');
}

export async function criarProjeto(
  _anterior: Resultado | null,
  fd: FormData,
): Promise<Resultado> {
  try {
    await exigirInterno();

    const v = validar(esquemaProjeto, fd);
    if (!v.ok) return v;

    const supabase = await clienteServidor();
    const { error } = await supabase.from('projeto').insert(v.dados);
    if (error) return { ok: false, mensagem: error.message };

    revalidar();
    return { ok: true, mensagem: 'Projeto criado.' };
  } catch (e) {
    return { ok: false, mensagem: (e as Error).message };
  }
}

/**
 * Mover de situação.
 *
 * É o gesto mais repetido da tela, e por isso tem ação própria em vez
 * de passar pelo formulário inteiro: mandar as doze colunas de volta
 * para mudar uma delas é como um campo editado noutra aba se perde.
 *
 * `situacao_desde` e `entregue_em` NÃO são escritos aqui. Quem mantém
 * os dois é o gatilho `projeto_situacao_desde`, no banco. Se a tela
 * escrevesse, uma alteração por SQL pararia o relógio e o aviso de
 * "parado há X dias" mentiria justamente no projeto esquecido.
 */
export async function moverProjeto(
  _anterior: Resultado | null,
  fd: FormData,
): Promise<Resultado> {
  try {
    await exigirInterno();

    const v = validar(esquemaSituacaoProjeto, fd);
    if (!v.ok) return v;

    const supabase = await clienteServidor();
    const { error } = await supabase
      .from('projeto')
      .update({ situacao: v.dados.situacao })
      .eq('id', v.dados.id);

    if (error) return { ok: false, mensagem: error.message };

    revalidar();
    return { ok: true, mensagem: 'Situação atualizada.' };
  } catch (e) {
    return { ok: false, mensagem: (e as Error).message };
  }
}

export async function atualizarProjeto(
  _anterior: Resultado | null,
  fd: FormData,
): Promise<Resultado> {
  try {
    await exigirInterno();

    const id = String(fd.get('id') ?? '');
    const v = validar(esquemaProjeto, fd);
    if (!v.ok) return v;
    if (!id) return { ok: false, mensagem: 'Projeto inválido.' };

    const supabase = await clienteServidor();
    const { error } = await supabase.from('projeto').update(v.dados).eq('id', id);
    if (error) return { ok: false, mensagem: error.message };

    revalidar();
    return { ok: true, mensagem: 'Projeto atualizado.' };
  } catch (e) {
    return { ok: false, mensagem: (e as Error).message };
  }
}

/**
 * Apaga o projeto.
 *
 * Só o administrador, em três camadas: a tela não mostra o botão, esta
 * ação recusa, e `projeto_admin_exclui` recusaria de novo. A terceira é
 * a que protege.
 *
 * O gatilho `projeto_auditoria_delete` guarda a linha inteira antes de
 * ela sumir, que é o que permite responder "quem apagou, e o que tinha
 * ali" depois de um engano.
 */
export async function excluirProjeto(
  _anterior: Resultado | null,
  fd: FormData,
): Promise<Resultado> {
  try {
    const sessao = await sessaoAtual();
    if (!sessao) return { ok: false, mensagem: 'Sessão expirada. Entre de novo.' };
    if (sessao.papel !== 'administrador') {
      return { ok: false, mensagem: 'Só o administrador apaga projeto. Isso é irreversível.' };
    }

    const v = validar(esquemaExcluirProjeto, fd);
    if (!v.ok) return v;

    const supabase = await clienteServidor();
    const { error } = await supabase.from('projeto').delete().eq('id', v.dados.id);
    if (error) return { ok: false, mensagem: error.message };

    revalidar();
    return { ok: true, mensagem: 'Apagado.' };
  } catch (e) {
    return { ok: false, mensagem: (e as Error).message };
  }
}
