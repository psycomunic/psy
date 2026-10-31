import 'server-only';
import { clienteServidor } from '@/lib/supabase/servidor';
import { bancoConfigurado } from '@/lib/supabase/ambiente';

/**
 * O que saiu, para quem, e se saiu.
 *
 * Lê com `clienteServidor()`, e não com a service role, de propósito: a
 * política de `email_enviado` já restringe a leitura ao administrador
 * (ver a migração 0049), e usar a chave que ignora o RLS onde o RLS
 * funciona seria desligar a proteção por conveniência.
 *
 * Devolve lista vazia quando a tabela ainda não existe. A tela que usa
 * isto é a de configurações, e ela precisa continuar abrindo num
 * ambiente onde a migração não rodou: "nenhum e-mail registrado" é uma
 * resposta honesta, enquanto uma tela de erro esconderia o resto das
 * configurações por causa de uma tabela de trilha.
 */

export type EnvioRegistrado = {
  id: number;
  tipo: string;
  destino: string;
  assunto: string;
  status: string;
  erro: string | null;
  em: string;
};

export const ROTULO_DO_TIPO: Record<string, string> = {
  inscricao_recebida: 'Confirmação de inscrição',
  aviso_inscricao: 'Aviso de inscrição',
  analise_recebida: 'Confirmação de pedido de análise',
  aviso_lead: 'Aviso de lead do site',
  proposta_enviada: 'Proposta',
  acesso_criado: 'Acesso ao painel',
};

export async function ultimosEnvios(quantos = 8): Promise<EnvioRegistrado[]> {
  if (!bancoConfigurado) return [];

  try {
    const supabase = await clienteServidor();
    const { data, error } = await supabase
      .from('email_enviado')
      .select('id, tipo, destino, assunto, status, erro, em')
      .order('em', { ascending: false })
      .limit(quantos);

    if (error) return [];

    return (data ?? []).map((e) => ({
      id: Number(e.id),
      tipo: e.tipo as string,
      destino: e.destino as string,
      assunto: e.assunto as string,
      status: e.status as string,
      erro: (e.erro as string | null) ?? null,
      em: e.em as string,
    }));
  } catch {
    return [];
  }
}

/** Quantos falharam nos últimos sete dias. É o número que pede ação. */
export async function falhasRecentes(): Promise<number> {
  if (!bancoConfigurado) return 0;

  try {
    const supabase = await clienteServidor();
    const seteDias = new Date(Date.now() - 7 * 86400000).toISOString();
    const { count, error } = await supabase
      .from('email_enviado')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'falhou')
      .gte('em', seteDias);

    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}
