import Link from 'next/link';
import { RetratoFundador } from '@/componentes/RetratoFundador';
import Image from 'next/image';
import { Cabecalho } from '@/componentes/Cabecalho';
import { Rodape } from '@/componentes/Rodape';
import { Botao } from '@/componentes/Botao';
import { FitaMarcas } from '@/componentes/FitaMarcas';
import { Vitrine } from '@/componentes/Vitrine';
import { ColunasDeSites } from '@/componentes/ColunasDeSites';
import { IconeFrente } from '@/componentes/IconeFrente';
import { CartaoCredencial } from '@/componentes/CartaoCredencial';
import { ProvasEmVideo } from '@/componentes/ProvasEmVideo';
import { BotaoWhatsapp } from '@/componentes/BotaoWhatsapp';
import { Interacoes } from '@/componentes/Interacoes';
import { marca, credenciais, numerosDaCapa, faturamento } from '@/conteudo/marca';
import { frentes, resultados, metodologia } from '@/conteudo/frentes';
import { marcasAtendidas, parcerias, cases } from '@/conteudo/prova';
import { lojas, logosMarcas } from '@/conteudo/trabalhos';
import { jornada, promessaCompleta, porQueCompleta, niveisDeParceria } from '@/conteudo/jornada';

const secao = 'mx-auto w-full max-w-[1180px] px-5 md:px-10';
const rotulo = 'text-[13px] font-semibold text-acento';
/* Serifada em peso 300, e nao display preta. Fina e grande. */
const tituloSecao = 'mt-5 font-display text-titulo titulo-revista';

/* O olho de seção. Tinha um fio rosa à esquerda e vinha em caixa alta
   com espaçamento de letra largo: o vocabulário de painel de operação
   do tema anterior. Agora é só a palavra, em rosa, no peso 600. */
function Rotulo({ children }: { children: React.ReactNode }) {
  return <p className={rotulo}>{children}</p>;
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
            1. HERO

            Era uma cena de video de 500vh comandada pela rolagem: o
            astronauta, a mira, o visor. Saiu junto com a metafora
            espacial inteira. O tema editorial pede o oposto: a pagina
            abre no branco, o titulo em serifada fina, e quem ocupa a
            tela sao as lojas, na coluna ao lado.

            As tres camadas de texto que se revezavam viraram uma so:
            olho, titulo, subtitulo, paragrafo e os dois botoes.
            ========================================================== */}
        <section className="relative isolate pb-16 pt-12 md:pb-24 md:pt-16">
          <div className={secao}>
            <Rotulo>Especialistas em e-commerce de moda</Rotulo>

            {/*
              O TÍTULO OCUPA A LARGURA INTEIRA, e não a coluna.

              Medido: em coluna de 600px a 92px, esta frase quebrava em
              CINCO linhas e virava um parágrafo em caixa alta. Na
              largura toda são três. É a conta que a condensada permite
              e a serifada não permitia, e é por isso que ela pode ser
              grande desse jeito.
            */}
            <h1 className="mt-5 font-display text-mostro titulo-revista">
              Sua loja de moda não precisa de mais uma agência.
            </h1>

            {/*
              A virada da frase, colada no título e não na coluna.

              É o standfirst: em revista ele vem logo abaixo da manchete
              e na largura dela, porque é a mesma frase continuando.

              Era o itálico da serifada; a condensada não tem um que
              funcione nesse tamanho, e itálico forçado numa grotesca
              fica torto. O grifo passou para o peso e para o acento.
            */}
            <p className="mt-6 font-display text-sub font-bold text-acento">
              Precisa de quem já vendeu milhões.
            </p>

            <p className="mt-10 max-w-[52ch] leading-relaxed text-tinta-fraca">
              A Psy Comunic é conduzida por quem foi sócio de um e-commerce que
              fatura{' '}
              <strong className="font-semibold text-tinta">{faturamento.ano}</strong>.
              Construímos a sua loja de moda do zero ao lançamento e continuamos
              entregando todo mês depois dele: catálogo, página de produto, tráfego
              pago e marketplaces.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Botao href="/diagnostico">Quero meu diagnóstico gratuito</Botao>
              <Botao href="/como-trabalhamos" variante="secundario">
                Ver como trabalhamos
              </Botao>
            </div>

            {/*
              AS LOJAS EM UMA FILEIRA, NA MARGEM DO TEXTO.

              Estavam numa coluna ao lado. Não fechava, e a medição
              explica por quê: a coluna de texto media 275px e a das
              lojas 883px, em 1440. Nenhuma proporção de cartão resolve
              uma diferença dessas: para as duas terminarem juntas, o
              cartão teria que virar uma tarja de 2,5:1, onde não se
              reconhece loja nenhuma.

              Embaixo, na largura inteira, o problema deixa de existir.
              Os quatro cartões começam na mesma margem esquerda do
              título e do parágrafo, têm o mesmo tamanho, e a fileira
              tem topo e base retos.
            */}
            <ul className="mt-14 grid grid-cols-2 gap-3 md:mt-16 md:grid-cols-4 md:gap-4">
              <ColunasDeSites />
            </ul>

            <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2 border-t border-fio pt-6 text-sm text-tinta-fraca">
              {frentes.map((f) => (
                <li key={f.slug} className="flex items-center gap-2">
                  <IconeFrente slug={f.slug} className="h-4 w-4 text-acento" />
                  {f.nome}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ==========================================================
            1b. A BARRA DE NUMEROS

            Faixa marinho de largura inteira. Era meia coluna ao lado
            das lojas; com as lojas na hero, ela ganha a tela toda e
            vira a primeira pausa escura da pagina.
            ========================================================== */}
        <section className="faixa-navy border-y border-fio secao-ar">
          <div className={secao}>
            <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-16">
              <div className="min-w-0">
                <Rotulo>O que a Psy Comunic entrega</Rotulo>
                <h2 className={tituloSecao + ' max-w-[16ch]'}>
                  Lojas que saem daqui prontas para vender.
                </h2>
              </div>

              <dl className="grid gap-x-10 gap-y-10 sm:grid-cols-2">
                {numerosDaCapa.map((item) => (
                  <div key={item.d} className="border-t border-fio pt-6">
                    {/* `items-end`, e nao `items-baseline`: "R$ 17
                        milhoes" quebra em duas linhas, e a base que o
                        baseline alinha e a da PRIMEIRA linha. A
                        unidade subia para o alto do bloco e parecia
                        solta. */}
                    <dt className="flex flex-wrap items-end gap-x-2.5">
                      <span
                        className="tabular font-display text-numero font-extrabold tracking-[-0.01em]"
                        data-contar={/^\d+$/.test(item.n) ? item.n : undefined}
                      >
                        {item.n}
                      </span>
                      {item.u ? (
                        <span className="text-sm text-tinta-fraca">{item.u}</span>
                      ) : null}
                    </dt>
                    <dd className="mt-3 max-w-[30ch] text-sm leading-relaxed text-tinta-fraca">
                      {item.d}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        {/* ==========================================================
            1b2. PROVAS EM VÍDEO

            Só aparece quando os arquivos existem em public/video/.
            Ver ProvasEmVideo.tsx.
            ========================================================== */}
        <ProvasEmVideo />

        {/* ==========================================================
            1c. QUEM ESTÁ POR TRÁS

            Estava no fim da página, depois da metodologia. Subiu para
            cá, logo abaixo dos números, porque é o ativo de
            credibilidade mais forte do site: quem escreve esta página
            já respondeu por um e-commerce, e isso precisa ser lido
            ANTES de qualquer descrição de serviço.

            FICA EM BRANCO, e não em faixa marinho. A regra do tema
            manda marinho aqui, mas ele caiu logo abaixo da barra de
            números, que já é marinho: duas faixas emendadas viram uma
            faixa só, e o ritmo se perde.

            Angelo aparece em terceira pessoa, e só porque a informação
            é sobre ele. Ver CLAUDE.md.
            ========================================================== */}
        <section id="quem-somos" className="scroll-mt-24 secao-ar">
          <div className={secao}>
            <div className="revelar max-w-[52ch]">
              <Rotulo>Quem está por trás</Rotulo>
              <h2 className={tituloSecao}>
                A operação foi construída por quem já esteve do outro lado do balcão.
              </h2>
            </div>

            <div className="mt-14 grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-start lg:gap-16">
              {/* --- Retrato, à esquerda ---
                  Era quadrado e pequeno. Virou retrato em pé e grande:
                  a página tinha ar demais e foto de menos, e esta é a
                  única foto de gente que o site tem. --- */}
              <RetratoFundador className="revelar" />

              {/* --- Credenciais, à direita ---
                  Empilhadas, e cada uma um card próprio: três blocos
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

            FAIXA MARINHO, e não papel. Não é preferência: os 28 logos
            são SILHUETAS BRANCAS com fundo transparente, medido nos
            arquivos (254,254,254, cerca de 30% de pixels opacos).
            Sobre o papel claro eles sumiam, e a seção era uma tarja
            vazia com uma legenda em cima.

            Dava para recolorir por máscara, como a logo do cabeçalho.
            Não vale aqui: são 28 arquivos, e uma parede de logos é
            justamente o lugar onde o fundo escuro ajuda, porque cada
            marca aparece recortada e nenhuma disputa com a outra.

            A seção de solução completa, que vem logo abaixo, passou
            para o branco no mesmo movimento. Duas faixas marinho
            emendadas viram uma faixa só.
            ========================================================== */}
        <section
          aria-labelledby="marcas-titulo"
          className="faixa-navy border-y border-fio secao-ar"
        >
          <div className={secao}>
            <div className="max-w-[52ch]">
              <Rotulo>Marcas atendidas</Rotulo>
              <h2 id="marcas-titulo" className={tituloSecao}>
                Elas já confiaram a operação à Psy Comunic.
              </h2>
            </div>
          </div>

          <div className="mt-14 md:mt-16" />

          {/* Duas fitas em sentidos opostos: o contramovimento é o que
              faz o olho perceber as duas, em vez de uma esteira só. */}
          <div className="space-y-10 md:space-y-12">
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
            3. A SOLUÇÃO COMPLETA

            Era uma cena de vídeo: um módulo solto virava a estação
            inteira, e cada item da fase acendia quando o módulo
            correspondente acoplava. Saiu com a metáfora espacial.

            O que a cena fazia bem, e por isso ficou: mostrar as DUAS
            fases lado a lado, com a lista inteira de entregas à
            vista. Era a resposta para "vocês fazem tudo ou só
            anunciam?", e ela continua sendo a dúvida que faz alguém
            sair desta página.

            Faixa marinho de largura inteira, como manda o ritmo.
            ========================================================== */}
        <section
          id="jornada"
          aria-labelledby="jornada-titulo"
          className="scroll-mt-24 secao-ar"
        >
          <div className={secao}>
            <div className="max-w-[52ch]">
              <Rotulo>Solução completa</Rotulo>
              <h2 id="jornada-titulo" className={tituloSecao}>
                Construímos a loja de moda. E ficamos para fazer ela vender.
              </h2>
              <p className="mt-6 max-w-[52ch] leading-relaxed text-tinta-fraca">
                {promessaCompleta}
              </p>
            </div>

            <div className="mt-16 grid gap-x-14 gap-y-14 md:mt-20 md:grid-cols-2">
              {jornada.map((fase) => (
                <article key={fase.id} className="border-t border-fio pt-8">
                  <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="text-sm font-semibold text-acento">{fase.etiqueta}</span>
                    <span className="text-sm text-tinta-fraca">{fase.entrega}</span>
                  </p>

                  <h3 className="mt-4 font-display text-sub font-bold tracking-[-0.01em]">
                    {fase.titulo}
                  </h3>
                  <p className="mt-4 max-w-[46ch] leading-relaxed text-tinta-fraca">{fase.resumo}</p>

                  <ul className="mt-7 space-y-3 border-t border-fio pt-6">
                    {fase.itens.map((item) => (
                      <li key={item} className="flex gap-3 text-[0.94rem] leading-relaxed">
                        <span aria-hidden className="mt-2.5 h-px w-3 shrink-0 bg-acento" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section aria-label="Por que a solução completa" className="relative overflow-clip secao-ar">
          <div className={secao}>
            {/* Por que completa importa. "Solução completa" é o que toda
                agência escreve; sem dizer o que a alternativa custa, a
                frase não significa nada. */}
            <div className="grid gap-px overflow-hidden rounded-[var(--raio)] border border-fio bg-[var(--fio)] md:grid-cols-3">
              {porQueCompleta.map((item) => (
                <div key={item.titulo} className="revelar bg-papel px-7 py-8 md:px-8 md:py-10">
                  <h3 className="font-display text-lg font-bold leading-snug tracking-[-0.02em]">
                    {item.titulo}
                  </h3>
                  <p className="mt-3.5 text-sm leading-relaxed text-tinta-fraca">{item.texto}</p>
                </div>
              ))}
            </div>

            <div className="revelar mt-14 flex flex-wrap items-center gap-4">
              <Botao href="/diagnostico">Quero meu diagnóstico gratuito</Botao>
              <p className="text-sm text-tinta-fraca">
                Começando do zero ou já vendendo, o diagnóstico é o mesmo primeiro passo.
              </p>
            </div>
          </div>
        </section>

        {/* ==========================================================
            4. O DIAGNÓSTICO
            ========================================================== */}
        <section className="relative overflow-clip secao-ar">
          <div className={secao}>
            <div className="revelar max-w-[46rem]">
              <Rotulo>O diagnóstico</Rotulo>
              <h2 className={tituloSecao + ' max-w-[18ch]'}>
                Sua loja de moda recebe visitas e{' '}
                <span className="text-acento">não converte?</span>
              </h2>
              <p className="mt-7 max-w-[60ch] text-guia text-tinta">
                Você investe em mídia, o tráfego sobe e a venda não acompanha. Na moda, o
                problema quase nunca está no anúncio: está na dúvida do tamanho, na foto
                que não mostra o caimento, no frete que aparece só no checkout ou na grade
                cadastrada errada. É por isso que a Psy Comunic olha as quatro frentes.
              </p>
            </div>

            {/* As perguntas em escada. O deslocamento vertical na coluna
                da direita quebra a leitura em tabela e obriga o olho a
                percorrer uma a uma. */}
            <ul className="mt-16 grid items-start gap-5 md:grid-cols-2 md:gap-7">
              {frentes.map((f, i) => (
                <li
                  key={f.slug}
                  className={'revelar' + (i % 2 === 1 ? ' md:mt-14' : '')}
                >
                  <div className="cartao px-8 py-9 md:px-10 md:py-11" data-inclina>
                    <span aria-hidden className="absolute left-10 right-10 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                    <p className="font-display text-sub font-bold leading-tight tracking-[-0.03em] text-tinta">
                      <span aria-hidden className="mr-1 text-acento">“</span>
                      {f.duvidas[0]}
                    </p>
                    <p className="mt-6 flex items-center gap-2.5 text-[0.7rem] text-tinta-fraca">
                      <IconeFrente slug={f.slug} className="h-4 w-4 text-acento" />
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
        <section id="frentes" className="faixa-navy scroll-mt-24 relative overflow-clip border-y border-fio secao-ar">
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
                  className="revelar cartao group relative overflow-clip p-9 hover:border-rosa/40 md:p-11"
                >
                  {/* Brilho de canto que só acende no hover. */}
                  <span
                    aria-hidden
                    className=" pointer-events-none absolute -right-24 -top-24 h-72 w-72 opacity-0 transition-opacity duration-500 group-hover:opacity-60"
                  />

                  <div className="relative flex items-start justify-between gap-6">
                    <IconeFrente
                      slug={f.slug}
                      className="h-9 w-9 text-acento transition-transform duration-500 group-hover:scale-110"
                    />
                    <span className="tabular text-xs text-tinta-fraca">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </div>

                  <h3 className="relative mt-8 font-display text-sub font-extrabold tracking-[-0.035em]">
                    {f.nome}
                  </h3>
                  <p className="relative mt-3 max-w-[42ch] text-tinta">{f.resumo}</p>

                  <ul className="relative mt-7 space-y-2.5 border-t border-fio pt-7">
                    {f.contribuicoes.slice(0, 3).map((c) => (
                      <li key={c} className="flex gap-3 text-sm leading-relaxed text-tinta-fraca">
                        <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-rosa" />
                        {c}
                      </li>
                    ))}
                  </ul>

                  <span className="relative mt-8 inline-flex items-center gap-2 text-sm font-semibold text-acento">
                    Ver a frente de {f.nome}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ==========================================================
            6. RESULTADOS
            ========================================================== */}
        <section id="resultados" className="scroll-mt-24 secao-ar">
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
                  <span className="tabular font-display text-3xl font-extrabold tracking-[-0.04em] text-acento">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <p className="mt-4 text-lg leading-snug text-tinta">{r}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ==========================================================
            8. METODOLOGIA
            ========================================================== */}
        <section id="metodologia" className="scroll-mt-24 bg-papel-alt secao-ar" data-cena>
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
                  <span className="etapa-numero relative z-10 flex h-9 w-9 items-center justify-center rounded-full border border-rosa/50 bg-papel text-xs text-acento transition-all duration-500">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3 className="mt-7 font-display text-xl font-bold tracking-[-0.02em]">
                    {m.nome}
                  </h3>
                  <p className="mt-3 max-w-[38ch] leading-relaxed text-tinta-fraca">{m.texto}</p>
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
        {/* ==========================================================
            9. NÍVEIS DE PARCERIA

            Eram três altitudes: a câmera descia da órbita até a cidade
            acesa e um altímetro marcava o nível. Saiu com a metáfora.

            Os três níveis continuam sendo uma ESCADA, e por isso a
            numeração e o fio que os separa ficaram: sem direção
            declarada, viram três pacotes para escolher, e a pergunta
            que traz a pessoa até aqui é "até onde vocês entram?".

            Sem preço, como antes: escopo e investimento saem na
            proposta, que é link único por cliente.
            ========================================================== */}
        <section id="parceria" className="faixa-navy scroll-mt-24 border-y border-fio secao-ar">
          <div className={secao}>
            <div className="max-w-[52ch]">
              <Rotulo>Níveis de parceria</Rotulo>
              <h2 className={tituloSecao}>
                Três profundidades, e a escolha depende de onde sua loja trava.
              </h2>
              <p className="mt-6 max-w-[52ch] leading-relaxed text-tinta-fraca">
                A Psy Comunic entra no ponto em que a operação precisa, e não num pacote
                fechado. O escopo e o investimento saem na proposta, depois do
                diagnóstico, porque antes disso qualquer número seria chute.
              </p>
            </div>

            <ol className="mt-16 grid gap-x-12 gap-y-12 md:mt-20 md:grid-cols-3">
              {niveisDeParceria.map((nivel) => (
                <li key={nivel.n} className="border-t border-fio pt-7">
                  <span className="text-sm font-semibold text-acento">{nivel.n}</span>
                  <h3 className="mt-4 font-display text-sub font-bold tracking-[-0.01em]">
                    {nivel.titulo}
                  </h3>
                  <p className="mt-4 max-w-[38ch] leading-relaxed text-tinta-fraca">{nivel.texto}</p>
                  <p className="mt-5 max-w-[34ch] text-sm leading-relaxed text-tinta-fraca">
                    {nivel.paraQuem}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section aria-label="Pedir uma proposta" className="border-b border-fio bg-papel-alt py-16 md:py-20">
          <div className={secao}>
            <div className="revelar flex flex-wrap items-center gap-4">
              <Botao href="/diagnostico" variante="primario">
                Pedir uma proposta
              </Botao>
              <p className="text-sm text-tinta-fraca">
                O escopo e o investimento chegam por link, depois do diagnóstico.
              </p>
            </div>
          </div>
        </section>

        {/* ==========================================================
            10. CASES
            ========================================================== */}
        <section id="cases" className="scroll-mt-24 relative overflow-clip secao-ar">
          <div className={secao}>
            <div className="revelar flex flex-wrap items-end justify-between gap-8">
              <div className="max-w-[42rem]">
                <Rotulo>Trabalhos</Rotulo>
                <h2 className={tituloSecao + ' max-w-[19ch]'}>
                  Lojas de moda que a Psy Comunic construiu.
                </h2>
              </div>
              <p className="max-w-[34ch] text-[0.68rem] leading-relaxed text-tinta-fraca">
                {lojas.length} lojas · passe o cursor para percorrer a página inteira
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

            {cases.length === 0 ? (
              <p className="revelar mt-12 max-w-[64ch] leading-relaxed text-tinta">
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
                    className="rounded-full border border-fio px-5 py-2.5 text-sm font-semibold text-tinta"
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
        <section className="faixa-navy relative isolate overflow-hidden secao-ar">
          {/* Era magenta chapado com dois gradientes por cima, para o
              bloco de cor ganhar volume. A faixa agora é marinho, e a
              regra do tema é que separação vem de linha e de ar: o
              gradiente saiu junto. */}
          <div className={secao}>
            {/* Único bloco centralizado da página. Todo o resto alinha
                à esquerda. */}
            <div className="revelar mx-auto max-w-[52ch] text-center">
              <h2 className="mx-auto max-w-[17ch] font-display text-titulo titulo-revista">
                Vamos olhar a sua loja de moda inteira.
              </h2>
              <p className="mx-auto mt-6 max-w-[52ch] text-guia text-tinta-fraca">
                Diagnóstico gratuito nas quatro frentes, com as prioridades apontadas por
                ordem de impacto no faturamento.
              </p>
              <div className="mt-10 flex flex-wrap justify-center gap-4">
                <Botao href="/diagnostico">Começar o diagnóstico</Botao>
                <Botao href="#parceria" variante="secundario">
                  Ver os níveis de parceria
                </Botao>
              </div>
            </div>

            <figure className="revelar mx-auto mt-20 max-w-[44ch] border-t border-fio pt-8 text-center">
              <blockquote className="font-display text-sub font-semibold leading-snug tracking-[-0.01em]">
                {marca.assinatura.frase}
              </blockquote>
              <figcaption className="mt-4 text-sm text-tinta-fraca">
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
