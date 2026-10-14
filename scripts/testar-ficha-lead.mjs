/**
 * A ficha do lead salva o que mudou, e NAO apaga o resto.
 *
 *   npm run dev            (noutro terminal)
 *   npm run testar-ficha-lead
 *
 * ============================================================
 * POR QUE ESTE TESTE EXISTE
 * ============================================================
 * `editarLead` grava a ficha inteira numa tacada. Campo que o
 * formulario esquecer chega vazio ao esquema e apaga o que estava la,
 * sem erro nenhum na tela. O prejuizo aparece dias depois, quando
 * alguem procura o telefone do lead e nao acha.
 *
 * Entao o teste nao conferere so o que mudou: ele conferere, um por um,
 * que email, origem, probabilidade, proximo passo, empresa e verba
 * continuam ali. E que o ESTAGIO nao mudou, porque o formulario manda
 * um campo escondido com ele e a acao no servidor tem que ignorar.
 *
 * ============================================================
 * DUAS ARMADILHAS DE MEDICAO JA PAGAS
 * ============================================================
 * 1. `document.body.innerText` NAO enxerga o conteudo do painel
 *    sobreposto da ficha. Tres rodadas acusaram "nao renderizou" com a
 *    tela certa. Aqui se le o textContent do painel.
 *
 * 2. Digitar antes da hidratacao poe o caractere no DOM e nao no estado
 *    do React, e o login envia vazio. Por isso `entrar` confere o campo
 *    antes de enviar, e tenta de novo.
 *
 * O usuario e o lead de teste sao criados, usados e APAGADOS na mesma
 * execucao, no finally.
 */
import { readFileSync, existsSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import puppeteer from 'puppeteer-core';

const env = {};
for (const l of readFileSync('.env.local', 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
}
const NAV = ['C:/Program Files/Google/Chrome/Application/chrome.exe'].find(existsSync);
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const marca = `ZZEDIT-${Date.now()}`;
const EMAIL = `edit-${Date.now()}@teste.local`;
const SENHA = `edit-${Date.now()}-xyz`;
let idU = null;
let idL = null;
let nav = null;

/* Digitar antes da hidratação põe o caractere no DOM e não no estado do
   React, e o formulário envia vazio. Por isso o login confere o campo. */
async function entrar(p) {
  await p.goto('http://localhost:3000/entrar', { waitUntil: 'networkidle0', timeout: 90000 });
  for (let i = 1; i <= 3; i++) {
    await p.evaluate(() => {
      document.querySelector('#email').value = '';
      document.querySelector('#senha').value = '';
    });
    await p.type('#email', EMAIL, { delay: 10 });
    await p.type('#senha', SENHA, { delay: 10 });
    if (!(await p.evaluate(() => document.querySelector('#email').value.length > 0))) {
      await new Promise((r) => setTimeout(r, 800));
      continue;
    }
    await p.click('button[type=submit]');
    try {
      await p.waitForFunction(() => location.pathname.startsWith('/painel'), { timeout: 20000 });
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 1200));
    }
  }
  throw new Error('login nao passou');
}

/* O painel da ficha é sobreposto, e `document.body.innerText` NÃO
   enxerga o conteúdo dele. Ler pelo textContent do painel. */
const noPainel = (p, fn) => p.evaluate(fn);

try {
  const u = await admin.auth.admin.createUser({
    email: EMAIL, password: SENHA, email_confirm: true,
    app_metadata: { papel: 'administrador' }, user_metadata: { nome: 'Edit' },
  });
  if (u.error) throw u.error;
  idU = u.data.user.id;

  const ins = await admin
    .from('lead')
    .insert({
      nome: 'Contato velho', empresa: marca, estagio: 'novo',
      email: 'velho@exemplo.com', telefone: '47999990000', origem: 'Indicação',
      cobranca: 'mensal', valor_fee_estimado: 1000, valor_verba_estimada: 2000,
      probabilidade: 20, proximo_passo: 'Passo velho',
    })
    .select('*')
    .single();
  if (ins.error) throw ins.error;
  idL = ins.data.id;
  console.log('antes:', JSON.stringify({
    nome: ins.data.nome, email: ins.data.email, telefone: ins.data.telefone,
    origem: ins.data.origem, cobranca: ins.data.cobranca, servico: ins.data.servico,
    fee: ins.data.valor_fee_estimado, verba: ins.data.valor_verba_estimada,
    prob: ins.data.probabilidade, passo: ins.data.proximo_passo, estagio: ins.data.estagio,
  }));

  nav = await puppeteer.launch({ executablePath: NAV, headless: 'new', args: ['--no-sandbox'] });
  const p = await nav.newPage();
  p.on('pageerror', (e) => console.log('ERRO NA PAGINA:', e.message.slice(0, 200)));
  await p.setViewport({ width: 1280, height: 950 });
  await entrar(p);

  await p.goto('http://localhost:3000/painel/crm', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await p.waitForFunction((m) => document.body.innerText.includes(m), { timeout: 60000 }, marca);
  await p.evaluate((m) => {
    [...document.querySelectorAll('ul li button')].find((x) => x.innerText.includes(m)).click();
  }, marca);
  await p.waitForFunction(() => !!document.querySelector('button[aria-label=Fechar]'), { timeout: 30000 });

  // abre a aba Dados
  await noPainel(p, () => {
    const painel = document.querySelector('button[aria-label=Fechar]').parentElement;
    [...painel.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Dados').click();
  });
  await p.waitForFunction(() => {
    const f = document.querySelector('button[aria-label=Fechar]');
    return f && /Salvar ficha/.test(f.parentElement.textContent);
  }, { timeout: 20000 });

  const campos = await noPainel(p, () => {
    const painel = document.querySelector('button[aria-label=Fechar]').parentElement;
    return [...painel.querySelectorAll('input')].map((i) => `${i.name || i.type}=${i.value}`);
  });
  console.log('campos do formulario:', campos.join(' · '));

  // troca tudo: nome, empresa, cobranca para projeto, servico e valor
  await noPainel(p, () => {
    const painel = document.querySelector('button[aria-label=Fechar]').parentElement;
    const set = (id, v) => {
      const el = painel.querySelector(id);
      const nativo = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      nativo.call(el, v);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    };
    set('#e-nome', 'Contato novo');
    set('#e-tel', '47988887777');
    painel.querySelector('input[name=cobranca][value=projeto]').click();
    set('#e-fee', '4200');
    set('#e-servico', 'Identidade visual');
    [...painel.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Salvar ficha').click();
  });

  await new Promise((r) => setTimeout(r, 3000));
  const d = await admin.from('lead').select('*').eq('id', idL).single();
  console.log('depois:', JSON.stringify({
    nome: d.data.nome, email: d.data.email, telefone: d.data.telefone,
    origem: d.data.origem, cobranca: d.data.cobranca, servico: d.data.servico,
    fee: d.data.valor_fee_estimado, verba: d.data.valor_verba_estimada,
    prob: d.data.probabilidade, passo: d.data.proximo_passo, estagio: d.data.estagio,
  }));

  const esperado = {
    nome: 'Contato novo', telefone: '47988887777', cobranca: 'projeto',
    servico: 'Identidade visual', fee: 4200,
  };
  const preservado = {
    email: 'velho@exemplo.com', origem: 'Indicação', prob: 20,
    passo: 'Passo velho', estagio: 'novo', empresa: marca,
  };
  const erros = [];
  if (d.data.nome !== esperado.nome) erros.push('nome nao mudou');
  if (d.data.telefone !== esperado.telefone) erros.push('telefone nao mudou');
  if (d.data.cobranca !== esperado.cobranca) erros.push('cobranca nao mudou');
  if (d.data.servico !== esperado.servico) erros.push('servico nao mudou');
  if (Number(d.data.valor_fee_estimado) !== esperado.fee) erros.push('fee nao mudou');
  if (d.data.email !== preservado.email) erros.push('APAGOU o email');
  if (d.data.origem !== preservado.origem) erros.push('APAGOU a origem');
  if (d.data.probabilidade !== preservado.prob) erros.push('APAGOU a probabilidade');
  if (d.data.proximo_passo !== preservado.passo) erros.push('APAGOU o proximo passo');
  if (d.data.empresa !== preservado.empresa) erros.push('APAGOU a empresa');
  if (d.data.estagio !== preservado.estagio) erros.push('MUDOU o estagio');
  console.log(erros.length ? 'FALHAS: ' + erros.join(' | ') : 'tudo certo: mudou o que devia e preservou o resto');
} catch (e) {
  console.error('ERRO:', e.message);
} finally {
  if (nav) await nav.close().catch(() => {});
  if (idL) await admin.from('lead').delete().eq('id', idL);
  if (idU) await admin.auth.admin.deleteUser(idU);
  console.log('limpeza feita');
}
