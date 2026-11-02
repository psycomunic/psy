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
 * mesmo progresso do vídeo. Fala do negócio da página: escassez real.
 *
 * Defesas do Scroll Cinema (não regridam):
 * - `public/video/selecao-fachadas.mp4` tem TODO quadro como keyframe.
 * - Lê readyState no bind, não confia só em loadedmetadata.
 * - document.hidden aplica direto, sem requestAnimationFrame.
 * - Carregamento com fallback de 6 s.
 * - Vídeo em caixa: tipografia em unidades cq (container-type: size).
 */
export function CenaFachadas() {
  const v = selecao.vagas;
  const secao = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const carga = useRef<HTMLDivElement>(null);
  const numero = useRef<HTMLElement>(null);
  const trilho = useRef<HTMLElement>(null);

  useEffect(() => {
    const s = secao.current;
    const vid = video.current;
    if (!s || !vid) return;
    let duracao = 0;
    let pronto = false;
    let alvo = 0;
    let pendente = false;

    if (vid.readyState >= 1 && vid.duration) duracao = vid.duration;

    function aplicar() {
      pendente = false;
      if (duracao && vid) {
        const t = alvo * (duracao - 0.04);
        if (Math.abs(vid.currentTime - t) > 0.001) vid.currentTime = t;
        /* celular em pé: a câmera acompanha as luzes da esquerda à direita */
        vid.style.objectPosition = window.innerWidth < 900 ? `${(alvo * 100).toFixed(2)}% 50%` : '';
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
    function marcarPronto() {
      if (pronto || !vid) return;
      pronto = true;
      duracao = vid.duration || duracao;
      vid.classList.add('is-pronto');
      carga.current?.classList.add('is-fim');
      aoRolar();
    }
    const aoMeta = () => {
      if (vid) duracao = vid.duration;
    };
    vid.addEventListener('loadedmetadata', aoMeta);
    vid.addEventListener('canplaythrough', marcarPronto);
    if (vid.readyState >= 4) marcarPronto();
    const reserva = window.setTimeout(marcarPronto, 6000);

    window.addEventListener('scroll', aoRolar, { passive: true });
    window.addEventListener('resize', aoRolar);
    aoRolar();
    return () => {
      window.clearTimeout(reserva);
      vid.removeEventListener('loadedmetadata', aoMeta);
      vid.removeEventListener('canplaythrough', marcarPronto);
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
          <video
            ref={video}
            src="/video/selecao-fachadas.mp4"
            poster="/selecao/fachadas-a.webp"
            muted
            playsInline
            preload="auto"
            aria-label="Dez lojas coloniais à noite acendendo uma a uma até sobrar uma fechada"
          />
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
