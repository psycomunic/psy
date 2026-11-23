import type { LinhaMetrica, LinhaCampanha, ObjetivoCampanha } from '../csv.ts';

/**
 * Google Ads e GA4.
 *
 * Ficam no mesmo arquivo porque compartilham a troca de `refresh_token`
 * por `access_token` de uma hora. O mapeamento é puro e testado.
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
  campaign?: {
    id?: string | number;
    name?: string;
    status?: string;
    advertisingChannelType?: string;
  };
  metrics?: {
    costMicros?: string | number;
    clicks?: string | number;
    impressions?: string | number;
    conversions?: string | number;
    conversionsValue?: string | number;
    videoViews?: string | number;
    interactions?: string | number;
  };
};

export type RespostaAdsCompleta = {
  conta?: unknown;
  campanhas?: unknown;
};

const num = (v: unknown): number => {
  const n = typeof v === 'string' ? Number(v) : typeof v === 'number' ? v : 0;
  return Number.isFinite(n) && n > 0 ? n : 0;
};

function extrairBlocos(resposta: unknown, chave?: 'conta' | 'campanhas'): unknown[] {
  if (!resposta || typeof resposta !== 'object') return [];
  if (chave && chave in (resposta as Record<string, unknown>)) {
    const sub = (resposta as RespostaAdsCompleta)[chave];
    if (!sub) return [];
    return Array.isArray(sub) ? sub : [sub];
  }
  return Array.isArray(resposta) ? resposta : [resposta];
}

export function classificarObjetivoAds(
  canalAds: string | undefined,
  nomeCampanha: string | undefined,
  conversoes: number,
  valorConversao: number,
  viewsVideo: number,
): ObjetivoCampanha {
  const tipo = (canalAds ?? '').toUpperCase();
  const nome = (nomeCampanha ?? '').toLowerCase();

  if (/whats|wpp|mensag|atendimento/.test(nome)) return 'mensagens';
  if (valorConversao > 0) return 'vendas';
  if (/lead|cadastro|captac|orcamento|agendamento/.test(nome) || conversoes > 0) return 'leads';
  if (tipo === 'VIDEO' || viewsVideo > 0) return 'video';
  if (tipo === 'DISPLAY') return 'alcance';
  return 'trafego';
}

export function mapearAds(resposta: unknown): LinhaMetrica[] {
  const blocos = extrairBlocos(resposta, 'conta');
  const linhas: LinhaMetrica[] = [];

  for (const bloco of blocos) {
    const results = (bloco as { results?: LinhaAds[] })?.results;
    if (!Array.isArray(results)) continue;

    for (const r of results) {
      const dia = r.segments?.date;
      if (!dia || !/^\d{4}-\d{2}-\d{2}$/.test(dia)) continue;

      const m = r.metrics ?? {};
      const cliques = Math.round(num(m.clicks));
      const conversoes = Math.round(num(m.conversions));
      const receitaAtribuida = Number(num(m.conversionsValue).toFixed(2));
      const temValorVenda = receitaAtribuida > 0;

      linhas.push({
        dia,
        canal: 'google',
        investimento: Number((num(m.costMicros) / 1_000_000).toFixed(2)),
        cliques,
        cliques_link: cliques,
        impressoes: Math.round(num(m.impressions)),
        receita_atribuida: receitaAtribuida,
        compras_atribuidas: temValorVenda ? conversoes : 0,
        leads_captados: !temValorVenda ? conversoes : 0,
        visualizacoes_video: Math.round(num(m.videoViews)),
        engajamentos: Math.round(num(m.interactions)),
      });
    }
  }

  return linhas;
}

export function mapearCampanhasAds(resposta: unknown): LinhaCampanha[] {
  const blocos = extrairBlocos(resposta, 'campanhas');
  const campanhas: LinhaCampanha[] = [];

  for (const bloco of blocos) {
    const results = (bloco as { results?: LinhaAds[] })?.results;
    if (!Array.isArray(results)) continue;

    for (const r of results) {
      const dia = r.segments?.date;
      if (!dia || !/^\d{4}-\d{2}-\d{2}$/.test(dia)) continue;

      const id = String(r.campaign?.id ?? '').trim();
      if (!id) continue;

      const m = r.metrics ?? {};
      const nome = (r.campaign?.name ?? '').trim() || `Campanha ${id}`;
      const cliques = Math.round(num(m.clicks));
      const conversoes = Math.round(num(m.conversions));
      const receitaAtribuida = Number(num(m.conversionsValue).toFixed(2));
      const viewsVideo = Math.round(num(m.videoViews));
      const objetivo = classificarObjetivoAds(
        r.campaign?.advertisingChannelType,
        nome,
        conversoes,
        receitaAtribuida,
        viewsVideo,
      );

      campanhas.push({
        dia,
        canal: 'google',
        campanha_id: id,
        campanha_nome: nome,
        objetivo,
        status_campanha: r.campaign?.status,
        investimento: Number((num(m.costMicros) / 1_000_000).toFixed(2)),
        impressoes: Math.round(num(m.impressions)),
        alcance: 0,
        cliques,
        cliques_link: cliques,
        visitas_pagina: 0,
        conversas: objetivo === 'mensagens' ? conversoes : 0,
        leads_captados: objetivo === 'leads' ? conversoes : 0,
        compras_atribuidas: objetivo === 'vendas' ? conversoes : 0,
        receita_atribuida: receitaAtribuida,
        carrinhos: 0,
        checkouts: 0,
        engajamentos: Math.round(num(m.interactions)),
        visualizacoes_video: viewsVideo,
      });
    }
  }

  return campanhas;
}

async function consultarStream(
  cliente: string,
  cabecalhos: Record<string, string>,
  query: string,
): Promise<unknown> {
  const r = await fetch(
    `https://googleads.googleapis.com/${VERSAO_ADS}/customers/${cliente}/googleAds:searchStream`,
    {
      method: 'POST',
      headers: cabecalhos,
      body: JSON.stringify({ query }),
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
}): Promise<RespostaAdsCompleta> {
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

  const mcc = String(configuracao.login_customer_id ?? '').replace(/\D/g, '');
  if (mcc) cabecalhos['login-customer-id'] = mcc;

  const consultaConta = `
    SELECT segments.date,
           metrics.cost_micros,
           metrics.clicks,
           metrics.impressions,
           metrics.conversions,
           metrics.conversions_value,
           metrics.video_views,
           metrics.interactions
    FROM customer
    WHERE segments.date BETWEEN '${de}' AND '${ate}'
  `;

  const consultaCampanha = `
    SELECT campaign.id,
           campaign.name,
           campaign.status,
           campaign.advertising_channel_type,
           segments.date,
           metrics.cost_micros,
           metrics.clicks,
           metrics.impressions,
           metrics.conversions,
           metrics.conversions_value,
           metrics.video_views,
           metrics.interactions
    FROM campaign
    WHERE segments.date BETWEEN '${de}' AND '${ate}'
      AND metrics.impressions > 0
  `;

  const [conta, campanhas] = await Promise.all([
    consultarStream(cliente, cabecalhos, consultaConta),
    consultarStream(cliente, cabecalhos, consultaCampanha).catch(() => []),
  ]);

  return { conta, campanhas };
}

/* ================================================================== */
/* GA4                                                                */
/* ================================================================== */

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
