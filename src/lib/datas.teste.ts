import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { hojeBR, somarDias, janela } from './datas.ts';

describe('hojeBR', () => {
  test('às 21h de Brasília ainda é hoje, e não amanhã', () => {
    /* 2026-08-20T00:30Z é 2026-08-19 21:30 em São Paulo. O
       toISOString() cru diria 20, e a rotina pediria à API um dia que
       ainda não terminou. */
    assert.equal(hojeBR(new Date('2026-08-20T00:30:00Z')), '2026-08-19');
  });

  test('às 3h01 UTC já virou o dia no Brasil', () => {
    assert.equal(hojeBR(new Date('2026-08-20T03:01:00Z')), '2026-08-20');
  });

  test('às 2h59 UTC ainda é o dia anterior', () => {
    assert.equal(hojeBR(new Date('2026-08-20T02:59:00Z')), '2026-08-19');
  });

  test('meio-dia UTC não tem ambiguidade', () => {
    assert.equal(hojeBR(new Date('2026-08-20T12:00:00Z')), '2026-08-20');
  });
});

describe('somarDias', () => {
  test('atravessa a virada de mês', () => {
    assert.equal(somarDias('2026-08-31', 1), '2026-09-01');
    assert.equal(somarDias('2026-09-01', -1), '2026-08-31');
  });

  test('atravessa a virada de ano', () => {
    assert.equal(somarDias('2026-12-31', 1), '2027-01-01');
  });

  test('fevereiro de ano bissexto tem 29', () => {
    assert.equal(somarDias('2024-02-28', 1), '2024-02-29');
    assert.equal(somarDias('2026-02-28', 1), '2026-03-01');
  });

  test('zero não muda nada', () => {
    assert.equal(somarDias('2026-08-19', 0), '2026-08-19');
  });
});

describe('janela', () => {
  const agora = new Date('2026-08-20T12:00:00Z'); // 09:00 em São Paulo

  test('termina ONTEM: dia pela metade desenha queda que não existe', () => {
    assert.equal(janela(7, agora).ate, '2026-08-19');
  });

  test('7 dias são sete dias, contando as duas pontas', () => {
    const { de, ate } = janela(7, agora);
    assert.equal(de, '2026-08-13');
    assert.equal(ate, '2026-08-19');
  });

  test('janela de 1 dia é só ontem', () => {
    const { de, ate } = janela(1, agora);
    assert.equal(de, ate);
    assert.equal(de, '2026-08-19');
  });

  test('janela de zero ou negativa vira 1, e nunca um intervalo invertido', () => {
    const { de, ate } = janela(0, agora);
    assert.equal(de, '2026-08-19');
    assert.equal(ate, '2026-08-19');
    assert.ok(de <= ate);
  });

  test('a janela nunca inclui hoje', () => {
    for (const d of [1, 7, 30, 90]) {
      assert.ok(janela(d, agora).ate < hojeBR(agora));
    }
  });
});
