import 'server-only';
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
export async function sessaoAtual(): Promise<Sessao | null> {
  const supabase = await clienteServidor();

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;

  const { data: perfil } = await supabase
    .from('perfil')
    .select('id, nome, email, papel, conta_id, ativo')
    .eq('id', auth.user.id)
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
}
