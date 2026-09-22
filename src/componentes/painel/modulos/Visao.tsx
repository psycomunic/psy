import Link from 'next/link';
import { listarContas, financeiroDoMes, listarTarefas, listarPropostas } from '@/lib/dados/consultas';
import { resumoDaOperacao, atividadeRecente } from '@/lib/dados/operacao';
import { SeloSituacao, AvisoProcedencia } from '../base';
import { Anel, Numero, Bloco, Pendencia, Atalho, LinhaDoTempo } from '../Painel';
import { CORES_SITUACAO } from '../paleta';
import { dinheiro, dinheiroCurto, vezes, diasAte } from '@/lib/formato';
import { hojeBR } from '@/lib/datas';
import type { Papel } from '@/lib/papeis';

/**
 * O painel inicial da agência.
 *
 * ============================================================
 * A ORDEM É A DE QUEM ABRE ISTO DE MANHÃ
 * ============================================================
 * Não é a ordem em que os dados existem no banco:
 *
 *   1. o que exige uma decisão hoje
 *   2. o tamanho da operação, em números
 *   3. o que aconteceu desde ontem
 *   4. por onde começar uma tarefa nova
 *
 * Conta em risco vem ANTES do total de receita, de propósito. Um
 * agregado saudável esconde a loja que está afundando, e é justamente
 * ela que cancela o contrato no mês seguinte.
 *
 * ============================================================
 * O PAINEL VAZIO TAMBÉM PRECISA SER ÚTIL
 * ============================================================
 * Sem loja cadastrada, quatro cartões zerados não dizem o que fazer, e
 * quem entra pela primeira vez conclui que quebrou. Então enquanto a
 * configuração não estiver completa, ela ocupa o topo com o progresso
 * real: cinco passos, quantos estão prontos, e o link de cada um.
 *
 * Isso não é enfeite de estado vazio: é informação verdadeira sobre a
 * conta desta pessoa, e some sozinha quando o último passo fecha.
 */

const saudacao = () => {
  /* Hora de Brasília, e não do servidor: a Vercel roda em UTC e diria
     "boa noite" às seis da tarde. */
  const h = Number(
    new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', hour12: false }),
  );
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
};

export async function Visao({ papel, nome }: { papel: Papel; nome?: string | null }) {
  const [
    { dados: contas, procedencia },
    { dados: fin },
    { dados: tarefas },
    { dados: propostas },
    resumo,
    eventos,
  ] = await Promise.all([
    listarContas(),
    financeiroDoMes(),
    listarTarefas(),
    listarPropostas(),
    resumoDaOperacao(),
    atividadeRecente(10),
  ]);

  const podeVerFinanceiro = papel === 'administrador' || papel === 'financeiro';

  const emRisco = contas.filter((c) => c.situacao === 'critico' || c.situacao === 'sem_dado');
  const atencao = contas.filter((c) => c.situacao === 'atencao');

  const receita = contas.reduce((s, c) => s + c.receita, 0);
  const investimento = contas.reduce((s, c) => s + c.investimento, 0);
  const merCarteira = investimento > 0 ? Number((receita / investimento).toFixed(2)) : null;

  const atrasadas = tarefas.filter(
    (t) => t.status !== 'concluida' && t.status !== 'cancelada' && (diasAte(t.prazo) ?? 1) < 0,
  );

  const vencendo = propostas.filter(
    (p) => p.status === 'enviada' && p.diasParaVencer >= 0 && p.diasParaVencer <= 3,
  );

  const configuracaoPronta = resumo.prontos === resumo.total && resumo.total > 0;
  const hoje = new Date(`${hojeBR()}T12:00:00Z`);

  return (
    <>
      <AvisoProcedencia procedencia={procedencia} />

      {/* ---------------------------------------------------------- */}
      {/* Cabeçalho                                                    */}
      {/* ---------------------------------------------------------- */}
      <header className="mt-6 flex flex-wrap items-end justify-between gap-x-8 gap-y-4 border-b border-fio pb-7">
        <div>
          <p className="font-mono text-[0.75rem] uppercase tracking-[0.18em] text-magenta-texto">
            {hoje.toLocaleDateString('pt-BR', {
              timeZone: 'America/Sao_Paulo',
              weekday: 'long',
              day: '2-digit',
              month: 'long',
            })}
          </p>
          <h1 className="mt-3 font-display text-[clamp(1.75rem,4vw,2.5rem)] font-extrabold leading-[1.05] tracking-[-0.04em]">
            {saudacao()}
            {nome ? `, ${nome.split(' ')[0]}` : ''}.
          </h1>
        </div>

        <p className="max-w-[38ch] text-sm leading-relaxed text-cinza">
          {resumo.lojas === 0
            ? 'A operação ainda não tem loja cadastrada. Os passos abaixo abrem o painel de verdade.'
            : `${resumo.lojasAtivas} ${resumo.lojasAtivas === 1 ? 'loja ativa' : 'lojas ativas'}, ${resumo.leadsAbertos} ${resumo.leadsAbertos === 1 ? 'lead aberto' : 'leads abertos'} e ${resumo.tarefasAbertas} ${resumo.tarefasAbertas === 1 ? 'tarefa aberta' : 'tarefas abertas'}.`}
        </p>
      </header>

      {/* ---------------------------------------------------------- */}
      {/* Configuração, enquanto não estiver completa                  */}
      {/* ---------------------------------------------------------- */}
      {!configuracaoPronta && procedencia === 'banco' ? (
        <Bloco
          titulo="Configuração da operação"
          apoio="Cada passo destrava o seguinte. O terceiro depende de aprovação do Google e da Meta, que leva dias e não depende do código."
        >
          <div className="cartao overflow-hidden">
            <span aria-hidden className="aresta absolute inset-x-8 top-0 h-px" />

            <div className="flex flex-wrap items-center gap-6 border-b border-fio p-6">
              <Anel feito={resumo.prontos} total={resumo.total} />
              <div className="min-w-0 grow">
                <p className="font-display text-lg font-bold tracking-[-0.02em]">
                  {resumo.prontos === 0
                    ? 'Nada configurado ainda'
                    : `${resumo.prontos} de ${resumo.total} prontos`}
                </p>
                <p className="mt-1.5 max-w-[56ch] text-sm leading-relaxed text-cinza">
                  {resumo.prontos === 0
                    ? 'Comece pela loja. Sem ela não há onde pendurar métrica, contrato nem tarefa.'
                    : 'O painel já funciona com o que está pronto. Cada passo que fecha liga mais uma tela.'}
                </p>
              </div>
            </div>

            <ol className="divide-y divide-[var(--fio)]">
              {resumo.passos.map((p, i) => (
                <li key={p.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 p-5 sm:px-6">
                  <span
                    aria-hidden
                    className="flex h-7 w-7 flex-none items-center justify-center rounded-full text-xs font-semibold"
                    style={
                      p.pronto
                        ? { color: CORES_SITUACAO.saudavel, background: `${CORES_SITUACAO.saudavel}1f` }
                        : { color: 'var(--cinza)', border: '1px solid var(--fio)' }
                    }
                  >
                    {p.pronto ? '✓' : String(i + 1).padStart(2, '0')}
                  </span>

                  <div className="min-w-0 grow">
                    <p
                      className={
                        'text-sm font-semibold ' + (p.pronto ? 'text-cinza line-through' : 'text-branco')
                      }
                    >
                      {p.titulo}
                    </p>
                    {!p.pronto ? (
                      <p className="mt-1 max-w-[62ch] text-xs leading-relaxed text-cinza">
                        {p.descricao}
                        {p.espera ? <span className="text-cinza/80"> {p.espera}</span> : null}
                      </p>
                    ) : null}
                  </div>

                  {!p.pronto && p.href ? (
                    <Link
                      href={p.href}
                      className="flex-none rounded-full bg-magenta px-4 py-2 text-xs font-semibold text-branco transition-colors hover:bg-magenta-forte"
                    >
                      Abrir
                    </Link>
                  ) : null}
                </li>
              ))}
            </ol>
          </div>
        </Bloco>
      ) : null}

      {/* ---------------------------------------------------------- */}
      {/* O que exige decisão hoje                                     */}
      {/* ---------------------------------------------------------- */}
      {emRisco.length + atencao.length + atrasadas.length + vencendo.length + resumo.integracoesComErro > 0 ? (
        <Bloco
          titulo="Precisa de você hoje"
          apoio="Ordenado por gravidade. Loja sem dado vem primeiro: antes de discutir performance, é preciso saber se o número chegou."
        >
          <ul className="grid gap-3 lg:grid-cols-2">
            {emRisco.map((c) => (
              <Pendencia
                key={c.id}
                severidade="critico"
                titulo={c.nome}
                detalhe={
                  c.situacao === 'sem_dado'
                    ? 'A sincronização parou. Conferir a integração antes de olhar qualquer número.'
                    : `MER em ${vezes(c.mer)}. A mídia está custando mais do que traz.`
                }
                href={`/painel/contas?ficha=${c.id}`}
                acao="Ver ficha"
              />
            ))}

            {resumo.integracoesComErro > 0 ? (
              <Pendencia
                severidade="critico"
                titulo={`${resumo.integracoesComErro} ${resumo.integracoesComErro === 1 ? 'integração com problema' : 'integrações com problema'}`}
                detalhe="Token vencido ou credencial ausente. Enquanto isso, o número da loja para no tempo."
                href="/painel/configuracoes"
                acao="Conferir"
              />
            ) : null}

            {atrasadas.length > 0 ? (
              <Pendencia
                severidade="atencao"
                titulo={`${atrasadas.length} ${atrasadas.length === 1 ? 'tarefa atrasada' : 'tarefas atrasadas'}`}
                detalhe={atrasadas
                  .slice(0, 2)
                  .map((t) => t.titulo)
                  .join(' · ')}
                href="/painel/tarefas"
                acao="Ver tarefas"
              />
            ) : null}

            {vencendo.map((p) => (
              <Pendencia
                key={p.id}
                severidade="atencao"
                titulo={`Proposta da ${p.cliente} vence em ${p.diasParaVencer} ${p.diasParaVencer === 1 ? 'dia' : 'dias'}`}
                detalhe="Prazo é o que faz proposta ser respondida em vez de esquecida."
                href="/painel/propostas"
                acao="Abrir"
              />
            ))}

            {atencao.map((c) => (
              <Pendencia
                key={c.id}
                severidade="atencao"
                titulo={c.nome}
                detalhe={
                  c.metaAtingida !== null && c.metaAtingida < 70
                    ? `${c.metaAtingida.toFixed(0)}% da meta do mês.`
                    : 'Queda na receita dos últimos 7 dias.'
                }
                href={`/painel/contas?ficha=${c.id}`}
                acao="Ver ficha"
              />
            ))}
          </ul>
        </Bloco>
      ) : null}

      {/* ---------------------------------------------------------- */}
      {/* Os números da operação                                       */}
      {/* ---------------------------------------------------------- */}
      <Bloco
        titulo="A operação em números"
        apoio={
          podeVerFinanceiro
            ? 'O fee é receita da Psy Comunic. A verba de mídia passa pela agência mas pertence ao cliente, e por isso nunca se somam.'
            : 'Os números da carteira que o seu perfil enxerga.'
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Numero
            rotulo="Lojas ativas"
            valor={resumo.lojasAtivas}
            apoio={
              resumo.lojas > resumo.lojasAtivas
                ? `${resumo.lojas - resumo.lojasAtivas} em outra situação`
                : 'Toda a carteira ativa'
            }
            href="/painel/contas"
          />
          <Numero
            rotulo="Receita do mês"
            valor={dinheiroCurto(receita)}
            apoio={receita === 0 ? 'Nenhuma métrica recebida ainda' : 'Somada da carteira inteira'}
            cor={CORES_SITUACAO.saudavel}
            href="/painel/metricas"
          />
          <Numero
            rotulo="Verba sob gestão"
            valor={dinheiroCurto(investimento)}
            apoio="Do cliente, e nunca somada ao fee"
            cor="#2E8BE0"
            href="/painel/metricas"
          />
          <Numero
            rotulo="MER da carteira"
            valor={vezes(merCarteira)}
            apoio={merCarteira === null ? 'Precisa de receita e verba no mesmo período' : 'Receita da loja ÷ verba total'}
            cor="#B87D1A"
            href="/painel/metricas"
          />
        </div>

        {podeVerFinanceiro ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Numero
              rotulo="Fee recorrente"
              valor={dinheiro(fin.receitaRecorrente)}
              apoio={`${fin.contratosAtivos} ${fin.contratosAtivos === 1 ? 'contrato ativo' : 'contratos ativos'}`}
              href="/painel/financeiro"
            />
            <Numero
              rotulo="A receber no mês"
              valor={dinheiro(fin.aReceberMes)}
              apoio="Faturas em aberto dentro da competência"
              href="/painel/financeiro"
            />
            <Numero
              rotulo="Inadimplência"
              valor={dinheiro(fin.inadimplencia)}
              apoio={fin.inadimplencia > 0 ? 'Vencido e não pago' : 'Nada vencido'}
              alerta={fin.inadimplencia > 0}
              href="/painel/financeiro"
            />
            <Numero
              rotulo="Funil aberto"
              valor={resumo.leadsAbertos}
              apoio={`${resumo.propostasPublicadas} ${resumo.propostasPublicadas === 1 ? 'proposta publicada' : 'propostas publicadas'}`}
              cor="#9B6DFF"
              href="/painel/crm"
            />
          </div>
        ) : null}
      </Bloco>

      {/* ---------------------------------------------------------- */}
      {/* Carteira                                                     */}
      {/* ---------------------------------------------------------- */}
      {contas.length > 0 ? (
        <Bloco
          titulo="Carteira"
          apoio="Ordenada por receita do mês."
          acao={
            <Link
              href="/painel/contas"
              className="rounded-full border border-fio px-4 py-2 text-xs font-semibold text-neve transition-colors hover:bg-white/5"
            >
              Ver todas
            </Link>
          }
        >
          <ul className="grid gap-3 lg:grid-cols-2">
            {[...contas]
              .sort((a, b) => b.receita - a.receita)
              .slice(0, 6)
              .map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/painel/contas?ficha=${c.id}`}
                    className="cartao flex flex-wrap items-center gap-x-5 gap-y-3 p-5 transition-transform duration-300 hover:-translate-y-0.5"
                  >
                    <div className="min-w-0 grow">
                      <p className="font-semibold text-branco">{c.nome}</p>
                      <p className="mt-1 font-mono text-[0.75rem] uppercase tracking-[0.12em] text-cinza">
                        {c.plataforma ?? 'sem plataforma'}
                      </p>
                    </div>
                    <div className="tabular text-right">
                      <p className="font-display text-lg font-extrabold tracking-[-0.03em]">
                        {dinheiroCurto(c.receita)}
                      </p>
                      <p className="mt-0.5 text-xs text-cinza">MER {vezes(c.mer)}</p>
                    </div>
                    <SeloSituacao situacao={c.situacao} />
                  </Link>
                </li>
              ))}
          </ul>
        </Bloco>
      ) : null}

      {/* ---------------------------------------------------------- */}
      {/* O que aconteceu                                              */}
      {/* ---------------------------------------------------------- */}
      {eventos.length > 0 ? (
        <Bloco
          titulo="O que aconteceu"
          apoio="Proposta, sincronização, conversa e marco, das últimas semanas, na mesma linha."
        >
          <div className="cartao p-5 sm:p-6">
            <LinhaDoTempo eventos={eventos} />
          </div>
        </Bloco>
      ) : null}

      {/* ---------------------------------------------------------- */}
      {/* Atalhos                                                      */}
      {/* ---------------------------------------------------------- */}
      <Bloco titulo="Começar agora" apoio="As quatro coisas que mais se faz por aqui.">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Atalho
            simbolo="+"
            titulo="Cadastrar loja"
            descricao="Nova conta cliente na carteira"
            href="/painel/contas"
          />
          <Atalho
            simbolo="§"
            titulo="Gerar proposta"
            descricao="Link único, com a conta feita"
            href="/painel/propostas"
          />
          <Atalho
            simbolo="↻"
            titulo="Sincronizar"
            descricao="Puxar Meta, Google e GA4"
            href="/painel/configuracoes"
          />
          <Atalho
            simbolo="◆"
            titulo="Registrar no diário"
            descricao="O que foi feito, na ficha da loja"
            href="/painel/contas"
          />
        </div>
      </Bloco>
    </>
  );
}
