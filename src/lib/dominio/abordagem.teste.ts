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
  /* A quebra numa constante: escrever '\n' dentro deste arquivo por
     script ja virou literal de verdade duas vezes. */
  const QUEBRA = String.fromCharCode(10);

  test('pede o responsavel e o contato, que e o objetivo da mensagem', () => {
    const m = montarAbordagem();
    assert.match(m, /Com quem eu consigo falar sobre novos projetos/);
    assert.match(m, /WhatsApp ou o e-mail do responsável/);
  });

  test('nao pede reuniao, nem call, nem quinze minutos', () => {
    const m = montarAbordagem().toLowerCase();
    for (const atrito of ['reunião', 'call', 'minutos', 'agenda']) {
      assert.ok(!m.includes(atrito), `a mensagem nao deveria falar em "${atrito}"`);
    }
  });

  test('guarda o marcador do nome, para a saudacao sair pontuada certo', () => {
    const m = montarAbordagem();
    assert.equal(textoDaAbordagem(m, 'Mirian Alves').split(QUEBRA)[0], 'Opa, Mirian, tudo bem?');
    assert.equal(textoDaAbordagem(m, null).split(QUEBRA)[0], 'Opa, tudo bem?');
  });

  test('quatro blocos, e nenhum deles vira um paredao', () => {
    const blocos = montarAbordagem().split(QUEBRA + QUEBRA);
    assert.equal(blocos.length, 4);
    /* A migração 0043 mediu onde o olho desiste num direct, e era um
       bloco de 44 palavras. Trinta e seis é o teto. */
    for (const b of blocos) {
      assert.ok(b.split(/\s+/).length <= 36, `bloco longo demais: ${b}`);
    }
  });

  test('a credencial entra com numero e plataforma, e nao com adjetivo', () => {
    const m = montarAbordagem();
    assert.match(m, /R\$ 16 milhões no ano/);
    assert.match(m, /Magazord, Loja Integrada, entre outras/);
    /* "Somos especialistas em soluções" é o que todo mundo escreve, e
       por isso não prova nada. Número e plataforma, sim. */
    assert.doesNotMatch(m, /soluções|excelência|parceiro ideal/i);
  });

  test('a mensagem inteira continua curta o bastante para um direct', () => {
    const palavras = montarAbordagem().split(/\s+/).length;
    assert.ok(palavras <= 115, `${palavras} palavras ja e texto, e nao direct`);
  });

  /*
    O ELOGIO SAIU, E ISSO E DECISAO, NAO DESCUIDO

    Era o unico pedaco que mudava de marca para marca. Sem ele a
    mensagem e igual para as cinquenta, e mensagem repetida em
    sequencia e o que o Instagram usa como sinal de spam.

    Este teste existe para que a remocao seja deliberada: se alguem
    reinserir a personalizacao, ele quebra e obriga a pessoa a decidir
    de novo, em vez de descobrir meses depois.
  */
  test('nao sobrou nenhum pedaco do elogio por marca', () => {
    const m = montarAbordagem();
    assert.doesNotMatch(m, /Parabéns/);
    assert.doesNotMatch(m, /não se constrói da noite/);
    assert.doesNotMatch(m, /undefined|null/);
  });
});
