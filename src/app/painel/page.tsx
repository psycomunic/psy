import { redirect } from 'next/navigation';
import { rotaInicial } from '@/lib/papeis';
import { bancoConfigurado } from '@/lib/supabase/ambiente';
import { sessaoAtual } from '@/lib/supabase/servidor';

export const metadata = { robots: { index: false, follow: false } };

/**
 * /painel não tem tela própria: manda cada papel para onde ele começa.
 * O vendedor cai no funil, o CS na carteira de clientes, o lojista nas
 * próprias métricas.
 */
export default async function PainelRaiz() {
  if (!bancoConfigurado) redirect('/entrar');

  const sessao = await sessaoAtual();
  if (!sessao) redirect('/entrar');

  redirect(rotaInicial[sessao.papel]);
}
