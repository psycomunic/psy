'use client';

import { useEffect } from 'react';

/**
 * Revelação ao rolar.
 *
 * A ordem aqui importa e é o oposto da intuitiva: o CSS deixa tudo
 * VISÍVEL por padrão, e este componente é que marca o documento com
 * data-animar="sim" para então esconder e revelar. Se o JS falhar, não
 * carregar ou estiver desligado, a página aparece inteira. Conteúdo que
 * depende de script para existir é conteúdo que some.
 *
 * Respeita prefers-reduced-motion: quem pediu menos movimento não recebe
 * observador nenhum, e a página fica estática desde o primeiro quadro.
 */
export function Revelar() {
  useEffect(() => {
    const menosMovimento = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (menosMovimento.matches) return;

    const raiz = document.documentElement;
    raiz.dataset.animar = 'sim';

    const alvos = document.querySelectorAll('.revelar');

    const observador = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add('visivel');
          // Revela uma vez só. Elemento que reaparece a cada rolagem
          // vira cintilação, não animação.
          observador.unobserve(e.target);
        });
      },
      // rootMargin negativo embaixo: o elemento só conta como visto
      // quando entra de verdade, e não quando encosta a primeira linha.
      { threshold: 0, rootMargin: '0px 0px -12% 0px' },
    );

    alvos.forEach((a) => observador.observe(a));

    return () => {
      observador.disconnect();
      delete raiz.dataset.animar;
    };
  }, []);

  return null;
}
