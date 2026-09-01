import 'server-only';

/**
 * SERVIÇOS AVULSOS — a proposta que não é um pacote de e-commerce.
 *
 * ============================================================
 * POR QUE ISTO EXISTE AO LADO DOS TRÊS PLANOS
 * ============================================================
 * Saturno, Falcon e Apollo foram desenhados para loja virtual, e
 * começam em R$ 5.000. Metade da carteira nova não é loja: chalé,
 * concessionária, clínica. Esses clientes compram UMA coisa, gestão de
 * tráfego, e às vezes somam social media por cima.
 *
 * Empurrar um pacote de e-commerce para eles seria vender o que não
 * serve. Inventar um quarto plano com preço fixo seria pior ainda,
 * porque o valor certo de gestão de tráfego depende do porte da conta,
 * do ciclo de venda e de quantos canais rodam.
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
   * somar, e a tela diz isso: vender social media solto para quem
   * procurou tráfego é entregar a coisa errada.
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
    paraQuem: 'Empresa que já anuncia e não consegue dizer o que voltou',
    promessa:
      'Google e Meta operados por quem responde pelo resultado, com o retorno de cada canal visível num painel que fica aberto para você.',
    entregas: [
      'Conferência e correção do rastreamento antes de qualquer otimização',
      'Estrutura de campanha montada por canal, oferta e público',
      'Criativos de anúncio testados em variação, com o vencedor identificado',
      'Ajuste semanal de verba, com o que mudou registrado por data',
      'Painel com receita, investimento e retorno por canal, atualizado sozinho',
      'WhatsApp direto com quem opera a conta, resposta no mesmo dia',
      'Reunião mensal de leitura dos números e do plano do mês seguinte',
    ],
    naoInclui: [
      'A verba de mídia, que é sua e vai direto para o Google e para a Meta',
      'Produção de conteúdo para o perfil, que é o serviço de social media',
      'Desenvolvimento de site ou loja',
    ],
  },

  social: {
    id: 'social',
    nome: 'Social media',
    papel: 'complemento',
    paraQuem: 'Quem anuncia e manda a pessoa para um perfil parado',
    promessa:
      'O perfil que o anúncio encontra do outro lado, cuidado para sustentar a decisão de compra em vez de atrapalhá-la.',
    entregas: [
      'Calendário de conteúdo alinhado ao que a campanha está promovendo',
      'Edição e finalização dos vídeos, com a direção do que gravar',
      'Artes e carrosséis para o feed',
      'Legendas escritas para o público que o anúncio traz',
      'Publicação e acompanhamento do que rende',
    ],
    naoInclui: [
      'Gravação em locação, que fica com a equipe do cliente ou é orçada à parte',
      'Gestão de comentários e mensagens diretas',
      'Impulsionamento, que faz parte da verba de mídia',
    ],
  },
};

/** O que vale para qualquer serviço avulso, sem depender de qual. */
export const sempreNoAvulso = [
  'Contrato sem fidelidade: aviso de 30 dias dos dois lados',
  'A conta de anúncio fica em nome da sua empresa, e os dados são seus',
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
