import fs from 'node:fs';
import path from 'node:path';
import { provasEmVideo } from '@/conteudo/prova';

/**
 * Os depoimentos em vídeo vertical, logo abaixo dos números.
 *
 * ============================================================
 * O ESPAÇO APARECE ANTES DO VÍDEO, E É UMA ESCOLHA
 * ============================================================
 * A primeira versão escondia a seção inteira enquanto não houvesse
 * arquivo, pela mesma regra de `cases`: moldura vazia num site
 * comercial é promessa não cumprida à vista de quem decide.
 *
 * O espaço ficou visível a pedido, para dar de ver o layout antes de
 * gravar. Então ele foi desenhado para NÃO parecer vídeo quebrado:
 * borda tracejada, ícone de contorno e o formato escrito. Lê-se como
 * lugar reservado, e não como player que falhou.
 *
 * ATENÇÃO: isto está no ar. Enquanto os arquivos não chegarem, quem
 * visita a página vê três espaços vazios.
 *
 * Componente de SERVIDOR: confere no disco quais arquivos existem em
 * `public/video/`. Cada espaço vira vídeo sozinho quando o seu
 * arquivo aparece, sem mexer em código. Bastando os três chegarem, a
 * seção fica só de vídeo.
 */
const existe = (arquivo: string) =>
  fs.existsSync(path.join(process.cwd(), 'public', 'video', arquivo));

export function ProvasEmVideo({ className = '' }: { className?: string }) {
  const provas = provasEmVideo.map((p) => ({ ...p, pronto: existe(p.arquivo) }));
  const quantos = provas.filter((p) => p.pronto).length;

  return (
    <section aria-labelledby="provas-titulo" className={'secao-ar ' + className}>
      <div className="mx-auto w-full max-w-[1180px] px-5 md:px-10">
        <header>
          <div className="flex items-baseline justify-between gap-6 border-t border-fio pt-4">
            <p className="text-[13px] font-semibold text-acento">Quem já passou por aqui</p>
            <p className="tabular font-display text-[13px] font-bold text-tinta-fraca">02</p>
          </div>

          <div className="mt-8 grid gap-x-16 gap-y-6 md:mt-10 lg:grid-cols-[1.15fr_1fr] lg:items-end">
            <h2 id="provas-titulo" className="font-display text-titulo titulo-revista">
              Elas contam melhor do que a gente.
            </h2>
            <p className="max-w-[52ch] leading-relaxed text-tinta-fraca lg:pb-2">
              Quem já vendeu com a Psy Comunic falando do que mudou na operação, sem
              roteiro e sem número que a gente não possa mostrar de onde veio.
            </p>
          </div>
        </header>

        {/*
          Três em fileira no computador, e uma ao lado da outra com
          rolagem lateral no telefone: empilhar três vídeos de 9:16
          num celular daria uma coluna de três telas de altura, e
          ninguém desce isso.
        */}
        <ul
          className="mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 md:mt-16
                     md:grid md:grid-cols-3 md:gap-8 md:overflow-visible md:pb-0"
        >
          {provas.map((p, i) => (
            <li key={p.arquivo} className="w-[72vw] flex-none snap-start sm:w-[48vw] md:w-auto">
              {p.pronto ? (
                <video
                  /* `controls` e nada de autoplay: são três depoimentos,
                     e três reproduções automáticas ao mesmo tempo brigam
                     entre si e gastam dado de quem está no celular. */
                  controls
                  playsInline
                  preload="metadata"
                  poster={p.poster ? `/imagens/${p.poster}` : undefined}
                  className="aspect-[9/16] w-full rounded-[var(--raio)] border border-fio bg-marinho object-cover"
                >
                  <source src={`/video/${p.arquivo}`} type="video/mp4" />
                </video>
              ) : (
                <div
                  className="grid aspect-[9/16] w-full place-items-center rounded-[var(--raio)]
                             border border-dashed border-fio bg-papel-alt text-center"
                >
                  <div className="px-6">
                    <span
                      aria-hidden
                      className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-fio text-acento"
                    >
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                        <path d="M8 5.5v13l11-6.5-11-6.5Z" />
                      </svg>
                    </span>
                    <p className="mt-5 font-semibold">Depoimento {i + 1}</p>
                    <p className="mt-1.5 text-sm text-tinta-fraca">
                      Espaço reservado · vídeo em 1080x1920
                    </p>
                  </div>
                </div>
              )}

              {p.quem ? (
                <div className="mt-4">
                  <p className="font-semibold">{p.quem}</p>
                  {p.sobre ? (
                    <p className="mt-1 text-sm leading-relaxed text-tinta-fraca">{p.sobre}</p>
                  ) : null}
                </div>
              ) : null}
            </li>
          ))}
        </ul>

        {quantos === 0 ? (
          /* Só para quem edita: o leitor de tela não anuncia, e o
             visitante já entende pelo espaço tracejado. */
          <p className="sr-only">
            Os depoimentos em vídeo entram assim que forem gravados.
          </p>
        ) : null}
      </div>
    </section>
  );
}
