'use client';

import { useEffect, useId, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';

/**
 * A abertura da página de tráfego, em tela cheia.
 *
 * ============================================================
 * O QUE VEIO DA REFERÊNCIA, E O QUE NÃO VEIO
 * ============================================================
 * Veio a ESTRUTURA e o MOVIMENTO: hero ocupando a tela inteira, a
 * interface disposta em grade por cima da imagem, o holofote que segue
 * o cursor revelando uma segunda camada, e o título que sobe palavra
 * por palavra.
 *
 * Não veio o resto. As imagens da referência são de outra pessoa, num
 * CDN de terceiro, e o assunto delas é um samurai cyberpunk. As cores
 * também são de outra marca. Copiar isso seria trocar a identidade da
 * Psy Comunic pela de um exemplo.
 *
 * ============================================================
 * POR QUE O HOLOFOTE REVELA JUSTAMENTE ISSO
 * ============================================================
 * Efeito bonito que não diz nada cansa na segunda visita. Aqui as duas
 * camadas são o argumento da página: embaixo, os anúncios todos iguais
 * e apagados, que é como a conta parece de fora; onde a luz passa, um
 * deles acende. "Qual campanha está pagando a conta" deixa de ser
 * frase e vira gesto.
 *
 * ============================================================
 * NADA AQUI DEPENDE DE JAVASCRIPT PARA EXISTIR
 * ============================================================
 * O título aparece por animação de CSS que roda no carregamento, e não
 * por observador. Sem script, o holofote não acende e o resto continua
 * inteiro e legível: é a mesma regra do `Revelar`, e foi ela que já
 * custou uma página inteira invisível neste projeto.
 */

const TELAS = [
  'manalinda.jpg',
  'casalinda.jpg',
  'carmellita.jpg',
  'doris-kids.jpg',
  'vettor28.jpg',
  'lar-e-vida.jpg',
  'grupo-disagua.jpg',
  'foodmetricas.jpg',
  'torres-contabilidade.jpg',
  'representantes.jpg',
  'medi-marketing.jpg',
  'bloopi.jpg',
];

/* A que acende sob a luz. Uma só: a página inteira existe para dizer
   que a maior parte da verba vai para o que não converte. */
const ACESA = 4;

export function HeroTrafego({
  rotulo,
  titulo,
  texto,
  apoio,
  acao,
  linkWhatsapp,
}: {
  rotulo: string;
  /** Uma linha por entrada. Cada uma sobe separada, como no original. */
  titulo: string[];
  texto: string;
  apoio: string;
  acao: string;
  linkWhatsapp: string;
}) {
  const luz = useRef<HTMLDivElement>(null);
  const palavras = useRef<HTMLDivElement>(null);
  const id = useId().replace(/:/g, '');

  useEffect(() => {
    const alvo = luz.current;
    if (!alvo) return;

    /* Quem pediu menos movimento não recebe holofote nenhum: a camada
       de baixo fica visível por inteiro e acabou. */
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      alvo.style.maskImage = 'none';
      alvo.style.webkitMaskImage = 'none';
      alvo.style.opacity = '0.45';
      return;
    }

    /*
      A LUZ NÃO PASSA POR CIMA DAS PALAVRAS.

      Com o holofote fraco isso não importava. Forte, importa: medido com
      o cursor parado em cima do título, o pixel mais claro do fundo dava
      2,71:1 contra o texto branco num telefone de 390. Texto ilegível
      não é preço aceitável por um efeito.

      A máscara passou a ser DUAS, cruzadas com `intersect`: o círculo do
      holofote e um recorte que exclui o bloco de texto. O recorte é
      calculado da posição real do bloco, não de um palpite em
      porcentagem, porque essa posição muda com a largura, com o tamanho
      da fonte e com o texto que vier a ser escrito ali.

      Na tela larga o texto ocupa a esquerda, então o recorte é
      horizontal e sobra a metade da direita inteira para a luz. No
      telefone o texto atravessa a tela, então o recorte é uma faixa
      horizontal e sobram o topo e o pé, que é justamente onde a parede
      aparece.
    */
    const recorte = () => {
      const r = alvo.getBoundingClientRect();
      const t = palavras.current?.getBoundingClientRect();
      if (!t) return null;
      /* Pena mais curta no telefone: ali o recorte é horizontal e a
         faixa de parede que sobra acima do título tem 68px numa tela de
         360. Com 70px de esfumado ela sumia inteira e o toque não
         acendia nada. */
      const pena = window.innerWidth >= 1024 ? 70 : 34;
      if (window.innerWidth >= 1024) {
        const borda = t.right - r.left;
        return `linear-gradient(to right, transparent ${borda}px, #fff ${borda + pena}px)`;
      }
      const topo = t.top - r.top;
      const base = t.bottom - r.top;
      return (
        `linear-gradient(to bottom, #fff ${Math.max(0, topo - pena)}px, ` +
        `transparent ${topo}px, transparent ${base}px, #fff ${base + pena}px)`
      );
    };

    let pedido = 0;
    const mover = (px: number, py: number) => {
      cancelAnimationFrame(pedido);
      pedido = requestAnimationFrame(() => {
        const r = alvo.getBoundingClientRect();
        const x = px - r.left;
        const y = py - r.top;
        /* Raio menor no telefone: um círculo de 340px numa tela de 360
           acende quase tudo e o efeito deixa de revelar. */
        const raio = window.innerWidth < 480 ? 150 : window.innerWidth < 900 ? 210 : 340;
        const circulo =
          `radial-gradient(circle ${raio}px at ${x}px ${y}px, #fff 0%, #fff 64%, ` +
          `rgba(255,255,255,0.86) 78%, rgba(255,255,255,0.45) 90%, ` +
          `transparent 100%)`;
        const fora = recorte();
        const g = fora ? `${circulo}, ${fora}` : circulo;
        alvo.style.webkitMaskImage = g;
        alvo.style.maskImage = g;
        alvo.style.webkitMaskComposite = 'source-in';
        alvo.style.maskComposite = 'intersect';
      });
    };

    const comMouse = (e: MouseEvent) => mover(e.clientX, e.clientY);
    const comDedo = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) mover(t.clientX, t.clientY);
    };

    window.addEventListener('mousemove', comMouse);
    window.addEventListener('touchmove', comDedo, { passive: true });
    return () => {
      cancelAnimationFrame(pedido);
      window.removeEventListener('mousemove', comMouse);
      window.removeEventListener('touchmove', comDedo);
    };
  }, []);

  /* `prioridade` so na camada de BAIXO. As duas camadas usam as mesmas
     URLs, entao o navegador baixa doze arquivos e reaproveita; marcar
     as vinte e quatro como prioritarias geraria doze preloads
     duplicados disputando a primeira pintura. */
  const parede = (acesa: boolean) => (
    <ul className="grid h-full w-full grid-cols-3 gap-2 p-2 sm:grid-cols-4 sm:gap-3 sm:p-3 lg:grid-cols-6">
      {TELAS.map((arquivo, i) => (
        <li
          key={arquivo}
          className={
            'relative overflow-hidden rounded-lg border sm:rounded-xl ' +
            (acesa && i === ACESA
              ? 'border-magenta shadow-[0_0_90px_-4px_rgba(228,21,95,1)] ring-1 ring-magenta'
              : acesa
                ? 'border-white/30'
                : 'border-fio')
          }
        >
          <Image
            src={`/imagens/sites/${arquivo}`}
            alt=""
            fill
            sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 17vw"
            className="object-cover object-top"
            priority={!acesa && i < 4}
            loading={!acesa && i < 4 ? undefined : 'lazy'}
          />
          {/* Véu por cima de cada tela. Sem ele, doze prints coloridos
              competem com o título e ninguém lê a frase. */}
          <span
            aria-hidden
            className={
              'absolute inset-0 ' +
              (acesa && i === ACESA
                ? 'bg-magenta/10'
                : acesa
                  ? 'bg-marinho/35'
                  : 'bg-marinho/88 backdrop-grayscale backdrop-brightness-50')
            }
          />
        </li>
      ))}
    </ul>
  );

  return (
    <section
      aria-label="Abertura"
      className="relative isolate w-full overflow-hidden bg-marinho"
      /* Tela cheia MENOS o cabeçalho, que é `sticky` e portanto empurra
         esta seção para baixo. Com `100svh` puro, a última faixa (a
         ficha e a dica do holofote) caía fora da dobra em toda tela de
         computador, e ficava cortada em silêncio pelo `overflow-hidden`.
         `--cabecalho` é medida e publicada pelo próprio cabeçalho; o
         valor de reserva cobre o primeiro quadro e o caso sem script. */
      style={{ minHeight: 'calc(100svh - var(--cabecalho, 81px))' }}
    >
      {/* Camada de baixo: tudo igual, apagado, sem graça. */}
      <div aria-hidden className="absolute inset-0 z-0">{parede(false)}</div>

      {/* Camada revelada pelo holofote. Começa escondida por uma máscara
          fora da tela, e só existe onde o cursor passa. */}
      <div
        ref={luz}
        aria-hidden
        className="absolute inset-0 z-[1]"
        style={{
          WebkitMaskImage: 'radial-gradient(circle 0px at -999px -999px, #fff, transparent)',
          maskImage: 'radial-gradient(circle 0px at -999px -999px, #fff, transparent)',
        }}
      >
        {parede(true)}
      </div>

      {/* Cenário fixo: grade, brilho e um degradê que garante contraste
          de texto sobre qualquer print que esteja por baixo.

          O degradê recua bem antes do meio. Ele cobria até 72% da
          largura para proteger uma ficha que ficava à direita; sem ela,
          aquilo virou um véu por cima justamente da metade onde o
          holofote tem espaço para aparecer. Agora ele termina onde o
          texto termina.

          No telefone não há "metade da direita": o texto atravessa a
          tela toda e o degradê na diagonal viraria um véu uniforme,
          apagando o holofote (medido: 12% de ganho de brilho, contra
          55% no computador). Lá entra uma lavagem leve, e quem escurece
          o fundo é o véu de cada tela, que já é escuro. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-[2]">
        <div className="grade absolute inset-0 opacity-40" />
        <div className="brilho-magenta absolute -right-[16%] -top-[34%] h-[720px] w-[720px] opacity-40" />
        <div className="absolute inset-0 bg-marinho/35 md:hidden" />
        <div className="absolute inset-0 hidden md:block md:bg-[linear-gradient(100deg,var(--marinho)_10%,color-mix(in_oklab,var(--marinho)_72%,transparent)_32%,transparent_56%)]" />
        <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-b from-transparent to-marinho" />
      </div>

      {/* A interface por cima, em grade. */}
      <div className="pointer-events-none relative z-10 mx-auto flex min-h-[calc(100svh-var(--cabecalho,81px))] w-full max-w-[1320px] items-center px-5 pb-14 pt-16 md:px-10 md:pb-16 md:pt-20">
        <div ref={palavras} className="pointer-events-auto max-w-[min(700px,100%)]">
          <p className="flex items-center gap-3 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-magenta-texto">
            <span aria-hidden className="h-px w-8 bg-magenta" />
            {rotulo}
          </p>

          <h1
            className={`hero-titulo-${id} mt-6 max-w-[15ch] font-display text-mostro font-extrabold tracking-[-0.04em]`}
          >
            {titulo.map((linha, i) => (
              <span
                key={linha}
                className="block"
                style={{ animationDelay: `${0.08 + i * 0.12}s` }}
              >
                {linha}
              </span>
            ))}
          </h1>

          <p className="mt-7 max-w-[46ch] text-guia leading-relaxed text-neve">{texto}</p>

          <div className="mt-9 flex flex-wrap items-center gap-3.5">
            <Link
              href="#analise"
              className="inline-flex min-h-[52px] items-center gap-2.5 rounded-full bg-magenta px-7 text-sm font-semibold text-branco transition-all duration-300 hover:-translate-y-0.5 hover:bg-magenta-forte hover:shadow-[0_10px_40px_-8px_rgba(228,21,95,0.75)]"
            >
              {acao}
              <span aria-hidden>→</span>
            </Link>
            <a
              href={linkWhatsapp}
              target="_blank"
              rel="noopener"
              className="inline-flex min-h-[52px] items-center gap-2.5 rounded-full px-7 text-sm font-semibold text-branco ring-1 ring-inset ring-white/20 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/5 hover:ring-white/45"
            >
              Falar no WhatsApp
              <span aria-hidden>→</span>
            </a>
          </div>

          <p className="mt-6 max-w-[42ch] text-sm leading-relaxed text-cinza">{apoio}</p>
        </div>

      </div>

      <style>{`
        .hero-titulo-${id} > span {
          animation: heroSobe .7s cubic-bezier(.22,.61,.36,1) both;
        }
        @keyframes heroSobe {
          from { opacity: 0; transform: translateY(22px); filter: blur(6px); }
          to   { opacity: 1; transform: none; filter: blur(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-titulo-${id} > span { animation: none; opacity: 1; transform: none; filter: none; }
        }
      `}</style>
    </section>
  );
}
