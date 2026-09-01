import { Slide, Bloco } from './Slide';

/**
 * O slide da proposta de serviço avulso.
 *
 * ============================================================
 * POR QUE ELE NÃO É O SLIDE DE PLANO COM OUTRO TÍTULO
 * ============================================================
 * O slide de plano compara degraus: existe um acima e um abaixo, e a
 * pergunta que ele responde é "por que este e não o outro". Serviço
 * avulso não tem degrau. A pergunta aqui é diferente: "o que eu recebo,
 * e o que não vem junto".
 *
 * Por isso cada serviço traz a lista do que entrega E a do que não
 * cobre. Dizer o que não está incluso antes de assinar custa uma linha;
 * descobrir depois custa a relação.
 */

export type ServicoNoSlide = {
  id: string;
  nome: string;
  papel: 'principal' | 'complemento';
  paraQuem: string;
  promessa: string;
  entregas: string[];
  naoInclui: string[];
  feeTexto: string;
};

export function SlideServicos({
  servicos,
  totalTexto,
  sempre,
  precoNaConta,
}: {
  servicos: ServicoNoSlide[];
  totalTexto: string;
  sempre: string[];
  /* Quando existe a tabela de etapas, o preço aparece lá com as
     condições do período. Repetir aqui daria dois números para a mesma
     coisa, e o cliente perguntaria qual vale. */
  precoNaConta?: boolean;
}) {
  const principal = servicos.find((s) => s.papel === 'principal') ?? servicos[0];
  const complementos = servicos.filter((s) => s !== principal);

  return (
    <>
      {servicos.map((s) => (
        <Slide
          key={s.id}
          rotulo={s.papel === 'complemento' ? 'Complemento' : 'O serviço'}
          titulo={
            <>
              {s.nome.split(' ').slice(0, -1).join(' ')}{' '}
              <span className="text-magenta-texto">
                {s.nome.split(' ').slice(-1)}.
              </span>
            </>
          }
        >
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
            <div>
              <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-cinza">
                {s.paraQuem}
              </p>
              <p className="mt-5 max-w-[54ch] text-guia leading-relaxed text-neve">
                {s.promessa}
              </p>

              {precoNaConta ? null : (
                <p className="tabular mt-8 font-display text-4xl font-extrabold tracking-[-0.04em] text-branco">
                  {s.feeTexto}
                  <span className="ml-2 text-base font-normal text-cinza">por mês</span>
                </p>
              )}
            </div>

            <div className="space-y-8">
              <Bloco>
                <p className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-magenta-texto">O que entra</p>
                <div className="mt-4">
                <ul className="space-y-3">
                  {s.entregas.map((e) => (
                    <li key={e} className="flex gap-3 text-sm leading-relaxed text-neve">
                      <span aria-hidden className="mt-0.5 flex-none text-magenta-texto">
                        ●
                      </span>
                      {e}
                    </li>
                  ))}
                </ul>
                </div>
              </Bloco>

              {/* O que NÃO entra, dito aqui e não na primeira cobrança
                  de algo que o cliente achava incluso. */}
              <Bloco>
                <p className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-cinza">O que não entra</p>
                <div className="mt-4">
                <ul className="space-y-3">
                  {s.naoInclui.map((e) => (
                    <li key={e} className="flex gap-3 text-sm leading-relaxed text-cinza">
                      <span aria-hidden className="mt-0.5 flex-none">—</span>
                      {e}
                    </li>
                  ))}
                </ul>
                </div>
              </Bloco>
            </div>
          </div>
        </Slide>
      ))}

      {/* A soma só existe quando há mais de um serviço. Com um só, ela
          repetiria o número do slide anterior. */}
      {servicos.length > 1 && !precoNaConta ? (
        <Slide
          rotulo="A conta"
          titulo={
            <>
              Somando <span className="text-magenta-texto">tudo.</span>
            </>
          }
        >
          <ul className="divide-y divide-fio border-y border-fio">
            {servicos.map((s) => (
              <li key={s.id} className="flex flex-wrap items-baseline justify-between gap-4 py-5">
                <span className="text-guia text-neve">{s.nome}</span>
                <span className="tabular text-guia font-semibold text-branco">
                  {s.feeTexto}
                </span>
              </li>
            ))}
          </ul>

          <p className="mt-8 flex flex-wrap items-baseline justify-between gap-4">
            <span className="font-display text-xl font-bold tracking-[-0.02em]">
              Total por mês
            </span>
            <span className="tabular font-display text-4xl font-extrabold tracking-[-0.04em] text-magenta-texto">
              {totalTexto}
            </span>
          </p>

          <p className="mt-8 max-w-[60ch] text-sm leading-relaxed text-cinza">
            A verba de mídia não está aqui e nunca entra nesta soma. Ela é sua, vai direto
            para o Google e para a Meta, e você define quanto investir.
          </p>
        </Slide>
      ) : null}

      <Slide
        rotulo="Em qualquer caso"
        titulo={
          <>
            O que vale <span className="text-magenta-texto">sempre.</span>
          </>
        }
      >
        <ul className="grid gap-5 sm:grid-cols-2">
          {sempre.map((c) => (
            <li key={c} className="flex gap-3 text-guia leading-relaxed text-neve">
              <span aria-hidden className="mt-1 flex-none text-magenta-texto">●</span>
              {c}
            </li>
          ))}
        </ul>

        {complementos.length > 0 ? (
          <p className="mt-10 max-w-[62ch] text-sm leading-relaxed text-cinza">
            {complementos.map((c) => c.nome).join(' e ')} entra como complemento de{' '}
            {principal.nome.toLowerCase()}, e pode sair depois sem mexer no resto.
          </p>
        ) : null}
      </Slide>
    </>
  );
}
