import { LinkWhatsapp } from './LinkWhatsapp';
import { linkDaUnidade, type Unidade } from '@/conteudo/braganca';

/**
 * Botão de WhatsApp da unidade, com a cara do site e o evento do GA4.
 *
 * Mora em arquivo próprio porque é usado tanto pelos blocos de servidor
 * (`Blocos.tsx`) quanto pelo hero de cliente (`HeroCinemaLocal.tsx`).
 * Não tem `'use client'` de propósito: é só JSX em volta de
 * `LinkWhatsapp`, que já é cliente, e assim serve aos dois lados.
 */
export function BotaoZap({
  u,
  mensagem,
  secao: nomeSecao,
  children,
  variante = 'primario',
}: {
  u: Unidade;
  mensagem: string;
  secao: string;
  children: string;
  variante?: 'primario' | 'secundario' | 'claro';
}) {
  const estilos = {
    primario:
      'bg-rosa text-branco hover:bg-rosa-forte hover:shadow-[0_10px_40px_-8px_rgba(255,46,99,0.75)]',
    secundario:
      'text-tinta ring-1 ring-inset ring-white/20 backdrop-blur-sm hover:bg-tinta/12 hover:ring-white/45',
    claro: 'bg-tinta text-papel hover:shadow-[0_10px_40px_-8px_rgba(0,0,0,0.45)]',
  } as const;

  return (
    <LinkWhatsapp
      href={linkDaUnidade(u, mensagem)}
      pagina={u.slug}
      secao={nomeSecao}
      className={
        'inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-full px-7 ' +
        'text-sm font-semibold tracking-wide transition-all duration-300 hover:-translate-y-0.5 ' +
        'active:scale-[0.98] ' +
        estilos[variante]
      }
    >
      {children}
    </LinkWhatsapp>
  );
}
