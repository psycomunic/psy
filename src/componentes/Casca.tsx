import type { ReactNode } from 'react';
import Link from 'next/link';
import { Cabecalho } from './Cabecalho';
import { Rodape } from './Rodape';
import { BotaoWhatsapp } from './BotaoWhatsapp';
import { BarraDeAcao } from './BarraDeAcao';
import { site, urlAbsoluta } from '@/conteudo/site';

export const secao = 'mx-auto w-full max-w-[1180px] px-5 md:px-10';

/**
 * Casca comum das páginas internas: cabeçalho, conteúdo, rodapé.
 *
 * `semZap` desliga o botão flutuante padrão. Existe para as páginas de
 * unidade, que têm WhatsApp próprio: a de Bragança atende no (91), e o
 * botão global leva para o número de Blumenau. Sem esta chave, a página
 * ofereceria os dois números no mesmo canto da tela.
 */
export function Casca({
  children,
  semZap,
  zapRodape,
  posicionamentoRodape,
}: {
  children: ReactNode;
  semZap?: boolean;
  /** Troca o WhatsApp do rodape. Ver o comentario em Rodape.tsx. */
  zapRodape?: { link: string; visivel: string; pagina: string };
  /** Troca a linha sob a marca no rodape. Ver o comentario em braganca.ts. */
  posicionamentoRodape?: string;
}) {
  return (
    <>
      <Cabecalho />
      <main id="conteudo">{children}</main>
      <Rodape zap={zapRodape} posicionamento={posicionamentoRodape} />
      {semZap ? null : <BotaoWhatsapp />}
      {semZap ? null : <BarraDeAcao />}
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
      </div>

      <div className={secao}>
        {trilha ? (
          <nav aria-label="Trilha de navegação">
            <ol className="flex flex-wrap items-center gap-2 text-[0.66rem] text-tinta-fraca">
              <li>
                <Link href="/" className="transition-colors hover:text-tinta">
                  Início
                </Link>
              </li>
              {trilha.map((t) => (
                <li key={t.href} className="flex items-center gap-2">
                  <span aria-hidden>/</span>
                  <Link href={t.href} className="transition-colors hover:text-tinta">
                    {t.nome}
                  </Link>
                </li>
              ))}
            </ol>
          </nav>
        ) : null}

        <p className={'mt-6 flex items-center gap-3 text-[0.7rem] text-acento'}>
          <span aria-hidden className="h-px w-8 bg-rosa" />
          {rotulo}
        </p>

        <h1 className="mt-5 max-w-[22ch] font-display text-titulo titulo-revista">
          {titulo}
        </h1>

        {texto ? (
          <p className="mt-7 max-w-[62ch] text-guia text-tinta">{texto}</p>
        ) : null}
      </div>
    </section>
  );
}

/** Chamada final, repetida no pé de cada página interna. */
/**
 * A chamada final das páginas internas.
 *
 * ============================================================
 * OS DOIS VEUS QUE LAVAVAM O MARINHO
 * ============================================================
 * Havia um radial branco a 22% e um linear branco a 55% por cima da
 * faixa. Eles nasceram quando esta secao era MAGENTA CHAPADO: cor
 * solida em area grande nao tem volume, e os dois degrades davam.
 *
 * A secao virou marinho, e branco por cima de marinho nao da volume:
 * lava. O azul descia para um cinza-azulado sujo, que e o que estava
 * errado. Nao ha degrade nenhum aqui agora, porque a regra do tema e
 * que separacao vem de linha e de ar.
 *
 * ============================================================
 * UM BOTAO, E NAO DOIS DO MESMO TAMANHO
 * ============================================================
 * Eram dois botoes lado a lado com o mesmo peso. Dois caminhos
 * igualmente convidativos fazem a pessoa escolher ENTRE ELES em vez
 * de agir. O pedido principal ganhou cartao proprio e altura de 56px;
 * falar no WhatsApp virou link de texto embaixo, que e o peso que uma
 * saida lateral merece.
 *
 * E o mesmo desenho da chamada final da home, de proposito: quem
 * chega aqui por /servicos ou /sobre encontra o mesmo pedido, no
 * mesmo formato.
 */
export function ChamadaFinal({
  titulo = 'Vamos olhar a sua loja de moda inteira.',
  texto = 'Diagnóstico gratuito nas quatro frentes, com as prioridades apontadas por ordem de impacto no faturamento.',
  pontos = [
    'O que está travando a venda hoje',
    'Por onde começar, em ordem de impacto',
    'O que dá para resolver sem trocar de plataforma',
    'Quanto do seu tráfego está sendo desperdiçado',
  ],
}: {
  titulo?: string;
  texto?: string;
  pontos?: string[];
}) {
  return (
    <section className="faixa-navy relative isolate mt-8 overflow-hidden secao-ar">
      <div className={secao}>
        <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-20">
          <div>
            <p className="text-[13px] font-semibold text-acento">Diagnóstico gratuito</p>
            <h2 className="mt-5 font-display text-titulo titulo-revista">{titulo}</h2>
            <p className="mt-6 max-w-[48ch] text-guia leading-relaxed text-tinta-fraca">
              {texto}
            </p>

            <ul className="mt-9 grid gap-3 text-[0.95rem] sm:grid-cols-2">
              {pontos.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span
                    aria-hidden
                    className="mt-[3px] grid h-4 w-4 flex-none place-items-center rounded-full bg-rosa"
                  >
                    <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 fill-none stroke-white" strokeWidth="2.2">
                      <path d="M2.5 6.2 4.8 8.5 9.5 3.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-[var(--raio)] border border-fio bg-white/[0.04] p-8 md:p-10">
            <p className="font-display text-sub font-bold tracking-[-0.01em]">
              Comece pelo diagnóstico
            </p>
            <p className="mt-3 text-sm leading-relaxed text-tinta-fraca">
              Começando do zero ou já vendendo, é o mesmo primeiro passo.
            </p>

            <Link
              href="/diagnostico"
              className="mt-7 flex h-14 w-full items-center justify-center rounded-full bg-rosa px-6 text-center font-semibold text-branco transition-colors hover:bg-rosa-forte"
            >
              Quero meu diagnóstico gratuito
            </Link>

            <p className="mt-4 text-center text-sm text-tinta-fraca">
              Resposta no mesmo dia útil.
            </p>

            <div className="mt-7 border-t border-fio pt-6 text-center">
              <Link
                href="/contato"
                className="text-sm font-semibold text-acento underline-offset-4 hover:underline"
              >
                Prefiro falar com a {site.nome}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Monta o canonical de uma rota. Toda página interna usa. */
export const canonical = (caminho: string) => ({
  alternates: { canonical: urlAbsoluta(caminho) },
});
