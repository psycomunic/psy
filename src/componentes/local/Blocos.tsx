import Link from 'next/link';
import Image from 'next/image';
import { secao } from '@/componentes/Casca';
import { LinkWhatsapp } from './LinkWhatsapp';
import { IconeSegmento } from './IconeSegmento';
import { CenaServico } from './CenaServico';
import { BotaoZap } from './BotaoZap';
import { linkDaUnidade, type Unidade } from '@/conteudo/braganca';

/**
 * Os blocos da página de unidade local.
 *
 * ============================================================
 * TUDO ENTRA POR PROP, NADA É DE BRAGANÇA
 * ============================================================
 * Nenhum destes componentes sabe que existe Bragança. Eles recebem uma
 * `Unidade` e desenham. Capanema e Salinópolis são um arquivo de
 * conteúdo novo e uma rota de três linhas, sem tocar aqui.
 *
 * ============================================================
 * O HERO DE VÍDEO MORA EM OUTRO ARQUIVO
 * ============================================================
 * A abertura com cena amarrada à rolagem (o mangue que vira a cidade
 * acesa) é `HeroCinemaLocal.tsx`, componente de cliente. `HeroLocal`
 * abaixo é a versão sem vídeo, mantida para uma unidade que ainda não
 * tenha cena própria: é só trocar o componente na rota.
 *
 * ============================================================
 * FUNDOS DE IMAGEM: SEMPRE ATRÁS DE UM VÉU
 * ============================================================
 * Quatro blocos levam uma foto da região de fundo (rua comercial,
 * balcão, litoral visto de cima, mangue ao amanhecer). Toda foto entra
 * em `-z-10`, com `alt` vazio, `sizes="100vw"` e um degradê por cima
 * que devolve o marinho nas bordas: o texto continua sobre fundo
 * escuro e nenhuma seção vira "foto com letra em cima". O arquivo fica
 * em `public/imagens/<slug>-<bloco>.jpg`, abaixo de 300 KB cada.
 */

const rotuloCss =
  'flex items-center gap-3 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-magenta-texto';
const tituloCss = 'mt-5 font-display text-titulo font-extrabold tracking-[-0.035em]';

/**
 * Foto de fundo de um bloco, já com o véu.
 *
 * `fill` + `object-cover` cobre a seção inteira; a opacidade e o
 * degradê são do bloco, porque cada foto tem um brilho diferente. O
 * `alt` vazio é de propósito: a imagem é clima, não informação, e o
 * leitor de tela pula. Tudo em `-z-10` dentro de uma seção `isolate`,
 * para ficar atrás do conteúdo e não vazar para a seção vizinha.
 */
function FundoLocal({
  u,
  bloco,
  opacidade,
  posicao = 'center',
  veu,
  faixa = 'inset-0',
}: {
  u: Unidade;
  bloco: string;
  /** Classe de opacidade da foto, ex.: 'opacity-40'. */
  opacidade: string;
  posicao?: string;
  /** Camadas de degradê por cima da foto, em classes do Tailwind. */
  veu: string;
  /**
   * Onde a foto mora dentro da seção. `inset-0` cobre tudo; numa seção
   * muito alta (a de serviços passa de 2000px) cobrir tudo esticaria a
   * foto num recorte vertical irreconhecível, então ali ela vira uma
   * faixa no topo, com o degradê fechando em marinho antes dos cartões.
   */
  faixa?: string;
}) {
  return (
    <div aria-hidden className={`pointer-events-none absolute -z-10 ${faixa}`}>
      <Image
        src={`/imagens/${u.slug}-${bloco}.jpg`}
        alt=""
        fill
        sizes="100vw"
        quality={70}
        className={`object-cover ${opacidade}`}
        style={{ objectPosition: posicao }}
      />
      <div className={`absolute inset-0 ${veu}`} />
    </div>
  );
}

export function HeroLocal({ u }: { u: Unidade }) {
  return (
    <section className="relative isolate overflow-hidden pb-16 pt-12 md:pb-24 md:pt-16">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="grade absolute inset-0 opacity-70" />
        <div className="brilho-magenta absolute -right-[18%] -top-[40%] h-[760px] w-[760px] opacity-40" />
        <div className="brilho-frio absolute -left-[24%] top-[30%] h-[620px] w-[620px] opacity-25" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-marinho" />
      </div>

      <div className={secao}>
        <nav aria-label="Trilha de navegação">
          <ol className="flex flex-wrap items-center gap-2 font-mono text-[0.66rem] uppercase tracking-[0.16em] text-cinza">
            <li>
              <Link href="/" className="transition-colors hover:text-neve">
                Início
              </Link>
            </li>
            <li className="flex items-center gap-2">
              <span aria-hidden>/</span>
              <span className="text-neve">
                {u.cidade}, {u.estado}
              </span>
            </li>
          </ol>
        </nav>

        <p className={`mt-6 ${rotuloCss}`}>
          <span aria-hidden className="h-px w-8 bg-magenta" />
          {u.heroi.rotulo}
        </p>

        {/* O único h1 da página, com a palavra-chave e a cidade. */}
        <h1 className="mt-5 max-w-[19ch] font-display text-mostro font-extrabold tracking-[-0.04em]">
          {u.heroi.titulo} <span className="text-magenta-texto">{u.heroi.destaque}</span>
        </h1>

        <p className="mt-7 max-w-[56ch] text-guia text-neve">{u.heroi.sub}</p>

        <div className="mt-9 flex flex-wrap items-center gap-3.5">
          <BotaoZap u={u} mensagem={u.heroi.mensagem} secao="hero">
            {u.heroi.acao}
          </BotaoZap>
          <a
            href="#servicos"
            className="inline-flex min-h-[52px] items-center gap-2.5 rounded-full px-7 text-sm font-semibold text-branco ring-1 ring-inset ring-white/20 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/5 hover:ring-white/45"
          >
            {u.heroi.acaoSecundaria}
            <span aria-hidden>↓</span>
          </a>
        </div>

        <p className="mt-6 text-sm leading-relaxed text-cinza">
          Atendimento por WhatsApp no {u.telefoneVisivel}. A análise não tem custo e não
          compromete você com nada.
        </p>
      </div>
    </section>
  );
}

export function ProblemasLocal({ u }: { u: Unidade }) {
  return (
    <section aria-labelledby="problemas" className="border-t border-fio py-16 md:py-24">
      <div className={secao}>
        <p className={rotuloCss}>
          <span aria-hidden className="h-px w-8 bg-magenta" />O que costuma acontecer
        </p>
        <h2 id="problemas" className={`${tituloCss} max-w-[22ch]`}>
          Se alguma destas for a sua,{' '}
          <span className="text-magenta-texto">dá para resolver.</span>
        </h2>

        <ul className="mt-12 grid gap-5 md:grid-cols-2">
          {u.problemas.map((p, i) => (
            <li key={p.titulo} className="revelar cartao p-7 md:p-8">
              <span className="tabular font-mono text-xs text-magenta-texto">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-4 font-display text-xl font-bold tracking-[-0.02em]">
                {p.titulo}
              </h3>
              <p className="mt-3 leading-relaxed text-cinza">{p.texto}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function ServicosLocal({ u }: { u: Unidade }) {
  return (
    <section
      id="servicos"
      aria-labelledby="servicos-titulo"
      className="relative isolate scroll-mt-24 overflow-clip border-t border-fio bg-marinho-fundo py-16 md:py-24"
    >
      {/* A rua comercial do centro, ao anoitecer. Bem escurecida: os
          cartões de vidro por cima precisam de fundo quase liso. */}
      <FundoLocal
        u={u}
        bloco="servicos"
        opacidade="opacity-[0.36]"
        posicao="center 45%"
        faixa="inset-x-0 top-0 h-[120vh] max-h-[1100px]"
        veu="bg-[linear-gradient(180deg,var(--marinho-fundo)_0%,rgba(11,23,48,0.35)_30%,rgba(11,23,48,0.7)_65%,var(--marinho-fundo)_100%)]"
      />
      <div className={secao}>
        <p className={rotuloCss}>
          <span aria-hidden className="h-px w-8 bg-magenta" />O que a Psy Comunic faz em{' '}
          {u.cidade}
        </p>
        <h2 id="servicos-titulo" className={`${tituloCss} max-w-[24ch]`}>
          Quatro formas de trazer{' '}
          <span className="text-magenta-texto">cliente para sua empresa.</span>
        </h2>

        <div className="mt-12 space-y-5">
          {u.servicos.map((s, i) => (
            <article key={s.id} className="revelar cartao p-7 md:p-9">
              {/*
                Com imagem, o bloco vira duas colunas. A imagem alterna de
                lado a cada serviço: quatro cartões iguais empilhados com
                a foto sempre à direita viram uma coluna monótona, e o
                olho para de percorrer.

                `lg:` e não `md:`: em tablet as duas colunas deixariam a
                lista de entregas com quatro palavras por linha.
              */}
              {/* Todo bloco tem duas colunas agora: com print do
                  entregável quando existir, e com a cena desenhada
                  enquanto não existir. A caixa é a mesma nos dois casos,
                  então trocar uma pela outra depois não mexe em nada. */}
              <div
                className={
                  'grid items-center gap-8 lg:gap-12 ' +
                  /* A proporção acompanha o LADO, e não a ordem. Com uma
                     única regra 1.1fr/0.9fr, o bloco invertido colocava a
                     cena na coluna maior e espremia o texto: medido, 593
                     para a imagem contra 485 no bloco anterior. O texto
                     fica com a coluna maior sempre. */
                  (i % 2 === 1
                    ? 'lg:grid-cols-[0.9fr_1.1fr]'
                    : 'lg:grid-cols-[1.1fr_0.9fr]')
                }
              >
                <div className={i % 2 === 1 ? 'lg:order-2' : ''}>
              <div className="flex flex-wrap items-baseline gap-3">
                <h3 className="font-display text-xl font-bold tracking-[-0.02em] md:text-2xl">
                  {s.nome}
                </h3>
                {/* O termo de mercado fica aqui, em voz baixa: quem já
                    ouviu falar reconhece, e quem não ouviu não tropeça. */}
                <span className="rounded-full border border-fio px-3 py-1 font-mono text-[0.66rem] uppercase tracking-[0.12em] text-cinza">
                  {s.tecnico}
                </span>
              </div>

              <p className="mt-2 font-mono text-[0.72rem] uppercase tracking-[0.14em] text-magenta-texto">
                {s.paraQuem}
              </p>

              <p className="mt-5 max-w-[62ch] leading-relaxed text-neve">{s.texto}</p>

              <ul className="mt-6 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-1">
                {s.entrega.map((e) => (
                  <li key={e} className="flex gap-3 text-sm leading-relaxed text-cinza">
                    <span aria-hidden className="mt-1 flex-none text-magenta-texto">
                      ●
                    </span>
                    {e}
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                <BotaoZap u={u} mensagem={s.mensagem} secao={s.id}>
                  {s.acao}
                </BotaoZap>
              </div>
                </div>

                {/* O exemplo do entregavel. Caixa de proporcao fixa com
                    `object-cover`: assim qualquer arquivo que entrar fica
                    do mesmo tamanho dos outros, e uma imagem fora do
                    formato nao desalinha a fileira inteira.

                    `object-top` porque estes exemplos sao telas, e o que
                    identifica uma tela mora em cima. */}
                <div className={i % 2 === 1 ? 'lg:order-1' : ''}>
                  {s.imagem ? (
                    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[var(--raio-p)] border border-fio bg-marinho-fundo sm:aspect-[4/3]">
                      <Image
                        src={`/imagens/${s.imagem.arquivo}`}
                        alt={s.imagem.alt}
                        fill
                        sizes="(max-width: 1024px) 92vw, 40vw"
                        className="object-cover object-top"
                      />
                    </div>
                  ) : (
                    <CenaServico id={s.id} />
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* A loja virtual só como menção, com o caminho para a home. */}
        <p className="mt-10 max-w-[64ch] text-sm leading-relaxed text-cinza">
          Se o que você precisa é vender pela internet com catálogo, carrinho e pagamento, isso
          é loja virtual, e é o que a Psy Comunic faz desde o começo.{' '}
          <Link href="/" className="text-magenta-texto underline underline-offset-4">
            Veja como funciona na página principal
          </Link>
          . Para gestão de anúncios em maior escala, há também a página de{' '}
          <Link href="/trafego-pago" className="text-magenta-texto underline underline-offset-4">
            tráfego pago
          </Link>
          .
        </p>
      </div>
    </section>
  );
}

export function PassosLocal({ u }: { u: Unidade }) {
  return (
    <section aria-labelledby="passos" className="border-t border-fio py-16 md:py-24">
      <div className={secao}>
        <p className={rotuloCss}>
          <span aria-hidden className="h-px w-8 bg-magenta" />
          Como funciona
        </p>
        <h2 id="passos" className={`${tituloCss} max-w-[20ch]`}>
          Três passos, e o primeiro{' '}
          <span className="text-magenta-texto">é só uma conversa.</span>
        </h2>

        {/*
          A TRAJETORIA, E NAO TRES CAIXAS IGUAIS.

          Antes eram tres cartoes chapados, do mesmo peso, com um numero
          pequeno em cima. Nada dizia que um vem depois do outro: era uma
          lista que por acaso estava na horizontal.

          Agora a leitura tem direcao. Um fio atravessa os tres com um
          marco em cada, o numero virou elemento grafico grande atras do
          titulo, e o ultimo passo, que e o resultado, recebe a borda
          magenta. O olho percorre do primeiro ao ultimo sem ninguem
          precisar escrever "passo 1, passo 2".

          Tudo em CSS. Nenhuma requisicao nova numa pagina que ja carrega
          uma cena de video.
        */}
        <ol className="relative mt-14 grid gap-6 md:grid-cols-3 md:gap-5">
          {/* O fio da trajetoria. Horizontal no computador, vertical no
              telefone, onde os cartoes empilham. Fica atras de tudo e
              nao intercepta toque. */}
          <span
            aria-hidden
            className="pointer-events-none absolute left-[27px] top-4 -z-10 w-px bg-[linear-gradient(180deg,transparent,var(--magenta)_18%,var(--magenta)_82%,transparent)] opacity-40 md:left-0 md:right-0 md:top-[27px] md:h-px md:w-auto md:bg-[linear-gradient(90deg,transparent,var(--magenta)_18%,var(--magenta)_82%,transparent)]"
            style={{ bottom: '1rem' }}
          />

          {u.passos.map((p, i) => {
            const ultimo = i === u.passos.length - 1;
            return (
              <li
                key={p.n}
                className={
                  'revelar cartao relative overflow-hidden p-7 pt-10 transition-all duration-500 md:p-8 md:pt-11 ' +
                  'hover:-translate-y-1 ' +
                  (ultimo ? 'border-magenta/45' : 'hover:border-magenta/30')
                }
              >
                {/* O numero grande, atras do texto. E o que da escala e
                    ritmo a fileira sem ocupar espaco de leitura. */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute -right-2 -top-4 font-display text-[5.5rem] font-extrabold leading-none tracking-[-0.06em] text-branco/[0.05] md:text-[6.5rem]"
                >
                  {p.n}
                </span>

                {/* O marco sobre o fio. */}
                <span
                  aria-hidden
                  className={
                    'absolute left-7 top-6 h-3 w-3 rounded-full md:left-8 ' +
                    (ultimo
                      ? 'bg-magenta shadow-[0_0_0_5px_rgba(228,21,95,0.18)]'
                      : 'bg-magenta/60 shadow-[0_0_0_5px_rgba(228,21,95,0.1)]')
                  }
                />

                <h3 className="relative mt-3 font-display text-lg font-bold tracking-[-0.02em]">
                  {p.titulo}
                </h3>
                <p className="relative mt-3 text-sm leading-relaxed text-cinza">{p.texto}</p>

                {ultimo ? (
                  <p className="relative mt-5 font-mono text-[0.66rem] uppercase tracking-[0.16em] text-magenta-texto">
                    E a decisão é sua
                  </p>
                ) : null}
              </li>
            );
          })}
        </ol>

        <div className="mt-10">
          <BotaoZap u={u} mensagem={u.heroi.mensagem} secao="como-funciona">
            Começar pela conversa
          </BotaoZap>
        </div>
      </div>
    </section>
  );
}

export function ParaQuemLocal({ u }: { u: Unidade }) {
  return (
    <section
      aria-labelledby="para-quem"
      className="relative isolate overflow-clip border-t border-fio bg-marinho-fundo py-16 md:py-24"
    >
      {/* O balcão de um comércio de verdade, com o celular apagado em
          cima: é o retrato de quem esta seção lista. */}
      <FundoLocal
        u={u}
        bloco="paraquem"
        opacidade="opacity-[0.42]"
        posicao="center 60%"
        veu="bg-[linear-gradient(180deg,var(--marinho-fundo)_0%,transparent_30%,transparent_65%,var(--marinho-fundo)_100%)]"
      />
      <div className={secao}>
        <p className={rotuloCss}>
          <span aria-hidden className="h-px w-8 bg-magenta" />
          Para quem é
        </p>
        <h2 id="para-quem" className={`${tituloCss} max-w-[24ch]`}>
          Negócios que vivem de{' '}
          <span className="text-magenta-texto">cliente da região.</span>
        </h2>

        {/*
          ICONE EM CADA SEGMENTO.

          A grade era seis blocos de texto do mesmo peso, e o olho nao
          tinha onde pousar: quem procura "pousada" precisava LER os seis
          titulos para se achar. O icone da o ponto de entrada, e a
          pessoa reconhece o proprio negocio antes de ler a palavra.

          Desenhados em traco, no mesmo peso do fio dos cards, e inline:
          seis arquivos de poucas centenas de bytes custariam seis
          requisicoes numa pagina que ja carrega uma cena de video.

          `group` no bloco para o icone acender junto no hover, que e o
          que amarra o desenho ao cartao em vez de deixa-lo colado.
        */}
        <dl className="mt-12 grid gap-px overflow-hidden rounded-[var(--raio)] border border-fio bg-[var(--fio)] sm:grid-cols-2 lg:grid-cols-3">
          {u.paraQuem.map((g) => (
            <div
              key={g.grupo}
              className="group bg-marinho-fundo px-7 py-8 transition-colors duration-500 hover:bg-marinho-alto/40"
            >
              {/* A pastilha com volume. 68px contra os 44 de antes, e o
                  traço do ícone em 34: o desenho vira o primeiro elemento
                  do bloco, e não um detalhe ao lado do título. O relevo
                  e a sombra estão em `icone-3d`, no globals.css. */}
              <span aria-hidden className="icone-3d h-[68px] w-[68px] text-magenta-texto">
                <span className="icone-3d-luz" />
                <IconeSegmento
                  grupo={g.grupo}
                  className="relative h-[34px] w-[34px] drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)]"
                />
              </span>
              <dt className="mt-6 font-display text-lg font-bold tracking-[-0.02em]">{g.grupo}</dt>
              <dd className="mt-2.5 text-sm leading-relaxed text-cinza">{g.exemplos}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

export function CidadesLocal({ u }: { u: Unidade }) {
  return (
    <section
      aria-labelledby="cidades"
      className="relative isolate overflow-clip border-t border-fio py-16 md:py-20"
    >
      {/* O litoral bragantino visto de cima, à noite: os pontos de luz
          são as cidades da lista. Menos véu que nos outros, porque a
          foto já nasce escura. */}
      <FundoLocal
        u={u}
        bloco="cidades"
        opacidade="opacity-[0.72]"
        posicao="center 30%"
        veu="bg-[linear-gradient(90deg,var(--marinho)_0%,rgba(16,31,63,0.82)_38%,rgba(16,31,63,0.15)_72%,transparent_100%),linear-gradient(180deg,var(--marinho)_0%,transparent_18%,transparent_82%,var(--marinho)_100%)]"
      />
      <div className={secao}>
        <p className={rotuloCss}>
          <span aria-hidden className="h-px w-8 bg-magenta" />
          Onde atendemos
        </p>
        <h2 id="cidades" className={`${tituloCss} max-w-[22ch]`}>
          {u.cidade} e as cidades{' '}
          <span className="text-magenta-texto">em volta.</span>
        </h2>
        {/* Texto corrido de propósito. A mesma lista em bloco de
            etiquetas vira amontoado de palavra-chave, que é exatamente o
            que o Google aprendeu a descontar. */}
        <p className="mt-7 max-w-[70ch] text-guia leading-relaxed text-neve">
          {u.cidadesTexto}
        </p>
      </div>
    </section>
  );
}

export function PerguntasLocal({ u }: { u: Unidade }) {
  return (
    <section
      aria-labelledby="perguntas"
      className="border-t border-fio bg-marinho-fundo py-16 md:py-24"
    >
      <div className={secao}>
        <p className={rotuloCss}>
          <span aria-hidden className="h-px w-8 bg-magenta" />
          Perguntas frequentes
        </p>
        <h2 id="perguntas" className={`${tituloCss} max-w-[22ch]`}>
          O que as pessoas perguntam{' '}
          <span className="text-magenta-texto">antes de começar.</span>
        </h2>

        {/* `details` nativo: abre sem JavaScript e o texto da resposta
            está no HTML desde o primeiro byte, que é o que o Google
            exige para marcar FAQ. */}
        <div className="mt-12 divide-y divide-fio border-y border-fio">
          {u.perguntas.map((p) => (
            <details key={p.pergunta} className="group py-5">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-6">
                <h3 className="font-display text-lg font-bold tracking-[-0.02em] text-branco">
                  {p.pergunta}
                </h3>
                <span
                  aria-hidden
                  className="mt-1 flex-none text-magenta-texto transition-transform duration-300 group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-4 max-w-[70ch] leading-relaxed text-cinza">{p.resposta}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AutoridadeLocal({
  u,
  anos,
  parcerias,
  trabalhos,
}: {
  u: Unidade;
  anos: string;
  parcerias: string[];
  trabalhos: { nome: string; arquivo: string; largura: number; altura: number }[];
}) {
  return (
    <section aria-labelledby="quem" className="border-t border-fio py-16 md:py-24">
      <div className={secao}>
        <p className={rotuloCss}>
          <span aria-hidden className="h-px w-8 bg-magenta" />
          Quem está por trás
        </p>
        <h2 id="quem" className={`${tituloCss} max-w-[24ch]`}>
          A unidade é nova em {u.cidade}.{' '}
          <span className="text-magenta-texto">A casa, não.</span>
        </h2>

        <p className="mt-7 max-w-[64ch] text-guia leading-relaxed text-neve">
          {anos} de mercado em design, tecnologia e anúncios, com marcas atendidas em todo o
          Brasil. A Psy Comunic é {parcerias.join(' e ')}, que são as certificações de quem
          opera as contas de anúncio do Google e da Meta.
        </p>

        <h3 className="mt-14 font-display text-lg font-bold tracking-[-0.02em]">
          Alguns sites que saíram daqui
        </h3>
        <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {trabalhos.map((t) => (
            <li key={t.arquivo} className="revelar cartao overflow-hidden">
              {/* Altura fixa e proporção declarada: a imagem reserva o
                  espaço antes de chegar, então a página não pula quando
                  ela carrega. */}
              <div className="relative h-52 w-full overflow-hidden">
                <Image
                  src={`/imagens/sites/${t.arquivo}`}
                  alt={`Site da ${t.nome}, criado pela Psy Comunic`}
                  width={t.largura}
                  height={t.altura}
                  sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 30vw"
                  className="absolute inset-0 h-full w-full object-cover object-top"
                />
              </div>
              <p className="border-t border-fio px-6 py-4 font-display font-bold tracking-[-0.02em]">
                {t.nome}
              </p>
            </li>
          ))}
        </ul>

        <p className="mt-8 text-sm leading-relaxed text-cinza">
          Mais trabalhos na{' '}
          <Link href="/cases" className="text-magenta-texto underline underline-offset-4">
            página de trabalhos
          </Link>
          . Para falar com a equipe fora do WhatsApp, use a{' '}
          <Link href="/contato" className="text-magenta-texto underline underline-offset-4">
            página de contato
          </Link>
          .
        </p>
      </div>
    </section>
  );
}

export function FechamentoLocal({ u }: { u: Unidade }) {
  return (
    <section className="relative isolate overflow-clip bg-magenta py-20 md:py-24">
      {/* O mangue ao amanhecer, já gerado em magenta: a silhueta das
          raízes entra por baixo dos degradês que o bloco já tinha. */}
      <FundoLocal
        u={u}
        bloco="fechamento"
        opacidade="opacity-[0.55]"
        posicao="center 35%"
        veu="bg-[linear-gradient(90deg,var(--magenta)_0%,rgba(228,21,95,0.55)_40%,rgba(228,21,95,0.2)_100%)]"
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(120%_100%_at_15%_0%,rgba(255,255,255,0.22),transparent_55%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(200deg,transparent_35%,rgba(16,31,63,0.55))]" />
      </div>
      <div className={secao}>
        <h2 className="max-w-[18ch] font-display text-titulo font-extrabold tracking-[-0.04em] text-branco">
          {u.fechamento.titulo}
        </h2>
        <p className="mt-6 max-w-[54ch] text-guia text-branco/90">{u.fechamento.texto}</p>
        <div className="mt-9 flex flex-wrap items-center gap-4">
          <BotaoZap u={u} mensagem={u.fechamento.mensagem} secao="fechamento" variante="claro">
            {u.fechamento.acao}
          </BotaoZap>
        </div>
        <p className="mt-7 text-sm text-branco/85">
          {u.cidade}, {u.estado} · WhatsApp {u.telefoneVisivel}
        </p>
      </div>
    </section>
  );
}

/**
 * Botão flutuante da unidade, só no celular.
 *
 * Ele SUBSTITUI o botão global do site nesta rota, em vez de somar com
 * ele: o global carrega o número de Blumenau, e dois botões verdes no
 * mesmo canto seria erro de montagem. Por isso a `Casca` recebe
 * `semZap` aqui.
 *
 * Aparece em toda largura, e não só no telefone. No celular ele é o que
 * foi pedido; no computador, tirá-lo deixaria esta página com menos
 * atalho que o resto do site, sem ganho nenhum. Alvo de 56px, acima dos
 * 44 da WCAG, e `bottom-6` deixa folga do rodapé sem cobrir texto.
 */
export function ZapFlutuanteLocal({ u }: { u: Unidade }) {
  return (
    <LinkWhatsapp
      href={linkDaUnidade(u, u.heroi.mensagem)}
      pagina={u.slug}
      secao="flutuante"
      rotuloAcessivel={`Falar com a Psy Comunic ${u.cidade} no WhatsApp`}
      className="fixed bottom-6 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] shadow-[0_10px_30px_-6px_rgba(37,211,102,0.5)] transition-transform duration-300 hover:scale-105 md:bottom-8 md:right-8"
    >
      <svg viewBox="0 0 24 24" className="h-7 w-7 fill-white" aria-hidden>
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.174.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884a9.82 9.82 0 016.988 2.896 9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.359.101 11.945c0 2.096.549 4.14 1.595 5.945L0 24l6.335-1.652a11.882 11.882 0 005.71 1.454h.006c6.585 0 11.946-5.359 11.949-11.945a11.87 11.87 0 00-3.48-8.408" />
      </svg>
    </LinkWhatsapp>
  );
}
