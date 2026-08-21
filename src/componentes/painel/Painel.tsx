import Link from 'next/link';
import type { ReactNode } from 'react';
import { CORES_SITUACAO } from './paleta';

/**
 * As peças de composição do painel.
 *
 * Existem para o painel parar de ser "cartão cinza com número dentro".
 * Cada uma resolve uma coisa que o painel não tinha: densidade,
 * hierarquia, movimento e sinal de estado.
 */

/* ================================================================== */
/* Anel de progresso                                                  */
/* ================================================================== */

/**
 * Progresso em anel, com o número no meio.
 *
 * Barra reta responde "quanto falta"; anel responde "quão perto do
 * fim". Numa lista de configuração, onde o fim é o objetivo, o anel
 * ganha — e ocupa a mesma área que o número sozinho ocuparia.
 *
 * SVG à mão porque o traço é uma linha: `stroke-dasharray` com o
 * perímetro do círculo. Biblioteca de gráfico para isto seria pagar
 * peso por uma conta de duas linhas.
 */
export function Anel({
  feito,
  total,
  tamanho = 88,
}: {
  feito: number;
  total: number;
  tamanho?: number;
}) {
  const r = (tamanho - 10) / 2;
  const perimetro = 2 * Math.PI * r;
  const fracao = total > 0 ? feito / total : 0;
  const completo = feito === total && total > 0;

  return (
    <div className="relative flex-none" style={{ width: tamanho, height: tamanho }}>
      <svg
        width={tamanho}
        height={tamanho}
        viewBox={`0 0 ${tamanho} ${tamanho}`}
        role="img"
        aria-label={`${feito} de ${total} concluídos`}
        className="-rotate-90"
      >
        <circle
          cx={tamanho / 2}
          cy={tamanho / 2}
          r={r}
          fill="none"
          stroke="var(--fio)"
          strokeWidth="6"
        />
        <circle
          cx={tamanho / 2}
          cy={tamanho / 2}
          r={r}
          fill="none"
          stroke={completo ? CORES_SITUACAO.saudavel : 'var(--magenta)'}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={perimetro}
          strokeDashoffset={perimetro * (1 - fracao)}
          style={{ transition: 'stroke-dashoffset 700ms cubic-bezier(.2,.8,.2,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="tabular font-display text-xl font-extrabold leading-none tracking-[-0.04em]">
          {feito}
          <span className="text-sm font-normal text-cinza">/{total}</span>
        </span>
      </div>
    </div>
  );
}

/* ================================================================== */
/* Cartão de número, com brilho                                       */
/* ================================================================== */

/**
 * Um número do topo do painel.
 *
 * A diferença para o `Kpi` da carteira: este é clicável, tem um traço
 * de cor na aresta esquerda para dar ritmo à faixa, e aceita um sinal
 * de estado. Quatro cartões idênticos em cinza são uma parede; quatro
 * com traço e destino são um índice.
 */
export function Numero({
  rotulo,
  valor,
  apoio,
  cor = 'var(--magenta)',
  href,
  alerta = false,
}: {
  rotulo: string;
  valor: string | number;
  apoio?: string;
  cor?: string;
  href?: string;
  alerta?: boolean;
}) {
  const corpo = (
    <>
      <span
        aria-hidden
        className="absolute inset-y-5 left-0 w-[3px] rounded-full transition-all duration-300 group-hover:inset-y-3"
        style={{ background: alerta ? CORES_SITUACAO.critico : cor }}
      />
      <p className="font-mono text-[0.75rem] uppercase tracking-[0.16em] text-cinza">{rotulo}</p>
      <p className="tabular mt-2.5 font-display text-[2rem] font-extrabold leading-none tracking-[-0.04em]">
        {valor}
      </p>
      {apoio ? (
        <p className="mt-2 text-xs leading-relaxed text-cinza">{apoio}</p>
      ) : null}
    </>
  );

  const classe =
    'cartao group relative overflow-hidden py-5 pl-6 pr-5 transition-transform duration-300 ' +
    (href ? 'hover:-translate-y-0.5' : '');

  return href ? (
    <Link href={href} className={classe}>
      {corpo}
    </Link>
  ) : (
    <div className={classe}>{corpo}</div>
  );
}

/* ================================================================== */
/* Cabeçalho de bloco                                                 */
/* ================================================================== */

export function Bloco({
  titulo,
  apoio,
  acao,
  children,
}: {
  titulo: string;
  apoio?: string;
  acao?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mt-12 first:mt-0">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-3 font-display text-xl font-extrabold tracking-[-0.03em]">
            <span aria-hidden className="h-4 w-1 flex-none rounded-full bg-magenta" />
            {titulo}
          </h2>
          {apoio ? (
            <p className="mt-2 max-w-[68ch] text-sm leading-relaxed text-cinza">{apoio}</p>
          ) : null}
        </div>
        {acao ? <div className="flex-none">{acao}</div> : null}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

/* ================================================================== */
/* Item de ação                                                       */
/* ================================================================== */

/**
 * Uma linha de "precisa de você".
 *
 * Severidade sai em cor, FORMA e texto. Cor sozinha não é informação
 * para quem não distingue verde de vermelho, e esta é a lista que
 * decide o que a pessoa vai fazer nos próximos dez minutos.
 */
export function Pendencia({
  severidade,
  titulo,
  detalhe,
  href,
  acao,
}: {
  severidade: 'critico' | 'atencao' | 'informativo';
  titulo: string;
  detalhe: string;
  href?: string;
  acao?: string;
}) {
  const cor =
    severidade === 'critico'
      ? CORES_SITUACAO.critico
      : severidade === 'atencao'
        ? CORES_SITUACAO.atencao
        : CORES_SITUACAO.sem_dado;

  const forma = severidade === 'critico' ? '■' : severidade === 'atencao' ? '▲' : '●';

  return (
    <li className="cartao group flex flex-wrap items-center gap-x-4 gap-y-3 p-5 transition-colors hover:border-fio-forte">
      <span
        aria-hidden
        className="flex h-9 w-9 flex-none items-center justify-center rounded-full text-sm"
        style={{ color: cor, background: `${cor}1a` }}
      >
        {forma}
      </span>

      <div className="min-w-0 grow">
        <p className="font-semibold text-branco">{titulo}</p>
        <p className="mt-1 text-xs leading-relaxed text-cinza">{detalhe}</p>
      </div>

      {href ? (
        <Link
          href={href}
          className="flex-none rounded-full border border-fio px-4 py-2 text-xs font-semibold text-neve transition-colors group-hover:border-magenta group-hover:bg-magenta group-hover:text-branco"
        >
          {acao ?? 'Abrir'}
        </Link>
      ) : null}
    </li>
  );
}

/* ================================================================== */
/* Atalho                                                             */
/* ================================================================== */

export function Atalho({
  titulo,
  descricao,
  href,
  simbolo,
}: {
  titulo: string;
  descricao: string;
  href: string;
  simbolo: string;
}) {
  return (
    <Link
      href={href}
      className="cartao group flex items-center gap-4 p-5 transition-transform duration-300 hover:-translate-y-0.5"
    >
      <span
        aria-hidden
        className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-magenta/12 font-display text-lg font-extrabold text-magenta-texto transition-colors group-hover:bg-magenta group-hover:text-branco"
      >
        {simbolo}
      </span>
      <span className="min-w-0">
        <span className="block font-semibold text-branco">{titulo}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-cinza">{descricao}</span>
      </span>
    </Link>
  );
}

/* ================================================================== */
/* Linha do tempo                                                     */
/* ================================================================== */

const SIMBOLO_EVENTO: Record<string, string> = {
  proposta: '§',
  sincronizacao: '↻',
  interacao: '“',
  marco: '◆',
  auditoria: '⌘',
};

export function LinhaDoTempo({
  eventos,
}: {
  eventos: { chave: string; tipo: string; titulo: string; detalhe: string | null; em: string; href: string | null }[];
}) {
  return (
    <ol className="relative space-y-1 pl-7">
      {/* O fio vertical que amarra os pontos. Sem ele, a lista é só uma
          pilha de linhas e a ordem cronológica some. */}
      <span aria-hidden className="absolute bottom-4 left-[7px] top-4 w-px bg-fio" />

      {eventos.map((e) => (
        <li key={e.chave} className="relative">
          <span
            aria-hidden
            className="absolute -left-7 top-3.5 flex h-[15px] w-[15px] items-center justify-center rounded-full border border-fio bg-marinho-fundo text-[0.55rem] text-magenta-texto"
          >
            {SIMBOLO_EVENTO[e.tipo] ?? '•'}
          </span>

          {e.href ? (
            <Link
              href={e.href}
              className="block rounded-xl px-3 py-2.5 transition-colors hover:bg-white/[0.04]"
            >
              <ConteudoEvento {...e} />
            </Link>
          ) : (
            <div className="px-3 py-2.5">
              <ConteudoEvento {...e} />
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}

function ConteudoEvento({
  titulo,
  detalhe,
  em,
}: {
  titulo: string;
  detalhe: string | null;
  em: string;
}) {
  return (
    <>
      <p className="flex flex-wrap items-baseline gap-x-3">
        <span className="text-sm text-neve">{titulo}</span>
        <span className="tabular font-mono text-[0.75rem] uppercase tracking-[0.1em] text-cinza">
          {new Date(em).toLocaleString('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </p>
      {detalhe ? <p className="mt-0.5 text-xs text-cinza">{detalhe}</p> : null}
    </>
  );
}
