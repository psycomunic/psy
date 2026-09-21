import Image from 'next/image';
import { vitrineDaCapa } from '@/conteudo/trabalhos';

/**
 * As lojas na abertura.
 *
 * ============================================================
 * ERA UMA FITA EM MOVIMENTO, E O MOVIMENTO ERA O DEFEITO
 * ============================================================
 * Duas colunas rolavam em sentidos opostos, sem parar. O topo de cada
 * coluna caía no meio de um cartão, e como as duas andavam em ritmos
 * diferentes, os dois cortes nunca coincidiam: a borda de cima era
 * uma linha quebrada que mudava a cada quadro.
 *
 * Isso foi tratado duas vezes como problema de alinhamento, primeiro
 * tirando uma margem negativa que tinha sobrado de quando eram três
 * colunas. A margem era um defeito de verdade, e consertá-la não
 * resolveu nada de visível, porque a causa era outra: fita que anda
 * não tem borda superior. Um degradê no topo disfarçava o corte, e
 * disfarce não é alinhamento.
 *
 * Agora são quatro cartões parados numa grade 2x2. A borda de cima é
 * reta e começa na mesma linha do texto ao lado.
 *
 * ============================================================
 * O MOVIMENTO NÃO SE PERDEU: MUDOU DE GATILHO
 * ============================================================
 * Cada cartão percorre a página inteira da loja quando o cursor
 * entra. É o mesmo efeito da galeria lá embaixo, e é melhor aqui:
 * antes a página se mexia sozinha e ninguém controlava; agora quem
 * quer ver a loja inteira passa o mouse e vê.
 *
 * `--percurso` é quanto a imagem sobe: a altura dela menos a altura
 * da janela. Sai da proporção real do arquivo, e não de um número
 * chutado, senão a página de 1563px pararia no meio e a de 2547px
 * sobraria imagem sem mostrar.
 */
const JANELA = 3 / 4;

export function ColunasDeSites() {
  /* Quatro, e não cinco: 2x2 fecha retângulo. Cinco deixaria um
     buraco numa das colunas, que é exatamente o que esta seção
     estava tentando parar de fazer. */
  const cartoes = vitrineDaCapa.slice(0, 4);

  return (
    <>
      {cartoes.map((t) => {
        /* Altura da imagem quando ela é desenhada na largura do
           cartão, em unidades de "largura do cartão". */
        const altura = t.altura / t.largura;
        const percurso = Math.max(0, altura - JANELA);

        return (
          <li
            key={t.arquivo}
            className="vitrine-capa group relative aspect-[3/4] overflow-hidden rounded-xl border border-fio bg-papel-alt"
            style={{ ['--percurso' as string]: `${(percurso / JANELA) * 100}%` }}
          >
            <Image
              src={`/imagens/sites/${t.arquivo}`}
              alt={`Loja ${t.nome}, criada pela Psy Comunic`}
              width={t.largura}
              height={t.altura}
              sizes="(max-width: 640px) 44vw, (max-width: 1024px) 38vw, 22vw"
              priority
              className="absolute inset-x-0 top-0 w-full"
            />
            <span className="sr-only">{t.nome}</span>
          </li>
        );
      })}

      <style>{`
        .vitrine-capa img {
          height: auto;
          transition: transform 6s linear;
          will-change: transform;
        }
        .vitrine-capa:hover img,
        .vitrine-capa:focus-within img {
          transform: translateY(calc(-1 * var(--percurso)));
        }
        /* Quem pediu menos movimento vê o topo de cada loja, parado,
           que é o que identifica a loja de qualquer jeito. */
        @media (prefers-reduced-motion: reduce) {
          .vitrine-capa img { transition: none; }
          .vitrine-capa:hover img,
          .vitrine-capa:focus-within img { transform: none; }
        }
      `}</style>
    </>
  );
}
