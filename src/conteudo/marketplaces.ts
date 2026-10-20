/**
 * Os canais de marketplace que a Psy Comunic opera.
 *
 * ============================================================
 * POR QUE AQUI, E NÃO EM `src/dados/servicos.ts`
 * ============================================================
 * `servicos.ts` é `server-only` porque carrega preço. Esta lista não
 * carrega: o valor de cada canal é negociado por proposta e digitado
 * no formulário. Sendo conteúdo sem preço, ela pode atravessar para o
 * cliente, que é exatamente o que o formulário precisa.
 *
 * ============================================================
 * A COR É A IDENTIFICAÇÃO, E NÃO A LOGO
 * ============================================================
 * Redesenhar de memória o aperto de mão do Mercado Livre ou a sacola
 * da Shopee sai torto, e logo torta num documento de preço faz o
 * cliente duvidar do resto. Então cada canal aparece como um quadrado
 * na COR da marca com a inicial dentro, ao lado do nome escrito por
 * extenso. A cor faz o reconhecimento, que num marketplace é quase
 * imediato, e o nome tira qualquer dúvida.
 *
 * Quando houver o SVG oficial, é só preencher `logo` com o caminho do
 * arquivo em `public/imagens/marketplaces/` e a tela passa a usá-lo
 * sem mais nenhuma mudança.
 *
 * ============================================================
 * AS CORES SÃO AS DE MARCA, CONFERIDAS UMA A UMA
 * ============================================================
 * E `escuro` diz qual texto fica por cima: amarelo do Mercado Livre e
 * laranja da Amazon pedem texto escuro, e o resto pede branco. Isso
 * não é gosto, é contraste: inicial branca sobre #FFE600 é ilegível.
 */
export type Marketplace = {
  id: string;
  nome: string;
  /** Cor de marca, usada no quadrado do canal. */
  cor: string;
  /** true quando a cor é clara e o texto por cima precisa ser escuro. */
  escuro?: boolean;
  /** A letra do quadrado. Curta: duas letras já apertam em 32px. */
  sigla: string;
  /** Caminho do SVG oficial, quando existir. */
  logo?: string;
  /** O que muda nesse canal, em uma linha, para quem nunca vendeu nele. */
  nota: string;
};

export const MARKETPLACES: Marketplace[] = [
  {
    id: 'mercado-livre',
    nome: 'Mercado Livre',
    cor: '#FFE600',
    escuro: true,
    sigla: 'ML',
    nota: 'O maior do Brasil. Reputação e Full mudam tudo no frete e na busca.',
  },
  {
    id: 'shopee',
    nome: 'Shopee',
    cor: '#EE4D2D',
    sigla: 'S',
    nota: 'Preço e frete grátis mandam. Gira volume com ticket baixo.',
  },
  {
    id: 'tiktok-shop',
    nome: 'TikTok Shop',
    cor: '#FE2C55',
    sigla: 'TT',
    nota: 'Vende por vídeo e por live. Depende de criativo, e não de catálogo.',
  },
  {
    id: 'magalu',
    nome: 'Magazine Luiza',
    cor: '#0086FF',
    sigla: 'M',
    nota: 'Marketplace com loja física por trás. Exige nota e prazo em dia.',
  },
  {
    id: 'amazon',
    nome: 'Amazon',
    cor: '#FF9900',
    escuro: true,
    sigla: 'a',
    nota: 'Catálogo rígido e logística própria. Boa para recompra.',
  },
  {
    id: 'americanas',
    nome: 'Americanas',
    cor: '#E60014',
    sigla: 'A',
    nota: 'Alcance grande em datas comemorativas.',
  },
  {
    id: 'shein',
    nome: 'Shein',
    cor: '#222222',
    sigla: 'SH',
    nota: 'Moda com giro rápido e preço agressivo. Cresce forte no Brasil.',
  },
];

export const fichaMarketplace = (id: string) => MARKETPLACES.find((m) => m.id === id) ?? null;

export const nomeMarketplace = (id: string) => fichaMarketplace(id)?.nome ?? id;
