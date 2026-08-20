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
      'A Psy Comunic constrói a operação inteira, e não só a vitrine. Plataforma, catálogo, pagamento, frete, rastreamento e a primeira campanha saem daqui prontos para rodar.',
    itens: [
      'Escolha e montagem da plataforma, na Magazord, na Shopify ou na que a operação pedir',
      'Identidade da loja, layout, páginas e a arquitetura de categorias',
      'Catálogo no ar: cadastro, fotos tratadas e descrições que vendem',
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
      'Lançar é o começo. A partir daí a operação roda com meta declarada, leitura semanal e ajuste em cima do número que a loja faturou, e não do que a plataforma de mídia diz ter gerado.',
    itens: [
      'Mídia paga gerida com meta de faturamento, e não com meta de clique',
      'Conteúdo e criativos do dia a dia, com direção do material que a sua equipe grava',
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
  'A Psy Comunic entrega o seu e-commerce do zero ao lançamento, e continua entregando todo mês depois dele.';

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
