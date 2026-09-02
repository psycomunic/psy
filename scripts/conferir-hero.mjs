/**
 * A abertura da home tem uma troca embutida, e este script mede os
 * dois lados dela.
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

/*
  MUDANCA media por pixel, de 0 a 255, entre a area com a luz longe e a
  mesma area com a luz em cima.

  Media de brilho nao servia: onde o print por baixo e quase preto,
  acender a imagem ESCURECE a area, e o teste reprovava um efeito que
  se ve muito bem. O que "aparecer" quer dizer e a area MUDAR, para
  qualquer lado, e e isso que se mede.
*/
const MUDANCA_MINIMA = 20;
const CONTRASTE_MINIMO = 4.5;

/*
  `holofote` diz se AQUELA largura tem parede a mostra na primeira tela.

  Na home o texto e o painel preenchem a largura do telefone, e o que
  sobra de parede acima deles tem 56px: nao cabe medicao ali, e fingir
  que cabe seria inventar numero. Holofote e afordancia de cursor de
  qualquer jeito.

  O CONTRASTE e medido em toda largura, porque texto ilegivel nao tem
  desculpa de tamanho de tela.
*/
const TELAS = [
  { nome: '1440x900', w: 1440, h: 900, holofote: true },
  { nome: '1280x800', w: 1280, h: 800, holofote: true },
  { nome: '390x844', w: 390, h: 844, holofote: false },
  { nome: '360x740', w: 360, h: 740, holofote: false },
];

/*
  ACHA sozinho onde a parede aparece, em vez de levar coordenadas
  escritas a mao.

  Ponto fixo envelhece com o layout: os que este script usava eram da
  abertura antiga, e na home caem em cima do painel de diagnostico, que
  e opaco. O teste continuaria rodando e mediria um cartao, nao a luz.

  Aqui ele pergunta ao navegador quem esta na frente em cada ponto de
  uma malha. Serve o ponto onde o elemento de cima e a camada de fundo,
  e nao um pedaco de interface. Sem ponto assim, o teste FALHA em vez de
  medir qualquer coisa.
*/
const acharParede = (p) =>
  p.evaluate(() => {
    const h1 = document.querySelector('main h1');
    const secao = h1.closest('section');
    const r = secao.getBoundingClientRect();
    const texto = secao.querySelector('[data-fora-da-luz]');

    /*
      `elementFromPoint` nao serve aqui: a camada de fundo e
      `pointer-events-none`, entao ela nunca e devolvida e a busca nao
      achava ponto nenhum. Quem decide e a geometria.

      Ocupado = o bloco de texto, o painel ao lado dele e a faixa de
      prova. Tudo o mais na secao e fundo.
    */
    /* O bloco de texto leva folga do tamanho do esfumado do recorte,
       porque ali a luz e cortada de proposito. O painel e a faixa de
       prova levam folga minima: sao so conteudo por cima. O painel
       ainda e de vidro, e medido atras dele a luz rende 11% contra 171%
       na margem, entao medir ali seria medir o borrao. */
    const ocupados = [
      [texto, innerWidth >= 1024 ? 70 : 34],
      [texto?.nextElementSibling, 8],
      [secao.querySelector('dl'), 8],
    ]
      .filter(([e]) => e)
      .map(([e, folga]) => ({ r: e.getBoundingClientRect(), folga }));

    /* `meio` e metade da caixa que sera fotografada, e a caixa INTEIRA
       precisa estar livre, nao so o centro.

       Validar o centro deu um ponto com metade atras do painel de
       vidro, e ali a luz rende 11%: o teste reprovou a home com -15% e
       o defeito era dele. */
    const meio = 48;
    const candidatos = [];
    for (let y = Math.max(meio, r.top + meio); y < Math.min(innerHeight, r.bottom) - meio; y += 16) {
      for (let x = meio; x < innerWidth - meio; x += 16) {
        const colide = ocupados.some(
          ({ r: o, folga }) =>
            x + meio > o.left - folga &&
            x - meio < o.right + folga &&
            y + meio > o.top - folga &&
            y - meio < o.bottom + folga,
        );
        if (colide) continue;
        const dist = Math.hypot(x - innerWidth / 2, y - (r.top + r.bottom) / 2);
        candidatos.push({ x, y, dist });
      }
    }

    /* Vários pontos ESPALHADOS, e não o mais central.

       Um ponto só é sorteio: em 1440 o mais central caiu sobre o topo
       quase preto de um dos prints, mediu 10 de 255 e reprovou uma
       abertura que muda 164 de 255 dez centímetros ao lado. Qual print
       cai em cada quadrado ninguém escolhe.

       O que a página promete é que a luz muda a parede onde ela passa,
       não que muda em todo pixel dela. Por isso a cobrança é sobre a
       MEDIANA de uma amostra espalhada: um canto teimoso não reprova, e
       um efeito que não acontece também não passa. */
    candidatos.sort((a, b) => a.dist - b.dist);
    const escolhidos = [];
    for (const c of candidatos) {
      if (escolhidos.length >= 5) break;
      if (escolhidos.every((e) => Math.hypot(e.x - c.x, e.y - c.y) >= 140)) escolhidos.push(c);
    }
    return escolhidos.map(({ x, y }) => ({ x, y }));
  });

const canal = (v) => {
  const n = v / 255;
  return n <= 0.03928 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
};

const fotografar = (p, caixa) => p.screenshot({ clip: caixa, encoding: 'base64' });

/* Quanto os dois quadros diferem, pixel a pixel. */
const diferenca = (p, a, b) =>
  p.evaluate(
    async (d1, d2) => {
      const ler = async (d) => {
        const img = new Image();
        img.src = `data:image/png;base64,${d}`;
        await img.decode();
        const c = document.createElement('canvas');
        c.width = img.width;
        c.height = img.height;
        c.getContext('2d').drawImage(img, 0, 0);
        return c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      };
      const [x, y] = [await ler(d1), await ler(d2)];
      let soma = 0;
      let n = 0;
      for (let i = 0; i < x.length; i += 4) {
        soma += (Math.abs(x[i] - y[i]) + Math.abs(x[i + 1] - y[i + 1]) + Math.abs(x[i + 2] - y[i + 2])) / 3;
        n++;
      }
      return +(soma / n).toFixed(1);
    },
    a,
    b,
  );

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
  /* Sem cache, de propósito: o defeito de imagem `lazy` na camada
     escondida só aparece na primeira visita, e com cache quente o teste
     passava enquanto produção reprovava. */
  await p.setCacheEnabled(false);
  await p.goto(`${APP}/`, { waitUntil: 'networkidle0', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 1500));

  const pontos = t.holofote ? await acharParede(p) : null;
  if (t.holofote && (!pontos || pontos.length === 0)) {
    console.log(`  FALHA  ${t.nome}: nao achei parede a mostra fora do bloco de texto`);
    falhas++;
    await p.close();
    continue;
  }
  if (pontos) {
    const mudancas = [];
    for (const ponto of pontos) {
      const caixa = { x: ponto.x - 48, y: ponto.y - 48, width: 96, height: 96 };

      await p.mouse.move(4, 4);
      await new Promise((r) => setTimeout(r, 350));
      const apagado = await fotografar(p, caixa);

      await p.mouse.move(ponto.x, ponto.y);
      await new Promise((r) => setTimeout(r, 350));
      const aceso = await fotografar(p, caixa);

      mudancas.push(await diferenca(p, apagado, aceso));
    }

    const ordem = [...mudancas].sort((a, b) => a - b);
    const mediana = ordem[Math.floor(ordem.length / 2)];
    const bom = mediana >= MUDANCA_MINIMA;
    if (!bom) falhas++;
    console.log(
      `  ${bom ? 'ok    ' : 'FALHA '} ${t.nome} holofote em ${mudancas.length} pontos: muda ${ordem[0]} a ${ordem[ordem.length - 1]} de 255, mediana ${mediana} (minimo ${MUDANCA_MINIMA})`,
    );
  } else {
    console.log(`  -      ${t.nome} sem parede a mostra na primeira tela, holofote nao medido`);
  }

  /* Agora o preco: luz parada em cima do titulo, interface escondida. */
  const cx = await p.evaluate(() => {
    const h1 = document.querySelector('main h1');
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
    const h1 = document.querySelector('main h1');
    const secao = h1.closest('section');
    /* Esconde TODO filho da seção menos a camada de fundo. Sem isso a
       foto sai com as próprias letras brancas dentro, a média sobe e o
       teste reprova sozinho com 1,00:1. Já aconteceu: um `>` perdido no
       seletor. */
    const fundo = secao.querySelector('[aria-hidden]');
    let achou = false;
    for (const filho of secao.children) {
      if (filho === fundo) continue;
      filho.style.visibility = 'hidden';
      achou = true;
    }
    return achou && !fundo.contains(h1);
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
