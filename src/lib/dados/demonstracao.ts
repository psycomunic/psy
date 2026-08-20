import type {
  ContaResumo,
  DiaKpi,
  CanalKpi,
  FinanceiroMes,
  Lead,
  Tarefa,
  PessoaEquipe,
  Marco,
  Situacao,
  Estagio,
} from './tipos';

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

const contasBase = [
  { id: 'dm-1', nome: 'Loja Aurora',      plataforma: 'Nuvemshop', resp: 'Angelo Garcia', seed: 11, base: 9800,  meta: 320000, sit: 'saudavel' as Situacao },
  { id: 'dm-2', nome: 'Verano Casa',      plataforma: 'VTEX',      resp: 'Angelo Garcia', seed: 27, base: 21500, meta: 720000, sit: 'atencao'  as Situacao },
  { id: 'dm-3', nome: 'Nordeste Fitness', plataforma: 'Shopify',   resp: 'Angelo Garcia', seed: 43, base: 6200,  meta: 240000, sit: 'critico'  as Situacao },
  { id: 'dm-4', nome: 'Petit Bebê',       plataforma: 'Tray',      resp: 'Angelo Garcia', seed: 59, base: 4300,  meta: 150000, sit: 'saudavel' as Situacao },
  { id: 'dm-5', nome: 'Oficina do Ferro', plataforma: 'Magazord',  resp: 'Angelo Garcia', seed: 71, base: 12800, meta: 430000, sit: 'sem_dado' as Situacao },
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
    const receita = Math.round(c.base * ruido * (fds ? 0.72 : 1) * declinio);
    const investimento = Math.round(receita / (2.6 + r() * 1.7));
    const sessoes = Math.round(receita / (1.6 + r() * 0.7));
    const captados = Math.max(1, Math.round(sessoes * (0.014 + r() * 0.012)));
    const aprovados = Math.max(1, Math.round(captados * (0.76 + r() * 0.16)));
    const novos = Math.max(1, Math.round(aprovados * (0.42 + r() * 0.2)));
    const cliques = Math.round(investimento / (0.9 + r() * 0.8));
    const impressoes = Math.round(cliques * (28 + r() * 22));

    saida.push({
      dia: iso(d),
      sessoes,
      pedidosCaptados: captados,
      pedidosAprovados: aprovados,
      novosClientes: novos,
      receita,
      investimento,
      mer: Number((receita / investimento).toFixed(2)),
      ticketMedio: Number((receita / aprovados).toFixed(2)),
      cac: Number((investimento / novos).toFixed(2)),
      taxaConversao: Number(((100 * captados) / sessoes).toFixed(2)),
      taxaAprovacao: Number(((100 * aprovados) / captados).toFixed(2)),
    });
  }
  return saida;
}

export function contasDemo(): ContaResumo[] {
  return contasBase.map((c) => {
    const serie = serieDemo(c.id, 30);
    const doMes = serie.filter((d) => new Date(d.dia).getMonth() === hoje().getMonth());
    const receita = doMes.reduce((s, d) => s + d.receita, 0);
    const investimento = doMes.reduce((s, d) => s + d.investimento, 0);

    const ult7 = serie.slice(-7).reduce((s, d) => s + d.receita, 0);
    const ant7 = serie.slice(-14, -7).reduce((s, d) => s + d.receita, 0);

    const diaMes = hoje().getDate();
    const diasNoMes = new Date(hoje().getFullYear(), hoje().getMonth() + 1, 0).getDate();
    const restantes = Math.max(diasNoMes - diaMes + 1, 1);

    return {
      id: c.id,
      nome: c.nome,
      plataforma: c.plataforma,
      situacao: c.sit,
      receita,
      investimento,
      mer: investimento > 0 ? Number((receita / investimento).toFixed(2)) : null,
      metaAtingida: Number(((100 * receita) / c.meta).toFixed(1)),
      receitaMeta: c.meta,
      receitaDiaNecessaria: Number((Math.max(c.meta - receita, 0) / restantes).toFixed(2)),
      variacaoReceita: ant7 > 0 ? Number(((100 * (ult7 - ant7)) / ant7).toFixed(1)) : null,
      ultimoDia: serie.at(-1)?.dia ?? null,
      responsavel: c.resp,
    };
  });
}

export function canaisDemo(contaId: string): CanalKpi[] {
  const serie = serieDemo(contaId, 30);
  const receita = serie.reduce((s, d) => s + d.receita, 0);
  const investimento = serie.reduce((s, d) => s + d.investimento, 0);
  const pedidos = serie.reduce((s, d) => s + d.pedidosAprovados, 0);

  /* A divisão reflete uma operação real de e-commerce brasileiro: mídia
     paga puxa o volume, mas orgânico e direto carregam a maior margem
     porque não têm custo de aquisição atribuído. */
  const fatias = [
    { canal: 'google',   rec: 0.34, inv: 0.46 },
    { canal: 'meta',     rec: 0.28, inv: 0.44 },
    { canal: 'organico', rec: 0.18, inv: 0.0 },
    { canal: 'direto',   rec: 0.13, inv: 0.0 },
    { canal: 'email',    rec: 0.07, inv: 0.10 },
  ];

  return fatias.map((f, i) => {
    const rec = Math.round(receita * f.rec);
    const inv = Math.round(investimento * f.inv);
    const cliques = inv > 0 ? Math.round(inv / (1.1 + i * 0.2)) : 0;
    const impressoes = cliques * (30 + i * 6);
    return {
      canal: f.canal,
      receita: rec,
      investimento: inv,
      pedidos: Math.round(pedidos * f.rec),
      roas: inv > 0 ? Number((rec / inv).toFixed(2)) : null,
      cpc: cliques > 0 ? Number((inv / cliques).toFixed(2)) : null,
      ctr: impressoes > 0 ? Number(((100 * cliques) / impressoes).toFixed(2)) : null,
    };
  });
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
    recebidoMes: 19400,
    aReceberMes: 5400,
    inadimplencia: 3200,
    verbaSobGestao: contas.reduce((s, c) => s + c.investimento, 0),
  };
}

export function leadsDemo(): Lead[] {
  const base: { n: string; e: string; est: Estagio; o: string; v: number }[] = [
    { n: 'Camila Restier',  e: 'Moda Ateliê',        est: 'novo',        o: 'google',    v: 2500 },
    { n: 'Rodrigo Salles',  e: 'Casa & Jardim Sul',  est: 'contato',     o: 'indicacao', v: 3800 },
    { n: 'Bianca Toledo',   e: 'Suplementa Já',      est: 'diagnostico', o: 'meta',      v: 4200 },
    { n: 'Fernando Áquila', e: 'Ferramentas Prime',  est: 'proposta',    o: 'organico',  v: 6500 },
    { n: 'Juliana Prado',   e: 'Bebê Feliz Store',   est: 'negociacao',  o: 'indicacao', v: 5200 },
    { n: 'Marcos Vinholi',  e: 'Auto Peças Norte',   est: 'ganho',       o: 'google',    v: 4800 },
    { n: 'Patrícia Lemos',  e: 'Decor Minimal',      est: 'perdido',     o: 'meta',      v: 3100 },
    { n: 'Thiago Bastos',   e: 'Nutri Pet',          est: 'diagnostico', o: 'organico',  v: 2900 },
  ];
  const fim = hoje();
  return base.map((b, i) => {
    const d = new Date(fim);
    d.setDate(d.getDate() - (i * 3 + 1));
    return {
      id: `ld-${i + 1}`,
      nome: b.n,
      empresa: b.e,
      estagio: b.est,
      origem: b.o,
      valorEstimado: b.v,
      responsavel: 'Angelo Garcia',
      criadoEm: iso(d),
    };
  });
}

export function tarefasDemo(): Tarefa[] {
  const fim = hoje();
  const prazo = (n: number) => {
    const d = new Date(fim);
    d.setDate(d.getDate() + n);
    return iso(d);
  };
  return [
    { id: 't1', titulo: 'Revisar campanhas de Performance Max', conta: 'Loja Aurora',      status: 'fazendo',   responsavel: 'Angelo Garcia', prazo: prazo(1) },
    { id: 't2', titulo: 'Investigar queda na taxa de aprovação', conta: 'Nordeste Fitness', status: 'aberta',    responsavel: 'Angelo Garcia', prazo: prazo(-2) },
    { id: 't3', titulo: 'Subir novos criativos de remarketing',  conta: 'Verano Casa',      status: 'aberta',    responsavel: 'Angelo Garcia', prazo: prazo(3) },
    { id: 't4', titulo: 'Reunião mensal de resultados',          conta: 'Petit Bebê',       status: 'aberta',    responsavel: 'Angelo Garcia', prazo: prazo(5) },
    { id: 't5', titulo: 'Reconectar integração da loja',         conta: 'Oficina do Ferro', status: 'aberta',    responsavel: 'Angelo Garcia', prazo: prazo(0) },
    { id: 't6', titulo: 'Enviar relatório mensal',               conta: 'Loja Aurora',      status: 'concluida', responsavel: 'Angelo Garcia', prazo: prazo(-4) },
  ];
}

export function equipeDemo(): PessoaEquipe[] {
  return [
    { id: 'p1', nome: 'Angelo Garcia', email: 'psycomunic@gmail.com', papel: 'admin', ativo: true, contas: 5 },
  ];
}
