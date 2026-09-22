import Link from 'next/link';
import { RetratoFundador } from '@/componentes/RetratoFundador';
import Image from 'next/image';
import { Cabecalho } from '@/componentes/Cabecalho';
import { Rodape } from '@/componentes/Rodape';
import { Botao } from '@/componentes/Botao';
import { FitaMarcas } from '@/componentes/FitaMarcas';
import { ColunasDeSites } from '@/componentes/ColunasDeSites';
import { IconeFrente } from '@/componentes/IconeFrente';
import { CabecalhoDeSecao } from '@/componentes/CabecalhoDeSecao';
import { CartaoCredencial } from '@/componentes/CartaoCredencial';
import { RetratoDaTurma } from '@/componentes/RetratoDaTurma';
import { ProvasEmVideo } from '@/componentes/ProvasEmVideo';
import { BotaoWhatsapp } from '@/componentes/BotaoWhatsapp';
import { BarraDeAcao } from '@/componentes/BarraDeAcao';
import { Interacoes } from '@/componentes/Interacoes';
import { credenciais, numerosDaCapa, faturamento } from '@/conteudo/marca';
import { frentes } from '@/conteudo/frentes';
import { marcasAtendidas, parcerias } from '@/conteudo/prova';
import { logosMarcas } from '@/conteudo/trabalhos';
import { jornada, promessaCompleta, porQueCompleta } from '@/conteudo/jornada';

const secao = 'mx-auto w-full max-w-[1180px] px-5 md:px-10';
const rotulo = 'text-[13px] font-semibold text-acento';
/* Serifada em peso 300, e nao display preta. Fina e grande. */

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
            <CabecalhoDeSecao
              n="01"
              rotulo="O que a Psy Comunic entrega"
              titulo={<>Lojas que saem daqui prontas para vender.</>}
              apoio={
                <>
                  Plataforma, catálogo com grade e medidas, checkout, rastreamento e a
                  primeira campanha no ar. É o que sai daqui, e é o que a página abaixo
                  detalha.
                </>
              }
            />

            {/* Os quatro em FILEIRA, e não numa coluna ao lado do
                título. Em duas colunas de dois, os números ficavam
                pequenos num bloco apertado e sobrava meia tela vazia
                embaixo do título. Na largura toda eles viram a régua
                da faixa. */}
            <dl className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2 md:mt-16 lg:grid-cols-4">
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
        <section id="quem-somos" aria-labelledby="quem-somos-titulo" className="scroll-mt-24 secao-ar">
          <div className={secao}>
            <CabecalhoDeSecao
              n="03"
              rotulo="Quem está por trás"
              id="quem-somos-titulo"
              titulo={<>A operação foi construída por quem já esteve do outro lado do balcão.</>}
              apoio={
                <>
                  Três fatos que se conferem, e não adjetivos. Quem responde pela Psy
                  Comunic já teve estoque parado, boleto não pago e entrega atrasada no
                  próprio caixa.
                </>
              }
            />

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

            {/* A foto da turma, discreta, no fim da seção. Ver
                RetratoDaTurma.tsx. */}
            <RetratoDaTurma className="revelar mt-16" />
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
            <CabecalhoDeSecao
              n="04"
              rotulo="Marcas atendidas"
              id="marcas-titulo"
              titulo={<>Elas já confiaram a operação à Psy Comunic.</>}
              apoio={
                <>
                  Moda, casa, viagem, acessório e infantil. Operações de portes
                  diferentes, com o mesmo time atrás do número.
                </>
              }
            />
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
            <CabecalhoDeSecao
              n="05"
              rotulo="Solução completa"
              id="jornada-titulo"
              titulo={<>Construímos a loja de moda. E ficamos para fazer ela vender.</>}
              apoio={<>{promessaCompleta}</>}
            />

            {/*
              AS FASES EMPILHADAS, E AS ENTREGAS EM TRES COLUNAS.

              Eram duas colunas de frases longas, dezessete ao todo:
              uma parede que ninguem le para decidir se pede um
              diagnostico. Cada entrega virou NOME em negrito mais o
              detalhe em cinza, e a fileira de tres corta a altura da
              secao pela metade.

              A contagem no cabecalho da fase existe porque "nove
              entregas" e um fato que se le em meio segundo, e a lista
              inteira nao.
            */}
            {/*
              CADA FASE VIRA UM CARTAO, e a Fase 2 e a que recebe a cor.

              Eram dois blocos de texto separados por um fio, do mesmo
              peso. Sem cor e sem moldura, a pagina inteira lia como um
              documento: nada dizia que ali comeca uma coisa nova.

              A COR ESTA NA FASE 2 de proposito. A duvida que faz
              alguem sair desta pagina e "e depois que lanca, voces
              somem?", e e a Fase 2 que responde. O lavado rosa e o
              fio de acento marcam qual das duas carrega a resposta,
              sem gastar area grande de rosa, que satura no claro.
            */}
            <div className="mt-16 grid gap-8 md:mt-20 lg:grid-cols-2">
              {jornada.map((fase, f) => (
                <article
                  key={fase.id}
                  className={
                    'group relative overflow-hidden rounded-[var(--raio)] border p-8 transition-colors duration-300 md:p-10 ' +
                    (f === 1
                      ? 'border-rosa/25 bg-rosa-leve hover:border-rosa/45'
                      : 'border-fio bg-papel-alt hover:border-tinta/20')
                  }
                >
                  {/* Fio de acento no topo, que cresce no hover: o
                      unico movimento da secao, e ele so acontece onde
                      o cursor esta. */}
                  <span
                    aria-hidden
                    className={
                      'absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100 ' +
                      (f === 1 ? 'bg-rosa' : 'bg-tinta/30')
                    }
                  />

                  <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
                    <span
                      className={
                        'inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[0.78rem] font-semibold ' +
                        (f === 1 ? 'bg-rosa text-branco' : 'bg-tinta text-papel')
                      }
                    >
                      {fase.etiqueta}
                    </span>
                    <span className="tabular text-sm text-tinta-fraca">
                      {fase.itens.length} entregas
                    </span>
                  </div>

                  <h3 className="mt-6 font-display text-sub font-bold tracking-[-0.01em]">
                    {fase.titulo}
                  </h3>
                  <p className="mt-4 leading-relaxed text-tinta-fraca">{fase.resumo}</p>

                  <p className="mt-5 flex items-start gap-2.5 text-sm font-semibold">
                    <span
                      aria-hidden
                      className="mt-[3px] grid h-4 w-4 flex-none place-items-center rounded-full bg-rosa"
                    >
                      <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 fill-none stroke-white" strokeWidth="2.2">
                        <path d="M2.5 6.2 4.8 8.5 9.5 3.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    {fase.entrega}
                  </p>

                  {/*
                    GAVETA, e nao lista aberta.

                    As dezessete entregas somadas ocupavam quase duas
                    telas. `<details>` nativo: abre e fecha sem
                    JavaScript, o teclado ja navega, o leitor de tela
                    ja anuncia o estado, e o Ctrl+F do navegador acha o
                    texto de dentro MESMO FECHADO, o que um bloco
                    escondido por CSS nao faz.
                  */}
                  <details className="group/gaveta mt-7">
                    <summary
                      className="flex cursor-pointer list-none items-center gap-3 border-t border-fio pt-5
                                 text-sm font-semibold text-acento transition-colors hover:text-rosa-forte
                                 [&::-webkit-details-marker]:hidden"
                    >
                      <span
                        aria-hidden
                        className="grid h-8 w-8 flex-none place-items-center rounded-full border border-current
                                   transition-transform duration-300 group-open/gaveta:rotate-45"
                      >
                        <svg viewBox="0 0 12 12" className="h-3 w-3 stroke-current" strokeWidth="1.8">
                          <path d="M6 1.5v9M1.5 6h9" strokeLinecap="round" />
                        </svg>
                      </span>
                      <span className="group-open/gaveta:hidden">
                        Ver as {fase.itens.length} entregas
                      </span>
                      <span className="hidden group-open/gaveta:inline">Fechar a lista</span>
                    </summary>

                    <ul className="mt-7 grid gap-x-8 gap-y-6 sm:grid-cols-2">
                      {fase.itens.map((item) => (
                        <li key={item.nome}>
                          <p className="flex items-start gap-2.5 text-[0.95rem] font-semibold">
                            <span aria-hidden className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-rosa" />
                            {item.nome}
                          </p>
                          <p className="mt-1 pl-[1rem] text-sm leading-relaxed text-tinta-fraca">
                            {item.detalhe}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </details>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section aria-labelledby="completa-titulo" className="relative overflow-clip secao-ar">
          <div className={secao}>
            {/* A seção não tinha cabeçalho nenhum: abria direto na
                caixa dos três selos, que ficava boiando no meio de
                uma tela de branco sem nada que dissesse o que era. */}
            <CabecalhoDeSecao
              n="06"
              rotulo="Por que completa"
              id="completa-titulo"
              titulo={<>Contratar em pedaços sai mais caro, e a conta chega depois.</>}
              apoio={
                <>
                  &ldquo;Solução completa&rdquo; é o que toda agência escreve. Sem dizer
                  o que a alternativa custa, a frase não significa nada.
                </>
              }
            />
            {/* Por que completa importa. "Solução completa" é o que toda
                agência escreve; sem dizer o que a alternativa custa, a
                frase não significa nada. */}
            <ol className="mt-14 grid gap-x-10 gap-y-12 md:mt-16 md:grid-cols-3">
              {porQueCompleta.map((item, i) => (
                <li key={item.titulo} className="revelar border-t border-fio pt-7">
                  {/* O índice grande, que é o que dá peso a um bloco
                      de texto curto sem precisar de caixa em volta. */}
                  <span className="tabular font-display text-numero font-extrabold text-acento">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3 className="mt-4 font-display text-sub font-bold tracking-[-0.01em]">
                    {item.titulo}
                  </h3>
                  <p className="mt-4 max-w-[38ch] leading-relaxed text-tinta-fraca">
                    {item.texto}
                  </p>
                </li>
              ))}
            </ol>

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
            <CabecalhoDeSecao
              n="07"
              rotulo="O diagnóstico"
              titulo={
                <>
                  Sua loja de moda recebe visitas e{' '}
                  <span className="text-acento">não converte?</span>
                </>
              }
              apoio={
                <>
                  Você investe em mídia, o tráfego sobe e a venda não acompanha. Na moda,
                  o problema quase nunca está no anúncio: está na dúvida do tamanho, na
                  foto que não mostra o caimento, no frete que aparece só no checkout ou
                  na grade cadastrada errada. É por isso que a Psy Comunic olha as quatro
                  frentes.
                </>
              }
            />

            {/*
              AS PERGUNTAS COM COR, ASPA GRANDE E RELEVO NO HOVER.

              Eram quatro cartoes brancos com fio fino, em escada. O
              deslocamento quebrava a leitura em tabela, que era o
              objetivo, mas quatro retangulos brancos sobre fundo
              branco nao tem nada que segure o olho: a secao inteira
              pesava menos que o titulo dela.

              A aspa em corpo grande e baixa opacidade e a textura que
              faltava, e ela ja estava ali, pequena demais para
              contar. A frente responsavel virou pastilha com o lavado
              rosa, porque e a informacao que diferencia um cartao do
              outro.
            */}
            <ul className="mt-14 grid items-start gap-5 md:mt-16 md:grid-cols-2 md:gap-7">
              {frentes.map((f, i) => (
                <li key={f.slug} className={'revelar' + (i % 2 === 1 ? ' md:mt-14' : '')}>
                  <div
                    className="group relative overflow-hidden rounded-[var(--raio)] border border-fio bg-papel
                               px-8 py-9 transition-all duration-300 hover:-translate-y-1
                               hover:border-rosa/35 hover:shadow-[0_18px_40px_-24px_rgba(11,20,55,0.35)]
                               md:px-10 md:py-11"
                  >
                    {/* A aspa, grande, atras do texto. */}
                    <span
                      aria-hidden
                      className="pointer-events-none absolute -top-6 right-4 font-display text-[7rem] font-extrabold leading-none text-rosa/[0.07] transition-colors duration-300 group-hover:text-rosa/[0.14]"
                    >
                      &ldquo;
                    </span>

                    <p className="relative font-display text-sub font-bold leading-tight tracking-[-0.01em]">
                      {f.duvidas[0]}
                    </p>

                    <p className="relative mt-7 inline-flex items-center gap-2.5 rounded-full bg-rosa-leve px-4 py-2 text-[0.8rem] font-semibold text-acento">
                      <IconeFrente slug={f.slug} className="h-4 w-4" />
                      {f.nome}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ==========================================================
            QUATRO SECOES SAIRAM DAQUI

            As quatro frentes, os quatro resultados, a metodologia e os
            tres niveis de parceria. Saiu tudo a pedido, e o efeito
            somado e grande: a home tinha 38 telas de altura no
            celular quando a galeria ainda estava aqui.

            O QUE NAO SE PERDEU, e onde esta: as quatro frentes viraram
            a fileira embaixo dos botoes da abertura, e cada uma tem a
            propria pagina em /servicos. A metodologia e os niveis de
            parceria continuam em /como-trabalhamos. O conteudo segue
            em `frentes.ts` e `jornada.ts`, intocado: nada foi apagado,
            so deixou de ser repetido na home.

            `resultados` e `metodologia` ficaram sem leitor nesta
            pagina e sairam dos imports; `frentes` continua, porque a
            abertura e o diagnostico leem dela.
            ========================================================== */}

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
            A GALERIA DE TRABALHOS SAIU DAQUI

            Eram doze vitrines no fim da home. Saiu inteira, a pedido,
            e por dois motivos que se somam: a pagina tinha 38 telas de
            altura no celular, e as lojas JA aparecem na abertura, na
            fileira de quatro logo abaixo dos botoes. A prova estava
            sendo dada duas vezes na mesma pagina, e a segunda vez
            custava um terco da altura.

            Ela continua inteira em /cases, que e a pagina de
            portfolio, e o link para la continua no menu e no rodape.
            Nenhum arquivo de imagem foi apagado.
            ========================================================== */}

        {/* ==========================================================
            11. PARCERIAS
            ========================================================== */}
        <section aria-labelledby="parcerias-titulo" className="border-t border-fio bg-papel-alt py-14 md:py-16">
          <div className={secao}>
            {/*
              Era uma linha de pastilhas ao lado do rotulo, com o nome
              escrito dentro. Ganhou titulo e um pouco de ar, e cada
              pastilha ganhou relevo no hover.

              OS SELOS OFICIAIS AINDA NAO ESTAO AQUI. `arquivo` aceita
              o arquivo em `public/imagens/parcerias/` e a pastilha
              some no lugar dele, sem mexer em codigo. Ver o
              comentario em prova.ts: o direito de exibir o selo do
              Google Partner e do Meta Business Partner vem do
              programa, e o arquivo sai do painel de cada um.
            */}
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between lg:gap-16">
              <div>
                <p className={rotulo}>Parcerias e certificações</p>
                <h2
                  id="parcerias-titulo"
                  className="mt-3 max-w-[22ch] font-display text-sub font-bold tracking-[-0.01em]"
                >
                  As contas de mídia são da agência, e a loja entra vinculada a elas.
                </h2>
              </div>

              <ul className="flex flex-wrap items-center gap-3 sm:gap-4">
                {parcerias.map((p) => (
                  <li key={p.nome}>
                    {p.arquivo ? (
                      <Image
                        src={`/imagens/parcerias/${p.arquivo}`}
                        alt={p.nome}
                        width={p.largura ?? 160}
                        height={p.altura ?? 40}
                        className="h-9 w-auto object-contain md:h-10"
                      />
                    ) : (
                      <span
                        className="inline-flex items-center gap-2.5 rounded-full border border-fio bg-papel
                                   px-5 py-3 text-sm font-semibold text-tinta transition-all duration-300
                                   hover:-translate-y-0.5 hover:border-rosa/35"
                      >
                        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-rosa" />
                        {p.nome}
                      </span>
                    )}
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
          {/*
            A CHAMADA FINAL ERA UM BLOCO DE TEXTO CENTRADO.

            Titulo, uma linha de apoio, dois botoes do mesmo tamanho e
            uma frase do Steve Jobs embaixo. Tres problemas: os dois
            botoes com o mesmo peso nao dizem qual e o proximo passo,
            nao havia nada que respondesse "o que eu ganho e o que me
            custa", e a citacao roubava o fim da pagina do pedido.

            Agora o pedido ocupa a secao: o que a pessoa recebe em
            tres linhas, um botao grande sozinho, e as objecoes de
            sempre respondidas embaixo dele, que e onde elas aparecem
            na cabeca de quem esta com o dedo no botao.
          */}
          <div className={secao}>
            <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-20">
              <div>
                <p className="text-[13px] font-semibold text-acento">Diagnóstico gratuito</p>
                <h2 className="mt-5 font-display text-titulo titulo-revista">
                  Vamos olhar a sua loja de moda inteira.
                </h2>
                <p className="mt-6 max-w-[48ch] text-guia leading-relaxed text-tinta-fraca">
                  Uma conversa, as quatro frentes analisadas e as prioridades apontadas
                  por ordem de impacto no faturamento. Sem compromisso e sem proposta
                  automática no fim.
                </p>

                <ul className="mt-9 grid gap-3 text-[0.95rem] sm:grid-cols-2">
                  {[
                    'O que está travando a venda hoje',
                    'Por onde começar, em ordem de impacto',
                    'O que dá para resolver sem trocar de plataforma',
                    'Quanto do seu tráfego está sendo desperdiçado',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <span
                        aria-hidden
                        className="mt-[3px] grid h-4 w-4 flex-none place-items-center rounded-full bg-rosa"
                      >
                        <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 fill-none stroke-white" strokeWidth="2.2">
                          <path d="M2.5 6.2 4.8 8.5 9.5 3.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/*
                O cartao do pedido. Um botao so, do tamanho do bloco:
                dois botoes lado a lado com o mesmo peso e a mesma cor
                fazem a pessoa escolher entre eles em vez de agir.
                "Ver os niveis" virou link de texto embaixo, que e o
                peso que uma saida lateral merece.
              */}
              <div className="rounded-[var(--raio)] border border-fio bg-white/[0.04] p-8 md:p-10">
                <p className="font-display text-sub font-bold tracking-[-0.01em]">
                  Comece pelo diagnóstico
                </p>
                <p className="mt-3 text-sm leading-relaxed text-tinta-fraca">
                  Começando do zero ou já vendendo, é o mesmo primeiro passo.
                </p>

                <Link
                  href="/diagnostico"
                  className="mt-7 flex h-14 w-full items-center justify-center rounded-full bg-rosa px-6 text-center font-semibold text-branco transition-colors hover:bg-rosa-forte"
                >
                  Quero meu diagnóstico gratuito
                </Link>

                <p className="mt-4 text-center text-sm text-tinta-fraca">
                  Resposta no mesmo dia útil.
                </p>

                <div className="mt-7 border-t border-fio pt-6 text-center">
                  <Link
                    href="/como-trabalhamos"
                    className="text-sm font-semibold text-acento underline-offset-4 hover:underline"
                  >
                    Antes disso, ver como trabalhamos
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Rodape />
      <BotaoWhatsapp />
      <BarraDeAcao />
    </>
  );
}
