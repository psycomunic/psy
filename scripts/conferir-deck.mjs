/**
 * Percorre a proposta SLIDE A SLIDE, no telefone.
 *
 *   npm run dev           (noutro terminal)
 *   npm run conferir-deck
 *
 * ============================================================
 * POR QUE MEDIR SLIDE A SLIDE, E NÃO A PÁGINA
 * ============================================================
 * O deck mostra uma tela por vez. Medir a página inteira olha só a
 * primeira e diz que está tudo bem, que foi exatamente o que aconteceu:
 * a medição de largura passava enquanto a tela do serviço tinha 2964
 * pixels de altura e engolia três slides inteiros.
 *
 * O defeito era o `Deck` fatiar a apresentação pelos FILHOS DIRETOS: um
 * fragmento com quatro slides dentro conta como UM filho. Este script
 * conta os slides, e é o que teria pegado aquilo no mesmo dia.
 *
 * ============================================================
 * O QUE ELE COBRA
 * ============================================================
 *   - o número de slides, porque slide que some é slide que ninguém lê;
 *   - conteúdo mais largo que a tela, que cria rolagem lateral
 *     competindo com o gesto de passar de slide;
 *   - slide que rola por dentro SEM avisar. Rolar é permitido; rolar
 *     escondido não é, porque a pessoa desliza para o lado e perde
 *     metade do que estava escrito;
 *   - texto colado em botão, que faz o polegar que ia rolar clicar;
 *   - alvo de toque abaixo de 44px de altura.
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
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
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

/* O caso mais pesado que existe: serviço avulso com complemento, que é
   onde ficam as telas mais altas e a única interação do deck. */
const marca = `deck-${Date.now()}`;
const TELAS = [
  { nome: 'celular pequeno', w: 360, h: 740 },
  { nome: 'celular comum  ', w: 390, h: 844 },
  { nome: 'celular grande ', w: 414, h: 896 },
];

let falhas = 0;
let propostaId = null;
let navegador = null;

const ok = (b, t) => {
  console.log(`  ${b ? 'PASSA' : 'FALHA'}  ${t}`);
  if (!b) falhas++;
};

try {
  const { data, error } = await admin
    .from('proposta')
    .insert({
      slug: marca,
      cliente: `${marca} Carol Abreu Concursos`,
      contato: 'Carol',
      status: 'enviada',
      resumo: 'Proposta de gestão de tráfego pago e criação de conteúdo.',
      corpo: {
        plano: null,
        servicos: [
          { id: 'trafego', fee: 1800 },
          { id: 'social', fee: 2500 },
        ],
        diagnostico: [
          'Campanha rodando sem conversão configurada.',
          'Perfil parado há quatro meses.',
        ],
        proximosPassos: [
          'Aprovação desta proposta.',
          'Acesso às contas de anúncio.',
          'Primeira rodada de criativos.',
        ],
      },
      validade_dias: 15,
    })
    .select('id')
    .single();
  if (error) throw new Error(`não criou a proposta: ${error.message}`);
  propostaId = data.id;

  navegador = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });

  for (const tela of TELAS) {
    console.log(`\n${tela.nome}  ${tela.w}x${tela.h}`);

    const pagina = await navegador.newPage();
    await pagina.setViewport({
      width: tela.w,
      height: tela.h,
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    });
    await pagina.goto(`${APP}/proposta/${marca}`, {
      waitUntil: 'networkidle0',
      timeout: 60000,
    });
    await new Promise((r) => setTimeout(r, 800));

    const total = await pagina.evaluate(
      () => document.querySelector('.deck-trilho')?.children.length ?? 0,
    );

    /*
      Dez telas: capa, diagnóstico, marcas, os dois serviços, a conta,
      o que vale sempre, como funciona, próximos passos e o fecho.

      O número exato importa. Quando os slides de serviço foram
      devolvidos como fragmento, este número caiu para sete e ninguém
      teria percebido sem contá-lo.
    */
    ok(total === 10, `são 10 slides (são ${total})`);

    let semAviso = [];
    let colados = [];
    let pequenos = [];
    let largos = [];

    for (let i = 0; i < total; i++) {
      await pagina.evaluate((idx) => {
        const t = document.querySelector('.deck-trilho');
        t.scrollTo({ left: idx * t.clientWidth, behavior: 'instant' });
      }, i);
      await new Promise((r) => setTimeout(r, 260));

      const m = await pagina.evaluate((idx) => {
        const t = document.querySelector('.deck-trilho');
        const sec = t.children[idx];
        const titulo = (sec.querySelector('h1,h2')?.textContent ?? '').trim().slice(0, 30);

        const rolaPorDentro = sec.scrollHeight > sec.clientHeight + 8;
        const avisa = sec.hasAttribute('data-tem-mais');

        const estoura = [...sec.querySelectorAll('*')].some((el) => {
          const r = el.getBoundingClientRect();
          if (r.width <= window.innerWidth + 1) return false;
          let no = el;
          while (no && no !== sec) {
            const e = getComputedStyle(no);
            if (e.position === 'fixed') return false;
            if (no !== el && /auto|scroll|hidden|clip/.test(e.overflowX)) return false;
            no = no.parentElement;
          }
          return true;
        });

        /* Texto logo acima de um botão, com menos de 24px de folga. */
        const perto = [];
        for (const b of sec.querySelectorAll('a,button')) {
          const rb = b.getBoundingClientRect();
          if (rb.height < 20 || rb.width < 40) continue;
          for (const tx of sec.querySelectorAll('p,h1,h2,h3')) {
            if (b.contains(tx) || tx.contains(b)) continue;
            const rt = tx.getBoundingClientRect();
            if (rt.height === 0 || !(tx.textContent ?? '').trim()) continue;
            if (!(rt.left < rb.right && rt.right > rb.left)) continue;
            const gap = rb.top - rt.bottom;
            if (gap >= 0 && gap < 24) {
              perto.push(`"${(tx.textContent ?? '').trim().slice(0, 24)}" a ${Math.round(gap)}px`);
            }
          }
        }

        /* Alvo de toque: vale o RÓTULO, que é a área que o dedo acerta,
           e não o quadradinho do checkbox dentro dele. */
        const alvos = [...sec.querySelectorAll('a,button,label')]
          .filter((e) => {
            const r = e.getBoundingClientRect();
            return r.height > 4 && r.width > 40 && r.height < 44;
          })
          .map((e) => `${(e.textContent ?? '').trim().slice(0, 18)} (${Math.round(e.getBoundingClientRect().height)}px)`);

        return { titulo, rolaPorDentro, avisa, estoura, perto, alvos };
      }, i);

      if (m.estoura) largos.push(`${i}: ${m.titulo}`);
      if (m.rolaPorDentro && !m.avisa) semAviso.push(`${i}: ${m.titulo}`);
      if (m.perto.length) colados.push(`${i}: ${m.titulo} → ${m.perto[0]}`);
      if (m.alvos.length) pequenos.push(`${i}: ${m.alvos[0]}`);
    }

    ok(largos.length === 0, `nenhum slide mais largo que a tela${largos.length ? ` (${largos[0]})` : ''}`);
    ok(
      semAviso.length === 0,
      `todo slide que rola por dentro avisa${semAviso.length ? ` (falta em ${semAviso.join(', ')})` : ''}`,
    );
    ok(
      colados.length === 0,
      `nenhum texto colado em botão${colados.length ? ` (${colados[0]})` : ''}`,
    );
    ok(
      pequenos.length === 0,
      `nenhum alvo de toque abaixo de 44px${pequenos.length ? ` (${pequenos[0]})` : ''}`,
    );

    /* A única interação do deck tem de funcionar com o dedo, e longe do
       quadradinho: quem toca acerta o nome do serviço, não o checkbox. */
    await pagina.evaluate(() => {
      const t = document.querySelector('.deck-trilho');
      const i = [...t.children].findIndex((s) => (s.textContent ?? '').includes('Somando'));
      t.scrollTo({ left: i * t.clientWidth, behavior: 'instant' });
    });
    await new Promise((r) => setTimeout(r, 400));

    const totalDe = () =>
      pagina.evaluate(() => {
        const m = document.body.innerText.match(/Total por m[êe]s\s*R\$\s?([\d.]+)/);
        return m ? m[1] : null;
      });

    const antes = await totalDe();
    const ponto = await pagina.evaluate(() => {
      const lab = [...document.querySelectorAll('label')].find((l) =>
        (l.textContent ?? '').includes('opcional'),
      );
      if (!lab) return null;
      const r = lab.getBoundingClientRect();
      return { x: Math.round(r.right - 40), y: Math.round(r.top + 16) };
    });

    if (ponto) {
      await pagina.mouse.click(ponto.x, ponto.y);
      await new Promise((r) => setTimeout(r, 400));
    }
    const depois = await totalDe();

    ok(antes === '1.800', `o total abre sem o opcional (${antes})`);
    ok(
      depois === '4.300',
      `e tocar no rótulo, longe do quadradinho, soma o complemento (${depois})`,
    );

    await pagina.close();
  }
} catch (e) {
  console.error(`\nErro: ${e.message}`);
  falhas++;
} finally {
  if (navegador) await navegador.close().catch(() => {});
  if (propostaId) {
    const { error } = await admin.from('proposta').delete().eq('id', propostaId);
    if (error) {
      console.error(`  NÃO REMOVEU a proposta de teste: ${error.message}`);
      falhas++;
    } else {
      console.log('\nProposta de teste removida.');
    }
  }
}

console.log(falhas === 0 ? '\nDECK OK\n' : `\n${falhas} FALHA(S) NO DECK\n`);
process.exitCode = falhas === 0 ? 0 : 1;
