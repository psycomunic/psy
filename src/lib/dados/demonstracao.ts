import type {
  Cobranca,
  EstagioFunil,
  ContaFicha,
  Interacao,
  RegistroAuditoria,
  ContaResumo,
  DiaKpi,
  CanalKpi,
  CampanhaResumo,
  FinanceiroMes,
  Lead,
  Tarefa,
  PessoaEquipe,
  Marco,
  Situacao,
  Estagio,
  TipoConta,
} from './tipos';
import { ESTAGIOS } from './tipos';

/**
 * Dados de DEMONSTRAÇÃO.
 *
 * Existem para o sistema poder ser visto, discutido e corrigido antes do
 * banco existir. Não são dados de cliente nenhum: os nomes são
 * fictícios, de propósito, e toda tela que os usa carrega um aviso.
 *
 * REGRA QUE NÃO SE QUEBRA: nada aqui pode usar nome de cliente real. Um
 * número inventado ao lado de uma marca de verdade é o começo de um
 * print circulando como se fosse resultado.
 *
 * Números pseudoaleatórios, mas DETERMINÍSTICOS: a mesma semente gera
 * sempre a mesma série. Painel que muda de número a cada F5 é impossível
 * de discutir em reunião.
 */

/* Gerador determinístico. Math.random daria série nova a cada carga, e
   com renderização no servidor isso também causaria divergência entre o
   HTML enviado e o que o navegador recalcula. */
function semente(n: number) {
  let s = n >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const hoje = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const iso = (d: Date) => d.toISOString().slice(0, 10);

const contasBase: {
  id: string;
  nome: string;
  tipo: TipoConta;
  perfil: ContaResumo['perfilMetrica'];
  segmento: string;
  plataforma: string | null;
  resp: string;
  seed: number;
  base: number;
  meta: number | null;
  verbaMeta: number;
  resultadoMeta: number | null;
  sit: Situacao;
}[] = [
  { id: 'dm-1', nome: 'Loja Aurora',        tipo: 'ecommerce', perfil: 'ecommerce', segmento: 'Moda feminina',      plataforma: 'Nuvemshop', resp: 'Angelo Garcia', seed: 11, base: 9800,  meta: 320000, verbaMeta: 85000,  resultadoMeta: null, sit: 'saudavel' },
  { id: 'dm-2', nome: 'Pousada Serra Azul', tipo: 'trafego',   perfil: 'whatsapp',  segmento: 'Chalés e pousadas',  plataforma: null,        resp: 'Angelo Garcia', seed: 27, base: 0,     meta: null,   verbaMeta: 6500,   resultadoMeta: 420,  sit: 'saudavel' },
  { id: 'dm-3', nome: 'Nordeste Fitness',   tipo: 'ecommerce', perfil: 'ecommerce', segmento: 'Suplementos',        plataforma: 'Shopify',   resp: 'Angelo Garcia', seed: 43, base: 6200,  meta: 240000, verbaMeta: 68000,  resultadoMeta: null, sit: 'critico'  },
  { id: 'dm-4', nome: 'Atacado Têxtil Sul', tipo: 'trafego',   perfil: 'leads',     segmento: 'Atacado B2B',        plataforma: null,        resp: 'Angelo Garcia', seed: 59, base: 0,     meta: null,   verbaMeta: 9000,   resultadoMeta: 280,  sit: 'atencao'  },
  { id: 'dm-5', nome: 'Oficina do Ferro',   tipo: 'ecommerce', perfil: 'ecommerce', segmento: 'Casa e decoração',   plataforma: 'Magazord',  resp: 'Angelo Garcia', seed: 71, base: 12800, meta: 430000, verbaMeta: 110000, resultadoMeta: null, sit: 'sem_dado' },
];

/** Série diária de uma conta, com sazonalidade de fim de semana. */
export function serieDemo(contaId: string, dias = 30): DiaKpi[] {
  const c = contasBase.find((x) => x.id === contaId) ?? contasBase[0];
  const r = semente(c.seed);
  const fim = hoje();
  const saida: DiaKpi[] = [];

  /* Conta "sem_dado" para de reportar há três dias, de propósito: é o
     estado que o semáforo precisa saber representar. */
  const corte = c.sit === 'sem_dado' ? 3 : 0;

  for (let i = dias - 1; i >= corte; i--) {
    const d = new Date(fim);
    d.setDate(d.getDate() - i);
    const fds = d.getDay() === 0 || d.getDay() === 6;

    /* Conta crítica em queda progressiva: é o que faz o semáforo
       acender, e sem isso o alarme nunca aparece na tela. */
    const declinio = c.sit === 'critico' ? 1 - (dias - i) * 0.012 : 1;

    const ruido = 0.72 + r() * 0.56;
    const ehEcommerce = c.tipo === 'ecommerce';
    const receita = ehEcommerce ? Math.round(c.base * ruido * (fds ? 0.72 : 1) * declinio) : 0;
    const investimento = ehEcommerce
      ? Math.round(receita / (2.6 + r() * 1.7))
      : Math.round((c.verbaMeta / 30) * ruido * (fds ? 1.15 : 0.95));
    const impressoes = Math.round(investimento * (38 + r() * 22));
    const alcance = Math.round(impressoes * (0.68 + r() * 0.14));
    const cliquesLink = Math.max(4, Math.round(impressoes * (0.016 + r() * 0.012)));
    const cliques = Math.round(cliquesLink * 1.32);
    const visitasPagina = Math.round(cliquesLink * (0.76 + r() * 0.12));
    const conversas = c.perfil === 'whatsapp'
      ? Math.max(2, Math.round(cliquesLink * (0.19 + r() * 0.09)))
      : Math.round(cliquesLink * 0.03);
    const leadsCaptados = c.perfil === 'leads'
      ? Math.max(1, Math.round(visitasPagina * (0.12 + r() * 0.07)))
      : 0;
    const sessoes = ehEcommerce ? Math.round(receita / (1.6 + r() * 0.7)) : visitasPagina;
    const captados = ehEcommerce ? Math.max(1, Math.round(sessoes * (0.014 + r() * 0.012))) : 0;
    const aprovados = ehEcommerce ? Math.max(1, Math.round(captados * (0.76 + r() * 0.16))) : 0;
    const novos = ehEcommerce ? Math.max(1, Math.round(aprovados * (0.42 + r() * 0.2))) : 0;
    const receitaAtribuida = ehEcommerce ? Math.round(receita * (0.78 + r() * 0.26)) : 0;
    const comprasAtribuidas = ehEcommerce ? Math.max(1, Math.round(aprovados * 0.85)) : 0;
    const carrinhos = ehEcommerce ? Math.round(captados * 2.8) : 0;
    const checkouts = ehEcommerce ? Math.round(captados * 1.4) : 0;
    const engajamentos = Math.round(impressoes * 0.035);
    const visualizacoesVideo = Math.round(impressoes * 0.18);

    saida.push({
      dia: iso(d),
      sessoes,
      pedidosCaptados: captados,
      pedidosAprovados: aprovados,
      novosClientes: novos,
      receita,
      receitaAtribuida,
      investimento,
      impressoes,
      alcance,
      cliques,
      cliquesLink,
      visitasPagina,
      conversas,
      leadsCaptados,
      comprasAtribuidas,
      carrinhos,
      checkouts,
      engajamentos,
      visualizacoesVideo,
      mer: ehEcommerce && investimento > 0 ? Number((receita / investimento).toFixed(2)) : null,
      ticketMedio: aprovados > 0 ? Number((receita / aprovados).toFixed(2)) : null,
      cac: novos > 0 ? Number((investimento / novos).toFixed(2)) : null,
      taxaConversao: sessoes > 0 && captados > 0 ? Number(((100 * captados) / sessoes).toFixed(2)) : null,
      taxaAprovacao: captados > 0 ? Number(((100 * aprovados) / captados).toFixed(2)) : null,
    });
  }
  return saida;
}

export function contasDemo(): ContaResumo[] {
  return contasBase.map((c) => {
    const serie = serieDemo(c.id, 30);
    const doMes = serie.filter((d) => new Date(d.dia).getMonth() === hoje().getMonth());
    const receita = doMes.reduce((s, d) => s + d.receita, 0);
    const receitaAtribuida = doMes.reduce((s, d) => s + d.receitaAtribuida, 0);
    const investimento = doMes.reduce((s, d) => s + d.investimento, 0);
    const conversas = doMes.reduce((s, d) => s + d.conversas, 0);
    const leadsCaptados = doMes.reduce((s, d) => s + d.leadsCaptados, 0);
    const comprasAtribuidas = doMes.reduce((s, d) => s + d.comprasAtribuidas, 0);
    const alcance = doMes.reduce((s, d) => s + d.alcance, 0);
    const cliquesLink = doMes.reduce((s, d) => s + d.cliquesLink, 0);

    const ult7 = serie.slice(-7).reduce((s, d) => s + d.receita, 0);
    const ant7 = serie.slice(-14, -7).reduce((s, d) => s + d.receita, 0);

    const diaMes = hoje().getDate();
    const diasNoMes = new Date(hoje().getFullYear(), hoje().getMonth() + 1, 0).getDate();
    const restantes = Math.max(diasNoMes - diaMes + 1, 1);

    return {
      id: c.id,
      nome: c.nome,
      tipo: c.tipo,
      perfilMetrica: c.perfil,
      kpisVisiveis: null,
      segmento: c.segmento,
      plataforma: c.plataforma,
      situacao: c.sit,
      receita,
      receitaAtribuida,
      investimento,
      conversas,
      leadsCaptados,
      comprasAtribuidas,
      alcance,
      cliquesLink,
      mer: c.tipo === 'ecommerce' && investimento > 0 ? Number((receita / investimento).toFixed(2)) : null,
      metaAtingida: c.meta ? Number(((100 * receita) / c.meta).toFixed(1)) : null,
      receitaMeta: c.meta,
      verbaMeta: c.verbaMeta,
      resultadoMeta: c.resultadoMeta,
      custoResultadoTeto: null,
      receitaDiaNecessaria: c.meta ? Number((Math.max(c.meta - receita, 0) / restantes).toFixed(2)) : null,
      variacaoReceita: ant7 > 0 ? Number(((100 * (ult7 - ant7)) / ant7).toFixed(1)) : null,
      ultimoDia: serie.at(-1)?.dia ?? null,
      responsavel: c.resp,
    };
  });
}

export function canaisDemo(contaId: string): CanalKpi[] {
  const serie = serieDemo(contaId, 30);
  const receita = serie.reduce((s, d) => s + d.receita, 0);
  const receitaAtribuida = serie.reduce((s, d) => s + d.receitaAtribuida, 0);
  const investimento = serie.reduce((s, d) => s + d.investimento, 0);
  const pedidos = serie.reduce((s, d) => s + d.pedidosAprovados, 0);
  const conversas = serie.reduce((s, d) => s + d.conversas, 0);
  const leadsCaptados = serie.reduce((s, d) => s + d.leadsCaptados, 0);

  const fatias = [
    { canal: 'meta',     rec: 0.34, inv: 0.56 },
    { canal: 'google',   rec: 0.36, inv: 0.44 },
    { canal: 'organico', rec: 0.18, inv: 0.0 },
    { canal: 'direto',   rec: 0.12, inv: 0.0 },
  ];

  return fatias.map((f, i) => {
    const rec = Math.round(receita * f.rec);
    const recAtr = Math.round(receitaAtribuida * (f.inv > 0 ? f.inv : 0));
    const inv = Math.round(investimento * f.inv);
    const cliques = inv > 0 ? Math.round(inv / (1.1 + i * 0.2)) : 40;
    const impressoes = cliques * (30 + i * 6);
    return {
      canal: f.canal,
      receita: rec,
      receitaAtribuida: recAtr,
      investimento: inv,
      pedidos: Math.round(pedidos * f.rec),
      conversas: f.inv > 0 ? Math.round(conversas * f.inv) : 0,
      leadsCaptados: f.inv > 0 ? Math.round(leadsCaptados * f.inv) : 0,
      comprasAtribuidas: Math.round(pedidos * f.rec),
      impressoes,
      alcance: Math.round(impressoes * 0.72),
      cliques,
      cliquesLink: cliques,
      roas: inv > 0 && rec > 0 ? Number((rec / inv).toFixed(2)) : null,
      roasDeclarado: inv > 0 && recAtr > 0 ? Number((recAtr / inv).toFixed(2)) : null,
      cpc: inv > 0 && cliques > 0 ? Number((inv / cliques).toFixed(2)) : null,
      ctr: impressoes > 0 ? Number(((100 * cliques) / impressoes).toFixed(2)) : null,
    };
  });
}

export function campanhasDemo(contaId: string): CampanhaResumo[] {
  const c = contasBase.find((x) => x.id === contaId) ?? contasBase[0];
  const serie = serieDemo(contaId, 14);
  const invTotal = serie.reduce((s, d) => s + d.investimento, 0) || 1200;

  if (c.perfil === 'whatsapp') {
    const convTotal = serie.reduce((s, d) => s + d.conversas, 0) || 120;
    return [
      {
        campanhaId: 'cmp-wpp-1',
        campanhaNome: '[WPP] Pacotes de Fim de Semana e Feriados',
        provedor: 'meta_ads',
        canal: 'meta',
        objetivo: 'mensagens',
        statusCampanha: 'ACTIVE',
        investimento: Math.round(invTotal * 0.68),
        impressoes: 64200,
        alcance: 41800,
        cliques: 1480,
        cliquesLink: 1120,
        visitasPagina: 0,
        conversas: Math.round(convTotal * 0.82),
        leadsCaptados: 0,
        comprasAtribuidas: 0,
        receitaAtribuida: 0,
        carrinhos: 0,
        checkouts: 0,
        engajamentos: 1920,
        visualizacoesVideo: 14300,
        ctr: 1.74,
        cpc: Number(((invTotal * 0.68) / 1120).toFixed(2)),
        cpm: Number((((invTotal * 0.68) * 1000) / 64200).toFixed(2)),
      },
      {
        campanhaId: 'cmp-alc-2',
        campanhaNome: '[Reels] Tour pelo Chalé e Gastronomia',
        provedor: 'meta_ads',
        canal: 'meta',
        objetivo: 'alcance',
        statusCampanha: 'ACTIVE',
        investimento: Math.round(invTotal * 0.32),
        impressoes: 58900,
        alcance: 47200,
        cliques: 620,
        cliquesLink: 310,
        visitasPagina: 0,
        conversas: Math.round(convTotal * 0.18),
        leadsCaptados: 0,
        comprasAtribuidas: 0,
        receitaAtribuida: 0,
        carrinhos: 0,
        checkouts: 0,
        engajamentos: 3410,
        visualizacoesVideo: 29800,
        ctr: 0.53,
        cpc: Number(((invTotal * 0.32) / 310).toFixed(2)),
        cpm: Number((((invTotal * 0.32) * 1000) / 58900).toFixed(2)),
      },
    ];
  }

  if (c.perfil === 'leads') {
    const leadsTotal = serie.reduce((s, d) => s + d.leadsCaptados, 0) || 85;
    return [
      {
        campanhaId: 'cmp-ld-1',
        campanhaNome: '[Search] Lojistas Moda Atacado Sul/Sudeste',
        provedor: 'google_ads',
        canal: 'google',
        objetivo: 'leads',
        statusCampanha: 'ENABLED',
        investimento: Math.round(invTotal * 0.55),
        impressoes: 18400,
        alcance: 14100,
        cliques: 920,
        cliquesLink: 920,
        visitasPagina: 780,
        conversas: 0,
        leadsCaptados: Math.round(leadsTotal * 0.6),
        comprasAtribuidas: 0,
        receitaAtribuida: 0,
        carrinhos: 0,
        checkouts: 0,
        engajamentos: 920,
        visualizacoesVideo: 0,
        ctr: 5.0,
        cpc: Number(((invTotal * 0.55) / 920).toFixed(2)),
        cpm: Number((((invTotal * 0.55) * 1000) / 18400).toFixed(2)),
      },
      {
        campanhaId: 'cmp-ld-2',
        campanhaNome: '[Meta LP] Catálogo Coleção Nova B2B',
        provedor: 'meta_ads',
        canal: 'meta',
        objetivo: 'leads',
        statusCampanha: 'ACTIVE',
        investimento: Math.round(invTotal * 0.45),
        impressoes: 49200,
        alcance: 31500,
        cliques: 1180,
        cliquesLink: 860,
        visitasPagina: 670,
        conversas: 14,
        leadsCaptados: Math.round(leadsTotal * 0.4),
        comprasAtribuidas: 0,
        receitaAtribuida: 0,
        carrinhos: 0,
        checkouts: 0,
        engajamentos: 1410,
        visualizacoesVideo: 8900,
        ctr: 1.75,
        cpc: Number(((invTotal * 0.45) / 860).toFixed(2)),
        cpm: Number((((invTotal * 0.45) * 1000) / 49200).toFixed(2)),
      },
    ];
  }

  const recTotal = serie.reduce((s, d) => s + d.receitaAtribuida, 0);
  const compTotal = serie.reduce((s, d) => s + d.comprasAtribuidas, 0);
  return [
    {
      campanhaId: 'cmp-ec-1',
      campanhaNome: '[Advantage+] Catálogo Curva A',
      provedor: 'meta_ads',
      canal: 'meta',
      objetivo: 'vendas',
      statusCampanha: 'ACTIVE',
      investimento: Math.round(invTotal * 0.54),
      impressoes: 142000,
      alcance: 89000,
      cliques: 3420,
      cliquesLink: 2680,
      visitasPagina: 2210,
      conversas: 18,
      leadsCaptados: 0,
      comprasAtribuidas: Math.round(compTotal * 0.58),
      receitaAtribuida: Math.round(recTotal * 0.58),
      carrinhos: Math.round(compTotal * 2.1),
      checkouts: Math.round(compTotal * 1.1),
      engajamentos: 4800,
      visualizacoesVideo: 31000,
      ctr: 1.89,
      cpc: Number(((invTotal * 0.54) / 2680).toFixed(2)),
      cpm: Number((((invTotal * 0.54) * 1000) / 142000).toFixed(2)),
    },
    {
      campanhaId: 'cmp-ec-2',
      campanhaNome: '[PMax] Shopping + Remarketing Dinâmico',
      provedor: 'google_ads',
      canal: 'google',
      objetivo: 'vendas',
      statusCampanha: 'ENABLED',
      investimento: Math.round(invTotal * 0.46),
      impressoes: 118000,
      alcance: 76000,
      cliques: 2890,
      cliquesLink: 2890,
      visitasPagina: 2450,
      conversas: 0,
      leadsCaptados: 0,
      comprasAtribuidas: Math.round(compTotal * 0.42),
      receitaAtribuida: Math.round(recTotal * 0.42),
      carrinhos: 0,
      checkouts: 0,
      engajamentos: 2890,
      visualizacoesVideo: 0,
      ctr: 2.45,
      cpc: Number(((invTotal * 0.46) / 2890).toFixed(2)),
      cpm: Number((((invTotal * 0.46) * 1000) / 118000).toFixed(2)),
    },
  ];
}

export function marcosDemo(contaId: string): Marco[] {
  const fim = hoje();
  const dia = (n: number) => {
    const d = new Date(fim);
    d.setDate(d.getDate() - n);
    return iso(d);
  };
  const porConta: Record<string, Marco[]> = {
    'dm-3': [
      { id: 'm1', dia: dia(9),  tipo: 'site',      titulo: 'Checkout fora do ar por 4 horas', detalhe: 'Falha no gateway. Pedidos captados caíram 61% no dia.' },
      { id: 'm2', dia: dia(4),  tipo: 'verba',     titulo: 'Verba reduzida pelo cliente',     detalhe: 'Corte de 35% no orçamento de mídia a pedido do lojista.' },
    ],
    'dm-2': [
      { id: 'm3', dia: dia(12), tipo: 'promocao',  titulo: 'Frete grátis acima de R$ 199',    detalhe: 'Ticket médio subiu, margem por pedido caiu.' },
    ],
  };
  return porConta[contaId] ?? [
    { id: 'm0', dia: dia(6), tipo: 'criativo', titulo: 'Novo criativo de remarketing no ar', detalhe: null },
  ];
}

export function financeiroDemo(): FinanceiroMes {
  const contas = contasDemo();
  return {
    receitaRecorrente: 24800,
    contratosAtivos: contas.length,
    faturadoMes: 24800,
    recebidoMes: 19400,
    recebidoLiquidoMes: 18960,
    aReceberMes: 5400,
    inadimplencia: 3200,
    faturasVencidas: 2,
    despesaMes: 8700,
    despesaPrevistaMes: 2400,
    verbaSobGestao: contas.reduce((s, c) => s + c.investimento, 0),
  };
}

export function leadsDemo(): Lead[] {
  const base: {
    n: string; e: string; est: Estagio; o: string; fee: number;
    prob: number; passo: string | null; diasParado: number;
  }[] = [
    { n: "Camila Restier",  e: "Moda Ateliê",       est: "novo",        o: "google",    fee: 2500, prob: 20, passo: "Primeira ligação", diasParado: 1 },
    { n: "Rodrigo Salles",  e: "Casa & Jardim Sul", est: "contato",     o: "indicacao", fee: 3800, prob: 35, passo: "Enviar material", diasParado: 3 },
    { n: "Bianca Toledo",   e: "Suplementa Já",     est: "diagnostico", o: "meta",      fee: 4200, prob: 50, passo: "Rodar diagnóstico das 4 frentes", diasParado: 11 },
    { n: "Fernando Áquila", e: "Ferramentas Prime", est: "proposta",    o: "organico",  fee: 6500, prob: 65, passo: "Cobrar retorno da proposta", diasParado: 9 },
    { n: "Juliana Prado",   e: "Bebê Feliz Store",  est: "negociacao",  o: "indicacao", fee: 5200, prob: 80, passo: "Fechar condição de setup", diasParado: 2 },
    { n: "Marcos Vinholi",  e: "Auto Peças Norte",  est: "ganho",       o: "google",    fee: 4800, prob: 100, passo: null, diasParado: 20 },
    { n: "Patrícia Lemos",  e: "Decor Minimal",     est: "perdido",     o: "meta",      fee: 3100, prob: 0, passo: null, diasParado: 40 },
    { n: "Thiago Bastos",   e: "Nutri Pet",         est: "diagnostico", o: "organico",  fee: 2900, prob: 45, passo: "Agendar reunião de diagnóstico", diasParado: 4 },
  ];

  const fim = hoje();
  const dias = (n: number) => {
    const x = new Date(fim);
    x.setDate(x.getDate() - n);
    return iso(x);
  };

  return base.map((b, i) => ({
    id: `ld-${i + 1}`,
    nome: b.n,
    empresa: b.e,
    email: null,
    telefone: null,
    estagio: b.est,
    origem: b.o,
    /* A maquete é toda de mensalidade: ela desenha a operação de
       e-commerce, que é recorrente por natureza. Trabalho avulso
       aparece com dado de verdade, e não inventado aqui. */
    cobranca: 'mensal' as const,
    servico: null,
    valorFee: b.fee,
    valorVerba: b.fee * 6,
    probabilidade: b.prob,
    responsavel: "Angelo Garcia",
    responsavelId: "p1",
    proximoPasso: b.passo,
    proximoPassoEm: b.passo ? dias(-2) : null,
    diasNoEstagio: b.diasParado,
    diasDesdeEntrada: i * 3 + 1 + b.diasParado,
    motivoPerda: b.est === "perdido" ? "Escolheu uma agência mais barata" : null,
    contaId: b.est === "ganho" ? "dm-1" : null,
    criadoEm: dias(i * 3 + 1),
  }));
}

/** Soma de um dos dois dinheiros, crua ou ponderada. Separar aqui
    também: a maquete que soma errado ensina a ler errado. */
function soma(leads: Lead[], cobranca: Cobranca, ponderar = false) {
  return Math.round(
    leads
      .filter((l) => l.cobranca === cobranca)
      .reduce((s, l) => s + (l.valorFee ?? 0) * (ponderar ? (l.probabilidade ?? 50) / 100 : 1), 0),
  );
}

export function funilDemo(): EstagioFunil[] {
  const leads = leadsDemo();
  return ESTAGIOS.map((estagio) => {
    const doEstagio = leads.filter((l) => l.estagio === estagio);
    return {
      estagio,
      quantidade: doEstagio.length,
      valorMensal: soma(doEstagio, 'mensal'),
      valorProjeto: soma(doEstagio, 'projeto'),
      ponderadoMensal: soma(doEstagio, 'mensal', true),
      ponderadoProjeto: soma(doEstagio, 'projeto', true),
      diasMedios: doEstagio.length
        ? Number((doEstagio.reduce((s, l) => s + l.diasNoEstagio, 0) / doEstagio.length).toFixed(1))
        : null,
      parados: doEstagio.filter(
        (l) => l.diasNoEstagio >= 7 && l.estagio !== "ganho" && l.estagio !== "perdido",
      ).length,
    };
  });
}

export function fichaDemo(contaId: string): ContaFicha | null {
  const c = contasBase.find((x) => x.id === contaId);
  if (!c) return null;
  const problemas = c.sit === "critico" ? 3 : c.sit === "atencao" ? 1 : 0;
  return {
    id: c.id,
    nome: c.nome,
    tipo: c.tipo,
    perfilMetrica: c.perfil,
    kpisVisiveis: null,
    razaoSocial: null,
    documento: null,
    plataforma: c.plataforma,
    site: null,
    instagram: null,
    segmento: c.segmento,
    situacao: "ativa",
    dataInicio: null,
    observacoes: null,
    responsavel: c.resp,
    responsavelId: null,
    escopo: ["Tráfego Meta Ads", "Criativos de performance"],
    objetivoPrincipal: null,
    publicoAlvo: null,
    ofertaPrincipal: null,
    diferenciais: null,
    linksUteis: {},
    checklistOnboarding: { acessos: true, rastreamento: true, fontes: true },
    pontuacao: c.sit === "saudavel" ? 96 : c.sit === "atencao" ? 72 : c.sit === "critico" ? 38 : 55,
    tarefasAtrasadas: problemas,
    inadimplencia: c.sit === "critico" ? 3200 : 0,
    diasSemRegistro: c.sit === "critico" ? 34 : 5,
  };
}

export function interacoesDemo(): Interacao[] {
  const agora = Date.now();
  const h = (n: number) => new Date(agora - n * 3600000).toISOString();
  return [
    { id: "i1", tipo: "reuniao", resumo: "Reunião de diagnóstico. Dor principal é taxa de aprovação em boleto.", autor: "Angelo Garcia", em: h(30) },
    { id: "i2", tipo: "whatsapp", resumo: "Confirmou o acesso à conta de anúncios.", autor: "Angelo Garcia", em: h(76) },
    { id: "i3", tipo: "ligacao", resumo: "Primeiro contato. Fatura cerca de R$ 200 mil por mês.", autor: "Angelo Garcia", em: h(150) },
  ];
}

export function tarefasDemo(): Tarefa[] {
  const fim = hoje();
  const prazo = (n: number) => {
    const d = new Date(fim);
    d.setDate(d.getDate() + n);
    return iso(d);
  };
  const base: {
    id: string; t: string; c: string; s: Tarefa['status']; d: number;
    p: Tarefa['prioridade']; r: Tarefa['recorrencia'];
  }[] = [
    { id: 't1', t: 'Revisar campanhas de Performance Max', c: 'Loja Aurora',      s: 'fazendo',   d: 1,  p: 'alta',    r: 'semanal' },
    { id: 't2', t: 'Investigar queda na taxa de aprovação', c: 'Nordeste Fitness', s: 'aberta',    d: -2, p: 'urgente', r: 'nenhuma' },
    { id: 't3', t: 'Subir novos criativos de remarketing',  c: 'Verano Casa',      s: 'aberta',    d: 3,  p: 'media',   r: 'nenhuma' },
    { id: 't4', t: 'Reunião mensal de resultados',          c: 'Petit Bebê',       s: 'aberta',    d: 5,  p: 'media',   r: 'mensal' },
    { id: 't5', t: 'Reconectar integração da loja',         c: 'Oficina do Ferro', s: 'aberta',    d: 0,  p: 'alta',    r: 'nenhuma' },
    { id: 't6', t: 'Enviar relatório mensal',               c: 'Loja Aurora',      s: 'concluida', d: -4, p: 'media',   r: 'mensal' },
  ];

  return base.map((b) => ({
    id: b.id,
    titulo: b.t,
    detalhe: null,
    conta: b.c,
    contaId: null,
    status: b.s,
    responsavel: 'Angelo Garcia',
    responsavelId: null,
    prazo: prazo(b.d),
    prioridade: b.p,
    recorrencia: b.r,
    lembrarDias: 1,
    concluidaEm: b.s === 'concluida' ? prazo(b.d) : null,
    diasAtePrazo: b.d,
  }));
}

export function equipeDemo(): PessoaEquipe[] {
  const todas = contasBase.map((c) => ({ id: c.id, nome: c.nome }));
  return [
    {
      id: 'p1',
      nome: 'Angelo Garcia',
      email: 'psycomunic@gmail.com',
      papel: 'administrador',
      ativo: true,
      contas: todas,
    },
    /* Um operador com recorte: ele enxerga o módulo de métricas, mas só
       as duas lojas em que é responsável. É o caso que mostra que o
       recorte por loja acontece no banco, e não na tela. */
    {
      id: 'p2',
      nome: 'Operadora de exemplo',
      email: 'operacao@exemplo.invalido',
      papel: 'operador',
      ativo: true,
      contas: todas.slice(0, 2),
    },
    {
      id: 'p3',
      nome: 'Dono da Loja Aurora',
      email: 'dono@exemplo.invalido',
      papel: 'cliente',
      ativo: true,
      contas: todas.slice(0, 1),
    },
  ];
}

export function auditoriaDemo(): RegistroAuditoria[] {
  const agora = Date.now();
  const horasAtras = (h: number) => new Date(agora - h * 3600000).toISOString();

  return [
    {
      id: 4, autor: 'Angelo Garcia', autorPapel: 'administrador',
      acao: 'update', tabela: 'contrato', registroId: 'dm-c1', em: horasAtras(3),
      mudancas: [{ campo: 'fee_mensal', de: 4800, para: 5200 }],
    },
    {
      id: 3, autor: 'Angelo Garcia', autorPapel: 'administrador',
      acao: 'insert', tabela: 'acessos_conta', registroId: 'dm-a1', em: horasAtras(9),
      mudancas: [{ campo: 'conta_id', de: null, para: 'Loja Aurora' }],
    },
    {
      id: 2, autor: 'Angelo Garcia', autorPapel: 'administrador',
      acao: 'update', tabela: 'perfil', registroId: 'dm-p2', em: horasAtras(28),
      mudancas: [{ campo: 'ativo', de: true, para: false }],
    },
    {
      id: 1, autor: 'Angelo Garcia', autorPapel: 'administrador',
      acao: 'insert', tabela: 'conta', registroId: 'dm-1', em: horasAtras(52),
      mudancas: [{ campo: 'nome', de: null, para: 'Loja Aurora' }],
    },
  ];
}
