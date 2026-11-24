import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  limparPhoneNumberId,
  normalizarNumeroWhatsapp,
  montarMensagemSaldoBaixo,
  montarParametroTemplateSaldo,
  montarRequisicaoGateway,
} from './formato.ts';

describe('WhatsApp Alertas de Saldo', () => {
  test('rejeita autofill não numérico em Phone Number ID e aceita ID numérico da Meta', () => {
    assert.equal(limparPhoneNumberId('Principal'), null);
    assert.equal(limparPhoneNumberId('+55 48 93618-3947'), null);
    assert.equal(limparPhoneNumberId(' 1201735229697128 '), '1201735229697128');
  });

  test('formata parâmetro de template sem quebras de linha proibidas pela Meta', () => {
    const param = montarParametroTemplateSaldo([
      {
        contaId: 'c1',
        contaNome: 'Chalé Império da Serra\nTeste',
        adAccountId: '878950454109782',
        adAccountNome: 'CA - Chalé Império da Serra',
        ativaNaMeta: true,
        modalidade: 'pre_pago',
        saldoDisponivel: 135.14,
        faturaAberta: null,
        textoFontePagamento: 'Saldo disponível (R$135,14 BRL)',
        gastoMedioDiario: 48.2,
        diasRestantes: 2.8,
        nivel: 'critico',
        resumo: 'Dura cerca de 2,8 dias',
        verificadoEm: '2026-11-24T12:00:00Z',
      },
    ]);
    assert.equal(/[\r\n\t]/.test(param), false);
    assert.match(param, /135,14/);
    assert.match(param, /2,8 dias/);
  });

  test('normaliza número brasileiro com ou sem DDI 55', () => {
    assert.equal(normalizarNumeroWhatsapp('47992406661'), '5547992406661');
    assert.equal(normalizarNumeroWhatsapp('(47) 99240-6661'), '5547992406661');
    assert.equal(normalizarNumeroWhatsapp('+55 47 99240-6661'), '5547992406661');
    assert.equal(normalizarNumeroWhatsapp(''), '5547992406661');
  });

  test('monta resumo consolidado de saldo baixo com autonomia em dias', () => {
    const msg = montarMensagemSaldoBaixo([
      {
        contaId: 'c1',
        contaNome: 'Chalé Império da Serra',
        adAccountId: '878950454109782',
        adAccountNome: 'CA - Chalé Império da Serra',
        ativaNaMeta: true,
        modalidade: 'pre_pago',
        saldoDisponivel: 135.14,
        faturaAberta: null,
        textoFontePagamento: 'Saldo disponível (R$135,14 BRL)',
        gastoMedioDiario: 48.2,
        diasRestantes: 2.8,
        nivel: 'critico',
        resumo: 'Dura cerca de 2,8 dias',
        verificadoEm: '2026-11-24T12:00:00Z',
      },
    ]);

    assert.match(msg, /Alerta de Saldo Baixo/);
    assert.match(msg, /Chalé Império da Serra/);
    assert.match(msg, /135,14/);
    assert.match(msg, /2,8 dias/);
  });

  test('formata payload da Opção B para Z-API, Evolution API e Webhook universal', () => {
    const zapi = montarRequisicaoGateway({
      url: 'https://api.z-api.io/instances/X/token/Y/send-text',
      token: 'segredo-z',
      numero: '5547992406661',
      texto: 'Teste',
    });
    assert.equal(zapi.headers['Client-Token'], 'segredo-z');
    assert.equal(zapi.body.phone, '5547992406661');

    const evo = montarRequisicaoGateway({
      url: 'https://evo.exemplo.com/message/sendText/psy',
      token: 'evo-key',
      numero: '5547992406661',
      texto: 'Teste',
    });
    assert.equal(evo.headers.apikey, 'evo-key');
    assert.equal(evo.body.number, '5547992406661');
  });
});
