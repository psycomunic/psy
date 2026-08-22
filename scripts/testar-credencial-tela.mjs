/**
 * Prova que campo em branco NÃO apaga o que já estava guardado.
 *
 *   npm run dev                      (noutro terminal)
 *   npm run testar-credencial-tela
 *
 * ============================================================
 * O DEFEITO QUE ISTO GUARDA
 * ============================================================
 * Os segredos não voltam para a tela — é isso que faz a tela de
 * configurações não ser um lugar de onde se copia token. A primeira
 * versão de `guardarCredencial`, porém, SUBSTITUÍA o conjunto inteiro:
 * campo não preenchido virava campo apagado.
 *
 * O estrago aparecia no pior momento. Trocar o Asaas de sandbox para
 * produção é preencher chave e ambiente; quem deixasse o "token do
 * webhook" em branco — por não ter o valor à mão, já que a tela não o
 * mostra — apagava o token sem aviso nenhum. As cobranças continuariam
 * saindo e a confirmação de pagamento pararia de chegar, porque a rota
 * de retorno passa a recusar tudo sem token. O painel diria que
 * ninguém pagou.
 *
 * ============================================================
 * POR QUE O TESTE USA GA4, E NÃO ASAAS
 * ============================================================
 * Porque o Asaas está conectado de verdade neste banco. Gravar uma
 * credencial de teste com o mesmo provedor arriscaria a rotina de
 * cobrança escolher a linha errada. GA4 não tem credencial nenhuma e
 * não alimenta rotina alguma hoje.
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

const marca = `crd-${Date.now()}`;
const EMAIL = `${marca}@teste.local`;
const SENHA = 'Credencial-Tela-2026-xyz';
const ROTULO = `teste-${Date.now()}`;

let falhas = 0;
let usuarioId = null;
let navegador = null;

const ok = (b, t) => {
  console.log(`  ${b ? 'PASSA' : 'FALHA'}  ${t}`);
  if (!b) falhas++;
};

/** Lê e decifra o que está guardado, como a aplicação faria. */
async function guardado() {
  const { data } = await admin
    .from('credencial_agencia')
    .select('segredo, configuracao')
    .eq('provedor', 'ga4')
    .eq('rotulo', ROTULO)
    .maybeSingle();

  if (!data?.segredo) return null;

  const chave = Buffer.from((env.CRIPTO_CHAVE ?? '').trim(), 'base64url');
  const [v, iv, tag, cif] = data.segredo.split('.');
  if (v !== 'v1') return null;
  const d = createDecipheriv('aes-256-gcm', chave, Buffer.from(iv, 'base64url'));
  d.setAuthTag(Buffer.from(tag, 'base64url'));
  const s = JSON.parse(
    d.update(Buffer.from(cif, 'base64url'), undefined, 'utf8') + d.final('utf8'),
  );
  return { segredos: s, configuracao: data.configuracao ?? {} };
}

async function preencherGa4(pagina, valores) {
  return pagina.evaluate((vals) => {
    /* O do GA4 tem refresh_token e NÃO tem login_customer_id, que é o
       que separa dele o formulário do Google Ads. */
    const form = [...document.querySelectorAll('form')].find(
      (f) =>
        f.querySelector('input[name="refresh_token"]') &&
        !f.querySelector('input[name="login_customer_id"]'),
    );
    if (!form) return false;

    const set = (nome, valor) => {
      const el = form.querySelector(`[name="${nome}"]`);
      if (!el) return;
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, valor);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    };

    for (const [k, v] of Object.entries(vals)) set(k, v);

    const enviar = [...form.querySelectorAll('button')].find((b) =>
      /guardar/i.test(b.textContent ?? ''),
    );
    if (!enviar) return false;
    enviar.click();
    return true;
  }, valores);
}

async function esperar(pagina, contem, ms = 20000) {
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

try {
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
  await pagina.setViewport({ width: 1440, height: 1200 });

  await pagina.goto(`${APP}/entrar`, { waitUntil: 'networkidle0', timeout: 60000 });
  await pagina.type('input[name="email"]', EMAIL);
  await pagina.type('input[name="senha"]', SENHA);
  await Promise.all([
    pagina.waitForNavigation({ waitUntil: 'networkidle0', timeout: 60000 }),
    pagina.click('button[type="submit"]'),
  ]);

  const abrirConfig = async () => {
    await pagina.goto(`${APP}/painel/configuracoes`, {
      waitUntil: 'networkidle0',
      timeout: 60000,
    });
    /*
      Abre SÓ a dobra do GA4.

      A primeira versão abria todas as que casavam com /conectar/, e aí
      o formulário do Google Ads — que também tem um campo
       — aparecia antes na página. O teste preenchia
      aquele, deixava em branco o  que lá é
      obrigatório, e o navegador barrava o envio sem uma palavra. Doze
      conferências falharam apontando para o código, que estava certo.
    */
    await pagina.evaluate(() => {
      /* Depois da primeira gravação o botão passa a se chamar
         'Substituir credencial', igual ao dos outros provedores. Por
         isso a busca é pelo CARTÃO que fala de Google Analytics, e não
         pelo texto do botão. */
      const cartao = [...document.querySelectorAll('li')].find((li) =>
        /Google Analytics/i.test(li.querySelector('p')?.textContent ?? ''),
      );
      const b = [...(cartao?.querySelectorAll('button') ?? [])].find((x) =>
        /conectar|substituir/i.test(x.textContent ?? ''),
      );
      if (b) b.click();
    });
    await new Promise((r) => setTimeout(r, 800));
  };

  /* ---------------------------------------------------------------- */
  console.log('\nGravar os três campos');

  await abrirConfig();
  ok(
    await preencherGa4(pagina, {
      rotulo: ROTULO,
      client_id: 'id-original',
      client_secret: 'segredo-original',
      refresh_token: 'refresh-original',
    }),
    'o formulário do GA4 existe e foi enviado',
  );
  ok(await esperar(pagina, 'guardada'), 'a credencial foi guardada');

  let g = await guardado();
  ok(Boolean(g), 'está no banco');
  ok(g?.configuracao?.client_id === 'id-original', 'o client_id ficou na configuração');
  ok(g?.segredos?.client_secret === 'segredo-original', 'o client_secret foi cifrado');
  ok(g?.segredos?.refresh_token === 'refresh-original', 'e o refresh_token também');

  /* ---------------------------------------------------------------- */
  console.log('\nGravar de novo com DOIS campos em branco');

  await abrirConfig();
  ok(
    await preencherGa4(pagina, {
      rotulo: ROTULO,
      client_id: 'id-trocado',
      client_secret: '',
      refresh_token: '',
    }),
    'enviou trocando só o client_id',
  );
  ok(await esperar(pagina, 'guardada'), 'aceitou sem exigir os outros dois');

  g = await guardado();
  ok(g?.configuracao?.client_id === 'id-trocado', 'o campo preenchido foi trocado');
  ok(
    g?.segredos?.client_secret === 'segredo-original',
    `o client_secret em branco SOBREVIVEU (ficou "${g?.segredos?.client_secret ?? 'apagado'}")`,
  );
  ok(
    g?.segredos?.refresh_token === 'refresh-original',
    `e o refresh_token também (ficou "${g?.segredos?.refresh_token ?? 'apagado'}")`,
  );

  /* ---------------------------------------------------------------- */
  console.log('\nE trocar um segredo continua trocando');

  await abrirConfig();
  await preencherGa4(pagina, {
    rotulo: ROTULO,
    client_id: '',
    client_secret: 'segredo-novo',
    refresh_token: '',
  });
  ok(await esperar(pagina, 'guardada'), 'guardou de novo');

  g = await guardado();
  ok(g?.segredos?.client_secret === 'segredo-novo', 'o segredo preenchido foi substituído');
  ok(g?.configuracao?.client_id === 'id-trocado', 'e o resto seguiu intacto');
  ok(g?.segredos?.refresh_token === 'refresh-original', 'inclusive o refresh_token original');
} catch (e) {
  console.error(`\nErro no teste: ${e.message}`);
  falhas++;
} finally {
  if (navegador) await navegador.close().catch(() => {});
  if (usuarioId) await admin.auth.admin.deleteUser(usuarioId).catch(() => {});

  const { error } = await admin
    .from('credencial_agencia')
    .delete()
    .eq('provedor', 'ga4')
    .eq('rotulo', ROTULO);
  if (error) {
    console.error(`  NÃO REMOVEU a credencial de teste: ${error.message}`);
    falhas++;
  }

  /* O Asaas de verdade não pode ter sido tocado. */
  const { count: asaas } = await admin
    .from('credencial_agencia')
    .select('id', { count: 'exact', head: true })
    .eq('provedor', 'asaas');
  if (asaas !== 1) {
    console.error(`  ATENÇÃO: existem ${asaas} credenciais de Asaas. Deveria haver 1.`);
    falhas++;
  }

  console.log('\nDados de teste removidos.');
}

console.log(falhas === 0 ? '\nCREDENCIAL NA TELA OK\n' : `\n${falhas} FALHA(S)\n`);
process.exit(falhas === 0 ? 0 : 1);
