'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { linkWhatsapp } from '@/conteudo/navegacao';

/**
 * A barra fixa de ação, só no telefone.
 *
 * ============================================================
 * POR QUE SÓ NO TELEFONE
 * ============================================================
 * No computador a página cabe em poucas rolagens e o botão do
 * cabeçalho fica sempre à vista. No telefone a mesma página tem
 * dezenas de telas de altura: quem chega na metade e decide chamar
 * precisa rolar até o fim ou voltar ao topo, e é aí que desiste.
 *
 * ============================================================
 * POR QUE ELA NÃO APARECE DE CARA
 * ============================================================
 * A abertura já tem os dois botões, grandes. Uma barra por cima deles
 * cobriria a própria chamada que ela repete, e gastaria a parte da
 * tela que o visitante ainda não aprendeu a ignorar.
 *
 * Ela entra quando a ABERTURA TERMINA de passar, que é o momento em
 * que o botão do hero sai de vista. `top < 0` separa "saiu por cima"
 * de "ainda não chegou": sem isso ela apareceria no carregamento.
 *
 * ============================================================
 * ELA RESERVA O PRÓPRIO ESPAÇO
 * ============================================================
 * Barra fixa cobre o fim da página, e o rodapé tem link e telefone lá
 * embaixo. `--barra-acao` guarda a altura REAL e o `body` ganha esse
 * respiro no fim: medida, e não chutada, porque a altura muda com o
 * tamanho de fonte do aparelho.
 *
 * `env(safe-area-inset-bottom)` segura a barra acima do risco do
 * iPhone. Sem ele o dedo acerta o gesto do sistema, e não o botão.
 */
export function BarraDeAcao() {
  const [visivel, setVisivel] = useState(false);
  const caixa = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const abertura = document.querySelector('main > section');
    if (!abertura) return;

    const observador = new IntersectionObserver(
      ([e]) => setVisivel(!e.isIntersecting && e.boundingClientRect.top < 0),
      { threshold: 0 },
    );
    observador.observe(abertura);
    return () => observador.disconnect();
  }, []);

  useEffect(() => {
    const raiz = document.documentElement;
    const alvo = caixa.current;

    if (!alvo || !visivel) {
      raiz.style.setProperty('--barra-acao', '0px');
      return;
    }

    const publicar = () =>
      raiz.style.setProperty(
        '--barra-acao',
        `${Math.round(alvo.getBoundingClientRect().height)}px`,
      );

    publicar();
    const observador = new ResizeObserver(publicar);
    observador.observe(alvo);

    return () => {
      observador.disconnect();
      raiz.style.setProperty('--barra-acao', '0px');
    };
  }, [visivel]);

  return (
    <div
      ref={caixa}
      aria-hidden={!visivel}
      className={
        'fixed inset-x-0 bottom-0 z-50 border-t border-fio bg-papel/95 backdrop-blur-sm ' +
        'transition-transform duration-300 md:hidden ' +
        (visivel ? 'translate-y-0' : 'pointer-events-none translate-y-full')
      }
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <Link
          href="/diagnostico"
          tabIndex={visivel ? undefined : -1}
          className="flex h-12 flex-1 items-center justify-center rounded-full bg-rosa px-5 text-sm font-semibold text-branco"
        >
          Quero meu diagnóstico gratuito
        </Link>

        <a
          href={linkWhatsapp}
          target="_blank"
          rel="noopener"
          tabIndex={visivel ? undefined : -1}
          aria-label="Falar com a Psy Comunic no WhatsApp"
          className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-[#25D366]"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6 fill-white" aria-hidden>
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.174.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884a9.82 9.82 0 016.988 2.896 9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.359.101 11.945c0 2.096.549 4.14 1.595 5.945L0 24l6.335-1.652a11.882 11.882 0 005.71 1.454h.006c6.585 0 11.946-5.359 11.949-11.945a11.87 11.87 0 00-3.48-8.408" />
          </svg>
        </a>
      </div>
    </div>
  );
}
