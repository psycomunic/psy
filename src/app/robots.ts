import type { MetadataRoute } from 'next';
import { urlAbsoluta } from '@/conteudo/site';

/**
 * robots.txt gerado pelo Next, em /robots.txt.
 *
 * Em arquivo de código e não estático de propósito: a URL do sitemap sai
 * do mesmo `site.ts` que alimenta os canonicals, então trocar de domínio
 * não deixa um robots.txt apontando para o endereço antigo.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        /*
          O que NÃO deve ser rastreado.

          /proposta/  documento comercial de um cliente só. Já responde
                      noindex no HTML, mas bloquear aqui evita até a
                      visita do robô.
          /painel/    e /entrar: área logada. Hoje devolvem 404 em
                      produção; quando existirem de verdade, continuam
                      fora do índice.
          /api/       não há nada público a indexar.
        */
        disallow: ['/proposta/', '/painel/', '/entrar', '/api/'],
      },
    ],
    sitemap: urlAbsoluta('/sitemap.xml'),
    host: urlAbsoluta('/'),
  };
}
