import type { Metadata } from 'next';
import { Casca, secao, canonical } from '@/componentes/Casca';
import { Botao } from '@/componentes/Botao';
import { HeroTrafego } from '@/componentes/HeroTrafego';
import { FitaMarcas } from '@/componentes/FitaMarcas';
import { FormAnalise } from '@/componentes/FormAnalise';
import { linkWhatsapp } from '@/conteudo/navegacao';
import { logosMarcas } from '@/conteudo/trabalhos';
import { urlAbsoluta } from '@/conteudo/site';
import {
  heroi,
  sintomas,
  metodo,
  painel,
  social,
  paraQuem,
  quemOpera,
  perguntas,
  formulario,
} from '@/conteudo/trafego';

/**
 * A página de venda de tráfego pago.
 *
 * ============================================================
 * ELA NÃO É UMA PÁGINA DE SERVIÇO
 * ============================================================
 * `/servicos/[slug]` descreve uma das quatro frentes da operação de
 * e-commerce, e fala para lojista. Esta fala para EMPRESA que já
 * anuncia e não vê retorno: chalé, concessionária, clínica, loja. É o
 * público que a carteira ganhou, e o site inteiro ainda assume
 * e-commerce.
 *
 * Por isso ela vive na raiz, e não debaixo de /servicos: é o endereço
 * que vai receber anúncio, e endereço curto é o que se digita e o que
 * se lembra.
 *
 * O texto todo mora em `src/conteudo/trafego.ts`. Aqui só tem layout.
 */

export const metadata: Metadata = {
  title: 'Gestão de tráfego pago para empresas',
  description:
    'Google e Meta operados por quem responde pelo resultado, com o retorno de cada canal num painel que fica aberto para você. Análise gratuita da sua conta.',
  ...canonical('/trafego-pago'),
  openGraph: {
    title: 'Tráfego pago de alta performance · Psy Comunic',
    description:
      'Sua empresa investe em anúncio todo mês. Sabe dizer quanto voltou? Peça a análise gratuita da sua conta.',
    url: urlAbsoluta('/trafego-pago'),
    type: 'website',
  },
};

const tituloSecao = 'font-display text-titulo font-extrabold tracking-[-0.04em]';
const rotuloSecao =
  'flex items-center gap-3 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-magenta-texto';

export default function PaginaTrafego() {
  return (
    <Casca>
      {/* ============================================================ */}
      {/* Abertura em tela cheia                                       */}
      {/*                                                              */}
      {/* O formulário SAIU da primeira dobra e virou destino do botão. */}
      {/* É a troca que este formato pede: a abertura passa a fazer um  */}
      {/* argumento em vez de pedir dados de quem ainda não sabe por    */}
      {/* que daria. Quem chegou decidido tem o botão à mão, e ele rola */}
      {/* direto para o formulário logo abaixo.                        */}
      {/* ============================================================ */}
      <HeroTrafego
        rotulo={heroi.rotulo}
        titulo={heroi.linhas}
        texto={heroi.texto}
        apoio={heroi.apoio}
        acao={heroi.acao}
        linkWhatsapp={linkWhatsapp}
      />

      {/* O formulário, logo depois da abertura. */}
      <section id="analise" className="scroll-mt-20 border-t border-fio py-16 md:py-24">
        <div className={secao}>
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
            <div>
              <p className={rotuloSecao}>
                <span aria-hidden className="h-px w-8 bg-magenta" />
                Sem custo
              </p>
              <h2 className={`mt-6 max-w-[16ch] ${tituloSecao}`}>{formulario.titulo}</h2>
              <p className="mt-7 max-w-[50ch] text-guia text-neve">{formulario.texto}</p>
            </div>
            <FormAnalise />
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* Os sintomas: reconhecer a própria situação                   */}
      {/* ============================================================ */}
      <section className="border-t border-fio py-16 md:py-24">
        <div className={secao}>
          <p className={rotuloSecao}>
            <span aria-hidden className="h-px w-8 bg-magenta" />
            O que costuma estar acontecendo
          </p>
          <h2 className={`mt-6 max-w-[24ch] ${tituloSecao}`}>
            Não é falta de verba. É falta de{' '}
            <span className="text-magenta-texto">resposta.</span>
          </h2>

          <ul className="mt-12 grid gap-6 md:grid-cols-3">
            {sintomas.map((s, i) => (
              <li key={s.titulo} className="revelar cartao h-full p-6 md:p-7">
                  <p aria-hidden className="font-mono text-sm text-magenta-texto">
                    {String(i + 1).padStart(2, '0')}
                  </p>
                  <h3 className="mt-4 font-display text-lg font-bold tracking-[-0.02em]">
                    {s.titulo}
                  </h3>
                  <p className="mt-3 leading-relaxed text-cinza">{s.texto}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ============================================================ */}
      {/* O método, em quatro etapas com entrega                       */}
      {/* ============================================================ */}
      <section className="border-t border-fio py-16 md:py-24">
        <div className={secao}>
          <p className={rotuloSecao}>
            <span aria-hidden className="h-px w-8 bg-magenta" />
            Como a Psy Comunic opera
          </p>
          <h2 className={`mt-6 max-w-[22ch] ${tituloSecao}`}>
            Quatro etapas, cada uma com uma{' '}
            <span className="text-magenta-texto">entrega.</span>
          </h2>
          <p className="mt-7 max-w-[62ch] text-guia text-neve">
            Promessa vaga qualquer agência faz. O que dá para cobrar é uma sequência em que
            cada passo produz algo que você consegue ver.
          </p>

          <ol className="mt-14 space-y-5">
            {metodo.map((e) => (
              <li key={e.n} className="revelar cartao grid gap-6 p-6 md:grid-cols-[auto_1fr_0.8fr] md:items-start md:gap-10 md:p-8">
                  <p
                    aria-hidden
                    className="font-display text-3xl font-extrabold tracking-[-0.04em] text-magenta-texto md:text-4xl"
                  >
                    {e.n}
                  </p>
                  <div>
                    <h3 className="font-display text-xl font-bold tracking-[-0.025em]">
                      {e.titulo}
                    </h3>
                    <p className="mt-3 max-w-[56ch] leading-relaxed text-cinza">{e.texto}</p>
                  </div>
                  <div className="border-t border-fio pt-4 md:border-l md:border-t-0 md:pl-8 md:pt-0">
                    <p className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-cinza">
                      Sai daqui
                    </p>
                    <p className="mt-2.5 leading-relaxed text-neve">{e.entrega}</p>
                  </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ============================================================ */}
      {/* O painel: o diferencial que dá para conferir                 */}
      {/* ============================================================ */}
      <section className="relative isolate overflow-hidden border-t border-fio py-16 md:py-24">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="brilho-magenta absolute -left-[18%] top-[10%] h-[560px] w-[560px] opacity-25" />
        </div>

        <div className={secao}>
          <div className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
            <div>
              <p className={rotuloSecao}>
                <span aria-hidden className="h-px w-8 bg-magenta" />
                Transparência que se abre
              </p>
              <h2 className={`mt-6 max-w-[18ch] ${tituloSecao}`}>{painel.titulo}</h2>
              <p className="mt-8 max-w-[52ch] text-guia text-neve">{painel.texto}</p>
            </div>

            <ul className="space-y-4">
              {painel.itens.map((i) => (
                <li key={i} className="cartao flex gap-4 p-5 md:p-6">
                  <span aria-hidden className="mt-1 flex-none text-magenta-texto">●</span>
                  <span className="leading-relaxed text-neve">{i}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* Social media, dito como complemento                          */}
      {/* ============================================================ */}
      <section className="border-t border-fio py-16 md:py-24">
        <div className={secao}>
          <p className={rotuloSecao}>
            <span aria-hidden className="h-px w-8 bg-magenta" />
            Complemento, não substituto
          </p>
          <h2 className={`mt-6 max-w-[22ch] ${tituloSecao}`}>{social.titulo}</h2>
          <p className="mt-8 max-w-[64ch] text-guia text-neve">{social.texto}</p>

          <ul className="mt-12 grid gap-6 md:grid-cols-3">
            {social.itens.map((i) => (
              <li key={i.titulo} className="cartao h-full p-6 md:p-7">
                <h3 className="font-display text-lg font-bold tracking-[-0.02em]">
                  {i.titulo}
                </h3>
                <p className="mt-3 leading-relaxed text-cinza">{i.texto}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ============================================================ */}
      {/* As marcas. Prova que existe sem inventar número.             */}
      {/* ============================================================ */}
      <section className="border-t border-fio py-14 md:py-16">
        <div className={secao}>
          <p className={rotuloSecao}>
            <span aria-hidden className="h-px w-8 bg-magenta" />
            Marcas que já passaram por aqui
          </p>
        </div>
        <div className="mt-10">
          <FitaMarcas logos={logosMarcas.slice(0, Math.ceil(logosMarcas.length / 2))} duracao={64} />
          <FitaMarcas logos={logosMarcas.slice(Math.ceil(logosMarcas.length / 2))} duracao={78} volta />
        </div>
      </section>

      {/* ============================================================ */}
      {/* Para quem serve, e para quem não serve                       */}
      {/* ============================================================ */}
      <section className="border-t border-fio py-16 md:py-24">
        <div className={secao}>
          <p className={rotuloSecao}>
            <span aria-hidden className="h-px w-8 bg-magenta" />
            Antes de conversar
          </p>
          <h2 className={`mt-6 max-w-[20ch] ${tituloSecao}`}>
            Para quem isto funciona, e para quem{' '}
            <span className="text-magenta-texto">não.</span>
          </h2>

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            <div className="cartao p-6 md:p-8">
              <p className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-magenta-texto">
                Serve para
              </p>
              <ul className="mt-6 space-y-4">
                {paraQuem.serve.map((s) => (
                  <li key={s} className="flex gap-3 leading-relaxed text-neve">
                    <span aria-hidden className="mt-1 flex-none text-magenta-texto">●</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            {/* Dizer para quem NÃO serve custa alguns leads e evita as
                conversas que terminariam mal de todo jeito. */}
            <div className="cartao p-6 md:p-8">
              <p className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-cinza">
                Não serve para
              </p>
              <ul className="mt-6 space-y-4">
                {paraQuem.naoServe.map((s) => (
                  <li key={s} className="flex gap-3 leading-relaxed text-cinza">
                    <span aria-hidden className="mt-1 flex-none">—</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* Quem opera                                                   */}
      {/* ============================================================ */}
      <section className="border-t border-fio py-16 md:py-24">
        <div className={secao}>
          <div className="grid gap-12 lg:grid-cols-[1fr_0.85fr] lg:gap-16">
            <div>
              <p className={rotuloSecao}>
                <span aria-hidden className="h-px w-8 bg-magenta" />
                Quem opera
              </p>
              <h2 className={`mt-6 max-w-[20ch] ${tituloSecao}`}>{quemOpera.titulo}</h2>
              <p className="mt-8 max-w-[60ch] text-guia text-neve">{quemOpera.texto}</p>
            </div>

            <ul className="space-y-4 self-center">
              {quemOpera.pontos.map((p) => (
                <li key={p} className="cartao flex gap-4 p-5">
                  <span aria-hidden className="mt-1 flex-none text-magenta-texto">●</span>
                  <span className="leading-relaxed text-neve">{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* Perguntas                                                    */}
      {/* ============================================================ */}
      <section className="border-t border-fio py-16 md:py-24">
        <div className={secao}>
          <p className={rotuloSecao}>
            <span aria-hidden className="h-px w-8 bg-magenta" />
            O que perguntam antes de fechar
          </p>
          <h2 className={`mt-6 max-w-[18ch] ${tituloSecao}`}>
            Respondido <span className="text-magenta-texto">antes.</span>
          </h2>

          <div className="mt-12 grid gap-4 lg:grid-cols-2">
            {perguntas.map((q) => (
              <details key={q.p} className="cartao group p-6">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 font-display text-lg font-bold tracking-[-0.02em]">
                  {q.p}
                  <span
                    aria-hidden
                    className="mt-1 flex-none text-magenta-texto transition-transform duration-300 group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-4 max-w-[60ch] leading-relaxed text-cinza">{q.r}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* Fechamento: o formulário de novo                             */}
      {/*                                                              */}
      {/* Quem leu tudo está no fim da página, e mandá-lo rolar de      */}
      {/* volta é onde se perde a conversão que o texto acabou de       */}
      {/* ganhar.                                                      */}
      {/* ============================================================ */}
      <section className="relative isolate overflow-hidden border-t border-fio py-16 md:py-24">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="grade absolute inset-0" />
          <div className="brilho-magenta absolute -right-[10%] bottom-[-20%] h-[620px] w-[620px] opacity-30" />
        </div>

        <div className={secao}>
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            <div>
              <h2 className={`max-w-[16ch] ${tituloSecao}`}>{formulario.titulo}</h2>
              <p className="mt-7 max-w-[50ch] text-guia text-neve">{formulario.texto}</p>

              <p className="mt-10 text-sm leading-relaxed text-cinza">
                Prefere conversar direto?
              </p>
              <div className="mt-4">
                <Botao href={linkWhatsapp} variante="secundario" externo>
                  Chamar no WhatsApp
                </Botao>
              </div>
            </div>

            <FormAnalise />
          </div>
        </div>
      </section>
    </Casca>
  );
}
