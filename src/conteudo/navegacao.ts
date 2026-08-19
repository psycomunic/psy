/** Sitemap da seção 8.1 do escopo. Alimenta o menu e o rodapé. */
export const navPrincipal = [
  { href: '/servicos', rotulo: 'Serviços' },
  { href: '/como-trabalhamos', rotulo: 'Como trabalhamos' },
  { href: '/cases', rotulo: 'Cases' },
  { href: '/planos', rotulo: 'Planos' },
  { href: '/blog', rotulo: 'Blog' },
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
      { href: '/cases', rotulo: 'Cases' },
      { href: '/carreiras', rotulo: 'Carreiras' },
    ],
  },
  {
    titulo: 'Ferramentas',
    itens: [
      { href: '/diagnostico', rotulo: 'Diagnóstico gratuito' },
      { href: '/calculadora-roi', rotulo: 'Calculadora de ROI' },
      { href: '/materiais', rotulo: 'Materiais' },
      { href: '/paginas-que-vendem/', rotulo: 'Páginas que vendem' },
    ],
  },
  {
    titulo: 'Legal',
    itens: [
      { href: '/politica-de-privacidade', rotulo: 'Política de privacidade' },
      { href: '/termos-de-uso', rotulo: 'Termos de uso' },
      { href: '/cookies', rotulo: 'Cookies' },
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
