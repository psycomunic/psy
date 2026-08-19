/**
 * Trabalhos entregues: sites e lojas que a Psy Comunic construiu.
 *
 * NÃO CONFUNDIR COM `cases` EM prova.ts.
 *
 * Aqui é portfólio: o print da página que existe, com o nome de quem
 * encomendou. Nenhum número. Case de resultado é outra coisa, exige
 * autorização escrita e período de referência declarado (seção 7.3 do
 * escopo), e continua vazio até os dados chegarem autorizados.
 *
 * Os arquivos têm 560px de largura e altura variável, porque são a
 * página inteira. `altura` é a altura nativa: serve para calcular a
 * duração da rolagem no hover e para o navegador reservar o espaço
 * certo antes da imagem carregar, sem pulo de layout.
 */
export type Trabalho = {
  nome: string;
  arquivo: string;
  largura: number;
  altura: number;
};

export const trabalhos: Trabalho[] = [
  { nome: 'Carmellita',            arquivo: 'carmellita.jpg',           largura: 560, altura: 4000 },
  { nome: 'Casa Linda',            arquivo: 'casalinda.jpg',            largura: 560, altura: 2666 },
  { nome: 'Vettor 28',             arquivo: 'vettor28.jpg',             largura: 560, altura: 2605 },
  { nome: 'Doris Kids',            arquivo: 'doris-kids.jpg',           largura: 560, altura: 2064 },
  { nome: 'Manalinda',             arquivo: 'manalinda.jpg',            largura: 560, altura: 2401 },
  { nome: 'Grupo Diságua',         arquivo: 'grupo-disagua.jpg',        largura: 560, altura: 2557 },
  { nome: 'Lar e Vida',            arquivo: 'lar-e-vida.jpg',           largura: 560, altura: 2492 },
  { nome: 'Medi Marketing',        arquivo: 'medi-marketing.jpg',       largura: 560, altura: 4000 },
  { nome: 'Food Métricas',         arquivo: 'foodmetricas.jpg',         largura: 560, altura: 4000 },
  { nome: 'Bloopi',                arquivo: 'bloopi.jpg',               largura: 560, altura: 4000 },
  { nome: 'Representantes',        arquivo: 'representantes.jpg',       largura: 560, altura: 3527 },
  { nome: 'Torres Contabilidade',  arquivo: 'torres-contabilidade.jpg', largura: 560, altura: 4000 },
];

/**
 * Duração da rolagem, proporcional ao comprimento da página.
 *
 * Fórmula herdada da landing page antiga: (altura ÷ largura) × 1,35,
 * limitada entre 5s e 12s. Duração fixa faria a página de 2064px voar e
 * a de 4000px arrastar, quando o que importa é a sensação de percorrer
 * o site num ritmo constante.
 */
export function duracaoRolagem(t: Trabalho) {
  const bruta = (t.altura / t.largura) * 1.35;
  return `${Math.min(12, Math.max(5, Number(bruta.toFixed(1))))}s`;
}

/**
 * Logos das marcas atendidas: silhuetas brancas com fundo transparente.
 *
 * Os arquivos são numerados e NÃO existe mapeamento de qual número é
 * qual marca, nem aqui nem na landing page antiga, onde já entravam com
 * alt vazio. Por isso entram como DECORATIVOS (`alt=""`), e os nomes das
 * marcas continuam disponíveis em texto por `marcasAtendidas`.
 *
 * Inventar o alt seria pior que não ter: um leitor de tela anunciaria o
 * nome errado com toda a confiança.
 *
 * PENDÊNCIA: se o Angelo enviar a correspondência número → marca, basta
 * trocar este array por uma lista de objetos com nome.
 */
export const logosMarcas: string[] = [
  ...Array.from({ length: 27 }, (_, i) => `${String(i + 1).padStart(2, '0')}.png`),
  'VETTOR28.png',
];
