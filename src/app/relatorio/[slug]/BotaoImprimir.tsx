'use client';

export function BotaoImprimir() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-full bg-magenta px-5 py-2.5 text-sm font-semibold text-branco transition-colors hover:bg-magenta-forte print:hidden"
    >
      Salvar em PDF / Imprimir
    </button>
  );
}
