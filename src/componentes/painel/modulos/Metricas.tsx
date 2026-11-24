import Link from 'next/link';
import {
  listarContas,
  serieDaContaPeriodo,
  canaisDaContaPeriodo,
  campanhasDaContaPeriodo,
  marcosDaConta,
  primeiroDiaSincronizado,
} from '@/lib/dados/consultas';
import { SerieMultinicho, BarrasCanal, type MedidaCanal } from '../Graficos';
import { BarraMetricas } from '../BarraMetricas';
import { GaleriaCriativos } from '../GaleriaCriativos';
import { FormPerfilMetrica } from '../Formularios';
import { criativosDaContaPeriodo } from '@/lib/ingestao/criativos';
import {
  Kpi,
  SeloSituacao,
  Progresso,
  AvisoProcedencia,
  Secao,
  Tabela,
  th,
  td,
} from '../base';
import {
  dinheiro,
  dinheiroExato,
  vezes,
  porcento,
  numero,
  contagemCurta,
  diaLongo,
  nomeCanal,
} from '@/lib/formato';
import {
  resolverPerfil,
  resolverJanelaPeriodo,
  agregarPeriodo,
  montarCartoesKpi,
  montarFunil,
  configSerieDoPerfil,
  rotuloPerfilMetrica,
  rotuloObjetivoCampanha,
  avaliarResultadoCampanha,
  type PerfilMetricaEfetivo,
} from '@/lib/dominio/perfis-metrica';
import { pode, type Papel } from '@/lib/papeis';
import type { ContaResumo } from '@/lib/dados/tipos';

/**
 * Métricas multi-nicho e por campanha.
 *
 * Adapta KPIs, funil, gráfico diário, canais e tabela de campanhas ao
 * modelo real de cada cliente (WhatsApp/Atendimento, Captação de Leads,
 * E-commerce com Loja, Vendas na Mídia, Branding ou Personalizado).
 */

function resultadoDoMesNaCarteira(c: ContaResumo, perfil: PerfilMetricaEfetivo) {
  switch (perfil) {
    case 'ecommerce':
      return { principal: dinheiro(c.receita), custoOuRetorno: vezes(c.mer), rotulo: 'MER' };
    case 'vendas_midia':
      return {
        principal: `${numero(c.comprasAtribuidas)} (${dinheiro(c.receitaAtribuida)})`,
        custoOuRetorno: c.investimento > 0 && c.receitaAtribuida > 0 ? vezes(c.receitaAtribuida / c.investimento) : '—',
        rotulo: 'ROAS',
      };
    case 'leads':
      return {
        principal: `${numero(c.leadsCaptados)} leads`,
        custoOuRetorno: c.leadsCaptados > 0 ? dinheiroExato(c.investimento / c.leadsCaptados) : '—',
        rotulo: 'CPL',
      };
    case 'branding':
      return {
        principal: `${contagemCurta(c.alcance)} alcance`,
        custoOuRetorno: `${numero(c.cliquesLink)} cliques`,
        rotulo: 'Tráfego',
      };
    default:
      return {
        principal: `${numero(c.conversas)} conversas`,
        custoOuRetorno: c.conversas > 0 ? dinheiroExato(c.investimento / c.conversas) : '—',
        rotulo: 'por conversa',
      };
  }
}

function medidasDeCanalPorPerfil(perfil: PerfilMetricaEfetivo): {
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
        dir: { titulo: 'Leads captados por canal', medida: 'leads' },
      };
    case 'branding':
      return {
        esq: { titulo: 'Investimento por canal', medida: 'investimento' },
        dir: { titulo: 'Cliques de saída por canal', medida: 'cliques' },
      };
    default:
      return {
        esq: { titulo: 'Investimento por canal', medida: 'investimento' },
        dir: { titulo: 'Conversas iniciadas por canal', medida: 'conversas' },
      };
  }
}

export async function Metricas({
  papel,
  contaPedida,
  periodoPedido,
  dePedido,
  atePedido,
  canalPedido,
  visaoPedida,
}: {
  papel: Papel;
  contaPedida?: string;
  periodoPedido?: string;
  dePedido?: string;
  atePedido?: string;
  canalPedido?: string;
  visaoPedida?: string;
}) {
  const { dados: todas, procedencia } = await listarContas();

  const contas =
    (papel === 'cliente' || papel === 'cliente_leitura') && procedencia === 'demonstracao'
      ? todas.slice(0, 1)
      : todas;

  if (contas.length === 0) {
    return (
      <>
        <AvisoProcedencia procedencia={procedencia} />
        <div className="cartao mt-8 space-y-3 p-8">
          <p className="font-display text-lg font-bold text-branco">
            Nenhuma conta disponível para o seu acesso.
          </p>
          <p className="max-w-[60ch] text-sm leading-relaxed text-cinza">
            Cadastre o cliente na aba <strong className="text-neve">Clientes</strong>, vincule o ID
            da conta de anúncios em <strong className="text-neve">Origem dos dados</strong> e rode
            a sincronização para visualizar os números aqui.
          </p>
        </div>
      </>
    );
  }

  const janela = resolverJanelaPeriodo({
    periodo: periodoPedido,
    de: dePedido,
    ate: atePedido,
  });

  const canalAtivo = canalPedido && ['meta', 'google', 'organico'].includes(canalPedido)
    ? canalPedido
    : 'todos';

  const conta = contas.find((c) => c.id === contaPedida) ?? contas[0];
  const ehCliente = papel === 'cliente' || papel === 'cliente_leitura';
  const visaoCarteira = !ehCliente && visaoPedida === 'carteira' && contas.length > 1;
  const podeEditarMetricas = pode(papel, 'metricas', 'editar') && procedencia === 'banco';
  const podeGerarRelatorio = pode(papel, 'relatorios', 'editar');

  const itensSeletor = contas.map((c) => {
    const p = resolverPerfil(c.perfilMetrica, c.tipo);
    return {
      id: c.id,
      nome: c.nome,
      segmento: c.segmento,
      perfilRotulo: rotuloPerfilMetrica[p],
      situacao: c.situacao,
    };
  });

  /* Visão panorâmica de todos os clientes lado a lado */
  if (visaoCarteira) {
    return (
      <>
        <AvisoProcedencia procedencia={procedencia} />

        <div className="mt-6">
          <BarraMetricas
            contas={itensSeletor}
            contaAtualId={conta.id}
            periodoAtual={janela.chave}
            deAtual={janela.de}
            ateAtual={janela.ate}
            canalAtual={canalAtivo}
            visaoCarteira
            podeGerarRelatorio={podeGerarRelatorio}
          />
        </div>

        <Secao
          titulo="Panorama da carteira no mês corrente"
          apoio="Cada cliente é lido pela régua do próprio nicho: conversas para WhatsApp, leads para captação e receita para e-commerce."
        >
          <Tabela>
            <caption className="sr-only">Desempenho mensal de todos os clientes ativos</caption>
            <thead>
              <tr>
                <th scope="col" className={th}>Cliente</th>
                <th scope="col" className={th}>Modelo</th>
                <th scope="col" className={th}>Saúde</th>
                <th scope="col" className={th}>Investimento (mês)</th>
                <th scope="col" className={th}>Resultado principal</th>
                <th scope="col" className={th}>Custo / Eficiência</th>
                <th scope="col" className={th}></th>
              </tr>
            </thead>
            <tbody>
              {[...contas]
                .sort((a, b) => b.investimento - a.investimento || b.receita - a.receita)
                .map((c) => {
                  const p = resolverPerfil(c.perfilMetrica, c.tipo);
                  const res = resultadoDoMesNaCarteira(c, p);
                  return (
                    <tr key={c.id}>
                      <th scope="row" className={`${td} font-normal`}>
                        <Link
                          href={`/painel/metricas?conta=${c.id}&periodo=${janela.chave}`}
                          className="font-semibold text-branco underline-offset-4 hover:underline"
                        >
                          {c.nome}
                        </Link>
                        {c.segmento ? (
                          <span className="mt-0.5 block text-xs text-cinza">{c.segmento}</span>
                        ) : null}
                      </th>
                      <td className={`${td} text-xs text-neve`}>{rotuloPerfilMetrica[p]}</td>
                      <td className={td}><SeloSituacao situacao={c.situacao} /></td>
                      <td className={`${td} tabular`}>{dinheiro(c.investimento)}</td>
                      <td className={`${td} tabular font-semibold text-branco`}>{res.principal}</td>
                      <td className={`${td} tabular`}>
                        <span className="text-neve">{res.custoOuRetorno}</span>
                        <span className="ml-1.5 text-xs text-cinza">{res.rotulo}</span>
                      </td>
                      <td className={td}>
                        <div className="flex items-center gap-4">
                          <Link
                            href={`/painel/metricas?conta=${c.id}&periodo=${janela.chave}`}
                            className="text-xs font-semibold text-magenta-texto hover:underline"
                          >
                            Abrir →
                          </Link>
                          {podeGerarRelatorio ? (
                            <Link
                              href={`/painel/relatorios?conta=${c.id}&de=${janela.de}&ate=${janela.ate}`}
                              className="text-xs text-cinza hover:text-neve"
                            >
                              Relatório
                            </Link>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </Tabela>
        </Secao>
      </>
    );
  }

  /* Busca única cobrindo o período atual + o anterior equivalente */
  const [
    { dados: serieDupla },
    { dados: canais },
    { dados: campanhas },
    { dados: marcos },
    primeiroDiaBanco,
    criativos,
  ] = await Promise.all([
    serieDaContaPeriodo(conta.id, janela.anteriorDe, janela.ate, canalAtivo),
    canaisDaContaPeriodo(conta.id, janela.de, janela.ate),
    campanhasDaContaPeriodo(conta.id, janela.de, janela.ate, canalAtivo),
    marcosDaConta(conta.id),
    primeiroDiaSincronizado(conta.id),
    procedencia === 'banco' && (canalAtivo === 'todos' || canalAtivo === 'meta')
      ? criativosDaContaPeriodo(conta.id, janela.de, janela.ate)
      : Promise.resolve([]),
  ]);

  const serieAtual = serieDupla.filter((d) => d.dia >= janela.de && d.dia <= janela.ate);
  const serieAnterior = serieDupla.filter(
    (d) => d.dia >= janela.anteriorDe && d.dia <= janela.anteriorAte,
  );

  const perfilEfetivo = resolverPerfil(conta.perfilMetrica, conta.tipo);
  const agregadoAtual = agregarPeriodo(serieAtual);
  const agregadoAnterior = agregarPeriodo(serieAnterior);

  const cartoes = montarCartoesKpi({
    perfil: perfilEfetivo,
    kpisVisiveis: conta.kpisVisiveis,
    atual: agregadoAtual,
    anterior: agregadoAnterior,
  });

  const funil = montarFunil(perfilEfetivo, agregadoAtual);
  const cfgSerie = configSerieDoPerfil(perfilEfetivo);
  const cfgCanais = medidasDeCanalPorPerfil(perfilEfetivo);

  /* Progresso de meta adaptado ao nicho */
  const progressoMeta =
    perfilEfetivo === 'ecommerce'
      ? conta.metaAtingida
      : conta.resultadoMeta && conta.resultadoMeta > 0
        ? Number(
            (
              (100 *
                (perfilEfetivo === 'leads' ? conta.leadsCaptados : conta.conversas)) /
              conta.resultadoMeta
            ).toFixed(1),
          )
        : conta.verbaMeta && conta.verbaMeta > 0
          ? Number(((100 * conta.investimento) / conta.verbaMeta).toFixed(1))
          : null;

  return (
    <>
      <AvisoProcedencia procedencia={procedencia} />

      {!ehCliente ? (
        <div className="mt-6">
          <BarraMetricas
            contas={itensSeletor}
            contaAtualId={conta.id}
            periodoAtual={janela.chave}
            deAtual={janela.de}
            ateAtual={janela.ate}
            anteriorDeAtual={janela.anteriorDe}
            canalAtual={canalAtivo}
            visaoCarteira={false}
            podeGerarRelatorio={podeGerarRelatorio}
            podeSincronizar={papel === 'administrador' && procedencia === 'banco'}
            primeiroDiaBanco={primeiroDiaBanco}
          />
        </div>
      ) : null}

      {/* Cabeçalho da conta */}
      <header className="mt-8 flex flex-wrap items-start justify-between gap-6">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-[-0.035em]">
            {conta.nome}
          </h1>
          <p className="mt-2 font-mono text-[0.75rem] uppercase tracking-[0.16em] text-cinza">
            {[
              conta.segmento ?? rotuloPerfilMetrica[perfilEfetivo],
              conta.tipo === 'ecommerce' && conta.plataforma ? conta.plataforma : null,
              conta.ultimoDia ? `dado até ${diaLongo(conta.ultimoDia)}` : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-5">
          <SeloSituacao situacao={conta.situacao} />
          <div className="w-48">
            <Progresso percentual={progressoMeta} />
            {conta.verbaMeta && perfilEfetivo !== 'ecommerce' ? (
              <p className="mt-1 text-right text-[0.7rem] text-cinza">
                Verba no mês: {dinheiro(conta.investimento)} de {dinheiro(conta.verbaMeta)}
              </p>
            ) : null}
          </div>
          {!ehCliente ? (
            <Link
              href={`/painel/contas?ficha=${conta.id}&aba=dados`}
              className="rounded-full border border-fio px-4 py-2 text-xs font-semibold text-neve transition-colors hover:bg-white/5"
            >
              Fontes e sync →
            </Link>
          ) : null}
        </div>
      </header>

      {conta.situacao === 'sem_dado' ? (
        <p className="mt-6 rounded-xl border border-magenta/40 bg-magenta/10 px-5 py-4 text-sm leading-relaxed text-neve">
          <strong className="text-magenta-texto">A sincronização está atrasada.</strong> O último
          dado recebido é de {conta.ultimoDia ? diaLongo(conta.ultimoDia) : 'data desconhecida'}.
          Confira a aba Origem dos dados da ficha antes de decidir ajuste de verba.
        </p>
      ) : null}

      {/* Troca rápida do modelo de métricas do cliente */}
      {podeEditarMetricas && !ehCliente ? (
        <div className="mt-6">
          <FormPerfilMetrica
            contaId={conta.id}
            perfilAtual={conta.perfilMetrica}
            kpisAtuais={conta.kpisVisiveis}
          />
        </div>
      ) : null}

      {/* KPIs adaptados ao nicho */}
      <Secao
        titulo={`${janela.rotulo}`}
        apoio={`Comparado com os ${janela.dias} dias imediatamente anteriores (${janela.anteriorDe.split('-').reverse().join('/')} a ${janela.anteriorAte.split('-').reverse().join('/')}).`}
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cartoes.map((k) => (
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
      </Secao>

      {/* Funil adaptativo */}
      <Secao titulo={funil.titulo} apoio={funil.apoio}>
        <div className="cartao p-7">
          <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {funil.etapas.map((e, i) => (
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

          {funil.alerta ? (
            <p className="mt-7 border-t border-fio pt-6 text-sm leading-relaxed text-neve">
              <strong className="text-magenta-texto">{funil.alerta.destaque}</strong>{' '}
              {funil.alerta.corpo}
            </p>
          ) : null}
        </div>
      </Secao>

      {/* Série temporal adaptativa */}
      <Secao titulo={cfgSerie.titulo} apoio={cfgSerie.apoio}>
        <div className="cartao p-7">
          <SerieMultinicho
            serie={serieAtual}
            modo={cfgSerie.modo}
            rotuloResultado={cfgSerie.rotuloResultado}
            perfil={perfilEfetivo}
            marcos={marcos}
          />
        </div>
      </Secao>

      {/* Criativos em veiculação com miniatura, ranking e diagnóstico */}
      {criativos.length > 0 ? (
        <Secao
          titulo="Criativos em veiculação e diagnóstico"
          apoio="Classifica automaticamente os campeões de resultado, identifica gargalos (gancho fraco, conversão pós-clique ou fadiga de frequência) e sugere o próximo ajuste prático."
        >
          <GaleriaCriativos
            criativos={criativos}
            tetoCustoResultado={conta.custoResultadoTeto}
          />
        </Secao>
      ) : null}

      {/* Desempenho por campanha e objetivo */}
      <Secao
        titulo="Desempenho por campanha"
        apoio="Cada campanha é avaliada pelo próprio objetivo: campanha de alcance não é cobrada por venda, e campanha de WhatsApp mostra o custo exato por conversa."
      >
        {campanhas.length === 0 ? (
          <div className="cartao p-6 text-sm leading-relaxed text-cinza">
            Nenhuma campanha detalhada neste recorte ainda. Rode <strong className="text-neve">Sincronizar agora</strong> na ficha do cliente (após aplicar a migração <code className="font-mono text-neve">0050</code>) para abrir os resultados campanha a campanha.
          </div>
        ) : (
          <Tabela>
            <caption className="sr-only">Resultados por campanha no período selecionado</caption>
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
              {campanhas.map((c) => {
                const av = avaliarResultadoCampanha(c);
                return (
                  <tr key={`${c.provedor}-${c.campanhaId}`}>
                    <th scope="row" className={`${td} max-w-[20rem] font-normal`}>
                      <span className="block truncate font-semibold text-branco" title={c.campanhaNome}>
                        {c.campanhaNome}
                      </span>
                      <span className="mt-0.5 block font-mono text-[0.7rem] uppercase tracking-[0.12em] text-cinza">
                        {nomeCanal(c.canal)}
                      </span>
                    </th>
                    <td className={td}>
                      <span className="inline-block rounded-full border border-fio bg-white/[0.03] px-3 py-1 text-xs text-neve">
                        {rotuloObjetivoCampanha[c.objetivo]}
                      </span>
                    </td>
                    <td className={`${td} tabular font-semibold text-branco`}>
                      {dinheiroExato(c.investimento)}
                    </td>
                    <td className={`${td} tabular text-xs`}>
                      <span className="text-neve">
                        {c.alcance > 0 ? contagemCurta(c.alcance) : '—'}
                      </span>
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
        )}
      </Secao>

      {/* Comparativo por canal adaptado ao nicho */}
      <Secao
        titulo="Comparativo por canal"
        apoio="Acumulado do período selecionado em cada origem."
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="cartao p-7">
            <h3 className="font-mono text-[0.75rem] uppercase tracking-[0.16em] text-cinza">
              {cfgCanais.esq.titulo}
            </h3>
            <div className="mt-6">
              <BarrasCanal canais={canais} medida={cfgCanais.esq.medida} />
            </div>
          </div>
          <div className="cartao p-7">
            <h3 className="font-mono text-[0.75rem] uppercase tracking-[0.16em] text-cinza">
              {cfgCanais.dir.titulo}
            </h3>
            <div className="mt-6">
              <BarrasCanal canais={canais} medida={cfgCanais.dir.medida} />
            </div>
          </div>
        </div>

        <div className="mt-6">
          <Tabela>
            <caption className="sr-only">Desempenho detalhado por canal no período</caption>
            <thead>
              <tr>
                <th scope="col" className={th}>Canal</th>
                <th scope="col" className={th}>Investimento</th>
                <th scope="col" className={th}>Impressões</th>
                <th scope="col" className={th}>Cliques</th>
                <th scope="col" className={th}>Conversas / Leads</th>
                {perfilEfetivo === 'ecommerce' || perfilEfetivo === 'vendas_midia' ? (
                  <th scope="col" className={th}>Receita / ROAS</th>
                ) : null}
                <th scope="col" className={th}>CPC</th>
                <th scope="col" className={th}>CTR</th>
              </tr>
            </thead>
            <tbody>
              {canais.map((c) => (
                <tr key={c.canal}>
                  <th scope="row" className={`${td} font-normal text-branco`}>{nomeCanal(c.canal)}</th>
                  <td className={`${td} tabular`}>{c.investimento > 0 ? dinheiro(c.investimento) : '—'}</td>
                  <td className={`${td} tabular`}>{contagemCurta(c.impressoes)}</td>
                  <td className={`${td} tabular`}>{numero(c.cliquesLink)}</td>
                  <td className={`${td} tabular text-xs`}>
                    {c.conversas > 0 || c.leadsCaptados > 0
                      ? [
                          c.conversas > 0 ? `${numero(c.conversas)} conv.` : null,
                          c.leadsCaptados > 0 ? `${numero(c.leadsCaptados)} leads` : null,
                        ]
                          .filter(Boolean)
                          .join(' · ')
                      : '—'}
                  </td>
                  {perfilEfetivo === 'ecommerce' || perfilEfetivo === 'vendas_midia' ? (
                    <td className={`${td} tabular text-xs`}>
                      {perfilEfetivo === 'ecommerce'
                        ? `${dinheiro(c.receita)} (${c.roas === null ? '—' : vezes(c.roas)})`
                        : `${dinheiro(c.receitaAtribuida)} (${c.roasDeclarado === null ? '—' : vezes(c.roasDeclarado)})`}
                    </td>
                  ) : null}
                  <td className={`${td} tabular`}>{c.cpc === null ? '—' : dinheiroExato(c.cpc)}</td>
                  <td className={`${td} tabular`}>{porcento(c.ctr, 2)}</td>
                </tr>
              ))}
            </tbody>
          </Tabela>
        </div>
      </Secao>

      {/* Diário de bordo */}
      <Secao
        titulo="Diário de bordo"
        apoio="O histórico das ações da equipe que explicam as mudanças na curva."
      >
        {marcos.length === 0 ? (
          <p className="cartao p-6 text-sm text-cinza">Nenhum marco registrado ainda.</p>
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

      {ehCliente ? (
        <p className="mt-12 rounded-xl border border-fio bg-white/[0.02] px-6 py-5 text-sm leading-relaxed text-cinza">
          Estes são os números atualizados da sua operação. Em caso de dúvida sobre qualquer
          indicador ou campanha, fale com a equipe da Psy Comunic pelo WhatsApp.
        </p>
      ) : null}
    </>
  );
}
