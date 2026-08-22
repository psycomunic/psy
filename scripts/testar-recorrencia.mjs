/**
 * Prova o cliente que não é loja, e a cobrança que se repete sozinha.
 *
 *   npm run dev                (noutro terminal)
 *   npm run testar-recorrencia
 *
 * ============================================================
 * OS DOIS DEFEITOS QUE ISTO PEGA
 * ============================================================
 * 1. A plataforma nasceu assumindo e-commerce. Um chalé cadastrado como
 *    loja fica CRÍTICO para sempre: o health score desconta 20 pontos
 *    por "gastou em mídia e não teve receita", e cliente de tráfego puro
 *    nunca registra receita aqui. Semáforo que mente sobre metade da
 *    carteira é pior que semáforo nenhum.
 *
 * 2. "Faturar o mês" depende de alguém lembrar. Um mês esquecido é um
 *    mês não cobrado, e ninguém percebe até fechar o caixa. A assinatura
 *    do Asaas emite sozinha — mas a cobrança que ela gera é uma que este
 *    painel nunca viu, e sem tratamento vira dinheiro entrando sem
 *    aparecer em indicador nenhum.
 *
 * Usa o SANDBOX do Asaas e limpa tudo no fim.
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

const marca = `rec-${Date.now()}`;
const EMAIL = `${marca}@teste.local`;
const SENHA = 'Recorrencia-Teste-2026-xyz';
const CHALE = `${marca}-Chales Recanto`;

let falhas = 0;

/* Sentinela de "pular", e nao de erro. Ver a guarda de producao. */
const PULAR = "__pular_producao__";
let pulado = false;
let usuarioId = null;
let contaId = null;
let navegador = null;
let asaas = null;
const assinaturasCriadas = [];

const ok = (b, t) => {
  console.log(`  ${b ? 'PASSA' : 'FALHA'}  ${t}`);
  if (!b) falhas++;
};

const hojeBR = () => new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10);

/**
 * Dia 5 de dois meses à frente.
 *
 * NÃO "hoje mais 40 dias": a primeira cobrança da assinatura já vence
 * no dia 5 do mês que vem, e 40 dias caem no MESMO mês que ela. A
 * função do banco é uma fatura por contrato por competência, então o
 * evento atualizaria a primeira em vez de criar a segunda — e o teste
 * acusaria o painel de perder a cobrança quando na verdade ele estava
 * certo.
 */
function doisMesesAFrente() {
  const [a, m] = hojeBR().split('-').map(Number);
  return new Date(Date.UTC(a, m + 1, 5)).toISOString().slice(0, 10);
}

/* ---- Asaas ---------------------------------------------------------- */

async function credencial() {
  const chave = Buffer.from((env.CRIPTO_CHAVE ?? '').trim(), 'base64url');
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
  const s = JSON.parse(d.update(Buffer.from(cif, 'base64url'), undefined, 'utf8') + d.final('utf8'));
  const producao = (data.configuracao ?? {}).ambiente === 'producao';
  return {
    chave: s.api_key,
    base: producao ? 'https://api.asaas.com/v3' : 'https://api-sandbox.asaas.com/v3',
    producao,
  };
}

async function noAsaas(caminho, init) {
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

/* ---- tela ----------------------------------------------------------- */

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

async function clicarNoCartao(pagina, chave, texto) {
  return pagina.evaluate(
    (c, t) => {
      for (const cartao of document.querySelectorAll('article, li')) {
        if (!(cartao.textContent ?? '').includes(c)) continue;
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
    chave,
    texto,
  );
}

/** O aviso de sandbox também é role=status. Ele não conta. */
async function esperarTexto(pagina, contem, ms = 40000) {
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

try {
  asaas = await credencial();
  if (!asaas) {
    console.log('\nAsaas não conectado. Conecte a chave em Configurações.\n');
    process.exit(1);
  }
  /* Mesma guarda de `testar-financeiro`: pular, e não falhar. Uma
     assinatura criada aqui cobraria todo mês, de verdade. */
  if (asaas.producao) {
    console.log('\n' + '='.repeat(66));
    console.log('PULADO: o Asaas está em PRODUÇÃO.');
    console.log('Este teste cria assinatura mensal de verdade, então não roda aqui.');
    console.log('Para exercê-lo, troque o ambiente para sandbox em Configurações.');
    console.log('='.repeat(66));
    throw new Error(PULAR);
  }
  console.log('\nAsaas: sandbox');

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

  /* ---------------------------------------------------------------- */
  console.log('\nCadastrar um cliente que não é loja');

  await pagina.goto(`${APP}/painel/contas`, { waitUntil: 'networkidle0', timeout: 60000 });

  ok(await clicar(pagina, 'Novo cliente'), 'o botão diz "Novo cliente", e não "Nova loja"');
  ok(await esperarSeletor(pagina, 'select[name="tipo"]'), 'existe o campo de tipo');

  const tipos = await pagina.evaluate(() =>
    [...document.querySelectorAll('select[name="tipo"] option')].map((o) => o.value),
  );
  ok(
    ['ecommerce', 'trafego', 'outro'].every((t) => tipos.includes(t)),
    `os três tipos existem (achei ${tipos.join(', ')})`,
  );

  await preencher(pagina, 'input[name="nome"]', CHALE);
  await preencher(pagina, 'select[name="tipo"]', 'trafego');
  await preencher(pagina, 'input[name="segmento"]', 'Chalés e pousadas');
  await preencher(pagina, 'input[name="documento"]', '11222333000181');
  await clicar(pagina, 'Cadastrar cliente');
  ok(await esperarTexto(pagina, 'criada') || await esperarTexto(pagina, 'cadastr'), 'o cliente foi cadastrado');

  const { data: conta } = await admin
    .from('conta')
    .select('id, tipo, segmento, situacao')
    .eq('nome', CHALE)
    .maybeSingle();

  ok(Boolean(conta), 'está no banco');
  contaId = conta?.id;
  ok(conta?.tipo === 'trafego', `gravado como tráfego (ficou ${conta?.tipo})`);
  ok(conta?.segmento === 'Chalés e pousadas', 'com o segmento');

  /* ---------------------------------------------------------------- */
  console.log('\nO semáforo não pune quem não vende aqui');

  /* Gasto em mídia sem receita nenhuma: é EXATAMENTE o cenário que
     derrubava a nota de um cliente de tráfego para o vermelho. */
  await admin.from('metrica_diaria').insert(
    [0, 1, 2].map((d) => {
      const dia = new Date(Date.now() - (d + 1) * 86400e3 - 3 * 3600e3)
        .toISOString()
        .slice(0, 10);
      return { conta_id: contaId, dia, canal: 'meta', investimento: 400, receita: 0 };
    }),
  );

  const { data: saudeTrafego } = await admin
    .from('saude_conta')
    .select('situacao, pontuacao, tipo')
    .eq('conta_id', contaId)
    .maybeSingle();

  ok(saudeTrafego?.tipo === 'trafego', 'o semáforo sabe de que tipo de cliente fala');
  ok(
    saudeTrafego?.situacao !== 'critico',
    `gastar em mídia sem receita NÃO o deixa crítico (está ${saudeTrafego?.situacao})`,
  );
  ok(
    Number(saudeTrafego?.pontuacao) >= 70,
    `e a nota fica alta (${saudeTrafego?.pontuacao})`,
  );

  /* A mesma situação numa LOJA continua sendo crítica, que é o certo. */
  await admin.from('conta').update({ tipo: 'ecommerce' }).eq('id', contaId);
  const { data: saudeLoja } = await admin
    .from('saude_conta')
    .select('situacao, pontuacao')
    .eq('conta_id', contaId)
    .maybeSingle();

  ok(
    saudeLoja?.situacao === 'critico',
    `a MESMA situação numa loja continua crítica (está ${saudeLoja?.situacao})`,
  );
  ok(
    Number(saudeLoja?.pontuacao) < Number(saudeTrafego?.pontuacao),
    `e com nota menor: ${saudeLoja?.pontuacao} contra ${saudeTrafego?.pontuacao}`,
  );

  await admin.from('conta').update({ tipo: 'trafego' }).eq('id', contaId);

  /* ---------------------------------------------------------------- */
  console.log('\nA carteira não inventa venda para quem não vende');

  await pagina.goto(`${APP}/painel/contas`, { waitUntil: 'networkidle0', timeout: 60000 });
  const linha = await pagina.evaluate((nome) => {
    const tr = [...document.querySelectorAll('tr')].find((x) =>
      (x.textContent ?? '').includes(nome),
    );
    return tr ? [...tr.querySelectorAll('th, td')].map((c) => c.textContent.trim()) : null;
  }, CHALE);

  ok(Boolean(linha), 'o cliente aparece na carteira');
  ok(
    (linha ?? []).some((c) => /Só tráfego/i.test(c)),
    'com o tipo escrito na linha',
  );
  ok(
    (linha ?? []).some((c) => /Chalés/i.test(c)),
    'e com o segmento',
  );
  ok(
    !(linha ?? []).some((c) => c === 'R$ 0,00'),
    'sem afirmar "R$ 0,00" de receita, que seria mentira: a agência não mede a venda dele',
  );

  /* ---------------------------------------------------------------- */
  console.log('\nContrato com dia de vencimento próprio');

  await pagina.goto(`${APP}/painel/financeiro?aba=contratos`, {
    waitUntil: 'networkidle0',
    timeout: 60000,
  });
  ok(await clicar(pagina, 'Novo contrato'), 'existe "Novo contrato"');
  ok(await esperarSeletor(pagina, 'input[name="dia_vencimento"]'), 'existe o dia do vencimento');

  await preencher(pagina, 'select[name="conta_id"]', contaId);
  await preencher(pagina, 'input[name="plano"]', 'Tráfego mensal');
  await preencher(pagina, 'input[name="fee_mensal"]', '1.800');
  await preencher(pagina, 'input[name="inicio"]', `${hojeBR().slice(0, 7)}-01`);
  await preencher(pagina, 'input[name="dia_vencimento"]', '5');
  await clicar(pagina, 'Cadastrar contrato');
  ok(await esperarTexto(pagina, 'cadastrado'), 'o contrato foi cadastrado');

  const { data: contrato } = await admin
    .from('contrato')
    .select('id, fee_mensal, dia_vencimento, asaas_assinatura_id')
    .eq('conta_id', contaId)
    .maybeSingle();

  ok(Number(contrato?.dia_vencimento) === 5, `o dia 5 foi gravado (ficou ${contrato?.dia_vencimento})`);
  ok(Number(contrato?.fee_mensal) === 1800, 'com o fee de 1800');

  /* Um dia fora da faixa é recusado: 31 não existe em fevereiro, e a
     assinatura empurraria a cobrança para março. */
  const { error: eDia } = await admin
    .from('contrato')
    .update({ dia_vencimento: 31 })
    .eq('id', contrato.id);
  ok(Boolean(eDia), 'o banco recusa dia 31, que não existe em todo mês');

  /* ---------------------------------------------------------------- */
  console.log('\nCobrança recorrente');

  await pagina.goto(`${APP}/painel/financeiro?aba=contratos`, {
    waitUntil: 'networkidle0',
    timeout: 60000,
  });

  ok(
    await clicarNoCartao(pagina, CHALE, 'Cobrar automaticamente'),
    'existe o botão de cobrança automática',
  );

  /* A confirmação existe porque ligar CRIA cobrança de verdade e o
     cliente recebe e-mail no minuto seguinte. */
  const confirma = await pagina.evaluate(() => document.body.innerText);
  ok(
    /todo mês/i.test(confirma) && /primeira sai agora/i.test(confirma),
    'e avisa que a primeira cobrança sai agora, antes de fazer',
  );

  ok(
    await clicarNoCartao(pagina, CHALE, 'Ligar cobrança automática'),
    'o botão de confirmar existe',
  );
  ok(await esperarTexto(pagina, 'automática ligada'), 'a assinatura foi criada');

  const { data: comAssinatura } = await admin
    .from('contrato')
    .select('asaas_assinatura_id')
    .eq('id', contrato.id)
    .maybeSingle();

  ok(Boolean(comAssinatura?.asaas_assinatura_id), 'o contrato guardou o id da assinatura');
  if (comAssinatura?.asaas_assinatura_id) assinaturasCriadas.push(comAssinatura.asaas_assinatura_id);

  const la = await noAsaas(`/subscriptions/${comAssinatura?.asaas_assinatura_id}`);
  ok(la.status === 200, 'a assinatura existe mesmo no Asaas');
  ok(la.corpo?.cycle === 'MONTHLY', `com ciclo mensal (é ${la.corpo?.cycle})`);
  ok(Number(la.corpo?.value) === 1800, `e valor 1800 (é ${la.corpo?.value})`);
  ok(
    la.corpo?.externalReference === contrato.id,
    'apontando para o contrato, que é como o webhook acha o dono da cobrança',
  );

  /* ---------------------------------------------------------------- */
  console.log('\nA primeira cobrança já virou fatura aqui');

  const { data: faturas } = await admin
    .from('fatura')
    .select('id, numero, valor, vencimento, status, asaas_id, asaas_assinatura_id, contrato_id')
    .eq('conta_id', contaId);

  ok(faturas?.length === 1, `existe UMA fatura (existem ${faturas?.length ?? 0})`);
  const f = faturas?.[0];
  ok(Number(f?.valor) === 1800, 'com o valor do contrato');
  ok(f?.asaas_assinatura_id === comAssinatura?.asaas_assinatura_id, 'ligada à assinatura');
  ok(f?.contrato_id === contrato.id, 'e ao contrato');
  ok(f?.vencimento?.endsWith('-05'), `vencendo no dia 5 (vence em ${f?.vencimento})`);

  /* ---------------------------------------------------------------- */
  console.log('\nA cobrança do mês que vem, que ninguém clicou');

  /* Simula o que o Asaas faz sozinho: cria a cobrança do próximo ciclo.
     É a que o webhook precisa saber receber. */
  const proximo = await noAsaas('/payments', {
    method: 'POST',
    body: JSON.stringify({
      customer: la.corpo.customer,
      billingType: 'BOLETO',
      value: 1800,
      dueDate: doisMesesAFrente(),
      description: 'Ciclo seguinte',
    }),
  });

  const evento = await fetch(`${APP}/api/asaas`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'asaas-access-token': (
        await admin
          .from('credencial_agencia')
          .select('segredo')
          .eq('provedor', 'asaas')
          .maybeSingle()
      ).data
        ? await (async () => {
            const chave = Buffer.from(env.CRIPTO_CHAVE.trim(), 'base64url');
            const { data } = await admin
              .from('credencial_agencia')
              .select('segredo')
              .eq('provedor', 'asaas')
              .maybeSingle();
            const [, iv, tag, cif] = data.segredo.split('.');
            const d = createDecipheriv('aes-256-gcm', chave, Buffer.from(iv, 'base64url'));
            d.setAuthTag(Buffer.from(tag, 'base64url'));
            const s = JSON.parse(
              d.update(Buffer.from(cif, 'base64url'), undefined, 'utf8') + d.final('utf8'),
            );
            return s.webhook_token ?? '';
          })()
        : '',
    },
    body: JSON.stringify({
      event: 'PAYMENT_CREATED',
      payment: {
        id: proximo.corpo.id,
        status: 'PENDING',
        value: 1800,
        dueDate: proximo.corpo.dueDate,
        subscription: comAssinatura?.asaas_assinatura_id,
        externalReference: contrato.id,
      },
    }),
  });

  ok(evento.status === 200, `o webhook aceitou o evento (${evento.status})`);

  const { data: depois } = await admin
    .from('fatura')
    .select('id, valor, vencimento, asaas_id, asaas_assinatura_id')
    .eq('conta_id', contaId);

  ok(
    depois?.length === 2,
    `a cobrança que NINGUÉM clicou virou fatura aqui (agora são ${depois?.length})`,
  );
  ok(
    depois?.some((x) => x.asaas_id === proximo.corpo.id),
    'com o id certo do Asaas',
  );

  /* O mesmo evento de novo não cria uma terceira. */
  const { data: idem } = await admin.rpc('fatura_de_assinatura', {
    p_assinatura: comAssinatura?.asaas_assinatura_id,
    p_asaas_id: proximo.corpo.id,
    p_valor: 1800,
    p_vencimento: proximo.corpo.dueDate,
  });
  const { count: quantas } = await admin
    .from('fatura')
    .select('id', { count: 'exact', head: true })
    .eq('conta_id', contaId);
  ok(quantas === 2 && Boolean(idem), 'o mesmo evento de novo não duplica a fatura');

  /* ---------------------------------------------------------------- */
  console.log('\nDesligar');

  await pagina.goto(`${APP}/painel/financeiro?aba=contratos`, {
    waitUntil: 'networkidle0',
    timeout: 60000,
  });

  const naTela = await pagina.evaluate(() => document.body.innerText);
  ok(/Cobra sozinho todo dia 5/i.test(naTela), 'a tela diz que cobra sozinho todo dia 5');

  ok(await clicarNoCartao(pagina, CHALE, 'Desligar'), 'existe o botão de desligar');
  ok(await esperarTexto(pagina, 'desligada'), 'a assinatura foi desligada');

  const { data: semAssinatura } = await admin
    .from('contrato')
    .select('asaas_assinatura_id')
    .eq('id', contrato.id)
    .maybeSingle();
  ok(semAssinatura?.asaas_assinatura_id === null, 'o contrato soltou a assinatura');

  const { count: aindaTem } = await admin
    .from('fatura')
    .select('id', { count: 'exact', head: true })
    .eq('conta_id', contaId);
  ok(
    aindaTem === 2,
    'e as cobranças já emitidas continuam de pé: desligar não perdoa o que o cliente já deve',
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

  for (const id of assinaturasCriadas) {
    await noAsaas(`/subscriptions/${id}`, { method: 'DELETE' }).catch(() => {});
  }

  if (contaId) {
    const { data: fs } = await admin.from('fatura').select('asaas_id').eq('conta_id', contaId);
    for (const f of fs ?? []) {
      if (f.asaas_id) await noAsaas(`/payments/${f.asaas_id}`, { method: 'DELETE' }).catch(() => {});
    }
    await admin.from('metrica_diaria').delete().eq('conta_id', contaId);
    await admin.from('fatura').delete().eq('conta_id', contaId);
    await admin.from('contrato').delete().eq('conta_id', contaId);
    await admin.from('lancamento').delete().eq('conta_id', contaId);
    const { error } = await admin.from('conta').delete().eq('id', contaId);
    if (error) {
      console.error(`  NÃO REMOVEU a conta ${contaId}: ${error.message}`);
      falhas++;
    }
  }

  const { count: sobrou } = await admin
    .from('conta')
    .select('id', { count: 'exact', head: true })
    .like('nome', 'rec-%');
  if (sobrou) {
    console.error(`  SOBRARAM ${sobrou} cliente(s) de teste no banco.`);
    falhas++;
  } else {
    /* Só quando houve teste. Anunciar limpeza depois de um pulo diria
       que algo foi criado e desfeito, e nada foi. */
    if (!pulado) console.log('\nDados de teste removidos, aqui e no Asaas.');
  }
}

console.log(
  pulado
    ? '\nRECORRENCIA PULADA (Asaas em produção)\n'
    : falhas === 0
      ? '\nRECORRENCIA OK\n'
      : `\n${falhas} FALHA(S) NA RECORRENCIA\n`,
);

/* `exitCode` em vez de `process.exit`: ver a nota em testar-financeiro. */
process.exitCode = falhas === 0 ? 0 : 1;
