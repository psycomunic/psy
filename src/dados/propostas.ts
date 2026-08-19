import 'server-only';

/**
 * PROPOSTAS COMERCIAIS. ARQUIVO PRIVADO.
 *
 * O 'server-only' no topo nao e decorativo: ele faz o build FALHAR se
 * algum componente de cliente importar este arquivo. E a trava que
 * impede valor de proposta de vazar para o bundle publico, que e o
 * mesmo cuidado do criterio de aceite sobre precos no site.
 *
 * ATENCAO AO MODELO DE ACESSO: hoje a protecao da proposta e o link
 * secreto. Isso e obscuridade, nao seguranca. Quem tiver o link entra,
 * e link vaza em encaminhamento de e-mail e print de WhatsApp. Enquanto
 * o login nao estiver ligado ao banco, use slugs longos e trate o link
 * como confidencial. Ver PLATAFORMA.md.
 */
export type ItemInvestimento = {
  rotulo: string;
  valor: string;
  observacao?: string;
};

export type Proposta = {
  slug: string;
  cliente: string;
  contato: string;
  emitidaEm: string;      // ISO, ex: '2026-08-19'
  validadeDias: number;
  resumo: string;
  diagnostico: string[];
  escopo: { frente: string; itens: string[] }[];
  investimento: ItemInvestimento[];
  condicoes: string[];
  proximosPassos: string[];
};

/**
 * EXEMPLO. Duplique o bloco, troque o slug por algo longo e aleatorio e
 * envie so aquele link ao cliente.
 */
export const propostas: Proposta[] = [
  {
    slug: 'exemplo-9f3c1a7b2e',
    cliente: 'Nome da loja',
    contato: 'Nome do responsavel',
    emitidaEm: '2026-08-19',
    validadeDias: 15,
    resumo:
      'Proposta de operacao de crescimento para e-commerce, cobrindo as quatro frentes: gestao, tecnologia, marketing e atendimento com logistica.',
    diagnostico: [
      'Trafego chega, mas a conversao fica abaixo da media do segmento.',
      'Checkout com etapas demais e sem recuperacao de carrinho ativa.',
      'Investimento em midia sem leitura de ROI por canal.',
    ],
    escopo: [
      {
        frente: 'Gestao',
        itens: ['Analise de concorrencia e canais', 'Definicao de metas e organograma'],
      },
      {
        frente: 'Tecnologia',
        itens: ['Auditoria de velocidade e checkout', 'Integracao de gateway e antifraude'],
      },
      {
        frente: 'Marketing',
        itens: ['Estruturacao de campanhas Google e Meta', 'Criativos e copy focados em conversao'],
      },
      {
        frente: 'Atendimento e logistica',
        itens: ['Mapeamento de fluxos e SLA de entrega', 'Aumento da aprovacao de pagamento'],
      },
    ],
    investimento: [
      { rotulo: 'Fee mensal de operacao', valor: 'R$ 0.000,00', observacao: 'EDITAR' },
      {
        rotulo: 'Verba de midia',
        valor: 'A definir',
        observacao: 'Paga direto as plataformas, nao entra no fee.',
      },
    ],
    condicoes: [
      'Contrato de 6 meses, renovavel.',
      'A verba de midia e paga diretamente ao Google e a Meta, separada do fee.',
      'Relatorio de desempenho todo mes.',
    ],
    proximosPassos: [
      'Aprovacao desta proposta.',
      'Kick off e briefing da operacao.',
      'Plano de midia com projecao de investimento.',
      'Estruturacao das contas e inicio das campanhas.',
    ],
  },
];

export function buscarProposta(slug: string) {
  return propostas.find((p) => p.slug === slug) ?? null;
}

export function venceEm(p: Proposta) {
  const d = new Date(p.emitidaEm);
  d.setDate(d.getDate() + p.validadeDias);
  return d;
}
