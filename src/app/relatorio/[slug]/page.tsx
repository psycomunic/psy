import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { buscarRelatorioExibido } from '@/lib/dados/consultas';
import { criativosDaContaPeriodo } from '@/lib/ingestao/criativos';
import { SerieMultinicho, BarrasCanal, type MedidaCanal } from '@/componentes/painel/Graficos';
import { GaleriaCriativos } from '@/componentes/painel/GaleriaCriativos';
import { Kpi } from '@/componentes/painel/base';
import {
  agregarPeriodo,
  configSerieDoPerfil,
  rotuloPerfilMetrica,
  rotuloObjetivoCampanha,
  avaliarResultadoCampanha,
  type PerfilMetricaEfetivo,
} from '@/lib/dominio/perfis-metrica';
import {
  dinheiro,
  dinheiroExato,
  contagemCurta,
  numero,
  porcento,
  vezes,
  diaCurto,
  diaLongo,
  nomeCanal,
} from '@/lib/formato';
import { marca } from '@/conteudo/marca';
import { whatsapp } from '@/conteudo/navegacao';
import { urlAbsoluta } from '@/conteudo/site';
import { BotaoImprimir } from './BotaoImprimir';

export const dynamic = 'force-dynamic';

function intervaloLegivel(de: string, ate: string) {
  const f = (iso: string) =>
    new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  return de === ate ? f(de) : `${f(de)} a ${f(ate)}`;
}

function dataEmissaoCurta(iso: string | null | undefined) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function medidasCanal(
  perfil: PerfilMetricaEfetivo,
  temReceitaNosCanais: boolean,
): {
  esq: { titulo: string; medida: MedidaCanal };
  dir: { titulo: string; medida: MedidaCanal };
} {
  if (perfil === 'ecommerce') {
    return {
      esq: { titulo: 'Receita aprovada por canal', medida: 'receita' },
      dir: { titulo: 'ROAS por canal', medida: 'roas' },
    };
  }
  if (perfil === 'vendas_midia') {
    return {
      esq: { titulo: 'Investimento por canal', medida: 'investimento' },
      dir: { titulo: 'ROAS atribuído por canal', medida: 'roas' },
    };
  }
  if (temReceitaNosCanais) {
    return {
      esq: { titulo: 'Investimento em mídia por origem', medida: 'investimento' },
      dir: { titulo: 'Receita confirmada por origem', medida: 'receita' },
    };
  }
  if (perfil === 'leads') {
    return {
      esq: { titulo: 'Investimento por canal', medida: 'investimento' },
      dir: { titulo: 'Leads por canal', medida: 'leads' },
    };
  }
  if (perfil === 'branding') {
    return {
      esq: { titulo: 'Investimento por canal', medida: 'investimento' },
      dir: { titulo: 'Cliques por canal', medida: 'cliques' },
    };
  }
  return {
    esq: { titulo: 'Investimento por canal', medida: 'investimento' },
    dir: { titulo: 'Conversas iniciadas por canal', medida: 'conversas' },
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const r = await buscarRelatorioExibido(slug);
  const robots = { index: false, follow: false, nocache: true } as const;

  if (!r) return { title: 'Relatório', robots };

  const periodo = intervaloLegivel(r.periodoDe, r.periodoAte);
  const titulo = `${r.cliente} · Relatório (${periodo})`;
  const descricao = `Relatório executivo de desempenho preparado pela Psy Comunic referente ao período de ${periodo}.`;

  return {
    title: titulo,
    description: descricao,
    robots,
    openGraph: {
      type: 'article',
      locale: 'pt_BR',
      siteName: marca.nome,
      title: titulo,
      description: descricao,
      url: urlAbsoluta(`/relatorio/${slug}`),
    },
    twitter: {
      card: 'summary_large_image',
      title: titulo,
      description: descricao,
    },
  };
}

export default async function PaginaRelatorioPublico({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const r = await buscarRelatorioExibido(slug);
  if (!r) notFound();

  const mostrar = (b: (typeof r.blocosVisiveis)[number]) => r.blocosVisiveis.includes(b);
  const periodo = intervaloLegivel(r.periodoDe, r.periodoAte);
  const diasPeriodo = Math.max(
    1,
    Math.round(
      (Date.parse(`${r.periodoAte}T00:00:00Z`) - Date.parse(`${r.periodoDe}T00:00:00Z`)) /
        86400000,
    ) + 1,
  );
  const rotuloComparacao = `vs. ${diasPeriodo} ${diasPeriodo === 1 ? 'dia anterior' : 'dias antes'}`;

  /* Filtra canais 100% zerados (ex.: hospedi_ota sem Airbnb no período) para não poluir o PDF */
  const canaisAtivos = r.snapshot.canais.filter(
    (c) =>
      c.investimento > 0 ||
      c.receita > 0 ||
      c.pedidos > 0 ||
      c.conversas > 0 ||
      c.leadsCaptados > 0 ||
      c.impressoes > 0 ||
      c.cliquesLink > 0,
  );
  const temReceitaNosCanais = canaisAtivos.some((c) => c.receita > 0);
  const cfgSerie = configSerieDoPerfil(r.perfilMetrica);
  const cfgCanais = medidasCanal(r.perfilMetrica, temReceitaNosCanais);

  /* Renova miniaturas ao vivo quando possível (evita link expirado em relatórios antigos) */
  let criativosExibidos = r.snapshot.criativos ?? [];
  if (r.contaId && (mostrar('criativos') || criativosExibidos.length > 0)) {
    const aoVivo = await criativosDaContaPeriodo(r.contaId, r.periodoDe, r.periodoAte);
    if (aoVivo.length > 0) criativosExibidos = aoVivo;
  }

  /* Síntese inteligente de apoio caso o relatório tenha sido salvo com texto genérico curto */
  const agregado = agregarPeriodo(r.snapshot.serie);
  const com = r.resultadoComercial;
  const roasComercial =
    com?.receitaFechada && r.snapshot.investimentoTotal > 0
      ? Number((com.receitaFechada / r.snapshot.investimentoTotal).toFixed(2))
      : null;
  const cacComercial =
    com?.vendasFechadas && com.vendasFechadas > 0 && r.snapshot.investimentoTotal > 0
      ? Number((r.snapshot.investimentoTotal / com.vendasFechadas).toFixed(2))
      : null;
  const ticketComercial =
    com?.receitaFechada && com?.vendasFechadas && com.vendasFechadas > 0
      ? Number((com.receitaFechada / com.vendasFechadas).toFixed(2))
      : null;

  const textoPadraoAntigo = /^Acompanhamento consolidado|^Consolidado dos indicadores/i.test(
    r.resumoExecutivo.trim(),
  );
  const narrativaExecutiva =
    r.resumoExecutivo && !textoPadraoAntigo
      ? r.resumoExecutivo
      : [
          agregado.investimento > 0
            ? `Entre ${r.periodoDe.split('-').reverse().join('/')} e ${r.periodoAte.split('-').reverse().join('/')} (${diasPeriodo} dias), foram investidos ${dinheiroExato(agregado.investimento)} em mídia paga, impactando ${contagemCurta(agregado.alcance > 0 ? agregado.alcance : agregado.impressoes)} ${agregado.alcance > 0 ? 'pessoas únicas' : 'impressões'} e gerando ${numero(agregado.cliquesLink)} cliques qualificados (CTR médio de ${porcento(agregado.ctr, 2)}).`
            : r.resumoExecutivo,
          r.perfilMetrica === 'whatsapp' && agregado.conversas > 0
            ? `A operação iniciou ${numero(agregado.conversas)} conversas de atendimento direto ao custo médio de ${dinheiroExato(agregado.custoConversa)} por conversa.`
            : r.perfilMetrica === 'leads' && agregado.leadsCaptados > 0
              ? `Foram captados ${numero(agregado.leadsCaptados)} leads ao custo médio (CPL) de ${dinheiroExato(agregado.cpl)}.`
              : null,
          com?.receitaFechada
            ? `Cruzando com o fechamento comercial, foram confirmadas ${com.vendasFechadas ? `${numero(com.vendasFechadas)} reservas/vendas totalizando ` : ''}${dinheiro(com.receitaFechada)}${roasComercial ? `, entregando retorno real (ROAS) de ${vezes(roasComercial)}` : ''}.`
            : null,
        ]
          .filter(Boolean)
          .join(' ');

  /* Estatísticas diárias estáticas para enriquecer o gráfico quando impresso em PDF */
  const melhorDia =
    r.snapshot.serie.length > 0
      ? [...r.snapshot.serie].sort(
          (a, b) => cfgSerie.extrairResultado(b) - cfgSerie.extrairResultado(a),
        )[0]
      : null;
  const totalResultadoSerie = r.snapshot.serie.reduce(
    (s, d) => s + cfgSerie.extrairResultado(d),
    0,
  );
  const mediaResultadoDia =
    r.snapshot.serie.length > 0 ? totalResultadoSerie / r.snapshot.serie.length : 0;
  const mediaInvestimentoDia =
    r.snapshot.serie.length > 0 ? agregado.investimento / r.snapshot.serie.length : 0;

  const nomeArquivoPdf = `Relatorio - ${r.cliente} (${r.periodoDe.split('-').reverse().join('-')} a ${r.periodoAte.split('-').reverse().join('-')})`;
  const whatsappHref = `https://wa.me/${whatsapp.numero}?text=${encodeURIComponent(`Olá! Acabei de abrir o relatório de desempenho (${r.cliente} · ${periodo}) e gostaria de conversar sobre os números.`)}`;

  return (
    <div className="documento-relatorio relative min-h-screen bg-marinho-fundo text-branco transition-colors">
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden print:hidden">
        <div className="grade absolute inset-0 opacity-35" />
        <div className="brilho-magenta absolute -right-[18%] -top-[24%] h-[620px] w-[620px] opacity-[0.16]" />
      </div>

      <main className="folha-relatorio relative z-10 mx-auto max-w-5xl px-6 py-10 md:my-8 md:px-12 md:py-12">
        {r.rascunhoInterno ? (
          <div className="mb-6 rounded-xl border border-[#FBBF24]/45 bg-[#FBBF24]/10 px-4 py-3 text-xs text-neve print:hidden">
            <strong className="text-branco">Pré-visualização de rascunho interno.</strong> Você já
            pode baixar o PDF para conferência; clique em <em>Publicar</em> na tela de Relatórios
            quando quiser liberar este link externo para o cliente.
          </div>
        ) : null}

        {/* Barra superior institucional + controles de exportação */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-fio pb-6">
          <div className="flex items-center gap-3.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-magenta font-display text-sm font-extrabold tracking-tight text-[#FFFFFF]">
              PSY
            </div>
            <div>
              <p className="font-display text-base font-extrabold tracking-[-0.03em] text-branco">
                Psy Comunic
              </p>
              <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-cinza">
                Relatório Executivo de Performance
              </p>
            </div>
          </div>

          <div className="hidden text-right font-mono text-[0.65rem] uppercase tracking-[0.14em] text-cinza print:block">
            <p>Período: {periodo}</p>
            <p>
              Emitido em {dataEmissaoCurta(r.publicadoEm ?? r.criadoEm) ?? '—'} · Versão {r.versao}
            </p>
          </div>

          <BotaoImprimir nomeArquivoPdf={nomeArquivoPdf} whatsappHref={whatsappHref} />
        </div>

        {/* Capa / Cabeçalho executivo do documento */}
        <header className="mt-8 border-b border-fio pb-8 print:mt-6 print:pb-6">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="rounded-full border border-magenta/40 bg-magenta/10 px-3.5 py-1 font-mono text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-magenta-texto">
              {periodo} ({diasPeriodo} {diasPeriodo === 1 ? 'dia' : 'dias'})
            </span>
            <span className="rounded-full border border-fio bg-white/[0.03] px-3.5 py-1 font-mono text-[0.7rem] uppercase tracking-[0.14em] text-cinza">
              {rotuloPerfilMetrica[r.perfilMetrica]}
            </span>
            {r.segmento ? (
              <span className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-cinza">
                · {r.segmento}
              </span>
            ) : null}
          </div>

          <div className="mt-5 flex flex-wrap items-end justify-between gap-6">
            <div>
              <h1 className="font-display text-3xl font-extrabold tracking-[-0.04em] text-branco sm:text-4xl print:text-3xl">
                {r.cliente}
              </h1>
              <p className="mt-1.5 text-base text-neve print:text-sm">
                {r.titulo}
                {r.contato ? (
                  <span className="text-cinza"> · Aos cuidados de {r.contato}</span>
                ) : null}
              </p>
            </div>

            <dl className="flex flex-wrap gap-6 text-xs print:hidden">
              <div>
                <dt className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-cinza">
                  Emissão
                </dt>
                <dd className="tabular mt-0.5 font-semibold text-neve">
                  {dataEmissaoCurta(r.publicadoEm ?? r.criadoEm) ?? 'Hoje'}
                </dd>
              </div>
              <div>
                <dt className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-cinza">
                  Revisão
                </dt>
                <dd className="tabular mt-0.5 font-semibold text-neve">v{r.versao}</dd>
              </div>
            </dl>
          </div>

          {narrativaExecutiva ? (
            <div className="cartao bloco-indivisivel mt-6 border-l-4 border-l-magenta p-5 print:mt-4 print:p-4">
              <h2 className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-magenta-texto">
                Síntese executiva do período
              </h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-neve print:text-xs">
                {narrativaExecutiva}
              </p>
            </div>
          ) : null}
        </header>

        {/* Bloco 1: Resultado Comercial Consolidado (Hospedi / Vendas Reais) */}
        {com && (com.receitaFechada || com.vendasFechadas || com.observacao) ? (
          <section className="mt-10 print:mt-7">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <h2 className="font-display text-xl font-extrabold tracking-[-0.03em] text-branco print:text-lg">
                  Resultado comercial consolidado
                </h2>
                <p className="mt-0.5 text-xs text-cinza">
                  Cruzamento direto entre o investimento em anúncios e os fechamentos confirmados.
                </p>
              </div>
            </div>

            <div className="bloco-indivisivel mt-4 rounded-2xl border border-[#16A34A]/35 bg-[#16A34A]/[0.06] p-6 print:p-4">
              <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 print:grid-cols-4">
                <div>
                  <dt className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-cinza">
                    Investimento em mídia
                  </dt>
                  <dd className="tabular mt-1.5 font-display text-2xl font-extrabold text-branco print:text-xl">
                    {dinheiroExato(r.snapshot.investimentoTotal)}
                  </dd>
                  <p className="mt-1 text-[0.7rem] text-cinza">
                    Média de {dinheiroExato(mediaInvestimentoDia)}/dia
                  </p>
                </div>

                {com.vendasFechadas ? (
                  <div className="sm:border-l sm:border-fio sm:pl-5">
                    <dt className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-cinza">
                      {com.rotuloVenda || 'Fechamentos'}
                    </dt>
                    <dd className="tabular mt-1.5 font-display text-2xl font-extrabold text-branco print:text-xl">
                      {numero(com.vendasFechadas)}
                    </dd>
                    {ticketComercial ? (
                      <p className="mt-1 text-[0.7rem] text-cinza">
                        Ticket médio: {dinheiro(ticketComercial)}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {com.receitaFechada ? (
                  <div className="lg:border-l lg:border-fio lg:pl-5">
                    <dt className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-cinza">
                      Receita gerada
                    </dt>
                    <dd className="tabular mt-1.5 font-display text-2xl font-extrabold text-[#16A34A] print:text-xl">
                      {dinheiro(com.receitaFechada)}
                    </dd>
                    <p className="mt-1 text-[0.7rem] text-cinza">Faturamento confirmado</p>
                  </div>
                ) : null}

                {roasComercial !== null || cacComercial !== null ? (
                  <div className="sm:border-l sm:border-fio sm:pl-5">
                    <dt className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-cinza">
                      {roasComercial !== null ? 'ROAS Comercial Real' : 'Custo por Fechamento'}
                    </dt>
                    <dd className="tabular mt-1.5 font-display text-2xl font-extrabold text-branco print:text-xl">
                      {roasComercial !== null
                        ? vezes(roasComercial)
                        : dinheiroExato(cacComercial)}
                    </dd>
                    {cacComercial !== null && roasComercial !== null ? (
                      <p className="mt-1 text-[0.7rem] text-cinza">
                        Custo por fechamento: {dinheiroExato(cacComercial)}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </dl>

              {com.observacao ? (
                <p className="mt-4 border-t border-fio pt-3 text-xs text-cinza">
                  {com.observacao}
                </p>
              ) : null}
            </div>
          </section>
        ) : null}

        {/* Bloco 2: Indicadores principais */}
        {mostrar('kpis') && r.snapshot.cartoes.length > 0 ? (
          <section className="mt-10 print:mt-7">
            <h2 className="font-display text-xl font-extrabold tracking-[-0.03em] text-branco print:text-lg">
              Indicadores principais de mídia
            </h2>
            <p className="mt-0.5 text-xs text-cinza">
              Comparação direta contra o período imediatamente anterior ({diasPeriodo}{' '}
              {diasPeriodo === 1 ? 'dia' : 'dias'}).
            </p>
            <div className="mt-4 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-3 print:gap-2.5">
              {r.snapshot.cartoes.map((k) => (
                <Kpi
                  key={k.chave}
                  rotulo={k.rotulo}
                  valor={k.valor}
                  apoio={k.apoio}
                  variacao={k.variacao}
                  invertido={k.invertido}
                  rotuloComparacao={rotuloComparacao}
                />
              ))}
            </div>
          </section>
        ) : null}

        {/* Bloco 3: Funil de conversão */}
        {mostrar('funil') && r.snapshot.funil.etapas.length > 0 ? (
          <section className="mt-10 print:mt-7">
            <h2 className="font-display text-xl font-extrabold tracking-[-0.03em] text-branco print:text-lg">
              {r.snapshot.funil.titulo}
            </h2>
            <p className="mt-0.5 text-xs text-cinza">{r.snapshot.funil.apoio}</p>
            <div className="cartao bloco-indivisivel mt-4 p-6 print:p-4">
              <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 print:grid-cols-4 print:gap-4">
                {r.snapshot.funil.etapas.map((e, i) => (
                  <li key={e.rotulo} className={i > 0 ? 'sm:border-l sm:border-fio sm:pl-5 print:border-l print:border-fio print:pl-4' : ''}>
                    <p className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-cinza">
                      <span className="mr-1.5 text-magenta-texto">0{i + 1}</span>
                      {e.rotulo}
                    </p>
                    <p className="tabular mt-1.5 font-display text-2xl font-extrabold tracking-[-0.03em] text-branco print:text-xl">
                      {e.valor}
                    </p>
                    <p className="mt-1 text-xs text-cinza print:text-[0.68rem]">{e.apoio}</p>
                  </li>
                ))}
              </ol>
              {r.snapshot.funil.alerta ? (
                <p className="mt-5 border-t border-fio pt-4 text-xs leading-relaxed text-neve">
                  <strong className="text-magenta-texto">{r.snapshot.funil.alerta.destaque}</strong>{' '}
                  {r.snapshot.funil.alerta.corpo}
                </p>
              ) : null}
            </div>
          </section>
        ) : null}

        {/* Bloco 4: Evolução diária + Destaques estáticos para impressão */}
        {mostrar('serie') && r.snapshot.serie.length > 1 ? (
          <section className="mt-10 print:mt-7">
            <h2 className="font-display text-xl font-extrabold tracking-[-0.03em] text-branco print:text-lg">
              {cfgSerie.titulo}
            </h2>
            <p className="mt-0.5 text-xs text-cinza">{cfgSerie.apoio}</p>
            <div className="cartao bloco-indivisivel mt-4 p-6 print:p-4">
              <SerieMultinicho
                serie={r.snapshot.serie}
                modo={cfgSerie.modo}
                rotuloResultado={cfgSerie.rotuloResultado}
                perfil={r.perfilMetrica}
                marcos={r.snapshot.marcos}
              />

              <dl className="mt-5 grid gap-4 border-t border-fio pt-4 text-xs sm:grid-cols-3 print:grid-cols-3">
                <div>
                  <dt className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-cinza">
                    Pico no período
                  </dt>
                  <dd className="tabular mt-0.5 font-semibold text-branco">
                    {melhorDia
                      ? `${cfgSerie.modo === 'moeda_dupla' ? dinheiro(cfgSerie.extrairResultado(melhorDia)) : numero(cfgSerie.extrairResultado(melhorDia))} em ${diaCurto(melhorDia.dia)}`
                      : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-cinza">
                    Média diária ({cfgSerie.rotuloResultado.toLowerCase()})
                  </dt>
                  <dd className="tabular mt-0.5 font-semibold text-branco">
                    {cfgSerie.modo === 'moeda_dupla'
                      ? dinheiroExato(mediaResultadoDia)
                      : mediaResultadoDia.toFixed(1).replace('.', ',')}
                    /dia
                  </dd>
                </div>
                <div>
                  <dt className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-cinza">
                    Ritmo médio de investimento
                  </dt>
                  <dd className="tabular mt-0.5 font-semibold text-branco">
                    {dinheiroExato(mediaInvestimentoDia)}/dia
                  </dd>
                </div>
              </dl>
            </div>
          </section>
        ) : null}

        {/* Bloco 5: Criativos em veiculação */}
        {mostrar('criativos') && criativosExibidos.length > 0 ? (
          <section className="mt-10 print:mt-7">
            <h2 className="font-display text-xl font-extrabold tracking-[-0.03em] text-branco print:text-lg">
              Criativos em destaque no período
            </h2>
            <p className="mt-0.5 text-xs text-cinza">
              Peças ativas e anúncios com maior contribuição nos resultados do período.
            </p>
            <div className="mt-4">
              <GaleriaCriativos criativos={criativosExibidos.slice(0, 9)} somenteLeitura />
            </div>
          </section>
        ) : null}

        {/* Bloco 6: Desempenho por campanha (tabela calibrada para caber inteira na folha A4) */}
        {mostrar('campanhas') && r.snapshot.campanhas.length > 0 ? (
          <section className="mt-10 print:mt-7">
            <h2 className="font-display text-xl font-extrabold tracking-[-0.03em] text-branco print:text-lg">
              Detalhamento por campanha
            </h2>
            <p className="mt-0.5 text-xs text-cinza">
              Investimento, volume de tráfego e eficiência individual de cada campanha ativa no período.
            </p>
            <div className="mt-4 overflow-x-auto rounded-2xl border border-fio">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-fio bg-white/[0.02]">
                    <th scope="col" className="px-4 py-3 font-mono text-[0.68rem] uppercase tracking-[0.12em] font-normal text-cinza">
                      Campanha
                    </th>
                    <th scope="col" className="px-3 py-3 font-mono text-[0.68rem] uppercase tracking-[0.12em] font-normal text-cinza">
                      Objetivo
                    </th>
                    <th scope="col" className="px-3 py-3 text-right font-mono text-[0.68rem] uppercase tracking-[0.12em] font-normal text-cinza">
                      Investido
                    </th>
                    <th scope="col" className="px-3 py-3 text-right font-mono text-[0.68rem] uppercase tracking-[0.12em] font-normal text-cinza">
                      Alcance
                    </th>
                    <th scope="col" className="px-3 py-3 text-right font-mono text-[0.68rem] uppercase tracking-[0.12em] font-normal text-cinza">
                      Cliques (CTR)
                    </th>
                    <th scope="col" className="px-3 py-3 text-right font-mono text-[0.68rem] uppercase tracking-[0.12em] font-normal text-cinza">
                      Resultado
                    </th>
                    <th scope="col" className="px-4 py-3 text-right font-mono text-[0.68rem] uppercase tracking-[0.12em] font-normal text-cinza">
                      Custo / Eficiência
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {r.snapshot.campanhas.map((c) => {
                    const av = avaliarResultadoCampanha(c);
                    return (
                      <tr key={`${c.provedor}-${c.campanhaId}`} className="border-t border-fio">
                        <th scope="row" className="max-w-[15rem] px-4 py-3 font-normal break-words">
                          <span className="block font-semibold text-branco leading-snug">
                            {c.campanhaNome}
                          </span>
                          <span className="mt-0.5 block font-mono text-[0.62rem] uppercase tracking-[0.1em] text-cinza">
                            {nomeCanal(c.canal)}
                          </span>
                        </th>
                        <td className="px-3 py-3 text-neve">
                          {rotuloObjetivoCampanha[c.objetivo]}
                        </td>
                        <td className="tabular px-3 py-3 text-right font-semibold text-branco whitespace-nowrap">
                          {dinheiroExato(c.investimento)}
                        </td>
                        <td className="tabular px-3 py-3 text-right whitespace-nowrap">
                          <span className="text-neve">{c.alcance > 0 ? contagemCurta(c.alcance) : '—'}</span>
                          <span className="block text-[0.65rem] text-cinza">{contagemCurta(c.impressoes)} impr.</span>
                        </td>
                        <td className="tabular px-3 py-3 text-right whitespace-nowrap">
                          <span className="text-neve">{numero(c.cliquesLink)}</span>
                          <span className="block text-[0.65rem] text-cinza">{porcento(c.ctr, 2)}</span>
                        </td>
                        <td className="tabular px-3 py-3 text-right whitespace-nowrap">
                          <span className="font-semibold text-branco">{av.resultado}</span>
                          <span className="block text-[0.65rem] text-cinza">{av.unidade}</span>
                        </td>
                        <td className="tabular px-4 py-3 text-right whitespace-nowrap">
                          <span className="font-semibold text-neve">{av.custoOuRetorno}</span>
                          <span className="block text-[0.65rem] text-cinza">{av.rotuloCusto}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {/* Bloco 7: Distribuição por canal */}
        {mostrar('canais') && canaisAtivos.length > 0 ? (
          <section className="mt-10 print:mt-7">
            <h2 className="font-display text-xl font-extrabold tracking-[-0.03em] text-branco print:text-lg">
              Distribuição por origem
            </h2>
            <div className="mt-4 grid gap-4 lg:grid-cols-2 print:grid-cols-2">
              <div className="cartao bloco-indivisivel p-6 print:p-4">
                <h3 className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-cinza">
                  {cfgCanais.esq.titulo}
                </h3>
                <div className="mt-4">
                  <BarrasCanal
                    canais={canaisAtivos.filter((c) =>
                      cfgCanais.esq.medida === 'investimento' ? c.investimento > 0 : true,
                    )}
                    medida={cfgCanais.esq.medida}
                  />
                </div>
              </div>
              <div className="cartao bloco-indivisivel p-6 print:p-4">
                <h3 className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-cinza">
                  {cfgCanais.dir.titulo}
                </h3>
                <div className="mt-4">
                  <BarrasCanal
                    canais={canaisAtivos.filter((c) => {
                      if (cfgCanais.dir.medida === 'receita') return c.receita > 0;
                      if (cfgCanais.dir.medida === 'conversas') return c.conversas > 0;
                      if (cfgCanais.dir.medida === 'leads') return c.leadsCaptados > 0;
                      return true;
                    })}
                    medida={cfgCanais.dir.medida}
                  />
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {/* Bloco 8: Ações executadas e Próximos passos */}
        {r.acoesExecutadas.length > 0 || r.proximosPassos.length > 0 || (mostrar('marcos') && r.snapshot.marcos.length > 0) ? (
          <section className="mt-10 grid gap-4 lg:grid-cols-2 print:mt-7 print:grid-cols-2">
            {r.acoesExecutadas.length > 0 ? (
              <div className="cartao bloco-indivisivel p-6 print:p-4">
                <h2 className="font-display text-lg font-extrabold tracking-[-0.02em] text-branco">
                  Ações executadas no período
                </h2>
                <ul className="mt-3 space-y-2.5 text-xs leading-relaxed text-neve">
                  {r.acoesExecutadas.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span aria-hidden className="mt-0.5 text-magenta-texto">●</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : mostrar('marcos') && r.snapshot.marcos.length > 0 ? (
              <div className="cartao bloco-indivisivel p-6 print:p-4">
                <h2 className="font-display text-lg font-extrabold tracking-[-0.02em] text-branco">
                  Diário de bordo da operação
                </h2>
                <ul className="mt-3 space-y-2.5 text-xs leading-relaxed text-neve">
                  {r.snapshot.marcos.map((m) => (
                    <li key={m.id} className="flex items-start gap-2.5">
                      <span className="shrink-0 font-mono text-[0.68rem] text-magenta-texto">
                        {diaLongo(m.dia)}
                      </span>
                      <span>
                        <strong className="text-branco">{m.titulo}</strong>
                        {m.detalhe ? ` · ${m.detalhe}` : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {r.proximosPassos.length > 0 ? (
              <div className="cartao bloco-indivisivel p-6 print:p-4">
                <h2 className="font-display text-lg font-extrabold tracking-[-0.02em] text-branco">
                  Próximos passos planejados
                </h2>
                <ol className="mt-3 space-y-2.5 text-xs leading-relaxed text-neve">
                  {r.proximosPassos.map((passo, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="shrink-0 font-mono text-[0.68rem] font-semibold text-magenta-texto">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span>{passo}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}
          </section>
        ) : null}

        <footer className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-fio pt-6 text-xs text-cinza print:mt-8 print:pt-4">
          <p>
            Documento preparado pela <strong className="text-neve">Psy Comunic</strong> · Gestão de
            Tráfego e Performance · Versão {r.versao}
          </p>
          <p className="font-mono text-[0.68rem]">psycomunic.com.br</p>
        </footer>
      </main>
    </div>
  );
}
