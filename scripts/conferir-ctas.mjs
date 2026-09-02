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

  /* Travessao no meio da frase e a marca registrada de texto de IA.
     A regra vale para o site inteiro, e o unico jeito de ela nao voltar
     e alguem medir. */
  const travessoes = await p.evaluate(
    () => (document.body.innerText.match(/ — /g) ?? []).length,
  );
  if (travessoes > 0) {
    console.log(`  FALHA  ${rota} tem ${travessoes} travessao(oes) no meio de frase`);
    falhas++;
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

/*
  A passagem PELO MENU, que é como as pessoas navegam de verdade.

  `Revelar` vive no layout, que não remonta quando se troca de página
  por link. Com dependência vazia, ele observava só os elementos da
  primeira página carregada: quem entrava pela home e clicava no menu
  chegava numa página com `data-animar` já ligado, escondendo todo
  `.revelar`, e sem observador para revelá-los.

  O conteúdo ficava invisível para sempre. Sem erro no console, sem
  nada quebrado na tela: só espaço vazio abaixo de cada título. Sete
  blocos na página de tráfego, doze em Trabalhos.

  Carga direta funcionava, que é o pior jeito de um defeito se esconder:
  é assim que se testa, e não é assim que se navega.
*/
console.log('\nNavegando pelo menu');
await p.goto(`${APP}/`, { waitUntil: 'networkidle0', timeout: 60000 });
await new Promise((r) => setTimeout(r, 700));

for (const rota of ['/trafego-pago', '/cases', '/servicos', '/sobre']) {
  const clicou = await p.evaluate((c) => {
    const alvo = [...document.querySelectorAll('a')].find((x) => x.getAttribute('href') === c);
    if (!alvo) return false;
    alvo.click();
    return true;
  }, rota);
  if (!clicou) {
    await p.goto(`${APP}${rota}`, { waitUntil: 'networkidle0', timeout: 60000 });
  }
  await new Promise((r) => setTimeout(r, 1400));

  /* Rola a página inteira, porque a revelação depende de o elemento
     entrar na tela. Sem rolar, tudo pareceria invisível e o teste
     mentiria para o outro lado. */
  await p.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 500) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 90));
    }
  });
  /* Espera a revelacao ASSENTAR, em vez de dormir um tempo fixo.

     A transicao dura 700ms e o ultimo bloco revelado pode estar em
     opacidade 0,02 na hora da medicao. Com espera fixa isso dava uma
     falha a cada tres rodadas: barulho que ensina a ignorar o teste, e
     teste ignorado nao protege nada.

     Bloco de verdade preso nunca assenta, entao o limite de 3s abaixo
     ainda pega o defeito que este teste existe para pegar. */
  const vis = await p.evaluate(async () => {
    const t = [...document.querySelectorAll('.revelar')];
    const escondidos = () =>
      t.filter((e) => parseFloat(getComputedStyle(e).opacity) < 0.05).length;
    const limite = Date.now() + 3000;
    while (escondidos() > 0 && Date.now() < limite) {
      await new Promise((r) => setTimeout(r, 100));
    }

    /* Se ainda sobrou algum escondido, leva ele ate a tela antes de
       desistir.

       Com cache frio a pagina CRESCE durante a varredura: as imagens
       chegam, o layout empurra tudo para baixo, e um bloco que a
       varredura ja passou volta para fora da tela sem nunca ter
       intersectado. Aconteceu na primeira visita a producao, e nas tres
       seguintes nao aconteceu mais. E defeito da medicao, nao da
       pagina: uma pessoa rolando ate la veria o bloco.

       Bloco de verdade preso continua falhando, porque este passo
       coloca ele na tela de proposito e ele mesmo assim nao aparece. */
    for (const e of t) {
      if (parseFloat(getComputedStyle(e).opacity) >= 0.05) continue;
      e.scrollIntoView({ block: 'center' });
      const ate = Date.now() + 1500;
      while (parseFloat(getComputedStyle(e).opacity) < 0.05 && Date.now() < ate) {
        await new Promise((r) => setTimeout(r, 100));
      }
    }
    return { url: location.pathname, total: t.length, inv: escondidos() };
  });

  if (vis.inv > 0) {
    console.log(`  FALHA  ${vis.url}: ${vis.inv} de ${vis.total} blocos invisíveis depois de rolar`);
    falhas++;
  } else {
    console.log(`  ok     ${vis.url}: ${vis.total} blocos, todos visíveis`);
  }
  await p.evaluate(() => window.scrollTo(0, 0));
}

await nav.close();


console.log(
  falhas === 0
    ? `\nCTAS OK: ${vistos.size} destinos conferidos, nenhum quebrado.\n`
    : `\n${falhas} CTA(S) QUEBRADO(S)\n`,
);
process.exitCode = falhas === 0 ? 0 : 1;
