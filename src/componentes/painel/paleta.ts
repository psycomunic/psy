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
  '#EC2E6B', // magenta da marca
  '#2E8BE0', // azul
  '#1F9D6B', // verde
  '#B87D1A', // âmbar
  '#9B6DFF', // violeta
] as const;

/** Canal sempre com a mesma cor, pelo NOME e não pela posição. */
export const CORES_CANAL: Record<string, string> = {
  google: CATEGORICA[0],
  meta: CATEGORICA[1],
  organico: CATEGORICA[2],
  direto: CATEGORICA[3],
  email: CATEGORICA[4],
  loja: '#93A0BC',
};

export const corDoCanal = (c: string) => CORES_CANAL[c] ?? '#93A0BC';

/**
 * Série temporal de duas medidas.
 *
 * Receita e investimento estão na mesma unidade (reais) e na mesma
 * ordem de grandeza, então dividem UM eixo. Dois eixos y no mesmo
 * gráfico é o erro mais comum de painel: a escala de cada um vira
 * escolha arbitrária de quem desenhou, e o cruzamento das linhas passa a
 * significar o que a pessoa quiser.
 *
 * Validado: ΔE 19,4 (protanopia) e 32,6 (visão normal).
 */
export const COR_RECEITA = '#EC2E6B';
export const COR_INVESTIMENTO = '#2E8BE0';

/**
 * Faturado e recebido, no financeiro.
 *
 * O MESMO par já validado acima, e não duas cores novas escolhidas no
 * olho. Também são duas medidas em reais na mesma ordem de grandeza,
 * então também dividem um eixo, e a separação para daltonismo já está
 * medida: ΔE 19,4 em protanopia.
 *
 * Nomes próprios porque "receita" e "investimento" não descrevem o que
 * este gráfico mostra: aqui a comparação é entre o que foi EMITIDO e o
 * que ENTROU, que é a diferença entre faturamento e caixa.
 */
export const COR_FATURADO = COR_RECEITA;
export const COR_RECEBIDO = COR_INVESTIMENTO;

/** Despesa desenha sozinha, num gráfico só dela: série de uma medida
    é magnitude, e magnitude é uma cor só. */
export const COR_DESPESA = '#B87D1A';

/**
 * Semáforo de saúde.
 *
 * Reservadas: nunca reutilizar como "série 4". E nunca sozinhas: todo
 * selo carrega ícone e texto, porque cor sozinha não é informação para
 * quem não distingue verde de vermelho.
 *
 * Contraste como TEXTO sobre #0B1730, medido: 10,2:1 · 10,7:1 · 7,1:1 ·
 * 6,8:1. Todos acima dos 4,5:1 da WCAG AA.
 */
export const CORES_SITUACAO = {
  saudavel: '#4ADE80',
  atencao: '#FBBF24',
  critico: '#FF7A7A',
  sem_dado: '#93A0BC',
} as const;

/** Cinza recessivo da grade e dos eixos. Grade que compete com o dado
    é ruído: ela existe para dar referência, não para ser vista. */
export const GRADE = 'rgba(255,255,255,0.08)';
export const EIXO = 'rgba(255,255,255,0.30)';
