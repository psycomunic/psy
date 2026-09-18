'use client';

import { useEffect, useRef } from 'react';
import { LinkWhatsapp } from './LinkWhatsapp';
import { linkDaUnidade, type Unidade } from '@/conteudo/braganca';

/**
 * O convite que abre quando a cena da abertura termina.
 *
 * ============================================================
 * ABRE UMA VEZ, E SÓ UMA
 * ============================================================
 * O gatilho é o fim da animação, e a animação é rolagem: a pessoa passa
 * por aquele ponto toda vez que sobe e desce a página. Sem trava, o
 * popup reabriria a cada ida e volta, e um modal que insiste é motivo
 * para fechar a aba.
 *
 * A trava é `sessionStorage`, e não `localStorage`, de propósito: quem
 * volta ao site outro dia merece ver o convite de novo; quem está
 * rolando agora, não.
 *
 * ============================================================
 * `dialog` NATIVO, E NÃO UMA DIV COM z-index
 * ============================================================
 * O elemento `<dialog>` com `showModal()` entrega de graça o que uma
 * div fingindo ser modal erra: foco preso dentro, Esc fechando, o resto
 * da página marcado como inerte para leitor de tela, e uma camada de
 * fundo que não depende de adivinhar z-index.
 *
 * ============================================================
 * SEM VÍDEO, AINDA É UM CONVITE
 * ============================================================
 * Enquanto `apresentacao.video` não existir, o popup mostra os tópicos
 * em lista e o botão de WhatsApp. Não há moldura vazia esperando
 * arquivo, nem aviso de "em breve": o que está lá funciona sozinho, e o
 * player entra no mesmo lugar quando o arquivo chegar.
 *
 * ============================================================
 * O VÍDEO NÃO TOCA SOZINHO
 * ============================================================
 * Autoplay com som é bloqueado pelo navegador, e autoplay mudo num
 * vídeo de alguém falando entrega uma pessoa mexendo a boca em silêncio.
 * Aqui ele nasce pausado, com os controles à mão, e quem quiser ouvir
 * aperta. `preload="metadata"` baixa só o cabeçalho: numa página que já
 * carrega a cena da abertura, o convite não pode disputar banda.
 */
export function PopupApresentacao({ u }: { u: Unidade }) {
  const caixa = useRef<HTMLDialogElement>(null);
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const d = caixa.current;
    if (!d) return;

    const chave = `apresentacao-vista:${u.slug}`;
    let jaAbriu = false;
    try {
      jaAbriu = sessionStorage.getItem(chave) === 'sim';
    } catch {
      /* Aba anônima ou armazenamento bloqueado. Sem trava persistente,
         a variável acima ainda impede a reabertura nesta visita. */
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
      /* Trava a rolagem do fundo: sem isto a página corre atrás do
         modal e a pessoa perde o ponto onde estava. */
      document.body.style.overflow = 'hidden';
      window.gtag?.('event', 'abriu_apresentacao', { pagina: u.slug });
    }

    function aoFechar() {
      document.body.style.overflow = '';
      /* Para o vídeo ao fechar. Áudio tocando atrás de um modal fechado
         é o tipo de coisa que faz a pessoa procurar a aba culpada. */
      const v = video.current;
      if (v && !v.paused) v.pause();
    }

    /* O evento vem do HeroCinemaLocal, que é quem sabe onde a animação
       termina. Nome documentado nos dois lados. */
    window.addEventListener('cena-terminou', abrir as EventListener);
    d.addEventListener('close', aoFechar);

    /* Clique fora fecha. O `<dialog>` recebe o clique da própria camada
       de fundo, então comparar o alvo com ele mesmo basta. */
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

  return (
    <dialog
      ref={caixa}
      aria-labelledby="apresentacao-titulo"
      className="popup-apresentacao w-[min(46rem,92vw)] rounded-[var(--raio)] border border-fio bg-marinho-fundo p-0 text-branco backdrop:bg-[rgba(6,9,26,0.82)] backdrop:backdrop-blur-sm"
    >
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

        {a.video ? (
          <video
            ref={video}
            src={a.video}
            poster={a.poster}
            controls
            playsInline
            preload="metadata"
            className="mt-7 aspect-video w-full rounded-[var(--raio-p)] border border-fio bg-black"
          />
        ) : (
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
        )}

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
    </dialog>
  );
}
