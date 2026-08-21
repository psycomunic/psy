'use client';

/**
 * O botão que recolhe o menu lateral.
 *
 * ============================================================
 * SEM ESTADO NO REACT, DE PROPÓSITO
 * ============================================================
 * O estado vive num atributo do `<html>` e quem esconde os rótulos é o
 * CSS. Este botão só troca o atributo e grava a preferência.
 *
 * Guardar isso em `useState` traria três problemas de graça:
 *
 * O servidor não sabe o que está no `localStorage`, então qualquer
 * estado inicial que ele renderizasse teria chance de discordar do
 * cliente — e divergência de hidratação é erro em produção.
 *
 * A tela abriria com o menu aberto e o recolheria depois da
 * hidratação, na frente do usuário.
 *
 * E cada troca causaria um re-render de uma árvore que não mudou:
 * esconder um rótulo é trabalho de CSS.
 *
 * Quem aplica a preferência antes da primeira pintura é o script
 * embutido no layout do painel.
 */
export function BotaoMenu() {
  return (
    <button
      type="button"
      aria-label="Recolher ou expandir o menu"
      onClick={() => {
        const raiz = document.documentElement;
        const recolhido = raiz.dataset.menu === 'recolhido';
        if (recolhido) delete raiz.dataset.menu;
        else raiz.dataset.menu = 'recolhido';

        try {
          localStorage.setItem('psy-menu', recolhido ? 'aberto' : 'recolhido');
        } catch {
          /* Navegação anônima com armazenamento bloqueado. O menu
             recolhe do mesmo jeito; só não lembra na próxima visita. */
        }
      }}
      className="flex h-10 w-10 flex-none items-center justify-center rounded-xl border border-fio text-cinza transition-colors hover:bg-white/5 hover:text-neve"
    >
      {/* Três traços que viram seta no modo recolhido, por CSS. Ícone
          em SVG inline: uma requisição a menos e ele herda a cor. */}
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
        <path
          d="M2 4h14M2 9h14M2 14h14"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}
