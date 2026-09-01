import 'server-only';

/**
 * SERVIÇOS AVULSOS — a proposta que não é um pacote de e-commerce.
 *
 * ============================================================
 * POR QUE ISTO EXISTE AO LADO DOS TRÊS PLANOS
 * ============================================================
 * Saturno, Falcon e Apollo foram desenhados para loja virtual, e
 * começam em R$ 5.000. Boa parte da carteira não é loja: advogada que
 * vende curso, chalé, concessionária, clínica. Esses clientes compram
 * UMA coisa, gestão de tráfego, e às vezes somam conteúdo por cima.
 *
 * ============================================================
 * O TEXTO NÃO PODE ASSUMIR NICHO
 * ============================================================
 * A primeira versão deste catálogo falava de "receita" e de "loja", e
 * ele é lido por quem vende curso, quem preenche agenda e quem aluga
 * diária. Para essas pessoas, "aumentar a receita da loja" descreve o
 * negócio de outro, e a proposta passa a parecer um modelo reaproveitado.
 *
 * Então o vocabulário aqui é o do RESULTADO, e não o do formato:
 * conversão em vez de venda, cliente em vez de comprador, procura em
 * vez de tráfego de loja. O que muda de nicho para nicho é o que conta
 * como conversão — matrícula, orçamento, reserva, consulta, pedido — e
 * isso é definido com o cliente, não presumido aqui.
 *
 * ============================================================
 * POR QUE NÃO HÁ PREÇO NESTE ARQUIVO
 * ============================================================
 * De propósito. O catálogo diz o que CADA serviço entrega — que é o
 * que não pode mudar de cliente para cliente. O valor é campo da
 * proposta, preenchido no gerador, porque é negociação.
 *
 * Uma tabela fixa aqui viraria preço que ninguém cumpre: bastaria o
 * segundo cliente pagar diferente para o arquivo passar a mentir. E
 * arquivo que mente sobre preço é pior que arquivo sem preço.
 */

export type Servico = 'trafego' | 'social';

export const SERVICOS: Servico[] = ['trafego', 'social'];

export type FichaServico = {
  id: Servico;
  nome: string;
  /**
   * `principal` sustenta a proposta sozinho. `complemento` existe para
   * somar, e a tela diz isso: vender conteúdo solto para quem procurou
   * tráfego é entregar a coisa errada.
   */
  papel: 'principal' | 'complemento';
  paraQuem: string;
  promessa: string;
  entregas: string[];
  /** O que este serviço NÃO cobre. Dito antes, e não na primeira
      cobrança de algo que o cliente achava incluso. */
  naoInclui: string[];
};

export const fichasDeServico: Record<Servico, FichaServico> = {
  trafego: {
    id: 'trafego',
    nome: 'Gestão de tráfego pago',
    papel: 'principal',
    paraQuem:
      'Quem precisa de cliente entrando com previsibilidade, e não de sorte no algoritmo',
    promessa:
      'Google e Meta operados por quem responde pelo resultado. A primeira decisão é definir o que conta como conversão no seu negócio — matrícula, orçamento, reserva, consulta ou pedido — e daí para frente tudo é medido contra isso.',
    entregas: [
      'Definição do que conta como conversão, antes de subir campanha',
      'Conferência e correção do rastreamento: evento que não dispara ou que conta duas vezes invalida qualquer decisão tomada depois',
      'Estrutura de campanha montada por canal, oferta e público, para dar para saber qual funcionou',
      'Criativos de anúncio testados em variação, com o vencedor decidido pelo número',
      'Ajuste semanal de verba, com o que mudou registrado por data',
      'Painel com o que entrou, o que foi investido e o retorno por canal, atualizado sozinho',
      'WhatsApp direto com quem opera a conta, resposta no mesmo dia',
      'Reunião mensal de leitura dos números e do plano do mês seguinte',
    ],
    naoInclui: [
      'A verba de mídia, que é sua e vai direto para o Google e para a Meta',
      'Produção de conteúdo, que é o outro serviço',
      'Desenvolvimento de site, loja ou página de captura',
      'Atendimento de quem chega: responder o lead continua com a sua equipe',
    ],
  },

  social: {
    id: 'social',
    nome: 'Criação de conteúdo',
    papel: 'complemento',
    paraQuem: 'Quem anuncia e manda a pessoa para um perfil parado',
    promessa:
      'O criativo que roda no anúncio e o perfil que a pessoa encontra depois de clicar, cuidados juntos. Quem está decidindo procura o seu nome antes de comprar, e perfil abandonado responde essa busca do jeito errado.',
    entregas: [
      'Criativos para as campanhas, em variações feitas para serem testadas uma contra a outra',
      'Calendário de conteúdo alinhado ao que a campanha está promovendo',
      'Edição e finalização dos vídeos, com a direção do que gravar',
      'Artes e carrosséis para o feed',
      'Legendas escritas para o público que o anúncio traz',
      'Publicação e leitura do que rendeu',
    ],
    naoInclui: [
      'Gravação em locação, que fica com a equipe do cliente ou é orçada à parte',
      'Aparição em vídeo: quem aparece é você, que é quem tem autoridade no assunto',
      'Gestão de comentários e mensagens diretas',
      'Impulsionamento, que faz parte da verba de mídia',
    ],
  },
};

/** O que vale para qualquer serviço avulso, sem depender de qual. */
export const sempreNoAvulso = [
  'Contrato sem fidelidade: aviso de 30 dias dos dois lados',
  'As contas de anúncio ficam em nome da sua empresa, e os dados são seus',
  'Painel próprio, com login seu, aberto o tempo todo',
  'A verba de mídia nunca se mistura com o valor do serviço',
];

export const fichaDoServico = (s: Servico) => fichasDeServico[s];

export const emReais = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

/** Um serviço escolhido nesta proposta, com o valor negociado. */
export type ServicoEscolhido = { id: Servico; fee: number };

/**
 * Soma o mensal dos serviços escolhidos.
 *
 * Existe para a proposta não pedir que o cliente some. Deixar a conta
 * por conta dele é deixar que erre, e o erro é sempre para mais.
 */
export const somaDosServicos = (itens: ServicoEscolhido[]) =>
  itens.reduce((s, i) => s + (Number.isFinite(i.fee) ? i.fee : 0), 0);
