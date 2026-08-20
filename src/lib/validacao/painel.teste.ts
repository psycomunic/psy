import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { paraNumero, esquemaUsuario, esquemaConta, esquemaMeta } from './painel.ts';

const UUID = '00000000-0000-0000-0000-000000000000';

describe('paraNumero: texto de gente vira numero', () => {
  test('numero puro', () => {
    assert.equal(paraNumero('320000'), 320000);
  });

  test('"320.000" e 320 mil, e NAO 320', () => {
    /* O bug que este teste existe para impedir. A primeira versao lia o
       ponto como decimal e gravava uma meta mil vezes menor, sem erro
       nenhum na tela. */
    assert.equal(paraNumero('320.000'), 320000);
  });

  test('milhar em cadeia', () => {
    assert.equal(paraNumero('1.234.567'), 1234567);
  });

  test('milhar e decimal juntos, formato brasileiro', () => {
    assert.equal(paraNumero('320.000,50'), 320000.5);
  });

  test('milhar e decimal juntos, formato americano', () => {
    assert.equal(paraNumero('1,234.56'), 1234.56);
  });

  test('so decimal, com virgula', () => {
    assert.equal(paraNumero('320,50'), 320.5);
  });

  test('uma casa decimal continua decimal', () => {
    assert.equal(paraNumero('1.5'), 1.5);
  });

  test('simbolo de moeda e espaco somem', () => {
    assert.equal(paraNumero('R$ 320.000,00'), 320000);
  });

  test('texto sem numero nao vira zero', () => {
    /* Zero seria aceito por engano em algum lugar; NaN e recusado. */
    assert.ok(Number.isNaN(paraNumero('abc')));
  });
});

describe('esquemaMeta', () => {
  const ok = (v: string) => esquemaMeta.safeParse({ conta_id: UUID, receita_meta: v });

  test('aceita meta valida', () => {
    const r = ok('320.000');
    assert.equal(r.success && r.data.receita_meta, 320000);
  });

  test('recusa zero e negativo', () => {
    assert.equal(ok('0').success, false);
    assert.equal(ok('-500').success, false);
  });

  test('recusa loja que nao e uuid', () => {
    const r = esquemaMeta.safeParse({ conta_id: 'a-loja', receita_meta: '1000' });
    assert.equal(r.success, false);
  });
});

describe('esquemaUsuario', () => {
  const base = { nome: 'Maria Silva', email: 'maria@empresa.com', senha: 'senha-de-doze-ok' };

  test('papel fora da lista e recusado', () => {
    /* Server action e endpoint HTTP: um POST manual com papel inventado
       chegaria ate aqui. */
    const r = esquemaUsuario.safeParse({ ...base, papel: 'superadmin', conta_id: '' });
    assert.equal(r.success, false);
  });

  test('cliente sem loja e recusado', () => {
    const r = esquemaUsuario.safeParse({ ...base, papel: 'cliente', conta_id: '' });
    assert.equal(r.success, false);
  });

  test('cliente_leitura tambem precisa de loja', () => {
    const r = esquemaUsuario.safeParse({ ...base, papel: 'cliente_leitura', conta_id: '' });
    assert.equal(r.success, false);
  });

  test('papel interno nao precisa de loja', () => {
    const r = esquemaUsuario.safeParse({ ...base, papel: 'comercial', conta_id: '' });
    assert.equal(r.success, true);
  });

  test('senha curta e recusada', () => {
    const r = esquemaUsuario.safeParse({ ...base, senha: 'curta', papel: 'gestor', conta_id: '' });
    assert.equal(r.success, false);
  });

  test('e-mail sem dominio e recusado', () => {
    const r = esquemaUsuario.safeParse({ ...base, email: 'maria@empresa', papel: 'gestor', conta_id: '' });
    assert.equal(r.success, false);
  });

  test('e-mail vira minusculo', () => {
    const r = esquemaUsuario.safeParse({ ...base, email: 'MARIA@Empresa.COM', papel: 'gestor', conta_id: '' });
    assert.equal(r.success && r.data.email, 'maria@empresa.com');
  });
});

describe('esquemaConta', () => {
  test('nome de uma letra e recusado', () => {
    assert.equal(esquemaConta.safeParse({ nome: 'X', plataforma: '', site: '', documento: '' }).success, false);
  });

  test('campo opcional vazio vira null, e nao string vazia', () => {
    /* String vazia no banco e pior que null: aparece como "" na tela e
       ninguem sabe se foi preenchido com nada ou nao preenchido. */
    const r = esquemaConta.safeParse({ nome: 'Loja Teste', plataforma: '', site: '', documento: '' });
    assert.equal(r.success && r.data.plataforma, null);
    assert.equal(r.success && r.data.site, null);
  });

  test('site invalido e recusado, mas site vazio passa', () => {
    assert.equal(esquemaConta.safeParse({ nome: 'Loja', plataforma: '', site: 'nao-e-url', documento: '' }).success, false);
    assert.equal(esquemaConta.safeParse({ nome: 'Loja', plataforma: '', site: '', documento: '' }).success, true);
  });
});
