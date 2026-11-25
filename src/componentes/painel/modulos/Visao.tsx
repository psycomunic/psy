import Link from 'next/link';
import { listarContas, financeiroDoMes, listarTarefas, listarPropostas } from '@/lib/dados/consultas';
import { resumoDaOperacao, atividadeRecente } from '@/lib/dados/operacao';
import { consultarSaldosMidia } from '@/lib/ingestao/saldos';
import { SeloSituacao, AvisoProcedencia, Progresso } from '../base';
import { Anel, Numero, Bloco, Pendencia, Atalho, LinhaDoTempo } from '../Painel';
import { CORES_SITUACAO } from '../paleta';
import { dinheiroExato, dinheiroCurto, numero, vezes, diasAte } from '@/lib/formato';
import type { ContaResumo } from '@/lib/dados/tipos';
import type { Papel } from '@/lib/papeis';

const saudacao = () => {
  const h = Number(
    new Date().toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit',
      hour12: false,
    }),
  );
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
};

function resumoResultadoCliente(c: ContaResumo): { principal: string; sub: string } {
  if (c.receita > 0) {
    return {
      principal: dinheiroCurto(c.receita),
      sub: c.mer !== null ? `MER ${vezes(c.mer)}` : `Mídia ${dinheiroCurto(c.investimento)}`,
    };
  }
  if (c.conversas > 0) {
    const custo = c.investimento > 0 ? c.investimento / c.conversas : null;
    return {
      principal: `${numero(c.conversas)} conversas`,
      sub: custo !== null ? `${dinheiroExato(custo)} / conv.` : `Mídia ${dinheiroCurto(c.investimento)}`,
    };
  }
  if (c.leadsCaptados > 0) {
    const cpl = c.investimento > 0 ? c.investimento / c.leadsCaptados : null;
    return {
      principal: `${numero(c.leadsCaptados)} leads`,
      sub: cpl !== null ? `CPL ${dinheiroExato(cpl)}` : `Mídia ${dinheiroCurto(c.investimento)}`,
    };
  }
  if (c.investimento > 0) {
    return {
      principal: dinheiroCurto(c.investimento),
      sub: c.cliquesLink > 0 ? `${numero(c.cliquesLink)} cliques` : 'Verba aplicada no mês',
    };
  }
  return {
    principal: 'Sem mídia no mês',
    sub: c.ultimoDia ? `Último dado ${c.ultimoDia}` : 'Aguardando sincronização',
  };
}

export async function Visao({ papel, nome }: { papel: Papel; nome?: string | null }) {
  const [
    { dados: contas, procedencia },
    { dados: fin },
    { dados: tarefas },
    { dados: propostas },
    resumo,
    eventos,
    saldosMidia,
  ] = await Promise.all([
    listarContas(),
    financeiroDoMes(),
    listarTarefas(),
    listarPropostas(),
    resumoDaOperacao(),
    atividadeRecente(10),
    papel !== 'financeiro' ? consultarSaldosMidia({ notificarNoPainel: true }) : Promise.resolve([]),
  ]);

  const saldosUrgentes = saldosMidia.filter(
    (s) => s.nivel === 'zerado' || s.nivel === 'critico',
  );

  const podeVerFinanceiro = papel === 'administrador' || papel === 'financeiro';

  const emRisco = contas.filter((c) => c.situacao === 'critico' || c.situacao === 'sem_dado');
  const atencao = contas.filter((c) => c.situacao === 'atencao');

  const receita = contas.reduce((s, c) => s + c.receita, 0);
  const investimento = contas.reduce((s, c) => s + c.investimento, 0);
  const conversasCarteira = contas.reduce((s, c) => s + c.conversas + c.leadsCaptados, 0);
  const merCarteira = investimento > 0 && receita > 0 ? Number((receita / investimento).toFixed(2)) : null;

  const atrasadas = tarefas.filter(
    (t) => t.status !== 'concluida' && t.status !== 'cancelada' && (diasAte(t.prazo) ?? 1) < 0,
  );

  const vencendo = propostas.filter(
    (p) => p.status === 'enviada' && p.diasParaVencer >= 0 && p.diasParaVencer <= 3,
  );

  const totalAlertasHoje =
    saldosUrgentes.length +
    emRisco.length +
    atencao.length +
    atrasadas.length +
    vencendo.length +
    resumo.integracoesComErro;

  const configuracaoPronta = resumo.prontos === resumo.total && resumo.total > 0;
  const primeiroNome = nome ? nome.split(' ')[0] : null;

  /* Foco executivo para o cartão azul em destaque (estilo Bento Insight) */
  const destaqueExecutivo =
    saldosUrgentes.length > 0
      ? {
          selo: 'Prioridade imediata · Mídia',
          titulo: `${saldosUrgentes.length} ${saldosUrgentes.length === 1 ? 'conta precisa' : 'contas precisam'} de recarga hoje`,
          detalhe: `${saldosUrgentes.map((s) => s.contaNome).join(', ')} com saldo abaixo da faixa segura para não travar entrega.`,
          href: `/painel/metricas?conta=${saldosUrgentes[0].contaId}`,
          cta: 'Conferir saldo e avisar cliente',
        }
      : emRisco.length > 0
        ? {
            selo: 'Radar da Carteira',
            titulo: `${emRisco.length} ${emRisco.length === 1 ? 'operação pede' : 'operações pedem'} revisão técnica`,
            detalhe: `Abra a Ficha 360° de ${emRisco[0].nome} para checar sincronização, metas do mês e plano de ação.`,
            href: `/painel/contas?ficha=${emRisco[0].id}`,
            cta: `Abrir Ficha 360° · ${emRisco[0].nome}`,
          }
        : atrasadas.length > 0
          ? {
              selo: 'Ritmo de Entrega',
              titulo: `${atrasadas.length} ${atrasadas.length === 1 ? 'entrega venceu' : 'entregas venceram'} o prazo combinado`,
              detalhe: atrasadas
                .slice(0, 2)
                .map((t) => t.titulo)
                .join(' · '),
              href: '/painel/tarefas',
              cta: 'Organizar quadro de entregas',
            }
          : {
              selo: 'Operação Saudável',
              titulo: `${resumo.lojasAtivas} ${resumo.lojasAtivas === 1 ? 'cliente ativo' : 'clientes ativos'} sob acompanhamento contínuo`,
              detalhe:
                conversasCarteira > 0
                  ? `${numero(conversasCarteira)} conversas e leads captados no mês com todas as contas monitoradas.`
                  : 'Saldos, integrações e prazos da agência estão em dia neste momento.',
              href: '/painel/contas',
              cta: 'Revisar fichas dos clientes',
            };

  const contasOrdenadas = [...contas].sort((a, b) => {
    const peso = (s: ContaResumo['situacao']) =>
      s === 'critico' ? 3 : s === 'atencao' ? 2 : s === 'sem_dado' ? 1 : 0;
    if (peso(b.situacao) !== peso(a.situacao)) return peso(b.situacao) - peso(a.situacao);
    return b.investimento + b.receita - (a.investimento + a.receita);
  });

  return (
    <div className="space-y-8">
      <AvisoProcedencia procedencia={procedencia} />

      {/* ---------------------------------------------------------- */}
      {/* Cabeçalho Editorial Dual-Weight (Inspirado nas Referências) */}
      {/* ---------------------------------------------------------- */}
      <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div>
          <h1 className="font-display text-[clamp(1.75rem,3.4vw,2.45rem)] leading-[1.08] tracking-[-0.035em]">
            <span className="block font-medium text-cinza">Panorama da Agência</span>
            <span className="block font-extrabold text-branco">
              {saudacao()}
              {primeiroNome ? `, ${primeiroNome}` : ''}
            </span>
          </h1>
          <p className="mt-2 text-sm text-cinza">
            {resumo.lojas === 0
              ? 'Configure sua primeira conta cliente abaixo para ativar os indicadores em tempo real.'
              : `Acompanhando ${resumo.lojasAtivas} ${resumo.lojasAtivas === 1 ? 'operação ativa' : 'operações ativas'}, ${resumo.tarefasAbertas} ${resumo.tarefasAbertas === 1 ? 'entrega em andamento' : 'entregas em andamento'} e ${resumo.leadsAbertos} ${resumo.leadsAbertos === 1 ? 'oportunidade comercial' : 'oportunidades comerciais'}.`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/painel/configuracoes"
            className="inline-flex items-center gap-2 rounded-full border border-fio bg-[var(--p-card,#FFFFFF)] px-4 py-2.5 text-xs font-semibold text-neve shadow-xs transition-colors hover:border-fio-forte hover:text-branco"
          >
            <span aria-hidden>↻</span>
            Sincronizar mídia
          </Link>
          <Link
            href="/painel/contas"
            className="botao-3d-azul inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold"
          >
            <span aria-hidden>+</span>
            Carteira & Fichas 360°
          </Link>
        </div>
      </header>

      {/* ---------------------------------------------------------- */}
      {/* Faixa 1 — 4 Cartões Bento de KPIs Principais                */}
      {/* ---------------------------------------------------------- */}
      <section aria-label="Indicadores principais da agência">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Numero
            rotulo="Clientes ativos"
            valor={resumo.lojasAtivas}
            apoio={
              resumo.lojas > resumo.lojasAtivas
                ? `${resumo.lojas} cadastrados na carteira`
                : 'Toda a carteira em acompanhamento'
            }
            cor="var(--p-azul-vivo, #1D4ED8)"
            href="/painel/contas"
          />
          <Numero
            rotulo="Verba sob gestão"
            valor={dinheiroCurto(investimento)}
            apoio={
              investimento > 0
                ? 'Mídia aplicada pelos clientes no mês'
                : 'Aguardando movimentação do mês'
            }
            cor="#2563EB"
            href="/painel/metricas"
          />
          <Numero
            rotulo={receita > 0 ? 'Receita gerada' : 'Conversas & Leads'}
            valor={receita > 0 ? dinheiroCurto(receita) : numero(conversasCarteira)}
            apoio={
              receita > 0
                ? merCarteira !== null
                  ? `MER médio ${vezes(merCarteira)} na carteira`
                  : 'Receita atribuída e aprovada no mês'
                : conversasCarteira > 0
                  ? 'Volume captado nas campanhas ativas'
                  : 'Sem conversões registradas no período'
            }
            cor={CORES_SITUACAO.saudavel}
            href="/painel/metricas"
          />
          {podeVerFinanceiro ? (
            <Numero
              rotulo="Fee recorrente"
              valor={dinheiroCurto(fin.receitaRecorrente)}
              apoio={
                fin.inadimplencia > 0
                  ? `Atenção: ${dinheiroCurto(fin.inadimplencia)} em atraso`
                  : `${fin.contratosAtivos} ${fin.contratosAtivos === 1 ? 'contrato ativo' : 'contratos ativos'} · em dia`
              }
              alerta={fin.inadimplencia > 0}
              cor="#0F2B75"
              href="/painel/financeiro"
            />
          ) : (
            <Numero
              rotulo="Entregas abertas"
              valor={resumo.tarefasAbertas}
              apoio={
                atrasadas.length > 0
                  ? `${atrasadas.length} com prazo vencido hoje`
                  : 'Todas dentro do prazo combinado'
              }
              alerta={atrasadas.length > 0}
              cor="#0F2B75"
              href="/painel/tarefas"
            />
          )}
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/* Passo a passo inicial (apenas se banco ainda em setup)      */}
      {/* ---------------------------------------------------------- */}
      {!configuracaoPronta && procedencia === 'banco' ? (
        <div className="cartao overflow-hidden">
          <div className="flex flex-wrap items-center gap-6 border-b border-fio p-6">
            <Anel feito={resumo.prontos} total={resumo.total} />
            <div className="min-w-0 grow">
              <h2 className="font-display text-lg font-bold tracking-[-0.02em] text-branco">
                Configuração da operação ({resumo.prontos} de {resumo.total})
              </h2>
              <p className="mt-1 max-w-[58ch] text-sm leading-relaxed text-cinza">
                {resumo.prontos === 0
                  ? 'Comece cadastrando o primeiro cliente para destravar métricas, contratos e tarefas.'
                  : 'O painel já opera normalmente com o que está ativo. Complete os passos restantes quando quiser.'}
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
                      ? { color: CORES_SITUACAO.saudavel, background: `${CORES_SITUACAO.saudavel}18` }
                      : { color: 'var(--cinza)', border: '1px solid var(--fio)' }
                  }
                >
                  {p.pronto ? '✓' : String(i + 1).padStart(2, '0')}
                </span>
                <div className="min-w-0 grow">
                  <p className={'text-sm font-semibold ' + (p.pronto ? 'text-cinza line-through' : 'text-branco')}>
                    {p.titulo}
                  </p>
                  {!p.pronto ? (
                    <p className="mt-0.5 max-w-[62ch] text-xs leading-relaxed text-cinza">
                      {p.descricao}
                      {p.espera ? <span className="opacity-85"> {p.espera}</span> : null}
                    </p>
                  ) : null}
                </div>
                {!p.pronto && p.href ? (
                  <Link
                    href={p.href}
                    className="botao-3d-azul flex-none rounded-full px-4 py-2 text-xs font-semibold"
                  >
                    Abrir
                  </Link>
                ) : null}
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      {/* ---------------------------------------------------------- */}
      {/* Faixa 2 — Bento Grid Assimétrico (2 col Carteira + 1 col Destaque Azul) */}
      {/* ---------------------------------------------------------- */}
      <section className="grid gap-5 xl:grid-cols-3">
        {/* Coluna Principal (2/3): Carteira + Saldos ao vivo */}
        <div className="space-y-5 xl:col-span-2">
          {/* Cartão Bento: Carteira em Acompanhamento */}
          <div className="cartao p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-fio pb-4">
              <div>
                <h2 className="font-display text-lg font-bold tracking-[-0.025em] text-branco">
                  Carteira em acompanhamento
                </h2>
                <p className="mt-0.5 text-xs text-cinza">
                  Clique em qualquer cliente para abrir a Ficha 360° com metas, entregas e diagnóstico.
                </p>
              </div>
              <Link
                href="/painel/contas"
                className="rounded-full border border-fio px-4 py-1.5 text-xs font-semibold text-neve transition-colors hover:border-fio-forte hover:text-branco"
              >
                Ver todas ({contas.length})
              </Link>
            </div>

            {contasOrdenadas.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm font-medium text-neve">Nenhum cliente cadastrado ainda.</p>
                <Link
                  href="/painel/contas"
                  className="botao-3d-azul mt-4 inline-flex rounded-full px-5 py-2.5 text-xs font-semibold"
                >
                  + Cadastrar primeiro cliente
                </Link>
              </div>
            ) : (
              <ul className="mt-4 divide-y divide-[var(--fio)]">
                {contasOrdenadas.slice(0, 6).map((c) => {
                  const res = resumoResultadoCliente(c);
                  return (
                    <li key={c.id}>
                      <Link
                        href={`/painel/contas?ficha=${c.id}`}
                        className="group -mx-3 flex flex-wrap items-center justify-between gap-4 rounded-xl px-3 py-3.5 transition-colors hover:bg-marinho-alto/70"
                      >
                        <div className="flex min-w-0 items-center gap-3.5">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-fio bg-marinho-alto font-display text-sm font-extrabold text-magenta-texto transition-colors group-hover:border-transparent group-hover:bg-[var(--p-azul-vivo,#1D4ED8)] group-hover:text-[#FFFFFF]">
                            {c.nome.slice(0, 2).toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-branco">{c.nome}</p>
                            <p className="mt-0.5 truncate text-xs text-cinza">
                              {c.segmento ?? c.plataforma ?? 'Gestão de performance'}
                              {c.responsavel ? ` · ${c.responsavel}` : ''}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-5">
                          {c.metaAtingida !== null ? (
                            <div className="hidden w-28 sm:block">
                              <Progresso percentual={c.metaAtingida} />
                            </div>
                          ) : null}

                          <div className="tabular min-w-[7.5rem] text-right">
                            <p className="font-display text-sm font-extrabold text-branco">
                              {res.principal}
                            </p>
                            <p className="mt-0.5 text-[0.72rem] text-cinza">{res.sub}</p>
                          </div>

                          <SeloSituacao situacao={c.situacao} />
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Cartão Bento: Saldos ao Vivo Meta Ads */}
          {saldosMidia.length > 0 ? (
            <div className="cartao p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-fio pb-4">
                <div>
                  <h2 className="font-display text-lg font-bold tracking-[-0.025em] text-branco">
                    Saldos ao vivo · Meta Ads
                  </h2>
                  <p className="mt-0.5 text-xs text-cinza">
                    Cruzado com o ritmo diário dos últimos 7 dias. Contas abaixo de R$ 150 disparam alerta automático.
                  </p>
                </div>
                <Link
                  href="/painel/metricas"
                  className="rounded-full border border-fio px-3.5 py-1.5 text-xs font-semibold text-neve transition-colors hover:border-fio-forte hover:text-branco"
                >
                  Abrir métricas
                </Link>
              </div>

              <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
                {saldosMidia.map((s) => {
                  const cor =
                    s.nivel === 'zerado' || s.nivel === 'critico'
                      ? CORES_SITUACAO.critico
                      : s.nivel === 'atencao'
                        ? CORES_SITUACAO.atencao
                        : s.nivel === 'saudavel'
                          ? CORES_SITUACAO.saudavel
                          : '#2563EB';
                  const rotuloNivel =
                    s.nivel === 'zerado'
                      ? 'Esgotado'
                      : s.nivel === 'critico'
                        ? 'Saldo baixo'
                        : s.nivel === 'atencao'
                          ? 'Recarregar logo'
                          : s.nivel === 'saudavel'
                            ? 'Em dia'
                            : 'Pós-pago';

                  return (
                    <Link
                      key={s.contaId}
                      href={`/painel/metricas?conta=${s.contaId}`}
                      className="group flex flex-col justify-between gap-3 rounded-2xl border border-fio bg-marinho-alto/45 p-4 transition-all hover:-translate-y-0.5 hover:border-fio-forte"
                    >
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="min-w-0">
                          <p className="truncate font-display text-sm font-bold text-branco">
                            {s.contaNome}
                          </p>
                          <p className="mt-0.5 truncate font-mono text-[0.66rem] uppercase tracking-[0.1em] text-cinza">
                            {s.adAccountNome}
                          </p>
                        </div>
                        <span
                          className="shrink-0 rounded-full px-2.5 py-0.5 text-[0.68rem] font-semibold"
                          style={{
                            color: cor,
                            background: `${cor}16`,
                            border: `1px solid ${cor}35`,
                          }}
                        >
                          ● {rotuloNivel}
                        </span>
                      </div>

                      <div>
                        <p className="tabular font-display text-xl font-extrabold tracking-[-0.03em] text-branco">
                          {s.modalidade === 'pre_pago' || s.saldoDisponivel !== null
                            ? dinheiroExato(s.saldoDisponivel ?? 0)
                            : s.faturaAberta !== null
                              ? `${dinheiroExato(s.faturaAberta)} aberto`
                              : 'Automático'}
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-cinza">{s.resumo}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>

        {/* Coluna Direita (1/3): Cartão Destaque Azul + Resumo Financeiro/Atalhos */}
        <div className="space-y-5">
          {/* Cartão Bento em Destaque com o Azul Oficial da Marca */}
          <div className="cartao-destaque-azul relative overflow-hidden p-6">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#FFFFFF]/20 bg-[#FFFFFF]/12 px-3 py-1 text-[0.7rem] font-semibold tracking-[0.02em] text-[#FFFFFF]">
                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[#93C5FD]" />
                {destaqueExecutivo.selo}
              </span>
              <span
                aria-hidden
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FFFFFF]/14 text-sm font-bold text-[#FFFFFF]"
              >
                ✦
              </span>
            </div>

            <h2 className="mt-5 font-display text-[1.35rem] font-extrabold leading-[1.2] tracking-[-0.025em] text-[#FFFFFF]">
              {destaqueExecutivo.titulo}
            </h2>

            <p className="mt-2.5 text-sm leading-relaxed text-[#DBEAFE]">
              {destaqueExecutivo.detalhe}
            </p>

            <div className="mt-6 flex items-center justify-between gap-3 border-t border-[#FFFFFF]/15 pt-4">
              <Link
                href={destaqueExecutivo.href}
                className="inline-flex items-center gap-2 rounded-full bg-[#FFFFFF] px-4 py-2 text-xs font-bold text-[#0B1730] shadow-sm transition-transform hover:-translate-y-0.5"
              >
                {destaqueExecutivo.cta}
                <span aria-hidden>→</span>
              </Link>
            </div>
          </div>

          {/* Mini-Resumo Financeiro & Comercial (se autorizado) */}
          {podeVerFinanceiro ? (
            <div className="cartao p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-sm font-bold text-branco">Pulso financeiro e comercial</h3>
                <Link
                  href="/painel/financeiro"
                  className="text-xs font-semibold text-magenta-texto hover:underline"
                >
                  Detalhes →
                </Link>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-fio bg-marinho-alto/50 p-3.5">
                  <dt className="text-[0.7rem] font-medium text-cinza">A receber no mês</dt>
                  <dd className="tabular mt-1 font-display text-base font-extrabold text-branco">
                    {dinheiroCurto(fin.aReceberMes)}
                  </dd>
                </div>
                <div className="rounded-xl border border-fio bg-marinho-alto/50 p-3.5">
                  <dt className="text-[0.7rem] font-medium text-cinza">Funil comercial</dt>
                  <dd className="tabular mt-1 font-display text-base font-extrabold text-branco">
                    {resumo.leadsAbertos} {resumo.leadsAbertos === 1 ? 'lead' : 'leads'}
                  </dd>
                </div>
              </dl>
            </div>
          ) : null}

          {/* Atalhos Rápidos */}
          <div className="grid gap-3">
            <Atalho
              simbolo="+"
              titulo="Cadastrar cliente"
              descricao="Nova conta na carteira com Ficha 360°"
              href="/painel/contas"
            />
            <Atalho
              simbolo="§"
              titulo="Gerar proposta comercial"
              descricao="Link exclusivo pronto para enviar"
              href="/painel/propostas"
            />
            <Atalho
              simbolo="▤"
              titulo="Emitir relatório executivo"
              descricao="Página pública e PDF A4 do cliente"
              href="/painel/relatorios"
            />
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/* Faixa 3 — Fila de Ação Hoje + Linha do Tempo                */}
      {/* ---------------------------------------------------------- */}
      <section className="grid gap-5 lg:grid-cols-2">
        <Bloco
          titulo="Precisa de você hoje"
          apoio="Alertas ordenados por urgência para nenhuma campanha ou entrega parar sem aviso."
        >
          {totalAlertasHoje > 0 ? (
            <ul className="space-y-3">
              {saldosUrgentes.map((s) => (
                <Pendencia
                  key={`saldo-${s.contaId}`}
                  severidade={s.nivel === 'zerado' ? 'critico' : 'atencao'}
                  titulo={
                    s.nivel === 'zerado'
                      ? `Saldo esgotado: ${s.contaNome} (${dinheiroExato(s.saldoDisponivel ?? 0)})`
                      : `Saldo baixo: ${s.contaNome} (${dinheiroExato(s.saldoDisponivel ?? 0)})`
                  }
                  detalhe={s.resumo}
                  href={`/painel/metricas?conta=${s.contaId}`}
                  acao="Ver conta"
                />
              ))}
              {emRisco.map((c) => (
                <Pendencia
                  key={c.id}
                  severidade="critico"
                  titulo={c.nome}
                  detalhe={
                    c.situacao === 'sem_dado'
                      ? 'A sincronização parou. Conferir a integração antes de analisar números.'
                      : `MER em ${vezes(c.mer)}. Revisar campanhas na Ficha 360°.`
                  }
                  href={`/painel/contas?ficha=${c.id}`}
                  acao="Ver ficha"
                />
              ))}
              {resumo.integracoesComErro > 0 ? (
                <Pendencia
                  severidade="critico"
                  titulo={`${resumo.integracoesComErro} ${resumo.integracoesComErro === 1 ? 'integração com problema' : 'integrações com problema'}`}
                  detalhe="Token vencido ou credencial pendente nas plataformas."
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
                  titulo={`Proposta de ${p.cliente} vence em ${p.diasParaVencer} ${p.diasParaVencer === 1 ? 'dia' : 'dias'}`}
                  detalhe="Bom momento para fazer follow-up comercial."
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
                      ? `${c.metaAtingida.toFixed(0)}% da meta do mês alcançada até agora.`
                      : 'Oscilação recente nos resultados dos últimos 7 dias.'
                  }
                  href={`/painel/contas?ficha=${c.id}`}
                  acao="Ver ficha"
                />
              ))}
            </ul>
          ) : (
            <div className="cartao flex items-center gap-4 p-6">
              <span
                aria-hidden
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-base font-bold"
                style={{
                  color: CORES_SITUACAO.saudavel,
                  background: `${CORES_SITUACAO.saudavel}18`,
                }}
              >
                ✓
              </span>
              <div>
                <p className="font-semibold text-branco">Tudo em dia na operação hoje</p>
                <p className="mt-0.5 text-xs leading-relaxed text-cinza">
                  Nenhum saldo crítico, integração travada ou entrega vencida no momento.
                </p>
              </div>
            </div>
          )}
        </Bloco>

        {eventos.length > 0 ? (
          <Bloco
            titulo="Atividade recente da agência"
            apoio="Sincronizações, propostas, interações e marcos registrados pela equipe."
          >
            <div className="cartao p-5 sm:p-6">
              <LinhaDoTempo eventos={eventos} />
            </div>
          </Bloco>
        ) : null}
      </section>
    </div>
  );
}
