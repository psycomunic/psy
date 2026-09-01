'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

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
  /*
    ============================================================
    O BUG QUE ISTO CONSERTA
    ============================================================
    Este componente vive no layout, que NÃO remonta quando se troca de
    página por link. Com a lista de dependências vazia, ele observava
    apenas os elementos da primeira página carregada.

    Quem entrava pela home e clicava no menu chegava numa página onde
    `data-animar="sim"` já estava no documento, escondendo todo
    `.revelar`, e o observador que os revelaria nunca chegou a existir
    para eles. O conteúdo ficava invisível PARA SEMPRE, sem erro no
    console e sem nada quebrado na tela: só espaço vazio abaixo de cada
    título.

    Carga direta funcionava, que é o pior jeito de um defeito se
    esconder: é assim que se testa, e não é assim que se navega.

    Medido: chegando pela home e clicando em "Tráfego pago", 7 de 7
    blocos ficavam invisíveis mesmo depois de rolar a página inteira.
  */
  const rota = usePathname();

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
    /* A rota entra na lista: a cada troca de página, um observador novo
       para os elementos novos. */
  }, [rota]);

  return null;
}
