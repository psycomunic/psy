import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  avaliarMetasDoMes,
  diagnosticarPendenciasCliente,
  resumirMetaNaCarteira,
} from './diagnostico-cliente.ts';
import { agregarPeriodo } from './perfis-metrica.ts';

describe('Diagnóstico 360° e Metas do Cliente', () => {
  const resumoBase = agregarPeriodo([
    {
      dia: '2026-11-10',
      sessoes: 0,
      pedidosCaptados: 0,
      pedidosAprovados: 4,
      novosClientes: 3,
      receita: 7800,
      receitaAtribuida: 0,
      investimento: 400,
      impressoes: 25000,
      alcance: 18000,
      cliques: 500,
      cliquesLink: 420,
      visitasPagina: 0,
      conversas: 80,
      leadsCaptados: 0,
      comprasAtribuidas: 0,
      carrinhos: 0,
      checkouts: 0,
      engajamentos: 300,
      visualizacoesVideo: 1200,
      mer: 19.5,
      ticketMedio: 1950,
      cac: 133.33,
      taxaConversao: null,
      taxaAprovacao: null,
    },
  ]);

  test('avalia metas de conversas, verba e teto de custo para cliente WhatsApp', () => {
    const av = avaliarMetasDoMes({
      perfil: 'whatsapp',
      meta: {
        receitaMeta: 0,
        verbaMeta: 1200,
        resultadoMeta: 200,
        custoResultadoTeto: 8,
      },
      resumoMes: resumoBase,
      hojeIso: '2026-11-15',
    });

    assert.equal(av.temAlgumaMeta, true);
    assert.equal(av.principal.percentual, 40);
    assert.equal(av.custoTeto.status, 'acima'); // R$ 5,00 <= R$ 8,00 * 0.9
    assert.match(av.principal.apoio, /conversas\/dia/);
  });

  test('prioriza saldo crítico, tarefa atrasada e projeto em alteração no radar', () => {
    const av = avaliarMetasDoMes({
      perfil: 'whatsapp',
      meta: { receitaMeta: null, verbaMeta: null, resultadoMeta: null, custoResultadoTeto: 3 },
      resumoMes: resumoBase,
      hojeIso: '2026-11-24',
    });

    const pendencias = diagnosticarPendenciasCliente({
      conta: {
        id: 'c1',
        nome: 'Chalé Império da Serra',
        tipo: 'trafego',
        perfilMetrica: 'whatsapp',
        kpisVisiveis: null,
        razaoSocial: null,
        documento: null,
        plataforma: null,
        site: null,
        instagram: '@chale',
        segmento: 'Chalés e pousadas',
        situacao: 'ativa',
        dataInicio: '2026-08-01',
        observacoes: null,
        responsavel: 'Angelo',
        responsavelId: 'p1',
        escopo: ['Tráfego Meta Ads'],
        objetivoPrincipal: 'Reservas diretas',
        publicoAlvo: 'Casais',
        ofertaPrincipal: 'Fim de semana romântico',
        diferenciais: 'Hidromassagem',
        linksUteis: {},
        checklistOnboarding: {},
        pontuacao: 78,
        tarefasAtrasadas: 1,
        inadimplencia: 0,
        diasSemRegistro: 3,
      },
      avaliacaoMetas: av,
      saldoMidia: {
        contaId: 'c1',
        contaNome: 'Chalé Império da Serra',
        adAccountId: '878950454109782',
        adAccountNome: 'CA - Chalé',
        ativaNaMeta: true,
        modalidade: 'pre_pago',
        saldoDisponivel: 135.14,
        faturaAberta: null,
        textoFontePagamento: 'R$ 135,14',
        gastoMedioDiario: 48,
        diasRestantes: 2.8,
        nivel: 'critico',
        resumo: 'Crítico',
        verificadoEm: '2026-11-24T12:00:00Z',
      },
      tarefas: [
        {
          id: 't1',
          titulo: 'Subir criativo de Natal',
          detalhe: null,
          conta: 'Chalé Império da Serra',
          contaId: 'c1',
          status: 'aberta',
          responsavel: 'Angelo',
          responsavelId: 'p1',
          prazo: '2026-11-22',
          prioridade: 'alta',
          recorrencia: 'nenhuma',
          lembrarDias: 1,
          concluidaEm: null,
          diasAtePrazo: -2,
        },
      ],
      projetos: [
        {
          id: 'pr1',
          nome: 'Landing Page Inverno',
          tipo: 'lp',
          situacao: 'alteracao',
          cliente: 'Chalé Império da Serra',
          contaId: 'c1',
          responsavel: 'Angelo',
          responsavelId: 'p1',
          prazo: '2026-11-28',
          link: null,
          observacoes: null,
          entregueEm: null,
          diasNaSituacao: 3,
          diasAteOPrazo: 4,
          criadoEm: '2026-11-10T00:00:00Z',
        },
      ],
      integracoes: [
        {
          id: 'i1',
          provedor: 'meta_ads',
          identificador: '878950454109782',
          ativa: true,
          janelaDias: 7,
          temCredencial: true,
          ultimaSync: '2026-11-24T10:00:00Z',
          ultimaSyncOk: '2026-11-24T10:00:00Z',
          ultimoErro: null,
          estado: 'ok',
        },
      ],
      frescor: { ultimoDia: '2026-11-23', atrasoDias: 1, diasComDado30: 29, diasSemDado30: 1 },
      relatorios: [],
      hojeIso: '2026-11-24',
    });

    assert.equal(pendencias[0].id, 'saldo-midia');
    assert.equal(pendencias[0].nivel, 'urgente');
    assert.ok(pendencias.some((p) => p.id === 'tarefas-atrasadas'));
    assert.ok(pendencias.some((p) => p.id === 'projeto-agencia'));
    assert.ok(pendencias.some((p) => p.id === 'custo-acima-teto'));
  });

  test('resume meta de cliente de tráfego/WhatsApp na carteira sem dizer sem meta de venda', () => {
    const r = resumirMetaNaCarteira({
      id: 'c1',
      nome: 'Chalés Encantos',
      tipo: 'trafego',
      perfilMetrica: 'whatsapp',
      kpisVisiveis: null,
      segmento: 'Chalés',
      plataforma: null,
      situacao: 'saudavel',
      receita: 0,
      receitaAtribuida: 0,
      investimento: 400,
      conversas: 150,
      leadsCaptados: 0,
      comprasAtribuidas: 0,
      alcance: 50000,
      cliquesLink: 400,
      mer: null,
      metaAtingida: null,
      receitaMeta: 0,
      verbaMeta: 800,
      resultadoMeta: 200,
      custoResultadoTeto: 5,
      receitaDiaNecessaria: null,
      variacaoReceita: null,
      ultimoDia: '2026-11-23',
      responsavel: 'Angelo',
    });

    assert.equal(r.percentual, 75);
    assert.match(r.rotulo, /150\/200 conversas/);
  });
});
