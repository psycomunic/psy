'use client';

import { useActionState, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Situacao } from '@/lib/dados/tipos';
import { sincronizarAgora } from '@/app/painel/acoes-integracao';
import type { Resultado } from '@/app/painel/acoes';
import { CORES_SITUACAO } from './paleta';
import {
  PERIODOS,
  rotuloPeriodo,
  type ChavePeriodo,
} from '@/lib/dominio/perfis-metrica';

type ItemConta = {
  id: string;
  nome: string;
  segmento: string | null;
  perfilRotulo: string;
  situacao: Situacao;
};

const CANAIS_FILTRO = [
  { v: 'todos', r: 'Todos os canais' },
  { v: 'meta', r: 'Meta Ads' },
  { v: 'google', r: 'Google Ads' },
  { v: 'organico', r: 'Orgânico' },
] as const;

const DATA_ISO = /^\d{4}-\d{2}-\d{2}$/;

function montarUrl({
  conta,
  periodo,
  de,
  ate,
  canal,
  visao,
}: {
  conta?: string;
  periodo?: string;
  de?: string;
  ate?: string;
  canal?: string;
  visao?: string;
}) {
  const qs = new URLSearchParams();
  if (visao === 'carteira') qs.set('visao', 'carteira');
  if (conta) qs.set('conta', conta);
  if (periodo && periodo !== '7d') qs.set('periodo', periodo);
  if (periodo === 'personalizado' && de && ate) {
    qs.set('de', de);
    qs.set('ate', ate);
  }
  if (canal && canal !== 'todos') qs.set('canal', canal);
  const str = qs.toString();
  return str ? `/painel/metricas?${str}` : '/painel/metricas';
}

function SeletorIntervaloDatas({
  deInicial,
  ateInicial,
  carregando,
  aoAplicar,
}: {
  deInicial: string;
  ateInicial: string;
  carregando: boolean;
  aoAplicar: (novoDe: string, novoAte: string) => void;
}) {
  const [de, setDe] = useState(deInicial);
  const [ate, setAte] = useState(ateInicial);

  function mudarDe(valor: string) {
    setDe(valor);
    if (DATA_ISO.test(valor) && DATA_ISO.test(ate) && valor <= ate) {
      aoAplicar(valor, ate);
    }
  }

  function mudarAte(valor: string) {
    setAte(valor);
    if (DATA_ISO.test(de) && DATA_ISO.test(valor) && de <= valor) {
      aoAplicar(de, valor);
    }
  }

  function submeter(e: React.FormEvent) {
    e.preventDefault();
    if (!DATA_ISO.test(de) || !DATA_ISO.test(ate) || de > ate) return;
    aoAplicar(de, ate);
  }

  return (
    <form
      onSubmit={submeter}
      className="flex flex-wrap items-end gap-3 border-t border-fio pt-4"
    >
      <div>
        <label htmlFor="m-de" className="block font-mono text-[0.68rem] uppercase tracking-[0.14em] text-cinza">
          De
        </label>
        <input
          id="m-de"
          type="date"
          value={de}
          onChange={(e) => mudarDe(e.target.value)}
          className="mt-1 rounded-lg border border-fio bg-white/[0.03] px-3 py-1.5 text-xs text-branco outline-none focus:border-magenta"
        />
      </div>
      <div>
        <label htmlFor="m-ate" className="block font-mono text-[0.68rem] uppercase tracking-[0.14em] text-cinza">
          Até
        </label>
        <input
          id="m-ate"
          type="date"
          value={ate}
          onChange={(e) => mudarAte(e.target.value)}
          className="mt-1 rounded-lg border border-fio bg-white/[0.03] px-3 py-1.5 text-xs text-branco outline-none focus:border-magenta"
        />
      </div>
      <button
        type="submit"
        disabled={carregando}
        className="rounded-lg border border-fio bg-white/[0.04] px-4 py-1.5 text-xs font-semibold text-neve transition-colors hover:bg-white/[0.09] disabled:opacity-60"
      >
        {carregando ? 'Atualizando...' : 'Aplicar intervalo'}
      </button>
      <span className="ml-auto font-mono text-[0.7rem] uppercase tracking-[0.12em] text-cinza">
        {carregando
          ? 'Carregando período...'
          : `Recorte ativo: ${deInicial.split('-').reverse().join('/')} a ${ateInicial.split('-').reverse().join('/')}`}
      </span>
    </form>
  );
}

export function BarraMetricas({
  contas,
  contaAtualId,
  periodoAtual,
  deAtual,
  ateAtual,
  anteriorDeAtual,
  canalAtual,
  visaoCarteira,
  podeGerarRelatorio,
  podeSincronizar = false,
  primeiroDiaBanco = null,
}: {
  contas: ItemConta[];
  contaAtualId: string;
  periodoAtual: ChavePeriodo;
  deAtual: string;
  ateAtual: string;
  anteriorDeAtual?: string;
  canalAtual: string;
  visaoCarteira: boolean;
  podeGerarRelatorio: boolean;
  podeSincronizar?: boolean;
  primeiroDiaBanco?: string | null;
}) {
  const router = useRouter();
  const [emTransicao, iniciarTransicao] = useTransition();
  const [busca, setBusca] = useState('');
  const [aberto, setAberto] = useState(false);

  const [estadoSync, acaoSync, sincronizando] = useActionState<Resultado | null, FormData>(
    async (ant, fd) => {
      const r = await sincronizarAgora(ant, fd);
      if (r.ok) router.refresh();
      return r;
    },
    null,
  );

  const atual = contas.find((c) => c.id === contaAtualId) ?? contas[0];
  const filtradas = contas.filter((c) => {
    const q = busca.trim().toLowerCase();
    if (!q) return true;
    return (
      c.nome.toLowerCase().includes(q) ||
      (c.segmento ?? '').toLowerCase().includes(q) ||
      c.perfilRotulo.toLowerCase().includes(q)
    );
  });

  function navegarPara(url: string) {
    iniciarTransicao(() => {
      router.push(url);
    });
  }

  function aplicarDatasPersonalizadas(novoDe: string, novoAte: string) {
    navegarPara(
      montarUrl({
        conta: contaAtualId,
        periodo: 'personalizado',
        de: novoDe,
        ate: novoAte,
        canal: canalAtual,
        visao: visaoCarteira ? 'carteira' : undefined,
      }),
    );
  }

  const faltaHistoricoNoPeriodo =
    !visaoCarteira && Boolean(primeiroDiaBanco && deAtual < primeiroDiaBanco);

  const deParaSync = anteriorDeAtual && anteriorDeAtual < deAtual ? anteriorDeAtual : deAtual;

  return (
    <section
      aria-label="Controles de cliente, período e canal"
      className="cartao space-y-5 p-5 md:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Seletor pesquisável de cliente + botão Visão da Carteira */}
        <div className="relative flex flex-wrap items-center gap-2.5">
          {contas.length > 1 ? (
            <>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setAberto((v) => !v)}
                  aria-expanded={aberto}
                  className={
                    'inline-flex items-center gap-3 rounded-xl border px-4 py-2.5 text-left text-sm transition-colors ' +
                    (!visaoCarteira
                      ? 'border-magenta/60 bg-magenta/10 font-semibold text-branco'
                      : 'border-fio bg-white/[0.03] text-neve hover:bg-white/[0.06]')
                  }
                >
                  <span
                    aria-hidden
                    className="text-xs"
                    style={{ color: CORES_SITUACAO[atual.situacao] }}
                  >
                    ●
                  </span>
                  <span className="max-w-[16rem] truncate">{atual.nome}</span>
                  <span className="rounded-full border border-fio bg-white/[0.04] px-2.5 py-0.5 font-mono text-[0.68rem] uppercase tracking-[0.1em] text-cinza">
                    {atual.perfilRotulo}
                  </span>
                  <span aria-hidden className="text-xs text-cinza">▾</span>
                </button>

                {aberto ? (
                  <div className="absolute left-0 top-full z-30 mt-2 w-[21rem] max-w-[calc(100vw-3rem)] rounded-2xl border border-fio bg-marinho-fundo p-3 shadow-2xl">
                    <input
                      type="search"
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                      placeholder="Buscar cliente, nicho ou modelo..."
                      autoFocus
                      className="w-full rounded-xl border border-fio bg-white/[0.04] px-3.5 py-2.5 text-sm text-branco outline-none placeholder:text-cinza/60 focus:border-magenta"
                    />
                    <ul className="mt-2 max-h-72 space-y-1 overflow-y-auto">
                      {filtradas.length === 0 ? (
                        <li className="px-3 py-4 text-center text-xs text-cinza">
                          Nenhum cliente encontrado.
                        </li>
                      ) : (
                        filtradas.map((c) => {
                          const selecionado = !visaoCarteira && c.id === contaAtualId;
                          return (
                            <li key={c.id}>
                              <Link
                                prefetch={false}
                                href={montarUrl({
                                  conta: c.id,
                                  periodo: periodoAtual,
                                  de: deAtual,
                                  ate: ateAtual,
                                  canal: canalAtual,
                                })}
                                onClick={() => setAberto(false)}
                                className={
                                  'flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ' +
                                  (selecionado
                                    ? 'bg-magenta/20 font-semibold text-branco'
                                    : 'text-neve hover:bg-white/[0.05]')
                                }
                              >
                                <div className="min-w-0">
                                  <p className="truncate">{c.nome}</p>
                                  <p className="truncate text-xs text-cinza">
                                    {c.segmento ?? c.perfilRotulo}
                                  </p>
                                </div>
                                <span
                                  aria-hidden
                                  className="shrink-0 text-xs"
                                  style={{ color: CORES_SITUACAO[c.situacao] }}
                                >
                                  ●
                                </span>
                              </Link>
                            </li>
                          );
                        })
                      )}
                    </ul>
                  </div>
                ) : null}
              </div>

              <Link
                prefetch={false}
                href={montarUrl({
                  conta: contaAtualId,
                  periodo: periodoAtual,
                  de: deAtual,
                  ate: ateAtual,
                  canal: canalAtual,
                  visao: visaoCarteira ? undefined : 'carteira',
                })}
                className={
                  'rounded-xl border px-4 py-2.5 text-sm transition-colors ' +
                  (visaoCarteira
                    ? 'border-magenta bg-magenta font-semibold text-branco'
                    : 'border-fio bg-white/[0.02] text-neve hover:bg-white/[0.06]')
                }
              >
                Visão de todos ({contas.length})
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-2.5 text-sm text-neve">
              <span
                aria-hidden
                style={{ color: CORES_SITUACAO[atual.situacao] }}
              >
                ●
              </span>
              <span className="font-semibold text-branco">{atual.nome}</span>
              <span className="rounded-full border border-fio px-2.5 py-0.5 font-mono text-[0.68rem] uppercase tracking-[0.1em] text-cinza">
                {atual.perfilRotulo}
              </span>
            </div>
          )}
        </div>

        {/* Atalhos de sincronização do período e geração de relatório */}
        <div className="flex flex-wrap items-center gap-2.5">
          {podeSincronizar && !visaoCarteira ? (
            <form action={acaoSync}>
              <input type="hidden" name="conta_id" value={contaAtualId} />
              <input type="hidden" name="de" value={deParaSync} />
              <input type="hidden" name="ate" value={ateAtual} />
              <button
                type="submit"
                disabled={sincronizando}
                className="rounded-full border border-fio bg-white/[0.03] px-4 py-2.5 text-xs font-semibold text-neve transition-colors hover:bg-white/[0.08] disabled:opacity-60"
              >
                {sincronizando ? 'Sincronizando período...' : 'Sincronizar período'}
              </button>
            </form>
          ) : null}

          {podeGerarRelatorio && !visaoCarteira ? (
            <Link
              href={`/painel/relatorios?conta=${contaAtualId}&de=${deAtual}&ate=${ateAtual}`}
              className="inline-flex items-center gap-2 rounded-full bg-magenta px-5 py-2.5 text-sm font-semibold text-branco transition-colors hover:bg-magenta-forte"
            >
              Gerar relatório deste período
              <span aria-hidden>→</span>
            </Link>
          ) : null}
        </div>
      </div>

      {/* Período + Canal */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-fio pt-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {PERIODOS.filter((p) => p !== 'personalizado').map((p) => {
            const ativo = periodoAtual === p;
            return (
              <button
                key={p}
                type="button"
                disabled={emTransicao}
                onClick={() =>
                  navegarPara(
                    montarUrl({
                      conta: contaAtualId,
                      periodo: p,
                      canal: canalAtual,
                      visao: visaoCarteira ? 'carteira' : undefined,
                    }),
                  )
                }
                className={
                  'rounded-full px-3.5 py-1.5 text-xs transition-colors ' +
                  (ativo
                    ? 'bg-branco font-semibold text-marinho-fundo'
                    : 'border border-fio text-neve hover:bg-white/[0.06]')
                }
              >
                {rotuloPeriodo[p]}
              </button>
            );
          })}
        </div>

        {!visaoCarteira ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {CANAIS_FILTRO.map((c) => {
              const ativo = canalAtual === c.v;
              return (
                <button
                  key={c.v}
                  type="button"
                  disabled={emTransicao}
                  onClick={() =>
                    navegarPara(
                      montarUrl({
                        conta: contaAtualId,
                        periodo: periodoAtual,
                        de: deAtual,
                        ate: ateAtual,
                        canal: c.v,
                      }),
                    )
                  }
                  className={
                    'rounded-full px-3 py-1.5 text-xs transition-colors ' +
                    (ativo
                      ? 'border border-magenta/60 bg-magenta/15 font-semibold text-magenta-texto'
                      : 'border border-fio text-cinza hover:text-neve')
                  }
                >
                  {c.r}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      {/* Intervalo personalizado sempre sincronizado com o recorte ativo */}
      <SeletorIntervaloDatas
        key={`${periodoAtual}:${deAtual}:${ateAtual}`}
        deInicial={deAtual}
        ateInicial={ateAtual}
        carregando={emTransicao}
        aoAplicar={aplicarDatasPersonalizadas}
      />

      {faltaHistoricoNoPeriodo && primeiroDiaBanco ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#FBBF24]/35 bg-[#FBBF24]/10 px-4 py-3 text-xs text-neve">
          <span>
            O histórico salvo desta conta começa em{' '}
            <strong className="text-branco">{primeiroDiaBanco.split('-').reverse().join('/')}</strong>.
            {podeSincronizar
              ? ' Clique em "Sincronizar período" acima para puxar os dias anteriores direto das plataformas.'
              : ''}
          </span>
        </div>
      ) : null}

      {estadoSync ? (
        <p
          role="status"
          className={
            'rounded-xl border px-4 py-2.5 text-xs ' +
            (estadoSync.ok
              ? 'border-[#4ADE80]/40 bg-[#4ADE80]/10 text-[#4ADE80]'
              : 'border-magenta/40 bg-magenta/10 text-magenta-texto')
          }
        >
          {estadoSync.mensagem}
        </p>
      ) : null}
    </section>
  );
}
