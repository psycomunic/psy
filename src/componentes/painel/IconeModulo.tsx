import type { Modulo } from '@/lib/papeis';

/**
 * Um ícone por módulo do painel.
 *
 * ============================================================
 * POR QUE SVG À MÃO, E NÃO UMA BIBLIOTECA
 * ============================================================
 * São onze ícones. A biblioteca mais leve do ramo traz mil e cobra o
 * peso de todas na hora de resolver a árvore, num projeto que hoje tem
 * sete dependências ao todo. Onze traçados escritos aqui custam alguns
 * kilobytes e não envelhecem.
 *
 * Todos com o mesmo vocabulário: caixa de 20, traço de 1.6, pontas
 * arredondadas, `currentColor`. É isso que faz onze desenhos diferentes
 * parecerem um conjunto em vez de onze ícones baixados de lugares
 * diferentes.
 *
 * `aria-hidden` em todos. O nome do módulo está no texto ao lado, e no
 * `title` quando o menu está recolhido: um leitor de tela anunciando
 * "imagem, gráfico" antes de "Métricas" só atrapalha.
 */

const TRACOS: Record<Modulo, string> = {
  /* Painel: quatro blocos, o retrato de uma visão geral. */
  visao: 'M3 3h6v6H3zM11 3h6v4h-6zM11 9h6v8h-6zM3 11h6v6H3z',

  /* Funil: três linhas que estreitam. */
  crm: 'M2 4h16M5 10h10M8 16h4',

  /* Documento com uma dobra. */
  propostas: 'M5 2h7l4 4v12H5zM12 2v4h4',

  /* Cifrão, sem o floreio. */
  financeiro: 'M10 2v16M13.5 5.5a3.5 3.5 0 0 0-3.5-2c-2 0-3.5 1-3.5 3s1.5 2.5 3.5 3 3.5 1 3.5 3-1.5 3-3.5 3a3.5 3.5 0 0 1-3.5-2',

  /* Vitrine: um toldo sobre uma porta. */
  contas: 'M3 7h14v10H3zM3 7l2-4h10l2 4M8 17v-5h4v5',

  /* Barras de altura crescente. */
  metricas: 'M3 17V9M8 17V4M13 17v-6M18 17v-9',

  /* Lista com marca de conferido. */
  tarefas: 'M3 5.5 4.5 7 7.5 4M3 12.5 4.5 14l3-3M11 5.5h6M11 13h6',

  /* Folha com linhas e uma curva. */
  relatorios: 'M4 2h12v16H4zM7 7h6M7 11h6M7 15h3',

  /* Duas cabeças. */
  equipe: 'M7.5 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2 17c0-3 2.5-5 5.5-5s5.5 2 5.5 5M14 4.5a2.6 2.6 0 0 1 0 5M15.5 12c1.6.6 2.5 2 2.5 4',

  /* Escudo com um risco: a trilha que não se altera. */
  auditoria: 'M10 2 3.5 4.5v5c0 4 2.8 7.2 6.5 8.5 3.7-1.3 6.5-4.5 6.5-8.5v-5zM7.5 9.5l2 2 3.5-3.5',

  /* Engrenagem simplificada: círculo e seis dentes. */
  configuracoes: 'M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM10 2v2M10 16v2M2 10h2M16 10h2M4.4 4.4l1.4 1.4M14.2 14.2l1.4 1.4M15.6 4.4l-1.4 1.4M5.8 14.2l-1.4 1.4',
};

export function IconeModulo({ modulo }: { modulo: Modulo }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
      className="flex-none"
    >
      <path
        d={TRACOS[modulo]}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
