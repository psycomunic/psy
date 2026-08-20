import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { gravarMetricas } from '@/lib/ingestao/registrar';
import type { LinhaMetrica } from '@/lib/ingestao/csv';

/**
 * A porta de entrada de métrica vinda de fora.
 *
 * Existe para o que a agência já usa hoje: a Merge dispara uma
 * automação a partir da Magazord ou da Shopify e manda o dia fechado
 * para cá. Não depende de nenhum conector escrito por nós, e é o mesmo
 * caminho que os conectores vão usar quando existirem.
 *
 * ============================================================
 * POR QUE NÃO TEM LOGIN
 * ============================================================
 * Quem chama é máquina, e máquina não faz login. A autenticação é um
 * segredo compartilhado no cabeçalho, comparado em tempo constante.
 *
 * Sem `INGESTAO_TOKEN` no ambiente, a rota responde 503 e não grava
 * nada. Falha FECHADA: um deploy sem a variável deixaria a rota aberta
 * se o padrão fosse "sem token, sem checagem", e uma rota aberta aqui
 * escreve no faturamento de qualquer cliente.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const esquema = z.object({
  conta_id: z.uuid('conta_id precisa ser um uuid.'),
  provedor: z.enum([
    'loja', 'magazord', 'shopify',
    'ga4', 'analytics',
    'google_ads', 'meta_ads', 'tiktok_ads',
  ]),
  linhas: z
    .array(
      z.object({
        dia: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'dia precisa ser aaaa-mm-dd.'),
        canal: z.string().trim().min(1).optional(),
        sessoes: z.number().nonnegative().optional(),
        pedidos_captados: z.number().nonnegative().optional(),
        pedidos_aprovados: z.number().nonnegative().optional(),
        receita: z.number().nonnegative().optional(),
        receita_bruta: z.number().nonnegative().optional(),
        /* Parcela de frete JÁ CONTIDA em `receita`. */
        frete: z.number().nonnegative().optional(),
        novos_clientes: z.number().nonnegative().optional(),
        investimento: z.number().nonnegative().optional(),
        cliques: z.number().nonnegative().optional(),
        impressoes: z.number().nonnegative().optional(),
        receita_atribuida: z.number().nonnegative().optional(),
      }),
    )
    .min(1, 'Mande pelo menos uma linha.')
    .max(1000, 'Mande no máximo mil linhas por chamada.'),
});

/** Comparação em tempo constante. `===` em segredo vaza o tamanho do
    prefixo certo pelo tempo de resposta, e isso é atacável. */
function segredoConfere(recebido: string, esperado: string) {
  const a = Buffer.from(recebido);
  const b = Buffer.from(esperado);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  const esperado = process.env.INGESTAO_TOKEN;

  if (!esperado || esperado.length < 24) {
    return NextResponse.json(
      { ok: false, erro: 'Ingestão desligada: INGESTAO_TOKEN ausente ou curto demais.' },
      { status: 503 },
    );
  }

  const recebido = req.headers.get('x-psy-token') ?? '';
  if (!segredoConfere(recebido, esperado)) {
    /* Mensagem genérica de propósito: dizer "token errado" versus
       "conta inexistente" ajuda quem está tentando adivinhar. */
    return NextResponse.json({ ok: false, erro: 'Não autorizado.' }, { status: 401 });
  }

  let corpo: unknown;
  try {
    corpo = await req.json();
  } catch {
    return NextResponse.json({ ok: false, erro: 'Corpo não é JSON.' }, { status: 400 });
  }

  const v = esquema.safeParse(corpo);
  if (!v.success) {
    return NextResponse.json(
      { ok: false, erro: v.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(' · ') },
      { status: 400 },
    );
  }

  const r = await gravarMetricas({
    contaId: v.data.conta_id,
    provedor: v.data.provedor,
    linhas: v.data.linhas as LinhaMetrica[],
    origem: 'cron',
  });

  return NextResponse.json(
    {
      ok: r.ok,
      sincronizacao: r.sincronizacaoId,
      lidas: r.lidas,
      gravadas: r.gravadas,
      mensagem: r.mensagem,
    },
    { status: r.ok ? 200 : 422 },
  );
}

/** GET existe só para dizer que a rota está de pé, sem revelar nada. */
export async function GET() {
  const pronta = Boolean(process.env.INGESTAO_TOKEN);
  return NextResponse.json({ pronta }, { status: pronta ? 200 : 503 });
}
