'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { BotaoZap } from './BotaoZap';
import type { Unidade } from '@/conteudo/braganca';

/**
 * Hero Scroll Cinema da unidade local: o mangue, e a cidade acesa.
 *
 * ============================================================
 * A JORNADA
 * ============================================================
 * Começa no chão do manguezal, à noite, entre as raízes e a névoa.
 * A câmera sobe em linha reta, atravessa a copa e sai por cima das
 * árvores: do outro lado do rio, Bragança acesa, com as luzes
 * refletidas na água e um brilho magenta no horizonte. É a promessa da
 * página sem dizer a palavra: a empresa que hoje está no escuro
 * aparecendo para a cidade inteira.
 *
 * Tudo comandado pela rolagem: desce, a câmera sobe; volta, ela desce.
 *
 * ============================================================
 * O QUE ANDA COM O MESMO PROGRESSO
 * ============================================================
 * - O vídeo (currentTime).
 * - Duas camadas de texto: a pergunta no chão, a resposta lá em cima.
 *   Aqui não tem decodificação de glifo: isso é o visor do astronauta,
 *   e num mangue não faz sentido. É fade com leve subida.
 * - O DETALHE TEMÁTICO: o contador de cidades no alcance, que vai de
 *   00 até o total das cidades atendidas conforme a câmera sobe, e a
 *   altura em metros. Fala do negócio (alcance regional), não é enfeite.
 * - A barra lateral.
 *
 * ============================================================
 * MESMAS ARMADILHAS DO HeroCinema, MESMAS DEFESAS (não regridam)
 * ============================================================
 * - `public/video/<slug>.mp4` tem TODO quadro como keyframe (x264 keyint=1). Sem
 *   isso o scroll engasga. Receita em ARQUITETURA.md.
 * - Lê video.readyState no bind, além de escutar loadedmetadata.
 * - document.hidden: painel oculto não entrega requestAnimationFrame.
 * - prefers-reduced-motion NÃO colapsa a altura (o CSS reduz a 100vh e
 *   mostra o quadro final com a camada completa).
 * - Tela de carregamento obrigatória, solta no canplaythrough, com
 *   fallback de 6 s.
 * - O `id="lancamento"` é o que o cabeçalho procura para ficar
 *   transparente durante a cena inteira. Não renomeie.
 * - Nenhum ancestral com overflow:hidden (mata o sticky). É clip.
 */

/* Janela de opacidade: 0 fora de [a, b], 1 no miolo, rampa nas pontas. */
function janela(p: number, a: number, b: number, rampa = 0.08) {
  if (p <= a || p >= b) return 0;
  return Math.min(1, (p - a) / rampa, (b - p) / rampa);
}

const CAMADAS: [number, number][] = [
  [-0.2, 0.44],
  [0.52, 1.2],
];

/* Altura aproximada da copa do mangue, em metros: o número que o
   contador de altura alcança quando a câmera sai por cima. */
const ALTURA_COPA = 32;

export function HeroCinemaLocal({ u }: { u: Unidade }) {
  const secao = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const loader = useRef<HTMLDivElement>(null);
  const palco = useRef<HTMLDivElement>(null);
  const camadas = useRef<(HTMLDivElement | null)[]>([]);
  const cidades = useRef<HTMLSpanElement>(null);
  const altura = useRef<HTMLSpanElement>(null);
  const barra = useRef<HTMLSpanElement>(null);
  const dica = useRef<HTMLDivElement>(null);

  const totalCidades = u.cidades.length;

  useEffect(() => {
    if (!secao.current || !video.current || !loader.current || !palco.current) return;
    const hero: HTMLElement = secao.current;
    const v: HTMLVideoElement = video.current;
    const l: HTMLDivElement = loader.current;

    const menosMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const toque = window.matchMedia('(hover: none)').matches;

    let duration = 0;
    let ready = false;
    let target = menosMovimento ? 1 : 0;
    let ticking = false;
    let avisou = false;

    function apply() {
      ticking = false;
      const p = target;

      if (duration && !menosMovimento) v.currentTime = p * duration;

      camadas.current.forEach((el, i) => {
        if (!el) return;
        const [a, b] = CAMADAS[i];
        const vis = menosMovimento ? (i === 1 ? 1 : 0) : janela(p, a, b);
        el.style.opacity = String(vis);
        el.style.pointerEvents = vis > 0.5 ? 'auto' : 'none';
        el.setAttribute('aria-hidden', vis > 0.5 ? 'false' : 'true');
        /* A camada de baixo afunda ao sair; a de cima sobe ao entrar.
           Mesmo sentido da câmera. */
        const desloca = menosMovimento ? 0 : (1 - vis) * (i === 0 ? 18 : -18);
        el.style.transform = `translate3d(0, ${desloca.toFixed(1)}px, 0)`;
      });

      /* O detalhe temático: as cidades entram no alcance conforme a
         câmera sobe. Curva suave para as últimas chegarem no fim. */
      if (cidades.current) {
        const n = Math.round(Math.pow(p, 1.25) * totalCidades);
        cidades.current.textContent = `${String(n).padStart(2, '0')}/${String(totalCidades).padStart(2, '0')}`;
      }
      if (altura.current) {
        altura.current.textContent = String(Math.round(Math.pow(p, 1.4) * ALTURA_COPA)).padStart(2, '0');
      }
      if (barra.current) barra.current.style.transform = `scaleY(${p})`;
      if (dica.current) dica.current.style.opacity = String(p < 0.03 ? 1 : 0);

      /*
        AVISA QUE A CENA ACABOU.

        Quem escuta é o `PopupApresentacao`. O aviso sai uma vez só: o
        fim da cena é um ponto de rolagem, e a pessoa passa por ele toda
        vez que sobe e desce a página. Sem esta trava, o evento
        dispararia em rajada a cada quadro acima do limite.

        0.985 e não 1: com rolagem suave e arredondamento de subpixel, o
        progresso encosta em 0,99 e raramente fecha em 1 exato. Esperar
        pelo 1 deixaria o popup sem abrir em parte dos aparelhos.
      */
      if (!avisou && p >= 0.985) {
        avisou = true;
        window.dispatchEvent(new CustomEvent('cena-terminou'));
      }
    }

    function onScroll() {
      const rect = hero.getBoundingClientRect();
      const scrollable = hero.offsetHeight - window.innerHeight;
      const p = scrollable > 0 ? -rect.top / scrollable : 0;
      target = menosMovimento ? 1 : Math.min(1, Math.max(0, p));
      if (document.hidden) apply();
      else if (!ticking) {
        ticking = true;
        requestAnimationFrame(apply);
      }
    }

    function markReady() {
      if (ready) return;
      ready = true;
      duration = v.duration || 0;
      v.classList.add('is-ready');
      l.classList.add('is-gone');
      onScroll();
    }

    if (v.readyState >= 1 && v.duration) duration = v.duration;
    if (v.readyState >= 4) markReady();
    const aoMeta = () => {
      duration = v.duration;
    };
    v.addEventListener('loadedmetadata', aoMeta);
    v.addEventListener('canplaythrough', markReady);
    const timer = window.setTimeout(markReady, 6000);

    /* Destrava o vídeo no iPhone: o Safari não pinta quadro de vídeo
       que nunca tocou. play() e pause() dentro do primeiro toque
       resolve; o catch é obrigatório (AbortError). Ver HeroCinema. */
    function destravar() {
      const pr = v.play();
      if (pr && typeof pr.then === 'function') {
        pr.then(() => {
          v.pause();
          if (v.duration) duration = v.duration;
          markReady();
          apply();
        }).catch(() => {});
      }
    }
    if (toque) window.addEventListener('touchstart', destravar, { passive: true, once: true });

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();

    return () => {
      v.removeEventListener('loadedmetadata', aoMeta);
      v.removeEventListener('canplaythrough', markReady);
      window.clearTimeout(timer);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [totalCidades]);

  return (
    <section
      ref={secao}
      id="lancamento"
      aria-label="Abertura"
      className="sc-hero sc-hero--local relative"
    >
      <div ref={palco} className="sc-sticky">
        <video
          ref={video}
          className="sc-video"
          src={`/video/${u.slug}.mp4`}
          poster={`/imagens/${u.slug}-frame-a.jpg`}
          muted
          playsInline
          preload="auto"
          aria-hidden
          tabIndex={-1}
        />

        <div aria-hidden className="sc-veu" />

        <div ref={loader} className="sc-loader" role="status" aria-live="polite">
          <span className="sc-loader-anel" aria-hidden />
          <span className="font-mono text-[0.68rem] uppercase tracking-[0.26em] text-cinza">
            Entrando no mangue
          </span>
        </div>

        <div className="sc-conteudo mx-auto w-full max-w-[1320px] px-5 md:px-10">
          {/* Camada 1: no chão, entre as raízes. O único h1 da página,
              com a palavra-chave e a cidade. */}
          <div ref={(el) => { camadas.current[0] = el; }} className="sc-camada sc-camada--local">
            <nav aria-label="Trilha de navegação">
              <ol className="flex flex-wrap items-center gap-2 font-mono text-[0.66rem] uppercase tracking-[0.16em] text-cinza">
                <li>
                  <Link href="/" className="transition-colors hover:text-neve">
                    Início
                  </Link>
                </li>
                <li className="flex items-center gap-2">
                  <span aria-hidden>/</span>
                  <span className="text-neve">
                    {u.cidade}, {u.estado}
                  </span>
                </li>
              </ol>
            </nav>
            <p className="sc-rotulo mt-6">
              <span aria-hidden className="h-px w-8 bg-magenta" />
              {u.heroi.rotulo}
            </p>
            <h1 className="sc-titulo-p mt-6 font-display font-extrabold tracking-[-0.04em]">
              {u.heroi.titulo} <span className="text-magenta-texto">{u.heroi.destaque}</span>
            </h1>
          </div>

          {/* Camada 2: por cima da copa, com a cidade acesa. */}
          <div ref={(el) => { camadas.current[1] = el; }} className="sc-camada sc-camada--local">
            <p className="sc-rotulo">
              <span aria-hidden className="h-px w-8 bg-magenta" />
              Vista de cima
            </p>
            <p className="sc-titulo-p mt-6 font-display font-extrabold tracking-[-0.04em]">
              Quem procura na região <span className="text-magenta-texto">precisa encontrar você.</span>
            </p>
            <p className="mt-7 max-w-[52ch] text-guia text-neve">{u.heroi.sub}</p>
            <div className="mt-9 flex flex-wrap items-center gap-3.5">
              <BotaoZap u={u} mensagem={u.heroi.mensagem} secao="hero">
                {u.heroi.acao}
              </BotaoZap>
              <a
                href="#servicos"
                className="inline-flex min-h-[52px] items-center gap-2.5 rounded-full px-7 text-sm font-semibold text-branco ring-1 ring-inset ring-white/20 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/5 hover:ring-white/45"
              >
                {u.heroi.acaoSecundaria}
                <span aria-hidden>↓</span>
              </a>
            </div>
            {/* No celular a camada de cima já leva sub, dois botões e o
                rodapé: esta linha não cabe em 844px e some lá. */}
            <p className="mt-6 hidden text-sm leading-relaxed text-cinza sm:block">
              Atendimento por WhatsApp no {u.telefoneVisivel}. A análise não tem custo e não
              compromete você com nada.
            </p>
          </div>
        </div>

        {/* O detalhe temático: alcance e altura. */}
        <div aria-hidden className="sc-telemetria">
          <div className="sc-tele-item">
            <span className="sc-tele-rotulo">Cidades no alcance</span>
            <span className="sc-tele-valor">
              <span ref={cidades} className="tabular">
                00/{String(totalCidades).padStart(2, '0')}
              </span>
            </span>
          </div>
          <div className="sc-tele-item">
            <span className="sc-tele-rotulo">Altura</span>
            <span className="sc-tele-valor">
              <span ref={altura} className="tabular">00</span>
              <span className="sc-tele-unidade">m</span>
            </span>
          </div>
        </div>

        <div aria-hidden className="sc-barra">
          <span ref={barra} className="sc-barra-fio" />
        </div>

        <div ref={dica} aria-hidden className="sc-dica">
          <span className="sc-dica-seta" />
          <span className="font-mono text-[0.62rem] uppercase tracking-[0.26em] text-cinza">
            Role para subir
          </span>
        </div>
      </div>
    </section>
  );
}
