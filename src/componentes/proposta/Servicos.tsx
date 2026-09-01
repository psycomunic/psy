import { Slide, Bloco } from './Slide';

/**
 * Os slides da proposta de serviço avulso.
 *
 * ============================================================
 * POR QUE ISTO DEVOLVE UM ARRAY, E NÃO UM FRAGMENTO
 * ============================================================
 * O `Deck` fatia a apresentação pelos FILHOS DIRETOS que recebe. Um
 * fragmento com quatro slides dentro conta como UM filho, e os quatro
 * viram uma tela só.
 *
 * Foi exatamente o que aconteceu: no telefone, a tela do serviço tinha
 * quase três mil pixels de altura e engolia a conta e as condições. A
 * apresentação deixava de ser uma apresentação no meio dela mesma.
 *
 * Array funciona porque `Children.toArray` achata array aninhado. É a
 * mesma armadilha que o comentário do `Marcas.tsx` já avisava, e eu
 * caí nela.
 *
 * ============================================================
 * ONDE MORA A ESCOLHA DO COMPLEMENTO
 * ============================================================
 * Numa tela só, a da conta. Antes ela estava também no slide do próprio
 * complemento, o que obrigava os quatro slides a dividir estado e foi o
 * motivo de eles terem virado um fragmento.
 *
 * Não se perde nada: é na tela da conta que a pessoa vê o total mudar,
 * que é a informação que faz a escolha ter sentido.
 */

export type ServicoNoSlide = {
  id: string;
  nome: string;
  papel: 'principal' | 'complemento';
  paraQuem: string;
  promessa: string;
  entregas: string[];
  naoInclui: string[];
  fee: number;
  feeTexto: string;
};

/** Título com a última palavra em magenta, como no resto do deck. */
function tituloDoServico(nome: string) {
  const partes = nome.split(' ');
  const ultima = partes.pop();
  return (
    <>
      {partes.join(' ')} <span className="text-magenta-texto">{ultima}.</span>
    </>
  );
}

export function SlideDeUmServico({
  s,
  precoNaConta,
}: {
  s: ServicoNoSlide;
  precoNaConta?: boolean;
}) {
  return (
    <Slide
      rotulo={s.papel === 'complemento' ? 'Complemento, se você quiser' : 'O serviço'}
      titulo={tituloDoServico(s.nome)}
    >
      <div className="grid gap-5 sm:gap-7 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-cinza">
            {s.paraQuem}
          </p>
          <p className="mt-3 max-w-[54ch] text-sm leading-relaxed text-neve sm:mt-4 sm:text-[1.05rem]">
            {s.promessa}
          </p>

          {precoNaConta ? null : (
            <p className="tabular mt-4 font-display text-2xl font-extrabold tracking-[-0.04em] text-branco sm:mt-6 sm:text-4xl">
              {s.feeTexto}
              <span className="ml-2 text-sm font-normal text-cinza sm:text-base">por mês</span>
            </p>
          )}

          {s.papel === 'complemento' ? (
            <p className="mt-4 max-w-[46ch] text-sm leading-relaxed text-cinza">
              Este é opcional. Você decide se entra na tela da conta, mais adiante.
            </p>
          ) : null}
        </div>

        <div className="space-y-4 sm:space-y-5">
          <Bloco>
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-magenta-texto">
              O que entra
            </p>
            <ul className="mt-3 space-y-2 sm:mt-4 sm:space-y-3">
              {s.entregas.map((e) => (
                <li key={e} className="flex gap-3 text-sm leading-relaxed text-neve">
                  <span aria-hidden className="mt-0.5 flex-none text-magenta-texto">●</span>
                  {e}
                </li>
              ))}
            </ul>
          </Bloco>

          {/* O que NÃO entra, dito aqui e não na primeira cobrança de
              algo que o cliente achava incluso. */}
          <Bloco>
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-cinza">
              O que não entra
            </p>
            <ul className="mt-3 space-y-2 sm:mt-4 sm:space-y-3">
              {s.naoInclui.map((e) => (
                <li key={e} className="flex gap-3 text-sm leading-relaxed text-cinza">
                  <span aria-hidden className="mt-0.5 flex-none">·</span>
                  {e}
                </li>
              ))}
            </ul>
          </Bloco>
        </div>
      </div>
    </Slide>
  );
}

export function SlideSempre({
  sempre,
  complementos,
}: {
  sempre: string[];
  complementos: string[];
}) {
  return (
    <Slide
      rotulo="Em qualquer caso"
      titulo={
        <>
          O que vale <span className="text-magenta-texto">sempre.</span>
        </>
      }
    >
      <ul className="grid gap-4 sm:grid-cols-2 sm:gap-5">
        {sempre.map((c) => (
          <li key={c} className="flex gap-3 leading-relaxed text-neve sm:text-[1.05rem]">
            <span aria-hidden className="mt-1 flex-none text-magenta-texto">●</span>
            {c}
          </li>
        ))}
      </ul>

      {complementos.length > 0 ? (
        <p className="mt-8 max-w-[62ch] text-sm leading-relaxed text-cinza">
          {complementos.join(' e ')} entra como complemento, é opcional, e pode sair depois
          sem mexer no resto.
        </p>
      ) : null}
    </Slide>
  );
}
