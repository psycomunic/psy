import type { MetadataRoute } from 'next';
import { urlAbsoluta } from '@/conteudo/site';
import { frentes } from '@/conteudo/frentes';

/**
 * Sitemap em /sitemap.xml.
 *
 * REGRA: só entra aqui o que responde 200 e é indexável. Sitemap que
 * lista 404 ou página com noindex é sinal de site malcuidado, e o Google
 * reporta os dois como erro no Search Console.
 *
 * Por isso NÃO estão aqui: /proposta/*, /painel/*, /entrar.
 *
 * `priority` é uma dica fraca e relativa dentro do próprio site, não uma
 * nota. O que ela diz é: se o robô tiver orçamento para poucas páginas,
 * comece pelas de conversão.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const agora = new Date();

  const paginas: { caminho: string; prioridade: number; frequencia: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
    { caminho: '/', prioridade: 1.0, frequencia: 'weekly' },
    { caminho: '/diagnostico', prioridade: 0.9, frequencia: 'monthly' },
    { caminho: '/servicos', prioridade: 0.9, frequencia: 'monthly' },
    ...frentes.map((f) => ({
      caminho: `/servicos/${f.slug}`,
      prioridade: 0.8,
      frequencia: 'monthly' as const,
    })),
    { caminho: '/cases', prioridade: 0.7, frequencia: 'monthly' },
    { caminho: '/como-trabalhamos', prioridade: 0.7, frequencia: 'monthly' },
    { caminho: '/sobre', prioridade: 0.6, frequencia: 'yearly' },
    { caminho: '/contato', prioridade: 0.6, frequencia: 'yearly' },

    /* A landing page antiga é HTML estático servido por rewrite. Ela tem
       público próprio, agências nichadas, e merece indexação separada. */
    { caminho: '/paginas-que-vendem', prioridade: 0.6, frequencia: 'monthly' },

    { caminho: '/politica-de-privacidade', prioridade: 0.2, frequencia: 'yearly' },
    { caminho: '/termos-de-uso', prioridade: 0.2, frequencia: 'yearly' },
  ];

  return paginas.map((p) => ({
    url: urlAbsoluta(p.caminho),
    lastModified: agora,
    changeFrequency: p.frequencia,
    priority: p.prioridade,
  }));
}
