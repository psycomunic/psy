import 'server-only';
import { bancoConfigurado } from '@/lib/supabase/ambiente';
import { clienteServidor } from '@/lib/supabase/servidor';
import { montarAbordagem } from '@/lib/dominio/abordagem';
import type {
  ContaResumo,
  DiaKpi,
  CanalKpi,
  CampanhaResumo,
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
  Cobranca,
  IntegracaoStatus,
  Sincronizacao,
  Frescor,
  EstadoIntegracao,
  PropostaResumo,
  FaturaResumo,
  ContratoAtivo,
  MesFinanceiro,
  Despesa,
  TipoConta,
  Notificacao,
  Prospecto,
  PrioridadeProspeccao,
  Projeto,
  TipoProjeto,
  SituacaoProjeto,
  Postagem,
  PerfilSocial,
  FormatoPost,
  SituacaoPost,
  ArquivoDaPostagem,
  RelatorioResumo,
  StatusRelatorio,
  BlocoRelatorio,
  ResultadoComercialRelatorio,
  SnapshotRelatorio,
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
 * ============================================================
 * O ERRO QUE ESTA FUNÇÃO JÁ COMETEU
 * ============================================================
 * A primeira versão também casava a MENSAGEM, com
 * `/Could not find the table|does not exist/i`. Parecia inofensivo, e
 * não era: o Postgres diz "column lead.motivo_perda does not exist"
 * quando falta uma COLUNA, e aquele regex engolia isso também.
 *
 * O efeito: um erro de digitação numa coluna virava "as tabelas ainda
 * não existem", e o painel respondia com DADOS DE DEMONSTRAÇÃO. Um
 * administrador logado no banco de produção via um funil inventado, com
 * nomes de empresa fictícios e previsão de R$ 13,6 mil, sem nenhum
 * aviso de que algo tinha falhado.
 *
 * É a pior falha possível nesta camada, porque não parece falha.
 *
 * Agora só os dois CÓDIGOS de "relação não existe" contam: 42P01 no
 * Postgres, PGRST205 no PostgREST. Código é exato; mensagem é texto que
 * muda de versão para versão e casa com o que não devia.
 *
 * Qualquer outro erro passa direto, e a tela mostra VAZIO. Vazio é
 * honesto: diz que não há nada para mostrar. Dado de demonstração
 * afirma um número que ninguém faturou.
 */
function faltamTabelas(erro: { code?: string; message?: string } | null) {
  if (!erro) return false;

  const tabelaAusente =
    erro.code === 'PGRST205' ||
    erro.code === '42P01' ||
    /Could not find the table/i.test(erro.message ?? '');

  /* Erro inesperado não pode sumir. Sem este registro, a consulta
     devolve vazio e ninguém fica sabendo por quê — que foi exatamente
     como o `motivo_perda` passou despercebido. Vai para o log do
     servidor, e nunca para a tela: mensagem de erro de banco expõe
     nome de coluna e de tabela. */
  if (!tabelaAusente) {
    console.error(`[consultas] ${erro.code ?? 'sem código'}: ${erro.message ?? 'sem mensagem'}`);
  }

  return tabelaAusente;
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
    /* `select('*')` para continuar funcionando mesmo antes da migração
       0050 adicionar `perfil_metrica` e `kpis_visiveis` no banco. */
    supabase.from('conta').select('*'),
  ]);

  if (faltamTabelas(rMes.error)) return semBanco(demo.contasDemo());

  const mes = rMes.data;
  const saude = rSaude.data;
  const contas = rContas.data;

  const porId = new Map((saude ?? []).map((s) => [s.conta_id as string, s]));
  const info = new Map((contas ?? []).map((c) => [c.id as string, c as Record<string, unknown>]));

  return doBanco(
    (mes ?? []).map((m) => {
      const mRec = m as Record<string, unknown>;
      const s = porId.get(m.conta_id as string);
      const inf = info.get(m.conta_id as string);
      return {
        id: m.conta_id as string,
        nome: m.conta_nome as string,
        tipo: ((inf?.tipo as TipoConta) ?? 'ecommerce'),
        perfilMetrica:
          ((inf?.perfil_metrica as ContaResumo['perfilMetrica']) ?? 'automatico'),
        kpisVisiveis: Array.isArray(inf?.kpis_visiveis)
          ? (inf.kpis_visiveis as string[])
          : null,
        segmento: (inf?.segmento as string) ?? null,
        plataforma: (inf?.plataforma as string) ?? null,
        situacao: ((s?.situacao as Situacao) ?? 'sem_dado'),
        receita: Number(m.receita ?? 0),
        receitaAtribuida: Number(mRec.receita_atribuida ?? 0),
        investimento: Number(m.investimento ?? 0),
        conversas: Number(mRec.conversas ?? 0),
        leadsCaptados: Number(mRec.leads_captados ?? 0),
        comprasAtribuidas: Number(mRec.compras_atribuidas ?? 0),
        alcance: Number(mRec.alcance ?? 0),
        cliquesLink: Number(mRec.cliques_link ?? 0),
        mer: m.mer === null || m.mer === undefined ? null : Number(m.mer),
        metaAtingida: m.meta_atingida === null ? null : Number(m.meta_atingida),
        receitaMeta: m.receita_meta === null ? null : Number(m.receita_meta),
        verbaMeta:
          mRec.verba_meta === null || mRec.verba_meta === undefined
            ? null
            : Number(mRec.verba_meta),
        resultadoMeta:
          mRec.resultado_meta === null || mRec.resultado_meta === undefined
            ? null
            : Number(mRec.resultado_meta),
        custoResultadoTeto:
          mRec.custo_resultado_teto === null || mRec.custo_resultado_teto === undefined
            ? null
            : Number(mRec.custo_resultado_teto),
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

function mapearDiaKpi(d: Record<string, unknown>): DiaKpi {
  const receita = Number(d.receita ?? 0);
  const investimento = Number(d.investimento ?? 0);
  const pedidosCaptados = Number(d.pedidos_captados ?? 0);
  const pedidosAprovados = Number(d.pedidos_aprovados ?? 0);
  const novosClientes = Number(d.novos_clientes ?? 0);
  const sessoes = Number(d.sessoes ?? 0);
  const cliques = Number(d.cliques ?? 0);
  const cliquesLink = Number(d.cliques_link ?? 0);

  return {
    dia: d.dia as string,
    sessoes,
    pedidosCaptados,
    pedidosAprovados,
    novosClientes,
    receita,
    receitaAtribuida: Number(d.receita_atribuida ?? 0),
    investimento,
    impressoes: Number(d.impressoes ?? 0),
    alcance: Number(d.alcance ?? 0),
    cliques,
    cliquesLink: cliquesLink > 0 ? cliquesLink : cliques,
    visitasPagina: Number(d.visitas_pagina ?? 0),
    conversas: Number(d.conversas ?? 0),
    leadsCaptados: Number(d.leads_captados ?? 0),
    comprasAtribuidas: Number(d.compras_atribuidas ?? 0),
    carrinhos: Number(d.carrinhos ?? 0),
    checkouts: Number(d.checkouts ?? 0),
    engajamentos: Number(d.engajamentos ?? 0),
    visualizacoesVideo: Number(d.visualizacoes_video ?? 0),
    mer:
      d.mer !== undefined
        ? d.mer === null
          ? null
          : Number(d.mer)
        : investimento > 0
          ? Number((receita / investimento).toFixed(2))
          : null,
    ticketMedio:
      d.ticket_medio !== undefined
        ? d.ticket_medio === null
          ? null
          : Number(d.ticket_medio)
        : pedidosAprovados > 0
          ? Number((receita / pedidosAprovados).toFixed(2))
          : null,
    cac:
      d.cac !== undefined
        ? d.cac === null
          ? null
          : Number(d.cac)
        : novosClientes > 0
          ? Number((investimento / novosClientes).toFixed(2))
          : null,
    taxaConversao:
      d.taxa_conversao !== undefined
        ? d.taxa_conversao === null
          ? null
          : Number(d.taxa_conversao)
        : sessoes > 0
          ? Number(((100 * pedidosCaptados) / sessoes).toFixed(2))
          : null,
    taxaAprovacao:
      d.taxa_aprovacao !== undefined
        ? d.taxa_aprovacao === null
          ? null
          : Number(d.taxa_aprovacao)
        : pedidosCaptados > 0
          ? Number(((100 * pedidosAprovados) / pedidosCaptados).toFixed(2))
          : null,
  };
}

export async function serieDaContaPeriodo(
  contaId: string,
  de: string,
  ate: string,
  canalFiltro?: string,
): Promise<Resposta<DiaKpi[]>> {
  const dias = Math.max(
    1,
    Math.round((Date.parse(`${ate}T00:00:00Z`) - Date.parse(`${de}T00:00:00Z`)) / 86400000) + 1,
  );

  if (!bancoConfigurado) {
    const todos = demo.serieDemo(contaId, Math.max(dias + 30, 60));
    return semBanco(todos.filter((d) => d.dia >= de && d.dia <= ate));
  }

  const supabase = await clienteServidor();
  const filtrarCanal = canalFiltro && canalFiltro !== 'todos';

  const consulta = filtrarCanal
    ? supabase
        .from('metrica_diaria')
        .select('*')
        .eq('conta_id', contaId)
        .eq('canal', canalFiltro)
        .gte('dia', de)
        .lte('dia', ate)
        .order('dia', { ascending: true })
    : supabase
        .from('kpi_diario')
        .select('*')
        .eq('conta_id', contaId)
        .gte('dia', de)
        .lte('dia', ate)
        .order('dia', { ascending: true });

  const { data, error } = await consulta;
  if (faltamTabelas(error)) {
    const todos = demo.serieDemo(contaId, Math.max(dias + 30, 60));
    return semBanco(todos.filter((d) => d.dia >= de && d.dia <= ate));
  }

  return doBanco((data ?? []).map((d) => mapearDiaKpi(d as Record<string, unknown>)));
}

export async function serieDaConta(
  contaId: string,
  dias = 30,
): Promise<Resposta<DiaKpi[]>> {
  const hoje = hojeBR();
  const desde = somarDias(hoje, -dias);
  return serieDaContaPeriodo(contaId, desde, hoje);
}

/** Menor data já gravada em `metrica_diaria` para esta conta, usada para avisar
    quando o filtro selecionado começa antes do histórico sincronizado. */
export async function primeiroDiaSincronizado(contaId: string): Promise<string | null> {
  if (!bancoConfigurado) return null;
  const supabase = await clienteServidor();
  const { data, error } = await supabase
    .from('metrica_diaria')
    .select('dia')
    .eq('conta_id', contaId)
    .order('dia', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return (data.dia as string) ?? null;
}

export async function canaisDaContaPeriodo(
  contaId: string,
  de: string,
  ate: string,
): Promise<Resposta<CanalKpi[]>> {
  if (!bancoConfigurado) return semBanco(demo.canaisDemo(contaId));

  const supabase = await clienteServidor();
  const { data, error } = await supabase
    .from('kpi_canal')
    .select('*')
    .eq('conta_id', contaId)
    .gte('dia', de)
    .lte('dia', ate);

  if (faltamTabelas(error)) return semBanco(demo.canaisDemo(contaId));

  const acc = new Map<string, CanalKpi>();
  for (const bruto of data ?? []) {
    const d = bruto as Record<string, unknown>;
    const canal = d.canal as string;
    const a = acc.get(canal) ?? {
      canal,
      receita: 0,
      receitaAtribuida: 0,
      investimento: 0,
      pedidos: 0,
      conversas: 0,
      leadsCaptados: 0,
      comprasAtribuidas: 0,
      impressoes: 0,
      alcance: 0,
      cliques: 0,
      cliquesLink: 0,
      roas: null,
      roasDeclarado: null,
      cpc: null,
      ctr: null,
    };
    a.receita += Number(d.receita ?? 0);
    a.receitaAtribuida += Number(d.receita_atribuida ?? 0);
    a.investimento += Number(d.investimento ?? 0);
    a.pedidos += Number(d.pedidos_aprovados ?? 0);
    a.conversas += Number(d.conversas ?? 0);
    a.leadsCaptados += Number(d.leads_captados ?? 0);
    a.comprasAtribuidas += Number(d.compras_atribuidas ?? 0);
    a.impressoes += Number(d.impressoes ?? 0);
    a.alcance += Number(d.alcance ?? 0);
    a.cliques += Number(d.cliques ?? 0);
    a.cliquesLink += Number(d.cliques_link ?? 0);
    acc.set(canal, a);
  }

  return doBanco(
    [...acc.values()]
      .map((a) => {
        const cliquesRef = a.cliquesLink > 0 ? a.cliquesLink : a.cliques;
        return {
          ...a,
          cliquesLink: cliquesRef,
          roas: a.investimento > 0 && a.receita > 0 ? Number((a.receita / a.investimento).toFixed(2)) : null,
          roasDeclarado:
            a.investimento > 0 && a.receitaAtribuida > 0
              ? Number((a.receitaAtribuida / a.investimento).toFixed(2))
              : null,
          cpc: cliquesRef > 0 && a.investimento > 0 ? Number((a.investimento / cliquesRef).toFixed(2)) : null,
          ctr: a.impressoes > 0 ? Number(((100 * cliquesRef) / a.impressoes).toFixed(2)) : null,
        };
      })
      .sort((x, y) => y.investimento - x.investimento || y.receita - x.receita),
  );
}

export async function canaisDaConta(
  contaId: string,
  dias = 30,
): Promise<Resposta<CanalKpi[]>> {
  const hoje = hojeBR();
  return canaisDaContaPeriodo(contaId, somarDias(hoje, -dias), hoje);
}

export async function campanhasDaContaPeriodo(
  contaId: string,
  de: string,
  ate: string,
  canalFiltro?: string,
): Promise<Resposta<CampanhaResumo[]>> {
  if (!bancoConfigurado) {
    const lista = demo.campanhasDemo(contaId);
    return semBanco(
      canalFiltro && canalFiltro !== 'todos'
        ? lista.filter((c) => c.canal === canalFiltro)
        : lista,
    );
  }

  const supabase = await clienteServidor();
  let consulta = supabase
    .from('metrica_campanha')
    .select('*')
    .eq('conta_id', contaId)
    .gte('dia', de)
    .lte('dia', ate);

  if (canalFiltro && canalFiltro !== 'todos') {
    consulta = consulta.eq('canal', canalFiltro);
  }

  const { data, error } = await consulta;
  /* Se a migração 0050 ainda não rodou no banco real, devolve vazio do
     banco — nunca campanha fictícia em cima de cliente real. */
  if (error) return doBanco([]);

  const acc = new Map<string, CampanhaResumo>();
  for (const bruto of data ?? []) {
    const d = bruto as Record<string, unknown>;
    const chave = `${d.provedor as string}|${d.campanha_id as string}`;
    const atual = acc.get(chave) ?? {
      campanhaId: d.campanha_id as string,
      campanhaNome: (d.campanha_nome as string) ?? 'Campanha',
      provedor: (d.provedor as string) ?? 'meta_ads',
      canal: (d.canal as string) ?? 'meta',
      objetivo: ((d.objetivo as CampanhaResumo['objetivo']) ?? 'outro'),
      statusCampanha: (d.status_campanha as string) ?? null,
      investimento: 0,
      impressoes: 0,
      alcance: 0,
      cliques: 0,
      cliquesLink: 0,
      visitasPagina: 0,
      conversas: 0,
      leadsCaptados: 0,
      comprasAtribuidas: 0,
      receitaAtribuida: 0,
      carrinhos: 0,
      checkouts: 0,
      engajamentos: 0,
      visualizacoesVideo: 0,
      ctr: null,
      cpc: null,
      cpm: null,
    };

    atual.campanhaNome = (d.campanha_nome as string) || atual.campanhaNome;
    if (d.status_campanha) atual.statusCampanha = d.status_campanha as string;
    atual.investimento += Number(d.investimento ?? 0);
    atual.impressoes += Number(d.impressoes ?? 0);
    /* Alcance somado dia a dia superestima alcance único do mês, mas é a
       melhor aproximação diária disponível por campanha sem reconsultar
       a janela inteira na API. */
    atual.alcance = Math.max(atual.alcance, Number(d.alcance ?? 0));
    atual.cliques += Number(d.cliques ?? 0);
    atual.cliquesLink += Number(d.cliques_link ?? 0);
    atual.visitasPagina += Number(d.visitas_pagina ?? 0);
    atual.conversas += Number(d.conversas ?? 0);
    atual.leadsCaptados += Number(d.leads_captados ?? 0);
    atual.comprasAtribuidas += Number(d.compras_atribuidas ?? 0);
    atual.receitaAtribuida += Number(d.receita_atribuida ?? 0);
    atual.carrinhos += Number(d.carrinhos ?? 0);
    atual.checkouts += Number(d.checkouts ?? 0);
    atual.engajamentos += Number(d.engajamentos ?? 0);
    atual.visualizacoesVideo += Number(d.visualizacoes_video ?? 0);
    acc.set(chave, atual);
  }

  return doBanco(
    [...acc.values()]
      .map((c) => {
        const cliquesRef = c.cliquesLink > 0 ? c.cliquesLink : c.cliques;
        const inv = Number(c.investimento.toFixed(2));
        return {
          ...c,
          investimento: inv,
          receitaAtribuida: Number(c.receitaAtribuida.toFixed(2)),
          cliquesLink: cliquesRef,
          ctr: c.impressoes > 0 ? Number(((100 * cliquesRef) / c.impressoes).toFixed(2)) : null,
          cpc: cliquesRef > 0 ? Number((inv / cliquesRef).toFixed(2)) : null,
          cpm: c.impressoes > 0 ? Number(((inv * 1000) / c.impressoes).toFixed(2)) : null,
        };
      })
      .sort((a, b) => b.investimento - a.investimento),
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
    faturadoMes: Number(data?.faturado_mes ?? 0),
    recebidoMes: Number(data?.recebido_mes ?? 0),
    recebidoLiquidoMes: Number(data?.recebido_liquido_mes ?? 0),
    aReceberMes: Number(data?.a_receber_mes ?? 0),
    inadimplencia: Number(data?.inadimplencia ?? 0),
    faturasVencidas: Number(data?.faturas_vencidas ?? 0),
    despesaMes: Number(data?.despesa_mes ?? 0),
    despesaPrevistaMes: Number(data?.despesa_prevista_mes ?? 0),
    verbaSobGestao: Number(data?.verba_sob_gestao ?? 0),
  });
}

/**
 * Doze meses de faturado, recebido e despesa.
 *
 * A view devolve sempre 12 linhas, inclusive as vazias. Mês sem
 * movimento é informação: uma série que pula os meses parados desenha
 * uma linha subindo onde na verdade houve um buraco.
 */
export async function serieFinanceira(): Promise<Resposta<MesFinanceiro[]>> {
  if (!bancoConfigurado) return semBanco([]);

  const supabase = await clienteServidor();
  const { data, error } = await supabase
    .from('serie_financeira')
    .select('*')
    .order('mes', { ascending: true });

  if (faltamTabelas(error)) return semBanco([]);

  return doBanco(
    (data ?? []).map((m) => ({
      mes: m.mes as string,
      faturado: Number(m.faturado ?? 0),
      recebido: Number(m.recebido ?? 0),
      despesa: Number(m.despesa ?? 0),
    })),
  );
}

/**
 * O WhatsApp de quem paga, por loja.
 *
 * A régua de cobrança da agência é o WhatsApp, e não o e-mail que o
 * Asaas dispara — que é onde ele costuma morrer. Sem o número aqui,
 * cobrar um atraso vira "abre a ficha da loja, copia o telefone, volta".
 */
export async function whatsappDeCobranca(): Promise<Resposta<Record<string, string>>> {
  if (!bancoConfigurado) return semBanco({});

  const supabase = await clienteServidor();
  const { data, error } = await supabase
    .from('contato')
    .select('conta_id, whatsapp, telefone, principal')
    .order('principal', { ascending: false });

  if (faltamTabelas(error)) return semBanco({});

  const porConta: Record<string, string> = {};
  for (const c of data ?? []) {
    const numero = ((c.whatsapp as string) || (c.telefone as string) || '').trim();
    /* O primeiro que aparece vence, e a ordenação põe o contato
       principal na frente. Contato secundário só entra quando não há
       principal com número. */
    if (numero && !porConta[c.conta_id as string]) {
      porConta[c.conta_id as string] = numero;
    }
  }

  return doBanco(porConta);
}

/** As despesas da agência. Receita não mora aqui: mora em `fatura`. */
export async function listarDespesas(limite = 80): Promise<Resposta<Despesa[]>> {
  if (!bancoConfigurado) return semBanco([]);

  const supabase = await clienteServidor();
  const { data, error } = await supabase
    .from('lancamento')
    .select('id, descricao, categoria, valor, vencimento, pago_em, status, conta:conta_id(nome)')
    .order('vencimento', { ascending: false })
    .limit(limite);

  if (faltamTabelas(error)) return semBanco([]);

  const hoje = hojeBR();

  return doBanco(
    (data ?? []).map((l) => ({
      id: l.id as string,
      descricao: l.descricao as string,
      categoria: (l.categoria as string) ?? null,
      valor: Number(l.valor ?? 0),
      vencimento: l.vencimento as string,
      pagoEm: (l.pago_em as string) ?? null,
      status: l.status as Despesa['status'],
      conta: (l.conta as unknown as { nome: string } | null)?.nome ?? null,
      diasAteVencer: Math.round(
        (Date.parse(`${l.vencimento}T00:00:00Z`) - Date.parse(`${hoje}T00:00:00Z`)) / 86400000,
      ),
    })),
  );
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
    .select('id, nome, empresa, email, telefone, estagio, origem, cobranca, servico, valor_fee_estimado, valor_verba_estimada, probabilidade, proximo_passo, proximo_passo_em, estagio_desde, motivo_perda, conta_id, criado_em, responsavel_id, perfil:responsavel_id(nome)')
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
      cobranca: (l.cobranca ?? 'mensal') as Cobranca,
      servico: l.servico ?? null,
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
        valorMensal: Number(f?.valor_mensal ?? 0),
        valorProjeto: Number(f?.valor_projeto ?? 0),
        ponderadoMensal: Number(f?.ponderado_mensal ?? 0),
        ponderadoProjeto: Number(f?.ponderado_projeto ?? 0),
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
      .select('*, perfil:responsavel_id(nome)')
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

  const c = rConta.data as Record<string, unknown>;
  const s = rSaude.data;

  return doBanco({
    id: c.id as string,
    nome: c.nome as string,
    tipo: ((c.tipo as TipoConta) ?? 'ecommerce'),
    perfilMetrica:
      ((c.perfil_metrica as ContaResumo['perfilMetrica']) ?? 'automatico'),
    kpisVisiveis: Array.isArray(c.kpis_visiveis) ? (c.kpis_visiveis as string[]) : null,
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
    .select('id, plano, fee_mensal, dia_vencimento, inicio, fim, asaas_assinatura_id')
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
      cobrancaAutomatica: Boolean(c.asaas_assinatura_id),
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
    .select('id, titulo, detalhe, status, prazo, prioridade, recorrencia, lembrar_dias, concluida_em, conta_id, responsavel_id, conta:conta_id(nome), perfil:responsavel_id(nome)')
    .order('prazo', { ascending: true, nullsFirst: false })
    .limit(300);

  if (faltamTabelas(error)) return semBanco(demo.tarefasDemo());

  const hoje = hojeBR();

  return doBanco(
    (data ?? []).map((t) => ({
      id: t.id as string,
      titulo: t.titulo as string,
      detalhe: (t.detalhe as string) ?? null,
      conta: (t.conta as unknown as { nome: string } | null)?.nome ?? null,
      contaId: (t.conta_id as string) ?? null,
      status: t.status as Tarefa['status'],
      responsavel: (t.perfil as unknown as { nome: string } | null)?.nome ?? null,
      responsavelId: (t.responsavel_id as string) ?? null,
      prazo: (t.prazo as string) ?? null,
      prioridade: (t.prioridade as Tarefa['prioridade']) ?? 'media',
      recorrencia: (t.recorrencia as Tarefa['recorrencia']) ?? 'nenhuma',
      lembrarDias: Number(t.lembrar_dias ?? 1),
      concluidaEm: (t.concluida_em as string) ?? null,
      /* Contado aqui, e não no render: saber que dia é hoje exige
         Date.now(), que é chamada impura durante a renderização. */
      diasAtePrazo: t.prazo
        ? Math.round(
            (Date.parse(`${t.prazo as string}T00:00:00Z`) - Date.parse(`${hoje}T00:00:00Z`)) /
              86400000,
          )
        : null,
    })),
  );
}

/**
 * A caixa de avisos de quem está logado.
 *
 * A view já filtra por `auth.uid()`, então não há `.eq()` aqui para
 * alguém esquecer. É a mesma disciplina do resto desta camada: quem
 * filtra é o banco.
 */
export async function minhasNotificacoes(
  limite = 30,
): Promise<Resposta<{ lista: Notificacao[]; naoLidas: number }>> {
  if (!bancoConfigurado) return semBanco({ lista: [], naoLidas: 0 });

  const supabase = await clienteServidor();

  const [rLista, rContagem] = await Promise.all([
    supabase.from('minhas_notificacoes').select('*').limit(limite),
    supabase
      .from('notificacao')
      .select('id', { count: 'exact', head: true })
      .is('lida_em', null),
  ]);

  if (faltamTabelas(rLista.error)) return semBanco({ lista: [], naoLidas: 0 });

  return doBanco({
    lista: (rLista.data ?? []).map((n) => ({
      id: Number(n.id),
      tipo: n.tipo as Notificacao['tipo'],
      titulo: n.titulo as string,
      corpo: (n.corpo as string) ?? null,
      link: (n.link as string) ?? null,
      lidaEm: (n.lida_em as string) ?? null,
      criadaEm: n.criada_em as string,
    })),
    naoLidas: rContagem.count ?? 0,
  });
}

export async function listarEquipe(): Promise<Resposta<PessoaEquipe[]>> {
  if (!bancoConfigurado) return semBanco(demo.equipeDemo());

  const supabase = await clienteServidor();

  /* As lojas vêm junto, pelo relacionamento. Uma consulta por pessoa
     seria N+1 numa tela que existe justamente para ver todo mundo de
     uma vez.

     O nome da chave estrangeira é OBRIGATÓRIO aqui. `acessos_conta`
     aponta para `perfil` duas vezes: `usuario_id`, que é quem tem o
     acesso, e `convidado_por`, que é quem concedeu. Sem dizer qual, o
     PostgREST recusa a consulta com PGRST201 em vez de escolher — e
     está certo, porque escolher errado listaria as lojas que a pessoa
     CONVIDOU alguém para ver, e não as que ela vê. */
  const { data, error } = await supabase
    .from('perfil')
    .select('id, nome, email, papel, ativo, acessos_conta!acessos_conta_usuario_id_fkey(conta:conta_id(id, nome))')
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

/**
 * A trilha de auditoria, em página.
 *
 * Cem registros de uma vez davam 27.711px de altura no celular, e essa
 * era a única rota do painel que estourava a largura da tela. Log não
 * se lê em rolagem infinita: se lê procurando uma alteração
 * específica, e para isso a página precisa caber.
 */
export async function listarAuditoria(
  limite = 20,
  pagina = 0,
): Promise<Resposta<RegistroAuditoria[]>> {
  if (!bancoConfigurado) return semBanco(demo.auditoriaDemo());

  const supabase = await clienteServidor();
  const { data, error } = await supabase
    .from('log_auditoria')
    .select('id, acao, tabela, registro_id, em, autor_papel, perfil:autor_id(nome)')
    .order('em', { ascending: false })
    .range(pagina * limite, pagina * limite + limite - 1);

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
    .select(
      'id, slug, cliente, contato, status, resumo, versao, corpo, emitida_em, validade_dias, perfil:criada_por(nome), lead:lead_id(email)',
    )
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
        servicos:
          ((p.corpo as { servicos?: { id: string; fee: number }[] })?.servicos) ?? [],
        resumo: (p.resumo as string) ?? '',
        versao: Number(p.versao ?? 1),
        diagnostico: ((p.corpo as { diagnostico?: string[] })?.diagnostico) ?? [],
        proximosPassos:
          ((p.corpo as { proximosPassos?: string[] })?.proximosPassos) ?? [],
        emitidaEm: emitida,
        validadeDias: Number(p.validade_dias ?? 15),
        /* Calculado AQUI, na camada de dados, e não no render: contar
           dias exige saber que dia é hoje, e Date.now() durante o render
           é chamada impura. */
        diasParaVencer: Math.round(
          (Date.parse(`${vence}T00:00:00Z`) - Date.parse(`${hoje}T00:00:00Z`)) / 86400000,
        ),
        autor: (p.perfil as unknown as { nome: string } | null)?.nome ?? null,
        emailDoLead:
          (p.lead as unknown as { email: string | null } | null)?.email ?? null,
      };
    }),
  );
}

/**
 * As conversas de todos os leads em jogo, de uma vez.
 *
 * Uma consulta por lead seria N+1 numa tela que mostra o funil inteiro:
 * quarenta cards abertos viram quarenta idas ao banco antes da primeira
 * pintura. Aqui vem tudo junto e o quadro reparte por lead.
 *
 * Devolve um objeto simples, e não um Map, porque atravessa a fronteira
 * servidor → cliente: o React serializa objeto, e Map vira `{}`.
 */
export async function interacoesDosLeads(): Promise<Resposta<Record<string, Interacao[]>>> {
  if (!bancoConfigurado) return semBanco({});

  const supabase = await clienteServidor();
  const { data, error } = await supabase
    .from('interacao')
    .select('id, tipo, resumo, criada_em, lead_id, perfil:autor_id(nome)')
    .not('lead_id', 'is', null)
    .order('criada_em', { ascending: false })
    .limit(400);

  if (faltamTabelas(error)) return semBanco({});

  const porLead: Record<string, Interacao[]> = {};
  for (const i of data ?? []) {
    const chave = i.lead_id as string;
    (porLead[chave] ??= []).push({
      id: i.id as string,
      tipo: i.tipo as string,
      resumo: i.resumo as string,
      autor: (i.perfil as unknown as { nome: string } | null)?.nome ?? null,
      em: i.criada_em as string,
    });
  }

  return doBanco(porLead);
}

/** Um lead pelo id, para pré-preencher a proposta a partir dele. */
export async function leadPorId(id: string): Promise<Lead | null> {
  if (!bancoConfigurado) return null;

  const { dados } = await listarLeads();
  return dados.find((l) => l.id === id) ?? null;
}

/* ------------------------------------------------------------------ */
/* Postagens                                                           */
/* ------------------------------------------------------------------ */

/**
 * As postagens de um mês, com os arquivos já assinados.
 *
 * ============================================================
 * UM MÊS POR VEZ, E AS SEM DATA SEMPRE
 * ============================================================
 * Calendário de conteúdo cresce para sempre, e carregar tudo faria a
 * tela ficar mais lenta a cada mês que passa. O recorte é o mês pedido.
 *
 * As SEM DATA vêm junto em qualquer mês, de propósito: são as ideias, e
 * ideia que só aparece no mês em que foi digitada é ideia perdida.
 *
 * ============================================================
 * OS ENDEREÇOS SÃO ASSINADOS EM UMA CHAMADA SÓ
 * ============================================================
 * O bucket é privado, então cada arquivo precisa de um endereço
 * assinado para a tela mostrar. Assinar um a um seria uma ida ao
 * Storage por imagem, e um carrossel tem dez.
 *
 * `createSignedUrls` recebe a lista inteira e devolve tudo de uma vez:
 * uma ida, independente de quantos arquivos o mês tiver.
 *
 * Uma hora de validade. O endereço não é guardado em lugar nenhum
 * justamente porque vence: guardar um vencido é guardar lixo que parece
 * link.
 */
export async function listarPostagens(mes: string): Promise<Resposta<Postagem[]>> {
  if (!bancoConfigurado) return semBanco([]);

  const supabase = await clienteServidor();

  /* O mês chega como "2026-10". Daqui sai o primeiro dia dele e o
     primeiro do seguinte, que é o jeito de pegar o mês inteiro sem
     depender de quantos dias ele tem. */
  const [ano, m] = mes.split('-').map(Number);
  const inicio = `${mes}-01`;
  const fim = m === 12 ? `${ano + 1}-01-01` : `${ano}-${String(m + 1).padStart(2, '0')}-01`;

  const { data, error } = await supabase
    .from('postagem')
    .select('id, perfil, formato, tema, legenda, data, hora, situacao, responsavel_id, observacoes, link, publicado_em, criado_em, perfil_responsavel:responsavel_id(nome), postagem_arquivo(id, nome, caminho, tipo, tamanho)')
    .or(`and(data.gte.${inicio},data.lt.${fim}),data.is.null`)
    .order('data', { ascending: true, nullsFirst: false })
    .order('hora', { ascending: true, nullsFirst: false })
    .limit(400);

  if (faltamTabelas(error)) return semBanco([]);

  const linhas = data ?? [];

  /* Todos os caminhos do mês, de uma vez. */
  const caminhos = linhas.flatMap((p) =>
    ((p.postagem_arquivo as unknown as { caminho: string }[]) ?? []).map((a) => a.caminho),
  );

  const assinados = new Map<string, string>();
  if (caminhos.length > 0) {
    const { data: urls } = await supabase.storage
      .from('midia')
      .createSignedUrls(caminhos, 3600);
    for (const u of urls ?? []) {
      if (u.path && u.signedUrl) assinados.set(u.path, u.signedUrl);
    }
  }

  return doBanco(
    linhas.map((p) => {
      const brutos = (p.postagem_arquivo as unknown as {
        id: string; nome: string; caminho: string; tipo: string | null; tamanho: number | null;
      }[]) ?? [];

      const arquivos: ArquivoDaPostagem[] = brutos.map((a) => ({
        id: a.id,
        nome: a.nome,
        caminho: a.caminho,
        tipo: a.tipo,
        tamanho: a.tamanho === null ? null : Number(a.tamanho),
        url: assinados.get(a.caminho) ?? null,
        imagem: (a.tipo ?? '').startsWith('image/'),
        video: (a.tipo ?? '').startsWith('video/'),
      }));

      return {
        id: p.id as string,
        perfil: p.perfil as PerfilSocial,
        formato: p.formato as FormatoPost,
        tema: p.tema as string,
        legenda: (p.legenda as string) ?? null,
        data: (p.data as string) ?? null,
        hora: (p.hora as string) ?? null,
        situacao: p.situacao as SituacaoPost,
        responsavel:
          (p.perfil_responsavel as unknown as { nome: string } | null)?.nome ?? null,
        responsavelId: (p.responsavel_id as string) ?? null,
        observacoes: (p.observacoes as string) ?? null,
        link: (p.link as string) ?? null,
        publicadoEm: (p.publicado_em as string) ?? null,
        arquivos,
        criadoEm: p.criado_em as string,
      };
    }),
  );
}

/* ------------------------------------------------------------------ */
/* Projetos                                                            */
/* ------------------------------------------------------------------ */

/**
 * Os projetos, do mais urgente para o menos.
 *
 * A ordem sai do BANCO, e não da tela: `situacao` primeiro, porque é o
 * que a pessoa veio ver, e `prazo` dentro dela. Ordenar no cliente faria
 * a primeira pintura mostrar uma ordem e a segunda outra.
 *
 * `nullsFirst: false` no prazo: projeto sem data combinada vai para o
 * fim. Sem isso o Postgres põe nulo primeiro em ordem crescente, e a
 * lista abriria justamente pelo que não tem compromisso de entrega.
 *
 * Os entregues vêm junto, e a tela filtra. São eles que respondem
 * "o que saiu este mês", e uma segunda consulta para isso seria uma ida
 * ao banco para dividir uma lista que já cabe inteira na memória.
 */
export async function listarProjetos(): Promise<Resposta<Projeto[]>> {
  if (!bancoConfigurado) return semBanco([]);

  const supabase = await clienteServidor();
  const { data, error } = await supabase
    .from('projeto')
    .select('id, nome, tipo, situacao, cliente, conta_id, responsavel_id, prazo, link, observacoes, entregue_em, situacao_desde, criado_em, conta:conta_id(nome), perfil:responsavel_id(nome)')
    .order('situacao', { ascending: true })
    .order('prazo', { ascending: true, nullsFirst: false })
    .limit(300);

  if (faltamTabelas(error)) return semBanco([]);

  const agora = Date.now();
  const hoje = new Date(hojeBR()).getTime();

  return doBanco(
    (data ?? []).map((p) => {
      const conta = p.conta as unknown as { nome: string } | null;
      const prazo = (p.prazo as string) ?? null;

      return {
        id: p.id as string,
        nome: p.nome as string,
        tipo: p.tipo as TipoProjeto,
        situacao: p.situacao as SituacaoProjeto,
        /* A conta MANDA sobre o texto livre. São duas fontes para o
           mesmo fato, e quem decide é a consulta, para não existirem
           duas verdades guardadas. */
        cliente: conta?.nome ?? ((p.cliente as string) || null),
        contaId: (p.conta_id as string) ?? null,
        responsavel: (p.perfil as unknown as { nome: string } | null)?.nome ?? null,
        responsavelId: (p.responsavel_id as string) ?? null,
        prazo,
        link: (p.link as string) ?? null,
        observacoes: (p.observacoes as string) ?? null,
        entregueEm: (p.entregue_em as string) ?? null,
        diasNaSituacao: Math.floor(
          (agora - new Date(p.situacao_desde as string).getTime()) / 86400000,
        ),
        /* Em dias de calendário, e não em milissegundos corridos: o que
           importa é se a data já passou, e não quantas horas faltam. */
        diasAteOPrazo:
          prazo === null ? null : Math.round((new Date(prazo).getTime() - hoje) / 86400000),
        criadoEm: p.criado_em as string,
      };
    }),
  );
}

/* ------------------------------------------------------------------ */
/* Prospecção ativa                                                    */
/* ------------------------------------------------------------------ */

/**
 * A lista de prospecção, com o estágio do lead junto.
 *
 * Um join, e não duas consultas: a tela mostra as duas coisas na mesma
 * linha, e separar daria uma lista de pesquisa que não sabe quem já foi
 * abordado — que é exatamente a pergunta que ela existe para responder.
 *
 * A ordem sai do banco: prioridade A primeiro, e dentro dela quem tem
 * mais seguidores. Ordenar na tela faria a primeira pintura mostrar uma
 * ordem e a segunda outra.
 *
 * `nullsFirst: false` nas duas: quem não tem prioridade nem contagem vai
 * para o fim. Sem isso o Postgres põe nulo primeiro em ordem
 * decrescente, e a lista abriria justamente pelo que menos importa.
 */
export async function listarProspeccao(): Promise<Resposta<Prospecto[]>> {
  if (!bancoConfigurado) return semBanco([]);

  const supabase = await clienteServidor();
  const { data, error } = await supabase
    .from('prospeccao')
    .select('id, lead_id, codigo, instagram, instagram_url, instagram_dono, cnpj, cidade, uf, regiao, segmento, modelo_venda, fabricacao_propria, situacao_site, seguidores, prioridade, oportunidade, gancho, mensagem_abertura, pergunta_seguinte, perguntas, canal, notas, lead:lead_id(nome, empresa, telefone, estagio, proximo_passo)')
    .order('prioridade', { ascending: true, nullsFirst: false })
    .order('seguidores', { ascending: false, nullsFirst: false })
    .limit(500);

  if (faltamTabelas(error)) return semBanco([]);

  return doBanco(
    (data ?? []).map((p) => {
      const l = p.lead as unknown as {
        nome: string;
        empresa: string | null;
        telefone: string | null;
        estagio: Estagio;
        proximo_passo: string | null;
      } | null;

      return {
        id: p.id as string,
        leadId: p.lead_id as string,
        codigo: (p.codigo as string) ?? null,
        instagram: (p.instagram as string) ?? null,
        instagramUrl: (p.instagram_url as string) ?? null,
        instagramDono: (p.instagram_dono as string) ?? null,
        cnpj: (p.cnpj as string) ?? null,
        cidade: (p.cidade as string) ?? null,
        uf: (p.uf as string) ?? null,
        regiao: (p.regiao as string) ?? null,
        segmento: (p.segmento as string) ?? null,
        modeloVenda: (p.modelo_venda as string) ?? null,
        fabricacaoPropria: (p.fabricacao_propria as string) ?? null,
        situacaoSite: (p.situacao_site as string) ?? null,
        seguidores: p.seguidores === null ? null : Number(p.seguidores),
        prioridade: (p.prioridade as PrioridadeProspeccao) ?? null,
        oportunidade: (p.oportunidade as string) ?? null,
        gancho: (p.gancho as string) ?? null,
        /*
          MONTADA, e não lida da coluna.

          `mensagem_abertura` continua no banco com a versão antiga, e
          de propósito: ela é o registro do que já foi enviado para
          quem já foi abordado, e apagar isso seria perder o histórico.
          O que a tela mostra para enviar HOJE é o texto de hoje, que
          vive em `montarAbordagem` e muda num deploy, sem migração.
        */
        /* O segmento entra para a credencial saber se pode citar o
           nicho: ela só cita quando é o mesmo da operação de R$ 16
           milhões. Ver `NICHO_PROVADO` em `abordagem.ts`. */
        mensagemAbertura: montarAbordagem(l?.empresa ?? null, (p.segmento as string) ?? null),
        perguntaSeguinte: (p.pergunta_seguinte as string) ?? null,
        perguntas: (p.perguntas as string) ?? null,
        canal: (p.canal as string) ?? null,
        notas: (p.notas as string) ?? null,
        empresa: l?.empresa ?? null,
        telefone: l?.telefone ?? null,
        nomeContato: l?.nome ?? '',
        estagio: l?.estagio ?? 'novo',
        proximoPasso: l?.proximo_passo ?? null,
        /* 'pronto' também aguarda: ele passou pelo filtro, e não pela
           caixa de entrada. Quem já foi abordado está em 'contato'. */
        aguardandoAbordagem: ['novo', 'pronto'].includes(l?.estagio ?? 'novo'),
      };
    }),
  );
}

/* ------------------------------------------------------------------ */
/* Cobrança                                                            */
/* ------------------------------------------------------------------ */

export async function listarFaturas(limite = 60): Promise<Resposta<FaturaResumo[]>> {
  if (!bancoConfigurado) return semBanco([]);

  const supabase = await clienteServidor();
  const { data, error } = await supabase
    .from('fatura')
    .select('id, numero, conta_id, contrato_id, status, valor, valor_liquido, descricao, parcelas, competencia, vencimento, paga_em, asaas_id, link_pagamento, pix_copia_cola, forma_pagamento, conta:conta_id(nome)')
    .order('vencimento', { ascending: false })
    .limit(limite);

  if (faltamTabelas(error)) return semBanco([]);

  const hoje = hojeBR();

  return doBanco(
    (data ?? []).map((f) => ({
      id: f.id as string,
      numero: f.numero as string,
      conta: (f.conta as unknown as { nome: string } | null)?.nome ?? null,
      contaId: f.conta_id as string,
      contratoId: (f.contrato_id as string) ?? null,
      status: f.status as FaturaResumo['status'],
      valor: Number(f.valor ?? 0),
      valorLiquido: f.valor_liquido === null || f.valor_liquido === undefined ? null : Number(f.valor_liquido),
      descricao: (f.descricao as string) ?? null,
      parcelas: Number(f.parcelas ?? 1),
      competencia: f.competencia as string,
      vencimento: f.vencimento as string,
      pagaEm: (f.paga_em as string) ?? null,
      asaasId: (f.asaas_id as string) ?? null,
      linkPagamento: (f.link_pagamento as string) ?? null,
      pixCopiaCola: (f.pix_copia_cola as string) ?? null,
      formaPagamento: (f.forma_pagamento as string) ?? null,
      /* Calculado na camada de dados, e não no render: contar dias
         exige saber que dia é hoje, e Date.now() durante o render é
         chamada impura. */
      diasAteVencer: Math.round(
        (Date.parse(`${f.vencimento}T00:00:00Z`) - Date.parse(`${hoje}T00:00:00Z`)) / 86400000,
      ),
    })),
  );
}

export async function listarContratos(): Promise<Resposta<ContratoAtivo[]>> {
  if (!bancoConfigurado) return semBanco([]);

  const supabase = await clienteServidor();
  const hoje = hojeBR();
  const mes = `${hoje.slice(0, 7)}-01`;

  const [rContratos, rFaturas] = await Promise.all([
    supabase
      .from('contrato')
      .select('id, conta_id, plano, fee_mensal, inicio, fim, dia_vencimento, asaas_assinatura_id, conta:conta_id(nome)')
      /* Vigentes E agendados. O reajuste abre um contrato que começa no
         mês que vem; filtrando por `inicio <= hoje` ele ficava invisível
         até virar o mês, e não havia como conferir nem desfazer.
         Contrato que já terminou sai daqui: o histórico dele vive nas
         faturas que ele emitiu. */
      .or(`fim.is.null,fim.gte.${hoje}`)
      .order('inicio', { ascending: false }),
    supabase.from('fatura').select('contrato_id').eq('competencia', mes),
  ]);

  if (faltamTabelas(rContratos.error)) return semBanco([]);

  const faturados = new Set((rFaturas.data ?? []).map((f) => f.contrato_id as string));

  return doBanco(
    (rContratos.data ?? []).map((c) => ({
      id: c.id as string,
      conta: (c.conta as unknown as { nome: string } | null)?.nome ?? null,
      contaId: c.conta_id as string,
      plano: c.plano as string,
      feeMensal: Number(c.fee_mensal ?? 0),
      inicio: c.inicio as string,
      fim: (c.fim as string) ?? null,
      diaVencimento: Number(c.dia_vencimento ?? 10),
      cobrancaAutomatica: Boolean(c.asaas_assinatura_id),
      futuro: (c.inicio as string) > hoje,
      faturadoNoMes: faturados.has(c.id as string),
    })),
  );
}


/* ------------------------------------------------------------------ */
/* Marcos no período, Contatos principais e Relatórios                */
/* ------------------------------------------------------------------ */

export async function marcosDaContaPeriodo(
  contaId: string,
  de: string,
  ate: string,
): Promise<Resposta<Marco[]>> {
  if (!bancoConfigurado) {
    return semBanco(demo.marcosDemo(contaId).filter((m) => m.dia >= de && m.dia <= ate));
  }

  const supabase = await clienteServidor();
  const { data, error } = await supabase
    .from('marco_conta')
    .select('id, dia, tipo, titulo, detalhe')
    .eq('conta_id', contaId)
    .gte('dia', de)
    .lte('dia', ate)
    .order('dia', { ascending: false })
    .limit(40);

  if (faltamTabelas(error)) return semBanco([]);

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

export async function contatosPrincipaisDasContas(): Promise<
  Record<string, { nome: string; email: string | null; whatsapp: string | null }>
> {
  if (!bancoConfigurado) return {};

  const supabase = await clienteServidor();
  const { data, error } = await supabase
    .from('contato')
    .select('conta_id, nome, email, whatsapp, telefone, principal')
    .order('principal', { ascending: false });

  if (error) return {};

  const mapa: Record<string, { nome: string; email: string | null; whatsapp: string | null }> = {};
  for (const c of data ?? []) {
    const contaId = c.conta_id as string;
    if (mapa[contaId]) continue;
    const fone = ((c.whatsapp as string) || (c.telefone as string) || '').trim() || null;
    mapa[contaId] = {
      nome: (c.nome as string) ?? '',
      email: ((c.email as string) || '').trim() || null,
      whatsapp: fone,
    };
  }
  return mapa;
}

const SNAPSHOT_VAZIO: SnapshotRelatorio = {
  geradoEm: '',
  cartoes: [],
  funil: { titulo: '', apoio: '', etapas: [], alerta: null },
  serie: [],
  campanhas: [],
  canais: [],
  marcos: [],
  investimentoTotal: 0,
};

function normalizarSnapshot(bruto: unknown): SnapshotRelatorio {
  if (!bruto || typeof bruto !== 'object') return SNAPSHOT_VAZIO;
  const s = bruto as Partial<SnapshotRelatorio>;
  return {
    geradoEm: typeof s.geradoEm === 'string' ? s.geradoEm : '',
    kpisVisiveis: Array.isArray(s.kpisVisiveis) ? s.kpisVisiveis : null,
    cartoes: Array.isArray(s.cartoes) ? s.cartoes : [],
    funil:
      s.funil && typeof s.funil === 'object'
        ? {
            titulo: s.funil.titulo ?? '',
            apoio: s.funil.apoio ?? '',
            etapas: Array.isArray(s.funil.etapas) ? s.funil.etapas : [],
            alerta: s.funil.alerta ?? null,
          }
        : SNAPSHOT_VAZIO.funil,
    serie: Array.isArray(s.serie) ? s.serie : [],
    campanhas: Array.isArray(s.campanhas) ? s.campanhas : [],
    canais: Array.isArray(s.canais) ? s.canais : [],
    marcos: Array.isArray(s.marcos) ? s.marcos : [],
    investimentoTotal: typeof s.investimentoTotal === 'number' ? s.investimentoTotal : 0,
  };
}

export async function listarRelatorios(contaId?: string): Promise<Resposta<RelatorioResumo[]>> {
  if (!bancoConfigurado) return semBanco([]);

  const [supabase, contatos] = await Promise.all([
    clienteServidor(),
    contatosPrincipaisDasContas(),
  ]);

  let consulta = supabase
    .from('relatorio')
    .select(
      'id, conta_id, slug, titulo, contato, periodo_de, periodo_ate, perfil_metrica, status, versao, resumo_executivo, acoes_executadas, proximos_passos, blocos_visiveis, resultado_comercial, snapshot, publicado_em, enviado_em, criado_em, conta:conta_id(nome, segmento), perfil:autor_id(nome)',
    )
    .order('criado_em', { ascending: false })
    .limit(80);

  if (contaId) consulta = consulta.eq('conta_id', contaId);

  const { data, error } = await consulta;
  if (error) return doBanco([]);

  return doBanco(
    (data ?? []).map((r) => {
      const conta = r.conta as unknown as { nome: string; segmento: string | null } | null;
      const cId = r.conta_id as string;
      const contatoPrincipal = contatos[cId];

      return {
        id: r.id as string,
        contaId: cId,
        cliente: conta?.nome ?? 'Cliente',
        segmento: conta?.segmento ?? null,
        slug: r.slug as string,
        titulo: r.titulo as string,
        contato: (r.contato as string) ?? contatoPrincipal?.nome ?? null,
        periodoDe: r.periodo_de as string,
        periodoAte: r.periodo_ate as string,
        perfilMetrica:
          ((r.perfil_metrica as RelatorioResumo['perfilMetrica']) ?? 'whatsapp'),
        status: (r.status as StatusRelatorio) ?? 'rascunho',
        versao: Number(r.versao ?? 1),
        resumoExecutivo: (r.resumo_executivo as string) ?? '',
        acoesExecutadas: Array.isArray(r.acoes_executadas)
          ? (r.acoes_executadas as string[])
          : [],
        proximosPassos: Array.isArray(r.proximos_passos)
          ? (r.proximos_passos as string[])
          : [],
        blocosVisiveis: Array.isArray(r.blocos_visiveis)
          ? (r.blocos_visiveis as BlocoRelatorio[])
          : ['kpis', 'funil', 'serie', 'campanhas', 'canais', 'marcos'],
        resultadoComercial:
          (r.resultado_comercial as ResultadoComercialRelatorio | null) ?? null,
        snapshot: normalizarSnapshot(r.snapshot),
        publicadoEm: (r.publicado_em as string) ?? null,
        enviadoEm: (r.enviado_em as string) ?? null,
        criadoEm: r.criado_em as string,
        autor: (r.perfil as unknown as { nome: string } | null)?.nome ?? null,
        emailContato: contatoPrincipal?.email ?? null,
        whatsappContato: contatoPrincipal?.whatsapp ?? null,
      };
    }),
  );
}

export async function buscarRelatorioPublico(slug: string) {
  if (!bancoConfigurado) return null;

  const supabase = await clienteServidor();
  const { data, error } = await supabase.rpc('relatorio_por_link', { p_slug: slug });
  if (error || !Array.isArray(data) || data.length === 0) return null;

  const r = data[0] as Record<string, unknown>;

  return {
    slug: r.slug as string,
    cliente: (r.cliente as string) ?? 'Cliente',
    segmento: (r.segmento as string) ?? null,
    titulo: (r.titulo as string) ?? 'Relatório de desempenho',
    contato: (r.contato as string) ?? null,
    periodoDe: r.periodo_de as string,
    periodoAte: r.periodo_ate as string,
    perfilMetrica: ((r.perfil_metrica as RelatorioResumo['perfilMetrica']) ?? 'whatsapp'),
    versao: Number(r.versao ?? 1),
    resumoExecutivo: (r.resumo_executivo as string) ?? '',
    acoesExecutadas: Array.isArray(r.acoes_executadas)
      ? (r.acoes_executadas as string[])
      : [],
    proximosPassos: Array.isArray(r.proximos_passos)
      ? (r.proximos_passos as string[])
      : [],
    blocosVisiveis: Array.isArray(r.blocos_visiveis)
      ? (r.blocos_visiveis as BlocoRelatorio[])
      : ['kpis', 'funil', 'serie', 'campanhas', 'canais', 'marcos'],
    resultadoComercial:
      (r.resultado_comercial as ResultadoComercialRelatorio | null) ?? null,
    snapshot: normalizarSnapshot(r.snapshot),
    publicadoEm: (r.publicado_em as string) ?? null,
    criadoEm: r.criado_em as string,
  };
}
