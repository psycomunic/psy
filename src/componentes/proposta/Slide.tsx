import type { ReactNode } from 'react';

/**
 * O gabarito de um slide.
 *
 * ============================================================
 * POR QUE UM GABARITO, E NÃO CADA SLIDE LIVRE
 * ============================================================
 * Apresentação boa tem BATIDA: o rótulo cai sempre na mesma altura, o
 * título sempre no mesmo tamanho, o corpo sempre começa na mesma linha.
 * É isso que faz doze telas parecerem um documento só em vez de doze
 * páginas soltas.
 *
 * A primeira versão deixava cada slide montar o próprio cabeçalho, e o
 * resultado foi exatamente o previsível: espaçamentos diferentes,
 * títulos de tamanhos diferentes, e a sensação de coisa remendada.
 *
 * ============================================================
 * A ALTURA
 * ============================================================
 * O slide é uma grade de duas faixas: cabeçalho e corpo. O corpo leva
 * `min-h-0` porque, sem isso, um filho com rolagem própria estoura a
 * grade em vez de rolar — é o comportamento padrão do CSS grid, e é o
 * erro que faz o fim de uma lista longa simplesmente não existir no
 * telefone.
 */
export function Slide({
  rotulo,
  titulo,
  apoio,
  children,
  /** Slide de abertura e de fecho respiram mais e centram na vertical. */
  centrado = false,
}: {
  rotulo?: string;
  titulo?: ReactNode;
  apoio?: ReactNode;
  children?: ReactNode;
  centrado?: boolean;
}) {
  return (
    <div
      className={
        'flex min-h-full w-full flex-col gap-7 sm:gap-9 ' +
        (centrado ? 'justify-center' : 'justify-start')
      }
    >
      {rotulo || titulo || apoio ? (
        <header className="flex-none">
          {rotulo ? (
            <p className="flex items-center gap-3 font-mono uppercase tracking-[0.2em] text-magenta-texto [font-size:clamp(0.72rem,2.4vw,0.8rem)]">
              <span aria-hidden className="h-px w-7 flex-none bg-magenta sm:w-10" />
              {rotulo}
            </p>
          ) : null}

          {titulo ? (
            <h2 className="mt-4 max-w-[17ch] font-display text-titulo font-extrabold tracking-[-0.035em] sm:mt-5">
              {titulo}
            </h2>
          ) : null}

          {apoio ? (
            <p className="mt-4 max-w-[54ch] text-guia leading-relaxed text-neve sm:mt-5">
              {apoio}
            </p>
          ) : null}
        </header>
      ) : null}

      {children ? <div className="min-h-0 flex-1">{children}</div> : null}
    </div>
  );
}

/**
 * Cartão de conteúdo do deck.
 *
 * Usa a mesma `cartao` do site — gradiente de superfície e fio de
 * contorno — em vez de uma borda inventada só aqui. Proposta e site
 * precisam parecer a mesma empresa.
 */
export function Bloco({
  children,
  destaque = false,
  className = '',
}: {
  children: ReactNode;
  destaque?: boolean;
  className?: string;
}) {
  return (
    <div
      className={
        'cartao p-5 sm:p-6 ' +
        (destaque ? 'border-magenta/50 shadow-[0_24px_60px_-30px_rgba(228,21,95,0.6)] ' : '') +
        className
      }
    >
      {/* O fio de luz na aresta superior: é o detalhe que faz o cartão
          parecer iluminado por cima em vez de recortado. */}
      <span aria-hidden className="aresta absolute inset-x-6 top-0 h-px" />
      {children}
    </div>
  );
}
