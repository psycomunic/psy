import type { ReactNode } from 'react';
import Link from 'next/link';
import { Cabecalho } from './Cabecalho';
import { Rodape } from './Rodape';
import { BotaoWhatsapp } from './BotaoWhatsapp';
import { Botao } from './Botao';
import { site, urlAbsoluta } from '@/conteudo/site';

export const secao = 'mx-auto w-full max-w-[1320px] px-5 md:px-10';

/** Casca comum das páginas internas: cabeçalho, conteúdo, rodapé. */
export function Casca({ children }: { children: ReactNode }) {
  return (
    <>
      <Cabecalho />
      <main id="conteudo">{children}</main>
      <Rodape />
      <BotaoWhatsapp />
    </>
  );
}

/**
 * Topo de página interna.
 *
 * O h1 carrega a palavra-chave da página, e a trilha logo acima diz ao
 * visitante e ao Google onde ele está. Sem isso, toda página interna
 * parece uma home solta.
 */
export function TopoPagina({
  rotulo,
  titulo,
  texto,
  trilha,
}: {
  rotulo: string;
  titulo: ReactNode;
  texto?: string;
  trilha?: { nome: string; href: string }[];
}) {
  return (
    <section className="relative isolate overflow-hidden pb-14 pt-12 md:pb-20 md:pt-16">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="grade absolute inset-0" />
        <div className="brilho-magenta absolute -right-[16%] -top-[42%] h-[720px] w-[720px] opacity-35" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-marinho" />
      </div>

      <div className={secao}>
        {trilha ? (
          <nav aria-label="Trilha de navegação">
            <ol className="flex flex-wrap items-center gap-2 font-mono text-[0.66rem] uppercase tracking-[0.16em] text-cinza">
              <li>
                <Link href="/" className="transition-colors hover:text-neve">
                  Início
                </Link>
              </li>
              {trilha.map((t) => (
                <li key={t.href} className="flex items-center gap-2">
                  <span aria-hidden>/</span>
                  <Link href={t.href} className="transition-colors hover:text-neve">
                    {t.nome}
                  </Link>
                </li>
              ))}
            </ol>
          </nav>
        ) : null}

        <p className={'mt-6 flex items-center gap-3 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-magenta-texto'}>
          <span aria-hidden className="h-px w-8 bg-magenta" />
          {rotulo}
        </p>

        <h1 className="mt-5 max-w-[22ch] font-display text-titulo font-extrabold tracking-[-0.04em]">
          {titulo}
        </h1>

        {texto ? (
          <p className="mt-7 max-w-[62ch] text-guia text-neve">{texto}</p>
        ) : null}
      </div>
    </section>
  );
}

/** Chamada final, repetida no pé de cada página interna. */
export function ChamadaFinal({
  titulo = 'Vamos olhar a sua operação inteira.',
  texto = 'Diagnóstico gratuito nas quatro frentes, com as prioridades apontadas por ordem de impacto no faturamento.',
}: {
  titulo?: string;
  texto?: string;
}) {
  return (
    <section className="relative isolate mt-8 overflow-hidden bg-magenta py-20 md:py-24">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(120%_100%_at_15%_0%,rgba(255,255,255,0.22),transparent_55%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(200deg,transparent_35%,rgba(16,31,63,0.55))]" />
      </div>
      <div className={secao}>
        <h2 className="max-w-[17ch] font-display text-titulo font-extrabold tracking-[-0.04em] text-branco">
          {titulo}
        </h2>
        <p className="mt-6 max-w-[52ch] text-guia text-branco/90">{texto}</p>
        <div className="mt-9 flex flex-wrap gap-4">
          <Botao href="/diagnostico" variante="claro">
            Começar o diagnóstico
          </Botao>
          <Botao href="/contato" variante="secundario">
            Falar com a {site.nome}
          </Botao>
        </div>
      </div>
    </section>
  );
}

/** Monta o canonical de uma rota. Toda página interna usa. */
export const canonical = (caminho: string) => ({
  alternates: { canonical: urlAbsoluta(caminho) },
});
