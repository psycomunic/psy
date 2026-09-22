import Link from 'next/link';
import type { ReactNode } from 'react';

type Props = {
  href: string;
  children: ReactNode;
  variante?: 'primario' | 'secundario' | 'claro';
  externo?: boolean;
  className?: string;
};

/* O magenta cheio só aparece como FUNDO de botão. Como texto sobre o
   marinho ele reprova no contraste da WCAG, e para isso existe o
   --magenta-texto. Ver comentário em globals.css. */
const base =
  'group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full ' +
  'px-7 py-3.5 text-sm font-semibold tracking-wide transition-all duration-300 ' +
  'active:scale-[0.98]';

const variantes = {
  /* Halo magenta que cresce no hover. O botão principal é o único
     elemento da página com luz própria, e é assim que ele se anuncia
     como o próximo passo sem precisar de seta piscando. */
  primario:
    'bg-magenta text-branco shadow-[0_0_0_0_rgba(228,21,95,0.5)] ' +
    'hover:bg-magenta-forte hover:shadow-[0_10px_40px_-8px_rgba(228,21,95,0.75)] hover:-translate-y-0.5',
  secundario:
    'text-branco ring-1 ring-inset ring-white/20 backdrop-blur-sm ' +
    'hover:bg-white/5 hover:ring-white/45 hover:-translate-y-0.5',
  /* Para uso sobre o magenta cheio da seção final. */
  claro:
    'bg-branco text-marinho hover:-translate-y-0.5 ' +
    'hover:shadow-[0_10px_40px_-8px_rgba(0,0,0,0.45)]',
} as const;

export function Botao({ href, children, variante = 'primario', externo, className = '' }: Props) {
  const classe = `${base} ${variantes[variante]} ${className}`;

  const conteudo = (
    <>
      <span className="relative z-10">{children}</span>
      <span
        aria-hidden
        className="relative z-10 translate-x-0 transition-transform duration-300 group-hover:translate-x-1"
      >
        →
      </span>
    </>
  );

  if (externo) {
    return (
      <a href={href} target="_blank" rel="noopener" className={classe}>
        {conteudo}
      </a>
    );
  }
  return (
    <Link href={href} className={classe}>
      {conteudo}
    </Link>
  );
}
