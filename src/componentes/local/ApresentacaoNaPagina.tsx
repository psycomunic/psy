'use client';

import { useCallback, useRef, useState, useSyncExternalStore } from 'react';
import { LinkWhatsapp } from './LinkWhatsapp';
import { linkDaUnidade, type Unidade } from '@/conteudo/braganca';

/**
 * O mesmo vídeo da apresentação, agora dentro da página.
 *
 * ============================================================
 * POR QUE ELE SÓ APARECE DEPOIS
 * ============================================================
 * Quem ainda não viu o popup não precisa de um segundo convite para o
 * mesmo vídeo: veria a mesma peça duas vezes na mesma tela, e a que
 * importa é a que toma a tela inteira.
 *
 * Depois do popup a situação se inverte. O vídeo já foi visto, ou
 * fechado, e some para sempre: quem quiser rever não tem para onde
 * voltar, e a única saída é recarregar a página numa aba anônima. É
 * essa porta que esta seção abre.
 *
 * ============================================================
 * POR QUE LOGO ABAIXO DA ABERTURA
 * ============================================================
 * É onde a pessoa está quando o popup fecha. O popup abre no fim da
 * cena, então ao fechá-lo a rolagem está no fim da abertura, e a seção
 * cai no primeiro lugar para onde a vista vai.
 *
 * ============================================================
 * COMO ELA SABE QUE JÁ FOI VISTO
 * ============================================================
 * Pela mesma chave de `sessionStorage` que o popup usa para não
 * reabrir, mais um evento para o caso de a pessoa ainda estar na mesma
 * pintura. Duas fontes porque elas respondem coisas diferentes: o
 * evento cobre AGORA, e a chave cobre a rolagem de volta e o recarregar
 * da página.
 *
 * ============================================================
 * SEM ARQUIVO, NÃO EXISTE
 * ============================================================
 * Enquanto `apresentacao.video` for vazio, este componente não pinta
 * nada. O popup, nesse caso, mostra os tópicos em texto, e uma segunda
 * cópia da mesma lista no meio da página não ajudaria ninguém.
 */
/*
  Quem já viu, nesta pintura.

  ============================================================
  POR QUE ISTO EXISTE, ALÉM DO sessionStorage
  ============================================================
  Foi um defeito de verdade, pego medindo: o evento sozinho não
  revelava a seção. Ele mandava o React reler o estado, e o estado era
  só a chave do `sessionStorage`. Com a chave ausente, reler devolvia
  "não" de novo, e o evento virava um aviso sobre nada.

  Acontece em aba anônima e com armazenamento bloqueado, que é
  exatamente o caso que o evento devia cobrir.

  Um `Set` no módulo, e não `useState`: `getSnapshot` é chamado durante
  o render e precisa de uma fonte que já esteja atualizada quando o
  React pergunta. Por slug, porque `Unidade` é um molde e amanhã pode
  haver outra cidade na mesma sessão.
*/
const vistosNestaPintura = new Set<string>();

export function ApresentacaoNaPagina({ u }: { u: Unidade }) {
  const video = useRef<HTMLVideoElement>(null);
  const [tocou, setTocou] = useState(false);

  const a = u.apresentacao;
  const temVideo = Boolean(a.video);

  /*
    `useSyncExternalStore`, e não estado com efeito.

    O que decide se esta seção existe mora FORA do React: uma chave de
    `sessionStorage` e um evento na janela. Ler isso num efeito e chamar
    `setState` pinta a tela uma vez sem a seção e outra com ela, e é
    exatamente o que a regra `set-state-in-effect` existe para impedir.

    Aqui o React pergunta o valor quando precisa. O terceiro argumento é
    a resposta do SERVIDOR, onde não existe `sessionStorage`: `false`,
    que é o que o HTML precisa dizer para não divergir da hidratação.
  */
  const assinar = useCallback(
    (aoMudar: () => void) => {
      const revelar = () => {
        /* Anota ANTES de avisar: o React vai reler no mesmo instante. */
        vistosNestaPintura.add(u.slug);
        aoMudar();
      };
      window.addEventListener('apresentacao-vista', revelar);
      return () => window.removeEventListener('apresentacao-vista', revelar);
    },
    [u.slug],
  );

  const jaViu = useCallback(() => {
    if (vistosNestaPintura.has(u.slug)) return true;
    try {
      return sessionStorage.getItem(`apresentacao-vista:${u.slug}`) === 'sim';
    } catch {
      /* Aba anônima ou armazenamento bloqueado. Sobra o `Set` acima,
         que cobre a visita em andamento. */
      return false;
    }
  }, [u.slug]);

  const visivel = useSyncExternalStore(assinar, jaViu, () => false);

  if (!temVideo || !visivel) return null;

  function tocar() {
    const v = video.current;
    if (!v) return;
    v.muted = false;
    v.play().catch(() => {});
    setTocou(true);
    window.gtag?.('event', 'play_apresentacao', { pagina: u.slug, local: 'pagina' });
  }

  return (
    <section
      aria-labelledby="rever-apresentacao"
      /* `animate-[surgir]` não: a seção nasce já no lugar e só clareia.
         Ela aparece DEPOIS de a pessoa fechar o popup, muitas vezes
         fora da vista, e um deslocamento aqui empurraria o que ela
         estivesse lendo. */
      className="clarear mx-auto w-full max-w-[var(--largura)] px-5 py-14 md:px-8 md:py-16"
    >
      <div className="grid items-center gap-8 md:grid-cols-[1.1fr_1fr] md:gap-12">
        <div className="relative overflow-hidden rounded-[var(--raio)] border border-fio bg-black">
          <video
            ref={video}
            src={a.video}
            poster={a.poster}
            playsInline
            controls={tocou}
            preload="metadata"
            className="aspect-video w-full"
          />

          {tocou ? null : (
            <button
              type="button"
              onClick={tocar}
              aria-label="Assistir à apresentação de novo"
              className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[rgba(6,9,26,0.4)] transition-colors hover:bg-[rgba(6,9,26,0.25)]"
            >
              <span
                aria-hidden
                className="flex h-[64px] w-[64px] items-center justify-center rounded-full bg-magenta pl-1.5 text-2xl text-branco shadow-[0_10px_40px_-8px_rgba(228,21,95,0.9)]"
              >
                ▶
              </span>
              <span className="rounded-full bg-marinho-fundo/90 px-5 py-2 text-sm font-semibold">
                Assistir de novo
              </span>
            </button>
          )}
        </div>

        <div>
          <p className="flex items-center gap-3 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-magenta-texto">
            <span aria-hidden className="h-px w-8 bg-magenta" />
            A apresentação
          </p>

          <h2
            id="rever-apresentacao"
            className="mt-5 max-w-[22ch] font-display text-2xl font-extrabold tracking-[-0.03em] md:text-3xl"
          >
            {a.titulo}
          </h2>

          <p className="mt-4 max-w-[52ch] leading-relaxed text-cinza">{a.texto}</p>

          <LinkWhatsapp
            href={linkDaUnidade(u, a.mensagem)}
            pagina={u.slug}
            secao="apresentacao-pagina"
            className="mt-7 inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-full bg-magenta px-7 text-sm font-semibold tracking-wide text-branco transition-all duration-300 hover:-translate-y-0.5 hover:bg-magenta-forte"
          >
            {a.acao}
            <span aria-hidden>→</span>
          </LinkWhatsapp>
        </div>
      </div>
    </section>
  );
}
