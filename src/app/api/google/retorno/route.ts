import { NextResponse, type NextRequest } from 'next/server';
import { sessaoAtual } from '@/lib/supabase/servidor';
import { configGoogle, guardarAutorizacao } from '@/lib/google/agenda';

/**
 * A volta do Google, com o código de autorização.
 *
 * Confere três coisas antes de guardar qualquer coisa: que quem voltou
 * é administrador logado, que o estado bate com o cookie que saiu
 * daqui, e que o Google não devolveu um erro no lugar do código.
 *
 * O cookie do estado é apagado em TODOS os caminhos, inclusive nos que
 * falham. Estado que sobrevive à tentativa é estado reutilizável.
 */
function voltarPara(aviso: string, aqui: string) {
  const r = NextResponse.redirect(new URL(`/painel/configuracoes?google=${aviso}`, aqui));
  r.cookies.delete({ name: 'psy_google_estado', path: '/api/google' });
  return r;
}

export async function GET(req: NextRequest) {
  const aqui = req.nextUrl.origin;
  const sessao = await sessaoAtual();
  if (!sessao || sessao.papel !== 'administrador') return voltarPara('sem_permissao', aqui);

  const url = new URL(req.url);
  const erro = url.searchParams.get('error');
  if (erro) return voltarPara(erro === 'access_denied' ? 'recusado' : 'erro', aqui);

  const codigo = url.searchParams.get('code');
  const estado = url.searchParams.get('state');
  const esperado = req.cookies.get('psy_google_estado')?.value;

  if (!codigo || !estado || !esperado || estado !== esperado) {
    return voltarPara('estado_invalido', aqui);
  }

  const cfg = configGoogle();
  if (!cfg) return voltarPara('sem_credencial', aqui);

  try {
    await guardarAutorizacao(cfg, codigo);
    return voltarPara('conectado', aqui);
  } catch (e) {
    console.error('[google agenda] retorno:', (e as Error).message);
    return voltarPara('erro', aqui);
  }
}
