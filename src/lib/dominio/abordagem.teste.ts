import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  donoConhecido,
  primeiroNome,
  textoDaAbordagem,
  montarAbordagem,
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

/*
  A MENSAGEM DE ABERTURA

  O que se testa não é a copy, que muda toda semana, e sim o que a
  montagem não pode deixar acontecer com texto que vai para um cliente:
  gancho com o verbo em maiúsculo no meio da frase, parêntese de ficha
  no meio de uma conversa, bloco solto quando falta ingrediente, e o
  marcador do nome sumindo.
*/
describe('montarAbordagem', () => {
  const base = {
    marca: 'Vida Fit',
    gancho: 'Fabricam fitness e vendem 100% no atacado',
    segmento: 'Moda fitness',
  };

  test('o gancho vira fala, com Voces na frente e a inicial baixa', () => {
    const m = montarAbordagem(base);
    assert.match(m, /Vocês fabricam fitness e vendem 100% no atacado, e isso não se constrói/);
    assert.doesNotMatch(m, /Vocês Fabricam/);
  });

  test('o parentese da ficha nao entra na conversa', () => {
    const m = montarAbordagem({ ...base, segmento: 'Infantil (RN ao 16)' });
    assert.match(m, /marcas de destaque de infantil aqui da região/);
    assert.doesNotMatch(m, /RN ao 16/);
  });

  test('pede o responsavel e o contato, que e o objetivo da mensagem', () => {
    const m = montarAbordagem(base);
    assert.match(m, /Com quem eu consigo falar sobre novos projetos/);
    assert.match(m, /WhatsApp ou o e-mail do responsável/);
  });

  test('nao pede reuniao, nem call, nem quinze minutos', () => {
    const m = montarAbordagem(base).toLowerCase();
    for (const atrito of ['reunião', 'call', 'minutos', 'agenda']) {
      assert.ok(!m.includes(atrito), `a mensagem nao deveria falar em "${atrito}"`);
    }
  });

  test('guarda o marcador do nome, para a saudacao sair pontuada certo', () => {
    const m = montarAbordagem(base);
    assert.equal(textoDaAbordagem(m, 'Mirian Alves').split('\n')[0], 'Opa, Mirian, tudo bem?');
    assert.equal(textoDaAbordagem(m, null).split('\n')[0], 'Opa, tudo bem?');
  });

  test('quatro blocos, que e o que cabe na tela antes do olho desistir', () => {
    assert.equal(montarAbordagem(base).split('\n\n').length, 4);
  });

  test('sem gancho, o elogio vazio nao e inventado', () => {
    const m = montarAbordagem({ ...base, gancho: null });
    assert.doesNotMatch(m, /não se constrói da noite/);
    assert.match(m, /Parabéns pelo trabalho de vocês em Vida Fit!/);
    /* Continua valendo como mensagem: saudação, por que, e o pedido. */
    assert.equal(m.split('\n\n').length, 4);
  });

  test('sem ingrediente nenhum, ainda sai uma mensagem enviavel', () => {
    const m = montarAbordagem({ marca: null, gancho: null, segmento: null });
    assert.equal(m.split('\n\n').length, 3);
    assert.match(m, /Com quem eu consigo falar/);
    assert.doesNotMatch(m, /undefined|null/);
  });

  test('ponto final no gancho nao vira ponto duplicado no meio da frase', () => {
    const m = montarAbordagem({ ...base, gancho: 'Produzem tricot em Brusque.' });
    assert.match(m, /Vocês produzem tricot em Brusque, e isso não/);
  });
});
