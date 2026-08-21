import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { clienteServico } from '@/lib/supabase/servico';

/**
 * A rotina que gera os lembretes do dia.
 *
 * ============================================================
 * POR QUE UMA ROTA, E NÃO UM GATILHO NO BANCO
 * ============================================================
 * O Postgres não sabe que horas são "de manhã em Brasília" sem alguém
 * chamá-lo. Um gatilho dispara quando uma linha muda — e o caso aqui é
 * o oposto: nada mudou, o dia é que passou.
 *
 * Então quem acorda é o cron da Vercel (ver `vercel.json`), e ele bate
 * nesta rota. O trabalho inteiro acontece dentro de `gerar_lembretes()`,
 * no banco: a decisão de "isto merece aviso" fica num lugar só, e vale
 * igual para quem chamar.
 *
 * ============================================================
 * IDEMPOTENTE DE PROPÓSITO
 * ============================================================
 * O cron pode repetir, a chamada pode ser refeita à mão, e o Vercel
 * pode executar duas vezes numa janela de deploy. A chave única em
 * (perfil, chave) faz cada repetição não criar nada — e a chave carrega
 * o DIA, então uma tarefa que segue atrasada rende um aviso por dia,
 * que é o comportamento certo, e não um por execução.
 *
 * ============================================================
 * AUTENTICAÇÃO
 * ============================================================
 * `LEMBRETES_TOKEN` no cabeçalho `x-psy-token`. Sem token configurado a
 * rota RECUSA tudo: falha fechada. O cron da Vercel também manda
 * `Authorization: Bearer <CRON_SECRET>`, e os dois caminhos são aceitos
 * — quem dispara à mão usa o primeiro, o cron usa o segundo.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function confere(recebido: string, esperado: string) {
  const a = Buffer.from(recebido);
  const b = Buffer.from(esperado);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function autorizado(req: Request) {
  const token = process.env.LEMBRETES_TOKEN;
  const cron = process.env.CRON_SECRET;

  /* Sem nenhum segredo configurado, ninguém entra. Uma rota que dispara
     escrita no banco e aceita qualquer um é convite para encher a caixa
     de avisos de todo mundo. */
  if (!token && !cron) return null;

  const recebido = req.headers.get('x-psy-token') ?? '';
  if (token && recebido && confere(recebido, token)) return true;

  const auth = req.headers.get('authorization') ?? '';
  if (cron && auth.startsWith('Bearer ') && confere(auth.slice(7), cron)) return true;

  return false;
}

async function executar(req: Request) {
  const ok = autorizado(req);

  if (ok === null) {
    return NextResponse.json(
      {
        ok: false,
        erro: 'Sem LEMBRETES_TOKEN nem CRON_SECRET no ambiente. A rotina não roda sem segredo.',
      },
      { status: 503 },
    );
  }

  if (!ok) {
    return NextResponse.json({ ok: false, erro: 'Não autorizado.' }, { status: 401 });
  }

  const supabase = clienteServico();
  const { data, error } = await supabase.rpc('gerar_lembretes');

  if (error) {
    console.error('[lembretes]', error.message);
    return NextResponse.json({ ok: false, erro: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, criados: Number(data ?? 0) });
}

/* O cron da Vercel chama por GET. O POST existe para disparo manual e
   para qualquer automação de fora que prefira mandar corpo. */
export const GET = executar;
export const POST = executar;
