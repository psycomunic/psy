import type { Metadata } from 'next';
import { Casca, TopoPagina, ChamadaFinal, secao, canonical } from '@/componentes/Casca';
import { Botao } from '@/componentes/Botao';
import { planos, recursos, ctaPlano } from '@/conteudo/planos';
import { urlAbsoluta } from '@/conteudo/site';

export const metadata: Metadata = {
  title: 'Planos de tráfego pago e operação',
  description:
    'Saturno, Falcon e Apollo: três formas de colocar a operação para rodar. Compare gestão de ADS, campanhas, planejamento e acompanhamento em cada plano.',
  ...canonical('/planos'),
  openGraph: { url: urlAbsoluta('/planos'), type: 'website' },
};

/* Marca visual de incluído e não incluído. Um "sim" e um "nao" escritos
   obrigariam a ler célula por célula; o símbolo se lê de relance.
   aria-label porque um símbolo sozinho não diz nada a leitor de tela. */
function Marca({ valor }: { valor: boolean | string }) {
  if (valor === true) {
    return <span className="text-magenta-texto" aria-label="Incluído">✓</span>;
  }
  if (valor === false) {
    return <span className="text-cinza/50" aria-label="Não incluído">—</span>;
  }
  return <span className="text-neve">{valor}</span>;
}

export default function Planos() {
  const confirmados = recursos.filter((r) => !r.confirmar);

  return (
    <Casca>
      <TopoPagina
        rotulo="Planos"
        titulo={<>Três formas de colocar a operação para rodar.</>}
        texto="A diferença entre os planos não é volume de relatório: é quanto da operação entra junto. Os valores saem na proposta, depois do diagnóstico, porque dependem do tamanho da sua loja."
        trilha={[]}
      />

      <section className="py-12 md:py-16">
        <div className={secao}>
          <div className="grid items-start gap-6 lg:grid-cols-3">
            {planos.map((p) => (
              <div
                key={p.id}
                className={
                  'cartao relative p-9 md:p-10 ' +
                  (p.destaque
                    ? 'border-magenta/45 lg:-translate-y-4 lg:shadow-[0_30px_80px_-30px_rgba(228,21,95,0.55)]'
                    : '')
                }
              >
                {p.destaque ? (
                  <span
                    aria-hidden
                    className="brilho-magenta pointer-events-none absolute -top-32 left-1/2 h-72 w-96 -translate-x-1/2 opacity-45"
                  />
                ) : null}

                {p.selo ? (
                  <span className="relative inline-block rounded-full bg-magenta px-3.5 py-1.5 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-branco">
                    {p.selo}
                  </span>
                ) : (
                  <span aria-hidden className="relative block h-[1.9rem]" />
                )}

                <h2 className="relative mt-6 font-display text-sub font-extrabold tracking-[-0.035em]">
                  {p.nome}
                </h2>

                <dl className="relative mt-8 space-y-4 border-t border-fio pt-8">
                  {confirmados.map((r) => (
                    <div key={r.nome} className="flex items-baseline justify-between gap-4">
                      <dt className="text-sm text-cinza">{r.nome}</dt>
                      <dd className="shrink-0 text-right text-sm font-semibold">
                        <Marca valor={r.valores[p.id]} />
                      </dd>
                    </div>
                  ))}
                </dl>

                <div className="relative mt-9">
                  <Botao
                    href="/contato"
                    variante={p.destaque ? 'primario' : 'secundario'}
                    className="w-full"
                  >
                    {ctaPlano}
                  </Botao>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-fio bg-marinho-fundo py-20 md:py-24">
        <div className={secao}>
          <h2 className="font-display text-titulo font-extrabold tracking-[-0.035em]">
            Comparativo completo
          </h2>
          <p className="mt-4 max-w-[58ch] leading-relaxed text-cinza">
            Todas as linhas dos três planos, lado a lado.
          </p>

          {/* A rolagem horizontal fica NESTE container, e não no body.
              Tabela larga precisa rolar dentro dela mesma, senão empurra
              a página inteira de lado no celular. */}
          <div className="mt-10 overflow-x-auto rounded-[var(--raio)] border border-fio">
            <table className="w-full min-w-[46rem] border-collapse text-left">
              <caption className="sr-only">
                Comparativo de recursos entre os planos Saturno, Falcon e Apollo
              </caption>
              <thead>
                <tr className="border-b border-fio bg-white/[0.03]">
                  <th
                    scope="col"
                    className="px-6 py-5 font-mono text-[0.68rem] uppercase tracking-[0.16em] text-cinza"
                  >
                    Recurso
                  </th>
                  {planos.map((p) => (
                    <th
                      key={p.id}
                      scope="col"
                      className="px-6 py-5 font-display text-lg font-bold tracking-[-0.02em]"
                    >
                      {p.nome}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recursos.map((r) => (
                  <tr key={r.nome} className="border-b border-fio last:border-0">
                    <th scope="row" className="px-6 py-4 text-sm font-normal text-neve">
                      {r.nome}
                    </th>
                    {planos.map((p) => (
                      <td key={p.id} className="px-6 py-4 text-sm">
                        <Marca valor={r.valores[p.id]} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-6 max-w-[64ch] text-sm leading-relaxed text-cinza">
            O escopo exato de cada linha é detalhado na proposta, depois do diagnóstico.
          </p>
        </div>
      </section>

      <ChamadaFinal
        titulo="Não sabe qual plano cabe na sua operação?"
        texto="O diagnóstico gratuito aponta o que está travando o faturamento hoje. A recomendação de plano sai daí, e não de tabela."
      />
    </Casca>
  );
}
