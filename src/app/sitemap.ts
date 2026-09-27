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
 *
 * ============================================================
 * POR QUE NÃO TEM `lastModified`
 * ============================================================
 * Tinha, e era mentira. Era `new Date()`, o mesmo carimbo para as 16
 * páginas. Como esta rota é estática, virava a hora do BUILD: a cada
 * deploy o sitemap passava a jurar que todas as 16 tinham mudado,
 * inclusive a política de privacidade, que não muda há meses.
 *
 * Isso é dado falso, que este projeto não publica. E não é só
 * princípio: o Google diz que, quando o `lastmod` de um site não se
 * confirma, ele para de considerar o campo NAQUELE SITE. Um valor
 * errado custa o campo inteiro; a ausência não custa nada.
 *
 * Para voltar a ter o campo seria preciso uma data por página, que uma
 * pessoa atualiza ao editar a página. Não fiz porque essa data apodrece
 * em silêncio: quem esquecer de mexer nela devolve a mentira, e sem
 * aviso nenhum. Com 16 páginas o Google rastreia todas de qualquer
 * jeito, então o campo renderia pouco e cobraria manutenção para
 * sempre.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const paginas: { caminho: string; prioridade: number; frequencia: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
    { caminho: '/', prioridade: 1.0, frequencia: 'weekly' },
    /* Prioridade alta: é a página que recebe anúncio, e a que responde
       pela busca de 'gestão de tráfego' na região. */
    { caminho: '/trafego-pago', prioridade: 0.95, frequencia: 'monthly' },
    { caminho: '/diagnostico', prioridade: 0.9, frequencia: 'monthly' },
    { caminho: '/servicos', prioridade: 0.9, frequencia: 'monthly' },
    ...frentes.map((f) => ({
      caminho: `/servicos/${f.slug}`,
      prioridade: 0.8,
      frequencia: 'monthly' as const,
    })),
    /* Unidade local. Prioridade alta porque e pagina de conversao e
       disputa busca por cidade, que e briga que se ganha com pagina
       propria. Quando houver Capanema e Salinopolis, entram aqui. */
    { caminho: '/braganca-pa', prioridade: 0.9, frequencia: 'monthly' },

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
    changeFrequency: p.frequencia,
    priority: p.prioridade,
  }));
}
