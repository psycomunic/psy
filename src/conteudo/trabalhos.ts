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
  /**
   * `loja` é vitrine de varejo e é a ÚNICA que aparece no site
   * principal. `outro` é site de serviço, e não aparece em lugar
   * nenhum do site principal: nem na home, nem em /cases.
   *
   * O site inteiro fala com lojista de moda, e uma galeria com site de
   * contabilidade no meio contradiz a página. Um portfólio que mostra
   * tudo que já foi feito prova capacidade; este site não precisa
   * provar capacidade, precisa provar que entende de loja.
   *
   * POR QUE OS QUATRO CONTINUAM NO ARQUIVO: a página de Bragança monta
   * o portfólio dela com três deles, por nome. Lá o assunto é empresa
   * local, e site de contabilidade é exatamente o exemplo certo.
   * Apagar as linhas daqui esvaziaria aquela seção sem aviso.
   */
  tipo: 'loja' | 'outro';
};

export const trabalhos: Trabalho[] = [
  /* Moda primeiro: é o nicho que o site inteiro declara atender. */
  { nome: 'Carmellita',            arquivo: 'carmellita.jpg',           largura: 560, altura: 4000, tipo: 'loja' },
  { nome: 'Doris Kids',            arquivo: 'doris-kids.jpg',           largura: 560, altura: 2064, tipo: 'loja' },
  { nome: 'Manalinda',             arquivo: 'manalinda.jpg',            largura: 560, altura: 2401, tipo: 'loja' },
  /* Capturas novas, em 560px como as demais. Ver `vitrineDaCapa`. */
  { nome: 'Criativaê',             arquivo: 'criativae.jpg',            largura: 560, altura: 2211, tipo: 'loja' },
  { nome: 'Thomé',                 arquivo: 'thome.jpg',                largura: 560, altura: 2547, tipo: 'loja' },
  { nome: 'Nativas',               arquivo: 'nativas.jpg',              largura: 560, altura: 1563, tipo: 'loja' },
  { nome: 'Shop Viagem',           arquivo: 'shop-viagem.jpg',          largura: 560, altura: 1619, tipo: 'loja' },
  /* As demais lojas. */
  { nome: 'Casa Linda',            arquivo: 'casalinda.jpg',            largura: 560, altura: 2666, tipo: 'loja' },
  { nome: 'Vettor 28',             arquivo: 'vettor28.jpg',             largura: 560, altura: 2605, tipo: 'loja' },
  { nome: 'Lar e Vida',            arquivo: 'lar-e-vida.jpg',           largura: 560, altura: 2492, tipo: 'loja' },
  { nome: 'Grupo Diságua',         arquivo: 'grupo-disagua.jpg',        largura: 560, altura: 2557, tipo: 'loja' },
  { nome: 'Bloopi',                arquivo: 'bloopi.jpg',               largura: 560, altura: 4000, tipo: 'loja' },
  /* Sites de serviço: fora do destaque, e não fora do ar. */
  { nome: 'Medi Marketing',        arquivo: 'medi-marketing.jpg',       largura: 560, altura: 4000, tipo: 'outro' },
  { nome: 'Food Métricas',         arquivo: 'foodmetricas.jpg',         largura: 560, altura: 4000, tipo: 'outro' },
  { nome: 'Representantes',        arquivo: 'representantes.jpg',       largura: 560, altura: 3527, tipo: 'outro' },
  { nome: 'Torres Contabilidade',  arquivo: 'torres-contabilidade.jpg', largura: 560, altura: 4000, tipo: 'outro' },
];

/** A vitrine principal: as lojas. */
export const lojas = trabalhos.filter((t) => t.tipo === 'loja');

/**
 * As cinco capturas que abrem a página, no carrossel da hero.
 *
 * É uma seleção, e não a lista inteira: a abertura tem alguns
 * segundos para provar que a Psy Comunic faz loja de roupa, e essas
 * cinco são as que mostram vitrine de moda logo no topo da captura,
 * que é a parte que aparece no cartão.
 *
 * A galeria de /cases e a do fim da home continuam com todas.
 */
const NA_CAPA = ['Criativaê', 'Thomé', 'Nativas', 'Shop Viagem', 'Manalinda'];
export const vitrineDaCapa = NA_CAPA.map((nome) => {
  const t = lojas.find((l) => l.nome === nome);
  /* Falha no build, e não em silêncio: renomear uma loja sem mexer
     nesta lista deixaria a capa com um buraco que ninguém veria. */
  if (!t) throw new Error(`vitrineDaCapa: "${nome}" não está em trabalhos`);
  return t;
});

/** O rodapé da galeria: os sites de serviço. */
export const outrosProjetos = trabalhos.filter((t) => t.tipo === 'outro');

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
