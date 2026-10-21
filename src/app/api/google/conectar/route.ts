import { NextResponse, type NextRequest } from 'next/server';
import { randomBytes } from 'node:crypto';
import { sessaoAtual } from '@/lib/supabase/servidor';
import { configGoogle, urlDeAutorizacao } from '@/lib/google/agenda';

/**
 * Começa a autorização do Google Agenda.
 *
 * ============================================================
 * SÓ O ADMINISTRADOR, E A CHECAGEM É AQUI
 * ============================================================
 * A agenda é a do dono da agência, e quem autoriza está dando a um
 * aplicativo o direito de escrever no calendário dele. `credencial_agencia`
 * não tem política de RLS nenhuma de propósito, então não existe uma
 * segunda barreira depois desta: ela é a proteção de verdade.
 *
 * ============================================================
 * O ESTADO QUE VOLTA TEM QUE SER O QUE SAIU
 * ============================================================
 * Sem isso, qualquer pessoa consegue fazer o navegador de um
 * administrador logado abrir a rota de retorno com um `code` de OUTRA
 * conta Google, e a agência passa a escrever na agenda de um
 * desconhecido sem ninguém perceber.
 *
 * O estado é um número aleatório guardado num cookie `httpOnly` de dez
 * minutos, e conferido na volta. Cookie e não sessão porque esta ida
 * passa pelo Google, e o que volta precisa provar que saiu daqui.
 */
/* O destino da volta sai do ENDEREÇO DA REQUISIÇÃO, e não de
   NEXT_PUBLIC_SITE_URL. Medido: rodando em localhost, o painel
   despachava a pessoa para produção, onde a sessão dela não existe, e
   a tela caía no login sem explicação. O mesmo valeria para um deploy
   de preview.

   A exceção é o `redirect_uri` do OAuth, que continua vindo do
   ambiente: ele precisa casar EXATAMENTE com o que está cadastrado no
   Google Cloud, e endereço de preview nunca vai estar lá. */
export async function GET(req: NextRequest) {
  const aqui = req.nextUrl.origin;
  const sessao = await sessaoAtual();
  if (!sessao) {
    return NextResponse.redirect(
      new URL('/entrar?destino=/painel/configuracoes', aqui),
    );
  }
  if (sessao.papel !== 'administrador') {
    return NextResponse.redirect(
      new URL('/painel/configuracoes?google=sem_permissao', aqui),
    );
  }

  const cfg = configGoogle();
  if (!cfg) {
    return NextResponse.redirect(
      new URL('/painel/configuracoes?google=sem_credencial', aqui),
    );
  }

  const estado = randomBytes(24).toString('base64url');
  const resposta = NextResponse.redirect(urlDeAutorizacao(cfg, estado));
  resposta.cookies.set('psy_google_estado', estado, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/api/google',
    maxAge: 600,
  });
  return resposta;
}
