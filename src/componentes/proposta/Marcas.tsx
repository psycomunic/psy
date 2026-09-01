import Image from 'next/image';
import { logosMarcas } from '@/conteudo/trabalhos';
import { marcasAtendidas, parcerias } from '@/conteudo/prova';
import { Slide } from './Slide';

/**
 * Slide de prova social: com quem a Psy Comunic já trabalhou.
 *
 * ============================================================
 * POR QUE AS LOGOS SÃO DECORATIVAS
 * ============================================================
 * Os arquivos em `public/imagens/marcas/` são numerados, e não existe
 * mapeamento de qual arquivo é qual marca — nem aqui nem na landing
 * page antiga, onde já entravam com `alt` vazio.
 *
 * Inventar o `alt` seria pior que deixá-lo vazio: um leitor de tela
 * anunciaria o nome errado, com a mesma confiança de quem sabe. Então
 * elas entram como `alt=""`, decorativas, e os nomes vão em TEXTO
 * abaixo — onde estão certos e o leitor de tela lê.
 *
 * ============================================================
 * NÚMERO NENHUM AQUI
 * ============================================================
 * A regra do projeto: resultado de cliente só entra com autorização
 * escrita e período de referência declarado. Sem isso, o cliente vira
 * logo na parede, e não estudo de caso. Este slide é logo na parede, de
 * propósito.
 */

/* Um slide devolve UM elemento, e nunca um fragmento: `Children.toArray`
   achata fragmentos e cada pedaço viraria uma tela. */

/**
 * @param apoio a linha sob o título.
 *
 * Ela muda com o tipo de proposta. As marcas SÃO operações de
 * e-commerce, e dizer isso é verdade — mas numa proposta de tráfego
 * para quem vende curso, ou para uma clínica, a frase descreve o
 * negócio de outra pessoa e faz a proposta parecer modelo
 * reaproveitado. O padrão aqui é a versão que serve a qualquer nicho
 * sem deixar de ser verdadeira.
 */
export function SlideMarcas({
  apoio = 'Marcas que já passaram pela operação da Psy Comunic, de portes e segmentos diferentes.',
}: {
  apoio?: string;
} = {}) {
  return (
    <Slide
      rotulo="Quem já passou por aqui"
      titulo={
        <>
          Marcas que <span className="text-magenta-texto">confiaram.</span>
        </>
      }
      apoio={apoio}
    >
      <div className="flex min-h-full flex-col">
        {/* Quatro colunas no telefone, não três: com 28 logos, três
            colunas dão dez fileiras e a grade sai da tela. Quatro
            fecham em sete, e cabe sem rolar. */}
        <ul className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-6 sm:gap-2.5 lg:grid-cols-7">
          {logosMarcas.map((arquivo) => (
            <li
              key={arquivo}
              className="flex aspect-[4/3] items-center justify-center rounded-xl border border-fio bg-white/[0.05] p-2 transition-colors sm:p-2.5"
            >
              <Image
                src={`/imagens/marcas/${arquivo}`}
                alt=""
                width={160}
                height={120}
                /* `sizes` importa aqui: sem ele o Next serve a maior
                   versão para todo mundo, e são 28 arquivos numa página
                   que a maioria vai abrir no 4G. */
                sizes="(max-width: 640px) 22vw, (max-width: 1024px) 15vw, 130px"
                className="h-full w-full object-contain opacity-85"
              />
            </li>
          ))}
        </ul>

        {/* Os nomes, em texto. É aqui que a informação está de verdade. */}
        <p className="mt-6 text-xs leading-relaxed text-cinza sm:text-sm">
          {marcasAtendidas.join(' · ')} e outras.
        </p>

        <div className="mt-auto pt-7">
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-cinza">
            Parcerias e plataformas
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {parcerias.map((p) => (
              <li
                key={p.nome}
                className="rounded-full border border-fio bg-white/[0.05] px-4 py-2 text-xs font-medium text-neve"
              >
                {p.nome}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Slide>
  );
}
