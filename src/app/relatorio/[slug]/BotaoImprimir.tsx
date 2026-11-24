'use client';

import { useState } from 'react';

export function BotaoImprimir({
  nomeArquivoPdf,
  whatsappHref,
}: {
  nomeArquivoPdf: string;
  whatsappHref: string;
}) {
  const [modoFolha, setModoFolha] = useState(false);
  const [preparando, setPreparando] = useState(false);

  function alternarModoFolha() {
    const proximo = !modoFolha;
    setModoFolha(proximo);
    const raiz = document.querySelector('.documento-relatorio');
    if (raiz) {
      raiz.classList.toggle('modo-folha-pdf', proximo);
    }
  }

  async function exportarPdf() {
    setPreparando(true);
    const tituloOriginal = document.title;
    document.title = nomeArquivoPdf;

    try {
      /* Aguarda o carregamento/decodificação de todas as miniaturas da página
         para nunca sair quadro em branco no PDF gerado pelo navegador. */
      const imgs = Array.from(document.images);
      await Promise.race([
        Promise.all(
          imgs.map((img) =>
            img.complete
              ? Promise.resolve()
              : new Promise<void>((resolve) => {
                  img.addEventListener('load', () => resolve(), { once: true });
                  img.addEventListener('error', () => resolve(), { once: true });
                }),
          ),
        ),
        new Promise<void>((resolve) => setTimeout(resolve, 2200)),
      ]);
    } finally {
      setPreparando(false);
    }

    window.print();
    setTimeout(() => {
      document.title = tituloOriginal;
    }, 800);
  }

  return (
    <div className="flex flex-wrap items-center gap-2.5 print:hidden">
      <button
        type="button"
        onClick={alternarModoFolha}
        className="rounded-full border border-fio px-4 py-2 text-xs font-semibold text-neve transition-colors hover:bg-white/[0.06]"
      >
        {modoFolha ? 'Modo tela escura' : 'Prévia da folha A4'}
      </button>

      <button
        type="button"
        disabled={preparando}
        onClick={exportarPdf}
        className="rounded-full bg-magenta px-5 py-2.5 text-sm font-semibold text-branco transition-colors hover:bg-magenta-forte disabled:opacity-60"
      >
        {preparando ? 'Preparando PDF...' : 'Baixar PDF / Imprimir'}
      </button>

      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-full border border-fio px-4 py-2.5 text-sm text-neve transition-colors hover:bg-white/[0.06]"
      >
        Falar com a equipe
      </a>
    </div>
  );
}
