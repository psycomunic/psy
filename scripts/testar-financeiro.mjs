/**
 * Prova o financeiro de ponta a ponta, contra o Asaas de verdade.
 *
 *   npm run dev              (noutro terminal)
 *   npm run testar-financeiro
 *
 * ============================================================
 * O QUE ESTE TESTE EXISTE PARA PEGAR
 * ============================================================
 * Até a migração 0020, `financeiro_mes` somava `lancamento` enquanto a
 * cobrança inteira escrevia em `fatura`. Ninguém nunca escreveu em
 * `lancamento`. O painel podia receber trinta mil no mês e seguir
 * mostrando R$ 0 — um número que não estava errado por pouco, estava
 * errado para sempre.
 *
 * Nada disso aparecia em teste de unidade: cada peça funcionava. O que
 * faltava era alguém somar dinheiro de verdade e conferir se o
 * indicador mexia. É o que este arquivo faz.
 *
 * Ele usa o SANDBOX do Asaas, cria cobrança lá, e limpa tudo no fim.
 */
import { readFileSync, existsSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { createDecipheriv } from 'node:crypto';
import puppeteer from 'puppeteer-core';

const env = {};
for (const l of readFileSync('.env.local', 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const NAVEGADORES = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
];
const executablePath = NAVEGADORES.find((p) => existsSync(p));
if (!executablePath) {
  console.error('\nNenhum Chrome ou Edge encontrado.\n');
  process.exit(1);
}

const APP = process.env.APP_URL ?? 'http://localhost:3000';
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const marca = `fin-${Date.now()}`;
const EMAIL = `${marca}@teste.local`;
const SENHA = 'Financeiro-Teste-2026-xyz';

let falhas = 0;

/* Sentinela de "pular", e nao de erro. Ver a guarda de producao. */
const PULAR = "__pular_producao__";
let pulado = false;
let usuarioId = null;
let contaId = null;
let navegador = null;
let asaas = null;
const cobrancasCriadas = [];

const ok = (b, t) => {
  console.log(`  ${b ? 'PASSA' : 'FALHA'}  ${t}`);
  if (!b) falhas++;
};

const hojeBR = () => new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10);

function daquiA(dias) {
  const d = new Date(`${hojeBR()}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

/* ---- a chave do Asaas, decifrada como a aplicação faz --------------- */

function credencialAsaas() {
  const chave = Buffer.from((env.CRIPTO_CHAVE ?? '').trim(), 'base64url');
  return async () => {
    const { data } = await admin
      .from('credencial_agencia')
      .select('segredo, configuracao')
      .eq('provedor', 'asaas')
      .maybeSingle();
    if (!data?.segredo) return null;

    const [v, iv, tag, cif] = data.segredo.split('.');
    if (v !== 'v1') return null;
    const d = createDecipheriv('aes-256-gcm', chave, Buffer.from(iv, 'base64url'));
    d.setAuthTag(Buffer.from(tag, 'base64url'));
    const claro = d.update(Buffer.from(cif, 'base64url'), undefined, 'utf8') + d.final('utf8');
    const s = JSON.parse(claro);
    const producao = (data.configuracao ?? {}).ambiente === 'producao';
    return {
      chave: s.api_key,
      base: producao ? 'https://api.asaas.com/v3' : 'https://api-sandbox.asaas.com/v3',
      producao,
    };
  };
}

async function noAsaas(caminho, init) {
  if (!asaas) return null;
  const r = await fetch(`${asaas.base}${caminho}`, {
    ...init,
    headers: {
      access_token: asaas.chave,
      'content-type': 'application/json',
      'User-Agent': 'PsyComunic/1.0',
    },
  });
  return { status: r.status, corpo: await r.json().catch(() => null) };
}

/* ---- ajudantes de tela --------------------------------------------- */

async function preencher(pagina, seletor, valor) {
  const achou = await pagina.evaluate(
    (s, v) => {
      const el = document.querySelector(s);
      if (!el) return false;
      const proto = el instanceof HTMLSelectElement
        ? HTMLSelectElement.prototype
        : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    },
    seletor,
    valor,
  );
  if (!achou) throw new Error(`não achei ${seletor}`);
}

async function clicar(pagina, texto) {
  return pagina.evaluate((t) => {
    const alvo = [...document.querySelectorAll('button')].find((b) =>
      (b.textContent ?? '').toLowerCase().includes(t.toLowerCase()),
    );
    if (!alvo) return false;
    alvo.click();
    return true;
  }, texto);
}

/** Clica num botão dentro do cartão que menciona `chave`. */
async function clicarNoCartao(pagina, chave, texto) {
  return pagina.evaluate(
    (c, t) => {
      for (const li of document.querySelectorAll('li, article')) {
        if (!(li.textContent ?? '').includes(c)) continue;
        const alvo = [...li.querySelectorAll('button')].find((b) =>
          (b.textContent ?? '').toLowerCase().includes(t.toLowerCase()),
        );
        if (alvo) {
          alvo.click();
          return true;
        }
      }
      return false;
    },
    chave,
    texto,
  );
}

/**
 * Espera a mensagem de retorno de uma ação.
 *
 * IGNORA o aviso de sandbox, que também é  e diz
 * "as cobranças emitidas aqui são de teste". Procurar por "emitida" na
 * página inteira casava com ele NA HORA, antes de a ação rodar — e o
 * teste seguia para conferir o banco antes de existir o que conferir.
 * Deu seis falhas em cascata e nenhuma delas era do código testado.
 */
async function esperarTexto(pagina, contem, ms = 30000) {
  const ate = Date.now() + ms;
  while (Date.now() < ate) {
    const achou = await pagina.evaluate(
      (t) =>
        [...document.querySelectorAll('[role="status"]')]
          .filter((n) => !/O Asaas está em/.test(n.textContent ?? ''))
          .some((n) => (n.textContent ?? '').toLowerCase().includes(t.toLowerCase())),
      contem,
    );
    if (achou) return true;
    await new Promise((r) => setTimeout(r, 400));
  }
  return false;
}

async function esperarSeletor(pagina, seletor, ms = 15000) {
  const ate = Date.now() + ms;
  while (Date.now() < ate) {
    if (await pagina.$(seletor)) return true;
    await new Promise((r) => setTimeout(r, 200));
  }
  return false;
}

const faturasDaConta = () =>
  admin
    .from('fatura')
    .select('id, numero, descricao, status, valor, valor_liquido, parcelas, vencimento, paga_em, asaas_id, link_pagamento, contrato_id')
    .eq('conta_id', contaId)
    .order('criada_em', { ascending: true })
    .then((r) => r.data ?? []);

const indicadores = async () => {
  const { data } = await admin.from('financeiro_mes').select('*').single();
  return data;
};

try {
  asaas = await credencialAsaas()();
  if (!asaas) {
    console.log('\nAsaas não conectado. Conecte a chave em Configurações e rode de novo.\n');
    process.exit(1);
  }
  /*
    PULA quando o Asaas está em produção — e pular não é falhar.

    Rodar aqui emitiria cobrança de verdade para um cliente inventado.
    Recusar é obrigatório. Mas devolver erro derrubaria `testar-banco`
    neste ponto: os testes seguintes nunca rodariam, e a saída natural
    para quem quer a suíte verde seria apagar a guarda. Guarda que
    atrapalha vira guarda removida.
  */
  if (asaas.producao) {
    console.log('\n' + '='.repeat(66));
    console.log('PULADO: o Asaas está em PRODUÇÃO.');
    console.log('Este teste emite cobrança de verdade, então não roda contra produção.');
    console.log('Para exercê-lo, troque o ambiente para sandbox em Configurações.');
    console.log('='.repeat(66));
    throw new Error(PULAR);
  }
  console.log('\nAsaas: sandbox');

  const { data: conta, error: eConta } = await admin
    .from('conta')
    .insert({ nome: `${marca}-loja`, situacao: 'ativa', documento: '11222333000181' })
    .select('id')
    .single();
  if (eConta) throw new Error(`não criou a loja: ${eConta.message}`);
  contaId = conta.id;

  const { data: criado, error: eUser } = await admin.auth.admin.createUser({
    email: EMAIL,
    password: SENHA,
    email_confirm: true,
    app_metadata: { papel: 'administrador' },
  });
  if (eUser) throw new Error(`não criou o usuário: ${eUser.message}`);
  usuarioId = criado.user.id;

  navegador = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const pagina = await navegador.newPage();
  await pagina.setViewport({ width: 1440, height: 900 });

  await pagina.goto(`${APP}/entrar`, { waitUntil: 'networkidle0', timeout: 60000 });
  await pagina.type('input[name="email"]', EMAIL);
  await pagina.type('input[name="senha"]', SENHA);
  await Promise.all([
    pagina.waitForNavigation({ waitUntil: 'networkidle0', timeout: 60000 }),
    pagina.click('button[type="submit"]'),
  ]);

  const ir = (aba) =>
    pagina.goto(`${APP}/painel/financeiro?aba=${aba}`, {
      waitUntil: 'networkidle0',
      timeout: 60000,
    });

  /* ---------------------------------------------------------------- */
  console.log('\nAs abas');

  await ir('visao');
  const abas = await pagina.evaluate(() =>
    [...document.querySelectorAll('nav[aria-label="Seções do financeiro"] a')].map((a) =>
      (a.textContent ?? '').trim(),
    ),
  );
  ok(
    ['Visão', 'Cobranças', 'Contratos', 'Despesas'].every((a) => abas.includes(a)),
    `as quatro abas existem (achei ${abas.join(', ') || 'nenhuma'})`,
  );

  const avisoSandbox = await pagina.evaluate(() => document.body.innerText);
  ok(
    /sandbox/i.test(avisoSandbox),
    'a tela avisa que o Asaas está em sandbox, para ninguém achar que cobrou de verdade',
  );

  /* ---------------------------------------------------------------- */
  console.log('\nCobrança avulsa');

  await ir('cobrancas');
  ok(await clicar(pagina, 'Nova cobrança'), 'existe o botão "Nova cobrança"');
  ok(await esperarSeletor(pagina, 'select[name="conta_id"]'), 'o formulário abriu');

  await preencher(pagina, 'select[name="conta_id"]', contaId);
  await preencher(pagina, 'input[name="descricao"]', 'Setup da loja');
  await preencher(pagina, 'input[name="valor"]', '300');
  await preencher(pagina, 'input[name="vencimento"]', daquiA(7));
  ok(await clicar(pagina, 'Emitir cobrança'), 'o botão de emitir existe');

  ok(await esperarTexto(pagina, 'emitida'), 'a cobrança foi emitida');

  let faturas = await faturasDaConta();
  const avulsa = faturas[0];
  ok(faturas.length === 1, `nasceu UMA fatura (nasceram ${faturas.length})`);
  ok(avulsa?.descricao === 'Setup da loja', 'a descrição foi gravada');
  ok(avulsa?.contrato_id === null, 'é avulsa: não aponta para contrato nenhum');
  ok(Number(avulsa?.valor) === 300, `o valor é 300 (é ${avulsa?.valor})`);
  ok(Boolean(avulsa?.asaas_id), 'ganhou id do Asaas');
  ok(Boolean(avulsa?.link_pagamento), 'ganhou link de pagamento');
  ok(
    avulsa?.valor_liquido !== null && Number(avulsa.valor_liquido) < 300,
    `o líquido veio menor que o bruto (${avulsa?.valor_liquido})`,
  );
  if (avulsa?.asaas_id) cobrancasCriadas.push(avulsa.asaas_id);

  /* A prova de que existe do lado de lá, e não só no nosso banco. */
  const laFora = await noAsaas(`/payments/${avulsa?.asaas_id}`);
  ok(laFora?.status === 200, 'a cobrança existe mesmo no Asaas');
  ok(
    laFora?.corpo?.description === 'Setup da loja',
    'e chegou lá com a descrição que o cliente vai ler',
  );
  ok(
    laFora?.corpo?.externalReference === avulsa?.id,
    'com o id da nossa fatura, que é o que faz o webhook achar a linha certa',
  );

  /* ---------------------------------------------------------------- */
  console.log('\nRecebimento por fora');

  const antes = await indicadores();
  ok(Number(antes.recebido_mes) === 0, 'antes de pagar, recebido no mês é zero');
  ok(
    Number(antes.faturado_mes) >= 300,
    `mas faturado já conta os 300 (conta ${antes.faturado_mes})`,
  );

  await ir('cobrancas');
  ok(
    await clicarNoCartao(pagina, 'Setup da loja', 'Recebi por fora'),
    'existe o botão "Recebi por fora"',
  );
  ok(await esperarSeletor(pagina, 'input[name="data"]'), 'o formulário de baixa abriu');
  await preencher(pagina, 'input[name="data"]', hojeBR());
  await clicar(pagina, 'Confirmar recebimento');
  ok(await esperarTexto(pagina, 'baixada'), 'a baixa foi aceita');

  faturas = await faturasDaConta();
  ok(faturas[0]?.status === 'paga', `a fatura ficou paga (ficou ${faturas[0]?.status})`);
  ok(faturas[0]?.paga_em === hojeBR(), 'com a data em que o dinheiro entrou');

  const depois = await indicadores();
  ok(
    Number(depois.recebido_mes) >= 300,
    `AGORA o indicador mexeu: recebido no mês é ${depois.recebido_mes}`,
  );
  ok(
    Number(depois.recebido_liquido_mes) > 0 &&
      Number(depois.recebido_liquido_mes) <= Number(depois.recebido_mes),
    'e o líquido é positivo e não passa do bruto',
  );

  /* O Asaas também precisa concordar: baixa que só marca aqui deixa os
     dois lados contando coisas diferentes. */
  const laDepois = await noAsaas(`/payments/${avulsa?.asaas_id}`);
  ok(
    ['RECEIVED_IN_CASH', 'RECEIVED', 'CONFIRMED'].includes(laDepois?.corpo?.status),
    `o Asaas também considera recebida (diz ${laDepois?.corpo?.status})`,
  );

  /* ---------------------------------------------------------------- */
  console.log('\nCancelamento');

  await ir('cobrancas');
  await clicar(pagina, 'Nova cobrança');
  await esperarSeletor(pagina, 'select[name="conta_id"]');
  await preencher(pagina, 'select[name="conta_id"]', contaId);
  await preencher(pagina, 'input[name="descricao"]', 'Cobranca para cancelar');
  await preencher(pagina, 'input[name="valor"]', '150');
  await preencher(pagina, 'input[name="vencimento"]', daquiA(10));
  await clicar(pagina, 'Emitir cobrança');
  ok(await esperarTexto(pagina, 'emitida'), 'a segunda cobrança saiu');

  faturas = await faturasDaConta();
  const paraCancelar = faturas.find((f) => f.descricao === 'Cobranca para cancelar');
  if (paraCancelar?.asaas_id) cobrancasCriadas.push(paraCancelar.asaas_id);

  await ir('cobrancas');
  ok(
    await clicarNoCartao(pagina, 'Cobranca para cancelar', 'Cancelar'),
    'existe o botão de cancelar',
  );
  await clicar(pagina, 'Confirmar cancelamento');
  ok(await esperarTexto(pagina, 'cancelada'), 'o cancelamento foi aceito');

  faturas = await faturasDaConta();
  const cancelada = faturas.find((f) => f.descricao === 'Cobranca para cancelar');
  ok(cancelada?.status === 'cancelada', 'a fatura ficou cancelada aqui');
  ok(cancelada !== undefined, 'e continua no histórico, em vez de sumir');

  const laCancelada = await noAsaas(`/payments/${cancelada?.asaas_id}`);
  ok(
    laCancelada?.corpo?.deleted === true || laCancelada?.status === 404,
    'e foi cancelada no Asaas também, para o cliente parar de receber lembrete',
  );

  const comCancelada = await indicadores();
  ok(
    Number(comCancelada.faturado_mes) === Number(depois.faturado_mes),
    'cobrança cancelada NÃO conta no faturado',
  );

  /* ---------------------------------------------------------------- */
  console.log('\nDespesa');

  await ir('despesas');
  ok(await clicar(pagina, 'Nova despesa'), 'existe o botão "Nova despesa"');
  ok(await esperarSeletor(pagina, 'input[name="descricao"]'), 'o formulário abriu');

  await preencher(pagina, 'input[name="descricao"]', `${marca} ferramenta`);
  await preencher(pagina, 'input[name="categoria"]', 'ferramentas');
  await preencher(pagina, 'input[name="valor"]', '89,90');
  await preencher(pagina, 'input[name="vencimento"]', daquiA(3));
  await clicar(pagina, 'Lançar despesa');
  ok(await esperarTexto(pagina, 'lançada'), 'a despesa foi lançada');

  const { data: desp } = await admin
    .from('lancamento')
    .select('id, tipo, status, valor, categoria')
    .eq('descricao', `${marca} ferramenta`)
    .maybeSingle();

  ok(Boolean(desp), 'a despesa está no banco');
  ok(desp?.tipo === 'despesa', 'gravada como despesa');
  ok(Number(desp?.valor) === 89.9, `com o valor 89,90 lido certo (leu ${desp?.valor})`);
  ok(desp?.status === 'previsto', 'nasce prevista, e não paga');

  const comPrevista = await indicadores();
  ok(
    Number(comPrevista.despesa_mes) === 0,
    'despesa prevista NÃO entra em "pago no mês"',
  );

  await ir('despesas');
  ok(
    await pagina.evaluate((chave) => {
      for (const tr of document.querySelectorAll('tr')) {
        if (!(tr.textContent ?? '').includes(chave)) continue;
        const b = [...tr.querySelectorAll('button')].find((x) =>
          (x.textContent ?? '').includes('Marcar paga'),
        );
        if (b) {
          b.click();
          return true;
        }
      }
      return false;
    }, `${marca} ferramenta`),
    'existe o botão "Marcar paga"',
  );
  ok(await esperarSeletor(pagina, 'input[name="pago_em"]'), 'o campo de data apareceu');
  await preencher(pagina, 'input[name="pago_em"]', hojeBR());
  await clicar(pagina, 'Confirmar');
  ok(await esperarTexto(pagina, 'paga'), 'a baixa da despesa foi aceita');

  const comPaga = await indicadores();
  ok(
    Math.abs(Number(comPaga.despesa_mes) - 89.9) < 0.01,
    `a despesa paga entrou no mês (${comPaga.despesa_mes})`,
  );

  /* ---------------------------------------------------------------- */
  console.log('\nO resultado, que é o ponto de tudo isto');

  const fim = await indicadores();
  const resultado = Number(fim.recebido_liquido_mes) - Number(fim.despesa_mes);
  ok(
    resultado > 0 && resultado < Number(fim.recebido_mes),
    `resultado = recebido líquido menos despesa, e sobrou ${resultado.toFixed(2)}`,
  );

  await ir('visao');
  const naTela = await pagina.evaluate(() => document.body.innerText);
  ok(/Resultado do mês/i.test(naTela), 'a visão mostra o resultado do mês');
  ok(!/R\$ 0,00\s*\n\s*0 contratos/i.test(naTela), 'e a tela não está toda zerada');

  /* ---------------------------------------------------------------- */
  console.log('\nA receita não mora mais em dois lugares');

  const { error: eReceita } = await admin.from('lancamento').insert({
    tipo: 'receita',
    status: 'previsto',
    descricao: `${marca} receita proibida`,
    valor: 999,
    vencimento: hojeBR(),
  });
  ok(
    Boolean(eReceita),
    'o banco recusa lançar RECEITA em `lancamento`: ela é fatura, e duas autoridades para o mesmo número foi o defeito que a 0020 consertou',
  );
} catch (e) {
  if (e.message === PULAR) {
    pulado = true;
  } else {
    console.error(`\nErro no teste: ${e.message}`);
    falhas++;
  }
} finally {
  if (navegador) await navegador.close().catch(() => {});
  if (usuarioId) await admin.auth.admin.deleteUser(usuarioId).catch(() => {});

  /* No Asaas: apagar o que este teste criou. Cliente do sandbox não sai
     (a API devolve 500), então ele fica — é sandbox, e cobrança órfã é
     o que importa não deixar. */
  for (const id of cobrancasCriadas) {
    await noAsaas(`/payments/${id}`, { method: 'DELETE' }).catch(() => {});
  }

  await admin.from('lancamento').delete().like('descricao', `${marca}%`);

  /* A ordem importa: `fatura` e `contrato` apontam para `conta` com
     `on delete restrict`. Apagar a loja primeiro falha em silêncio se
     ninguém olhar o erro — foi assim que seis lojas de teste, com
     contrato de R$ 4.500, ficaram na produção. */
  if (contaId) {
    await admin.from('cobranca_evento').delete().is('fatura_id', null).eq('origem', 'nunca');
    await admin.from('fatura').delete().eq('conta_id', contaId);
    await admin.from('contrato').delete().eq('conta_id', contaId);
    await admin.from('lancamento').delete().eq('conta_id', contaId);
    const { error } = await admin.from('conta').delete().eq('id', contaId);
    if (error) {
      console.error(`  NÃO REMOVEU a loja ${contaId}: ${error.message}`);
      falhas++;
    }
  }

  const { count: sobrou } = await admin
    .from('conta')
    .select('id', { count: 'exact', head: true })
    .like('nome', 'fin-%');
  if (sobrou) {
    console.error(`  SOBRARAM ${sobrou} loja(s) de teste no banco.`);
    falhas++;
  } else {
    /* Só quando houve teste. Anunciar limpeza depois de um pulo diria
       que algo foi criado e desfeito, e nada foi. */
    if (!pulado) console.log('\nDados de teste removidos, aqui e no Asaas.');
  }
}

console.log(
  pulado
    ? '\nFINANCEIRO PULADO (Asaas em produção)\n'
    : falhas === 0
      ? '\nFINANCEIRO OK\n'
      : `\n${falhas} FALHA(S) NO FINANCEIRO\n`,
);

/* `exitCode` em vez de `process.exit`: sair no meio deixa handles
   abertos, e no Windows isso derruba o processo com uma asserção do
   libuv depois da mensagem final. Deixar o Node terminar sozinho dá o
   mesmo código de saída sem o barulho. */
process.exitCode = falhas === 0 ? 0 : 1;
