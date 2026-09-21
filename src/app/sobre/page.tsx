import type { Metadata } from 'next';
import { RetratoFundador } from '@/componentes/RetratoFundador';
import { Casca, TopoPagina, ChamadaFinal, secao, canonical } from '@/componentes/Casca';
import { CartaoCredencial } from '@/componentes/CartaoCredencial';
import { marca, credenciais } from '@/conteudo/marca';
import { urlAbsoluta } from '@/conteudo/site';

export const metadata: Metadata = {
  title: 'Sobre a operação e quem está por trás',
  description:
    'Uma operação de crescimento para e-commerce, não uma agência de mídia. Conheça o propósito, os valores e a história de Angelo Garcia, fundador da Psy Comunic.',
  ...canonical('/sobre'),
  openGraph: { url: urlAbsoluta('/sobre'), type: 'profile' },
};


export default function Sobre() {
  return (
    <Casca>
      <TopoPagina
        rotulo="Sobre"
        titulo={<>{marca.posicionamento}</>}
        texto={marca.proposito}
        trilha={[]}
      />

      {/* Quem está por trás */}
      <section className="py-12 md:py-16">
        <div className={secao}>
          <div className="grid gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-start lg:gap-14">
            <RetratoFundador />

            <div>
              <h2 className="font-display text-titulo titulo-revista">
                Construída por quem já esteve do outro lado do balcão.
              </h2>
              <div className="mt-10 grid gap-5">
                {credenciais.map((c) => (
                  <CartaoCredencial key={c.t} item={c} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pilares */}
      <section className="border-y border-fio bg-papel-alt py-20 md:py-24">
        <div className={secao}>
          <p className="flex items-center gap-3 text-[0.7rem] text-acento">
            <span aria-hidden className="h-px w-8 bg-rosa" />
            Pilares
          </p>
          <h2 className="mt-5 max-w-[22ch] font-display text-titulo titulo-revista">
            No que a operação se apoia.
          </h2>
          <ol className="mt-12 grid gap-8 md:grid-cols-3">
            {marca.pilares.map((p, i) => (
              <li key={p} className="border-t border-fio pt-7">
                <span className="tabular font-display text-3xl font-extrabold tracking-[-0.04em] text-acento">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <p className="mt-4 text-lg leading-snug text-tinta">{p}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Valores */}
      <section className="py-20 md:py-24">
        <div className={secao}>
          <p className="flex items-center gap-3 text-[0.7rem] text-acento">
            <span aria-hidden className="h-px w-8 bg-rosa" />
            Valores
          </p>
          <h2 className="mt-5 max-w-[22ch] font-display text-titulo titulo-revista">
            Como o time decide quando ninguém está olhando.
          </h2>
          <dl className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {marca.valores.map((v) => (
              <div key={v.nome} className="cartao p-8">
                <dt className="font-display text-xl font-bold tracking-[-0.02em]">
                  {v.nome}
                </dt>
                <dd className="mt-3 leading-relaxed text-tinta-fraca">{v.texto}</dd>
              </div>
            ))}
          </dl>

          <figure className="mt-16 border-t border-fio pt-10">
            <blockquote className="max-w-[46ch] font-display text-2xl font-semibold leading-snug tracking-[-0.02em] md:text-3xl">
              {marca.assinatura.frase}
            </blockquote>
            <figcaption className="mt-4 text-[0.7rem] text-tinta-fraca">
              {marca.assinatura.autor}
            </figcaption>
          </figure>
        </div>
      </section>

      <ChamadaFinal />
    </Casca>
  );
}
