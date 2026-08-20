import 'server-only';
import { bancoConfigurado } from '@/lib/supabase/ambiente';
import { clienteServidor } from '@/lib/supabase/servidor';
import type {
  ContaResumo,
  DiaKpi,
  CanalKpi,
  FinanceiroMes,
  Lead,
  Tarefa,
  PessoaEquipe,
  Marco,
  RegistroAuditoria,
  EstagioFunil,
  ContaFicha,
  ContratoResumo,
  Interacao,
  Resposta,
  Situacao,
  Estagio,
  IntegracaoStatus,
  Sincronizacao,
  Frescor,
  EstadoIntegracao,
  PropostaResumo,
} from './tipos';
import { ESTAGIOS } from './tipos';
import * as demo from './demonstracao';
import { hojeBR, somarDias } from '@/lib/datas';

/**
 * A camada de dados da plataforma.
 *
 * Cada função tem dois caminhos: com banco configurado consulta o
 * Supabase; sem banco devolve dados de demonstração. Os dois devolvem o
 * MESMO formato, e junto vem a `procedencia`, para a tela poder avisar
 * de onde veio o número.
 *
 * O caminho do banco NÃO filtra por conta na consulta. Isso é
 * deliberado: quem filtra é o RLS, no Postgres. Um cliente logado
 * consultando `kpi_diario` recebe só as linhas da conta dele porque a
 * política `metrica_leitura` decide isso, e não porque eu lembrei de
 * escrever um `.eq()`. Filtro esquecido numa consulta é como dado de um
 * cliente aparece para outro.
 */

const semBanco = <T>(dados: T): Resposta<T> => ({ dados, procedencia: 'demonstracao' });
const doBanco = <T>(dados: T): Resposta<T> => ({ dados, procedencia: 'banco' });

/**
 * O estado intermediário: credenciais existem, tabelas ainda não.
 *
 * Acontece entre criar o projeto no Supabase e rodar as migrações. Sem
 * isto, o painel inteiro ficaria vazio nesse intervalo, sem dizer por
 * quê, e pareceria quebrado.
 *
 * O reconhecimento é ESTREITO de propósito: só "relação não existe"
 * (42P01 no Postgres, PGRST205 no PostgREST). Qualquer outro erro passa
 * direto e a tela mostra vazio.
 *
 * A diferença importa muito: "permissão negada" NÃO pode cair aqui. Se
 * caísse, um cliente sem acesso veria dados de demonstração no lugar de
 * uma tela vazia, e acharia que são os números dele.
 */
function faltamTabelas(erro: { code?: string; message?: string } | null) {
  if (!erro) return false;
  return (
    erro.code === 'PGRST205' ||
    erro.code === '42P01' ||
    /Could not find the table|does not exist/i.test(erro.message ?? '')
  );
}

/* ------------------------------------------------------------------ */
/* Contas                                                              */
/* ------------------------------------------------------------------ */

export async function listarContas(): Promise<Resposta<ContaResumo[]>> {
  if (!bancoConfigurado) return semBanco(demo.contasDemo());

  const supabase = await clienteServidor();

  /* Duas views em vez de um join: kpi_mes traz meta e progresso,
     saude_conta traz o semáforo. Juntar no banco exigiria uma terceira
     view só para isso, e o custo aqui é uma requisição a mais numa
     lista que tem dezenas de linhas, não milhares. */
  const [rMes, rSaude, rContas] = await Promise.all([
    supabase.from('kpi_mes').select('*'),
    supabase.from('saude_conta').select('*'),
    supabase.from('conta').select('id, nome, plataforma'),
  ]);

  if (faltamTabelas(rMes.error)) return semBanco(demo.contasDemo());

  const mes = rMes.data;
  const saude = rSaude.data;
  const contas = rContas.data;

  const porId = new Map((saude ?? []).map((s) => [s.conta_id as string, s]));
  const info = new Map((contas ?? []).map((c) => [c.id as string, c]));

  return doBanco(
    (mes ?? []).map((m) => {
      const s = porId.get(m.conta_id as string);
      return {
        id: m.conta_id as string,
        nome: m.conta_nome as string,
        plataforma: (info.get(m.conta_id as string)?.plataforma as string) ?? null,
        situacao: ((s?.situacao as Situacao) ?? 'sem_dado'),
        receita: Number(m.receita ?? 0),
        investimento: Number(m.investimento ?? 0),
        mer: m.mer === null || m.mer === undefined ? null : Number(m.mer),
        metaAtingida: m.meta_atingida === null ? null : Number(m.meta_atingida),
        receitaMeta: m.receita_meta === null ? null : Number(m.receita_meta),
        receitaDiaNecessaria:
          m.receita_dia_necessaria === null ? null : Number(m.receita_dia_necessaria),
        variacaoReceita:
          s?.variacao_receita === null || s?.variacao_receita === undefined
            ? null
            : Number(s.variacao_receita),
        ultimoDia: (s?.ultimo_dia as string) ?? null,
        responsavel: null,
      };
    }),
  );
}

export async function serieDaConta(
  contaId: string,
  dias = 30,
): Promise<Resposta<DiaKpi[]>> {
  if (!bancoConfigurado) return semBanco(demo.serieDemo(contaId, dias));

  const desde = new Date();
  desde.setDate(desde.getDate() - dias);

  const supabase = await clienteServidor();
  const { data, error } = await supabase
    .from('kpi_diario')
    .select('*')
    .eq('conta_id', contaId)
    .gte('dia', desde.toISOString().slice(0, 10))
    .order('dia', { ascending: true });

  if (faltamTabelas(error)) return semBanco(demo.serieDemo(contaId, dias));

  return doBanco(
    (data ?? []).map((d) => ({
      dia: d.dia as string,
      sessoes: Number(d.sessoes ?? 0),
      pedidosCaptados: Number(d.pedidos_captados ?? 0),
      pedidosAprovados: Number(d.pedidos_aprovados ?? 0),
      novosClientes: Number(d.novos_clientes ?? 0),
      receita: Number(d.receita ?? 0),
      investimento: Number(d.investimento ?? 0),
      mer: d.mer === null ? null : Number(d.mer),
      ticketMedio: d.ticket_medio === null ? null : Number(d.ticket_medio),
      cac: d.cac === null ? null : Number(d.cac),
      taxaConversao: d.taxa_conversao === null ? null : Number(d.taxa_conversao),
      taxaAprovacao: d.taxa_aprovacao === null ? null : Number(d.taxa_aprovacao),
    })),
  );
}

export async function canaisDaConta(
  contaId: string,
  dias = 30,
): Promise<Resposta<CanalKpi[]>> {
  if (!bancoConfigurado) return semBanco(demo.canaisDemo(contaId));

  const desde = new Date();
  desde.setDate(desde.getDate() - dias);

  const supabase = await clienteServidor();
  const { data, error } = await supabase
    .from('kpi_canal')
    .select('*')
    .eq('conta_id', contaId)
    .gte('dia', desde.toISOString().slice(0, 10));

  if (faltamTabelas(error)) return semBanco(demo.canaisDemo(contaId));

  /* A view é por dia e por canal. O acumulado do período é somado aqui:
     somar receita e investimento e SÓ DEPOIS dividir é o que dá o ROAS
     correto. Média de ROAS diário pesa igualmente um dia de R$ 50 e um
     de R$ 50 mil, e sai errado. */
  const acc = new Map<string, CanalKpi & { cliques: number; impressoes: number }>();
  for (const d of data ?? []) {
    const canal = d.canal as string;
    const a = acc.get(canal) ?? {
      canal, receita: 0, investimento: 0, pedidos: 0,
      roas: null, cpc: null, ctr: null, cliques: 0, impressoes: 0,
    };
    a.receita += Number(d.receita ?? 0);
    a.investimento += Number(d.investimento ?? 0);
    a.pedidos += Number(d.pedidos_aprovados ?? 0);
    a.cliques += Number(d.cliques ?? 0);
    a.impressoes += Number(d.impressoes ?? 0);
    acc.set(canal, a);
  }

  return doBanco(
    [...acc.values()]
      .map((a) => ({
        canal: a.canal,
        receita: a.receita,
        investimento: a.investimento,
        pedidos: a.pedidos,
        roas: a.investimento > 0 ? Number((a.receita / a.investimento).toFixed(2)) : null,
        cpc: a.cliques > 0 ? Number((a.investimento / a.cliques).toFixed(2)) : null,
        ctr: a.impressoes > 0 ? Number(((100 * a.cliques) / a.impressoes).toFixed(2)) : null,
      }))
      .sort((x, y) => y.receita - x.receita),
  );
}

export async function marcosDaConta(contaId: string): Promise<Resposta<Marco[]>> {
  if (!bancoConfigurado) return semBanco(demo.marcosDemo(contaId));

  const supabase = await clienteServidor();
  const { data, error } = await supabase
    .from('marco_conta')
    .select('id, dia, tipo, titulo, detalhe')
    .eq('conta_id', contaId)
    .order('dia', { ascending: false })
    .limit(20);

  if (faltamTabelas(error)) return semBanco(demo.marcosDemo(contaId));

  return doBanco(
    (data ?? []).map((m) => ({
      id: m.id as string,
      dia: m.dia as string,
      tipo: m.tipo as string,
      titulo: m.titulo as string,
      detalhe: (m.detalhe as string) ?? null,
    })),
  );
}

/* ------------------------------------------------------------------ */
/* Financeiro                                                          */
/* ------------------------------------------------------------------ */

export async function financeiroDoMes(): Promise<Resposta<FinanceiroMes>> {
  if (!bancoConfigurado) return semBanco(demo.financeiroDemo());

  const supabase = await clienteServidor();
  const { data, error } = await supabase.from('financeiro_mes').select('*').single();

  if (faltamTabelas(error)) return semBanco(demo.financeiroDemo());

  /* Sem linha significa sem permissão: financeiro é admin-only no RLS.
     Zerar é o comportamento certo, e a tela já checa o papel antes. */
  return doBanco({
    receitaRecorrente: Number(data?.receita_recorrente ?? 0),
    contratosAtivos: Number(data?.contratos_ativos ?? 0),
    recebidoMes: Number(data?.recebido_mes ?? 0),
    aReceberMes: Number(data?.a_receber_mes ?? 0),
    inadimplencia: Number(data?.inadimplencia ?? 0),
    verbaSobGestao: Number(data?.verba_sob_gestao ?? 0),
  });
}

/* ------------------------------------------------------------------ */
/* CRM                                                                 */
/* ------------------------------------------------------------------ */

export async function listarLeads(): Promise<Resposta<Lead[]>> {
  if (!bancoConfigurado) return semBanco(demo.leadsDemo());

  const supabase = await clienteServidor();
  const { data, error } = await supabase
    .from('lead')
    /* Uma string LITERAL, e não concatenada.

       O cliente do Supabase infere o TIPO do retorno lendo o texto do
       select em tempo de compilação. Quebrado em pedaços com `+`, ele
       desiste e devolve `GenericStringError`, e todo campo do resultado
       vira erro de tipo. Feio de ler, mas é o que faz o TypeScript
       conferir os nomes das colunas por nós. */
    .select('id, nome, empresa, email, telefone, estagio, origem, valor_fee_estimado, valor_verba_estimada, probabilidade, proximo_passo, proximo_passo_em, estagio_desde, motivo_perda, conta_id, criado_em, responsavel_id, perfil:responsavel_id(nome)')
    .order('criado_em', { ascending: false })
    .limit(300);

  if (faltamTabelas(error)) return semBanco(demo.leadsDemo());

  const agora = Date.now();

  return doBanco(
    (data ?? []).map((l) => ({
      id: l.id as string,
      nome: l.nome as string,
      empresa: (l.empresa as string) ?? null,
      email: (l.email as string) ?? null,
      telefone: (l.telefone as string) ?? null,
      estagio: l.estagio as Estagio,
      origem: (l.origem as string) ?? null,
      valorFee: l.valor_fee_estimado === null ? null : Number(l.valor_fee_estimado),
      valorVerba:
        l.valor_verba_estimada === null ? null : Number(l.valor_verba_estimada),
      probabilidade: l.probabilidade === null ? null : Number(l.probabilidade),
      responsavel: (l.perfil as unknown as { nome: string } | null)?.nome ?? null,
      responsavelId: (l.responsavel_id as string) ?? null,
      proximoPasso: (l.proximo_passo as string) ?? null,
      proximoPassoEm: (l.proximo_passo_em as string) ?? null,
      /* Dias no estágio, calculados aqui a partir do carimbo que o
         GATILHO mantém. Se o cálculo dependesse da tela, uma alteração
         por SQL pararia o relógio e o alerta de lead parado passaria a
         mentir justamente nos leads que ninguém está tocando. */
      diasNoEstagio: Math.floor(
        (agora - new Date(l.estagio_desde as string).getTime()) / 86400000,
      ),
      diasDesdeEntrada: Math.floor(
        (agora - new Date(l.criado_em as string).getTime()) / 86400000,
      ),
      motivoPerda: (l.motivo_perda as string) ?? null,
      contaId: (l.conta_id as string) ?? null,
      criadoEm: l.criado_em as string,
    })),
  );
}

/** Resumo por estágio, direto da view. */
export async function listarFunil(): Promise<Resposta<EstagioFunil[]>> {
  if (!bancoConfigurado) return semBanco(demo.funilDemo());

  const supabase = await clienteServidor();
  const { data, error } = await supabase.from('funil_comercial').select('*');

  if (faltamTabelas(error)) return semBanco(demo.funilDemo());

  const porEstagio = new Map(
    (data ?? []).map((f) => [f.estagio as Estagio, f]),
  );

  /* A view só devolve estágio que TEM lead. A tela precisa de todos, na
     ordem do funil, senão as colunas somem e reaparecem conforme o dia. */
  return doBanco(
    ESTAGIOS.map((estagio) => {
      const f = porEstagio.get(estagio);
      return {
        estagio,
        quantidade: Number(f?.quantidade ?? 0),
        valorTotal: Number(f?.valor_total ?? 0),
        valorPonderado: Number(f?.valor_ponderado ?? 0),
        diasMedios:
          f?.dias_medios_no_estagio === null || f?.dias_medios_no_estagio === undefined
            ? null
            : Number(f.dias_medios_no_estagio),
        parados: Number(f?.parados ?? 0),
      };
    }),
  );
}

/* ------------------------------------------------------------------ */
/* Ficha da loja                                                       */
/* ------------------------------------------------------------------ */

export async function fichaDaConta(
  contaId: string,
): Promise<Resposta<ContaFicha | null>> {
  if (!bancoConfigurado) return semBanco(demo.fichaDemo(contaId));

  const supabase = await clienteServidor();

  const [rConta, rSaude] = await Promise.all([
    supabase
      .from('conta')
      .select('id, nome, razao_social, documento, plataforma, site, segmento, situacao, data_inicio, observacoes, perfil:responsavel_id(nome)')
      .eq('id', contaId)
      .maybeSingle(),
    supabase
      .from('saude_conta')
      .select('pontuacao, tarefas_atrasadas, inadimplencia, dias_sem_registro')
      .eq('conta_id', contaId)
      .maybeSingle(),
  ]);

  if (faltamTabelas(rConta.error)) return semBanco(demo.fichaDemo(contaId));
  if (!rConta.data) return doBanco(null);

  const c = rConta.data;
  const s = rSaude.data;

  return doBanco({
    id: c.id as string,
    nome: c.nome as string,
    razaoSocial: (c.razao_social as string) ?? null,
    documento: (c.documento as string) ?? null,
    plataforma: (c.plataforma as string) ?? null,
    site: (c.site as string) ?? null,
    segmento: (c.segmento as string) ?? null,
    situacao: c.situacao as ContaFicha['situacao'],
    dataInicio: (c.data_inicio as string) ?? null,
    observacoes: (c.observacoes as string) ?? null,
    responsavel: (c.perfil as unknown as { nome: string } | null)?.nome ?? null,
    pontuacao: s?.pontuacao === null || s?.pontuacao === undefined ? null : Number(s.pontuacao),
    tarefasAtrasadas: Number(s?.tarefas_atrasadas ?? 0),
    inadimplencia: Number(s?.inadimplencia ?? 0),
    diasSemRegistro:
      s?.dias_sem_registro === null || s?.dias_sem_registro === undefined
        ? null
        : Number(s.dias_sem_registro),
  });
}

export async function contratosDaConta(
  contaId: string,
): Promise<Resposta<ContratoResumo[]>> {
  if (!bancoConfigurado) return semBanco([]);

  const supabase = await clienteServidor();
  const { data, error } = await supabase
    .from('contrato')
    .select('id, plano, fee_mensal, dia_vencimento, inicio, fim')
    .eq('conta_id', contaId)
    .order('inicio', { ascending: false });

  /* Sem linha aqui geralmente significa SEM PERMISSÃO, e não sem
     contrato: contrato é admin e financeiro. A tela decide o que dizer,
     conferindo o papel. */
  if (faltamTabelas(error)) return semBanco([]);

  return doBanco(
    (data ?? []).map((c) => ({
      id: c.id as string,
      plano: c.plano as string,
      feeMensal: Number(c.fee_mensal ?? 0),
      diaVencimento: Number(c.dia_vencimento ?? 10),
      inicio: c.inicio as string,
      fim: (c.fim as string) ?? null,
    })),
  );
}

export async function interacoesDaConta(
  contaId: string,
): Promise<Resposta<Interacao[]>> {
  if (!bancoConfigurado) return semBanco(demo.interacoesDemo());

  const supabase = await clienteServidor();
  const { data, error } = await supabase
    .from('interacao')
    .select('id, tipo, resumo, criada_em, perfil:autor_id(nome)')
    .eq('conta_id', contaId)
    .order('criada_em', { ascending: false })
    .limit(50);

  if (faltamTabelas(error)) return semBanco(demo.interacoesDemo());

  return doBanco(
    (data ?? []).map((i) => ({
      id: i.id as string,
      tipo: i.tipo as string,
      resumo: i.resumo as string,
      autor: (i.perfil as unknown as { nome: string } | null)?.nome ?? null,
      em: i.criada_em as string,
    })),
  );
}

/* ------------------------------------------------------------------ */
/* Operação                                                            */
/* ------------------------------------------------------------------ */

export async function listarTarefas(): Promise<Resposta<Tarefa[]>> {
  if (!bancoConfigurado) return semBanco(demo.tarefasDemo());

  const supabase = await clienteServidor();
  const { data, error } = await supabase
    .from('tarefa')
    .select('id, titulo, status, prazo, conta:conta_id(nome), perfil:responsavel_id(nome)')
    .order('prazo', { ascending: true, nullsFirst: false })
    .limit(200);

  if (faltamTabelas(error)) return semBanco(demo.tarefasDemo());

  return doBanco(
    (data ?? []).map((t) => ({
      id: t.id as string,
      titulo: t.titulo as string,
      conta: (t.conta as unknown as { nome: string } | null)?.nome ?? null,
      status: t.status as Tarefa['status'],
      responsavel: (t.perfil as unknown as { nome: string } | null)?.nome ?? null,
      prazo: (t.prazo as string) ?? null,
    })),
  );
}

export async function listarEquipe(): Promise<Resposta<PessoaEquipe[]>> {
  if (!bancoConfigurado) return semBanco(demo.equipeDemo());

  const supabase = await clienteServidor();

  /* As lojas vêm junto, pelo relacionamento. Uma consulta por pessoa
     seria N+1 numa tela que existe justamente para ver todo mundo de
     uma vez. */
  const { data, error } = await supabase
    .from('perfil')
    .select('id, nome, email, papel, ativo, acessos_conta(conta:conta_id(id, nome))')
    .order('nome');

  if (faltamTabelas(error)) return semBanco(demo.equipeDemo());

  type LinhaAcesso = { conta: { id: string; nome: string } | null };

  return doBanco(
    (data ?? []).map((p) => ({
      id: p.id as string,
      nome: p.nome as string,
      email: p.email as string,
      papel: p.papel as string,
      ativo: Boolean(p.ativo),
      contas: ((p.acessos_conta as unknown as LinhaAcesso[]) ?? [])
        .map((a) => a.conta)
        .filter((c): c is { id: string; nome: string } => c !== null),
    })),
  );
}

/**
 * Trilha de auditoria.
 *
 * A tabela guarda `antes` e `depois` como a linha inteira em jsonb. A
 * tela não precisa disso: precisa saber O QUE MUDOU. A comparação
 * acontece aqui, e o que sobe para a interface são só os campos
 * diferentes.
 *
 * Campos de carimbo ficam de fora: `atualizado_em` muda em toda escrita
 * e apareceria em 100% das linhas, empurrando para baixo a alteração
 * que interessa.
 */
const CAMPOS_IGNORADOS = new Set(['atualizado_em', 'atualizada_em', 'criado_em', 'criada_em']);

export async function listarAuditoria(
  limite = 100,
): Promise<Resposta<RegistroAuditoria[]>> {
  if (!bancoConfigurado) return semBanco(demo.auditoriaDemo());

  const supabase = await clienteServidor();
  const { data, error } = await supabase
    .from('log_auditoria')
    .select('id, acao, tabela, registro_id, em, autor_papel, perfil:autor_id(nome)')
    .order('em', { ascending: false })
    .limit(limite);

  if (faltamTabelas(error)) return semBanco(demo.auditoriaDemo());

  /* `antes` e `depois` vêm numa segunda consulta, só das linhas que a
     primeira devolveu: são os dois campos mais pesados da tabela, e
     trazê-los no join multiplicaria o payload por nada. */
  const ids = (data ?? []).map((l) => l.id as number);
  const { data: corpos } = ids.length
    ? await supabase.from('log_auditoria').select('id, antes, depois').in('id', ids)
    : { data: [] };

  const porId = new Map(
    (corpos ?? []).map((c) => [c.id as number, c as { antes: unknown; depois: unknown }]),
  );

  return doBanco(
    (data ?? []).map((l) => {
      const c = porId.get(l.id as number);
      const antes = (c?.antes ?? null) as Record<string, unknown> | null;
      const depois = (c?.depois ?? null) as Record<string, unknown> | null;

      const campos = new Set([
        ...Object.keys(antes ?? {}),
        ...Object.keys(depois ?? {}),
      ]);

      const mudancas: RegistroAuditoria['mudancas'] = [];
      for (const campo of campos) {
        if (CAMPOS_IGNORADOS.has(campo)) continue;
        const de = antes?.[campo] ?? null;
        const para = depois?.[campo] ?? null;
        if (JSON.stringify(de) === JSON.stringify(para)) continue;
        mudancas.push({ campo, de, para });
      }

      return {
        id: l.id as number,
        autor: (l.perfil as unknown as { nome: string } | null)?.nome ?? null,
        autorPapel: (l.autor_papel as string) ?? null,
        acao: l.acao as string,
        tabela: l.tabela as string,
        registroId: (l.registro_id as string) ?? null,
        em: l.em as string,
        mudancas,
      };
    }),
  );
}

/* ------------------------------------------------------------------ */
/* Ingestão                                                            */
/* ------------------------------------------------------------------ */

export async function integracoesDaConta(
  contaId: string,
): Promise<Resposta<IntegracaoStatus[]>> {
  if (!bancoConfigurado) return semBanco([]);

  const supabase = await clienteServidor();

  /* `integracao_status` é uma view DEFINER que não expõe a coluna
     `segredo` e filtra por e_interno() no próprio corpo. Para cliente
     ela volta vazia, que é o certo: status de conexão é assunto da
     agência. */
  const { data, error } = await supabase
    .from('integracao_status')
    .select('id, provedor, identificador, ativa, janela_dias, tem_credencial, ultima_sync, ultima_sync_ok, ultimo_erro, estado')
    .eq('conta_id', contaId)
    .order('provedor');

  if (faltamTabelas(error)) return semBanco([]);

  return doBanco(
    (data ?? []).map((i) => ({
      id: i.id as string,
      provedor: i.provedor as string,
      identificador: (i.identificador as string) ?? null,
      ativa: Boolean(i.ativa),
      janelaDias: Number(i.janela_dias ?? 7),
      temCredencial: Boolean(i.tem_credencial),
      ultimaSync: (i.ultima_sync as string) ?? null,
      ultimaSyncOk: (i.ultima_sync_ok as string) ?? null,
      ultimoErro: (i.ultimo_erro as string) ?? null,
      estado: i.estado as EstadoIntegracao,
    })),
  );
}

export async function sincronizacoesDaConta(
  contaId: string,
  limite = 12,
): Promise<Resposta<Sincronizacao[]>> {
  if (!bancoConfigurado) return semBanco([]);

  const supabase = await clienteServidor();
  const { data, error } = await supabase
    .from('sincronizacao')
    .select('id, provedor, origem, status, dia_de, dia_ate, linhas_lidas, linhas_gravadas, erro, comecou_em, terminou_em')
    .eq('conta_id', contaId)
    .order('comecou_em', { ascending: false })
    .limit(limite);

  if (faltamTabelas(error)) return semBanco([]);

  return doBanco(
    (data ?? []).map((s) => ({
      id: Number(s.id),
      provedor: s.provedor as string,
      origem: s.origem as string,
      status: s.status as Sincronizacao['status'],
      diaDe: (s.dia_de as string) ?? null,
      diaAte: (s.dia_ate as string) ?? null,
      linhasLidas: Number(s.linhas_lidas ?? 0),
      linhasGravadas: Number(s.linhas_gravadas ?? 0),
      erro: (s.erro as string) ?? null,
      comecouEm: s.comecou_em as string,
      terminouEm: (s.terminou_em as string) ?? null,
    })),
  );
}

export async function frescorDaConta(contaId: string): Promise<Resposta<Frescor>> {
  const vazio: Frescor = {
    ultimoDia: null,
    atrasoDias: null,
    diasComDado30: 0,
    diasSemDado30: 30,
  };

  if (!bancoConfigurado) return semBanco(vazio);

  const supabase = await clienteServidor();
  const { data, error } = await supabase
    .from('frescor_conta')
    .select('ultimo_dia, atraso_dias, dias_com_dado_30, dias_sem_dado_30')
    .eq('conta_id', contaId)
    .maybeSingle();

  if (faltamTabelas(error)) return semBanco(vazio);
  if (!data) return doBanco(vazio);

  return doBanco({
    ultimoDia: (data.ultimo_dia as string) ?? null,
    atrasoDias: data.atraso_dias === null ? null : Number(data.atraso_dias),
    diasComDado30: Number(data.dias_com_dado_30 ?? 0),
    diasSemDado30: Number(data.dias_sem_dado_30 ?? 30),
  });
}

/* ------------------------------------------------------------------ */
/* Propostas                                                           */
/* ------------------------------------------------------------------ */

export async function listarPropostas(): Promise<Resposta<PropostaResumo[]>> {
  if (!bancoConfigurado) return semBanco([]);

  const supabase = await clienteServidor();
  const { data, error } = await supabase
    .from('proposta')
    .select('id, slug, cliente, contato, status, corpo, emitida_em, validade_dias, perfil:criada_por(nome)')
    .order('criada_em', { ascending: false })
    .limit(60);

  if (faltamTabelas(error)) return semBanco([]);

  const hoje = hojeBR();

  return doBanco(
    (data ?? []).map((p) => {
      const emitida = p.emitida_em as string;
      const vence = somarDias(emitida, Number(p.validade_dias ?? 15));

      return {
        id: p.id as string,
        slug: p.slug as string,
        cliente: p.cliente as string,
        contato: p.contato as string,
        status: p.status as PropostaResumo['status'],
        plano: ((p.corpo as { plano?: string })?.plano) ?? null,
        emitidaEm: emitida,
        validadeDias: Number(p.validade_dias ?? 15),
        /* Calculado AQUI, na camada de dados, e não no render: contar
           dias exige saber que dia é hoje, e Date.now() durante o render
           é chamada impura. */
        diasParaVencer: Math.round(
          (Date.parse(`${vence}T00:00:00Z`) - Date.parse(`${hoje}T00:00:00Z`)) / 86400000,
        ),
        autor: (p.perfil as unknown as { nome: string } | null)?.nome ?? null,
      };
    }),
  );
}
