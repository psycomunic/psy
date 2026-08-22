/**
 * Confere o painel EM PRODUÇÃO, logado.
 *
 *   npm run conferir-producao
 *
 * POR QUE ISTO EXISTE
 *
 * "O deploy passou" não é a mesma coisa que "a tela está lá". O build
 * pode compilar e a rota responder 200 servindo a versão anterior de
 * cache, ou uma variável de ambiente que só existe localmente pode
 * derrubar um módulo inteiro sem derrubar o site.
 *
 * Este script entra com um usuário descartável, abre cada módulo e
 * procura os elementos que a versão nova trouxe. O usuário é apagado
 * no fim, sempre — inclusive quando o teste falha.
 *
 * NÃO ESCREVE NADA. Só lê telas. Nenhuma cobrança é emitida, nenhuma
 * tarefa é criada: é produção, e o painel tem cliente de verdade.
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

const APP = process.env.APP_URL ?? 'https://www.psycomunic.com.br';
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const marca = `prod-${Date.now()}`;
const EMAIL = `${marca}@teste.local`;
const SENHA = 'Conferir-Producao-2026-xyz';

let falhas = 0;
let usuarioId = null;
let navegador = null;

const ok = (b, t) => {
  console.log(`  ${b ? 'PASSA' : 'FALHA'}  ${t}`);
  if (!b) falhas++;
};

try {
  console.log(`\nConferindo ${APP}\n`);

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

  await pagina.goto(`${APP}/entrar`, { waitUntil: 'networkidle0', timeout: 90000 });
  await pagina.type('input[name="email"]', EMAIL);
  await pagina.type('input[name="senha"]', SENHA);
  await Promise.all([
    pagina.waitForNavigation({ waitUntil: 'networkidle0', timeout: 90000 }),
    pagina.click('button[type="submit"]'),
  ]);

  const texto = async (rota) => {
    await pagina.goto(`${APP}${rota}`, { waitUntil: 'networkidle0', timeout: 90000 });
    return pagina.evaluate(() => document.body.innerText);
  };

  /* ---------------------------------------------------------------- */
  console.log('Financeiro');

  const fin = await texto('/painel/financeiro');
  ok(/Vis[aã]o[\s\S]{0,80}Cobran[çc]as/i.test(fin), 'as abas apareceram');
  ok(/Faturar o m[eê]s inteiro/i.test(fin), 'o botão "Faturar o mês inteiro" está lá');
  ok(/Conferir cobran[çc]as/i.test(fin), 'e o "Conferir cobranças"');
  ok(/Resultado do m[eê]s/i.test(fin), 'o resultado do mês aparece');
  ok(/Saldo no Asaas/i.test(fin), 'e o saldo do Asaas');

  /*
    O aviso de sandbox tem de bater com o ambiente REAL, nos dois
    sentidos.

    A primeira versão simplesmente exigia o aviso. Quando o Asaas virou
    para produção o aviso sumiu — correto — e o conferidor acusou falha
    apontando para o comportamento certo. Teste que só sabe verificar um
    dos estados vira alarme falso no dia em que o estado muda, e alarme
    falso ensina a ignorar alarme.

    Nos dois lados importa: aviso faltando em sandbox faz alguém achar
    que cobrou de verdade; aviso sobrando em produção faz alguém achar
    que não cobrou.
  */
  const amb = await fetch(`${APP}/api/asaas`)
    .then((r) => r.json())
    .then((j) => j.ambiente)
    .catch(() => null);

  const temAviso = /O Asaas está em/i.test(fin);
  ok(
    amb === 'sandbox' ? temAviso : !temAviso,
    amb === 'sandbox'
      ? 'com o aviso de que o Asaas está em sandbox'
      : `sem aviso de sandbox, porque o ambiente é ${amb ?? 'desconhecido'}`,
  );

  const cob = await texto('/painel/financeiro?aba=cobrancas');
  ok(/Nova cobran[çc]a/i.test(cob), 'a aba Cobranças tem "Nova cobrança"');

  const ctr = await texto('/painel/financeiro?aba=contratos');
  ok(/Novo contrato/i.test(ctr), 'a aba Contratos tem "Novo contrato"');

  const desp = await texto('/painel/financeiro?aba=despesas');
  ok(/Nova despesa/i.test(desp), 'a aba Despesas tem "Nova despesa"');

  /* ---------------------------------------------------------------- */
  console.log('\nTarefas');

  const tar = await texto('/painel/tarefas');
  ok(/Nova tarefa/i.test(tar), 'o botão "Nova tarefa" está lá');
  ok(/Hoje e atrasadas/i.test(tar), 'os filtros apareceram');

  const sino = await pagina.evaluate(() =>
    Boolean(document.querySelector('button[aria-label^="Avisos"]')),
  );
  ok(sino, 'o sino de avisos está no menu');

  /* ---------------------------------------------------------------- */
  console.log('\nClientes');

  const cli = await texto('/painel/contas');
  ok(/Novo cliente/i.test(cli), 'o cadastro diz "Novo cliente", e não "Nova loja"');

  await pagina.evaluate(() =>
    [...document.querySelectorAll('button')]
      .find((b) => b.textContent.includes('Novo cliente'))
      ?.click(),
  );
  await new Promise((r) => setTimeout(r, 800));

  const tipos = await pagina.evaluate(() =>
    [...document.querySelectorAll('select[name="tipo"] option')].map((o) => o.value),
  );
  ok(
    ['ecommerce', 'trafego', 'outro'].every((t) => tipos.includes(t)),
    `o campo de tipo tem as três opções (achei ${tipos.join(', ') || 'nenhuma'})`,
  );

  /* ---------------------------------------------------------------- */
  console.log('\nA rota de lembretes');

  const semToken = await fetch(`${APP}/api/lembretes`);
  const corpo = await semToken.json().catch(() => ({}));
  ok(
    semToken.status === 401 || semToken.status === 503,
    `recusa quem não tem token (${semToken.status})`,
  );
  if (semToken.status === 503) {
    console.log(`         ${corpo.erro ?? ''}`);
    console.log('         Falta a variável na Vercel. A rotina não roda até ela existir.');
  }
} catch (e) {
  console.error(`\nErro: ${e.message}`);
  falhas++;
} finally {
  if (navegador) await navegador.close().catch(() => {});
  if (usuarioId) {
    const { error } = await admin.auth.admin.deleteUser(usuarioId);
    if (error) {
      console.error(`  NÃO REMOVEU o usuário de teste ${EMAIL}: ${error.message}`);
      falhas++;
    } else {
      console.log('\nUsuário de conferência removido.');
    }
  }
}

console.log(falhas === 0 ? '\nPRODUCAO OK\n' : `\n${falhas} FALHA(S) EM PRODUCAO\n`);
process.exit(falhas === 0 ? 0 : 1);
