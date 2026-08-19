/**
 * Tabela comparativa de planos.
 *
 * NÃO EXISTE PREÇO NESTE ARQUIVO, E NÃO DEVE PASSAR A EXISTIR.
 * O critério de aceite do escopo diz: "Preços não aparecem em nenhum
 * lugar do site nem no código-fonte público". Um valor escrito aqui iria
 * parar no bundle que qualquer pessoa baixa. Os valores de referência
 * ficam só no documento comercial interno.
 *
 * PENDÊNCIA DE CONTEÚDO (seção 6 do escopo): da linha "Criação de linhas
 * editoriais" em diante, o PDF marca "—" em quase tudo. O comercial
 * precisa confirmar o que o Apollo cobre de fato. Está tudo aqui, num
 * arquivo só, para a correção ser trivial.
 */
export type Plano = 'saturno' | 'falcon' | 'apollo';

export const planos = [
  { id: 'saturno' as Plano, nome: 'Saturno', destaque: false, selo: null },
  { id: 'falcon' as Plano,  nome: 'Falcon',  destaque: true,  selo: 'O mais contratado' },
  { id: 'apollo' as Plano,  nome: 'Apollo',  destaque: false, selo: null },
];

/** `true` = incluído · `false` = não incluído · string = detalhe do limite */
export type Valor = boolean | string;

export const recursos: { nome: string; confirmar?: boolean; valores: Record<Plano, Valor> }[] = [
  { nome: 'Gestão de ADS',            valores: { saturno: '2 plataformas',      falcon: 'Plataformas ilimitadas', apollo: 'Plataformas ilimitadas' } },
  { nome: 'Campanhas',                valores: { saturno: 'Até 5 por mês',      falcon: 'Ilimitadas',             apollo: 'Ilimitadas' } },
  { nome: 'Teto de investimento',     valores: { saturno: 'Até R$ 15 mil/mês',  falcon: 'Ilimitado',              apollo: 'Ilimitado' } },
  { nome: 'Planejamento estratégico', valores: { saturno: 'Trimestral',         falcon: 'Mensal',                 apollo: 'Mensal' } },
  { nome: 'Check-in analítico',       valores: { saturno: '1x por mês',         falcon: 'Até 4x por mês',         apollo: 'Até 4x por mês' } },
  { nome: 'Criativos e anúncios',     valores: { saturno: 'Referências da Ads Library', falcon: 'Edição de criativos', apollo: 'Edição de criativos' } },
  { nome: 'Copy de anúncios',         valores: { saturno: 'Referências para criação',   falcon: 'Criação de copies',   apollo: 'Criação de copies' } },

  // Daqui para baixo: confirmar com o comercial antes do go-live.
  { nome: 'Criação de linhas editoriais',              confirmar: true, valores: { saturno: false, falcon: true,  apollo: true } },
  { nome: 'Criação de campanhas de comunicação',       confirmar: true, valores: { saturno: false, falcon: false, apollo: true } },
  { nome: 'Manutenção e suporte de plataforma',        confirmar: true, valores: { saturno: false, falcon: false, apollo: true } },
  { nome: 'Landing pages',                             confirmar: true, valores: { saturno: false, falcon: false, apollo: true } },
  { nome: 'Estratégia comercial',                      confirmar: true, valores: { saturno: false, falcon: false, apollo: true } },
  { nome: 'Funis de marketing',                        confirmar: true, valores: { saturno: false, falcon: false, apollo: true } },
  { nome: 'Recuperação e otimização dos canais de venda', confirmar: true, valores: { saturno: false, falcon: false, apollo: true } },
  { nome: 'Implementação e gestão de e-mail marketing',confirmar: true, valores: { saturno: false, falcon: false, apollo: true } },
  { nome: 'Mentoria comercial',                        confirmar: true, valores: { saturno: false, falcon: false, apollo: true } },
  { nome: 'Desenvolvimento de produtos',               confirmar: true, valores: { saturno: false, falcon: false, apollo: true } },
  { nome: 'Gestão de marketplaces',                    confirmar: true, valores: { saturno: false, falcon: false, apollo: true } },
];

export const ctaPlano = 'Solicitar proposta';
