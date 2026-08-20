/**
 * Mede a geometria da proposta em vários tamanhos de tela.
 *
 *   npm run dev            (noutro terminal)
 *   npm run medir-proposta
 *
 * POR QUE MEDIR, E NÃO OLHAR UMA CAPTURA
 *
 * Captura de tela em headless com rolagem programática MENTE neste
 * projeto: volta preta de forma sistemática. Já custou tempo antes.
 * Geometria não mente — `getBoundingClientRect` devolve o mesmo número
 * que o navegador usou para desenhar.
 *
 * O que este script procura é o conjunto de erros que arruína um deck
 * no celular e que ninguém percebe no monitor:
 *
 *   - conteúdo mais largo que a tela, que cria rolagem lateral
 *     concorrente com o gesto de passar de slide;
 *   - slide mais alto que a tela sem rolagem própria, que corta o fim
 *     do texto sem aviso;
 *   - texto por baixo dos controles, que some justo onde o polegar fica;
 *   - alvo de toque menor que 24px, o mínimo da WCAG 2.2 (as setas,
 *     que são o controle principal, têm 48);
 *   - texto pequeno demais para ler em movimento.
 */
import { readFileSync, existsSync } from 'node:fs';
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
  console.error('\nNenhum Chrome ou Edge encontrado. Instale um dos dois.\n');
  process.exit(1);
}

const APP = process.env.APP_URL ?? 'http://localhost:3000';
const slug = process.argv[2];
if (!slug) {
  console.error('\nUso: node scripts/medir-proposta.mjs <slug-da-proposta>\n');
  process.exit(1);
}

/* Os tamanhos que importam. O 360x640 é o Android barato que ainda é o
   aparelho mais comum do Brasil, e é onde tudo quebra primeiro. */
const TELAS = [
  { nome: 'Android pequeno', w: 360, h: 640 },
  { nome: 'iPhone SE      ', w: 375, h: 667 },
  { nome: 'iPhone 14 Pro  ', w: 393, h: 852 },
  { nome: 'Tablet         ', w: 768, h: 1024 },
  { nome: 'Notebook       ', w: 1440, h: 900 },
];

let falhas = 0;
const ok = (b, t) => {
  if (!b) falhas++;
  return `${b ? 'ok  ' : 'FALHA'} ${t}`;
};

const navegador = await puppeteer.launch({
  executablePath,
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

try {
  for (const tela of TELAS) {
    const pagina = await navegador.newPage();
    await pagina.setViewport({ width: tela.w, height: tela.h, deviceScaleFactor: 2 });
    await pagina.goto(`${APP}/proposta/${slug}`, { waitUntil: 'networkidle0', timeout: 60000 });

    const medida = await pagina.evaluate(() => {
      const trilho = document.querySelector('.deck-trilho');
      const secoes = [...document.querySelectorAll('.deck-trilho > section')];
      const nav = document.querySelector('nav[aria-label="Navegação da apresentação"]');
      const topoNav = nav ? nav.getBoundingClientRect().top : window.innerHeight;

      const slides = secoes.map((s, i) => {
        const interno = s.firstElementChild;
        const alturaConteudo = interno ? interno.scrollHeight : 0;

        /* Elementos que passam da largura da própria seção. */
        const largos = [...s.querySelectorAll('*')]
          .filter((el) => {
            const r = el.getBoundingClientRect();
            return r.width > s.clientWidth + 1;
          })
          .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 40)}`);

        /* Texto que cai por baixo da barra de controles, só quando o
           slide NÃO tem rolagem própria sobrando. */
        const escondidos = s.scrollHeight <= s.clientHeight + 2
          ? [...s.querySelectorAll('p,li,h1,h2,h3,a,dd')].filter((el) => {
              const r = el.getBoundingClientRect();
              return r.height > 0 && r.top < window.innerHeight && r.bottom > topoNav + 4;
            }).length
          : 0;

        return {
          i: i + 1,
          largura: s.clientWidth,
          precisaRolar: alturaConteudo > s.clientHeight,
          sobra: s.clientHeight - alturaConteudo,
          largos: largos.slice(0, 3),
          escondidos,
        };
      });

      /* Elemento escondido tem retângulo zero e não é alvo de nada.
         A primeira versão os contava e acusava "menor alvo: 0px", que
         é um falso positivo com cara de problema grave. */
      const alvos = [...document.querySelectorAll('nav button, a[href^="http"]')]
        .map((b) => b.getBoundingClientRect())
        .filter((r) => r.width > 0 && r.height > 0)
        .map((r) => Math.min(r.width, r.height));

      const fontes = [...document.querySelectorAll('.deck-trilho p, .deck-trilho li, .deck-trilho dd')]
        .map((el) => parseFloat(getComputedStyle(el).fontSize))
        .filter((n) => n > 0);

      return {
        larguraDoc: document.documentElement.scrollWidth,
        larguraJanela: window.innerWidth,
        rolagemVerticalDoCorpo: document.body.scrollHeight > window.innerHeight + 2,
        trilhoLarg: trilho ? trilho.clientWidth : 0,
        slides,
        menorAlvo: alvos.length ? Math.min(...alvos) : 0,
        menorFonte: fontes.length ? Math.min(...fontes) : 0,
      };
    });

    console.log(`\n${tela.nome}  ${tela.w}x${tela.h}`);
    console.log(
      '  ' +
        ok(
          medida.larguraDoc <= medida.larguraJanela + 1,
          `sem rolagem lateral da página (doc ${medida.larguraDoc} / janela ${medida.larguraJanela})`,
        ),
    );
    console.log(
      '  ' + ok(!medida.rolagemVerticalDoCorpo, 'o corpo não rola: quem rola é o slide'),
    );
    console.log(
      '  ' +
        ok(
          medida.slides.every((s) => s.largura === medida.larguraJanela),
          'todo slide tem exatamente a largura da tela',
        ),
    );

    const comEstouro = medida.slides.filter((s) => s.largos.length > 0);
    console.log(
      '  ' +
        ok(
          comEstouro.length === 0,
          comEstouro.length === 0
            ? 'nenhum elemento mais largo que o slide'
            : `elementos estourando em ${comEstouro.map((s) => `#${s.i} (${s.largos[0]})`).join(', ')}`,
        ),
    );

    const cortados = medida.slides.filter((s) => s.escondidos > 0);
    console.log(
      '  ' +
        ok(
          cortados.length === 0,
          cortados.length === 0
            ? 'nada de texto por baixo dos controles'
            : `texto sob os controles em ${cortados.map((s) => `#${s.i}`).join(', ')}`,
        ),
    );

    console.log(
      '  ' + ok(medida.menorAlvo >= 24, `menor alvo de toque: ${Math.round(medida.menorAlvo)}px`),
    );
    console.log(
      '  ' + ok(medida.menorFonte >= 11, `menor corpo de texto: ${medida.menorFonte}px`),
    );

    const rolam = medida.slides.filter((s) => s.precisaRolar).map((s) => s.i);
    console.log(
      `  info  ${rolam.length} de ${medida.slides.length} slides precisam rolar${rolam.length ? `: ${rolam.join(', ')}` : ''}`,
    );

    await pagina.close();
  }
} finally {
  await navegador.close();
}

console.log(falhas === 0 ? '\nPROPOSTA OK\n' : `\n${falhas} PROBLEMA(S) DE LAYOUT\n`);
process.exit(falhas === 0 ? 0 : 1);
