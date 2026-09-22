import Link from 'next/link';
import Image from 'next/image';
import { Cabecalho } from '@/componentes/Cabecalho';
import { Rodape } from '@/componentes/Rodape';
import { FitaMarcas } from '@/componentes/FitaMarcas';
import { ColunasDeSites } from '@/componentes/ColunasDeSites';
import { IconeFrente } from '@/componentes/IconeFrente';
import { RetratoFundador } from '@/componentes/RetratoFundador';
import { RetratoDaTurma } from '@/componentes/RetratoDaTurma';
import { CartaoCredencial } from '@/componentes/CartaoCredencial';
import { ProvasEmVideo } from '@/componentes/ProvasEmVideo';
import { BotaoWhatsapp } from '@/componentes/BotaoWhatsapp';
import { BarraDeAcao } from '@/componentes/BarraDeAcao';
import { Interacoes } from '@/componentes/Interacoes';
import { Rastreio } from '@/componentes/Rastreio';
import { credenciais, numerosDaCapa } from '@/conteudo/marca';
import { frentes } from '@/conteudo/frentes';
import { marcasAtendidas, parcerias } from '@/conteudo/prova';
import { logosMarcas } from '@/conteudo/trabalhos';
import { jornada, promessaCompleta, porQueCompleta } from '@/conteudo/jornada';
import { linkWhatsapp } from '@/conteudo/navegacao';

const secao = 'mx-auto w-full max-w-[1180px] px-5 md:px-10';

/**
 * Campo rotulado: a unidade do documento.
 *
 * O rótulo nomeia um DADO, e por isso existe. É outra coisa do que o
 * olho decorativo acima de um título, que o piso de qualidade proíbe:
 * aquele anunciava um título que já se anuncia sozinho.
 */
function Campo({
  rotulo,
  children,
  className = '',
}: {
  rotulo: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <span className="campo-rotulo">{rotulo}</span>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

/**
 * O botão de despacho, com o carimbo.
 *
 * O carimbo é um dos DOIS momentos autorados da página: entra girado
 * e assenta em 180ms com saída exponencial. O propósito aqui é
 * FEEDBACK, confirmar que a interface ouviu.
 *
 * O outro é o rastreio, cujo propósito é EXPLICAÇÃO. Fora esses dois,
 * nada anima sozinho, e nenhuma seção repete uma entrada.
 */
function Despachar({
  children = 'Quero meu diagnóstico gratuito',
  className = '',
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={'grupo-despacho relative inline-flex ' + className}>
      <a
        href={linkWhatsapp}
        target="_blank"
        rel="noopener"
        className="inline-flex h-14 items-center justify-center rounded-[var(--raio)] bg-[var(--exp-tarja-tinta)] px-8 text-[0.95rem] font-semibold text-white transition-colors duration-200 hover:bg-[var(--exp-tinta)]"
      >
        {children}
      </a>
      <span aria-hidden className="carimbo -right-3 -top-4 text-[var(--exp-tarja-tinta)]">
        Conferido
      </span>
    </span>
  );
}

export default function Home() {
  const metadeLogos = Math.ceil(logosMarcas.length / 2);
  const totalEntregas = jornada.reduce((t, f) => t + f.itens.length, 0);

  return (
    <>
      <Cabecalho />
      <div id="progresso-pagina" aria-hidden />
      <Interacoes />

      <main id="conteudo">
        {/* ==========================================================
            A ABERTURA

            ERA UM CABEÇALHO DE DOCUMENTO, E ESTAVA ERRADO.

            A primeira tela abria com "CONHECIMENTO DE EMBARQUE",
            "REMETENTE" e "DESTINATÁRIO", antes de uma palavra sobre o
            que a Psy Comunic faz. O mundo é expedição, mas quem chega
            não veio despachar carga: veio decidir se contrata. Gastar
            a parte mais valiosa da tela com papelada é comprometer-se
            com a FORMA e esconder a OFERTA, que é a falha que a
            própria direção avisa.

            O mundo fica: papel, fio, campo rotulado, tarja, rastreio.
            O que sai é o jargão na posição de manchete. Rótulo aqui
            volta a nomear DADO, e não a anunciar a página.

            A natureza da carga desceu para baixo dos botões, onde as
            quatro frentes são informação de verdade, e a contagem de
            entregas foi para o manifesto, que é onde ela significa
            alguma coisa.
            ========================================================== */}
        <section className="border-b border-fio pb-14 pt-12 md:pb-20 md:pt-16">
          <div className={secao}>
            <h1 className="max-w-[20ch] font-display text-mostro titulo-revista">
              Sua loja de moda não precisa de mais uma agência.
            </h1>

            {/* A TARJA. Rosa ocupando campo inteiro, como PRIORITÁRIO
                numa etiqueta: a virada da frase é o que essa carga tem
                de diferente, e por isso é ela que recebe a região de
                cor. */}
            <p className="faixa-tarja mt-7 inline-block rounded-[var(--raio-p)] px-5 py-3 font-display text-sub font-bold">
              Precisa de quem já vendeu milhões.
            </p>

            <div className="mt-10 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
              <div>
                <p className="max-w-[68ch] leading-relaxed text-tinta-fraca">
                  A Psy Comunic é conduzida por quem foi sócio de um e-commerce que
                  fatura R$ 17 milhões por ano. Construímos a sua loja de moda do zero
                  ao lançamento e continuamos entregando todo mês depois dele: catálogo,
                  página de produto, tráfego pago e marketplaces.
                </p>

                <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-5">
                  <Despachar />
                  <Link
                    href="/como-trabalhamos"
                    className="text-[0.95rem] font-semibold text-acento underline underline-offset-4 decoration-1 hover:decoration-2"
                  >
                    Ver como trabalhamos
                  </Link>
                </div>

                {/* As quatro frentes, aqui embaixo e não no topo.
                    Aqui elas informam o que está incluído; lá em cima
                    eram só um rótulo de formulário. */}
                <Campo rotulo="O que entra junto" className="mt-9 border-t border-fio pt-6">
                  <ul className="flex flex-wrap gap-x-6 gap-y-2.5">
                    {frentes.map((f) => (
                      <li key={f.slug} className="flex items-center gap-2 text-sm">
                        <IconeFrente slug={f.slug} className="h-4 w-4 text-acento" />
                        {f.nome}
                      </li>
                    ))}
                  </ul>
                </Campo>

                {/* O que acontece depois do botão. A dúvida que trava
                    o clique não é preço: é não saber o que vem a
                    seguir. Ver Rastreio.tsx. */}
                <Rastreio className="mt-9 border-t border-fio pt-7" />
              </div>

              <div className="min-w-0">
                <span className="campo-rotulo">Cargas já despachadas</span>
                <div className="mt-3 grid grid-cols-2 gap-3 md:gap-4">
                  <ColunasDeSites />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==========================================================
            O VERSO DA ETIQUETA: o que a carga declara em número.
            ========================================================== */}
        <section className="faixa-navy secao-ar">
          <div className={secao}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-3 border-b border-fio pb-4">
              <span className="campo-rotulo">Declaração de valor</span>
              <span className="campo-rotulo">Psy Comunic</span>
            </div>

            <h2 className="mt-8 max-w-[18ch] font-display text-titulo titulo-revista">
              Lojas que saem daqui prontas para vender.
            </h2>

            <dl className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
              {numerosDaCapa.map((item) => (
                <div key={item.d} className="fio-campo pt-5">
                  <dt className="flex flex-wrap items-end gap-x-2.5">
                    <span
                      className="tabular font-display text-numero font-extrabold"
                      data-contar={/^\d+$/.test(item.n) ? item.n : undefined}
                    >
                      {item.n}
                    </span>
                    {item.u ? <span className="text-sm text-tinta-fraca">{item.u}</span> : null}
                  </dt>
                  <dd className="mt-3 max-w-[30ch] text-sm leading-relaxed text-tinta-fraca">
                    {item.d}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <ProvasEmVideo />

        {/* ==========================================================
            QUEM ASSINA A CARGA
            ========================================================== */}
        <section id="quem-somos" aria-labelledby="assina-titulo" className="secao-ar">
          <div className={secao}>
            <span className="campo-rotulo">Responsável pelo despacho</span>
            <h2 id="assina-titulo" className="mt-4 max-w-[24ch] font-display text-titulo titulo-revista">
              A operação foi construída por quem já esteve do outro lado do balcão.
            </h2>

            <div className="mt-14 grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-start lg:gap-16">
              <RetratoFundador className="revelar" />
              <div className="grid gap-5">
                {credenciais.map((item) => (
                  <CartaoCredencial key={item.t} item={item} className="revelar" />
                ))}
              </div>
            </div>

            <RetratoDaTurma className="revelar mt-16" />
          </div>
        </section>

        {/* ==========================================================
            AS DUAS REMESSAS

            A palavra que o conteúdo já usava é ENTREGA. Cada fase é
            uma remessa fechada, com contagem de itens e lista de
            separação na gaveta.
            ========================================================== */}
        <section id="jornada" aria-labelledby="remessas-titulo" className="faixa-navy secao-ar">
          <div className={secao}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2 border-b border-fio pb-4">
              <span className="campo-rotulo">Manifesto de carga</span>
              <span className="tabular campo-rotulo">
                {totalEntregas} entregas · {jornada.length} remessas
              </span>
            </div>
            <h2 id="remessas-titulo" className="mt-8 max-w-[26ch] font-display text-titulo titulo-revista">
              Construímos a loja de moda. E ficamos para fazer ela vender.
            </h2>
            <p className="mt-6 max-w-[68ch] leading-relaxed text-tinta-fraca">
              {promessaCompleta}
            </p>

            <div className="mt-14 grid gap-10 lg:grid-cols-2 lg:gap-14">
              {jornada.map((fase, f) => (
                <article key={fase.id} className="fio-campo pt-7">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                    <span className="campo-rotulo">
                      Remessa {f + 1} de {jornada.length}
                    </span>
                    <span className="tabular campo-rotulo">{fase.itens.length} itens</span>
                  </div>

                  <h3 className="mt-5 font-display text-sub font-bold">{fase.titulo}</h3>
                  <p className="mt-4 max-w-[52ch] leading-relaxed text-tinta-fraca">
                    {fase.resumo}
                  </p>

                  <p
                    className={
                      'mt-6 inline-block rounded-[var(--raio-p)] px-4 py-2 text-sm font-semibold ' +
                      (f === 1
                        ? 'faixa-tarja'
                        : 'border border-fio text-tinta')
                    }
                  >
                    {fase.entrega}
                  </p>

                  {/*
                    A lista de separação, em gaveta. `<details>` nativo:
                    abre sem JavaScript, o teclado navega, o leitor de
                    tela anuncia o estado, e o Ctrl+F acha o texto de
                    dentro mesmo fechado.
                  */}
                  <details className="group/gaveta mt-7">
                    <summary className="flex cursor-pointer list-none items-center gap-3 border-t border-fio pt-5 text-sm font-semibold text-acento [&::-webkit-details-marker]:hidden">
                      <span
                        aria-hidden
                        className="grid h-7 w-7 flex-none place-items-center rounded-[var(--raio-p)] border border-current transition-transform duration-200 group-open/gaveta:rotate-45"
                      >
                        <svg viewBox="0 0 12 12" className="h-3 w-3 stroke-current" strokeWidth="1.8">
                          <path d="M6 1.5v9M1.5 6h9" strokeLinecap="round" />
                        </svg>
                      </span>
                      <span className="group-open/gaveta:hidden">Ver a lista de separação</span>
                      <span className="hidden group-open/gaveta:inline">Fechar a lista</span>
                    </summary>

                    <ol className="mt-6 space-y-4">
                      {fase.itens.map((item, i) => (
                        <li key={item.nome} className="flex gap-4">
                          <span className="tabular mt-0.5 w-6 flex-none text-sm text-tinta-fraca">
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          <span className="min-w-0">
                            <span className="block font-semibold">{item.nome}</span>
                            <span className="mt-1 block text-sm leading-relaxed text-tinta-fraca">
                              {item.detalhe}
                            </span>
                          </span>
                        </li>
                      ))}
                    </ol>
                  </details>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ==========================================================
            POR QUE UMA CARGA SÓ
            ========================================================== */}
        <section aria-labelledby="completa-titulo" className="secao-ar">
          <div className={secao}>
            <span className="campo-rotulo">Condições de transporte</span>
            <h2 id="completa-titulo" className="mt-4 max-w-[24ch] font-display text-titulo titulo-revista">
              Contratar em pedaços sai mais caro, e a conta chega depois.
            </h2>
            <p className="mt-6 max-w-[64ch] leading-relaxed text-tinta-fraca">
              &ldquo;Solução completa&rdquo; é o que toda agência escreve. Sem dizer o que
              a alternativa custa, a frase não significa nada.
            </p>

            <dl className="mt-14 grid gap-x-10 gap-y-10 md:grid-cols-3">
              {porQueCompleta.map((item) => (
                <div key={item.titulo} className="fio-campo pt-6">
                  <dt className="font-display text-sub font-bold">{item.titulo}</dt>
                  <dd className="mt-4 max-w-[38ch] leading-relaxed text-tinta-fraca">
                    {item.texto}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* ==========================================================
            CONSIGNATÁRIOS

            Os 28 logos são silhuetas brancas com fundo transparente,
            medido nos arquivos. Sobre papel claro eles somem, e por
            isso esta seção é o verso da etiqueta.
            ========================================================== */}
        <section aria-labelledby="marcas-titulo" className="faixa-navy secao-ar">
          <div className={secao}>
            <span className="campo-rotulo">Consignatários</span>
            <h2 id="marcas-titulo" className="mt-4 max-w-[22ch] font-display text-titulo titulo-revista">
              Elas já confiaram a operação à Psy Comunic.
            </h2>
          </div>

          <div className="mt-14 space-y-10 md:mt-16 md:space-y-12">
            <FitaMarcas logos={logosMarcas.slice(0, metadeLogos)} duracao={64} />
            <FitaMarcas logos={logosMarcas.slice(metadeLogos)} duracao={78} volta />
          </div>

          <ul className="sr-only">
            {marcasAtendidas.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>

          <div className={`${secao} mt-14 md:hidden`}>
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
            CONFERÊNCIA DE CARGA: o diagnóstico.
            ========================================================== */}
        <section aria-labelledby="conferencia-titulo" className="secao-ar">
          <div className={secao}>
            <span className="campo-rotulo">Conferência de carga</span>
            <h2 id="conferencia-titulo" className="mt-4 max-w-[20ch] font-display text-titulo titulo-revista">
              Sua loja de moda recebe visitas e{' '}
              <span className="text-acento">não converte?</span>
            </h2>
            <p className="mt-6 max-w-[64ch] leading-relaxed text-tinta-fraca">
              Você investe em mídia, o tráfego sobe e a venda não acompanha. Na moda, o
              problema quase nunca está no anúncio: está na dúvida do tamanho, na foto que
              não mostra o caimento, no frete que aparece só no checkout ou na grade
              cadastrada errada.
            </p>

            {/* Cada avaria tem o seu responsável, como num laudo. A
                grade em duas colunas com fios, e não cartões soltos. */}
            <ul className="mt-14 grid gap-x-12 gap-y-10 md:grid-cols-2">
              {frentes.map((f) => (
                <li key={f.slug} className="revelar fio-campo pt-6">
                  <p className="font-display text-sub font-bold leading-tight">
                    {f.duvidas[0]}
                  </p>
                  <p className="mt-5 flex items-center gap-2.5 text-sm text-tinta-fraca">
                    <IconeFrente slug={f.slug} className="h-4 w-4 text-acento" />
                    Confere na frente de {f.nome}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ==========================================================
            SELOS E CERTIFICAÇÕES
            ========================================================== */}
        <section aria-labelledby="parcerias-titulo" className="border-y border-fio bg-papel-alt py-14">
          <div className={secao}>
            <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between lg:gap-16">
              <div>
                <span className="campo-rotulo">Selos e certificações</span>
                <h2
                  id="parcerias-titulo"
                  className="mt-3 max-w-[24ch] font-display text-sub font-bold"
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
                      <span className="inline-flex items-center gap-2.5 rounded-[var(--raio-p)] border border-fio bg-papel px-4 py-2.5 text-sm font-semibold">
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
            DESPACHO

            A tarja toma a seção inteira: é a região de cor que o mundo
            promete, e é o único bloco da página em que ela manda.
            ========================================================== */}
        <section className="faixa-tarja secao-ar">
          <div className={secao}>
            <div className="picote pt-8">
              <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-20">
                <div>
                  <span className="campo-rotulo">Ordem de despacho</span>
                  <h2 className="mt-4 max-w-[18ch] font-display text-titulo titulo-revista">
                    Vamos olhar a sua loja de moda inteira.
                  </h2>
                  <p className="mt-6 max-w-[48ch] text-guia leading-relaxed">
                    Diagnóstico gratuito nas quatro frentes, com as prioridades apontadas
                    por ordem de impacto no faturamento. Sem compromisso.
                  </p>

                  <ul className="mt-9 grid gap-3 text-[0.95rem] sm:grid-cols-2">
                    {[
                      'O que está travando a venda hoje',
                      'Por onde começar, em ordem de impacto',
                      'O que resolve sem trocar de plataforma',
                      'Quanto do seu tráfego está sendo desperdiçado',
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2.5">
                        <svg
                          aria-hidden
                          viewBox="0 0 14 14"
                          className="mt-1 h-3.5 w-3.5 flex-none fill-none stroke-current"
                          strokeWidth="2.2"
                        >
                          <path d="M2.5 7.4 5.6 10.5 11.5 4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-[var(--raio)] border border-fio bg-[var(--exp-papel)] p-8 text-[var(--exp-tinta)] md:p-10">
                  <span className="campo-rotulo" style={{ color: 'var(--exp-tinta-fraca)' }}>
                    Via do remetente
                  </span>
                  <p className="mt-4 font-display text-sub font-bold">
                    Comece pelo diagnóstico
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--exp-tinta-fraca)]">
                    Começando do zero ou já vendendo, é o mesmo primeiro passo. O botão
                    abre a conversa no WhatsApp.
                  </p>

                  <Despachar className="mt-7 w-full [&>a]:w-full" />

                  <div className="mt-7 flex items-end gap-4 border-t border-[color-mix(in_oklab,var(--exp-tinta)_14%,transparent)] pt-5">
                    <span
                      aria-hidden
                      className="codigo-barras h-10 w-28 opacity-60"
                      style={{ color: 'var(--exp-tinta)' }}
                    />
                    <p className="tabular text-xs text-[var(--exp-tinta-fraca)]">
                      Resposta no mesmo dia útil
                    </p>
                  </div>
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
