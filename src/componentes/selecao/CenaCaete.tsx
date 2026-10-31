'use client';

import { useEffect, useRef } from 'react';
import { selecao } from '@/conteudo/selecao-braganca';

/**
 * A noite no Caeté: a abertura da apresentação "10 empresas".
 *
 * ============================================================
 * DE ONDE VEM
 * ============================================================
 * É a mecânica do design system Kage, sem WebGL: recortes com fundo
 * transparente pendurados em profundidades diferentes dentro de um
 * palco com `perspective`, e uma câmera (o `.sel-mundo`) que anda para
 * dentro conforme a rolagem. No lugar do templo japonês, o rio Caeté à
 * noite com a igreja e a lua magenta; no lugar dos pinheiros e do
 * capim, mangue, açaizeiro, aninga e um galho de mangueira que vai
 * BAIXANDO do alto. Os guarás fazem o papel das folhas vermelhas.
 *
 * Imagens geradas no Google Flow (Nano Banana) e recortadas com rembg.
 *
 * ============================================================
 * POR QUE CSS 3D E NÃO THREE.JS
 * ============================================================
 * O Kage roda um three.js de 600 KB e 150 KB de cena procedural. Quem
 * abre esta página vem de um link no WhatsApp, no celular, no 4G de
 * Bragança. Planos com `translate3d` dão a mesma paralaxe de verdade
 * (a perspectiva é do navegador, não imitada) a custo zero de script.
 *
 * ============================================================
 * O QUE ANDA COM A ROLAGEM
 * ============================================================
 * - A câmera (translateZ do mundo) e o leve zoom do fundo.
 * - Cada recorte some quando a câmera chega nele (a "cortina" do Kage).
 * - O galho de mangueira desce do topo.
 * - O texto do herói troca de camada no meio do caminho.
 * - DETALHE TEMÁTICO: a travessia do Caeté em porcentagem, que já
 *   aparece na tela de carregamento e continua no rodapé do herói.
 *
 * Armadilhas (mesmas do HeroCinema): nada de overflow:hidden em
 * ancestral (mata o sticky); com document.hidden aplica direto, sem
 * requestAnimationFrame; reduced-motion não colapsa a altura, só
 * congela a câmera num ponto bonito.
 */

const P = 1000; /* perspective do palco, em px. Igual ao CSS. */
const ORIGEM_Y = 0.42; /* perspective-origin vertical. Igual ao CSS. */

type Camada = {
  id: string;
  src?: string;
  /** Proporção altura/largura da imagem. */
  prop: number;
  z: number;
  /** Centro na tela, com a câmera parada (fração da viewport). */
  cx: number;
  cy: number;
  /** Largura na tela com a câmera parada (fração da largura). */
  w: number;
  espelho?: boolean;
  /** Quanto desce durante o herói, em fração da altura. */
  desce?: number;
  classe?: string;
  giro?: number;
  balanco?: number;
};

const CAMADAS: Camada[] = [
  { id: 'palavra', prop: 0.2, z: -1700, cx: 0.5, cy: 0.7, w: 0.98 },
  { id: 'guaras', src: '/selecao/guaras.webp', prop: 617 / 1800, z: -1350, cx: 0.66, cy: 0.2, w: 0.36, classe: 'sel-voo' },
  { id: 'mangue', src: '/selecao/mangue.webp', prop: 1319 / 1942, z: -1050, cx: 0.17, cy: 0.66, w: 0.5, classe: 'sel-balanca', giro: 0.4, balanco: 9 },
  { id: 'mangue-2', src: '/selecao/mangue.webp', prop: 1319 / 1942, z: -820, cx: 0.9, cy: 0.72, w: 0.44, espelho: true, classe: 'sel-balanca', giro: 0.5, balanco: 11 },
  { id: 'acai', src: '/selecao/acaizeiro.webp', prop: 2593 / 1418, z: -620, cx: 0.77, cy: 0.66, w: 0.27, classe: 'sel-balanca', giro: 0.8, balanco: 7 },
  { id: 'acai-2', src: '/selecao/acaizeiro.webp', prop: 2593 / 1418, z: -430, cx: 0.06, cy: 0.62, w: 0.24, espelho: true, classe: 'sel-balanca', giro: 1, balanco: 8 },
  { id: 'capim', src: '/selecao/capim-aninga.webp', prop: 862 / 2400, z: -320, cx: 0.5, cy: 0.96, w: 1.25, classe: 'sel-balanca', giro: 0.35, balanco: 6 },
  { id: 'galho', src: '/selecao/galho-mangueira.webp', prop: 1460 / 2065, z: -190, cx: 0.17, cy: -0.02, w: 0.62, desce: 0.2, classe: 'sel-balanca sel-balanca--cima', giro: 1.2, balanco: 6.5 },
  { id: 'capim-perto', src: '/selecao/capim-aninga.webp', prop: 862 / 2400, z: -70, cx: 0.3, cy: 1.04, w: 1.5, espelho: true, classe: 'sel-balanca', giro: 0.5, balanco: 5 },
];

const sat = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const suave = (a: number, b: number, x: number) => {
  const t = sat((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const janela = (p: number, a: number, b: number, r = 0.08) =>
  p <= a || p >= b ? 0 : Math.min(1, (p - a) / r, (b - p) / r);

export function CenaCaete() {
  const h = selecao.heroi;
  const fundo = useRef<HTMLDivElement>(null);
  const mundo = useRef<HTMLDivElement>(null);
  const veu = useRef<HTMLDivElement>(null);
  const carga = useRef<HTMLDivElement>(null);
  const cargaNum = useRef<HTMLElement>(null);
  const heroi = useRef<HTMLElement>(null);
  const texto1 = useRef<HTMLDivElement>(null);
  const texto2 = useRef<HTMLDivElement>(null);
  const dica = useRef<HTMLDivElement>(null);
  const travessia = useRef<HTMLSpanElement>(null);
  const palavra = useRef<HTMLDivElement>(null);
  const elementos = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const menos = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let vw = window.innerWidth;
    let vh = window.innerHeight;
    let alvoP = 0;
    let suaveP = 0;
    let alvoP2 = 0;
    let mx = 0;
    let my = 0;
    let rodando = true;
    let quadro = 0;

    /* Celular em pé: a cena foi composta em 16:9. Num quadro alto, as
       camadas precisam ficar mais largas para não sobrar céu vazio. */
    const fator = () => (vw / vh < 1 ? 1.9 : vw / vh < 1.4 ? 1.35 : 1);

    function posicionar() {
      vw = window.innerWidth;
      vh = window.innerHeight;
      const f = fator();
      for (const c of CAMADAS) {
        const el = elementos.current[c.id];
        if (!el) continue;
        const k = (P - c.z) / P;
        const w = c.w * vw * k * (c.id === 'palavra' ? Math.min(f, 1.15) : f);
        const altura = w * c.prop;
        const sx = vw * 0.5 + (c.cx - 0.5) * vw * (c.id === 'palavra' ? 1 : Math.min(f, 1.25));
        const sy = vh * (c.id === 'palavra' && vw / vh < 1 ? 0.8 : c.cy);
        const X = vw * 0.5 + (sx - vw * 0.5) * k;
        const Y = vh * ORIGEM_Y + (sy - vh * ORIGEM_Y) * k;
        el.style.width = `${w}px`;
        el.dataset.x = String(X - w / 2);
        el.dataset.y = String(Y - altura / 2);
        el.dataset.z = String(c.z);
      }
      /* A palavra ocupa a largura inteira da tela, como o KAGE. */
      const pal = palavra.current;
      const caixa = elementos.current.palavra;
      if (pal && caixa) {
        pal.style.fontSize = '100px';
        const medida = pal.scrollWidth || 1;
        pal.style.fontSize = `${(100 * parseFloat(caixa.style.width)) / medida}px`;
      }
    }

    function lerRolagem() {
      const el = heroi.current;
      if (!el) return;
      const util = Math.max(1, el.offsetHeight - vh);
      alvoP = sat(window.scrollY / util);
      const resto = Math.max(1, document.documentElement.scrollHeight - vh - util);
      alvoP2 = sat((window.scrollY - util) / resto);
    }

    function aplicar(p: number) {
      const cam = menos ? 420 : p * 1150 + alvoP2 * 380;
      const camY = (menos ? 0.3 : p) * vh * 0.1;
      const rotY = menos ? 0 : mx * 1.4;
      const rotX = menos ? 0 : -my * 0.9;
      if (mundo.current) {
        mundo.current.style.transform = `translate3d(0, ${camY}px, ${cam}px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
      }
      if (fundo.current) {
        const s = 1 + (menos ? 0.04 : p * 0.1 + alvoP2 * 0.05);
        fundo.current.style.transform = `translate3d(${-mx * 10}px, ${-p * vh * 0.03 - my * 6}px, 0) scale(${s})`;
      }
      for (const c of CAMADAS) {
        const el = elementos.current[c.id];
        if (!el) continue;
        const x = Number(el.dataset.x || 0);
        const y = Number(el.dataset.y || 0) + (c.desce ? (menos ? 0.6 : p) * c.desce * vh : 0);
        const dist = P - (c.z + cam);
        /* A palavra não é atravessada: ela sai de cena quando a
           segunda camada de texto entra, para as duas não brigarem. */
        const a = c.id === 'palavra' ? 1 - suave(0.32, 0.62, menos ? 0 : p) : suave(110, 420, dist);
        el.style.opacity = String(a);
        el.style.visibility = a < 0.01 ? 'hidden' : 'visible';
        el.style.transform = `translate3d(${x}px, ${y}px, ${c.z}px)${c.espelho ? ' scaleX(-1)' : ''}`;
      }
      if (veu.current) veu.current.style.opacity = String(suave(0.05, 0.4, alvoP2) * 0.28);
      if (texto1.current) {
        const o = 1 - suave(0.18, 0.4, p);
        texto1.current.style.opacity = String(o);
        texto1.current.style.transform = `translateY(${-p * 60}px)`;
        texto1.current.style.visibility = o < 0.01 ? 'hidden' : 'visible';
      }
      if (texto2.current) {
        const o = janela(p, 0.52, 1.2, 0.14);
        texto2.current.style.opacity = String(o);
        texto2.current.style.transform = `translateY(${(1 - o) * 30}px)`;
      }
      if (dica.current) dica.current.style.setProperty('--p', String(p));
      if (travessia.current) travessia.current.textContent = String(Math.round(p * 100)).padStart(2, '0');
    }

    function laco() {
      if (!rodando) return;
      suaveP += (alvoP - suaveP) * 0.12;
      if (Math.abs(alvoP - suaveP) < 0.0004) suaveP = alvoP;
      aplicar(suaveP);
      quadro = requestAnimationFrame(laco);
    }

    const aoRolar = () => {
      lerRolagem();
      if (document.hidden) {
        suaveP = alvoP;
        aplicar(suaveP);
      }
    };
    const aoMudar = () => {
      posicionar();
      lerRolagem();
      aplicar(suaveP);
    };
    const aoMover = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      mx = e.clientX / vw - 0.5;
      my = e.clientY / vh - 0.5;
    };

    /* ---- tela de carregamento: a travessia começa em 00% ---- */
    const fontes = CAMADAS.filter((c) => c.src).map((c) => c.src as string);
    const unicas = Array.from(new Set([...fontes, '/selecao/fundo-caete.webp']));
    let prontas = 0;
    let liberado = false;
    const liberar = () => {
      if (liberado) return;
      liberado = true;
      carga.current?.classList.add('is-fim');
      window.setTimeout(() => palavra.current?.classList.add('is-subiu'), 350);
    };
    unicas.forEach((src) => {
      const img = new Image();
      img.onload = img.onerror = () => {
        prontas += 1;
        const q = prontas / unicas.length;
        carga.current?.style.setProperty('--p', String(q));
        if (cargaNum.current) cargaNum.current.textContent = `${String(Math.round(q * 100)).padStart(2, '0')}%`;
        if (prontas === unicas.length) window.setTimeout(liberar, 250);
      };
      img.src = src;
    });
    const reserva = window.setTimeout(liberar, 7000);

    posicionar();
    lerRolagem();
    suaveP = alvoP;
    aplicar(suaveP);
    document.fonts?.ready.then(() => {
      posicionar();
      aplicar(suaveP);
    });

    window.addEventListener('scroll', aoRolar, { passive: true });
    window.addEventListener('resize', aoMudar);
    window.addEventListener('pointermove', aoMover, { passive: true });
    quadro = requestAnimationFrame(laco);

    return () => {
      rodando = false;
      cancelAnimationFrame(quadro);
      window.clearTimeout(reserva);
      window.removeEventListener('scroll', aoRolar);
      window.removeEventListener('resize', aoMudar);
      window.removeEventListener('pointermove', aoMover);
    };
  }, []);

  return (
    <>
      <div className="sel-carga" ref={carga} aria-hidden="true">
        <div>
          <small>Atravessando o Caeté</small>
          <strong ref={cargaNum}>00%</strong>
          <i />
        </div>
      </div>

      <div className="sel-palco" aria-hidden="true">
        <div
          className="sel-fundo"
          ref={fundo}
          style={{ backgroundImage: "url('/selecao/fundo-caete.webp')" }}
        />
        <div className="sel-mundo" ref={mundo}>
          {CAMADAS.map((c) => (
            <div
              key={c.id}
              className="sel-camada"
              ref={(el) => {
                elementos.current[c.id] = el;
              }}
              style={{ left: 0, top: 0 }}
            >
              {c.id === 'palavra' ? (
                <div className="sel-palavra" ref={palavra}>
                  {'BRAGANÇA'.split('').map((l, i) => (
                    <span key={i} style={{ transitionDelay: `${i * 70}ms` }}>
                      {l}
                    </span>
                  ))}
                </div>
              ) : (
                <div
                  className={c.classe}
                  style={
                    {
                      '--giro': `${c.giro ?? 1}deg`,
                      '--balanco': `${c.balanco ?? 7}s`,
                    } as React.CSSProperties
                  }
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.src} alt="" decoding="async" draggable={false} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="sel-vinheta" />
      <div className="sel-veu" ref={veu} />
      <div className="sel-grao" />

      <section className="sel-heroi" ref={heroi} id="topo" aria-labelledby="sel-h1">
        <div className="sel-heroi-fixo">
          <div className="sel-heroi-texto" ref={texto1}>
            <span className="sel-rotulo">{h.rotulo}</span>
            <h1 id="sel-h1">
              {h.linhas.map((l) => (
                <span key={l}>{l}</span>
              ))}
              <em>{h.destaque}</em>
            </h1>
            <p>{h.texto}</p>
            <a href="#inscricao" className="sel-botao" data-sel-abrir>
              {h.acao}
              <Seta />
            </a>
          </div>

          <div className="sel-heroi-dois" ref={texto2}>
            <h2>
              Bragança e região.
              <br />
              Só 10 vagas.
            </h2>
            <p>A Psy Comunic chegou ao Pará e vai começar pelas empresas daqui.</p>
          </div>

          <div className="sel-vertical">
            {h.vertical}
            <small>Bragança · Pará</small>
          </div>

          <div className="sel-capitulos">
            <div className="sel-dica" ref={dica}>
              <span>
                <span ref={travessia}>00</span>% · {h.dica}
              </span>
              <i />
            </div>
            <ol>
              {h.capitulos.map((c, i) => (
                <li key={c}>
                  <b>{String(i + 1).padStart(2, '0')}</b>
                  <small>{c}</small>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>
    </>
  );
}

export function Seta() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
