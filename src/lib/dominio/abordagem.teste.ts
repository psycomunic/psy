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
    const m = montarAbordagem('Vida Fit');
    assert.match(m, /Com quem eu consigo falar sobre novos projetos/);
    assert.match(m, /WhatsApp ou o e-mail do responsável/);
  });

  test('nao pede reuniao, nem call, nem quinze minutos', () => {
    const m = montarAbordagem('Vida Fit').toLowerCase();
    for (const atrito of ['reunião', 'call', 'minutos', 'agenda']) {
      assert.ok(!m.includes(atrito), `a mensagem nao deveria falar em "${atrito}"`);
    }
  });

  test('guarda o marcador do nome, para a saudacao sair pontuada certo', () => {
    const m = montarAbordagem('Vida Fit');
    assert.equal(textoDaAbordagem(m, 'Mirian Alves').split(QUEBRA)[0], 'Opa, Mirian, tudo bem?');
    assert.equal(textoDaAbordagem(m, null).split(QUEBRA)[0], 'Opa, tudo bem?');
  });

  test('cinco blocos, e nenhum deles vira um paredao', () => {
    const blocos = montarAbordagem('Vida Fit').split(QUEBRA + QUEBRA);
    assert.equal(blocos.length, 5);
    /* A migração 0043 mediu onde o olho desiste num direct, e era um
       bloco de 44 palavras. Trinta e seis é o teto. */
    for (const b of blocos) {
      assert.ok(b.split(/\s+/).length <= 36, `bloco longo demais: ${b}`);
    }
  });

  /*
    A CREDENCIAL MUDA COM O NICHO, E ESSA E A PARTE QUE PODE MENTIR

    No mercado onde a operacao de R$ 16 milhoes aconteceu, a frase cita
    o nicho e vira prova. Fora dele, cita as plataformas. Trocar os
    dois significa dizer "ja faturei 16 milhoes no nicho de voces" para
    quem vende lingerie, e mentira assim nao cai na hora: cai na
    reuniao, depois de a pessoa ter apostado uma agenda.
  */
  test('no nicho provado, a credencial cita o nicho', () => {
    const m = montarAbordagem('Clic Store', 'Quadros e molduras');
    assert.match(m, /R\$ 16 milhões no ano no nicho de quadros decorativos/);
    assert.doesNotMatch(m, /Magazord/);
  });

  test('fora dele, NAO cita o nicho, e volta para as plataformas', () => {
    for (const seg of ['Moda íntima', 'Jeans', 'Infantil', '', null]) {
      const m = montarAbordagem('Vida Fit', seg);
      assert.doesNotMatch(m, /no nicho de/, `citou o nicho em "${seg}"`);
      assert.match(m, /Magazord, Loja Integrada, entre outras/);
    }
  });

  test('diz quem esta falando antes de dar o numero', () => {
    const m = montarAbordagem('Vida Fit');
    assert.match(m, /Angelo da Psy Comunic aqui\./);
    assert.ok(m.indexOf('Angelo da Psy Comunic') < m.indexOf('R$ 16 milhões'));
  });

  test('a credencial entra com numero e plataforma, e nao com adjetivo', () => {
    const m = montarAbordagem('Vida Fit');
    assert.match(m, /R\$ 16 milhões no ano/);
    assert.match(m, /Magazord, Loja Integrada, entre outras/);
    /* "Somos especialistas em soluções" é o que todo mundo escreve, e
       por isso não prova nada. Número e plataforma, sim. */
    assert.doesNotMatch(m, /soluções|excelência|parceiro ideal/i);
  });

  test('o meu contato vai junto, para quem nao quer repassar o de ninguem', () => {
    const m = montarAbordagem('Vida Fit');
    assert.match(m, /47 99240-6661/);
    /* Depois do pedido, e nao no lugar dele: a pergunta pelo
       responsável tem que vir primeiro. */
    assert.ok(m.indexOf('Com quem eu consigo falar') < m.indexOf('47 99240-6661'));
  });

  test('a mensagem inteira continua curta o bastante para um direct', () => {
    const palavras = montarAbordagem('Vida Fit').split(/\s+/).length;
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
  /* A lista deixou de ser so do Vale do Itajai: hoje tem lead em SP,
     MG, RJ, ES, SC, RS e PR. "Aqui da regiao", vindo de uma agencia
     catarinense para quem esta em Franca, e uma frase que nao se
     sustenta se a pessoa perguntar de onde a gente e. */
  test('nao promete proximidade geografica que nao existe', () => {
    const m = montarAbordagem('Urban Arts');
    assert.doesNotMatch(m, /aqui da região|aqui na região|perto de você/i);
  });

  test('o nome da loja entra, e sem confessar que existe uma lista', () => {
    const m = montarAbordagem('Vida Fit');
    assert.match(m, /o perfil de Vida Fit chamou a atenção/);
    /* "Vida Fit entrou na lista" diria em voz alta o que a mensagem
       precisa nao parecer: disparo em massa. */
    assert.doesNotMatch(m, /entrou na lista|selecionamos|lista de marcas/i);
  });

  test('sem o nome, a frase continua inteira e sem buraco', () => {
    const m = montarAbordagem(null);
    assert.match(m, /nas vendas online\.$/m);
    assert.doesNotMatch(m, /undefined|null|perfil de \./);
  });

  test('nao sobrou nenhum pedaco do elogio por marca', () => {
    const m = montarAbordagem('Vida Fit');
    assert.doesNotMatch(m, /Parabéns/);
    assert.doesNotMatch(m, /não se constrói da noite/);
    assert.doesNotMatch(m, /undefined|null/);
  });
});
