import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Bricolage_Grotesque, Manrope, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { marca } from '@/conteudo/marca';
import { Revelar } from '@/componentes/Revelar';

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
  metadataBase: new URL('https://psycomunic.com.br'),
  title: {
    default: `${marca.nome} · Operação de crescimento para e-commerce`,
    template: `%s · ${marca.nome}`,
  },
  description:
    'Gestão, tecnologia, marketing e logística rodando junto. As quatro frentes que decidem se a visita da sua loja vira pedido.',
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: marca.nome,
  },
  robots: { index: true, follow: true },
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

        {children}
      </body>
    </html>
  );
}
