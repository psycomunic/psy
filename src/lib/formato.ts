/**
 * Formatação de número para o painel.
 *
 * Um lugar só: "R$ 1.240" e "R$ 1.240,00" espalhados pela mesma tela é
 * o que faz um painel parecer feito por três pessoas diferentes.
 */

const BRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
});

const BRL_CENTAVOS = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const NUM = new Intl.NumberFormat('pt-BR');

export const dinheiro = (v: number | null | undefined) =>
  v === null || v === undefined ? '—' : BRL.format(v);

export const dinheiroExato = (v: number | null | undefined) =>
  v === null || v === undefined ? '—' : BRL_CENTAVOS.format(v);

export const numero = (v: number | null | undefined) =>
  v === null || v === undefined ? '—' : NUM.format(v);

/**
 * Dinheiro abreviado, para caber em eixo e cartão estreito.
 * 1.240.000 -> "1,2 mi" · 84.500 -> "84,5 mil"
 */
export function dinheiroCurto(v: number | null | undefined) {
  if (v === null || v === undefined) return '—';
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1).replace('.', ',')} mi`;
  if (abs >= 1_000) return `R$ ${(v / 1_000).toFixed(1).replace('.', ',')} mil`;
  return BRL.format(v);
}

export const porcento = (v: number | null | undefined, casas = 1) =>
  v === null || v === undefined ? '—' : `${v.toFixed(casas).replace('.', ',')}%`;

/** Multiplicador: ROAS e MER. "3,42x" */
export const vezes = (v: number | null | undefined) =>
  v === null || v === undefined ? '—' : `${v.toFixed(2).replace('.', ',')}x`;

/** Variação com sinal explícito. O "+" importa: sem ele, 12% e -12%
    parecem a mesma informação numa leitura rápida. */
export const variacao = (v: number | null | undefined) =>
  v === null || v === undefined ? '—' : `${v > 0 ? '+' : ''}${v.toFixed(1).replace('.', ',')}%`;

/** "2026-08-19" -> "19/08". Data curta para eixo e lista. */
export function diaCurto(iso: string) {
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
}

/** "2026-08-19" -> "19 de agosto". */
export function diaLongo(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
}

/** Dias entre hoje e uma data. Negativo = atrasado. */
export function diasAte(iso: string | null) {
  if (!iso) return null;
  const alvo = new Date(`${iso}T12:00:00`).getTime();
  const hoje = new Date();
  hoje.setHours(12, 0, 0, 0);
  return Math.round((alvo - hoje.getTime()) / 86400000);
}

export const rotuloCanal: Record<string, string> = {
  google: 'Google Ads',
  meta: 'Meta Ads',
  organico: 'Orgânico',
  direto: 'Direto',
  email: 'E-mail',
  loja: 'Loja',
};

export const nomeCanal = (c: string) => rotuloCanal[c] ?? c;
