import Link from 'next/link';
import {
  listarContas,
  financeiroDoMes,
  listarFaturas,
  listarContratos,
  listarDespesas,
  serieFinanceira,
  whatsappDeCobranca,
} from '@/lib/dados/consultas';
import { contasParaCobranca } from '@/lib/dados/cobranca';
import { saldoDaAgencia } from '@/lib/cobranca/faturamento';
import { Kpi, AvisoProcedencia, Secao, Tabela, th, td } from '../base';
import { rotuloStatusFatura, type FaturaResumo } from '@/lib/dados/tipos';
import { dinheiro } from '@/lib/formato';
import { hojeBR } from '@/lib/datas';
import { CORES_SITUACAO } from '../paleta';
import { BarrasMes } from '../Graficos';
import { BotaoFaturar } from '../FormCobranca';
import { FormContrato, AcoesContrato } from '../FormContrato';
import {
  AcoesDoMes,
  FormCobrancaAvulsa,
  AcoesFatura,
  LembrarWhatsApp,
  CopiarTexto,
  FormDespesa,
  AcoesDespesa,
} from '../FormFinanceiro';

/**
 * Financeiro.
 *
 * ============================================================
 * FATURADO NÃO É RECEBIDO
 * ============================================================
 * A tela separa os dois em toda parte, e isso não é preciosismo de
 * contador: a fatura de agosto que o cliente paga em setembro entra em
 * faturado de agosto e em recebido de setembro. Uma agência que olha só
 * o faturamento descobre tarde que ele subiu e o caixa não.
 *
 * ============================================================
 * O FEE É NOSSO, A VERBA É DO CLIENTE
 * ============================================================
 * Verba de mídia passa pela agência e pertence ao lojista. Ela aparece
 * numa seção própria, marcada, e não é somada a nada. Misturar as duas
 * infla o faturamento com dinheiro que não é da casa.
 */

const ABAS = [
  { k: 'visao', r: 'Visão' },
  { k: 'cobrancas', r: 'Cobranças' },
  { k: 'contratos', r: 'Contratos' },
  { k: 'despesas', r: 'Despesas' },
] as const;

export type AbaFinanceiro = (typeof ABAS)[number]['k'];

/** Aba vinda da URL. Valor desconhecido cai na visão, e não em erro. */
export function abaFinanceiro(v: string | undefined): AbaFinanceiro {
  return ABAS.some((a) => a.k === v) ? (v as AbaFinanceiro) : 'visao';
}

const COR_FATURA: Record<string, string> = {
  aberta: CORES_SITUACAO.sem_dado,
  enviada: CORES_SITUACAO.atencao,
  paga: CORES_SITUACAO.saudavel,
  vencida: CORES_SITUACAO.critico,
  cancelada: CORES_SITUACAO.sem_dado,
};

const FORMA_FATURA: Record<string, string> = {
  aberta: '○', enviada: '▲', paga: '●', vencida: '■', cancelada: '—',
};

/** "2026-01-01" -> "01/01/2026". Sem `new Date`: data pura em ISO é
    lida como UTC, e à meia-noite de Brasília volta um dia. */
const dataBR = (iso: string) => iso.split('-').reverse().join('/');

/** O estado que a tela mostra, que não é sempre o gravado: fatura
    "enviada" cujo vencimento passou é vencida, e chamar de enviada
    esconderia o atraso até o Asaas avisar. */
function estadoNaTela(f: FaturaResumo) {
  const vencida = f.status !== 'paga' && f.status !== 'cancelada' && f.diasAteVencer < 0;
  return vencida ? 'vencida' : f.status;
}

export async function Financeiro({ aba = 'visao' }: { aba?: AbaFinanceiro }) {
  const [
    { dados: fin, procedencia },
    { dados: contas },
    { dados: faturas },
    { dados: contratos },
    { dados: serie },
    { dados: despesas },
    { dados: zaps },
    paraCobranca,
    asaas,
  ] = await Promise.all([
    financeiroDoMes(),
    listarContas(),
    listarFaturas(),
    listarContratos(),
    serieFinanceira(),
    listarDespesas(),
    whatsappDeCobranca(),
    contasParaCobranca(),
    saldoDaAgencia(),
  ]);

  const podeMexer = procedencia === 'banco';
  const hoje = hojeBR();

  return (
    <>
      <AvisoProcedencia procedencia={procedencia} />

      {asaas.ambiente === 'sandbox' ? (
        <p
          role="status"
          className="mt-6 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm leading-relaxed"
          style={{ borderColor: 'rgba(251,191,36,0.4)', background: 'rgba(251,191,36,0.08)', color: CORES_SITUACAO.atencao }}
        >
          <span aria-hidden className="mt-0.5">▲</span>
          O Asaas está em <strong className="font-semibold">sandbox</strong>. As cobranças
          emitidas aqui são de teste: ninguém recebe boleto de verdade e nenhum dinheiro
          entra. Troque para produção em Configurações quando for cobrar valendo.
        </p>
      ) : null}

      <nav
        aria-label="Seções do financeiro"
        className="mt-8 flex flex-wrap gap-2 border-b border-fio pb-4"
      >
        {ABAS.map((a) => (
          <Link
            key={a.k}
            href={`/painel/financeiro?aba=${a.k}`}
            aria-current={aba === a.k ? 'page' : undefined}
            className={
              'rounded-full px-4 py-2 text-sm transition-colors ' +
              (aba === a.k
                ? 'bg-magenta font-semibold text-branco'
                : 'border border-fio text-neve hover:bg-white/5')
            }
          >
            {a.r}
          </Link>
        ))}
      </nav>

      <div className="mt-8">
        {aba === 'visao' ? (
          <Visao
            fin={fin}
            serie={serie}
            faturas={faturas}
            contas={contas}
            zaps={zaps}
            podeMexer={podeMexer}
            saldo={asaas.saldo}
          />
        ) : null}

        {aba === 'cobrancas' ? (
          <Cobrancas
            faturas={faturas}
            lojas={paraCobranca}
            zaps={zaps}
            hoje={hoje}
            podeMexer={podeMexer}
          />
        ) : null}

        {aba === 'contratos' ? (
          <Contratos contratos={contratos} contas={contas} podeMexer={podeMexer} />
        ) : null}

        {aba === 'despesas' ? (
          <Despesas
            despesas={despesas}
            fin={fin}
            contas={contas}
            hoje={hoje}
            podeMexer={podeMexer}
          />
        ) : null}
      </div>
    </>
  );
}

/* ================================================================== */
/* Visão                                                              */
/* ================================================================== */

function Visao({
  fin,
  serie,
  faturas,
  contas,
  zaps,
  podeMexer,
  saldo,
}: {
  fin: Awaited<ReturnType<typeof financeiroDoMes>>['dados'];
  serie: Awaited<ReturnType<typeof serieFinanceira>>['dados'];
  faturas: FaturaResumo[];
  contas: Awaited<ReturnType<typeof listarContas>>['dados'];
  zaps: Record<string, string>;
  podeMexer: boolean;
  saldo: number | null;
}) {
  const resultado = fin.recebidoLiquidoMes - fin.despesaMes;

  /* Vencidas primeiro, e da mais antiga para a mais nova: quem está
     atrasado há 40 dias precisa de atenção antes de quem atrasou
     ontem. */
  const atrasadas = faturas
    .filter((f) => estadoNaTela(f) === 'vencida')
    .sort((a, b) => a.diasAteVencer - b.diasAteVencer);

  return (
    <>
      {podeMexer ? (
        <div className="mb-8">
          <AcoesDoMes />
        </div>
      ) : null}

      <Secao
        titulo="O mês"
        apoio="Faturado é o que foi emitido para a competência. Recebido é o que entrou. Nunca batem, e a distância entre os dois é o que o caixa sente."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi
            rotulo="Receita recorrente"
            valor={dinheiro(fin.receitaRecorrente)}
            apoio={`${fin.contratosAtivos} ${fin.contratosAtivos === 1 ? 'contrato ativo' : 'contratos ativos'}`}
          />
          <Kpi
            rotulo="Faturado no mês"
            valor={dinheiro(fin.faturadoMes)}
            apoio="Emitido para esta competência"
          />
          <Kpi
            rotulo="Recebido no mês"
            valor={dinheiro(fin.recebidoMes)}
            apoio={
              fin.recebidoLiquidoMes < fin.recebidoMes
                ? `${dinheiro(fin.recebidoLiquidoMes)} líquido, depois da taxa do Asaas`
                : 'Dinheiro que entrou'
            }
          />
          <Kpi
            rotulo="A receber"
            valor={dinheiro(fin.aReceberMes)}
            apoio="Vence ainda neste mês"
          />
        </div>
      </Secao>

      <Secao
        titulo="Resultado"
        apoio="O que sobra depois da taxa do gateway e das despesas da agência. É a resposta para 'faturei bem, mas sobrou?'."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi
            rotulo="Resultado do mês"
            valor={dinheiro(resultado)}
            apoio="Recebido líquido menos despesa paga"
          />
          <Kpi
            rotulo="Despesa paga"
            valor={dinheiro(fin.despesaMes)}
            apoio={
              fin.despesaPrevistaMes > 0
                ? `Mais ${dinheiro(fin.despesaPrevistaMes)} prevista até o fim do mês`
                : 'Nenhuma despesa prevista em aberto'
            }
            invertido
          />
          <Kpi
            rotulo="Inadimplência"
            valor={dinheiro(fin.inadimplencia)}
            apoio={
              fin.faturasVencidas > 0
                ? `${fin.faturasVencidas} ${fin.faturasVencidas === 1 ? 'cobrança vencida' : 'cobranças vencidas'}`
                : 'Nada vencido'
            }
            invertido
          />
          <Kpi
            rotulo="Saldo no Asaas"
            valor={saldo === null ? '—' : dinheiro(saldo)}
            apoio={saldo === null ? 'Asaas não conectado' : 'Disponível para transferir'}
          />
        </div>
      </Secao>

      {serie.length > 0 ? (
        <Secao
          titulo="Doze meses"
          apoio="A barra de faturado alta com a de recebido baixa no mesmo mês significa cobrança emitida que ainda não virou dinheiro."
        >
          <div className="cartao p-6">
            <BarrasMes serie={serie} />
          </div>
        </Secao>
      ) : null}

      {atrasadas.length > 0 ? (
        <Secao
          titulo={`${atrasadas.length} ${atrasadas.length === 1 ? 'cobrança vencida' : 'cobranças vencidas'}`}
          apoio="Da mais antiga para a mais recente. Quem atrasou há mais tempo é quem tem mais chance de não pagar."
        >
          <ul className="space-y-3">
            {atrasadas.map((f) => (
              <li key={f.id} className="cartao flex flex-wrap items-center gap-x-5 gap-y-3 p-5">
                <span aria-hidden className="text-sm" style={{ color: CORES_SITUACAO.critico }}>
                  ■
                </span>
                <div className="min-w-0 grow">
                  <p className="truncate text-sm font-semibold text-branco">{f.conta ?? '—'}</p>
                  <p className="mt-1 text-xs text-cinza">
                    {f.numero} · venceu há {Math.abs(f.diasAteVencer)}{' '}
                    {Math.abs(f.diasAteVencer) === 1 ? 'dia' : 'dias'}
                  </p>
                </div>
                <span className="tabular shrink-0 text-sm font-semibold">{dinheiro(f.valor)}</span>
                {podeMexer ? (
                  <LembrarWhatsApp
                    telefone={zaps[f.contaId] ?? null}
                    loja={f.conta ?? 'sua loja'}
                    numero={f.numero}
                    vencimento={f.vencimento}
                    valor={dinheiro(f.valor)}
                    link={f.linkPagamento}
                    atrasada
                  />
                ) : null}
              </li>
            ))}
          </ul>
        </Secao>
      ) : null}

      <Secao
        titulo="Concentração da carteira"
        apoio="Quanto do faturamento depende de um cliente só. Acima de 30% num único contrato, a saída dele vira problema de caixa."
      >
        {contas.length === 0 ? (
          <p className="text-sm text-cinza">Nenhuma loja ativa ainda.</p>
        ) : (
          <ul className="space-y-3">
            {[...contas]
              .sort((a, b) => b.receita - a.receita)
              .map((c) => {
                const total = contas.reduce((s, x) => s + x.receita, 0) || 1;
                const fatia = (100 * c.receita) / total;
                return (
                  <li key={c.id} className="cartao p-5">
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="font-semibold">{c.nome}</span>
                      <span className="tabular text-sm">
                        {fatia.toFixed(1).replace('.', ',')}%
                      </span>
                    </div>
                    <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-white/[0.05]">
                      <div
                        className="h-full rounded-full bg-magenta"
                        style={{ width: `${Math.max(fatia, 1)}%` }}
                      />
                    </div>
                  </li>
                );
              })}
          </ul>
        )}
      </Secao>

      <Secao titulo="Verba sob gestão">
        <div className="grid gap-4 sm:grid-cols-2">
          <Kpi
            rotulo="Mídia no mês"
            valor={dinheiro(fin.verbaSobGestao)}
            apoio="Dinheiro de cliente investido em anúncio. NÃO é receita da agência, e por isso não entra em nenhum número acima."
          />
        </div>
      </Secao>
    </>
  );
}

/* ================================================================== */
/* Cobranças                                                          */
/* ================================================================== */

function Cobrancas({
  faturas,
  lojas,
  zaps,
  hoje,
  podeMexer,
}: {
  faturas: FaturaResumo[];
  lojas: { id: string; nome: string; temDocumento: boolean }[];
  zaps: Record<string, string>;
  hoje: string;
  podeMexer: boolean;
}) {
  return (
    <>
      {podeMexer ? (
        <div className="mb-8">
          <FormCobrancaAvulsa lojas={lojas} />
        </div>
      ) : null}

      <Secao
        titulo="Cobranças"
        apoio="O status vem do Asaas pelo webhook. 'Conferir' na aba Visão puxa o estado real, para quando o retorno se perde."
      >
        {faturas.length === 0 ? (
          <p className="max-w-[70ch] text-sm leading-relaxed text-cinza">
            Nenhuma cobrança ainda. O fee mensal sai em Contratos; o resto sai no botão
            &ldquo;Nova cobrança&rdquo; aqui em cima.
          </p>
        ) : (
          <ul className="space-y-3">
            {faturas.map((f) => {
              const chave = estadoNaTela(f);
              const emAberto = chave !== 'paga' && chave !== 'cancelada';

              return (
                <li key={f.id} className="cartao space-y-4 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-branco">{f.conta ?? '—'}</p>
                      <p className="mt-1 font-mono text-[0.75rem] uppercase tracking-[0.12em] text-cinza">
                        {f.numero}
                        {f.contratoId ? ' · fee mensal' : ' · avulsa'}
                        {f.parcelas > 1 ? ` · ${f.parcelas}x` : ''}
                      </p>
                      {f.descricao ? (
                        <p className="mt-1.5 text-sm text-neve">{f.descricao}</p>
                      ) : null}
                    </div>

                    <div className="text-right">
                      <p className="tabular text-lg font-semibold">{dinheiro(f.valor)}</p>
                      <p
                        className="mt-1 text-xs font-semibold"
                        style={{ color: COR_FATURA[chave] }}
                      >
                        <span aria-hidden className="mr-1.5">{FORMA_FATURA[chave]}</span>
                        {rotuloStatusFatura[chave as keyof typeof rotuloStatusFatura]}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-cinza">
                    {f.status === 'paga'
                      ? `Paga${f.pagaEm ? ` em ${dataBR(f.pagaEm)}` : ''}${f.formaPagamento ? ` · ${f.formaPagamento}` : ''}`
                      : f.diasAteVencer < 0
                        ? `Venceu em ${dataBR(f.vencimento)}, há ${Math.abs(f.diasAteVencer)} ${Math.abs(f.diasAteVencer) === 1 ? 'dia' : 'dias'}`
                        : `Vence em ${dataBR(f.vencimento)}, em ${f.diasAteVencer} ${f.diasAteVencer === 1 ? 'dia' : 'dias'}`}
                    {f.valorLiquido !== null && f.valorLiquido < f.valor
                      ? ` · líquido ${dinheiro(f.valorLiquido)}`
                      : ''}
                  </p>

                  {podeMexer ? (
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                      {f.linkPagamento ? (
                        <CopiarTexto texto={f.linkPagamento} rotulo="copiar link" />
                      ) : null}
                      {f.pixCopiaCola ? (
                        <CopiarTexto texto={f.pixCopiaCola} rotulo="copiar PIX" />
                      ) : null}
                      {emAberto ? (
                        <LembrarWhatsApp
                          telefone={zaps[f.contaId] ?? null}
                          loja={f.conta ?? 'sua loja'}
                          numero={f.numero}
                          vencimento={f.vencimento}
                          valor={dinheiro(f.valor)}
                          link={f.linkPagamento}
                          atrasada={f.diasAteVencer < 0}
                        />
                      ) : null}
                      <AcoesFatura
                        faturaId={f.id}
                        paga={f.status === 'paga'}
                        cancelada={f.status === 'cancelada'}
                        hoje={hoje}
                      />
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </Secao>
    </>
  );
}

/* ================================================================== */
/* Contratos                                                          */
/* ================================================================== */

function Contratos({
  contratos,
  contas,
  podeMexer,
}: {
  contratos: Awaited<ReturnType<typeof listarContratos>>['dados'];
  contas: Awaited<ReturnType<typeof listarContas>>['dados'];
  podeMexer: boolean;
}) {
  /* Só quem tem vigência ABERTA entra travado. Contrato com fim marcado
     não impede o próximo: quem encerrou em outubro precisa poder abrir
     o de novembro antes de outubro acabar. */
  const comContratoAberto = new Set(contratos.filter((c) => !c.fim).map((c) => c.contaId));
  const lojasParaContrato = contas.map((c) => ({
    id: c.id,
    nome: c.nome,
    comContrato: comContratoAberto.has(c.id),
  }));

  return (
    <Secao
      titulo="Contratos"
      apoio="O contrato é o que diz quanto faturar todo mês. Uma fatura por contrato, por competência: clicar duas vezes não gera segunda cobrança, porque a emissão devolve a fatura que já existe."
    >
      <div className="space-y-4">
        {podeMexer ? <FormContrato lojas={lojasParaContrato} /> : null}

        {contratos.length === 0 ? (
          <p className="max-w-[70ch] text-sm leading-relaxed text-cinza">
            Nenhum contrato vigente. Sem contrato não há o que faturar: contrato nasce
            aqui, ou sozinho quando um lead vira cliente no CRM.
          </p>
        ) : null}

        {contratos.map((c) => (
          <article key={c.id} className="cartao space-y-4 p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
              <div>
                <h3 className="font-semibold text-branco">
                  {c.conta ?? '—'}
                  {c.futuro ? (
                    <span className="ml-2.5 rounded-full border border-fio px-2.5 py-1 align-middle font-mono text-[0.75rem] uppercase tracking-[0.12em] text-cinza">
                      agendado
                    </span>
                  ) : null}
                </h3>
                <p className="mt-1 font-mono text-[0.75rem] uppercase tracking-[0.12em] text-cinza">
                  {c.plano} · {c.futuro ? 'começa em' : 'desde'} {dataBR(c.inicio)}
                  {c.fim ? ` · até ${dataBR(c.fim)}` : ''}
                </p>
              </div>
              <p className="tabular text-lg font-semibold">
                {dinheiro(c.feeMensal)}
                <span className="ml-1.5 text-xs font-normal text-cinza">por mês</span>
              </p>
            </div>

            <div className="space-y-3">
              {/* Contrato agendado não fatura: a competência dele ainda
                  não chegou, e emitir agora criaria a fatura do mês em
                  que o contrato nem valia. */}
              {c.futuro ? null : (
                <BotaoFaturar contratoId={c.id} jaFaturado={c.faturadoNoMes} />
              )}
              {podeMexer ? (
                <AcoesContrato
                  contratoId={c.id}
                  feeAtual={c.feeMensal}
                  encerrado={Boolean(c.fim)}
                  automatica={c.cobrancaAutomatica}
                  diaVencimento={c.diaVencimento}
                />
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </Secao>
  );
}

/* ================================================================== */
/* Despesas                                                           */
/* ================================================================== */

function Despesas({
  despesas,
  fin,
  contas,
  hoje,
  podeMexer,
}: {
  despesas: Awaited<ReturnType<typeof listarDespesas>>['dados'];
  fin: Awaited<ReturnType<typeof financeiroDoMes>>['dados'];
  contas: Awaited<ReturnType<typeof listarContas>>['dados'];
  hoje: string;
  podeMexer: boolean;
}) {
  const categorias = [...new Set(despesas.map((d) => d.categoria).filter(Boolean))] as string[];

  /* Por categoria, do maior para o menor: a pergunta desta tela é
     "onde o dinheiro está indo", e a lista cronológica não responde. */
  const porCategoria = new Map<string, number>();
  for (const d of despesas) {
    if (d.status === 'cancelado') continue;
    const k = d.categoria?.trim() || 'sem categoria';
    porCategoria.set(k, (porCategoria.get(k) ?? 0) + d.valor);
  }
  const ranking = [...porCategoria.entries()].sort((a, b) => b[1] - a[1]);
  const totalCategorias = ranking.reduce((s, [, v]) => s + v, 0) || 1;

  const emAberto = despesas.filter((d) => d.status !== 'pago' && d.status !== 'cancelado');

  return (
    <>
      {podeMexer ? (
        <div className="mb-8">
          <FormDespesa lojas={contas.map((c) => ({ id: c.id, nome: c.nome }))} categorias={categorias} />
        </div>
      ) : null}

      <Secao titulo="O que sai">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Kpi rotulo="Pago no mês" valor={dinheiro(fin.despesaMes)} invertido />
          <Kpi
            rotulo="Ainda a pagar"
            valor={dinheiro(fin.despesaPrevistaMes)}
            apoio={`${emAberto.length} ${emAberto.length === 1 ? 'lançamento em aberto' : 'lançamentos em aberto'}`}
            invertido
          />
          <Kpi
            rotulo="Resultado do mês"
            valor={dinheiro(fin.recebidoLiquidoMes - fin.despesaMes)}
            apoio="Recebido líquido menos despesa paga"
          />
        </div>
      </Secao>

      {ranking.length > 0 ? (
        <Secao titulo="Para onde vai" apoio="Somando tudo que está na lista abaixo, pago ou não.">
          <ul className="space-y-3.5">
            {ranking.map(([nome, valor]) => (
              <li key={nome}>
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-sm text-neve">{nome}</span>
                  <span className="tabular text-sm font-semibold text-branco">
                    {dinheiro(valor)}
                  </span>
                </div>
                <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-white/[0.05]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max((100 * valor) / totalCategorias, 1.5)}%`,
                      background: '#B87D1A',
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Secao>
      ) : null}

      <Secao
        titulo="Lançamentos"
        apoio="Despesa da agência. Receita não entra aqui: ela é cobrança, e vive na aba Cobranças."
      >
        {despesas.length === 0 ? (
          <p className="max-w-[70ch] text-sm leading-relaxed text-cinza">
            Nenhuma despesa lançada. Sem elas o painel mostra faturamento, mas não mostra
            resultado.
          </p>
        ) : (
          <Tabela>
            <caption className="sr-only">Despesas da agência</caption>
            <thead>
              <tr>
                <th scope="col" className={th}>Despesa</th>
                <th scope="col" className={th}>Valor</th>
                <th scope="col" className={th}>Vencimento</th>
                <th scope="col" className={th}>Situação</th>
                {podeMexer ? <th scope="col" className={th}>Ações</th> : null}
              </tr>
            </thead>
            <tbody>
              {despesas.map((d) => {
                const atrasada = d.status !== 'pago' && d.status !== 'cancelado' && d.diasAteVencer < 0;
                return (
                  <tr key={d.id}>
                    <th scope="row" className={`${td} font-normal`}>
                      <span className="font-semibold text-branco">{d.descricao}</span>
                      <span className="mt-1 block text-xs text-cinza">
                        {d.categoria ?? 'sem categoria'}
                        {d.conta ? ` · ${d.conta}` : ''}
                      </span>
                    </th>
                    <td className={`${td} tabular`}>{dinheiro(d.valor)}</td>
                    <td className={`${td} tabular whitespace-nowrap`}>{dataBR(d.vencimento)}</td>
                    <td className={td}>
                      <span
                        className="text-sm font-semibold"
                        style={{
                          color:
                            d.status === 'pago'
                              ? CORES_SITUACAO.saudavel
                              : atrasada
                                ? CORES_SITUACAO.critico
                                : CORES_SITUACAO.sem_dado,
                        }}
                      >
                        <span aria-hidden className="mr-1.5">
                          {d.status === 'pago' ? '●' : atrasada ? '■' : '○'}
                        </span>
                        {d.status === 'pago'
                          ? `paga${d.pagoEm ? ` em ${dataBR(d.pagoEm)}` : ''}`
                          : atrasada
                            ? `venceu há ${Math.abs(d.diasAteVencer)} d`
                            : 'a pagar'}
                      </span>
                    </td>
                    {podeMexer ? (
                      <td className={td}>
                        <AcoesDespesa
                          id={d.id}
                          paga={d.status === 'pago'}
                          hoje={hoje}
                          podeExcluir
                        />
                      </td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </Tabela>
        )}
      </Secao>
    </>
  );
}
