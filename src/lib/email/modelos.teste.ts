import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  inscricaoRecebida,
  avisoDeInscricao,
  analiseRecebida,
  avisoDeLead,
  propostaPronta,
  acessoCriado,
  testeDeEnvio,
  type Modelo,
} from './modelos.ts';

/**
 * O que estes testes protegem.
 *
 * E-mail é a única saída deste sistema que ninguém revisa antes de
 * chegar no destino. Página errada alguém abre e vê; e-mail errado sai
 * para a caixa de uma pessoa e não volta. Então as regras que valem
 * para o texto da marca viram asserção aqui, e não boa intenção.
 *
 * Em particular o escape: o nome, a empresa e o texto livre do
 * formulário atravessam para dentro do HTML, e o campo "por que merece
 * a vaga" é um textarea aberto onde cabe qualquer coisa.
 */

const TODOS: { nome: string; modelo: Modelo; paraFora: boolean }[] = [
  {
    nome: 'inscricaoRecebida',
    modelo: inscricaoRecebida({ nome: 'Maria Souza', empresa: 'Padaria Caeté' }),
    paraFora: true,
  },
  {
    nome: 'avisoDeInscricao',
    modelo: avisoDeInscricao({
      nome: 'Maria Souza',
      empresa: 'Padaria Caeté',
      telefone: '(91) 98911-0478',
      email: 'maria@padaria.com.br',
      instagram: '@padariacaete',
      nota: 82,
      respostas: ['Área: Alimentação e delivery.', 'Cidade: Bragança.'],
      motivo: 'A gente atende bem e quer crescer.',
    }),
    paraFora: false,
  },
  {
    nome: 'analiseRecebida',
    modelo: analiseRecebida({ nome: 'João Lima', empresa: 'Loja Aurora' }),
    paraFora: true,
  },
  {
    nome: 'avisoDeLead',
    modelo: avisoDeLead({
      nome: 'João Lima',
      empresa: 'Loja Aurora',
      telefone: '47 99240-6661',
      email: null,
      observacao: 'Anuncia hoje em: Meta.',
      origem: 'Página de tráfego pago',
    }),
    paraFora: false,
  },
  {
    nome: 'propostaPronta',
    modelo: propostaPronta({
      cliente: 'Loja Aurora',
      contato: 'João Lima',
      resumo: 'Proposta de tráfego pago para a Loja Aurora.',
      slug: 'loja-aurora-a1b2c3',
      versao: 2,
      diasParaVencer: 10,
    }),
    paraFora: true,
  },
  {
    nome: 'acessoCriado',
    modelo: acessoCriado({
      nome: 'Carla Dias',
      login: 'carla@aurora.com.br',
      papel: 'Cliente',
    }),
    paraFora: true,
  },
  {
    nome: 'testeDeEnvio',
    modelo: testeDeEnvio({ quem: 'Angelo Garcia' }),
    /* Vai para a caixa da agência, mas entra como "para fora" de
       propósito: as regras mais rígidas também valem para ele, e um dia
       alguém vai mandar esse teste para a caixa de um cliente. */
    paraFora: true,
  },
];

test('todo modelo tem assunto, html e texto', () => {
  for (const { nome, modelo } of TODOS) {
    assert.ok(modelo.assunto.length > 0, `${nome}: assunto vazio`);
    assert.ok(modelo.html.startsWith('<!doctype html>'), `${nome}: html sem doctype`);
    assert.ok(modelo.texto.length > 80, `${nome}: texto curto demais para servir de alternativa`);
    assert.ok(!/<[a-z]/i.test(modelo.texto), `${nome}: a versão de texto tem tag HTML`);
  }
});

test('assunto cabe na caixa de entrada', () => {
  for (const { nome, modelo } of TODOS) {
    /* Acima de uns 70 caracteres o cliente corta, e o que importa fica
       escondido atrás de "...". */
    assert.ok(modelo.assunto.length <= 70, `${nome}: assunto com ${modelo.assunto.length} caracteres`);
    assert.ok(!modelo.assunto.includes('\n'), `${nome}: assunto com quebra de linha`);
  }
});

test('quem fala é a empresa, e não o Angelo', () => {
  /* Regra do projeto, em CLAUDE.md. "meu trabalho", "eu faço", "em
     mim" não existem na voz do site nem aqui. A exceção conhecida é a
     abordagem no Instagram, que vive em outro arquivo. */
  const primeiraPessoa = /\b(eu|meu|minha|meus|minhas|comigo)\b/i;
  for (const { nome, modelo } of TODOS) {
    assert.ok(!primeiraPessoa.test(modelo.texto), `${nome}: fala em primeira pessoa`);
  }
});

test('sem travessão no meio da frase', () => {
  for (const { nome, modelo } of TODOS) {
    assert.ok(!modelo.texto.includes('—'), `${nome}: tem travessão`);
    assert.ok(!modelo.assunto.includes('—'), `${nome}: travessão no assunto`);
  }
});

test('o que vai para fora não carrega nota, verba nem juízo', () => {
  /* A nota é instrumento de leitura da equipe. Descobrir por e-mail
     automático que a sua empresa tirou 54 de 100 é a pior maneira
     possível de receber essa informação. */
  for (const { nome, modelo, paraFora } of TODOS) {
    if (!paraFora) continue;
    assert.ok(!/\bnota\b/i.test(modelo.texto), `${nome}: menciona nota`);
    assert.ok(!/\/100\b/.test(modelo.texto), `${nome}: menciona pontuação`);
    assert.ok(!/\bfaturamento\b/i.test(modelo.texto), `${nome}: menciona faturamento`);
    assert.ok(!/R\$/.test(modelo.texto), `${nome}: tem valor em reais`);
  }
});

test('o aviso interno leva a nota e o contato, que é para isso que ele serve', () => {
  const { modelo } = TODOS.find((x) => x.nome === 'avisoDeInscricao')!;
  assert.match(modelo.assunto, /82\/100/);
  assert.match(modelo.texto, /\(91\) 98911-0478/);
  assert.match(modelo.texto, /maria@padaria\.com\.br/);
  assert.match(modelo.texto, /Por que merece a vaga/i);
});

test('senha não sai por e-mail', () => {
  const { modelo } = TODOS.find((x) => x.nome === 'acessoCriado')!;
  assert.match(modelo.texto, /A senha não vai por e-mail/);
  /* Nenhum rótulo de senha com valor ao lado. O modelo não recebe a
     senha como parâmetro, e este teste existe para que ninguém a
     acrescente por conveniência depois. */
  assert.ok(!/senha:\s*\S/i.test(modelo.texto));
  assert.ok(!/senha:\s*\S/i.test(modelo.html));
});

test('o que a pessoa digitou é escapado antes de entrar no HTML', () => {
  const m = avisoDeInscricao({
    nome: '<script>alert(1)</script>',
    empresa: 'Loja "A" & B',
    telefone: '(91) 98911-0478',
    email: null,
    instagram: null,
    nota: 50,
    respostas: ['Área: <b>teste</b>.'],
    motivo: 'Fecho às 18h <br> e abro às 8h',
  });

  assert.ok(!m.html.includes('<script>'), 'tag script sobreviveu ao escape');
  assert.ok(m.html.includes('&lt;script&gt;'), 'o script não foi escapado');
  assert.ok(m.html.includes('&amp;'), 'o & não foi escapado');
  assert.ok(!m.html.includes('Fecho às 18h <br>'), 'o <br> do campo livre sobreviveu');
});

test('a proposta leva o link com a versão, e o prazo em palavras', () => {
  const dez = propostaPronta({
    cliente: 'Loja Aurora',
    contato: 'João',
    resumo: 'Resumo.',
    slug: 'loja-aurora-a1b2c3',
    versao: 3,
    diasParaVencer: 10,
  });
  assert.match(dez.texto, /\/proposta\/loja-aurora-a1b2c3\?v=3/);
  assert.match(dez.texto, /vale por 10 dias/);

  /* Singular e último dia são frases próprias: "vale por 1 dias" e
     "vale por 0 dias" são as duas maneiras de um sistema parecer
     descuidado numa mensagem que fecha negócio. */
  const um = propostaPronta({
    cliente: 'X',
    contato: 'Y',
    resumo: 'Z.',
    slug: 's',
    versao: 1,
    diasParaVencer: 1,
  });
  assert.match(um.texto, /vale até amanhã/);

  const zero = propostaPronta({
    cliente: 'X',
    contato: 'Y',
    resumo: 'Z.',
    slug: 's',
    versao: 1,
    diasParaVencer: 0,
  });
  assert.match(zero.texto, /último dia de validade/);
});

test('o nome que aparece é o primeiro, e não o nome inteiro', () => {
  const m = inscricaoRecebida({ nome: 'Maria Aparecida de Souza', empresa: 'Padaria' });
  assert.match(m.texto, /Olá, Maria\./);
  assert.ok(!m.texto.includes('Olá, Maria Aparecida de Souza'));
});

test('o teste de envio se identifica como teste', () => {
  /* Um e-mail automático que não diz o que é parece aviso de verdade
     mal escrito. Este diz, no assunto e na primeira linha. */
  const m = testeDeEnvio({ quem: 'Angelo Garcia' });
  assert.match(m.assunto, /[Tt]este/);
  assert.match(m.texto, /não é aviso de nada/);
  assert.match(m.texto, /Olá, Angelo\./);
});
