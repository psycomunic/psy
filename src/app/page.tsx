import Link from 'next/link';
import Image from 'next/image';
import { Cabecalho } from '@/componentes/Cabecalho';
import { Rodape } from '@/componentes/Rodape';
import { Botao } from '@/componentes/Botao';
import { FitaMarcas } from '@/componentes/FitaMarcas';
import { Vitrine } from '@/componentes/Vitrine';
import { PainelDiagnostico } from '@/componentes/PainelDiagnostico';
import { IconeFrente } from '@/componentes/IconeFrente';
import { BotaoWhatsapp } from '@/componentes/BotaoWhatsapp';
import { ParedeHolofote } from '@/componentes/ParedeHolofote';
import { marca } from '@/conteudo/marca';
import { frentes, resultados, metodologia } from '@/conteudo/frentes';
import { marcasAtendidas, parcerias, cases } from '@/conteudo/prova';
import { trabalhos, logosMarcas } from '@/conteudo/trabalhos';
import { jornada, promessaCompleta, porQueCompleta } from '@/conteudo/jornada';

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
  const metadeLogos = Math.ceil(logosMarcas.length / 2);

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
            {/* A parede de trabalhos com o holofote. Fica atrás de tudo:
                é fundo, e some sem script sem levar nada junto. */}
            <ParedeHolofote prioridade />

            <div className="grade absolute inset-0 opacity-40" />
            <div className="brilho-magenta absolute -right-[18%] -top-[38%] h-[820px] w-[820px] opacity-45" />
            <div className="brilho-frio absolute -left-[24%] top-[24%] h-[680px] w-[680px] opacity-30" />

            {/* Escurece o lado do texto e larga o resto para a luz.
                Vertical no telefone, onde o texto atravessa a tela. */}
            <div className="absolute inset-0 bg-marinho/35 md:hidden" />
            <div className="absolute inset-0 hidden md:block md:bg-[linear-gradient(100deg,var(--marinho)_10%,color-mix(in_oklab,var(--marinho)_72%,transparent)_34%,transparent_60%)]" />

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
              {/* `data-fora-da-luz`: o holofote recorta este bloco da
                  máscara para nunca lavar o texto. Sem a marca ele
                  ilumina por cima das palavras, e medido isso derruba o
                  contraste para 2,71:1. */}
              <div data-fora-da-luz className="revelar min-w-0">
                <Rotulo>Do zero ao lançamento, e todo mês depois</Rotulo>

                <h1 className="mt-7 max-w-[15ch] font-display text-mostro font-extrabold tracking-[-0.045em]">
                  Sua loja não precisa de mais uma agência.{' '}
                  <span className="text-magenta-texto">Precisa de uma operação.</span>
                </h1>

                <p className="mt-8 max-w-[56ch] text-guia text-neve">
                  A Psy Comunic <strong className="font-semibold text-branco">constrói a
                  sua loja do zero até o lançamento</strong> e continua entregando todo mês
                  depois dele. Gestão, tecnologia, marketing e logística rodando junto,
                  porque é isso que faz um e-commerce vender.
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
              ex-sócio. São as únicas afirmações da página sem fonte
              pública.
            */}
            <dl className="revelar mt-20 grid gap-px overflow-hidden rounded-[var(--raio)] border border-fio bg-[var(--fio)] sm:grid-cols-3">
              {[
                { n: '17', u: 'anos', d: 'de mercado em design, tecnologia e performance' },
                { n: 'Na frente', u: null, d: 'de e-commerces com faturamento na casa dos milhões' },
                /* Sem contagem de marcas: foram muitas, e um número
                   fechado aqui envelheceria e ainda venderia menos do
                   que a fita de nomes logo abaixo. As quatro frentes
                   são um número que a Psy Comunic controla. */
                { n: 'Do zero', u: 'ao lançamento', d: 'e as entregas contínuas depois dele, com o mesmo time' },
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
        <section aria-label="Marcas atendidas" className="border-y border-fio bg-marinho-fundo py-14">
          <div className={secao}>
            <p className="mb-10 text-center font-mono text-[0.7rem] uppercase tracking-[0.2em] text-cinza">
              Algumas das muitas marcas que já confiaram a operação à Psy Comunic
            </p>
          </div>

          {/* Duas fitas em sentidos opostos: o contramovimento é o que
              faz o olho perceber as duas, em vez de uma esteira só. */}
          <div className="space-y-8 md:space-y-10">
            <FitaMarcas logos={logosMarcas.slice(0, metadeLogos)} duracao={64} />
            <FitaMarcas logos={logosMarcas.slice(metadeLogos)} duracao={78} volta />
          </div>

          {/*
            Os logos entram como decorativos porque não há mapeamento de
            qual arquivo é qual marca. Os NOMES vivem aqui, em texto, para
            quem usa leitor de tela não receber apenas silêncio no lugar
            da prova social.
          */}
          <ul className="sr-only">
            {marcasAtendidas.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </section>

        {/* ==========================================================
            3. A JORNADA COMPLETA

            Vem logo depois da fita de marcas, e antes de qualquer
            explicação de método. Motivo: a dúvida que faz alguém sair
            desta página é "vocês fazem tudo ou só anunciam?", e ela
            precisa ser respondida antes de a pessoa ter que procurar.

            Duas fases lado a lado respondem dois medos opostos de uma
            vez: quem vai começar teme ficar com a loja pronta e
            ninguém para tocar; quem já vende teme contratar quem só
            sabe anunciar e não mexe na loja.
            ========================================================== */}
        <section
          id="jornada"
          aria-labelledby="jornada-titulo"
          className="scroll-mt-24 relative overflow-hidden py-24 md:py-32"
        >
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div className="brilho-magenta absolute -left-[15%] top-1/3 h-[560px] w-[720px] opacity-25" />
          </div>

          <div className={secao}>
            <div className="revelar max-w-[52rem]">
              <Rotulo>Solução completa</Rotulo>
              <h2 id="jornada-titulo" className={tituloSecao + ' max-w-[19ch]'}>
                Construímos a loja. E ficamos para{' '}
                <span className="text-magenta-texto">fazer ela vender.</span>
              </h2>
              <p className="mt-7 max-w-[58ch] text-guia text-neve">{promessaCompleta}</p>
            </div>

            {/* As duas fases. No desktop ficam lado a lado com a seta
                entre elas; no telefone empilham, e a seta vira o
                conector vertical. */}
            <div className="relative mt-16 grid items-stretch gap-6 lg:grid-cols-2 lg:gap-8">
              {jornada.map((fase, i) => (
                <article
                  key={fase.id}
                  className={
                    'revelar cartao relative flex flex-col p-8 md:p-10 ' +
                    (i === 1 ? 'border-magenta/40' : '')
                  }
                >
                  <span aria-hidden className="aresta absolute inset-x-10 top-0 h-px" />

                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={
                        'rounded-full px-3.5 py-1.5 font-mono text-[0.68rem] uppercase tracking-[0.16em] ' +
                        (i === 1
                          ? 'bg-magenta text-branco'
                          : 'border border-fio text-magenta-texto')
                      }
                    >
                      {fase.etiqueta}
                    </span>
                    <span className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-cinza">
                      {fase.entrega}
                    </span>
                  </div>

                  <h3 className="mt-6 font-display text-sub font-extrabold tracking-[-0.035em]">
                    {fase.titulo}
                  </h3>

                  <p className="mt-5 max-w-[46ch] text-guia leading-relaxed text-neve">
                    {fase.resumo}
                  </p>

                  <ul className="mt-8 space-y-3.5 border-t border-fio pt-8">
                    {fase.itens.map((item) => (
                      <li key={item} className="flex gap-3.5 text-sm leading-relaxed text-neve">
                        <span aria-hidden className="mt-0.5 flex-none text-magenta-texto">
                          ✓
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>

            {/* Por que completa importa. "Solução completa" é o que toda
                agência escreve; sem dizer o que a alternativa custa, a
                frase não significa nada. */}
            <div className="mt-16 grid gap-px overflow-hidden rounded-[var(--raio)] border border-fio bg-[var(--fio)] md:grid-cols-3">
              {porQueCompleta.map((item) => (
                <div key={item.titulo} className="revelar bg-marinho px-7 py-8 md:px-8 md:py-10">
                  <h3 className="font-display text-lg font-bold leading-snug tracking-[-0.02em]">
                    {item.titulo}
                  </h3>
                  <p className="mt-3.5 text-sm leading-relaxed text-cinza">{item.texto}</p>
                </div>
              ))}
            </div>

            <div className="revelar mt-14 flex flex-wrap items-center gap-4">
              <Botao href="/diagnostico">Quero meu diagnóstico gratuito</Botao>
              <p className="text-sm text-cinza">
                Começando do zero ou já vendendo, o diagnóstico é o mesmo primeiro passo.
              </p>
            </div>
          </div>
        </section>

        {/* ==========================================================
            4. O DIAGNÓSTICO
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
            5. AS QUATRO FRENTES
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
            6. RESULTADOS
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
            7. AUTORIDADE
            A página não tinha uma linha sobre quem está por trás, que é
            o ativo de credibilidade mais forte que existe aqui. Angelo
            aparece em terceira pessoa, e só porque a informação é sobre
            ele. Ver CLAUDE.md.
            ========================================================== */}
        <section id="quem-somos" className="scroll-mt-24 relative overflow-hidden border-y border-fio bg-marinho-fundo py-24 md:py-32">
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div className="brilho-magenta absolute -left-[10%] top-1/3 h-[620px] w-[620px] opacity-25" />
          </div>

          <div className={secao}>
            {/*
              Título em cima das DUAS colunas.

              Antes ele morava na coluna da direita, junto das
              credenciais. Como aquela coluna ficava muito mais alta que
              a foto, o `items-center` centrava o retrato e abria um vão
              morto acima dele: a foto boiava no meio do nada. Com o
              título por cima, as duas colunas começam na mesma linha e
              o vão some.
            */}
            <div className="revelar max-w-[42rem]">
              <Rotulo>Quem está por trás</Rotulo>
              <h2 className={tituloSecao + ' max-w-[19ch]'}>
                A operação foi construída por quem já esteve do outro lado do balcão.
              </h2>
            </div>

            <div className="mt-14 grid gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-start lg:gap-14">
              {/* --- Retrato quadrado, à esquerda --- */}
              <figure className="revelar relative overflow-hidden rounded-[var(--raio)] border border-fio">
                {/*
                  O arquivo é 3:2 deitado, então um quadro 1:1 corta 480px
                  de largura. ONDE cortar não é indiferente: a marca da
                  Vinci Society está na parede à esquerda, e a foto vale
                  justamente por ser a prova visual da terceira credencial.

                  Por isso o corte é deslocado para a esquerda, e não
                  centrado. Em 38% ele começa em x=182 do original em vez
                  de x=240, o que segura o "V" da Vinci inteiro dentro do
                  quadro. O assunto fica em 56% da largura, quase no terço
                  direito, que é onde o olho gosta de encontrar um rosto.
                */}
                <Image
                  src="/imagens/angelo-vinci.jpg"
                  alt="Angelo Garcia, fundador da Psy Comunic, em um encontro da Vinci Society"
                  width={1440}
                  height={960}
                  sizes="(max-width: 1024px) 92vw, 560px"
                  className="aspect-square w-full object-cover object-[38%_center] brightness-[1.2] contrast-[1.06]"
                />

                {/* Lavagem magenta de baixíssima opacidade, para a foto
                    pertencer à paleta em vez de parecer colada sobre ela. */}
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-tr from-magenta/20 via-transparent to-transparent mix-blend-soft-light"
                />

                {/* Véu na base para a legenda pousar sobre a foto sem
                    caixa opaca por cima dela. */}
                <div
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-marinho-fundo via-marinho-fundo/70 to-transparent"
                />

                <figcaption className="absolute inset-x-0 bottom-0 p-7 md:p-8">
                  <p className="font-display text-2xl font-extrabold tracking-[-0.03em]">
                    Angelo Garcia
                  </p>
                  <p className="mt-1.5 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-magenta-texto">
                    Fundador · Psy Comunic
                  </p>
                  <p className="mt-4 inline-block rounded-full border border-fio bg-marinho-fundo/70 px-4 py-2 font-mono text-[0.6rem] uppercase tracking-[0.16em] text-neve backdrop-blur-sm">
                    Encontro da Vinci Society
                  </p>
                </figcaption>
              </figure>

              {/* --- Credenciais, à direita ---
                  Empilhadas, e cada uma um card próprio: três blocos com
                  peso igual pesam mais do que três parágrafos separados
                  por fio. */}
              <dl className="grid gap-5">
                  {[
                    {
                      i: '01',
                      t: '17+ anos em design e web',
                      d: 'Angelo Garcia trabalha com design gráfico e web desde antes de e-commerce virar assunto de todo mundo. É a base de por que a Psy Comunic trata a loja como produto, e não como suporte de anúncio.',
                    },
                    {
                      i: '02',
                      t: 'Ex-sócio de e-commerces de milhões',
                      d: 'Ele foi sócio de e-commerces com faturamento na casa dos milhões. Já viveu o estoque parado, o boleto que não é pago e a entrega que atrasa, do lado de quem responde por eles.',
                    },
                    {
                      i: '03',
                      t: 'Mentorado na Vinci Society',
                      d: 'Mentoria com Tay Dantas, uma das maiores especialistas em marketing do Brasil. É de onde vem o método que a Psy Comunic aplica na aquisição.',
                    },
                  ].map((item) => (
                    <div
                      key={item.t}
                      className="revelar cartao flex gap-6 p-7 transition-colors duration-500 hover:border-magenta/35 md:p-9"
                    >
                      <span className="tabular shrink-0 font-mono text-xs text-magenta-texto">
                        {item.i}
                      </span>
                      <div className="min-w-0">
                        <dt className="font-display text-xl font-bold tracking-[-0.02em] md:text-2xl">
                          {item.t}
                        </dt>
                        <dd className="mt-3 max-w-[56ch] leading-relaxed text-cinza">
                          {item.d}
                        </dd>
                      </div>
                    </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        {/* ==========================================================
            8. METODOLOGIA
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
            9. NIVEIS DE PARCERIA

            Aqui havia a tabela de planos, com nome e itens de cada um.
            Ela saiu do site: plano com preco e escopo agora existe so
            dentro da proposta, que e link unico, noindex e por cliente.

            O que fica e a ESCADA em palavras. Ela responde "ate onde
            voces entram?", que e a pergunta que traz a pessoa a esta
            altura da pagina, sem transformar a home num cardapio que
            desconto nenhum consegue negociar depois.
            ========================================================== */}
        <section id="parceria" className="scroll-mt-24 relative overflow-hidden border-y border-fio bg-marinho-fundo py-24 md:py-32">
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div className="brilho-magenta absolute left-1/2 top-1/2 h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/2 opacity-[0.18]" />
          </div>

          <div className={secao}>
            <div className="revelar max-w-[46rem]">
              <Rotulo>Níveis de parceria</Rotulo>
              <h2 className={tituloSecao + ' max-w-[22ch]'}>
                Três profundidades, e a escolha depende de onde sua loja trava.
              </h2>
              <p className="mt-7 max-w-[58ch] text-guia text-neve">
                A Psy Comunic entra no ponto em que a operação precisa, e não num pacote
                fechado. O escopo e o investimento saem na proposta, depois do diagnóstico,
                porque antes disso qualquer número seria chute.
              </p>
            </div>

            <ol className="mt-16 grid items-start gap-6 lg:grid-cols-3">
              {[
                {
                  n: '01',
                  t: 'Só a mídia',
                  d: 'Meta e Google geridos com meta declarada, leitura semanal e um retrato do mês que dá para conferir número por número.',
                  q: 'Para quem já vende e quer parar de gastar no escuro.',
                },
                {
                  n: '02',
                  t: 'Mídia e canais próprios',
                  d: 'Tudo acima, mais conteúdo, criativos do dia a dia, campanhas de data e recuperação de carrinho. A loja passa a vender também quando a verba pausa.',
                  q: 'Para quem depende demais de comprar tráfego.',
                  destaque: true,
                },
                {
                  n: '03',
                  t: 'A operação inteira',
                  d: 'Tudo acima, mais plataforma, marketplaces, funil comercial, produto e mentoria do seu time. A agência dentro da operação.',
                  q: 'Para quem quer crescer sem montar um time do zero.',
                },
              ].map((nivel) => (
                <li
                  key={nivel.n}
                  className={
                    'revelar cartao relative p-9 transition-transform duration-500 md:p-10 ' +
                    (nivel.destaque
                      ? 'border-magenta/45 lg:-translate-y-5 lg:shadow-[0_30px_80px_-30px_rgba(228,21,95,0.55)]'
                      : 'hover:-translate-y-1')
                  }
                >
                  {nivel.destaque ? (
                    <span
                      aria-hidden
                      className="brilho-magenta pointer-events-none absolute -top-32 left-1/2 h-72 w-96 -translate-x-1/2 opacity-45"
                    />
                  ) : null}

                  <span className="relative font-mono text-[0.7rem] uppercase tracking-[0.2em] text-magenta-texto">
                    {nivel.n}
                  </span>

                  <h3 className="relative mt-5 font-display text-sub font-extrabold tracking-[-0.035em]">
                    {nivel.t}
                  </h3>

                  <p className="relative mt-6 border-t border-fio pt-6 text-guia leading-relaxed text-neve">
                    {nivel.d}
                  </p>

                  <p className="relative mt-6 text-sm text-cinza">{nivel.q}</p>
                </li>
              ))}
            </ol>

            <div className="revelar mt-14 flex flex-wrap items-center gap-4">
              <Botao href="/diagnostico" variante="primario">
                Pedir uma proposta
              </Botao>
              <p className="text-sm text-cinza">
                O escopo e o investimento chegam por link, depois do diagnóstico.
              </p>
            </div>
          </div>
        </section>

        {/* ==========================================================
            10. CASES
            ========================================================== */}
        <section id="cases" className="scroll-mt-24 relative overflow-hidden py-24 md:py-32">
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div className="brilho-frio absolute -right-[12%] top-1/4 h-[600px] w-[600px] opacity-20" />
          </div>

          <div className={secao}>
            <div className="revelar flex flex-wrap items-end justify-between gap-8">
              <div className="max-w-[42rem]">
                <Rotulo>Trabalhos</Rotulo>
                <h2 className={tituloSecao + ' max-w-[19ch]'}>
                  Sites e lojas que a Psy Comunic construiu.
                </h2>
              </div>
              <p className="max-w-[34ch] font-mono text-[0.68rem] uppercase leading-relaxed tracking-[0.16em] text-cinza">
                {trabalhos.length} projetos · passe o cursor para percorrer a página inteira
              </p>
            </div>

            {/*
              Portfólio, e não estudo de caso. A diferença não é
              semântica: aqui está o print da página que existe, com o
              nome de quem encomendou, e NENHUM número. Métrica de
              cliente exige autorização escrita e período de referência
              declarado, e por isso `cases` continua vazio.
            */}
            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {trabalhos.map((t) => (
                <Vitrine key={t.arquivo} trabalho={t} />
              ))}
            </div>

            {cases.length === 0 ? (
              <p className="revelar mt-12 max-w-[64ch] leading-relaxed text-neve">
                Os estudos de caso, com métrica, período e base de comparação, entram aqui
                assim que as autorizações de uso de resultado estiverem assinadas. A Psy
                Comunic não publica número de cliente sem autorização escrita e sem
                período declarado.
              </p>
            ) : null}
          </div>
        </section>

        {/* ==========================================================
            11. PARCERIAS
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
            12. CTA FINAL
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
                <Botao href="#parceria" variante="secundario">
                  Ver os níveis de parceria
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
