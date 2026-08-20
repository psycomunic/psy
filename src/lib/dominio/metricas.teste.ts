import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  divisao,
  mer,
  cac,
  ticketMedio,
  taxaAprovacao,
  perdaNoPagamento,
  variacao,
  progressoMeta,
  saudeDaConta,
} from './metricas.ts';

/*
  Os testes cobrem os CASOS DE BORDA, e não o caminho feliz.

  Fórmula certa com número redondo passa em qualquer implementação. O
  que quebra painel em produção é divisão por zero, mês virando, conta
  nova sem histórico e a diferença entre "zero" e "não sei".
*/

describe('divisao', () => {
  test('divide normalmente', () => {
    assert.equal(divisao(10, 4), 2.5);
  });

  test('divisao por zero devolve null, e nao Infinity', () => {
    /* Infinity atravessa comparacao: `Infinity > meta` e true, e o
       numero chega na tela como "∞x". null obriga a decidir. */
    assert.equal(divisao(100, 0), null);
  });

  test('nao confunde zero com ausencia', () => {
    assert.equal(divisao(0, 10), 0);
  });
});

describe('MER', () => {
  test('receita sobre investimento', () => {
    assert.equal(mer(30000, 10000), 3);
  });

  test('sem investimento nao existe MER', () => {
    assert.equal(mer(5000, 0), null);
  });

  test('abaixo de 1 significa vender abaixo do custo de midia', () => {
    assert.equal(mer(800, 1000), 0.8);
  });
});

describe('CAC', () => {
  test('divide por cliente NOVO, e nao por pedido', () => {
    /* 100 pedidos, mas so 40 de gente nova: o CAC e 250, nao 100. */
    assert.equal(cac(10000, 40), 250);
  });

  test('sem cliente novo nao ha CAC', () => {
    assert.equal(cac(10000, 0), null);
  });
});

describe('ticket medio e aprovacao', () => {
  test('ticket usa pedido APROVADO', () => {
    assert.equal(ticketMedio(12000, 100), 120);
  });

  test('taxa de aprovacao em porcento', () => {
    assert.equal(taxaAprovacao(84, 100), 84);
  });

  test('perda no pagamento converte pedidos em reais', () => {
    const p = perdaNoPagamento(100, 84, 120);
    assert.equal(p.pedidos, 16);
    assert.equal(p.valor, 1920);
  });

  test('sem ticket nao inventa valor da perda', () => {
    const p = perdaNoPagamento(100, 84, null);
    assert.equal(p.pedidos, 16);
    assert.equal(p.valor, null);
  });

  test('aprovado maior que captado nao vira perda negativa', () => {
    /* Acontece de verdade: pedido de ontem aprovado hoje. */
    const p = perdaNoPagamento(80, 90, 100);
    assert.equal(p.pedidos, 0);
  });
});

describe('variacao', () => {
  test('queda vem negativa', () => {
    assert.equal(variacao(75, 100), -25);
  });

  test('sem base anterior nao ha variacao', () => {
    /* Conta nova: mostrar "+100%" ou "0%" seria inventar historia. */
    assert.equal(variacao(5000, 0), null);
  });
});

describe('progressoMeta', () => {
  test('sem meta definida nao calcula nada', () => {
    const m = progressoMeta(50000, null, 15, 31);
    assert.equal(m.atingido, null);
    assert.equal(m.emRisco, false);
  });

  test('meta zero nao quebra a divisao', () => {
    assert.equal(progressoMeta(1000, 0, 10, 30).atingido, null);
  });

  test('o dia corrente conta como disponivel', () => {
    /* Dia 20 de 30: restam 11 dias (20 a 30), e nao 10. As 9h do dia
       20 ainda da para vender. */
    const m = progressoMeta(0, 110000, 20, 30);
    assert.equal(m.porDia, 10000);
  });

  test('ultimo dia do mes nao divide por zero', () => {
    const m = progressoMeta(90000, 100000, 31, 31);
    assert.equal(m.porDia, 10000);
  });

  test('meta batida zera o que falta', () => {
    const m = progressoMeta(120000, 100000, 25, 30);
    assert.equal(m.falta, 0);
    assert.equal(m.porDia, 0);
    assert.equal(m.emRisco, false);
  });

  test('no dia 1 nao projeta', () => {
    /* Projetar o mes a partir de um dia so produz numero selvagem. */
    assert.equal(progressoMeta(3000, 100000, 1, 30).projecao, null);
  });

  test('projecao usa o ritmo dos dias corridos', () => {
    /* 45 mil em 15 dias = 3 mil/dia; em 30 dias fecha em 90 mil. */
    const m = progressoMeta(45000, 100000, 15, 30);
    assert.equal(m.projecao, 90000);
    assert.equal(m.emRisco, true);
  });

  test('ritmo suficiente nao acusa risco', () => {
    const m = progressoMeta(60000, 100000, 15, 30);
    assert.equal(m.projecao, 120000);
    assert.equal(m.emRisco, false);
  });
});

describe('saudeDaConta', () => {
  const base = {
    receita7: 70000,
    receita7Anterior: 70000,
    investimento7: 20000,
    diasSemDado: 0,
    metaAtingida: 90,
  };

  test('sem sincronizacao vem antes de tudo', () => {
    /* Mesmo com a receita despencando: antes de discutir performance,
       e preciso saber se o numero chegou. */
    const s = saudeDaConta({ ...base, receita7: 1000, diasSemDado: 5 });
    assert.equal(s.situacao, 'sem_dado');
  });

  test('nunca sincronizou tambem e sem dado', () => {
    assert.equal(saudeDaConta({ ...base, diasSemDado: null }).situacao, 'sem_dado');
  });

  test('queda acima de 25% e critico', () => {
    const s = saudeDaConta({ ...base, receita7: 50000, receita7Anterior: 100000 });
    assert.equal(s.situacao, 'critico');
  });

  test('MER abaixo de 1 e critico mesmo com receita estavel', () => {
    const s = saudeDaConta({ ...base, receita7: 18000, investimento7: 20000 });
    assert.equal(s.situacao, 'critico');
  });

  test('queda entre 10 e 25% e atencao', () => {
    const s = saudeDaConta({ ...base, receita7: 85000, receita7Anterior: 100000 });
    assert.equal(s.situacao, 'atencao');
  });

  test('meta abaixo de 70% e atencao', () => {
    assert.equal(saudeDaConta({ ...base, metaAtingida: 55 }).situacao, 'atencao');
  });

  test('tudo em ordem e saudavel', () => {
    assert.equal(saudeDaConta(base).situacao, 'saudavel');
  });

  test('sempre devolve um motivo em texto', () => {
    /* Selo vermelho sem explicacao obriga a abrir a conta para
       descobrir o que houve, que e o tempo que o alarme deveria
       economizar. */
    for (const s of [
      saudeDaConta(base),
      saudeDaConta({ ...base, diasSemDado: 9 }),
      saudeDaConta({ ...base, metaAtingida: 10 }),
    ]) {
      assert.ok(s.motivo.length > 10, `motivo curto demais: "${s.motivo}"`);
    }
  });
});
