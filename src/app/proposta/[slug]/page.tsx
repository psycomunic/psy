import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Marca } from '@/componentes/Marca';
import { buscarProposta, venceEm } from '@/dados/propostas';
import { marca } from '@/conteudo/marca';
import { linkWhatsapp } from '@/conteudo/navegacao';

/*
  Proposta comercial: documento privado, um link por cliente.

  force-dynamic de propósito. Se fosse estática, o build geraria e
  guardaria o HTML de todas as propostas, e uma proposta é documento de
  um cliente só.
*/
export const dynamic = 'force-dynamic';

/* Nenhum buscador indexa proposta. */
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

const dataBR = (d: Date) =>
  d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

export default async function PaginaProposta({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = buscarProposta(slug);
  if (!p) notFound();

  const vencimento = venceEm(p);
  const vencida = vencimento < new Date();

  return (
    <main id="conteudo" className="mx-auto max-w-[880px] px-5 py-14 md:px-10 md:py-20">
      {/* Cabeçalho do documento */}
      <header className="flex flex-wrap items-center justify-between gap-6 border-b border-white/10 pb-8">
        <Marca />
        <div className="text-right text-sm text-cinza">
          <p>Proposta comercial</p>
          <p>Emitida em {dataBR(new Date(p.emitidaEm))}</p>
          <p className={vencida ? 'text-magenta-texto' : undefined}>
            {vencida ? 'Validade vencida em ' : 'Válida até '}
            {dataBR(vencimento)}
          </p>
        </div>
      </header>

      {vencida ? (
        <p className="mt-8 rounded-2xl bg-magenta/15 p-5 text-sm text-magenta-texto">
          Esta proposta passou da validade. Fale com a {marca.nome} para receber uma
          versão atualizada.
        </p>
      ) : null}

      <p className="mt-12 text-xs font-semibold uppercase tracking-[0.16em] text-magenta-texto">
        Preparada para
      </p>
      <h1 className="mt-3 text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
        {p.cliente}
      </h1>
      <p className="mt-2 text-neve">Aos cuidados de {p.contato}</p>

      <p className="mt-10 max-w-[62ch] text-lg leading-relaxed text-neve">{p.resumo}</p>

      {/* Diagnóstico */}
      <section className="mt-16">
        <h2 className="text-2xl font-bold tracking-tight">O que encontramos</h2>
        <ul className="mt-6 space-y-4">
          {p.diagnostico.map((d) => (
            <li key={d} className="flex gap-4 border-t border-white/10 pt-4 text-neve">
              <span aria-hidden className="text-magenta-texto">—</span>
              <span>{d}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Escopo por frente */}
      <section className="mt-16">
        <h2 className="text-2xl font-bold tracking-tight">O que vamos fazer</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {p.escopo.map((bloco) => (
            <div key={bloco.frente} className="rounded-3xl bg-marinho-alto/60 p-6">
              <h3 className="text-lg font-bold">{bloco.frente}</h3>
              <ul className="mt-4 space-y-2 text-sm text-neve">
                {bloco.itens.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Investimento */}
      <section className="mt-16">
        <h2 className="text-2xl font-bold tracking-tight">Investimento</h2>
        <dl className="mt-6 divide-y divide-white/10">
          {p.investimento.map((i) => (
            <div key={i.rotulo} className="flex flex-wrap items-baseline justify-between gap-3 py-5">
              <div>
                <dt className="text-lg">{i.rotulo}</dt>
                {i.observacao ? (
                  <p className="mt-1 max-w-[46ch] text-sm text-cinza">{i.observacao}</p>
                ) : null}
              </div>
              <dd className="text-2xl font-extrabold tracking-tight">{i.valor}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Condições */}
      <section className="mt-16">
        <h2 className="text-2xl font-bold tracking-tight">Condições</h2>
        <ul className="mt-6 space-y-3 text-neve">
          {p.condicoes.map((c) => (
            <li key={c} className="border-t border-white/10 pt-3">{c}</li>
          ))}
        </ul>
      </section>

      {/* Próximos passos */}
      <section className="mt-16">
        <h2 className="text-2xl font-bold tracking-tight">Próximos passos</h2>
        <ol className="mt-6 space-y-4">
          {p.proximosPassos.map((s, i) => (
            <li key={s} className="flex gap-4 border-t border-white/10 pt-4">
              <span className="text-sm font-semibold text-magenta-texto">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="text-neve">{s}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* Aceite */}
      <section className="mt-16 rounded-3xl bg-magenta p-8 print:hidden">
        <h2 className="text-2xl font-extrabold tracking-tight text-branco">
          Pronto para começar?
        </h2>
        <p className="mt-3 max-w-[48ch] text-branco">
          Responda por aqui que a {marca.nome} inicia o kick off e o plano de mídia.
        </p>
        <a
          href={linkWhatsapp}
          target="_blank"
          rel="noopener"
          className="mt-6 inline-flex rounded-full bg-branco px-7 py-3.5 text-sm font-semibold text-marinho"
        >
          Aceitar e falar no WhatsApp
        </a>
      </section>

      <footer className="mt-12 text-xs leading-relaxed text-cinza">
        <p>
          Documento confidencial, preparado exclusivamente para {p.cliente}. Os valores
          valem até {dataBR(vencimento)}.
        </p>
        <p className="mt-2">
          © {new Date().getFullYear()} {marca.nome}.
        </p>
      </footer>
    </main>
  );
}
