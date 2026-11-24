'use client';

import { useState } from 'react';
import type { CriativoResumo, StatusCriativo } from '@/lib/dados/tipos';
import {
  avaliarResultadoCampanha,
  rotuloObjetivoCampanha,
} from '@/lib/dominio/perfis-metrica';
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

const ROTULO_FORMATO: Record<CriativoResumo['formato'], string> = {
  video: '▶ Vídeo',
  post: 'Post',
  imagem: 'Imagem',
};

type FiltroCriativo = 'todos' | 'rodando' | 'alerta' | 'pausados';

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
  somenteLeitura = false,
}: {
  criativos: CriativoResumo[];
  somenteLeitura?: boolean;
}) {
  const [filtro, setFiltro] = useState<FiltroCriativo>('todos');
  const [selecionado, setSelecionado] = useState<CriativoResumo | null>(null);

  const qtdRodando = criativos.filter(
    (c) => c.status === 'ativo' || c.status === 'em_analise',
  ).length;
  const qtdAlerta = criativos.filter((c) => c.status === 'erro').length;
  const qtdPausados = criativos.filter((c) => c.status === 'pausado').length;

  const visiveis = criativos.filter((c) => {
    if (filtro === 'rodando') return c.status === 'ativo' || c.status === 'em_analise';
    if (filtro === 'alerta') return c.status === 'erro';
    if (filtro === 'pausados') return c.status === 'pausado';
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Barra de saúde operacional + filtros rápidos */}
      {!somenteLeitura ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                { id: 'todos', rotulo: `Todos (${criativos.length})`, mostrar: true },
                { id: 'rodando', rotulo: `Rodando agora (${qtdRodando})`, mostrar: true },
                { id: 'alerta', rotulo: `Com alerta (${qtdAlerta})`, mostrar: qtdAlerta > 0 },
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

          <p className="text-xs text-cinza">
            {qtdAlerta > 0 ? (
              <span className="font-semibold text-[#FB7185]">
                ● {qtdAlerta} {qtdAlerta === 1 ? 'anúncio pede revisão na Meta' : 'anúncios pedem revisão na Meta'}
              </span>
            ) : qtdRodando > 0 ? (
              <span className="text-[#4ADE80]">
                ● {qtdRodando} {qtdRodando === 1 ? 'criativo ativo e aprovado' : 'criativos ativos e aprovados'}
              </span>
            ) : (
              <span>Nenhum criativo ativo no momento</span>
            )}
          </p>
        </div>
      ) : null}

      {/* Grade de cartões */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visiveis.map((c) => {
          const est = ESTILO_STATUS[c.status];
          const av = avaliarResultadoCampanha(c);

          return (
            <article
              key={c.id}
              className={
                'cartao group flex flex-col overflow-hidden transition-colors ' +
                (c.status === 'erro'
                  ? 'border-[#FB7185]/45'
                  : 'hover:border-white/20')
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

                {!somenteLeitura ? (
                  <span className="pointer-events-none absolute bottom-2.5 right-2.5 rounded-full border border-white/15 bg-[#0A192F]/80 px-2.5 py-1 text-[0.65rem] text-neve opacity-0 backdrop-blur-md transition-opacity group-hover:opacity-100">
                    Ampliar
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
                  {c.titulo || c.corpo ? (
                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-neve/80">
                      {c.titulo ?? c.corpo}
                    </p>
                  ) : null}
                </div>

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
              </div>
            </article>
          );
        })}
      </div>

      {/* Modal de inspeção ampliada do criativo */}
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
            className="cartao grid max-h-[90vh] w-full max-w-3xl overflow-y-auto md:grid-cols-2"
          >
            <div className="relative aspect-square w-full bg-marinho-alto/80 md:aspect-auto md:min-h-[24rem]">
              <MiniaturaCriativo
                url={selecionado.imagemUrl ?? selecionado.miniaturaUrl}
                alt={selecionado.nome}
                formato={selecionado.formato}
              />
            </div>

            <div className="flex flex-col justify-between space-y-5 p-6">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <span
                    className="inline-flex items-center gap-1.5 text-xs font-semibold"
                    style={{ color: ESTILO_STATUS[selecionado.status].texto }}
                  >
                    <span aria-hidden>●</span>
                    {selecionado.statusDetalhe}
                  </span>
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
                    <p className="mt-1 max-h-32 overflow-y-auto whitespace-pre-line text-xs leading-relaxed text-neve">
                      {selecionado.corpo}
                    </p>
                  </div>
                ) : null}
              </div>

              {(() => {
                const av = avaliarResultadoCampanha(selecionado);
                return (
                  <dl className="grid grid-cols-2 gap-3 border-t border-fio pt-4 text-xs">
                    <div>
                      <dt className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-cinza">
                        Investimento
                      </dt>
                      <dd className="tabular mt-0.5 text-sm font-bold text-branco">
                        {dinheiroExato(selecionado.investimento)}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-cinza">
                        Resultado ({av.unidade})
                      </dt>
                      <dd className="tabular mt-0.5 text-sm font-bold text-branco">
                        {av.resultado} ({av.custoOuRetorno} {av.rotuloCusto})
                      </dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-cinza">
                        Alcance / Impressões
                      </dt>
                      <dd className="tabular mt-0.5 text-neve">
                        {contagemCurta(selecionado.alcance)} · {contagemCurta(selecionado.impressoes)} impr.
                      </dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-cinza">
                        Cliques / CTR
                      </dt>
                      <dd className="tabular mt-0.5 text-neve">
                        {numero(selecionado.cliquesLink)} · {porcento(selecionado.ctr, 2)}
                      </dd>
                    </div>
                  </dl>
                );
              })()}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
