import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { sincronizar } from '@/lib/ingestao/sincronizar';

/**
 * O gatilho da rotina automática.
 *
 * Um cron chama isto uma vez por dia e a rotina puxa Meta, Google Ads e
 * GA4 de todas as lojas ativas. Mesmo segredo da rota de ingestão:
 * `INGESTAO_TOKEN` no cabeçalho, comparado em tempo constante, e sem a
 * variável a rota responde 503 sem fazer nada.
 *
 * Sempre responde 200 quando o segredo confere, mesmo com fonte
 * falhando. Uma conta com token vencido não é falha da rotina, é
 * resultado dela — e devolver 500 faria o cron marcar como erro e
 * tentar de novo em loop, sem que isso resolvesse nada. O que falhou
 * vem no corpo e fica no log de `sincronizacao`.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

function confere(recebido: string, esperado: string) {
  const a = Buffer.from(recebido);
  const b = Buffer.from(esperado);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

async function executar(req: Request, contaId?: string) {
  const esperado = process.env.INGESTAO_TOKEN;

  if (!esperado || esperado.length < 24) {
    return NextResponse.json(
      { ok: false, erro: 'Sincronização desligada: INGESTAO_TOKEN ausente ou curto demais.' },
      { status: 503 },
    );
  }

  /* Aceita o cabeçalho próprio e o `authorization: Bearer`, que é o que
     o cron da Vercel manda. */
  const doCabecalho = req.headers.get('x-psy-token') ?? '';
  const doBearer = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');

  if (!confere(doCabecalho, esperado) && !confere(doBearer, esperado)) {
    return NextResponse.json({ ok: false, erro: 'Não autorizado.' }, { status: 401 });
  }

  try {
    const resultados = await sincronizar({ contaId });

    return NextResponse.json({
      ok: true,
      fontes: resultados.length,
      comSucesso: resultados.filter((r) => r.ok).length,
      comFalha: resultados.filter((r) => !r.ok).length,
      gravadas: resultados.reduce((s, r) => s + r.gravadas, 0),
      resultados,
    });
  } catch (e) {
    /* Erro AQUI é da própria rotina, e não de uma fonte: banco fora do
       ar, chave de cifra ausente. Esse merece 500. */
    return NextResponse.json({ ok: false, erro: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  return executar(req, url.searchParams.get('conta') ?? undefined);
}

/** GET para o cron da Vercel, que não manda POST. */
export async function GET(req: Request) {
  return executar(req);
}
