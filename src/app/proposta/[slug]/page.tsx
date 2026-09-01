import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { buscarPropostaExibida, venceEmExibida } from '@/dados/propostas';
import { condicoesPadrao, PLANOS } from '@/dados/planos';
import { fichaDoServico, sempreNoAvulso, emReais } from '@/dados/servicos';
import { Deck } from '@/componentes/proposta/Deck';
import { Slide, Bloco } from '@/componentes/proposta/Slide';
import {
  SlideVisaoGeral,
  SlidePlano,
  SlideDiferencas,
  SlideSempreIncluso,
} from '@/componentes/proposta/Planos';
import { SlideMarcas } from '@/componentes/proposta/Marcas';
import { SlideServicos } from '@/componentes/proposta/Servicos';
import { SlideJornada, SlidePorQueCompleta } from '@/componentes/proposta/Jornada';
import { SlideCusto, SlideLancamento, SlideInclusoes } from '@/componentes/proposta/Custo';
import { marca } from '@/conteudo/marca';
import { linkWhatsapp } from '@/conteudo/navegacao';
import { urlAbsoluta } from '@/conteudo/site';

/*
  Proposta comercial: documento privado, um link por cliente,
  apresentado como deck que passa para o lado.

  force-dynamic de propósito. Se fosse estática, o build geraria e
  guardaria o HTML de todas as propostas, e uma proposta é documento de
  um cliente só.
*/
export const dynamic = 'force-dynamic';

/**
 * A previa do link, montada com o conteudo DESTA proposta.
 *
 * Sem isto o WhatsApp caia nas meta tags da home, e quem recebia via
 * "Sua loja nao precisa de mais uma agencia" no lugar do documento que
 * acabaram de mandar para ela. A primeira impressao do link era de
 * mensagem em massa.
 *
 * O noindex continua: og:title nao faz buscador indexar, e a
 * protecao da proposta e o link, que ninguem adivinha.
 *
 * PRECO NAO ENTRA NA PREVIA. Ela aparece na lista de conversas e no
 * encaminhamento para grupo. O valor esta dentro da proposta, que e
 * onde ele tem contexto.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = await buscarPropostaExibida(slug);

  const robots = { index: false, follow: false, nocache: true } as const;

  /* Rascunho e link inventado caem aqui. A pagina responde 404 de todo
     jeito; a previa nao pode adiantar que existe alguma coisa. */
  if (!p) return { title: 'Proposta', robots };

  const titulo = `Proposta para ${p.cliente}`;

  return {
    title: titulo,
    description: p.resumo,
    robots,
    openGraph: {
      type: 'article',
      locale: 'pt_BR',
      siteName: marca.nome,
      title: titulo,
      description: p.resumo,
      url: urlAbsoluta(`/proposta/${slug}`),
      /* A imagem vem de opengraph-image.tsx, ao lado deste arquivo. */
    },
    twitter: {
      card: 'summary_large_image',
      title: titulo,
      description: p.resumo,
    },
  };
}

/* `viewportFit: cover` deixa o fundo ir até a borda em telefone com
   entalhe. Os controles compensam com `env(safe-area-inset-bottom)`. */
export const viewport = {
  themeColor: '#101F3F',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover' as const,
};

const dataBR = (d: Date) =>
  d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

export default async function PaginaProposta({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = await buscarPropostaExibida(slug);
  if (!p) notFound();

  const vencimento = venceEmExibida(p);
  const vencida = vencimento < new Date();
  const condicoes = p.condicoes.length > 0 ? p.condicoes : condicoesPadrao;
  const recomendado = p.plano ?? 'falcon';

  return (
    <Deck>
      {/* ---------------------------------------------------------- */}
      {/* Capa                                                        */}
      {/* ---------------------------------------------------------- */}
      <Slide centrado>
        <div>
          <p className="flex items-center gap-3 font-mono uppercase tracking-[0.22em] text-magenta-texto [font-size:clamp(0.72rem,2.4vw,0.8rem)]">
            <span aria-hidden className="h-px w-8 flex-none bg-magenta sm:w-12" />
            Proposta comercial
          </p>

          <h1 className="mt-6 max-w-[14ch] font-display text-mostro font-extrabold tracking-[-0.045em]">
            {p.cliente}
          </h1>

          <p className="mt-5 text-guia text-neve">
            Aos cuidados de <span className="text-branco">{p.contato}</span>
          </p>

          <p className="mt-8 max-w-[52ch] text-guia leading-relaxed text-neve">{p.resumo}</p>

          <dl className="mt-10 flex flex-wrap gap-x-12 gap-y-5 border-t border-fio pt-7">
            <div>
              <dt className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-cinza">
                Emitida em
              </dt>
              <dd className="mt-1.5 text-sm text-neve">{dataBR(new Date(p.emitidaEm))}</dd>
            </div>
            <div>
              <dt className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-cinza">
                {vencida ? 'Venceu em' : 'Válida até'}
              </dt>
              <dd className={'mt-1.5 text-sm ' + (vencida ? 'text-magenta-texto' : 'text-neve')}>
                {dataBR(vencimento)}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-cinza">
                Por
              </dt>
              <dd className="mt-1.5 text-sm text-neve">{marca.nome}</dd>
            </div>
          </dl>

          {vencida ? (
            <p className="mt-8 max-w-[54ch] rounded-2xl border border-magenta/40 bg-magenta/10 p-4 text-sm leading-relaxed text-magenta-texto">
              Esta proposta passou da validade. Fale com a {marca.nome} para receber uma
              versão atualizada, com os valores conferidos.
            </p>
          ) : null}
        </div>
      </Slide>

      {/* ---------------------------------------------------------- */}
      {/* A solução completa                                          */}
      {/*                                                             */}
      {/* Logo depois da capa, de propósito. É o enquadramento de tudo */}
      {/* o que vem: sem ele, a proposta abre falando dos problemas da */}
      {/* loja, emenda em plano mensal, e o leitor conclui sozinho que */}
      {/* a Psy Comunic é mais uma agência de mídia com mensalidade.   */}
      {/* ---------------------------------------------------------- */}
      {/*
        SÓ na proposta de pacote.

        Estes dois slides dizem "construímos a loja e ficamos para fazer
        ela vender". É o enquadramento certo para e-commerce e o errado
        para todo o resto: numa proposta de gestão de tráfego para quem
        vende curso, ou para uma clínica, eles descrevem o negócio de
        outra pessoa. A proposta passa a parecer modelo reaproveitado, e
        é exatamente a impressão que ela existe para evitar.
      */}
      {p.plano ? (
        <>
          <SlideJornada />
          <SlidePorQueCompleta />
        </>
      ) : null}

      {/* ---------------------------------------------------------- */}
      {/* Diagnóstico                                                 */}
      {/* ---------------------------------------------------------- */}
      {p.diagnostico.length > 0 ? (
        <Slide
          rotulo="Diagnóstico"
          titulo={
            <>
              O que <span className="text-magenta-texto">encontramos.</span>
            </>
          }
          apoio="O ponto de partida desta proposta. Se algo aqui estiver errado, o escopo muda junto."
        >
          <ol className="mt-2 grid gap-3">
            {p.diagnostico.map((d, i) => (
              <li key={d}>
                <Bloco className="flex gap-4 sm:gap-5">
                  <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-magenta/15 font-mono text-[0.72rem] font-semibold text-magenta-texto">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="min-w-0 self-center text-sm leading-relaxed text-neve sm:text-[1.02rem]">
                    {d}
                  </span>
                </Bloco>
              </li>
            ))}
          </ol>
        </Slide>
      ) : null}

      {/* ---------------------------------------------------------- */}
      {/* Prova social                                                */}
      {/*                                                             */}
      {/* Entra DEPOIS do diagnóstico e ANTES dos planos. Primeiro a  */}
      {/* pessoa vê que o problema dela foi entendido, aí vê quem já  */}
      {/* confiou, e só então chega o preço. Prova social antes do    */}
      {/* diagnóstico soa como apresentação de agência; depois do     */}
      {/* preço, chega tarde para ajudar a decidir.                   */}
      {/* ---------------------------------------------------------- */}
      <SlideMarcas
        apoio={
          p.plano
            ? 'Operações de e-commerce de portes e segmentos diferentes, do primeiro milhão à escala de marketplace.'
            : undefined
        }
      />

      {/* ---------------------------------------------------------- */}
      {/* Escopo das propostas antigas, escritas à mão                */}
      {/* ---------------------------------------------------------- */}
      {p.escopo.length > 0 ? (
        <Slide
          rotulo="Escopo"
          titulo={
            <>
              O que vamos <span className="text-magenta-texto">fazer.</span>
            </>
          }
        >
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {p.escopo.map((bloco) => (
              <Bloco key={bloco.frente} className="h-full">
                <h3 className="font-display text-lg font-bold tracking-[-0.02em]">
                  {bloco.frente}
                </h3>
                <ul className="mt-3.5 space-y-2.5 text-sm leading-relaxed text-neve">
                  {bloco.itens.map((i) => (
                    <li key={i} className="flex gap-3">
                      <span aria-hidden className="flex-none text-magenta-texto">
                        ·
                      </span>
                      {i}
                    </li>
                  ))}
                </ul>
              </Bloco>
            ))}
          </div>
        </Slide>
      ) : null}

      {/* ---------------------------------------------------------- */}
      {/* Planos: visão, um slide por plano, e as diferenças          */}
      {/* ---------------------------------------------------------- */}
      {/*
        Por padrão a proposta mostra SÓ o plano recomendado.

        Três colunas de preço num documento que já traz uma recomendação
        convidam o cliente a comprar para baixo, e a proposta passa a
        competir consigo mesma. O comparativo continua existindo para a
        negociação em que ele ajuda, e aí liga-se `mostrarComparativo`.
      */}
      {p.plano && p.mostrarComparativo ? (
        <SlideVisaoGeral recomendado={recomendado} />
      ) : null}

      {p.plano && p.mostrarComparativo
        ? PLANOS.map((plano) => (
            <SlidePlano
              key={plano}
              plano={plano}
              recomendado={recomendado}
              linhasIncluidas={plano === recomendado ? p.linhasIncluidas : []}
            />
          ))
        : null}

      {p.plano && !p.mostrarComparativo ? (
        <SlidePlano
          plano={p.plano}
          recomendado={recomendado}
          linhasIncluidas={p.linhasIncluidas}
          precoNaConta={p.etapas.length > 0}
        />
      ) : null}

      {p.plano && p.mostrarComparativo ? <SlideDiferencas recomendado={recomendado} /> : null}
      {p.plano ? <SlideSempreIncluso comparativo={p.mostrarComparativo} /> : null}

      {/* ---------------------------------------------------------- */}
      {/* Serviço avulso: a proposta que não é pacote                 */}
      {/*                                                             */}
      {/* Exclui o plano por construção — a action grava um OU outro. */}
      {/* Metade da carteira não é loja virtual, e empurrar um pacote */}
      {/* de e-commerce para um chalé seria vender o que não serve.   */}
      {/* ---------------------------------------------------------- */}
      {p.servicos.length > 0 ? (
        <SlideServicos
          precoNaConta={p.etapas.length > 0}
          sempre={sempreNoAvulso}
          linkWhatsapp={linkWhatsapp}
          servicos={p.servicos.map((s) => {
            const f = fichaDoServico(s.id);
            return {
              id: f.id,
              nome: f.nome,
              papel: f.papel,
              paraQuem: f.paraQuem,
              promessa: f.promessa,
              entregas: f.entregas,
              naoInclui: f.naoInclui,
              fee: s.fee,
              feeTexto: emReais(s.fee),
            };
          })}
        />
      ) : null}

      {/* ---------------------------------------------------------- */}
      {/* O que esta proposta dá além do plano                        */}
      {/* ---------------------------------------------------------- */}
      {p.inclusoesExtras.length > 0 ? (
        <SlideInclusoes itens={p.inclusoesExtras} />
      ) : null}

      {/* ---------------------------------------------------------- */}
      {/* A conta do mês, somada                                      */}
      {/*                                                             */}
      {/* Depois dos planos e antes das condições: a pessoa acabou de */}
      {/* ver o preço do plano, e a pergunta imediata é "quanto sai   */}
      {/* por mês, tudo somado?". Deixar ela fazer essa conta sozinha */}
      {/* é deixar que erre para mais.                                */}
      {/* ---------------------------------------------------------- */}
      {p.etapas.length > 0 ? (
        <SlideCusto etapas={p.etapas} notaPlataforma={p.notaPlataforma} />
      ) : null}

      {p.etapas.length > 0 ? <SlideLancamento prazoTexto={p.prazoTexto} /> : null}

      {/* ---------------------------------------------------------- */}
      {/* Investimento das propostas antigas                          */}
      {/* ---------------------------------------------------------- */}
      {p.investimento.length > 0 ? (
        <Slide
          rotulo="Investimento"
          titulo={
            <>
              Quanto <span className="text-magenta-texto">custa.</span>
            </>
          }
        >
          <dl className="mt-2 grid gap-3 sm:grid-cols-2">
            {p.investimento.map((i) => (
              <Bloco key={i.rotulo} className="h-full">
                <dt className="text-sm text-cinza">{i.rotulo}</dt>
                <dd className="tabular mt-2 font-display text-3xl font-extrabold tracking-[-0.04em]">
                  {i.valor}
                </dd>
                {i.observacao ? (
                  <p className="mt-3 max-w-[42ch] text-xs leading-relaxed text-cinza">
                    {i.observacao}
                  </p>
                ) : null}
              </Bloco>
            ))}
          </dl>
        </Slide>
      ) : null}

      {/* ---------------------------------------------------------- */}
      {/* Condições                                                   */}
      {/* ---------------------------------------------------------- */}
      <Slide
        rotulo="Condições"
        titulo={
          <>
            Como <span className="text-magenta-texto">funciona.</span>
          </>
        }
      >
        <ul className="mt-2 grid gap-3">
          {/* As negociadas primeiro, e destacadas. É o que a pessoa
              abriu esta tela para conferir; as padrão ela já leu em
              qualquer proposta. */}
          {p.condicoesExtras.map((c) => (
            <li key={c}>
              <Bloco destaque className="flex gap-4">
                <span aria-hidden className="mt-0.5 flex-none text-magenta-texto">
                  →
                </span>
                <span className="text-sm leading-relaxed text-neve sm:text-[0.98rem]">{c}</span>
              </Bloco>
            </li>
          ))}
          {condicoes.map((c) => (
            <li key={c}>
              <Bloco className="flex gap-4">
                <span aria-hidden className="mt-0.5 flex-none text-magenta-texto">
                  →
                </span>
                <span className="text-sm leading-relaxed text-neve sm:text-[0.98rem]">{c}</span>
              </Bloco>
            </li>
          ))}
        </ul>
      </Slide>

      {/* ---------------------------------------------------------- */}
      {/* Próximos passos                                             */}
      {/* ---------------------------------------------------------- */}
      {p.proximosPassos.length > 0 ? (
        <Slide
          rotulo="A partir do sim"
          titulo={
            <>
              Próximos <span className="text-magenta-texto">passos.</span>
            </>
          }
        >
          <ol className="mt-2 grid gap-3">
            {p.proximosPassos.map((s, i) => (
              <li key={s}>
                <Bloco className="flex items-center gap-4 sm:gap-5">
                  <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full border border-magenta/35 bg-magenta/12 font-mono text-xs font-semibold text-magenta-texto">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="min-w-0 text-sm leading-relaxed text-neve sm:text-[0.98rem]">
                    {s}
                  </span>
                </Bloco>
              </li>
            ))}
          </ol>
        </Slide>
      ) : null}

      {/* ---------------------------------------------------------- */}
      {/* Aceite                                                      */}
      {/* ---------------------------------------------------------- */}
      <Slide centrado>
        <div>
          <p className="flex items-center gap-3 font-mono uppercase tracking-[0.22em] text-magenta-texto [font-size:clamp(0.72rem,2.4vw,0.8rem)]">
            <span aria-hidden className="h-px w-8 flex-none bg-magenta sm:w-12" />
            Aceite
          </p>

          <h2 className="mt-6 max-w-[13ch] font-display text-mostro font-extrabold tracking-[-0.045em]">
            Pronto para <span className="text-magenta-texto">começar?</span>
          </h2>

          <p className="mt-6 max-w-[46ch] text-guia leading-relaxed text-neve">
            Responda por aqui que a {marca.nome} inicia o kick off e o plano de mídia na
            mesma semana.
          </p>

          <a
            href={linkWhatsapp}
            target="_blank"
            rel="noopener"
            className="mt-9 inline-flex w-full items-center justify-center rounded-full bg-magenta px-9 py-4 text-sm font-semibold text-branco shadow-[0_18px_50px_-18px_rgba(228,21,95,0.95)] transition-colors hover:bg-magenta-forte sm:w-auto"
          >
            Aceitar e falar no WhatsApp
          </a>

          <p className="mt-12 border-t border-fio pt-6 text-xs leading-relaxed text-cinza">
            Documento confidencial, preparado para {p.cliente}. Os valores valem até{' '}
            {dataBR(vencimento)}.
            <br />© {new Date().getFullYear()} {marca.nome}.
          </p>
        </div>
      </Slide>
    </Deck>
  );
}
