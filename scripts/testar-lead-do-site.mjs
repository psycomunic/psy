/**
 * Prova a página de tráfego pago: do formulário ao lead no CRM.
 *
 *   npm run dev                (noutro terminal)
 *   npm run testar-lead-do-site
 *
 * ============================================================
 * O QUE NÃO PODE QUEBRAR
 * ============================================================
 * 1. A TABELA `lead` CONTINUA FECHADA para a chave pública. Se um dia
 *    alguém abrir `insert` para `anon` "para simplificar", qualquer
 *    pessoa com a chave que vai no navegador despeja linhas na tabela.
 *    CRM entupido de lixo é a lista onde se procura o cliente que ligou
 *    ontem, e ela deixa de servir.
 *
 * 2. LEAD QUE CHEGA TEM DE AVISAR. Lead que ninguém vê é lead perdido,
 *    e é o caso mais caro de todos: a pessoa levantou a mão.
 *
 * 3. CLIQUE DUPLO NÃO VIRA DOIS LEADS.
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
const publico = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

const marca = `lds-${Date.now()}`;
const EMPRESA = `${marca} Concessionaria Teste`;
const TELEFONE = `4799${String(Date.now()).slice(-7)}`;

let falhas = 0;
let navegador = null;
let adminId = null;

const ok = (b, t) => {
  console.log(`  ${b ? 'PASSA' : 'FALHA'}  ${t}`);
  if (!b) falhas++;
};

async function preencher(pagina, seletor, valor) {
  const achou = await pagina.evaluate(
    (s, v) => {
      const el = document.querySelector(s);
      if (!el) return false;
      const proto =
        el instanceof HTMLSelectElement
          ? HTMLSelectElement.prototype
          : el instanceof HTMLTextAreaElement
            ? HTMLTextAreaElement.prototype
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

async function esperarTexto(pagina, contem, ms = 25000) {
  const ate = Date.now() + ms;
  while (Date.now() < ate) {
    const achou = await pagina.evaluate(
      (t) => (document.body.innerText ?? '').toLowerCase().includes(t.toLowerCase()),
      contem,
    );
    if (achou) return true;
    await new Promise((r) => setTimeout(r, 400));
  }
  return false;
}

const leadsDoTeste = () =>
  admin
    .from('lead')
    .select('id, nome, empresa, telefone, email, origem, estagio, valor_verba_estimada, observacoes, proximo_passo')
    .eq('telefone', TELEFONE)
    .then((r) => r.data ?? []);

try {
  /* Um administrador precisa existir para receber o aviso. */
  const { data: criado } = await admin.auth.admin.createUser({
    email: `${marca}@teste.local`,
    password: 'Lead-Do-Site-2026-xyz',
    email_confirm: true,
    app_metadata: { papel: 'administrador' },
  });
  adminId = criado.user.id;

  navegador = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const pagina = await navegador.newPage();
  await pagina.setViewport({ width: 1440, height: 1000 });

  /* ---------------------------------------------------------------- */
  console.log('\nA página está de pé');

  const r = await pagina.goto(`${APP}/trafego-pago`, {
    waitUntil: 'networkidle0',
    timeout: 60000,
  });
  ok(r.status() === 200, `/trafego-pago responde 200 (${r.status()})`);

  const texto = await pagina.evaluate(() => document.body.innerText);
  ok(/tr[áa]fego pago/i.test(texto), 'fala de tráfego pago');
  ok(/social media/i.test(texto), 'e cita social media como complemento');
  /*
    A ABERTURA, e nao a pagina inteira.

    Isto procurava a frase exata do titulo antigo em `body.innerText`, e
    passou a falhar quando a abertura foi reescrita: a frase continuava
    no payload do servidor, entao `textContent` a encontrava e
    `innerText` nao. O teste acusava um defeito que nao existia, e por
    uma palavra que ninguem prometeu manter.

    Uma frase copiada e um contrato que ninguem assinou. O que a pagina
    promete e falar com quem JA ANUNCIA, e essa promessa tem que estar
    na abertura, nao enterrada no rodape: por isso a leitura e do texto
    da propria secao de abertura.
  */
  const abertura = await pagina.evaluate(
    () => document.querySelector('section[aria-label="Abertura"]')?.innerText ?? '',
  );
  ok(
    /investe|anuncia|verba|campanha/i.test(abertura) && /volt|retorno|resultado/i.test(abertura),
    'a abertura fala com quem já anuncia, e não com quem nunca anunciou',
  );
  ok(/n[ãa]o serve para/i.test(texto), 'diz também para quem NÃO serve');

  /*
    Preço da AGÊNCIA não vai para o site público.

    A primeira versão desta checagem procurava "R$ 5.000" no HTML e
    acusava a própria página: as faixas do formulário dizem "Entre
    R$ 5.000 e R$ 15.000", que é a VERBA DO CLIENTE, não o valor da
    agência. Régua errada apontando para o lugar certo.

    O que denuncia vazamento de verdade é o nome dos planos: eles só
    existem em `src/dados/planos.ts`, que é `server-only`. Se um deles
    aparecer no HTML ou num pedaço de JavaScript, alguém importou o
    arquivo de onde não devia.
  */
  const html = await pagina.content();
  ok(
    !/Saturno|Falcon|Apollo/.test(html),
    'nenhum nome de plano vazou para o HTML da página pública',
  );

  const scripts = await pagina.evaluate(() =>
    [...document.querySelectorAll('script[src]')].map((s) => s.src),
  );
  let vazouNoBundle = false;
  for (const src of scripts) {
    const js = await fetch(src).then((x) => x.text()).catch(() => '');
    if (/Saturno|Falcon|Apollo/.test(js)) {
      vazouNoBundle = true;
      console.log(`         achado em ${src}`);
    }
  }
  ok(!vazouNoBundle, `nem para o JavaScript que o navegador baixa (${scripts.length} arquivos conferidos)`);

  /* ---------------------------------------------------------------- */
  console.log('\nA tabela `lead` continua fechada para a chave pública');

  const { error: eInsert } = await publico.from('lead').insert({
    nome: 'invasor',
    telefone: '4700000000',
  });
  ok(Boolean(eInsert), 'a chave pública NÃO consegue inserir lead direto');

  const { data: espiado } = await publico.from('lead').select('id').limit(1);
  ok((espiado ?? []).length === 0, 'nem ler');

  /* ---------------------------------------------------------------- */
  console.log('\nPreencher e enviar');

  /* O formulário recusa envio em menos de 2,5s, que é robô. */
  await new Promise((res) => setTimeout(res, 3000));

  await preencher(pagina, 'input[name="nome"]', 'Marina Teste');
  await preencher(pagina, 'input[name="empresa"]', EMPRESA);
  await preencher(pagina, 'input[name="telefone"]', TELEFONE);
  await preencher(pagina, 'input[name="email"]', `${marca}@exemplo.com.br`);
  await preencher(pagina, 'select[name="canal"]', 'ambos');
  await preencher(pagina, 'select[name="verba"]', '5000-15000');
  await preencher(
    pagina,
    'textarea[name="contexto"]',
    'Gasto todo mes e nao sei de onde vem os orcamentos.',
  );

  await pagina.evaluate(() => {
    document.querySelector('form button[type="submit"]')?.click();
  });

  ok(await esperarTexto(pagina, 'recebido'), 'a tela confirma o recebimento');

  let leads = await leadsDoTeste();
  ok(leads.length === 1, `nasceu UM lead (nasceram ${leads.length})`);

  const lead = leads[0];
  ok(lead?.empresa === EMPRESA, 'com a empresa certa');
  ok(lead?.origem === 'site-trafego', `com a origem marcada (${lead?.origem})`);
  ok(lead?.estagio === 'novo', 'no estágio novo');
  ok(
    Number(lead?.valor_verba_estimada) === 5000,
    `com o piso da faixa de verba (${lead?.valor_verba_estimada})`,
  );
  ok(
    /Anuncia hoje em/.test(lead?.observacoes ?? ''),
    'e o que a pessoa contou vira contexto para quem for atender',
  );
  ok(
    /an[áa]lise/i.test(lead?.proximo_passo ?? ''),
    `com próximo passo definido ("${lead?.proximo_passo}")`,
  );

  /* ---------------------------------------------------------------- */
  console.log('\nO aviso chegou');

  const { data: avisos } = await admin
    .from('notificacao')
    .select('tipo, titulo, corpo, link, perfil_id')
    .eq('perfil_id', adminId);

  ok((avisos ?? []).length === 1, `o administrador recebeu UM aviso (${avisos?.length ?? 0})`);
  ok(avisos?.[0]?.tipo === 'lead_novo', 'do tipo lead novo');
  ok(
    (avisos?.[0]?.titulo ?? '').includes(EMPRESA),
    'nomeando a empresa, e não só "novo lead"',
  );
  ok(avisos?.[0]?.link === '/painel/crm', 'levando direto para o CRM');

  /* ---------------------------------------------------------------- */
  console.log('\nEnvio repetido não vira segundo lead');

  await pagina.goto(`${APP}/trafego-pago`, { waitUntil: 'networkidle0', timeout: 60000 });
  await new Promise((res) => setTimeout(res, 3000));
  await preencher(pagina, 'input[name="nome"]', 'Marina Teste');
  await preencher(pagina, 'input[name="empresa"]', EMPRESA);
  await preencher(pagina, 'input[name="telefone"]', TELEFONE);
  await pagina.evaluate(() => {
    document.querySelector('form button[type="submit"]')?.click();
  });
  ok(await esperarTexto(pagina, 'recebido'), 'o segundo envio também confirma');

  leads = await leadsDoTeste();
  ok(leads.length === 1, `e continua havendo UM lead (há ${leads.length})`);

  /* ---------------------------------------------------------------- */
  console.log('\nO campo isca');

  await pagina.goto(`${APP}/trafego-pago`, { waitUntil: 'networkidle0', timeout: 60000 });
  const escondido = await pagina.evaluate(() => {
    const el = document.querySelector('input[name="site_url"]');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { existe: true, foraDaTela: r.right < 0 || r.left > window.innerWidth, tab: el.tabIndex };
  });
  ok(escondido?.existe === true, 'a isca existe no formulário');
  ok(escondido?.foraDaTela === true, 'fora da tela, onde ninguém preenche sem querer');
  ok(escondido?.tab === -1, 'e fora da ordem de tabulação');

  const TEL_ROBO = `4798${String(Date.now()).slice(-7)}`;
  await new Promise((res) => setTimeout(res, 3000));
  await preencher(pagina, 'input[name="nome"]', 'Robo Teste');
  await preencher(pagina, 'input[name="empresa"]', `${marca} Robo`);
  await preencher(pagina, 'input[name="telefone"]', TEL_ROBO);
  await preencher(pagina, 'input[name="site_url"]', 'http://spam.example');
  await pagina.evaluate(() => {
    document.querySelector('form button[type="submit"]')?.click();
  });
  await esperarTexto(pagina, 'recebido');

  const { count: doRobo } = await admin
    .from('lead')
    .select('id', { count: 'exact', head: true })
    .eq('telefone', TEL_ROBO);
  ok(
    doRobo === 0,
    'quem preenche a isca recebe "recebido" e NÃO entra no CRM (dizer que recusou ensinaria o robô)',
  );
} catch (e) {
  console.error(`\nErro no teste: ${e.message}`);
  falhas++;
} finally {
  if (navegador) await navegador.close().catch(() => {});

  await admin.from('notificacao').delete().like('titulo', `%${marca}%`);
  if (adminId) {
    await admin.from('notificacao').delete().eq('perfil_id', adminId);
    await admin.auth.admin.deleteUser(adminId).catch(() => {});
  }
  /* Com o erro conferido. Apagar sem olhar o retorno foi como seis
     lojas de teste ficaram na produção antes. */
  const { error: eLead } = await admin.from('lead').delete().like('empresa', `${marca}%`);
  if (eLead) {
    console.error(`  NÃO REMOVEU os leads de teste: ${eLead.message}`);
    falhas++;
  }

  const { count: sobrou } = await admin
    .from('lead')
    .select('id', { count: 'exact', head: true })
    .like('empresa', 'lds-%');
  if (sobrou) {
    console.error(`  SOBRARAM ${sobrou} lead(s) de teste.`);
    falhas++;
  } else {
    console.log('\nDados de teste removidos.');
  }
}

console.log(falhas === 0 ? '\nLEAD DO SITE OK\n' : `\n${falhas} FALHA(S)\n`);
process.exitCode = falhas === 0 ? 0 : 1;
