'use client';

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Sino } from './Sino';
import { IconeModulo } from './IconeModulo';
import {
  GRUPOS_DE_MODULOS,
  modulosDoPapel,
  rotuloModulo,
  rotuloPapel,
  type Modulo,
  type Papel,
} from '@/lib/papeis';
import type { Notificacao } from '@/lib/dados/tipos';

type ContaBusca = {
  id: string;
  nome: string;
  segmento: string | null;
};

export function BarraTopoPainel({
  papel,
  nome,
  dataCurta,
  lojasAtivas,
  tarefasAtrasadas,
  leadsAbertos,
  contasBusca = [],
  avisos,
}: {
  papel: Papel;
  nome: string | null;
  dataCurta: string;
  lojasAtivas?: number;
  tarefasAtrasadas?: number;
  leadsAbertos?: number;
  contasBusca?: ContaBusca[];
  avisos?: { lista: Notificacao[]; naoLidas: number; agora: string };
}) {
  const caminho = usePathname();
  const router = useRouter();
  const moduloAtual = (caminho?.split('/')[2] ?? 'visao') as Modulo;

  const tema = useSyncExternalStore<'claro' | 'escuro'>(
    (aoMudar) => {
      window.addEventListener('psy-tema-mudou', aoMudar);
      window.addEventListener('storage', aoMudar);
      return () => {
        window.removeEventListener('psy-tema-mudou', aoMudar);
        window.removeEventListener('storage', aoMudar);
      };
    },
    () => (document.documentElement.dataset.painelTema === 'escuro' ? 'escuro' : 'claro'),
    () => 'claro',
  );

  const [buscaAberta, setBuscaAberta] = useState(false);
  const [termo, setTermo] = useState('');

  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setBuscaAberta((v) => !v);
      } else if (e.key === 'Escape') {
        setBuscaAberta(false);
      }
    }
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, []);

  function alternarTema(novo: 'claro' | 'escuro') {
    document.documentElement.dataset.painelTema = novo;
    const casca = document.querySelector('.painel-casca');
    if (casca) casca.setAttribute('data-painel-tema', novo);
    try {
      localStorage.setItem('psy-tema-painel', novo);
    } catch {
      /* Navegação privada sem storage */
    }
    window.dispatchEvent(new Event('psy-tema-mudou'));
  }

  const grupoAtual = useMemo(() => {
    const g = GRUPOS_DE_MODULOS.find((gr) => gr.modulos.includes(moduloAtual));
    return g?.titulo ?? 'Painel';
  }, [moduloAtual]);

  const iniciais = (nome ?? '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');

  const modulosPermitidos = useMemo(() => modulosDoPapel(papel), [papel]);

  const resultados = useMemo(() => {
    const q = termo
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .trim();

    const clientesFiltrados = contasBusca
      .filter((c) => {
        if (!q) return true;
        const alvo = `${c.nome} ${c.segmento ?? ''}`
          .normalize('NFD')
          .replace(/\p{Diacritic}/gu, '')
          .toLowerCase();
        return alvo.includes(q);
      })
      .slice(0, 8);

    const modulosFiltrados = modulosPermitidos.filter((m) => {
      if (!q) return true;
      const rot = rotuloModulo[m]
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase();
      return rot.includes(q);
    });

    return { clientesFiltrados, modulosFiltrados };
  }, [contasBusca, modulosPermitidos, termo]);

  return (
    <header className="sticky top-0 z-30 border-b border-fio bg-[var(--p-topbar)] px-5 py-3.5 backdrop-blur-md md:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Trilha contextual */}
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="hidden rounded-lg bg-marinho-alto px-2.5 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-cinza sm:inline-block">
            {grupoAtual}
          </span>
          <span aria-hidden className="hidden text-cinza/50 sm:inline">/</span>
          <span className="truncate font-display text-base font-bold tracking-[-0.02em] text-branco">
            {rotuloModulo[moduloAtual] ?? 'Painel'}
          </span>

          {/* Pílulas de pulso ao vivo no desktop */}
          {typeof lojasAtivas === 'number' ? (
            <div className="ml-3 hidden items-center gap-2 xl:flex">
              <Link
                href="/painel/contas"
                className="inline-flex items-center gap-1.5 rounded-full border border-fio bg-[var(--p-card)] px-3 py-1 text-xs font-medium text-neve transition-colors hover:border-fio-forte"
              >
                <span className="h-2 w-2 rounded-full bg-[var(--p-ok,#059669)]" />
                <span className="tabular font-semibold text-branco">{lojasAtivas}</span> ativas
              </Link>
              {typeof leadsAbertos === 'number' && leadsAbertos > 0 ? (
                <Link
                  href="/painel/crm"
                  className="inline-flex items-center gap-1.5 rounded-full border border-fio bg-[var(--p-card)] px-3 py-1 text-xs font-medium text-neve transition-colors hover:border-fio-forte"
                >
                  <span className="h-2 w-2 rounded-full bg-[var(--p-azul-vivo,#1D4ED8)]" />
                  <span className="tabular font-semibold text-branco">{leadsAbertos}</span> no funil
                </Link>
              ) : null}
              {typeof tarefasAtrasadas === 'number' && tarefasAtrasadas > 0 ? (
                <Link
                  href="/painel/tarefas?filtro=hoje"
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#E11D48]/30 bg-[#E11D48]/10 px-3 py-1 text-xs font-semibold text-[var(--p-critico,#E11D48)]"
                >
                  ▲ {tarefasAtrasadas} atrasada{tarefasAtrasadas === 1 ? '' : 's'}
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Controles da direita: Busca, Tema Claro/Escuro, Data, Sino e Perfil */}
        <div className="flex items-center gap-2.5">
          {/* Busca rápida Ctrl+K */}
          <button
            type="button"
            onClick={() => setBuscaAberta(true)}
            className="inline-flex h-9 items-center gap-2.5 rounded-full border border-fio bg-[var(--p-card)] px-3.5 text-xs text-cinza transition-colors hover:border-fio-forte hover:text-branco"
            aria-label="Buscar cliente ou módulo (Ctrl+K)"
          >
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden>
              <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.8" />
              <path d="M13.5 13.5L17.5 17.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <span className="hidden sm:inline">Buscar cliente ou tela...</span>
            <kbd className="hidden rounded border border-fio bg-marinho-alto/70 px-1.5 py-0.5 font-mono text-[0.65rem] text-cinza md:inline">
              Ctrl K
            </kbd>
          </button>

          {/* Alternador Claro / Escuro */}
          <div
            role="group"
            aria-label="Tema do painel"
            className="inline-flex h-9 items-center rounded-full border border-fio bg-[var(--p-card)] p-0.5"
          >
            <button
              type="button"
              onClick={() => alternarTema('claro')}
              aria-pressed={tema === 'claro'}
              title="Modo claro"
              className={
                'inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold transition-all ' +
                (tema === 'claro'
                  ? 'botao-3d-azul'
                  : 'text-cinza hover:text-branco')
              }
            >
              <svg width="13" height="13" viewBox="0 0 20 20" fill="none" aria-hidden>
                <circle cx="10" cy="10" r="3.6" stroke="currentColor" strokeWidth="1.7" />
                <path
                  d="M10 2.2v2.1M10 15.7v2.1M2.2 10h2.1M15.7 10h2.1M4.5 4.5l1.5 1.5M14 14l1.5 1.5M15.5 4.5L14 6M6 14l-1.5 1.5"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
              </svg>
              <span className="hidden md:inline">Claro</span>
            </button>

            <button
              type="button"
              onClick={() => alternarTema('escuro')}
              aria-pressed={tema === 'escuro'}
              title="Modo escuro"
              className={
                'inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold transition-all ' +
                (tema === 'escuro'
                  ? 'botao-3d-azul'
                  : 'text-cinza hover:text-branco')
              }
            >
              <svg width="13" height="13" viewBox="0 0 20 20" fill="none" aria-hidden>
                <path
                  d="M15.8 12.6A6.5 6.5 0 0 1 7.4 4.2a6.6 6.6 0 1 0 8.4 8.4Z"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="hidden md:inline">Escuro</span>
            </button>
          </div>

          {/* Cápsula de data */}
          <span className="hidden h-9 items-center rounded-full border border-fio bg-[var(--p-card)] px-3.5 text-xs font-medium text-neve lg:inline-flex">
            {dataCurta}
          </span>

          {/* Sino de avisos */}
          {avisos ? (
            <Sino lista={avisos.lista} naoLidas={avisos.naoLidas} agora={avisos.agora} />
          ) : null}

          {/* Chip do usuário */}
          {nome ? (
            <div className="hidden items-center gap-2 rounded-full border border-fio bg-[var(--p-card)] py-1 pl-1.5 pr-3 sm:flex">
              <span
                aria-hidden
                className="botao-3d-azul flex h-7 w-7 items-center justify-center rounded-full font-display text-xs font-bold"
              >
                {iniciais || 'P'}
              </span>
              <div className="leading-tight">
                <p className="max-w-[8.5rem] truncate text-xs font-semibold text-branco">
                  {nome.split(' ').slice(0, 2).join(' ')}
                </p>
                <p className="text-[0.65rem] font-medium text-cinza">{rotuloPapel[papel]}</p>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Modal de Busca Rápida (Ctrl+K) */}
      {buscaAberta && typeof document !== 'undefined'
        ? createPortal(
            <div
              data-painel-tema={tema}
              className="painel-portal fixed inset-0 z-[80] flex items-start justify-center bg-[#0B1730]/45 p-4 pt-[10vh] backdrop-blur-xs"
              onClick={() => setBuscaAberta(false)}
            >
              <div
                className="w-full max-w-xl overflow-hidden rounded-2xl border border-fio bg-[var(--p-card,#FFFFFF)] shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-3 border-b border-fio px-4 py-3.5">
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="text-cinza" aria-hidden>
                    <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M13.5 13.5L17.5 17.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                  <input
                    type="search"
                    autoFocus
                    value={termo}
                    onChange={(e) => setTermo(e.target.value)}
                    placeholder="Digite o nome de um cliente ou área do painel..."
                    className="w-full border-0 bg-transparent text-sm text-branco outline-none placeholder:text-cinza"
                  />
                  <button
                    type="button"
                    onClick={() => setBuscaAberta(false)}
                    className="rounded-lg border border-fio px-2 py-1 text-[0.68rem] font-semibold text-cinza hover:text-branco"
                  >
                    ESC
                  </button>
                </div>

                <div className="max-h-[60vh] overflow-y-auto p-3">
                  {resultados.clientesFiltrados.length > 0 ? (
                    <div className="mb-3">
                      <p className="px-2.5 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-cinza">
                        Clientes (Ficha 360° e Métricas)
                      </p>
                      <ul className="space-y-1">
                        {resultados.clientesFiltrados.map((c) => (
                          <li key={c.id} className="flex items-center justify-between gap-2 rounded-xl px-2.5 py-2 hover:bg-marinho-alto/70">
                            <button
                              type="button"
                              onClick={() => {
                                setBuscaAberta(false);
                                setTermo('');
                                router.push(`/painel/contas?ficha=${c.id}`);
                              }}
                              className="min-w-0 flex-1 text-left"
                            >
                              <span className="block truncate text-sm font-semibold text-branco">
                                {c.nome}
                              </span>
                              {c.segmento ? (
                                <span className="block truncate text-xs text-cinza">{c.segmento}</span>
                              ) : null}
                            </button>
                            <div className="flex shrink-0 items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setBuscaAberta(false);
                                  setTermo('');
                                  router.push(`/painel/contas?ficha=${c.id}`);
                                }}
                                className="rounded-full border border-fio px-2.5 py-1 text-[0.7rem] font-semibold text-neve hover:border-fio-forte"
                              >
                                Ficha 360°
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setBuscaAberta(false);
                                  setTermo('');
                                  router.push(`/painel/metricas?conta=${c.id}`);
                                }}
                                className="rounded-full border border-fio px-2.5 py-1 text-[0.7rem] font-semibold text-magenta-texto hover:border-fio-forte"
                              >
                                Métricas
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  <div>
                    <p className="px-2.5 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-cinza">
                      Módulos do painel
                    </p>
                    <ul className="grid gap-1 sm:grid-cols-2">
                      {resultados.modulosFiltrados.map((m) => (
                        <li key={m}>
                          <button
                            type="button"
                            onClick={() => {
                              setBuscaAberta(false);
                              setTermo('');
                              router.push(`/painel/${m}`);
                            }}
                            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-neve transition-colors hover:bg-marinho-alto/70 hover:text-branco"
                          >
                            <span className="text-magenta-texto">
                              <IconeModulo modulo={m} />
                            </span>
                            <span className="font-medium">{rotuloModulo[m]}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </header>
  );
}
