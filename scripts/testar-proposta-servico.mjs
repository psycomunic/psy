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
  /* Nao preenche: o campo ja vem com o valor sugerido de tabela. */

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
  ok(social?.fee === 2500, `e o do conteudo veio da tabela, 2500 (veio ${social?.fee})`);
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
  ok(/2.500/.test(noDeck), 'e o do conteudo');
  /*
    O total começa SEM o opcional.

    Complemento que já vem somado é empurrar: a pessoa lê um número
    maior do que pediu e descobre o motivo depois, se descobrir. Aqui
    ela vê o essencial, e o total sobe só quando ela marca.
  */
  ok(
    /1\.800/.test(noDeck) && !/4\.300/.test(noDeck),
    'o total abre sem o opcional, em R$ 1.800',
  );

  const somou = await pagina.evaluate(() => {
    const caixas = [...document.querySelectorAll('input[type="checkbox"]')];
    if (caixas.length === 0) return null;
    caixas[0].click();
    return true;
  });
  ok(somou === true, 'quem lê consegue marcar o opcional');

  await new Promise((r) => setTimeout(r, 400));
  const comOpcional = await pagina.evaluate(() => document.body.innerText);
  ok(
    /4\.300/.test(comOpcional),
    'e o total sobe sozinho para R$ 4.300, sem o cliente somar',
  );
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
  /* Travessao no meio da frase e a marca registrada de texto de IA,
     e o cliente le esta proposta inteira. */
  const comTravessao = (noDeck.match(/ — /g) ?? []).length;
  ok(comTravessao === 0, `nenhum travessao no meio de frase (achei ${comTravessao})`);

  ok(!/edi[çc][ãa]o.{0,20}v[íi]deo/i.test(noDeck), 'edicao de video saiu da proposta');
  ok(/opcional/i.test(noDeck), 'o complemento aparece marcado como opcional');
  ok(
    /Quero incluir na proposta/i.test(noDeck),
    'e quem le pode selecionar se quiser',
  );

  ok(
    achadas.length === 0,
    `o texto não assume que o cliente é loja (achei: ${achadas.join(', ') || 'nada'})`,
  );



  /* ---------------------------------------------------------------- */
  console.log('\nA previa do link no WhatsApp');

  const meta = (html, prop) => {
    const m = html.match(
      new RegExp(`<meta[^>]+(?:property|name)="${prop}"[^>]+content="([^"]*)"`, 'i'),
    ) ?? html.match(
      new RegExp(`<meta[^>]+content="([^"]*)"[^>]+(?:property|name)="${prop}"`, 'i'),
    );
    return m ? m[1] : null;
  };

  const htmlDaProposta = await fetch(`${APP}/proposta/${slug}`).then((r) => r.text());

  const ogTitulo = meta(htmlDaProposta, 'og:title');
  const ogDescricao = meta(htmlDaProposta, 'og:description');
  const ogImagem = meta(htmlDaProposta, 'og:image');

  ok(
    (ogTitulo ?? '').includes(CLIENTE),
    `o título da prévia nomeia o cliente ("${ogTitulo}")`,
  );
  ok(
    !/E-commerce, tráfego pago e performance/i.test(ogTitulo ?? ''),
    'e não é mais o título da home',
  );
  ok(
    (ogDescricao ?? '').length > 20 && !/Diagnóstico gratuito nas quatro frentes/i.test(ogDescricao ?? ''),
    'a descrição é o resumo desta proposta, e não o do site',
  );
  ok(
    (ogImagem ?? '').includes(`/proposta/${slug}/opengraph-image`),
    `a imagem é a desta proposta ("${(ogImagem ?? '').slice(-60)}")`,
  );

  /* PREÇO NÃO VAZA PARA A PRÉVIA. Ela aparece na lista de conversas e
     no encaminhamento para grupo, onde qualquer um lê por cima do
     ombro. O valor está dentro da proposta, que tem contexto. */
  ok(
    !/1\.800|2\.500|4\.300|R\$/.test(`${ogTitulo} ${ogDescricao}`),
    'e nenhum valor aparece na prévia',
  );

  const imagem = await fetch(new URL(ogImagem, APP));
  ok(imagem.status === 200, `a imagem responde 200 (${imagem.status})`);
  ok(
    (imagem.headers.get('content-type') ?? '').includes('image/'),
    `e é uma imagem de verdade (${imagem.headers.get('content-type')})`,
  );

  /* O buscador continua fora. og:title nao indexa nada, mas a regra
     precisa continuar valendo. */
  const robots = meta(htmlDaProposta, 'robots');
  ok(/noindex/i.test(robots ?? ''), `a proposta segue fora dos buscadores ("${robots}")`);

  /* ---------------------------------------------------------------- */
  console.log('\nEditar');

  await pagina.goto(`${APP}/painel/propostas?editar=${prop.id}`, {
    waitUntil: 'networkidle0',
    timeout: 60000,
  });

  const preenchido = await pagina.evaluate(() => ({
    cliente: document.querySelector('input[name="cliente"]')?.value ?? null,
    contato: document.querySelector('input[name="contato"]')?.value ?? null,
    feeTrafego: document.querySelector('input[name="fee_trafego"]')?.value ?? null,
    feeSocial: document.querySelector('input[name="fee_social"]')?.value ?? null,
    diagnostico: document.querySelector('textarea[name="diagnostico"]')?.value ?? null,
    modo: document.querySelector('input[name="modo"][value="servicos"]')?.checked ?? null,
    id: document.querySelector('input[name="id"]')?.value ?? null,
  }));

  ok(preenchido.cliente === CLIENTE, 'o formulário abre com o cliente preenchido');
  ok(preenchido.id === prop.id, 'e carrega o id da proposta que está sendo editada');
  ok(preenchido.modo === true, 'já no modo serviço avulso, que era o dela');
  ok(preenchido.feeTrafego === '1.800', `com o valor do tráfego (${preenchido.feeTrafego})`);
  ok(preenchido.feeSocial === '2.500', `e o do conteúdo (${preenchido.feeSocial})`);
  ok(
    /convers[ãa]o configurada/i.test(preenchido.diagnostico ?? ''),
    'e o diagnóstico que tinha sido escrito',
  );

  await preencher(pagina, 'input[name="fee_trafego"]', '2.200');
  await clicar(pagina, 'Salvar alterações');
  ok(await esperarTexto(pagina, 'atualizada'), 'a edição foi salva');

  const { data: depois } = await admin
    .from('proposta')
    .select('slug, versao, corpo')
    .eq('id', prop.id)
    .maybeSingle();

  ok(
    depois?.corpo?.servicos?.find((s) => s.id === 'trafego')?.fee === 2200,
    `o valor novo foi gravado (${depois?.corpo?.servicos?.find((s) => s.id === 'trafego')?.fee})`,
  );
  ok(Number(depois?.versao) === 2, `a versão subiu para 2 (é ${depois?.versao})`);
  ok(depois?.slug === slug, 'e o link NÃO mudou: ele já foi mandado para alguém');

  const noDeck2 = await fetch(`${APP}/proposta/${slug}`).then((r) => r.text());
  ok(/2\.200/.test(noDeck2), 'o link já mostra o valor novo');

  /* ---------------------------------------------------------------- */
  console.log('\nProposta aceita não se edita nem se apaga');

  await admin.from('proposta').update({ status: 'aceita' }).eq('id', prop.id);

  await pagina.goto(`${APP}/painel/propostas?editar=${prop.id}`, {
    waitUntil: 'networkidle0',
    timeout: 60000,
  });
  await preencher(pagina, 'input[name="fee_trafego"]', '9.999');
  await clicar(pagina, 'Salvar alterações');
  ok(
    await esperarTexto(pagina, 'já foi aceita'),
    'editar uma proposta aceita é recusado, com o motivo',
  );

  const { data: intacta } = await admin
    .from('proposta')
    .select('corpo')
    .eq('id', prop.id)
    .maybeSingle();
  ok(
    intacta?.corpo?.servicos?.find((s) => s.id === 'trafego')?.fee === 2200,
    'e o valor continua o que estava',
  );

  await pagina.goto(`${APP}/painel/propostas`, { waitUntil: 'networkidle0', timeout: 60000 });
  const semBotoes = await pagina.evaluate(
    (c) => {
      const linha = [...document.querySelectorAll('tr')].find((t) =>
        (t.textContent ?? '').includes(c),
      );
      if (!linha) return null;
      const textos = [...linha.querySelectorAll('a,button')].map((b) =>
        (b.textContent ?? '').trim(),
      );
      return { temEditar: textos.includes('Editar'), temRemover: textos.includes('Remover') };
    },
    CLIENTE,
  );
  ok(semBotoes?.temEditar === false, 'a linha de uma proposta aceita não oferece Editar');
  ok(semBotoes?.temRemover === false, 'nem Remover');

  /* ---------------------------------------------------------------- */
  console.log('\nApagar');

  await admin.from('proposta').update({ status: 'rascunho' }).eq('id', prop.id);
  await pagina.goto(`${APP}/painel/propostas`, { waitUntil: 'networkidle0', timeout: 60000 });

  const pediuConfirmacao = await pagina.evaluate(
    (c) => {
      const linha = [...document.querySelectorAll('tr')].find((t) =>
        (t.textContent ?? '').includes(c),
      );
      const b = [...(linha?.querySelectorAll('button') ?? [])].find(
        (x) => (x.textContent ?? '').trim() === 'Remover',
      );
      if (!b) return false;
      b.click();
      return true;
    },
    CLIENTE,
  );
  ok(pediuConfirmacao === true, 'existe o botão Remover');

  await new Promise((r) => setTimeout(r, 500));
  const aindaExiste = await admin
    .from('proposta')
    .select('id', { count: 'exact', head: true })
    .eq('id', prop.id);
  ok(aindaExiste.count === 1, 'o primeiro clique NÃO apaga: ele pede confirmação');

  const confirmou = await pagina.evaluate(
    (c) => {
      const linha = [...document.querySelectorAll('tr')].find((t) =>
        (t.textContent ?? '').includes(c),
      );
      const b = [...(linha?.querySelectorAll('button') ?? [])].find((x) =>
        (x.textContent ?? '').includes('Sim, apagar'),
      );
      if (!b) return false;
      b.click();
      return true;
    },
    CLIENTE,
  );
  ok(confirmou === true, 'e o segundo pede "Sim, apagar"');

  await new Promise((r) => setTimeout(r, 2500));
  const { count: sumiu } = await admin
    .from('proposta')
    .select('id', { count: 'exact', head: true })
    .eq('id', prop.id);
  ok(sumiu === 0, 'aí sim ela sai do banco');

  const linkMorto = await fetch(`${APP}/proposta/${slug}`);
  ok(linkMorto.status === 404, `e o link para de abrir (${linkMorto.status})`);

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
