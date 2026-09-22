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
  /*
    TINTA CHAPADA, e nao gradiente.

    O mundo e documento impresso: etiqueta, carimbo, fio. Gradiente e
    brilho pertencem a tela acesa, que e o oposto do objeto de luz
    refletida que esta pagina imita.

    O fundo e o rosa ESCURECIDO. Medido: branco sobre o #FF2E63 cheio
    da marca da 3.61:1 e reprova nos 4.5 exigidos; sobre o escurecido
    da 5.00.
  */
  primario: 'bg-rosa text-branco hover:bg-rosa-forte',
  secundario: 'border border-fio-forte text-tinta hover:bg-papel-alt',
  claro: 'bg-papel text-tinta hover:bg-papel-alt',
  /* Sem estilo proprio: quem chama traz o visual inteiro em className. */
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
