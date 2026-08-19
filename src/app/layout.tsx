import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Bricolage_Grotesque, Manrope, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { marca } from '@/conteudo/marca';
import { site } from '@/conteudo/site';
import { Revelar } from '@/componentes/Revelar';
import { DadosEstruturados } from '@/componentes/DadosEstruturados';

/*
  Três fontes, três funções. Uma família só, variando o peso, é o que
  fazia a página parecer um documento: sem contraste de DESENHO, só de
  tamanho.

  Fontes provisórias. O escopo lista a fonte da marca como asset
  pendente do cliente (seção 14).
*/

/* Display: grotesca com aberturas fechadas e um leve desalinho nas
   terminações. Segura tamanho grande sem parecer fonte de sistema. */
const display = Bricolage_Grotesque({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  display: 'swap',
});

/* Corpo: neutra, alta legibilidade em parágrafo longo. */
const corpo = Manrope({
  variable: '--font-corpo',
  subsets: ['latin'],
  display: 'swap',
});

/* Mono: rótulos e números. Dá à página o vocabulário de operação e
   painel, que é o que a Psy Comunic vende, em vez de folheto. */
const mono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  weight: ['500'],
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
    title: site.titulo,
    description: site.descricao,
    /* A imagem vem de src/app/opengraph-image.tsx, que o Next injeta
       sozinho. Repetir aqui geraria duas og:image e a rede escolheria
       uma ao acaso. */
  },

  twitter: {
    card: 'summary_large_image',
    title: site.titulo,
    description: site.descricao,
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
      className={`${display.variable} ${corpo.variable} ${mono.variable} h-full`}
    >
      <body className="flex min-h-full flex-col">
        {/* Atalho de teclado exigido pela WCAG: pular direto ao conteúdo */}
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[10000] focus:rounded-full focus:bg-magenta focus:px-5 focus:py-2.5 focus:text-branco"
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

        {children}
      </body>
    </html>
  );
}
