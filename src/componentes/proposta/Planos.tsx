import {
  fichas,
  PLANOS,
  feeEmReais,
  sempreIncluso,
  entregasDoPlano,
  contarEntregas,
  diferencas,
  type Plano,
} from '@/dados/planos';
import { Slide, Bloco } from './Slide';

/**
 * Os planos, em slides.
 *
 * Componentes de SERVIDOR. Eles importam `@/dados/planos`, que é
 * `server-only` porque tem preço: se algum destes virar `use client`, o
 * build quebra, e é para quebrar mesmo.
 *
 * ============================================================
 * A TABELA NÃO CABE NO CELULAR
 * ============================================================
 * Vinte e duas linhas por três colunas é uma planilha, e a maioria abre
 * a proposta no telefone. Rolar uma tabela para o lado DENTRO de uma
 * apresentação que já passa para o lado é o pior gesto possível: os
 * dois movimentos brigam pelo mesmo dedo.
 *
 * Então não há tabela de três colunas em lugar nenhum. Cada plano ganha
 * o próprio slide, e um slide de diferenças mostra só as linhas em que
 * os três discordam.
 *
 * ============================================================
 * O QUE O PLANO NÃO INCLUI FICA EM UMA LINHA, E NÃO EM LISTA
 * ============================================================
 * A primeira versão listava os não-inclusos riscados, item por item.
 * No Saturno isso eram onze itens riscados contra sete marcados: a tela
 * inteira virava um monumento ao que a agência não faz, bem na hora de
 * pedir cinco mil reais por mês.
 *
 * Omitir também não serve — a pessoa descobriria a diferença na
 * reunião, que é o pior lugar. Então o que falta sai NOMEADO, numa
 * linha discreta no rodapé do slide, e detalhado no slide seguinte.
 */

/* Um slide devolve UM elemento, e nunca um fragmento.

   `React.Children.toArray`, que o Deck usa para contar os slides,
   ACHATA fragmentos: um `<>` com cinco filhos vira cinco slides. A
   primeira versão devolvia fragmento e a apresentação abriu com 26
   slides em vez de 12, cada pedaço numa tela. */

const SIM = '#4ADE80';
const NAO = '#93A0BC';

/* ================================================================== */
/* Slide: os três caminhos                                            */
/* ================================================================== */

export function SlideVisaoGeral({ recomendado }: { recomendado: Plano }) {
  return (
    <Slide
      rotulo="Planos"
      titulo={
        <>
          Três profundidades,{' '}
          <span className="text-magenta-texto">uma escada.</span>
        </>
      }
      apoio="Cada plano contém o anterior inteiro. O que muda é até onde a Psy Comunic entra na operação."
    >
      <div className="mt-2 grid gap-4 lg:grid-cols-3">
        {PLANOS.map((p, i) => {
          const f = fichas[p];
          const alvo = p === recomendado;
          const { inclusos, total } = contarEntregas(p);

          return (
            <Bloco
              key={p}
              destaque={alvo}
              className={'flex flex-col ' + (alvo ? 'lg:-translate-y-3' : '')}
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-mono text-[0.72rem] uppercase tracking-[0.18em] text-cinza">
                  {String(i + 1).padStart(2, '0')}
                </span>
                {alvo ? (
                  <span className="rounded-full bg-magenta px-3 py-1 font-mono text-[0.7rem] uppercase tracking-[0.14em] text-branco">
                    recomendado
                  </span>
                ) : f.selo ? (
                  <span className="rounded-full border border-fio px-3 py-1 font-mono text-[0.7rem] uppercase tracking-[0.14em] text-cinza">
                    {f.selo}
                  </span>
                ) : null}
              </div>

              <h3 className="mt-4 font-display text-sub font-extrabold tracking-[-0.035em]">
                {f.nome}
              </h3>

              <p className="tabular mt-3 flex items-baseline gap-1.5">
                <span className="font-display text-3xl font-extrabold tracking-[-0.04em] text-branco">
                  {feeEmReais(p)}
                </span>
                <span className="text-sm text-cinza">/mês</span>
              </p>

              <p className="mt-4 border-t border-fio pt-4 text-sm leading-relaxed text-neve">
                {f.promessa}
              </p>

              {/* Barra de cobertura: a proporção de entregas do plano.
                  Número e barra juntos, porque a barra sozinha não se
                  cita numa reunião e o número sozinho não se compara
                  de relance. */}
              <div className="mt-auto pt-5">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-mono text-[0.7rem] uppercase tracking-[0.12em] text-cinza">
                    cobertura
                  </span>
                  <span className="tabular text-xs font-semibold text-neve">
                    {inclusos} de {total}
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(inclusos / total) * 100}%`,
                      background: alvo ? 'var(--magenta)' : SIM,
                    }}
                  />
                </div>
                <p className="mt-3 font-mono text-[0.7rem] uppercase tracking-[0.12em] text-cinza">
                  {f.indicadoPara}
                </p>
              </div>
            </Bloco>
          );
        })}
      </div>
    </Slide>
  );
}

/* ================================================================== */
/* Slide: um plano inteiro                                            */
/* ================================================================== */

export function SlidePlano({
  plano,
  recomendado,
  /*
    Linhas que ESTA proposta concedeu, vindas de um plano superior.

    Sem elas, o slide montava o "não inclui" direto da tabela e dizia
    "não inclui gestão de marketplaces" dois slides depois de a proposta
    prometer o Mercado Livre. Documento que se contradiz derruba a venda
    sozinho, e o cliente é quem encontra.
  */
  linhasIncluidas = [],
  /*
    Esconde o preço de tabela quando a proposta traz a própria conta.

    Sem isto, este slide anunciava o valor cheio do plano e o slide de
    investimento, três telas adiante, mostrava outro. Dois preços em
    lugares diferentes obrigam o cliente a decidir qual vale, e a
    dúvida some junto com a confiança no resto do documento.

    Com a conta negociada existindo, ela é a única autoridade de número.
  */
  precoNaConta = false,
}: {
  plano: Plano;
  recomendado: Plano;
  linhasIncluidas?: string[];
  precoNaConta?: boolean;
}) {
  const f = fichas[plano];
  const alvo = plano === recomendado;

  const concedida = (nome: string) => linhasIncluidas.includes(nome);

  const grupos = entregasDoPlano(plano).map((g) => ({
    ...g,
    itens: g.itens.map((i) =>
      concedida(i.nome) ? { ...i, incluso: true, valor: i.valor === false ? true : i.valor } : i,
    ),
  }));

  const base = contarEntregas(plano);
  const inclusos = base.inclusos + linhasIncluidas.length;
  const total = base.total;

  const foraDoPlano = grupos.flatMap((g) => g.itens.filter((i) => !i.incluso).map((i) => i.nome));

  return (
    <Slide rotulo={alvo ? 'Recomendado para você' : 'Plano'}>
      <div className="flex min-h-full flex-col">
        {/* Faixa de topo: nome e preço lado a lado. É a informação que
            a pessoa procura primeiro ao chegar no slide. */}
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 border-b border-fio pb-6">
          <div>
            <h2 className="font-display text-titulo font-extrabold leading-[1] tracking-[-0.04em]">
              {f.nome}
            </h2>
            <p className="mt-2 max-w-[40ch] text-sm leading-relaxed text-cinza">{f.paraQuem}</p>
          </div>

          {precoNaConta ? (
            <p className="max-w-[22ch] text-sm leading-relaxed text-cinza">
              O investimento desta proposta está{' '}
              <span className="text-magenta-texto">logo adiante</span>, com a conta feita
              mês a mês.
            </p>
          ) : (
            <p className="tabular">
              <span
                className="font-display text-4xl font-extrabold tracking-[-0.045em] sm:text-5xl"
                style={{ color: alvo ? 'var(--magenta-texto)' : 'var(--branco)' }}
              >
                {feeEmReais(plano)}
              </span>
              <span className="ml-1.5 text-sm text-cinza">/mês</span>
              <span className="mt-1.5 block font-mono text-[0.7rem] uppercase tracking-[0.12em] text-cinza">
                fee da agência · verba de mídia à parte
              </span>
            </p>
          )}
        </div>

        <p className="mt-6 max-w-[62ch] text-guia leading-relaxed text-neve">{f.promessa}</p>

        {/* Só o que ESTÁ incluído, agrupado. Duas colunas a partir do
            tablet; no telefone uma só, porque duas de 170px transformam
            cada item em três linhas quebradas. */}
        <div className="mt-8 grid gap-x-12 gap-y-7 sm:grid-cols-2">
          {grupos
            .filter((g) => g.itens.some((i) => i.incluso))
            .map((g) => (
              <div key={g.titulo}>
                <h3 className="flex items-center gap-2.5 font-mono text-[0.72rem] uppercase tracking-[0.16em] text-magenta-texto">
                  <span aria-hidden className="h-px w-5 flex-none bg-magenta/60" />
                  {g.titulo}
                </h3>
                <ul className="mt-3.5 space-y-3">
                  {g.itens
                    .filter((i) => i.incluso)
                    .map((item) => (
                      <li key={item.nome} className="flex gap-3">
                        <span
                          aria-hidden
                          className="mt-[0.2rem] flex-none text-[0.7rem]"
                          style={{ color: SIM }}
                        >
                          ✓
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-medium leading-snug text-branco">
                            {item.nome}
                          </span>
                          {/* A sublinha mostra o LIMITE quando ele
                              existe, e o PORQUÊ quando não existe.
                              Nunca os dois: dobraria o texto de cada
                              item, e o slide já é o mais denso do deck.

                              Sem o segundo caso, o `porque` de toda
                              linha marcada como simples "incluído" era
                              texto morto no arquivo de dados —
                              escrito, revisado, e renderizado em lugar
                              nenhum. */}
                          {typeof item.valor === 'string' ? (
                            <span className="mt-0.5 block text-xs leading-snug text-cinza">
                              {item.valor}
                            </span>
                          ) : item.porque ? (
                            <span className="mt-0.5 block text-xs leading-snug text-cinza">
                              {item.porque}
                            </span>
                          ) : null}
                        </span>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
        </div>

        {/* O que falta, em UMA linha. Nomeado, para não haver surpresa
            na reunião, e discreto, para não virar o assunto do slide. */}
        {foraDoPlano.length > 0 ? (
          <p className="mt-auto flex flex-wrap gap-x-2 gap-y-1 border-t border-fio pt-5 text-xs leading-relaxed text-cinza">
            <span className="font-mono uppercase tracking-[0.12em]" style={{ color: NAO }}>
              não inclui
            </span>
            <span className="min-w-0">{foraDoPlano.join(' · ')}</span>
          </p>
        ) : (
          <p className="mt-auto border-t border-fio pt-5 text-xs uppercase tracking-[0.12em]" style={{ color: SIM }}>
            <span aria-hidden>✓ </span>
            entrega as {total} de {total} linhas desta proposta
          </p>
        )}

        <p className="sr-only">
          Este plano inclui {inclusos} das {total} entregas comparadas.
        </p>
      </div>
    </Slide>
  );
}

/* ================================================================== */
/* Slide: o que muda entre eles                                       */
/* ================================================================== */

export function SlideDiferencas({ recomendado }: { recomendado: Plano }) {
  return (
    <Slide
      rotulo="Comparativo"
      titulo={
        <>
          O que muda <span className="text-magenta-texto">entre eles.</span>
        </>
      }
      apoio="Só as linhas em que os três discordam. O que é igual nos três não ajuda a escolher."
    >
      {/* Sem tabela de propósito. Cada item vira um bloco com o rótulo
          em cima e os três valores embaixo, em grade de três colunas.
          Isso cabe em 360px, e uma tabela de três colunas não cabe. */}
      <ul className="mt-2 grid gap-3 lg:grid-cols-2">
        {diferencas.map((l) => (
          <li key={l.nome}>
            <Bloco className="h-full">
              <p className="text-sm font-semibold text-branco">{l.nome}</p>
              {l.porque ? (
                <p className="mt-1 text-xs leading-relaxed text-cinza">{l.porque}</p>
              ) : null}

              <dl className="mt-4 grid grid-cols-3 gap-2">
                {PLANOS.map((p) => {
                  const v = l.valores[p];
                  const alvo = p === recomendado;

                  return (
                    <div
                      key={p}
                      className={
                        'rounded-xl px-2.5 py-2.5 ' +
                        (alvo
                          ? 'bg-magenta/[0.14] ring-1 ring-magenta/45'
                          : 'bg-white/[0.045]')
                      }
                    >
                      <dt className="font-mono text-[0.7rem] uppercase tracking-[0.1em] text-cinza">
                        {fichas[p].nome}
                      </dt>
                      <dd
                        className="mt-1.5 text-xs leading-snug"
                        style={{ color: v === false ? NAO : v === true ? SIM : undefined }}
                      >
                        {v === true ? (
                          <>
                            <span aria-hidden>✓ </span>Incluído
                          </>
                        ) : v === false ? (
                          <>
                            <span aria-hidden>— </span>Não inclui
                          </>
                        ) : (
                          <span className={alvo ? 'font-semibold text-branco' : 'text-neve'}>
                            {v}
                          </span>
                        )}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </Bloco>
          </li>
        ))}
      </ul>
    </Slide>
  );
}

/* ================================================================== */
/* Slide: o que vem em todos                                          */
/* ================================================================== */

export function SlideSempreIncluso({ comparativo = true }: { comparativo?: boolean }) {
  return (
    <Slide
      rotulo="Em qualquer plano"
      titulo={
        <>
          Isso vem junto, <span className="text-magenta-texto">sempre.</span>
        </>
      }
      /* Sem o comparativo na frente, falar em "os três" não faz sentido
         nenhum para quem só viu um plano. */
      apoio={
        comparativo
          ? 'Fora do comparativo de propósito: item marcado nos três não diferencia nada. Mas é do que se sente falta ao trocar de agência.'
          : 'Não entra na lista do plano porque vale para todos. Mas é do que se sente falta ao trocar de agência.'
      }
    >
      <ul className="mt-2 grid gap-3 sm:grid-cols-2">
        {sempreIncluso.map((item) => (
          <li key={item}>
            <Bloco className="flex h-full gap-4">
              <span aria-hidden className="mt-0.5 flex-none text-sm" style={{ color: SIM }}>
                ✓
              </span>
              <span className="text-sm leading-relaxed text-neve">{item}</span>
            </Bloco>
          </li>
        ))}
      </ul>
    </Slide>
  );
}
