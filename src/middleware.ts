import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * TRAVA DE SEGURANCA.
 *
 * O login e o painel ainda NAO autenticam ninguem: nao existe banco,
 * sessao nem senha. Enquanto for assim, eles so respondem em
 * desenvolvimento. Em producao retornam 404.
 *
 * Motivo: uma tela de login que aceita qualquer coisa e parece
 * funcionar e pior do que nenhuma tela. Ela passa a impressao de que os
 * dados estao protegidos quando nao estao.
 *
 * COMO LIBERAR: so depois que a autenticacao real estiver ligada. Nesse
 * momento este arquivo deixa de bloquear e passa a fazer o oposto,
 * verificar a sessao e o papel antes de deixar entrar. Ver PLATAFORMA.md
 */
const AREAS_EM_CONSTRUCAO = ['/entrar', '/painel'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const emConstrucao = AREAS_EM_CONSTRUCAO.some(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  );

  if (emConstrucao && process.env.NODE_ENV === 'production') {
    return new NextResponse(null, { status: 404 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/entrar/:path*', '/painel/:path*'],
};
