import Link from 'next/link';
import Image from 'next/image';
import { Cabecalho } from '@/componentes/Cabecalho';
import { Rodape } from '@/componentes/Rodape';
import { Botao } from '@/componentes/Botao';
import { FitaMarcas } from '@/componentes/FitaMarcas';
import { Vitrine } from '@/componentes/Vitrine';
import { ColunasDeSites } from '@/componentes/ColunasDeSites';
import { IconeFrente } from '@/componentes/IconeFrente';
import { CartaoCredencial } from '@/componentes/CartaoCredencial';
import { BotaoWhatsapp } from '@/componentes/BotaoWhatsapp';
import { HeroCinema } from '@/componentes/HeroCinema';
import { Interacoes } from '@/componentes/Interacoes';
import { CenaCinema } from '@/componentes/CenaCinema';
import { marca, credenciais, numerosDaCapa } from '@/conteudo/marca';
import { frentes, resultados, metodologia } from '@/conteudo/frentes';
import { marcasAtendidas, parcerias, cases } from '@/conteudo/prova';
import { trabalhos, lojas, outrosProjetos, logosMarcas } from '@/conteudo/trabalhos';
import { jornada, promessaCompleta, porQueCompleta, niveisDeParceria } from '@/conteudo/jornada';

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
      {/* Barra de progresso da página e o kit de interações por atributo. */}
      <div id="progresso-pagina" aria-hidden />
      <Interacoes />
      <main id="conteudo">

        {/* ==========================================================
            1. HERO: SCROLL CINEMA

            O lançamento controlado pela rolagem. O texto da abertura
            (a mesma headline de antes, em três tempos) vive dentro do
            componente, junto do vídeo, porque as camadas se revezam
            pelo mesmo progresso que move o foguete. Ver HeroCinema.tsx.
            ========================================================== */}
        <HeroCinema />

        {/* ==========================================================
            1b. PROVA LOGO APÓS O POUSO

            A faixa de prova e as colunas de sites saíram de dentro do
            hero: ali disputariam a tela com o vídeo. Aqui elas são a
            primeira coisa sólida depois da cena, e respondem a
            pergunta que a abertura deixa: "e vocês entregam o quê?".
            ========================================================== */}
        <section className="relative isolate overflow-clip pb-20 pt-6 md:pb-28 md:pt-10">
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div className="estrelas absolute inset-0" data-paralaxe="0.08" />
            <div className="brilho-magenta absolute -right-[18%] -top-[30%] h-[820px] w-[820px] opacity-35" data-paralaxe="-0.18" />
          </div>

          <div className={secao}>
            <div className="grid items-center gap-14 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
              <div className="revelar min-w-0">
                <Rotulo>Missão cumprida, todo mês</Rotulo>
                <h2 className={tituloSecao + ' max-w-[16ch]'}>
                  O que a Psy Comunic coloca{' '}
                  <span className="text-magenta-texto">em órbita.</span>
                </h2>
                <p className="mt-7 max-w-[54ch] text-guia text-neve">
                  Lojas de moda que saíram daqui prontas para vender: plataforma, catálogo
                  com grade e medidas, checkout, rastreamento e a primeira campanha no ar.
                  Passe o olho pela coluna ao lado e depois desça: o resto da página
                  mostra como.
                </p>

                {/* Quatro cartões, e por isso 2x2 e não uma fileira de
                    três: em `sm` cabem dois por linha sem espremer o
                    número, e em `xl` os quatro entram lado a lado. */}
                <dl className="mt-12 grid gap-px overflow-hidden rounded-[var(--raio)] border border-fio bg-[var(--fio)] sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  {numerosDaCapa.map((item) => (
                    <div key={item.d} className="bg-marinho px-6 py-6 md:px-7 md:py-7">
                      <dt className="flex items-baseline gap-2.5">
                        <span
                          className="tabular font-display text-2xl font-extrabold tracking-[-0.04em] md:text-3xl"
                          data-contar={/^\d+$/.test(item.n) ? item.n : undefined}
                        >
                          {item.n}
                        </span>
                        {item.u ? (
                          <span className="font-mono text-[0.66rem] uppercase tracking-[0.18em] text-cinza">
                            {item.u}
                          </span>
                        ) : null}
                      </dt>
                      <dd className="mt-2.5 max-w-[26ch] text-sm leading-relaxed text-cinza">
                        {item.d}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="revelar min-w-0 lg:pl-4">
                <ColunasDeSites />
              </div>
            </div>
          </div>
        </section>

        {/* ==========================================================
            1c. QUEM ESTÁ POR TRÁS

            Estava no fim da página, depois da metodologia. Subiu para
            cá, logo abaixo dos números, porque é o ativo de
            credibilidade mais forte do site: quem escreve esta página
            já respondeu por um e-commerce, e isso precisa ser lido
            ANTES de qualquer descrição de serviço. Descrição de
            serviço toda agência tem.

            Angelo aparece em terceira pessoa, e só porque a informação
            é sobre ele. Ver CLAUDE.md.
            ========================================================== */}
        <section id="quem-somos" className="scroll-mt-24 relative overflow-clip border-y border-fio bg-marinho-fundo py-24 md:py-32">
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div className="estrelas absolute inset-0" />
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
              <figure className="revelar relative overflow-clip rounded-[var(--raio)] border border-fio" data-inclina>
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
              {/* Empilhadas, e cada uma um card próprio: três blocos
                  com peso igual pesam mais do que três parágrafos
                  separados por fio. A marcação vive em
                  CartaoCredencial, porque /sobre mostra os mesmos
                  três. */}
              <div className="grid gap-5">
                {credenciais.map((item) => (
                  <CartaoCredencial key={item.t} item={item} className="revelar" />
                ))}
              </div>
            </div>
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

          {/*
            O cartaz das marcas, SÓ no celular.

            No computador as duas fitas já ocupam a largura toda e o
            cartaz seria a terceira vez que a mesma prova aparece na
            mesma tela. No telefone a fita passa estreita e rápida, e o
            cartaz é onde dá para parar e reconhecer os nomes.

            `lazy` não é detalhe: com `md:hidden` o elemento some no
            computador, e imagem escondida com lazy não chega a ser
            baixada. Sem isso, todo visitante de desktop pagaria por um
            arquivo que nunca vai ver. É a mesma conta da terceira coluna
            em ColunasDeSites.
          */}
          <div className={`${secao} mt-12 md:hidden`}>
            <Image
              src="/site.png"
              alt="Cartaz com os logos de vinte marcas atendidas pela Psy Comunic"
              width={1080}
              height={1350}
              sizes="(max-width: 767px) 92vw, 1px"
              loading="lazy"
              className="mx-auto w-full max-w-[440px] rounded-[var(--raio)] border border-fio"
            />
          </div>
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
          className="scroll-mt-24 relative overflow-clip py-24 md:py-32"
          data-cena
        >
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div className="estrelas absolute inset-0" data-paralaxe="0.06" />
            <div className="orbita absolute left-1/2 top-[58%] h-[900px] w-[1600px] -translate-x-1/2 opacity-70" data-paralaxe="-0.1" />
            <div className="brilho-magenta absolute -left-[15%] top-1/3 h-[560px] w-[720px] opacity-25" data-paralaxe="-0.2" />
          </div>

          <div className={secao}>
            <div className="revelar max-w-[52rem]">
              <Rotulo>Solução completa</Rotulo>
              <h2 id="jornada-titulo" className={tituloSecao + ' max-w-[19ch]'}>
                Construímos a loja de moda. E ficamos para{' '}
                <span className="text-magenta-texto">fazer ela vender.</span>
              </h2>
              <p className="mt-7 max-w-[58ch] text-guia text-neve">{promessaCompleta}</p>
            </div>

          </div>
        </section>

        {/* ==========================================================
            3b. CENA: A ESTAÇÃO

            A jornada em vídeo comandado pela rolagem: um módulo escuro
            e sozinho vira a estação inteira, acesa, com os módulos
            acoplados. O painel à esquerda mostra a fase atual e cada
            item da fase acende quando o módulo correspondente acopla.
            O contador de módulos é o detalhe temático da cena.
            ========================================================== */}
        <CenaCinema
          id="estacao"
          src="/video/estacao.mp4"
          poster="/imagens/estacao-frame-a.jpg"
          etapas={2}
          rotulo="A jornada, do módulo à estação"
        >
          <div className="cena-caixa">
            <div className="cena-painel">
              <p className="flex items-center justify-between gap-4 font-mono text-[0.62rem] uppercase tracking-[0.22em] text-cinza">
                <span>Módulos acoplados</span>
                {/* Só o texto de fallback sem JS: a cena recalcula
                    "acesos/total" ao rolar. Derivado da lista para não
                    mentir quando um item entrar ou sair dela. */}
                <span className="tabular text-magenta-texto" data-contagem>
                  {`00/${jornada.reduce((total, f) => total + f.itens.length, 0)}`}
                </span>
              </p>

              <div className="cena-etapas mt-6">
                {jornada.map((fase, i) => (
                  <article key={fase.id} className="cena-etapa" data-i={i}>
                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className={
                          'rounded-full px-3 py-1 font-mono text-[0.62rem] uppercase tracking-[0.16em] ' +
                          (i === 1 ? 'bg-magenta text-branco' : 'border border-fio text-magenta-texto')
                        }
                      >
                        {fase.etiqueta}
                      </span>
                      <span className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-cinza">
                        {fase.entrega}
                      </span>
                    </div>
                    <h3 className="mt-4 font-display text-sub font-extrabold tracking-[-0.035em]">
                      {fase.titulo}
                    </h3>
                    <p className="cena-resumo mt-3 text-sm leading-relaxed text-neve">{fase.resumo}</p>
                  </article>
                ))}
              </div>

              {/* A lista completa das duas fases, acendendo em ordem: os
                  8 itens da fase 1 e depois os 7 da fase 2. */}
              <ul className="mt-6 space-y-2 border-t border-fio pt-5">
                {jornada
                  .flatMap((fase, f) => fase.itens.map((item) => ({ item, f })))
                  .map(({ item, f }, i) => (
                  <li key={item} className="text-[0.82rem] leading-snug" data-acende={i} data-fase={f}>
                    <span aria-hidden className="acende-ponto" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CenaCinema>

        <section aria-label="Por que a solução completa" className="relative overflow-clip py-20 md:py-28">
          <div className={secao}>
            {/* Por que completa importa. "Solução completa" é o que toda
                agência escreve; sem dizer o que a alternativa custa, a
                frase não significa nada. */}
            <div className="grid gap-px overflow-hidden rounded-[var(--raio)] border border-fio bg-[var(--fio)] md:grid-cols-3">
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
        <section className="relative overflow-clip py-24 md:py-32">
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div className="brilho-frio absolute -left-[15%] top-1/4 h-[560px] w-[560px] opacity-20" data-paralaxe="-0.22" />
          </div>

          <div className={secao}>
            <div className="revelar max-w-[46rem]">
              <Rotulo>O diagnóstico</Rotulo>
              <h2 className={tituloSecao + ' max-w-[18ch]'}>
                Sua loja de moda recebe visitas e{' '}
                <span className="text-magenta-texto">não converte?</span>
              </h2>
              <p className="mt-7 max-w-[60ch] text-guia text-neve">
                Você investe em mídia, o tráfego sobe e a venda não acompanha. Na moda, o
                problema quase nunca está no anúncio: está na dúvida do tamanho, na foto
                que não mostra o caimento, no frete que aparece só no checkout ou na grade
                cadastrada errada. É por isso que a Psy Comunic olha as quatro frentes.
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
                  <div className="cartao h-full px-8 py-9 md:px-10 md:py-11" data-inclina>
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
        <section id="frentes" className="scroll-mt-24 relative overflow-clip border-y border-fio bg-marinho-fundo py-24 md:py-32">
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div className="brilho-magenta absolute left-1/2 top-0 h-[700px] w-[900px] -translate-x-1/2 opacity-20" data-paralaxe="-0.15" />
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
                  data-inclina
                  className="revelar cartao group relative overflow-clip p-9 hover:border-magenta/40 md:p-11"
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
            8. METODOLOGIA
            ========================================================== */}
        <section id="metodologia" className="scroll-mt-24 py-24 md:py-32" data-cena>
          <div className={secao}>
            <div className="revelar max-w-[46rem]">
              <Rotulo>Metodologia</Rotulo>
              <h2 className={tituloSecao}>Três processos. Zero achismo.</h2>
            </div>

            <ol className="relative mt-16 grid gap-10 md:grid-cols-3 md:gap-8" data-etapas>
              {/* Linha que costura os três passos e se desenha com a
                  rolagem. Só no desktop: no celular os cards empilham e
                  a linha horizontal mentiria sobre a direção da leitura. */}
              <svg aria-hidden className="orbita-svg hidden md:block" viewBox="0 0 1000 10" preserveAspectRatio="none" style={{ height: '2.2rem' }}>
                <path data-desenha d="M 0 5 L 1000 5" />
              </svg>
              {metodologia.map((m, i) => (
                <li key={m.nome} className="revelar relative">
                  <span className="etapa-numero relative z-10 flex h-9 w-9 items-center justify-center rounded-full border border-magenta/50 bg-marinho font-mono text-xs text-magenta-texto transition-all duration-500">
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
        <section id="parceria" className="scroll-mt-24 relative overflow-clip border-y border-fio bg-marinho-fundo py-24 md:py-32">
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div className="estrelas absolute inset-0" data-paralaxe="0.06" />
            <div className="orbita absolute left-1/2 top-[40%] h-[700px] w-[1300px] -translate-x-1/2 opacity-60" data-paralaxe="-0.12" />
            <div className="brilho-magenta absolute left-1/2 top-1/2 h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/2 opacity-[0.42]" />
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

          </div>
        </section>

        {/* ==========================================================
            9b. CENA: A DESCIDA

            Três profundidades como três altitudes. A câmera desce da
            órbita até a cidade acesa, e o altímetro à direita marca em
            qual nível a operação está: Só a mídia (órbita), Mídia e
            canais próprios (atmosfera), A operação inteira (superfície).
            O painel troca de nível junto com a agulha.
            ========================================================== */}
        <CenaCinema
          id="descida"
          src="/video/descida.mp4"
          poster="/imagens/descida-frame-a.jpg"
          etapas={3}
          rotulo="Os três níveis de parceria"
        >
          <div className="cena-caixa">
            <div className="cena-painel">
              <p className="flex items-center justify-between gap-4 font-mono text-[0.62rem] uppercase tracking-[0.22em] text-cinza">
                <span>Altitude</span>
                <span className="tabular text-magenta-texto">
                  <span data-valor="400">400</span> km
                </span>
              </p>

              <div className="cena-etapas mt-6">
                {niveisDeParceria.map((nivel, i) => (
                  <article key={nivel.n} className="cena-etapa" data-i={i}>
                    <p className="flex items-center gap-3 font-mono text-[0.66rem] uppercase tracking-[0.2em] text-magenta-texto">
                      <span>{nivel.n}</span>
                      <span aria-hidden className="h-px w-6 bg-magenta" />
                      <span className="text-cinza">{nivel.onde}</span>
                    </p>
                    <h3 className="mt-4 font-display text-sub font-extrabold tracking-[-0.035em]">
                      {nivel.titulo}
                    </h3>
                    <p className="mt-4 border-t border-fio pt-4 text-guia leading-relaxed text-neve">
                      {nivel.texto}
                    </p>
                    <p className="mt-4 text-sm text-cinza">{nivel.paraQuem}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>

          <div aria-hidden className="altimetro" data-medidor>
            {niveisDeParceria.map((nivel, i) => (
              <span key={nivel.n} className="altimetro-marca" data-i={i}>
                {nivel.onde}
              </span>
            ))}
            <span className="altimetro-agulha" />
          </div>
        </CenaCinema>

        <section aria-label="Pedir uma proposta" className="border-b border-fio bg-marinho-fundo py-16 md:py-20">
          <div className={secao}>
            <div className="revelar flex flex-wrap items-center gap-4">
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
        <section id="cases" className="scroll-mt-24 relative overflow-clip py-24 md:py-32">
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div className="brilho-frio absolute -right-[12%] top-1/4 h-[600px] w-[600px] opacity-20" data-paralaxe="-0.2" />
          </div>

          <div className={secao}>
            <div className="revelar flex flex-wrap items-end justify-between gap-8">
              <div className="max-w-[42rem]">
                <Rotulo>Trabalhos</Rotulo>
                <h2 className={tituloSecao + ' max-w-[19ch]'}>
                  Lojas de moda que a Psy Comunic construiu.
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
              {lojas.map((t) => (
                <Vitrine key={t.arquivo} trabalho={t} />
              ))}
            </div>

            {/*
              Os sites de serviço, embaixo e sob subtítulo próprio.

              A galeria de cima é a prova do que esta página promete, e
              um site de contabilidade no meio dela enfraquece as lojas
              em vez de somar. Aqui embaixo ele soma de novo, como
              alcance do estúdio, para quem já desceu a página inteira.
            */}
            <div className="revelar mt-20 border-t border-fio pt-12">
              <p className={rotulo}>Outros projetos</p>
              <p className="mt-4 max-w-[52ch] leading-relaxed text-cinza">
                Fora do varejo de moda, a Psy Comunic também constrói site de serviço e
                de conteúdo.
              </p>
              <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {outrosProjetos.map((t) => (
                  <Vitrine key={t.arquivo} trabalho={t} />
                ))}
              </div>
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
            <div className="estrelas absolute inset-0 opacity-70" data-paralaxe="0.1" />
          </div>

          <div className={secao}>
            <div className="revelar max-w-[52rem]">
              <h2 className="max-w-[17ch] font-display text-titulo font-extrabold tracking-[-0.04em] text-branco">
                Vamos olhar a sua loja de moda inteira.
              </h2>
              <p className="mt-7 max-w-[50ch] text-guia text-branco/90">
                Diagnóstico gratuito nas quatro frentes, com as prioridades apontadas por
                ordem de impacto no faturamento.
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <Botao href="/diagnostico" variante="claro" className="warp">
                  Começar o diagnóstico
                </Botao>
                <Botao href="#parceria" variante="secundario" className="warp">
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
