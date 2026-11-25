'use client';

import { useState, useId } from 'react';
import type { DiaKpi, CanalKpi, MesFinanceiro, Marco } from '@/lib/dados/tipos';
import {
  dinheiroCurto,
  dinheiro,
  dinheiroExato,
  contagemCurta,
  numero,
  diaCurto,
  diaLongo,
  vezes,
  nomeCanal,
  porcento,
} from '@/lib/formato';
import {
  COR_RECEITA,
  COR_INVESTIMENTO,
  COR_FATURADO,
  COR_RECEBIDO,
  corDoCanal,
  GRADE,
  EIXO,
} from './paleta';

const CLASSE_TOOLTIP =
  'pointer-events-none z-10 rounded-2xl border border-fio bg-[var(--p-card,#FFFFFF)] p-4 shadow-[0_14px_34px_rgba(11,23,48,0.14)] backdrop-blur print:hidden';

/* ==================================================================
   SÉRIE TEMPORAL: receita e investimento
   ================================================================== */

const L = 68;
const R = 22;
const T = 12;
const B = 26;
const W = 720;
const H = 260;

export function SerieTempo({ serie }: { serie: DiaKpi[] }) {
  const [ativo, setAtivo] = useState<number | null>(null);
  const id = useId();

  if (serie.length < 2) {
    return (
      <p className="py-16 text-center text-sm text-cinza">
        Ainda não há dias suficientes para desenhar a série.
      </p>
    );
  }

  const max = Math.max(...serie.map((d) => Math.max(d.receita, d.investimento)));
  const teto = max * 1.12 || 1;

  const px = (i: number) => L + (i * (W - L - R)) / (serie.length - 1);
  const py = (v: number) => T + (H - T - B) * (1 - v / teto);

  const linha = (sel: (d: DiaKpi) => number) =>
    serie.map((d, i) => `${i === 0 ? 'M' : 'L'} ${px(i).toFixed(1)} ${py(sel(d)).toFixed(1)}`).join(' ');

  const area = (sel: (d: DiaKpi) => number) =>
    `${linha(sel)} L ${px(serie.length - 1).toFixed(1)} ${py(0)} L ${px(0).toFixed(1)} ${py(0)} Z`;

  const marcas = [0, 0.25, 0.5, 0.75, 1].map((f) => f * teto);
  const passo = Math.max(1, Math.floor(serie.length / 6));
  const d = ativo === null ? null : serie[ativo];

  return (
    <figure className="relative">
      <figcaption className="mb-4 flex flex-wrap items-center gap-5">
        {[
          { c: COR_RECEITA, n: 'Receita aprovada' },
          { c: COR_INVESTIMENTO, n: 'Investimento em mídia' },
        ].map((s) => (
          <span key={s.n} className="flex items-center gap-2 text-xs font-medium text-neve">
            <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ background: s.c }} />
            {s.n}
          </span>
        ))}
      </figcaption>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label={`Receita e investimento diários dos últimos ${serie.length} dias`}
        onMouseLeave={() => setAtivo(null)}
      >
        <defs>
          <linearGradient id={`${id}-rec`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={COR_RECEITA} stopOpacity="0.22" />
            <stop offset="100%" stopColor={COR_RECEITA} stopOpacity="0" />
          </linearGradient>
        </defs>

        {marcas.map((v, i) => (
          <g key={i}>
            <line
              x1={L}
              y1={py(v)}
              x2={W - R}
              y2={py(v)}
              stroke={GRADE}
              strokeDasharray={i === 0 ? undefined : '4 4'}
              strokeWidth="1"
            />
            <text
              x={L - 8}
              y={py(v) + 4}
              textAnchor="end"
              fontSize="10"
              fill={EIXO}
              fontFamily="var(--font-mono)"
            >
              {i === 0 ? '0' : dinheiroCurto(v).replace('R$ ', '')}
            </text>
          </g>
        ))}

        <path d={area((x) => x.receita)} fill={`url(#${id}-rec)`} />

        <path
          d={linha((x) => x.investimento)}
          fill="none"
          stroke={COR_INVESTIMENTO}
          strokeWidth="2.2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <path
          d={linha((x) => x.receita)}
          fill="none"
          stroke={COR_RECEITA}
          strokeWidth="2.4"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {serie.map((s, i) =>
          i % passo === 0 || i === serie.length - 1 ? (
            <text
              key={s.dia}
              x={px(i)}
              y={H - 8}
              textAnchor="middle"
              fontSize="10"
              fill={EIXO}
              fontFamily="var(--font-mono)"
            >
              {diaCurto(s.dia)}
            </text>
          ) : null,
        )}

        {ativo !== null && d ? (
          <g pointerEvents="none">
            <line
              x1={px(ativo)}
              y1={T}
              x2={px(ativo)}
              y2={H - B}
              stroke="var(--p-azul-vivo, #1D4ED8)"
              strokeOpacity="0.35"
              strokeDasharray="3 3"
              strokeWidth="1.2"
            />
            <circle
              cx={px(ativo)}
              cy={py(d.investimento)}
              r="5"
              fill={COR_INVESTIMENTO}
              stroke="var(--p-card, #FFFFFF)"
              strokeWidth="2.2"
            />
            <circle
              cx={px(ativo)}
              cy={py(d.receita)}
              r="5"
              fill={COR_RECEITA}
              stroke="var(--p-card, #FFFFFF)"
              strokeWidth="2.2"
            />
          </g>
        ) : null}

        {serie.map((s, i) => (
          <rect
            key={s.dia}
            x={px(i) - (W - L - R) / (serie.length - 1) / 2}
            y={T}
            width={(W - L - R) / (serie.length - 1)}
            height={H - T - B}
            fill="transparent"
            onMouseEnter={() => setAtivo(i)}
          />
        ))}
      </svg>

      {d ? (
        <div
          className={`absolute top-10 min-w-[13.5rem] ${CLASSE_TOOLTIP}`}
          style={{
            left: `${(px(ativo!) / W) * 100}%`,
            transform: ativo! > serie.length / 2 ? 'translateX(-105%)' : 'translateX(5%)',
          }}
        >
          <p className="font-mono text-[0.72rem] uppercase tracking-[0.12em] text-cinza">
            {diaLongo(d.dia)}
          </p>
          <dl className="mt-3 space-y-2 text-sm">
            {[
              { c: COR_RECEITA, n: 'Receita', v: dinheiro(d.receita) },
              { c: COR_INVESTIMENTO, n: 'Investimento', v: dinheiro(d.investimento) },
            ].map((l) => (
              <div key={l.n} className="flex items-center justify-between gap-6">
                <dt className="flex items-center gap-2 text-cinza">
                  <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: l.c }} />
                  {l.n}
                </dt>
                <dd className="tabular font-semibold text-branco">{l.v}</dd>
              </div>
            ))}
            <div className="flex items-center justify-between gap-6 border-t border-fio pt-2">
              <dt className="text-cinza">MER</dt>
              <dd className="tabular font-semibold text-branco">{vezes(d.mer)}</dd>
            </div>
          </dl>
        </div>
      ) : null}
    </figure>
  );
}

/* ==================================================================
   BARRAS POR CANAL
   ================================================================== */

export type MedidaCanal =
  | 'receita'
  | 'roas'
  | 'investimento'
  | 'conversas'
  | 'leads'
  | 'cliques';

export function BarrasCanal({
  canais,
  medida = 'receita',
}: {
  canais: CanalKpi[];
  medida?: MedidaCanal;
}) {
  const [ativo, setAtivo] = useState<string | null>(null);

  const valor = (c: CanalKpi) => {
    switch (medida) {
      case 'investimento':
        return c.investimento;
      case 'conversas':
        return c.conversas;
      case 'leads':
        return c.leadsCaptados;
      case 'cliques':
        return c.cliquesLink;
      case 'roas':
        return c.roas ?? c.roasDeclarado ?? 0;
      default:
        return c.receita;
    }
  };
  const max = Math.max(...canais.map(valor), 1);
  const fmt = (c: CanalKpi) => {
    switch (medida) {
      case 'investimento':
        return c.investimento > 0 ? dinheiro(c.investimento) : '—';
      case 'conversas':
        return numero(c.conversas);
      case 'leads':
        return numero(c.leadsCaptados);
      case 'cliques':
        return numero(c.cliquesLink);
      case 'roas':
        return vezes(c.roas ?? c.roasDeclarado);
      default:
        return dinheiro(c.receita);
    }
  };

  return (
    <ul className="space-y-4">
      {canais.map((c) => {
        const v = valor(c);
        const largura = v > 0 ? Math.max((v / max) * 100, 2) : 0;
        const semInvestimento = medida === 'roas' && c.roas === null && c.roasDeclarado === null;

        return (
          <li
            key={c.canal}
            onMouseEnter={() => setAtivo(c.canal)}
            onMouseLeave={() => setAtivo(null)}
            className="group relative"
          >
            <div className="flex items-baseline justify-between gap-4">
              <span className="flex items-center gap-2.5 text-sm font-medium text-neve">
                <span
                  aria-hidden
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: corDoCanal(c.canal) }}
                />
                {nomeCanal(c.canal)}
              </span>
              <span className="tabular text-sm font-semibold text-branco">
                {semInvestimento ? 'sem mídia' : fmt(c)}
              </span>
            </div>

            <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-fio/70">
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{
                  width: `${semInvestimento ? 0 : largura}%`,
                  background: corDoCanal(c.canal),
                }}
              />
            </div>

            {ativo === c.canal ? (
              <div className={`absolute right-0 top-full mt-2 min-w-[13.5rem] text-xs ${CLASSE_TOOLTIP}`}>
                <dl className="space-y-1.5">
                  {[
                    ['Investimento', c.investimento > 0 ? dinheiro(c.investimento) : '—'],
                    ...(c.conversas > 0 ? [['Conversas', numero(c.conversas)]] : []),
                    ...(c.leadsCaptados > 0 ? [['Leads', numero(c.leadsCaptados)]] : []),
                    ...(c.receita > 0 ? [['Receita loja', dinheiro(c.receita)]] : []),
                    ['Cliques link', numero(c.cliquesLink)],
                    ['CPC', c.cpc === null ? '—' : dinheiroExato(c.cpc)],
                    ['CTR', porcento(c.ctr, 2)],
                  ].map(([k, val]) => (
                    <div key={k} className="flex justify-between gap-6">
                      <dt className="text-cinza">{k}</dt>
                      <dd className="tabular font-medium text-branco">{val}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

/* ==================================================================
   SÉRIE TEMPORAL MULTI-NICHO
   ================================================================== */

export function SerieMultinicho({
  serie,
  modo,
  rotuloResultado,
  perfil,
  marcos = [],
}: {
  serie: DiaKpi[];
  modo: 'moeda_dupla' | 'verba_e_volume';
  rotuloResultado: string;
  perfil: 'whatsapp' | 'leads' | 'ecommerce' | 'vendas_midia' | 'branding' | 'personalizado';
  marcos?: Marco[];
}) {
  const [ativo, setAtivo] = useState<number | null>(null);
  const id = useId();

  if (serie.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-cinza">
        Nenhum dado registrado neste período ainda.
      </p>
    );
  }

  const extrair = (d: DiaKpi): number => {
    switch (perfil) {
      case 'ecommerce':
        return d.receita;
      case 'vendas_midia':
        return d.receitaAtribuida;
      case 'leads':
        return d.leadsCaptados;
      case 'branding':
        return d.alcance > 0 ? d.alcance : d.impressoes;
      default:
        return d.conversas > 0 ? d.conversas : d.cliquesLink || d.cliques;
    }
  };

  if (serie.length === 1) {
    const unico = serie[0];
    const res = extrair(unico);
    return (
      <div className="flex flex-wrap items-center justify-between gap-6 py-8">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.12em] text-cinza">
            {diaLongo(unico.dia)} (1 dia no recorte)
          </p>
          <p className="mt-2 font-display text-2xl font-extrabold text-branco">
            {modo === 'moeda_dupla' ? dinheiro(res) : `${numero(res)} ${rotuloResultado.toLowerCase()}`}
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-xs uppercase tracking-[0.12em] text-cinza">Investimento</p>
          <p className="tabular mt-2 font-display text-xl font-bold text-neve">
            {dinheiro(unico.investimento)}
          </p>
        </div>
      </div>
    );
  }

  const marcosPorDia = new Map<string, Marco>();
  for (const m of marcos) {
    if (!marcosPorDia.has(m.dia)) marcosPorDia.set(m.dia, m);
  }

  const MR_DIR = modo === 'verba_e_volume' ? 62 : R;
  const maxRes = Math.max(...serie.map(extrair), 1);
  const maxInv = Math.max(...serie.map((d) => d.investimento), 1);
  const tetoComum = Math.max(maxRes, maxInv) * 1.14 || 1;
  const tetoRes = (modo === 'moeda_dupla' ? tetoComum : maxRes * 1.18) || 1;
  const tetoInv = (modo === 'moeda_dupla' ? tetoComum : maxInv * 1.25) || 1;

  const larguraUtil = W - L - MR_DIR;
  const alturaUtil = H - T - B;
  const px = (i: number) => L + (i * larguraUtil) / (serie.length - 1);
  const pyRes = (v: number) => T + alturaUtil * (1 - v / tetoRes);
  const pyInv = (v: number) => T + alturaUtil * (1 - v / tetoInv);

  const linha = (sel: (d: DiaKpi) => number, mapY: (v: number) => number) =>
    serie.map((d, i) => `${i === 0 ? 'M' : 'L'} ${px(i).toFixed(1)} ${mapY(sel(d)).toFixed(1)}`).join(' ');

  const area = (sel: (d: DiaKpi) => number, mapY: (v: number) => number) =>
    `${linha(sel, mapY)} L ${px(serie.length - 1).toFixed(1)} ${(T + alturaUtil).toFixed(1)} L ${px(0).toFixed(1)} ${(T + alturaUtil).toFixed(1)} Z`;

  const marcasEsq = [0, 0.5, 1].map((f) => f * tetoRes);
  const marcasDir = [0, 0.5, 1].map((f) => f * tetoInv);
  const passoX = Math.max(1, Math.floor(serie.length / 6));
  const larguraBarra = Math.max(5, Math.min(22, (larguraUtil / serie.length) * 0.58));
  const raioBarra = Math.min(7, larguraBarra / 2);

  const d = ativo === null ? null : serie[ativo];
  const marcoAtivo = d ? marcosPorDia.get(d.dia) : undefined;

  return (
    <figure className="relative">
      <figcaption className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-5">
          <span className="flex items-center gap-2 text-xs font-medium text-neve">
            <span
              aria-hidden
              className={modo === 'verba_e_volume' ? 'h-2.5 w-2.5 rounded-sm' : 'h-2.5 w-2.5 rounded-full'}
              style={{ background: COR_RECEITA }}
            />
            {rotuloResultado}
          </span>
          <span className="flex items-center gap-2 text-xs font-medium text-neve">
            <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ background: COR_INVESTIMENTO }} />
            Investimento em mídia
          </span>
        </div>
        {marcosPorDia.size > 0 ? (
          <span className="font-mono text-[0.7rem] uppercase tracking-[0.12em] text-cinza">
            ◆ marco do diário de bordo
          </span>
        ) : null}
      </figcaption>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label={`${rotuloResultado} e investimento nos ${serie.length} dias selecionados`}
        onMouseLeave={() => setAtivo(null)}
      >
        <defs>
          <linearGradient id={`${id}-res`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={COR_RECEITA} stopOpacity="0.22" />
            <stop offset="100%" stopColor={COR_RECEITA} stopOpacity="0" />
          </linearGradient>
        </defs>

        {marcasEsq.map((v, i) => (
          <g key={i}>
            <line
              x1={L}
              y1={pyRes(v)}
              x2={W - MR_DIR}
              y2={pyRes(v)}
              stroke={GRADE}
              strokeDasharray={i === 0 ? undefined : '4 4'}
              strokeWidth="1"
            />
            <text
              x={L - 8}
              y={pyRes(v) + 4}
              textAnchor="end"
              fontSize="10"
              fill={EIXO}
              fontFamily="var(--font-mono)"
            >
              {i === 0
                ? '0'
                : modo === 'moeda_dupla'
                  ? dinheiroCurto(v).replace('R$ ', '')
                  : contagemCurta(Math.round(v))}
            </text>
          </g>
        ))}

        {modo === 'verba_e_volume'
          ? marcasDir.map((v, i) => (
              <text
                key={i}
                x={W - MR_DIR + 8}
                y={pyInv(v) + 4}
                textAnchor="start"
                fontSize="10"
                fill={EIXO}
                fontFamily="var(--font-mono)"
              >
                {i === 0 ? 'R$ 0' : dinheiroCurto(v)}
              </text>
            ))
          : null}

        {modo === 'moeda_dupla' ? (
          <>
            <path d={area(extrair, pyRes)} fill={`url(#${id}-res)`} />
            <path
              d={linha((x) => x.investimento, pyInv)}
              fill="none"
              stroke={COR_INVESTIMENTO}
              strokeWidth="2.1"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            <path
              d={linha(extrair, pyRes)}
              fill="none"
              stroke={COR_RECEITA}
              strokeWidth="2.4"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </>
        ) : (
          <>
            {serie.map((s, i) => {
              const val = extrair(s);
              const topo = pyRes(val);
              const alt = Math.max(T + alturaUtil - topo, val > 0 ? 3 : 0);
              const selecionado = ativo === i;
              return (
                <rect
                  key={s.dia}
                  x={px(i) - larguraBarra / 2}
                  y={topo}
                  width={larguraBarra}
                  height={alt}
                  rx={raioBarra}
                  fill={selecionado ? COR_INVESTIMENTO : COR_RECEITA}
                  fillOpacity={selecionado ? 0.96 : 0.78}
                />
              );
            })}
            <path
              d={linha((x) => x.investimento, pyInv)}
              fill="none"
              stroke={COR_INVESTIMENTO}
              strokeWidth="2.3"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </>
        )}

        {serie.map((s, i) =>
          marcosPorDia.has(s.dia) ? (
            <line
              key={`m-${s.dia}`}
              x1={px(i)}
              y1={T}
              x2={px(i)}
              y2={H - B}
              stroke="var(--p-azul-vivo, #1D4ED8)"
              strokeOpacity="0.45"
              strokeDasharray="3 3"
              strokeWidth="1.2"
            />
          ) : null,
        )}

        {serie.map((s, i) =>
          i % passoX === 0 || i === serie.length - 1 ? (
            <text
              key={s.dia}
              x={px(i)}
              y={H - 8}
              textAnchor="middle"
              fontSize="10"
              fill={EIXO}
              fontFamily="var(--font-mono)"
            >
              {diaCurto(s.dia)}
            </text>
          ) : null,
        )}

        {ativo !== null && d ? (
          <g pointerEvents="none">
            <line
              x1={px(ativo)}
              y1={T}
              x2={px(ativo)}
              y2={H - B}
              stroke="var(--p-azul-vivo, #1D4ED8)"
              strokeOpacity="0.35"
              strokeDasharray="3 3"
              strokeWidth="1.2"
            />
            <circle
              cx={px(ativo)}
              cy={pyInv(d.investimento)}
              r="5"
              fill={COR_INVESTIMENTO}
              stroke="var(--p-card, #FFFFFF)"
              strokeWidth="2.2"
            />
            <circle
              cx={px(ativo)}
              cy={pyRes(extrair(d))}
              r="5"
              fill={COR_RECEITA}
              stroke="var(--p-card, #FFFFFF)"
              strokeWidth="2.2"
            />
          </g>
        ) : null}

        {serie.map((s, i) => (
          <rect
            key={s.dia}
            x={px(i) - larguraUtil / (serie.length - 1) / 2}
            y={T}
            width={larguraUtil / (serie.length - 1)}
            height={alturaUtil}
            fill="transparent"
            onMouseEnter={() => setAtivo(i)}
          />
        ))}
      </svg>

      {d ? (
        <div
          className={`absolute top-10 min-w-[14rem] ${CLASSE_TOOLTIP}`}
          style={{
            left: `${(px(ativo!) / W) * 100}%`,
            transform: ativo! > serie.length / 2 ? 'translateX(-105%)' : 'translateX(5%)',
          }}
        >
          <p className="font-mono text-[0.72rem] uppercase tracking-[0.12em] text-cinza">
            {diaLongo(d.dia)}
          </p>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex items-center justify-between gap-6">
              <dt className="flex items-center gap-2 text-cinza">
                <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: COR_RECEITA }} />
                {rotuloResultado}
              </dt>
              <dd className="tabular font-semibold text-branco">
                {modo === 'moeda_dupla' ? dinheiro(extrair(d)) : numero(extrair(d))}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-6">
              <dt className="flex items-center gap-2 text-cinza">
                <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: COR_INVESTIMENTO }} />
                Investimento
              </dt>
              <dd className="tabular font-semibold text-branco">{dinheiroExato(d.investimento)}</dd>
            </div>
            {modo === 'verba_e_volume' && extrair(d) > 0 && d.investimento > 0 ? (
              <div className="flex items-center justify-between gap-6 border-t border-fio pt-2 text-xs">
                <dt className="text-cinza">Custo unitário no dia</dt>
                <dd className="tabular font-semibold text-neve">
                  {dinheiroExato(d.investimento / extrair(d))}
                </dd>
              </div>
            ) : null}
            {marcoAtivo ? (
              <div className="border-t border-fio pt-2 text-xs font-medium text-magenta-texto">
                ◆ {marcoAtivo.titulo}
              </div>
            ) : null}
          </dl>
        </div>
      ) : null}
    </figure>
  );
}

/* ==================================================================
   DOZE MESES: faturado contra recebido
   ================================================================== */

const MW = 720;
const MH = 240;
const ML = 62;
const MR = 14;
const MT = 12;
const MB = 30;

export function BarrasMes({ serie }: { serie: MesFinanceiro[] }) {
  const [ativo, setAtivo] = useState<number | null>(null);

  if (serie.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-cinza">
        Ainda não há histórico para desenhar.
      </p>
    );
  }

  const max = Math.max(...serie.flatMap((m) => [m.faturado, m.recebido]), 1);

  const areaX = MW - ML - MR;
  const areaY = MH - MT - MB;
  const passo = areaX / serie.length;
  const larguraBarra = Math.max((passo - 12) / 2, 4);
  const raio = Math.min(6, larguraBarra / 2);

  const y = (v: number) => MT + areaY - (v / max) * areaY;
  const alturaDe = (v: number) => Math.max((v / max) * areaY, v > 0 ? 3 : 0);

  const rotuloMes = (iso: string) => {
    const [a, m] = iso.split('-');
    return `${['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'][Number(m) - 1]}/${a.slice(2)}`;
  };

  const marcas = [0, 0.5, 1].map((f) => f * max);
  const m = ativo === null ? null : serie[ativo];

  return (
    <figure className="m-0">
      <figcaption className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium">
        {[
          ['Faturado', COR_FATURADO],
          ['Recebido', COR_RECEBIDO],
        ].map(([rotulo, cor]) => (
          <span key={rotulo} className="flex items-center gap-2 text-neve">
            <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ background: cor }} />
            {rotulo}
          </span>
        ))}
      </figcaption>

      <div className="relative">
        <svg
          viewBox={`0 0 ${MW} ${MH}`}
          className="w-full"
          role="img"
          aria-label="Faturado e recebido nos últimos doze meses"
          onMouseLeave={() => setAtivo(null)}
        >
          {marcas.map((v, idx) => (
            <g key={v}>
              <line
                x1={ML}
                x2={MW - MR}
                y1={y(v)}
                y2={y(v)}
                stroke={GRADE}
                strokeDasharray={idx === 0 ? undefined : '4 4'}
                strokeWidth={1}
              />
              <text
                x={ML - 8}
                y={y(v) + 4}
                textAnchor="end"
                className="tabular"
                fill={EIXO}
                fontSize={11}
                fontFamily="var(--fonte-mono, monospace)"
              >
                {dinheiroCurto(v)}
              </text>
            </g>
          ))}

          {serie.map((mes, i) => {
            const x0 = ML + i * passo;
            const destaque = ativo === i;
            return (
              <g key={mes.mes}>
                <rect
                  x={x0 + 2}
                  y={MT}
                  width={passo - 4}
                  height={areaY}
                  rx={8}
                  fill={destaque ? 'var(--p-azul-suave, rgba(29,78,216,0.08))' : 'transparent'}
                  onMouseEnter={() => setAtivo(i)}
                />
                <rect
                  x={x0 + passo / 2 - larguraBarra - 1.5}
                  y={y(mes.faturado)}
                  width={larguraBarra}
                  height={alturaDe(mes.faturado)}
                  rx={raio}
                  fill={COR_FATURADO}
                  pointerEvents="none"
                />
                <rect
                  x={x0 + passo / 2 + 1.5}
                  y={y(mes.recebido)}
                  width={larguraBarra}
                  height={alturaDe(mes.recebido)}
                  rx={raio}
                  fill={COR_RECEBIDO}
                  pointerEvents="none"
                />
                <text
                  x={x0 + passo / 2}
                  y={MH - 10}
                  textAnchor="middle"
                  fill={EIXO}
                  fontSize={11}
                  fontFamily="var(--fonte-mono, monospace)"
                  pointerEvents="none"
                >
                  {rotuloMes(mes.mes)}
                </text>
              </g>
            );
          })}
        </svg>

        {m ? (
          <div className={`absolute right-0 top-0 min-w-[13.5rem] text-xs ${CLASSE_TOOLTIP}`}>
            <p className="font-mono text-[0.72rem] uppercase tracking-[0.12em] text-cinza">
              {rotuloMes(m.mes)}
            </p>
            <dl className="mt-2.5 space-y-1.5">
              {[
                ['Faturado', dinheiro(m.faturado)],
                ['Recebido', dinheiro(m.recebido)],
                ['Despesa', dinheiro(m.despesa)],
                ['Resultado', dinheiro(m.recebido - m.despesa)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-6">
                  <dt className="text-cinza">{k}</dt>
                  <dd className="tabular font-semibold text-branco">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        ) : null}
      </div>

      <details className="mt-4">
        <summary className="cursor-pointer text-xs font-medium text-cinza hover:text-neve">
          Ver os números
        </summary>
        <div className="mt-3 overflow-x-auto rounded-xl border border-fio">
          <table className="w-full min-w-[30rem] border-collapse text-left text-xs">
            <caption className="sr-only">Faturado, recebido e despesa por mês</caption>
            <thead>
              <tr className="bg-marinho-alto/50">
                {['Mês', 'Faturado', 'Recebido', 'Despesa'].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-4 py-3 font-mono text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-cinza"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {serie.map((mes) => (
                <tr key={mes.mes}>
                  <th scope="row" className="border-t border-fio px-4 py-2.5 font-medium text-neve">
                    {rotuloMes(mes.mes)}
                  </th>
                  <td className="tabular border-t border-fio px-4 py-2.5">{dinheiro(mes.faturado)}</td>
                  <td className="tabular border-t border-fio px-4 py-2.5">{dinheiro(mes.recebido)}</td>
                  <td className="tabular border-t border-fio px-4 py-2.5">{dinheiro(mes.despesa)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
