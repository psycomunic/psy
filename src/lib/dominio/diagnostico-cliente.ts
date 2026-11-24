import type {
  ContaFicha,
  ContaResumo,
  Frescor,
  IntegracaoStatus,
  MetaMesConta,
  Projeto,
  RelatorioResumo,
  SaldoContaMidia,
  Tarefa,
} from '../dados/tipos.ts';
import {
  dinheiro,
  dinheiroExato,
  numero,
  porcento,
} from '../formato.ts';
import {
  resolverPerfil,
  type PerfilMetricaEfetivo,
  type ResumoAgregado,
} from './perfis-metrica.ts';

export type NivelPendencia = 'urgente' | 'atencao' | 'sugestao';

export type PendenciaOperacional = {
  id: string;
  nivel: NivelPendencia;
  categoria:
    | 'saldo'
    | 'tarefa'
    | 'projeto'
    | 'meta'
    | 'campanha'
    | 'dados'
    | 'relatorio'
    | 'financeiro'
    | 'relacionamento';
  titulo: string;
  detalhe: string;
  acaoRotulo?: string;
  acaoHref?: string;
};

export type IndicadorMetaMes = {
  definida: boolean;
  rotulo: string;
  atualTexto: string;
  metaTexto: string;
  percentual: number | null;
  status: 'acima' | 'no_ritmo' | 'atencao' | 'abaixo' | 'nao_definida';
  apoio: string;
};

export type AvaliacaoMetasCliente = {
  temAlgumaMeta: boolean;
  diaDoMes: number;
  diasNoMes: number;
  diasRestantesMes: number;
  ritmoEsperadoPct: number;
  principal: IndicadorMetaMes;
  verba: IndicadorMetaMes;
  custoTeto: IndicadorMetaMes;
};

function calendarioDoMes(hojeIso: string) {
  const [ano, mes, dia] = hojeIso.split('-').map(Number);
  const diasNoMes = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
  const diaDoMes = Math.min(Math.max(1, dia || 1), diasNoMes);
  const diasRestantesMes = Math.max(0, diasNoMes - diaDoMes);
  const ritmoEsperadoPct = Number(((100 * diaDoMes) / diasNoMes).toFixed(1));
  return { diaDoMes, diasNoMes, diasRestantesMes, ritmoEsperadoPct };
}

/**
 * Avalia as 3 dimensões de meta mensal para qualquer nicho (`whatsapp`, `leads`,
 * `ecommerce`, `vendas_midia`, `branding`, `personalizado`):
 *   1. Meta de resultado/receita principal
 *   2. Meta de execução de verba de mídia
 *   3. Teto de custo por resultado (Custo/conversa, CPL, CPA ou CAC)
 */
export function avaliarMetasDoMes({
  perfil,
  meta,
  resumoMes,
  hojeIso,
}: {
  perfil: PerfilMetricaEfetivo;
  meta: MetaMesConta;
  resumoMes: ResumoAgregado;
  hojeIso: string;
}): AvaliacaoMetasCliente {
  const { diaDoMes, diasNoMes, diasRestantesMes, ritmoEsperadoPct } = calendarioDoMes(hojeIso);
  const divisaoRestante = Math.max(1, diasRestantesMes);

  /* 1. Meta de volume ou receita principal */
  const usaReceitaComoPrincipal =
    perfil === 'ecommerce' ||
    ((meta.receitaMeta ?? 0) > 0 && (meta.resultadoMeta ?? 0) <= 0);

  let principal: IndicadorMetaMes;
  if (usaReceitaComoPrincipal) {
    const alvo = meta.receitaMeta && meta.receitaMeta > 0 ? meta.receitaMeta : null;
    const atual = perfil === 'vendas_midia' && resumoMes.receita === 0
      ? resumoMes.receitaAtribuida
      : resumoMes.receita;

    if (!alvo) {
      principal = {
        definida: false,
        rotulo: 'Meta de receita do mês',
        atualTexto: dinheiro(atual),
        metaTexto: 'Não definida',
        percentual: null,
        status: 'nao_definida',
        apoio: 'Defina a meta mensal para acompanhar quanto falta faturar por dia.',
      };
    } else {
      const pct = Number(((100 * atual) / alvo).toFixed(1));
      const falta = Math.max(0, alvo - atual);
      const porDia = falta / divisaoRestante;
      const status =
        pct >= 100
          ? 'acima'
          : pct >= ritmoEsperadoPct * 0.88
            ? 'no_ritmo'
            : pct >= ritmoEsperadoPct * 0.68
              ? 'atencao'
              : 'abaixo';
      principal = {
        definida: true,
        rotulo: 'Meta de receita do mês',
        atualTexto: dinheiro(atual),
        metaTexto: dinheiro(alvo),
        percentual: pct,
        status,
        apoio:
          falta <= 0
            ? `Meta batida (${porcento(pct, 0)}).`
            : diasRestantesMes === 0
              ? `Faltaram ${dinheiro(falta)} para fechar a meta.`
              : `Faltam ${dinheiro(falta)} (${dinheiro(porDia)}/dia nos ${diasRestantesMes} dias restantes).`,
      };
    }
  } else {
    const mapaObjetivo =
      perfil === 'leads'
        ? { rotulo: 'Meta de leads no mês', unidade: 'leads', atual: resumoMes.leadsCaptados }
        : perfil === 'vendas_midia'
          ? { rotulo: 'Meta de vendas na mídia', unidade: 'vendas', atual: resumoMes.comprasAtribuidas }
          : perfil === 'branding'
            ? { rotulo: 'Meta de alcance no mês', unidade: 'pessoas', atual: resumoMes.alcance }
            : { rotulo: 'Meta de conversas no mês', unidade: 'conversas', atual: resumoMes.conversas };

    const alvo = meta.resultadoMeta && meta.resultadoMeta > 0 ? meta.resultadoMeta : null;
    if (!alvo) {
      principal = {
        definida: false,
        rotulo: mapaObjetivo.rotulo,
        atualTexto: `${numero(mapaObjetivo.atual)} ${mapaObjetivo.unidade}`,
        metaTexto: 'Não definida',
        percentual: null,
        status: 'nao_definida',
        apoio: `Defina quantas ${mapaObjetivo.unidade} o cliente precisa gerar no mês.`,
      };
    } else {
      const pct = Number(((100 * mapaObjetivo.atual) / alvo).toFixed(1));
      const falta = Math.max(0, alvo - mapaObjetivo.atual);
      const porDia = Math.ceil(falta / divisaoRestante);
      const status =
        pct >= 100
          ? 'acima'
          : pct >= ritmoEsperadoPct * 0.88
            ? 'no_ritmo'
            : pct >= ritmoEsperadoPct * 0.68
              ? 'atencao'
              : 'abaixo';
      principal = {
        definida: true,
        rotulo: mapaObjetivo.rotulo,
        atualTexto: `${numero(mapaObjetivo.atual)} ${mapaObjetivo.unidade}`,
        metaTexto: `${numero(alvo)} ${mapaObjetivo.unidade}`,
        percentual: pct,
        status,
        apoio:
          falta <= 0
            ? `Meta batida (${porcento(pct, 0)} do volume planejado).`
            : diasRestantesMes === 0
              ? `Faltaram ${numero(falta)} ${mapaObjetivo.unidade} no mês.`
              : `Precisa de ~${numero(porDia)} ${mapaObjetivo.unidade}/dia nos ${diasRestantesMes} dias restantes.`,
      };
    }
  }

  /* 2. Meta de verba de mídia */
  let verba: IndicadorMetaMes;
  const alvoVerba = meta.verbaMeta && meta.verbaMeta > 0 ? meta.verbaMeta : null;
  if (!alvoVerba) {
    verba = {
      definida: false,
      rotulo: 'Orçamento de mídia do mês',
      atualTexto: dinheiro(resumoMes.investimento),
      metaTexto: 'Não definido',
      percentual: null,
      status: 'nao_definida',
      apoio: 'Cadastre a verba mensal planejada para controlar subexecução ou estouro.',
    };
  } else {
    const pctVerba = Number(((100 * resumoMes.investimento) / alvoVerba).toFixed(1));
    const saldoVerba = Math.max(0, alvoVerba - resumoMes.investimento);
    const ritmoVerbaDia = saldoVerba / divisaoRestante;
    const desvio = pctVerba - ritmoEsperadoPct;
    const statusVerba =
      pctVerba > 105 || desvio > 18
        ? 'abaixo'
        : Math.abs(desvio) <= 18
          ? 'no_ritmo'
          : 'atencao';

    verba = {
      definida: true,
      rotulo: 'Orçamento de mídia do mês',
      atualTexto: dinheiro(resumoMes.investimento),
      metaTexto: dinheiro(alvoVerba),
      percentual: pctVerba,
      status: statusVerba,
      apoio:
        pctVerba > 100
          ? `Orçamento ultrapassado em ${dinheiro(resumoMes.investimento - alvoVerba)}.`
          : diasRestantesMes === 0
            ? `Restaram ${dinheiro(saldoVerba)} sem investir no mês.`
            : `Ritmo ideal restante: ${dinheiroExato(ritmoVerbaDia)}/dia.`,
    };
  }

  /* 3. Teto de custo por resultado */
  const mapaCusto =
    perfil === 'leads'
      ? { rotulo: 'Teto de CPL', atual: resumoMes.cpl }
      : perfil === 'ecommerce'
        ? { rotulo: 'Teto de CAC', atual: resumoMes.cac }
        : perfil === 'vendas_midia'
          ? { rotulo: 'Teto de CPA', atual: resumoMes.cpaMidia }
          : { rotulo: 'Teto de custo por conversa', atual: resumoMes.custoConversa };

  let custoTeto: IndicadorMetaMes;
  const teto = meta.custoResultadoTeto && meta.custoResultadoTeto > 0 ? meta.custoResultadoTeto : null;
  if (!teto) {
    custoTeto = {
      definida: false,
      rotulo: mapaCusto.rotulo,
      atualTexto: mapaCusto.atual !== null ? dinheiroExato(mapaCusto.atual) : '—',
      metaTexto: 'Não definido',
      percentual: null,
      status: 'nao_definida',
      apoio: 'Defina o custo máximo saudável por resultado para disparar alertas de eficiência.',
    };
  } else if (mapaCusto.atual === null) {
    custoTeto = {
      definida: true,
      rotulo: mapaCusto.rotulo,
      atualTexto: 'Sem conversões ainda',
      metaTexto: `até ${dinheiroExato(teto)}`,
      percentual: null,
      status: resumoMes.investimento > teto * 3 ? 'abaixo' : 'atencao',
      apoio:
        resumoMes.investimento > 0
          ? `Já investiu ${dinheiro(resumoMes.investimento)} no mês sem registrar resultado principal.`
          : 'Aguardando os primeiros resultados do mês.',
    };
  } else {
    const razaoTeto = Number(((100 * mapaCusto.atual) / teto).toFixed(1));
    const statusCusto =
      mapaCusto.atual <= teto * 0.9
        ? 'acima'
        : mapaCusto.atual <= teto
          ? 'no_ritmo'
          : mapaCusto.atual <= teto * 1.2
            ? 'atencao'
            : 'abaixo';
    custoTeto = {
      definida: true,
      rotulo: mapaCusto.rotulo,
      atualTexto: dinheiroExato(mapaCusto.atual),
      metaTexto: `até ${dinheiroExato(teto)}`,
      percentual: razaoTeto,
      status: statusCusto,
      apoio:
        mapaCusto.atual <= teto
          ? `Dentro da meta (${dinheiroExato(teto - mapaCusto.atual)} abaixo do teto).`
          : `Acima do teto em ${dinheiroExato(mapaCusto.atual - teto)} por resultado.`,
    };
  }

  return {
    temAlgumaMeta: principal.definida || verba.definida || custoTeto.definida,
    diaDoMes,
    diasNoMes,
    diasRestantesMes,
    ritmoEsperadoPct,
    principal,
    verba,
    custoTeto,
  };
}

/**
 * Resumo enxuto de meta para a tabela da Carteira (`/painel/contas`),
 * eliminando o antigo texto fixo "sem meta de venda" em clientes de WhatsApp/Leads.
 */
export function resumirMetaNaCarteira(c: ContaResumo): {
  percentual: number | null;
  rotulo: string;
  cor: 'verde' | 'ambar' | 'rosa' | 'neutro';
} {
  const perfil = resolverPerfil(c.perfilMetrica, c.tipo);

  if (c.receitaMeta && c.receitaMeta > 0 && (perfil === 'ecommerce' || c.receita > 0)) {
    const pct = Number(((100 * c.receita) / c.receitaMeta).toFixed(0));
    return {
      percentual: pct,
      rotulo: `${pct}% da receita (${dinheiro(c.receitaMeta)})`,
      cor: pct >= 85 ? 'verde' : pct >= 55 ? 'ambar' : 'rosa',
    };
  }

  if (c.resultadoMeta && c.resultadoMeta > 0) {
    const atual =
      perfil === 'leads'
        ? c.leadsCaptados
        : perfil === 'vendas_midia'
          ? c.comprasAtribuidas
          : c.conversas;
    const unid =
      perfil === 'leads' ? 'leads' : perfil === 'vendas_midia' ? 'vendas' : 'conversas';
    const pct = Number(((100 * atual) / c.resultadoMeta).toFixed(0));
    return {
      percentual: pct,
      rotulo: `${numero(atual)}/${numero(c.resultadoMeta)} ${unid} (${pct}%)`,
      cor: pct >= 85 ? 'verde' : pct >= 55 ? 'ambar' : 'rosa',
    };
  }

  if (c.custoResultadoTeto && c.custoResultadoTeto > 0) {
    const vol = perfil === 'leads' ? c.leadsCaptados : c.conversas;
    const custo = vol > 0 ? c.investimento / vol : null;
    if (custo !== null) {
      const ok = custo <= c.custoResultadoTeto;
      return {
        percentual: ok ? 100 : 45,
        rotulo: `Custo ${dinheiroExato(custo)} (teto ${dinheiroExato(c.custoResultadoTeto)})`,
        cor: ok ? 'verde' : 'rosa',
      };
    }
  }

  if (c.verbaMeta && c.verbaMeta > 0) {
    const pct = Number(((100 * c.investimento) / c.verbaMeta).toFixed(0));
    return {
      percentual: pct,
      rotulo: `${pct}% da verba (${dinheiro(c.verbaMeta)})`,
      cor: 'neutro',
    };
  }

  return {
    percentual: null,
    rotulo: 'Definir meta',
    cor: 'neutro',
  };
}

/**
 * Motor determinístico que monta o Radar "O que precisa ser feito agora"
 * cruzando saldo pré-pago, tarefas, projetos, metas, integrações e relatórios.
 */
export function diagnosticarPendenciasCliente({
  conta,
  avaliacaoMetas,
  saldoMidia,
  tarefas,
  projetos,
  integracoes,
  frescor,
  relatorios,
  hojeIso,
}: {
  conta: ContaFicha;
  avaliacaoMetas: AvaliacaoMetasCliente;
  saldoMidia: SaldoContaMidia | null;
  tarefas: Tarefa[];
  projetos: Projeto[];
  integracoes: IntegracaoStatus[];
  frescor: Frescor;
  relatorios: RelatorioResumo[];
  hojeIso: string;
}): PendenciaOperacional[] {
  const pendencias: PendenciaOperacional[] = [];
  const baseFicha = `/painel/contas?ficha=${encodeURIComponent(conta.id)}`;

  /* 1. Saldo de mídia esgotado ou crítico */
  if (saldoMidia && (saldoMidia.nivel === 'zerado' || saldoMidia.nivel === 'critico')) {
    const valor = dinheiroExato(saldoMidia.saldoDisponivel ?? 0);
    pendencias.push({
      id: 'saldo-midia',
      nivel: 'urgente',
      categoria: 'saldo',
      titulo:
        saldoMidia.nivel === 'zerado'
          ? `Saldo Meta Ads esgotado (${valor})`
          : `Saldo Meta Ads baixo: ${valor}`,
      detalhe:
        saldoMidia.diasRestantes !== null
          ? `Autonomia estimada de ~${saldoMidia.diasRestantes.toFixed(1).replace('.', ',')} dias no ritmo atual (${dinheiroExato(saldoMidia.gastoMedioDiario)}/dia). Solicite recarga via PIX/boleto ao cliente.`
          : `Conta ${saldoMidia.adAccountNome} abaixo do piso de segurança. Solicite recarga para não pausar os anúncios.`,
      acaoRotulo: 'Ver métricas e saldo',
      acaoHref: `/painel/metricas?conta=${encodeURIComponent(conta.id)}`,
    });
  }

  /* 2. Faturas vencidas (inadimplência) */
  if (conta.inadimplencia > 0) {
    pendencias.push({
      id: 'inadimplencia',
      nivel: 'urgente',
      categoria: 'financeiro',
      titulo: `Cobrança em atraso: ${dinheiro(conta.inadimplencia)}`,
      detalhe: 'Existe fatura vencida e ainda não baixada para este cliente.',
      acaoRotulo: 'Abrir contrato e cobrança',
      acaoHref: `${baseFicha}&aba=contrato`,
    });
  }

  /* 3. Tarefas atrasadas ou que vencem hoje */
  const abertas = tarefas.filter((t) => t.status === 'aberta' || t.status === 'fazendo');
  const atrasadas = abertas.filter((t) => t.diasAtePrazo !== null && t.diasAtePrazo < 0);
  const paraHoje = abertas.filter((t) => t.diasAtePrazo === 0);

  if (atrasadas.length > 0) {
    const nomes = atrasadas
      .slice(0, 2)
      .map((t) => `"${t.titulo}"`)
      .join(', ');
    pendencias.push({
      id: 'tarefas-atrasadas',
      nivel: 'urgente',
      categoria: 'tarefa',
      titulo:
        atrasadas.length === 1
          ? `1 tarefa atrasada: ${atrasadas[0].titulo}`
          : `${atrasadas.length} tarefas em atraso nesta conta`,
      detalhe: `Priorize hoje: ${nomes}${atrasadas.length > 2 ? ` e mais ${atrasadas.length - 2}` : ''}.`,
      acaoRotulo: 'Executar no Plano de Ação',
      acaoHref: `${baseFicha}&aba=operacao`,
    });
  } else if (paraHoje.length > 0) {
    pendencias.push({
      id: 'tarefas-hoje',
      nivel: 'atencao',
      categoria: 'tarefa',
      titulo:
        paraHoje.length === 1
          ? `Para hoje: ${paraHoje[0].titulo}`
          : `${paraHoje.length} tarefas com entrega hoje`,
      detalhe: 'Itens agendados para concluir hoje nesta conta.',
      acaoRotulo: 'Abrir Plano de Ação',
      acaoHref: `${baseFicha}&aba=operacao`,
    });
  }

  /* 4. Projetos em alteração (bola com a agência) ou parados com o cliente */
  const emAlteracao = projetos.filter((p) => p.situacao === 'alteracao');
  const projetosAtrasados = projetos.filter(
    (p) =>
      ['briefing', 'andamento', 'alteracao'].includes(p.situacao) &&
      p.diasAteOPrazo !== null &&
      p.diasAteOPrazo < 0,
  );
  const paradosCliente = projetos.filter(
    (p) => p.situacao === 'aguardando_cliente' && p.diasNaSituacao >= 4,
  );

  if (emAlteracao.length > 0 || projetosAtrasados.length > 0) {
    const alvo = emAlteracao[0] ?? projetosAtrasados[0];
    pendencias.push({
      id: 'projeto-agencia',
      nivel: projetosAtrasados.length > 0 ? 'urgente' : 'atencao',
      categoria: 'projeto',
      titulo:
        emAlteracao.length > 0
          ? `Projeto voltou com alteração: ${alvo.nome}`
          : `Entrega com prazo vencido: ${alvo.nome}`,
      detalhe:
        emAlteracao.length > 0
          ? `O cliente pediu ajustes há ${alvo.diasNaSituacao} ${alvo.diasNaSituacao === 1 ? 'dia' : 'dias'}. A vez está com a equipe.`
          : `Prazo vencido há ${Math.abs(alvo.diasAteOPrazo ?? 1)} dias.`,
      acaoRotulo: 'Ver entregas',
      acaoHref: `${baseFicha}&aba=operacao`,
    });
  }

  if (paradosCliente.length > 0) {
    const p = paradosCliente[0];
    pendencias.push({
      id: 'projeto-cliente',
      nivel: 'atencao',
      categoria: 'projeto',
      titulo: `Cobrar retorno do cliente em "${p.nome}"`,
      detalhe: `Parado em "Aguardando cliente" há ${p.diasNaSituacao} dias esperando material, aprovação ou acesso.`,
      acaoRotulo: 'Abrir projeto',
      acaoHref: `${baseFicha}&aba=operacao`,
    });
  }

  /* 5. Integrações com erro ou atraso de dados */
  const comErro = integracoes.filter((i) => i.ativa && i.estado === 'com_erro');
  if (comErro.length > 0) {
    pendencias.push({
      id: 'integracao-erro',
      nivel: 'urgente',
      categoria: 'dados',
      titulo: `Falha na sincronização de ${comErro.map((c) => c.provedor).join(', ')}`,
      detalhe: comErro[0].ultimoErro ?? 'Verifique o vínculo e rode uma sincronização manual.',
      acaoRotulo: 'Conferir fontes',
      acaoHref: `${baseFicha}&aba=dados`,
    });
  } else if (integracoes.length === 0 && conta.situacao === 'ativa') {
    pendencias.push({
      id: 'sem-integracao',
      nivel: 'atencao',
      categoria: 'dados',
      titulo: 'Nenhuma fonte automática vinculada',
      detalhe: 'Vincule Meta Ads, Google Ads, GA4 ou Hospedi para alimentar métricas e relatórios automaticamente.',
      acaoRotulo: 'Vincular fonte',
      acaoHref: `${baseFicha}&aba=dados`,
    });
  } else if (frescor.atrasoDias !== null && frescor.atrasoDias > 2 && conta.situacao === 'ativa') {
    pendencias.push({
      id: 'dados-defasados',
      nivel: 'atencao',
      categoria: 'dados',
      titulo: `Métricas sem atualizar há ${frescor.atrasoDias} dias`,
      detalhe: 'Pode indicar campanhas pausadas sem gasto recente ou janela pendente de sincronização.',
      acaoRotulo: 'Sincronizar dados',
      acaoHref: `${baseFicha}&aba=dados`,
    });
  }

  /* 6. Desvios de Meta (Custo acima do teto, ritmo baixo ou ausência de metas) */
  if (!avaliacaoMetas.temAlgumaMeta && conta.situacao === 'ativa') {
    pendencias.push({
      id: 'sem-metas',
      nivel: 'sugestao',
      categoria: 'meta',
      titulo: 'Definir as metas deste mês para o cliente',
      detalhe: 'Cadastre verba, meta de conversas/leads/receita e teto de custo para ativar o termômetro diário.',
      acaoRotulo: 'Configurar metas abaixo',
      acaoHref: `${baseFicha}&aba=resumo#metas-cliente`,
    });
  } else {
    if (avaliacaoMetas.custoTeto.definida && avaliacaoMetas.custoTeto.status === 'abaixo') {
      pendencias.push({
        id: 'custo-acima-teto',
        nivel: 'atencao',
        categoria: 'meta',
        titulo: `${avaliacaoMetas.custoTeto.rotulo} acima do limite (${avaliacaoMetas.custoTeto.atualTexto})`,
        detalhe: `${avaliacaoMetas.custoTeto.apoio} Revise criativos saturados e segmentação em Métricas.`,
        acaoRotulo: 'Analisar campanhas e criativos',
        acaoHref: `/painel/metricas?conta=${encodeURIComponent(conta.id)}`,
      });
    }
    if (
      avaliacaoMetas.principal.definida &&
      avaliacaoMetas.principal.status === 'abaixo' &&
      avaliacaoMetas.diaDoMes >= 5
    ) {
      pendencias.push({
        id: 'volume-abaixo-ritmo',
        nivel: 'atencao',
        categoria: 'meta',
        titulo: `Entrega abaixo do ritmo da meta (${porcento(avaliacaoMetas.principal.percentual, 0)} vs ${porcento(avaliacaoMetas.ritmoEsperadoPct, 0)} esperado)`,
        detalhe: avaliacaoMetas.principal.apoio,
        acaoRotulo: 'Ver funil e campanhas',
        acaoHref: `/painel/metricas?conta=${encodeURIComponent(conta.id)}`,
      });
    }
  }

  /* 7. Cadência de relatórios e registro de relacionamento */
  if (conta.situacao === 'ativa') {
    const ultimoRelatorio = relatorios[0] ?? null;
    if (!ultimoRelatorio) {
      pendencias.push({
        id: 'primeiro-relatorio',
        nivel: 'sugestao',
        categoria: 'relatorio',
        titulo: 'Nenhum relatório gerado ainda para este cliente',
        detalhe: 'Gere um relatório executivo em PDF/link para apresentar a evolução da conta.',
        acaoRotulo: 'Gerar relatório',
        acaoHref: `/painel/relatorios?conta=${encodeURIComponent(conta.id)}`,
      });
    } else {
      const diasDesdeRelatorio = Math.floor(
        (Date.parse(`${hojeIso}T12:00:00Z`) - new Date(ultimoRelatorio.criadoEm).getTime()) /
          86400000,
      );
      if (diasDesdeRelatorio > 21) {
        pendencias.push({
          id: 'relatorio-defasado',
          nivel: 'sugestao',
          categoria: 'relatorio',
          titulo: `${diasDesdeRelatorio} dias desde o último relatório`,
          detalhe: `Último documento: "${ultimoRelatorio.titulo}". Vale preparar o fechamento atualizado.`,
          acaoRotulo: 'Novo relatório',
          acaoHref: `/painel/relatorios?conta=${encodeURIComponent(conta.id)}`,
        });
      }
    }

    if (!conta.publicoAlvo && !conta.ofertaPrincipal && !conta.objetivoPrincipal) {
      pendencias.push({
        id: 'briefing-incompleto',
        nivel: 'sugestao',
        categoria: 'relacionamento',
        titulo: 'Preencher briefing estratégico e escopo na ficha',
        detalhe: 'Registre oferta principal, público-alvo e links de Drive/Instagram para centralizar o contexto.',
        acaoRotulo: 'Preencher ficha cadastral',
        acaoHref: `${baseFicha}&aba=briefing`,
      });
    }
  }

  const peso: Record<NivelPendencia, number> = { urgente: 0, atencao: 1, sugestao: 2 };
  return pendencias.sort((a, b) => peso[a.nivel] - peso[b.nivel]);
}
