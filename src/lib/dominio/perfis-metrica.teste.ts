import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolverPerfil,
  resolverJanelaPeriodo,
  agregarPeriodo,
  montarCartoesKpi,
  montarFunil,
  avaliarResultadoCampanha,
} from './perfis-metrica.ts';
import type { DiaKpi } from '../dados/tipos.ts';

const diaBase = (parcial: Partial<DiaKpi>): DiaKpi => ({
  dia: '2026-11-20',
  sessoes: 0,
  pedidosCaptados: 0,
  pedidosAprovados: 0,
  novosClientes: 0,
  receita: 0,
  receitaAtribuida: 0,
  investimento: 0,
  impressoes: 0,
  alcance: 0,
  cliques: 0,
  cliquesLink: 0,
  visitasPagina: 0,
  conversas: 0,
  leadsCaptados: 0,
  comprasAtribuidas: 0,
  carrinhos: 0,
  checkouts: 0,
  engajamentos: 0,
  visualizacoesVideo: 0,
  mer: null,
  ticketMedio: null,
  cac: null,
  taxaConversao: null,
  taxaAprovacao: null,
  ...parcial,
});

describe('Perfis de métricas por nicho', () => {
  test('automático usa ecommerce para loja online e whatsapp para tráfego/outro', () => {
    assert.equal(resolverPerfil('automatico', 'ecommerce'), 'ecommerce');
    assert.equal(resolverPerfil('automatico', 'trafego'), 'whatsapp');
    assert.equal(resolverPerfil('automatico', 'outro'), 'whatsapp');
    assert.equal(resolverPerfil('leads', 'ecommerce'), 'leads');
  });

  test('janela de período calcula período anterior com exatamente a mesma duração', () => {
    const j7 = resolverJanelaPeriodo({ periodo: '7d', hoje: '2026-11-23' });
    assert.equal(j7.de, '2026-11-16');
    assert.equal(j7.ate, '2026-11-22');
    assert.equal(j7.dias, 7);
    assert.equal(j7.anteriorDe, '2026-11-09');
    assert.equal(j7.anteriorAte, '2026-11-15');

    const mesAnt = resolverJanelaPeriodo({ periodo: 'mes_anterior', hoje: '2026-11-23' });
    assert.equal(mesAnt.de, '2026-10-01');
    assert.equal(mesAnt.ate, '2026-10-31');
    assert.equal(mesAnt.dias, 31);
  });

  test('agregação calcula custo por conversa, CPL e taxas pelos totais do período', () => {
    const r = agregarPeriodo([
      diaBase({ dia: '2026-11-20', investimento: 150, impressoes: 5000, alcance: 4000, cliquesLink: 100, visitasPagina: 80, conversas: 20, leadsCaptados: 10 }),
      diaBase({ dia: '2026-11-21', investimento: 250, impressoes: 5000, alcance: 4000, cliquesLink: 100, visitasPagina: 80, conversas: 30, leadsCaptados: 10 }),
    ]);

    assert.equal(r.investimento, 400);
    assert.equal(r.conversas, 50);
    assert.equal(r.custoConversa, 8);
    assert.equal(r.cpl, 20);
    assert.equal(r.ctr, 2);
    assert.equal(r.connectRate, 80);
  });

  test('perfil whatsapp monta KPIs de conversas e custo por conversa sem exibir receita de loja', () => {
    const atual = agregarPeriodo([
      diaBase({ investimento: 300, impressoes: 12000, alcance: 9000, cliquesLink: 240, conversas: 30 }),
    ]);
    const cartoes = montarCartoesKpi({ perfil: 'whatsapp', atual });
    const chaves = cartoes.map((c) => c.chave);
    assert.ok(chaves.includes('conversas'));
    assert.ok(chaves.includes('custo_conversa'));
    assert.ok(!chaves.includes('receita'));
    assert.ok(!chaves.includes('mer'));
  });

  test('funil de leads detecta queda forte entre clique e visita na LP', () => {
    const lento = agregarPeriodo([
      diaBase({ impressoes: 10000, cliquesLink: 200, visitasPagina: 90, leadsCaptados: 12, investimento: 240 }),
    ]);
    const funil = montarFunil('leads', lento);
    assert.ok(funil.alerta !== null);
  });

  test('avaliação de campanha formata custo certo para mensagens, leads e vendas', () => {
    const msg = avaliarResultadoCampanha({
      objetivo: 'mensagens',
      investimento: 200,
      impressoes: 8000,
      alcance: 6000,
      cliquesLink: 150,
      visitasPagina: 0,
      conversas: 40,
      leadsCaptados: 0,
      comprasAtribuidas: 0,
      receitaAtribuida: 0,
      engajamentos: 0,
      visualizacoesVideo: 0,
    });
    assert.equal(msg.unidade, 'conversas');
    assert.equal(msg.rotuloCusto, 'por conversa');
  });
});
