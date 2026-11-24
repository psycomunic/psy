import type { LinhaMetrica, LinhaCampanha, ObjetivoCampanha } from '../csv.ts';
import type { CriativoResumo, StatusCriativo, SaldoContaMidia, NivelSaldoMidia } from '../../dados/tipos.ts';

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

/* ================================================================== */
/* Criativos ativos e com entrega no período (miniaturas + status)     */
/* ================================================================== */

type AnuncioMetaBruto = {
  id?: string;
  name?: string;
  status?: string;
  effective_status?: string;
  campaign?: { id?: string; name?: string; objective?: string };
  adset?: { id?: string; name?: string };
  creative?: {
    id?: string;
    name?: string;
    thumbnail_url?: string;
    image_url?: string;
    object_type?: string;
    video_id?: string;
    title?: string;
    body?: string;
  };
};

type InsightAnuncioBruto = LinhaMeta & {
  ad_id?: string;
  ad_name?: string;
  adset_name?: string;
};

function traduzirStatusAnuncio(bruto: string | undefined): {
  status: StatusCriativo;
  detalhe: string;
} {
  const s = (bruto ?? '').trim().toUpperCase();
  if (s === 'ACTIVE') return { status: 'ativo', detalhe: 'Rodando agora' };
  if (s === 'PENDING_REVIEW' || s === 'IN_PROCESS' || s === 'PREAPPROVED') {
    return { status: 'em_analise', detalhe: 'Em análise na Meta' };
  }
  if (s === 'DISAPPROVED') {
    return { status: 'erro', detalhe: 'Reprovado pela Meta' };
  }
  if (s === 'WITH_ISSUES' || s === 'PENDING_BILLING_INFO') {
    return { status: 'erro', detalhe: 'Com alerta de entrega' };
  }
  if (s === 'CAMPAIGN_PAUSED') {
    return { status: 'pausado', detalhe: 'Campanha pausada' };
  }
  if (s === 'ADSET_PAUSED') {
    return { status: 'pausado', detalhe: 'Conjunto pausado' };
  }
  return { status: 'pausado', detalhe: 'Pausado' };
}

function formatoDoCriativo(c: AnuncioMetaBruto['creative']): 'video' | 'imagem' | 'post' {
  const tipo = (c?.object_type ?? '').toUpperCase();
  if (c?.video_id || tipo === 'VIDEO') return 'video';
  if (tipo === 'SHARE') return 'post';
  return 'imagem';
}

const PESO_ORDEM_STATUS: Record<StatusCriativo, number> = {
  erro: 0,
  ativo: 1,
  em_analise: 2,
  pausado: 3,
};

export function mapearCriativos({
  anuncios,
  insights,
}: {
  anuncios: unknown;
  insights: unknown;
}): CriativoResumo[] {
  const listaAds = Array.isArray((anuncios as { data?: unknown[] })?.data)
    ? ((anuncios as { data: AnuncioMetaBruto[] }).data)
    : Array.isArray(anuncios)
      ? (anuncios as AnuncioMetaBruto[])
      : [];

  const listaInsights = Array.isArray((insights as { data?: unknown[] })?.data)
    ? ((insights as { data: InsightAnuncioBruto[] }).data)
    : Array.isArray(insights)
      ? (insights as InsightAnuncioBruto[])
      : [];

  const adsPorId = new Map<string, AnuncioMetaBruto>();
  for (const a of listaAds) {
    if (a.id) adsPorId.set(a.id, a);
  }

  const insightsPorId = new Map<string, InsightAnuncioBruto>();
  for (const i of listaInsights) {
    if (i.ad_id) insightsPorId.set(i.ad_id, i);
  }

  const todosIds = new Set<string>([...adsPorId.keys(), ...insightsPorId.keys()]);
  const saida: CriativoResumo[] = [];

  for (const id of todosIds) {
    const ad = adsPorId.get(id);
    const ins = insightsPorId.get(id);

    const m = ins
      ? extrairMetricasComuns(ins)
      : {
          investimento: 0,
          impressoes: 0,
          alcance: 0,
          cliques: 0,
          cliques_link: 0,
          visitas_pagina: 0,
          conversas: 0,
          leads_captados: 0,
          compras_atribuidas: 0,
          receita_atribuida: 0,
          carrinhos: 0,
          checkouts: 0,
          engajamentos: 0,
          visualizacoes_video: 0,
        };

    const { status, detalhe } = traduzirStatusAnuncio(
      ad?.effective_status ?? ad?.status ?? (ins ? 'PAUSED' : undefined),
    );

    /* Anúncio pausado que também não teve gasto nem impressão no período não
       ajuda na auditoria operacional; mantemos todos os ativos/em análise/com
       erro + os pausados que rodaram no período selecionado. */
    if (status === 'pausado' && m.investimento <= 0 && m.impressoes <= 0) {
      continue;
    }

    const campanhaNome =
      ad?.campaign?.name?.trim() ||
      ins?.campaign_name?.trim() ||
      'Campanha';
    const campanhaId =
      ad?.campaign?.id?.trim() ||
      ins?.campaign_id?.trim() ||
      '';
    const objetivoBruto = ad?.campaign?.objective ?? ins?.objective;

    const cliquesEfetivos = m.cliques_link > 0 ? m.cliques_link : m.cliques;
    const ctr =
      m.impressoes > 0
        ? Number(((100 * cliquesEfetivos) / m.impressoes).toFixed(2))
        : null;

    const miniatura = ad?.creative?.thumbnail_url?.trim() || ad?.creative?.image_url?.trim() || null;
    const imagem = ad?.creative?.image_url?.trim() || miniatura;

    saida.push({
      id,
      nome: ad?.name?.trim() || ins?.ad_name?.trim() || `Anúncio ${id.slice(-6)}`,
      campanhaId,
      campanhaNome,
      conjuntoNome: ad?.adset?.name?.trim() || ins?.adset_name?.trim() || null,
      objetivo: classificarObjetivoMeta(objetivoBruto, campanhaNome, m),
      status,
      statusDetalhe: detalhe,
      formato: formatoDoCriativo(ad?.creative),
      miniaturaUrl: miniatura,
      imagemUrl: imagem,
      titulo: ad?.creative?.title?.trim() || null,
      corpo: ad?.creative?.body?.trim() || null,
      investimento: m.investimento,
      impressoes: m.impressoes,
      alcance: m.alcance,
      cliquesLink: cliquesEfetivos,
      ctr,
      visitasPagina: m.visitas_pagina,
      conversas: m.conversas,
      leadsCaptados: m.leads_captados,
      comprasAtribuidas: m.compras_atribuidas,
      receitaAtribuida: m.receita_atribuida,
      engajamentos: m.engajamentos,
      visualizacoesVideo: m.visualizacoes_video,
    });
  }

  return saida.sort((a, b) => {
    const diffStatus = PESO_ORDEM_STATUS[a.status] - PESO_ORDEM_STATUS[b.status];
    if (diffStatus !== 0) return diffStatus;
    return b.investimento - a.investimento || b.impressoes - a.impressoes;
  });
}

export async function buscarCriativos({
  segredo,
  identificador,
  de,
  ate,
}: {
  segredo: SegredoMeta;
  identificador: string;
  de: string;
  ate: string;
}): Promise<CriativoResumo[]> {
  const conta = identificador.startsWith('act_') ? identificador : `act_${identificador}`;
  const cabecalhos = { authorization: `Bearer ${segredo.access_token}` };

  const camposAd =
    'id,name,status,effective_status,campaign{id,name,objective},adset{id,name},creative.thumbnail_width(480).thumbnail_height(480){id,name,thumbnail_url,image_url,object_type,video_id,title,body}';
  const camposInsights =
    'ad_id,ad_name,adset_name,campaign_id,campaign_name,objective,spend,impressions,reach,clicks,inline_link_clicks,actions,action_values';

  const urlAtivos = new URL(`https://graph.facebook.com/${VERSAO_API}/${conta}/ads`);
  urlAtivos.searchParams.set(
    'effective_status',
    JSON.stringify(['ACTIVE', 'IN_PROCESS', 'PENDING_REVIEW', 'DISAPPROVED', 'WITH_ISSUES']),
  );
  urlAtivos.searchParams.set('fields', camposAd);
  urlAtivos.searchParams.set('limit', '60');

  const urlInsights = new URL(`https://graph.facebook.com/${VERSAO_API}/${conta}/insights`);
  urlInsights.searchParams.set('level', 'ad');
  urlInsights.searchParams.set('time_range', JSON.stringify({ since: de, until: ate }));
  urlInsights.searchParams.set('fields', camposInsights);
  urlInsights.searchParams.set('limit', '100');

  const [resAtivos, resInsights] = await Promise.all([
    fetch(urlAtivos, { headers: cabecalhos, next: { revalidate: 300 } })
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .catch(() => ({ data: [] })),
    fetch(urlInsights, { headers: cabecalhos, next: { revalidate: 300 } })
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .catch(() => ({ data: [] })),
  ]);

  const listaAtivos: AnuncioMetaBruto[] = Array.isArray(resAtivos?.data) ? resAtivos.data : [];
  const listaInsights: InsightAnuncioBruto[] = Array.isArray(resInsights?.data)
    ? resInsights.data
    : [];

  const idsConhecidos = new Set(listaAtivos.map((a) => a.id).filter(Boolean));
  const faltantes = listaInsights
    .map((i) => i.ad_id)
    .filter((id): id is string => Boolean(id && !idsConhecidos.has(id)))
    .slice(0, 24);

  let extras: AnuncioMetaBruto[] = [];
  if (faltantes.length > 0) {
    const urlPausados = new URL(`https://graph.facebook.com/${VERSAO_API}/${conta}/ads`);
    urlPausados.searchParams.set(
      'filtering',
      JSON.stringify([{ field: 'id', operator: 'IN', value: faltantes }]),
    );
    urlPausados.searchParams.set('fields', camposAd);
    urlPausados.searchParams.set('limit', '30');

    const resPausados = await fetch(urlPausados, {
      headers: cabecalhos,
      next: { revalidate: 300 },
    })
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .catch(() => ({ data: [] }));

    if (Array.isArray(resPausados?.data)) {
      extras = resPausados.data;
    }
  }

  return mapearCriativos({
    anuncios: { data: [...listaAtivos, ...extras] },
    insights: { data: listaInsights },
  });
}

/* ================================================================== */
/* Saldo em tempo real da conta de anúncios (PIX/Boleto e Cartão)      */
/* ================================================================== */

type ContaSaldoMetaBruta = {
  id?: string;
  account_id?: string;
  name?: string;
  account_status?: number;
  currency?: string;
  balance?: string | number;
  amount_spent?: string | number;
  spend_cap?: string | number;
  is_prepay_account?: boolean;
  funding_source_details?: {
    id?: string;
    display_string?: string;
    type?: number;
  };
};

/**
 * Extrai valor em reais de strings do tipo `"Saldo disponível (R$1.235,14 BRL)"`
 * ou `"Available balance (R$600.00 BRL)"`.
 */
export function extrairValorMonetarioMeta(texto: string | undefined | null): number | null {
  if (!texto) return null;
  const m = texto.match(/R\$\s*([\d.,]+)/i);
  if (!m) return null;
  const bruto = m[1].trim();
  /* Formato brasileiro `1.234,56` vs inglês `1,234.56` */
  const normalizado = bruto.includes(',')
    ? bruto.replace(/\./g, '').replace(',', '.')
    : bruto;
  const valor = Number(normalizado);
  return Number.isFinite(valor) && valor >= 0 ? Number(valor.toFixed(2)) : null;
}

export function mapearSaldoContaMeta({
  bruto,
  contaId,
  contaNome,
  gastoUltimos7Dias,
  pisoAlertaReais = 150,
}: {
  bruto: unknown;
  contaId: string;
  contaNome: string;
  gastoUltimos7Dias: number;
  pisoAlertaReais?: number;
}): SaldoContaMidia | null {
  if (!bruto || typeof bruto !== 'object' || 'error' in (bruto as Record<string, unknown>)) {
    return null;
  }
  const d = bruto as ContaSaldoMetaBruta;
  const adAccountId = (d.account_id ?? d.id ?? '').replace(/^act_/, '');
  if (!adAccountId) return null;

  const ativaNaMeta = Number(d.account_status ?? 1) === 1;
  const display = d.funding_source_details?.display_string?.trim() ?? null;
  const tipoFonte = d.funding_source_details?.type;
  const ehPrePago = Boolean(
    d.is_prepay_account ||
      tipoFonte === 20 ||
      (display && /saldo dispon[ií]vel|available balance/i.test(display)),
  );

  const spendCapCentavos = numero(d.spend_cap);
  const amountSpentCentavos = numero(d.amount_spent);
  const balanceCentavos = numero(d.balance);

  const gastoMedioDiario =
    gastoUltimos7Dias > 0 ? Number((gastoUltimos7Dias / 7).toFixed(2)) : 0;

  if (ehPrePago) {
    const doTexto = extrairValorMonetarioMeta(display);
    const doTeto =
      spendCapCentavos > 0
        ? Number(Math.max(0, (spendCapCentavos - amountSpentCentavos) / 100).toFixed(2))
        : null;
    const saldo = doTexto !== null ? doTexto : (doTeto ?? 0);

    const diasRestantes =
      gastoMedioDiario >= 1 ? Number((saldo / gastoMedioDiario).toFixed(1)) : null;

    let nivel: NivelSaldoMidia = 'saudavel';
    if (!ativaNaMeta || saldo <= 5) {
      nivel = 'zerado';
    } else if (saldo < pisoAlertaReais || (diasRestantes !== null && diasRestantes < 3)) {
      nivel = 'critico';
    } else if (saldo < pisoAlertaReais * 1.8 || (diasRestantes !== null && diasRestantes < 5)) {
      nivel = 'atencao';
    }

    const resumo =
      nivel === 'zerado'
        ? 'Saldo esgotado — recarregue via PIX/Boleto para destravar a veiculação.'
        : diasRestantes !== null
          ? `Dura cerca de ${diasRestantes.toFixed(1).replace('.', ',')} dias no ritmo atual (R$ ${gastoMedioDiario.toFixed(0)}/dia).`
          : 'Conta pré-paga (PIX / Boleto).';

    return {
      contaId,
      contaNome,
      adAccountId,
      adAccountNome: d.name?.trim() || contaNome,
      ativaNaMeta,
      modalidade: 'pre_pago',
      saldoDisponivel: saldo,
      faturaAberta: null,
      textoFontePagamento: display,
      gastoMedioDiario,
      diasRestantes,
      nivel,
      resumo,
      verificadoEm: new Date().toISOString(),
    };
  }

  /* Pós-pago (cartão de crédito / faturamento mensal) */
  const faturaAberta = Number((balanceCentavos / 100).toFixed(2));
  const tetoRestante =
    spendCapCentavos > 0
      ? Number(Math.max(0, (spendCapCentavos - amountSpentCentavos) / 100).toFixed(2))
      : null;

  let nivel: NivelSaldoMidia = 'pos_pago';
  if (!ativaNaMeta || (tetoRestante !== null && tetoRestante <= 5)) {
    nivel = 'zerado';
  } else if (tetoRestante !== null && tetoRestante < pisoAlertaReais) {
    nivel = 'critico';
  }

  return {
    contaId,
    contaNome,
    adAccountId,
    adAccountNome: d.name?.trim() || contaNome,
    ativaNaMeta,
    modalidade: 'pos_pago',
    saldoDisponivel: tetoRestante,
    faturaAberta,
    textoFontePagamento: display,
    gastoMedioDiario,
    diasRestantes:
      tetoRestante !== null && gastoMedioDiario >= 1
        ? Number((tetoRestante / gastoMedioDiario).toFixed(1))
        : null,
    nivel,
    resumo: !ativaNaMeta
      ? 'Conta com restrição ou cobrança pendente na Meta.'
      : display
        ? `Cobrança automática (${display}).`
        : 'Cobrança automática por cartão.',
    verificadoEm: new Date().toISOString(),
  };
}

export async function buscarSaldoConta({
  segredo,
  identificador,
  contaId,
  contaNome,
  gastoUltimos7Dias,
  pisoAlertaReais = 150,
}: {
  segredo: SegredoMeta;
  identificador: string;
  contaId: string;
  contaNome: string;
  gastoUltimos7Dias: number;
  pisoAlertaReais?: number;
}): Promise<SaldoContaMidia | null> {
  const conta = identificador.startsWith('act_') ? identificador : `act_${identificador}`;
  const campos =
    'id,account_id,name,account_status,currency,balance,amount_spent,spend_cap,is_prepay_account,funding_source_details';

  const url = new URL(`https://graph.facebook.com/${VERSAO_API}/${conta}`);
  url.searchParams.set('fields', campos);

  const r = await fetch(url, {
    headers: { authorization: `Bearer ${segredo.access_token}` },
    next: { revalidate: 120 },
  });

  if (!r.ok) return null;
  const bruto = await r.json().catch(() => null);

  return mapearSaldoContaMeta({
    bruto,
    contaId,
    contaNome,
    gastoUltimos7Dias,
    pisoAlertaReais,
  });
}
