/**
 * Ícones das quatro frentes.
 *
 * Traço geométrico, 1.5px, sem preenchimento: o mesmo peso do fio que
 * contorna os cards, para o ícone parecer parte do desenho e não um
 * adesivo colado em cima.
 *
 * currentColor de propósito, para o ícone acompanhar a cor do card no
 * hover sem uma linha de CSS a mais.
 */
const tracos: Record<string, React.ReactNode> = {
  /* Gestão: quadrantes de um plano, o mapa da operação. */
  gestao: (
    <>
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" />
      <path d="M13.5 17.25h7.5M17.25 13.5v7.5" />
    </>
  ),
  /* Tecnologia: chaves de código dentro de uma tela. */
  tecnologia: (
    <>
      <rect x="2.5" y="4" width="19" height="14" rx="2" />
      <path d="M9 9.5 6.5 12 9 14.5M15 9.5 17.5 12 15 14.5" />
      <path d="M8 21h8" />
    </>
  ),
  /* Marketing: curva de crescimento com o ponto de virada marcado. */
  marketing: (
    <>
      <path d="M3 20V4" />
      <path d="M3 20h18" />
      <path d="M6.5 16.5 11 11l3.5 3.5L20.5 7" />
      <circle cx="11" cy="11" r="1.6" />
    </>
  ),
  /* Atendimento e logística: caixa em trânsito com sinal de retorno. */
  'atendimento-logistica': (
    <>
      <path d="M3 8.5 12 4l9 4.5v7L12 20l-9-4.5v-7Z" />
      <path d="m3 8.5 9 4.5 9-4.5M12 13v7" />
    </>
  ),
};

export function IconeFrente({ slug, className = '' }: { slug: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {tracos[slug] ?? null}
    </svg>
  );
}
