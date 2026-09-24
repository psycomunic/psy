import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  donoConhecido,
  partesDaAbordagem,
  primeiroNome,
  textoDaAbordagem,
} from './abordagem.ts';

/*
  O que se testa aqui é a PONTUAÇÃO e o "não sei ainda".

  A mensagem vai para o Instagram de uma pessoa. "Oi , tudo bem?" e
  "Oi, @atacadaodasmalhas, tudo bem?" são os dois jeitos de essa
  abordagem morrer na primeira linha, e os dois saem de uma troca de
  marcador feita sem cuidado.
*/

describe('donoConhecido', () => {
  test('nome de verdade passa', () => {
    assert.equal(donoConhecido('Mirian Alves Maia', '@atacadaodasmalhas'), 'Mirian Alves Maia');
  });

  test('o @ da marca NAO e nome de dono: e o que a carga poe quando nao sabe', () => {
    assert.equal(donoConhecido('@atacadaodasmalhas', '@atacadaodasmalhas'), null);
  });

  test('qualquer arroba tambem nao serve, mesmo diferente do da marca', () => {
    assert.equal(donoConhecido('@outraconta', '@atacadaodasmalhas'), null);
  });

  test('vazio, espaco e ausente valem o mesmo: nao sei', () => {
    assert.equal(donoConhecido('', '@m'), null);
    assert.equal(donoConhecido('   ', '@m'), null);
    assert.equal(donoConhecido(null, '@m'), null);
    assert.equal(donoConhecido(undefined, undefined), null);
  });
});

describe('primeiroNome', () => {
  test('so o primeiro', () => {
    assert.equal(primeiroNome('Mirian Alves Maia'), 'Mirian');
  });

  test('nome de uma palavra continua inteiro', () => {
    assert.equal(primeiroNome('Mirian'), 'Mirian');
  });

  test('espaco sobrando nao vira nome vazio', () => {
    assert.equal(primeiroNome('  Mirian   Alves '), 'Mirian');
  });
});

describe('textoDaAbordagem', () => {
  const modelo = 'Oi{dono}, tudo bem? Aqui é da Psy Comunic.';

  test('com nome, o vocativo entra pontuado', () => {
    assert.equal(
      textoDaAbordagem(modelo, 'Mirian Alves Maia'),
      'Oi, Mirian, tudo bem? Aqui é da Psy Comunic.',
    );
  });

  test('sem nome, sobra uma frase inteira, e nao um buraco', () => {
    assert.equal(textoDaAbordagem(modelo, null), 'Oi, tudo bem? Aqui é da Psy Comunic.');
    assert.equal(textoDaAbordagem(modelo, '   '), 'Oi, tudo bem? Aqui é da Psy Comunic.');
  });

  test('texto sem marcador passa intacto', () => {
    const pergunta = 'Posso te perguntar uma coisa?';
    assert.equal(textoDaAbordagem(pergunta, 'Mirian'), pergunta);
    assert.equal(textoDaAbordagem(pergunta, null), pergunta);
  });

  test('sem texto devolve string vazia, e nao "undefined" na tela', () => {
    assert.equal(textoDaAbordagem(null, 'Mirian'), '');
    assert.equal(textoDaAbordagem(undefined, null), '');
  });
});

describe('partesDaAbordagem', () => {
  test('quebra na linha em branco, e ja com o nome trocado', () => {
    assert.deepEqual(
      partesDaAbordagem('Oi{dono}, tudo bem?\n\nAqui é da Psy Comunic.\n\nFaz sentido?', 'Mirian Alves'),
      ['Oi, Mirian, tudo bem?', 'Aqui é da Psy Comunic.', 'Faz sentido?'],
    );
  });

  test('sem linha em branco, uma parte so: e o caso da pergunta de seguimento', () => {
    assert.deepEqual(partesDaAbordagem('Uma pergunta unica.', null), ['Uma pergunta unica.']);
  });

  test('linha em branco com espacos tambem separa, e nao vira parte vazia', () => {
    assert.deepEqual(partesDaAbordagem('Um.\n   \nDois.\n\n\nTres.', null), ['Um.', 'Dois.', 'Tres.']);
  });

  test('sem texto, lista vazia: a tela nao pinta um cartao de nada', () => {
    assert.deepEqual(partesDaAbordagem(null, 'Mirian'), []);
    assert.deepEqual(partesDaAbordagem('   ', null), []);
  });
});
