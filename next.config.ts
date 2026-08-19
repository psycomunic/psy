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
};

export default nextConfig;
