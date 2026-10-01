import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { bancoConfigurado, urlSupabase, chavePublica } from '@/lib/supabase/ambiente';

/**
 * Porta de entrada da área logada.
 *
 * Faz duas coisas, nesta ordem:
 *
 * 1. TRAVA. Sem banco configurado não existe autenticação possível, e
 *    uma tela de login que aceita qualquer coisa é pior que nenhuma
 *    tela: passa a impressão de que os dados estão protegidos quando não
 *    estão. Nesse estado, /entrar e /painel devolvem 404 em produção.
 *
 *    A trava se levanta sozinha quando as variáveis do Supabase
 *    existirem. Ninguém precisa lembrar de virar interruptor nenhum.
 *
 * 2. SESSÃO. Com banco configurado, renova o cookie de sessão a cada
 *    requisição e barra quem não está logado antes da página existir.
 *
 * Isto é a PRIMEIRA barreira, não a única. O middleware roda antes de
 * tudo e não consulta a tabela perfil, então ele sabe que há alguém
 * logado, e não quem. A checagem de papel acontece na página, com
 * `sessaoAtual()`, e no banco, com RLS. Segurança que mora só no
 * middleware cai junto com ele.
 */
const AREA_LOGADA = ['/painel'];
const AREA_PUBLICA_DE_AUTH = ['/entrar'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const casa = (lista: string[]) =>
    lista.some((p) => pathname === p || pathname.startsWith(p + '/'));

  const logada = casa(AREA_LOGADA);
  const auth = casa(AREA_PUBLICA_DE_AUTH);

  // 1. Sem banco, a área logada não vai ao ar.
  if (!bancoConfigurado) {
    if ((logada || auth) && process.env.NODE_ENV === 'production') {
      return new NextResponse(null, { status: 404 });
    }
    return NextResponse.next();
  }

  // 2. Com banco: renova a sessão.
  let resposta = NextResponse.next({ request: req });

  const supabase = createServerClient(urlSupabase, chavePublica, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (novos) => {
        novos.forEach(({ name, value }) => req.cookies.set(name, value));
        resposta = NextResponse.next({ request: req });
        novos.forEach(({ name, value, options }) =>
          resposta.cookies.set(name, value, options),
        );
      },
    },
  });

  /*
    getClaims, e não getSession nem getUser.

    `getSession` lê o cookie e acredita nele, que é o que não se faz numa
    decisão de acesso.

    `getUser` verifica, mas verifica PERGUNTANDO ao servidor de auth: uma
    ida à rede em toda navegação do painel, e outra igual acontecia
    dentro da página, logo depois. Medido em produção, o HTML levava de
    1,5 a 3,5 segundos para fechar, e o navegador gastava 11 a 84ms
    depois dele: o tempo era todo em espera de rede no servidor.

    `getClaims` verifica a ASSINATURA do token com a chave pública do
    projeto, baixada uma vez e guardada. Este projeto assina em ES256 e
    publica o JWKS, então a conferência acontece aqui mesmo, sem sair
    para a rede, e com a mesma garantia criptográfica.

    O que ela NÃO pega é token revogado antes de expirar. Quem pega isso
    é o `perfil.ativo` em `sessaoAtual`, e são as políticas de RLS, que
    rodam no Postgres a cada consulta e não dependem de nada disto.
  */
  const { data: claims } = await supabase.auth.getClaims();
  const user = claims?.claims ? { id: claims.claims.sub } : null;

  if (logada && !user) {
    const destino = req.nextUrl.clone();
    destino.pathname = '/entrar';
    // Para devolver a pessoa ao lugar que ela tentou abrir.
    destino.searchParams.set('destino', pathname);
    return NextResponse.redirect(destino);
  }

  if (auth && user) {
    const destino = req.nextUrl.clone();
    destino.pathname = '/painel';
    destino.search = '';
    return NextResponse.redirect(destino);
  }

  return resposta;
}

export const config = {
  matcher: ['/entrar/:path*', '/painel/:path*'],
};
