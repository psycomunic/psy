import type { LinhaMetrica } from '../csv.ts';

/**
 * Google Ads e GA4.
 *
 * Ficam no mesmo arquivo porque compartilham a única parte chata: o
 * token de acesso do Google dura uma hora, e quem dura é o
 * `refresh_token`. Toda chamada começa trocando um pelo outro.
 *
 * Como na Meta, o mapeamento é puro e testado, e a chamada HTTP não é.
 */

const VERSAO_ADS = 'v18';

/* ================================================================== */
/* Token                                                              */
/* ================================================================== */

export type SegredoGoogle = {
  refresh_token: string;
  client_id: string;
  client_secret: string;
  /** Só o Google Ads exige. O GA4 não usa. */
  developer_token?: string;
};

export async function tokenDeAcesso(s: SegredoGoogle): Promise<string> {
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: s.refresh_token,
      client_id: s.client_id,
      client_secret: s.client_secret,
    }),
    cache: 'no-store',
  });

  const corpo = (await r.json().catch(() => null)) as
    | { access_token?: string; error_description?: string; error?: string }
    | null;

  if (!r.ok || !corpo?.access_token) {
    /* `invalid_grant` aqui quer dizer que o refresh token foi revogado
       ou expirou — é o erro que aparece quando alguém tira o acesso do
       app na conta Google. Repassar a mensagem crua poupa meia hora de
       adivinhação no dia em que acontecer. */
    throw new Error(
      `Google OAuth: ${corpo?.error_description ?? corpo?.error ?? `HTTP ${r.status}`}`,
    );
  }

  return corpo.access_token;
}

/* ================================================================== */
/* Google Ads                                                         */
/* ================================================================== */

type LinhaAds = {
  segments?: { date?: string };
  metrics?: {
    costMicros?: string | number;
    clicks?: string | number;
    impressions?: string | number;
    conversionsValue?: string | number;
  };
};

const num = (v: unknown): number => {
  const n = typeof v === 'string' ? Number(v) : typeof v === 'number' ? v : 0;
  return Number.isFinite(n) && n > 0 ? n : 0;
};

export function mapearAds(resposta: unknown): LinhaMetrica[] {
  /* `searchStream` responde um ARRAY de blocos, cada um com `results`.
     A versão não-stream responde um objeto só. Aceitar os dois evita
     que trocar de endpoint quebre o mapeamento. */
  const blocos = Array.isArray(resposta) ? resposta : [resposta];
  const linhas: LinhaMetrica[] = [];

  for (const bloco of blocos) {
    const results = (bloco as { results?: LinhaAds[] })?.results;
    if (!Array.isArray(results)) continue;

    for (const r of results) {
      const dia = r.segments?.date;
      if (!dia || !/^\d{4}-\d{2}-\d{2}$/.test(dia)) continue;

      const m = r.metrics ?? {};

      linhas.push({
        dia,
        canal: 'google',
        /* Micros. 1.234.560 micros = R$ 1,23456, que arredonda para
           R$ 1,23. Dividir errado aqui erra a verba por um fator de um
           milhão, e o MER da conta iria para zero sem explicação. */
        investimento: Number((num(m.costMicros) / 1_000_000).toFixed(2)),
        cliques: Math.round(num(m.clicks)),
        impressoes: Math.round(num(m.impressions)),
        receita_atribuida: Number(num(m.conversionsValue).toFixed(2)),
      });
    }
  }

  return linhas;
}

export async function buscarAds({
  segredo,
  configuracao,
  identificador,
  de,
  ate,
}: {
  segredo: SegredoGoogle;
  configuracao: Record<string, unknown>;
  identificador: string;
  de: string;
  ate: string;
}): Promise<unknown> {
  if (!segredo.developer_token) {
    throw new Error('Google Ads: falta o developer token na credencial da agência.');
  }

  const cliente = identificador.replace(/\D/g, '');
  if (!cliente) throw new Error('Google Ads: identificador da conta vazio ou inválido.');

  const acesso = await tokenDeAcesso(segredo);

  const cabecalhos: Record<string, string> = {
    authorization: `Bearer ${acesso}`,
    'developer-token': segredo.developer_token,
    'content-type': 'application/json',
  };

  /* A conta gerenciadora (MCC) precisa se identificar, ou a API recusa
     acesso à conta do cliente mesmo com o vínculo feito. */
  const mcc = String(configuracao.login_customer_id ?? '').replace(/\D/g, '');
  if (mcc) cabecalhos['login-customer-id'] = mcc;

  const consulta = `
    SELECT segments.date,
           metrics.cost_micros,
           metrics.clicks,
           metrics.impressions,
           metrics.conversions_value
    FROM customer
    WHERE segments.date BETWEEN '${de}' AND '${ate}'
  `;

  const r = await fetch(
    `https://googleads.googleapis.com/${VERSAO_ADS}/customers/${cliente}/googleAds:searchStream`,
    {
      method: 'POST',
      headers: cabecalhos,
      body: JSON.stringify({ query: consulta }),
      cache: 'no-store',
    },
  );

  const corpo = await r.json().catch(() => null);

  if (!r.ok) {
    const e = corpo as { error?: { message?: string } } | { error?: { message?: string } }[];
    const msg = Array.isArray(e)
      ? e[0]?.error?.message
      : (e as { error?: { message?: string } })?.error?.message;
    throw new Error(`Google Ads: ${msg ?? `HTTP ${r.status}`}`);
  }

  return corpo;
}

/* ================================================================== */
/* GA4                                                                */
/* ================================================================== */

/**
 * Do nome de canal do GA4 para o nosso.
 *
 * Precisa bater com o que o Google Ads e a Meta gravam, senão a mesma
 * origem vira duas linhas: uma com a sessão e outra com a verba, e o
 * ROAS por canal fica dividido pela metade em cada.
 */
const CANAL_GA4: Record<string, string> = {
  'organic search': 'organico',
  'direct': 'direto',
  'paid search': 'google',
  'cross-network': 'google',
  'display': 'google',
  'paid social': 'meta',
  'organic social': 'social',
  'referral': 'referencia',
  'email': 'email',
  'affiliates': 'afiliados',
  'unassigned': 'nao_atribuido',
};

export function canalDoGa4(bruto: string): string {
  const chave = bruto.trim().toLowerCase();
  if (CANAL_GA4[chave]) return CANAL_GA4[chave];
  return chave.replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') || 'nao_atribuido';
}

/** GA4 devolve data como `20260819`. */
export function diaDoGa4(bruto: string): string | null {
  const m = bruto.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (!m) return null;
  return `${m[1]}-${m[2]}-${m[3]}`;
}

type LinhaGa4 = {
  dimensionValues?: { value?: string }[];
  metricValues?: { value?: string }[];
};

export function mapearGa4(resposta: unknown): LinhaMetrica[] {
  const rows = (resposta as { rows?: LinhaGa4[] })?.rows;
  if (!Array.isArray(rows)) return [];

  /* Um dia pode vir repartido em vários canais, e dois canais do GA4
     podem cair no mesmo canal nosso — "Display" e "Cross-network" viram
     os dois `google`. Somar aqui evita que o segundo sobrescreva o
     primeiro na gravação. */
  const porChave = new Map<string, LinhaMetrica>();

  for (const r of rows) {
    const dia = diaDoGa4(r.dimensionValues?.[0]?.value ?? '');
    if (!dia) continue;

    const canal = canalDoGa4(r.dimensionValues?.[1]?.value ?? '');
    const sessoes = Math.round(num(r.metricValues?.[0]?.value));

    const chave = `${dia}|${canal}`;
    const atual = porChave.get(chave);

    if (atual) atual.sessoes = (atual.sessoes ?? 0) + sessoes;
    else porChave.set(chave, { dia, canal, sessoes });
  }

  return [...porChave.values()].sort((a, b) => a.dia.localeCompare(b.dia));
}

export async function buscarGa4({
  segredo,
  identificador,
  de,
  ate,
}: {
  segredo: SegredoGoogle;
  identificador: string;
  de: string;
  ate: string;
}): Promise<unknown> {
  const propriedade = identificador.replace(/\D/g, '');
  if (!propriedade) throw new Error('GA4: identificador da propriedade vazio ou inválido.');

  const acesso = await tokenDeAcesso(segredo);

  const r = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propriedade}:runReport`,
    {
      method: 'POST',
      headers: {
        authorization: `Bearer ${acesso}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        dimensions: [{ name: 'date' }, { name: 'sessionDefaultChannelGroup' }],
        metrics: [{ name: 'sessions' }],
        dateRanges: [{ startDate: de, endDate: ate }],
        limit: 5000,
      }),
      cache: 'no-store',
    },
  );

  const corpo = await r.json().catch(() => null);

  if (!r.ok) {
    const msg = (corpo as { error?: { message?: string } })?.error?.message;
    throw new Error(`GA4: ${msg ?? `HTTP ${r.status}`}`);
  }

  return corpo;
}
