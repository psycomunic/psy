import 'server-only';
import { createClient } from '@supabase/supabase-js';

/**
 * Cliente de SERVICE ROLE. Passa por cima de todo o RLS.
 *
 * server-only no topo faz o build FALHAR se um componente de cliente
 * importar este arquivo. Não é zelo: esta chave num bundle de navegador
 * entrega o banco inteiro, incluindo o faturamento de todos os clientes
 * e os tokens de anúncio deles.
 *
 * Use SÓ onde o RLS não pode ajudar, e sempre com filtro explícito:
 *   - rotina de sincronização gravando metrica_diaria
 *   - leitura de integracao.segredo (tabela sem política nenhuma)
 *   - convite de usuário, que precisa gravar papel em app_metadata
 *
 * Fora desses casos, use `clienteServidor()`: escrever o filtro na mão
 * é justamente o que se quis evitar ao escolher RLS.
 */
export function clienteServico() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !chave) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY ausente. Ela nunca leva o prefixo ' +
        'NEXT_PUBLIC_: isso a publicaria no navegador.',
    );
  }

  return createClient(url, chave, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
