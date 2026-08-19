import Link from 'next/link';
import type { ReactNode } from 'react';

type Props = {
  href: string;
  children: ReactNode;
  variante?: 'primario' | 'secundario';
  externo?: boolean;
};

/* O magenta cheio só aparece como FUNDO de botão. Como texto sobre o
   marinho ele reprova no contraste da WCAG, e para isso existe o
   --magenta-texto. Ver comentário em globals.css. */
export function Botao({ href, children, variante = 'primario', externo }: Props) {
  const base =
    'inline-flex items-center justify-center rounded-full px-7 py-3.5 text-sm font-semibold tracking-wide transition-colors';
  const estilo =
    variante === 'primario'
      ? 'bg-magenta text-branco hover:bg-magenta-forte'
      : 'text-branco ring-1 ring-inset ring-white/25 hover:ring-white/60';

  if (externo) {
    return (
      <a href={href} target="_blank" rel="noopener" className={`${base} ${estilo}`}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={`${base} ${estilo}`}>
      {children}
    </Link>
  );
}
