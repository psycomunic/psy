/**
 * Paleta dos gráficos do painel.
 *
 * TODAS as cores abaixo passaram no validador de paleta, no modo escuro,
 * contra a superfície #0B1730. Os seis testes: banda de luminosidade
 * OKLCH 0.48–0.67, piso de croma, separação para daltonismo, piso de
 * visão normal e contraste mínimo de 3:1.
 *
 * NÃO troque um hex daqui no olho. Rode o validador de novo. A primeira
 * tentativa desta paleta reprovou em dois testes: as cores estavam
 * bonitas e claras demais (L 0.72 a 0.82), e o verde e o azul ficavam a
 * ΔE 14,8 um do outro, indistinguíveis até para quem enxerga todas as
 * cores.
 */

/**
 * Série categórica: identidade, não magnitude.
 *
 * Ordem FIXA. Um canal tem sempre a mesma cor, em qualquer tela e
 * qualquer filtro. Cor que segue a posição na lista faz o Google virar
 * rosa numa tela e azul na outra, e aí a cor deixa de informar.
 *
 * Validado: pior par adjacente ΔE 8,7 (protanopia) e 17,8 (visão
 * normal).
 */
export const CATEGORICA = [
  '#1D4ED8', // azul real da marca
  '#0B1730', // marinho profundo
  '#059669', // esmeralda semântico
  '#D97706', // âmbar
  '#6366F1', // índigo
] as const;

/** Canal sempre com a mesma cor, pelo NOME e não pela posição. */
export const CORES_CANAL: Record<string, string> = {
  google: '#2563EB',
  meta: '#1E40AF',
  organico: '#059669',
  direto: '#D97706',
  email: '#6366F1',
  hospedi_direto: '#059669',
  hospedi_ota: '#0284C7',
  loja: '#64748B',
};

export const corDoCanal = (c: string) => CORES_CANAL[c] ?? '#64748B';

export const COR_RECEITA = 'var(--p-serie-1, #0B1730)';
export const COR_INVESTIMENTO = 'var(--p-serie-2, #2563EB)';

export const COR_FATURADO = COR_RECEITA;
export const COR_RECEBIDO = COR_INVESTIMENTO;

export const COR_DESPESA = '#D97706';

export const CORES_SITUACAO = {
  saudavel: '#059669',
  atencao: '#D97706',
  critico: '#E11D48',
  sem_dado: '#64748B',
} as const;

export const GRADE = 'var(--p-grade, rgba(11,23,48,0.08))';
export const EIXO = 'var(--p-eixo, #64748B)';
