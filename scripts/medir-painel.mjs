/**
 * Mede o painel LOGADO em três larguras de tela.
 *
 *   npm run dev          (noutro terminal)
 *   npm run medir-painel
 *
 * POR QUE ISTO EXISTE
 *
 * Auditoria de painel feita de fora costuma medir a coisa errada. Contar
 * `@media` no CSS autoral, por exemplo, não diz nada num projeto com
 * Tailwind: lá a responsividade mora em utilitário (`sm:`, `md:`), e o
 * CSS gerado só ganha as media queries no build.
 *
 * Então aqui não se conta regra de CSS. Mede-se o que o navegador
 * desenhou: largura do documento contra a da janela, elemento que
 * estoura, tamanho de fonte, alvo de toque, e quanta tela um KPI ocupa.
 *
 * O usuário de teste é criado, usado e APAGADO na mesma execução. Ele
 * nunca fica no banco, e o e-mail termina em @teste.local, que é o
 * padrão que `npm run limpar-teste` também reconhece.
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

const EMAIL = `medida-${Date.now()}@teste.local`;
const SENHA = 'Medida-Painel-2026-xyz';

const ROTAS = [
  'visao', 'crm', 'propostas', 'financeiro', 'contas',
  'metricas', 'tarefas', 'relatorios', 'equipe', 'auditoria', 'configuracoes',
];

const TELAS = [
  { nome: 'celular ', w: 390, h: 844 },
  { nome: 'tablet  ', w: 768, h: 1024 },
  { nome: 'desktop ', w: 1440, h: 900 },
];

let usuarioId = null;
let problemas = 0;

try {
  const { data: criado, error } = await admin.auth.admin.createUser({
    email: EMAIL,
    password: SENHA,
    email_confirm: true,
    app_metadata: { papel: 'administrador' },
  });
  if (error) throw new Error(`não criou o usuário: ${error.message}`);
  usuarioId = criado.user.id;

  const navegador = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    for (const tela of TELAS) {
      const pagina = await navegador.newPage();
      await pagina.setViewport({ width: tela.w, height: tela.h, deviceScaleFactor: 2 });

      await pagina.goto(`${APP}/entrar`, { waitUntil: 'networkidle0', timeout: 60000 });

      /* A sessão vive no contexto do navegador, então da segunda tela em
         diante /entrar já redireciona para o painel e não há formulário
         nenhum para preencher. */
      const precisaLogar = await pagina.$('input[name="email"]');
      if (precisaLogar) {
        await pagina.type('input[name="email"]', EMAIL);
        await pagina.type('input[name="senha"]', SENHA);
        await Promise.all([
          pagina.waitForNavigation({ waitUntil: 'networkidle0', timeout: 60000 }),
          pagina.click('button[type="submit"]'),
        ]);
      }

      console.log(`\n${'='.repeat(64)}\n${tela.nome.trim().toUpperCase()}  ${tela.w}x${tela.h}\n${'='.repeat(64)}`);

      for (const rota of ROTAS) {
        await pagina.goto(`${APP}/painel/${rota}`, { waitUntil: 'networkidle0', timeout: 60000 });

        const m = await pagina.evaluate(() => {
          const janela = window.innerWidth;

          /* Elementos que passam da largura da janela. Ignora os que
             rolam por conta própria: tabela dentro de um container com
             overflow-x é solução, e não defeito. */
          const estouram = [...document.querySelectorAll('body *')]
            .filter((el) => {
              const r = el.getBoundingClientRect();
              if (r.width <= janela + 1) return false;

              /* Elemento posicionado em relação à JANELA não estende a
                 área de rolagem do documento, então não pode causar
                 rolagem lateral. Contá-lo era falso positivo: onze
                 rotas acusadas enquanto `scrollWidth` seguia igual à
                 largura da tela.

                 Falso positivo em ferramenta de medição é pior que não
                 medir, porque some com o problema real no meio do
                 ruído. */
              let no = el;
              while (no && no !== document.body) {
                const e = getComputedStyle(no);
                if (e.position === 'fixed') return false;
                if (no !== el && /auto|scroll|hidden|clip/.test(e.overflowX)) return false;
                no = no.parentElement;
              }
              return true;
            })
            .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 30)}`);

          const aside = document.querySelector('aside');
          const rAside = aside ? aside.getBoundingClientRect() : null;

          const daFonte = new Map();
          for (const el of document.querySelectorAll('p, li, td, th, dd, a, span, dt')) {
            const proprio = [...el.childNodes]
              .filter((n) => n.nodeType === 3)
              .map((n) => n.textContent.trim())
              .join('');
            if (proprio.length < 3) continue;
            const px = parseFloat(getComputedStyle(el).fontSize);
            if (!daFonte.has(px)) daFonte.set(px, proprio.slice(0, 28));
          }
          const textos = [...daFonte.keys()];
          const menorTexto = textos.length ? daFonte.get(Math.min(...textos)) : '';

          const clicaveis = [...document.querySelectorAll('a, button, input, select')]
            .filter((el) => {
              if (el.type === 'hidden' || el.disabled) return false;
              const e = getComputedStyle(el);
              if (e.display === 'none' || e.visibility === 'hidden' || e.opacity === '0') return false;
              const r = el.getBoundingClientRect();
              return r.width >= 4 && r.height >= 4;
            })
            .map((el) => el.getBoundingClientRect());

          /* Quanto da primeira tela um bloco de KPI consome. */
          const kpis = [...document.querySelectorAll('[class*="cartao"]')].slice(0, 4);
          const alturaKpi = kpis.length
            ? Math.round(kpis.reduce((s, k) => s + k.getBoundingClientRect().height, 0) / kpis.length)
            : 0;

          return {
            docLarg: document.documentElement.scrollWidth,
            janela,
            estouram: estouram.slice(0, 2),
            asideLarg: rAside ? Math.round(rAside.width) : 0,
            asideVisivel: rAside ? rAside.width > 0 && rAside.left > -rAside.width : false,
            menorFonte: textos.length ? Math.min(...textos) : 0,
            menorTexto,
            menorAlvo: clicaveis.length ? Math.round(Math.min(...clicaveis.map((r) => Math.min(r.width, r.height)))) : 0,
            alturaKpi,
            alturaTotal: document.documentElement.scrollHeight,
          };
        });

        /*
          Página que não renderizou não passa no teste.

          Sem esta checagem, um erro de compilação produzia "ok" em
          todas as rotas com sidebar 0px e fonte 0px: página vazia não
          estoura largura nenhuma. É o mesmo falso positivo que o
          detector de estouro já tinha, e o pior tipo — o que diz que
          está tudo bem justamente quando tudo quebrou.
        */
        const renderizou = m.asideLarg > 0 && m.menorFonte > 0;
        if (!renderizou) problemas++;

        const semEstouro = m.docLarg <= m.janela + 1 && m.estouram.length === 0;
        if (renderizou && !semEstouro) problemas++;

        const sinal = !renderizou ? 'QUEBRADA' : semEstouro ? 'ok  ' : 'ESTOURA';
        const extra = !renderizou
          ? '  <- a página não renderizou'
          : semEstouro
            ? ''
            : `  <- ${m.estouram.join(' | ')}`;

        console.log(
          `  ${sinal} /${rota.padEnd(14)} doc ${String(m.docLarg).padStart(4)}  ` +
            `sidebar ${String(m.asideLarg).padStart(3)}px  ` +
            `fonte ${String(m.menorFonte).padStart(5)}  ` +
            `alvo ${String(m.menorAlvo).padStart(3)}  ` +
            `kpi ${String(m.alturaKpi).padStart(3)}px  ` +
            `altura ${m.alturaTotal}${extra}`,
        );
      }

      await pagina.close();
    }
  } finally {
    await navegador.close();
  }
} catch (e) {
  console.error(`\nErro: ${e.message}`);
  problemas++;
} finally {
  if (usuarioId) await admin.auth.admin.deleteUser(usuarioId).catch(() => {});
  console.log('\nUsuário de teste removido.');
}

console.log(
  problemas === 0
    ? '\nPAINEL OK: nenhuma rota estoura a largura da tela.\n'
    : `\n${problemas} rota(s) com estouro horizontal.\n`,
);
