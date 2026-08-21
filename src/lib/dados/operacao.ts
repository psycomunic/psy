import 'server-only';
import { bancoConfigurado } from '@/lib/supabase/ambiente';
import { clienteServidor } from '@/lib/supabase/servidor';
import { hojeBR, somarDias } from '@/lib/datas';

/**
 * O estado da operação, para o painel inicial.
 *
 * ============================================================
 * POR QUE ISTO NÃO MORA EM consultas.ts
 * ============================================================
 * `consultas.ts` responde perguntas de UMA tela: a carteira, a ficha, o
 * funil. Aqui as perguntas atravessam tudo — "quanto da configuração
 * está pronta?", "o que aconteceu ontem?" — e cada uma toca cinco
 * tabelas. Misturar as duas coisas transformaria aquele arquivo num
 * depósito.
 *
 * ============================================================
 * CONTAGEM, E NÃO LINHA
 * ============================================================
 * Tudo aqui usa `head: true` com `count: 'exact'`: o Postgres conta e
 * não devolve linha nenhuma. Numa tela que faz oito perguntas de uma
 * vez, trazer as linhas para contar no JavaScript seria puxar a
 * carteira inteira para exibir o número 12.
 */

export type PassoConfiguracao = {
  id: string;
  titulo: string;
  descricao: string;
  pronto: boolean;
  href: string | null;
  /** Quando o passo não depende só da agência. */
  espera?: string;
};

export type ResumoOperacao = {
  passos: PassoConfiguracao[];
  prontos: number;
  total: number;
  /** Contagens que os cartões do topo usam. */
  lojas: number;
  lojasAtivas: number;
  leadsAbertos: number;
  propostasPublicadas: number;
  tarefasAbertas: number;
  pessoas: number;
  integracoesOk: number;
  integracoesComErro: number;
  diasSemDado: number | null;
};

const zero = (n: number | null | undefined) => Number(n ?? 0);

export async function resumoDaOperacao(): Promise<ResumoOperacao> {
  const vazio: ResumoOperacao = {
    passos: [],
    prontos: 0,
    total: 0,
    lojas: 0,
    lojasAtivas: 0,
    leadsAbertos: 0,
    propostasPublicadas: 0,
    tarefasAbertas: 0,
    pessoas: 0,
    integracoesOk: 0,
    integracoesComErro: 0,
    diasSemDado: null,
  };

  if (!bancoConfigurado) return vazio;

  const supabase = await clienteServidor();
  const contar = (tabela: string) =>
    supabase.from(tabela).select('id', { count: 'exact', head: true });

  const [
    rLojas,
    rAtivas,
    rLeads,
    rPropostas,
    rTarefas,
    rPessoas,
    rClientes,
    rIntegracoes,
    rMetrica,
  ] = await Promise.all([
    contar('conta'),
    supabase.from('conta').select('id', { count: 'exact', head: true }).eq('situacao', 'ativa'),
    supabase
      .from('lead')
      .select('id', { count: 'exact', head: true })
      .not('estagio', 'in', '("ganho","perdido")'),
    supabase
      .from('proposta')
      .select('id', { count: 'exact', head: true })
      .in('status', ['enviada', 'em_analise', 'aceita']),
    supabase
      .from('tarefa')
      .select('id', { count: 'exact', head: true })
      .in('status', ['aberta', 'fazendo']),
    contar('perfil'),
    supabase
      .from('perfil')
      .select('id', { count: 'exact', head: true })
      .in('papel', ['cliente', 'cliente_leitura']),
    supabase.from('integracao_status').select('id, estado'),
    supabase.from('frescor_conta').select('atraso_dias').order('atraso_dias').limit(1),
  ]);

  const integracoes = rIntegracoes.data ?? [];
  const integracoesOk = integracoes.filter((i) => i.estado === 'ok' || i.estado === 'atrasada').length;
  const integracoesComErro = integracoes.filter(
    (i) => i.estado === 'com_erro' || i.estado === 'sem_credencial',
  ).length;

  const lojas = zero(rLojas.count);
  const temMetrica = (rMetrica.data ?? []).some((f) => f.atraso_dias !== null);

  /*
    Os passos são o caminho real até o painel servir para alguma coisa,
    na ordem em que travam um ao outro: sem loja não há onde pendurar
    métrica, sem credencial da agência não há o que vincular, e sem
    vínculo a sincronização não tem o que buscar.

    O passo 3 avisa que depende de aprovação externa. Prazo que não
    depende da agência precisa estar escrito, ou vira cobrança injusta.
  */
  const passos: PassoConfiguracao[] = [
    {
      id: 'loja',
      titulo: 'Cadastrar a primeira loja',
      descricao:
        'É a unidade que isola um cliente do outro no banco. Métrica, contrato e tarefa penduram nela.',
      pronto: lojas > 0,
      href: '/painel/contas',
    },
    {
      id: 'credencial',
      titulo: 'Conectar a BM e o Google da agência',
      descricao:
        'Um acesso por provedor, da Psy Comunic. Nenhum cliente gera token, e é por isso que o vínculo depois é só o número da conta.',
      pronto: integracoes.length > 0 || integracoesOk > 0,
      href: '/painel/configuracoes',
      espera: 'A liberação da API do Google leva dias e não depende do código.',
    },
    {
      id: 'vinculo',
      titulo: 'Vincular a conta de anúncio da loja',
      descricao: 'Na ficha da loja, aba Origem dos dados. Entra só o identificador da conta.',
      pronto: integracoes.length > 0,
      href: '/painel/contas',
    },
    {
      id: 'metrica',
      titulo: 'Receber a primeira métrica',
      descricao:
        'Pela sincronização, pela planilha ou pela rota de ingestão. Sem dado, todo indicador é zero honesto.',
      pronto: temMetrica,
      href: '/painel/metricas',
    },
    {
      id: 'cliente',
      titulo: 'Dar acesso ao lojista',
      descricao:
        'Papel Cliente, preso à loja dele. Passa a enxergar os próprios números e mais nada.',
      pronto: zero(rClientes.count) > 0,
      href: '/painel/equipe',
    },
  ];

  const atraso = (rMetrica.data ?? [])[0]?.atraso_dias;

  return {
    passos,
    prontos: passos.filter((p) => p.pronto).length,
    total: passos.length,
    lojas,
    lojasAtivas: zero(rAtivas.count),
    leadsAbertos: zero(rLeads.count),
    propostasPublicadas: zero(rPropostas.count),
    tarefasAbertas: zero(rTarefas.count),
    pessoas: zero(rPessoas.count),
    integracoesOk,
    integracoesComErro,
    diasSemDado: atraso === null || atraso === undefined ? null : Number(atraso),
  };
}

/* ------------------------------------------------------------------ */
/* Linha do tempo                                                      */
/* ------------------------------------------------------------------ */

export type Evento = {
  chave: string;
  tipo: 'proposta' | 'sincronizacao' | 'interacao' | 'marco' | 'auditoria';
  titulo: string;
  detalhe: string | null;
  em: string;
  href: string | null;
};

/**
 * O que aconteceu ultimamente, de várias tabelas ao mesmo tempo.
 *
 * Junta no servidor, e não numa view: cada fonte tem coluna de data com
 * nome próprio e um `union` no Postgres exigiria manter cinco projeções
 * alinhadas para sempre. Aqui a lista é curta e o custo é uma consulta
 * por fonte, todas em paralelo.
 *
 * Cada consulta passa pelo RLS de propósito. Para um cliente, a linha
 * do tempo mostra apenas o que aconteceu na loja dele, sem nenhum
 * filtro escrito à mão.
 */
export async function atividadeRecente(limite = 12): Promise<Evento[]> {
  if (!bancoConfigurado) return [];

  const supabase = await clienteServidor();
  const desde = `${somarDias(hojeBR(), -45)}T00:00:00Z`;

  const [rProp, rSinc, rInter, rMarco] = await Promise.all([
    supabase
      .from('proposta')
      .select('id, slug, cliente, status, criada_em')
      .gte('criada_em', desde)
      .order('criada_em', { ascending: false })
      .limit(limite),
    supabase
      .from('sincronizacao')
      .select('id, provedor, status, linhas_gravadas, erro, comecou_em, conta:conta_id(nome)')
      .gte('comecou_em', desde)
      .order('comecou_em', { ascending: false })
      .limit(limite),
    supabase
      .from('interacao')
      .select('id, tipo, resumo, criada_em, conta:conta_id(nome)')
      .gte('criada_em', desde)
      .order('criada_em', { ascending: false })
      .limit(limite),
    supabase
      .from('marco_conta')
      .select('id, titulo, tipo, dia, conta:conta_id(nome)')
      .order('dia', { ascending: false })
      .limit(limite),
  ]);

  const nome = (v: unknown) => (v as { nome?: string } | null)?.nome ?? null;

  const eventos: Evento[] = [
    ...(rProp.data ?? []).map((p) => ({
      chave: `prop-${p.id}`,
      tipo: 'proposta' as const,
      titulo: `Proposta para ${p.cliente}`,
      detalhe: `status ${p.status}`,
      em: p.criada_em as string,
      href: '/painel/propostas',
    })),
    ...(rSinc.data ?? []).map((s) => ({
      chave: `sinc-${s.id}`,
      tipo: 'sincronizacao' as const,
      titulo:
        s.status === 'sucesso'
          ? `${s.provedor}: ${s.linhas_gravadas} linha(s) gravadas`
          : `${s.provedor} falhou`,
      detalhe: s.status === 'sucesso' ? nome(s.conta) : (s.erro as string)?.slice(0, 90) ?? null,
      em: s.comecou_em as string,
      href: '/painel/contas',
    })),
    ...(rInter.data ?? []).map((i) => ({
      chave: `int-${i.id}`,
      tipo: 'interacao' as const,
      titulo: `${i.tipo}: ${(i.resumo as string).slice(0, 60)}`,
      detalhe: nome(i.conta),
      em: i.criada_em as string,
      href: '/painel/contas',
    })),
    ...(rMarco.data ?? []).map((m) => ({
      chave: `marco-${m.id}`,
      tipo: 'marco' as const,
      titulo: m.titulo as string,
      detalhe: nome(m.conta),
      /* `marco_conta` guarda DIA, e não instante. Meia-noite para a
         ordenação não empatar com evento do mesmo dia que tem hora. */
      em: `${m.dia}T00:00:00Z`,
      href: '/painel/contas',
    })),
  ];

  return eventos
    .sort((a, b) => b.em.localeCompare(a.em))
    .slice(0, limite);
}
