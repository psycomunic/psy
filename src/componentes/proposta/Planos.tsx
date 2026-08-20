import { blocos, fichas, PLANOS, feeEmReais, sempreIncluso, type Plano } from '@/dados/planos';

/**
 * A tabela de planos, dentro da proposta.
 *
 * Componente de SERVIDOR. Ele importa `@/dados/planos`, que é
 * `server-only` porque tem preço: se algum dia isto virar `use client`,
 * o build quebra, e é para quebrar mesmo.
 *
 * Três decisões de leitura:
 *
 * O plano recomendado vem MARCADO. Uma proposta com três colunas iguais
 * empurra a decisão de volta para o cliente, que foi justamente o que
 * ele contratou a agência para não ter que fazer sozinho.
 *
 * Incluído e não incluído saem com SÍMBOLO e TEXTO, nunca só com cor.
 * A tabela é lida em telefone, impressa em preto e branco e mandada em
 * print — e cor sozinha some nas três.
 *
 * A tabela rola sozinha na horizontal, dentro do próprio quadro. Sem
 * isso, a página inteira ganharia barra lateral no telefone.
 */

const SIM = '#4ADE80';
const NAO = '#93A0BC';

function Celula({ valor, forte }: { valor: boolean | string; forte: boolean }) {
  if (valor === true) {
    return (
      <span className="inline-flex items-center gap-2 text-sm" style={{ color: SIM }}>
        <span aria-hidden>✓</span>
        <span className={forte ? 'font-semibold' : ''}>Incluído</span>
      </span>
    );
  }

  if (valor === false) {
    return (
      <span className="inline-flex items-center gap-2 text-sm" style={{ color: NAO }}>
        <span aria-hidden>—</span>
        <span>Não incluído</span>
      </span>
    );
  }

  return (
    <span className={'text-sm text-neve ' + (forte ? 'font-semibold text-branco' : '')}>
      {valor}
    </span>
  );
}

export function Planos({ recomendado }: { recomendado?: Plano }) {
  const alvo = recomendado ?? 'falcon';

  return (
    <section aria-labelledby="planos-titulo" className="mt-16">
      <h2
        id="planos-titulo"
        className="font-display text-2xl font-extrabold tracking-[-0.03em] md:text-3xl"
      >
        Planos
      </h2>
      <p className="mt-3 max-w-[68ch] leading-relaxed text-neve">
        Cada plano contém o anterior inteiro. O que muda é até onde a Psy Comunic entra na
        operação: só a mídia, a mídia mais os canais próprios, ou tudo.
      </p>

      {/* Os três cartões: é o que se lê antes de abrir a tabela. */}
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {PLANOS.map((p) => {
          const f = fichas[p];
          const escolhido = p === alvo;

          return (
            <article
              key={p}
              className={
                'relative flex flex-col rounded-2xl border p-6 ' +
                (escolhido
                  ? 'border-magenta bg-magenta/[0.07]'
                  : 'border-white/10 bg-white/[0.02]')
              }
            >
              {escolhido ? (
                <p className="absolute -top-3 left-6 rounded-full bg-magenta px-3 py-1 font-mono text-[0.56rem] uppercase tracking-[0.14em] text-branco">
                  Recomendado para você
                </p>
              ) : f.selo ? (
                <p className="absolute -top-3 left-6 rounded-full border border-white/15 bg-marinho-fundo px-3 py-1 font-mono text-[0.56rem] uppercase tracking-[0.14em] text-cinza">
                  {f.selo}
                </p>
              ) : null}

              <h3 className="font-display text-2xl font-extrabold tracking-[-0.03em]">
                {f.nome}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-cinza">{f.paraQuem}</p>

              <p className="mt-5 flex items-baseline gap-1.5">
                <span className="font-display text-3xl font-extrabold tracking-[-0.04em] text-branco">
                  {feeEmReais(p)}
                </span>
                <span className="text-sm text-cinza">/mês</span>
              </p>
              <p className="mt-1 font-mono text-[0.58rem] uppercase tracking-[0.12em] text-cinza">
                fee da agência · verba de mídia à parte
              </p>

              <p className="mt-5 border-t border-white/10 pt-5 text-sm leading-relaxed text-neve">
                {f.promessa}
              </p>

              <p className="mt-auto pt-5 font-mono text-[0.58rem] uppercase tracking-[0.12em] text-cinza">
                {f.indicadoPara}
              </p>
            </article>
          );
        })}
      </div>

      {/* O comparativo, em blocos. */}
      <div className="mt-10 space-y-8">
        {blocos.map((bloco) => (
          <div key={bloco.titulo}>
            <h3 className="font-display text-lg font-bold tracking-[-0.02em] text-branco">
              {bloco.titulo}
            </h3>
            <p className="mt-1.5 max-w-[70ch] text-sm text-cinza">{bloco.apoio}</p>

            <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10">
              <table className="w-full min-w-[720px] border-collapse text-left">
                <caption className="sr-only">
                  {bloco.titulo}: o que cada plano entrega
                </caption>
                <thead>
                  <tr className="bg-white/[0.03]">
                    <th
                      scope="col"
                      className="w-[30%] px-5 py-3 font-mono text-[0.58rem] uppercase tracking-[0.14em] text-cinza"
                    >
                      Entrega
                    </th>
                    {PLANOS.map((p) => (
                      <th
                        key={p}
                        scope="col"
                        className={
                          'px-5 py-3 font-display text-sm font-bold tracking-[-0.01em] ' +
                          (p === alvo ? 'bg-magenta/10 text-branco' : 'text-neve')
                        }
                      >
                        {fichas[p].nome}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bloco.linhas.map((l) => (
                    <tr key={l.nome}>
                      <th
                        scope="row"
                        className="border-t border-white/10 px-5 py-4 align-top font-normal"
                      >
                        <span className="font-semibold text-branco">{l.nome}</span>
                        {l.porque ? (
                          <span className="mt-1 block text-xs leading-relaxed text-cinza">
                            {l.porque}
                          </span>
                        ) : null}
                      </th>
                      {PLANOS.map((p) => (
                        <td
                          key={p}
                          className={
                            'border-t border-white/10 px-5 py-4 align-top ' +
                            (p === alvo ? 'bg-magenta/[0.06]' : '')
                          }
                        >
                          <Celula valor={l.valores[p]} forte={p === alvo} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* Fora da tabela de propósito: linha marcada nas três colunas não
          diferencia nada, mas some da proposta se não for dita. */}
      <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
        <h3 className="font-display text-lg font-bold tracking-[-0.02em] text-branco">
          Em todos os planos
        </h3>
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {sempreIncluso.map((item) => (
            <li key={item} className="flex gap-3 text-sm leading-relaxed text-neve">
              <span aria-hidden className="mt-0.5" style={{ color: SIM }}>
                ✓
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
