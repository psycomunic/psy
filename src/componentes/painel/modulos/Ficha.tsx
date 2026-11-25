import Link from 'next/link';
import {
  fichaDaConta,
  contratosDaConta,
  interacoesDaConta,
  marcosDaConta,
  serieDaContaPeriodo,
  canaisDaContaPeriodo,
  campanhasDaContaPeriodo,
  frescorDaConta,
  integracoesDaConta,
  sincronizacoesDaConta,
  contatosDaConta,
  metaAtualDaConta,
  tarefasDaConta,
  projetosDaConta,
  faturasDaConta,
  listarRelatorios,
  listarEquipe,
} from '@/lib/dados/consultas';
import { consultarSaldosMidia } from '@/lib/ingestao/saldos';
import { AvisoProcedencia, Secao, Kpi, Tabela, th, td } from '../base';
import { FormContrato, AcoesContrato } from '../FormContrato';
import { FormCobrancaAvulsa } from '../FormFinanceiro';
import { FormInteracao } from '../FormInteracao';
import { FormImportar } from '../FormImportar';
import { FormFonte, BotaoSincronizar, BotaoDesvincular } from '../FormFonte';
import {
  FormMetaRapidaFicha,
  ChecklistOnboardingFicha,
  BotaoConcluirTarefaRapido,
  FormTarefaRapidaFicha,
  SeletorSituacaoProjetoRapido,
  FormProjetoRapidoFicha,
  FormFichaCadastralEBriefing,
  GestaoContatosFicha,
} from '../FormFichaCliente';
import {
  ITENS_CHECKLIST_ONBOARDING,
  SITUACOES_ABERTAS,
  rotuloSituacaoConta,
  rotuloEstadoIntegracao,
  rotuloPrioridade,
  rotuloSituacaoProjeto,
  rotuloTipoProjeto,
  rotuloStatusFatura,
  rotuloStatusRelatorio,
  type ContaFicha,
  type EstadoIntegracao,
} from '@/lib/dados/tipos';
import {
  dinheiro,
  dinheiroExato,
  diaLongo,
  diaCurto,
  numero,
  porcento,
  vezes,
} from '@/lib/formato';
import { hojeBR, somarDias } from '@/lib/datas';
import { CORES_SITUACAO } from '../paleta';
import {
  agregarPeriodo,
  montarCartoesKpi,
  resolverPerfil,
  rotuloPerfilMetrica,
  type PerfilMetricaEfetivo,
} from '@/lib/dominio/perfis-metrica';
import {
  avaliarMetasDoMes,
  diagnosticarPendenciasCliente,
  type IndicadorMetaMes,
} from '@/lib/dominio/diagnostico-cliente';
import { pode, type Papel } from '@/lib/papeis';

const ABAS = [
  { k: 'resumo', r: 'Visão 360°', interna: false },
  { k: 'operacao', r: 'Plano de Ação', interna: true },
  { k: 'briefing', r: 'Ficha & Estratégia', interna: true },
  { k: 'diario', r: 'Diário & Relatórios', interna: false },
  { k: 'dados', r: 'Fontes & Dados', interna: false },
  { k: 'contrato', r: 'Contrato & Cobrança', interna: true },
] as const;

type Aba = (typeof ABAS)[number]['k'];

export function abaDaUrl(v: string | undefined): Aba {
  return ABAS.some((a) => a.k === v) ? (v as Aba) : 'resumo';
}

function faixa(n: number | null) {
  if (n === null) return { cor: CORES_SITUACAO.sem_dado, rotulo: 'sem nota', forma: '—' };
  if (n >= 80) return { cor: CORES_SITUACAO.saudavel, rotulo: 'saudável', forma: '●' };
  if (n >= 55) return { cor: CORES_SITUACAO.atencao, rotulo: 'atenção', forma: '▲' };
  return { cor: CORES_SITUACAO.critico, rotulo: 'risco', forma: '■' };
}

function corStatusMeta(status: IndicadorMetaMes['status']): string {
  if (status === 'acima' || status === 'no_ritmo') return CORES_SITUACAO.saudavel;
  if (status === 'atencao') return CORES_SITUACAO.atencao;
  if (status === 'abaixo') return CORES_SITUACAO.critico;
  return CORES_SITUACAO.sem_dado;
}

function urlInstagram(valor: string | null): string | null {
  if (!valor) return null;
  const limpo = valor.trim();
  if (!limpo) return null;
  if (/^https?:\/\//i.test(limpo)) return limpo;
  return `https://instagram.com/${limpo.replace(/^@/, '')}`;
}

export async function Ficha({
  contaId,
  aba = 'resumo',
  papel,
}: {
  contaId: string;
  aba?: Aba;
  papel: Papel;
}) {
  const [{ dados: conta, procedencia }, { dados: contatos }, saldosMidia] = await Promise.all([
    fichaDaConta(contaId),
    contatosDaConta(contaId),
    consultarSaldosMidia({
      contaId,
      notificarNoPainel: false,
      notificarNoWhatsapp: false,
      notificarNoEmail: false,
    }),
  ]);

  if (!conta) {
    return (
      <>
        <AvisoProcedencia procedencia={procedencia} />
        <p className="cartao mt-8 p-8 text-cinza">
          Cliente não encontrado, ou fora do seu acesso.
        </p>
        <p className="mt-6">
          <Link
            href="/painel/contas"
            className="inline-flex min-h-[24px] items-center text-sm font-semibold text-magenta-texto"
          >
            ← Voltar para a carteira
          </Link>
        </p>
      </>
    );
  }

  const ehCliente = papel === 'cliente' || papel === 'cliente_leitura';
  const podeRegistrar = ['administrador', 'gestor', 'operador', 'comercial'].includes(papel);
  const f = faixa(conta.pontuacao);
  const perfilEfetivo = resolverPerfil(conta.perfilMetrica, conta.tipo);
  const saldoConta = saldosMidia[0] ?? null;

  const contatoPrincipal = contatos[0] ?? null;
  const foneZap = (contatoPrincipal?.whatsapp || contatoPrincipal?.telefone || '').replace(
    /\D/g,
    '',
  );
  const linkWhatsappCliente = foneZap
    ? `https://wa.me/${foneZap.length <= 11 ? `55${foneZap}` : foneZap}`
    : null;
  const linkInsta = urlInstagram(conta.instagram);

  const abasVisiveis = ABAS.filter((item) => !ehCliente || !item.interna);
  const abaEfetiva: Aba = abasVisiveis.some((item) => item.k === aba) ? aba : 'resumo';

  const corSaldo =
    saldoConta?.nivel === 'zerado' || saldoConta?.nivel === 'critico'
      ? CORES_SITUACAO.critico
      : saldoConta?.nivel === 'atencao'
        ? CORES_SITUACAO.atencao
        : CORES_SITUACAO.saudavel;

  return (
    <>
      <AvisoProcedencia procedencia={procedencia} />

      <p className="mt-6">
        <Link href="/painel/contas" className="text-sm text-cinza transition-colors hover:text-neve">
          ← Carteira de clientes
        </Link>
      </p>

      {/* Cabeçalho 360° da Conta */}
      <header className="mt-4 grid gap-6 lg:grid-cols-[1fr_auto]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="rounded-full border border-magenta/40 bg-magenta/15 px-3 py-1 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-magenta-texto">
              {rotuloSituacaoConta[conta.situacao]}
            </span>
            <span className="rounded-full border border-fio bg-white/[0.03] px-3 py-1 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-neve">
              {rotuloPerfilMetrica[perfilEfetivo]}
            </span>
            {conta.segmento ? (
              <span className="font-mono text-[0.72rem] uppercase tracking-[0.14em] text-cinza">
                {conta.segmento}
              </span>
            ) : null}
          </div>

          <h1 className="mt-3 font-display text-3xl font-extrabold tracking-[-0.035em] text-branco sm:text-4xl">
            {conta.nome}
          </h1>

          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[0.72rem] uppercase tracking-[0.13em] text-cinza">
            {conta.responsavel ? <span>Gestão: {conta.responsavel}</span> : <span>Sem responsável fixo</span>}
            {conta.plataforma ? <span>· {conta.plataforma}</span> : null}
            {conta.dataInicio ? <span>· desde {diaLongo(conta.dataInicio)}</span> : null}
            {contatoPrincipal ? <span>· Contato: {contatoPrincipal.nome}</span> : null}
          </p>

          {conta.objetivoPrincipal ? (
            <p className="mt-3 max-w-[72ch] rounded-xl border border-fio bg-white/[0.02] px-4 py-2.5 text-sm leading-relaxed text-neve">
              <span className="mr-2 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-magenta-texto">
                Objetivo central:
              </span>
              {conta.objetivoPrincipal}
            </p>
          ) : null}

          {conta.escopo.length > 0 ? (
            <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Escopo contratado">
              {conta.escopo.map((item) => (
                <li
                  key={item}
                  className="rounded-full border border-fio bg-white/[0.03] px-3 py-1 text-xs text-neve"
                >
                  {item}
                </li>
              ))}
            </ul>
          ) : null}

          {/* Barra de Atalhos Rápidos */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {linkWhatsappCliente ? (
              <a
                href={linkWhatsappCliente}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-[#4ADE80]/40 bg-[#4ADE80]/10 px-4 py-2 text-xs font-semibold text-[#4ADE80] transition-colors hover:bg-[#4ADE80]/20"
              >
                WhatsApp do cliente →
              </a>
            ) : null}
            <Link
              href={`/painel/metricas?conta=${conta.id}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-fio bg-white/[0.03] px-4 py-2 text-xs font-semibold text-neve transition-colors hover:bg-white/[0.07]"
            >
              Métricas e criativos →
            </Link>
            {!ehCliente ? (
              <Link
                href={`/painel/relatorios?conta=${conta.id}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-fio bg-white/[0.03] px-4 py-2 text-xs font-semibold text-neve transition-colors hover:bg-white/[0.07]"
              >
                Gerar relatório →
              </Link>
            ) : null}
            {conta.linksUteis.drive ? (
              <a
                href={conta.linksUteis.drive}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-fio px-3.5 py-2 text-xs text-cinza transition-colors hover:text-neve"
              >
                Drive / Criativos ↗
              </a>
            ) : null}
            {conta.linksUteis.comercial ? (
              <a
                href={conta.linksUteis.comercial}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-fio px-3.5 py-2 text-xs text-cinza transition-colors hover:text-neve"
              >
                Painel Comercial ↗
              </a>
            ) : null}
            {conta.site ? (
              <a
                href={conta.site}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-fio px-3.5 py-2 text-xs text-cinza transition-colors hover:text-neve"
              >
                Site ↗
              </a>
            ) : null}
            {linkInsta ? (
              <a
                href={linkInsta}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-fio px-3.5 py-2 text-xs text-cinza transition-colors hover:text-neve"
              >
                Instagram ↗
              </a>
            ) : null}
          </div>
        </div>

        {/* Cartões de Saúde e Saldo de Mídia ao Vivo */}
        <div className="grid gap-3 sm:grid-cols-2 lg:w-[25rem] lg:grid-cols-2">
          <div className="cartao p-4">
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-cinza">
              Health score
            </p>
            <p className="tabular mt-2 flex items-baseline gap-2">
              <span
                className="font-display text-3xl font-extrabold tracking-[-0.04em]"
                style={{ color: f.cor }}
              >
                {conta.pontuacao ?? '—'}
              </span>
              <span className="text-xs font-semibold" style={{ color: f.cor }}>
                <span aria-hidden className="mr-1">{f.forma}</span>
                {f.rotulo}
              </span>
            </p>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full"
                style={{ width: `${conta.pontuacao ?? 0}%`, background: f.cor }}
              />
            </div>
            <p className="mt-2 text-[0.72rem] leading-snug text-cinza">
              {conta.tarefasAtrasadas > 0
                ? `${conta.tarefasAtrasadas} tarefa(s) atrasada(s)`
                : conta.inadimplencia > 0
                  ? `${dinheiro(conta.inadimplencia)} em atraso`
                  : 'Sem penalidades críticas'}
            </p>
          </div>

          <div className="cartao p-4">
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-cinza">
              Saldo Meta Ads
            </p>
            {saldoConta ? (
              <>
                <p className="tabular mt-2 font-display text-2xl font-extrabold tracking-[-0.03em] text-branco">
                  {saldoConta.modalidade === 'pre_pago' || saldoConta.saldoDisponivel !== null
                    ? dinheiroExato(saldoConta.saldoDisponivel ?? 0)
                    : 'Pós-pago'}
                </p>
                <p className="mt-1.5 text-xs font-semibold" style={{ color: corSaldo }}>
                  ● {saldoConta.resumo}
                </p>
                {saldoConta.gastoMedioDiario > 0 ? (
                  <p className="mt-1 text-[0.72rem] text-cinza">
                    Ritmo: {dinheiroExato(saldoConta.gastoMedioDiario)}/dia
                  </p>
                ) : null}
              </>
            ) : (
              <>
                <p className="mt-2 font-display text-xl font-bold text-cinza">—</p>
                <p className="mt-1.5 text-xs text-cinza">
                  Vincule a Meta Ads em Fontes & Dados para monitorar o saldo ao vivo.
                </p>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Navegação das Abas */}
      <nav aria-label="Abas da ficha" className="mt-8 flex flex-wrap gap-2 border-b border-fio pb-4">
        {abasVisiveis.map((a) => (
          <Link
            key={a.k}
            href={`/painel/contas?ficha=${conta.id}&aba=${a.k}`}
            aria-current={abaEfetiva === a.k ? 'page' : undefined}
            className={
              'rounded-full px-4 py-2 text-sm transition-colors ' +
              (abaEfetiva === a.k
                ? 'bg-magenta font-semibold text-branco'
                : 'border border-fio text-neve hover:bg-white/5')
            }
          >
            {a.r}
          </Link>
        ))}
      </nav>

      <div className="mt-8">
        {abaEfetiva === 'resumo' ? (
          <AbaVisao360
            conta={conta}
            perfil={perfilEfetivo}
            saldoMidia={saldoConta}
            papel={papel}
            ehCliente={ehCliente}
            podeRegistrar={podeRegistrar}
          />
        ) : null}
        {abaEfetiva === 'operacao' ? (
          <AbaPlanoDeAcao conta={conta} podeRegistrar={podeRegistrar} />
        ) : null}
        {abaEfetiva === 'briefing' ? (
          <AbaFichaEEstrategia
            conta={conta}
            contatos={contatos}
            podeRegistrar={podeRegistrar}
          />
        ) : null}
        {abaEfetiva === 'diario' ? (
          <AbaDiarioERelatorios
            contaId={conta.id}
            podeRegistrar={podeRegistrar}
            ehCliente={ehCliente}
          />
        ) : null}
        {abaEfetiva === 'dados' ? <AbaDados contaId={conta.id} papel={papel} /> : null}
        {abaEfetiva === 'contrato' ? (
          <AbaContrato contaId={conta.id} nomeDaConta={conta.nome} papel={papel} />
        ) : null}
      </div>
    </>
  );
}

/* ================================================================== */
/* ABA 1 — Visão 360° (Radar + Metas + Métricas + O que está rodando) */
/* ================================================================== */

async function AbaVisao360({
  conta,
  perfil,
  saldoMidia,
  papel,
  ehCliente,
  podeRegistrar,
}: {
  conta: ContaFicha;
  perfil: PerfilMetricaEfetivo;
  saldoMidia: Awaited<ReturnType<typeof consultarSaldosMidia>>[number] | null;
  papel: Papel;
  ehCliente: boolean;
  podeRegistrar: boolean;
}) {
  const hoje = hojeBR();
  const ontem = somarDias(hoje, -1);
  const inicioMes = `${hoje.slice(0, 7)}-01`;
  const fimMes = ontem >= inicioMes ? ontem : hoje;

  const de30 = somarDias(ontem, -29);
  const ant30Ate = somarDias(de30, -1);
  const ant30De = somarDias(ant30Ate, -29);

  const [
    metaMes,
    { dados: serieMes },
    { dados: serie30 },
    { dados: serieAnt30 },
    { dados: canais30 },
    { dados: campanhas30 },
    { dados: tarefas },
    { dados: projetos },
    { dados: integracoes },
    { dados: frescor },
    { dados: relatorios },
    { dados: marcos },
    { dados: equipe },
  ] = await Promise.all([
    metaAtualDaConta(conta.id),
    serieDaContaPeriodo(conta.id, inicioMes, fimMes),
    serieDaContaPeriodo(conta.id, de30, ontem),
    serieDaContaPeriodo(conta.id, ant30De, ant30Ate),
    canaisDaContaPeriodo(conta.id, de30, ontem),
    campanhasDaContaPeriodo(conta.id, de30, ontem),
    tarefasDaConta(conta.id),
    projetosDaConta(conta.id),
    integracoesDaConta(conta.id),
    frescorDaConta(conta.id),
    listarRelatorios(conta.id),
    marcosDaConta(conta.id),
    listarEquipe(),
  ]);

  const resumoMes = agregarPeriodo(serieMes);
  const resumo30 = agregarPeriodo(serie30);
  const resumoAnt30 = agregarPeriodo(serieAnt30);

  const avaliacaoMetas = avaliarMetasDoMes({
    perfil,
    meta: metaMes,
    resumoMes,
    hojeIso: hoje,
  });

  const pendencias = diagnosticarPendenciasCliente({
    conta,
    avaliacaoMetas,
    saldoMidia,
    tarefas,
    projetos,
    integracoes,
    frescor,
    relatorios,
    hojeIso: hoje,
  });

  const cartoesKpi = montarCartoesKpi({
    perfil,
    kpisVisiveis: conta.kpisVisiveis,
    atual: resumo30,
    anterior: resumoAnt30,
  });

  /* Resultado comercial Hospedi (quando conectado) */
  const canaisHospedi = canais30.filter((c) => c.canal.startsWith('hospedi'));
  const receitaHospedi = canaisHospedi.reduce((s, c) => s + c.receita, 0);
  const reservasHospedi = canaisHospedi.reduce((s, c) => s + c.pedidos, 0);
  const roasHospedi =
    resumo30.investimento > 0 && receitaHospedi > 0
      ? Number((receitaHospedi / resumo30.investimento).toFixed(2))
      : null;

  const tarefasAbertas = tarefas.filter((t) => t.status === 'aberta' || t.status === 'fazendo');
  const tarefasConcluidasRecentes = tarefas
    .filter((t) => t.status === 'concluida')
    .sort((a, b) => (b.concluidaEm ?? '').localeCompare(a.concluidaEm ?? ''))
    .slice(0, 5);

  const projetosAtivos = projetos.filter((p) => SITUACOES_ABERTAS.includes(p.situacao));
  const campanhasAtivas = campanhas30.filter((c) => c.investimento > 0).slice(0, 6);

  const itensConcluidosChecklist = ITENS_CHECKLIST_ONBOARDING.filter(
    (i) => conta.checklistOnboarding[i.chave],
  ).length;
  const exibirChecklist =
    !ehCliente &&
    (conta.situacao === 'onboarding' || itensConcluidosChecklist < ITENS_CHECKLIST_ONBOARDING.length);

  const equipeAtiva = equipe.filter((e) => e.ativo).map((e) => ({ id: e.id, nome: e.nome }));
  const ehAdmin = papel === 'administrador';

  return (
    <div className="space-y-10">
      {/* 1. RADAR: O QUE PRECISA SER FEITO AGORA */}
      {!ehCliente ? (
        <Secao
          titulo="O que precisa ser feito agora"
          apoio="Fila priorizada automaticamente cruzando saldo de mídia, tarefas, projetos, ritmo das metas, sincronização e relatórios."
        >
          {pendencias.length === 0 ? (
            <div className="cartao flex items-center gap-3 border-[#4ADE80]/30 bg-[#4ADE80]/[0.06] p-5 text-sm text-[#4ADE80]">
              <span aria-hidden className="text-base">●</span>
              <span>
                Operação 100% em dia. Nenhuma tarefa atrasada, saldo saudável, fontes sincronizadas e metas acompanhadas.
              </span>
            </div>
          ) : (
            <ul className="grid gap-3 md:grid-cols-2">
              {pendencias.map((p) => {
                const estilo =
                  p.nivel === 'urgente'
                    ? {
                        borda: 'border-[#FB7185]/45 bg-[#FB7185]/[0.07]',
                        cor: CORES_SITUACAO.critico,
                        selo: '■ Urgente hoje',
                      }
                    : p.nivel === 'atencao'
                      ? {
                          borda: 'border-[#FBBF24]/40 bg-[#FBBF24]/[0.06]',
                          cor: CORES_SITUACAO.atencao,
                          selo: '▲ Atenção',
                        }
                      : {
                          borda: 'border-fio bg-white/[0.02]',
                          cor: CORES_SITUACAO.sem_dado,
                          selo: '○ Próximo passo',
                        };

                return (
                  <li
                    key={p.id}
                    className={`flex flex-col justify-between gap-4 rounded-2xl border p-5 ${estilo.borda}`}
                  >
                    <div>
                      <span
                        className="font-mono text-[0.68rem] uppercase tracking-[0.14em] font-semibold"
                        style={{ color: estilo.cor }}
                      >
                        {estilo.selo}
                      </span>
                      <p className="mt-1.5 font-display text-base font-bold text-branco">
                        {p.titulo}
                      </p>
                      <p className="mt-1.5 text-sm leading-relaxed text-cinza">{p.detalhe}</p>
                    </div>

                    {p.acaoHref && p.acaoRotulo ? (
                      <div>
                        <Link
                          href={p.acaoHref}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-magenta-texto underline-offset-4 hover:underline"
                        >
                          {p.acaoRotulo} →
                        </Link>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}

          {exibirChecklist ? (
            <div className="mt-5">
              <ChecklistOnboardingFicha
                contaId={conta.id}
                mapa={conta.checklistOnboarding}
                editavel={podeRegistrar}
              />
            </div>
          ) : null}
        </Secao>
      ) : null}

      {/* 2. METAS DO MÊS E RITMO DIÁRIO */}
      <section id="metas-cliente" className="scroll-mt-8">
        <Secao
          titulo={`Metas deste mês (dia ${avaliacaoMetas.diaDoMes} de ${avaliacaoMetas.diasNoMes})`}
          apoio={`Progresso esperado para hoje pela linha do calendário: ${porcento(avaliacaoMetas.ritmoEsperadoPct, 0)} do mês concluído.`}
        >
          <div className="grid gap-4 lg:grid-cols-3">
            {[avaliacaoMetas.principal, avaliacaoMetas.verba, avaliacaoMetas.custoTeto].map(
              (m, idx) => {
                const cor = corStatusMeta(m.status);
                const largura =
                  m.percentual === null ? 0 : Math.min(100, Math.max(4, m.percentual));
                const mostrarReguaCalendario = idx < 2 && m.definida;

                return (
                  <div key={m.rotulo} className="cartao flex flex-col justify-between p-5">
                    <div>
                      <p className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-cinza">
                        {m.rotulo}
                      </p>
                      <div className="mt-2.5 flex flex-wrap items-baseline justify-between gap-2">
                        <span className="tabular font-display text-2xl font-extrabold tracking-[-0.03em] text-branco">
                          {m.atualTexto}
                        </span>
                        <span className="tabular text-xs font-semibold text-cinza">
                          meta: {m.metaTexto}
                        </span>
                      </div>

                      <div className="relative mt-3.5 h-2 w-full overflow-hidden rounded-full bg-white/[0.07]">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${largura}%`, background: cor }}
                        />
                        {mostrarReguaCalendario ? (
                          <span
                            title={`Ritmo esperado hoje (${porcento(avaliacaoMetas.ritmoEsperadoPct, 0)})`}
                            className="absolute top-0 bottom-0 w-0.5 bg-white/70"
                            style={{ left: `${Math.min(99, avaliacaoMetas.ritmoEsperadoPct)}%` }}
                          />
                        ) : null}
                      </div>
                    </div>

                    <p className="mt-3 text-xs leading-relaxed text-cinza">{m.apoio}</p>
                  </div>
                );
              },
            )}
          </div>

          {ehAdmin ? (
            <div className="mt-4">
              <FormMetaRapidaFicha
                contaId={conta.id}
                perfil={perfil}
                metaAtual={metaMes}
              />
            </div>
          ) : null}
        </Secao>
      </section>

      {/* 3. RESUMO DE MÉTRICAS E VENDAS (ÚLTIMOS 30 DIAS) */}
      <Secao
        titulo="Resumo de métricas (últimos 30 dias)"
        apoio={`De ${diaCurto(de30)} a ${diaCurto(ontem)}, comparado aos 30 dias anteriores (${diaCurto(ant30De)} a ${diaCurto(ant30Ate)}).`}
      >
        {reservasHospedi > 0 || receitaHospedi > 0 ? (
          <div className="mb-4 rounded-2xl border border-[#4ADE80]/35 bg-[#4ADE80]/[0.06] p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-[#4ADE80]">
                  Vendas reais confirmadas · Hospedi
                </p>
                <p className="tabular mt-1.5 font-display text-2xl font-extrabold text-branco">
                  {dinheiro(receitaHospedi)}{' '}
                  <span className="text-base font-normal text-neve">
                    em {numero(reservasHospedi)} {reservasHospedi === 1 ? 'reserva' : 'reservas'}
                  </span>
                </p>
              </div>
              {roasHospedi !== null ? (
                <div className="text-right">
                  <p className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-cinza">
                    ROAS comercial real
                  </p>
                  <p className="tabular mt-1 font-display text-2xl font-extrabold text-[#4ADE80]">
                    {vezes(roasHospedi)}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cartoesKpi.map((k) => (
            <Kpi
              key={k.chave}
              rotulo={k.rotulo}
              valor={k.valor}
              variacao={k.variacao}
              invertido={k.invertido}
              apoio={k.apoio}
            />
          ))}
        </div>
      </Secao>

      {/* 4. TUDO O QUE ESTÁ SENDO FEITO (OPERAÇÃO EM CURSO) */}
      <Secao
        titulo="Tudo o que está sendo feito"
        apoio="Visão consolidada das campanhas ativas em mídia, entregas em produção, próximas tarefas e histórico recente."
      >
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Coluna A: Campanhas em veiculação */}
          <div className="cartao flex flex-col justify-between p-6">
            <div>
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-display text-lg font-bold text-branco">
                  Campanhas com entrega (30 dias)
                </h3>
                <Link
                  href={`/painel/metricas?conta=${conta.id}`}
                  className="text-xs font-semibold text-magenta-texto hover:underline"
                >
                  Ver criativos →
                </Link>
              </div>

              {campanhasAtivas.length === 0 ? (
                <p className="mt-4 text-sm text-cinza">
                  Nenhuma campanha com investimento registrado nos últimos 30 dias.
                </p>
              ) : (
                <ul className="mt-4 divide-y divide-fio">
                  {campanhasAtivas.map((c) => {
                    const volume =
                      c.conversas > 0
                        ? `${numero(c.conversas)} conv.`
                        : c.leadsCaptados > 0
                          ? `${numero(c.leadsCaptados)} leads`
                          : c.comprasAtribuidas > 0
                            ? `${numero(c.comprasAtribuidas)} vendas`
                            : `${numero(c.cliquesLink)} cliques`;
                    const custoUnit =
                      c.conversas > 0
                        ? `${dinheiroExato(c.investimento / c.conversas)}/conv.`
                        : c.leadsCaptados > 0
                          ? `${dinheiroExato(c.investimento / c.leadsCaptados)}/lead`
                          : c.cpc !== null
                            ? `CPC ${dinheiroExato(c.cpc)}`
                            : null;

                    return (
                      <li key={`${c.provedor}-${c.campanhaId}`} className="py-3 first:pt-0 last:pb-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-branco">
                              {c.campanhaNome}
                            </p>
                            <p className="mt-0.5 font-mono text-[0.68rem] uppercase tracking-[0.12em] text-cinza">
                              {c.canal} · {c.objetivo}
                              {c.statusCampanha ? ` · ${c.statusCampanha}` : ''}
                            </p>
                          </div>
                          <div className="tabular shrink-0 text-right">
                            <p className="text-sm font-semibold text-neve">
                              {dinheiro(c.investimento)}
                            </p>
                            <p className="text-xs text-cinza">
                              {volume}
                              {custoUnit ? ` · ${custoUnit}` : ''}
                            </p>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* Coluna B: Tarefas e Projetos ativos */}
          <div className="cartao space-y-6 p-6">
            <div>
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-display text-lg font-bold text-branco">
                  Tarefas na fila ({tarefasAbertas.length})
                </h3>
                {!ehCliente ? (
                  <Link
                    href={`/painel/contas?ficha=${conta.id}&aba=operacao`}
                    className="text-xs font-semibold text-magenta-texto hover:underline"
                  >
                    Plano completo →
                  </Link>
                ) : null}
              </div>

              {tarefasAbertas.length === 0 ? (
                <p className="mt-3 text-sm text-cinza">
                  Nenhuma tarefa pendente para esta conta.
                </p>
              ) : (
                <ul className="mt-3 divide-y divide-fio">
                  {tarefasAbertas.slice(0, 5).map((t) => {
                    const atrasada = t.diasAtePrazo !== null && t.diasAtePrazo < 0;
                    return (
                      <li
                        key={t.id}
                        className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                      >
                        <div className="min-w-0 grow">
                          <p className="text-sm font-semibold text-branco">{t.titulo}</p>
                          <p className="mt-0.5 text-xs text-cinza">
                            <span style={{ color: atrasada ? '#FB7185' : undefined }}>
                              {t.prazo ? `Prazo ${diaCurto(t.prazo)}` : 'Sem prazo'}
                            </span>
                            {' · '}
                            {rotuloPrioridade[t.prioridade]}
                            {t.responsavel ? ` · ${t.responsavel}` : ''}
                          </p>
                        </div>
                        {podeRegistrar ? <BotaoConcluirTarefaRapido id={t.id} /> : null}
                      </li>
                    );
                  })}
                </ul>
              )}

              {podeRegistrar ? (
                <div className="mt-4">
                  <FormTarefaRapidaFicha contaId={conta.id} equipe={equipeAtiva} hoje={hoje} />
                </div>
              ) : null}
            </div>

            <div className="border-t border-fio pt-5">
              <h3 className="font-display text-lg font-bold text-branco">
                Projetos e entregas em andamento ({projetosAtivos.length})
              </h3>

              {projetosAtivos.length === 0 ? (
                <p className="mt-2 text-sm text-cinza">
                  Nenhum projeto paralelo (site, LP ou identidade) aberto neste momento.
                </p>
              ) : (
                <ul className="mt-3 space-y-2.5">
                  {projetosAtivos.map((p) => (
                    <li
                      key={p.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-fio bg-white/[0.02] px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-branco">{p.nome}</p>
                        <p className="mt-0.5 text-xs text-cinza">
                          {rotuloTipoProjeto[p.tipo]}
                          {p.prazo ? ` · prazo ${diaCurto(p.prazo)}` : ''}
                          {p.responsavel ? ` · ${p.responsavel}` : ''}
                        </p>
                      </div>
                      {podeRegistrar ? (
                        <SeletorSituacaoProjetoRapido id={p.id} situacaoAtual={p.situacao} />
                      ) : (
                        <span className="text-xs font-semibold text-neve">
                          {rotuloSituacaoProjeto[p.situacao]}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Faixa de entregas concluídas, relatórios e marcos */}
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="cartao p-5">
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-magenta-texto">
              O que já foi executado
            </p>
            <h4 className="mt-1 font-display text-base font-bold text-branco">
              Últimas tarefas concluídas
            </h4>
            {tarefasConcluidasRecentes.length === 0 ? (
              <p className="mt-3 text-xs text-cinza">Nenhuma tarefa concluída registrada ainda.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {tarefasConcluidasRecentes.map((t) => (
                  <li key={t.id} className="flex items-start gap-2 text-neve">
                    <span aria-hidden className="mt-0.5 text-[#4ADE80]">✓</span>
                    <span className="min-w-0">
                      <span className="block text-xs font-medium">{t.titulo}</span>
                      {t.concluidaEm ? (
                        <span className="font-mono text-[0.65rem] text-cinza">
                          {diaCurto(t.concluidaEm.slice(0, 10))}
                        </span>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="cartao p-5">
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-magenta-texto">
              Prestação de contas
            </p>
            <h4 className="mt-1 font-display text-base font-bold text-branco">
              Relatórios de desempenho
            </h4>
            {relatorios.length === 0 ? (
              <p className="mt-3 text-xs text-cinza">Nenhum relatório salvo para esta conta.</p>
            ) : (
              <ul className="mt-3 space-y-2.5 text-xs">
                {relatorios.slice(0, 3).map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-neve">{r.titulo}</p>
                      <p className="text-cinza">
                        {diaCurto(r.periodoDe)} a {diaCurto(r.periodoAte)} ·{' '}
                        {rotuloStatusRelatorio[r.status]}
                      </p>
                    </div>
                    <Link
                      href={`/relatorio/${r.slug}`}
                      target="_blank"
                      className="shrink-0 font-semibold text-magenta-texto hover:underline"
                    >
                      PDF →
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="cartao p-5">
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-magenta-texto">
              Memória da operação
            </p>
            <h4 className="mt-1 font-display text-base font-bold text-branco">
              Últimos marcos registrados
            </h4>
            {marcos.length === 0 ? (
              <p className="mt-3 text-xs text-cinza">
                Registre viradas de verba, trocas de criativos ou campanhas na aba Diário.
              </p>
            ) : (
              <ul className="mt-3 space-y-2.5 text-xs">
                {marcos.slice(0, 3).map((m) => (
                  <li key={m.id}>
                    <p className="font-semibold text-neve">{m.titulo}</p>
                    <p className="text-cinza">
                      {diaCurto(m.dia)} · {m.tipo}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Secao>
    </div>
  );
}

/* ================================================================== */
/* ABA 2 — Plano de Ação (Tarefas & Projetos completos deste cliente) */
/* ================================================================== */

async function AbaPlanoDeAcao({
  conta,
  podeRegistrar,
}: {
  conta: ContaFicha;
  podeRegistrar: boolean;
}) {
  const hoje = hojeBR();
  const [{ dados: tarefas }, { dados: projetos }, { dados: equipe }] = await Promise.all([
    tarefasDaConta(conta.id),
    projetosDaConta(conta.id),
    listarEquipe(),
  ]);

  const equipeAtiva = equipe.filter((e) => e.ativo).map((e) => ({ id: e.id, nome: e.nome }));
  const abertas = tarefas.filter((t) => t.status === 'aberta' || t.status === 'fazendo');
  const concluidas = tarefas.filter((t) => t.status === 'concluida').slice(0, 15);

  return (
    <div className="space-y-10">
      <Secao
        titulo={`Tarefas operacionais de ${conta.nome}`}
        apoio="Crie otimizações recorrentes, revisões de campanha ou entregas pontuais já amarradas a este cliente."
      >
        {podeRegistrar ? (
          <div className="mb-5">
            <FormTarefaRapidaFicha contaId={conta.id} equipe={equipeAtiva} hoje={hoje} />
          </div>
        ) : null}

        {abertas.length === 0 ? (
          <p className="cartao p-6 text-sm text-cinza">
            Nenhuma tarefa aberta neste momento para {conta.nome}.
          </p>
        ) : (
          <ul className="space-y-3">
            {abertas.map((t) => {
              const atrasada = t.diasAtePrazo !== null && t.diasAtePrazo < 0;
              return (
                <li
                  key={t.id}
                  className="cartao flex flex-wrap items-center justify-between gap-4 p-5"
                >
                  <div className="min-w-0 grow">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="font-mono text-[0.7rem] uppercase tracking-[0.12em] font-semibold"
                        style={{ color: atrasada ? '#FB7185' : '#93A0BC' }}
                      >
                        {t.prazo
                          ? atrasada
                            ? `■ Atrasada (${diaCurto(t.prazo)})`
                            : `Prazo ${diaCurto(t.prazo)}`
                          : 'Sem prazo'}
                      </span>
                      <span className="rounded-full border border-fio px-2.5 py-0.5 font-mono text-[0.65rem] uppercase text-cinza">
                        {rotuloPrioridade[t.prioridade]}
                      </span>
                      {t.responsavel ? (
                        <span className="text-xs text-cinza">· {t.responsavel}</span>
                      ) : null}
                    </div>
                    <p className="mt-1.5 font-display text-base font-bold text-branco">
                      {t.titulo}
                    </p>
                    {t.detalhe ? (
                      <p className="mt-1 text-sm leading-relaxed text-cinza">{t.detalhe}</p>
                    ) : null}
                  </div>
                  {podeRegistrar ? <BotaoConcluirTarefaRapido id={t.id} /> : null}
                </li>
              );
            })}
          </ul>
        )}
      </Secao>

      <Secao
        titulo="Projetos e entregas estruturadas"
        apoio="Sites, landing pages, identidade visual ou pacotes de criativos com ciclo de aprovação."
      >
        {podeRegistrar ? (
          <div className="mb-5">
            <FormProjetoRapidoFicha contaId={conta.id} equipe={equipeAtiva} />
          </div>
        ) : null}

        {projetos.length === 0 ? (
          <p className="cartao p-6 text-sm text-cinza">
            Nenhum projeto cadastrado para esta conta.
          </p>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {projetos.map((p) => (
              <li key={p.id} className="cartao flex flex-col justify-between gap-4 p-5">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[0.7rem] uppercase tracking-[0.12em] text-magenta-texto">
                      {rotuloTipoProjeto[p.tipo]}
                    </span>
                    <span className="text-xs text-cinza">
                      há {p.diasNaSituacao} {p.diasNaSituacao === 1 ? 'dia' : 'dias'} nesta etapa
                    </span>
                  </div>
                  <p className="mt-1.5 font-display text-lg font-bold text-branco">{p.nome}</p>
                  {p.observacoes ? (
                    <p className="mt-1.5 text-sm leading-relaxed text-cinza">{p.observacoes}</p>
                  ) : null}
                  <p className="mt-2 text-xs text-cinza">
                    {p.prazo ? `Prazo: ${diaLongo(p.prazo)}` : 'Sem prazo fixo'}
                    {p.responsavel ? ` · ${p.responsavel}` : ''}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-fio pt-3">
                  {podeRegistrar ? (
                    <SeletorSituacaoProjetoRapido id={p.id} situacaoAtual={p.situacao} />
                  ) : (
                    <span className="text-xs font-semibold text-neve">
                      {rotuloSituacaoProjeto[p.situacao]}
                    </span>
                  )}
                  {p.link ? (
                    <a
                      href={p.link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-magenta-texto hover:underline"
                    >
                      Abrir link ↗
                    </a>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Secao>

      {concluidas.length > 0 ? (
        <Secao titulo="Histórico recente de tarefas concluídas">
          <ul className="grid gap-2.5 md:grid-cols-2">
            {concluidas.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-fio bg-white/[0.02] px-4 py-3 text-sm"
              >
                <span className="text-cinza line-through">{t.titulo}</span>
                {t.concluidaEm ? (
                  <span className="tabular shrink-0 font-mono text-xs text-cinza">
                    {diaCurto(t.concluidaEm.slice(0, 10))}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </Secao>
      ) : null}
    </div>
  );
}

/* ================================================================== */
/* ABA 3 — Ficha Cadastral, Briefing Estratégico e Contatos           */
/* ================================================================== */

async function AbaFichaEEstrategia({
  conta,
  contatos,
  podeRegistrar,
}: {
  conta: ContaFicha;
  contatos: Awaited<ReturnType<typeof contatosDaConta>>['dados'];
  podeRegistrar: boolean;
}) {
  const { dados: equipe } = await listarEquipe();
  const equipeAtiva = equipe.filter((e) => e.ativo).map((e) => ({ id: e.id, nome: e.nome }));

  return (
    <div className="space-y-10">
      {/* Resumo de leitura rápida do Briefing */}
      <Secao
        titulo="Contexto estratégico da conta"
        apoio="O que qualquer gestor, designer ou redator precisa saber antes de subir campanha ou criar peça para este cliente."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="cartao p-5">
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-magenta-texto">
              Público-alvo e praças
            </p>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-neve">
              {conta.publicoAlvo || 'Ainda não preenchido no formulário abaixo.'}
            </p>
          </div>
          <div className="cartao p-5">
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-magenta-texto">
              Oferta principal / Carro-chefe
            </p>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-neve">
              {conta.ofertaPrincipal || 'Ainda não preenchido no formulário abaixo.'}
            </p>
          </div>
          <div className="cartao p-5">
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-magenta-texto">
              Diferenciais competitivos
            </p>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-neve">
              {conta.diferenciais || 'Ainda não preenchido no formulário abaixo.'}
            </p>
          </div>
          <div className="cartao p-5">
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-magenta-texto">
              Observações e regras fixas
            </p>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-neve">
              {conta.observacoes || 'Nenhuma observação fixa registrada.'}
            </p>
          </div>
        </div>
      </Secao>

      <Secao
        titulo="Pessoas de contato do cliente"
        apoio="O contato marcado como principal abastece o botão rápido de WhatsApp no topo da ficha e os disparos de relatório."
      >
        <GestaoContatosFicha
          contaId={conta.id}
          contatos={contatos}
          podeEditar={podeRegistrar}
        />
      </Secao>

      <ChecklistOnboardingFicha
        contaId={conta.id}
        mapa={conta.checklistOnboarding}
        editavel={podeRegistrar}
      />

      {podeRegistrar ? (
        <FormFichaCadastralEBriefing conta={conta} equipe={equipeAtiva} />
      ) : null}
    </div>
  );
}

/* ================================================================== */
/* ABA 4 — Diário de Bordo e Relatórios                               */
/* ================================================================== */

async function AbaDiarioERelatorios({
  contaId,
  podeRegistrar,
  ehCliente,
}: {
  contaId: string;
  podeRegistrar: boolean;
  ehCliente: boolean;
}) {
  const [{ dados: marcos }, { dados: interacoes }, { dados: relatorios }] = await Promise.all([
    marcosDaConta(contaId),
    interacoesDaConta(contaId),
    listarRelatorios(contaId),
  ]);

  return (
    <div className="space-y-10">
      <Secao
        titulo="Relatórios de desempenho deste cliente"
        apoio="Documentos executivos em formato editorial A4 prontos para envio ou impressão em PDF."
      >
        {!ehCliente ? (
          <div className="mb-4">
            <Link
              href={`/painel/relatorios?conta=${contaId}`}
              className="inline-flex items-center gap-2 rounded-full bg-magenta px-5 py-2.5 text-xs font-semibold text-branco transition-colors hover:bg-magenta-forte"
            >
              + Gerar novo relatório para este cliente
            </Link>
          </div>
        ) : null}

        {relatorios.length === 0 ? (
          <p className="cartao p-6 text-sm text-cinza">Nenhum relatório emitido ainda.</p>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {relatorios.map((r) => (
              <li
                key={r.id}
                className="cartao flex flex-wrap items-center justify-between gap-4 p-5"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-branco">{r.titulo}</p>
                  <p className="mt-1 font-mono text-[0.7rem] uppercase tracking-[0.12em] text-cinza">
                    {diaCurto(r.periodoDe)} a {diaCurto(r.periodoAte)} ·{' '}
                    {rotuloStatusRelatorio[r.status]}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    href={`/relatorio/${r.slug}`}
                    target="_blank"
                    className="rounded-full border border-fio px-4 py-1.5 text-xs font-semibold text-neve transition-colors hover:bg-white/5"
                  >
                    Abrir PDF →
                  </Link>
                  {!ehCliente ? (
                    <Link
                      href={`/painel/relatorios?editar=${r.id}`}
                      className="text-xs font-semibold text-magenta-texto hover:underline"
                    >
                      Editar
                    </Link>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Secao>

      {podeRegistrar ? <FormInteracao contaId={contaId} /> : null}

      <Secao
        titulo="Marcos da operação"
        apoio="Viradas de orçamento, novos criativos, promoções ou ajustes estruturais que explicam os degraus nos gráficos."
      >
        {marcos.length === 0 ? (
          <p className="cartao p-6 text-sm text-cinza">Nenhum marco registrado.</p>
        ) : (
          <ol className="space-y-3">
            {marcos.map((m) => (
              <li key={m.id} className="cartao flex flex-wrap gap-x-6 gap-y-2 p-5">
                <span className="font-mono text-[0.75rem] uppercase tracking-[0.14em] text-magenta-texto">
                  {diaLongo(m.dia)}
                </span>
                <div className="min-w-0 grow">
                  <p className="font-semibold">{m.titulo}</p>
                  {m.detalhe ? <p className="mt-1 text-sm text-cinza">{m.detalhe}</p> : null}
                </div>
                <span className="rounded-full border border-fio px-3 py-1 font-mono text-[0.75rem] uppercase tracking-[0.12em] text-cinza">
                  {m.tipo}
                </span>
              </li>
            ))}
          </ol>
        )}
      </Secao>

      <Secao titulo="Conversas e alinhamentos" apoio="Reuniões, ligações e combinados registrados pelo time.">
        {interacoes.length === 0 ? (
          <p className="cartao p-6 text-sm text-cinza">Nenhuma interação registrada.</p>
        ) : (
          <ol className="space-y-3">
            {interacoes.map((i) => (
              <li key={i.id} className="cartao p-5">
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <span className="rounded-full border border-fio px-3 py-1 font-mono text-[0.75rem] uppercase tracking-[0.12em] text-magenta-texto">
                    {i.tipo}
                  </span>
                  <span className="text-sm text-cinza">{i.autor ?? 'Sistema'}</span>
                  <span className="ml-auto font-mono text-[0.75rem] uppercase tracking-[0.12em] text-cinza">
                    {new Date(i.em).toLocaleString('pt-BR', {
                      timeZone: 'America/Sao_Paulo',
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="mt-3 leading-relaxed text-neve">{i.resumo}</p>
              </li>
            ))}
          </ol>
        )}
      </Secao>
    </div>
  );
}

/* ================================================================== */
/* ABA 5 — Fontes & Sincronização                                     */
/* ================================================================== */

const SINAL: Record<EstadoIntegracao, { cor: string; forma: string }> = {
  ok: { cor: CORES_SITUACAO.saudavel, forma: '●' },
  atrasada: { cor: CORES_SITUACAO.atencao, forma: '▲' },
  com_erro: { cor: CORES_SITUACAO.critico, forma: '■' },
  nunca_rodou: { cor: CORES_SITUACAO.sem_dado, forma: '○' },
  sem_credencial: { cor: CORES_SITUACAO.atencao, forma: '▲' },
  desligada: { cor: CORES_SITUACAO.sem_dado, forma: '—' },
};

const quando = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'nunca';

async function AbaDados({ contaId, papel }: { contaId: string; papel: Papel }) {
  const [{ dados: frescor }, { dados: conexoes }, { dados: rodadas }] = await Promise.all([
    frescorDaConta(contaId),
    integracoesDaConta(contaId),
    sincronizacoesDaConta(contaId),
  ]);

  const podeImportar = pode(papel, 'metricas', 'editar');
  const ehAdmin = papel === 'administrador';

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi
          rotulo="Último dia com dado"
          valor={frescor.ultimoDia ? diaLongo(frescor.ultimoDia) : '—'}
          apoio={
            frescor.atrasoDias === null
              ? 'Nenhum dado chegou ainda.'
              : frescor.atrasoDias <= 1
                ? 'Em dia.'
                : `${frescor.atrasoDias} dias de atraso.`
          }
        />
        <Kpi rotulo="Dias com dado, em 30" valor={`${frescor.diasComDado30}/30`} />
        <Kpi
          rotulo="Dias faltando"
          valor={numero(frescor.diasSemDado30)}
          apoio={
            frescor.diasSemDado30 > 0
              ? 'Buraco na série parece queda. Não é: é dado que não chegou.'
              : 'Série completa no mês.'
          }
        />
      </div>

      <Secao
        titulo="Conexões"
        apoio="Uma linha por fonte (Meta Ads, Google Ads, GA4, Hospedi). A credencial fica cifrada na agência."
      >
        {ehAdmin ? (
          <div className="mb-5">
            <BotaoSincronizar contaId={contaId} />
          </div>
        ) : null}
        {conexoes.length === 0 ? (
          <p className="cartao p-6 text-sm leading-relaxed text-cinza">
            Nenhuma conexão cadastrada. Vincule abaixo ou importe planilha CSV.
          </p>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {conexoes.map((c) => {
              const s = SINAL[c.estado];
              return (
                <li key={c.id} className="cartao p-5">
                  <div className="flex items-baseline justify-between gap-4">
                    <p className="font-semibold text-branco">{c.provedor}</p>
                    <p className="text-xs font-semibold" style={{ color: s.cor }}>
                      <span aria-hidden className="mr-1">{s.forma}</span>
                      {rotuloEstadoIntegracao[c.estado]}
                    </p>
                  </div>
                  <p className="mt-2 font-mono text-[0.75rem] uppercase tracking-[0.12em] text-cinza">
                    {c.identificador ?? 'sem identificador'} · janela de {c.janelaDias} dias
                  </p>
                  <p className="mt-3 text-sm text-cinza">
                    Última vez sem erro: {quando(c.ultimaSyncOk)}
                  </p>
                  {c.ultimoErro ? (
                    <p className="mt-2 break-words rounded-lg border border-magenta/30 bg-magenta/10 px-3 py-2 text-xs text-magenta-texto">
                      {c.ultimoErro}
                    </p>
                  ) : null}
                  {ehAdmin ? (
                    <p className="mt-4 border-t border-fio pt-3">
                      <BotaoDesvincular id={c.id} />
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </Secao>

      {ehAdmin ? (
        <Secao
          titulo="Nova fonte"
          apoio="Vincule Meta Ads, Google Ads, GA4 ou Hospedi para sincronização diária automática."
        >
          <FormFonte contaId={contaId} />
        </Secao>
      ) : null}

      {podeImportar ? (
        <Secao titulo="Entrada manual" apoio="Importação de histórico por CSV.">
          <FormImportar contaId={contaId} />
        </Secao>
      ) : null}

      <Secao
        titulo="Últimas rodadas"
        apoio="Histórico de execuções das integrações automáticas desta conta."
      >
        {rodadas.length === 0 ? (
          <p className="cartao p-6 text-sm text-cinza">Nenhuma sincronização registrada.</p>
        ) : (
          <Tabela>
            <caption className="sr-only">Histórico de sincronizações desta conta</caption>
            <thead>
              <tr>
                <th scope="col" className={th}>Quando</th>
                <th scope="col" className={th}>Fonte</th>
                <th scope="col" className={th}>Período</th>
                <th scope="col" className={th}>Linhas</th>
                <th scope="col" className={th}>Resultado</th>
              </tr>
            </thead>
            <tbody>
              {rodadas.map((r) => (
                <tr key={r.id}>
                  <td className={`${td} tabular whitespace-nowrap`}>{quando(r.comecouEm)}</td>
                  <th scope="row" className={`${td} font-normal`}>
                    <span className="text-branco">{r.provedor}</span>
                    <span className="mt-1 block font-mono text-[0.75rem] uppercase tracking-[0.12em] text-cinza">
                      {r.origem}
                    </span>
                  </th>
                  <td className={`${td} tabular whitespace-nowrap text-sm`}>
                    {r.diaDe === r.diaAte
                      ? (r.diaDe ?? '—')
                      : `${r.diaDe ?? '?'} a ${r.diaAte ?? '?'}`}
                  </td>
                  <td className={`${td} tabular`}>
                    {r.linhasGravadas}
                    <span className="text-cinza"> de {r.linhasLidas}</span>
                  </td>
                  <td className={td}>
                    {r.status === 'sucesso' ? (
                      <span className="text-sm" style={{ color: CORES_SITUACAO.saudavel }}>
                        <span aria-hidden className="mr-1">●</span>ok
                      </span>
                    ) : r.status === 'erro' ? (
                      <span
                        className="text-sm"
                        style={{ color: CORES_SITUACAO.critico }}
                        title={r.erro ?? undefined}
                      >
                        <span aria-hidden className="mr-1">■</span>
                        {r.erro ? r.erro.slice(0, 60) : 'erro'}
                      </span>
                    ) : (
                      <span className="text-sm text-cinza">rodando</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Tabela>
        )}
      </Secao>
    </>
  );
}

/* ================================================================== */
/* ABA 6 — Contrato & Faturas                                         */
/* ================================================================== */

async function AbaContrato({
  contaId,
  nomeDaConta,
  papel,
}: {
  contaId: string;
  nomeDaConta: string;
  papel: Papel;
}) {
  const podeVer = ['administrador', 'financeiro'].includes(papel);

  if (!podeVer) {
    return (
      <p className="cartao p-6 text-sm leading-relaxed text-cinza">
        Contrato, fee e faturas são visíveis apenas para administrador e financeiro.
      </p>
    );
  }

  const [{ dados: contratos }, { dados: faturas }] = await Promise.all([
    contratosDaConta(contaId),
    faturasDaConta(contaId),
  ]);
  const conta = { id: contaId, nome: nomeDaConta };

  const podeEscrever = papel === 'administrador' || papel === 'financeiro';
  const semVigenciaAberta = !contratos.some((c) => !c.fim);

  return (
    <div className="space-y-8">
      {contratos.length === 0 ? (
        <p className="max-w-[70ch] text-sm leading-relaxed text-cinza">
          Nenhum contrato cadastrado. Cadastre abaixo para habilitar o faturamento recorrente desta conta.
        </p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {contratos.map((c) => (
            <li key={c.id} className="cartao space-y-4 p-6">
              <div>
                <p className="font-mono text-[0.75rem] uppercase tracking-[0.14em] text-magenta-texto">
                  {c.plano}
                </p>
                <p className="tabular mt-3 font-display text-2xl font-extrabold tracking-[-0.03em]">
                  {dinheiro(c.feeMensal)}
                  <span className="ml-1 text-sm font-normal text-cinza">/mês</span>
                </p>
              </div>

              <dl className="space-y-2 border-t border-fio pt-4 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-cinza">Vencimento</dt>
                  <dd className="tabular">dia {c.diaVencimento}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-cinza">Início</dt>
                  <dd className="tabular">{diaLongo(c.inicio)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-cinza">Fim</dt>
                  <dd className="tabular">{c.fim ? diaLongo(c.fim) : 'sem prazo'}</dd>
                </div>
              </dl>

              {podeEscrever ? (
                <div className="border-t border-fio pt-4">
                  <AcoesContrato
                    contratoId={c.id}
                    feeAtual={c.feeMensal}
                    encerrado={Boolean(c.fim)}
                    automatica={c.cobrancaAutomatica}
                    diaVencimento={c.diaVencimento}
                  />
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {faturas.length > 0 ? (
        <Secao titulo="Últimas cobranças emitidas">
          <Tabela>
            <caption className="sr-only">Faturas emitidas para {nomeDaConta}</caption>
            <thead>
              <tr>
                <th scope="col" className={th}>Vencimento</th>
                <th scope="col" className={th}>Competência / Descrição</th>
                <th scope="col" className={th}>Valor</th>
                <th scope="col" className={th}>Status</th>
                <th scope="col" className={th}></th>
              </tr>
            </thead>
            <tbody>
              {faturas.map((fat) => (
                <tr key={fat.id}>
                  <td className={`${td} tabular whitespace-nowrap`}>{diaCurto(fat.vencimento)}</td>
                  <td className={td}>{fat.descricao || fat.competencia}</td>
                  <td className={`${td} tabular`}>{dinheiro(fat.valor)}</td>
                  <td className={td}>{rotuloStatusFatura[fat.status]}</td>
                  <td className={td}>
                    {fat.linkPagamento ? (
                      <a
                        href={fat.linkPagamento}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold text-magenta-texto hover:underline"
                      >
                        Fatura Asaas ↗
                      </a>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </Tabela>
        </Secao>
      ) : null}

      {podeEscrever ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <h3 className="font-display text-base font-bold tracking-[-0.02em]">
              Todo mês, sempre o mesmo valor
            </h3>
            <p className="max-w-[52ch] text-sm leading-relaxed text-cinza">
              É o fee de gestão. Vira contrato, e o painel passa a cobrar todo mês.
            </p>
            <FormContrato
              contaFixa={conta}
              bloqueado={
                semVigenciaAberta
                  ? undefined
                  : 'Já existe um contrato sem data de fim. Para mudar o valor, use "Reajustar" no contrato acima.'
              }
            />
          </div>

          <div className="space-y-3">
            <h3 className="font-display text-base font-bold tracking-[-0.02em]">
              Uma vez só
            </h3>
            <p className="max-w-[52ch] text-sm leading-relaxed text-cinza">
              Setup, projeto, criativo extra ou reembolso de mídia.
            </p>
            <FormCobrancaAvulsa contaFixa={conta} rotuloBotao="Cobrança única" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
