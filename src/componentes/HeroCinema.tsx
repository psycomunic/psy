'use client';

import { useEffect, useRef } from 'react';
import { Botao } from './Botao';

/**
 * Hero Scroll Cinema: o lançamento controlado pelo dedo do visitante.
 *
 * ============================================================
 * O QUE ISTO É (E O QUE NÃO É)
 * ============================================================
 * Não é vídeo de fundo tocando sozinho. O arquivo hero.mp4 é um
 * flipbook: cada quadro está amarrado à posição da rolagem. Desce, o
 * foguete sobe; volta, o foguete volta. A jornada é uma só: começa no
 * foguete parado na plataforma à noite e termina com ele rompendo a
 * atmosfera, com a curva da Terra embaixo.
 *
 * Isso só funciona porque hero.mp4 foi reencodado com TODO quadro
 * sendo keyframe (x264 keyint=1). Um MP4 comum tem keyframe a cada 2 s
 * e o navegador só salta suave para keyframes: amarrar currentTime nele
 * engasga e parece quebrado. Se um dia o vídeo for trocado, reencode
 * com a receita em ARQUITETURA.md, seção Scroll Cinema.
 *
 * ============================================================
 * COMO FUNCIONA
 * ============================================================
 * A <section> tem 460vh de altura. Dentro dela, um contêiner sticky de
 * 100vh segura o vídeo parado na tela. Conforme a seção atravessa a
 * janela, um progresso p de 0 a 1 é calculado pelo getBoundingClientRect
 * e aplicado em video.currentTime = p × duração.
 *
 * O MESMO p alimenta tudo o mais: as três camadas de texto que se
 * revezam, o contador de altitude e a velocidade (o detalhe temático,
 * em vocabulário de telemetria, que é o vocabulário de painel que a
 * Psy Comunic vende) e a barra de progresso lateral. Uma variável só
 * comanda a cena inteira.
 *
 * ============================================================
 * ARMADILHAS QUE ESTE CÓDIGO JÁ EVITA (não regridam)
 * ============================================================
 * - Lê video.readyState no bind, além de escutar loadedmetadata. Em
 *   servidor local o evento dispara antes do listener existir e a
 *   duração ficaria 0 para sempre: o vídeo pareceria morto.
 * - document.hidden: painel de preview embutido não entrega
 *   requestAnimationFrame. Quando oculto, aplica direto.
 * - prefers-reduced-motion NUNCA colapsa a altura da seção. Colapsar
 *   zera o scrollable, o progresso trava em 0 e o site parece quebrado.
 *   Quem pediu menos movimento recebe o vídeo parado no frame A e o
 *   texto final, sem rolar 460vh à toa: a seção encurta para 100vh.
 * - Tela de carregamento obrigatória, liberada no canplaythrough com
 *   fallback de 6 s. Sem ela a pessoa rola, não vê nada e vai embora.
 * - Nenhum ancestral com overflow:hidden (mata o sticky). A seção usa
 *   overflow:clip. Ver CLAUDE.md.
 */

const ALTITUDE_MAX_KM = 400;
const VELOCIDADE_MAX_KMH = 27600;

/* Janela de opacidade: 0 fora de [a, b], 1 no miolo, rampa nas pontas. */
function janela(p: number, a: number, b: number, rampa = 0.08) {
  if (p <= a || p >= b) return 0;
  const entrada = Math.min(1, (p - a) / rampa);
  const saida = Math.min(1, (b - p) / rampa);
  return Math.min(entrada, saida);
}

export function HeroCinema() {
  const secao = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const loader = useRef<HTMLDivElement>(null);
  const camadas = useRef<(HTMLDivElement | null)[]>([]);
  const altitude = useRef<HTMLSpanElement>(null);
  const velocidade = useRef<HTMLSpanElement>(null);
  const relogio = useRef<HTMLSpanElement>(null);
  const barra = useRef<HTMLSpanElement>(null);
  const dica = useRef<HTMLDivElement>(null);

  useEffect(() => {
    /* Cópias tipadas: as funções abaixo são declaradas fora do
       estreitamento do `if`, e o TypeScript não carrega o "não é nulo"
       para dentro delas. */
    if (!secao.current || !video.current || !loader.current) return;
    const hero: HTMLElement = secao.current;
    const v: HTMLVideoElement = video.current;
    const l: HTMLDivElement = loader.current;

    const menosMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let duration = 0;
    let ready = false;
    let target = menosMovimento ? 1 : 0;
    let ticking = false;

    /* Helpers declarados ANTES dos binds. "function" é içada inteira;
       um "const" lido antes da linha seria TypeError silencioso. */
    function apply() {
      ticking = false;
      const p = target;

      if (duration && !menosMovimento) v.currentTime = p * duration;

      /* Três camadas de texto se revezando ao longo do lançamento. */
      const faixas: [number, number][] = [
        [-0.2, 0.34],
        [0.32, 0.66],
        [0.64, 1.2],
      ];
      camadas.current.forEach((el, i) => {
        if (!el) return;
        const o = menosMovimento ? (i === 2 ? 1 : 0) : janela(p, faixas[i][0], faixas[i][1]);
        el.style.opacity = String(o);
        el.style.transform = `translateY(${(1 - o) * 14}px)`;
        el.style.pointerEvents = o > 0.5 ? 'auto' : 'none';
        el.setAttribute('aria-hidden', o > 0.5 ? 'false' : 'true');
      });

      /* Telemetria: o detalhe temático. Curva quadrática para a
         altitude, que sobe devagar e depois dispara, como um lançamento. */
      const curva = p * p;
      if (altitude.current) {
        altitude.current.textContent = String(Math.round(curva * ALTITUDE_MAX_KM)).padStart(3, '0');
      }
      if (velocidade.current) {
        velocidade.current.textContent = Math.round(Math.sqrt(p) * VELOCIDADE_MAX_KMH)
          .toLocaleString('pt-BR');
      }
      if (relogio.current) {
        const s = Math.round(p * 540);
        relogio.current.textContent = `T+${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
      }
      if (barra.current) barra.current.style.transform = `scaleY(${p})`;
      if (dica.current) dica.current.style.opacity = String(p < 0.04 ? 1 : 0);
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

    /* Lê o estado atual E escuta o evento. */
    if (v.readyState >= 1 && v.duration) duration = v.duration;
    if (v.readyState >= 4) markReady();

    const aoMeta = () => {
      duration = v.duration;
    };
    v.addEventListener('loadedmetadata', aoMeta);
    v.addEventListener('canplaythrough', markReady);
    const timer = window.setTimeout(markReady, 6000);

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
  }, []);

  return (
    <section
      ref={secao}
      id="lancamento"
      aria-label="Abertura"
      className="sc-hero relative"
    >
      <div className="sc-sticky">
        {/* O vídeo. muted + playsInline são obrigatórios: sem eles o
            iOS abre o player em tela cheia no primeiro toque. */}
        <video
          ref={video}
          className="sc-video"
          src="/video/hero.mp4"
          poster="/imagens/hero-frame-a.jpg"
          muted
          playsInline
          preload="auto"
          aria-hidden
          tabIndex={-1}
        />

        {/* Véu para o texto ler sobre a imagem sem matar o foguete. */}
        <div aria-hidden className="sc-veu" />

        {/* Tela de carregamento: some no canplaythrough. */}
        <div ref={loader} className="sc-loader" role="status" aria-live="polite">
          <span className="sc-loader-anel" aria-hidden />
          <span className="font-mono text-[0.68rem] uppercase tracking-[0.26em] text-cinza">
            Preparando o lançamento
          </span>
        </div>

        {/* ---------- Conteúdo sobre o vídeo ---------- */}
        <div className="sc-conteudo mx-auto w-full max-w-[1320px] px-5 md:px-10">
          {/* Camada 1: a abertura. */}
          <div
            ref={(el) => {
              camadas.current[0] = el;
            }}
            className="sc-camada"
          >
            <p className="flex items-center gap-3 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-magenta-texto">
              <span aria-hidden className="h-px w-8 bg-magenta" />
              Do zero ao lançamento, e todo mês depois
            </p>
            <h1 className="sc-titulo mt-7 font-display font-extrabold tracking-[-0.045em]">
              Sua loja não precisa
              <br />
              de mais uma agência.
            </h1>
          </div>

          {/* Camada 2: a virada. */}
          <div
            ref={(el) => {
              camadas.current[1] = el;
            }}
            className="sc-camada"
          >
            <p className="sc-titulo font-display font-extrabold tracking-[-0.045em]">
              Precisa de uma
              <br />
              <span className="text-magenta-texto">operação.</span>
            </p>
          </div>

          {/* Camada 3: a promessa e os botões. */}
          <div
            ref={(el) => {
              camadas.current[2] = el;
            }}
            className="sc-camada"
          >
            <p className="flex items-center gap-3 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-magenta-texto">
              <span aria-hidden className="h-px w-8 bg-magenta" />
              Em órbita
            </p>
            <p className="sc-titulo-p mt-6 font-display font-extrabold tracking-[-0.04em]">
              Do zero ao lançamento.
              <br />
              E todo mês depois dele.
            </p>
            <p className="mt-7 max-w-[54ch] text-guia text-neve">
              A Psy Comunic <strong className="font-semibold text-branco">constrói a sua loja
              do zero até o lançamento</strong> e continua entregando todo mês depois dele.
              Gestão, tecnologia, marketing e logística rodando junto.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Botao href="/diagnostico">Quero meu diagnóstico gratuito</Botao>
              <Botao href="/como-trabalhamos" variante="secundario">
                Ver como trabalhamos
              </Botao>
            </div>
          </div>
        </div>

        {/* ---------- Telemetria (detalhe temático) ---------- */}
        <div aria-hidden className="sc-telemetria">
          <div className="sc-tele-item">
            <span className="sc-tele-rotulo">Altitude</span>
            <span className="sc-tele-valor">
              <span ref={altitude} className="tabular">000</span>
              <span className="sc-tele-unidade">km</span>
            </span>
          </div>
          <div className="sc-tele-item">
            <span className="sc-tele-rotulo">Velocidade</span>
            <span className="sc-tele-valor">
              <span ref={velocidade} className="tabular">0</span>
              <span className="sc-tele-unidade">km/h</span>
            </span>
          </div>
          <div className="sc-tele-item">
            <span className="sc-tele-rotulo">Missão</span>
            <span className="sc-tele-valor">
              <span ref={relogio} className="tabular">T+00:00</span>
            </span>
          </div>
        </div>

        {/* Barra vertical de progresso, na lateral direita. */}
        <div aria-hidden className="sc-barra">
          <span ref={barra} className="sc-barra-fio" />
        </div>

        {/* Dica de rolagem: some assim que a pessoa começa. */}
        <div ref={dica} aria-hidden className="sc-dica">
          <span className="sc-dica-seta" />
          <span className="font-mono text-[0.62rem] uppercase tracking-[0.26em] text-cinza">
            Role para lançar
          </span>
        </div>
      </div>
    </section>
  );
}
