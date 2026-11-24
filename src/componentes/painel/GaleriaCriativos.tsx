'use client';

import { useMemo, useState } from 'react';
import type { CriativoResumo, StatusCriativo } from '@/lib/dados/tipos';
import {
  avaliarResultadoCampanha,
  rotuloObjetivoCampanha,
} from '@/lib/dominio/perfis-metrica';
import {
  diagnosticarCriativos,
  type AvaliacaoCriativo,
} from '@/lib/dominio/diagnostico-criativos';
import {
  dinheiroExato,
  contagemCurta,
  numero,
  porcento,
} from '@/lib/formato';

const ESTILO_STATUS: Record<
  StatusCriativo,
  { ponto: string; fundo: string; texto: string; rotuloCurto: string }
> = {
  ativo: {
    ponto: '#4ADE80',
    fundo: 'border-[#4ADE80]/40 bg-[#0A192F]/85 text-[#4ADE80]',
    texto: '#4ADE80',
    rotuloCurto: 'Rodando',
  },
  em_analise: {
    ponto: '#FBBF24',
    fundo: 'border-[#FBBF24]/40 bg-[#0A192F]/85 text-[#FBBF24]',
    texto: '#FBBF24',
    rotuloCurto: 'Em análise',
  },
  erro: {
    ponto: '#FB7185',
    fundo: 'border-[#FB7185]/50 bg-[#2A0A18]/90 text-[#FB7185]',
    texto: '#FB7185',
    rotuloCurto: 'Alerta',
  },
  pausado: {
    ponto: '#94A3B8',
    fundo: 'border-white/15 bg-[#0A192F]/85 text-neve',
    texto: '#94A3B8',
    rotuloCurto: 'Pausado',
  },
};

const ESTILO_TOM: Record<
  AvaliacaoCriativo['tom'],
  { selo: string; bordaCartao: string; icone: string }
> = {
  verde: {
    selo: 'border-[#4ADE80]/40 bg-[#4ADE80]/12 text-[#4ADE80]',
    bordaCartao: 'border-[#4ADE80]/35 hover:border-[#4ADE80]/60',
    icone: '★',
  },
  azul: {
    selo: 'border-[#38BDF8]/40 bg-[#38BDF8]/12 text-[#38BDF8]',
    bordaCartao: 'hover:border-[#38BDF8]/45',
    icone: '↗',
  },
  neutro: {
    selo: 'border-fio bg-white/[0.04] text-cinza',
    bordaCartao: 'hover:border-white/20',
    icone: '◌',
  },
  amarelo: {
    selo: 'border-[#FBBF24]/40 bg-[#FBBF24]/12 text-[#FBBF24]',
    bordaCartao: 'border-[#FBBF24]/30 hover:border-[#FBBF24]/55',
    icone: '⚡',
  },
  rosa: {
    selo: 'border-[#FB7185]/45 bg-[#FB7185]/12 text-[#FB7185]',
    bordaCartao: 'border-[#FB7185]/40 hover:border-[#FB7185]/65',
    icone: '!',
  },
};

const ROTULO_FORMATO: Record<CriativoResumo['formato'], string> = {
  video: '▶ Vídeo',
  post: 'Post',
  imagem: 'Imagem',
};

type FiltroCriativo = 'todos' | 'campeoes' | 'rodando' | 'melhorar' | 'pausados';
type OrdemCriativo = 'melhores' | 'gasto' | 'status';

function MiniaturaCriativo({
  url,
  alt,
  formato,
}: {
  url: string | null;
  alt: string;
  formato: CriativoResumo['formato'];
}) {
  const [falhou, setFalhou] = useState(false);

  if (!url || falhou) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-marinho-alto/70 p-4 text-center">
        <span aria-hidden className="font-mono text-xl text-cinza">
          {formato === 'video' ? '▶' : '▤'}
        </span>
        <span className="text-[0.7rem] text-cinza">Prévia indisponível</span>
      </div>
    );
  }

  /* `img` cru, e não `next/image`: o endereço da Meta (`fbcdn.net`) é assinado
     com expiração curta; passar pelo otimizador congelaria uma assinatura que vence. */
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFalhou(true)}
      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
    />
  );
}

export function GaleriaCriativos({
  criativos,
  tetoCustoResultado = null,
  somenteLeitura = false,
}: {
  criativos: CriativoResumo[];
  tetoCustoResultado?: number | null;
  somenteLeitura?: boolean;
}) {
  const [filtro, setFiltro] = useState<FiltroCriativo>('todos');
  const [ordem, setOrdem] = useState<OrdemCriativo>('melhores');
  const [selecionado, setSelecionado] = useState<CriativoResumo | null>(null);

  const analise = useMemo(
    () => diagnosticarCriativos(criativos, { tetoCustoResultado }),
    [criativos, tetoCustoResultado],
  );

  const qtdRodando = criativos.filter(
    (c) => c.status === 'ativo' || c.status === 'em_analise',
  ).length;
  const qtdCampeoes = criativos.filter((c) => {
    const cl = analise.avaliacoes[c.id]?.classificacao;
    return cl === 'campeao' || cl === 'escalar';
  }).length;
  const qtdMelhorar = analise.atencaoIds.length;
  const qtdPausados = criativos.filter((c) => c.status === 'pausado').length;
  const qtdErro = criativos.filter((c) => c.status === 'erro').length;

  const visiveis = useMemo(() => {
    const filtrados = criativos.filter((c) => {
      const cl = analise.avaliacoes[c.id]?.classificacao;
      if (filtro === 'rodando') return c.status === 'ativo' || c.status === 'em_analise';
      if (filtro === 'campeoes') return cl === 'campeao' || cl === 'escalar';
      if (filtro === 'melhorar') return analise.atencaoIds.includes(c.id);
      if (filtro === 'pausados') return c.status === 'pausado';
      return true;
    });

    return [...filtrados].sort((a, b) => {
      if (ordem === 'gasto') {
        return b.investimento - a.investimento || b.impressoes - a.impressoes;
      }
      if (ordem === 'status') {
        return 0; /* mantém a ordem operacional original (alertas -> ativos -> pausados) */
      }
      const na = analise.avaliacoes[a.id]?.nota ?? 0;
      const nb = analise.avaliacoes[b.id]?.nota ?? 0;
      return nb - na || b.investimento - a.investimento;
    });
  }, [criativos, analise, filtro, ordem]);

  return (
    <div className="space-y-6">
      {/* Painel executivo de inteligência e recomendações (apenas visão interna da agência) */}
      {!somenteLeitura && analise.destaques.length > 0 ? (
        <div className="grid gap-3.5 lg:grid-cols-3">
          {analise.destaques.map((d, i) => {
            const corBorda =
              d.tipo === 'campeao'
                ? 'border-[#4ADE80]/35 bg-[#4ADE80]/[0.05]'
                : d.tipo === 'escala'
                  ? 'border-[#38BDF8]/35 bg-[#38BDF8]/[0.05]'
                  : 'border-[#FBBF24]/35 bg-[#FBBF24]/[0.05]';
            const corTitulo =
              d.tipo === 'campeao'
                ? 'text-[#4ADE80]'
                : d.tipo === 'escala'
                  ? 'text-[#38BDF8]'
                  : 'text-[#FBBF24]';
            const etiqueta =
              d.tipo === 'campeao'
                ? 'Campeão do período'
                : d.tipo === 'escala'
                  ? 'Potencial de escala'
                  : d.tipo === 'concentracao'
                    ? 'Alerta de saturação futura'
                    : 'Sugestão de melhoria';

            return (
              <div
                key={i}
                className={`rounded-2xl border p-4 ${corBorda}`}
              >
                <p className={`font-mono text-[0.65rem] uppercase tracking-[0.14em] ${corTitulo}`}>
                  {etiqueta}
                </p>
                <p className="mt-1.5 font-display text-sm font-bold text-branco">
                  {d.titulo}
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-neve/90">
                  {d.detalhe}
                </p>
              </div>
            );
          })}
        </div>
      ) : null}

      {/* Barra de filtros + seletor de ordenação */}
      {!somenteLeitura ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                { id: 'todos', rotulo: `Todos (${criativos.length})`, mostrar: true },
                { id: 'campeoes', rotulo: `Melhores (${qtdCampeoes})`, mostrar: qtdCampeoes > 0 },
                { id: 'melhorar', rotulo: `Pedem ajuste (${qtdMelhorar})`, mostrar: qtdMelhorar > 0 },
                { id: 'rodando', rotulo: `Rodando (${qtdRodando})`, mostrar: true },
                { id: 'pausados', rotulo: `Pausados c/ gasto (${qtdPausados})`, mostrar: qtdPausados > 0 },
              ] as const
            )
              .filter((b) => b.mostrar)
              .map((b) => {
                const ativo = filtro === b.id;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setFiltro(b.id)}
                    className={
                      'rounded-full px-3.5 py-1.5 text-xs transition-colors ' +
                      (ativo
                        ? 'bg-branco font-semibold text-marinho-fundo'
                        : 'border border-fio text-neve hover:bg-white/[0.06]')
                    }
                  >
                    {b.rotulo}
                  </button>
                );
              })}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs text-cinza">
              {qtdErro > 0 ? (
                <span className="font-semibold text-[#FB7185]">
                  ● {qtdErro} com alerta na Meta
                </span>
              ) : qtdRodando > 0 ? (
                <span className="text-[#4ADE80]">
                  ● {qtdRodando} {qtdRodando === 1 ? 'ativo e aprovado' : 'ativos e aprovados'}
                </span>
              ) : null}
            </span>

            <select
              aria-label="Ordenar criativos"
              value={ordem}
              onChange={(e) => setOrdem(e.target.value as OrdemCriativo)}
              className="rounded-full border border-fio bg-white/[0.03] px-3.5 py-1.5 text-xs text-neve outline-none focus:border-magenta"
            >
              <option value="melhores">Ordenar: Melhores primeiro</option>
              <option value="gasto">Ordenar: Maior investimento</option>
              <option value="status">Ordenar: Status na Meta</option>
            </select>
          </div>
        </div>
      ) : null}

      {/* Grade de cartões */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visiveis.map((c) => {
          const est = ESTILO_STATUS[c.status];
          const av = avaliarResultadoCampanha(c);
          const diag = analise.avaliacoes[c.id];
          const tom = diag ? ESTILO_TOM[diag.tom] : ESTILO_TOM.neutro;
          const ehCampeao = diag?.classificacao === 'campeao';

          return (
            <article
              key={c.id}
              className={
                'cartao group flex flex-col overflow-hidden transition-colors ' +
                (somenteLeitura
                  ? ehCampeao
                    ? 'border-[#4ADE80]/35'
                    : ''
                  : tom.bordaCartao)
              }
            >
              <button
                type="button"
                disabled={somenteLeitura}
                onClick={() => setSelecionado(c)}
                className={
                  'relative aspect-square w-full overflow-hidden bg-marinho-alto/50 text-left ' +
                  (somenteLeitura ? 'cursor-default' : 'cursor-pointer')
                }
              >
                <MiniaturaCriativo
                  url={c.miniaturaUrl}
                  alt={`Prévia do anúncio ${c.nome}`}
                  formato={c.formato}
                />

                {/* Selo de status ao vivo */}
                <span
                  className={`absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.68rem] font-semibold backdrop-blur-md ${est.fundo}`}
                >
                  <span aria-hidden style={{ color: est.ponto }}>●</span>
                  {c.status === 'pausado' ? c.statusDetalhe : est.rotuloCurto}
                </span>

                {/* Formato do criativo */}
                <span className="absolute right-3 top-3 rounded-full border border-white/15 bg-[#0A192F]/80 px-2.5 py-1 font-mono text-[0.65rem] uppercase tracking-[0.1em] text-neve backdrop-blur-md">
                  {ROTULO_FORMATO[c.formato]}
                </span>

                {/* Selo de performance (Campeão no relatório público; todos os selos no painel interno) */}
                {diag && (!somenteLeitura || ehCampeao) ? (
                  <span
                    className={`absolute bottom-2.5 left-2.5 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[0.66rem] font-semibold backdrop-blur-md ${tom.selo}`}
                  >
                    <span aria-hidden>{tom.icone}</span>
                    {ehCampeao && somenteLeitura ? 'Destaque do período' : diag.selo}
                  </span>
                ) : null}

                {!somenteLeitura ? (
                  <span className="pointer-events-none absolute bottom-2.5 right-2.5 rounded-full border border-white/15 bg-[#0A192F]/80 px-2.5 py-1 text-[0.65rem] text-neve opacity-0 backdrop-blur-md transition-opacity group-hover:opacity-100">
                    Analisar
                  </span>
                ) : null}
              </button>

              <div className="flex flex-1 flex-col justify-between space-y-4 p-4">
                <div>
                  <h3
                    className="truncate font-display text-sm font-bold text-branco"
                    title={c.nome}
                  >
                    {c.nome}
                  </h3>
                  <p
                    className="mt-0.5 truncate text-xs text-cinza"
                    title={`${c.campanhaNome}${c.conjuntoNome ? ` · ${c.conjuntoNome}` : ''}`}
                  >
                    {c.campanhaNome}
                    {c.conjuntoNome ? ` · ${c.conjuntoNome}` : ''}
                  </p>
                </div>

                <div className="space-y-3">
                  <dl className="grid grid-cols-2 gap-x-3 gap-y-2.5 border-t border-fio pt-3 text-xs">
                    <div>
                      <dt className="font-mono text-[0.62rem] uppercase tracking-[0.12em] text-cinza">
                        Resultado
                      </dt>
                      <dd className="tabular mt-0.5 font-semibold text-branco">
                        {av.resultado}{' '}
                        <span className="font-normal text-cinza">{av.unidade}</span>
                      </dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[0.62rem] uppercase tracking-[0.12em] text-cinza">
                        Custo / Retorno
                      </dt>
                      <dd className="tabular mt-0.5 font-semibold text-neve">
                        {av.custoOuRetorno}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[0.62rem] uppercase tracking-[0.12em] text-cinza">
                        Investido
                      </dt>
                      <dd className="tabular mt-0.5 text-neve">
                        {dinheiroExato(c.investimento)}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[0.62rem] uppercase tracking-[0.12em] text-cinza">
                        CTR · Cliques
                      </dt>
                      <dd className="tabular mt-0.5 text-neve">
                        {porcento(c.ctr, 2)} · {numero(c.cliquesLink)}
                      </dd>
                    </div>
                  </dl>

                  {/* Recomendação prática direta no cartão (somente painel interno) */}
                  {!somenteLeitura && diag ? (
                    <div className="rounded-xl border border-fio bg-white/[0.02] p-2.5 text-[0.72rem] leading-relaxed text-cinza">
                      <p className="font-medium text-neve">{diag.diagnostico}</p>
                      <p className="mt-1">{diag.sugestao}</p>
                    </div>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Modal de inspeção ampliada e plano de otimização do criativo */}
      {selecionado ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Detalhes do criativo ${selecionado.nome}`}
          onClick={() => setSelecionado(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm print:hidden"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="cartao grid max-h-[90vh] w-full max-w-4xl overflow-y-auto md:grid-cols-2"
          >
            <div className="relative aspect-square w-full bg-marinho-alto/80 md:aspect-auto md:min-h-[26rem]">
              <MiniaturaCriativo
                url={selecionado.imagemUrl ?? selecionado.miniaturaUrl}
                alt={selecionado.nome}
                formato={selecionado.formato}
              />
            </div>

            <div className="flex flex-col justify-between space-y-5 p-6">
              {(() => {
                const av = avaliarResultadoCampanha(selecionado);
                const diag = analise.avaliacoes[selecionado.id];
                const tom = diag ? ESTILO_TOM[diag.tom] : ESTILO_TOM.neutro;

                return (
                  <>
                    <div className="space-y-3.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className="inline-flex items-center gap-1.5 text-xs font-semibold"
                            style={{ color: ESTILO_STATUS[selecionado.status].texto }}
                          >
                            <span aria-hidden>●</span>
                            {selecionado.statusDetalhe}
                          </span>
                          {diag ? (
                            <span className={`rounded-full border px-2.5 py-0.5 text-[0.68rem] font-semibold ${tom.selo}`}>
                              {tom.icone} {diag.selo} · Nota {diag.nota}/100
                            </span>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelecionado(null)}
                          className="rounded-lg border border-fio px-2.5 py-1 text-xs text-cinza hover:text-branco"
                        >
                          Fechar
                        </button>
                      </div>

                      <div>
                        <h3 className="font-display text-lg font-extrabold text-branco">
                          {selecionado.nome}
                        </h3>
                        <p className="mt-1 text-xs text-cinza">
                          {selecionado.campanhaNome}
                          {selecionado.conjuntoNome ? ` · ${selecionado.conjuntoNome}` : ''}
                        </p>
                        <p className="mt-1 font-mono text-[0.68rem] uppercase tracking-[0.12em] text-magenta-texto">
                          {rotuloObjetivoCampanha[selecionado.objetivo]} · {ROTULO_FORMATO[selecionado.formato]}
                        </p>
                      </div>

                      {diag ? (
                        <div className="rounded-xl border border-magenta/30 bg-magenta/[0.06] p-3.5 text-xs leading-relaxed">
                          <p className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-magenta-texto">
                            Diagnóstico e recomendação
                          </p>
                          <p className="mt-1 font-semibold text-branco">{diag.diagnostico}</p>
                          <p className="mt-1.5 text-neve">{diag.sugestao}</p>
                        </div>
                      ) : null}

                      {selecionado.titulo ? (
                        <div className="rounded-xl border border-fio bg-white/[0.02] p-3">
                          <p className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-cinza">
                            Título do anúncio
                          </p>
                          <p className="mt-1 text-xs font-semibold text-branco">{selecionado.titulo}</p>
                        </div>
                      ) : null}

                      {selecionado.corpo ? (
                        <div className="rounded-xl border border-fio bg-white/[0.02] p-3">
                          <p className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-cinza">
                            Texto principal
                          </p>
                          <p className="mt-1 max-h-28 overflow-y-auto whitespace-pre-line text-xs leading-relaxed text-neve">
                            {selecionado.corpo}
                          </p>
                        </div>
                      ) : null}
                    </div>

                    <dl className="grid grid-cols-2 gap-3 border-t border-fio pt-4 text-xs sm:grid-cols-3">
                      <div>
                        <dt className="font-mono text-[0.62rem] uppercase tracking-[0.12em] text-cinza">
                          Investimento
                        </dt>
                        <dd className="tabular mt-0.5 text-sm font-bold text-branco">
                          {dinheiroExato(selecionado.investimento)}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-mono text-[0.62rem] uppercase tracking-[0.12em] text-cinza">
                          Resultado
                        </dt>
                        <dd className="tabular mt-0.5 text-sm font-bold text-branco">
                          {av.resultado} {av.unidade}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-mono text-[0.62rem] uppercase tracking-[0.12em] text-cinza">
                          Custo / Retorno
                        </dt>
                        <dd className="tabular mt-0.5 text-sm font-bold text-neve">
                          {av.custoOuRetorno} {av.rotuloCusto}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-mono text-[0.62rem] uppercase tracking-[0.12em] text-cinza">
                          CTR · Cliques
                        </dt>
                        <dd className="tabular mt-0.5 text-neve">
                          {porcento(selecionado.ctr, 2)} · {numero(selecionado.cliquesLink)}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-mono text-[0.62rem] uppercase tracking-[0.12em] text-cinza">
                          Frequência
                        </dt>
                        <dd className="tabular mt-0.5 text-neve">
                          {diag?.frequencia ? `${diag.frequencia.toFixed(2).replace('.', ',')}x` : '—'} ({contagemCurta(selecionado.alcance)} alc.)
                        </dd>
                      </div>
                      <div>
                        <dt className="font-mono text-[0.62rem] uppercase tracking-[0.12em] text-cinza">
                          Conv. pós-clique
                        </dt>
                        <dd className="tabular mt-0.5 text-neve">
                          {diag?.taxaPosClique !== null && diag?.taxaPosClique !== undefined
                            ? porcento(diag.taxaPosClique, 1)
                            : '—'}
                        </dd>
                      </div>
                    </dl>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
