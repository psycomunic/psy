/**
 * Papéis e permissões da plataforma.
 *
 * Este arquivo é a fonte única da verdade sobre quem pode o quê. Ele é
 * de propósito independente de banco e de provedor de login: quando a
 * decisão de backend for tomada, ele continua valendo.
 *
 * REGRA QUE NÃO PODE SER QUEBRADA: o papel `cliente` só enxerga a
 * própria conta. Toda consulta feita em nome de um cliente precisa ser
 * filtrada pelo `contaId` dele, no servidor. Esconder no front é
 * maquiagem, não isolamento.
 */

export const PAPEIS = ['admin', 'vendedor', 'cs', 'cliente'] as const;
export type Papel = (typeof PAPEIS)[number];

export const rotuloPapel: Record<Papel, string> = {
  admin: 'Administrador',
  vendedor: 'Atendente e vendas',
  cs: 'Customer Success',
  cliente: 'Cliente',
};

/** Módulos da plataforma. Cada um vira uma área do painel. */
export const MODULOS = [
  'crm',
  'propostas',
  'financeiro',
  'contas',
  'metricas',
  'tarefas',
  'relatorios',
  'equipe',
  'configuracoes',
] as const;
export type Modulo = (typeof MODULOS)[number];

export const rotuloModulo: Record<Modulo, string> = {
  crm: 'CRM',
  propostas: 'Propostas',
  financeiro: 'Financeiro',
  contas: 'Clientes',
  metricas: 'Métricas',
  tarefas: 'Tarefas',
  relatorios: 'Relatórios',
  equipe: 'Equipe',
  configuracoes: 'Configurações',
};

/** ver = leitura · editar = criar e alterar · excluir = remover em definitivo */
export type Acao = 'ver' | 'editar' | 'excluir';

type Matriz = Record<Papel, Partial<Record<Modulo, Acao[]>>>;

/**
 * Matriz de permissões.
 *
 * O vendedor NÃO vê financeiro: quem vende não precisa enxergar a
 * margem nem o inadimplente para fazer o trabalho dele, e menos acesso
 * é menos superfície de vazamento.
 * O CS não edita proposta, para não haver dúvida de quem alterou
 * condição comercial depois de assinada.
 * Ninguém além do admin exclui nada.
 */
export const permissoes: Matriz = {
  admin: {
    crm: ['ver', 'editar', 'excluir'],
    propostas: ['ver', 'editar', 'excluir'],
    financeiro: ['ver', 'editar', 'excluir'],
    contas: ['ver', 'editar', 'excluir'],
    metricas: ['ver'],
    tarefas: ['ver', 'editar', 'excluir'],
    relatorios: ['ver', 'editar'],
    equipe: ['ver', 'editar', 'excluir'],
    configuracoes: ['ver', 'editar'],
  },
  vendedor: {
    crm: ['ver', 'editar'],
    propostas: ['ver', 'editar'],
    contas: ['ver', 'editar'],
    tarefas: ['ver', 'editar'],
    metricas: ['ver'],
  },
  cs: {
    crm: ['ver', 'editar'],
    contas: ['ver', 'editar'],
    tarefas: ['ver', 'editar'],
    metricas: ['ver'],
    relatorios: ['ver'],
    propostas: ['ver'],
  },
  cliente: {
    // Só a própria conta. O filtro por contaId é obrigatório no servidor.
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
  admin: '/painel/crm',
  vendedor: '/painel/crm',
  cs: '/painel/contas',
  cliente: '/painel/metricas',
};
