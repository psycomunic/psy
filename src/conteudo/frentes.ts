/**
 * As 4 frentes de serviço. É a espinha dorsal do site: alimenta a home,
 * o hub /servicos e as quatro páginas filhas, que usam um template só.
 */
export type Frente = {
  slug: string;
  nome: string;
  resumo: string;
  contribuicoes: string[];
  duvidas: string[];
};

export const frentes: Frente[] = [
  {
    slug: 'gestao',
    nome: 'Gestão',
    resumo:
      'Onde a operação é desenhada: mercado, viabilidade, canais e quem faz o quê.',
    contribuicoes: [
      'Análise do mercado potencial e da concorrência',
      'Viabilidade do negócio',
      'Busca de novos canais',
      'Integração com marketplaces, televendas e lojas físicas',
      'Definição de organograma e atribuições',
    ],
    duvidas: [
      'Quem são meus concorrentes na internet?',
      'Quais os melhores canais para o meu produto?',
      'Estou precisando de uma equipe. Qual experiência ela precisa ter?',
      'Como posso diminuir meus custos sem impactar nas vendas?',
      'Qual meu planejamento para os próximos meses e anos?',
    ],
  },
  {
    slug: 'tecnologia',
    nome: 'Tecnologia',
    resumo:
      'Onde a visita vira pedido: plataforma, velocidade, checkout e integrações.',
    contribuicoes: [
      'Absorver ao máximo o potencial da plataforma',
      'Otimizar a navegação buscando melhor usabilidade e aumento de conversão',
      'Monitorar disponibilidade e tempo de resposta dos servidores',
      'Integração de gateway, adquirentes e antifraude',
      'Integração aos processos internos da empresa',
    ],
    duvidas: [
      'Estou tendo muitas visitas mas poucas vendas. O que posso melhorar?',
      'Meu site está lento e não sei o que fazer.',
      'Como posso ter mais agilidade no faturamento dos pedidos?',
      'O que faço para melhorar meu checkout e trazer mais pedidos?',
    ],
  },
  {
    slug: 'marketing',
    nome: 'Marketing',
    resumo:
      'Onde o investimento vira receita: mídia paga, criativo, conteúdo e ROI por canal.',
    contribuicoes: [
      'Identificar os produtos que despertam mais interesse e os mais vendidos',
      'Monitorar ROI por mídia para aumentar a rentabilidade do investimento',
      'Administração dos investimentos em mídia paga',
      'Manter os novos clientes envolvidos com conteúdo de blog e mídias sociais',
      'Estratégias para aumento do faturamento',
      'Planejamento de ações comerciais',
      'Desenvolvimento criativo de peças focadas em conversão e marca',
      'Elaboração de conteúdos que conversam com as estratégias propostas',
    ],
    duvidas: [
      'Como posso melhorar meu cadastro de produto?',
      'Como vou me manter atrativo para os clientes?',
      'Como posso investir em mídia de forma mais assertiva?',
      'CTR, ROI, CPA, CPM: como entender e melhorar esses KPIs?',
      'As propostas que recebemos para mídia são realmente boas?',
    ],
  },
  {
    slug: 'atendimento-logistica',
    nome: 'Atendimento & Logística',
    resumo:
      'Onde o pedido vira cliente que volta: SLA, entrega, aprovação de pagamento e recompra.',
    contribuicoes: [
      'Identificar os canais importantes para atendimento',
      'Mapear fluxos de atendimento',
      'Aproximação com transportadoras e atendimento por faixas de CEP',
      'Monitoramento das entregas e dos SLAs',
      'Aumento de conversão entre pedidos captados e faturados',
    ],
    duvidas: [
      'Como incentivo meus clientes a comentarem mais?',
      'Como posso aproveitar o feedback dos clientes para melhorar o serviço?',
      'Como aumentar a taxa de aprovação das formas de pagamento?',
      'Como aumentar o Customer Lifetime Value da minha loja?',
      'Por que perco tantas compras em boleto?',
    ],
  },
];

/** Os 4 resultados. Seção 3 do escopo. */
export const resultados = [
  'Otimização da estrutura do e-commerce',
  'Otimização da aquisição de clientes',
  'Aceleração de conversões e retenção de clientes',
  'Plano de comunicação e presença digital da marca',
];

/** Metodologia: 3 processos. Seção 4 do escopo. */
export const metodologia = [
  {
    nome: 'Briefing & diagnóstico',
    texto:
      'Analisamos o mercado nacional e internacional em busca de boas práticas da concorrência. Definimos, planejamos e documentamos as principais estratégias a serem implementadas para o negócio.',
  },
  {
    nome: 'Checklist operacional',
    texto:
      'A partir das análises realizadas em todos os processos, elencamos as tarefas prioritárias a serem implementadas para aumento da conversão e do faturamento.',
  },
  {
    nome: 'Acompanhamento mensal',
    texto:
      'Relatórios de desempenho mensais que geram as definições das próximas etapas do desenvolvimento, baseadas nos resultados obtidos.',
  },
];

/** Mapa de entregas do onboarding. Seção 5 do escopo. */
export const entregas = [
  { nome: 'Kick off', texto: 'Briefing para entender os desafios atuais da operação, no que atuar prioritariamente e quais são as metas.' },
  { nome: 'Plano de mídia', texto: 'Apresentação das estratégias e estruturas de campanha, com projeção de investimento e de resultado.' },
  { nome: 'Início da gestão dos anúncios', texto: 'Aprovado o planejamento, começa a estruturação das contas, a criação e a veiculação das campanhas.' },
  { nome: 'Diagnóstico de negócio', texto: 'Análise do mercado nacional em busca de boas práticas da concorrência, com as estratégias documentadas.' },
  { nome: 'Início do trabalho de performance', texto: 'Execução das frentes definidas, com foco nas metas acordadas.' },
  { nome: 'Relatório mensal', texto: 'Desempenho analisado em todas as ferramentas plugadas no site, gerando as definições da etapa seguinte.' },
  { nome: 'Checklist operacional', texto: 'Durante todo o trabalho, o time finaliza as tarefas prioritárias definidas previamente.' },
  { nome: 'Entregas contínuas', texto: 'O ciclo se repete e se aprofunda.' },
];
