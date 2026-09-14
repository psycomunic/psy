'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Kit de interações da página, declaradas por atributo no HTML.
 *
 * Um componente só, sem framework, um ouvinte de rolagem e um de mouse
 * para a página inteira. Cada interação é um atributo `data-*` que o
 * JSX coloca no elemento; este arquivo lê os atributos e anima. Sem
 * JS, nada some: os estados iniciais são visíveis (ver globals.css).
 *
 *   data-paralaxe="0.2"   desloca o elemento em Y conforme a rolagem,
 *                         na proporção dada (0.2 = 20% do deslocamento
 *                         da viewport). Para fundos, brilhos e órbitas.
 *   data-contar="17"      número que sobe de 0 até o valor quando o
 *                         elemento entra na tela.
 *   data-desenha          <path> SVG que se desenha conforme a seção
 *                         (o ancestral [data-cena]) atravessa a tela.
 *   data-satelite         elemento que viaja ao longo do primeiro
 *                         [data-desenha] da mesma cena.
 *   data-inclina          card que inclina em 3D na direção do cursor
 *                         e recebe um holofote (--mx/--my) na borda.
 *   data-etapas           lista cujos filhos acendem um a um conforme a
 *                         cena avança (classe .ativa).
 *   data-cena             ancestral que define o progresso 0→1 usado
 *                         por desenha, satelite e etapas: 0 quando o
 *                         topo da cena entra pela base da tela, 1
 *                         quando a base da cena sai pelo topo.
 *
 * Respeita prefers-reduced-motion: paralaxe, inclinação e satélite
 * desligam; contadores e etapas mostram o estado final.
 */
export function Interacoes() {
  const rota = usePathname();

  useEffect(() => {
    const menosMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const toque = window.matchMedia('(hover: none)').matches;

    const paralaxes = Array.from(document.querySelectorAll<HTMLElement>('[data-paralaxe]'));
    const cenas = Array.from(document.querySelectorAll<HTMLElement>('[data-cena]')).map((cena) => {
      const paths = Array.from(cena.querySelectorAll<SVGPathElement>('path[data-desenha]'));
      paths.forEach((path) => {
        const len = path.getTotalLength();
        path.style.strokeDasharray = `${len}`;
        path.style.strokeDashoffset = `${len}`;
      });
      return {
        cena,
        paths,
        satelite: cena.querySelector<HTMLElement>('[data-satelite]'),
        etapas: cena.querySelector<HTMLElement>('[data-etapas]'),
      };
    });
    const progresso = document.getElementById('progresso-pagina');

    let ticking = false;

    function aplicar() {
      ticking = false;
      const vh = window.innerHeight;
      const meio = vh / 2;

      if (progresso) {
        const total = document.documentElement.scrollHeight - vh;
        progresso.style.transform = `scaleX(${total > 0 ? window.scrollY / total : 0})`;
      }

      if (!menosMovimento) {
        paralaxes.forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.bottom < -vh || r.top > vh * 2) return;
          const fator = parseFloat(el.dataset.paralaxe || '0.2');
          const d = (r.top + r.height / 2 - meio) * fator;
          el.style.transform = `translate3d(0, ${d.toFixed(1)}px, 0)`;
        });
      }

      cenas.forEach(({ cena, paths, satelite, etapas }) => {
        const r = cena.getBoundingClientRect();
        const bruto = (vh - r.top) / (r.height + vh);
        /* Encurta as pontas: a cena "acontece" no miolo da passagem,
           não no instante em que encosta na tela. */
        const p = menosMovimento ? 1 : Math.min(1, Math.max(0, (bruto - 0.18) / 0.55));

        paths.forEach((path) => {
          const len = path.getTotalLength();
          path.style.strokeDashoffset = `${len * (1 - p)}`;
        });

        if (satelite && paths[0]) {
          const path = paths[0];
          const svg = path.ownerSVGElement;
          if (svg) {
            const pt = path.getPointAtLength(path.getTotalLength() * p);
            const box = svg.viewBox.baseVal;
            const sr = svg.getBoundingClientRect();
            const x = (pt.x / box.width) * sr.width;
            const y = (pt.y / box.height) * sr.height;
            satelite.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
            satelite.style.opacity = p > 0.02 && p < 0.98 ? '1' : '0';
          }
        }

        if (etapas) {
          const filhos = Array.from(etapas.children) as HTMLElement[];
          const n = filhos.length;
          filhos.forEach((f, i) => {
            f.classList.toggle('ativa', p >= (i + 0.5) / (n + 0.5));
          });
        }
      });
    }

    function aoRolar() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(aplicar);
      }
    }

    /* Contadores: sobem uma vez, quando entram na tela. */
    const contadores = Array.from(document.querySelectorAll<HTMLElement>('[data-contar]'));
    const obsContador = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((e) => {
          if (!e.isIntersecting) return;
          const el = e.target as HTMLElement;
          obsContador.unobserve(el);
          const alvo = parseFloat(el.dataset.contar || '0');
          if (menosMovimento) {
            el.textContent = String(alvo);
            return;
          }
          const inicio = performance.now();
          const dur = 1400;
          const passo = (t: number) => {
            const k = Math.min(1, (t - inicio) / dur);
            const suave = 1 - Math.pow(1 - k, 3);
            el.textContent = String(Math.round(alvo * suave));
            if (k < 1) requestAnimationFrame(passo);
          };
          requestAnimationFrame(passo);
        });
      },
      { threshold: 0.6 },
    );
    contadores.forEach((c) => obsContador.observe(c));

    /* Inclinação e holofote nos cards. Só com mouse: no toque, um card
       que inclina embaixo do dedo é ruído. */
    const inclinaveis = Array.from(document.querySelectorAll<HTMLElement>('[data-inclina]'));
    const limpezas: (() => void)[] = [];
    if (!toque && !menosMovimento) {
      inclinaveis.forEach((el) => {
        const mover = (e: MouseEvent) => {
          const r = el.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width;
          const y = (e.clientY - r.top) / r.height;
          el.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
          el.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
          el.style.setProperty('--rx', `${((0.5 - y) * 6).toFixed(2)}deg`);
          el.style.setProperty('--ry', `${((x - 0.5) * 8).toFixed(2)}deg`);
        };
        const sair = () => {
          el.style.setProperty('--rx', '0deg');
          el.style.setProperty('--ry', '0deg');
        };
        el.addEventListener('mousemove', mover);
        el.addEventListener('mouseleave', sair);
        limpezas.push(() => {
          el.removeEventListener('mousemove', mover);
          el.removeEventListener('mouseleave', sair);
        });
      });
    }

    window.addEventListener('scroll', aoRolar, { passive: true });
    window.addEventListener('resize', aoRolar);
    aplicar();

    return () => {
      window.removeEventListener('scroll', aoRolar);
      window.removeEventListener('resize', aoRolar);
      obsContador.disconnect();
      limpezas.forEach((f) => f());
    };
  }, [rota]);

  return null;
}
