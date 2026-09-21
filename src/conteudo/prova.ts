/**
 * Prova social.
 *
 * REGRA DE COMPLIANCE (seção 7.3 do escopo): nenhum número entra no site
 * sem autorização escrita do cliente e sem período de referência
 * declarado. Case sem autorização vira logo na parede, não vira estudo
 * de caso. Por isso `cases` nasce vazio: ele só é preenchido quando os
 * dados chegarem autorizados.
 */
export const marcasAtendidas = [
  'Manalinda', 'Casa Linda', 'Carmelette', 'Criativaê', 'Nativus', 'Diara',
  'Doris', 'Move', 'Line Bolsas', 'LinnConfort', 'Lux Parts', 'MD Print',
  'Gold', 'Shop Viagem', 'Shop Swift', 'Neak Peak', 'Topitop',
  'La Vanilleria', 'Voss Canvas', 'Bella', 'Dealbox', 'Vinejade',
  'Wananda', 'Bebenova', 'Udaf', 'Sorrento',
];

export const parcerias = [
  { nome: 'Google Partner',        arquivo: null },
  { nome: 'Meta Business Partner', arquivo: null },
  { nome: 'Magazord',              arquivo: null },
  { nome: 'Frete Barato',          arquivo: null },
];

export type Case = {
  slug: string;
  cliente: string;
  segmento: string;
  porte: string;
  plataforma: string;
  desafio: string;
  oQueFizemos: Partial<Record<'gestao' | 'tecnologia' | 'marketing' | 'atendimento-logistica', string[]>>;
  /** Todo resultado exige período e base de comparação. Sem isso, não publica. */
  resultados: { metrica: string; de: string; para: string; periodo: string }[];
  depoimento?: { texto: string; nome: string; cargo: string; foto: string };
  autorizado: boolean;
};

/** Vazio de propósito: aguardando os dados autorizados dos 6 cases. */
export const cases: Case[] = [];

/**
 * Provas em vídeo: os depoimentos em formato vertical.
 *
 * ============================================================
 * A SEÇÃO SÓ EXISTE QUANDO O ARQUIVO EXISTE
 * ============================================================
 * `ProvasEmVideo` é componente de SERVIDOR e confere no disco quais
 * destes arquivos estão em `public/video/`. O que não está, não
 * aparece; se nenhum estiver, a seção inteira não é renderizada.
 *
 * É de propósito, e é a mesma regra de `cases` logo acima: moldura
 * vazia com "em breve" num site comercial não é espaço reservado, é
 * promessa não cumprida à vista de quem está decidindo se contrata.
 *
 * Para publicar, basta largar os arquivos com estes nomes em
 * `public/video/`. Nenhuma linha de código muda, e o pôster é
 * opcional: sem ele o navegador mostra o primeiro quadro.
 *
 * FORMATO: 1080x1920 (9:16), que é o que sai do celular e do Reels.
 * A caixa tem proporção fixa, então arquivo fora do 9:16 não desalinha
 * a fileira: ele é cortado pelo centro.
 */
export type ProvaEmVideo = {
  arquivo: string;
  poster?: string;
  /** Quem fala. Vai como legenda embaixo do vídeo. */
  quem: string;
  /** O que a pessoa conta. Uma linha, não um parágrafo. */
  sobre: string;
};

export const provasEmVideo: ProvaEmVideo[] = [
  { arquivo: 'prova-1.mp4', poster: 'prova-1.jpg', quem: '', sobre: '' },
  { arquivo: 'prova-2.mp4', poster: 'prova-2.jpg', quem: '', sobre: '' },
  { arquivo: 'prova-3.mp4', poster: 'prova-3.jpg', quem: '', sobre: '' },
];
