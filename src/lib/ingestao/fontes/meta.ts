import type { LinhaMetrica, LinhaCampanha, ObjetivoCampanha } from '../csv.ts';

/**
 * Meta Marketing API — insights consolidados da conta e abertos por campanha.
 *
 * A conta do cliente é vinculada à BM da agência, então o token é UM só
 * e vale para todas. O que muda por cliente é o `act_<id>`.
 *
 * O arquivo separa mapeamento puro (testado com carga sintética) e
 * transporte HTTP: toda regra de não-duplicação de conversões da Meta
 * mora nas listas de precedência abaixo.
 */

const VERSAO_API = 'v21.0';

type AcaoMeta = { action_type?: string; value?: string | number };

/** O formato que a Graph API devolve com `time_increment=1`. */
type LinhaMeta = {
  date_start?: string;
  campaign_id?: string;
  campaign_name?: string;
  objective?: string;
  spend?: string | number;
  impressions?: string | number;
  reach?: string | number;
  clicks?: string | number;
  inline_link_clicks?: string | number;
  actions?: AcaoMeta[];
  action_values?: AcaoMeta[];
};

export type RespostaMetaCompleta = {
  conta?: unknown;
  campanhas?: unknown;
};

/**
 * Precedências de conversão sem dupla contagem.
 *
 * A Graph API devolve a mesma ação com dois ou três nomes na mesma linha
 * (ex.: `omni_purchase`, `purchase` e `offsite_conversion.fb_pixel_purchase`).
 * Somar todas multiplica o resultado por dois ou três; pegar a primeira
 * disponível na hierarquia oficial espelha o Gerenciador de Anúncios.
 */
const COMPRA_EM_ORDEM = [
  'omni_purchase',
  'purchase',
  'offsite_conversion.fb_pixel_purchase',
];

const CONVERSA_EM_ORDEM = [
  'onsite_conversion.messaging_conversation_started_7d',
  'onsite_conversion.total_messaging_connection',
  'onsite_conversion.messaging_first_reply',
];

const LEAD_EM_ORDEM = [
  'lead',
  'onsite_conversion.lead_grouped',
  'offsite_conversion.fb_pixel_lead',
  'complete_registration',
  'offsite_conversion.fb_pixel_complete_registration',
  'schedule',
  'contact',
];

const VISITA_LP_EM_ORDEM = [
  'omni_landing_page_view',
  'landing_page_view',
];

const CARRINHO_EM_ORDEM = [
  'omni_add_to_cart',
  'add_to_cart',
  'offsite_conversion.fb_pixel_add_to_cart',
];

const CHECKOUT_EM_ORDEM = [
  'omni_initiated_checkout',
  'initiate_checkout',
  'offsite_conversion.fb_pixel_initiate_checkout',
];

const ENGAJAMENTO_EM_ORDEM = [
  'post_engagement',
  'page_engagement',
];

const VIDEO_EM_ORDEM = [
  'video_thruplay_watched_actions',
  'video_p75_watched_actions',
  'video_view',
];

const CLIQUE_LINK_EM_ORDEM = [
  'link_click',
];

const numero = (v: unknown): number => {
  /* A Graph API manda número como STRING, sempre. `spend: "1234.56"`. */
  const n = typeof v === 'string' ? Number(v) : typeof v === 'number' ? v : 0;
  return Number.isFinite(n) && n > 0 ? n : 0;
};

export function acaoPorOrdem(lista: AcaoMeta[] | undefined, ordem: readonly string[]): number {
  if (!Array.isArray(lista)) return 0;
  for (const tipo of ordem) {
    const achado = lista.find((v) => v.action_type === tipo);
    if (achado) return numero(achado.value);
  }
  return 0;
}

export function receitaDeCompra(valores: LinhaMeta['action_values']): number {
  return Number(acaoPorOrdem(valores, COMPRA_EM_ORDEM).toFixed(2));
}

function extrairMetricasComuns(d: LinhaMeta) {
  const cliques = Math.round(numero(d.clicks));
  const cliquesLinkDireto = Math.round(numero(d.inline_link_clicks));
  const cliquesLinkAcao = Math.round(acaoPorOrdem(d.actions, CLIQUE_LINK_EM_ORDEM));
  const cliquesLink = cliquesLinkDireto > 0 ? cliquesLinkDireto : cliquesLinkAcao;

  return {
    investimento: Number(numero(d.spend).toFixed(2)),
    impressoes: Math.round(numero(d.impressions)),
    alcance: Math.round(numero(d.reach)),
    cliques,
    cliques_link: cliquesLink,
    visitas_pagina: Math.round(acaoPorOrdem(d.actions, VISITA_LP_EM_ORDEM)),
    conversas: Math.round(acaoPorOrdem(d.actions, CONVERSA_EM_ORDEM)),
    leads_captados: Math.round(acaoPorOrdem(d.actions, LEAD_EM_ORDEM)),
    compras_atribuidas: Math.round(acaoPorOrdem(d.actions, COMPRA_EM_ORDEM)),
    receita_atribuida: receitaDeCompra(d.action_values),
    carrinhos: Math.round(acaoPorOrdem(d.actions, CARRINHO_EM_ORDEM)),
    checkouts: Math.round(acaoPorOrdem(d.actions, CHECKOUT_EM_ORDEM)),
    engajamentos: Math.round(acaoPorOrdem(d.actions, ENGAJAMENTO_EM_ORDEM)),
    visualizacoes_video: Math.round(acaoPorOrdem(d.actions, VIDEO_EM_ORDEM)),
  };
}

/**
 * Classifica o objetivo real da campanha.
 *
 * Na Meta ODAX (v21), campanhas de clique para WhatsApp e Direct saem quase
 * sempre com `OUTCOME_ENGAGEMENT`, `OUTCOME_TRAFFIC` ou `OUTCOME_LEADS`.
 * Olhar só o nome do enum jogaria campanhas de WhatsApp em "Engajamento"
 * e esconderia o custo por conversa. Quando a campanha gerou conversas
 * (ou declara WhatsApp/Direct no nome), ela entra como `mensagens`.
 */
export function classificarObjetivoMeta(
  objetivoBruto: string | undefined,
  nomeCampanha: string | undefined,
  m: { conversas: number; leads_captados: number; compras_atribuidas: number; visualizacoes_video: number },
): ObjetivoCampanha {
  const obj = (objetivoBruto ?? '').trim().toUpperCase();
  const nome = (nomeCampanha ?? '').toLowerCase();
  const pareceMensagem = /whats|wpp|mensag|direct|inbox|atendimento/.test(nome);

  if (obj === 'MESSAGES') return 'mensagens';
  if (obj === 'OUTCOME_SALES' || obj === 'CONVERSIONS' || obj === 'PRODUCT_CATALOG_SALES') {
    if (m.compras_atribuidas === 0 && m.conversas > 0 && pareceMensagem) return 'mensagens';
    return 'vendas';
  }
  if (obj === 'OUTCOME_LEADS' || obj === 'LEAD_GENERATION') {
    if (m.conversas > 0 && m.leads_captados === 0) return 'mensagens';
    return 'leads';
  }
  if (obj === 'OUTCOME_AWARENESS' || obj === 'REACH' || obj === 'BRAND_AWARENESS') {
    return 'alcance';
  }
  if (obj === 'VIDEO_VIEWS') return 'video';
  if (obj === 'OUTCOME_TRAFFIC' || obj === 'LINK_CLICKS') {
    if (m.conversas > 0 || pareceMensagem) return 'mensagens';
    return 'trafego';
  }
  if (obj === 'OUTCOME_ENGAGEMENT' || obj === 'POST_ENGAGEMENT' || obj === 'PAGE_LIKES') {
    if (m.conversas > 0 || pareceMensagem) return 'mensagens';
    return 'engajamento';
  }

  if (m.compras_atribuidas > 0) return 'vendas';
  if (m.conversas > 0 || pareceMensagem) return 'mensagens';
  if (m.leads_captados > 0) return 'leads';
  return 'outro';
}

function extrairLista(resposta: unknown, chavePacote: 'conta' | 'campanhas'): LinhaMeta[] {
  if (!resposta || typeof resposta !== 'object') return [];
  if (chavePacote in (resposta as Record<string, unknown>)) {
    const sub = (resposta as RespostaMetaCompleta)[chavePacote];
    const dados = (sub as { data?: LinhaMeta[] })?.data;
    return Array.isArray(dados) ? dados : [];
  }
  const dados = (resposta as { data?: LinhaMeta[] })?.data;
  return Array.isArray(dados) ? dados : [];
}

export function mapear(resposta: unknown): LinhaMetrica[] {
  const dados = extrairLista(resposta, 'conta');
  const linhas: LinhaMetrica[] = [];

  for (const d of dados) {
    if (!d.date_start || !/^\d{4}-\d{2}-\d{2}$/.test(d.date_start)) continue;

    linhas.push({
      dia: d.date_start,
      canal: 'meta',
      ...extrairMetricasComuns(d),
    });
  }

  return linhas;
}

export function mapearCampanhas(resposta: unknown): LinhaCampanha[] {
  const dados = extrairLista(resposta, 'campanhas');
  const campanhas: LinhaCampanha[] = [];

  for (const d of dados) {
    if (!d.date_start || !/^\d{4}-\d{2}-\d{2}$/.test(d.date_start)) continue;
    const id = (d.campaign_id ?? '').trim();
    if (!id) continue;

    const m = extrairMetricasComuns(d);
    const nome = (d.campaign_name ?? '').trim() || `Campanha ${id}`;

    campanhas.push({
      dia: d.date_start,
      canal: 'meta',
      campanha_id: id,
      campanha_nome: nome,
      objetivo: classificarObjetivoMeta(d.objective, nome, m),
      ...m,
    });
  }

  return campanhas;
}

/* ------------------------------------------------------------------ */

export type SegredoMeta = { access_token: string };

async function buscarNivel({
  segredo,
  conta,
  de,
  ate,
  nivel,
  campos,
}: {
  segredo: SegredoMeta;
  conta: string;
  de: string;
  ate: string;
  nivel: 'account' | 'campaign';
  campos: string;
}): Promise<unknown> {
  const url = new URL(`https://graph.facebook.com/${VERSAO_API}/${conta}/insights`);
  url.searchParams.set('fields', campos);
  url.searchParams.set('time_range', JSON.stringify({ since: de, until: ate }));
  url.searchParams.set('time_increment', '1');
  url.searchParams.set('level', nivel);
  url.searchParams.set('limit', '500');

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
}): Promise<RespostaMetaCompleta> {
  const conta = identificador.startsWith('act_') ? identificador : `act_${identificador}`;

  const camposConta =
    'spend,impressions,reach,clicks,inline_link_clicks,actions,action_values';
  const camposCampanha =
    'campaign_id,campaign_name,objective,spend,impressions,reach,clicks,inline_link_clicks,actions,action_values';

  /* Conta e campanhas saem em paralelo. Se o detalhamento por campanha
     falhar por limite de paginação, o consolidado da conta continua salvo. */
  const [resConta, resCampanhas] = await Promise.all([
    buscarNivel({ segredo, conta, de, ate, nivel: 'account', campos: camposConta }),
    buscarNivel({ segredo, conta, de, ate, nivel: 'campaign', campos: camposCampanha }).catch(
      () => ({ data: [] }),
    ),
  ]);

  return { conta: resConta, campanhas: resCampanhas };
}
