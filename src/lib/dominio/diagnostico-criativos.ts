import type { CriativoResumo } from '../dados/tipos.ts';
import { dinheiroExato, porcento } from '../formato.ts';

/**
 * Inteligência e diagnóstico de criativos de mídia paga.
 *
 * Avalia cada anúncio contra a própria régua da conta (custo médio ponderado,
 * CTR médio da conta, frequência de exposição, conversão pós-clique e eventual
 * teto de custo definido para o cliente) para responder duas perguntas:
 *   1. Quais criativos estão puxando o resultado para cima (e merecem escala/variações)?
 *   2. Por que um criativo está caro — problema de gancho (CTR baixo), de promessa/
 *      atendimento pós-clique (clique alto sem conversa/lead), ou de saturação
 *      (frequência alta) — e o que fazer na prática?
 */

export type ClassificacaoCriativo =
  | 'campeao'
  | 'escalar'
  | 'saudavel'
  | 'aprendizado'
  | 'ajustar_gancho'
  | 'ajustar_conversao'
  | 'saturando'
  | 'revisar_verba'
  | 'reprovado';

export type AvaliacaoCriativo = {
  id: string;
  nota: number; // 0..100 para ordenação "Melhores primeiro"
  classificacao: ClassificacaoCriativo;
  selo: string;
  tom: 'verde' | 'azul' | 'neutro' | 'amarelo' | 'rosa';
  volumePrincipal: number;
  unidadeResultado: string;
  custoUnitario: number | null;
  roas: number | null;
  frequencia: number | null;
  taxaPosClique: number | null;
  comparacaoCustoPct: number | null; // negativo = mais barato que a média (bom!)
  diagnostico: string;
  sugestao: string;
};

export type ResumoInteligenciaCriativos = {
  avaliacoes: Record<string, AvaliacaoCriativo>;
  campeaoId: string | null;
  escalarIds: string[];
  atencaoIds: string[];
  destaques: {
    tipo: 'campeao' | 'escala' | 'concentracao' | 'melhoria';
    titulo: string;
    detalhe: string;
  }[];
};

function extrairResultadoPrimario(c: CriativoResumo): {
  volume: number;
  unidade: string;
  ehReceita: boolean;
} {
  switch (c.objetivo) {
    case 'mensagens':
      return { volume: c.conversas, unidade: c.conversas === 1 ? 'conversa' : 'conversas', ehReceita: false };
    case 'leads':
      return { volume: c.leadsCaptados, unidade: c.leadsCaptados === 1 ? 'lead' : 'leads', ehReceita: false };
    case 'vendas':
      return {
        volume: c.comprasAtribuidas,
        unidade: c.comprasAtribuidas === 1 ? 'venda' : 'vendas',
        ehReceita: c.receitaAtribuida > 0,
      };
    case 'trafego': {
      const v = c.visitasPagina > 0 ? c.visitasPagina : c.cliquesLink;
      return {
        volume: v,
        unidade: c.visitasPagina > 0 ? 'visitas LP' : 'cliques',
        ehReceita: false,
      };
    }
    case 'video':
      return { volume: c.visualizacoesVideo, unidade: 'views de vídeo', ehReceita: false };
    case 'engajamento':
      return { volume: c.engajamentos, unidade: 'interações', ehReceita: false };
    default:
      return {
        volume: c.alcance > 0 ? c.alcance : c.impressoes,
        unidade: c.alcance > 0 ? 'pessoas alcançadas' : 'impressões',
        ehReceita: false,
      };
  }
}

export function diagnosticarCriativos(
  criativos: CriativoResumo[],
  opcoes?: { tetoCustoResultado?: number | null },
): ResumoInteligenciaCriativos {
  if (criativos.length === 0) {
    return {
      avaliacoes: {},
      campeaoId: null,
      escalarIds: [],
      atencaoIds: [],
      destaques: [],
    };
  }

  /* Médias ponderadas da conta por objetivo dominante para comparação justa
     (não comparamos custo de alcance com custo de conversa no WhatsApp). */
  const totaisPorObjetivo = new Map<
    CriativoResumo['objetivo'],
    { gasto: number; impressoes: number; cliques: number; volume: number; receita: number }
  >();

  let gastoTotalConta = 0;
  let impressoesTotaisConta = 0;
  let cliquesTotaisConta = 0;

  for (const c of criativos) {
    gastoTotalConta += c.investimento;
    impressoesTotaisConta += c.impressoes;
    cliquesTotaisConta += c.cliquesLink;

    const r = extrairResultadoPrimario(c);
    const acum = totaisPorObjetivo.get(c.objetivo) ?? {
      gasto: 0,
      impressoes: 0,
      cliques: 0,
      volume: 0,
      receita: 0,
    };
    acum.gasto += c.investimento;
    acum.impressoes += c.impressoes;
    acum.cliques += c.cliquesLink;
    acum.volume += r.volume;
    acum.receita += c.receitaAtribuida;
    totaisPorObjetivo.set(c.objetivo, acum);
  }

  const ctrMedioConta =
    impressoesTotaisConta > 0 ? (100 * cliquesTotaisConta) / impressoesTotaisConta : 1.0;

  const rascunhos: AvaliacaoCriativo[] = [];

  for (const c of criativos) {
    const prim = extrairResultadoPrimario(c);
    const refObj = totaisPorObjetivo.get(c.objetivo)!;
    const custoMedioObj = refObj.volume > 0 ? refObj.gasto / refObj.volume : null;
    const tetoCliente =
      opcoes?.tetoCustoResultado && opcoes.tetoCustoResultado > 0
        ? opcoes.tetoCustoResultado
        : null;

    /* Referência de eficiência: se o cliente definiu um teto explícito
       (ex.: R$ 10/conversa) e o objetivo é mensagens/leads/vendas, usa o teto;
       caso contrário usa a média ponderada dos criativos do mesmo objetivo. */
    const reguaCusto =
      tetoCliente && ['mensagens', 'leads', 'vendas'].includes(c.objetivo)
        ? tetoCliente
        : custoMedioObj;

    const custoUnitario =
      prim.volume > 0 && c.investimento > 0
        ? Number((c.investimento / prim.volume).toFixed(2))
        : null;
    const roas =
      c.investimento > 0 && c.receitaAtribuida > 0
        ? Number((c.receitaAtribuida / c.investimento).toFixed(2))
        : null;
    const frequencia =
      c.alcance > 0 && c.impressoes > 0
        ? Number((c.impressoes / c.alcance).toFixed(2))
        : null;
    const taxaPosClique =
      c.cliquesLink > 0 && ['mensagens', 'leads', 'vendas'].includes(c.objetivo)
        ? Number(((100 * prim.volume) / c.cliquesLink).toFixed(1))
        : null;

    const comparacaoCustoPct =
      custoUnitario !== null && reguaCusto && reguaCusto > 0
        ? Number(((100 * (custoUnitario - reguaCusto)) / reguaCusto).toFixed(1))
        : null;

    /* 1. Reprovado ou com problema técnico na Meta */
    if (c.status === 'erro') {
      rascunhos.push({
        id: c.id,
        nota: 5,
        classificacao: 'reprovado',
        selo: 'Corrigir entrega',
        tom: 'rosa',
        volumePrincipal: prim.volume,
        unidadeResultado: prim.unidade,
        custoUnitario,
        roas,
        frequencia,
        taxaPosClique,
        comparacaoCustoPct,
        diagnostico: `${c.statusDetalhe} — o anúncio não está entregando normalmente.`,
        sugestao:
          'Revise promessas sensíveis no texto/vídeo, confira o destino do botão e envie para nova análise no Gerenciador.',
      });
      continue;
    }

    /* 2. Em aprendizado / pouca amostra estatística */
    const gastoMinimoAprendizado = Math.max(20, gastoTotalConta * 0.04);
    if (c.impressoes < 600 && c.investimento < gastoMinimoAprendizado && prim.volume < 3) {
      rascunhos.push({
        id: c.id,
        nota: 45,
        classificacao: 'aprendizado',
        selo: 'Em aprendizado',
        tom: 'neutro',
        volumePrincipal: prim.volume,
        unidadeResultado: prim.unidade,
        custoUnitario,
        roas,
        frequencia,
        taxaPosClique,
        comparacaoCustoPct,
        diagnostico: 'Ainda com poucas impressões para concluir eficiência com segurança.',
        sugestao:
          'Aguarde pelo menos 800 a 1.000 impressões antes de pausar ou mexer, para não cortar criativo antes de sair do aprendizado.',
      });
      continue;
    }

    const ctr = c.ctr ?? 0;
    const ctrBaixo = c.impressoes >= 1000 && ctr < Math.max(0.55, ctrMedioConta * 0.72);
    const ctrBom = ctr >= Math.max(0.9, ctrMedioConta * 0.95);
    const saturado = frequencia !== null && frequencia >= 2.85;
    const custoRuim =
      (comparacaoCustoPct !== null && comparacaoCustoPct > 28) ||
      (prim.volume === 0 && c.investimento >= Math.max(30, (reguaCusto ?? 12) * 2.5));
    const custoExcelente =
      prim.volume >= 3 &&
      ((comparacaoCustoPct !== null && comparacaoCustoPct <= -12) ||
        (roas !== null && roas >= 3));

    /* Cálculo de nota (0..100) combinando eficiência de custo, volume e CTR */
    let nota = 60;
    if (comparacaoCustoPct !== null) {
      nota += Math.max(-35, Math.min(28, -comparacaoCustoPct * 0.55));
    } else if (prim.volume === 0 && c.investimento > 0) {
      nota -= 32;
    }
    if (refObj.volume > 0) {
      const fatiaResultado = prim.volume / refObj.volume;
      nota += Math.min(14, fatiaResultado * 28);
    }
    if (ctrMedioConta > 0) {
      const razaoCtr = ctr / ctrMedioConta;
      nota += Math.max(-10, Math.min(8, (razaoCtr - 1) * 12));
    }
    if (saturado && custoRuim) nota -= 8;
    nota = Math.max(8, Math.min(99, Math.round(nota)));

    /* 3. Saturação / fadiga de público */
    if (saturado && (custoRuim || ctr < ctrMedioConta * 0.85)) {
      rascunhos.push({
        id: c.id,
        nota,
        classificacao: 'saturando',
        selo: 'Fadiga de público',
        tom: 'amarelo',
        volumePrincipal: prim.volume,
        unidadeResultado: prim.unidade,
        custoUnitario,
        roas,
        frequencia,
        taxaPosClique,
        comparacaoCustoPct,
        diagnostico: `Frequência em ${frequencia?.toFixed(2).replace('.', ',')}x com perda de eficiência (${custoUnitario ? dinheiroExato(custoUnitario) : 'sem retorno'}).`,
        sugestao:
          'O público já viu esta peça repetidas vezes. Suba uma variação trocando os 3 primeiros segundos (ou capa/título) ou amplie a segmentação.',
      });
      continue;
    }

    /* 4. Custo alto por gancho fraco (CTR baixo) */
    if (custoRuim && ctrBaixo) {
      rascunhos.push({
        id: c.id,
        nota,
        classificacao: 'ajustar_gancho',
        selo: 'Melhorar gancho',
        tom: 'amarelo',
        volumePrincipal: prim.volume,
        unidadeResultado: prim.unidade,
        custoUnitario,
        roas,
        frequencia,
        taxaPosClique,
        comparacaoCustoPct,
        diagnostico: `CTR baixo (${porcento(ctr, 2)} vs ${porcento(ctrMedioConta, 2)} da conta) está encarecendo o clique e o resultado.`,
        sugestao:
          c.formato === 'video'
            ? 'Troque o gancho dos primeiros 3 segundos mostrando o diferencial logo na abertura e adicione legenda grande na tela.'
            : 'Teste uma foto/arte mais contrastante com headline direta de benefício e chamada clara para clicar.',
      });
      continue;
    }

    /* 5. Atrai cliques (CTR bom), mas converte pouco após o clique */
    if (custoRuim && ctrBom) {
      rascunhos.push({
        id: c.id,
        nota,
        classificacao: 'ajustar_conversao',
        selo: 'Ajustar conversão',
        tom: 'amarelo',
        volumePrincipal: prim.volume,
        unidadeResultado: prim.unidade,
        custoUnitario,
        roas,
        frequencia,
        taxaPosClique,
        comparacaoCustoPct,
        diagnostico: `Atrai bons cliques (CTR ${porcento(ctr, 2)}), mas só ${taxaPosClique !== null ? porcento(taxaPosClique, 1) : 'poucos'} viram ${prim.unidade}.`,
        sugestao:
          c.objetivo === 'mensagens'
            ? 'Alinhe a mensagem pré-preenchida do WhatsApp com a oferta exata prometida no criativo para reduzir desistência ao abrir a conversa.'
            : 'Revise a velocidade de carregamento e se a primeira dobra da página entrega exatamente o que o anúncio prometeu.',
      });
      continue;
    }

    /* 6. Dreno de verba geral */
    if (custoRuim) {
      rascunhos.push({
        id: c.id,
        nota,
        classificacao: 'revisar_verba',
        selo: 'Acima da meta',
        tom: 'rosa',
        volumePrincipal: prim.volume,
        unidadeResultado: prim.unidade,
        custoUnitario,
        roas,
        frequencia,
        taxaPosClique,
        comparacaoCustoPct,
        diagnostico:
          prim.volume === 0
            ? `Investiu ${dinheiroExato(c.investimento)} sem gerar ${prim.unidade} no período.`
            : `Custo em ${dinheiroExato(custoUnitario)} (${comparacaoCustoPct && comparacaoCustoPct > 0 ? `+${comparacaoCustoPct.toFixed(0)}%` : ''} acima da referência).`,
        sugestao:
          'Considere pausar ou reduzir orçamento deste anúncio e redirecionar verba para os criativos campeões da conta.',
      });
      continue;
    }

    /* 7. Candidato forte a escala / campeão */
    if (custoExcelente) {
      const fatiaVerba = gastoTotalConta > 0 ? c.investimento / gastoTotalConta : 0;
      const poucoOrcamento = fatiaVerba < 0.25 && (frequencia === null || frequencia < 2.2);

      rascunhos.push({
        id: c.id,
        nota: nota + 6,
        classificacao: 'escalar',
        selo: poucoOrcamento ? 'Potencial de escala' : 'Alta performance',
        tom: 'azul',
        volumePrincipal: prim.volume,
        unidadeResultado: prim.unidade,
        custoUnitario,
        roas,
        frequencia,
        taxaPosClique,
        comparacaoCustoPct,
        diagnostico: `Entrega ${prim.unidade} a ${dinheiroExato(custoUnitario)}${comparacaoCustoPct !== null && comparacaoCustoPct < 0 ? ` (${Math.abs(comparacaoCustoPct).toFixed(0)}% melhor que a referência)` : ''}.`,
        sugestao: poucoOrcamento
          ? 'Excelente custo com baixa saturação — aumente gradualmente a verba (15% a 20%) ou duplique o ângulo para outro público.'
          : 'Mantenha ativo e crie 2 variações mudando apenas a abertura para sustentar esse custo quando a frequência subir.',
      });
      continue;
    }

    /* 8. Saudável / dentro do esperado */
    rascunhos.push({
      id: c.id,
      nota,
      classificacao: 'saudavel',
      selo: 'Saudável',
      tom: 'verde',
      volumePrincipal: prim.volume,
      unidadeResultado: prim.unidade,
      custoUnitario,
      roas,
      frequencia,
      taxaPosClique,
      comparacaoCustoPct,
      diagnostico:
        custoUnitario !== null
          ? `Rodando dentro da faixa esperada (${dinheiroExato(custoUnitario)} por resultado · CTR ${porcento(ctr, 2)}).`
          : `Entrega consistente no período (CTR ${porcento(ctr, 2)}).`,
      sugestao:
        'Mantenha em veiculação acompanhando a frequência; teste variações de chamada (CTA) para buscar reduzir ainda mais o custo.',
    });
  }

  /* Elege o Campeão absoluto entre os criativos saudáveis/escaláveis com bom volume */
  const elegiveisCampeao = rascunhos
    .filter(
      (a) =>
        (a.classificacao === 'escalar' || a.classificacao === 'saudavel') &&
        a.volumePrincipal >= 3,
    )
    .sort((a, b) => b.nota - a.nota || b.volumePrincipal - a.volumePrincipal);

  let campeaoId: string | null = null;
  if (elegiveisCampeao.length > 0) {
    const camp = elegiveisCampeao[0];
    campeaoId = camp.id;
    camp.classificacao = 'campeao';
    camp.selo = 'Campeão do período';
    camp.tom = 'verde';
    camp.nota = Math.max(camp.nota, 92);
    camp.sugestao =
      'Use a estrutura visual e o argumento deste anúncio como modelo para gravar/criar os próximos 2 criativos da conta.';
  }

  const avaliacoes: Record<string, AvaliacaoCriativo> = {};
  for (const a of rascunhos) avaliacoes[a.id] = a;

  const escalarIds = rascunhos
    .filter((a) => a.classificacao === 'escalar')
    .sort((a, b) => b.nota - a.nota)
    .map((a) => a.id);

  const atencaoIds = rascunhos
    .filter((a) =>
      ['reprovado', 'revisar_verba', 'ajustar_gancho', 'ajustar_conversao', 'saturando'].includes(
        a.classificacao,
      ),
    )
    .map((a) => a.id);

  /* Monta até 3 destaques executivos acionáveis para o topo da seção */
  const destaques: ResumoInteligenciaCriativos['destaques'] = [];

  if (campeaoId) {
    const cObj = criativos.find((x) => x.id === campeaoId)!;
    const av = avaliacoes[campeaoId];
    destaques.push({
      tipo: 'campeao',
      titulo: `Melhor criativo: ${cObj.nome}`,
      detalhe: `${av.volumePrincipal} ${av.unidadeResultado}${av.custoUnitario ? ` a ${dinheiroExato(av.custoUnitario)}` : ''} (CTR ${porcento(cObj.ctr, 2)}). Replique o gancho deste anúncio nas próximas variações.`,
    });
  }

  if (escalarIds.length > 0) {
    const escObj = criativos.find((x) => x.id === escalarIds[0])!;
    const av = avaliacoes[escalarIds[0]];
    destaques.push({
      tipo: 'escala',
      titulo: `Oportunidade de escala: ${escObj.nome}`,
      detalhe: `${av.diagnostico} ${av.sugestao}`,
    });
  }

  /* Verifica concentração excessiva (> 70% dos resultados num só criativo com 2+ anúncios) */
  if (campeaoId && criativos.length >= 2) {
    const campCriativo = criativos.find((x) => x.id === campeaoId)!;
    const totalObj = totaisPorObjetivo.get(campCriativo.objetivo)?.volume ?? 0;
    const volCamp = avaliacoes[campeaoId].volumePrincipal;
    if (totalObj >= 10 && volCamp / totalObj >= 0.72) {
      destaques.push({
        tipo: 'concentracao',
        titulo: `${Math.round((100 * volCamp) / totalObj)}% do resultado depende de 1 criativo`,
        detalhe: `Quase toda a entrega vem de "${campCriativo.nome}". Crie variações dele agora para não perder tração quando saturar.`,
      });
    }
  }

  if (atencaoIds.length > 0 && destaques.length < 3) {
    const piorId = atencaoIds[0];
    const piorObj = criativos.find((x) => x.id === piorId)!;
    const av = avaliacoes[piorId];
    destaques.push({
      tipo: 'melhoria',
      titulo: `Ponto de otimização: ${piorObj.nome}`,
      detalhe: `${av.diagnostico} ${av.sugestao}`,
    });
  }

  return {
    avaliacoes,
    campeaoId,
    escalarIds,
    atencaoIds,
    destaques: destaques.slice(0, 3),
  };
}
