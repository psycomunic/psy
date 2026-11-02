/**
 * Mede a cena das fachadas no celular e no computador.
 *
 *   npm run dev            (noutro terminal)
 *   node scripts/medir-fachadas.mjs
 *
 * POR QUE MEDIR, E NÃO OLHAR UMA CAPTURA
 *
 * Captura de tela em headless com rolagem programática MENTE neste
 * projeto: volta preta de forma sistemática. Aqui isso seria fatal,
 * porque o defeito que este script existe para pegar É a tela preta:
 * a captura não distingue "quebrou" de "o headless mentiu de novo".
 *
 * Então nada de imagem. O que se mede:
 *
 *   - o celular NÃO baixa o vídeo (currentSrc vazio). Em 1 de novembro
 *     eram 10 MB indo para o 4G de Bragança para pintar preto;
 *   - a imagem de quadro está pintada, com largura e altura de
 *     verdade, e o quadro TROCA conforme a rolagem;
 *   - a tela de carga saiu do caminho;
 *   - o contador cai de 10 para 01 e a barra de progresso acompanha.
 */
import { existsSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const NAVEGADORES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
];
const executablePath = NAVEGADORES.find((p) => existsSync(p));
if (!executablePath) {
  console.error('\nNenhum Chrome ou Edge encontrado. Instale um dos dois.\n');
  process.exit(1);
}

const APP = process.env.APP_URL ?? 'http://localhost:3000';
const ALVO = `${APP}/braganca-pa/selecao`;

const TELAS = [
  { nome: 'iPhone 14 Pro', w: 393, h: 852, toque: true, esperaVideo: false },
  { nome: 'Android baixo', w: 360, h: 640, toque: true, esperaVideo: false },
  { nome: 'Notebook     ', w: 1440, h: 900, toque: false, esperaVideo: true },
];

const navegador = await puppeteer.launch({
  executablePath,
  headless: 'new',
  args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'],
});

let problemas = 0;

for (const t of TELAS) {
  const pag = await navegador.newPage();
  await pag.setViewport({
    width: t.w,
    height: t.h,
    isMobile: t.toque,
    hasTouch: t.toque,
    deviceScaleFactor: t.toque ? 3 : 1,
  });

  await pag.goto(ALVO, { waitUntil: 'networkidle2', timeout: 60000 });

  /* O fallback da cena é de 6 s. Espera 7 para medir o estado final,
     que é justamente o que ficava preto. */
  await new Promise((r) => setTimeout(r, 7000));

  console.log(`\n${'='.repeat(70)}`);
  console.log(`${t.nome}  ${t.w}x${t.h}  ${t.toque ? 'toque' : 'mouse'}`);
  console.log('='.repeat(70));

  const vistos = new Set();
  const tempos = new Set();
  let linhas = 0;

  for (const p of [0, 0.25, 0.5, 0.75, 1]) {
    const m = await pag.evaluate(async (frac) => {
      const sec = document.getElementById('vagas');
      /* offsetTop é relativo ao offsetParent e mente dentro de
         ancestrais posicionados. O topo absoluto é o rect + scrollY. */
      const topo = sec.getBoundingClientRect().top + window.scrollY;
      const util = sec.offsetHeight - window.innerHeight;
      /* O site tem `scroll-behavior: smooth`. Sem desligar, scrollTo
         anima e a medição pega a página no meio do caminho: foi assim
         que este script mentiu na primeira versão. */
      document.documentElement.style.scrollBehavior = 'auto';
      window.scrollTo({ top: topo + util * frac, behavior: 'instant' });
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      await new Promise((r) => setTimeout(r, 250));

      const img = sec.querySelector('.sel-cadeiras-quadro');
      const vid = sec.querySelector('video');
      const carga = sec.querySelector('.sel-cadeiras-carga');
      const cx = sec.querySelector('.sel-cadeiras-caixa');
      const num = sec.querySelector('.sel-contador b');
      const barra = sec.querySelector('.sel-cadeiras-trilho i');

      const r = img.getBoundingClientRect();
      const cr = cx.getBoundingClientRect();
      const e = getComputedStyle(img);

      /* elementFromPoint no centro da caixa: diz quem o navegador
         REALMENTE pintou ali, que é a pergunta toda. */
      const meio = document.elementFromPoint(cr.left + cr.width / 2, cr.top + cr.height / 2);

      return {
        rolagem: Math.round(window.scrollY),
        caixaLarg: Math.round(cr.width),
        caixaAlt: Math.round(cr.height),
        caixaTopo: Math.round(cr.top),
        quadro: (img.currentSrc || '').split('/').pop(),
        pintado: img.naturalWidth > 0,
        larg: Math.round(r.width),
        alt: Math.round(r.height),
        opacidade: e.opacity,
        exibe: e.display,
        videoSrc: (vid.currentSrc || '').split('/').pop() || '(nenhum)',
        videoEscondido: vid.hidden,
        videoTempo: vid.currentTime.toFixed(2),
        videoVisivel: getComputedStyle(vid).opacity,
        cargaOpacidade: getComputedStyle(carga).opacity,
        noMeio: meio ? meio.className || meio.tagName : '(nada)',
        contador: num.textContent,
        barra: getComputedStyle(barra).transform,
      };
    }, p);

    vistos.add(m.quadro);
    linhas++;

    console.log(
      `  ${String(Math.round(p * 100)).padStart(3)}%  quadro ${String(m.quadro).padEnd(20)}` +
        ` ${m.larg}x${m.alt}  op ${m.opacidade}  vagas ${m.contador}  y ${m.rolagem}`,
    );
    console.log(
      `        video ${String(m.videoSrc).padEnd(22)} op ${m.videoVisivel}` +
        `  t ${m.videoTempo}s  carga op ${m.cargaOpacidade}  no meio: ${m.noMeio}`,
    );

    if (!m.pintado) {
      console.log('        FALHA: a imagem do quadro não carregou (naturalWidth 0)');
      problemas++;
    }
    /* A imagem tem que cobrir A CAIXA, que no computador é uma coluna
       da grade e não a tela inteira. */
    if (Math.abs(m.larg - m.caixaLarg) > 2 || Math.abs(m.alt - m.caixaAlt) > 2) {
      console.log(
        `        FALHA: a imagem (${m.larg}x${m.alt}) não cobre a caixa (${m.caixaLarg}x${m.caixaAlt})`,
      );
      problemas++;
    }
    if (m.caixaTopo > t.h || m.caixaTopo + m.caixaAlt < 0) {
      console.log(`        FALHA: a caixa está fora da tela (topo ${m.caixaTopo})`);
      problemas++;
    }
    if (Number(m.cargaOpacidade) > 0.01) {
      console.log('        FALHA: a tela de carga ainda está por cima');
      problemas++;
    }
    if (!t.esperaVideo && m.videoSrc !== '(nenhum)') {
      console.log(`        FALHA: o celular baixou o vídeo (${m.videoSrc})`);
      problemas++;
    }
    if (!t.esperaVideo && !m.videoEscondido) {
      console.log('        FALHA: o elemento de vídeo continua por cima da cena');
      problemas++;
    }
    if (t.esperaVideo) tempos.add(m.videoTempo);
  }

  /* No computador quem acende a rua é a busca no vídeo. Um currentTime
     parado é a mesma falha que um quadro parado no celular. */
  if (t.esperaVideo && tempos.size < 4) {
    console.log(`  FALHA: o vídeo ficou em ${tempos.size} tempo(s) ao longo da rolagem.`);
    problemas++;
  } else if (t.esperaVideo) {
    console.log(`  ok: o vídeo buscou ${tempos.size} tempos diferentes.`);
  }

  if (!t.esperaVideo && vistos.size < 4) {
    console.log(`  FALHA: só ${vistos.size} quadro(s) diferentes em ${linhas} posições.`);
    console.log('        A rua não acende: a sequência não está trocando com a rolagem.');
    problemas++;
  } else if (!t.esperaVideo) {
    console.log(`  ok: ${vistos.size} quadros diferentes ao longo da rolagem.`);
  }

  await pag.close();
}

await navegador.close();

console.log('');
if (problemas > 0) {
  console.log(`${problemas} problema(s). A cena não está de pé.`);
  process.exit(1);
}
console.log('Nenhum problema. A rua acende nas três telas.');
