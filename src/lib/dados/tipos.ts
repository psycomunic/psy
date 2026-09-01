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
export const TIPOS_CONTA = ['ecommerce', 'trafego', 'outro'] as const;
export type TipoConta = (typeof TIPOS_CONTA)[number];

export const rotuloTipoConta: Record<TipoConta, string> = {
  ecommerce: 'Loja online',
  trafego: 'Só tráfego',
  outro: 'Outro',
};

export type ContaResumo = {
  id: string;
  nome: string;
  tipo: TipoConta;
  segmento: string | null;
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
  /** Emitido para a competência do mês. Não é o mesmo que recebido. */
  faturadoMes: number;
  recebidoMes: number;
  /** O mesmo recebimento, menos a taxa do gateway. */
  recebidoLiquidoMes: number;
  aReceberMes: number;
  inadimplencia: number;
  faturasVencidas: number;
  despesaMes: number;
  despesaPrevistaMes: number;
  verbaSobGestao: number;
};

/** Um mês da série de 12. */
export type MesFinanceiro = {
  mes: string;
  faturado: number;
  recebido: number;
  despesa: number;
};

export type Despesa = {
  id: string;
  descricao: string;
  categoria: string | null;
  valor: number;
  vencimento: string;
  pagoEm: string | null;
  status: 'previsto' | 'pago' | 'atrasado' | 'cancelado';
  conta: string | null;
  /** Dias até vencer. Negativo já venceu. */
  diasAteVencer: number;
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
  email: string | null;
  telefone: string | null;
  estagio: Estagio;
  origem: string | null;
  /** Fee mensal estimado. NÃO confundir com a verba de mídia. */
  valorFee: number | null;
  valorVerba: number | null;
  probabilidade: number | null;
  responsavel: string | null;
  responsavelId: string | null;
  proximoPasso: string | null;
  proximoPassoEm: string | null;
  /** Dias no estágio atual. Mantido pelo BANCO, por gatilho. */
  diasNoEstagio: number;
  /** Dias desde a entrada do lead. Calculado na camada de dados, e
      nunca no render: Date.now() durante render e chamada impura. */
  diasDesdeEntrada: number;
  motivoPerda: string | null;
  /** Preenchido quando o lead virou cliente. */
  contaId: string | null;
  criadoEm: string;
};

/** Resumo de um estágio do funil. */
export type EstagioFunil = {
  estagio: Estagio;
  quantidade: number;
  valorTotal: number;
  valorPonderado: number;
  diasMedios: number | null;
  parados: number;
};

/** Ficha completa de uma loja. */
export type ContaFicha = {
  id: string;
  nome: string;
  razaoSocial: string | null;
  documento: string | null;
  plataforma: string | null;
  site: string | null;
  segmento: string | null;
  situacao: 'prospect' | 'onboarding' | 'ativa' | 'pausada' | 'encerrada';
  dataInicio: string | null;
  observacoes: string | null;
  responsavel: string | null;
  /** Nota de 0 a 100 e o porquê. */
  pontuacao: number | null;
  tarefasAtrasadas: number;
  inadimplencia: number;
  diasSemRegistro: number | null;
};

export const rotuloSituacaoConta: Record<ContaFicha['situacao'], string> = {
  prospect: 'Prospect',
  onboarding: 'Onboarding',
  ativa: 'Ativa',
  pausada: 'Pausada',
  encerrada: 'Encerrada',
};

export type Interacao = {
  id: string;
  tipo: string;
  resumo: string;
  autor: string | null;
  em: string;
};

export type ContratoResumo = {
  id: string;
  plano: string;
  feeMensal: number;
  diaVencimento: number;
  inicio: string;
  fim: string | null;
  /** Ligada: quem emite a fatura do mês é o Asaas. */
  cobrancaAutomatica: boolean;
};

export const PRIORIDADES = ['baixa', 'media', 'alta', 'urgente'] as const;
export type Prioridade = (typeof PRIORIDADES)[number];

export const rotuloPrioridade: Record<Prioridade, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  urgente: 'Urgente',
};

export const RECORRENCIAS = ['nenhuma', 'diaria', 'semanal', 'quinzenal', 'mensal'] as const;
export type Recorrencia = (typeof RECORRENCIAS)[number];

export const rotuloRecorrencia: Record<Recorrencia, string> = {
  nenhuma: 'Não se repete',
  diaria: 'Todo dia',
  semanal: 'Toda semana',
  quinzenal: 'A cada 15 dias',
  mensal: 'Todo mês',
};

export type Tarefa = {
  id: string;
  titulo: string;
  detalhe: string | null;
  conta: string | null;
  contaId: string | null;
  status: 'aberta' | 'fazendo' | 'concluida' | 'cancelada';
  responsavel: string | null;
  responsavelId: string | null;
  prazo: string | null;
  prioridade: Prioridade;
  recorrencia: Recorrencia;
  lembrarDias: number;
  concluidaEm: string | null;
  /** Dias até o prazo. Negativo já passou. Null sem prazo. */
  diasAtePrazo: number | null;
};

export type Notificacao = {
  id: number;
  tipo: 'tarefa_vence' | 'tarefa_atrasada' | 'fatura_vencida' | 'lead_novo' | 'aviso';
  titulo: string;
  corpo: string | null;
  link: string | null;
  lidaEm: string | null;
  criadaEm: string;
};

export type PessoaEquipe = {
  id: string;
  nome: string;
  email: string;
  papel: string;
  ativo: boolean;
  /* As lojas que a pessoa enxerga, e não a contagem. Um número obriga a
     abrir outra tela para descobrir QUAIS são, e essa é sempre a
     pergunta seguinte. */
  contas: { id: string; nome: string }[];
};

/** Uma linha da trilha de auditoria. */
export type RegistroAuditoria = {
  id: number;
  autor: string | null;
  autorPapel: string | null;
  acao: string;
  tabela: string;
  registroId: string | null;
  em: string;
  /* Só os campos que mudaram, já comparados. Despejar `antes` e `depois`
     inteiros na tela seria jogar duas linhas de banco na cara de quem só
     quer saber o que mudou. */
  mudancas: { campo: string; de: unknown; para: unknown }[];
};

export type Contato = {
  id: string;
  contaId: string;
  nome: string;
  cargo: string | null;
  email: string | null;
  telefone: string | null;
  whatsapp: string | null;
  principal: boolean;
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

/* ------------------------------------------------------------------ */
/* Ingestão                                                            */
/* ------------------------------------------------------------------ */

export const ESTADOS_INTEGRACAO = [
  'ok',
  'atrasada',
  'com_erro',
  'nunca_rodou',
  'sem_credencial',
  'desligada',
] as const;
export type EstadoIntegracao = (typeof ESTADOS_INTEGRACAO)[number];

export const rotuloEstadoIntegracao: Record<EstadoIntegracao, string> = {
  ok: 'Em dia',
  atrasada: 'Atrasada',
  com_erro: 'Com erro',
  nunca_rodou: 'Nunca rodou',
  sem_credencial: 'Sem credencial',
  desligada: 'Desligada',
};

/** Uma conexão com fonte de dado, sem o segredo: ele nunca sai do banco. */
export type IntegracaoStatus = {
  id: string;
  provedor: string;
  identificador: string | null;
  ativa: boolean;
  janelaDias: number;
  temCredencial: boolean;
  ultimaSync: string | null;
  ultimaSyncOk: string | null;
  ultimoErro: string | null;
  estado: EstadoIntegracao;
};

/** Uma tentativa de sincronização, do log. */
export type Sincronizacao = {
  id: number;
  provedor: string;
  origem: string;
  status: 'rodando' | 'sucesso' | 'erro';
  diaDe: string | null;
  diaAte: string | null;
  linhasLidas: number;
  linhasGravadas: number;
  erro: string | null;
  comecouEm: string;
  terminouEm: string | null;
};

/**
 * Há quanto tempo o dado da loja não chega.
 *
 * `diasSemDado30` é o que separa "vendeu menos" de "não chegou dado".
 * Sem essa distinção, buraco na série parece queda, e a agência liga
 * para o cliente quando devia ligar para o suporte da API.
 */
export type Frescor = {
  ultimoDia: string | null;
  atrasoDias: number | null;
  diasComDado30: number;
  diasSemDado30: number;
};

/** Uma proposta gerada, para a lista do painel. */
export type PropostaResumo = {
  id: string;
  slug: string;
  cliente: string;
  contato: string;
  status: 'rascunho' | 'enviada' | 'em_analise' | 'aceita' | 'recusada' | 'expirada';
  plano: string | null;
  /** Serviços avulsos, quando a proposta não é um pacote. */
  servicos: { id: string; fee: number }[];
  emitidaEm: string;
  validadeDias: number;
  /** Dias que faltam para vencer. Negativo já venceu. */
  diasParaVencer: number;
  autor: string | null;
  /* Os campos que a edição precisa devolver ao formulário. Vêm da
     mesma consulta da lista: buscar de novo por id seria ir ao banco
     atrás do que já está na memória. */
  resumo: string;
  diagnostico: string[];
  proximosPassos: string[];
};

export const rotuloStatusProposta: Record<PropostaResumo['status'], string> = {
  rascunho: 'Rascunho',
  enviada: 'Enviada',
  em_analise: 'Em análise',
  aceita: 'Aceita',
  recusada: 'Recusada',
  expirada: 'Expirada',
};

/* ------------------------------------------------------------------ */
/* Cobrança                                                            */
/* ------------------------------------------------------------------ */

export type FaturaResumo = {
  id: string;
  numero: string;
  conta: string | null;
  contaId: string;
  contratoId: string | null;
  status: 'aberta' | 'enviada' | 'paga' | 'vencida' | 'cancelada';
  valor: number;
  /** O que sobra depois da taxa do Asaas. Null antes da emissão. */
  valorLiquido: number | null;
  /** O que o cliente lê na cobrança. Null nas faturas de contrato. */
  descricao: string | null;
  parcelas: number;
  competencia: string;
  vencimento: string;
  pagaEm: string | null;
  /** Presente quando a cobrança já existe no Asaas. */
  asaasId: string | null;
  linkPagamento: string | null;
  /** Código PIX copia e cola, quando o Asaas devolveu. */
  pixCopiaCola: string | null;
  formaPagamento: string | null;
  /** Dias até vencer. Negativo já venceu. */
  diasAteVencer: number;
};

export const rotuloStatusFatura: Record<FaturaResumo['status'], string> = {
  aberta: 'Aberta',
  enviada: 'Enviada',
  paga: 'Paga',
  vencida: 'Vencida',
  cancelada: 'Cancelada',
};

export type ContratoAtivo = {
  id: string;
  conta: string | null;
  contaId: string;
  plano: string;
  feeMensal: number;
  inicio: string;
  fim: string | null;
  diaVencimento: number;
  /** Ligada: quem emite a fatura do mês é o Asaas. */
  cobrancaAutomatica: boolean;
  /** Começa depois de hoje: existe, mas ainda não fatura. */
  futuro: boolean;
  /** A fatura do mês corrente já existe? */
  faturadoNoMes: boolean;
};
