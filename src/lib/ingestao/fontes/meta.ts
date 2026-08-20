import type { LinhaMetrica } from '../csv.ts';

/**
 * Meta Marketing API — insights da conta de anúncio.
 *
 * A conta do cliente é vinculada à BM da agência, então o token é UM só
 * e vale para todas. O que muda por loja é o `act_<id>`.
 *
 * O arquivo está partido em duas metades de propósito:
 *
 *   `mapear()` é PURA e testada. É onde mora todo o entendimento sobre
 *   o formato da resposta, e é onde os erros de fato acontecem —
 *   número que vem como texto, campo de conversão que muda de nome,
 *   dia que volta fora da ordem.
 *
 *   `buscar()` é a chamada HTTP, e não tem teste: testar significaria
 *   inventar o que a API responde, e o que se aprenderia seria o que eu
 *   imaginei, não o que ela faz.
 */

const VERSAO_API = 'v21.0';

/** O formato que a Graph API devolve com `time_increment=1`. */
type LinhaMeta = {
  date_start?: string;
  spend?: string | number;
  impressions?: string | number;
  clicks?: string | number;
  action_values?: { action_type?: string; value?: string | number }[];
};

/**
 * Qual conversão conta como receita.
 *
 * `omni_purchase` é a compra consolidada, somando site, app e loja
 * física. É a que o gerenciador mostra como "Valor de conversão de
 * compras", e é a que o gestor de tráfego tem na cabeça quando fala em
 * ROAS.
 *
 * A ordem importa: a lista vem com vários tipos ao mesmo tempo, e somar
 * todos contaria a mesma compra duas ou três vezes.
 */
const COMPRA_EM_ORDEM = [
  'omni_purchase',
  'purchase',
  'offsite_conversion.fb_pixel_purchase',
];

const numero = (v: unknown): number => {
  /* A Graph API manda número como STRING, sempre. `spend: "1234.56"`. */
  const n = typeof v === 'string' ? Number(v) : typeof v === 'number' ? v : 0;
  return Number.isFinite(n) && n > 0 ? n : 0;
};

export function receitaDeCompra(valores: LinhaMeta['action_values']): number {
  if (!Array.isArray(valores)) return 0;

  for (const tipo of COMPRA_EM_ORDEM) {
    const achado = valores.find((v) => v.action_type === tipo);
    if (achado) return Number(numero(achado.value).toFixed(2));
  }
  return 0;
}

export function mapear(resposta: unknown): LinhaMetrica[] {
  const dados = (resposta as { data?: LinhaMeta[] })?.data;
  if (!Array.isArray(dados)) return [];

  const linhas: LinhaMetrica[] = [];

  for (const d of dados) {
    /* Sem dia, a linha não tem onde ser gravada. Descartar é o certo, e
       o total de descartes aparece no log da sincronização. */
    if (!d.date_start || !/^\d{4}-\d{2}-\d{2}$/.test(d.date_start)) continue;

    linhas.push({
      dia: d.date_start,
      canal: 'meta',
      investimento: Number(numero(d.spend).toFixed(2)),
      cliques: Math.round(numero(d.clicks)),
      impressoes: Math.round(numero(d.impressions)),
      receita_atribuida: receitaDeCompra(d.action_values),
    });
  }

  return linhas;
}

/* ------------------------------------------------------------------ */

export type SegredoMeta = { access_token: string };

export async function buscar({
  segredo,
  identificador,
  de,
  ate,
}: {
  segredo: SegredoMeta;
  identificador: string;
  de: string;
  ate: string;
}): Promise<unknown> {
  /* O identificador pode vir com ou sem o prefixo. Exigir o formato
     exato só transformaria um detalhe em chamado de suporte. */
  const conta = identificador.startsWith('act_') ? identificador : `act_${identificador}`;

  const url = new URL(`https://graph.facebook.com/${VERSAO_API}/${conta}/insights`);
  url.searchParams.set('fields', 'spend,impressions,clicks,action_values');
  url.searchParams.set('time_range', JSON.stringify({ since: de, until: ate }));
  url.searchParams.set('time_increment', '1');
  url.searchParams.set('level', 'account');
  url.searchParams.set('limit', '500');

  /* O token vai no CABEÇALHO, e não na query. Query string entra em log
     de servidor, em histórico de proxy e no Referer. */
  const r = await fetch(url, {
    headers: { authorization: `Bearer ${segredo.access_token}` },
    cache: 'no-store',
  });

  const corpo = await r.json().catch(() => null);

  if (!r.ok) {
    const msg =
      (corpo as { error?: { message?: string } })?.error?.message ??
      `HTTP ${r.status}`;
    throw new Error(`Meta: ${msg}`);
  }

  return corpo;
}
