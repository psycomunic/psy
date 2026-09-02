/**
 * A abertura de /trafego-pago tem uma troca embutida, e este script
 * mede os dois lados dela.
 *
 *   npm run dev            (noutro terminal)
 *   npm run conferir-hero
 *
 * O holofote precisa APARECER, senao e codigo rodando a toa: mede-se o
 * brilho medio de um pedaco da parede com a luz longe e com a luz em
 * cima. Menos de 25% de ganho e efeito que ninguem percebe.
 *
 * E o texto precisa continuar LEGIVEL com a luz parada bem em cima
 * dele. Foi por isso que o recorte existe: sem ele, medido, o pixel
 * mais claro atras do titulo dava 2,71:1 contra o branco num telefone
 * de 390. Aqui o fundo e fotografado com a interface escondida, senao
 * a media sobe por causa das proprias letras e o teste mente a favor.
 *
 * Captura de tela com rolagem programatica volta preta neste projeto.
 * Estas nao rolam nada, e por isso funcionam.
 */
import puppeteer from 'puppeteer-core';
import { existsSync } from 'node:fs';

const NAVEGADORES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
];
const executablePath = NAVEGADORES.find((c) => existsSync(c));
const APP = process.env.APP_URL ?? 'http://localhost:3000';

const GANHO_MINIMO = 25;
const CONTRASTE_MINIMO = 4.5;

/* Onde ha parede a mostra, em cada largura: fora do bloco de texto e
   dentro da primeira tela. */
const TELAS = [
  { nome: '1440x900', w: 1440, h: 900, x: 1080, y: 420 },
  { nome: '390x844', w: 390, h: 844, x: 200, y: 140 },
  { nome: '360x740', w: 360, h: 740, x: 180, y: 120 },
];

const canal = (v) => {
  const n = v / 255;
  return n <= 0.03928 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
};

const analisar = (p, caixa) =>
  p
    .screenshot({ clip: caixa, encoding: 'base64' })
    .then((b64) =>
      p.evaluate(async (d) => {
        const img = new Image();
        img.src = `data:image/png;base64,${d}`;
        await img.decode();
        const c = document.createElement('canvas');
        c.width = img.width;
        c.height = img.height;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const px = ctx.getImageData(0, 0, c.width, c.height).data;
        let claro = [0, 0, 0];
        let soma = 0;
        for (let i = 0; i < px.length; i += 4) {
          const l = px[i] + px[i + 1] + px[i + 2];
          if (l > claro[0] + claro[1] + claro[2]) claro = [px[i], px[i + 1], px[i + 2]];
          soma += l / 3;
        }
        return { claro, media: +(soma / (px.length / 4)).toFixed(1) };
      }, b64),
    );

let falhas = 0;
const nav = await puppeteer.launch({ executablePath, headless: true, args: ['--no-sandbox'] });

for (const t of TELAS) {
  const p = await nav.newPage();
  await p.setViewport({ width: t.w, height: t.h, deviceScaleFactor: 1 });
  await p.goto(`${APP}/trafego-pago`, { waitUntil: 'networkidle0', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 1500));

  const caixa = { x: Math.max(0, t.x - 48), y: Math.max(0, t.y - 48), width: 96, height: 96 };

  await p.mouse.move(4, 4);
  await new Promise((r) => setTimeout(r, 400));
  const apagado = await analisar(p, caixa);

  await p.mouse.move(t.x, t.y);
  await new Promise((r) => setTimeout(r, 400));
  const aceso = await analisar(p, caixa);

  const ganho = apagado.media > 0 ? (aceso.media / apagado.media - 1) * 100 : 0;
  const bom = ganho >= GANHO_MINIMO;
  if (!bom) falhas++;
  console.log(
    `  ${bom ? 'ok    ' : 'FALHA '} ${t.nome} holofote: ${apagado.media} -> ${aceso.media} (${ganho.toFixed(0)}% de ganho)`,
  );

  /* Agora o preco: luz parada em cima do titulo, interface escondida. */
  const cx = await p.evaluate(() => {
    const h1 = document.querySelector('section[aria-label="Abertura"] h1');
    const b = h1.getBoundingClientRect();
    return {
      meioX: Math.round(b.left + b.width / 2),
      meioY: Math.round(b.top + b.height / 2),
      x: Math.round(b.left),
      y: Math.round(b.top),
      width: Math.round(b.width),
      height: Math.round(b.height),
    };
  });
  await p.mouse.move(cx.meioX, cx.meioY);
  await new Promise((r) => setTimeout(r, 400));
  /* O `>` nao e decoracao: sem ele o seletor pega um div qualquer la
     dentro, a camada de interface continua visivel, e a foto sai com as
     letras brancas em cima, dando 1,00:1 e reprovando tudo. Falhou para
     o lado certo, mas falhou. */
  const escondeu = await p.evaluate(() => {
    const d = document.querySelector('section[aria-label="Abertura"] > div:last-of-type');
    if (!d || !d.contains(document.querySelector('section[aria-label="Abertura"] h1'))) return false;
    d.style.visibility = 'hidden';
    return true;
  });
  if (!escondeu) {
    console.log(`  FALHA  ${t.nome}: nao achei a camada de interface para esconder`);
    falhas++;
  }
  await new Promise((r) => setTimeout(r, 150));

  const fundo = await analisar(p, {
    x: cx.x,
    y: cx.y,
    width: cx.width,
    height: cx.height,
  });
  const L =
    0.2126 * canal(fundo.claro[0]) + 0.7152 * canal(fundo.claro[1]) + 0.0722 * canal(fundo.claro[2]);
  const contraste = 1.05 / (L + 0.05);
  const legivel = contraste >= CONTRASTE_MINIMO;
  if (!legivel) falhas++;
  console.log(
    `  ${legivel ? 'ok    ' : 'FALHA '} ${t.nome} texto com a luz em cima: ${contraste.toFixed(2)}:1 (minimo ${CONTRASTE_MINIMO})`,
  );

  await p.close();
}

await nav.close();
console.log(
  falhas === 0
    ? '\nHERO OK: o holofote aparece e o texto continua legivel.\n'
    : `\n${falhas} PROBLEMA(S) NA ABERTURA\n`,
);
process.exitCode = falhas === 0 ? 0 : 1;
