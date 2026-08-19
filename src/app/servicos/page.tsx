import type { Metadata } from 'next';
import Link from 'next/link';
import { Casca, TopoPagina, ChamadaFinal, secao, canonical } from '@/componentes/Casca';
import { IconeFrente } from '@/componentes/IconeFrente';
import { frentes, resultados } from '@/conteudo/frentes';
import { urlAbsoluta } from '@/conteudo/site';

export const metadata: Metadata = {
  title: 'Serviços para e-commerce: as quatro frentes',
  description:
    'As quatro frentes que decidem se a visita da sua loja vira pedido. Gestão, tecnologia, tráfego pago e atendimento com logística, rodando junto.',
  ...canonical('/servicos'),
  openGraph: { url: urlAbsoluta('/servicos'), type: 'website' },
};

export default function Servicos() {
  return (
    <Casca>
      <TopoPagina
        rotulo="Serviços"
        titulo={<>Quatro frentes, uma operação só.</>}
        texto="Tráfego não paga boleto: operação paga. A Psy Comunic trabalha gestão, tecnologia, marketing e atendimento com logística ao mesmo tempo, porque é o conjunto que faz um e-commerce vender."
        trilha={[]}
      />

      <section className="py-12 md:py-16">
        <div className={secao}>
          <div className="grid gap-6 lg:grid-cols-2">
            {frentes.map((f, i) => (
              <Link
                key={f.slug}
                href={`/servicos/${f.slug}`}
                className="cartao group relative overflow-hidden p-9 transition-all duration-500 hover:-translate-y-1 hover:border-magenta/40 md:p-11"
              >
                <span
                  aria-hidden
                  className="brilho-magenta pointer-events-none absolute -right-24 -top-24 h-72 w-72 opacity-0 transition-opacity duration-500 group-hover:opacity-60"
                />
                <div className="relative flex items-start justify-between gap-6">
                  <IconeFrente slug={f.slug} className="h-9 w-9 text-magenta-texto transition-transform duration-500 group-hover:scale-110" />
                  <span className="tabular font-mono text-xs text-cinza">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>
                <h2 className="relative mt-8 font-display text-sub font-extrabold tracking-[-0.035em]">
                  {f.nome}
                </h2>
                <p className="relative mt-3 max-w-[42ch] text-neve">{f.resumo}</p>
                <ul className="relative mt-7 space-y-2.5 border-t border-fio pt-7">
                  {f.contribuicoes.slice(0, 4).map((c) => (
                    <li key={c} className="flex gap-3 text-sm leading-relaxed text-cinza">
                      <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-magenta" />
                      {c}
                    </li>
                  ))}
                </ul>
                <span className="relative mt-8 inline-flex items-center gap-2 text-sm font-semibold text-magenta-texto">
                  Ver a frente de {f.nome}
                  <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-fio bg-marinho-fundo py-20 md:py-24">
        <div className={secao}>
          <p className="flex items-center gap-3 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-magenta-texto">
            <span aria-hidden className="h-px w-8 bg-magenta" />
            O que sai disso
          </p>
          <h2 className="mt-5 max-w-[16ch] font-display text-titulo font-extrabold tracking-[-0.035em]">
            Quatro resultados, não quatro relatórios.
          </h2>
          <ol className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {resultados.map((r, i) => (
              <li key={r} className="border-t border-fio pt-7">
                <span className="tabular font-display text-3xl font-extrabold tracking-[-0.04em] text-magenta-texto">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <p className="mt-4 text-lg leading-snug text-neve">{r}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <ChamadaFinal />
    </Casca>
  );
}
