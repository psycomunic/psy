/**
 * Quanto tempo leva trocar de aba no painel, medido no navegador.
 *
 *   npm run medir-abas                              mede a producao
 *   APP_URL=http://localhost:3000 npm run medir-abas  mede o local
 *
 * ============================================================
 * O QUE ELE SEPARA, E POR QUE ISSO IMPORTA
 * ============================================================
 * Tres numeros por aba, e a diferenca entre eles e o diagnostico:
 *
 *   tela              do clique ate o conteudo pintado
 *   resposta inteira  duracao completa do pedido RSC
 *   primeiro byte     quando a resposta COMECOU a chegar
 *
 * O primeiro byte sozinho mente neste projeto. O Next transmite a
 * resposta, entao ele chega cedo mesmo quando o servidor ainda vai
 * passar segundos esperando o banco. Ja caimos nessa duas vezes.
 *
 * Com "tela" perto de "resposta inteira", o navegador esta so
 * esperando: o problema e do servidor. Se descolarem, ai sim e render.
 *
 * ============================================================
 * COMPARAR PRODUCAO COM LOCAL E O QUE ACHOU A LENTIDAO
 * ============================================================
 * Mesmo codigo, mesmo banco remoto, redes diferentes. Em 13/10/2026 a
 * producao levava 5253ms no financeiro e a mesma pagina aqui levava
 * 148ms, com rede PIOR ate o banco. Isso eliminou codigo, banco e
 * navegador de uma vez, e sobrou a Vercel: as funcoes rodavam em
 * Washington com o banco em Sao Paulo.
 *
 * O usuario de teste e criado, usado e APAGADO na mesma execucao, no
 * finally. O e-mail termina em @teste.local, que e o padrao que
 * `npm run limpar-teste` tambem reconhece.
 */
import { readFileSync, existsSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import puppeteer from 'puppeteer-core';

const env = {};
for (const l of readFileSync('.env.local', 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
}
const APP = process.env.APP_URL ?? 'https://www.psycomunic.com.br';
const NAV = ['C:/Program Files/Google/Chrome/Application/chrome.exe',
             'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(existsSync);

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const EMAIL = `medida-${Date.now()}@teste.local`;
const SENHA = `medida-${Date.now()}-xyz`;
let idUsuario = null;
let navegador = null;

const ABAS = [
  ['visao', 'Visão geral'], ['prospeccao', 'Prospecção ativa'], ['crm', 'CRM'],
  ['propostas', 'Propostas'], ['financeiro', 'Financeiro'], ['contas', 'Clientes'],
  ['projetos', 'Projetos'], ['postagens', 'Postagens'], ['tarefas', 'Tarefas'],
  ['equipe', 'Equipe'], ['auditoria', 'Auditoria'], ['configuracoes', 'Configurações'],
];

try {
  const { data, error } = await admin.auth.admin.createUser({
    email: EMAIL, password: SENHA, email_confirm: true,
    app_metadata: { papel: 'administrador' }, user_metadata: { nome: 'Medida' },
  });
  if (error) throw error;
  idUsuario = data.user.id;

  navegador = await puppeteer.launch({ executablePath: NAV, headless: 'new', args: ['--no-sandbox'] });
  const p = await navegador.newPage();
  await p.setViewport({ width: 1440, height: 900 });

  await p.goto(`${APP}/entrar`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await p.type('#email', EMAIL);
  await p.type('#senha', SENHA);
  const tLogin = Date.now();
  await Promise.all([
    p.waitForFunction(() => location.pathname.startsWith('/painel'), { timeout: 60000 }),
    p.click('button[type=submit]'),
  ]);
  await p.waitForFunction(() => {
    const h = document.querySelector('main h1');
    return h && h.textContent.trim() === 'Visão geral';
  }, { timeout: 60000 });
  console.log(`login + primeira pintura do painel: ${Date.now() - tLogin}ms\n`);

  await p.evaluate(() => {
    window.__rsc = [];
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) {
        if (e.name.includes('_rsc=') || e.initiatorType === 'fetch') {
          window.__rsc.push({ u: e.name.split('?')[0].replace(location.origin, ''), total: Math.round(e.duration), servidor: Math.round(e.responseStart - e.requestStart) });
        }
      }
    }).observe({ type: 'resource', buffered: true });
  });

  for (const volta of [1, 2, 3]) {
    console.log(`--- passada ${volta} ---`);
    for (const [rota, rotulo] of ABAS) {
      await p.evaluate(() => { window.__rsc = []; });
      const t0 = Date.now();
      await p.click(`a[href^="/painel/${rota}"]`);
      await p.waitForFunction((r) => {
        const h = document.querySelector('main h1');
        const carregando = [...document.querySelectorAll('[role="status"]')]
          .some((e) => e.textContent.trim() === 'Carregando');
        return !carregando && h && h.textContent.trim() === r;
      }, { timeout: 60000 }, rotulo);
      const t = Date.now() - t0;
      const rsc = await p.evaluate(() => window.__rsc);
      const total = rsc.length ? Math.max(...rsc.map((x) => x.total)) : 0;
      const ttfb = rsc.length ? Math.max(...rsc.map((x) => x.servidor)) : 0;
      console.log(`  ${rota.padEnd(14)} tela ${String(t).padStart(5)}ms | resposta inteira ${String(total).padStart(5)}ms | primeiro byte ${String(ttfb).padStart(4)}ms`);
    }
    console.log();
  }
} catch (e) {
  console.error('ERRO:', e.message);
} finally {
  if (navegador) await navegador.close().catch(() => {});
  if (idUsuario) { await admin.auth.admin.deleteUser(idUsuario); console.log('usuario de teste apagado'); }
}
