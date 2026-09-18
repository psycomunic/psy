'use client';

import type { ReactNode } from 'react';

/**
 * Link de WhatsApp que avisa o GA4 de onde a pessoa saiu.
 *
 * ============================================================
 * POR QUE TODO CTA DA PÁGINA PASSA POR AQUI
 * ============================================================
 * A página tem um botão de WhatsApp em quase toda seção, e a mensagem
 * pré-preenchida muda em cada uma. Sem o evento, todos chegam iguais no
 * celular e não dá para saber se o que converte é o bloco de sites ou o
 * de Google Meu Negócio. Com ele, dá para cortar o que não traz nada.
 *
 * ============================================================
 * O EVENTO NUNCA SEGURA O CLIQUE
 * ============================================================
 * `gtag` pode não existir: bloqueador de anúncio, script que não
 * carregou, primeira visita em rede ruim. Por isso a chamada é opcional
 * e o clique NÃO é interceptado. O link é um `<a href>` de verdade, que
 * funciona com o JavaScript quebrado, e o evento é um efeito colateral
 * que pode falhar sem levar a conversão junto.
 *
 * Segurar o clique para "garantir" o disparo é o erro clássico aqui:
 * troca uma métrica por um cliente.
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function LinkWhatsapp({
  href,
  secao,
  pagina,
  children,
  className,
  rotuloAcessivel,
}: {
  href: string;
  /** De qual bloco da página o clique saiu. Vai no evento. */
  secao: string;
  /** Qual página. Permite comparar Bragança com a próxima cidade. */
  pagina: string;
  children: ReactNode;
  className?: string;
  rotuloAcessivel?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      aria-label={rotuloAcessivel}
      className={className}
      onClick={() => {
        window.gtag?.('event', 'clique_whatsapp', { pagina, secao });
      }}
    >
      {children}
    </a>
  );
}
