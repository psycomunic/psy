import Link from 'next/link';

/** Lockup tipográfico: PSY em peso alto, COMUNIC espacejado. */
export function Marca({ className = '' }: { className?: string }) {
  return (
    <Link href="/" className={`inline-flex items-baseline gap-2 ${className}`} aria-label="Psy Comunic, início">
      <span className="text-[1.35rem] font-extrabold tracking-tight text-branco">Psy</span>
      <span className="text-[0.8rem] font-semibold uppercase tracking-[0.22em] text-cinza">Comunic</span>
    </Link>
  );
}
