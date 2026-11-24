import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { buscarRelatorioPublico } from '@/lib/dados/consultas';
import { SerieMultinicho, BarrasCanal, type MedidaCanal } from '@/componentes/painel/Graficos';
import { GaleriaCriativos } from '@/componentes/painel/GaleriaCriativos';
import { Kpi, Tabela, th, td } from '@/componentes/painel/base';
import {
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

function medidasCanal(perfil: PerfilMetricaEfetivo): {
  esq: { titulo: string; medida: MedidaCanal };
  dir: { titulo: string; medida: MedidaCanal };
} {
  switch (perfil) {
    case 'ecommerce':
      return {
        esq: { titulo: 'Receita aprovada por canal', medida: 'receita' },
        dir: { titulo: 'ROAS por canal', medida: 'roas' },
      };
    case 'vendas_midia':
      return {
        esq: { titulo: 'Investimento por canal', medida: 'investimento' },
        dir: { titulo: 'ROAS atribuído por canal', medida: 'roas' },
      };
    case 'leads':
      return {
        esq: { titulo: 'Investimento por canal', medida: 'investimento' },
        dir: { titulo: 'Leads por canal', medida: 'leads' },
      };
    case 'branding':
      return {
        esq: { titulo: 'Investimento por canal', medida: 'investimento' },
        dir: { titulo: 'Cliques por canal', medida: 'cliques' },
      };
    default:
      return {
        esq: { titulo: 'Investimento por canal', medida: 'investimento' },
        dir: { titulo: 'Conversas por canal', medida: 'conversas' },
      };
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const r = await buscarRelatorioPublico(slug);
  const robots = { index: false, follow: false, nocache: true } as const;

  if (!r) return { title: 'Relatório', robots };

  const periodo = intervaloLegivel(r.periodoDe, r.periodoAte);
  const titulo = `${r.cliente} · Relatório (${periodo})`;
  /* Sem números de verba nem receita na descrição OpenGraph para não
     expor valores na miniatura quando o link é encaminhado em grupos. */
  const descricao = `Relatório de desempenho preparado pela Psy Comunic referente ao período de ${periodo}.`;

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
  const r = await buscarRelatorioPublico(slug);
  if (!r) notFound();

  const mostrar = (b: (typeof r.blocosVisiveis)[number]) => r.blocosVisiveis.includes(b);
  const cfgSerie = configSerieDoPerfil(r.perfilMetrica);
  const cfgCanais = medidasCanal(r.perfilMetrica);
  const periodo = intervaloLegivel(r.periodoDe, r.periodoAte);

  const com = r.resultadoComercial;
  const roasComercial =
    com?.receitaFechada && r.snapshot.investimentoTotal > 0
      ? Number((com.receitaFechada / r.snapshot.investimentoTotal).toFixed(2))
      : null;
  const cacComercial =
    com?.vendasFechadas && com.vendasFechadas > 0 && r.snapshot.investimentoTotal > 0
      ? Number((r.snapshot.investimentoTotal / com.vendasFechadas).toFixed(2))
      : null;

  return (
    <div className="relative min-h-screen bg-marinho-fundo text-branco [print-color-adjust:exact] [-webkit-print-color-adjust:exact]">
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden print:hidden">
        <div className="grade absolute inset-0 opacity-40" />
        <div className="brilho-magenta absolute -right-[18%] -top-[24%] h-[620px] w-[620px] opacity-[0.18]" />
      </div>

      <main className="relative z-10 mx-auto max-w-6xl px-6 py-10 md:px-10 md:py-14 print:max-w-none print:px-6 print:py-4">
        {/* Barra superior institucional */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-fio pb-6">
          <div className="flex items-center gap-3">
            <span className="font-display text-xl font-extrabold tracking-[-0.04em] text-branco">
              PSY
            </span>
            <span className="h-4 w-px bg-fio" aria-hidden />
            <span className="font-mono text-xs uppercase tracking-[0.22em] text-cinza">
              Comunic · Relatório de Desempenho
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 print:hidden">
            <BotaoImprimir />
            <a
              href={`https://wa.me/${whatsapp.numero}?text=${encodeURIComponent(`Olá! Acabei de abrir o relatório de desempenho (${r.cliente} · ${periodo}) e gostaria de conversar sobre os números.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-fio px-5 py-2.5 text-sm text-neve transition-colors hover:bg-white/[0.06]"
            >
              Falar com a equipe
            </a>
          </div>
        </div>

        {/* Capa / Cabeçalho executivo */}
        <header className="mt-10 space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-magenta/40 bg-magenta/10 px-3.5 py-1 font-mono text-[0.72rem] uppercase tracking-[0.14em] text-magenta-texto">
              {periodo}
            </span>
            <span className="rounded-full border border-fio bg-white/[0.03] px-3.5 py-1 font-mono text-[0.72rem] uppercase tracking-[0.14em] text-cinza">
              {rotuloPerfilMetrica[r.perfilMetrica]}
            </span>
            {r.segmento ? (
              <span className="font-mono text-[0.72rem] uppercase tracking-[0.14em] text-cinza">
                · {r.segmento}
              </span>
            ) : null}
          </div>

          <h1 className="font-display text-4xl font-extrabold tracking-[-0.04em] sm:text-5xl">
            {r.cliente}
          </h1>

          <p className="text-lg text-neve">
            {r.titulo}
            {r.contato ? (
              <span className="text-cinza"> · Aos cuidados de {r.contato}</span>
            ) : null}
          </p>

          {r.resumoExecutivo ? (
            <div className="cartao max-w-[78ch] p-6">
              <h2 className="font-display text-base font-bold text-branco">Leitura do período</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-neve">
                {r.resumoExecutivo}
              </p>
            </div>
          ) : null}
        </header>

        {/* Bloco de fechamento comercial real (quando preenchido) */}
        {com && (com.receitaFechada || com.vendasFechadas || com.observacao) ? (
          <section className="mt-12 break-inside-avoid">
            <h2 className="font-display text-2xl font-extrabold tracking-[-0.03em]">
              Resultado comercial consolidado
            </h2>
            <p className="mt-1 text-sm text-cinza">
              Cruzamento entre o investimento nas campanhas e os fechamentos confirmados no atendimento.
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Kpi rotulo="Investimento em mídia" valor={dinheiro(r.snapshot.investimentoTotal)} />
              {com.vendasFechadas ? (
                <Kpi
                  rotulo={com.rotuloVenda || 'Fechamentos realizados'}
                  valor={numero(com.vendasFechadas)}
                />
              ) : null}
              {com.receitaFechada ? (
                <Kpi rotulo="Receita comercial gerada" valor={dinheiro(com.receitaFechada)} />
              ) : null}
              {roasComercial !== null ? (
                <Kpi
                  rotulo="Retorno comercial (ROAS)"
                  valor={vezes(roasComercial)}
                  apoio={
                    cacComercial !== null
                      ? `Custo de aquisição real: ${dinheiroExato(cacComercial)}`
                      : 'Receita gerada ÷ investimento em mídia'
                  }
                />
              ) : cacComercial !== null ? (
                <Kpi
                  rotulo="Custo por fechamento (CAC)"
                  valor={dinheiroExato(cacComercial)}
                  apoio="Investimento em mídia ÷ fechamentos"
                />
              ) : null}
            </div>
            {com.observacao ? (
              <p className="mt-3 text-xs text-cinza">{com.observacao}</p>
            ) : null}
          </section>
        ) : null}

        {/* Indicadores principais */}
        {mostrar('kpis') && r.snapshot.cartoes.length > 0 ? (
          <section className="mt-12 break-inside-avoid">
            <h2 className="font-display text-2xl font-extrabold tracking-[-0.03em]">
              Indicadores principais
            </h2>
            <p className="mt-1 text-sm text-cinza">
              Variações calculadas frente ao período imediatamente anterior de mesma duração.
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {r.snapshot.cartoes.map((k) => (
                <Kpi
                  key={k.chave}
                  rotulo={k.rotulo}
                  valor={k.valor}
                  apoio={k.apoio}
                  variacao={k.variacao}
                  invertido={k.invertido}
                />
              ))}
            </div>
          </section>
        ) : null}

        {/* Funil */}
        {mostrar('funil') && r.snapshot.funil.etapas.length > 0 ? (
          <section className="mt-12 break-inside-avoid">
            <h2 className="font-display text-2xl font-extrabold tracking-[-0.03em]">
              {r.snapshot.funil.titulo}
            </h2>
            <p className="mt-1 text-sm text-cinza">{r.snapshot.funil.apoio}</p>
            <div className="cartao mt-5 p-7">
              <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {r.snapshot.funil.etapas.map((e, i) => (
                  <li key={e.rotulo} className={i > 0 ? 'sm:border-l sm:border-fio sm:pl-6' : ''}>
                    <p className="font-mono text-[0.75rem] uppercase tracking-[0.14em] text-cinza">
                      {e.rotulo}
                    </p>
                    <p className="tabular mt-2 font-display text-2xl font-extrabold tracking-[-0.03em]">
                      {e.valor}
                    </p>
                    <p className="mt-1.5 text-xs text-cinza">{e.apoio}</p>
                  </li>
                ))}
              </ol>
              {r.snapshot.funil.alerta ? (
                <p className="mt-6 border-t border-fio pt-5 text-sm leading-relaxed text-neve">
                  <strong className="text-magenta-texto">{r.snapshot.funil.alerta.destaque}</strong>{' '}
                  {r.snapshot.funil.alerta.corpo}
                </p>
              ) : null}
            </div>
          </section>
        ) : null}

        {/* Gráfico de evolução */}
        {mostrar('serie') && r.snapshot.serie.length > 1 ? (
          <section className="mt-12 break-inside-avoid">
            <h2 className="font-display text-2xl font-extrabold tracking-[-0.03em]">
              {cfgSerie.titulo}
            </h2>
            <p className="mt-1 text-sm text-cinza">{cfgSerie.apoio}</p>
            <div className="cartao mt-5 p-7">
              <SerieMultinicho
                serie={r.snapshot.serie}
                modo={cfgSerie.modo}
                rotuloResultado={cfgSerie.rotuloResultado}
                perfil={r.perfilMetrica}
                marcos={r.snapshot.marcos}
              />
            </div>
          </section>
        ) : null}

        {/* Criativos */}
        {mostrar('criativos') && (r.snapshot.criativos?.length ?? 0) > 0 ? (
          <section className="mt-12 break-inside-avoid">
            <h2 className="font-display text-2xl font-extrabold tracking-[-0.03em]">
              Criativos em veiculação
            </h2>
            <p className="mt-1 text-sm text-cinza">
              Anúncios ativos e criativos que entregaram resultado no período avaliado.
            </p>
            <div className="mt-5">
              <GaleriaCriativos criativos={r.snapshot.criativos!} somenteLeitura />
            </div>
          </section>
        ) : null}

        {/* Campanhas */}
        {mostrar('campanhas') && r.snapshot.campanhas.length > 0 ? (
          <section className="mt-12 break-inside-avoid">
            <h2 className="font-display text-2xl font-extrabold tracking-[-0.03em]">
              Desempenho por campanha
            </h2>
            <p className="mt-1 text-sm text-cinza">
              Detalhamento de verba, tráfego e resultado por objetivo de cada campanha ativa no período.
            </p>
            <div className="mt-5">
              <Tabela>
                <thead>
                  <tr>
                    <th scope="col" className={th}>Campanha</th>
                    <th scope="col" className={th}>Objetivo</th>
                    <th scope="col" className={th}>Investimento</th>
                    <th scope="col" className={th}>Alcance / Impr.</th>
                    <th scope="col" className={th}>Cliques (CTR)</th>
                    <th scope="col" className={th}>Resultado</th>
                    <th scope="col" className={th}>Custo / Retorno</th>
                  </tr>
                </thead>
                <tbody>
                  {r.snapshot.campanhas.map((c) => {
                    const av = avaliarResultadoCampanha(c);
                    return (
                      <tr key={`${c.provedor}-${c.campanhaId}`}>
                        <th scope="row" className={`${td} max-w-[19rem] font-normal`}>
                          <span className="block truncate font-semibold text-branco">
                            {c.campanhaNome}
                          </span>
                          <span className="mt-0.5 block font-mono text-[0.7rem] uppercase tracking-[0.12em] text-cinza">
                            {nomeCanal(c.canal)}
                          </span>
                        </th>
                        <td className={`${td} text-xs text-neve`}>
                          {rotuloObjetivoCampanha[c.objetivo]}
                        </td>
                        <td className={`${td} tabular font-semibold text-branco`}>
                          {dinheiroExato(c.investimento)}
                        </td>
                        <td className={`${td} tabular text-xs`}>
                          <span className="text-neve">{c.alcance > 0 ? contagemCurta(c.alcance) : '—'}</span>
                          <span className="block text-cinza">{contagemCurta(c.impressoes)} impr.</span>
                        </td>
                        <td className={`${td} tabular text-xs`}>
                          <span className="text-neve">{numero(c.cliquesLink)}</span>
                          <span className="block text-cinza">CTR {porcento(c.ctr, 2)}</span>
                        </td>
                        <td className={`${td} tabular`}>
                          <span className="font-semibold text-branco">{av.resultado}</span>
                          <span className="ml-1.5 text-xs text-cinza">{av.unidade}</span>
                        </td>
                        <td className={`${td} tabular`}>
                          <span className="font-semibold text-neve">{av.custoOuRetorno}</span>
                          <span className="ml-1.5 text-xs text-cinza">{av.rotuloCusto}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Tabela>
            </div>
          </section>
        ) : null}

        {/* Canais */}
        {mostrar('canais') && r.snapshot.canais.length > 0 ? (
          <section className="mt-12 break-inside-avoid">
            <h2 className="font-display text-2xl font-extrabold tracking-[-0.03em]">
              Distribuição por canal
            </h2>
            <div className="mt-5 grid gap-6 lg:grid-cols-2">
              <div className="cartao p-7">
                <h3 className="font-mono text-[0.75rem] uppercase tracking-[0.16em] text-cinza">
                  {cfgCanais.esq.titulo}
                </h3>
                <div className="mt-6">
                  <BarrasCanal canais={r.snapshot.canais} medida={cfgCanais.esq.medida} />
                </div>
              </div>
              <div className="cartao p-7">
                <h3 className="font-mono text-[0.75rem] uppercase tracking-[0.16em] text-cinza">
                  {cfgCanais.dir.titulo}
                </h3>
                <div className="mt-6">
                  <BarrasCanal canais={r.snapshot.canais} medida={cfgCanais.dir.medida} />
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {/* Ações executadas e Próximos passos */}
        {r.acoesExecutadas.length > 0 || r.proximosPassos.length > 0 || (mostrar('marcos') && r.snapshot.marcos.length > 0) ? (
          <section className="mt-12 grid gap-6 break-inside-avoid lg:grid-cols-2">
            {r.acoesExecutadas.length > 0 ? (
              <div className="cartao p-7">
                <h2 className="font-display text-xl font-extrabold tracking-[-0.02em]">
                  O que a Psy Comunic executou
                </h2>
                <ul className="mt-4 space-y-3 text-sm leading-relaxed text-neve">
                  {r.acoesExecutadas.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span aria-hidden className="mt-1 text-xs text-magenta-texto">●</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : mostrar('marcos') && r.snapshot.marcos.length > 0 ? (
              <div className="cartao p-7">
                <h2 className="font-display text-xl font-extrabold tracking-[-0.02em]">
                  Diário de bordo do período
                </h2>
                <ul className="mt-4 space-y-3 text-sm leading-relaxed text-neve">
                  {r.snapshot.marcos.map((m) => (
                    <li key={m.id} className="flex items-start gap-3">
                      <span className="shrink-0 font-mono text-xs text-magenta-texto">
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
              <div className="cartao p-7">
                <h2 className="font-display text-xl font-extrabold tracking-[-0.02em]">
                  Próximos passos da operação
                </h2>
                <ol className="mt-4 space-y-3 text-sm leading-relaxed text-neve">
                  {r.proximosPassos.map((passo, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="shrink-0 font-mono text-xs font-semibold text-magenta-texto">
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

        <footer className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-fio pt-8 text-xs text-cinza">
          <p>
            Relatório preparado pela <strong className="text-neve">Psy Comunic</strong> · Versão {r.versao}
          </p>
          <p>psycomunic.com.br</p>
        </footer>
      </main>
    </div>
  );
}
