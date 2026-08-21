'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { marcarLidas } from '@/app/painel/acoes-tarefa';
import type { Notificacao } from '@/lib/dados/tipos';
import type { Resultado } from '@/app/painel/acoes';

/**
 * A caixa de avisos.
 *
 * ============================================================
 * POR QUE ISTO EXISTE NO MENU, E NÃO NUMA PÁGINA
 * ============================================================
 * Lembrete que mora numa tela precisa que alguém abra aquela tela. O
 * único lugar por onde toda navegação passa é o menu, e é lá que o
 * aviso tem chance de ser visto antes de virar atraso.
 *
 * O número não é decorativo: ele some quando você lê. Contador que
 * nunca zera vira ruído, e em duas semanas ninguém olha mais.
 */

const CORES: Record<Notificacao['tipo'], string> = {
  tarefa_vence: '#FBBF24',
  tarefa_atrasada: '#FF7A7A',
  fatura_vencida: '#FF7A7A',
  aviso: '#93A0BC',
};

const FORMAS: Record<Notificacao['tipo'], string> = {
  tarefa_vence: '▲',
  tarefa_atrasada: '■',
  fatura_vencida: '■',
  aviso: '●',
};

function quando(iso: string, agora: string) {
  const min = Math.round((Date.parse(agora) - Date.parse(iso)) / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.round(h / 24);
  return `há ${d} ${d === 1 ? 'dia' : 'dias'}`;
}

export function Sino({
  lista,
  naoLidas,
  agora,
}: {
  lista: Notificacao[];
  naoLidas: number;
  /** O relógio vem do servidor: `Date.now()` no render é impuro e
      causa divergência entre o HTML enviado e o que o navegador
      recalcula na hidratação. */
  agora: string;
}) {
  const [aberto, setAberto] = useState(false);
  const [rLer, aLer, pLer] = useActionState<Resultado | null, FormData>(marcarLidas, null);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAberto((a) => !a)}
        aria-expanded={aberto}
        aria-label={
          naoLidas > 0
            ? `Avisos: ${naoLidas} ${naoLidas === 1 ? 'não lido' : 'não lidos'}`
            : 'Avisos'
        }
        className="relative flex h-9 w-9 flex-none items-center justify-center rounded-xl border border-fio text-neve transition-colors hover:bg-white/[0.06] hover:text-branco"
      >
        <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" fill="none" aria-hidden>
          <path
            d="M10 2.5a4.5 4.5 0 0 0-4.5 4.5v3L4 12.5h12L14.5 10V7A4.5 4.5 0 0 0 10 2.5Z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <path d="M8 15a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>

        {naoLidas > 0 ? (
          <span
            aria-hidden
            className="tabular absolute -right-1.5 -top-1.5 min-w-[18px] rounded-full bg-magenta px-1 text-center text-[0.75rem] font-bold leading-[18px] text-branco"
          >
            {naoLidas > 9 ? '9+' : naoLidas}
          </span>
        ) : null}
      </button>

      {aberto ? (
        <>
          {/* Clicar fora fecha. Sem isso a caixa fica aberta cobrindo o
              menu, e a saída vira adivinhação. */}
          <button
            type="button"
            aria-label="Fechar avisos"
            onClick={() => setAberto(false)}
            className="fixed inset-0 z-40 cursor-default"
          />

          <div className="absolute right-0 top-11 z-50 max-h-[70vh] w-[min(22rem,calc(100vw-3rem))] overflow-y-auto rounded-2xl border border-fio bg-marinho-fundo/95 shadow-2xl backdrop-blur">
            <div className="flex items-center justify-between gap-3 border-b border-fio px-4 py-3">
              <p className="font-mono text-[0.75rem] uppercase tracking-[0.14em] text-cinza">
                Avisos
              </p>
              {naoLidas > 0 ? (
                <form action={aLer}>
                  <button
                    type="submit"
                    disabled={pLer}
                    className="text-xs font-semibold text-magenta-texto underline-offset-4 hover:underline disabled:opacity-60"
                  >
                    {pLer ? 'marcando...' : 'marcar tudo como lido'}
                  </button>
                </form>
              ) : null}
            </div>

            {rLer && !rLer.ok ? (
              <p role="status" className="px-4 py-3 text-xs font-semibold text-magenta-texto">
                <span aria-hidden className="mr-1.5">■</span>
                {rLer.mensagem}
              </p>
            ) : null}

            {lista.length === 0 ? (
              <p className="px-4 py-6 text-sm leading-relaxed text-cinza">
                Nada por aqui. Os avisos aparecem quando uma tarefa se aproxima do prazo,
                atrasa, ou quando uma cobrança vence.
              </p>
            ) : (
              <ul className="divide-y divide-fio">
                {lista.map((n) => {
                  const corpo = (
                    <>
                      <span className="flex items-start gap-3">
                        <span
                          aria-hidden
                          className="mt-0.5 flex-none text-xs"
                          style={{ color: CORES[n.tipo] }}
                        >
                          {FORMAS[n.tipo]}
                        </span>
                        <span className="min-w-0">
                          <span
                            className={
                              'block text-sm leading-snug ' +
                              (n.lidaEm ? 'text-cinza' : 'font-semibold text-branco')
                            }
                          >
                            {n.titulo}
                          </span>
                          {n.corpo ? (
                            <span className="mt-1 block text-xs leading-relaxed text-cinza">
                              {n.corpo}
                            </span>
                          ) : null}
                          <span className="mt-1 block font-mono text-[0.75rem] uppercase tracking-[0.12em] text-cinza">
                            {quando(n.criadaEm, agora)}
                          </span>
                        </span>
                      </span>
                    </>
                  );

                  return (
                    <li key={n.id}>
                      {n.link ? (
                        <Link
                          href={n.link}
                          onClick={() => setAberto(false)}
                          className="block px-4 py-3.5 transition-colors hover:bg-white/[0.04]"
                        >
                          {corpo}
                        </Link>
                      ) : (
                        <div className="px-4 py-3.5">{corpo}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
