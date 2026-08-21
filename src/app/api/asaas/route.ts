import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { credencialAsaas, aplicarEventoAsaas } from '@/lib/cobranca/faturamento';

/**
 * O retorno do Asaas: webhook de pagamento.
 *
 * ============================================================
 * POR QUE ELE SEMPRE RESPONDE 200 QUANDO O TOKEN CONFERE
 * ============================================================
 * O Asaas trata resposta diferente de 2xx como falha e reenfileira o
 * evento, com espera crescente. Se um evento que a gente não sabe
 * tratar devolvesse 500, ele voltaria de hora em hora para sempre — e,
 * pior, o Asaas SUSPENDE a fila inteira depois de muitas falhas
 * seguidas. Um evento estranho derrubaria a confirmação de pagamento de
 * todos os outros clientes.
 *
 * Então: token errado é 401, corpo ilegível é 400, e todo o resto é
 * 200 com o que aconteceu registrado em `cobranca_evento`. "Recebi e
 * guardei" é verdade mesmo quando o evento não se aplica a nada.
 *
 * ============================================================
 * AUTENTICAÇÃO
 * ============================================================
 * O Asaas manda o token configurado no painel deles no cabeçalho
 * `asaas-access-token`. Sem token configurado na credencial, a rota
 * RECUSA tudo: falha fechada. Um webhook de pagamento aberto aceita
 * qualquer um dizendo "esta fatura foi paga", e a agência para de
 * cobrar um cliente que não pagou.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function confere(recebido: string, esperado: string) {
  const a = Buffer.from(recebido);
  const b = Buffer.from(esperado);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  const cred = await credencialAsaas();

  if (!cred) {
    return NextResponse.json(
      { ok: false, erro: 'Asaas não conectado.' },
      { status: 503 },
    );
  }

  if (!cred.webhookToken) {
    return NextResponse.json(
      {
        ok: false,
        erro:
          'Webhook sem token. Configure o mesmo token aqui e no Asaas antes de ligar o retorno.',
      },
      { status: 503 },
    );
  }

  const recebido = req.headers.get('asaas-access-token') ?? '';
  if (!confere(recebido, cred.webhookToken)) {
    return NextResponse.json({ ok: false, erro: 'Não autorizado.' }, { status: 401 });
  }

  let corpo: unknown;
  try {
    corpo = await req.json();
  } catch {
    return NextResponse.json({ ok: false, erro: 'Corpo não é JSON.' }, { status: 400 });
  }

  try {
    const r = await aplicarEventoAsaas(corpo as Parameters<typeof aplicarEventoAsaas>[0]);
    return NextResponse.json({ ok: true, mensagem: r.mensagem });
  } catch (e) {
    /* Erro nosso, e não do evento. Ainda assim 200: reenviar não vai
       consertar um defeito de código, e a fila do Asaas não pode ficar
       presa por causa dele. O erro vai para o log do servidor. */
    console.error('[asaas webhook]', (e as Error).message);
    return NextResponse.json({ ok: true, mensagem: 'Evento recebido.' });
  }
}

/** GET diz se a rota está de pé, sem revelar nada. */
export async function GET() {
  const cred = await credencialAsaas();
  return NextResponse.json({
    pronta: Boolean(cred?.webhookToken),
    ambiente: cred?.ambiente ?? null,
  });
}
