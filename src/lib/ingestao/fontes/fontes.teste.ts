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
import {
  mapear as mapearMeta,
  mapearCampanhas as mapearCampanhasMeta,
  receitaDeCompra,
} from './meta.ts';
import {
  mapearAds,
  mapearCampanhasAds,
  mapearGa4,
  canalDoGa4,
  diaDoGa4,
} from './google.ts';
import {
  mapear as mapearHospedi,
  localizarPerfilHospedi,
  diaBrasiliaDeIso,
} from './hospedi.ts';

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

  test('extrai conversas de WhatsApp, leads, cliques no link e alcance sem duplicar', () => {
    const pacote = {
      conta: {
        data: [
          {
            date_start: '2026-11-20',
            spend: '320.50',
            impressions: '18400',
            reach: '12100',
            clicks: '540',
            inline_link_clicks: '310',
            actions: [
              { action_type: 'onsite_conversion.messaging_conversation_started_7d', value: '42' },
              { action_type: 'onsite_conversion.total_messaging_connection', value: '55' },
              { action_type: 'lead', value: '9' },
              { action_type: 'offsite_conversion.fb_pixel_lead', value: '9' },
              { action_type: 'landing_page_view', value: '240' },
              { action_type: 'video_thruplay_watched_actions', value: '1900' },
            ],
          },
        ],
      },
      campanhas: {
        data: [
          {
            date_start: '2026-11-20',
            campaign_id: 'cmp_1',
            campaign_name: '[WPP] Reservas Fim de Semana',
            objective: 'OUTCOME_ENGAGEMENT',
            spend: '220.50',
            impressions: '10400',
            reach: '8200',
            clicks: '410',
            inline_link_clicks: '260',
            actions: [
              { action_type: 'onsite_conversion.messaging_conversation_started_7d', value: '42' },
            ],
          },
          {
            date_start: '2026-11-20',
            campaign_id: 'cmp_2',
            campaign_name: '[Reels] Institucional Chalé',
            objective: 'OUTCOME_AWARENESS',
            spend: '100.00',
            impressions: '8000',
            reach: '6500',
            clicks: '130',
            inline_link_clicks: '50',
          },
        ],
      },
    };

    const conta = mapearMeta(pacote);
    assert.equal(conta.length, 1);
    assert.equal(conta[0].alcance, 12100);
    assert.equal(conta[0].cliques_link, 310);
    assert.equal(conta[0].conversas, 42);
    assert.equal(conta[0].leads_captados, 9);
    assert.equal(conta[0].visitas_pagina, 240);
    assert.equal(conta[0].visualizacoes_video, 1900);

    const camps = mapearCampanhasMeta(pacote);
    assert.equal(camps.length, 2);
    assert.equal(camps[0].objetivo, 'mensagens');
    assert.equal(camps[0].conversas, 42);
    assert.equal(camps[1].objetivo, 'alcance');
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

  test('mapeia campanhas do Google Ads separando vendas e captação de leads', () => {
    const pacote = {
      campanhas: [
        {
          results: [
            {
              segments: { date: '2026-11-20' },
              campaign: {
                id: '9001',
                name: 'Search - Captação de Leads B2B',
                status: 'ENABLED',
                advertisingChannelType: 'SEARCH',
              },
              metrics: {
                costMicros: '450000000',
                clicks: '180',
                impressions: '2100',
                conversions: '15',
                conversionsValue: '0',
              },
            },
          ],
        },
      ],
    };
    const camps = mapearCampanhasAds(pacote);
    assert.equal(camps.length, 1);
    assert.equal(camps[0].objetivo, 'leads');
    assert.equal(camps[0].leads_captados, 15);
    assert.equal(camps[0].investimento, 450);
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

describe('Hospedi', () => {
  test('converte timestamp UTC para a data de Brasília', () => {
    /* 01:30 UTC de 21/11 ainda é 22:30 de 20/11 em Brasília (-03:00). */
    assert.equal(diaBrasiliaDeIso('2026-11-21T01:30:00.000Z'), '2026-11-20');
    assert.equal(diaBrasiliaDeIso('2026-11-21T15:00:00.000Z'), '2026-11-21');
  });

  test('localiza o chalé por nome fantasia sem acento, por e-mail ou por "propria"', () => {
    const perfis = [
      { id: 'u-admin', name: 'Admin', role: 'admin', email: 'admin@hospedi.app' },
      {
        id: 'u-chale',
        name: 'Proprietário',
        company_name: 'Chalés Encantos da Natureza',
        email: 'contato@encantos.com.br',
        role: 'client',
      },
      {
        id: 'u-outro',
        name: 'Outro',
        company_name: 'Cabana da Serra',
        email: 'serra@cabana.com.br',
        role: 'client',
      },
    ];

    assert.equal(
      localizarPerfilHospedi(perfis, 'u-admin', 'Chales Encantos da Natureza').id,
      'u-chale',
    );
    assert.equal(
      localizarPerfilHospedi(perfis, 'u-admin', 'encantos da natureza').id,
      'u-chale',
    );
    assert.equal(
      localizarPerfilHospedi(perfis, 'u-admin', 'contato@encantos.com.br').id,
      'u-chale',
    );
    assert.equal(
      localizarPerfilHospedi([perfis[1]], 'u-chale', 'propria').id,
      'u-chale',
    );
  });

  test('separa reservas diretas e OTAs, ignora canceladas e zera dias sem reserva na janela', () => {
    const bruto = {
      clienteId: 'u-chale',
      clienteNome: 'Chalés Encantos da Natureza',
      reservas: [
        {
          id: 'r1',
          created_at: '2026-11-20T14:00:00-03:00',
          status: 'confirmed',
          gross_value: 1850.5,
          channel: 'direct',
          guest_phone: '47999991111',
        },
        {
          id: 'r2',
          created_at: '2026-11-20T19:00:00-03:00',
          status: 'confirmed',
          gross_value: 1200,
          channel: 'direct',
          guest_phone: '47999992222',
        },
        {
          id: 'r3',
          created_at: '2026-11-20T21:00:00-03:00',
          status: 'confirmed',
          gross_value: 2100,
          channel: 'airbnb',
          guest_id: 'g-airbnb',
        },
        {
          id: 'r4',
          created_at: '2026-11-21T10:00:00-03:00',
          status: 'cancelled',
          gross_value: 3000,
          channel: 'direct',
          guest_id: 'g-cancel',
        },
      ],
    };

    const linhas = mapearHospedi(bruto, '2026-11-20', '2026-11-21');
    /* 2 dias × 2 canais (`hospedi_direto` e `hospedi_ota`) = 4 linhas */
    assert.equal(linhas.length, 4);

    const d20Direto = linhas.find((l) => l.dia === '2026-11-20' && l.canal === 'hospedi_direto');
    assert.equal(d20Direto?.pedidos_aprovados, 2);
    assert.equal(d20Direto?.receita, 3050.5);
    assert.equal(d20Direto?.novos_clientes, 2);

    const d20Ota = linhas.find((l) => l.dia === '2026-11-20' && l.canal === 'hospedi_ota');
    assert.equal(d20Ota?.pedidos_aprovados, 1);
    assert.equal(d20Ota?.receita, 2100);

    /* Dia 21 só teve reserva cancelada -> permanece zerado para limpar eventual saldo antigo */
    const d21Direto = linhas.find((l) => l.dia === '2026-11-21' && l.canal === 'hospedi_direto');
    assert.equal(d21Direto?.pedidos_aprovados, 0);
    assert.equal(d21Direto?.receita, 0);
  });
});
