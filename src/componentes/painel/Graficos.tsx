'use client';

import { useState, useId } from 'react';
import type { DiaKpi, CanalKpi, MesFinanceiro } from '@/lib/dados/tipos';
import { dinheiroCurto, dinheiro, diaCurto, diaLongo, vezes, nomeCanal, porcento } from '@/lib/formato';
import {
  COR_RECEITA,
  COR_INVESTIMENTO,
  COR_FATURADO,
  COR_RECEBIDO,
  corDoCanal,
  GRADE,
  EIXO,
} from './paleta';

/* ==================================================================
   SÉRIE TEMPORAL: receita e investimento

   Duas linhas, UM eixo. As duas medidas estão em reais e na mesma
   ordem de grandeza, então compartilham escala e a comparação visual
   entre elas é honesta. Dois eixos y transformariam o cruzamento das
   linhas em coincidência de escala escolhida por quem desenhou.

   Sem biblioteca: é SVG puro. Uma biblioteca de gráfico custaria
   dezenas de KB para desenhar duas polilinhas.
   ================================================================== */

/*
  Margens medidas, e não chutadas.

  L=68: o maior rótulo do eixo é "13,7 mil", oito caracteres em mono de
  10px, uns 48px, mais 8px de respiro até a grade. Com os 52px que eu
  tinha posto antes, o texto vazava para fora do viewBox e aparecia
  cortado como ".3,7 mil".

  R=22: a última data do eixo x é centrada no ponto final. Com R=12 a
  metade direita de "19/08" saía do quadro.
*/
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

  /* A escala parte SEMPRE do zero. Eixo truncado é a forma mais fácil
     de transformar uma variação de 3% num precipício visual. */
  const max = Math.max(...serie.map((d) => Math.max(d.receita, d.investimento)));
  const teto = max * 1.12 || 1;

  const px = (i: number) => L + (i * (W - L - R)) / (serie.length - 1);
  const py = (v: number) => T + (H - T - B) * (1 - v / teto);

  const linha = (sel: (d: DiaKpi) => number) =>
    serie.map((d, i) => `${i === 0 ? 'M' : 'L'} ${px(i).toFixed(1)} ${py(sel(d)).toFixed(1)}`).join(' ');

  const area = (sel: (d: DiaKpi) => number) =>
    `${linha(sel)} L ${px(serie.length - 1).toFixed(1)} ${py(0)} L ${px(0).toFixed(1)} ${py(0)} Z`;

  /* Quatro marcas no eixo y bastam. Mais que isso vira grade de
     caderno e compete com o dado. */
  const marcas = [0, 0.25, 0.5, 0.75, 1].map((f) => f * teto);

  /* Rótulos de x: primeiro, último e alguns no meio, para não
     empilhar 30 datas em 720px. */
  const passo = Math.max(1, Math.floor(serie.length / 6));

  const d = ativo === null ? null : serie[ativo];

  return (
    <figure className="relative">
      {/* Legenda sempre presente com duas séries: identidade nunca pode
          depender só da cor. */}
      <figcaption className="mb-4 flex flex-wrap items-center gap-5">
        {[
          { c: COR_RECEITA, n: 'Receita aprovada' },
          { c: COR_INVESTIMENTO, n: 'Investimento em mídia' },
        ].map((s) => (
          <span key={s.n} className="flex items-center gap-2 text-xs text-neve">
            <span
              aria-hidden
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: s.c }}
            />
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
            <stop offset="0%" stopColor={COR_RECEITA} stopOpacity="0.28" />
            <stop offset="100%" stopColor={COR_RECEITA} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grade recessiva */}
        {marcas.map((v, i) => (
          <g key={i}>
            <line x1={L} y1={py(v)} x2={W - R} y2={py(v)} stroke={GRADE} strokeWidth="1" />
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

        {/* Área só sob a receita: ela é a medida principal. Área nas
            duas viraria sopa de transparência sobreposta. */}
        <path d={area((x) => x.receita)} fill={`url(#${id}-rec)`} />

        <path d={linha((x) => x.investimento)} fill="none" stroke={COR_INVESTIMENTO} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        <path d={linha((x) => x.receita)} fill="none" stroke={COR_RECEITA} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        {/* Datas */}
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

        {/* Cruz do ponto ativo */}
        {ativo !== null && d ? (
          <g pointerEvents="none">
            <line x1={px(ativo)} y1={T} x2={px(ativo)} y2={H - B} stroke="rgba(255,255,255,0.28)" strokeWidth="1" />
            {/* Anel na cor da superfície separa o marcador da linha. */}
            <circle cx={px(ativo)} cy={py(d.investimento)} r="5" fill={COR_INVESTIMENTO} stroke="#0B1730" strokeWidth="2" />
            <circle cx={px(ativo)} cy={py(d.receita)} r="5" fill={COR_RECEITA} stroke="#0B1730" strokeWidth="2" />
          </g>
        ) : null}

        {/* Faixas invisíveis de captura: alvo bem maior que o marcador,
            senão acertar um ponto de 5px vira teste de mira. */}
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

      {/* Tooltip fora do SVG: HTML posicionado, para herdar tipografia e
          não precisar recriar quebra de linha em SVG. */}
      {d ? (
        <div
          className="pointer-events-none absolute top-10 z-10 min-w-[13rem] rounded-xl border border-fio bg-marinho-fundo/95 p-4 shadow-2xl backdrop-blur"
          style={{
            left: `${(px(ativo!) / W) * 100}%`,
            transform: ativo! > serie.length / 2 ? 'translateX(-105%)' : 'translateX(5%)',
          }}
        >
          <p className="font-mono text-[0.75rem] uppercase tracking-[0.14em] text-cinza">
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

   Barra horizontal, e não pizza. Comparar comprimento é a tarefa
   visual mais precisa que existe; comparar ângulo de fatia é das
   piores, e piora quando as fatias são parecidas.
   ================================================================== */

export function BarrasCanal({
  canais,
  medida = 'receita',
}: {
  canais: CanalKpi[];
  medida?: 'receita' | 'roas';
}) {
  const [ativo, setAtivo] = useState<string | null>(null);

  const valor = (c: CanalKpi) => (medida === 'receita' ? c.receita : (c.roas ?? 0));
  const max = Math.max(...canais.map(valor), 1);
  const fmt = (c: CanalKpi) => (medida === 'receita' ? dinheiro(c.receita) : vezes(c.roas));

  return (
    <ul className="space-y-3.5">
      {canais.map((c) => {
        const largura = Math.max((valor(c) / max) * 100, 1.5);
        const semInvestimento = medida === 'roas' && c.roas === null;

        return (
          <li
            key={c.canal}
            onMouseEnter={() => setAtivo(c.canal)}
            onMouseLeave={() => setAtivo(null)}
            className="group relative"
          >
            <div className="flex items-baseline justify-between gap-4">
              <span className="flex items-center gap-2.5 text-sm text-neve">
                <span
                  aria-hidden
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: corDoCanal(c.canal) }}
                />
                {nomeCanal(c.canal)}
              </span>
              {/* Rótulo direto em toda barra: são cinco, e ler o valor
                  exato é o objetivo desta tela. */}
              <span className="tabular text-sm font-semibold text-branco">
                {semInvestimento ? 'sem mídia' : fmt(c)}
              </span>
            </div>

            <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-white/[0.05]">
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{
                  width: `${semInvestimento ? 0 : largura}%`,
                  background: corDoCanal(c.canal),
                }}
              />
            </div>

            {ativo === c.canal ? (
              <div className="absolute right-0 top-full z-10 mt-2 min-w-[12rem] rounded-xl border border-fio bg-marinho-fundo/95 p-3.5 text-xs shadow-2xl backdrop-blur">
                <dl className="space-y-1.5">
                  {[
                    ['Receita', dinheiro(c.receita)],
                    ['Investimento', c.investimento > 0 ? dinheiro(c.investimento) : '—'],
                    ['Pedidos', String(c.pedidos)],
                    ['ROAS', c.roas === null ? 'sem mídia' : vezes(c.roas)],
                    ['CTR', porcento(c.ctr, 2)],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-6">
                      <dt className="text-cinza">{k}</dt>
                      <dd className="tabular text-branco">{v}</dd>
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
   DOZE MESES: faturado contra recebido

   Barras agrupadas, UM eixo, escala partindo do zero. As duas medidas
   estão em reais, então a comparação visual entre elas é honesta.

   POR QUE AS DUAS SÉRIES, E NÃO SÓ UMA
   Faturado é o que foi emitido para a competência. Recebido é o que
   entrou no mês. Nunca batem: a fatura de agosto que o cliente paga em
   setembro conta em agosto num e em setembro no outro. É justamente a
   distância entre as duas barras que responde "o faturamento subiu e o
   caixa não" — a pergunta que agência costuma responder tarde demais.
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

  /* Sempre do zero. Eixo truncado faz uma queda de 5% parecer um
     desabamento, e num gráfico de dinheiro isso muda decisão. */
  const max = Math.max(...serie.flatMap((m) => [m.faturado, m.recebido]), 1);

  const areaX = MW - ML - MR;
  const areaY = MH - MT - MB;
  const passo = areaX / serie.length;

  /* Duas barras finas dentro do passo, com 2px de superfície entre
     elas: fatia colada em fatia lê como uma barra só. */
  const larguraBarra = Math.max((passo - 10) / 2, 3);

  const y = (v: number) => MT + areaY - (v / max) * areaY;
  const alturaDe = (v: number) => Math.max((v / max) * areaY, v > 0 ? 2 : 0);

  const rotuloMes = (iso: string) => {
    const [a, m] = iso.split('-');
    return `${['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'][Number(m) - 1]}/${a.slice(2)}`;
  };

  const marcas = [0, 0.5, 1].map((f) => f * max);
  const m = ativo === null ? null : serie[ativo];

  return (
    <figure className="m-0">
      {/* Legenda sempre presente com duas séries: identidade nunca é
          só cor. */}
      <figcaption className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
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
          {marcas.map((v) => (
            <g key={v}>
              <line x1={ML} x2={MW - MR} y1={y(v)} y2={y(v)} stroke={GRADE} strokeWidth={1} />
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
                {/* Alvo de toque do tamanho do passo inteiro, e não da
                    barra: acertar 15px com o dedo não acontece. */}
                <rect
                  x={x0}
                  y={MT}
                  width={passo}
                  height={areaY}
                  fill={destaque ? 'rgba(255,255,255,0.04)' : 'transparent'}
                  onMouseEnter={() => setAtivo(i)}
                />
                <rect
                  x={x0 + passo / 2 - larguraBarra - 1}
                  y={y(mes.faturado)}
                  width={larguraBarra}
                  height={alturaDe(mes.faturado)}
                  rx={3}
                  fill={COR_FATURADO}
                  pointerEvents="none"
                />
                <rect
                  x={x0 + passo / 2 + 1}
                  y={y(mes.recebido)}
                  width={larguraBarra}
                  height={alturaDe(mes.recebido)}
                  rx={3}
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
          <div className="pointer-events-none absolute right-0 top-0 min-w-[13rem] rounded-xl border border-fio bg-marinho-fundo/95 p-3.5 text-xs shadow-2xl backdrop-blur">
            <p className="font-mono text-[0.75rem] uppercase tracking-[0.12em] text-cinza">
              {rotuloMes(m.mes)}
            </p>
            <dl className="mt-2 space-y-1.5">
              {[
                ['Faturado', dinheiro(m.faturado)],
                ['Recebido', dinheiro(m.recebido)],
                ['Despesa', dinheiro(m.despesa)],
                ['Resultado', dinheiro(m.recebido - m.despesa)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-6">
                  <dt className="text-cinza">{k}</dt>
                  <dd className="tabular text-branco">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        ) : null}
      </div>

      {/* A tabela é a mesma informação sem depender de enxergar o
          desenho, e é o que um leitor de tela lê. */}
      <details className="mt-4">
        <summary className="cursor-pointer text-xs text-cinza hover:text-neve">
          Ver os números
        </summary>
        <div className="mt-3 overflow-x-auto rounded-xl border border-fio">
          <table className="w-full min-w-[30rem] border-collapse text-left text-xs">
            <caption className="sr-only">Faturado, recebido e despesa por mês</caption>
            <thead>
              <tr>
                {['Mês', 'Faturado', 'Recebido', 'Despesa'].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-4 py-3 font-mono text-[0.75rem] uppercase tracking-[0.12em] font-normal text-cinza"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {serie.map((mes) => (
                <tr key={mes.mes}>
                  <th scope="row" className="border-t border-fio px-4 py-2.5 font-normal text-neve">
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
