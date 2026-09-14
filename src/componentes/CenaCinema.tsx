'use client';

import { useEffect, useRef, type ReactNode } from 'react';

/**
 * Cena cinematográfica contida: o mesmo mecanismo do hero, reutilizável
 * no meio da página.
 *
 * Uma seção alta (340vh por padrão) com um contêiner sticky de 100vh.
 * O vídeo (todo frame keyframe, ver ARQUITETURA.md) vai de fundo, e o
 * progresso p (0 a 1) da passagem é publicado de três formas para o
 * conteúdo que a cena recebe como filhos:
 *
 *   --p                 variável CSS no contêiner sticky, para qualquer
 *                       cálculo em CSS (calc, clamp).
 *   data-etapa="n"      índice da etapa atual, se `etapas` for dado:
 *                       p é fatiado em partes iguais. O CSS mostra e
 *                       esconde blocos por [data-etapa].
 *   [data-acende="i"]   dentro da cena, recebe a classe .acesa quando
 *                       p * total >= i + 1 (total = quantos existem).
 *                       Serve para itens que "ligam" um a um.
 *   [data-contagem]     recebe o texto "acesos/total".
 *   [data-medidor]      recebe --p também (para agulha, barra).
 *   [data-valor="max"]  mostra um número que desce de max a 0 com p
 *                       (altitude); [data-valor-sobe] faz o inverso.
 *
 * Tudo comandado por um scroll listener e um requestAnimationFrame.
 * Mesmas armadilhas do hero, mesmas defesas: readyState no bind,
 * document.hidden, loader com fallback, reduced-motion sem colapsar a
 * altura (reduz a 100vh e mostra o frame final).
 */
export function CenaCinema({
  id,
  src,
  poster,
  alturaVh = 340,
  etapas,
  rotulo,
  children,
}: {
  id: string;
  src: string;
  poster: string;
  alturaVh?: number;
  etapas?: number;
  rotulo: string;
  children: ReactNode;
}) {
  const secao = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const loader = useRef<HTMLDivElement>(null);
  const palco = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!secao.current || !video.current || !loader.current || !palco.current) return;
    const cena: HTMLElement = secao.current;
    const v: HTMLVideoElement = video.current;
    const l: HTMLDivElement = loader.current;
    const stage: HTMLDivElement = palco.current;

    const menosMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const acendem = Array.from(stage.querySelectorAll<HTMLElement>('[data-acende]'));
    const contagens = Array.from(stage.querySelectorAll<HTMLElement>('[data-contagem]'));
    const medidores = Array.from(stage.querySelectorAll<HTMLElement>('[data-medidor]'));
    const valores = Array.from(stage.querySelectorAll<HTMLElement>('[data-valor]'));

    let duration = 0;
    let ready = false;
    let target = menosMovimento ? 1 : 0;
    let ticking = false;
    let timer: number | undefined;

    function apply() {
      ticking = false;
      const p = target;
      if (duration && !menosMovimento) v.currentTime = p * duration;

      stage.style.setProperty('--p', p.toFixed(4));
      if (etapas) {
        stage.dataset.etapa = String(Math.min(etapas - 1, Math.floor(p * etapas)));
      }

      const total = acendem.length;
      let acesos = 0;
      acendem.forEach((el, i) => {
        const on = p * total >= i + 1 - 0.02;
        el.classList.toggle('acesa', on);
        if (on) acesos++;
      });
      contagens.forEach((c) => {
        c.textContent = `${String(acesos).padStart(2, '0')}/${String(total).padStart(2, '0')}`;
      });
      medidores.forEach((m) => m.style.setProperty('--p', p.toFixed(4)));
      valores.forEach((el) => {
        const max = parseFloat(el.dataset.valor || '0');
        const sobe = el.hasAttribute('data-valor-sobe');
        const k = sobe ? p : 1 - p;
        el.textContent = Math.round(max * Math.pow(k, 1.4)).toLocaleString('pt-BR');
      });
    }

    function onScroll() {
      const rect = cena.getBoundingClientRect();
      const scrollable = cena.offsetHeight - window.innerHeight;
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

    /* O vídeo só começa a baixar quando a cena se aproxima: são 15 MB
       por cena, e três cenas na mesma página não podem competir com o
       hero pela banda no primeiro segundo. */
    const obs = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((e) => e.isIntersecting)) {
          v.preload = 'auto';
          v.load();
          /* O fallback de 6 s conta a partir do início do download, não
             do carregamento da página: antes disso o poster já segura. */
          timer = window.setTimeout(markReady, 6000);
          obs.disconnect();
        }
      },
      { rootMargin: '120% 0px' },
    );
    obs.observe(cena);

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();

    return () => {
      v.removeEventListener('loadedmetadata', aoMeta);
      v.removeEventListener('canplaythrough', markReady);
      window.clearTimeout(timer);
      obs.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [etapas]);

  return (
    <section
      ref={secao}
      id={id}
      aria-label={rotulo}
      className="cena relative"
      style={{ ['--altura' as string]: `${alturaVh}vh` }}
    >
      <div ref={palco} className="cena-sticky" data-etapa="0">
        <video
          ref={video}
          className="cena-video"
          src={src}
          poster={poster}
          muted
          playsInline
          preload="none"
          aria-hidden
          tabIndex={-1}
        />
        <div aria-hidden className="cena-veu" />
        <div ref={loader} className="cena-loader" role="status" aria-live="polite">
          <span className="sc-loader-anel" aria-hidden />
        </div>
        <div className="cena-conteudo">{children}</div>
      </div>
    </section>
  );
}
