/**
 * Prova a proposta de SERVIÇO AVULSO, do gerador até o link do cliente.
 *
 *   npm run dev                      (noutro terminal)
 *   npm run testar-proposta-servico
 *
 * ============================================================
 * O QUE ESTE TESTE GUARDA
 * ============================================================
 * Os três pacotes começam em R$ 5.000 e foram desenhados para loja
 * virtual. Metade da carteira nova não é loja: chalé, concessionária,
 * clínica. Esses clientes compram gestão de tráfego, e às vezes somam
 * social media.
 *
 * Duas coisas não podem quebrar:
 *
 * 1. UMA PROPOSTA É OU PACOTE OU SERVIÇOS. As duas juntas dariam dois
 *    preços para a mesma coisa, e o cliente perguntaria qual vale.
 *
 * 2. O VALOR É DA PROPOSTA, NÃO DO CATÁLOGO. Gestão de tráfego para um
 *    chalé e para uma concessionária não custam o mesmo. O catálogo diz
 *    o que entrega; o preço é negociação.
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

const marca = `prs-${Date.now()}`;
const EMAIL = `${marca}@teste.local`;
const SENHA = 'Proposta-Servico-2026-xyz';
const CLIENTE = `${marca} Chales do Vale`;

let falhas = 0;
let usuarioId = null;
let navegador = null;
let slug = null;

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

/** Marca um radio ou checkbox pelo name (e value, quando radio). */
async function marcar(pagina, nome, valor) {
  return pagina.evaluate(
    (n, v) => {
      const sel = v ? `input[name="${n}"][value="${v}"]` : `input[name="${n}"]`;
      const el = document.querySelector(sel);
      if (!el) return false;
      el.click();
      return true;
    },
    nome,
    valor,
  );
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

  /* ---------------------------------------------------------------- */
  console.log('\nO gerador oferece as duas formas');

  await pagina.goto(`${APP}/painel/propostas`, { waitUntil: 'networkidle0', timeout: 60000 });
  const naTela = await pagina.evaluate(() => document.body.innerText);

  ok(/Pacote de e-commerce/i.test(naTela), 'existe a opção de pacote');
  ok(/Servi[çc]o avulso/i.test(naTela), 'e a de serviço avulso');
  ok(
    (await pagina.$('input[name="modo"][value="servicos"]')) !== null,
    'e as duas são o mesmo campo, então não dá para mandar as duas juntas',
  );

  /* ---------------------------------------------------------------- */
  console.log('\nGerar uma proposta de tráfego mais social media');

  ok(await marcar(pagina, 'modo', 'servicos'), 'escolheu serviço avulso');
  ok(await esperarSeletor(pagina, 'input[name="fee_trafego"]'), 'o campo de valor apareceu');

  const socialMarcado = await pagina.evaluate(
    () => document.querySelector('input[name="servico_social"]')?.checked ?? null,
  );
  ok(socialMarcado === false, 'criação de conteúdo começa DESMARCADA: é complemento, não padrão');

  const trafegoMarcado = await pagina.evaluate(
    () => document.querySelector('input[name="servico_trafego"]')?.checked ?? null,
  );
  ok(trafegoMarcado === true, 'e gestão de tráfego começa marcada, que é o principal');

  await preencher(pagina, 'input[name="cliente"]', CLIENTE);
  await preencher(pagina, 'input[name="contato"]', 'Marina, proprietária');
  await preencher(pagina, 'input[name="fee_trafego"]', '1.800');

  await marcar(pagina, 'servico_social');
  ok(
    await esperarSeletor(pagina, 'input[name="fee_social"]'),
    'marcar o complemento abre o valor dele',
  );
  await preencher(pagina, 'input[name="fee_social"]', '900');

  await preencher(
    pagina,
    'textarea[name="diagnostico"]',
    'Campanha rodando sem conversão configurada.\nPerfil parado há quatro meses.',
  );

  await clicar(pagina, 'Gerar rascunho');
  ok(await esperarTexto(pagina, 'rascunho criado'), 'a proposta foi gerada');

  const { data: prop } = await admin
    .from('proposta')
    .select('id, slug, cliente, status, corpo, resumo')
    .eq('cliente', CLIENTE)
    .maybeSingle();

  ok(Boolean(prop), 'está no banco');
  slug = prop?.slug;

  const corpo = prop?.corpo ?? {};
  ok(corpo.plano === null, 'NÃO gravou plano junto: é uma coisa ou a outra');
  ok(Array.isArray(corpo.servicos) && corpo.servicos.length === 2, 'gravou os dois serviços');

  const trafego = (corpo.servicos ?? []).find((s) => s.id === 'trafego');
  const social = (corpo.servicos ?? []).find((s) => s.id === 'social');
  ok(trafego?.fee === 1800, `o valor do tráfego é 1800 (é ${trafego?.fee})`);
  ok(social?.fee === 900, `e o do social é 900 (é ${social?.fee})`);
  ok(
    /gest[ãa]o de tr[áa]fego pago e cria[çc][ãa]o de conte[úu]do/i.test(prop?.resumo ?? ''),
    `o resumo padrão nomeia os serviços ("${(prop?.resumo ?? '').slice(0, 60)}...")`,
  );

  /* ---------------------------------------------------------------- */
  console.log('\nValor é obrigatório, e o catálogo não tem preço');

  await pagina.goto(`${APP}/painel/propostas`, { waitUntil: 'networkidle0', timeout: 60000 });
  await marcar(pagina, 'modo', 'servicos');
  await esperarSeletor(pagina, 'input[name="fee_trafego"]');
  await preencher(pagina, 'input[name="cliente"]', `${marca} Sem Valor`);
  await preencher(pagina, 'input[name="contato"]', 'Alguém');
  await preencher(pagina, 'input[name="fee_trafego"]', '');
  await clicar(pagina, 'Gerar rascunho');
  ok(
    await esperarTexto(pagina, 'informe o valor mensal'),
    'serviço marcado sem valor é recusado, dizendo qual',
  );

  const { count: naoCriou } = await admin
    .from('proposta')
    .select('id', { count: 'exact', head: true })
    .eq('cliente', `${marca} Sem Valor`);
  ok(naoCriou === 0, 'e nada foi gravado');

  /* ---------------------------------------------------------------- */
  console.log('\nO link do cliente');

  ok(prop?.status === 'rascunho', 'nasce como rascunho');

  const rascunho = await fetch(`${APP}/proposta/${slug}`);
  ok(rascunho.status === 404, `rascunho não abre para ninguém (${rascunho.status})`);

  await admin.from('proposta').update({ status: 'enviada' }).eq('id', prop.id);

  const publicada = await fetch(`${APP}/proposta/${slug}`);
  ok(publicada.status === 200, `publicada, o link abre (${publicada.status})`);

  await pagina.goto(`${APP}/proposta/${slug}`, { waitUntil: 'networkidle0', timeout: 60000 });
  const noDeck = await pagina.evaluate(() => document.body.innerText);

  ok(/Gest[ãa]o de tr[áa]fego pago/i.test(noDeck), 'o deck mostra o serviço principal');
  ok(/Cria[çc][ãa]o de conte[úu]do/i.test(noDeck), 'e o complemento');
  ok(/complemento/i.test(noDeck), 'marcado como complemento, e não como igual');
  ok(/1\.800/.test(noDeck), 'com o valor do tráfego');
  ok(/900/.test(noDeck), 'e o do social');
  ok(/2\.700/.test(noDeck), 'e a soma dos dois, para o cliente não somar errado');
  ok(/O que n[ãa]o entra/i.test(noDeck), 'diz o que NÃO está incluso, antes de assinar');
  ok(
    /verba de m[íi]dia/i.test(noDeck),
    'e separa a verba de mídia do valor do serviço',
  );
  ok(
    !/Saturno|Falcon|Apollo/.test(noDeck),
    'e não mostra nenhum pacote de e-commerce junto',
  );

  /* O catálogo é lido por advogada que vende curso, clínica e chalé.
     Palavra que só faz sentido em loja faz a proposta parecer modelo
     reaproveitado do negócio de outro. */
  const soDeLoja = ['loja virtual', 'e-commerce', 'carrinho', 'checkout', 'lojista'];
  const achadas = soDeLoja.filter((t) => new RegExp(t, 'i').test(noDeck));
  ok(
    achadas.length === 0,
    `o texto não assume que o cliente é loja (achei: ${achadas.join(', ') || 'nada'})`,
  );

  /* ---------------------------------------------------------------- */
  console.log('\nO pacote continua funcionando');

  await pagina.goto(`${APP}/painel/propostas`, { waitUntil: 'networkidle0', timeout: 60000 });
  await marcar(pagina, 'modo', 'plano');
  await preencher(pagina, 'input[name="cliente"]', `${marca} Loja Teste`);
  await preencher(pagina, 'input[name="contato"]', 'Sócio');
  await marcar(pagina, 'plano', 'falcon');
  await clicar(pagina, 'Gerar rascunho');
  ok(await esperarTexto(pagina, 'rascunho criado'), 'proposta de pacote ainda é gerada');

  const { data: pacote } = await admin
    .from('proposta')
    .select('corpo')
    .eq('cliente', `${marca} Loja Teste`)
    .maybeSingle();

  ok(pacote?.corpo?.plano === 'falcon', 'com o plano gravado');
  ok(
    Array.isArray(pacote?.corpo?.servicos) && pacote.corpo.servicos.length === 0,
    'e sem serviço nenhum junto',
  );
} catch (e) {
  console.error(`\nErro no teste: ${e.message}`);
  falhas++;
} finally {
  if (navegador) await navegador.close().catch(() => {});
  if (usuarioId) await admin.auth.admin.deleteUser(usuarioId).catch(() => {});

  await admin.from('proposta').delete().like('cliente', `${marca}%`);

  const { count: sobrou } = await admin
    .from('proposta')
    .select('id', { count: 'exact', head: true })
    .like('cliente', 'prs-%');
  if (sobrou) {
    console.error(`  SOBRARAM ${sobrou} proposta(s) de teste.`);
    falhas++;
  } else {
    console.log('\nDados de teste removidos.');
  }
}

console.log(falhas === 0 ? '\nPROPOSTA DE SERVICO OK\n' : `\n${falhas} FALHA(S)\n`);
process.exitCode = falhas === 0 ? 0 : 1;
