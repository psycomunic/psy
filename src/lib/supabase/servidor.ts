import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { exigirCredenciais } from './ambiente';
import type { Papel } from '@/lib/papeis';

/**
 * Cliente Supabase para componentes e ações de servidor.
 *
 * Usa a chave pública. Toda consulta feita por aqui passa pelo RLS, que
 * é o ponto: o isolamento por cliente é responsabilidade do banco, e não
 * de eu lembrar de escrever o `where` certo em cada consulta.
 */
export async function clienteServidor() {
  const { url, chave } = exigirCredenciais();
  const jar = await cookies();

  return createServerClient(url, chave, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (novos) => {
        try {
          novos.forEach(({ name, value, options }) => jar.set(name, value, options));
        } catch {
          /* Componente de servidor não escreve cookie. O middleware já
             renovou a sessão antes de chegar aqui, então ignorar é
             correto e não silencia problema real. */
        }
      },
    },
  });
}

export type Sessao = {
  id: string;
  nome: string;
  email: string;
  papel: Papel;
  contaId: string | null;
};

/**
 * Quem está logado, com papel vindo do BANCO.
 *
 * getUser() e não getSession(): getSession lê o cookie e acredita nele.
 * getUser valida o token no servidor de auth. Num middleware ou numa
 * decisão de permissão, a diferença é entre confiar e verificar.
 *
 * O papel vem da tabela perfil, nunca do JWT: metadado de usuário é
 * gravável pelo próprio usuário em várias configurações, e papel que o
 * usuário escreve não é permissão.
 */
/*
  MEMORIZADA POR REQUISIÇÃO.

  O layout do painel precisa do papel para montar o menu, e a página do
  módulo precisa dele para decidir o que mostrar. Sem `cache`, seriam
  duas conferências de token e duas consultas a `perfil` por
  carregamento, para responder exatamente a mesma pergunta.

  O `cache` do React vale dentro de UMA requisição e some no fim dela:
  não é cache entre visitas, e não guarda sessão de ninguém entre
  pessoas diferentes.
*/
export const sessaoAtual = cache(async (): Promise<Sessao | null> => {
  const supabase = await clienteServidor();

  /*
    `getClaims` confere a assinatura do token COM A CHAVE PÚBLICA do
    projeto, que é baixada uma vez e fica guardada. Antes era `getUser`,
    que faz a mesma conferência PERGUNTANDO ao servidor de auth: uma ida
    à rede por requisição, em sequência com tudo o mais.

    Aqui doía duas vezes. O middleware já tinha perguntado, e esta
    segunda pergunta acontecia antes de qualquer consulta do painel
    poder começar, porque é daqui que sai o papel.

    A garantia é a mesma: ES256 verificado é ES256 verificado, venha a
    resposta da rede ou do cálculo local. E o que a assinatura não diz,
    a linha abaixo diz: perfil que não existe ou foi desativado não
    passa, e isso continua sendo uma consulta de verdade ao banco.
  */
  const { data: claims } = await supabase.auth.getClaims();
  const idDoUsuario = claims?.claims?.sub;
  if (!idDoUsuario) return null;

  const { data: perfil } = await supabase
    .from('perfil')
    .select('id, nome, email, papel, conta_id, ativo')
    .eq('id', idDoUsuario)
    .single();

  // Sem perfil ou desativado, não há acesso. Existir em auth.users não
  // é o mesmo que ter permissão.
  if (!perfil || !perfil.ativo) return null;

  return {
    id: perfil.id,
    nome: perfil.nome,
    email: perfil.email,
    papel: perfil.papel as Papel,
    contaId: perfil.conta_id,
  };
});
