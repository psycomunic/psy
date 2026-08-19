import Link from 'next/link';
import { Cabecalho } from '@/componentes/Cabecalho';
import { Rodape } from '@/componentes/Rodape';
import { Botao } from '@/componentes/Botao';
import { marca } from '@/conteudo/marca';
import { frentes, resultados, metodologia } from '@/conteudo/frentes';
import { marcasAtendidas, parcerias, cases } from '@/conteudo/prova';
import { planos, ctaPlano } from '@/conteudo/planos';

const secao = 'mx-auto max-w-[1280px] px-5 md:px-10';
const rotulo = 'text-xs font-semibold uppercase tracking-[0.16em] text-magenta-texto';
const titulo = 'mt-4 text-4xl font-extrabold leading-[1.05] tracking-tight md:text-5xl';

export default function Home() {
  return (
    <>
      <Cabecalho />
      <main id="conteudo">

        {/* 1. HERO ------------------------------------------------------ */}
        <section className="py-24 md:py-32">
          <div className={secao}>
            <p className={rotulo}>Operação de crescimento para e-commerce</p>
            <h1 className="mt-5 max-w-[16ch] text-5xl font-extrabold leading-[0.98] tracking-tight md:text-7xl">
              Sua loja não precisa de mais uma agência.
              <span className="text-magenta-texto"> Precisa de uma operação.</span>
            </h1>
            <p className="mt-7 max-w-[58ch] text-lg leading-relaxed text-neve">
              Gestão, tecnologia, marketing e logística rodando junto, porque é isso que
              faz um e-commerce vender. Tráfego não paga boleto: operação paga.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Botao href="/diagnostico">Quero meu diagnóstico gratuito</Botao>
              <Botao href="/como-trabalhamos" variante="secundario">Ver como trabalhamos</Botao>
            </div>

            {/*
              Faixa de prova.
              EDITAR: confirmar os anos de mercado e a redação da linha de
              sócio. É a única afirmação da página sem fonte pública, então
              vale checar como ela deve ser dita.
              A contagem de marcas sai do próprio arquivo de conteúdo, então
              nunca fica desatualizada.
            */}
            <dl className="mt-16 grid max-w-3xl gap-8 sm:grid-cols-3">
              {[
                { n: '17', u: 'anos', d: 'de mercado em design, tecnologia e performance' },
                { n: 'Sócio', u: '', d: 'de e-commerce com faturamento na casa dos milhões' },
                { n: String(marcasAtendidas.length), u: 'marcas', d: 'atendidas em segmentos diferentes' },
              ].map((item) => (
                <div key={item.d}>
                  <dt className="flex items-baseline gap-2">
                    <span className="text-4xl font-extrabold tracking-tight md:text-5xl">{item.n}</span>
                    {item.u ? <span className="text-sm text-cinza">{item.u}</span> : null}
                  </dt>
                  <dd className="mt-2 max-w-[26ch] text-sm leading-relaxed text-cinza">{item.d}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* 2. FAIXA DE MARCAS ------------------------------------------- */}
        <section aria-label="Marcas atendidas" className="border-y border-white/10 py-8">
          <ul className="flex flex-wrap justify-center gap-x-8 gap-y-3 px-5 text-sm text-cinza">
            {marcasAtendidas.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </section>

        {/* 3. DOR -------------------------------------------------------- */}
        <section className="py-24 md:py-28">
          <div className={secao}>
            <p className={rotulo}>O diagnóstico</p>
            <h2 className={titulo + ' max-w-[20ch]'}>
              Seu e-commerce recebe visitas e <span className="text-magenta-texto">não converte?</span>
            </h2>
            <p className="mt-6 max-w-[62ch] text-lg leading-relaxed text-neve">
              Você investe em mídia, o tráfego sobe e a venda não acompanha. Na maioria das
              vezes o problema não está no anúncio: está no checkout, no prazo de entrega,
              na aprovação do pagamento ou no cadastro do produto. É por isso que a Psy
              Comunic olha as quatro frentes.
            </p>
            <ul className="mt-12 grid gap-6 md:grid-cols-2">
              {frentes.map((f) => (
                <li key={f.slug} className="rounded-3xl bg-marinho-alto/60 p-7">
                  <p className="text-lg font-semibold">{f.duvidas[0]}</p>
                  <p className="mt-3 text-sm text-cinza">Frente responsável: {f.nome}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 4. O QUE FAZEMOS --------------------------------------------- */}
        <section className="py-24 md:py-28">
          <div className={secao}>
            <p className={rotulo}>O que fazemos</p>
            <h2 className={titulo + ' max-w-[18ch]'}>Quatro resultados, não quatro relatórios.</h2>
            <ol className="mt-12 grid gap-x-10 gap-y-8 md:grid-cols-2">
              {resultados.map((r, i) => (
                <li key={r} className="flex gap-5 border-t border-white/10 pt-6">
                  <span className="text-sm font-semibold text-magenta-texto">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="text-lg leading-snug">{r}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* 5. AS QUATRO FRENTES ----------------------------------------- */}
        <section className="py-24 md:py-28">
          <div className={secao}>
            <p className={rotulo}>As quatro frentes</p>
            <h2 className={titulo + ' max-w-[22ch]'}>
              Quem contrata a Psy Comunic não contrata anúncios. Contrata a operação inteira.
            </h2>
            <div className="mt-14 grid gap-6 md:grid-cols-2">
              {frentes.map((f) => (
                <Link
                  key={f.slug}
                  href={'/servicos/' + f.slug}
                  className="rounded-3xl bg-marinho-alto/60 p-8 transition-colors hover:bg-marinho-alto"
                >
                  <h3 className="text-2xl font-bold tracking-tight">{f.nome}</h3>
                  <p className="mt-3 text-neve">{f.resumo}</p>
                  <ul className="mt-6 space-y-2 text-sm text-cinza">
                    {f.contribuicoes.slice(0, 3).map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                  <span className="mt-6 inline-block text-sm font-semibold text-magenta-texto">
                    Ver a frente de {f.nome}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* 6. METODOLOGIA ------------------------------------------------ */}
        <section className="py-24 md:py-28">
          <div className={secao}>
            <p className={rotulo}>Metodologia</p>
            <h2 className={titulo + ' max-w-[18ch]'}>Três processos. Zero achismo.</h2>
            <ol className="mt-12 grid gap-8 md:grid-cols-3">
              {metodologia.map((m, i) => (
                <li key={m.nome} className="border-t border-white/10 pt-6">
                  <span className="text-sm font-semibold text-magenta-texto">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3 className="mt-3 text-xl font-bold tracking-tight">{m.nome}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-cinza">{m.texto}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* 7. CASES ------------------------------------------------------ */}
        <section className="py-24 md:py-28">
          <div className={secao}>
            <p className={rotulo}>Cases</p>
            <h2 className={titulo + ' max-w-[18ch]'}>Resultado com número, período e nome.</h2>
            {cases.length === 0 ? (
              /*
                Vazio de propósito. A regra de compliance do escopo proíbe
                publicar métrica sem autorização escrita e sem período de
                referência declarado. Quando os dados chegarem, entram em
                src/conteudo/prova.ts e a seção se preenche sozinha.
              */
              <p className="mt-6 max-w-[58ch] text-lg leading-relaxed text-neve">
                Os estudos de caso entram aqui assim que as autorizações de uso de marca e
                de resultado estiverem assinadas. Enquanto isso, as marcas atendidas estão
                listadas acima.
              </p>
            ) : null}
          </div>
        </section>

        {/* 8. PLANOS ----------------------------------------------------- */}
        <section className="py-24 md:py-28">
          <div className={secao}>
            <p className={rotulo}>Planos</p>
            <h2 className={titulo + ' max-w-[20ch]'}>Três formas de colocar a operação para rodar.</h2>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {planos.map((p) => (
                <div
                  key={p.id}
                  className={
                    'rounded-3xl p-8 ' +
                    (p.destaque ? 'bg-marinho-alto ring-1 ring-magenta' : 'bg-marinho-alto/60')
                  }
                >
                  {p.selo ? (
                    <span className="inline-block rounded-full bg-magenta px-3 py-1 text-xs font-semibold text-branco">
                      {p.selo}
                    </span>
                  ) : null}
                  <h3 className="mt-4 text-2xl font-bold tracking-tight">{p.nome}</h3>
                  <div className="mt-8">
                    <Botao href="/planos" variante={p.destaque ? 'primario' : 'secundario'}>
                      {ctaPlano}
                    </Botao>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-8 text-sm">
              <Link href="/planos" className="text-magenta-texto underline underline-offset-4">
                Ver a tabela comparativa completa
              </Link>
            </p>
          </div>
        </section>

        {/* 9. PARCERIAS -------------------------------------------------- */}
        <section className="py-16">
          <div className={secao}>
            <p className={rotulo}>Parcerias e certificações</p>
            {/* EDITAR: trocar por SVG dos selos quando os arquivos chegarem. */}
            <ul className="mt-6 flex flex-wrap gap-x-10 gap-y-3 text-neve">
              {parcerias.map((p) => (
                <li key={p.nome} className="text-lg font-semibold">{p.nome}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* 10. CTA FINAL ------------------------------------------------- */}
        <section className="bg-magenta py-24 md:py-28">
          <div className={secao}>
            <h2 className="max-w-[20ch] text-4xl font-extrabold leading-[1.05] tracking-tight text-branco md:text-5xl">
              Vamos olhar a sua operação inteira.
            </h2>
            <p className="mt-6 max-w-[52ch] text-lg leading-relaxed text-branco">
              Diagnóstico gratuito nas quatro frentes, com as prioridades apontadas por
              ordem de impacto no faturamento.
            </p>
            <div className="mt-9">
              <Botao href="/diagnostico" variante="secundario">Começar o diagnóstico</Botao>
            </div>
            <p className="mt-14 max-w-[46ch] text-sm leading-relaxed text-branco">
              {marca.assinatura.frase} — {marca.assinatura.autor}
            </p>
          </div>
        </section>
      </main>
      <Rodape />
    </>
  );
}
