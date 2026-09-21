import Image from 'next/image';
import { lojas } from '@/conteudo/trabalhos';

/**
 * Colunas de sites deslizando, umas para cima e outras para baixo.
 *
 * ============================================================
 * POR QUE NÃO É A PAREDE DE ANTES
 * ============================================================
 * Já houve aqui uma parede de doze prints ocupando a tela inteira atrás
 * do texto. Saiu por peso: no escuro, doze telas atrás do título
 * disputam a leitura, e escurecê-las até pararem de disputar as tornava
 * inúteis.
 *
 * Estas colunas ocupam um lado só. Os sites aparecem nítidos, do
 * tamanho de quem é assunto, e o texto tem a outra metade inteira para
 * ele. O movimento é o que faz alguém olhar; a nitidez é o que faz
 * valer a pena ter olhado.
 *
 * ============================================================
 * SEM JAVASCRIPT
 * ============================================================
 * É animação de CSS. Não há estado, observador nem ouvinte de rolagem,
 * então isto é componente de servidor e não custa um byte de bundle.
 * Sem script, as colunas ficam paradas mostrando os primeiros sites, e
 * nada some.
 *
 * ============================================================
 * A CONTA DO LAÇO
 * ============================================================
 * Cada coluna repete a própria lista duas vezes e desliza exatamente
 * metade da altura. Para "metade" ser mesmo metade, o espaçamento entre
 * cartões é `margin-bottom` de cada cartão, e não `gap` da lista: com
 * `gap`, oito cartões têm sete vãos, metade da altura cai no meio de um
 * vão e o laço salta a cada volta.
 *
 * E a lista é `flex`, o que não é decoração. Numa lista de bloco, a
 * margem de baixo do último cartão COLAPSA para fora do elemento: a
 * altura vira oito passos menos uma margem, e metade dela fica 6px
 * (no telefone) ou 8px (daí para cima) curta. Medido, era exatamente
 * isso. Um salto de 8px a cada volta é daqueles defeitos que ninguém
 * sabe nomear e todo mundo sente. Container flex não colapsa margem.
 */

/*
  DUAS COLUNAS DE QUATRO, e não três.

  Eram três colunas de quatro, com os doze trabalhos. Os quatro sites
  de serviço saíram da vitrine do site principal, e sobraram oito
  lojas: três colunas dariam uma coluna de dois, que em movimento
  aparece como buraco.

  Duas colunas também dão cartão MAIOR, que é o que esta abertura
  pede: quem chega precisa reconhecer uma loja de roupa em meio
  segundo, e num cartão de 100px não se reconhece nada.
*/
const COLUNAS = [
  { itens: lojas.slice(0, 4), sobe: true, duracao: 42 },
  { itens: lojas.slice(4, 8), sobe: false, duracao: 52 },
];

export function ColunasDeSites() {
  return (
    <div
      className="colunas-de-sites relative grid grid-cols-2 gap-3 sm:gap-4"
      style={{
        /* Esmaece as pontas. Sem isto o corte é uma linha reta e as
           colunas parecem três imagens cortadas, não um movimento
           contínuo. */
        maskImage:
          'linear-gradient(to bottom, transparent 0%, #fff 11%, #fff 89%, transparent 100%)',
        WebkitMaskImage:
          'linear-gradient(to bottom, transparent 0%, #fff 11%, #fff 89%, transparent 100%)',
      }}
    >
      {COLUNAS.map((coluna, c) => (
        <div
          key={coluna.itens[0].arquivo}
          className={
            'h-[380px] overflow-hidden sm:h-[460px] lg:h-[470px] ' +
            (c === 2 ? 'hidden sm:block ' : '') +
            /* A do meio começa deslocada. Três colunas alinhadas na
               mesma linha leem como uma que anda, e não como três
               colunas independentes. */
            (c === 1 ? 'sm:-mt-8' : '')
          }
        >
          <ul
            className={'flex flex-col ' + (coluna.sobe ? 'trilha-sobe' : 'trilha-desce')}
            style={{ animationDuration: `${coluna.duracao}s` }}
          >
            {[...coluna.itens, ...coluna.itens].map((t, i) => (
              <li
                key={`${t.arquivo}-${i}`}
                className="relative mb-3 aspect-[4/3] overflow-hidden rounded-xl border border-fio bg-papel-alt sm:mb-4"
              >
                <Image
                  src={`/imagens/sites/${t.arquivo}`}
                  alt={
                    /* A segunda volta da lista é a mesma coisa de novo.
                       Anunciar doze nomes vinte e quatro vezes é ruído
                       para quem usa leitor de tela. */
                    i < coluna.itens.length
                      ? `Site ${t.nome}, criado pela Psy Comunic`
                      : ''
                  }
                  aria-hidden={i >= coluna.itens.length}
                  width={t.largura}
                  height={t.altura}
                  sizes="(max-width: 640px) 44vw, (max-width: 1024px) 38vw, 22vw"
                  priority={c === 0 && i < 2}
                  /* Havia uma terceira coluna, escondida abaixo de
                     `sm`, e ela era `lazy` para o navegador não buscar
                     o que estava fora da tela. Com duas colunas, as
                     duas aparecem em toda largura: `lazy` aqui só
                     atrasaria o que já está visível. */
                  loading={c === 0 && i < 2 ? undefined : 'eager'}
                  className="absolute inset-0 h-full w-full object-cover object-top"
                />
              </li>
            ))}
          </ul>
        </div>
      ))}

      <style>{`
        .colunas-de-sites .trilha-sobe,
        .colunas-de-sites .trilha-desce {
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          will-change: transform;
        }
        .colunas-de-sites .trilha-sobe { animation-name: trilhaSobe; }
        .colunas-de-sites .trilha-desce { animation-name: trilhaDesce; }

        @keyframes trilhaSobe {
          from { transform: translateY(0); }
          to   { transform: translateY(-50%); }
        }
        @keyframes trilhaDesce {
          from { transform: translateY(-50%); }
          to   { transform: translateY(0); }
        }

        /* Quem pediu menos movimento vê as colunas paradas, e continua
           vendo os sites. */
        @media (prefers-reduced-motion: reduce) {
          .colunas-de-sites .trilha-sobe,
          .colunas-de-sites .trilha-desce { animation: none; }
        }
      `}</style>
    </div>
  );
}
