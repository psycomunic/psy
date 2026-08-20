/**
 * Regras de negócio de performance de e-commerce.
 *
 * Funções PURAS: entram números, saem números. Sem banco, sem React,
 * sem data do sistema escondida dentro. É o que torna estas fórmulas
 * testáveis, e elas são as que decidem se uma conta está bem ou mal.
 *
 * ---------------------------------------------------------------
 * DINHEIRO E PONTO FLUTUANTE
 * ---------------------------------------------------------------
 * O banco guarda valor em `numeric`, que no Postgres é decimal EXATO,
 * e não ponto flutuante. Toda soma de dinheiro acontece lá, nas views.
 *
 * Aqui, em JavaScript, `number` é float64. Por isso estas funções
 * fazem DIVISÃO e COMPARAÇÃO, que toleram o arredondamento, e evitam
 * somar longas listas de valores. Quando somar for inevitável, o
 * resultado passa por `arredondar()` antes de virar decisão.
 */

/** Duas casas, o suficiente para dinheiro e para índice de eficiência. */
export const arredondar = (n: number, casas = 2) => {
  const f = 10 ** casas;
  return Math.round((n + Number.EPSILON) * f) / f;
};

/** Divisão que devolve null em vez de Infinity ou NaN.
 *
 *  Não é preciosismo: `receita / 0` dá Infinity, que atravessa
 *  comparação (`Infinity > meta` é true) e chega na tela como "∞x".
 *  null obriga quem chama a decidir o que mostrar. */
export const divisao = (a: number, b: number, casas = 2): number | null =>
  b > 0 && Number.isFinite(a) && Number.isFinite(b) ? arredondar(a / b, casas) : null;

/**
 * MER — Marketing Efficiency Ratio.
 *
 * Receita TOTAL sobre investimento TOTAL. Diferente do ROAS que cada
 * plataforma reporta, porque ali cada uma se atribui a mesma venda:
 * Google e Meta somam 4x cada um e a loja fatura metade disso. O MER é
 * quem denuncia.
 */
export const mer = (receitaTotal: number, investimentoTotal: number) =>
  divisao(receitaTotal, investimentoTotal);

/**
 * ROAS de um canal isolado.
 *
 * Mesma conta do MER, mas recortada por canal. Só faz sentido para
 * canal COM investimento: orgânico e direto não têm custo atribuído, e
 * devolver ROAS infinito para eles seria mentira com cara de número.
 */
export const roas = (receitaCanal: number, investimentoCanal: number) =>
  divisao(receitaCanal, investimentoCanal);

/**
 * CAC — custo de aquisição de cliente.
 *
 * Divide por CLIENTE NOVO, e não por pedido. Dividir por todos os
 * pedidos subestima a aquisição toda vez que a base recompra, e o erro
 * cresce junto com a saúde da loja.
 */
export const cac = (investimento: number, clientesNovos: number) =>
  divisao(investimento, clientesNovos);

/**
 * Ticket médio sobre pedido APROVADO.
 *
 * Sobre pedido captado ele mente para baixo: divide a receita que
 * entrou por pedidos que nunca foram pagos.
 */
export const ticketMedio = (receita: number, pedidosAprovados: number) =>
  divisao(receita, pedidosAprovados);

/** Da sessão ao pedido gerado, em porcento. */
export const taxaConversao = (pedidosCaptados: number, sessoes: number) =>
  divisao(100 * pedidosCaptados, sessoes);

/**
 * Do pedido gerado ao pedido pago, em porcento.
 *
 * O indicador mais esquecido do e-commerce brasileiro. Boleto vencido,
 * PIX expirado e cartão recusado por antifraude somem aqui, e não
 * aparecem em nenhum relatório de mídia.
 */
export const taxaAprovacao = (pedidosAprovados: number, pedidosCaptados: number) =>
  divisao(100 * pedidosAprovados, pedidosCaptados);

/** Receita que entrou no checkout e não virou dinheiro. */
export function perdaNoPagamento(
  pedidosCaptados: number,
  pedidosAprovados: number,
  ticket: number | null,
) {
  const perdidos = Math.max(pedidosCaptados - pedidosAprovados, 0);
  return {
    pedidos: perdidos,
    valor: ticket === null ? null : arredondar(perdidos * ticket),
  };
}

/** Variação percentual entre dois períodos. */
export const variacao = (atual: number, anterior: number) =>
  divisao(100 * (atual - anterior), anterior, 1);

/* ================================================================== */
/* Meta                                                                */
/* ================================================================== */

export type Meta = {
  /** 0 a 100+. Passar de 100 é bater a meta. */
  atingido: number | null;
  /** Quanto falta em reais. */
  falta: number;
  /** Quanto precisa faturar POR DIA no que resta. */
  porDia: number | null;
  /** Onde fecha se mantiver o ritmo dos dias já corridos. */
  projecao: number | null;
  /** true quando a projeção não alcança a meta. */
  emRisco: boolean;
};

/**
 * Progresso e projeção da meta do mês.
 *
 * `diaAtual` e `diasNoMes` entram como parâmetro em vez de sair de
 * `new Date()` aqui dentro: função que lê o relógio não é testável, e
 * esta decide se uma conta aparece como "em risco".
 *
 * O número acionável é `porDia`. "Faltam R$ 84 mil" não diz o que fazer
 * hoje; "precisa de R$ 7 mil por dia, e a média dos últimos 7 foi
 * R$ 4,2 mil" diz.
 */
export function progressoMeta(
  receitaNoMes: number,
  metaReceita: number | null,
  diaAtual: number,
  diasNoMes: number,
): Meta {
  if (!metaReceita || metaReceita <= 0) {
    return { atingido: null, falta: 0, porDia: null, projecao: null, emRisco: false };
  }

  const falta = Math.max(metaReceita - receitaNoMes, 0);

  /* O dia corrente conta como disponível: às 9h do dia 20 ainda dá para
     vender. Por isso `- diaAtual + 1`, e não `- diaAtual`. */
  const diasRestantes = Math.max(diasNoMes - diaAtual + 1, 1);

  /* A projeção usa os dias JÁ CORRIDOS como base do ritmo. No dia 1 não
     há ritmo, e projetar a partir de um dia só produz número selvagem. */
  const diasCorridos = Math.max(diaAtual, 1);
  const projecao =
    diaAtual < 2 ? null : arredondar((receitaNoMes / diasCorridos) * diasNoMes);

  return {
    atingido: arredondar((100 * receitaNoMes) / metaReceita, 1),
    falta: arredondar(falta),
    porDia: arredondar(falta / diasRestantes),
    projecao,
    emRisco: projecao !== null && projecao < metaReceita,
  };
}

/* ================================================================== */
/* Saúde da conta                                                      */
/* ================================================================== */

export type Situacao = 'saudavel' | 'atencao' | 'critico' | 'sem_dado';

export type EntradaSaude = {
  receita7: number;
  receita7Anterior: number;
  investimento7: number;
  /** Dias desde o último dado sincronizado. null = nunca sincronizou. */
  diasSemDado: number | null;
  metaAtingida: number | null;
};

/**
 * O semáforo, com a razão junto.
 *
 * A ordem dos casos é a ordem da gravidade, e o primeiro que casar
 * vence. Devolve o MOTIVO em texto porque um selo vermelho sem
 * explicação obriga a pessoa a abrir a conta para descobrir o que
 * houve, e isso é justamente o tempo que o alarme deveria economizar.
 *
 * Espelha a view `saude_conta`. As duas precisam continuar de acordo:
 * a view decide o que a lista mostra, esta função é o que o teste
 * verifica.
 */
export function saudeDaConta(e: EntradaSaude): { situacao: Situacao; motivo: string } {
  /* Antes de discutir performance: o número chegou? Painel com dado
     velho leva a decisão errada com confiança total. */
  if (e.diasSemDado === null || e.diasSemDado > 2) {
    return {
      situacao: 'sem_dado',
      motivo: 'A sincronização parou. Conferir a integração antes de olhar qualquer número.',
    };
  }

  const varReceita = variacao(e.receita7, e.receita7Anterior);
  const merAtual = mer(e.receita7, e.investimento7);

  if (varReceita !== null && varReceita < -25) {
    return { situacao: 'critico', motivo: `Receita ${varReceita}% nos últimos 7 dias.` };
  }

  /* MER abaixo de 1 é vender abaixo do custo de mídia: cada real
     investido volta como menos de um real. */
  if (merAtual !== null && merAtual < 1) {
    return { situacao: 'critico', motivo: `MER em ${merAtual}x: a mídia custa mais do que traz.` };
  }

  if (varReceita !== null && varReceita < -10) {
    return { situacao: 'atencao', motivo: `Receita ${varReceita}% nos últimos 7 dias.` };
  }

  if (e.metaAtingida !== null && e.metaAtingida < 70) {
    return { situacao: 'atencao', motivo: `Meta em ${e.metaAtingida}% do mês.` };
  }

  return { situacao: 'saudavel', motivo: 'Receita e eficiência dentro do esperado.' };
}

/* ================================================================== */
/* Pontuação de saúde                                                  */
/* ================================================================== */

export type EntradaPontuacao = EntradaSaude & {
  tarefasAtrasadas: number;
  inadimplencia: number;
  /** Dias desde o último registro no diário de bordo. null = nenhum. */
  diasSemRegistro: number | null;
};

/**
 * Nota de 0 a 100, por DESCONTO a partir de 100.
 *
 * Somar pontos positivos obrigaria a inventar peso para "estar normal".
 * Descontar é mais honesto: a conta começa saudável e cada problema tira
 * um pedaço, na proporção do estrago que causa.
 *
 * O maior desconto isolado é o SILÊNCIO. Cliente que não recebe notícia
 * há um mês cancela mesmo com número bom, e é o único item desta lista
 * que depende só da agência — os outros dependem do mercado, da loja ou
 * do meio de pagamento.
 *
 * ESTA FUNÇÃO ESPELHA a coluna `pontuacao` da view `saude_conta`. As
 * duas precisam continuar de acordo: a view é o que roda, esta é o que
 * o teste verifica. Mudou uma, mude a outra.
 */
export function pontuacaoSaude(e: EntradaPontuacao): number {
  let n = 100;

  /* Sem dado é o desconto mais pesado depois do silêncio: número velho
     leva a decisão errada com confiança total. */
  if (e.diasSemDado === null || e.diasSemDado > 2) n -= 30;

  if (e.metaAtingida !== null) {
    if (e.metaAtingida < 70) n -= 20;
    else if (e.metaAtingida < 90) n -= 10;
  }

  const varReceita = variacao(e.receita7, e.receita7Anterior);
  if (varReceita !== null) {
    if (varReceita < -25) n -= 25;
    else if (varReceita < -10) n -= 12;
  }

  const merAtual = mer(e.receita7, e.investimento7);
  if (merAtual !== null && merAtual < 1) n -= 20;

  /* Teto de 15: uma conta com vinte tarefas atrasadas não é pior que
     uma com três — as duas estão abandonadas, e o resto do desconto
     precisa sobrar para os outros sinais. */
  n -= Math.min(e.tarefasAtrasadas * 5, 15);

  if (e.inadimplencia > 0) n -= 15;

  if (e.diasSemRegistro === null) n -= 10;
  else if (e.diasSemRegistro > 30) n -= 20;
  else if (e.diasSemRegistro > 14) n -= 8;

  return Math.max(0, Math.min(100, n));
}

/* ================================================================== */
/* Funil                                                               */
/* ================================================================== */

/**
 * Previsão ponderada pela probabilidade.
 *
 * A soma crua do funil é sempre otimista: trata como certo o lead que
 * ainda não respondeu. Sem probabilidade informada, 50 é o chute neutro
 * — melhor do que assumir 100.
 */
export function previsaoPonderada(
  leads: { valorFee: number | null; probabilidade: number | null }[],
) {
  return arredondar(
    leads.reduce(
      (s, l) => s + (l.valorFee ?? 0) * ((l.probabilidade ?? 50) / 100),
      0,
    ),
  );
}

/**
 * Um lead está parado?
 *
 * Sete dias no mesmo estágio. Não é prazo de vendas, é limiar de
 * esquecimento: passou uma semana sem mudar de estado, ninguém tocou.
 */
export const LIMIAR_PARADO_DIAS = 7;

export function leadParado(diasNoEstagio: number, estagio: string) {
  /* Ganho e perdido são estados FINAIS. Um lead ganho há seis meses não
     está "parado", está resolvido. */
  if (estagio === 'ganho' || estagio === 'perdido') return false;
  return diasNoEstagio >= LIMIAR_PARADO_DIAS;
}
