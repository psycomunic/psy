import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, type Server } from 'node:http';
import { buscaComPrazo, ePanneDeRede, PRAZO_MIDDLEWARE_MS } from './rede.ts';

/**
 * O prazo do `fetch` do Supabase.
 *
 * ============================================================
 * POR QUE O TESTE SOBE UM SERVIDOR
 * ============================================================
 * O caso que doeu em produção não é "host não existe": é host que
 * ACEITA a conexão e nunca responde. DNS que falha devolve erro em
 * milissegundos e nem chega perto do prazo. Foi o que aconteceu quando
 * medi daqui e o redirecionamento voltou em 17ms: provou o try/catch,
 * não provou o relógio.
 *
 * Então aqui o teste fabrica a pane: um servidor que recebe a
 * requisição e não escreve resposta nenhuma. Sem rede de verdade, sem
 * depender de IP não roteável se comportar igual em toda máquina.
 */
describe('buscaComPrazo', () => {
  function servidorMudo(): Promise<{ url: string; fechar: () => Promise<void> }> {
    return new Promise((resolve) => {
      /* Recebe e não responde. Nunca chama `fim()`: é essa a pane. */
      const servidor: Server = createServer(() => {});
      servidor.listen(0, '127.0.0.1', () => {
        const porta = (servidor.address() as { port: number }).port;
        resolve({
          url: `http://127.0.0.1:${porta}/auth/v1/.well-known/jwks.json`,
          fechar: () =>
            new Promise<void>((pronto) => {
              servidor.closeAllConnections();
              servidor.close(() => pronto());
            }),
        });
      });
    });
  }

  test('desiste no prazo, em vez de ficar pendurado', async () => {
    const { url, fechar } = await servidorMudo();
    try {
      const busca = buscaComPrazo(300);
      const comeco = Date.now();

      await assert.rejects(() => busca(url), /abort|timeout/i);

      const levou = Date.now() - comeco;
      /* A margem é larga de propósito: o que está sob teste é "desiste
         sozinho", e não a precisão do relógio do Node. */
      assert.ok(levou < 3_000, `levou ${levou}ms, deveria desistir perto de 300ms`);
    } finally {
      await fechar();
    }
  });

  test('o prazo da middleware cabe nos 25s da função, com folga', () => {
    assert.ok(PRAZO_MIDDLEWARE_MS < 25_000 / 2);
  });

  test('requisição que responde passa inteira', async () => {
    const servidor = createServer((_req, res) => res.end('{"ok":true}'));
    await new Promise<void>((pronto) => servidor.listen(0, '127.0.0.1', () => pronto()));
    const porta = (servidor.address() as { port: number }).port;

    try {
      const r = await buscaComPrazo(2_000)(`http://127.0.0.1:${porta}/`);
      assert.equal(await r.text(), '{"ok":true}');
    } finally {
      await new Promise<void>((pronto) => servidor.close(() => pronto()));
    }
  });
});

describe('ePanneDeRede', () => {
  /* A tabela existe porque a mensagem errada aqui custou uma noite:
     "e-mail ou senha incorretos" com a senha certa e o banco fora. */
  const rede = [
    { name: 'AuthRetryableFetchError', status: 0, message: 'Failed to fetch' },
    { name: 'TimeoutError', message: 'The operation was aborted due to timeout' },
    { name: 'AbortError', message: 'This operation was aborted' },
    { message: 'fetch failed' },
    { status: 0, message: '' },
  ];

  for (const erro of rede) {
    test(`pane: ${erro.name ?? (erro.message || 'status 0')}`, () => {
      assert.equal(ePanneDeRede(erro), true);
    });
  }

  const credencial = [
    { name: 'AuthApiError', status: 400, message: 'Invalid login credentials' },
    { name: 'AuthApiError', status: 429, message: 'Request rate limit reached' },
    { name: 'AuthApiError', status: 400, message: 'Email not confirmed' },
  ];

  for (const erro of credencial) {
    test(`não é pane: ${erro.message}`, () => {
      assert.equal(ePanneDeRede(erro), false);
    });
  }
});
