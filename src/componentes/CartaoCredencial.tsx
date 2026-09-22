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
  const selos = 'selos' in item ? item.selos : null;

  return (
    <div
      className={
        'cartao relative flex gap-6 overflow-hidden p-7 transition-colors duration-500 hover:border-rosa/40 md:p-9 ' +
        className
      }
      data-inclina
    >
      <span className="tabular relative shrink-0 text-sm font-semibold text-rosa">
        {item.i}
      </span>

      <div className="relative min-w-0">
        <p className="font-display text-xl font-bold tracking-[-0.02em] md:text-2xl text-branco">
          {item.t}
        </p>
        <p className="mt-3 max-w-[56ch] leading-relaxed text-branco/60">{item.d}</p>

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
    <ul className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-white/10 pt-5">
      <li className="text-[0.65rem] font-semibold uppercase tracking-widest text-branco/40">
        Onde ele construiu
      </li>
      {selos.map((s) =>
        s.arquivo ? (
          <li key={s.nome} className="flex items-center">
            <span
              role="img"
              aria-label={s.nome}
              className="block h-[22px] bg-branco"
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
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[0.72rem] font-semibold text-branco/80"
          >
            {s.nome}
          </li>
        ),
      )}
    </ul>
  );
}
