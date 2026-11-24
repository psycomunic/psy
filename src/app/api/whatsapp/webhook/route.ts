import { NextRequest, NextResponse } from 'next/server';
import { bancoConfigurado } from '@/lib/supabase/ambiente';
import { clienteServico } from '@/lib/supabase/servico';

/**
 * Webhook opcional da Meta WhatsApp Cloud API (`/api/whatsapp/webhook`):
 * - `GET`: valida `hub.challenge` usando `WHATSAPP_VERIFY_TOKEN` ou `PSY_CRON_TOKEN`.
 * - `POST`: recebe eventos assíncronos `statuses` (`delivered`, `read`, `failed`)
 *   e atualiza o registro em `whatsapp_enviado` caso a Meta recuse a entrega após o HTTP 200.
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  const esperado =
    process.env.WHATSAPP_VERIFY_TOKEN || process.env.PSY_CRON_TOKEN || 'psy_whatsapp_verify';

  if (mode === 'subscribe' && token === esperado && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ erro: 'Token de verificação inválido.' }, { status: 403 });
}

export async function POST(req: NextRequest) {
  const corpo = (await req.json().catch(() => null)) as {
    entry?: {
      changes?: {
        value?: {
          statuses?: {
            id?: string;
            status?: string;
            errors?: { code?: number; title?: string; error_data?: { details?: string } }[];
          }[];
        };
      }[];
    }[];
  } | null;

  if (!corpo || !bancoConfigurado) {
    return NextResponse.json({ ok: true });
  }

  const statuses = (corpo.entry ?? [])
    .flatMap((e) => e.changes ?? [])
    .flatMap((c) => c.value?.statuses ?? []);

  if (statuses.length > 0) {
    const supabase = clienteServico();
    for (const st of statuses) {
      if (!st.id) continue;
      if (st.status === 'failed') {
        const er = st.errors?.[0];
        const detalhe = er
          ? `Meta #${er.code ?? '?'}: ${er.error_data?.details ?? er.title ?? 'Falha na entrega'}`
          : 'Falha assíncrona na entrega do WhatsApp';

        await supabase
          .from('whatsapp_enviado')
          .update({ status: 'falhou', erro: detalhe })
          .eq('provedor_id', st.id)
          .then(() => undefined, () => undefined);
      }
    }
  }

  return NextResponse.json({ ok: true });
}
