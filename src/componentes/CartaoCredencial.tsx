import Image from 'next/image';
import type { credenciais } from '@/conteudo/marca';

/**
 * Um cartão da lista "quem está por trás".
 *
 * ============================================================
 * ESTAVA ESCRITO DUAS VEZES
 * ============================================================
 * A mesma marcação vivia em `page.tsx` e em `sobre/page.tsx`. O TEXTO
 * já tinha saído de lá para `marca.ts` justamente por isso, mas a
 * marcação continuou duplicada, e foi ela que cobrou o preço: os selos
 * do G4 e da Boca Rosa teriam que ser escritos duas vezes, e a segunda
 * cópia é a que alguém esquece de atualizar.
 */
type Credencial = (typeof credenciais)[number];

export function CartaoCredencial({
  item,
  className = '',
}: {
  item: Credencial;
  className?: string;
}) {
  const bg = 'bg' in item ? item.bg : null;
  const selos = 'selos' in item ? item.selos : null;

  return (
    <div
      className={
        'cartao relative flex gap-6 overflow-hidden p-7 transition-colors duration-500 hover:border-rosa/35 md:p-9 ' +
        className
      }
      data-inclina
    >
      {bg ? (
        <>
          {/* A foto do evento, de fundo. `opacity` baixa e um degradê
              por cima: sem isso o verde claro da parede de plantas sobe
              atrás do texto cinza e o contraste cai abaixo do legível.
              O número exato saiu de medição, não de gosto. */}
          <Image
            src={bg}
            alt=""
            fill
            sizes="(max-width: 768px) 92vw, 620px"
            className="pointer-events-none absolute inset-0 object-cover object-center opacity-[0.42]"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(100deg,var(--bg)_18%,color-mix(in_oklab,var(--bg)_90%,transparent)_55%,color-mix(in_oklab,var(--bg)_72%,transparent)_100%)]"
          />
        </>
      ) : null}

      <span className="tabular relative shrink-0 text-xs text-acento">
        {item.i}
      </span>

      <div className="relative min-w-0">
        <p className="font-display text-xl font-bold tracking-[-0.02em] md:text-2xl">
          {item.t}
        </p>
        <p className="mt-3 max-w-[56ch] leading-relaxed text-tinta-fraca">{item.d}</p>

        {selos ? <FileiraDeSelos selos={selos} /> : null}
      </div>
    </div>
  );
}

/**
 * As marcas que dão peso ao nome, em silhueta pequena.
 *
 * A silhueta vem de `mask-image` e não de `<img>`: o arquivo original
 * é cinza #707372, que sobre o marinho fica abaixo de 3:1 e parece
 * sujeira. A máscara joga fora a cor do arquivo e usa só o recorte,
 * então o selo acompanha a paleta do cartão.
 *
 * Sem arquivo, entra o NOME escrito. Nunca uma moldura vazia: máscara
 * que não carrega leva o elemento inteiro junto, e some sem avisar.
 */
function FileiraDeSelos({
  selos,
}: {
  selos: readonly { nome: string; arquivo: string | null; largura?: number; altura?: number }[];
}) {
  return (
    <ul className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-fio pt-5">
      <li className="text-[0.6rem] text-tinta-fraca">
        Onde ela construiu
      </li>
      {selos.map((s) =>
        s.arquivo ? (
          <li key={s.nome} className="flex items-center">
            <span
              role="img"
              aria-label={s.nome}
              /* 22px, e não 15. Medido: a 15px o logotipo rendia 338
                 pixels de letra em 15930, contra 0 do controle sem
                 máscara. Pintava, e mesmo assim era um borrão: o
                 traço da fonte fica abaixo de um pixel. */
              className="block h-[22px] bg-tinta"
              style={{
                width: `${((s.largura ?? 100) / (s.altura ?? 100)) * 22}px`,
                WebkitMaskImage: `url(${s.arquivo})`,
                maskImage: `url(${s.arquivo})`,
                WebkitMaskSize: 'contain',
                maskSize: 'contain',
                WebkitMaskRepeat: 'no-repeat',
                maskRepeat: 'no-repeat',
                WebkitMaskPosition: 'center',
                maskPosition: 'center',
              }}
            />
          </li>
        ) : (
          <li
            key={s.nome}
            className="rounded-full border border-fio px-3 py-1 text-[0.72rem] font-semibold text-tinta"
          >
            {s.nome}
          </li>
        ),
      )}
    </ul>
  );
}
