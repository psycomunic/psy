/**
 * Confere TODO link do site publico: destino existe, ancora existe.
 *
 *   npm run dev            (noutro terminal)
 *   npm run conferir-ctas
 *
 * POR QUE ISTO EXISTE
 *
 * Botao que leva para 404 nao parece defeito para quem escreveu a
 * pagina: o texto esta certo, o estilo esta certo, e a rota so nao
 * existe. Quem descobre e o visitante, no unico clique que ele deu.
 *
 * O script visita cada pagina, junta todo href, e bate em cada um.
 * Ancora tambem: `#parceria` que nao encontra `id="parceria"` rola
 * para lugar nenhum e parece que o site travou.
 */
import puppeteer from 'puppeteer-core';
import { existsSync } from 'node:fs';

const NAVEGADORES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
];
const executablePath = NAVEGADORES.find((p) => existsSync(p));
const APP = process.env.APP_URL ?? 'http://localhost:3000';

const PAGINAS = [
  '/', '/servicos', '/servicos/gestao', '/servicos/tecnologia', '/servicos/marketing',
  '/servicos/atendimento-logistica', '/como-trabalhamos', '/cases', '/sobre',
  '/contato', '/diagnostico', '/trafego-pago',
  '/politica-de-privacidade', '/termos-de-uso',
];

let falhas = 0;
const vistos = new Map();

const nav = await puppeteer.launch({ executablePath, headless: true, args: ['--no-sandbox'] });
const p = await nav.newPage();
await p.setViewport({ width: 1440, height: 900 });

for (const rota of PAGINAS) {
  const r = await p.goto(`${APP}${rota}`, { waitUntil: 'networkidle0', timeout: 60000 });
  if (r.status() !== 200) {
    console.log(`  FALHA  ${rota} responde ${r.status()}`);
    falhas++;
    continue;
  }

  const links = await p.evaluate(() =>
    [...document.querySelectorAll('a[href]')].map((a) => ({
      href: a.getAttribute('href'),
      texto: (a.textContent ?? '').trim().slice(0, 40),
    })),
  );

  const ancoras = await p.evaluate(() =>
    [...document.querySelectorAll('[id]')].map((e) => e.id),
  );

  for (const l of links) {
    const h = l.href;
    if (!h) continue;

    if (h.startsWith('mailto:')) {
      console.log(`  EMAIL  ${rota} -> ${h}  ("${l.texto}")`);
      continue;
    }
    if (h.startsWith('http') || h.startsWith('tel:')) continue;

    if (h.startsWith('#')) {
      const id = h.slice(1);
      if (!ancoras.includes(id)) {
        console.log(`  FALHA  ${rota} -> ${h} nao existe nesta pagina  ("${l.texto}")`);
        falhas++;
      }
      continue;
    }

    const [alvo, ancora] = h.split('#');

    if (!vistos.has(alvo)) {
      /* `manual` para o redirecionamento APARECER, em vez de ser
         seguido em silêncio. /planos respondia 308 para /servicos, e
         seguir escondia que o botão "Ver os planos" entregava outra
         coisa: um clique que funciona e leva ao lugar errado é pior
         que um 404, porque ninguém investiga. */
      const res = await fetch(`${APP}${alvo}`, { redirect: 'manual' });
      let destino = alvo;
      let status = res.status;

      if (status >= 300 && status < 400) {
        const para = res.headers.get('location');
        console.log(`  AVISO  ${alvo} redireciona para ${para}`);
        destino = para ?? alvo;
        status = (await fetch(new URL(destino, APP), { redirect: 'manual' })).status;
      }

      /* Guarda o HTML para conferir âncora de OUTRA página. Um link
         para /trafego-pago#analise só funciona se aquele id existir
         lá, e isso não dá para ver da página de origem. */
      const corpo = status === 200 ? await (await fetch(new URL(destino, APP))).text() : '';
      vistos.set(alvo, { status, corpo });
    }

    const { status, corpo } = vistos.get(alvo);
    if (status >= 400) {
      console.log(`  FALHA  ${rota} -> ${alvo} responde ${status}  ("${l.texto}")`);
      falhas++;
    } else if (ancora && !corpo.includes(`id="${ancora}"`)) {
      console.log(`  FALHA  ${rota} -> ${h}: a âncora não existe no destino  ("${l.texto}")`);
      falhas++;
    }
  }
}

await nav.close();

console.log(
  falhas === 0
    ? `\nCTAS OK: ${vistos.size} destinos conferidos, nenhum quebrado.\n`
    : `\n${falhas} CTA(S) QUEBRADO(S)\n`,
);
process.exitCode = falhas === 0 ? 0 : 1;
