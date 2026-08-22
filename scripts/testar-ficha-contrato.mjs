/**
 * Prova que dá para dizer quanto o cliente paga SEM sair da ficha dele.
 *
 *   npm run dev                    (noutro terminal)
 *   npm run testar-ficha-contrato
 *
 * ============================================================
 * A FALHA DE PERCURSO QUE ISTO GUARDA
 * ============================================================
 * A ficha do cliente tem uma aba chamada "Contrato". Ela dizia "Nenhum
 * contrato cadastrado." e não oferecia como cadastrar: a criação vivia
 * só em Financeiro, noutro módulo, atrás de um seletor de cliente.
 *
 * Quem acabava de cadastrar um cliente e queria registrar quanto ele
 * paga chegava exatamente ali, lia que não havia contrato, e não tinha
 * o que clicar. A tela respondia a pergunta certa com um beco.
 *
 * E havia uma segunda pergunta junto, que a aba não respondia: se o
 * valor é todo mês ou uma vez só. São dois caminhos diferentes — fee
 * recorrente e cobrança avulsa — e um deles estava noutro módulo.
 *
 * ============================================================
 * O QUE ESTE TESTE NÃO FAZ
 * ============================================================
 * Não clica em nada que emita cobrança. Cadastrar contrato não fala com
 * o Asaas; só "Faturar" fala. A cobrança avulsa é conferida na tela,
 * sem enviar — com o Asaas em produção, enviar cobraria de verdade.
 */
import { readFileSync, existsSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
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

const marca = `fch-${Date.now()}`;
const EMAIL = `${marca}@teste.local`;
const SENHA = 'Ficha-Contrato-2026-xyz';
const CLIENTE = `${marca}-Chales de Teste`;

let falhas = 0;
let usuarioId = null;
let contaId = null;
let navegador = null;

const ok = (b, t) => {
  console.log(`  ${b ? 'PASSA' : 'FALHA'}  ${t}`);
  if (!b) falhas++;
};

const hojeBR = () => new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10);

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

async function esperarTexto(pagina, contem, ms = 20000) {
  const ate = Date.now() + ms;
  while (Date.now() < ate) {
    const achou = await pagina.evaluate(
      (t) =>
        [...document.querySelectorAll('[role="status"]')].some((n) =>
          (n.textContent ?? '').toLowerCase().includes(t.toLowerCase()),
        ),
      contem,
    );
    if (achou) return true;
    await new Promise((r) => setTimeout(r, 300));
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

try {
  const { data: conta, error: eConta } = await admin
    .from('conta')
    .insert({
      nome: CLIENTE,
      situacao: 'ativa',
      tipo: 'trafego',
      segmento: 'Chalés e pousadas',
      documento: '11222333000181',
    })
    .select('id')
    .single();
  if (eConta) throw new Error(`não criou o cliente: ${eConta.message}`);
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
  await pagina.setViewport({ width: 1440, height: 1000 });

  await pagina.goto(`${APP}/entrar`, { waitUntil: 'networkidle0', timeout: 60000 });
  await pagina.type('input[name="email"]', EMAIL);
  await pagina.type('input[name="senha"]', SENHA);
  await Promise.all([
    pagina.waitForNavigation({ waitUntil: 'networkidle0', timeout: 60000 }),
    pagina.click('button[type="submit"]'),
  ]);

  const abrirAba = () =>
    pagina.goto(`${APP}/painel/contas?ficha=${contaId}&aba=contrato`, {
      waitUntil: 'networkidle0',
      timeout: 60000,
    });

  /* ---------------------------------------------------------------- */
  console.log('\nA aba responde a pergunta que traz alguém até ela');

  await abrirAba();
  const texto = await pagina.evaluate(() => document.body.innerText);

  ok(
    /Todo m[eê]s, sempre o mesmo valor/i.test(texto),
    'a aba oferece o caminho do valor mensal',
  );
  ok(/Uma vez s[oó]/i.test(texto), 'e o da cobrança única');
  ok(
    !/Nenhum contrato cadastrado\.$/m.test(texto) || /Novo contrato/i.test(texto),
    'não é mais um beco: existe o que clicar',
  );

  /* ---------------------------------------------------------------- */
  console.log('\nO cliente já vem preenchido');

  ok(await clicar(pagina, 'Novo contrato'), 'existe o botão "Novo contrato"');
  ok(await esperarSeletor(pagina, 'input[name="fee_mensal"]'), 'o formulário abriu');

  const semSeletor = await pagina.evaluate(
    () => document.querySelector('select[name="conta_id"]') === null,
  );
  ok(semSeletor, 'sem seletor de cliente: dentro da ficha, não há o que escolher');

  const escondido = await pagina.evaluate(
    () => document.querySelector('input[name="conta_id"]')?.value ?? null,
  );
  ok(escondido === contaId, 'e o cliente correto vai junto, escondido');

  const nomeNaTela = await pagina.evaluate(() => document.body.innerText);
  ok(nomeNaTela.includes(CLIENTE), 'com o nome dele visível, para não haver dúvida');

  /* ---------------------------------------------------------------- */
  console.log('\nCadastrar o valor mensal');

  await preencher(pagina, 'input[name="plano"]', 'Gestão de tráfego');
  await preencher(pagina, 'input[name="fee_mensal"]', '1.800');
  await preencher(pagina, 'input[name="inicio"]', `${hojeBR().slice(0, 7)}-01`);
  await preencher(pagina, 'input[name="dia_vencimento"]', '5');
  await clicar(pagina, 'Cadastrar contrato');
  ok(await esperarTexto(pagina, 'cadastrado'), 'o contrato foi cadastrado');

  const { data: c } = await admin
    .from('contrato')
    .select('plano, fee_mensal, dia_vencimento, conta_id')
    .eq('conta_id', contaId)
    .maybeSingle();

  ok(Boolean(c), 'está no banco');
  ok(Number(c?.fee_mensal) === 1800, `com o valor 1800 (ficou ${c?.fee_mensal})`);
  ok(Number(c?.dia_vencimento) === 5, 'e o vencimento no dia 5');
  ok(c?.conta_id === contaId, 'ligado ao cliente certo, e não a outro');

  /* ---------------------------------------------------------------- */
  console.log('\nDepois de cadastrado, a aba mostra e deixa mexer');

  await abrirAba();
  const depois = await pagina.evaluate(() => document.body.innerText);

  ok(/1\.800/.test(depois), 'o valor aparece na ficha');
  ok(/dia 5/i.test(depois), 'com o dia do vencimento');
  ok(/Reajustar/i.test(depois), 'dá para reajustar sem sair daqui');
  ok(/Cobrar automaticamente/i.test(depois), 'e ligar a cobrança automática');
  ok(
    /J[aá] existe um contrato sem data de fim/i.test(depois),
    'e o formulário de novo contrato dá lugar à explicação',
  );

  /* ---------------------------------------------------------------- */
  console.log('\nA cobrança única continua ali, e também já sabe o cliente');

  ok(await clicar(pagina, 'Cobrança única'), 'existe o botão "Cobrança única"');
  ok(await esperarSeletor(pagina, 'input[name="descricao"]'), 'o formulário abriu');

  const avulsa = await pagina.evaluate(() => {
    const f = [...document.querySelectorAll('form')].find((x) =>
      x.querySelector('input[name="descricao"]'),
    );
    return {
      temSeletor: Boolean(f?.querySelector('select[name="conta_id"]')),
      conta: f?.querySelector('input[name="conta_id"]')?.value ?? null,
      temParcelas: Boolean(f?.querySelector('input[name="parcelas"]')),
    };
  });

  ok(!avulsa.temSeletor, 'também sem seletor de cliente');
  ok(avulsa.conta === contaId, 'com o cliente certo escondido');
  ok(avulsa.temParcelas, 'e com parcelamento disponível');

  /* NÃO envia: com o Asaas em produção, isto emitiria cobrança real. */
  console.log('  (não enviado de propósito — emitiria cobrança de verdade)');
} catch (e) {
  console.error(`\nErro no teste: ${e.message}`);
  falhas++;
} finally {
  if (navegador) await navegador.close().catch(() => {});
  if (usuarioId) await admin.auth.admin.deleteUser(usuarioId).catch(() => {});

  if (contaId) {
    await admin.from('fatura').delete().eq('conta_id', contaId);
    await admin.from('contrato').delete().eq('conta_id', contaId);
    const { error } = await admin.from('conta').delete().eq('id', contaId);
    if (error) {
      console.error(`  NÃO REMOVEU o cliente ${contaId}: ${error.message}`);
      falhas++;
    }
  }

  const { count: sobrou } = await admin
    .from('conta')
    .select('id', { count: 'exact', head: true })
    .like('nome', 'fch-%');
  if (sobrou) {
    console.error(`  SOBRARAM ${sobrou} cliente(s) de teste.`);
    falhas++;
  } else {
    console.log('\nDados de teste removidos.');
  }
}

console.log(falhas === 0 ? '\nFICHA CONTRATO OK\n' : `\n${falhas} FALHA(S)\n`);
process.exitCode = falhas === 0 ? 0 : 1;
