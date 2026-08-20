/**
 * Testes do leitor de planilha.
 *
 * Só caso de borda: o caminho feliz quebra alto e cedo, e teste de
 * caminho feliz só custa tempo de quem lê. O que quebra em silêncio é
 * planilha exportada de Excel em português, número com vírgula, linha
 * repetida por campanha e data ambígua — é isso que está aqui.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  lerPlanilha,
  agrupar,
  paraDia,
  separadorDe,
  partirLinha,
  normalizar,
} from './csv.ts';

describe('paraDia', () => {
  test('aceita dd/mm/aaaa e aaaa-mm-dd', () => {
    assert.equal(paraDia('05/03/2026'), '2026-03-05');
    assert.equal(paraDia('2026-03-05'), '2026-03-05');
    assert.equal(paraDia('5/3/2026'), '2026-03-05');
  });

  test('31 de fevereiro é recusado, e não vira 3 de março', () => {
    assert.equal(paraDia('31/02/2026'), null);
  });

  test('30/02 num ano bissexto continua inválido', () => {
    assert.equal(paraDia('30/02/2024'), null);
    assert.equal(paraDia('29/02/2024'), '2024-02-29');
    assert.equal(paraDia('29/02/2026'), null);
  });

  test('data ambígua é sempre lida como brasileira', () => {
    /* 03/04 é 3 de abril, sempre, e nunca 4 de março. Adivinhar a
       origem do arquivo erraria em dois terços dos dias do ano de um
       jeito que ninguém percebe. */
    assert.equal(paraDia('03/04/2026'), '2026-04-03');
    assert.equal(paraDia('13/04/2026'), '2026-04-13');

    /* 04/13/2026 é o mesmo dia escrito à americana, e cai: mês 13 não
       existe. Não convertemos, recusamos. */
    assert.equal(paraDia('04/13/2026'), null);
  });

  test('lixo vira null', () => {
    assert.equal(paraDia(''), null);
    assert.equal(paraDia('ontem'), null);
    assert.equal(paraDia('05-03-2026'), null);
  });
});

describe('separadorDe', () => {
  test('Excel em português usa ponto e vírgula', () => {
    assert.equal(separadorDe('dia;receita;investimento'), ';');
  });

  test('CSV internacional usa vírgula', () => {
    assert.equal(separadorDe('dia,receita,investimento'), ',');
  });

  test('empate cai em ponto e vírgula, que é o caso local', () => {
    assert.equal(separadorDe('dia;receita,liquida'), ';');
  });
});

describe('partirLinha', () => {
  test('vírgula dentro de aspas não quebra a coluna', () => {
    assert.deepEqual(
      partirLinha('2026-03-05,"Loja, matriz",1500', ','),
      ['2026-03-05', 'Loja, matriz', '1500'],
    );
  });

  test('aspas duplicadas viram uma aspa', () => {
    assert.deepEqual(partirLinha('a,"diz ""oi""",b', ','), ['a', 'diz "oi"', 'b']);
  });

  test('campo vazio no fim continua existindo', () => {
    assert.deepEqual(partirLinha('a;b;', ';'), ['a', 'b', '']);
  });
});

describe('normalizar', () => {
  test('acento e maiúscula não fazem diferença', () => {
    assert.equal(normalizar('Impressões'), 'impressoes');
    assert.equal(normalizar('  Receita Aprovada '), 'receita_aprovada');
    assert.equal(normalizar('Novos-Clientes'), 'novos_clientes');
  });
});

describe('lerPlanilha', () => {
  test('planilha de Excel em português, com vírgula decimal', () => {
    const csv = [
      'Data;Receita;Pedidos aprovados',
      '05/03/2026;12.480,50;37',
      '06/03/2026;9.310,00;28',
    ].join('\n');

    const r = lerPlanilha(csv, 'planilha_loja');

    assert.equal(r.erros.length, 0);
    assert.equal(r.linhas.length, 2);
    assert.equal(r.linhas[0].receita, 12480.5);
    assert.equal(r.linhas[0].pedidos_aprovados, 37);
    assert.equal(r.linhas[1].receita, 9310);
  });

  test('milhar sem decimal não vira número mil vezes menor', () => {
    /* "320.000" já entrou uma vez como 320 numa meta, e a meta ficou
       mil vezes menor sem ninguém notar. Aqui seria a receita do dia. */
    const r = lerPlanilha('dia;receita\n05/03/2026;320.000', 'planilha_loja');
    assert.equal(r.linhas[0].receita, 320000);
  });

  test('BOM do Excel não esconde a coluna de data', () => {
    const bom = String.fromCharCode(0xfeff);
    const r = lerPlanilha(`${bom}dia;receita\n05/03/2026;100`, 'planilha_loja');
    assert.equal(r.erros.length, 0);
    assert.equal(r.linhas.length, 1);
  });

  test('quebra de linha do Windows não deixa \\r grudado no último campo', () => {
    const r = lerPlanilha('dia;receita\r\n05/03/2026;100\r\n', 'planilha_loja');
    assert.equal(r.erros.length, 0);
    assert.equal(r.linhas[0].receita, 100);
  });

  test('linha ilegível vira erro com o número da linha, e não some', () => {
    const csv = [
      'dia;receita',
      '05/03/2026;100',
      '32/03/2026;200',
      '07/03/2026;abc',
      '08/03/2026;300',
    ].join('\n');

    const r = lerPlanilha(csv, 'planilha_loja');

    assert.equal(r.linhas.length, 2);
    assert.equal(r.erros.length, 2);
    assert.deepEqual(r.erros.map((e) => e.linha), [3, 4]);
  });

  test('valor negativo é recusado', () => {
    const r = lerPlanilha('dia;investimento;canal\n05/03/2026;-50;google', 'planilha_midia');
    assert.equal(r.linhas.length, 0);
    assert.match(r.erros[0].motivo, /negativo/i);
  });

  test('sem coluna de data, nada entra', () => {
    const r = lerPlanilha('receita;pedidos\n100;3', 'planilha_loja');
    assert.equal(r.linhas.length, 0);
    assert.match(r.erros[0].motivo, /data/i);
  });

  test('coluna de valor nenhuma reconhecida também para tudo', () => {
    const r = lerPlanilha('dia;xpto\n05/03/2026;3', 'planilha_loja');
    assert.equal(r.linhas.length, 0);
    assert.match(r.erros[0].motivo, /valor/i);
  });

  test('coluna desconhecida é reportada, não ignorada em silêncio', () => {
    const r = lerPlanilha('dia;receita;margem\n05/03/2026;100;20', 'planilha_loja');
    assert.deepEqual(r.ignoradas, ['margem']);
    assert.equal(r.linhas.length, 1);
  });

  test('mídia sem canal é recusada: verba sem destino não responde nada', () => {
    const r = lerPlanilha('dia;investimento\n05/03/2026;500', 'planilha_midia');
    assert.equal(r.linhas.length, 0);
    assert.match(r.erros[0].motivo, /canal/i);
  });

  test('loja sem canal passa: o canal padrão é a própria loja', () => {
    const r = lerPlanilha('dia;receita\n05/03/2026;500', 'planilha_loja');
    assert.equal(r.linhas.length, 1);
    assert.equal(r.linhas[0].canal, undefined);
  });

  test('célula vazia não vira zero', () => {
    /* Zero e "não informado" são coisas diferentes: zero significa que
       não gastou, e sobrescrever com zero apagaria o que outra fonte
       já tinha gravado naquele dia. */
    const r = lerPlanilha('dia;receita;cliques\n05/03/2026;100;', 'planilha_loja');
    assert.equal(r.linhas[0].receita, 100);
    assert.equal(r.linhas[0].cliques, undefined);
  });

  test('linha em branco no meio não vira erro', () => {
    const r = lerPlanilha('dia;receita\n05/03/2026;100\n\n06/03/2026;200\n', 'planilha_loja');
    assert.equal(r.erros.length, 0);
    assert.equal(r.linhas.length, 2);
  });

  test('arquivo vazio devolve erro, e não silêncio', () => {
    const r = lerPlanilha('   \n\n', 'planilha_loja');
    assert.equal(r.linhas.length, 0);
    assert.equal(r.erros.length, 1);
  });
});

describe('agrupar', () => {
  test('linhas por campanha somam em vez de uma sobrescrever a outra', () => {
    /* Sem isto, o `on conflict` do banco guardaria só a última campanha
       do dia e a verba apareceria menor do que foi gasta. */
    const somado = agrupar([
      { dia: '2026-03-05', canal: 'google', investimento: 300, cliques: 40 },
      { dia: '2026-03-05', canal: 'google', investimento: 200, cliques: 25 },
      { dia: '2026-03-05', canal: 'meta', investimento: 150 },
    ]);

    assert.equal(somado.length, 2);
    const google = somado.find((l) => l.canal === 'google')!;
    assert.equal(google.investimento, 500);
    assert.equal(google.cliques, 65);
  });

  test('dias diferentes não se misturam, e saem em ordem', () => {
    const r = agrupar([
      { dia: '2026-03-07', receita: 10 },
      { dia: '2026-03-05', receita: 20 },
    ]);
    assert.deepEqual(r.map((l) => l.dia), ['2026-03-05', '2026-03-07']);
  });

  test('soma de centavos não escorrega em ponto flutuante', () => {
    const r = agrupar([
      { dia: '2026-03-05', canal: 'google', investimento: 0.1 },
      { dia: '2026-03-05', canal: 'google', investimento: 0.2 },
    ]);
    assert.equal(r[0].investimento, 0.3);
  });
});
