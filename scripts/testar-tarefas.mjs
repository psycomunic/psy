/**
 * Prova as tarefas e os lembretes pelo navegador de verdade.
 *
 *   npm run dev            (noutro terminal)
 *   npm run testar-tarefas
 *
 * ============================================================
 * OS DOIS PONTOS QUE NÃO PODEM ERRAR
 * ============================================================
 * 1. RECORRÊNCIA. Concluir uma tarefa que se repete tem de abrir a
 *    próxima, contada a partir do PRAZO e não do dia da conclusão.
 *    Contar de hoje faria a reunião de segunda virar reunião de
 *    quinta na semana em que alguém concluísse com atraso — e em três
 *    meses a agenda inteira estaria deslocada, sem ninguém saber
 *    quando começou.
 *
 * 2. IDEMPOTÊNCIA DO LEMBRETE. A rotina roda de hora em hora. Se cada
 *    execução criasse um aviso, o sino mostraria vinte e quatro por
 *    tarefa e ninguém olharia para ele de novo. Contador que não
 *    significa nada é pior que contador nenhum.
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

const marca = `tar-${Date.now()}`;
const EMAIL = `${marca}@teste.local`;
const SENHA = 'Tarefa-Teste-2026-xyz';

let falhas = 0;
let usuarioId = null;
let contaId = null;
let navegador = null;

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

/* ---- tela ---------------------------------------------------------- */

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

/** Clica num botão do cartão que menciona `chave`. */
async function clicarNoCartao(pagina, chave, texto) {
  return pagina.evaluate(
    (c, t) => {
      for (const li of document.querySelectorAll('li')) {
        if (!(li.textContent ?? '').includes(c)) continue;
        const alvo = [...li.querySelectorAll('button')].find(
          (b) => (b.textContent ?? '').trim().toLowerCase() === t.toLowerCase(),
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

const tarefasDe = (titulo) =>
  admin
    .from('tarefa')
    .select('id, titulo, status, prazo, prioridade, recorrencia, lembrar_dias, responsavel_id, conta_id, concluida_em, origem_id')
    .eq('titulo', titulo)
    .order('prazo', { ascending: true })
    .then((r) => r.data ?? []);

const avisosDe = (perfilId) =>
  admin
    .from('notificacao')
    .select('id, tipo, titulo, chave, lida_em')
    .eq('perfil_id', perfilId)
    .then((r) => r.data ?? []);

try {
  const { data: conta, error: eConta } = await admin
    .from('conta')
    .insert({ nome: `${marca}-cliente`, situacao: 'ativa', documento: '11222333000181' })
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
  await pagina.setViewport({ width: 1440, height: 900 });

  await pagina.goto(`${APP}/entrar`, { waitUntil: 'networkidle0', timeout: 60000 });
  await pagina.type('input[name="email"]', EMAIL);
  await pagina.type('input[name="senha"]', SENHA);
  await Promise.all([
    pagina.waitForNavigation({ waitUntil: 'networkidle0', timeout: 60000 }),
    pagina.click('button[type="submit"]'),
  ]);

  const ir = (filtro = 'abertas') =>
    pagina.goto(`${APP}/painel/tarefas?filtro=${filtro}`, {
      waitUntil: 'networkidle0',
      timeout: 60000,
    });

  /* ---------------------------------------------------------------- */
  console.log('\nA tela');

  await ir();
  const filtros = await pagina.evaluate(() =>
    [...document.querySelectorAll('nav[aria-label="Filtros de tarefa"] a')].map((a) =>
      (a.textContent ?? '').trim(),
    ),
  );
  ok(
    ['Em aberto', 'Hoje e atrasadas', 'Minhas', 'Concluídas', 'Todas'].every((f) =>
      filtros.includes(f),
    ),
    `os cinco filtros existem (achei ${filtros.join(', ') || 'nenhum'})`,
  );

  ok(await clicar(pagina, 'Nova tarefa'), 'existe o botão "Nova tarefa"');
  ok(await esperarSeletor(pagina, 'input[name="titulo"]'), 'o formulário abriu');

  /* ---------------------------------------------------------------- */
  console.log('\nCriar');

  const AVULSA = `${marca} conferir pixel`;
  await preencher(pagina, 'input[name="titulo"]', AVULSA);
  await preencher(pagina, 'textarea[name="detalhe"]', 'Ver se o evento de compra dispara.');
  await preencher(pagina, 'select[name="conta_id"]', contaId);
  await preencher(pagina, 'select[name="prioridade"]', 'urgente');
  await preencher(pagina, 'input[name="prazo"]', daquiA(-3));
  await preencher(pagina, 'select[name="lembrar_dias"]', '1');
  await clicar(pagina, 'Criar tarefa');
  ok(await esperarTexto(pagina, 'criada'), 'a tarefa foi criada');

  let linhas = await tarefasDe(AVULSA);
  ok(linhas.length === 1, `existe UMA tarefa (existem ${linhas.length})`);
  ok(linhas[0]?.prioridade === 'urgente', 'com a prioridade gravada');
  ok(linhas[0]?.conta_id === contaId, 'e ligada ao cliente');
  ok(linhas[0]?.status === 'aberta', 'nasce aberta');

  /* ---------------------------------------------------------------- */
  console.log('\nRecorrência precisa de prazo');

  await ir();
  await clicar(pagina, 'Nova tarefa');
  await esperarSeletor(pagina, 'input[name="titulo"]');
  await preencher(pagina, 'input[name="titulo"]', `${marca} sem prazo`);
  await preencher(pagina, 'input[name="prazo"]', '');
  await preencher(pagina, 'select[name="recorrencia"]', 'semanal');
  await clicar(pagina, 'Criar tarefa');
  ok(
    await esperarTexto(pagina, 'precisa de prazo'),
    'tarefa que se repete sem prazo é recusada, com o motivo',
  );
  ok((await tarefasDe(`${marca} sem prazo`)).length === 0, 'e nada foi gravado');

  /* ---------------------------------------------------------------- */
  console.log('\nA recorrência conta do PRAZO, não do dia da conclusão');

  const SEMANAL = `${marca} revisar campanhas`;
  const PRAZO = daquiA(-3); /* venceu há três dias, de propósito */

  await ir();
  await clicar(pagina, 'Nova tarefa');
  await esperarSeletor(pagina, 'input[name="titulo"]');
  await preencher(pagina, 'input[name="titulo"]', SEMANAL);
  await preencher(pagina, 'input[name="prazo"]', PRAZO);
  await preencher(pagina, 'select[name="recorrencia"]', 'semanal');
  await preencher(pagina, 'select[name="prioridade"]', 'alta');
  await clicar(pagina, 'Criar tarefa');
  ok(await esperarTexto(pagina, 'criada'), 'a tarefa semanal foi criada');

  await ir();
  ok(await clicarNoCartao(pagina, SEMANAL, 'Concluir'), 'existe o botão "Concluir"');
  ok(await esperarTexto(pagina, 'próxima já está'), 'o aviso diz que a próxima nasceu');

  linhas = await tarefasDe(SEMANAL);
  const feita = linhas.find((t) => t.status === 'concluida');
  const proxima = linhas.find((t) => t.status === 'aberta');

  ok(linhas.length === 2, `viraram DUAS tarefas (viraram ${linhas.length})`);
  ok(Boolean(feita && proxima), 'uma concluída e uma aberta');
  ok(
    proxima?.prazo === daquiA(-3 + 7),
    `a próxima é 7 dias depois do PRAZO, e não de hoje (ficou ${proxima?.prazo}, esperado ${daquiA(4)})`,
  );
  ok(proxima?.prioridade === 'alta', 'herdando a prioridade');
  ok(proxima?.recorrencia === 'semanal', 'e continuando semanal');
  ok(proxima?.origem_id === feita?.id, 'apontando para a ocorrência que a gerou');

  /* Concluir de novo não pode criar uma terceira. */
  const { data: repetido } = await admin.rpc('concluir_tarefa', { p_id: feita?.id });
  linhas = await tarefasDe(SEMANAL);
  ok(
    linhas.length === 2 && repetido === null,
    `concluir de novo NÃO cria outra ocorrência (são ${linhas.length})`,
  );

  /* ---------------------------------------------------------------- */
  console.log('\nOs lembretes');

  const { count: antes } = await admin
    .from('notificacao')
    .select('id', { count: 'exact', head: true })
    .eq('perfil_id', usuarioId);
  ok(antes === 0, 'ninguém tem aviso antes da rotina rodar');

  /* Sem responsável, o aviso vai para os administradores — e este
     usuário de teste é um. */
  const chamar = (cabecalhos) =>
    fetch(`${APP}/api/lembretes`, { method: 'POST', headers: cabecalhos });

  const semToken = await chamar({});
  ok(
    semToken.status === 401 || semToken.status === 503,
    `sem token a rota recusa (${semToken.status})`,
  );

  const tokenErrado = await chamar({ 'x-psy-token': 'nao-e-o-token-certo-nao' });
  ok(tokenErrado.status === 401, `token errado recusa (${tokenErrado.status})`);

  const r1 = await chamar({ 'x-psy-token': env.LEMBRETES_TOKEN });
  const c1 = await r1.json();
  ok(r1.status === 200, `com o token certo, roda (${r1.status})`);
  ok(Number(c1.criados) > 0, `criou avisos (${c1.criados})`);

  let avisos = await avisosDe(usuarioId);
  const atrasoDoTeste = avisos.filter(
    (a) => a.tipo === 'tarefa_atrasada' && a.titulo.includes('conferir pixel'),
  );
  ok(atrasoDoTeste.length === 1, `a tarefa atrasada virou UM aviso (virou ${atrasoDoTeste.length})`);
  ok(
    /Atrasada há 3 dias/.test(atrasoDoTeste[0]?.titulo ?? ''),
    `com o atraso certo no texto ("${atrasoDoTeste[0]?.titulo}")`,
  );

  /* ---- o ponto que mais importa: rodar de novo não duplica -------- */
  const quantosAntes = avisos.length;
  const r2 = await chamar({ 'x-psy-token': env.LEMBRETES_TOKEN });
  const c2 = await r2.json();
  avisos = await avisosDe(usuarioId);

  ok(Number(c2.criados) === 0, `rodar de novo cria ZERO (criou ${c2.criados})`);
  ok(
    avisos.length === quantosAntes,
    `e a caixa continua com ${quantosAntes} (tem ${avisos.length})`,
  );

  /* ---------------------------------------------------------------- */
  console.log('\nO sino');

  await ir();
  const naoLidas = await pagina.evaluate(() => {
    const b = document.querySelector('button[aria-label^="Avisos"]');
    return b ? b.getAttribute('aria-label') : null;
  });
  ok(Boolean(naoLidas), `o sino existe no menu ("${naoLidas}")`);
  ok(
    /\d+ não lid/.test(naoLidas ?? ''),
    'e mostra quantos estão por ler',
  );

  await pagina.evaluate(() =>
    document.querySelector('button[aria-label^="Avisos"]')?.click(),
  );
  await new Promise((r) => setTimeout(r, 600));

  const naCaixa = await pagina.evaluate(() => document.body.innerText);
  ok(/conferir pixel/i.test(naCaixa), 'a caixa mostra o aviso da tarefa atrasada');

  ok(await clicar(pagina, 'marcar tudo como lido'), 'existe "marcar tudo como lido"');
  await new Promise((r) => setTimeout(r, 1500));

  const { count: aindaNaoLidas } = await admin
    .from('notificacao')
    .select('id', { count: 'exact', head: true })
    .eq('perfil_id', usuarioId)
    .is('lida_em', null);
  ok(aindaNaoLidas === 0, `não sobrou aviso por ler (sobraram ${aindaNaoLidas})`);

  const { count: apagadas } = await admin
    .from('notificacao')
    .select('id', { count: 'exact', head: true })
    .eq('perfil_id', usuarioId);
  ok(
    apagadas === quantosAntes,
    'e marcar como lido NÃO apaga: o histórico continua lá',
  );

  /* ---------------------------------------------------------------- */
  console.log('\nAviso é correspondência: ninguém lê a dos outros');

  const { data: outro } = await admin.auth.admin.createUser({
    email: `${marca}-outro@teste.local`,
    password: SENHA,
    email_confirm: true,
    app_metadata: { papel: 'gestor' },
  });

  const comoOutro = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });
  await comoOutro.auth.signInWithPassword({
    email: `${marca}-outro@teste.local`,
    password: SENHA,
  });

  const { data: espiadas } = await comoOutro
    .from('notificacao')
    .select('id')
    .eq('perfil_id', usuarioId);
  ok((espiadas ?? []).length === 0, 'outro usuário não lê os avisos deste');

  await admin.auth.admin.deleteUser(outro.user.id).catch(() => {});

  /* ---------------------------------------------------------------- */
  console.log('\nReabrir');

  await ir('concluidas');
  ok(await clicarNoCartao(pagina, SEMANAL, 'Reabrir'), 'existe o botão "Reabrir"');
  await esperarTexto(pagina, 'atualizada');

  linhas = await tarefasDe(SEMANAL);
  const reaberta = linhas.find((t) => t.id === feita?.id);
  ok(reaberta?.status === 'aberta', 'a tarefa voltou a aberta');
  ok(
    reaberta?.concluida_em === null,
    'e a data de conclusão foi limpa: senão o histórico passaria a mentir',
  );
} catch (e) {
  console.error(`\nErro no teste: ${e.message}`);
  falhas++;
} finally {
  if (navegador) await navegador.close().catch(() => {});

  /*
    Os avisos vão para TODO administrador ativo quando a tarefa não tem
    responsável — inclusive o administrador de verdade da agência.
    Apagar só os do usuário de teste deixava aviso de tarefa inventada
    na caixa de quem usa o painel para trabalhar.

    Por isso a limpeza é pelo TÍTULO, que carrega a marca deste teste,
    e não pelo destinatário.
  */
  await admin.from('notificacao').delete().like('titulo', `%${marca}%`);
  await admin.from('tarefa').delete().like('titulo', `${marca}%`);
  if (usuarioId) {
    await admin.from('notificacao').delete().eq('perfil_id', usuarioId);
    await admin.auth.admin.deleteUser(usuarioId).catch(() => {});
  }
  if (contaId) {
    await admin.from('tarefa').delete().eq('conta_id', contaId);
    await admin.from('fatura').delete().eq('conta_id', contaId);
    await admin.from('contrato').delete().eq('conta_id', contaId);
    const { error } = await admin.from('conta').delete().eq('id', contaId);
    if (error) {
      console.error(`  NÃO REMOVEU o cliente ${contaId}: ${error.message}`);
      falhas++;
    }
  }

  const { count: avisoSolto } = await admin
    .from('notificacao')
    .select('id', { count: 'exact', head: true })
    .like('titulo', `%${marca}%`);
  if (avisoSolto) {
    console.error(`  SOBRARAM ${avisoSolto} aviso(s) de teste na caixa de alguém.`);
    falhas++;
  }

  const { count: sobrou } = await admin
    .from('conta')
    .select('id', { count: 'exact', head: true })
    .like('nome', 'tar-%');
  if (sobrou) {
    console.error(`  SOBRARAM ${sobrou} cliente(s) de teste no banco.`);
    falhas++;
  } else {
    console.log('\nDados de teste removidos.');
  }
}

console.log(falhas === 0 ? '\nTAREFAS OK\n' : `\n${falhas} FALHA(S) NAS TAREFAS\n`);
process.exit(falhas === 0 ? 0 : 1);
