/**
 * Sitemap navegável.
 *
 * REGRA: só entra aqui rota que responde 200.
 *
 * A versão anterior listava /blog, /carreiras, /materiais e
 * /calculadora-roi, que não existem. Eram 18 links quebrados saindo da
 * home. Link para o nada gasta o orçamento de rastreio do Google em
 * página de erro, e para o visitante é pior ainda: ele clica, cai no
 * 404 e vai embora.
 *
 * Quando essas páginas existirem, elas voltam para cá E para o
 * src/app/sitemap.ts, que precisa continuar de acordo com esta lista.
 */
export const navPrincipal = [
  { href: '/servicos', rotulo: 'Serviços' },
  { href: '/como-trabalhamos', rotulo: 'Como trabalhamos' },
  { href: '/cases', rotulo: 'Trabalhos' },
  { href: '/planos', rotulo: 'Planos' },
  { href: '/sobre', rotulo: 'Sobre' },
];

export const navRodape = [
  {
    titulo: 'Serviços',
    itens: [
      { href: '/servicos/gestao', rotulo: 'Gestão' },
      { href: '/servicos/tecnologia', rotulo: 'Tecnologia' },
      { href: '/servicos/marketing', rotulo: 'Marketing' },
      { href: '/servicos/atendimento-logistica', rotulo: 'Atendimento & Logística' },
    ],
  },
  {
    titulo: 'Empresa',
    itens: [
      { href: '/sobre', rotulo: 'Sobre' },
      { href: '/como-trabalhamos', rotulo: 'Como trabalhamos' },
      { href: '/cases', rotulo: 'Trabalhos' },
      { href: '/contato', rotulo: 'Contato' },
    ],
  },
  {
    titulo: 'Comece aqui',
    itens: [
      { href: '/diagnostico', rotulo: 'Diagnóstico gratuito' },
      { href: '/planos', rotulo: 'Planos' },
      { href: '/paginas-que-vendem', rotulo: 'Páginas que vendem' },
    ],
  },
  {
    titulo: 'Legal',
    itens: [
      { href: '/politica-de-privacidade', rotulo: 'Política de privacidade' },
      { href: '/termos-de-uso', rotulo: 'Termos de uso' },
    ],
  },
];

/* EDITAR: número real de WhatsApp comercial da Psy Comunic.
   O 47 99240-6661 é o pessoal do Angelo, usado na LP antiga. */
export const whatsapp = {
  numero: '5547992406661',
  mensagem: 'Olá! Vim pelo site da Psy Comunic e quero falar sobre a minha operação.',
};

export const linkWhatsapp = `https://wa.me/${whatsapp.numero}?text=${encodeURIComponent(whatsapp.mensagem)}`;
