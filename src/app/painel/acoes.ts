'use server';

import { revalidatePath } from 'next/cache';
import { sessaoAtual } from '@/lib/supabase/servidor';
import { clienteServico } from '@/lib/supabase/servico';
import { PAPEIS, type Papel } from '@/lib/papeis';

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
  if (sessao.papel !== 'admin') {
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
    autor_papel: 'admin',
    acao,
    tabela,
    registro_id: alvo,
  });
}

const texto = (fd: FormData, campo: string) => String(fd.get(campo) ?? '').trim();

/* ================================================================== */
/* Contas                                                              */
/* ================================================================== */

export async function criarConta(
  _anterior: Resultado | null,
  fd: FormData,
): Promise<Resultado> {
  try {
    const sessao = await exigirAdmin();

    const nome = texto(fd, 'nome');
    const plataforma = texto(fd, 'plataforma');
    const site = texto(fd, 'site');
    const documento = texto(fd, 'documento');

    if (nome.length < 2) return { ok: false, mensagem: 'Informe o nome da loja.' };

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
      .insert({
        nome,
        plataforma: plataforma || null,
        site: site || null,
        documento: documento || null,
      })
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

    const nome = texto(fd, 'nome');
    const email = texto(fd, 'email').toLowerCase();
    const papel = texto(fd, 'papel') as Papel;
    const contaId = texto(fd, 'conta_id');
    const senha = String(fd.get('senha') ?? '');

    if (nome.length < 2) return { ok: false, mensagem: 'Informe o nome da pessoa.' };
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return { ok: false, mensagem: 'E-mail inválido.' };
    }

    /* O papel vem de uma lista fechada, e não do que o formulário
       mandou. Sem isto, um POST manual com papel inventado entraria
       direto no banco: server action é endpoint HTTP aberto. */
    if (!PAPEIS.includes(papel)) {
      return { ok: false, mensagem: 'Papel inválido.' };
    }

    /* Cliente sem loja não passa na constraint do banco e ficaria sem
       perfil, ou seja, logaria e não veria nada. Barrar aqui dá a
       mensagem certa em vez de um erro de constraint. */
    if (papel === 'cliente' && !contaId) {
      return { ok: false, mensagem: 'Cliente precisa estar vinculado a uma loja.' };
    }

    if (senha.length < 12) {
      return { ok: false, mensagem: 'A senha precisa de pelo menos 12 caracteres.' };
    }

    const s = clienteServico();

    const { data, error } = await s.auth.admin.createUser({
      email,
      password: senha,
      /* Sem servidor de e-mail configurado, um usuário pendente de
         confirmação nunca conseguiria entrar. */
      email_confirm: true,
      /* app_metadata, e NUNCA user_metadata: user_metadata o próprio
         usuário edita pelo endpoint de update, e papel gravado lá seria
         promoção a admin numa requisição. */
      app_metadata: { papel, conta_id: contaId || null },
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

    await registrar(sessao.id, 'criou', 'perfil', data.user.id);
    revalidatePath('/painel/equipe');

    return { ok: true, mensagem: `${nome} agora tem acesso.` };
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

    const id = texto(fd, 'id');
    const ativo = texto(fd, 'ativo') === 'true';

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

    const contaId = texto(fd, 'conta_id');
    const receita = Number(
      texto(fd, 'receita_meta').replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.'),
    );

    if (!contaId) return { ok: false, mensagem: 'Escolha a loja.' };
    if (!Number.isFinite(receita) || receita <= 0) {
      return { ok: false, mensagem: 'A meta de receita precisa ser maior que zero.' };
    }

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
