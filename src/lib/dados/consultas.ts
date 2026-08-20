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
  Resposta,
  Situacao,
  Estagio,
} from './tipos';
import * as demo from './demonstracao';

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
  const [{ data: mes }, { data: saude }, { data: contas }] = await Promise.all([
    supabase.from('kpi_mes').select('*'),
    supabase.from('saude_conta').select('*'),
    supabase.from('conta').select('id, nome, plataforma'),
  ]);

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
  const { data } = await supabase
    .from('kpi_diario')
    .select('*')
    .eq('conta_id', contaId)
    .gte('dia', desde.toISOString().slice(0, 10))
    .order('dia', { ascending: true });

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
  const { data } = await supabase
    .from('kpi_canal')
    .select('*')
    .eq('conta_id', contaId)
    .gte('dia', desde.toISOString().slice(0, 10));

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
  const { data } = await supabase
    .from('marco_conta')
    .select('id, dia, tipo, titulo, detalhe')
    .eq('conta_id', contaId)
    .order('dia', { ascending: false })
    .limit(20);

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
  const { data } = await supabase.from('financeiro_mes').select('*').single();

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
  const { data } = await supabase
    .from('lead')
    .select('id, nome, empresa, estagio, origem, valor_estimado, criado_em, perfil:responsavel_id(nome)')
    .order('criado_em', { ascending: false })
    .limit(200);

  return doBanco(
    (data ?? []).map((l) => ({
      id: l.id as string,
      nome: l.nome as string,
      empresa: (l.empresa as string) ?? null,
      estagio: l.estagio as Estagio,
      origem: (l.origem as string) ?? null,
      valorEstimado: l.valor_estimado === null ? null : Number(l.valor_estimado),
      responsavel:
        (l.perfil as unknown as { nome: string } | null)?.nome ?? null,
      criadoEm: l.criado_em as string,
    })),
  );
}

/* ------------------------------------------------------------------ */
/* Operação                                                            */
/* ------------------------------------------------------------------ */

export async function listarTarefas(): Promise<Resposta<Tarefa[]>> {
  if (!bancoConfigurado) return semBanco(demo.tarefasDemo());

  const supabase = await clienteServidor();
  const { data } = await supabase
    .from('tarefa')
    .select('id, titulo, status, prazo, conta:conta_id(nome), perfil:responsavel_id(nome)')
    .order('prazo', { ascending: true, nullsFirst: false })
    .limit(200);

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
  const { data } = await supabase
    .from('perfil')
    .select('id, nome, email, papel, ativo')
    .order('nome');

  return doBanco(
    (data ?? []).map((p) => ({
      id: p.id as string,
      nome: p.nome as string,
      email: p.email as string,
      papel: p.papel as string,
      ativo: Boolean(p.ativo),
      contas: 0,
    })),
  );
}
