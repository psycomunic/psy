import Link from 'next/link';
import Image from 'next/image';
import { Cabecalho } from '@/componentes/Cabecalho';
import { Rodape } from '@/componentes/Rodape';
import { Botao } from '@/componentes/Botao';
import { FitaMarcas } from '@/componentes/FitaMarcas';
import { PainelDiagnostico } from '@/componentes/PainelDiagnostico';
import { IconeFrente } from '@/componentes/IconeFrente';
import { BotaoWhatsapp } from '@/componentes/BotaoWhatsapp';
import { marca } from '@/conteudo/marca';
import { frentes, resultados, metodologia } from '@/conteudo/frentes';
import { marcasAtendidas, parcerias, cases } from '@/conteudo/prova';
import { planos, recursos, ctaPlano } from '@/conteudo/planos';

const secao = 'mx-auto w-full max-w-[1320px] px-5 md:px-10';
const rotulo =
  'font-mono text-[0.7rem] uppercase tracking-[0.2em] text-magenta-texto';
const tituloSecao =
  'mt-5 font-display text-titulo font-extrabold tracking-[-0.035em]';

/* Rótulo com fio à esquerda. Repetido em toda seção, é o que dá ao site
   uma batida reconhecível em vez de dez títulos soltos. */
function Rotulo({ children }: { children: React.ReactNode }) {
  return (
    <p className={`flex items-center gap-3 ${rotulo}`}>
      <span aria-hidden className="h-px w-8 bg-magenta" />
      {children}
    </p>
  );
}

export default function Home() {
  /* As 7 primeiras linhas da matriz são as confirmadas com o comercial.
     As demais estão marcadas `confirmar` e não vão para a home. */
  const recursosHome = recursos.filter((r) => !r.confirmar).slice(0, 5);
  const metade = Math.ceil(marcasAtendidas.length / 2);

  return (
    <>
      <Cabecalho />
      <main id="conteudo">

        {/* ==========================================================
            1. HERO
            ========================================================== */}
        <section className="relative isolate overflow-hidden pb-20 pt-14 md:pb-28 md:pt-20">
          {/* Camadas de fundo, do mais distante ao mais próximo. */}
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div className="grade absolute inset-0" />
            <div className="brilho-magenta absolute -right-[18%] -top-[38%] h-[820px] w-[820px] opacity-45" />
            <div className="brilho-frio absolute -left-[24%] top-[24%] h-[680px] w-[680px] opacity-30" />
            {/* Corta a barriga do brilho para a seção seguinte não herdar. */}
            <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-b from-transparent to-marinho" />
          </div>

          <div className={secao}>
            <div className="grid items-center gap-14 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16">
              {/* --- Coluna de texto --- */}
              {/* min-w-0 nos dois filhos: sem isso uma palavra longa na
                  display estica a coluna além da fração do grid e empurra
                  o painel para fora da tela. O padrão de item de grid é
                  min-width:auto, que se recusa a encolher. */}
              <div className="revelar min-w-0">
                <Rotulo>Operação de crescimento para e-commerce</Rotulo>

                <h1 className="mt-7 max-w-[15ch] font-display text-mostro font-extrabold tracking-[-0.045em]">
                  Sua loja não precisa de mais uma agência.{' '}
                  <span className="text-magenta-texto">Precisa de uma operação.</span>
                </h1>

                <p className="mt-8 max-w-[54ch] text-guia text-neve">
                  Gestão, tecnologia, marketing e logística rodando junto, porque é isso
                  que faz um e-commerce vender. Tráfego não paga boleto: operação paga.
                </p>

                <div className="mt-10 flex flex-wrap items-center gap-4">
                  <Botao href="/diagnostico">Quero meu diagnóstico gratuito</Botao>
                  <Botao href="/como-trabalhamos" variante="secundario">
                    Ver como trabalhamos
                  </Botao>
                </div>
              </div>

              {/* --- Painel --- */}
              <div className="revelar min-w-0 lg:pl-4">
                <PainelDiagnostico />
              </div>
            </div>

            {/*
              Faixa de prova.
              EDITAR: confirmar os anos de mercado e a redação da linha de
              sócio. É a única afirmação da página sem fonte pública.
              A contagem de marcas sai do próprio arquivo de conteúdo,
              então nunca fica desatualizada.
            */}
            <dl className="revelar mt-20 grid gap-px overflow-hidden rounded-[var(--raio)] border border-fio bg-[var(--fio)] sm:grid-cols-3">
              {[
                { n: '17', u: 'anos', d: 'de mercado em design, tecnologia e performance' },
                { n: 'Sócio', u: null, d: 'de e-commerce com faturamento na casa dos milhões' },
                { n: String(marcasAtendidas.length), u: 'marcas', d: 'atendidas em segmentos diferentes' },
              ].map((item) => (
                <div key={item.d} className="bg-marinho px-7 py-8 md:px-9 md:py-10">
                  <dt className="flex items-baseline gap-2.5">
                    <span className="tabular font-display text-sub font-extrabold tracking-[-0.04em]">
                      {item.n}
                    </span>
                    {item.u ? (
                      <span className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-cinza">
                        {item.u}
                      </span>
                    ) : null}
                  </dt>
                  <dd className="mt-3 max-w-[28ch] text-sm leading-relaxed text-cinza">
                    {item.d}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* ==========================================================
            2. FITA DE MARCAS
            ========================================================== */}
        <section aria-label="Marcas atendidas" className="border-y border-fio bg-marinho-fundo py-12">
          <div className={secao}>
            <p className="mb-8 text-center font-mono text-[0.7rem] uppercase tracking-[0.2em] text-cinza">
              {marcasAtendidas.length} marcas já confiaram a operação à Psy Comunic
            </p>
          </div>
          {/* Duas fitas em sentidos opostos: o contramovimento é o que
              faz o olho perceber as duas, em vez de uma esteira só. */}
          <div className="space-y-3">
            <FitaMarcas itens={marcasAtendidas.slice(0, metade)} duracao={64} />
            <FitaMarcas itens={marcasAtendidas.slice(metade)} duracao={78} volta />
          </div>
        </section>

        {/* ==========================================================
            3. O DIAGNÓSTICO
            ========================================================== */}
        <section className="relative overflow-hidden py-24 md:py-32">
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div className="brilho-frio absolute -left-[15%] top-1/4 h-[560px] w-[560px] opacity-20" />
          </div>

          <div className={secao}>
            <div className="revelar max-w-[46rem]">
              <Rotulo>O diagnóstico</Rotulo>
              <h2 className={tituloSecao + ' max-w-[18ch]'}>
                Seu e-commerce recebe visitas e{' '}
                <span className="text-magenta-texto">não converte?</span>
              </h2>
              <p className="mt-7 max-w-[60ch] text-guia text-neve">
                Você investe em mídia, o tráfego sobe e a venda não acompanha. Na maioria
                das vezes o problema não está no anúncio: está no checkout, no prazo de
                entrega, na aprovação do pagamento ou no cadastro do produto. É por isso
                que a Psy Comunic olha as quatro frentes.
              </p>
            </div>

            {/* As perguntas em escada. O deslocamento vertical na coluna
                da direita quebra a leitura em tabela e obriga o olho a
                percorrer uma a uma. */}
            <ul className="mt-16 grid gap-5 md:grid-cols-2 md:gap-7">
              {frentes.map((f, i) => (
                <li
                  key={f.slug}
                  className={'revelar' + (i % 2 === 1 ? ' md:mt-14' : '')}
                >
                  <div className="cartao h-full px-8 py-9 md:px-10 md:py-11">
                    <span aria-hidden className="absolute left-10 right-10 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                    <p className="font-display text-sub font-bold leading-tight tracking-[-0.03em] text-branco">
                      <span aria-hidden className="mr-1 text-magenta-texto">“</span>
                      {f.duvidas[0]}
                    </p>
                    <p className="mt-6 flex items-center gap-2.5 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-cinza">
                      <IconeFrente slug={f.slug} className="h-4 w-4 text-magenta-texto" />
                      Frente responsável: {f.nome}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ==========================================================
            4. AS QUATRO FRENTES
            ========================================================== */}
        <section id="frentes" className="scroll-mt-24 relative overflow-hidden border-y border-fio bg-marinho-fundo py-24 md:py-32">
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div className="brilho-magenta absolute left-1/2 top-0 h-[700px] w-[900px] -translate-x-1/2 opacity-20" />
          </div>

          <div className={secao}>
            <div className="revelar max-w-[46rem]">
              <Rotulo>As quatro frentes</Rotulo>
              <h2 className={tituloSecao + ' max-w-[20ch]'}>
                Quem contrata a Psy Comunic não contrata anúncios. Contrata a operação
                inteira.
              </h2>
            </div>

            <div className="mt-16 grid gap-6 lg:grid-cols-2">
              {frentes.map((f, i) => (
                <Link
                  key={f.slug}
                  href={'/servicos/' + f.slug}
                  className="revelar cartao group relative overflow-hidden p-9 transition-all duration-500 hover:-translate-y-1 hover:border-magenta/40 md:p-11"
                >
                  {/* Brilho de canto que só acende no hover. */}
                  <span
                    aria-hidden
                    className="brilho-magenta pointer-events-none absolute -right-24 -top-24 h-72 w-72 opacity-0 transition-opacity duration-500 group-hover:opacity-60"
                  />

                  <div className="relative flex items-start justify-between gap-6">
                    <IconeFrente
                      slug={f.slug}
                      className="h-9 w-9 text-magenta-texto transition-transform duration-500 group-hover:scale-110"
                    />
                    <span className="tabular font-mono text-xs text-cinza">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </div>

                  <h3 className="relative mt-8 font-display text-sub font-extrabold tracking-[-0.035em]">
                    {f.nome}
                  </h3>
                  <p className="relative mt-3 max-w-[42ch] text-neve">{f.resumo}</p>

                  <ul className="relative mt-7 space-y-2.5 border-t border-fio pt-7">
                    {f.contribuicoes.slice(0, 3).map((c) => (
                      <li key={c} className="flex gap-3 text-sm leading-relaxed text-cinza">
                        <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-magenta" />
                        {c}
                      </li>
                    ))}
                  </ul>

                  <span className="relative mt-8 inline-flex items-center gap-2 text-sm font-semibold text-magenta-texto">
                    Ver a frente de {f.nome}
                    <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">
                      →
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ==========================================================
            5. RESULTADOS
            ========================================================== */}
        <section id="resultados" className="scroll-mt-24 py-24 md:py-28">
          <div className={secao}>
            <div className="revelar">
              <Rotulo>O que fazemos</Rotulo>
              <h2 className={tituloSecao + ' max-w-[16ch]'}>
                Quatro resultados, não quatro relatórios.
              </h2>
            </div>

            <ol className="mt-14 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
              {resultados.map((r, i) => (
                <li key={r} className="revelar border-t border-fio pt-7">
                  <span className="tabular font-display text-3xl font-extrabold tracking-[-0.04em] text-magenta-texto">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <p className="mt-4 text-lg leading-snug text-neve">{r}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ==========================================================
            6. AUTORIDADE
            A página não tinha uma linha sobre quem está por trás, que é
            o ativo de credibilidade mais forte que existe aqui. Angelo
            aparece em terceira pessoa, e só porque a informação é sobre
            ele. Ver CLAUDE.md.
            ========================================================== */}
        <section id="quem-somos" className="scroll-mt-24 relative overflow-hidden border-y border-fio bg-marinho-fundo py-24 md:py-32">
          <div className={secao}>
            <div className="grid items-center gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
              {/* Retrato */}
              <div className="revelar relative mx-auto w-full max-w-sm lg:mx-0">
                <div aria-hidden className="brilho-magenta absolute -inset-10 -z-10 opacity-40" />
                <div className="relative overflow-hidden rounded-[var(--raio)] border border-fio">
                  <Image
                    src="/imagens/angelo.jpg"
                    alt="Angelo Garcia, fundador da Psy Comunic"
                    width={1400}
                    height={1400}
                    sizes="(max-width: 1024px) 90vw, 380px"
                    className="h-auto w-full object-cover"
                  />
                  {/* Véu na base para o nome pousar sobre a foto sem
                      caixa opaca por cima dela. */}
                  <div aria-hidden className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-marinho-fundo via-marinho-fundo/70 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-7">
                    <p className="font-display text-xl font-extrabold tracking-[-0.03em]">
                      Angelo Garcia
                    </p>
                    <p className="mt-1 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-magenta-texto">
                      Fundador · Psy Comunic
                    </p>
                  </div>
                </div>
              </div>

              {/* Credenciais */}
              <div className="revelar">
                <Rotulo>Quem está por trás</Rotulo>
                <h2 className={tituloSecao + ' max-w-[19ch]'}>
                  A operação foi construída por quem já esteve do outro lado do balcão.
                </h2>

                <dl className="mt-12 space-y-px overflow-hidden rounded-[var(--raio)] border border-fio bg-[var(--fio)]">
                  {[
                    {
                      t: '17+ anos em design e web',
                      d: 'Angelo Garcia trabalha com design gráfico e web desde antes de e-commerce virar assunto de todo mundo. É a base de por que a Psy Comunic trata a loja como produto, e não como suporte de anúncio.',
                    },
                    {
                      t: 'Sócio de e-commerce de milhões',
                      d: 'Ele foi sócio de um e-commerce com faturamento na casa dos milhões. Já viveu o estoque parado, o boleto que não é pago e a entrega que atrasa, do lado de quem responde por eles.',
                    },
                    {
                      t: 'Mentorado na Vinci Society',
                      d: 'Mentoria com Tay Dantas, uma das maiores especialistas em marketing do Brasil. É de onde vem o método que a Psy Comunic aplica na aquisição.',
                    },
                  ].map((item) => (
                    <div key={item.t} className="bg-marinho-fundo px-8 py-8 md:px-10">
                      <dt className="font-display text-xl font-bold tracking-[-0.02em]">
                        {item.t}
                      </dt>
                      <dd className="mt-3 max-w-[58ch] leading-relaxed text-cinza">
                        {item.d}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </div>
        </section>

        {/* ==========================================================
            7. METODOLOGIA
            ========================================================== */}
        <section id="metodologia" className="scroll-mt-24 py-24 md:py-32">
          <div className={secao}>
            <div className="revelar max-w-[46rem]">
              <Rotulo>Metodologia</Rotulo>
              <h2 className={tituloSecao}>Três processos. Zero achismo.</h2>
            </div>

            <ol className="relative mt-16 grid gap-10 md:grid-cols-3 md:gap-8">
              {/* Linha que costura os três passos. Só no desktop: no
                  celular os cards empilham e a linha horizontal mentiria
                  sobre a direção da leitura. */}
              <span
                aria-hidden
                className="absolute left-0 right-0 top-[1.1rem] hidden h-px bg-gradient-to-r from-magenta/60 via-fio to-transparent md:block"
              />
              {metodologia.map((m, i) => (
                <li key={m.nome} className="revelar relative">
                  <span className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full border border-magenta/50 bg-marinho font-mono text-xs text-magenta-texto">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3 className="mt-7 font-display text-xl font-bold tracking-[-0.02em]">
                    {m.nome}
                  </h3>
                  <p className="mt-3 max-w-[38ch] leading-relaxed text-cinza">{m.texto}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ==========================================================
            8. PLANOS
            ========================================================== */}
        <section id="planos" className="scroll-mt-24 relative overflow-hidden border-y border-fio bg-marinho-fundo py-24 md:py-32">
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div className="brilho-magenta absolute left-1/2 top-1/2 h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/2 opacity-[0.18]" />
          </div>

          <div className={secao}>
            <div className="revelar max-w-[46rem]">
              <Rotulo>Planos</Rotulo>
              <h2 className={tituloSecao + ' max-w-[20ch]'}>
                Três formas de colocar a operação para rodar.
              </h2>
            </div>

            <div className="mt-16 grid items-start gap-6 lg:grid-cols-3">
              {planos.map((p) => (
                <div
                  key={p.id}
                  className={
                    'revelar cartao relative p-9 transition-transform duration-500 md:p-10 ' +
                    (p.destaque
                      ? 'border-magenta/45 lg:-translate-y-5 lg:shadow-[0_30px_80px_-30px_rgba(228,21,95,0.55)]'
                      : 'hover:-translate-y-1')
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

                  <h3 className="relative mt-6 font-display text-sub font-extrabold tracking-[-0.035em]">
                    {p.nome}
                  </h3>

                  {/*
                    Sem preço, aqui e no código. Critério de aceite do
                    escopo: valor escrito no fonte iria para o bundle que
                    qualquer pessoa baixa. Ver src/conteudo/planos.ts.
                  */}
                  <dl className="relative mt-8 space-y-4 border-t border-fio pt-8">
                    {recursosHome.map((r) => (
                      <div key={r.nome} className="flex items-baseline justify-between gap-4">
                        <dt className="text-sm text-cinza">{r.nome}</dt>
                        <dd className="shrink-0 text-right text-sm font-semibold text-neve">
                          {String(r.valores[p.id])}
                        </dd>
                      </div>
                    ))}
                  </dl>

                  <div className="relative mt-9">
                    <Botao
                      href="/planos"
                      variante={p.destaque ? 'primario' : 'secundario'}
                      className="w-full"
                    >
                      {ctaPlano}
                    </Botao>
                  </div>
                </div>
              ))}
            </div>

            <p className="revelar mt-10 text-center text-sm">
              <Link
                href="/planos"
                className="text-magenta-texto underline decoration-magenta/40 underline-offset-4 transition-colors hover:decoration-magenta"
              >
                Ver a tabela comparativa completa
              </Link>
            </p>
          </div>
        </section>

        {/* ==========================================================
            9. CASES
            ========================================================== */}
        <section id="cases" className="scroll-mt-24 py-24 md:py-28">
          <div className={secao}>
            <div className="revelar max-w-[46rem]">
              <Rotulo>Cases</Rotulo>
              <h2 className={tituloSecao + ' max-w-[18ch]'}>
                Resultado com número, período e nome.
              </h2>
            </div>

            {cases.length === 0 ? (
              /*
                Vazio de propósito. A regra de compliance do escopo proíbe
                publicar métrica sem autorização escrita e sem período de
                referência declarado. Quando os dados chegarem, entram em
                src/conteudo/prova.ts e a seção se preenche sozinha.

                O estado vazio é DESENHADO: três molduras com a forma do
                case que virá. Um parágrafo pedindo desculpa faria a
                seção parecer esquecida.
              */
              <>
                <div className="mt-14 grid gap-6 md:grid-cols-3">
                  {['Aquisição', 'Conversão', 'Retenção'].map((eixo) => (
                    <div
                      key={eixo}
                      className="revelar cartao border-dashed p-8 opacity-70"
                    >
                      <p className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-cinza">
                        {eixo}
                      </p>
                      <div aria-hidden className="mt-6 space-y-3">
                        <div className="h-9 w-2/3 rounded-lg bg-white/[0.06]" />
                        <div className="h-3 w-full rounded bg-white/[0.04]" />
                        <div className="h-3 w-4/5 rounded bg-white/[0.04]" />
                      </div>
                      <p className="mt-7 text-sm leading-relaxed text-cinza">
                        Métrica, período e base de comparação, com o nome do cliente.
                      </p>
                    </div>
                  ))}
                </div>
                <p className="revelar mt-10 max-w-[62ch] leading-relaxed text-neve">
                  Os estudos de caso entram aqui assim que as autorizações de uso de marca
                  e de resultado estiverem assinadas. A Psy Comunic não publica número de
                  cliente sem autorização escrita e sem período declarado. Enquanto isso,
                  as marcas atendidas estão logo acima.
                </p>
              </>
            ) : null}
          </div>
        </section>

        {/* ==========================================================
            10. PARCERIAS
            ========================================================== */}
        <section className="border-t border-fio py-16">
          <div className={secao}>
            <div className="revelar flex flex-wrap items-center gap-x-12 gap-y-6">
              <p className={rotulo}>Parcerias e certificações</p>
              {/* EDITAR: trocar por SVG dos selos quando os arquivos chegarem. */}
              <ul className="flex flex-wrap items-center gap-3">
                {parcerias.map((p) => (
                  <li
                    key={p.nome}
                    className="rounded-full border border-fio px-5 py-2.5 text-sm font-semibold text-neve"
                  >
                    {p.nome}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ==========================================================
            11. CTA FINAL
            ========================================================== */}
        <section className="relative isolate overflow-hidden bg-magenta py-24 md:py-32">
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            {/* Gradiente para o magenta chapado ganhar volume, e uma
                grade em branco de baixíssima opacidade para amarrar esta
                seção ao resto da página. */}
            <div className="absolute inset-0 bg-[radial-gradient(120%_100%_at_15%_0%,rgba(255,255,255,0.22),transparent_55%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(200deg,transparent_35%,rgba(16,31,63,0.55))]" />
          </div>

          <div className={secao}>
            <div className="revelar max-w-[52rem]">
              <h2 className="max-w-[17ch] font-display text-titulo font-extrabold tracking-[-0.04em] text-branco">
                Vamos olhar a sua operação inteira.
              </h2>
              <p className="mt-7 max-w-[50ch] text-guia text-branco/90">
                Diagnóstico gratuito nas quatro frentes, com as prioridades apontadas por
                ordem de impacto no faturamento.
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <Botao href="/diagnostico" variante="claro">
                  Começar o diagnóstico
                </Botao>
                <Botao href="/planos" variante="secundario">
                  Ver os planos
                </Botao>
              </div>
            </div>

            <figure className="revelar mt-20 border-t border-white/25 pt-8">
              <blockquote className="max-w-[44ch] font-display text-xl font-semibold leading-snug tracking-[-0.02em] text-branco md:text-2xl">
                {marca.assinatura.frase}
              </blockquote>
              <figcaption className="mt-4 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-branco/70">
                {marca.assinatura.autor}
              </figcaption>
            </figure>
          </div>
        </section>
      </main>

      <Rodape />
      <BotaoWhatsapp />
    </>
  );
}
