/**
 * Testes dos mapeamentos das APIs.
 *
 * As respostas abaixo são reproduções do formato documentado de cada
 * API, e não capturas reais — a agência ainda não conectou nenhuma
 * conta. Isso limita o que estes testes provam: eles garantem que o
 * mapeamento está certo PARA ESTE FORMATO, e não que o formato é este.
 *
 * O que eles pegam de verdade, e que é a maior parte dos erros:
 * número que chega como texto, micros dividido errado, canal que não
 * bate entre duas fontes, dia em formato próprio, e campo de conversão
 * somado duas vezes.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { mapear as mapearMeta, receitaDeCompra } from './meta.ts';
import { mapearAds, mapearGa4, canalDoGa4, diaDoGa4 } from './google.ts';

describe('Meta', () => {
  const resposta = {
    data: [
      {
        date_start: '2026-08-18',
        date_stop: '2026-08-18',
        spend: '1450.75',
        impressions: '98432',
        clicks: '1204',
        action_values: [
          { action_type: 'landing_page_view', value: '0' },
          { action_type: 'omni_purchase', value: '8320.40' },
          { action_type: 'purchase', value: '8320.40' },
        ],
      },
      {
        date_start: '2026-08-19',
        date_stop: '2026-08-19',
        spend: '1610.00',
        impressions: '101250',
        clicks: '1330',
        action_values: [{ action_type: 'omni_purchase', value: '9105.10' }],
      },
    ],
  };

  test('número chega como texto e vira número', () => {
    const l = mapearMeta(resposta);
    assert.equal(l[0].investimento, 1450.75);
    assert.equal(l[0].cliques, 1204);
    assert.equal(l[0].impressoes, 98432);
  });

  test('canal é meta, para bater com o que o painel espera', () => {
    assert.equal(mapearMeta(resposta)[0].canal, 'meta');
  });

  test('a compra NÃO é contada duas vezes', () => {
    /* omni_purchase e purchase descrevem a mesma venda. Somar a lista
       inteira dobraria o ROAS declarado da conta. */
    assert.equal(mapearMeta(resposta)[0].receita_atribuida, 8320.4);
  });

  test('sem conversão nenhuma, receita atribuída é zero e não indefinida', () => {
    const l = mapearMeta({ data: [{ date_start: '2026-08-19', spend: '10' }] });
    assert.equal(l[0].receita_atribuida, 0);
  });

  test('linha sem data é descartada, e não vira dia inventado', () => {
    const l = mapearMeta({ data: [{ spend: '999' }, { date_start: '2026-08-19', spend: '10' }] });
    assert.equal(l.length, 1);
    assert.equal(l[0].dia, '2026-08-19');
  });

  test('resposta vazia ou fora do formato devolve lista vazia', () => {
    assert.deepEqual(mapearMeta({ data: [] }), []);
    assert.deepEqual(mapearMeta({}), []);
    assert.deepEqual(mapearMeta(null), []);
    assert.deepEqual(mapearMeta({ data: 'nao é lista' }), []);
  });

  test('a ordem de preferência da conversão é respeitada', () => {
    assert.equal(
      receitaDeCompra([
        { action_type: 'offsite_conversion.fb_pixel_purchase', value: '100' },
        { action_type: 'omni_purchase', value: '250' },
      ]),
      250,
    );
    assert.equal(
      receitaDeCompra([{ action_type: 'offsite_conversion.fb_pixel_purchase', value: '100' }]),
      100,
    );
  });

  test('valor negativo não passa', () => {
    const l = mapearMeta({ data: [{ date_start: '2026-08-19', spend: '-50' }] });
    assert.equal(l[0].investimento, 0);
  });
});

describe('Google Ads', () => {
  const resposta = [
    {
      results: [
        {
          segments: { date: '2026-08-18' },
          metrics: {
            costMicros: '2340560000',
            clicks: '1890',
            impressions: '145300',
            conversionsValue: '11240.5',
          },
        },
        {
          segments: { date: '2026-08-19' },
          metrics: { costMicros: '1980000000', clicks: '1600', impressions: '132000' },
        },
      ],
    },
  ];

  test('micros vira reais: 2.340.560.000 micros são R$ 2.340,56', () => {
    /* Dividir errado aqui erra a verba por um fator de um milhão, e o
       MER da conta iria para zero sem explicação nenhuma na tela. */
    assert.equal(mapearAds(resposta)[0].investimento, 2340.56);
  });

  test('canal é google, e é o mesmo nome que o GA4 usa para Paid Search', () => {
    assert.equal(mapearAds(resposta)[0].canal, 'google');
    assert.equal(canalDoGa4('Paid Search'), 'google');
  });

  test('métrica ausente vira zero em vez de derrubar o mapeamento', () => {
    const l = mapearAds(resposta);
    assert.equal(l[1].receita_atribuida, 0);
    assert.equal(l[1].investimento, 1980);
  });

  test('aceita tanto o array do searchStream quanto o objeto único', () => {
    const único = { results: resposta[0].results };
    assert.equal(mapearAds(único).length, 2);
    assert.equal(mapearAds(resposta).length, 2);
  });

  test('resposta de erro não vira linha', () => {
    assert.deepEqual(mapearAds([{ error: { message: 'sem permissão' } }]), []);
    assert.deepEqual(mapearAds(null), []);
  });
});

describe('GA4', () => {
  const resposta = {
    rows: [
      {
        dimensionValues: [{ value: '20260818' }, { value: 'Organic Search' }],
        metricValues: [{ value: '3420' }],
      },
      {
        dimensionValues: [{ value: '20260818' }, { value: 'Paid Search' }],
        metricValues: [{ value: '1810' }],
      },
      {
        dimensionValues: [{ value: '20260818' }, { value: 'Cross-network' }],
        metricValues: [{ value: '640' }],
      },
      {
        dimensionValues: [{ value: '20260819' }, { value: 'Direct' }],
        metricValues: [{ value: '2100' }],
      },
    ],
  };

  test('a data de oito dígitos vira aaaa-mm-dd', () => {
    assert.equal(diaDoGa4('20260819'), '2026-08-19');
    assert.equal(diaDoGa4('2026-08-19'), null);
    assert.equal(diaDoGa4(''), null);
  });

  test('dois canais do GA4 que viram o mesmo canal nosso SOMAM', () => {
    /* "Paid Search" e "Cross-network" viram os dois `google`. Sem a
       soma, o segundo sobrescreveria o primeiro na gravação e a
       sessão de uma campanha inteira sumiria. */
    const l = mapearGa4(resposta);
    const google = l.find((x) => x.dia === '2026-08-18' && x.canal === 'google');
    assert.equal(google?.sessoes, 1810 + 640);
  });

  test('canal desconhecido vira apelido legível em vez de sumir', () => {
    assert.equal(canalDoGa4('Audio Something'), 'audio_something');
    assert.equal(canalDoGa4('  '), 'nao_atribuido');
  });

  test('sai em ordem de dia', () => {
    assert.deepEqual(
      [...new Set(mapearGa4(resposta).map((l) => l.dia))],
      ['2026-08-18', '2026-08-19'],
    );
  });

  test('GA4 grava sessão, e mais nada', () => {
    /* Se ele gravasse receita ou verba, sobrescreveria o que a loja e a
       plataforma de mídia gravaram na mesma linha. */
    const l = mapearGa4(resposta)[0];
    assert.equal(l.receita, undefined);
    assert.equal(l.investimento, undefined);
    assert.equal(l.receita_atribuida, undefined);
  });

  test('resposta sem linhas devolve lista vazia', () => {
    assert.deepEqual(mapearGa4({}), []);
    assert.deepEqual(mapearGa4({ rows: [] }), []);
  });
});
