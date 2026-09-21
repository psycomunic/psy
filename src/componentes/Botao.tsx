import Link from 'next/link';
import type { ReactNode } from 'react';

type Props = {
  href: string;
  children: ReactNode;
  variante?: 'primario' | 'secundario' | 'claro';
  externo?: boolean;
  className?: string;
};

/*
  O rosa cheio só aparece como FUNDO de botão e em elemento gráfico.
  Como texto sobre branco ele dá 3.6:1 e reprova nos 4.5:1 da WCAG, e
  para isso existe o --accent-ink. Ver globals.css.

  A SETA SAIU. Ela existia para o botão se anunciar como próximo passo
  num fundo escuro cheio de brilho. No tema claro, com serifada e muito
  ar em volta, um botão rosa sólido já é a única coisa colorida da
  tela: a seta vira ruído.
*/
const base =
  'inline-flex items-center justify-center rounded-full px-[22px] py-[14px] ' +
  'text-sm font-semibold transition-colors duration-200 active:scale-[0.98]';

const variantes = {
  primario: 'bg-rosa text-branco hover:bg-rosa-forte',
  /* A borda acompanha o fundo: sobre branco é #D9DBE4, e dentro da
     faixa marinho o --border já é branco a 28%. Uma classe, dois
     fundos, sem o componente saber em qual está. */
  secundario: 'border border-fio text-tinta hover:bg-papel-alt',
  /* Sobre o rosa cheio da chamada final. */
  claro: 'bg-branco text-marinho hover:bg-rosa-leve',
} as const;

export function Botao({ href, children, variante = 'primario', externo, className = '' }: Props) {
  const classe = `${base} ${variantes[variante]} ${className}`;

  const conteudo = children;

  if (externo) {
    return (
      <a href={href} target="_blank" rel="noopener" className={classe}>
        {conteudo}
      </a>
    );
  }
  return (
    <Link href={href} className={classe}>
      {conteudo}
    </Link>
  );
}
