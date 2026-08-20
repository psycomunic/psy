import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      /* A landing page "Páginas que vendem" é o site antigo, preservado
         inteiro como HTML estático em /public. O Next serve /public por
         caminho exato, então sem este rewrite a URL limpa cairia em 404
         e só /paginas-que-vendem/index.html funcionaria. */
      { source: '/paginas-que-vendem', destination: '/paginas-que-vendem/index.html' },
    ];
  },

  async redirects() {
    return [
      /* `/planos` existiu como página pública com a tabela comparativa.
         Ela saiu: plano com escopo e preço agora vive só dentro da
         proposta, que é link único por cliente.

         Redirecionar, e não deixar dar 404, porque o endereço já foi
         mandado em conversa e ainda está no índice do Google. 301 para
         o Google entender que a mudança é definitiva e passar a
         autoridade adiante, em vez de tratar como página perdida. */
      { source: '/planos', destination: '/servicos', permanent: true },
    ];
  },
};

export default nextConfig;
