/**
 * O banco está configurado?
 *
 * A área logada só existe quando existe banco por trás. Em vez de um
 * interruptor manual que alguém esquece de virar, o sistema pergunta ao
 * ambiente: sem as variáveis abaixo, não há autenticação possível, e o
 * middleware devolve 404 em produção.
 *
 * Assim a trava se levanta sozinha no momento certo, e volta sozinha se
 * as credenciais sumirem. Ninguém precisa lembrar de nada.
 */
export const urlSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
export const chavePublica = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const bancoConfigurado = Boolean(urlSupabase && chavePublica);

/**
 * Falha alto em vez de baixo.
 *
 * Um cliente Supabase criado com string vazia não reclama na hora: ele
 * falha depois, numa requisição, com erro de rede sem sentido. Melhor
 * quebrar aqui, dizendo exatamente o que falta.
 */
export function exigirCredenciais() {
  if (!bancoConfigurado) {
    throw new Error(
      'Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e ' +
        'NEXT_PUBLIC_SUPABASE_ANON_KEY. Ver .env.example e PLATAFORMA.md.',
    );
  }
  return { url: urlSupabase, chave: chavePublica };
}
