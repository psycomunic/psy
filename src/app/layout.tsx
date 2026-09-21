import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Archivo, Inter } from 'next/font/google';
import './globals.css';
import { marca } from '@/conteudo/marca';
import { site } from '@/conteudo/site';
import { Revelar } from '@/componentes/Revelar';
import { DadosEstruturados } from '@/componentes/DadosEstruturados';
import { Analytics } from '@/componentes/Analytics';

/*
  DUAS FAMÍLIAS: uma para bater, outra para ler.

  A serifada fina não funcionou. Fraunces em peso 300 dá página de
  revista literária, e o que esta vende é loja de roupa: precisa bater,
  não sussurrar.

  Archivo é variável com eixo de LARGURA, e é isso que importa aqui.
  Condensada em peso 800 ela é a grotesca de capa de revista: cabe mais
  palavra por linha, então o título ocupa menos altura e pode crescer
  mais. Uma família só faz o papel que exigiria duas.

  Inter no corpo: neutra de verdade, desenhada para tela, e some atrás
  do texto em vez de competir com o título.
*/
const display = Archivo({
  variable: '--font-display',
  subsets: ['latin'],
  axes: ['wdth'],
  display: 'swap',
});

const corpo = Inter({
  variable: '--font-corpo',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  /* Base de TODA URL relativa dos metadados. Com www, que é a versão
     canônica: o domínio sem www responde 308 para cá. Errar isso faz o
     Google indexar duas versões do site e dividir a autoridade. */
  metadataBase: new URL(site.url),

  title: {
    default: site.titulo,
    /* Toda página interna vira "Assunto · Psy Comunic". A marca no fim,
       e não no começo, porque o Google corta o título por volta de 60
       caracteres e o assunto é o que precisa sobreviver ao corte. */
    template: `%s · ${marca.nome}`,
  },
  description: site.descricao,

  applicationName: marca.nome,
  authors: [{ name: site.fundador }],
  creator: site.fundador,
  publisher: marca.nome,

  alternates: { canonical: site.url },

  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: marca.nome,
    url: site.url,
    /* Texto proprio de rede social, e nao o de busca. Ver site.og. */
    title: site.og.titulo,
    description: site.og.descricao,
    /* A imagem vem de src/app/opengraph-image.tsx, que o Next injeta
       sozinho. Repetir aqui geraria duas og:image e a rede escolheria
       uma ao acaso. */
  },

  twitter: {
    card: 'summary_large_image',
    title: site.og.titulo,
    description: site.og.descricao,
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      /* Sem limite de prévia: deixa o Google usar trecho maior e
         miniatura grande, que ocupam mais espaço no resultado. */
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },

  /* Telefone vira link automático no Safari, o que quebra layout de
     número solto no meio de um texto. Os contatos já são links. */
  formatDetection: { telephone: false, address: false, email: false },

  category: 'business',

  /*
    PENDÊNCIA: verificação do Google Search Console.

    Sem cadastrar o site lá, ninguém vê o que o Google está indexando,
    quais buscas trazem visita, nem qual página deu erro. É o painel que
    torna SEO mensurável em vez de torcida.

    Como fazer: search.google.com/search-console, adicionar a
    propriedade, escolher a verificação por meta tag e colar o código
    abaixo, descomentando a linha.
  */
  // verification: { google: 'COLE-O-CODIGO-AQUI' },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="pt-BR"
      className={`${display.variable} ${corpo.variable} h-full`}
    >
      <body className="flex min-h-full flex-col">
        {/* Atalho de teclado exigido pela WCAG: pular direto ao conteúdo */}
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[10000] focus:rounded-full focus:bg-rosa focus:px-5 focus:py-2.5 focus:text-branco"
        >
          Pular para o conteúdo
        </a>

        {/* Grão sobre a página inteira. Fixo, sem eventos de ponteiro. */}
        <div className="grao-camada" aria-hidden />

        {/* Liga a revelação ao rolar. Marca o <html> só depois de montar,
            então quem estiver sem JS recebe a página já visível. */}
        <Revelar />

        {/* JSON-LD: quem é a empresa, o que ela vende e onde. É daqui
            que sai o painel de conhecimento e o nome do site na busca. */}
        <DadosEstruturados />
        <Analytics />

        {children}
      </body>
    </html>
  );
}
