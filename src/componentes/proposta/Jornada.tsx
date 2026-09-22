import { jornada, promessaCompleta, porQueCompleta } from '@/conteudo/jornada';
import { Slide, Bloco } from './Slide';

/**
 * O slide da solução completa.
 *
 * ============================================================
 * POR QUE ELE VEM LOGO DEPOIS DA CAPA
 * ============================================================
 * É o enquadramento de tudo que vem depois. Sem ele, a proposta abre
 * falando dos problemas da loja e emenda em planos mensais, e o leitor
 * conclui sozinho que a Psy Comunic é mais uma agência de mídia com
 * mensalidade. A promessa inteira precisa chegar antes do preço.
 *
 * Lê do MESMO arquivo que a home: `src/conteudo/jornada.ts`. Escrita
 * duas vezes, a promessa diverge na primeira correção feita só de um
 * lado, e aí o cliente lê uma coisa no site e outra na proposta.
 *
 * Um slide devolve UM elemento, nunca um fragmento: `Children.toArray`
 * achata fragmentos e cada pedaço viraria uma tela.
 */

export function SlideJornada() {
  return (
    <Slide
      rotulo="Solução completa"
      titulo={
        <>
          Construímos a loja. E ficamos para{' '}
          <span className="text-magenta-texto">fazer ela vender.</span>
        </>
      }
      apoio={promessaCompleta}
    >
      <div className="mt-2 grid gap-4 lg:grid-cols-2">
        {jornada.map((fase, i) => (
          <Bloco key={fase.id} destaque={i === 1} className="flex h-full flex-col">
            <div className="flex flex-wrap items-center gap-2.5">
              <span
                className={
                  'rounded-full px-3 py-1 font-mono text-[0.7rem] uppercase tracking-[0.14em] ' +
                  (i === 1 ? 'bg-magenta text-branco' : 'border border-fio text-magenta-texto')
                }
              >
                {fase.etiqueta}
              </span>
            </div>

            <h3 className="mt-4 font-display text-sub font-extrabold tracking-[-0.035em]">
              {fase.titulo}
            </h3>

            <p className="mt-1.5 font-mono text-[0.7rem] uppercase tracking-[0.12em] text-cinza">
              {fase.entrega}
            </p>

            <p className="mt-4 text-sm leading-relaxed text-neve">{fase.resumo}</p>

            <ul className="mt-5 space-y-2.5 border-t border-fio pt-5">
              {fase.itens.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-snug text-neve">
                  <span aria-hidden className="mt-0.5 flex-none text-[0.75rem] text-magenta-texto">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </Bloco>
        ))}
      </div>
    </Slide>
  );
}

/**
 * Por que "completa" muda alguma coisa.
 *
 * Slide separado porque "solução completa" é o que toda agência
 * escreve. Sem dizer o que a alternativa custa, a frase não significa
 * nada, e o cliente já ouviu ela de outros três.
 */
export function SlidePorQueCompleta() {
  return (
    <Slide
      rotulo="A diferença"
      titulo={
        <>
          O que muda em ter <span className="text-magenta-texto">um responsável só.</span>
        </>
      }
      apoio="Contratar em pedaços parece mais barato até a primeira semana em que a venda cai e ninguém assume."
    >
      <ol className="mt-2 grid gap-3 lg:grid-cols-3">
        {porQueCompleta.map((item, i) => (
          <li key={item.titulo}>
            <Bloco className="flex h-full flex-col">
              <span className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-cinza">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-4 font-display text-lg font-bold leading-snug tracking-[-0.02em]">
                {item.titulo}
              </h3>
              <p className="mt-3.5 text-sm leading-relaxed text-neve">{item.texto}</p>
            </Bloco>
          </li>
        ))}
      </ol>
    </Slide>
  );
}
