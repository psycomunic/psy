import 'server-only';

/**
 * OS TRÊS PLANOS. ARQUIVO PRIVADO.
 *
 * O `server-only` no topo faz o build FALHAR se um componente de
 * cliente importar. Não é zelo: aqui tem preço, e a regra do projeto é
 * que valor não aparece em nenhum lugar do site público nem no bundle
 * que qualquer pessoa baixa.
 *
 * Estes planos só aparecem dentro de `/proposta/[slug]`, que é
 * `force-dynamic`, `noindex` e servido por link único.
 *
 * ============================================================
 * COMO A ESCADA FOI MONTADA
 * ============================================================
 * A versão anterior desta tabela tinha um problema que aparecia de
 * cara: da metade para baixo era traço em tudo, nas três colunas. Um
 * comparativo em que dois terços das linhas não são entregues por
 * ninguém não compara nada — ele só mostra o que a agência NÃO faz, e
 * ainda deixava o Apollo, o mais caro, com menos itens marcados que o
 * Falcon.
 *
 * A escada agora é por PERGUNTA, e não por lista de tarefas:
 *
 *   Saturno  — "quero minha mídia bem gerida"
 *   Falcon   — "quero mídia mais os canais que eu já tenho rendendo"
 *   Apollo   — "quero a operação inteira, incluindo o que não é mídia"
 *
 * Cada degrau contém o anterior inteiro. Isso é regra, e não estilo:
 * plano caro sem um item que o barato tem faz o cliente perguntar o que
 * está comprando, e a pergunta é justa.
 *
 * Os limites numéricos existem para o degrau ser VERIFICÁVEL. "Mais
 * atendimento" não se cobra; "duas reuniões por mês" se cobra.
 */

export type Plano = 'saturno' | 'falcon' | 'apollo';

export const PLANOS: Plano[] = ['saturno', 'falcon', 'apollo'];

export type FichaPlano = {
  id: Plano;
  nome: string;
  /** Uma linha dizendo para quem é. É o que a pessoa lê antes do preço. */
  paraQuem: string;
  /** O que muda de verdade em relação ao degrau anterior. */
  promessa: string;
  fee: number;
  destaque: boolean;
  selo: string | null;
  /** Faixa de faturamento em que este plano costuma fazer sentido. */
  indicadoPara: string;
};

export const fichas: Record<Plano, FichaPlano> = {
  saturno: {
    id: 'saturno',
    nome: 'Saturno',
    paraQuem: 'Loja que já vende e quer a mídia sob controle',
    promessa:
      'Meta e Google geridos com meta, leitura semanal e um retrato do mês que dá para conferir.',
    fee: 5000,
    destaque: false,
    selo: null,
    indicadoPara: 'Faturamento até R$ 150 mil/mês',
  },
  falcon: {
    id: 'falcon',
    nome: 'Falcon',
    paraQuem: 'Loja que quer parar de depender só de mídia paga',
    promessa:
      'Tudo do Saturno, mais o conteúdo: linhas editoriais, campanhas de data, criativos produzidos e recuperação de carrinho.',
    fee: 7000,
    destaque: true,
    selo: 'O mais contratado',
    indicadoPara: 'Faturamento de R$ 150 mil a R$ 500 mil/mês',
  },
  apollo: {
    id: 'apollo',
    nome: 'Apollo',
    paraQuem: 'Operação que quer a agência dentro do time',
    promessa:
      'Tudo do Falcon, mais a operação: plataforma, marketplaces, funil comercial, produto e mentoria do seu time.',
    fee: 10000,
    destaque: false,
    selo: 'Entrega tudo',
    indicadoPara: 'Faturamento acima de R$ 500 mil/mês',
  },
};

/** `true` = incluído · `false` = não incluído · texto = o limite exato */
export type Valor = boolean | string;

export type Linha = {
  nome: string;
  /** Uma frase de por que isso importa. Item sem explicação vira
      jargão, e jargão não se compara entre colunas. */
  porque?: string;
  valores: Record<Plano, Valor>;
};

export type Bloco = { titulo: string; apoio: string; linhas: Linha[] };

/**
 * Os blocos existem para a tabela ser LIDA.
 *
 * Dezoito linhas seguidas viram parede: ninguém compara a linha 3 com a
 * 14. Em quatro grupos de quatro ou cinco, dá para ver de longe onde
 * cada plano começa e onde ele para.
 */
export const blocos: Bloco[] = [
  {
    titulo: 'Mídia paga',
    apoio: 'O que todo plano entrega, em graus diferentes de alcance.',
    linhas: [
      {
        nome: 'Plataformas de anúncio',
        porque: 'Cada plataforma exige leitura, verba e criativo próprios.',
        valores: {
          saturno: 'Meta e Google',
          falcon: 'Sem limite de plataformas',
          apollo: 'Sem limite de plataformas',
        },
      },
      {
        nome: 'Campanhas ativas',
        valores: { saturno: 'Até 5 por mês', falcon: 'Sem limite', apollo: 'Sem limite' },
      },
      {
        nome: 'Verba de mídia sob gestão',
        porque: 'A verba é sua e vai direto para a plataforma. O fee da agência é à parte.',
        valores: {
          saturno: 'Até R$ 15 mil/mês',
          falcon: 'Até R$ 60 mil/mês',
          apollo: 'Sem teto',
        },
      },
      /*
        Criativo virou DUAS linhas porque são dois trabalhos com donos
        diferentes, e juntá-los numa linha só prometia o que a agência
        não faz.

        O material principal, sobretudo vídeo, sai melhor com quem vive
        o produto: quem está na loja sabe o detalhe que vende, e um
        externo não descobre isso em briefing. Então a sua equipe grava
        e a Psy Comunic dirige.

        O dia a dia é o contrário: variação de oferta, formato novo,
        destaque da semana. É volume constante, e é da agência.
      */
      {
        nome: 'Criativos do dia a dia',
        porque:
          'Variação de oferta, formato e destaque, toda semana. É o que mais move resultado em mídia hoje, e é volume que não para.',
        valores: {
          saturno: 'Referências e direção de arte',
          falcon: 'Produção e adaptação por formato',
          apollo: 'Produção contínua, com teste por ângulo',
        },
      },
      {
        nome: 'Direção do material principal',
        porque:
          'Vídeo de produto rende mais gravado por quem vive o produto. A sua equipe grava, a Psy Comunic define o roteiro, o corte e o que vai a teste.',
        valores: {
          saturno: 'Roteiro e referências do que gravar',
          falcon: 'Roteiro, referências e edição',
          apollo: 'Roteiro, edição e calendário de gravação',
        },
      },
      {
        nome: 'Copy de anúncio',
        valores: {
          saturno: 'Referências para o seu time escrever',
          falcon: 'Escrita pela agência',
          apollo: 'Escrita e teste A/B por ângulo',
        },
      },
      {
        nome: 'Públicos e remarketing',
        valores: {
          saturno: 'Públicos essenciais',
          falcon: 'Segmentação por etapa da jornada',
          apollo: 'Segmentação com base no seu CRM',
        },
      },
    ],
  },

  {
    titulo: 'Estratégia e acompanhamento',
    apoio: 'Com que frequência alguém olha os números e decide o que muda.',
    linhas: [
      {
        nome: 'Planejamento',
        valores: { saturno: 'Trimestral', falcon: 'Mensal', apollo: 'Mensal, revisto a cada 15 dias' },
      },
      {
        nome: 'Reunião de resultado',
        porque: 'É onde a decisão de verba acontece, e não no relatório.',
        valores: { saturno: '1 por mês', falcon: '2 por mês', apollo: 'Semanal' },
      },
      {
        nome: 'Painel de métricas ao vivo',
        porque: 'Receita, verba, MER e meta do mês, com o seu login. Não é print de planilha.',
        valores: { saturno: true, falcon: true, apollo: true },
      },
      {
        nome: 'Relatório mensal',
        valores: {
          saturno: 'Resultado e próximos passos',
          falcon: 'Com diário de bordo do que foi feito',
          apollo: 'Com análise de recompra e coorte',
        },
      },
      {
        nome: 'Canal direto com quem opera',
        valores: {
          saturno: 'E-mail, resposta em 1 dia útil',
          falcon: 'Grupo de WhatsApp',
          apollo: 'Grupo de WhatsApp com o time todo',
        },
      },
    ],
  },

  {
    titulo: 'Conteúdo e conversão',
    apoio: 'O que faz a loja vender sem depender só de aumentar a verba.',
    linhas: [
      {
        nome: 'Recuperação de carrinho e de boleto',
        porque: 'Pedido gerado e não pago é a receita mais barata de recuperar.',
        valores: { saturno: false, falcon: true, apollo: true },
      },
      {
        nome: 'Linhas editoriais e conteúdo',
        valores: { saturno: false, falcon: true, apollo: true },
      },
      {
        nome: 'Campanhas de comunicação e datas',
        porque: 'Black Friday e datas sazonais se preparam com meses de antecedência.',
        valores: { saturno: false, falcon: true, apollo: true },
      },
      {
        nome: 'Otimização de checkout e conversão',
        valores: { saturno: false, falcon: false, apollo: true },
      },
    ],
  },

  {
    titulo: 'Operação e crescimento',
    apoio: 'Quando a agência entra na operação, e não só na mídia. Exclusivo do Apollo.',
    linhas: [
      {
        nome: 'Manutenção e suporte da plataforma',
        porque: 'Magazord, Shopify e o que mais estiver rodando a loja.',
        valores: { saturno: false, falcon: false, apollo: true },
      },
      {
        nome: 'Gestão de marketplaces',
        valores: { saturno: false, falcon: false, apollo: true },
      },
      {
        nome: 'Estratégia comercial e funil',
        valores: { saturno: false, falcon: false, apollo: true },
      },
      {
        nome: 'Desenvolvimento de produto e oferta',
        porque: 'Mix, precificação e combo. Onde a margem se ganha antes da mídia.',
        valores: { saturno: false, falcon: false, apollo: true },
      },
      {
        nome: 'Mentoria comercial do seu time',
        valores: { saturno: false, falcon: false, apollo: true },
      },
    ],
  },
];

/**
 * O que TODO plano inclui, sem entrar na tabela.
 *
 * Fica de fora do comparativo de propósito: linha marcada nas três
 * colunas não diferencia nada e só faz a tabela crescer. Mas some da
 * proposta se não for dito em algum lugar, e é do que o cliente sente
 * falta quando troca de agência.
 */
export const sempreIncluso = [
  'Implantação e configuração de rastreamento, sem custo de setup',
  'Acesso ao painel de métricas para você e para quem você autorizar',
  'As contas de anúncio ficam no seu nome, e continuam suas se a parceria terminar',
  'Sem multa por cancelamento depois do terceiro mês',
];

export const condicoesPadrao = [
  'Fee mensal da agência. A verba de mídia é paga por você direto à plataforma e não passa pela Psy Comunic.',
  'Primeiro ciclo de 3 meses, que é o tempo mínimo para a leitura de resultado significar alguma coisa.',
  'Reajuste só na renovação anual, e conversado antes.',
];

export const fichaDoPlano = (p: Plano) => fichas[p];

/** Formata o fee. Fica aqui, e não no componente, porque preço é dado
    privado e o formatador acompanha o dado. */
export const feeEmReais = (p: Plano) =>
  fichas[p].fee.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  });

/**
 * O que UM plano entrega, agrupado.
 *
 * A tabela de três colunas não cabe num telefone, e a maioria abre a
 * proposta no telefone. Um slide por plano, com a lista inteira dele,
 * resolve sem inventar um segundo conteúdo só para tela pequena.
 *
 * Os não inclusos vêm juntos, marcados. Some-los faria o plano parecer
 * mais completo do que é, e a pessoa descobriria a diferença na
 * reunião, que é o pior lugar.
 */
export function entregasDoPlano(p: Plano) {
  return blocos.map((b) => ({
    titulo: b.titulo,
    itens: b.linhas.map((l) => ({
      nome: l.nome,
      valor: l.valores[p],
      incluso: l.valores[p] !== false,
    })),
  }));
}

/** Quantos itens o plano entrega, de quantos existem. */
export function contarEntregas(p: Plano) {
  const total = blocos.reduce((s, b) => s + b.linhas.length, 0);
  const inclusos = blocos.reduce(
    (s, b) => s + b.linhas.filter((l) => l.valores[p] !== false).length,
    0,
  );
  return { inclusos, total };
}

/**
 * As linhas em que os três planos DIFEREM de verdade.
 *
 * É o comparativo que cabe em tela pequena. Linha igual nas três
 * colunas não ajuda a escolher e só empurra o resto para fora da tela.
 */
export const diferencas: Linha[] = blocos
  .flatMap((b) => b.linhas)
  .filter((l) => {
    const [a, b2, c] = PLANOS.map((p) => JSON.stringify(l.valores[p]));
    return !(a === b2 && b2 === c);
  });
