/**
 * O `fetch` que o Supabase usa aqui, com prazo.
 *
 * ============================================================
 * POR QUE ISTO EXISTE
 * ============================================================
 * O cliente do Supabase não tem prazo nenhum por padrão. Enquanto o
 * projeto responde, isso não aparece. Quando ele para de responder, e
 * projeto do plano gratuito pausa sozinho por inatividade, cada
 * requisição fica pendurada até alguém de fora cortar.
 *
 * Em produção, quem cortou foi a Vercel, aos 25 segundos:
 *
 *   GET /painel/visao [error/middleware]
 *   Your function was stopped as it did not return an initial
 *   response within 25s
 *
 * Quinze vezes, em quatro horas, uma pessoa só tentando entrar. Da
 * cadeira dela, o painel não dizia "o banco está fora": ficava rodando
 * e morria sem explicação, que é o pior jeito de um sistema falhar.
 *
 * ============================================================
 * O PRAZO NÃO CONSERTA O BANCO, CONSERTA O DIAGNÓSTICO
 * ============================================================
 * Com banco fora, não existe painel: a sessão não se confere e nenhuma
 * consulta volta. O que muda é o tempo até a verdade aparecer. Seis
 * segundos e um erro honesto na tela valem mais que vinte e cinco
 * segundos e uma tela branca.
 *
 * O preço é conhecido: numa lentidão passageira do Supabase, quem
 * estava logado pode ser devolvido ao login. É menos ruim que a
 * navegação inteira travar, e o caminho de volta é um clique.
 *
 * ============================================================
 * POR QUE A DETECÇÃO DE RECURSO
 * ============================================================
 * `AbortSignal.timeout` e `AbortSignal.any` são recentes. Esta função
 * roda TAMBÉM no navegador do cliente, na tela de login, e um
 * `TypeError` ali não deixaria ninguém entrar. Então, onde não existir,
 * o `fetch` volta a ser o de sempre: sem prazo, como era antes, e nunca
 * quebrado.
 */

/** Seis segundos. Consulta sadia deste painel fecha em menos de um. */
export const PRAZO_PADRAO_MS = 6_000;

/**
 * Quatro, na middleware.
 *
 * Ela roda antes de QUALQUER navegação do painel e divide os 25
 * segundos da função com a página que vem depois. Gastar o orçamento
 * inteiro na porta deixaria a página sem tempo de existir.
 */
export const PRAZO_MIDDLEWARE_MS = 4_000;

function comPrazo(prazoMs: number, original?: AbortSignal | null): AbortSignal | undefined {
  if (typeof AbortSignal === 'undefined' || typeof AbortSignal.timeout !== 'function') {
    return original ?? undefined;
  }

  const relogio = AbortSignal.timeout(prazoMs);
  if (!original) return relogio;

  /* Com um signal já vindo de fora, os dois precisam valer: quem
     cancelou a requisição continua podendo cancelar. Sem `any`, manda o
     de fora, porque perder o cancelamento de quem pediu é pior do que
     perder o prazo. */
  return typeof AbortSignal.any === 'function'
    ? AbortSignal.any([original, relogio])
    : original;
}

/** O `fetch` para passar em `global.fetch` do cliente Supabase. */
export function buscaComPrazo(prazoMs: number = PRAZO_PADRAO_MS): typeof fetch {
  return (entrada, init) =>
    fetch(entrada as RequestInfo | URL, {
      ...init,
      signal: comPrazo(prazoMs, init?.signal),
    });
}

/**
 * O erro é de rede, e não de senha?
 *
 * Importa na tela de login. "E-mail ou senha incorretos" é a mensagem
 * certa para credencial errada e a mensagem MENTIROSA para servidor que
 * não respondeu: a pessoa fica repetindo a senha certa, convencida de
 * que errou.
 */
export function ePanneDeRede(erro: { name?: string; status?: number; message?: string }) {
  if (erro.status === 0) return true;
  if (erro.name && /Retryable|Abort|TimeoutError/i.test(erro.name)) return true;
  return Boolean(erro.message && /fetch|network|timed? ?out|abort/i.test(erro.message));
}
