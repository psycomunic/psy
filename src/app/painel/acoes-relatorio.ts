'use server';

import { randomBytes } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { sessaoAtual, clienteServidor } from '@/lib/supabase/servidor';
import { pode } from '@/lib/papeis';
import { paraNumero } from '@/lib/numero';
import { dinheiro } from '@/lib/formato';
import { somarDias } from '@/lib/datas';
import {
  listarContas,
  serieDaContaPeriodo,
  canaisDaContaPeriodo,
  campanhasDaContaPeriodo,
  marcosDaContaPeriodo,
  contatosPrincipaisDasContas,
} from '@/lib/dados/consultas';
import {
  BLOCOS_RELATORIO,
  type BlocoRelatorio,
  type ResultadoComercialRelatorio,
  type SnapshotRelatorio,
} from '@/lib/dados/tipos';
import {
  PERFIS_METRICA,
  resolverPerfil,
  agregarPeriodo,
  montarCartoesKpi,
  montarFunil,
  type PerfilMetrica,
  type PerfilMetricaEfetivo,
} from '@/lib/dominio/perfis-metrica';
import { enviarEmail, pareceEmail } from '@/lib/email/remetente';
import { relatorioPronto } from '@/lib/email/modelos';
import { criativosDaContaPeriodo } from '@/lib/ingestao/criativos';
import type { Resultado } from './acoes';

/**
 * Gerador e curadoria de relatórios de desempenho.
 *
 * Usa `clienteServidor()` respeitando as políticas RLS de `relatorio`:
 * administrador, gestor e operador criam e editam; só administrador exclui.
 */

async function exigirEditorRelatorio() {
  const sessao = await sessaoAtual();
  if (!sessao) throw new Error('Sessão expirada. Entre de novo.');
  if (!pode(sessao.papel, 'relatorios', 'editar')) {
    throw new Error('Seu perfil não gera nem edita relatórios.');
  }
  return sessao;
}

function gerarSlugRelatorio(cliente: string, periodoAte: string) {
  const base = cliente
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 24);
  const mesAno = periodoAte.slice(0, 7);
  return `${base || 'relatorio'}-${mesAno}-${randomBytes(14).toString('base64url')}`;
}

const linhasTexto = (v: FormDataEntryValue | null) =>
  String(v ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

const DATA_ISO = /^\d{4}-\d{2}-\d{2}$/;

function formatarIntervaloCurto(de: string, ate: string) {
  const f = (iso: string) => iso.split('-').reverse().join('/');
  return de === ate ? f(de) : `${f(de)} a ${f(ate)}`;
}

async function construirSnapshot({
  contaId,
  de,
  ate,
  perfil,
  kpisVisiveis,
}: {
  contaId: string;
  de: string;
  ate: string;
  perfil: PerfilMetricaEfetivo;
  kpisVisiveis?: string[] | null;
}): Promise<SnapshotRelatorio> {
  const dias = Math.max(
    1,
    Math.round((Date.parse(`${ate}T00:00:00Z`) - Date.parse(`${de}T00:00:00Z`)) / 86400000) + 1,
  );
  const anteriorAte = somarDias(de, -1);
  const anteriorDe = somarDias(anteriorAte, -(dias - 1));

  const [
    { dados: serieDupla },
    { dados: canais },
    { dados: campanhas },
    { dados: marcos },
    criativos,
  ] = await Promise.all([
    serieDaContaPeriodo(contaId, anteriorDe, ate),
    canaisDaContaPeriodo(contaId, de, ate),
    campanhasDaContaPeriodo(contaId, de, ate),
    marcosDaContaPeriodo(contaId, de, ate),
    criativosDaContaPeriodo(contaId, de, ate),
  ]);

  const serieAtual = serieDupla.filter((d) => d.dia >= de && d.dia <= ate);
  const serieAnterior = serieDupla.filter((d) => d.dia >= anteriorDe && d.dia <= anteriorAte);

  const atual = agregarPeriodo(serieAtual);
  const anterior = agregarPeriodo(serieAnterior);

  return {
    geradoEm: new Date().toISOString(),
    kpisVisiveis: kpisVisiveis ?? null,
    cartoes: montarCartoesKpi({
      perfil,
      kpisVisiveis,
      atual,
      anterior,
    }),
    funil: montarFunil(perfil, atual),
    serie: serieAtual,
    campanhas,
    criativos,
    canais,
    marcos,
    investimentoTotal: atual.investimento,
  };
}

function lerBlocos(fd: FormData, temComercial: boolean): BlocoRelatorio[] {
  const escolhidos: BlocoRelatorio[] = [];
  for (const b of BLOCOS_RELATORIO) {
    if (fd.get(`bloco_${b}`) === 'on') escolhidos.push(b);
  }
  if (temComercial && !escolhidos.includes('comercial')) {
    escolhidos.push('comercial');
  }
  return escolhidos.length > 0 ? escolhidos : ['kpis', 'funil', 'serie', 'campanhas'];
}

function lerResultadoComercial(fd: FormData): ResultadoComercialRelatorio | null {
  const vendasBruto = String(fd.get('vendas_fechadas') ?? '').trim();
  const receitaBruto = String(fd.get('receita_fechada') ?? '').trim();
  const rotuloVenda = String(fd.get('rotulo_venda') ?? '').trim() || null;
  const observacao = String(fd.get('obs_comercial') ?? '').trim() || null;

  const vendas = vendasBruto ? Math.round(paraNumero(vendasBruto)) : null;
  const receita = receitaBruto ? paraNumero(receitaBruto) : null;

  const vendasOk = vendas !== null && Number.isFinite(vendas) && vendas > 0 ? vendas : null;
  const receitaOk = receita !== null && Number.isFinite(receita) && receita > 0 ? receita : null;

  if (vendasOk === null && receitaOk === null && !observacao) return null;

  return {
    vendasFechadas: vendasOk,
    receitaFechada: receitaOk,
    rotuloVenda,
    observacao,
  };
}

/**
 * Quando o cliente não é e-commerce puro (ex.: chalé/pousada com perfil WhatsApp)
 * mas tem reservas e receitas sincronizadas automaticamente (ex.: Hospedi),
 * preenche o retorno comercial sozinho caso o operador não tenha digitado outro valor.
 */
function resultadoComercialAutomatico(
  perfil: PerfilMetricaEfetivo,
  snapshot: SnapshotRelatorio,
): ResultadoComercialRelatorio | null {
  if (perfil === 'ecommerce') return null;

  const resumo = agregarPeriodo(snapshot.serie);
  if (resumo.pedidosAprovados <= 0 && resumo.receita <= 0) return null;

  const direto = snapshot.canais.find((c) => c.canal === 'hospedi_direto');
  const ota = snapshot.canais.find((c) => c.canal === 'hospedi_ota');
  const hospedi = snapshot.canais.find((c) => c.canal === 'hospedi');
  const temHospedi = Boolean(direto || ota || hospedi);

  let observacao: string | null = null;
  if (temHospedi) {
    const partes: string[] = [];
    if (direto && direto.receita > 0) {
      partes.push(`Reservas diretas: ${dinheiro(direto.receita)}`);
    }
    if (ota && ota.receita > 0) {
      partes.push(`Airbnb / Booking: ${dinheiro(ota.receita)}`);
    }
    observacao =
      partes.length > 0
        ? `Dados sincronizados automaticamente da Hospedi (${partes.join(' · ')}).`
        : 'Dados sincronizados automaticamente do painel da Hospedi.';
  }

  return {
    vendasFechadas: resumo.pedidosAprovados > 0 ? resumo.pedidosAprovados : null,
    receitaFechada: resumo.receita > 0 ? resumo.receita : null,
    rotuloVenda: temHospedi ? 'Reservas confirmadas (Hospedi)' : 'Vendas / Reservas confirmadas',
    observacao,
  };
}

export async function gerarRelatorio(
  _anterior: Resultado | null,
  fd: FormData,
): Promise<Resultado> {
  try {
    const sessao = await exigirEditorRelatorio();

    const contaId = String(fd.get('conta_id') ?? '').trim();
    const periodoDe = String(fd.get('periodo_de') ?? '').trim();
    const periodoAte = String(fd.get('periodo_ate') ?? '').trim();
    const tituloInformado = String(fd.get('titulo') ?? '').trim();
    const contatoInformado = String(fd.get('contato') ?? '').trim();
    const perfilEscolhido = String(fd.get('perfil_metrica') ?? 'automatico') as PerfilMetrica;
    const resumoExecutivo = String(fd.get('resumo_executivo') ?? '').trim();
    const publicarDireto = fd.get('publicar_direto') === 'on';

    if (!contaId) return { ok: false, mensagem: 'Escolha o cliente.' };
    if (!DATA_ISO.test(periodoDe) || !DATA_ISO.test(periodoAte) || periodoDe > periodoAte) {
      return { ok: false, mensagem: 'Informe um período válido (a data final não pode vir antes da inicial).' };
    }
    if (!PERFIS_METRICA.includes(perfilEscolhido)) {
      return { ok: false, mensagem: 'Modelo de métricas inválido.' };
    }

    const [{ dados: contas }, contatos] = await Promise.all([
      listarContas(),
      contatosPrincipaisDasContas(),
    ]);
    const conta = contas.find((c) => c.id === contaId);
    if (!conta) return { ok: false, mensagem: 'Cliente não encontrado.' };

    const perfilEfetivo = resolverPerfil(
      perfilEscolhido === 'automatico' ? conta.perfilMetrica : perfilEscolhido,
      conta.tipo,
    );

    const snapshot = await construirSnapshot({
      contaId,
      de: periodoDe,
      ate: periodoAte,
      perfil: perfilEfetivo,
      kpisVisiveis: conta.kpisVisiveis,
    });

    const acoesDigitadas = linhasTexto(fd.get('acoes_executadas'));
    const acoesExecutadas =
      acoesDigitadas.length > 0
        ? acoesDigitadas
        : snapshot.marcos.map((m) => (m.detalhe ? `${m.titulo}: ${m.detalhe}` : m.titulo));

    const proximosPassos = linhasTexto(fd.get('proximos_passos'));
    const resultadoComercial =
      lerResultadoComercial(fd) ?? resultadoComercialAutomatico(perfilEfetivo, snapshot);
    const blocosVisiveis = lerBlocos(fd, resultadoComercial !== null);

    const intervalo = formatarIntervaloCurto(periodoDe, periodoAte);
    const titulo = tituloInformado || `Relatório de desempenho · ${intervalo}`;
    const contato = contatoInformado || contatos[contaId]?.nome || null;

    const resumoFinal =
      resumoExecutivo ||
      `Acompanhamento consolidado das campanhas e resultados de ${conta.nome} no período de ${intervalo}.`;

    const supabase = await clienteServidor();
    const status = publicarDireto ? 'publicado' : 'rascunho';

    const { data, error } = await supabase
      .from('relatorio')
      .insert({
        conta_id: contaId,
        slug: gerarSlugRelatorio(conta.nome, periodoAte),
        titulo,
        contato,
        periodo_de: periodoDe,
        periodo_ate: periodoAte,
        perfil_metrica: perfilEfetivo,
        status,
        resumo_executivo: resumoFinal,
        acoes_executadas: acoesExecutadas,
        proximos_passos: proximosPassos,
        blocos_visiveis: blocosVisiveis,
        resultado_comercial: resultadoComercial,
        snapshot,
        publicado_em: publicarDireto ? new Date().toISOString() : null,
        autor_id: sessao.id,
      })
      .select('slug')
      .single();

    if (error) {
      if (/relation .*relatorio.* does not exist|Could not find the table/i.test(error.message)) {
        return {
          ok: false,
          mensagem: 'Aplique a migração 0051_relatorios.sql no Supabase antes de gravar relatórios.',
        };
      }
      return { ok: false, mensagem: error.message };
    }

    revalidatePath('/painel/relatorios');

    return {
      ok: true,
      mensagem: publicarDireto
        ? `Relatório publicado e pronto para envio: /relatorio/${data.slug}`
        : `Rascunho gerado para ${conta.nome}. Confira na lista abaixo e publique quando quiser liberar o link.`,
    };
  } catch (e) {
    return { ok: false, mensagem: (e as Error).message };
  }
}

export async function gerarRelatoriosEmLote(
  _anterior: Resultado | null,
  fd: FormData,
): Promise<Resultado> {
  try {
    const sessao = await exigirEditorRelatorio();

    const idsBrutos = fd.getAll('contas_lote').map((v) => String(v).trim()).filter(Boolean);
    const periodoDe = String(fd.get('periodo_de') ?? '').trim();
    const periodoAte = String(fd.get('periodo_ate') ?? '').trim();
    const publicarDireto = fd.get('publicar_direto') === 'on';

    if (idsBrutos.length === 0) {
      return { ok: false, mensagem: 'Marque pelo menos um cliente para gerar em lote.' };
    }
    if (!DATA_ISO.test(periodoDe) || !DATA_ISO.test(periodoAte) || periodoDe > periodoAte) {
      return { ok: false, mensagem: 'Informe um período válido para o lote.' };
    }

    const [{ dados: contas }, contatos, supabase] = await Promise.all([
      listarContas(),
      contatosPrincipaisDasContas(),
      clienteServidor(),
    ]);

    const intervalo = formatarIntervaloCurto(periodoDe, periodoAte);
    const selecionadas = contas.filter((c) => idsBrutos.includes(c.id));

    if (selecionadas.length === 0) {
      return { ok: false, mensagem: 'Nenhum cliente válido selecionado.' };
    }

    let criados = 0;
    for (const conta of selecionadas) {
      const perfilEfetivo = resolverPerfil(conta.perfilMetrica, conta.tipo);
      const snapshot = await construirSnapshot({
        contaId: conta.id,
        de: periodoDe,
        ate: periodoAte,
        perfil: perfilEfetivo,
        kpisVisiveis: conta.kpisVisiveis,
      });

      const acoesExecutadas = snapshot.marcos.map((m) =>
        m.detalhe ? `${m.titulo}: ${m.detalhe}` : m.titulo,
      );
      const comercialAuto = resultadoComercialAutomatico(perfilEfetivo, snapshot);
      const blocosLote: BlocoRelatorio[] = comercialAuto
        ? ['kpis', 'comercial', 'funil', 'serie', 'criativos', 'campanhas', 'canais', 'marcos']
        : ['kpis', 'funil', 'serie', 'criativos', 'campanhas', 'canais', 'marcos'];

      const { error } = await supabase.from('relatorio').insert({
        conta_id: conta.id,
        slug: gerarSlugRelatorio(conta.nome, periodoAte),
        titulo: `Relatório de desempenho · ${intervalo}`,
        contato: contatos[conta.id]?.nome || null,
        periodo_de: periodoDe,
        periodo_ate: periodoAte,
        perfil_metrica: perfilEfetivo,
        status: publicarDireto ? 'publicado' : 'rascunho',
        resumo_executivo: `Consolidado dos indicadores e campanhas de ${conta.nome} no período de ${intervalo}.`,
        acoes_executadas: acoesExecutadas,
        proximos_passos: [],
        blocos_visiveis: blocosLote,
        resultado_comercial: comercialAuto,
        snapshot,
        publicado_em: publicarDireto ? new Date().toISOString() : null,
        autor_id: sessao.id,
      });

      if (error) {
        if (/relation .*relatorio.* does not exist|Could not find the table/i.test(error.message)) {
          return {
            ok: false,
            mensagem: 'Aplique a migração 0051_relatorios.sql no Supabase antes de gerar relatórios.',
          };
        }
        return { ok: false, mensagem: `Falha ao gerar para ${conta.nome}: ${error.message}` };
      }
      criados++;
    }

    revalidatePath('/painel/relatorios');

    return {
      ok: true,
      mensagem: `${criados} ${criados === 1 ? 'relatório gerado' : 'relatórios gerados'} (${publicarDireto ? 'já publicados' : 'em rascunho para revisão'}).`,
    };
  } catch (e) {
    return { ok: false, mensagem: (e as Error).message };
  }
}

export async function editarRelatorio(
  _anterior: Resultado | null,
  fd: FormData,
): Promise<Resultado> {
  try {
    await exigirEditorRelatorio();

    const id = String(fd.get('id') ?? '').trim();
    if (!id) return { ok: false, mensagem: 'Relatório não informado.' };

    const titulo = String(fd.get('titulo') ?? '').trim();
    const contato = String(fd.get('contato') ?? '').trim() || null;
    const periodoDe = String(fd.get('periodo_de') ?? '').trim();
    const periodoAte = String(fd.get('periodo_ate') ?? '').trim();
    const perfilEscolhido = String(fd.get('perfil_metrica') ?? 'whatsapp') as PerfilMetrica;
    const resumoExecutivo = String(fd.get('resumo_executivo') ?? '').trim();
    const recalcular = fd.get('recalcular_snapshot') === 'on';

    if (titulo.length < 3) return { ok: false, mensagem: 'Informe o título do relatório.' };
    if (!DATA_ISO.test(periodoDe) || !DATA_ISO.test(periodoAte) || periodoDe > periodoAte) {
      return { ok: false, mensagem: 'Período inválido.' };
    }

    const supabase = await clienteServidor();
    const { data: atual } = await supabase
      .from('relatorio')
      .select('id, conta_id, slug, versao, periodo_de, periodo_ate, perfil_metrica, snapshot')
      .eq('id', id)
      .maybeSingle();

    if (!atual) return { ok: false, mensagem: 'Relatório não encontrado.' };

    const { dados: contas } = await listarContas();
    const conta = contas.find((c) => c.id === (atual.conta_id as string));
    const perfilEfetivo = resolverPerfil(
      perfilEscolhido,
      conta?.tipo ?? 'trafego',
    );

    const mudouJanelaOuPerfil =
      periodoDe !== (atual.periodo_de as string) ||
      periodoAte !== (atual.periodo_ate as string) ||
      perfilEfetivo !== (atual.perfil_metrica as string);

    const snapshot =
      recalcular || mudouJanelaOuPerfil
        ? await construirSnapshot({
            contaId: atual.conta_id as string,
            de: periodoDe,
            ate: periodoAte,
            perfil: perfilEfetivo,
            kpisVisiveis: conta?.kpisVisiveis,
          })
        : atual.snapshot;

    const resultadoComercial = lerResultadoComercial(fd);
    const blocosVisiveis = lerBlocos(fd, resultadoComercial !== null);

    const { error } = await supabase
      .from('relatorio')
      .update({
        titulo,
        contato,
        periodo_de: periodoDe,
        periodo_ate: periodoAte,
        perfil_metrica: perfilEfetivo,
        versao: Number(atual.versao ?? 1) + 1,
        resumo_executivo: resumoExecutivo,
        acoes_executadas: linhasTexto(fd.get('acoes_executadas')),
        proximos_passos: linhasTexto(fd.get('proximos_passos')),
        blocos_visiveis: blocosVisiveis,
        resultado_comercial: resultadoComercial,
        snapshot,
      })
      .eq('id', id);

    if (error) return { ok: false, mensagem: error.message };

    revalidatePath('/painel/relatorios');
    revalidatePath(`/relatorio/${atual.slug as string}`);

    return { ok: true, mensagem: 'Relatório atualizado.' };
  } catch (e) {
    return { ok: false, mensagem: (e as Error).message };
  }
}

export async function atualizarNumerosRelatorio(
  _anterior: Resultado | null,
  fd: FormData,
): Promise<Resultado> {
  try {
    await exigirEditorRelatorio();

    const id = String(fd.get('id') ?? '').trim();
    if (!id) return { ok: false, mensagem: 'Relatório não informado.' };

    const supabase = await clienteServidor();
    const { data: atual } = await supabase
      .from('relatorio')
      .select('id, conta_id, slug, versao, periodo_de, periodo_ate, perfil_metrica, resultado_comercial, blocos_visiveis')
      .eq('id', id)
      .maybeSingle();

    if (!atual) return { ok: false, mensagem: 'Relatório não encontrado.' };

    const { dados: contas } = await listarContas();
    const conta = contas.find((c) => c.id === (atual.conta_id as string));
    const perfilRelatorio = ((atual.perfil_metrica as PerfilMetricaEfetivo) ?? 'whatsapp');

    const snapshot = await construirSnapshot({
      contaId: atual.conta_id as string,
      de: atual.periodo_de as string,
      ate: atual.periodo_ate as string,
      perfil: perfilRelatorio,
      kpisVisiveis: conta?.kpisVisiveis,
    });

    const comExistente = atual.resultado_comercial as ResultadoComercialRelatorio | null;
    const ehAutoHospedi =
      !comExistente ||
      (comExistente.observacao?.includes('sincronizados automaticamente') ?? false);
    const comercialAtualizado = ehAutoHospedi
      ? resultadoComercialAutomatico(perfilRelatorio, snapshot) ?? comExistente
      : comExistente;

    const blocosAtuais = Array.isArray(atual.blocos_visiveis)
      ? ([...(atual.blocos_visiveis as BlocoRelatorio[])])
      : (['kpis', 'funil', 'serie', 'campanhas'] as BlocoRelatorio[]);
    if (comercialAtualizado && !blocosAtuais.includes('comercial')) {
      blocosAtuais.push('comercial');
    }

    const { error } = await supabase
      .from('relatorio')
      .update({
        snapshot,
        resultado_comercial: comercialAtualizado,
        blocos_visiveis: blocosAtuais,
        versao: Number(atual.versao ?? 1) + 1,
      })
      .eq('id', id);

    if (error) return { ok: false, mensagem: error.message };

    revalidatePath('/painel/relatorios');
    revalidatePath(`/relatorio/${atual.slug as string}`);

    return { ok: true, mensagem: 'Indicadores recalculados a partir da última sincronização.' };
  } catch (e) {
    return { ok: false, mensagem: (e as Error).message };
  }
}

export async function mudarStatusRelatorio(
  _anterior: Resultado | null,
  fd: FormData,
): Promise<Resultado> {
  try {
    await exigirEditorRelatorio();

    const id = String(fd.get('id') ?? '').trim();
    const status = String(fd.get('status') ?? '').trim();

    if (!id) return { ok: false, mensagem: 'Relatório não informado.' };
    if (!['rascunho', 'publicado', 'arquivado'].includes(status)) {
      return { ok: false, mensagem: 'Status inválido.' };
    }

    const supabase = await clienteServidor();
    const { data: atual, error } = await supabase
      .from('relatorio')
      .update({
        status,
        ...(status === 'publicado' ? { publicado_em: new Date().toISOString() } : {}),
      })
      .eq('id', id)
      .select('slug')
      .single();

    if (error) return { ok: false, mensagem: error.message };

    revalidatePath('/painel/relatorios');
    if (atual?.slug) revalidatePath(`/relatorio/${atual.slug as string}`);

    return {
      ok: true,
      mensagem:
        status === 'publicado'
          ? 'Publicado. O link já abre para o cliente.'
          : status === 'rascunho'
            ? 'Recolhido para rascunho. O link externo parou de abrir.'
            : 'Relatório arquivado.',
    };
  } catch (e) {
    return { ok: false, mensagem: (e as Error).message };
  }
}

export async function apagarRelatorio(
  _anterior: Resultado | null,
  fd: FormData,
): Promise<Resultado> {
  try {
    const sessao = await exigirEditorRelatorio();
    if (sessao.papel !== 'administrador') {
      return { ok: false, mensagem: 'Só o administrador exclui relatórios.' };
    }

    const id = String(fd.get('id') ?? '').trim();
    if (!id) return { ok: false, mensagem: 'Relatório não informado.' };

    const supabase = await clienteServidor();
    const { error } = await supabase.from('relatorio').delete().eq('id', id);
    if (error) return { ok: false, mensagem: error.message };

    revalidatePath('/painel/relatorios');
    return { ok: true, mensagem: 'Relatório removido.' };
  } catch (e) {
    return { ok: false, mensagem: (e as Error).message };
  }
}

export async function enviarRelatorioPorEmail(
  _anterior: Resultado | null,
  fd: FormData,
): Promise<Resultado> {
  try {
    await exigirEditorRelatorio();

    const id = String(fd.get('id') ?? '').trim();
    const destino = String(fd.get('email') ?? '').trim().toLowerCase();

    if (!id) return { ok: false, mensagem: 'Relatório não informado.' };
    if (!pareceEmail(destino)) return { ok: false, mensagem: 'Confira o e-mail do destinatário.' };

    const supabase = await clienteServidor();
    const { data: r } = await supabase
      .from('relatorio')
      .select('id, slug, contato, periodo_de, periodo_ate, resumo_executivo, status, versao, conta:conta_id(nome)')
      .eq('id', id)
      .maybeSingle();

    if (!r) return { ok: false, mensagem: 'Relatório não encontrado.' };

    if (r.status !== 'publicado') {
      return {
        ok: false,
        mensagem: 'Publique o relatório primeiro. Enquanto estiver em rascunho o link não abre para o cliente.',
      };
    }

    const clienteNome =
      (r.conta as unknown as { nome: string } | null)?.nome ?? 'Cliente';
    const periodo = formatarIntervaloCurto(r.periodo_de as string, r.periodo_ate as string);

    const envio = await enviarEmail({
      tipo: 'relatorio_enviado',
      chave: `${id}:v${r.versao}:${destino}`,
      para: destino,
      ...relatorioPronto({
        cliente: clienteNome,
        contato: (r.contato as string) || clienteNome,
        periodo,
        resumo: (r.resumo_executivo as string) ?? '',
        slug: r.slug as string,
        versao: Number(r.versao ?? 1),
      }),
    });

    if (!envio.ok) {
      return { ok: false, mensagem: `O e-mail não saiu: ${envio.erro}` };
    }

    if (envio.repetido) {
      return {
        ok: true,
        mensagem: `Esta versão já foi enviada para ${destino}. Atualize ou edite o relatório para reenviar.`,
      };
    }

    await supabase
      .from('relatorio')
      .update({ enviado_em: new Date().toISOString() })
      .eq('id', id);

    revalidatePath('/painel/relatorios');
    return { ok: true, mensagem: `Relatório enviado para ${destino}.` };
  } catch (e) {
    return { ok: false, mensagem: (e as Error).message };
  }
}
