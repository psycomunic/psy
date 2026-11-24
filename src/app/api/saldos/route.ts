import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { consultarSaldosMidia } from '@/lib/ingestao/saldos';

/**
 * Verificação agendada de saldos das contas de anúncio (tarde em Brasília).
 * Complementa as verificações já disparadas por `/api/sincronizar` (manhã cedo)
 * e `/api/lembretes` (08h BRT), enviando alerta no Sino e no WhatsApp
 * `5547992406661` caso alguma conta tenha entrado em saldo baixo ao longo do dia.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function confere(recebido: string, esperado: string) {
  const a = Buffer.from(recebido);
  const b = Buffer.from(esperado);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

async function executar(req: Request) {
  const token = process.env.INGESTAO_TOKEN ?? '';
  const lembretes = process.env.LEMBRETES_TOKEN ?? '';
  const cron = process.env.CRON_SECRET ?? '';

  if (!token && !lembretes && !cron) {
    return NextResponse.json(
      { ok: false, erro: 'Segredo de cron ausente no ambiente.' },
      { status: 503 },
    );
  }

  const doCabecalho = req.headers.get('x-psy-token') ?? '';
  const doBearer = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');

  const autorizado =
    (token.length >= 16 && (confere(doCabecalho, token) || confere(doBearer, token))) ||
    (lembretes.length >= 16 && (confere(doCabecalho, lembretes) || confere(doBearer, lembretes))) ||
    (cron.length >= 16 && confere(doBearer, cron));

  if (!autorizado) {
    return NextResponse.json({ ok: false, erro: 'Não autorizado.' }, { status: 401 });
  }

  const saldos = await consultarSaldosMidia({
    notificarNoPainel: true,
    notificarNoWhatsapp: true,
  });

  return NextResponse.json({
    ok: true,
    verificadas: saldos.length,
    criticas: saldos.filter((s) => s.nivel === 'zerado' || s.nivel === 'critico').length,
  });
}

export const GET = executar;
export const POST = executar;
