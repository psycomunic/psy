import Link from 'next/link';

/**
 * Lockup tipográfico da marca.
 *
 * "Psy" na display, peso alto e tracking negativo; "Comunic" na mono,
 * espacejada. O contraste entre as duas famílias é o que faz um
 * logotipo de texto parecer desenhado em vez de digitado.
 */
export function Marca({ className = '' }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="Psy Comunic, início"
      className={`group inline-flex items-center gap-2.5 ${className}`}
    >
      <span className="font-display text-[1.4rem] font-extrabold leading-none tracking-[-0.03em] text-branco">
        Psy
      </span>
      {/* Fio magenta entre as duas palavras: o único elemento gráfico da
          marca, e o que amarra o lockup à paleta. */}
      <span
        aria-hidden
        className="h-4 w-px bg-magenta transition-[height] duration-300 group-hover:h-5"
      />
      <span className="font-mono text-[0.75rem] uppercase leading-none tracking-[0.26em] text-cinza transition-colors group-hover:text-neve">
        Comunic
      </span>
    </Link>
  );
}
