import 'server-only';
import { bancoConfigurado } from '@/lib/supabase/ambiente';
import { clienteServidor } from '@/lib/supabase/servidor';

/**
 * As lojas que podem receber cobrança.
 *
 * Não vem de `listarContas`, que é construída sobre `kpi_mes` e carrega
 * meta, saúde e métrica do mês. Aqui só interessam duas coisas: o nome
 * e se existe documento.
 *
 * O CNPJ importa porque o Asaas recusa criar cliente sem ele. Descobrir
 * isso DEPOIS de preencher o formulário inteiro, na mensagem de erro da
 * API, é o tipo de fricção que faz alguém emitir a cobrança à mão no
 * site do Asaas — e sair do painel de vez.
 */
export async function contasParaCobranca(): Promise<
  { id: string; nome: string; temDocumento: boolean }[]
> {
  if (!bancoConfigurado) return [];

  const supabase = await clienteServidor();
  const { data } = await supabase
    .from('conta')
    .select('id, nome, documento, situacao')
    .in('situacao', ['ativa', 'onboarding'])
    .order('nome');

  return (data ?? []).map((c) => ({
    id: c.id as string,
    nome: c.nome as string,
    temDocumento: Boolean((c.documento as string | null)?.trim()),
  }));
}
