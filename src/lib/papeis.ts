/**
 * Papéis e permissões da plataforma.
 *
 * Este arquivo é a fonte única da verdade sobre quem pode o quê NA
 * INTERFACE. Ele espelha as políticas RLS do banco, e as duas coisas
 * precisam continuar de acordo.
 *
 * ESCONDER NÃO É PROTEGER. O que este arquivo faz é não mostrar botão
 * que a pessoa não pode usar. Quem impede de verdade é o Postgres: as
 * políticas de supabase/migrations decidem quais LINHAS voltam, e elas
 * valem mesmo que a interface inteira seja contornada.
 *
 * REGRA QUE NÃO PODE SER QUEBRADA: os papéis de cliente só enxergam as
 * lojas às quais estão vinculados. Isso é decidido por
 * `tem_acesso_conta()` no banco, e não por filtro escrito na consulta.
 */

export const PAPEIS = [
  'administrador',
  'gestor',
  'comercial',
  'operador',
  'financeiro',
  'cliente',
  'cliente_leitura',
] as const;
export type Papel = (typeof PAPEIS)[number];

/** Os cinco papéis do time da agência. */
export const PAPEIS_INTERNOS: Papel[] = [
  'administrador',
  'gestor',
  'comercial',
  'operador',
  'financeiro',
];

/** Os dois papéis do lado do cliente. Vão para /portal, não para /painel. */
export const PAPEIS_CLIENTE: Papel[] = ['cliente', 'cliente_leitura'];

export const eInterno = (p: Papel) => PAPEIS_INTERNOS.includes(p);
export const eCliente = (p: Papel) => PAPEIS_CLIENTE.includes(p);

export const rotuloPapel: Record<Papel, string> = {
  administrador: 'Administrador',
  gestor: 'Gestor',
  comercial: 'Comercial',
  operador: 'Operador',
  financeiro: 'Financeiro',
  cliente: 'Cliente',
  cliente_leitura: 'Cliente (leitura)',
};

/** O que cada papel faz, em uma linha. Aparece no formulário de convite:
    quem convida decide melhor lendo a consequência do que o nome. */
export const descricaoPapel: Record<Papel, string> = {
  administrador:
    'Acesso total, inclusive financeiro, equipe, auditoria e integrações. É quem cria e desativa acessos.',
  gestor:
    'Tudo, menos configuração de cobrança, gestão de usuários e exclusão definitiva.',
  comercial:
    'Funil, propostas e contratos. Vê valor de proposta, não vê o financeiro consolidado.',
  operador:
    'Métricas, tarefas, relatórios e diário das lojas em que é responsável. Não vê fee nem inadimplência.',
  financeiro:
    'Financeiro, contratos, cobrança e inadimplência. Não vê métrica de campanha.',
  cliente:
    'Portal da própria loja: métricas, relatórios, propostas para aprovar, solicitações e faturas.',
  cliente_leitura:
    'Igual ao Cliente, mas sem aprovar nada e sem abrir solicitação.',
};

/** Módulos da plataforma. Cada um é uma rota de /painel. */
export const MODULOS = [
  'visao',
  'crm',
  'propostas',
  'financeiro',
  'contas',
  'metricas',
  'tarefas',
  'relatorios',
  'equipe',
  'auditoria',
  'configuracoes',
] as const;
export type Modulo = (typeof MODULOS)[number];

export const rotuloModulo: Record<Modulo, string> = {
  visao: 'Visão geral',
  crm: 'CRM',
  propostas: 'Propostas',
  financeiro: 'Financeiro',
  contas: 'Clientes',
  metricas: 'Métricas',
  tarefas: 'Tarefas',
  relatorios: 'Relatórios',
  equipe: 'Equipe',
  auditoria: 'Auditoria',
  configuracoes: 'Configurações',
};

/** ver = leitura · editar = criar e alterar · excluir = remover em definitivo */
export type Acao = 'ver' | 'editar' | 'excluir';

type Matriz = Record<Papel, Partial<Record<Modulo, Acao[]>>>;

/**
 * Matriz de permissões.
 *
 * As escolhas que valem explicação:
 *
 * O COMERCIAL não vê financeiro. Quem vende não precisa da margem nem
 * da lista de inadimplentes para trabalhar, e menos acesso é menos
 * superfície de vazamento.
 *
 * O FINANCEIRO não vê métricas de campanha. O trabalho dele é fee,
 * cobrança e inadimplência; desempenho de anúncio não entra na conta, e
 * dado de campanha é informação comercial do cliente.
 *
 * O OPERADOR não vê financeiro nem CRM. Ele opera as lojas atribuídas.
 * O recorte POR LOJA é feito no banco, não aqui: esta matriz diz que
 * ele vê o módulo, e `tem_acesso_conta()` diz quais linhas.
 *
 * O GESTOR faz tudo menos as três coisas irreversíveis ou sensíveis:
 * cobrança, gestão de usuários e exclusão definitiva.
 *
 * SÓ O ADMINISTRADOR exclui. Exclusão em CRM e financeiro é
 * irreversível na prática.
 *
 * UMA EXCEÇÃO À REGRA DOS DOIS LUGARES. Em todo o resto, o que está
 * aqui tem uma política de RLS correspondente. `metricas: editar` não
 * tem, e não vai ter: `metrica_diaria` não tem política de escrita
 * NENHUMA, de propósito, porque métrica não entra pela chave pública.
 * Quem grava é a rotina do servidor, com a service role, e é lá que
 * este `editar` é cobrado — em `acoes-metricas.ts`. Procurar a política
 * equivalente no banco e não achar é o comportamento certo.
 */
export const permissoes: Matriz = {
  administrador: {
    visao: ['ver'],
    crm: ['ver', 'editar', 'excluir'],
    propostas: ['ver', 'editar', 'excluir'],
    financeiro: ['ver', 'editar', 'excluir'],
    contas: ['ver', 'editar', 'excluir'],
    metricas: ['ver', 'editar'],
    tarefas: ['ver', 'editar', 'excluir'],
    relatorios: ['ver', 'editar'],
    equipe: ['ver', 'editar', 'excluir'],
    auditoria: ['ver'],
    configuracoes: ['ver', 'editar'],
  },

  gestor: {
    visao: ['ver'],
    crm: ['ver', 'editar'],
    propostas: ['ver', 'editar'],
    contas: ['ver', 'editar'],
    metricas: ['ver', 'editar'],
    tarefas: ['ver', 'editar'],
    relatorios: ['ver', 'editar'],
    equipe: ['ver'],
    /* O gestor le a auditoria para responder "quem mudou isso?" sem
       depender do administrador. Mas nao gere usuarios nem exclui. */
    auditoria: ['ver'],
    configuracoes: ['ver'],
  },

  comercial: {
    visao: ['ver'],
    crm: ['ver', 'editar'],
    propostas: ['ver', 'editar'],
    contas: ['ver'],
    metricas: ['ver'],
    tarefas: ['ver', 'editar'],
    relatorios: ['ver'],
  },

  operador: {
    visao: ['ver'],
    contas: ['ver', 'editar'],
    metricas: ['ver', 'editar'],
    tarefas: ['ver', 'editar'],
    relatorios: ['ver', 'editar'],
  },

  financeiro: {
    visao: ['ver'],
    financeiro: ['ver', 'editar'],
    contas: ['ver'],
    propostas: ['ver'],
    configuracoes: ['ver'],
  },

  /* Os papéis de cliente vivem no PORTAL, não no painel. Ficam aqui com
     os módulos que o portal reaproveita, para a matriz continuar sendo
     um lugar só. */
  cliente: {
    metricas: ['ver'],
    relatorios: ['ver'],
  },

  cliente_leitura: {
    metricas: ['ver'],
    relatorios: ['ver'],
  },
};

export function pode(papel: Papel, modulo: Modulo, acao: Acao = 'ver'): boolean {
  return permissoes[papel]?.[modulo]?.includes(acao) ?? false;
}

export function modulosDoPapel(papel: Papel): Modulo[] {
  return MODULOS.filter((m) => pode(papel, m, 'ver'));
}

/** Onde cada papel cai ao entrar. */
export const rotaInicial: Record<Papel, string> = {
  administrador: '/painel/visao',
  gestor: '/painel/visao',
  comercial: '/painel/crm',
  operador: '/painel/contas',
  financeiro: '/painel/financeiro',
  cliente: '/painel/metricas',
  cliente_leitura: '/painel/metricas',
};

/**
 * Como os módulos se agrupam no menu.
 *
 * Mora aqui, junto da matriz, para não existir uma segunda lista de
 * módulos em outro arquivo: acrescentar um módulo e esquecer de
 * agrupá-lo faria ele sumir do menu sem erro nenhum. A checagem no fim
 * deste bloco impede isso.
 *
 * `visao` fica FORA dos grupos de propósito. Ela é a porta de entrada,
 * e não uma das áreas: enfiá-la em "Operação" a esconderia no meio de
 * outras quatro, quando é a primeira coisa que se abre.
 *
 * A divisão é por PERGUNTA, e não por semelhança técnica:
 *   Prospecção     — de onde vem cliente novo
 *   Operação       — o que se faz com os que já entraram
 *   Administração  — o que sustenta a agência por trás
 */
export const GRUPOS_DE_MODULOS: { titulo: string; modulos: Modulo[] }[] = [
  { titulo: 'Prospecção', modulos: ['crm', 'propostas'] },
  { titulo: 'Operação', modulos: ['contas', 'metricas', 'tarefas', 'relatorios'] },
  { titulo: 'Administração', modulos: ['financeiro', 'equipe', 'auditoria', 'configuracoes'] },
];

/** O módulo que abre sozinho no topo, fora de qualquer grupo. */
export const MODULO_INICIAL: Modulo = 'visao';

/*
  Trava de consistência, avaliada quando o módulo carrega.

  Sem ela, acrescentar um módulo em MODULOS e esquecer de agrupá-lo o
  faria desaparecer do menu em silêncio — a matriz de permissões
  continuaria concedendo acesso, a rota continuaria funcionando, e só
  não haveria como chegar lá clicando.
*/
{
  const agrupados = new Set<Modulo>([
    MODULO_INICIAL,
    ...GRUPOS_DE_MODULOS.flatMap((g) => g.modulos),
  ]);
  const orfaos = MODULOS.filter((m) => !agrupados.has(m));
  if (orfaos.length > 0) {
    throw new Error(
      `Módulo sem grupo no menu: ${orfaos.join(', ')}. ` +
        'Acrescente em GRUPOS_DE_MODULOS ou o item some da navegação sem erro.',
    );
  }
}
