import type { Metadata } from 'next';
import Image from 'next/image';
import { Casca, TopoPagina, ChamadaFinal, secao, canonical } from '@/componentes/Casca';
import { CartaoCredencial } from '@/componentes/CartaoCredencial';
import { marca, credenciais } from '@/conteudo/marca';
import { urlAbsoluta, site } from '@/conteudo/site';

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
            <figure className="relative overflow-hidden rounded-[var(--raio)] border border-fio">
              <Image
                src="/imagens/angelo-vinci.jpg"
                alt="Angelo Garcia, fundador da Psy Comunic, em um encontro da Vinci Society"
                width={1440}
                height={960}
                sizes="(max-width: 1024px) 92vw, 560px"
                className="aspect-square w-full object-cover object-[38%_center] brightness-[1.2] contrast-[1.06]"
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-tr from-magenta/20 via-transparent to-transparent mix-blend-soft-light"
              />
              <div
                aria-hidden
                className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-marinho-fundo via-marinho-fundo/70 to-transparent"
              />
              <figcaption className="absolute inset-x-0 bottom-0 p-7 md:p-8">
                <p className="font-display text-2xl font-extrabold tracking-[-0.03em]">
                  {site.fundador}
                </p>
                <p className="mt-1.5 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-magenta-texto">
                  Fundador · {marca.nome}
                </p>
              </figcaption>
            </figure>

            <div>
              <h2 className="font-display text-titulo font-extrabold tracking-[-0.035em]">
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
      <section className="border-y border-fio bg-marinho-fundo py-20 md:py-24">
        <div className={secao}>
          <p className="flex items-center gap-3 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-magenta-texto">
            <span aria-hidden className="h-px w-8 bg-magenta" />
            Pilares
          </p>
          <h2 className="mt-5 max-w-[22ch] font-display text-titulo font-extrabold tracking-[-0.035em]">
            No que a operação se apoia.
          </h2>
          <ol className="mt-12 grid gap-8 md:grid-cols-3">
            {marca.pilares.map((p, i) => (
              <li key={p} className="border-t border-fio pt-7">
                <span className="tabular font-display text-3xl font-extrabold tracking-[-0.04em] text-magenta-texto">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <p className="mt-4 text-lg leading-snug text-neve">{p}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Valores */}
      <section className="py-20 md:py-24">
        <div className={secao}>
          <p className="flex items-center gap-3 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-magenta-texto">
            <span aria-hidden className="h-px w-8 bg-magenta" />
            Valores
          </p>
          <h2 className="mt-5 max-w-[22ch] font-display text-titulo font-extrabold tracking-[-0.035em]">
            Como o time decide quando ninguém está olhando.
          </h2>
          <dl className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {marca.valores.map((v) => (
              <div key={v.nome} className="cartao p-8">
                <dt className="font-display text-xl font-bold tracking-[-0.02em]">
                  {v.nome}
                </dt>
                <dd className="mt-3 leading-relaxed text-cinza">{v.texto}</dd>
              </div>
            ))}
          </dl>

          <figure className="mt-16 border-t border-fio pt-10">
            <blockquote className="max-w-[46ch] font-display text-2xl font-semibold leading-snug tracking-[-0.02em] md:text-3xl">
              {marca.assinatura.frase}
            </blockquote>
            <figcaption className="mt-4 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-cinza">
              {marca.assinatura.autor}
            </figcaption>
          </figure>
        </div>
      </section>

      <ChamadaFinal />
    </Casca>
  );
}
