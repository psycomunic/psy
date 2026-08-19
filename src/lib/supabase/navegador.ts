'use client';

import { createBrowserClient } from '@supabase/ssr';
import { exigirCredenciais } from './ambiente';

/**
 * Cliente Supabase do navegador. Serve para login, logout e para o que
 * precisa reagir em tempo real.
 *
 * Só a chave pública chega aqui. A chave de service role NUNCA:
 * ela passa por cima de todo o RLS, e num bundle de navegador seria o
 * mesmo que publicar o banco inteiro.
 */
export function clienteNavegador() {
  const { url, chave } = exigirCredenciais();
  return createBrowserClient(url, chave);
}
