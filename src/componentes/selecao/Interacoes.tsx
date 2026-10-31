'use client';

import { useEffect } from 'react';

/**
 * O que a página faz sozinha além das duas cenas:
 * - revela os blocos com `data-sel-revela` ao entrar na tela;
 * - deixa o topo sólido depois da abertura;
 * - marca o capítulo atual na régua 01 a 04 do herói;
 * - esconde a barra fixa do celular quando o formulário de baixo já
 *   está à vista (dois botões iguais na mesma tela é ruído).
 *
 * O CSS deixa tudo VISÍVEL sem script (`.sel-sem-js`): conteúdo nunca
 * depende de JavaScript para existir.
 */
export function Interacoes() {
  useEffect(() => {
    const raiz = document.querySelector('.sel');
    raiz?.classList.remove('sel-sem-js');

    const menos = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const alvos = Array.from(document.querySelectorAll<HTMLElement>('[data-sel-revela]'));
    let obs: IntersectionObserver | null = null;
    if (menos) alvos.forEach((a) => a.classList.add('is-visto'));
    else {
      obs = new IntersectionObserver(
        (es) =>
          es.forEach((e) => {
            if (!e.isIntersecting) return;
            e.target.classList.add('is-visto');
            obs?.unobserve(e.target);
          }),
        { rootMargin: '0px 0px -12% 0px' },
      );
      alvos.forEach((a) => obs?.observe(a));
    }

    const topo = document.querySelector('.sel-topo');
    const heroi = document.querySelector<HTMLElement>('.sel-heroi');
    const final = document.querySelector('.sel-final');
    const barra = document.querySelector('.sel-barra');
    const caps = Array.from(document.querySelectorAll('.sel-capitulos li'));
    const secoes = ['#projeto', '#como-funciona', '#vagas', '#selecao']
      .map((s) => document.querySelector<HTMLElement>(s))
      .filter(Boolean) as HTMLElement[];

    const aoRolar = () => {
      const y = window.scrollY;
      const fimHeroi = heroi ? heroi.offsetHeight - window.innerHeight * 0.9 : 600;
      topo?.classList.toggle('is-solido', y > fimHeroi);
      let ativo = -1;
      secoes.forEach((s, i) => {
        if (s.getBoundingClientRect().top < window.innerHeight * 0.6) ativo = i;
      });
      /* No herói, a régua acende com a travessia: 01 desde o começo. */
      if (ativo < 0) ativo = 0;
      caps.forEach((c, i) => c.classList.toggle('is-ativo', i === ativo));
      if (barra && final) {
        const r = final.getBoundingClientRect();
        barra.classList.toggle('is-escondida', r.top < window.innerHeight && r.bottom > 0);
      }
    };
    window.addEventListener('scroll', aoRolar, { passive: true });
    aoRolar();

    /* a régua do herói leva ao capítulo */
    const cliques = caps.map((c, i) => {
      const f = () => secoes[i]?.scrollIntoView({ behavior: menos ? 'auto' : 'smooth', block: 'start' });
      c.addEventListener('click', f);
      (c as HTMLElement).style.cursor = 'pointer';
      return f;
    });

    return () => {
      obs?.disconnect();
      window.removeEventListener('scroll', aoRolar);
      caps.forEach((c, i) => c.removeEventListener('click', cliques[i]));
    };
  }, []);

  return null;
}
