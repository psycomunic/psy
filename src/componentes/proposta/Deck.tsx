'use client';

import { Children, useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

/**
 * A proposta como apresentação que passa para o lado.
 *
 * ============================================================
 * POR QUE ROLAGEM NATIVA, E NÃO UMA BIBLIOTECA DE CARROSSEL
 * ============================================================
 * `overflow-x: auto` com `scroll-snap` já entrega o gesto de arrastar
 * do celular, com a física do sistema, inércia certa e sem atraso de
 * toque. Biblioteca nenhuma faz isso melhor, e todas cobram peso de
 * JavaScript por um comportamento que o navegador tem de graça.
 *
 * Consequência: se o JavaScript não carregar, a apresentação CONTINUA
 * passando com o dedo. O que se perde são as setas e a contagem, que
 * são conforto, e não a leitura.
 *
 * ============================================================
 * TRÊS DETALHES DE CELULAR QUE DERRUBAM DECK
 * ============================================================
 * `100dvh` e não `100vh`. No Safari e no Chrome de celular, `100vh`
 * conta a altura SEM a barra de endereço, então o rodapé de cada slide
 * fica escondido atrás dela até a pessoa rolar.
 *
 * `overscroll-behavior-x: contain`. Sem isso, arrastar para o lado no
 * primeiro slide dispara o "voltar" do iOS, e a pessoa perde a
 * proposta no meio da leitura.
 *
 * Cada slide rola sozinho na vertical. Slide que não cabe num telefone
 * pequeno é regra, não exceção — sem a rolagem interna, o fim do texto
 * simplesmente não existe.
 *
 * ============================================================
 * O FUNDO É FIXO, E OS SLIDES CORREM POR CIMA
 * ============================================================
 * Grade, brilhos e grão ficam numa camada que NÃO se move. Se cada
 * slide carregasse o próprio fundo, o brilho passaria correndo junto e
 * viraria efeito de carrossel barato. Parado, ele funciona como o
 * cenário de um palco: o que se move é o conteúdo.
 */
export function Deck({ children }: { children: ReactNode }) {
  const slides = Children.toArray(children);
  const total = slides.length;

  const trilho = useRef<HTMLDivElement>(null);
  const [atual, setAtual] = useState(0);

  const irPara = useCallback(
    (i: number) => {
      const el = trilho.current;
      if (!el) return;
      const alvo = Math.max(0, Math.min(total - 1, i));
      el.scrollTo({ left: alvo * el.clientWidth, behavior: 'smooth' });
    },
    [total],
  );

  /* Qual slide está na tela, medido pela rolagem em vez de contado nos
     cliques: a pessoa também chega aqui arrastando, e um contador que
     só escuta botão mente na primeira vez que ela usa o dedo. */
  useEffect(() => {
    const el = trilho.current;
    if (!el) return;

    let parado: ReturnType<typeof setTimeout>;
    const aoRolar = () => {
      clearTimeout(parado);
      parado = setTimeout(() => {
        setAtual(Math.round(el.scrollLeft / el.clientWidth));
      }, 80);
    };

    el.addEventListener('scroll', aoRolar, { passive: true });
    return () => {
      el.removeEventListener('scroll', aoRolar);
      clearTimeout(parado);
    };
  }, []);

  /*
    Marca a tela que TEM mais coisa abaixo.

    Slide com muito item nao cabe no telefone, e a secao rola por dentro
    de proposito: o overflow-y-auto esta ali para isso. O problema
    nunca foi a rolagem: era ela ser invisivel. Quem nao sabe que ha
    mais desliza para o lado e perde metade do que estava escrito.
  */
  useEffect(() => {
    const el = trilho.current;
    if (!el) return;

    const conferir = () => {
      for (const secao of Array.from(el.children)) {
        const rola = secao.scrollHeight > secao.clientHeight + 8;
        const noFim = secao.scrollTop + secao.clientHeight >= secao.scrollHeight - 12;
        secao.toggleAttribute('data-tem-mais', rola && !noFim);
      }
    };

    conferir();
    const t = setTimeout(conferir, 400);
    window.addEventListener('resize', conferir);
    for (const secao of Array.from(el.children)) {
      secao.addEventListener('scroll', conferir, { passive: true });
    }
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', conferir);
      for (const secao of Array.from(el.children)) {
        secao.removeEventListener('scroll', conferir);
      }
    };
  }, [total]);

  /* Setas do teclado, porque quem abre no computador tenta isso antes
     de procurar botão. Só quando o foco não está num campo. */
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      const alvo = e.target as HTMLElement | null;
      if (alvo && /^(INPUT|TEXTAREA|SELECT)$/.test(alvo.tagName)) return;

      if (e.key === 'ArrowRight' || e.key === 'PageDown') irPara(atual + 1);
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') irPara(atual - 1);
      if (e.key === 'Home') irPara(0);
      if (e.key === 'End') irPara(total - 1);
    };

    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [atual, irPara, total]);

  const primeiro = atual === 0;
  const ultimo = atual === total - 1;

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-marinho print:h-auto print:overflow-visible">
      {/* Cenário fixo. Não se move com os slides, de propósito. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0 print:hidden">
        <div className="grade absolute inset-0 opacity-70" />
        <div className="brilho-magenta absolute -right-[30%] -top-[35%] h-[760px] w-[760px] opacity-40" />
        <div className="brilho-frio absolute -left-[28%] bottom-[-25%] h-[680px] w-[680px] opacity-25" />
      </div>

      <div
        ref={trilho}
        className="deck-trilho relative z-10 flex h-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden print:block print:h-auto print:overflow-visible"
        style={{ overscrollBehaviorX: 'contain', scrollbarWidth: 'none' }}
        tabIndex={-1}
      >
        {slides.map((slide, i) => (
          <section
            key={i}
            aria-label={`Slide ${i + 1} de ${total}`}
            className={
              'h-full w-full flex-none snap-center snap-always overflow-y-auto overflow-x-hidden ' +
              'print:block print:h-auto print:w-auto print:break-after-page print:overflow-visible'
            }
          >
            {/* Faixas: topo para o cabeçalho fixo, base para os
                controles. Sem elas o conteúdo passa por baixo dos dois
                e some justamente onde o polegar fica. */}
            <div className="mx-auto flex min-h-full w-full max-w-[1120px] flex-col px-6 pb-28 pt-14 sm:px-10 sm:pb-32 sm:pt-20 md:pt-24 print:pb-8 print:pt-8">
              {slide}
            </div>
          </section>
        ))}
      </div>

      {/* Cabeçalho fixo do documento: marca à esquerda, posição à
          direita. É o que dá a qualquer tela o ar de "página de uma
          apresentação" em vez de página solta. */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-4 px-6 pt-5 sm:px-10 print:hidden">
        <p className="font-display text-sm font-extrabold tracking-[-0.02em] text-branco/90">
          Psy<span className="text-magenta">.</span>
        </p>
        <p className="tabular font-mono text-[0.72rem] uppercase tracking-[0.18em] text-cinza">
          <span className="text-branco">{String(atual + 1).padStart(2, '0')}</span>
          <span className="mx-1 text-cinza/50">/</span>
          {String(total).padStart(2, '0')}
        </p>
      </header>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-20 h-[3px] bg-white/10 print:hidden"
      >
        <div
          className="h-full bg-magenta transition-[width] duration-300"
          style={{ width: `${((atual + 1) / total) * 100}%` }}
        />
      </div>

      {/* Controles. Ficam embaixo, ao alcance do polegar no celular. */}
      <nav
        aria-label="Navegação da apresentação"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-center justify-between gap-4 px-5 pb-[max(1.1rem,env(safe-area-inset-bottom))] pt-14 sm:px-8 print:hidden"
        style={{
          background: 'linear-gradient(to top, var(--marinho) 22%, transparent)',
        }}
      >
        <button
          type="button"
          onClick={() => irPara(atual - 1)}
          disabled={primeiro}
          aria-label="Slide anterior"
          className="pointer-events-auto flex h-12 w-12 flex-none items-center justify-center rounded-full border border-fio bg-white/[0.06] text-branco backdrop-blur transition-colors hover:bg-white/15 disabled:opacity-20"
        >
          <span aria-hidden>←</span>
        </button>

        {/* Pontos no desktop; no celular eles ficariam menores que o
            alvo mínimo de toque, então lá vira contador. */}
        <ol className="pointer-events-auto hidden items-center sm:flex">
          {slides.map((_, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => irPara(i)}
                aria-label={`Ir para o slide ${i + 1}`}
                aria-current={i === atual ? 'true' : undefined}
                className="group flex h-11 w-6 items-center justify-center"
              >
                <span
                  aria-hidden
                  className={
                    'block h-2 rounded-full transition-all duration-300 ' +
                    (i === atual
                      ? 'w-8 bg-magenta'
                      : 'w-2 bg-white/25 group-hover:bg-white/50')
                  }
                />
              </button>
            </li>
          ))}
        </ol>

        <p
          aria-live="polite"
          className="pointer-events-none font-mono text-[0.72rem] uppercase tracking-[0.18em] text-cinza sm:hidden"
        >
          {primeiro ? 'arraste →' : ultimo ? 'fim' : `${atual + 1} de ${total}`}
        </p>

        <button
          type="button"
          onClick={() => irPara(atual + 1)}
          disabled={ultimo}
          aria-label="Próximo slide"
          className="pointer-events-auto flex h-12 w-12 flex-none items-center justify-center rounded-full bg-magenta text-branco shadow-[0_10px_30px_-10px_rgba(228,21,95,0.9)] transition-colors hover:bg-magenta-forte disabled:bg-white/[0.06] disabled:shadow-none disabled:opacity-25"
        >
          <span aria-hidden>→</span>
        </button>
      </nav>

      {/* Grão por cima de tudo. É o que separa "azul chapado" de
          superfície, e é a mesma camada do site. */}
      <div aria-hidden className="grao-camada print:hidden" />

      <style>{`
        .deck-trilho::-webkit-scrollbar { display: none; }
        .deck-trilho > section::-webkit-scrollbar { display: none; }
        .deck-trilho > section { scrollbar-width: none; }

        /*
          O aviso de que a tela continua abaixo.

          Slide com muitos itens nao cabe no telefone e rola por dentro,
          que e o comportamento desenhado. O que faltava era alguem
          saber disso: sem sinal, a pessoa desliza para o lado e perde
          metade do que estava escrito.

          Um veu curto na base, so enquanto houver o que ver, e so no
          telefone. No desktop tudo cabe e o veu seria enfeite.
        */
        @media (max-width: 767px) {
          .deck-trilho > section[data-tem-mais]::after {
            content: '';
            position: fixed;
            left: 0;
            right: 0;
            bottom: 118px;
            height: 56px;
            pointer-events: none;
            z-index: 15;
            background: linear-gradient(to top, var(--marinho) 12%, transparent);
          }
        }

        @media print { .deck-trilho { display: block !important; } }
      `}</style>
    </div>
  );
}
