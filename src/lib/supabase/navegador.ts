'use client';

import { createBrowserClient } from '@supabase/ssr';
import { exigirCredenciais } from './ambiente';
import { buscaComPrazo } from './rede';

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

  /* Com prazo. Sem ele, o botão de entrar fica girando para sempre
     quando o projeto do Supabase está fora do ar, e a tela não tem o
     que dizer. Ver `rede.ts`. */
  return createBrowserClient(url, chave, {
    global: { fetch: buscaComPrazo() },
  });
}
