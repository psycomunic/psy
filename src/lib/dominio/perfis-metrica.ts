import type { DiaKpi, TipoConta } from '../dados/tipos.ts';
import type { ObjetivoCampanha } from '../ingestao/csv.ts';
import {
  dinheiro,
  dinheiroExato,
  numero,
  contagemCurta,
  porcento,
  vezes,
} from '../formato.ts';
import { hojeBR, somarDias } from '../datas.ts';

/**
 * Perfis de métricas por nicho ("lentes" de leitura).
 *
 * Um chalé, uma clínica odontológica, um atacado de moda B2B e um
 * e-commerce não medem sucesso com os mesmos números. Esta camada traduz
 * a série bruta de cada cliente nos indicadores, funil e série temporal
 * que fazem sentido para o modelo comercial dele.
 */

export const PERFIS_METRICA = [
  'automatico',
  'whatsapp',
  'leads',
  'ecommerce',
  'vendas_midia',
  'branding',
  'personalizado',
] as const;

export type PerfilMetrica = (typeof PERFIS_METRICA)[number];
export type PerfilMetricaEfetivo = Exclude<PerfilMetrica, 'automatico'>;

export const rotuloPerfilMetrica: Record<PerfilMetrica, string> = {
  automatico: 'Automático pelo tipo do cliente',
  whatsapp: 'WhatsApp e Atendimento',
  leads: 'Captação de Leads e LP',
  ecommerce: 'E-commerce (Loja + Mídia)',
  vendas_midia: 'Vendas Diretas na Mídia',
  branding: 'Branding, Conteúdo e Audiência',
  personalizado: 'Personalizado',
};

export const descricaoPerfilMetrica: Record<PerfilMetrica, string> = {
  automatico:
    'Usa E-commerce para lojas online e WhatsApp e Atendimento para contas de tráfego e negócios locais.',
  whatsapp:
    'Chalés, pousadas, clínicas, concessionárias, comércios locais e serviços que fecham venda no WhatsApp ou Direct.',
  leads:
    'Imobiliárias, atacado B2B, educação, lançamentos e páginas de captura com formulário.',
  ecommerce:
    'Lojas virtuais integradas, cruzando receita aprovada da plataforma com investimento total (MER).',
  vendas_midia:
    'Operações que vendem online via Pixel/Catálogo/Checkout externo sem loja integrada ao painel.',
  branding:
    'Campanhas institucionais, crescimento de audiência, alcance regional, Reels e visualizações de vídeo.',
  personalizado:
    'Escolha manual de quais cartões de KPI aparecem em destaque para este cliente.',
};

export const CHAVES_KPI = [
  'investimento',
  'conversas',
  'custo_conversa',
  'leads',
  'cpl',
  'receita',
  'mer',
  'pedidos',
  'ticket_medio',
  'cac',
  'compras_midia',
  'receita_atribuida',
  'roas_midia',
  'cpa_midia',
  'alcance',
  'impressoes',
  'frequencia',
  'cpm',
  'cliques_link',
  'ctr',
  'cpc',
  'visitas_pagina',
  'connect_rate',
  'conversao_lp',
  'visualizacoes_video',
  'engajamentos',
] as const;

export type ChaveKpi = (typeof CHAVES_KPI)[number];

export const rotuloChaveKpi: Record<ChaveKpi, string> = {
  investimento: 'Investimento em mídia',
  conversas: 'Conversas iniciadas',
  custo_conversa: 'Custo por conversa',
  leads: 'Leads captados',
  cpl: 'Custo por lead (CPL)',
  receita: 'Receita aprovada',
  mer: 'MER',
  pedidos: 'Pedidos aprovados',
  ticket_medio: 'Ticket médio',
  cac: 'CAC',
  compras_midia: 'Compras (mídia)',
  receita_atribuida: 'Receita atribuída',
  roas_midia: 'ROAS na mídia',
  cpa_midia: 'CPA na mídia',
  alcance: 'Alcance único',
  impressoes: 'Impressões',
  frequencia: 'Frequência',
  cpm: 'CPM',
  cliques_link: 'Cliques no link',
  ctr: 'CTR',
  cpc: 'CPC no link',
  visitas_pagina: 'Visitas na página',
  connect_rate: 'Taxa de carregamento (LP)',
  conversao_lp: 'Conversão da página',
  visualizacoes_video: 'Visualizações de vídeo',
  engajamentos: 'Engajamentos',
};

export const KPIS_PADRAO_POR_PERFIL: Record<PerfilMetricaEfetivo, ChaveKpi[]> = {
  whatsapp: ['investimento', 'conversas', 'custo_conversa', 'cliques_link', 'ctr', 'alcance'],
  leads: ['investimento', 'leads', 'cpl', 'visitas_pagina', 'conversao_lp', 'ctr'],
  ecommerce: ['receita', 'investimento', 'mer', 'pedidos', 'ticket_medio', 'cac'],
  vendas_midia: ['receita_atribuida', 'investimento', 'roas_midia', 'compras_midia', 'cpa_midia', 'ctr'],
  branding: ['investimento', 'alcance', 'cpm', 'visualizacoes_video', 'engajamentos', 'cliques_link'],
  personalizado: ['investimento', 'conversas', 'leads', 'cliques_link', 'ctr', 'alcance'],
};

export function resolverPerfil(
  perfil: PerfilMetrica | null | undefined,
  tipoConta: TipoConta,
): PerfilMetricaEfetivo {
  if (perfil && perfil !== 'automatico') return perfil;
  return tipoConta === 'ecommerce' ? 'ecommerce' : 'whatsapp';
}

/* ================================================================== */
/* Janelas de período                                                 */
/* ================================================================== */

export const PERIODOS = [
  '7d',
  '14d',
  '30d',
  'mes_atual',
  'mes_anterior',
  'personalizado',
] as const;

export type ChavePeriodo = (typeof PERIODOS)[number];

export const rotuloPeriodo: Record<ChavePeriodo, string> = {
  '7d': 'Últimos 7 dias',
  '14d': 'Últimos 14 dias',
  '30d': 'Últimos 30 dias',
  mes_atual: 'Este mês',
  mes_anterior: 'Mês passado',
  personalizado: 'Período personalizado',
};

export type JanelaResolvida = {
  chave: ChavePeriodo;
  rotulo: string;
  de: string;
  ate: string;
  anteriorDe: string;
  anteriorAte: string;
  dias: number;
};

const DATA_ISO = /^\d{4}-\d{2}-\d{2}$/;

function contarDiasInclusivos(de: string, ate: string): number {
  const ms = Date.parse(`${ate}T00:00:00Z`) - Date.parse(`${de}T00:00:00Z`);
  return Math.max(1, Math.round(ms / 86400000) + 1);
}

export function resolverJanelaPeriodo({
  periodo,
  de,
  ate,
  hoje = hojeBR(),
}: {
  periodo?: string;
  de?: string;
  ate?: string;
  hoje?: string;
}): JanelaResolvida {
  const ontem = somarDias(hoje, -1);
  let chave: ChavePeriodo = PERIODOS.includes(periodo as ChavePeriodo)
    ? (periodo as ChavePeriodo)
    : '7d';

  let inicio = somarDias(ontem, -6);
  let fim = ontem;

  if (chave === '14d') {
    inicio = somarDias(ontem, -13);
    fim = ontem;
  } else if (chave === '30d') {
    inicio = somarDias(ontem, -29);
    fim = ontem;
  } else if (chave === 'mes_atual') {
    const primeiroDoMes = `${hoje.slice(0, 7)}-01`;
    /* No dia 1 do mês ontem ainda é o mês passado; usa o próprio dia 1
       para não inverter o intervalo. */
    inicio = primeiroDoMes;
    fim = ontem >= primeiroDoMes ? ontem : hoje;
  } else if (chave === 'mes_anterior') {
    const [ano, mes] = hoje.split('-').map(Number);
    const anoAnt = mes === 1 ? ano - 1 : ano;
    const mesAnt = mes === 1 ? 12 : mes - 1;
    inicio = `${anoAnt}-${String(mesAnt).padStart(2, '0')}-01`;
    fim = somarDias(`${hoje.slice(0, 7)}-01`, -1);
  } else if (chave === 'personalizado') {
    if (de && ate && DATA_ISO.test(de) && DATA_ISO.test(ate) && de <= ate) {
      inicio = de;
      fim = ate;
    } else {
      chave = '30d';
      inicio = somarDias(ontem, -29);
      fim = ontem;
    }
  }

  const dias = contarDiasInclusivos(inicio, fim);
  const anteriorAte = somarDias(inicio, -1);
  const anteriorDe = somarDias(anteriorAte, -(dias - 1));

  return {
    chave,
    rotulo: rotuloPeriodo[chave],
    de: inicio,
    ate: fim,
    anteriorDe,
    anteriorAte,
    dias,
  };
}

/* ================================================================== */
/* Agregação do período                                               */
/* ================================================================== */

export type ResumoAgregado = {
  investimento: number;
  receita: number;
  receitaAtribuida: number;
  sessoes: number;
  pedidosCaptados: number;
  pedidosAprovados: number;
  novosClientes: number;
  impressoes: number;
  alcance: number;
  cliques: number;
  cliquesLink: number;
  visitasPagina: number;
  conversas: number;
  leadsCaptados: number;
  comprasAtribuidas: number;
  carrinhos: number;
  checkouts: number;
  engajamentos: number;
  visualizacoesVideo: number;

  /* Derivadas sobre os totais do período (nunca média de médias). */
  mer: number | null;
  roasMidia: number | null;
  ticketMedio: number | null;
  cac: number | null;
  custoConversa: number | null;
  cpl: number | null;
  cpaMidia: number | null;
  ctr: number | null;
  cpc: number | null;
  cpm: number | null;
  frequencia: number | null;
  connectRate: number | null;
  conversaoLp: number | null;
  taxaConversaoLoja: number | null;
  taxaAprovacaoPedidos: number | null;
  taxaCliqueConversa: number | null;
};

const razao = (num: number, den: number, casas = 2): number | null =>
  den > 0 ? Number((num / den).toFixed(casas)) : null;

const pct = (num: number, den: number, casas = 1): number | null =>
  den > 0 ? Number(((100 * num) / den).toFixed(casas)) : null;

export function agregarPeriodo(serie: DiaKpi[]): ResumoAgregado {
  let investimento = 0;
  let receita = 0;
  let receitaAtribuida = 0;
  let sessoes = 0;
  let pedidosCaptados = 0;
  let pedidosAprovados = 0;
  let novosClientes = 0;
  let impressoes = 0;
  let alcance = 0;
  let cliques = 0;
  let cliquesLink = 0;
  let visitasPagina = 0;
  let conversas = 0;
  let leadsCaptados = 0;
  let comprasAtribuidas = 0;
  let carrinhos = 0;
  let checkouts = 0;
  let engajamentos = 0;
  let visualizacoesVideo = 0;

  for (const d of serie) {
    investimento += d.investimento || 0;
    receita += d.receita || 0;
    receitaAtribuida += d.receitaAtribuida || 0;
    sessoes += d.sessoes || 0;
    pedidosCaptados += d.pedidosCaptados || 0;
    pedidosAprovados += d.pedidosAprovados || 0;
    novosClientes += d.novosClientes || 0;
    impressoes += d.impressoes || 0;
    alcance += d.alcance || 0;
    cliques += d.cliques || 0;
    cliquesLink += d.cliquesLink || 0;
    visitasPagina += d.visitasPagina || 0;
    conversas += d.conversas || 0;
    leadsCaptados += d.leadsCaptados || 0;
    comprasAtribuidas += d.comprasAtribuidas || 0;
    carrinhos += d.carrinhos || 0;
    checkouts += d.checkouts || 0;
    engajamentos += d.engajamentos || 0;
    visualizacoesVideo += d.visualizacoesVideo || 0;
  }

  investimento = Number(investimento.toFixed(2));
  receita = Number(receita.toFixed(2));
  receitaAtribuida = Number(receitaAtribuida.toFixed(2));

  /* Quando o histórico antigo só gravou `cliques` (antes da 0050), usa
     `cliques` como fallback honesto para não zerar CPC e CTR. */
  const cliquesEfetivos = cliquesLink > 0 ? cliquesLink : cliques;

  return {
    investimento,
    receita,
    receitaAtribuida,
    sessoes,
    pedidosCaptados,
    pedidosAprovados,
    novosClientes,
    impressoes,
    alcance,
    cliques,
    cliquesLink: cliquesEfetivos,
    visitasPagina,
    conversas,
    leadsCaptados,
    comprasAtribuidas,
    carrinhos,
    checkouts,
    engajamentos,
    visualizacoesVideo,

    mer: razao(receita, investimento, 2),
    roasMidia: razao(receitaAtribuida, investimento, 2),
    ticketMedio: razao(receita, pedidosAprovados, 2),
    cac: razao(investimento, novosClientes, 2),
    custoConversa: razao(investimento, conversas, 2),
    cpl: razao(investimento, leadsCaptados, 2),
    cpaMidia: razao(investimento, comprasAtribuidas, 2),
    ctr: pct(cliquesEfetivos, impressoes, 2),
    cpc: razao(investimento, cliquesEfetivos, 2),
    cpm: impressoes > 0 ? Number(((investimento * 1000) / impressoes).toFixed(2)) : null,
    frequencia: razao(impressoes, alcance, 2),
    connectRate: pct(visitasPagina, cliquesEfetivos, 1),
    conversaoLp: pct(leadsCaptados, visitasPagina > 0 ? visitasPagina : cliquesEfetivos, 1),
    taxaConversaoLoja: pct(pedidosCaptados, sessoes, 2),
    taxaAprovacaoPedidos: pct(pedidosAprovados, pedidosCaptados, 1),
    taxaCliqueConversa: pct(conversas, cliquesEfetivos, 1),
  };
}

/* ================================================================== */
/* Cartões de KPI, Funil e Série Temporal                             */
/* ================================================================== */

export type CartaoKpiMontado = {
  chave: ChaveKpi;
  rotulo: string;
  valor: string;
  apoio?: string;
  variacao: number | null;
  invertido?: boolean;
};

const deltaPct = (atual: number | null, ant: number | null): number | null => {
  if (atual === null || ant === null || ant <= 0) return null;
  return Number(((100 * (atual - ant)) / ant).toFixed(1));
};

function valorBrutoKpi(r: ResumoAgregado, k: ChaveKpi): number | null {
  switch (k) {
    case 'investimento': return r.investimento;
    case 'conversas': return r.conversas;
    case 'custo_conversa': return r.custoConversa;
    case 'leads': return r.leadsCaptados;
    case 'cpl': return r.cpl;
    case 'receita': return r.receita;
    case 'mer': return r.mer;
    case 'pedidos': return r.pedidosAprovados;
    case 'ticket_medio': return r.ticketMedio;
    case 'cac': return r.cac;
    case 'compras_midia': return r.comprasAtribuidas;
    case 'receita_atribuida': return r.receitaAtribuida;
    case 'roas_midia': return r.roasMidia;
    case 'cpa_midia': return r.cpaMidia;
    case 'alcance': return r.alcance;
    case 'impressoes': return r.impressoes;
    case 'frequencia': return r.frequencia;
    case 'cpm': return r.cpm;
    case 'cliques_link': return r.cliquesLink;
    case 'ctr': return r.ctr;
    case 'cpc': return r.cpc;
    case 'visitas_pagina': return r.visitasPagina;
    case 'connect_rate': return r.connectRate;
    case 'conversao_lp': return r.conversaoLp;
    case 'visualizacoes_video': return r.visualizacoesVideo;
    case 'engajamentos': return r.engajamentos;
  }
}

function formatarKpi(r: ResumoAgregado, k: ChaveKpi): { valor: string; apoio?: string; invertido?: boolean } {
  switch (k) {
    case 'investimento':
      return { valor: dinheiro(r.investimento), apoio: `${contagemCurta(r.impressoes)} impressões no período.` };
    case 'conversas':
      return {
        valor: numero(r.conversas),
        apoio: r.taxaCliqueConversa !== null
          ? `${porcento(r.taxaCliqueConversa)} dos cliques viraram conversa.`
          : 'WhatsApp, Direct e Messenger.',
      };
    case 'custo_conversa':
      return {
        valor: dinheiroExato(r.custoConversa),
        apoio: 'Investimento ÷ conversas iniciadas.',
        invertido: true,
      };
    case 'leads':
      return {
        valor: numero(r.leadsCaptados),
        apoio: 'Cadastros, formulários nativos e contatos.',
      };
    case 'cpl':
      return {
        valor: dinheiroExato(r.cpl),
        apoio: 'Investimento ÷ leads captados.',
        invertido: true,
      };
    case 'receita':
      return { valor: dinheiro(r.receita), apoio: 'Faturamento aprovado na plataforma da loja.' };
    case 'mer':
      return { valor: vezes(r.mer), apoio: 'Receita total da loja ÷ investimento total.' };
    case 'pedidos':
      return {
        valor: numero(r.pedidosAprovados),
        apoio: r.taxaAprovacaoPedidos !== null
          ? `Aprovação de ${porcento(r.taxaAprovacaoPedidos)} sobre captados.`
          : 'Pedidos pagos.',
      };
    case 'ticket_medio':
      return { valor: dinheiro(r.ticketMedio), apoio: 'Sobre pedidos aprovados.' };
    case 'cac':
      return { valor: dinheiro(r.cac), apoio: 'Investimento ÷ clientes novos.', invertido: true };
    case 'compras_midia':
      return { valor: numero(r.comprasAtribuidas), apoio: 'Vendas atribuídas pelo Pixel/API.' };
    case 'receita_atribuida':
      return { valor: dinheiro(r.receitaAtribuida), apoio: 'Valor de conversão reportado pelas mídias.' };
    case 'roas_midia':
      return { valor: vezes(r.roasMidia), apoio: 'Receita atribuída ÷ investimento.' };
    case 'cpa_midia':
      return { valor: dinheiroExato(r.cpaMidia), apoio: 'Investimento ÷ compras na mídia.', invertido: true };
    case 'alcance':
      return {
        valor: contagemCurta(r.alcance),
        apoio: r.frequencia !== null ? `Frequência média de ${vezes(r.frequencia).replace('x', '')}x.` : 'Pessoas únicas alcançadas.',
      };
    case 'impressoes':
      return { valor: contagemCurta(r.impressoes), apoio: `CPM médio de ${dinheiroExato(r.cpm)}.` };
    case 'frequencia':
      return { valor: r.frequencia === null ? '—' : `${r.frequencia.toFixed(2).replace('.', ',')}x`, apoio: 'Impressões ÷ alcance único.' };
    case 'cpm':
      return { valor: dinheiroExato(r.cpm), apoio: 'Custo por mil impressões.', invertido: true };
    case 'cliques_link':
      return { valor: numero(r.cliquesLink), apoio: r.cpc !== null ? `CPC médio de ${dinheiroExato(r.cpc)}.` : 'Cliques de saída.' };
    case 'ctr':
      return { valor: porcento(r.ctr, 2), apoio: 'Cliques no link ÷ impressões.' };
    case 'cpc':
      return { valor: dinheiroExato(r.cpc), apoio: 'Investimento ÷ cliques no link.', invertido: true };
    case 'visitas_pagina':
      return {
        valor: numero(r.visitasPagina),
        apoio: r.connectRate !== null ? `${porcento(r.connectRate)} dos cliques carregaram a página.` : 'Aberturas reais da LP.',
      };
    case 'connect_rate':
      return { valor: porcento(r.connectRate, 1), apoio: 'Visitas na página ÷ cliques no link.' };
    case 'conversao_lp':
      return { valor: porcento(r.conversaoLp, 1), apoio: 'Leads ÷ visitas na página.' };
    case 'visualizacoes_video':
      return { valor: contagemCurta(r.visualizacoesVideo), apoio: 'ThruPlay e retenção de vídeo.' };
    case 'engajamentos':
      return { valor: contagemCurta(r.engajamentos), apoio: 'Curtidas, comentários, salvamentos e toques.' };
  }
}

export function montarCartoesKpi({
  perfil,
  kpisVisiveis,
  atual,
  anterior,
}: {
  perfil: PerfilMetricaEfetivo;
  kpisVisiveis?: string[] | null;
  atual: ResumoAgregado;
  anterior?: ResumoAgregado | null;
}): CartaoKpiMontado[] {
  const validos = (kpisVisiveis ?? []).filter((k): k is ChaveKpi =>
    CHAVES_KPI.includes(k as ChaveKpi),
  );

  const chaves =
    perfil === 'personalizado' && validos.length > 0
      ? validos
      : KPIS_PADRAO_POR_PERFIL[perfil];

  return chaves.map((chave) => {
    const f = formatarKpi(atual, chave);
    const vAtual = valorBrutoKpi(atual, chave);
    const vAnt = anterior ? valorBrutoKpi(anterior, chave) : null;
    return {
      chave,
      rotulo: rotuloChaveKpi[chave],
      valor: f.valor,
      apoio: f.apoio,
      invertido: f.invertido,
      variacao: deltaPct(vAtual, vAnt),
    };
  });
}

export type FunilMontado = {
  titulo: string;
  apoio: string;
  etapas: { rotulo: string; valor: string; apoio: string }[];
  alerta?: { destaque: string; corpo: string } | null;
};

export function montarFunil(perfil: PerfilMetricaEfetivo, r: ResumoAgregado): FunilMontado {
  if (perfil === 'ecommerce') {
    const perdidos = Math.max(0, r.pedidosCaptados - r.pedidosAprovados);
    const perdaEstimada = r.ticketMedio ? perdidos * r.ticketMedio : 0;

    return {
      titulo: 'O funil, da visita ao pagamento',
      apoio: 'O buraco entre pedido captado e pedido aprovado mostra quanto ficou retido no checkout.',
      etapas: [
        { rotulo: 'Sessões', valor: numero(r.sessoes), apoio: 'Visitas na loja' },
        {
          rotulo: 'Pedidos captados',
          valor: numero(r.pedidosCaptados),
          apoio: `Conversão de ${porcento(r.taxaConversaoLoja, 2)}`,
        },
        {
          rotulo: 'Pedidos aprovados',
          valor: numero(r.pedidosAprovados),
          apoio: `Aprovação de ${porcento(r.taxaAprovacaoPedidos, 1)}`,
        },
        {
          rotulo: 'Clientes novos',
          valor: numero(r.novosClientes),
          apoio: `${numero(Math.max(0, r.pedidosAprovados - r.novosClientes))} foram recompra`,
        },
      ],
      alerta:
        perdidos > 0 && r.ticketMedio
          ? {
              destaque: `${numero(perdidos)} pedidos não foram pagos no período.`,
              corpo: `No ticket médio atual, são cerca de ${dinheiro(perdaEstimada)} que entraram no checkout e não viraram receita aprovada.`,
            }
          : null,
    };
  }

  if (perfil === 'leads') {
    const fugaLp =
      r.cliquesLink >= 30 && r.visitasPagina > 0 && r.connectRate !== null && r.connectRate < 65;

    return {
      titulo: 'O funil de captação, do anúncio ao lead',
      apoio: 'Separa atração do criativo (CTR), velocidade da página (connect rate) e persuasão da oferta.',
      etapas: [
        { rotulo: 'Impressões', valor: contagemCurta(r.impressoes), apoio: `CPM de ${dinheiroExato(r.cpm)}` },
        { rotulo: 'Cliques no link', valor: numero(r.cliquesLink), apoio: `CTR de ${porcento(r.ctr, 2)}` },
        {
          rotulo: 'Visitas na página',
          valor: numero(r.visitasPagina),
          apoio: `Carregamento de ${porcento(r.connectRate, 1)}`,
        },
        {
          rotulo: 'Leads captados',
          valor: numero(r.leadsCaptados),
          apoio: `Conversão de ${porcento(r.conversaoLp, 1)} · CPL ${dinheiroExato(r.cpl)}`,
        },
      ],
      alerta: fugaLp
        ? {
            destaque: `Apenas ${porcento(r.connectRate, 0)} dos cliques esperaram a página abrir.`,
            corpo: 'Acima de 35% de perda entre o clique e a visita costuma indicar página pesada no 4G ou redirecionamento lento.',
          }
        : null,
    };
  }

  if (perfil === 'vendas_midia') {
    return {
      titulo: 'Jornada de compra nas mídias',
      apoio: 'Eventos registrados pelo Pixel e API de Conversões nas campanhas ativas.',
      etapas: [
        { rotulo: 'Cliques no link', valor: numero(r.cliquesLink), apoio: `CTR de ${porcento(r.ctr, 2)}` },
        { rotulo: 'Carrinhos', valor: numero(r.carrinhos), apoio: 'Adições ao carrinho' },
        { rotulo: 'Checkouts', valor: numero(r.checkouts), apoio: 'Finalizações iniciadas' },
        {
          rotulo: 'Compras atribuídas',
          valor: numero(r.comprasAtribuidas),
          apoio: `CPA de ${dinheiroExato(r.cpaMidia)} · ROAS ${vezes(r.roasMidia)}`,
        },
      ],
      alerta: null,
    };
  }

  if (perfil === 'branding') {
    return {
      titulo: 'Alcance, atenção e resposta da audiência',
      apoio: 'Quantas pessoas únicas viram a marca, retiveram atenção e interagiram.',
      etapas: [
        { rotulo: 'Impressões', valor: contagemCurta(r.impressoes), apoio: `CPM de ${dinheiroExato(r.cpm)}` },
        {
          rotulo: 'Alcance único',
          valor: contagemCurta(r.alcance),
          apoio: r.frequencia ? `Frequência de ${r.frequencia.toFixed(2).replace('.', ',')}x` : 'Pessoas únicas',
        },
        {
          rotulo: 'Retenção e engajamento',
          valor: contagemCurta(r.visualizacoesVideo + r.engajamentos),
          apoio: `${contagemCurta(r.visualizacoesVideo)} views de vídeo · ${contagemCurta(r.engajamentos)} interações`,
        },
        { rotulo: 'Cliques de saída', valor: numero(r.cliquesLink), apoio: `CTR de ${porcento(r.ctr, 2)}` },
      ],
      alerta: null,
    };
  }

  /* whatsapp e personalizado (padrão para atendimento e negócios locais) */
  return {
    titulo: 'Da exibição do anúncio à conversa iniciada',
    apoio: 'Mostra quantas pessoas viram os criativos, tocaram para falar e iniciaram atendimento.',
    etapas: [
      {
        rotulo: 'Alcance único',
        valor: r.alcance > 0 ? contagemCurta(r.alcance) : contagemCurta(r.impressoes),
        apoio: r.alcance > 0 ? `${contagemCurta(r.impressoes)} impressões totais` : 'Exibições dos anúncios',
      },
      {
        rotulo: 'Engajamentos e vídeo',
        valor: contagemCurta(r.engajamentos + r.visualizacoesVideo),
        apoio: `CPM de ${dinheiroExato(r.cpm)}`,
      },
      {
        rotulo: 'Cliques no link',
        valor: numero(r.cliquesLink),
        apoio: `CTR de ${porcento(r.ctr, 2)} · CPC ${dinheiroExato(r.cpc)}`,
      },
      {
        rotulo: 'Conversas iniciadas',
        valor: numero(r.conversas),
        apoio:
          r.conversas > 0
            ? `${porcento(r.taxaCliqueConversa, 1)} dos cliques · ${dinheiroExato(r.custoConversa)} cada`
            : 'WhatsApp e Direct',
      },
    ],
    alerta: null,
  };
}

export type ConfigSeriePerfil = {
  titulo: string;
  apoio: string;
  modo: 'moeda_dupla' | 'verba_e_volume';
  rotuloResultado: string;
  extrairResultado: (d: DiaKpi) => number;
};

export function configSerieDoPerfil(perfil: PerfilMetricaEfetivo): ConfigSeriePerfil {
  switch (perfil) {
    case 'ecommerce':
      return {
        titulo: 'Receita aprovada e investimento, dia a dia',
        apoio: 'Duas linhas na mesma escala em reais. Passe o cursor para inspecionar cada dia.',
        modo: 'moeda_dupla',
        rotuloResultado: 'Receita aprovada',
        extrairResultado: (d) => d.receita,
      };
    case 'vendas_midia':
      return {
        titulo: 'Receita atribuída e investimento, dia a dia',
        apoio: 'Valor de conversão reportado pelas plataformas contra o investimento diário.',
        modo: 'moeda_dupla',
        rotuloResultado: 'Receita atribuída',
        extrairResultado: (d) => d.receitaAtribuida,
      };
    case 'leads':
      return {
        titulo: 'Leads captados e investimento diário',
        apoio: 'Barras mostram os leads de cada dia; a linha acompanha o investimento em mídia.',
        modo: 'verba_e_volume',
        rotuloResultado: 'Leads captados',
        extrairResultado: (d) => d.leadsCaptados,
      };
    case 'branding':
      return {
        titulo: 'Alcance diário e investimento em mídia',
        apoio: 'Pessoas alcançadas por dia em relação ao ritmo de verba aplicada.',
        modo: 'verba_e_volume',
        rotuloResultado: 'Alcance diário',
        extrairResultado: (d) => (d.alcance > 0 ? d.alcance : d.impressoes),
      };
    default:
      return {
        titulo: 'Conversas iniciadas e investimento diário',
        apoio: 'Barras mostram o volume diário de conversas; a linha acompanha o investimento.',
        modo: 'verba_e_volume',
        rotuloResultado: 'Conversas',
        extrairResultado: (d) => (d.conversas > 0 ? d.conversas : d.cliquesLink || d.cliques),
      };
  }
}

/* ================================================================== */
/* Leitura de cada campanha segundo seu objetivo                      */
/* ================================================================== */

export const rotuloObjetivoCampanha: Record<ObjetivoCampanha, string> = {
  mensagens: 'Mensagens / WhatsApp',
  leads: 'Captação de Leads',
  vendas: 'Vendas / Conversão',
  trafego: 'Tráfego / Visitas',
  alcance: 'Alcance / Reconhecimento',
  engajamento: 'Engajamento',
  video: 'Visualização de Vídeo',
  outro: 'Geral',
};

export function avaliarResultadoCampanha(c: {
  objetivo: ObjetivoCampanha;
  investimento: number;
  impressoes: number;
  alcance: number;
  cliquesLink: number;
  visitasPagina: number;
  conversas: number;
  leadsCaptados: number;
  comprasAtribuidas: number;
  receitaAtribuida: number;
  engajamentos: number;
  visualizacoesVideo: number;
}): { resultado: string; unidade: string; custoOuRetorno: string; rotuloCusto: string } {
  switch (c.objetivo) {
    case 'mensagens':
      return {
        resultado: numero(c.conversas),
        unidade: c.conversas === 1 ? 'conversa' : 'conversas',
        custoOuRetorno: c.conversas > 0 ? dinheiroExato(c.investimento / c.conversas) : '—',
        rotuloCusto: 'por conversa',
      };
    case 'leads':
      return {
        resultado: numero(c.leadsCaptados),
        unidade: c.leadsCaptados === 1 ? 'lead' : 'leads',
        custoOuRetorno: c.leadsCaptados > 0 ? dinheiroExato(c.investimento / c.leadsCaptados) : '—',
        rotuloCusto: 'CPL',
      };
    case 'vendas':
      return {
        resultado: `${numero(c.comprasAtribuidas)} (${dinheiro(c.receitaAtribuida)})`,
        unidade: 'vendas',
        custoOuRetorno:
          c.investimento > 0 && c.receitaAtribuida > 0
            ? vezes(c.receitaAtribuida / c.investimento)
            : c.comprasAtribuidas > 0
              ? dinheiroExato(c.investimento / c.comprasAtribuidas)
              : '—',
        rotuloCusto: c.receitaAtribuida > 0 ? 'ROAS' : 'CPA',
      };
    case 'trafego': {
      const base = c.visitasPagina > 0 ? c.visitasPagina : c.cliquesLink;
      const un = c.visitasPagina > 0 ? 'visitas LP' : 'cliques no link';
      return {
        resultado: numero(base),
        unidade: un,
        custoOuRetorno: base > 0 ? dinheiroExato(c.investimento / base) : '—',
        rotuloCusto: c.visitasPagina > 0 ? 'por visita' : 'CPC',
      };
    }
    case 'video':
      return {
        resultado: contagemCurta(c.visualizacoesVideo),
        unidade: 'views vídeo',
        custoOuRetorno:
          c.visualizacoesVideo > 0 ? dinheiroExato(c.investimento / c.visualizacoesVideo) : '—',
        rotuloCusto: 'por view',
      };
    case 'engajamento':
      return {
        resultado: contagemCurta(c.engajamentos),
        unidade: 'interações',
        custoOuRetorno: c.engajamentos > 0 ? dinheiroExato(c.investimento / c.engajamentos) : '—',
        rotuloCusto: 'por interação',
      };
    case 'alcance':
    default: {
      const alc = c.alcance > 0 ? c.alcance : c.impressoes;
      return {
        resultado: contagemCurta(alc),
        unidade: c.alcance > 0 ? 'pessoas alcançadas' : 'impressões',
        custoOuRetorno:
          c.impressoes > 0 ? dinheiroExato((c.investimento * 1000) / c.impressoes) : '—',
        rotuloCusto: 'CPM',
      };
    }
  }
}
