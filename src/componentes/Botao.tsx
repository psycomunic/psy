import Link from 'next/link';
import type { ReactNode } from 'react';

type Props = {
  href: string;
  children: ReactNode;
  variante?: 'primario' | 'secundario' | 'claro' | 'fantasma';
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
  primario: 'bg-gradient-to-r from-rosa-forte to-rosa text-branco hover:shadow-[0_0_20px_var(--psy-accent-glow)] hover:-translate-y-0.5 border border-rosa',
  secundario: 'border border-fio bg-marinho-alto text-branco hover:bg-marinho hover:border-rosa shadow-lg hover:shadow-[0_0_15px_var(--psy-accent-glow)] hover:-translate-y-0.5',
  claro: 'bg-marinho-alto border border-fio text-rosa-grafico hover:border-rosa hover:text-branco shadow-lg hover:-translate-y-0.5',
  /* Sem estilo proprio: quem chama traz o visual inteiro em
     `className`. Existia como `variante="fantasma"` no page.tsx e nao
     existia aqui, e o type check do build parava nisso. */
  fantasma: '',
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
