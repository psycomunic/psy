'use client';

import { useActionState, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
  lead_novo: '#4ADE80',
  aviso: '#93A0BC',
};

const FORMAS: Record<Notificacao['tipo'], string> = {
  tarefa_vence: '▲',
  tarefa_atrasada: '■',
  fatura_vencida: '■',
  lead_novo: '●',
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

  /*
    ============================================================
    POR QUE A CAIXA SAI DA ÁRVORE, E POR QUE A POSIÇÃO É MEDIDA
    ============================================================
    Três defeitos moravam aqui, e os três têm a mesma raiz: a caixa era
    filha da barra lateral.

    1. ELA SAÍA PELA ESQUERDA. Alinhava pela direita do sino e crescia
       para a esquerda, mas o sino não fica na borda da tela: no celular
       tem o botão do menu ao lado, e no computador ele mora DENTRO da
       coluna de 256px. Medido, o corte era de 20px em 390 e de 165px em
       1440. E ninguém via a caixa rolar para achar o resto, porque quem
       corta é o `overflow-x: clip` do `body`, que existe para o
       `position: sticky` funcionar e não vai sair daqui.

    2. O CONTEÚDO PINTAVA POR CIMA DELA. A barra tem `z-10` e
       `backdrop-blur`, e cada um dos dois já abre um contexto de
       empilhamento. Dentro dele, `z-50` só disputa com irmãos: o
       `<main>`, que também é `z-10` e vem depois no HTML, ganhava
       sempre. Enquanto a caixa ficava escondida atrás da barra ninguém
       notava; assim que ela passou a sobrar para o lado, o título da
       página apareceu por cima.

    3. CLICAR FORA NÃO FECHAVA. A tela de captura era `fixed inset-0`, e
       `backdrop-filter` no ancestral faz `fixed` se medir POR ELE, e não
       pela janela. A captura cobria a barra lateral, e só.

    O portal resolve os três de uma vez: a caixa vira filha do `body`,
    onde não há contexto de empilhamento por cima dela, nem ancestral
    que a corte ou a prenda.

    O preço é a posição, que passa a ser medida. E isso é bom: a
    distância entre o sino e a borda muda com a largura da tela, com o
    menu recolhido e com a faixa do topo virar coluna, e nenhuma regra
    de CSS acerta as três.

    A ORDEM DAS TENTATIVAS é o que faz a caixa parecer pendurada no sino
    em vez de jogada na tela:

      1. encostar a direita da caixa na direita do sino;
      2. não coube pela esquerda? abrir para a DIREITA, a partir da
         esquerda do sino. É o caso do computador, onde o sino está a
         178px da borda e a caixa tem 352;
      3. ainda não coube? aí sim, encostar no respiro da borda.

    Medida também na rolagem, e não só no clique: `fixed` fica parado
    enquanto o sino sobe, e sem isso a caixa se soltaria do botão.
  */
  const botao = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);

  const medir = useCallback(() => {
    const b = botao.current;
    if (!b) return;

    const RESPIRO = 12;
    const r = b.getBoundingClientRect();
    const largura = Math.min(352, window.innerWidth - RESPIRO * 2);

    let esquerda = r.right - largura;
    if (esquerda < RESPIRO) esquerda = r.left;
    if (esquerda + largura > window.innerWidth - RESPIRO) {
      esquerda = Math.max(RESPIRO, window.innerWidth - RESPIRO - largura);
    }

    setPos({ top: r.bottom + 8, left: esquerda, width: largura });
  }, []);

  /* Girar o aparelho, arrastar a janela ou rolar a página com a caixa
     aberta muda a conta inteira. `capture` porque a rolagem pode
     acontecer num elemento interno, e esse evento não sobe. */
  useEffect(() => {
    if (!aberto) return;
    const refazer = () => medir();
    window.addEventListener('resize', refazer);
    window.addEventListener('scroll', refazer, { capture: true, passive: true });
    return () => {
      window.removeEventListener('resize', refazer);
      window.removeEventListener('scroll', refazer, { capture: true });
    };
  }, [aberto, medir]);

  return (
    <div className="relative">
      <button
        ref={botao}
        type="button"
        onClick={() => {
          /* Mede ANTES de abrir: medir depois, num efeito, pintaria a
             caixa uma vez no lugar errado e a corrigiria no quadro
             seguinte, que é um pulo visível. */
          medir();
          setAberto((a) => !a);
        }}
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

      {aberto && pos
        ? createPortal(
            <>
              {/* Clicar fora fecha. Sem isso a caixa fica aberta cobrindo
                  o menu, e a saída vira adivinhação. Aqui no `body` ela
                  cobre a janela inteira, e não só a barra lateral. */}
              <button
                type="button"
                aria-label="Fechar avisos"
                onClick={() => setAberto(false)}
                className="fixed inset-0 z-[60] cursor-default"
              />

              <div
                style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width }}
                className="z-[61] max-h-[70vh] overflow-y-auto rounded-2xl border border-fio bg-marinho-fundo/95 shadow-2xl backdrop-blur"
              >
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
            </>,
            document.body,
          )
        : null}
    </div>
  );
}
