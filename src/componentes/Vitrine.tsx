'use client';

import Image from 'next/image';
import { useState } from 'react';
import type { Trabalho } from '@/conteudo/trabalhos';
import { duracaoRolagem } from '@/conteudo/trabalhos';

/**
 * Janela de portfólio: mostra o topo do site e percorre a página
 * inteira quando o cursor entra.
 *
 * Os prints têm até 4000px de altura. Encolher isso num card daria uma
 * tira ilegível; cortar no topo mostraria só o cabeçalho. A janela
 * resolve os dois: o card tem altura fixa e a imagem desliza dentro
 * dele.
 *
 * A rolagem é `transform: translateY`, e não `background-position` nem
 * `top`: transform anima na GPU e não força recálculo de layout a cada
 * quadro. Com doze imagens grandes na mesma tela, isso é a diferença
 * entre suave e travado.
 *
 * `calc(-100% + var(--janela))` sobe a imagem inteira e devolve a
 * altura da janela, parando exatamente no rodapé do site. A conta é em
 * porcentagem da PRÓPRIA imagem, então serve para qualquer altura sem
 * um número mágico por item.
 */
export function Vitrine({ trabalho }: { trabalho: Trabalho }) {
  /* Toque não tem hover. Sem isto, no celular o card mostraria só o
     topo do site para sempre. Um toque rola, outro devolve. */
  const [aberto, setAberto] = useState(false);

  return (
    <figure
      onClick={() => setAberto((v) => !v)}
      className="revelar cartao group relative overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:border-magenta/40"
      style={{
        // Altura da janela. Entra como variável porque o CSS da rolagem
        // precisa dela na conta, e repetir o número quebraria os dois
        // assim que um mudasse.
        ['--janela' as string]: '22rem',
        ['--dur' as string]: duracaoRolagem(trabalho),
      }}
    >
      <div
        className="relative w-full overflow-hidden"
        style={{ height: 'var(--janela)' }}
      >
        <Image
          src={`/imagens/sites/${trabalho.arquivo}`}
          alt={`Site ${trabalho.nome}, criado pela Psy Comunic`}
          width={trabalho.largura}
          height={trabalho.altura}
          sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 30vw"
          data-aberto={aberto ? 'sim' : undefined}
          className="vitrine-tira w-full"
        />

        {/* Esmaece a base para o corte não virar uma linha reta dura. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-marinho-fundo to-transparent"
        />
      </div>

      <figcaption className="flex items-center justify-between gap-4 border-t border-fio px-6 py-5">
        <span className="font-display font-bold tracking-[-0.02em]">{trabalho.nome}</span>
        <span className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-cinza">
          {/* Instrução muda conforme o aparelho: dizer "passe o cursor"
              num celular é dar uma ordem impossível. */}
          <span className="hidden md:inline">Passe o cursor</span>
          <span className="md:hidden">{aberto ? 'Toque para voltar' : 'Toque para rolar'}</span>
        </span>
      </figcaption>
    </figure>
  );
}
