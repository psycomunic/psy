'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';

/**
 * Uma parede de anúncios no escuro, e um holofote que segue o cursor.
 *
 * ============================================================
 * O EFEITO É O ARGUMENTO, NÃO O ENFEITE
 * ============================================================
 * São duas camadas da mesma parede. Embaixo, doze trabalhos em cinza e
 * apagados, que é como uma operação parece de fora. Onde a luz passa,
 * um deles acende em magenta. "Ninguém sabe o que está funcionando"
 * deixa de ser frase e vira gesto.
 *
 * Efeito bonito que não diz nada cansa na segunda visita. Este diz.
 *
 * ============================================================
 * A LUZ NÃO PASSA POR CIMA DAS PALAVRAS
 * ============================================================
 * Com o holofote fraco isso não importava. Forte, importa: medido com o
 * cursor parado em cima do título, o pixel mais claro do fundo dava
 * 2,71:1 contra o texto branco num telefone de 390. Texto ilegível não
 * é preço aceitável por um efeito.
 *
 * Por isso a máscara é DUAS, cruzadas com `intersect`: o círculo do
 * holofote e um recorte que exclui o bloco de texto. Quem marca esse
 * bloco é a página, com `data-fora-da-luz`, e o recorte sai da posição
 * REAL do elemento, não de uma porcentagem chutada, porque essa posição
 * muda com a largura, com a fonte e com o texto que vier a ser escrito
 * ali.
 *
 * ============================================================
 * NADA AQUI PRECISA EXISTIR
 * ============================================================
 * É fundo. Sem script o holofote não acende e a página inteira segue
 * legível, que é a mesma regra do `Revelar` e já custou uma página
 * inteira invisível neste projeto.
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

/* A que acende sob a luz. Uma só: o efeito só diz alguma coisa se a
   maioria continuar apagada. */
const ACESA = 4;

export function ParedeHolofote({ prioridade = false }: { prioridade?: boolean }) {
  const caixa = useRef<HTMLDivElement>(null);
  const luz = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const alvo = luz.current;
    const raiz = caixa.current;
    if (!alvo || !raiz) return;

    /* Quem pediu menos movimento não recebe holofote nenhum: a camada de
       baixo fica visível por inteiro e acabou. */
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      alvo.style.maskImage = 'none';
      alvo.style.webkitMaskImage = 'none';
      alvo.style.opacity = '0.4';
      return;
    }

    const secao = raiz.closest('section') ?? document.body;

    const recorte = () => {
      const r = alvo.getBoundingClientRect();
      const t = secao.querySelector('[data-fora-da-luz]')?.getBoundingClientRect();
      if (!t) return null;

      /* Pena mais curta no telefone: ali o recorte é horizontal, e a
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

  /*
    `priority` só na camada de BAIXO, e só nas primeiras. As duas camadas
    usam as mesmas URLs, então o navegador baixa doze arquivos e
    reaproveita; marcar as vinte e quatro como prioritárias geraria doze
    preloads duplicados disputando a primeira pintura.

    Mas NENHUMA delas pode ser `lazy`, e isso custou uma reprovação em
    produção. A camada de cima nasce escondida atrás da máscara, então o
    navegador decide que aquelas imagens não são necessárias e não as
    busca. Ao mover o cursor, o que acendia era véu sem imagem por cima
    do fundo escuro: medido, o ponto ficava 15% MAIS ESCURO do que sem a
    luz. Um efeito que escurece.

    Local passava porque o cache já tinha os doze arquivos das rodadas
    anteriores. Só a primeira visita via o defeito, que é a visita de
    todo mundo.
  */
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
            className={
              'object-cover object-top ' +
              /* No escuro a parede é TEXTURA, não um mural de prints.
                 Doze telas nítidas atrás do título deixavam a abertura
                 pesada e disputavam a leitura. O desfoque tira o detalhe
                 e deixa o ritmo; a escala de 1,08 cobre a borda que o
                 desfoque come. Sob a luz a imagem entra em foco, e a
                 passagem de borrão cinza para print nítido e colorido é
                 mais visível do que qualquer mudança de brilho. */
              (acesa ? '' : 'scale-[1.08] blur-[3px]')
            }
            priority={prioridade && !acesa && i < 4}
            loading={prioridade && !acesa && i < 4 ? undefined : 'eager'}
          />
          {/*
            Véu por cima de cada tela. Sem ele, doze prints coloridos
            competem com o título e ninguém lê a frase.

            Na camada revelada o véu CLAREIA e devolve a cor, em vez de
            só descobrir a imagem. Medido: num ponto sobre um print de
            topo quase preto, descobrir a imagem deixava a área 11% MAIS
            escura que a camada apagada, e nenhum multiplicador conserta
            preto multiplicado. O branco a 10% dá piso, e a saturação faz
            a volta do cinza para a cor, que é o que se enxerga ali.

            Qual print calha de cair em cada quadrado ninguém controla,
            então o efeito não pode depender disso.
          */}
          <span
            aria-hidden
            className={
              'absolute inset-0 ' +
              (acesa && i === ACESA
                ? 'bg-magenta/14 backdrop-brightness-150 backdrop-saturate-200'
                : acesa
                  ? 'bg-white/10 backdrop-brightness-125 backdrop-saturate-150'
                  : 'bg-marinho/90 backdrop-grayscale backdrop-brightness-50')
            }
          />
        </li>
      ))}
    </ul>
  );

  return (
    <div ref={caixa} aria-hidden className="absolute inset-0 overflow-hidden">
      {/* Camada de baixo: tudo igual, apagado, sem graça. */}
      <div className="absolute inset-0">{parede(false)}</div>

      {/* Camada revelada pelo holofote. Começa escondida por uma máscara
          fora da tela, e só existe onde o cursor passa. */}
      <div
        ref={luz}
        className="absolute inset-0"
        style={{
          WebkitMaskImage: 'radial-gradient(circle 0px at -999px -999px, #fff, transparent)',
          maskImage: 'radial-gradient(circle 0px at -999px -999px, #fff, transparent)',
        }}
      >
        {parede(true)}
      </div>
    </div>
  );
}
