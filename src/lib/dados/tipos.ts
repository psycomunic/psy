/**
 * Formato dos dados da plataforma.
 *
 * Estes tipos espelham as views de supabase/migrations/0004. Mudou a
 * view, muda aqui, e o TypeScript aponta toda tela que quebrou.
 */

export type Situacao = 'saudavel' | 'atencao' | 'critico' | 'sem_dado';

export const rotuloSituacao: Record<Situacao, string> = {
  saudavel: 'Saudável',
  atencao: 'Atenção',
  critico: 'Crítico',
  sem_dado: 'Sem dado',
};

/** Uma conta cliente com o resumo do mês e o sinal de risco. */
export type ContaResumo = {
  id: string;
  nome: string;
  plataforma: string | null;
  situacao: Situacao;
  receita: number;
  investimento: number;
  mer: number | null;
  metaAtingida: number | null;
  receitaMeta: number | null;
  receitaDiaNecessaria: number | null;
  variacaoReceita: number | null;
  ultimoDia: string | null;
  responsavel: string | null;
};

/** Um dia da série histórica de uma conta. */
export type DiaKpi = {
  dia: string;
  sessoes: number;
  pedidosCaptados: number;
  pedidosAprovados: number;
  novosClientes: number;
  receita: number;
  investimento: number;
  mer: number | null;
  ticketMedio: number | null;
  cac: number | null;
  taxaConversao: number | null;
  taxaAprovacao: number | null;
};

/** Desempenho por canal de aquisição. */
export type CanalKpi = {
  canal: string;
  receita: number;
  investimento: number;
  pedidos: number;
  roas: number | null;
  cpc: number | null;
  ctr: number | null;
};

/** Marco no diário de bordo da conta. */
export type Marco = {
  id: string;
  dia: string;
  tipo: string;
  titulo: string;
  detalhe: string | null;
};

/** Painel financeiro da agência. */
export type FinanceiroMes = {
  receitaRecorrente: number;
  contratosAtivos: number;
  recebidoMes: number;
  aReceberMes: number;
  inadimplencia: number;
  verbaSobGestao: number;
};

export const ESTAGIOS = [
  'novo',
  'contato',
  'diagnostico',
  'proposta',
  'negociacao',
  'ganho',
  'perdido',
] as const;
export type Estagio = (typeof ESTAGIOS)[number];

export const rotuloEstagio: Record<Estagio, string> = {
  novo: 'Novo',
  contato: 'Contato feito',
  diagnostico: 'Diagnóstico',
  proposta: 'Proposta enviada',
  negociacao: 'Negociação',
  ganho: 'Ganho',
  perdido: 'Perdido',
};

export type Lead = {
  id: string;
  nome: string;
  empresa: string | null;
  estagio: Estagio;
  origem: string | null;
  valorEstimado: number | null;
  responsavel: string | null;
  criadoEm: string;
};

export type Tarefa = {
  id: string;
  titulo: string;
  conta: string | null;
  status: 'aberta' | 'fazendo' | 'concluida' | 'cancelada';
  responsavel: string | null;
  prazo: string | null;
};

export type PessoaEquipe = {
  id: string;
  nome: string;
  email: string;
  papel: string;
  ativo: boolean;
  contas: number;
};

/**
 * Toda consulta devolve os dados junto com a PROCEDÊNCIA deles.
 *
 * Sem este campo, a tela não tem como saber se está mostrando o
 * faturamento real de um cliente ou um número de exemplo. E tela que não
 * sabe é tela que mente com confiança: alguém toma decisão de verba em
 * cima de dado inventado.
 */
export type Procedencia = 'banco' | 'demonstracao';

export type Resposta<T> = {
  dados: T;
  procedencia: Procedencia;
};
