'use client';

import { useEffect, useRef, useState } from 'react';
import { LinkWhatsapp } from './LinkWhatsapp';
import { linkDaUnidade, type Unidade } from '@/conteudo/braganca';

/**
 * A apresentação em vídeo, que toma a tela quando a cena da abertura
 * termina.
 *
 * ============================================================
 * NÃO TOCA SOZINHO, E É POR ISSO QUE O SOM FUNCIONA
 * ============================================================
 * O popup abre com o vídeo parado, no quadro de capa, com um botão de
 * play grande no meio. A pessoa vê que tem vídeo e decide assistir.
 *
 * Isso não é só menos invasivo: é o que faz o áudio funcionar. Nenhum
 * navegador deixa vídeo começar sozinho com som, então quem dá autoplay
 * é obrigado a começar mudo e depois implorar pelo áudio. Apertar o play
 * JÁ É o gesto que o navegador exige, então aqui o som entra de primeira,
 * sem etapa intermediária.
 *
 * ============================================================
 * ELE FECHA, E ISSO É DE PROPÓSITO
 * ============================================================
 * Dá para esconder o X e prender a pessoa. Não fiz, e a razão é
 * comercial antes de ser ética: quem se sente preso não assiste, fecha
 * a aba. E aba fechada não volta, enquanto quem pula o vídeo continua na
 * página, onde ainda há oito botões de WhatsApp esperando.
 *
 * Se você quiser mesmo travar, é uma linha, mas eu recomendaria medir
 * antes: os dois eventos do GA4 daqui já respondem se o vídeo ajuda.
 *
 * ============================================================
 * ABRE UMA VEZ POR VISITA
 * ============================================================
 * O fim da cena é um ponto de rolagem, e a pessoa passa por ele toda vez
 * que sobe e desce. Sem trava, o popup reabriria a cada ida e volta.
 * `sessionStorage`, e não `localStorage`: quem volta outro dia vê de
 * novo, quem está rolando agora não.
 *
 * ============================================================
 * SEM O ARQUIVO, VIRA CONVITE DE TEXTO
 * ============================================================
 * Enquanto `apresentacao.video` não existir, o popup mostra os tópicos
 * em lista e o botão de WhatsApp. Sem moldura vazia e sem "em breve".
 */
export function PopupApresentacao({ u }: { u: Unidade }) {
  const caixa = useRef<HTMLDialogElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [tocou, setTocou] = useState(false);
  const [acabou, setAcabou] = useState(false);

  useEffect(() => {
    const d = caixa.current;
    if (!d) return;

    const chave = `apresentacao-vista:${u.slug}`;
    let jaAbriu = false;
    try {
      jaAbriu = sessionStorage.getItem(chave) === 'sim';
    } catch {
      /* Aba anônima ou armazenamento bloqueado. A variável acima ainda
         impede a reabertura nesta visita. */
    }

    function abrir() {
      if (jaAbriu || d!.open) return;
      jaAbriu = true;
      try {
        sessionStorage.setItem(chave, 'sim');
      } catch {
        /* ignora */
      }
      d!.showModal();
      document.body.style.overflow = 'hidden';
      window.gtag?.('event', 'abriu_apresentacao', { pagina: u.slug });
    }

    function aoFechar() {
      document.body.style.overflow = '';
      const v = video.current;
      if (v && !v.paused) v.pause();
    }

    window.addEventListener('cena-terminou', abrir as EventListener);
    d.addEventListener('close', aoFechar);

    const aoClicar = (e: MouseEvent) => {
      if (e.target === d) d.close();
    };
    d.addEventListener('click', aoClicar);

    return () => {
      window.removeEventListener('cena-terminou', abrir as EventListener);
      d.removeEventListener('close', aoFechar);
      d.removeEventListener('click', aoClicar);
      document.body.style.overflow = '';
    };
  }, [u.slug]);

  const a = u.apresentacao;

  /* Dá play, com som. Roda dentro do clique, que é o gesto que o
     navegador exige para liberar áudio. O catch cobre o aparelho que
     recusa mesmo assim, e nesses casos os controles nativos continuam
     ali para a pessoa tentar de novo. */
  function tocar() {
    const v = video.current;
    if (!v) return;
    v.muted = false;
    v.play().catch(() => {});
    setTocou(true);
    window.gtag?.('event', 'play_apresentacao', { pagina: u.slug });
  }

  return (
    <dialog
      ref={caixa}
      aria-labelledby="apresentacao-titulo"
      className={
        'popup-apresentacao rounded-[var(--raio)] border border-fio bg-marinho-fundo p-0 text-branco ' +
        'backdrop:bg-[rgba(6,9,26,0.88)] backdrop:backdrop-blur-sm ' +
        (a.video ? 'w-[min(58rem,94vw)]' : 'w-[min(46rem,92vw)]')
      }
    >
      {a.video ? (
        <div>
          {/* `relative` AQUI, e não no modal inteiro: o botão de play é
              `inset-0`, e ancorado no modal ele ficava centralizado por
              cima do título e do texto. O contexto de posicionamento
              precisa ser exatamente a caixa do vídeo. */}
          <div className="relative">
          <video
            ref={video}
            src={a.video}
            poster={a.poster}
            playsInline
            /* Controles nativos só DEPOIS do play. Antes, quem convida é
               o botão grande, e a barra do navegador só ficava batendo
               no rótulo dele. Depois do play a barra é necessária: é por
               ela que a pessoa pausa, volta e ajusta o som. */
            controls={tocou}
            preload="metadata"
            onEnded={() => setAcabou(true)}
            className="aspect-video w-full rounded-t-[var(--raio)] bg-black"
          />

          {/* O play, grande e no meio. Some assim que a pessoa aperta, e
              dali em diante quem manda são os controles nativos. É o que
              anuncia "tem vídeo aqui" sem precisar de uma frase. */}
          {tocou ? null : (
            <button
              type="button"
              onClick={tocar}
              aria-label="Assistir à apresentação"
              className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-t-[var(--raio)] bg-[rgba(6,9,26,0.4)] transition-colors hover:bg-[rgba(6,9,26,0.25)]"
            >
              <span
                aria-hidden
                className="flex h-[74px] w-[74px] items-center justify-center rounded-full bg-magenta pl-1.5 text-3xl text-branco shadow-[0_10px_40px_-8px_rgba(228,21,95,0.9)]"
              >
                ▶
              </span>
              <span className="rounded-full bg-marinho-fundo/90 px-5 py-2.5 text-sm font-semibold">
                Assistir à apresentação
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => caixa.current?.close()}
            aria-label="Fechar"
            className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-[rgba(6,9,26,0.7)] text-neve transition-colors hover:bg-marinho hover:text-branco"
          >
            <span aria-hidden className="text-xl leading-none">
              ×
            </span>
          </button>
          </div>

          <div className="p-6 md:p-7">
            <h2
              id="apresentacao-titulo"
              className="max-w-[28ch] font-display text-xl font-extrabold tracking-[-0.03em] md:text-2xl"
            >
              {a.titulo}
            </h2>
            {/* Depois que o vídeo acaba, a chamada cresce: é o momento em
                que a pessoa está mais perto de agir. */}
            <p
              className={
                'mt-3 max-w-[60ch] leading-relaxed text-cinza ' + (acabou ? 'text-neve' : '')
              }
            >
              {a.texto}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3.5">
              <LinkWhatsapp
                href={linkDaUnidade(u, a.mensagem)}
                pagina={u.slug}
                secao="apresentacao"
                className="inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-full bg-magenta px-7 text-sm font-semibold tracking-wide text-branco transition-all duration-300 hover:-translate-y-0.5 hover:bg-magenta-forte"
              >
                {a.acao}
                <span aria-hidden>→</span>
              </LinkWhatsapp>
              <button
                type="button"
                onClick={() => caixa.current?.close()}
                className="inline-flex min-h-[52px] items-center rounded-full px-6 text-sm font-semibold text-cinza transition-colors hover:text-branco"
              >
                Continuar lendo a página
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative p-7 md:p-9">
          <button
            type="button"
            onClick={() => caixa.current?.close()}
            aria-label="Fechar"
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full text-cinza transition-colors hover:bg-white/5 hover:text-branco"
          >
            <span aria-hidden className="text-xl leading-none">
              ×
            </span>
          </button>

          <p className="flex items-center gap-3 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-magenta-texto">
            <span aria-hidden className="h-px w-8 bg-magenta" />
            {u.cidade}, {u.estado}
          </p>

          <h2
            id="apresentacao-titulo"
            className="mt-5 max-w-[22ch] font-display text-2xl font-extrabold tracking-[-0.03em] md:text-3xl"
          >
            {a.titulo}
          </h2>

          <p className="mt-5 max-w-[56ch] leading-relaxed text-neve">{a.texto}</p>

          <ul className="mt-7 grid gap-3">
            {a.topicos.map((t) => (
              <li key={t} className="flex gap-3 leading-relaxed text-cinza">
                <span aria-hidden className="mt-1.5 flex-none text-magenta-texto">
                  ●
                </span>
                {t}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap items-center gap-3.5">
            <LinkWhatsapp
              href={linkDaUnidade(u, a.mensagem)}
              pagina={u.slug}
              secao="apresentacao"
              className="inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-full bg-magenta px-7 text-sm font-semibold tracking-wide text-branco transition-all duration-300 hover:-translate-y-0.5 hover:bg-magenta-forte"
            >
              {a.acao}
              <span aria-hidden>→</span>
            </LinkWhatsapp>
            <button
              type="button"
              onClick={() => caixa.current?.close()}
              className="inline-flex min-h-[52px] items-center rounded-full px-6 text-sm font-semibold text-cinza transition-colors hover:text-branco"
            >
              Continuar lendo a página
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
