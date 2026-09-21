import type { ReactNode } from 'react';

/**
 * O cabeçalho que abre cada seção.
 *
 * ============================================================
 * O PROBLEMA QUE ELE RESOLVE
 * ============================================================
 * Toda seção repetia a mesma forma: rótulo pequeno, título grande
 * numa coluna de 52ch, parágrafo embaixo. Onze vezes seguidas. Como
 * o título nunca passava da metade da largura, a direita ficava vazia
 * em TODAS elas, e a página inteira virava uma coluna de texto com
 * muito branco do lado, sem hierarquia entre um bloco e o próximo.
 *
 * ============================================================
 * COMO REVISTA RESOLVE
 * ============================================================
 * Fio de abertura na largura toda, com o número do capítulo e o
 * assunto nas pontas. Abaixo dele, título à esquerda e a linha de
 * apoio à direita, na mesma altura. O fio dá a régua, o número dá a
 * contagem, e o texto de apoio ocupa a metade que estava vazia.
 *
 * `n` é o índice impresso, e é escrito à mão em cada seção de
 * propósito: derivar de um contador automático amarraria a numeração
 * à ORDEM do JSX, e mover uma seção renumeraria todas as outras sem
 * ninguém perceber.
 */
export function CabecalhoDeSecao({
  n,
  rotulo,
  titulo,
  apoio,
  id,
}: {
  n: string;
  rotulo: string;
  titulo: ReactNode;
  apoio?: ReactNode;
  id?: string;
}) {
  return (
    <header>
      {/* O fio e as pontas. `items-baseline` alinha o número ao rótulo
          pela base da letra, e não pela caixa: com tamanhos diferentes,
          alinhar pela caixa deixa o número flutuando. */}
      <div className="flex items-baseline justify-between gap-6 border-t border-fio pt-4">
        <p className="text-[13px] font-semibold text-acento">{rotulo}</p>
        <p className="tabular font-display text-[13px] font-bold text-tinta-fraca">{n}</p>
      </div>

      <div className="mt-8 grid gap-x-16 gap-y-6 md:mt-10 lg:grid-cols-[1.15fr_1fr] lg:items-end">
        <h2 id={id} className="font-display text-titulo titulo-revista">
          {titulo}
        </h2>
        {apoio ? (
          <div className="max-w-[52ch] leading-relaxed text-tinta-fraca lg:pb-2">{apoio}</div>
        ) : null}
      </div>
    </header>
  );
}
