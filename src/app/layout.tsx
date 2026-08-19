import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Manrope } from 'next/font/google';
import './globals.css';
import { marca } from '@/conteudo/marca';

/* Fonte provisória. O escopo lista "fonte da marca ou licença" como
   asset pendente do cliente (seção 14). Manrope segura o lugar com um
   desenho geométrico próximo do logotipo até o arquivo oficial chegar. */
const fonteMarca = Manrope({
  variable: '--font-marca',
  subsets: ['latin'],
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
    <html lang="pt-BR" className={`${fonteMarca.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        {/* Atalho de teclado exigido pela WCAG: pular direto ao conteúdo */}
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-magenta focus:px-4 focus:py-2 focus:text-branco"
        >
          Pular para o conteúdo
        </a>
        {children}
      </body>
    </html>
  );
}
