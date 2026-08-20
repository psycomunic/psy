import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { cifrarCom, decifrarCom, lerChave, estaCifrado, final, ErroDeCripto } from './cripto.ts';

const chave = () => randomBytes(32);
const TOKEN = 'EAAG9ZBx1exemploDeTokenLongoDaBM0123456789';

describe('lerChave', () => {
  test('chave curta é recusada com instrução de como gerar', () => {
    assert.throws(
      () => lerChave(randomBytes(16).toString('base64url')),
      (e: Error) => e instanceof ErroDeCripto && /32 bytes/.test(e.message),
    );
  });

  test('espaço em volta não invalida: .env costuma trazer', () => {
    const k = randomBytes(32).toString('base64url');
    assert.equal(lerChave(`  ${k}  `).length, 32);
  });
});

describe('cifrar e decifrar', () => {
  test('ida e volta preserva o texto', () => {
    const k = chave();
    assert.equal(decifrarCom(k, cifrarCom(k, TOKEN)), TOKEN);
  });

  test('acento e emoji sobrevivem', () => {
    const k = chave();
    const t = 'segredo com ção, ü e 🔐';
    assert.equal(decifrarCom(k, cifrarCom(k, t)), t);
  });

  test('texto vazio continua vazio', () => {
    const k = chave();
    assert.equal(decifrarCom(k, cifrarCom(k, '')), '');
  });

  test('cifrar duas vezes dá saídas DIFERENTES', () => {
    /* Saída igual denunciaria que dois clientes usam a mesma
       credencial, só de olhar a coluna. */
    const k = chave();
    assert.notEqual(cifrarCom(k, TOKEN), cifrarCom(k, TOKEN));
  });

  test('o texto claro não aparece no resultado', () => {
    const cifrado = cifrarCom(chave(), TOKEN);
    assert.ok(!cifrado.includes(TOKEN));
    assert.ok(!cifrado.includes('exemploDeToken'));
  });
});

describe('o que precisa FALHAR', () => {
  test('chave errada não decifra', () => {
    const cifrado = cifrarCom(chave(), TOKEN);
    assert.throws(() => decifrarCom(chave(), cifrado), ErroDeCripto);
  });

  test('um byte adulterado derruba, em vez de devolver lixo', () => {
    /* É a razão de ser do GCM. Com CBC isto devolveria uma string
       diferente e a aplicação usaria o valor trocado sem perceber. */
    const k = chave();
    const cifrado = cifrarCom(k, TOKEN);
    const partes = cifrado.split('.');
    const bytes = Buffer.from(partes[3], 'base64url');
    bytes[0] ^= 0x01;
    partes[3] = bytes.toString('base64url');

    assert.throws(() => decifrarCom(k, partes.join('.')), ErroDeCripto);
  });

  test('trocar a etiqueta de autenticação derruba', () => {
    const k = chave();
    const a = cifrarCom(k, TOKEN).split('.');
    const b = cifrarCom(k, 'outro segredo qualquer').split('.');
    a[2] = b[2];
    assert.throws(() => decifrarCom(k, a.join('.')), ErroDeCripto);
  });

  test('texto puro no lugar do cifrado derruba, e não passa adiante', () => {
    assert.throws(() => decifrarCom(chave(), TOKEN), ErroDeCripto);
  });

  test('versão desconhecida derruba', () => {
    const k = chave();
    const c = cifrarCom(k, TOKEN).replace(/^v1\./, 'v9.');
    assert.throws(() => decifrarCom(k, c), ErroDeCripto);
  });

  test('a mensagem de erro não distingue chave errada de adulteração', () => {
    /* Distinguir ajuda quem está tentando adivinhar. */
    const k = chave();
    const cifrado = cifrarCom(k, TOKEN);

    let msgChaveErrada = '';
    try { decifrarCom(chave(), cifrado); } catch (e) { msgChaveErrada = (e as Error).message; }

    const partes = cifrado.split('.');
    const bytes = Buffer.from(partes[3], 'base64url');
    bytes[0] ^= 0xff;
    partes[3] = bytes.toString('base64url');

    let msgAdulterado = '';
    try { decifrarCom(k, partes.join('.')); } catch (e) { msgAdulterado = (e as Error).message; }

    assert.equal(msgChaveErrada, msgAdulterado);
  });
});

describe('estaCifrado', () => {
  test('reconhece o próprio formato', () => {
    assert.equal(estaCifrado(cifrarCom(chave(), TOKEN)), true);
  });

  test('não confunde token cru com cifrado', () => {
    assert.equal(estaCifrado(TOKEN), false);
    assert.equal(estaCifrado(''), false);
    assert.equal(estaCifrado('v1.só.duas'), false);
  });
});

describe('final', () => {
  test('mostra só o fim, para reconhecer sem ler', () => {
    assert.equal(final('abcdefghij'), '••••ghij');
  });

  test('segredo curto some inteiro', () => {
    assert.equal(final('abc'), '•••');
  });
});
