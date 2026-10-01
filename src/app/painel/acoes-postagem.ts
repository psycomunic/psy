'use server';

import { revalidatePath } from 'next/cache';
import { sessaoAtual, clienteServidor } from '@/lib/supabase/servidor';
import {
  esquemaPostagem,
  esquemaSituacaoPostagem,
  esquemaExcluirPostagem,
  esquemaArquivo,
  esquemaRemoverArquivo,
  validar,
} from '@/lib/validacao/painel';
import type { Resultado } from './acoes';

const BUCKET = 'midia';

async function exigirInterno() {
  const sessao = await sessaoAtual();
  if (!sessao) throw new Error('Sessão expirada. Entre de novo.');
  if (!['administrador', 'gestor', 'operador', 'comercial'].includes(sessao.papel)) {
    throw new Error('Seu perfil não mexe no conteúdo.');
  }
  return sessao;
}

function revalidar() {
  revalidatePath('/painel/postagens');
}

export async function criarPostagem(
  _anterior: Resultado | null,
  fd: FormData,
): Promise<Resultado> {
  try {
    await exigirInterno();
    const v = validar(esquemaPostagem, fd);
    if (!v.ok) return v;

    const supabase = await clienteServidor();
    const { data, error } = await supabase.from('postagem').insert(v.dados).select('id').single();
    if (error) return { ok: false, mensagem: error.message };

    revalidar();
    /* O id volta na mensagem porque a tela precisa dele para anexar os
       arquivos logo em seguida, sem recarregar. */
    return { ok: true, mensagem: `Postagem criada.|${data.id}` };
  } catch (e) {
    return { ok: false, mensagem: (e as Error).message };
  }
}

export async function atualizarPostagem(
  _anterior: Resultado | null,
  fd: FormData,
): Promise<Resultado> {
  try {
    await exigirInterno();
    const id = String(fd.get('id') ?? '');
    const v = validar(esquemaPostagem, fd);
    if (!v.ok) return v;
    if (!id) return { ok: false, mensagem: 'Postagem inválida.' };

    const supabase = await clienteServidor();
    const { error } = await supabase.from('postagem').update(v.dados).eq('id', id);
    if (error) return { ok: false, mensagem: error.message };

    revalidar();
    return { ok: true, mensagem: `Postagem salva.|${id}` };
  } catch (e) {
    return { ok: false, mensagem: (e as Error).message };
  }
}

export async function moverPostagem(
  _anterior: Resultado | null,
  fd: FormData,
): Promise<Resultado> {
  try {
    await exigirInterno();
    const v = validar(esquemaSituacaoPostagem, fd);
    if (!v.ok) return v;

    const supabase = await clienteServidor();
    const { error } = await supabase
      .from('postagem')
      .update({ situacao: v.dados.situacao })
      .eq('id', v.dados.id);

    if (error) return { ok: false, mensagem: error.message };

    revalidar();
    return { ok: true, mensagem: 'Situação atualizada.' };
  } catch (e) {
    return { ok: false, mensagem: (e as Error).message };
  }
}

/**
 * Abre a porta para o navegador mandar o arquivo direto ao Storage.
 *
 * ============================================================
 * POR QUE O ARQUIVO NÃO PASSA POR AQUI
 * ============================================================
 * Server Action tem limite de corpo, e o padrão do Next é 1MB. Um Reels
 * de trinta segundos tem dezenas de megabytes: passaria do limite e
 * falharia, e levantar o limite só mudaria o lugar onde dói, porque o
 * arquivo inteiro teria de atravessar a função antes de chegar ao
 * destino.
 *
 * Então o servidor não carrega arquivo nenhum. Ele assina uma permissão
 * de envio para UM caminho, válida por pouco tempo, e o navegador fala
 * direto com o Storage. É mais rápido, não tem teto prático e não gasta
 * a função.
 *
 * ============================================================
 * O CAMINHO É DECIDIDO AQUI, E NÃO PELO NAVEGADOR
 * ============================================================
 * Se o nome viesse pronto do cliente, alguém poderia pedir permissão
 * para escrever por cima do arquivo de outra postagem. Aqui ele nasce
 * da postagem mais um identificador aleatório, e do nome original sobra
 * só a extensão.
 */
export async function pedirEnvioDeArquivo(
  postagemId: string,
  nomeOriginal: string,
): Promise<{ ok: true; caminho: string; token: string } | { ok: false; mensagem: string }> {
  try {
    await exigirInterno();
    if (!/^[0-9a-f-]{36}$/i.test(postagemId)) {
      return { ok: false, mensagem: 'Postagem inválida.' };
    }

    const extensao = (nomeOriginal.match(/\.([a-z0-9]{1,8})$/i)?.[1] ?? 'bin').toLowerCase();
    const caminho = `${postagemId}/${crypto.randomUUID()}.${extensao}`;

    const supabase = await clienteServidor();
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUploadUrl(caminho);

    if (error || !data) {
      return { ok: false, mensagem: error?.message ?? 'Não consegui abrir o envio.' };
    }

    return { ok: true, caminho: data.path, token: data.token };
  } catch (e) {
    return { ok: false, mensagem: (e as Error).message };
  }
}

/**
 * Registra o arquivo que o navegador acabou de mandar.
 *
 * Em duas etapas de propósito: o envio pode falhar no meio, e uma linha
 * no banco apontando para um arquivo que não chegou é pior do que um
 * arquivo no bucket sem linha. O segundo caso a tela nem mostra; o
 * primeiro vira uma miniatura quebrada para sempre.
 */
export async function registrarArquivo(
  _anterior: Resultado | null,
  fd: FormData,
): Promise<Resultado> {
  try {
    await exigirInterno();
    const v = validar(esquemaArquivo, fd);
    if (!v.ok) return v;

    const supabase = await clienteServidor();
    const { error } = await supabase.from('postagem_arquivo').insert({
      postagem_id: v.dados.postagem_id,
      caminho: v.dados.caminho,
      nome: v.dados.nome,
      tipo: v.dados.tipo,
      tamanho: v.dados.tamanho,
    });
    if (error) return { ok: false, mensagem: error.message };

    revalidar();
    return { ok: true, mensagem: 'Arquivo anexado.' };
  } catch (e) {
    return { ok: false, mensagem: (e as Error).message };
  }
}

/**
 * Tira o arquivo da lista E do bucket.
 *
 * A ordem importa: o objeto primeiro. Se o banco apagasse antes e a
 * remoção do objeto falhasse, sobraria arquivo pago e invisível, que
 * ninguém mais tem como achar para apagar.
 */
export async function removerArquivo(
  _anterior: Resultado | null,
  fd: FormData,
): Promise<Resultado> {
  try {
    await exigirInterno();
    const v = validar(esquemaRemoverArquivo, fd);
    if (!v.ok) return v;

    const supabase = await clienteServidor();

    const { error: erroObjeto } = await supabase.storage.from(BUCKET).remove([v.dados.caminho]);
    if (erroObjeto) return { ok: false, mensagem: erroObjeto.message };

    const { error } = await supabase.from('postagem_arquivo').delete().eq('id', v.dados.id);
    if (error) return { ok: false, mensagem: error.message };

    revalidar();
    return { ok: true, mensagem: 'Arquivo removido.' };
  } catch (e) {
    return { ok: false, mensagem: (e as Error).message };
  }
}

/**
 * Apaga a postagem, e os arquivos dela.
 *
 * `on delete cascade` limpa a TABELA, e não o bucket: o Postgres não
 * tem como apagar objeto de Storage. Por isso os objetos saem aqui,
 * antes, e a lista de caminhos é lida enquanto ela ainda existe.
 */
export async function excluirPostagem(
  _anterior: Resultado | null,
  fd: FormData,
): Promise<Resultado> {
  try {
    const sessao = await sessaoAtual();
    if (!sessao) return { ok: false, mensagem: 'Sessão expirada. Entre de novo.' };
    if (sessao.papel !== 'administrador') {
      return { ok: false, mensagem: 'Só o administrador apaga postagem. Isso é irreversível.' };
    }

    const v = validar(esquemaExcluirPostagem, fd);
    if (!v.ok) return v;

    const supabase = await clienteServidor();

    const { data: arquivos } = await supabase
      .from('postagem_arquivo')
      .select('caminho')
      .eq('postagem_id', v.dados.id);

    const caminhos = (arquivos ?? []).map((a) => a.caminho as string);
    if (caminhos.length > 0) await supabase.storage.from(BUCKET).remove(caminhos);

    const { error } = await supabase.from('postagem').delete().eq('id', v.dados.id);
    if (error) return { ok: false, mensagem: error.message };

    revalidar();
    return { ok: true, mensagem: 'Apagada.' };
  } catch (e) {
    return { ok: false, mensagem: (e as Error).message };
  }
}
