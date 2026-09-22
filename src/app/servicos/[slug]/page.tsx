import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Casca, TopoPagina, ChamadaFinal, secao, canonical } from '@/componentes/Casca';
import { IconeFrente } from '@/componentes/IconeFrente';
import { frentes } from '@/conteudo/frentes';
import { urlAbsoluta } from '@/conteudo/site';
import { Trilha } from '@/componentes/DadosEstruturados';

/*
  Uma frente de serviço por página, num template só.

  generateStaticParams pré-renderiza as quatro no build: página de
  serviço é conteúdo estável, e HTML pronto no CDN é o que o Google
  rastreia mais rápido e o visitante recebe primeiro.
*/
export function generateStaticParams() {
  return frentes.map((f) => ({ slug: f.slug }));
}

/* Sem isto, um /servicos/qualquer-coisa renderizaria em tempo de
   execução em vez de dar 404. Página inventada indexada é lixo. */
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const f = frentes.find((x) => x.slug === slug);
  if (!f) return {};

  return {
    title: `${f.nome} para e-commerce`,
    description: `${f.resumo} Uma das quatro frentes da operação da Psy Comunic.`,
    ...canonical(`/servicos/${f.slug}`),
    openGraph: {
      title: `${f.nome} para e-commerce · Psy Comunic`,
      description: f.resumo,
      url: urlAbsoluta(`/servicos/${f.slug}`),
      type: 'article',
    },
  };
}

export default async function PaginaFrente({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const f = frentes.find((x) => x.slug === slug);
  if (!f) notFound();

  const outras = frentes.filter((x) => x.slug !== slug);

  return (
    <Casca>
      {/* Trilha em JSON-LD: é o que faz o Google mostrar
          "psycomunic.com.br › Serviços › Marketing" no resultado, em vez
          da URL crua. */}
      <Trilha
        itens={[
          { nome: 'Serviços', caminho: '/servicos' },
          { nome: f.nome, caminho: `/servicos/${f.slug}` },
        ]}
      />

      <TopoPagina
        rotulo={`Frente ${frentes.indexOf(f) + 1} de ${frentes.length}`}
        titulo={<>{f.nome} para e-commerce</>}
        texto={f.resumo}
        trilha={[{ nome: 'Serviços', href: '/servicos' }]}
      />

      {/* O que esta frente entrega */}
      <section className="py-16 md:py-20">
        <div className={secao}>
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            <div>
              <IconeFrente slug={f.slug} className="h-12 w-12 text-magenta-texto" />
              <h2 className="mt-8 font-display text-sub font-extrabold tracking-[-0.035em]">
                O que a frente de {f.nome} entrega
              </h2>
              <p className="mt-5 max-w-[46ch] leading-relaxed text-cinza">
                Cada item abaixo é uma entrega concreta, e não uma promessa de
                acompanhamento. É o que a Psy Comunic executa dentro desta frente.
              </p>
            </div>

            <ul className="grid gap-4">
              {f.contribuicoes.map((c, i) => (
                <li key={c} className="cartao flex gap-5 px-7 py-6">
                  <span className="tabular shrink-0 font-mono text-xs text-magenta-texto">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="leading-relaxed text-neve">{c}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/*
        As dúvidas viram uma seção de perguntas.

        Não é enfeite: são exatamente as buscas que um lojista digita no
        Google, escritas com as palavras dele. Em texto puro na página,
        elas casam com a busca de cauda longa.

        NÃO são marcadas como FAQPage. O Google só aceita essa marcação
        quando pergunta E resposta estão visíveis na página, e aqui só a
        pergunta está. Marcar assim mesmo é motivo de ação manual contra
        o site. Quando as respostas forem escritas, a marcação entra.
      */}
      <section className="border-y border-fio bg-marinho-fundo py-20 md:py-24">
        <div className={secao}>
          <p className="flex items-center gap-3 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-magenta-texto">
            <span aria-hidden className="h-px w-8 bg-magenta" />
            Perguntas que esta frente responde
          </p>
          <h2 className="mt-5 max-w-[20ch] font-display text-titulo font-extrabold tracking-[-0.035em]">
            Se alguma destas é a sua, é aqui que ela se resolve.
          </h2>

          <dl className="mt-12 grid gap-5 md:grid-cols-2">
            {f.duvidas.map((d) => (
              <div key={d} className="cartao px-8 py-7">
                <dt className="font-display text-lg font-bold leading-snug tracking-[-0.02em] md:text-xl">
                  <span aria-hidden className="mr-1 text-magenta-texto">“</span>
                  {d}
                </dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Ligação entre as frentes: é assim que a autoridade circula pelo
          site em vez de morrer numa página só. */}
      <section className="py-16 md:py-20">
        <div className={secao}>
          <h2 className="font-display text-sub font-extrabold tracking-[-0.035em]">
            As outras frentes da operação
          </h2>
          <p className="mt-4 max-w-[58ch] leading-relaxed text-cinza">
            {f.nome} sozinha não sustenta um e-commerce. A operação é o conjunto,
            e é por isso que a Psy Comunic trabalha as quatro juntas.
          </p>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {outras.map((o) => (
              <Link
                key={o.slug}
                href={`/servicos/${o.slug}`}
                className="cartao group p-7 transition-all duration-500 hover:-translate-y-1 hover:border-magenta/40"
              >
                <IconeFrente slug={o.slug} className="h-8 w-8 text-magenta-texto" />
                <h3 className="mt-6 font-display text-xl font-bold tracking-[-0.02em]">
                  {o.nome}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-cinza">{o.resumo}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-magenta-texto">
                  Ver frente
                  <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">
                    →
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <ChamadaFinal
        titulo={`Quer saber onde a frente de ${f.nome} está travando a sua loja?`}
      />
    </Casca>
  );
}
