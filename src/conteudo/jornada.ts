/**
 * A jornada completa: do zero ao lançamento, e todo mês depois dele.
 *
 * ============================================================
 * POR QUE ISTO EXISTE NUM ARQUIVO SÓ
 * ============================================================
 * É a mesma promessa no site e na proposta. Escrita duas vezes, ela
 * diverge na primeira correção que alguém faz só de um lado, e aí o
 * cliente lê uma coisa antes de falar com a agência e outra depois. A
 * home e o deck da proposta leem daqui.
 *
 * Não tem preço, e por isso mora em `conteudo/` e não em `dados/`: o
 * conteúdo é público, os valores continuam restritos à proposta.
 *
 * ============================================================
 * POR QUE SÃO DUAS FASES, E NÃO UMA LISTA DE SERVIÇOS
 * ============================================================
 * Lojista que ainda não vendeu e lojista que já vende têm o mesmo medo,
 * e ele é diferente do que a lista de serviços responde.
 *
 * Quem vai começar teme ficar com uma loja pronta e ninguém para tocar
 * depois. Quem já vende teme contratar quem só sabe anunciar e não
 * mexe na loja. As duas fases, escritas lado a lado, respondem os dois
 * medos de uma vez: começa junto e continua junto.
 */

export type FaseDaJornada = {
  id: 'implantacao' | 'operacao';
  etiqueta: string;
  titulo: string;
  /** Uma frase que diz onde essa fase termina. Fase sem fim declarado
      é promessa aberta, e promessa aberta é o que gera atrito depois. */
  entrega: string;
  resumo: string;
  itens: string[];
};

export const jornada: FaseDaJornada[] = [
  {
    id: 'implantacao',
    etiqueta: 'Fase 1',
    titulo: 'Do zero ao lançamento',
    entrega: 'Termina com a loja no ar, vendendo e medindo.',
    resumo:
      'A Psy Comunic constrói a operação inteira, e não só a vitrine. Plataforma, catálogo com grade e tabela de medidas, pagamento, frete, política de troca, rastreamento e a primeira campanha saem daqui prontos para rodar.',
    itens: [
      'Escolha e montagem da plataforma, na Magazord, na Shopify ou na que a operação pedir',
      'Identidade da loja, layout e a arquitetura de categorias que a cliente de moda usa para comprar',
      'Catálogo no ar: cadastro por grade e cor, fotos tratadas, tabela de medidas e descrições que vendem',
      'Página de produto montada para a dúvida de quem compra roupa: caimento, tecido, medida e troca',
      'Checkout, gateway, antifraude e as regras de frete',
      'Integrações com ERP, marketplaces e WhatsApp',
      'Rastreamento completo: GA4, pixel, conversões e o painel de métricas',
      'Plano de mídia e a primeira campanha no ar',
      'Treinamento do seu time para tocar o dia a dia',
    ],
  },
  {
    id: 'operacao',
    etiqueta: 'Fase 2',
    titulo: 'Entregas contínuas',
    entrega: 'Não termina: é o mês seguinte, e o seguinte.',
    resumo:
      'Lançar é o começo. A partir daí a operação roda com meta declarada, leitura semanal e ajuste em cima do número que a loja faturou, e não do que a plataforma de mídia diz ter gerado. Cada coleção que entra é uma operação nova: cadastro, campanha e vitrine.',
    itens: [
      'Mídia paga no Google e no Meta gerida com meta de faturamento, e não com meta de clique',
      'Conteúdo e criativos do dia a dia, com direção do material que a sua equipe grava',
      'Lançamento de coleção: cadastro, vitrine, campanha e calendário de datas',
      'Recuperação de carrinho e de boleto',
      'Ajuste contínuo de plataforma, checkout e taxa de aprovação',
      'Gestão de marketplaces e novos canais de venda',
      'Painel de métricas ao vivo, com o seu login',
      'Reunião de resultado e relatório com o diário de bordo do que foi feito',
    ],
  },
];

/** A frase-síntese. Usada no site e na proposta, sempre igual. */
export const promessaCompleta =
  'A Psy Comunic entrega o seu e-commerce de moda do zero ao lançamento, e continua entregando todo mês depois dele.';

/**
 * O que separa a Psy Comunic de contratar em pedaços.
 *
 * Existe porque "solução completa" é o que toda agência escreve. Sem
 * dizer o que a alternativa custa, a frase não significa nada.
 */
export const porQueCompleta = [
  {
    titulo: 'Um responsável, não quatro fornecedores',
    texto:
      'Agência de mídia, desenvolvedor da loja, designer e consultoria de logística apontam uns para os outros quando a venda cai. Aqui a conta é de quem construiu.',
  },
  {
    titulo: 'Quem lança é quem opera',
    texto:
      'A equipe que montou a plataforma continua na conta depois do lançamento. Nada se perde na passagem de bastão, porque não existe passagem de bastão.',
  },
  {
    titulo: 'O número é o da loja',
    texto:
      'A leitura sai do faturamento aprovado, e não do que cada plataforma de anúncio se atribui. É o mesmo número que aparece no seu extrato.',
  },
];

/**
 * O que precisa estar pronto para a operação começar.
 *
 * Existe porque "após o lançamento" sozinho é data que ninguém consegue
 * cobrar. A verba de mídia do cliente só começa a ser gasta quando esta
 * lista inteira estiver fechada, e uma lista escrita é a diferença
 * entre um marco verificável e uma promessa que escorrega de mês em
 * mês.
 *
 * Vale para os dois lados: o cliente sabe exatamente o que espera
 * receber antes de pagar o primeiro real de anúncio, e a agência sabe
 * exatamente onde a Fase 1 termina.
 */
export const criteriosDeLancamento = [
  'Site configurado e o design todo pronto',
  'Todos os produtos cadastrados, com foto e descrição',
  'Transportadoras e regras de frete configuradas',
  'Contas de anúncio da Meta, do Facebook e do Instagram, configuradas',
  'Conta do Google Ads configurada',
  'Todas as tags de conversão e de acompanhamento instaladas e testadas',
];

/**
 * Os três níveis de parceria, em palavras.
 *
 * Estavam escritos dentro do JSX da home, no meio da cena da descida.
 * Saíram de lá pela regra do projeto, e porque eram o único texto
 * comercial do site que ninguém encontrava para revisar.
 *
 * NÃO TEM PREÇO, e é de propósito: a tabela de planos saiu do site: o
 * que fica é a escada, que responde "até onde vocês entram?" sem
 * virar cardápio que desconto nenhum consegue negociar depois.
 *
 * Havia um campo `onde` com "Órbita", "Atmosfera" e "Superfície": os
 * nomes de altitude que o altímetro da cena em vídeo marcava. A cena
 * saiu e eles saíram junto. Eram rótulo de uma metáfora, não nome de
 * nível, e sozinhos não dizem nada a quem lê.
 *
 * A ORDEM É A ESCADA: cada nível diz "tudo acima, mais". Trocar a
 * ordem quebra a frase do nível seguinte.
 */
export const niveisDeParceria = [
  {
    n: '01',
    titulo: 'Só a mídia',
    texto:
      'Meta e Google geridos com meta declarada, leitura semanal e um retrato do mês que dá para conferir número por número.',
    paraQuem: 'Para a loja de moda que já vende e quer parar de gastar no escuro.',
  },
  {
    n: '02',
    titulo: 'Mídia e canais próprios',
    texto:
      'Tudo acima, mais conteúdo, criativos do dia a dia, campanhas de coleção e de data e recuperação de carrinho. A loja passa a vender também quando a verba pausa.',
    paraQuem: 'Para quem depende demais de comprar tráfego.',
  },
  {
    n: '03',
    titulo: 'A operação inteira',
    texto:
      'Tudo acima, mais plataforma, marketplaces, funil comercial, catálogo e mentoria do seu time. A agência dentro da operação.',
    paraQuem: 'Para quem quer crescer sem montar um time do zero.',
  },
] as const;
