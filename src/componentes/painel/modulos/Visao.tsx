import Link from 'next/link';
import { listarContas, financeiroDoMes, listarTarefas } from '@/lib/dados/consultas';
import { Kpi, SeloSituacao, Progresso, AvisoProcedencia, Secao } from '../base';
import { dinheiro, dinheiroCurto, vezes, variacao, diasAte } from '@/lib/formato';
import type { Papel } from '@/lib/papeis';

/**
 * Visão geral da agência.
 *
 * A ordem das seções é a ordem em que um gestor de agência olha o
 * negócio de manhã, e não a ordem em que os dados existem no banco:
 *
 *   1. quem está pegando fogo hoje
 *   2. quanto a carteira inteira está movimentando
 *   3. o que precisa ser feito
 *
 * Contas em risco vêm ANTES do total de receita de propósito. Um número
 * agregado saudável esconde a conta que está afundando, e é justamente
 * ela que cancela o contrato no mês seguinte.
 */
export async function Visao({ papel }: { papel: Papel }) {
  const [{ dados: contas, procedencia }, { dados: fin }, { dados: tarefas }] =
    await Promise.all([listarContas(), financeiroDoMes(), listarTarefas()]);

  const emRisco = contas.filter((c) => c.situacao === 'critico' || c.situacao === 'sem_dado');
  const atencao = contas.filter((c) => c.situacao === 'atencao');

  const receita = contas.reduce((s, c) => s + c.receita, 0);
  const investimento = contas.reduce((s, c) => s + c.investimento, 0);
  const merCarteira = investimento > 0 ? Number((receita / investimento).toFixed(2)) : null;

  const atrasadas = tarefas.filter(
    (t) => t.status !== 'concluida' && t.status !== 'cancelada' && (diasAte(t.prazo) ?? 1) < 0,
  );

  const podeVerFinanceiro = papel === 'admin';

  /*
    Primeiro acesso: banco ligado, carteira vazia.

    Um painel de zeros não diz o que fazer. Este bloco só aparece
    enquanto não há nenhuma conta, e some sozinho quando a primeira
    entrar. Sem ele, quem entra pela primeira vez vê quatro cartões
    zerados e conclui que algo quebrou.
  */
  if (procedencia === 'banco' && contas.length === 0) {
    return (
      <>
        <Secao
          titulo="A carteira está vazia"
          apoio="O banco está ligado e respondendo. Falta cadastrar a primeira loja."
        >
          <ol className="grid gap-4 md:grid-cols-3">
            {[
              {
                n: '01',
                t: 'Cadastrar a primeira conta',
                d: 'Uma conta é uma loja cliente. É a unidade que o RLS usa para isolar um cliente do outro.',
                c: 'npm run criar-conta -- "Nome da Loja"',
              },
              {
                n: '02',
                t: 'Dar acesso ao lojista',
                d: 'O mesmo comando cria o usuário cliente, amarrado à conta. Ele passa a enxergar só os números dela.',
                c: 'npm run criar-conta -- "Nome" email@loja.com',
              },
              {
                n: '03',
                t: 'Ligar as métricas',
                d: 'Google Ads, Meta e a plataforma da loja. É a etapa mais longa: as aprovações do Google e da Meta levam dias.',
                c: null,
              },
            ].map((p) => (
              <li key={p.n} className="cartao p-6">
                <span className="font-mono text-xs text-magenta-texto">{p.n}</span>
                <h3 className="mt-4 font-display text-lg font-bold tracking-[-0.02em]">{p.t}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-cinza">{p.d}</p>
                {p.c ? (
                  <code className="mt-4 block overflow-x-auto rounded-lg bg-black/30 px-3 py-2.5 font-mono text-[0.68rem] text-neve">
                    {p.c}
                  </code>
                ) : null}
              </li>
            ))}
          </ol>

          <p className="mt-6 max-w-[68ch] text-sm leading-relaxed text-cinza">
            As telas do painel hoje LEEM o banco. Cadastro por formulário ainda não
            existe, e por isso os dois primeiros passos são por comando. É o próximo
            pedaço a construir.
          </p>
        </Secao>
      </>
    );
  }

  return (
    <>
      <AvisoProcedencia procedencia={procedencia} />

      {/* 1. O que exige ação hoje */}
      {emRisco.length > 0 || atencao.length > 0 || atrasadas.length > 0 ? (
        <Secao
          titulo="Precisa de você hoje"
          apoio="Ordenado por gravidade. Conta sem dado vem primeiro: antes de discutir performance, é preciso saber se o número chegou."
        >
          <ul className="grid gap-4 md:grid-cols-2">
            {[...emRisco, ...atencao].map((c) => (
              <li key={c.id} className="cartao flex flex-wrap items-center gap-4 p-5">
                <SeloSituacao situacao={c.situacao} />
                <div className="min-w-0 grow">
                  <p className="font-semibold">{c.nome}</p>
                  <p className="mt-1 text-xs leading-relaxed text-cinza">
                    {c.situacao === 'sem_dado'
                      ? 'A sincronização parou. Conferir a integração antes de olhar qualquer número.'
                      : c.variacaoReceita !== null && c.variacaoReceita < 0
                        ? `Receita ${variacao(c.variacaoReceita)} nos últimos 7 dias.`
                        : `Meta em ${c.metaAtingida?.toFixed(0) ?? '—'}% do mês.`}
                  </p>
                </div>
                <Link
                  href={`/painel/metricas?conta=${c.id}`}
                  className="shrink-0 text-sm font-semibold text-magenta-texto"
                >
                  Abrir →
                </Link>
              </li>
            ))}

            {atrasadas.length > 0 ? (
              <li className="cartao flex flex-wrap items-center gap-4 p-5">
                <SeloSituacao situacao="atencao" />
                <div className="min-w-0 grow">
                  <p className="font-semibold">
                    {atrasadas.length} {atrasadas.length === 1 ? 'tarefa atrasada' : 'tarefas atrasadas'}
                  </p>
                  <p className="mt-1 text-xs text-cinza">{atrasadas[0].titulo}</p>
                </div>
                <Link href="/painel/tarefas" className="shrink-0 text-sm font-semibold text-magenta-texto">
                  Ver →
                </Link>
              </li>
            ) : null}
          </ul>
        </Secao>
      ) : (
        <Secao titulo="Precisa de você hoje">
          <p className="cartao p-6 text-sm text-cinza">
            Nenhuma conta em risco e nenhuma tarefa atrasada.
          </p>
        </Secao>
      )}

      {/* 2. A carteira */}
      <Secao
        titulo="A carteira no mês"
        apoio="Receita e verba somadas de todas as contas ativas."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi rotulo="Receita dos clientes" valor={dinheiroCurto(receita)} apoio="Soma da receita aprovada de todas as contas" />
          <Kpi rotulo="Verba sob gestão" valor={dinheiroCurto(investimento)} apoio="Dinheiro do cliente investido em mídia, não é receita da agência" />
          <Kpi rotulo="MER da carteira" valor={vezes(merCarteira)} apoio="Receita total sobre investimento total" />
          <Kpi rotulo="Contas ativas" valor={String(contas.length)} apoio={`${emRisco.length} em risco · ${atencao.length} em atenção`} />
        </div>
      </Secao>

      {/* 3. O financeiro da agência, só para admin */}
      {podeVerFinanceiro ? (
        <Secao
          titulo="A agência"
          apoio="Receita da Psy Comunic. Não confundir com a verba de mídia acima, que pertence ao cliente."
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi rotulo="Receita recorrente" valor={dinheiro(fin.receitaRecorrente)} apoio={`${fin.contratosAtivos} contratos ativos`} />
            <Kpi rotulo="Recebido no mês" valor={dinheiro(fin.recebidoMes)} />
            <Kpi rotulo="A receber" valor={dinheiro(fin.aReceberMes)} />
            <Kpi rotulo="Inadimplência" valor={dinheiro(fin.inadimplencia)} apoio="Vencido e não pago" invertido />
          </div>
        </Secao>
      ) : null}

      {/* 4. A carteira inteira, em tabela */}
      <Secao titulo="Todas as contas" acao={<Link href="/painel/contas" className="text-sm font-semibold text-magenta-texto">Ver detalhe →</Link>}>
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {contas.map((c) => (
            <li key={c.id} className="cartao p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-display text-lg font-bold tracking-[-0.02em]">{c.nome}</p>
                  <p className="mt-1 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-cinza">
                    {c.plataforma ?? 'Plataforma a definir'}
                  </p>
                </div>
                <SeloSituacao situacao={c.situacao} />
              </div>

              <dl className="mt-6 grid grid-cols-2 gap-4">
                <div>
                  <dt className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-cinza">Receita</dt>
                  <dd className="tabular mt-1 font-semibold">{dinheiroCurto(c.receita)}</dd>
                </div>
                <div>
                  <dt className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-cinza">MER</dt>
                  <dd className="tabular mt-1 font-semibold">{vezes(c.mer)}</dd>
                </div>
              </dl>

              <div className="mt-5 border-t border-fio pt-5">
                <Progresso percentual={c.metaAtingida} />
                {c.receitaDiaNecessaria ? (
                  <p className="mt-3 text-xs leading-relaxed text-cinza">
                    Precisa de <strong className="text-neve">{dinheiro(c.receitaDiaNecessaria)}</strong> por
                    dia no que resta do mês.
                  </p>
                ) : null}
              </div>

              <Link
                href={`/painel/metricas?conta=${c.id}`}
                className="mt-5 inline-flex text-sm font-semibold text-magenta-texto"
              >
                Ver métricas →
              </Link>
            </li>
          ))}
        </ul>
      </Secao>
    </>
  );
}
