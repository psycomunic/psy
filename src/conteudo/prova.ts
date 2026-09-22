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
