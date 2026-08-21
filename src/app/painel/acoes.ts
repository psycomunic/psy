'use server';

import { revalidatePath } from 'next/cache';
import { sessaoAtual } from '@/lib/supabase/servidor';
import { clienteServico } from '@/lib/supabase/servico';
import {
  esquemaConta,
  esquemaUsuario,
  esquemaAcesso,
  esquemaMeta,
  esquemaVinculo,
  esquemaTransferencia,
  validar,
} from '@/lib/validacao/painel';

/**
 * Ações de escrita do painel.
 *
 * ============================================================
 * A REGRA MAIS IMPORTANTE DESTE ARQUIVO
 * ============================================================
 * Toda função aqui usa `clienteServico()`, que passa por cima de TODO o
 * RLS. É o único jeito de criar usuário e gravar papel, porque essas
 * operações são justamente as que o RLS impede o usuário comum de fazer.
 *
 * Isso significa que a checagem de papel feita AQUI é a única barreira.
 * Não há rede embaixo: o banco não vai recusar nada, porque a chave de
 * serviço tem permissão para tudo.
 *
 * Por isso `exigirAdmin()` é a PRIMEIRA linha de cada ação, sempre, e a
 * sessão vem de `sessaoAtual()`, que valida o token no servidor de auth
 * e lê o papel da tabela `perfil` — nunca de algo que o navegador
 * mandou junto.
 *
 * Server Action é um endpoint HTTP. Qualquer pessoa pode chamar, com
 * qualquer corpo. Nada do que chega no `formData` é confiável.
 */

export type Resultado = { ok: boolean; mensagem: string };

async function exigirAdmin() {
  const sessao = await sessaoAtual();
  if (!sessao) throw new Error('Sessão expirada. Entre de novo.');
  if (sessao.papel !== 'administrador') {
    throw new Error('Só administradores podem fazer isso.');
  }
  return sessao;
}

/** Registra quem fez o quê. O gatilho de auditoria não pega criação de
    usuário, porque ela acontece em auth.users, fora do nosso schema. */
async function registrar(autorId: string, acao: string, tabela: string, alvo: string) {
  const s = clienteServico();
  await s.from('log_auditoria').insert({
    autor_id: autorId,
    autor_papel: 'administrador',
    acao,
    tabela,
    registro_id: alvo,
  });
}

/* ================================================================== */
/* Contas                                                              */
/* ================================================================== */

export async function criarConta(
  _anterior: Resultado | null,
  fd: FormData,
): Promise<Resultado> {
  try {
    const sessao = await exigirAdmin();

    const v = validar(esquemaConta, fd);
    if (!v.ok) return v;
    const { nome, tipo, segmento, plataforma, site, documento } = v.dados;

    const s = clienteServico();

    /* Nome único: duas contas com o mesmo nome viram duas linhas iguais
       no painel, e ninguém sabe qual é qual na hora de olhar receita. */
    const { data: existente } = await s
      .from('conta')
      .select('id')
      .ilike('nome', nome)
      .maybeSingle();

    if (existente) return { ok: false, mensagem: `Já existe uma conta chamada "${nome}".` };

    const { data, error } = await s
      .from('conta')
      .insert({ nome, tipo, segmento, plataforma, site, documento })
      .select('id, nome')
      .single();

    if (error) return { ok: false, mensagem: error.message };

    await registrar(sessao.id, 'criou', 'conta', data.id);
    revalidatePath('/painel/contas');
    revalidatePath('/painel/visao');

    return { ok: true, mensagem: `Loja "${data.nome}" cadastrada.` };
  } catch (e) {
    return { ok: false, mensagem: (e as Error).message };
  }
}

/* ================================================================== */
/* Usuários                                                            */
/* ================================================================== */

export async function convidarUsuario(
  _anterior: Resultado | null,
  fd: FormData,
): Promise<Resultado> {
  try {
    const sessao = await exigirAdmin();

    /* Formato do e-mail, papel dentro da lista fechada, senha mínima e
       a regra de "cliente precisa de loja" vivem todas no esquema.
       Ver src/lib/validacao/painel.ts. */
    const v = validar(esquemaUsuario, fd);
    if (!v.ok) return v;
    const { nome, email, papel, contas, senha } = v.dados;

    const s = clienteServico();

    /* A primeira loja da lista vira a principal: é a que o portal abre
       por padrão quando a pessoa tem mais de uma. O acesso de verdade
       vem das linhas em acessos_conta, criadas logo abaixo. */
    const principal = contas[0] ?? null;

    const { data, error } = await s.auth.admin.createUser({
      email,
      password: senha,
      /* Sem servidor de e-mail configurado, um usuário pendente de
         confirmação nunca conseguiria entrar. */
      email_confirm: true,
      /* app_metadata, e NUNCA user_metadata: user_metadata o próprio
         usuário edita pelo endpoint de update, e papel gravado lá seria
         promoção a admin numa requisição. */
      app_metadata: { papel, conta_id: principal },
      user_metadata: { nome },
    });

    if (error) {
      return {
        ok: false,
        mensagem: /already been registered|already exists/i.test(error.message)
          ? 'Já existe um usuário com este e-mail.'
          : error.message,
      };
    }

    /* O gatilho `ao_criar_usuario` é quem cria o perfil. Se ele não
       rodou, o usuário existe em auth e não enxerga nada, e esse
       sintoma é confuso de diagnosticar depois. Melhor dizer agora. */
    const { data: perfil } = await s
      .from('perfil')
      .select('papel, conta_id')
      .eq('id', data.user.id)
      .maybeSingle();

    if (!perfil) {
      return {
        ok: false,
        mensagem:
          'Usuário criado, mas o perfil não foi gerado. Rode npm run migrar e recrie.',
      };
    }

    /* O gatilho já criou o vínculo da loja principal. As demais entram
       aqui, e o `ignoreDuplicates` evita conflito com a que ele criou. */
    if (contas.length > 0) {
      await s.from('acessos_conta').upsert(
        contas.map((conta_id) => ({
          usuario_id: data.user.id,
          conta_id,
          convidado_por: sessao.id,
          aceito_em: new Date().toISOString(),
        })),
        { onConflict: 'usuario_id,conta_id', ignoreDuplicates: true },
      );
    }

    await registrar(sessao.id, 'criou', 'perfil', data.user.id);
    revalidatePath('/painel/equipe');

    const quantas = contas.length;
    return {
      ok: true,
      mensagem:
        quantas === 0
          ? `${nome} agora tem acesso.`
          : `${nome} agora tem acesso a ${quantas} ${quantas === 1 ? 'loja' : 'lojas'}.`,
    };
  } catch (e) {
    return { ok: false, mensagem: (e as Error).message };
  }
}

export async function alterarAcesso(
  _anterior: Resultado | null,
  fd: FormData,
): Promise<Resultado> {
  try {
    const sessao = await exigirAdmin();

    const v = validar(esquemaAcesso, fd);
    if (!v.ok) return v;
    const { id, ativo } = v.dados;

    /* Desativar a si mesmo tranca o admin para fora do próprio painel, e
       não há outra porta: não existe cadastro aberto nem outro admin
       garantido. */
    if (id === sessao.id) {
      return { ok: false, mensagem: 'Você não pode desativar o próprio acesso.' };
    }

    const s = clienteServico();
    const { error } = await s.from('perfil').update({ ativo }).eq('id', id);
    if (error) return { ok: false, mensagem: error.message };

    await registrar(sessao.id, ativo ? 'reativou' : 'desativou', 'perfil', id);
    revalidatePath('/painel/equipe');

    return { ok: true, mensagem: ativo ? 'Acesso reativado.' : 'Acesso desativado.' };
  } catch (e) {
    return { ok: false, mensagem: (e as Error).message };
  }
}

/* ================================================================== */
/* Metas                                                               */
/* ================================================================== */

export async function definirMeta(
  _anterior: Resultado | null,
  fd: FormData,
): Promise<Resultado> {
  try {
    const sessao = await exigirAdmin();

    /* A normalização de "320.000,50" para número vive no esquema: quem
       preenche meta digita como fala, e essa regra não deve estar
       espalhada em cada action. */
    const v = validar(esquemaMeta, fd);
    if (!v.ok) return v;
    const { conta_id: contaId, receita_meta: receita } = v.dados;

    /* Sempre dia 1: a chave única é (conta, mês), e uma data no meio do
       mês criaria uma segunda meta para o mesmo mês. */
    const agora = new Date();
    const mes = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}-01`;

    const s = clienteServico();
    const { error } = await s
      .from('meta_conta')
      .upsert({ conta_id: contaId, mes, receita_meta: receita }, { onConflict: 'conta_id,mes' });

    if (error) return { ok: false, mensagem: error.message };

    await registrar(sessao.id, 'definiu meta', 'meta_conta', contaId);
    revalidatePath('/painel/visao');
    revalidatePath('/painel/contas');

    return { ok: true, mensagem: 'Meta do mês definida.' };
  } catch (e) {
    return { ok: false, mensagem: (e as Error).message };
  }
}

/* ================================================================== */
/* Vínculos usuário ↔ loja                                             */
/* ================================================================== */

export async function vincularConta(
  _anterior: Resultado | null,
  fd: FormData,
): Promise<Resultado> {
  try {
    const sessao = await exigirAdmin();

    const v = validar(esquemaVinculo, fd);
    if (!v.ok) return v;
    const { usuario_id, conta_id } = v.dados;

    const s = clienteServico();
    const { error } = await s
      .from('acessos_conta')
      .upsert(
        {
          usuario_id,
          conta_id,
          convidado_por: sessao.id,
          aceito_em: new Date().toISOString(),
        },
        { onConflict: 'usuario_id,conta_id', ignoreDuplicates: true },
      );

    if (error) return { ok: false, mensagem: error.message };

    revalidatePath('/painel/equipe');
    return { ok: true, mensagem: 'Acesso à loja concedido.' };
  } catch (e) {
    return { ok: false, mensagem: (e as Error).message };
  }
}

export async function desvincularConta(
  _anterior: Resultado | null,
  fd: FormData,
): Promise<Resultado> {
  try {
    await exigirAdmin();

    const v = validar(esquemaVinculo, fd);
    if (!v.ok) return v;
    const { usuario_id, conta_id } = v.dados;

    const s = clienteServico();

    /*
      Um cliente sem nenhuma loja fica logado e sem enxergar nada, e a
      constraint `cliente_precisa_de_conta` ainda o segura pela loja
      principal — o resultado seria um usuário num limbo silencioso.
      Melhor recusar e mandar desativar o acesso inteiro.
    */
    const { data: perfil } = await s
      .from('perfil').select('papel').eq('id', usuario_id).maybeSingle();

    if (perfil?.papel === 'cliente' || perfil?.papel === 'cliente_leitura') {
      const { count } = await s
        .from('acessos_conta')
        .select('*', { count: 'exact', head: true })
        .eq('usuario_id', usuario_id);

      if ((count ?? 0) <= 1) {
        return {
          ok: false,
          mensagem:
            'Esta é a única loja da pessoa. Para tirar o acesso, desative-o em vez de desvincular.',
        };
      }
    }

    const { error } = await s
      .from('acessos_conta')
      .delete()
      .eq('usuario_id', usuario_id)
      .eq('conta_id', conta_id);

    if (error) return { ok: false, mensagem: error.message };

    revalidatePath('/painel/equipe');
    return { ok: true, mensagem: 'Acesso à loja removido.' };
  } catch (e) {
    return { ok: false, mensagem: (e as Error).message };
  }
}

/**
 * Transferência de carteira.
 *
 * Existe porque desativar alguém sem passar as lojas adiante deixa
 * contas órfãs: ninguém responsável, ninguém recebendo o alerta, e o
 * problema só aparece quando o cliente liga reclamando.
 *
 * A operação é: copiar os vínculos, remover os antigos, e opcionalmente
 * desativar. Não é transação de banco única porque passa pelo PostgREST;
 * a ordem escolhida (copiar ANTES de remover) garante que uma falha no
 * meio deixe acesso duplicado, e não acesso perdido. Duplicado se
 * conserta numa tela; perdido ninguém percebe.
 */
export async function transferirCarteira(
  _anterior: Resultado | null,
  fd: FormData,
): Promise<Resultado> {
  try {
    const sessao = await exigirAdmin();

    const v = validar(esquemaTransferencia, fd);
    if (!v.ok) return v;
    const { de_id, para_id, desativar } = v.dados;

    if (desativar && para_id === sessao.id && de_id === sessao.id) {
      return { ok: false, mensagem: 'Você não pode desativar o próprio acesso.' };
    }

    const s = clienteServico();

    const { data: vinculos } = await s
      .from('acessos_conta').select('conta_id').eq('usuario_id', de_id);

    const contas = (vinculos ?? []).map((x) => x.conta_id as string);

    if (contas.length === 0) {
      return { ok: false, mensagem: 'Essa pessoa não tem nenhuma loja para transferir.' };
    }

    const { error: erroCopia } = await s.from('acessos_conta').upsert(
      contas.map((conta_id) => ({
        usuario_id: para_id,
        conta_id,
        convidado_por: sessao.id,
        aceito_em: new Date().toISOString(),
      })),
      { onConflict: 'usuario_id,conta_id', ignoreDuplicates: true },
    );

    if (erroCopia) return { ok: false, mensagem: erroCopia.message };

    const { error: erroRemocao } = await s
      .from('acessos_conta').delete().eq('usuario_id', de_id);

    if (erroRemocao) {
      return {
        ok: false,
        mensagem: `As lojas foram passadas adiante, mas não saíram do antigo responsável: ${erroRemocao.message}`,
      };
    }

    if (desativar) {
      await s.from('perfil').update({ ativo: false }).eq('id', de_id);
    }

    await registrar(sessao.id, 'transferiu carteira', 'acessos_conta', de_id);
    revalidatePath('/painel/equipe');

    return {
      ok: true,
      mensagem: `${contas.length} ${contas.length === 1 ? 'loja transferida' : 'lojas transferidas'}${desativar ? ', e o acesso antigo foi desativado' : ''}.`,
    };
  } catch (e) {
    return { ok: false, mensagem: (e as Error).message };
  }
}
