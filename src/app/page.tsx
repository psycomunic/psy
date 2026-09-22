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
import { credenciais, numerosDaCapa } from '@/conteudo/marca';
import { frentes } from '@/conteudo/frentes';
import { marcasAtendidas, parcerias } from '@/conteudo/prova';
import { logosMarcas } from '@/conteudo/trabalhos';
import { jornada, promessaCompleta, porQueCompleta } from '@/conteudo/jornada';

const secao = 'mx-auto w-full max-w-[1180px] px-5 md:px-10';

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
        <section className="relative w-full min-h-screen flex flex-col pt-32 pb-20 overflow-hidden isolate border-b border-white/5">
          {/* Fundo Minimalista: CSS Grid Sutil e Glow Central */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none -z-20"></div>
          
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-rosa opacity-[0.08] blur-[100px] rounded-full pointer-events-none -z-10 translate-y-[-50%]"></div>

          <div className={`${secao} relative z-10 flex flex-col items-center text-center`}>
            {/* Rótulo de Luxo */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.02)] backdrop-blur-md mb-10 hover:bg-white/10 transition-colors">
              <span className="w-2 h-2 rounded-full bg-rosa shadow-[0_0_10px_var(--psy-accent-glow)] animate-pulse"></span>
              <span className="text-[11px] font-bold text-branco/80 tracking-widest uppercase">Especialistas em e-commerce</span>
            </div>

            <h1 className="font-display text-[clamp(40px,7.5vw,90px)] leading-[1.05] font-extrabold text-branco tracking-[-0.03em] max-w-5xl mx-auto drop-shadow-lg">
              Sua loja de moda não precisa de mais uma agência.
            </h1>

            <p className="mt-8 font-display text-[clamp(24px,4vw,36px)] font-bold text-rosa tracking-[-0.01em] drop-shadow-[0_0_15px_rgba(255,46,99,0.3)] max-w-3xl mx-auto">
              Precisa de faturamento.
            </p>

            <p className="mt-8 max-w-2xl mx-auto leading-relaxed text-branco/60 text-[1.1rem] md:text-[1.2rem] font-medium">
              A Psy Comunic é conduzida por quem já vendeu milhões.
              Construímos a sua loja do zero ao lançamento e continuamos
              entregando todo mês: catálogo, tráfego pago e marketplaces.
            </p>

            <div className="mt-12 flex flex-col sm:flex-row items-center gap-5 justify-center w-full">
              <Botao href="/diagnostico" className="w-full sm:w-auto h-14 px-8 text-base bg-gradient-to-r from-rosa-forte to-rosa text-branco rounded-full font-bold shadow-[0_10px_30px_rgba(255,46,99,0.3)] hover:shadow-[0_10px_40px_rgba(255,46,99,0.5)] hover:-translate-y-1 transition-all duration-300">
                Quero meu diagnóstico gratuito
              </Botao>
              <Botao href="/como-trabalhamos" variante="fantasma" className="w-full sm:w-auto h-14 px-8 text-base text-branco border border-white/20 hover:bg-white/10 rounded-full font-bold transition-all duration-300">
                Ver como trabalhamos
              </Botao>
            </div>
            
            <ul className="mt-16 flex flex-wrap justify-center gap-x-10 gap-y-4 pt-10 border-t border-white/5 text-[0.8rem] font-semibold text-branco/40 uppercase tracking-widest max-w-4xl mx-auto">
              {frentes.map((f) => (
                <li key={f.slug} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rosa/50"></span>
                  {f.nome}
                </li>
              ))}
            </ul>
          </div>

          {/* Vitrine de Lojas Organizada e Clean */}
          <div className="w-full max-w-7xl mx-auto px-6 mt-20 relative z-10 hidden sm:block">
             <div className="absolute inset-0 bg-gradient-to-t from-[#050C2B] via-transparent to-transparent z-10 pointer-events-none h-full"></div>
             <ul className="grid grid-cols-2 md:grid-cols-4 gap-6 opacity-80 mix-blend-screen">
                <ColunasDeSites />
             </ul>
          </div>
        </section>

        {/* ==========================================================
            2. BENTO GRID DE RESULTADOS
            ========================================================== */}
        <section className="relative pb-24 pt-16 z-20">
          <div className={secao}>
            <CabecalhoDeSecao
              n="02"
              rotulo="O que a Psy Comunic entrega"
              titulo={<>Sua loja de moda não precisa de design. Precisa de faturamento.</>}
              apoio={
                <>
                  Plataforma, catálogo com grade e medidas, checkout, rastreamento e a
                  primeira campanha no ar. É o que sai daqui, e é o que a página abaixo
                  detalha.
                </>
              }
            />

            <dl className="mt-16 grid grid-cols-4 gap-4 md:gap-6">
                {numerosDaCapa.map((item, index) => {
                  let gridClass = '';
                  let isDestaque = false;
                  
                  if (index === 0) {
                    gridClass = 'col-span-4 lg:col-span-2 lg:row-span-2 min-h-[340px] lg:min-h-[440px] p-8 md:p-12';
                    isDestaque = true;
                  } else if (index === 1) {
                    gridClass = 'col-span-4 sm:col-span-2 lg:col-span-2 lg:row-span-1 min-h-[200px] p-6 md:p-8';
                  } else {
                    gridClass = 'col-span-2 sm:col-span-2 lg:col-span-1 lg:row-span-1 min-h-[220px] p-6 md:p-8';
                  }

                  return (
                    <div key={item.d} className={`relative flex flex-col justify-between group overflow-hidden rounded-[20px] bg-[#0A1128] border border-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_10px_30px_rgba(0,0,0,0.5)] transition-all duration-500 hover:-translate-y-1 hover:border-white/15 hover:shadow-[0_20px_40px_rgba(0,0,0,0.6)] ${gridClass}`}>
                      
                      {/* Efeito de iluminação sutil no Hover */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                      
                      {/* Glow de Canto super refinado */}
                      <div className="absolute -top-20 -right-20 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none mix-blend-screen">
                         <span className={`absolute top-0 right-0 bg-rosa rounded-full blur-[80px] ${isDestaque ? 'w-64 h-64 opacity-15' : 'w-40 h-40 opacity-10'}`} />
                      </div>

                      <dt className="relative z-10 flex flex-col gap-1">
                        {isDestaque ? (
                           <div className="flex flex-col">
                             <span className="font-display text-[clamp(48px,8vw,96px)] font-extrabold tracking-[-0.03em] text-white leading-[0.95]">
                               {item.n}
                             </span>
                             {item.u && (
                               <span className="text-2xl md:text-3xl text-rosa font-semibold mt-4 tracking-tight">
                                 {item.u}
                               </span>
                             )}
                           </div>
                        ) : (
                           <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                             <span className="font-display text-[clamp(36px,5vw,54px)] font-extrabold tracking-[-0.03em] text-white leading-[0.95]">
                               {item.n}
                             </span>
                             {item.u && (
                               <span className="text-sm font-semibold text-rosa uppercase tracking-widest">
                                 {item.u}
                               </span>
                             )}
                           </div>
                        )}
                      </dt>
                      
                      <dd className={`relative z-10 font-medium leading-relaxed ${isDestaque ? 'text-lg text-white/60 max-w-[28ch] mt-10' : 'text-[0.9rem] text-white/50 max-w-[24ch] mt-8'}`}>
                        {item.d}
                      </dd>
                    </div>
                  );
                })}
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
            3. HUB DE CREDIBILIDADE (Quem Somos + Marcas)
            ========================================================== */}
        <section id="credibilidade" aria-labelledby="quem-somos-titulo" className="relative scroll-mt-24 py-24 z-10">
          {/* Fundo luminoso sutil */}
          <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-rosa opacity-[0.08] blur-[120px] rounded-full pointer-events-none -z-10" />

          <div className={secao}>
            <CabecalhoDeSecao
              n="03"
              rotulo="Autoridade Comprovada"
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

            {/* Container unificado em vidro para fundador e credenciais */}
            <div className="mt-16 rounded-3xl border border-white/10 bg-[#0A1128]/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_20px_40px_rgba(0,0,0,0.4)] backdrop-blur-xl p-6 md:p-10 lg:p-12 overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none" />
              
              <div className="relative z-10 grid gap-12 lg:grid-cols-[1fr_1fr] lg:items-start lg:gap-16">
                <RetratoFundador className="revelar max-w-md mx-auto w-full lg:max-w-none shadow-2xl rounded-2xl overflow-hidden ring-1 ring-white/10 sticky top-32" />

                <div className="grid gap-6">
                  {credenciais.map((item) => (
                    <CartaoCredencial 
                      key={item.t} 
                      item={item} 
                      className="revelar bg-white/5 border border-white/5 hover:border-rosa/40 hover:bg-white/[0.07] shadow-none hover:shadow-[0_10px_30px_rgba(255,46,99,0.15)] transition-all duration-500 rounded-2xl" 
                    />
                  ))}
                </div>
              </div>
            </div>

            <RetratoDaTurma className="revelar mt-16" />
          </div>

          {/* Fita de Marcas incorporada à mesma experiência visual */}
          <div className="mt-24 border-y border-white/10 bg-white/[0.02] py-16 backdrop-blur-sm overflow-hidden">
            <div className="space-y-10 md:space-y-12">
              <FitaMarcas logos={logosMarcas.slice(0, metadeLogos)} duracao={64} />
              <FitaMarcas logos={logosMarcas.slice(metadeLogos)} duracao={78} volta />
            </div>

            <ul className="sr-only">
              {marcasAtendidas.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>

            <div className={`${secao} mt-12 md:hidden`}>
              <Image
                src="/site.png"
                alt="Cartaz com os logos de vinte marcas atendidas pela Psy Comunic"
                width={1080}
                height={1350}
                sizes="(max-width: 767px) 92vw, 1px"
                loading="lazy"
                className="mx-auto w-full max-w-[440px] rounded-[var(--raio)] border border-white/10"
              />
            </div>
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
            {/* --- LAYOUT VISUAL: GRID LADO A LADO --- */}
            <div className="mt-16 md:mt-20 grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 pb-10">
              {jornada.map((fase, f) => (
                <article key={fase.id} className="cartao relative group hover:-translate-y-2 transition-transform duration-500 p-8 md:p-10 flex flex-col">
                  {/* Etiqueta Flutuante / Nó da Etapa */}
                  <div className="absolute -top-6 left-8 z-10 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full border border-white/10 bg-[#050C2B] shadow-[0_8px_16px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.2)] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-500">
                      <div className="w-2.5 h-2.5 rounded-full bg-rosa shadow-[0_0_12px_rgba(255,46,99,1)]"></div>
                    </div>
                    <span className="text-sm font-bold text-white/70 tracking-widest uppercase bg-[#050C2B]/80 px-3 py-1 rounded-full backdrop-blur-sm border border-white/10">
                      Etapa 0{f + 1}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 mt-6">
                    <span className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[0.78rem] font-semibold bg-white/5 text-branco border border-white/10 shadow-sm">
                      {fase.etiqueta}
                    </span>
                    <span className="tabular text-sm text-tinta-fraca">
                      {fase.itens.length} entregas
                    </span>
                  </div>

                  <h3 className="mt-6 font-display text-2xl font-bold tracking-[-0.01em] text-branco">
                    {fase.titulo}
                  </h3>
                  <p className="mt-4 leading-relaxed text-tinta-fraca flex-grow">{fase.resumo}</p>

                  <p className="mt-6 flex items-start gap-2.5 text-sm font-semibold text-branco">
                    <span aria-hidden className="mt-[3px] grid h-4 w-4 flex-none place-items-center rounded-full bg-rosa shadow-[0_0_8px_var(--psy-accent-glow)]">
                      <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 fill-none stroke-white" strokeWidth="2.2">
                        <path d="M2.5 6.2 4.8 8.5 9.5 3.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    {fase.entrega}
                  </p>

                  {/* Gaveta de Entregas */}
                  <details className="group/gaveta mt-7 border-t border-white/10">
                    <summary className="flex cursor-pointer list-none items-center gap-3 pt-5 text-sm font-semibold text-branco/70 transition-colors hover:text-branco [&::-webkit-details-marker]:hidden">
                      <span aria-hidden className="grid h-8 w-8 flex-none place-items-center rounded-full border border-white/10 bg-white/5 transition-transform duration-300 group-open/gaveta:rotate-45">
                        <svg viewBox="0 0 12 12" className="h-3 w-3 stroke-white/70" strokeWidth="1.8">
                          <path d="M6 1.5v9M1.5 6h9" strokeLinecap="round" />
                        </svg>
                      </span>
                      <span className="group-open/gaveta:hidden">
                        Ver as {fase.itens.length} entregas
                      </span>
                      <span className="hidden group-open/gaveta:inline">Fechar a lista</span>
                    </summary>

                    <ul className="mt-7 grid gap-x-8 gap-y-6">
                      {fase.itens.map((item) => (
                        <li key={item.nome}>
                          <p className="flex items-start gap-2.5 text-[0.95rem] font-semibold text-branco">
                            <span aria-hidden className="mt-2 h-1 w-1 flex-none rounded-full bg-rosa" />
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

        {/* ==========================================================
            POR QUE COMPLETA
            ========================================================== */}
        <section aria-labelledby="completa-titulo" className="relative overflow-clip pt-24 pb-16 z-10">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-rosa opacity-[0.05] blur-[150px] rounded-full pointer-events-none -z-10" />
          
          <div className={secao}>
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

            <ol className="mt-16 grid gap-6 md:grid-cols-3">
              {porQueCompleta.map((item, i) => (
                <li key={item.titulo} className="revelar cartao flex flex-col p-8 md:p-10 rounded-2xl bg-white/[0.02] border border-white/10 transition-all duration-500 hover:-translate-y-1 hover:bg-white/[0.04] hover:border-rosa/30 group">
                  <span className="tabular font-display text-[2.5rem] font-extrabold text-white/20 group-hover:text-rosa transition-colors duration-300">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3 className="mt-6 font-display text-xl font-bold tracking-[-0.01em] text-branco">
                    {item.titulo}
                  </h3>
                  <p className="mt-4 leading-relaxed text-branco/50 flex-grow">
                    {item.texto}
                  </p>
                </li>
              ))}
            </ol>

            <div className="revelar mt-16 flex flex-wrap items-center justify-center md:justify-start gap-5">
              <Botao href="/diagnostico" className="px-8 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-branco font-semibold rounded-full transition-all">
                Quero meu diagnóstico gratuito
              </Botao>
              <p className="text-sm text-branco/40 max-w-xs text-center md:text-left">
                Começando do zero ou já vendendo, o diagnóstico é o mesmo primeiro passo.
              </p>
            </div>
          </div>
        </section>

        {/* ==========================================================
            4. O DIAGNÓSTICO
            ========================================================== */}
        <section className="relative overflow-clip py-24 z-10">
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-rosa opacity-[0.03] blur-[120px] rounded-full pointer-events-none -z-10" />

          <div className={secao}>
            <CabecalhoDeSecao
              n="07"
              rotulo="O diagnóstico"
              titulo={
                <>
                  Sua loja de moda recebe visitas e{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-rosa to-rosa-forte drop-shadow-[0_0_15px_rgba(255,46,99,0.3)]">não converte?</span>
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

            <ul className="mt-16 grid items-start gap-6 md:grid-cols-2">
              {frentes.map((f, i) => (
                <li key={f.slug} className={'revelar' + (i % 2 === 1 ? ' md:mt-16' : '')}>
                  <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] px-8 py-10 transition-all duration-500 hover:-translate-y-2 hover:border-rosa/40 hover:shadow-[0_20px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)] md:px-10 md:py-12">
                    
                    {/* Efeito de luz interna no hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-rosa/0 to-transparent group-hover:from-rosa/5 transition-colors duration-500" />

                    {/* A aspa, grande, atras do texto. */}
                    <span
                      aria-hidden
                      className="pointer-events-none absolute -top-8 right-4 font-display text-[8rem] font-extrabold leading-none text-white/[0.03] transition-colors duration-500 group-hover:text-rosa/[0.08]"
                    >
                      &ldquo;
                    </span>

                    <p className="relative z-10 font-display text-2xl font-bold leading-tight tracking-[-0.01em] text-branco">
                      {f.duvidas[0]}
                    </p>

                    <p className="relative z-10 mt-8 inline-flex items-center gap-2.5 rounded-full bg-white/5 border border-white/10 px-4 py-2 text-[0.85rem] font-semibold text-branco/80 shadow-sm">
                      <span className="w-6 h-6 flex items-center justify-center rounded-full bg-rosa/20">
                         <IconeFrente slug={f.slug} className="h-3.5 w-3.5 text-rosa" />
                      </span>
                      {f.nome}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ==========================================================
            11. PARCERIAS
            ========================================================== */}
        <section aria-labelledby="parcerias-titulo" className="border-t border-white/10 bg-white/[0.01] py-16 md:py-20 relative z-10">
          <div className={secao}>
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between lg:gap-16">
              <div>
                <p className="text-[13px] font-semibold text-rosa uppercase tracking-widest">Parcerias e certificações</p>
                <h2
                  id="parcerias-titulo"
                  className="mt-3 max-w-[24ch] font-display text-2xl font-bold tracking-[-0.01em] text-branco"
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
                        className="h-10 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity"
                      />
                    ) : (
                      <span className="inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-branco/70 transition-all duration-300 hover:-translate-y-1 hover:border-rosa/40 hover:text-branco shadow-sm">
                        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-rosa shadow-[0_0_8px_rgba(255,46,99,0.8)]" />
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
        <section className="relative isolate overflow-hidden py-24 md:py-32 z-10">
          {/* Fundo Cinemático do CTA */}
          <div className="absolute inset-0 bg-[#050C2B] -z-20" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle_at_center,rgba(255,46,99,0.08)_0%,transparent_70%)] rounded-full pointer-events-none -z-10 mix-blend-screen" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_50%,transparent_100%)] pointer-events-none -z-20"></div>

          <div className={secao}>
            <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-20">
              <div className="relative z-10">
                <p className="text-[13px] font-bold text-rosa uppercase tracking-widest flex items-center gap-2">
                   <span className="w-2 h-2 rounded-full bg-rosa animate-pulse"></span>
                   Diagnóstico gratuito
                </p>
                <h2 className="mt-6 font-display text-[clamp(2.5rem,5vw,4rem)] font-extrabold leading-[1.05] tracking-[-0.02em] text-branco drop-shadow-md">
                  Vamos olhar a sua loja de moda inteira.
                </h2>
                <p className="mt-6 max-w-[48ch] text-lg md:text-xl leading-relaxed text-branco/60 font-medium">
                  Uma conversa, as quatro frentes analisadas e as prioridades apontadas
                  por ordem de impacto no faturamento. Sem compromisso e sem proposta
                  automática no fim.
                </p>

                <ul className="mt-10 grid gap-4 text-[1rem] sm:grid-cols-2 text-branco/80">
                  {[
                    'O que está travando a venda hoje',
                    'Por onde começar, em ordem de impacto',
                    'O que dá para resolver sem trocar de plataforma',
                    'Quanto do seu tráfego está sendo desperdiçado',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span aria-hidden className="mt-[5px] grid h-5 w-5 flex-none place-items-center rounded-full bg-rosa/20 border border-rosa/30 shadow-[0_0_10px_rgba(255,46,99,0.2)]">
                        <svg viewBox="0 0 12 12" className="h-3 w-3 fill-none stroke-rosa" strokeWidth="2.5">
                          <path d="M2.5 6.2 4.8 8.5 9.5 3.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Cartão do Pedido Premium */}
              <div className="relative z-10 rounded-3xl border border-white/10 bg-white/[0.03] p-8 md:p-12 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_20px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-rosa/20 blur-[50px] rounded-full pointer-events-none" />
                
                <h3 className="font-display text-2xl font-bold tracking-[-0.01em] text-branco">
                  Comece pelo diagnóstico
                </h3>
                <p className="mt-3 text-sm md:text-base leading-relaxed text-branco/50">
                  Começando do zero ou já vendendo, é o mesmo primeiro passo.
                </p>

                <Link
                  href="/diagnostico"
                  className="mt-8 flex h-16 w-full items-center justify-center rounded-full bg-gradient-to-r from-rosa-forte to-rosa px-6 text-center text-lg font-bold text-branco shadow-[0_10px_30px_rgba(255,46,99,0.3)] transition-all hover:shadow-[0_10px_40px_rgba(255,46,99,0.5)] hover:-translate-y-1"
                >
                  Quero meu diagnóstico gratuito
                </Link>

                <p className="mt-5 text-center text-sm font-medium text-branco/40 flex items-center justify-center gap-2">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-current fill-none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  Resposta no mesmo dia útil.
                </p>

                <div className="mt-8 border-t border-white/10 pt-6 text-center">
                  <Link
                    href="/como-trabalhamos"
                    className="text-sm font-semibold text-branco/60 underline-offset-4 hover:text-branco hover:underline transition-colors"
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
