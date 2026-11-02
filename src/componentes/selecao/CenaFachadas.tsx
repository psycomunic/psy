'use client';

import { useEffect, useRef } from 'react';
import { selecao } from '@/conteudo/selecao-braganca';
import { Seta } from './CenaCaete';

/**
 * Capítulo "As 10 vagas": as fachadas acendendo, amarradas à rolagem.
 *
 * Jornada: uma fileira de 10 casarões coloniais de comércio, à noite,
 * com as portas de aço fechadas e a lua magenta sobre os telhados. Uma
 * a uma, da esquerda para a direita, as portas sobem e as lojas
 * acendem, até sobrar só a última, fechada. Sem pessoas, de propósito:
 * a primeira versão (empresários sentando numa sala de reunião) não
 * tinha a cara do povo da cidade. Quadros A/B e vídeo no Google Flow.
 *
 * DETALHE TEMÁTICO: o contador de vagas abertas cai de 10 para 1 com o
 * mesmo progresso da cena. Fala do negócio da página: escassez real.
 *
 * ============================================================
 * POR QUE O CELULAR NÃO RECEBE O VÍDEO
 * ============================================================
 * Recebia, e ficava preto. Duas causas somadas, em 1 de novembro:
 *
 * 1. O Safari do iOS não pinta quadro nenhum de um vídeo que nunca
 *    tocou. Mexer em `currentTime` antes do primeiro play() não mostra
 *    nada. O herói da home já sabia disso e se defende com um
 *    play()/pause() no primeiro toque; esta cena nasceu de um
 *    copiar-colar que deixou a defesa para trás.
 * 2. O arquivo tinha 19 MB. No 4G o `canplaythrough` não chega nos 6
 *    segundos do fallback, a tela de carga sai e sobra o elemento de
 *    vídeo vazio, que é preto.
 *
 * A correção não foi destravar o vídeo no celular: foi não mandar
 * vídeo para o celular. Doze quadros WebP de 1280 px, 1,8 MB somados
 * contra 19 MB, trocados pelo progresso da rolagem. A rua acende em
 * degraus, e degrau é exatamente o que uma luz que acende faz.
 *
 * ============================================================
 * TROCOU O VÍDEO? MEÇA A CURVA DE BRILHO ANTES
 * ============================================================
 * A rolagem inteira é mapeada na duração inteira do arquivo, então
 * todo segundo em que a cena não muda vira rolagem morta. A primeira
 * versão das fachadas terminava de acender em 2,5 s dos 5,5 s: mais da
 * metade do capítulo sem nada acontecendo, e ninguém percebeu olhando.
 * A curva de brilho médio percebe. A receita está em ARQUITETURA.md,
 * na seção Scroll Cinema.
 *
 * O arquivo de hoje (5,6 s, 168 quadros, 11,5 MB) usa a duração toda:
 * as dez lojas acendem até o fim, e a última, "SUA EMPRESA", fica
 * fechada. Nada a cortar. Se entrar outro vídeo, meça de novo.
 *
 * Defesas do Scroll Cinema (não regridam):
 * - `public/video/selecao-fachadas.mp4` tem TODO quadro como keyframe.
 * - Lê readyState no bind, não confia só em loadedmetadata.
 * - document.hidden aplica direto, sem requestAnimationFrame.
 * - O vídeo só aparece com readyState >= 2, ou seja, com quadro de
 *   verdade na mão. Sem isso o fallback de 6 s revelava o preto.
 * - Embaixo do vídeo mora sempre uma imagem. Se o vídeo não vier, a
 *   cena vira a sequência de quadros em vez de virar um retângulo
 *   preto. Essa é a defesa que faltava.
 * - Vídeo em caixa: tipografia em unidades cq (container-type: size).
 */

/* Os doze estados da rua, do tudo fechado à última porta. Servem de
   cena no celular e de chão em qualquer lugar onde o vídeo falhe. */
const QUADROS = Array.from(
  { length: 12 },
  (_, i) => `/selecao/fachadas-${String(i + 1).padStart(2, '0')}-m.webp`,
);

export function CenaFachadas() {
  const v = selecao.vagas;
  const secao = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const quadro = useRef<HTMLImageElement>(null);
  const carga = useRef<HTMLDivElement>(null);
  const numero = useRef<HTMLElement>(null);
  const trilho = useRef<HTMLElement>(null);

  useEffect(() => {
    const s = secao.current;
    const vid = video.current;
    const img = quadro.current;
    if (!s || !img) return;

    /* Aparelho de toque ou tela estreita não recebe os 10 MB. A
       vírgula é "ou" em media query: tablet com mouse numa tela larga
       continua ganhando o vídeo. */
    const leve = window.matchMedia('(hover: none), (max-width: 900px)').matches;

    let modo: 'video' | 'quadros' = leve ? 'quadros' : 'video';
    let duracao = 0;
    let pronto = false;
    let alvo = 0;
    let pendente = false;
    let atual = -1;
    let carregando = false;

    /* Os quadros entram em fila, um puxando o próximo. Doze pedidos de
       uma vez competem com o primeiro, que é o único que a pessoa
       está esperando para ver. */
    function enfileirar(i: number) {
      if (i >= QUADROS.length) return;
      const im = new Image();
      im.onload = im.onerror = () => enfileirar(i + 1);
      im.src = QUADROS[i];
    }

    function pedirQuadros() {
      if (carregando) return;
      carregando = true;
      enfileirar(1);
    }

    function revelar() {
      carga.current?.classList.add('is-fim');
    }

    function aplicar() {
      pendente = false;

      if (modo === 'video' && duracao && vid) {
        const t = alvo * (duracao - 0.04);
        if (Math.abs(vid.currentTime - t) > 0.001) vid.currentTime = t;
      }

      if (modo === 'quadros' && img) {
        const i = Math.min(QUADROS.length - 1, Math.max(0, Math.floor(alvo * QUADROS.length)));
        if (i !== atual) {
          atual = i;
          img.src = QUADROS[i];
        }
        /* celular em pé: a câmera acompanha as luzes da esquerda à direita */
        img.style.objectPosition = leve ? `${(alvo * 100).toFixed(2)}% 50%` : '';
      }

      const vagas = Math.max(1, 10 - Math.floor(alvo * 9.999));
      if (numero.current) numero.current.textContent = String(vagas).padStart(2, '0');
      if (trilho.current) trilho.current.style.transform = `scaleX(${alvo})`;
    }

    function aoRolar() {
      if (!s) return;
      const r = s.getBoundingClientRect();
      const util = s.offsetHeight - window.innerHeight;
      const p = util > 0 ? -r.top / util : 0;
      alvo = Math.min(1, Math.max(0, p));
      if (document.hidden) aplicar();
      else if (!pendente) {
        pendente = true;
        requestAnimationFrame(aplicar);
      }
    }

    /* O vídeo só sobe por cima da imagem quando tem quadro decodificado
       para mostrar. readyState 2 é HAVE_CURRENT_DATA: menos que isso e
       revelar o elemento é revelar preto. */
    function marcarPronto() {
      if (pronto || !vid) return;
      if (vid.readyState < 2) return;
      pronto = true;
      duracao = vid.duration || duracao;
      vid.classList.add('is-pronto');
      revelar();
      aoRolar();
    }

    /* Passados 6 segundos sem vídeo utilizável, a cena deixa de esperar
       e passa a ser a sequência de quadros. Ninguém fica olhando uma
       tela de carga, e ninguém vê preto. */
    function desistirDoVideo() {
      if (pronto) return;
      modo = 'quadros';
      if (vid) vid.hidden = true;
      pedirQuadros();
      revelar();
      atual = -1;
      aoRolar();
    }

    const aoMeta = () => {
      if (vid) duracao = vid.duration;
    };

    if (modo === 'quadros') {
      /* Fora do caminho de verdade, e não só transparente: um elemento
         invisível por cima da cena ainda responde ao elementFromPoint,
         ainda entra na árvore de acessibilidade e ainda é um vídeo sem
         fonte que o navegador precisa considerar. */
      if (vid) vid.hidden = true;
      pedirQuadros();
      if (img.complete) revelar();
      else img.addEventListener('load', revelar, { once: true });
    }

    let reserva = 0;

    if (modo === 'video' && vid) {
      /* O src entra aqui, e não no JSX, para que o celular nunca peça
         o arquivo. Atributo no servidor baixa antes deste código rodar. */
      vid.src = '/video/selecao-fachadas.mp4';
      vid.load();
      if (vid.readyState >= 1 && vid.duration) duracao = vid.duration;
      vid.addEventListener('loadedmetadata', aoMeta);
      vid.addEventListener('canplaythrough', marcarPronto);
      vid.addEventListener('loadeddata', marcarPronto);
      if (vid.readyState >= 2) marcarPronto();
      reserva = window.setTimeout(desistirDoVideo, 6000);
    }

    /*
      DESTRAVA O VÍDEO NO APARELHO DE TOQUE.

      Mesma defesa do herói da home. Aqui ela cobre o caso de borda que
      sobrou: tela larga com toque, que passou no teste do `leve` e
      recebeu o vídeo. O catch não é decorativo, play() seguido de
      pause() rejeita com AbortError.
    */
    function destravar() {
      if (!vid) return;
      const pr = vid.play();
      if (pr && typeof pr.then === 'function') {
        pr.then(() => {
          vid.pause();
          if (vid.duration) duracao = vid.duration;
          marcarPronto();
          aplicar();
        }).catch(() => {});
      }
    }
    const comToque = window.matchMedia('(hover: none)').matches;
    if (modo === 'video' && comToque) {
      window.addEventListener('touchstart', destravar, { passive: true, once: true });
    }

    window.addEventListener('scroll', aoRolar, { passive: true });
    window.addEventListener('resize', aoRolar);
    aoRolar();

    return () => {
      window.clearTimeout(reserva);
      if (vid) {
        vid.removeEventListener('loadedmetadata', aoMeta);
        vid.removeEventListener('canplaythrough', marcarPronto);
        vid.removeEventListener('loadeddata', marcarPronto);
      }
      img.removeEventListener('load', revelar);
      window.removeEventListener('touchstart', destravar);
      window.removeEventListener('scroll', aoRolar);
      window.removeEventListener('resize', aoRolar);
    };
  }, []);

  return (
    <section className="sel-cadeiras" ref={secao} id="vagas" aria-labelledby="sel-vagas">
      <div className="sel-cadeiras-fixo">
        <div className="sel-cadeiras-texto">
          <span className="sel-rotulo">
            <b>{v.numero}</b> {v.rotulo}
          </span>
          <h2 className="sel-titulo" id="sel-vagas">
            {v.titulo.map((l) => (
              <span key={l}>{l}</span>
            ))}
          </h2>
          <p>{v.texto}</p>
          <a href="#inscricao" className="sel-botao" data-sel-abrir>
            Quero uma das vagas
            <Seta />
          </a>
        </div>
        <div className="sel-cadeiras-caixa">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={quadro}
            className="sel-cadeiras-quadro"
            src={QUADROS[0]}
            alt="Dez lojas coloniais à noite acendendo uma a uma até sobrar uma fechada"
            decoding="sync"
            draggable={false}
          />
          <video ref={video} muted playsInline preload="auto" aria-hidden="true" />
          <div className="sel-cadeiras-carga" ref={carga}>
            Acendendo a rua
          </div>
          <div className="sel-contador" aria-live="off">
            <b ref={numero}>10</b>
            <small>{v.contador}</small>
          </div>
          <div className="sel-cadeiras-trilho">
            <i ref={trilho} />
          </div>
        </div>
      </div>
    </section>
  );
}
