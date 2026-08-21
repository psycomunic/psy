/**
 * Prova o ciclo de vida do contrato pelo navegador de verdade.
 *
 *   npm run dev             (noutro terminal)
 *   npm run testar-contratos
 *
 * POR QUE PELO NAVEGADOR
 *
 * As regras que importam aqui não moram no banco: moram nas server
 * actions. "Não abrir duas vigências na mesma loja" e "reajuste encerra
 * uma e abre outra" são decisões de `acoes-contrato.ts`, e chamar o
 * Supabase direto de um script pularia exatamente o código que se quer
 * testar.
 *
 * Então o teste faz o que a pessoa faria: entra, clica, preenche, envia
 * — e depois confere no banco, com a service role, se o que ficou
 * gravado é o que devia.
 *
 * O CASO QUE MAIS IMPORTA é o do formulário velho: a tela foi aberta
 * quando a loja não tinha contrato, alguém cadastrou um contrato nesse
 * meio tempo, e o envio chega depois. A trava da tela não vê isso. Se o
 * servidor também não vir, a loja fica com duas vigências abertas e
 * recebe duas faturas no mesmo mês.
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

const marca = `ctr-${Date.now()}`;
const EMAIL = `${marca}@teste.local`;
const SENHA = 'Contrato-Teste-2026-xyz';

let falhas = 0;
let usuarioId = null;
let contaId = null;
let outraId = null;
let navegador = null;

const ok = (b, t) => {
  console.log(`  ${b ? 'PASSA' : 'FALHA'}  ${t}`);
  if (!b) falhas++;
};

const hojeBR = () => new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10);

/** Primeiro dia do mês que vem, que é o padrão do formulário. */
function primeiroDoMesQueVem() {
  const h = new Date(`${hojeBR()}T12:00:00Z`);
  return new Date(Date.UTC(h.getUTCFullYear(), h.getUTCMonth() + 1, 1))
    .toISOString()
    .slice(0, 10);
}

function ultimoDoMes(iso) {
  const [a, m] = iso.split('-').map(Number);
  return new Date(Date.UTC(a, m, 0)).toISOString().slice(0, 10);
}

function diaAnterior(iso) {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

const contratosDa = (id) =>
  admin
    .from('contrato')
    .select('id, plano, fee_mensal, inicio, fim, observacoes')
    .eq('conta_id', id)
    .order('inicio', { ascending: true })
    .then((r) => r.data ?? []);

/** Preenche um campo do jeito que o React enxerga. Atribuir `.value`
    direto não dispara o onChange, e o estado do formulário não muda. */
async function preencher(pagina, seletor, valor) {
  await pagina.$eval(
    seletor,
    (el, v) => {
      const proto = el instanceof HTMLSelectElement
        ? HTMLSelectElement.prototype
        : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    },
    valor,
  );
}

/** Clica no botão cujo texto contém `texto`. Devolve false se não achou. */
async function clicarTexto(pagina, texto) {
  return pagina.evaluate((t) => {
    const alvo = [...document.querySelectorAll('button')].find((b) =>
      (b.textContent ?? '').toLowerCase().includes(t.toLowerCase()),
    );
    if (!alvo) return false;
    alvo.click();
    return true;
  }, texto);
}

/**
 * Clica no botão DE UM CONTRATO ESPECÍFICO, achando primeiro o cartão
 * que leva o nome da loja.
 *
 * A primeira versão deste teste procurava o botão pelo texto na página
 * inteira e clicava no primeiro. Com duas lojas de teste começando no
 * mesmo dia, a ordem entre elas não é definida, e o "Faturar o mês"
 * caiu na loja errada: o teste acusou "saíram 0 faturas" enquanto a
 * fatura existia, emitida para outro contrato.
 *
 * Num banco vazio isso é um teste instável. Num banco com clientes de
 * verdade, seria um teste que emite cobrança para quem não pediu.
 */
async function clicarNoCartao(pagina, nomeDaLoja, texto) {
  return pagina.evaluate(
    (nome, t) => {
      /* Uma loja pode ter DOIS cartões depois do reajuste: o que vale
         hoje e o agendado. Procura em todos e usa o primeiro que tem o
         botão pedido — o agendado, por exemplo, não tem "Faturar". */
      for (const cartao of document.querySelectorAll('article')) {
        if (!(cartao.querySelector('h3')?.textContent ?? '').includes(nome)) continue;
        const alvo = [...cartao.querySelectorAll('button')].find((b) =>
          (b.textContent ?? '').toLowerCase().includes(t.toLowerCase()),
        );
        if (alvo) {
          alvo.click();
          return true;
        }
      }
      return false;
    },
    nomeDaLoja,
    texto,
  );
}

/** Preenche um campo que está dentro de um cartão daquela loja. */
async function noCartao(pagina, nomeDaLoja, seletor, valor) {
  const achou = await pagina.evaluate(
    (nome, s, v) => {
      for (const cartao of document.querySelectorAll('article')) {
        if (!(cartao.querySelector('h3')?.textContent ?? '').includes(nome)) continue;
        const el = cartao.querySelector(s);
        if (!el) continue;
        const proto = el instanceof HTMLSelectElement
          ? HTMLSelectElement.prototype
          : HTMLInputElement.prototype;
        Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
      return false;
    },
    nomeDaLoja,
    seletor,
    valor,
  );
  if (!achou) throw new Error(`não achei ${seletor} em nenhum cartão de ${nomeDaLoja}`);
}

/** Lê o valor de um campo dentro de um cartão daquela loja. */
async function lerNoCartao(pagina, nomeDaLoja, seletor) {
  return pagina.evaluate(
    (nome, s) => {
      for (const cartao of document.querySelectorAll('article')) {
        if (!(cartao.querySelector('h3')?.textContent ?? '').includes(nome)) continue;
        const el = cartao.querySelector(s);
        if (el) return el.value;
      }
      return null;
    },
    nomeDaLoja,
    seletor,
  );
}

/** Espera algum cartão da loja mostrar um campo. */
async function esperarNoCartao(pagina, nomeDaLoja, seletor, ms = 10000) {
  const ate = Date.now() + ms;
  while (Date.now() < ate) {
    if ((await lerNoCartao(pagina, nomeDaLoja, seletor)) !== null) return true;
    await new Promise((r) => setTimeout(r, 200));
  }
  return false;
}

/** Espera a mensagem de retorno da ação aparecer. `nome` limita ao
    cartão daquela loja; sem ele, olha a página inteira. */
async function esperarAviso(pagina, contem, nome = null, ms = 20000) {
  const ate = Date.now() + ms;
  while (Date.now() < ate) {
    const achou = await pagina.evaluate(
      (t, n) => {
        /* Todos os cartões da loja, não o primeiro: depois do reajuste
           são dois, e o aviso fica no que tinha o formulário. */
        const raizes = n
          ? [...document.querySelectorAll('article')].filter((a) =>
              (a.querySelector('h3')?.textContent ?? '').includes(n),
            )
          : [document];
        return raizes.some((raiz) =>
          [...raiz.querySelectorAll('[role="status"]')].some((x) =>
            (x.textContent ?? '').toLowerCase().includes(t.toLowerCase()),
          ),
        );
      },
      contem,
      nome,
    );
    if (achou) return true;
    await new Promise((r) => setTimeout(r, 300));
  }
  return false;
}

try {
  /* Duas lojas: uma para o ciclo completo, outra para provar que a
     trava é por loja e não global. */
  const { data: contas, error: eConta } = await admin
    .from('conta')
    .insert([
      { nome: `${marca}-a`, situacao: 'ativa', documento: '11222333000181' },
      { nome: `${marca}-b`, situacao: 'ativa', documento: '11222333000181' },
    ])
    .select('id, nome');
  if (eConta) throw new Error(`não criou as lojas: ${eConta.message}`);
  contaId = contas.find((c) => c.nome.endsWith('-a')).id;
  outraId = contas.find((c) => c.nome.endsWith('-b')).id;

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

  const irParaFinanceiro = () =>
    pagina.goto(`${APP}/painel/financeiro`, { waitUntil: 'networkidle0', timeout: 60000 });

  await irParaFinanceiro();

  /* ---------------------------------------------------------------- */
  console.log('\nA tela existe');

  ok(
    await clicarTexto(pagina, 'Novo contrato'),
    'existe o botão "Novo contrato" em /painel/financeiro',
  );
  await pagina.waitForSelector('select[name="conta_id"]', { timeout: 10000 });

  const temAsDuas = await pagina.evaluate(
    (a, b) => {
      const v = [...document.querySelectorAll('select[name="conta_id"] option')].map(
        (o) => o.value,
      );
      return v.includes(a) && v.includes(b);
    },
    contaId,
    outraId,
  );
  ok(temAsDuas, 'as lojas ativas aparecem na lista');

  /* ---------------------------------------------------------------- */
  console.log('\nCadastrar');

  const inicio = `${hojeBR().slice(0, 7)}-01`;

  await preencher(pagina, 'select[name="conta_id"]', contaId);
  await preencher(pagina, 'input[name="plano"]', 'Saturno');
  await preencher(pagina, 'input[name="fee_mensal"]', '5.000');
  await preencher(pagina, 'input[name="inicio"]', inicio);
  await clicarTexto(pagina, 'Cadastrar contrato');

  ok(await esperarAviso(pagina, 'Contrato cadastrado'), 'o contrato foi cadastrado');

  let linhas = await contratosDa(contaId);
  ok(linhas.length === 1, `existe UM contrato no banco (existem ${linhas.length})`);
  ok(Number(linhas[0]?.fee_mensal) === 5000, 'o fee gravado é 5000, e não 5');
  ok(linhas[0]?.fim === null, 'nasce sem data de fim');

  /* ---------------------------------------------------------------- */
  console.log('\nDuas vigências na mesma loja');

  await irParaFinanceiro();
  await clicarTexto(pagina, 'Novo contrato');
  await pagina.waitForSelector('select[name="conta_id"]', { timeout: 10000 });

  const travada = await pagina.evaluate((id) => {
    const o = [...document.querySelectorAll('select[name="conta_id"] option')].find(
      (x) => x.value === id,
    );
    return { existe: Boolean(o), travada: o?.disabled === true, texto: o?.textContent ?? '' };
  }, contaId);
  ok(travada.existe, 'a loja com contrato continua na lista, em vez de sumir');
  ok(travada.travada, 'a opção fica travada');
  ok(/já tem contrato/i.test(travada.texto), 'a própria opção diz por quê');

  const outraLivre = await pagina.evaluate((id) => {
    const o = [...document.querySelectorAll('select[name="conta_id"] option')].find(
      (x) => x.value === id,
    );
    return o?.disabled === false;
  }, outraId);
  ok(outraLivre, 'a trava é por loja: a outra segue disponível');

  /* O formulário velho. A tela foi aberta com a loja B livre; o contrato
     dela nasce por fora agora; o envio chega depois. Só o servidor pode
     barrar isto. */
  const { error: ePorFora } = await admin.from('contrato').insert({
    conta_id: outraId,
    plano: 'Falcon',
    fee_mensal: 7000,
    inicio,
  });
  ok(!ePorFora, 'preparou o cenário do formulário velho');

  await preencher(pagina, 'select[name="conta_id"]', outraId);
  await preencher(pagina, 'input[name="plano"]', 'Apollo');
  await preencher(pagina, 'input[name="fee_mensal"]', '9.000');
  await preencher(pagina, 'input[name="inicio"]', inicio);
  await clicarTexto(pagina, 'Cadastrar contrato');

  ok(
    await esperarAviso(pagina, 'já tem o contrato'),
    'o servidor recusa o envio de tela velha',
  );

  const daOutra = await contratosDa(outraId);
  ok(
    daOutra.length === 1 && Number(daOutra[0].fee_mensal) === 7000,
    `a loja B ficou com UM contrato (ficou com ${daOutra.length})`,
  );

  /* ---------------------------------------------------------------- */
  console.log('\nReajuste');

  await irParaFinanceiro();

  const aPartirDe = primeiroDoMesQueVem();
  const LOJA_A = `${marca}-a`;

  ok(await clicarNoCartao(pagina, LOJA_A, 'Reajustar'), 'existe o botão "Reajustar"');
  await esperarNoCartao(pagina, LOJA_A, 'input[name="a_partir_de"]');

  const padrao = await lerNoCartao(pagina, LOJA_A, 'input[name="a_partir_de"]');
  ok(padrao === aPartirDe, `a data já vem no primeiro do mês que vem (veio "${padrao}")`);

  await noCartao(pagina, LOJA_A, 'input[name="fee_mensal"]', '7.000');
  await noCartao(pagina, LOJA_A, 'input[name="a_partir_de"]', aPartirDe);
  await clicarNoCartao(pagina, LOJA_A, 'Confirmar reajuste');

  ok(await esperarAviso(pagina, 'Reajustado', LOJA_A), 'o reajuste foi aceito');

  linhas = await contratosDa(contaId);
  const antigo = linhas.find((l) => Number(l.fee_mensal) === 5000);
  const novo = linhas.find((l) => Number(l.fee_mensal) === 7000);

  ok(linhas.length === 2, `o reajuste virou DOIS contratos (viraram ${linhas.length})`);
  ok(Boolean(antigo && novo), 'um com o fee antigo e um com o novo');
  ok(
    antigo?.fim === diaAnterior(aPartirDe),
    `o antigo termina na véspera do novo (terminou em ${antigo?.fim})`,
  );
  ok(novo?.inicio === aPartirDe, 'o novo começa na data pedida');
  ok(novo?.fim === null, 'o novo fica em aberto');
  ok(
    antigo?.fim < novo?.inicio,
    'não há um só dia com as duas vigências valendo ao mesmo tempo',
  );

  /* ---------------------------------------------------------------- */
  console.log('\nO passado não é reescrito');

  await irParaFinanceiro();

  const naTela = await pagina.evaluate(() => document.body.innerText);
  ok(/agendado/i.test(naTela), 'o contrato agendado aparece na tela, marcado como tal');

  /* A fatura deste mês tem de sair pelo contrato ANTIGO, com o fee
     antigo, mesmo com o reajuste já registrado. O cartão do agendado
     nem tem botão de faturar, então "o cartão da loja A que tem o
     botão" é justamente o certo. */
  ok(await clicarNoCartao(pagina, LOJA_A, 'Faturar o mês'), 'existe o botão de faturar');
  await esperarAviso(pagina, 'fatura', LOJA_A);

  const { data: faturas } = await admin
    .from('fatura')
    .select('valor, competencia, contrato_id')
    .eq('conta_id', contaId);

  ok(faturas?.length === 1, `saiu UMA fatura (saíram ${faturas?.length ?? 0})`);
  ok(
    Number(faturas?.[0]?.valor) === 5000,
    `a fatura do mês corrente saiu por 5000, e não pelo fee reajustado (saiu ${faturas?.[0]?.valor})`,
  );
  ok(faturas?.[0]?.contrato_id === antigo?.id, 'e aponta para o contrato que a originou');

  /* ---------------------------------------------------------------- */
  console.log('\nA vigência limita a emissão');

  const { error: eFuturo } = await admin.rpc('emitir_fatura', {
    p_contrato_id: novo?.id,
    p_competencia: `${hojeBR().slice(0, 7)}-01`,
  });
  ok(
    Boolean(eFuturo),
    'faturar o mês corrente por um contrato que só começa no mês que vem é recusado',
  );

  /* ---------------------------------------------------------------- */
  console.log('\nEncerrar');

  await irParaFinanceiro();

  /* Depois do reajuste, o único cartão da loja A com botões é o
     AGENDADO: o de hoje já tem data de fim. Encerrar um contrato que
     ainda não começou é o caso onde a data de hoje, que é a resposta
     natural, produz um contrato que termina antes de começar. */
  ok(await clicarNoCartao(pagina, LOJA_A, 'Encerrar'), 'existe o botão "Encerrar"');
  ok(await esperarNoCartao(pagina, LOJA_A, 'input[name="fim"]'), 'o formulário abriu');

  await noCartao(pagina, LOJA_A, 'input[name="fim"]', hojeBR());
  await clicarNoCartao(pagina, LOJA_A, 'Confirmar encerramento');

  ok(
    await esperarAviso(pagina, 'só começa em', LOJA_A),
    'encerrar antes do início é recusado, com a data no aviso',
  );

  const intactos = await contratosDa(contaId);
  ok(
    intactos.find((l) => l.inicio === aPartirDe)?.fim === null,
    'e o contrato agendado continua sem data de fim',
  );

  /* Agora com data válida. */
  const fim = ultimoDoMes(aPartirDe);
  await noCartao(pagina, LOJA_A, 'input[name="fim"]', fim);
  await noCartao(pagina, LOJA_A, 'input[name="motivo"]', 'teste automatizado');
  await clicarNoCartao(pagina, LOJA_A, 'Confirmar encerramento');

  ok(await esperarAviso(pagina, 'encerrado', LOJA_A), 'o encerramento foi aceito');

  linhas = await contratosDa(contaId);
  ok(linhas.length === 2, 'encerrar não apagou nada');
  ok(
    linhas.find((l) => l.inicio === aPartirDe)?.fim === fim,
    'o contrato ganhou data de fim',
  );

  const { count: aindaTemFatura } = await admin
    .from('fatura')
    .select('id', { count: 'exact', head: true })
    .eq('conta_id', contaId);
  ok(aindaTemFatura === 1, 'a fatura emitida continua no histórico');
} catch (e) {
  console.error(`\nErro no teste: ${e.message}`);
  falhas++;
} finally {
  if (navegador) await navegador.close().catch(() => {});
  if (usuarioId) await admin.auth.admin.deleteUser(usuarioId).catch(() => {});

  /* A ordem importa: `fatura` e `contrato` apontam para `conta` com
     `on delete restrict`. Apagar a loja primeiro falha em silêncio se
     ninguém olhar o erro — e foi assim que seis lojas de teste, com
     contrato de R$ 4.500, ficaram na produção. */
  for (const id of [contaId, outraId].filter(Boolean)) {
    await admin.from('fatura').delete().eq('conta_id', id);
    await admin.from('contrato').delete().eq('conta_id', id);
    const { error } = await admin.from('conta').delete().eq('id', id);
    if (error) {
      console.error(`  NÃO REMOVEU a loja ${id}: ${error.message}`);
      falhas++;
    }
  }

  const { count: sobrou } = await admin
    .from('conta')
    .select('id', { count: 'exact', head: true })
    .like('nome', 'ctr-%');
  if (sobrou) {
    console.error(`  SOBRARAM ${sobrou} loja(s) de teste no banco.`);
    falhas++;
  } else {
    console.log('\nDados de teste removidos.');
  }
}

console.log(falhas === 0 ? '\nCONTRATOS OK\n' : `\n${falhas} FALHA(S) EM CONTRATOS\n`);
process.exit(falhas === 0 ? 0 : 1);
