import fs from 'node:fs';
import path from 'node:path';
import { provasEmVideo } from '@/conteudo/prova';

/**
 * Os depoimentos em vídeo vertical, logo abaixo dos números.
 *
 * ============================================================
 * A SEÇÃO SÓ EXISTE QUANDO O VÍDEO EXISTE
 * ============================================================
 * Ela chegou a mostrar três espaços reservados, com borda tracejada
 * e o formato escrito, para dar de ver o layout antes de gravar.
 * Saíram: serviram para aprovar o desenho e, a partir daí, eram três
 * caixas vazias na segunda dobra de um site que está pedindo
 * contato.
 *
 * Vale a mesma regra de `cases`, logo acima: moldura vazia num site
 * comercial não é espaço reservado, é promessa não cumprida à vista
 * de quem está decidindo.
 *
 * Componente de SERVIDOR: confere no disco quais arquivos existem em
 * `public/video/` e renderiza só esses. Nenhum existindo, devolve
 * `null` e a seção some da página.
 *
 * PARA ELA VOLTAR não se mexe em código: basta largar prova-1.mp4,
 * prova-2.mp4 e prova-3.mp4 em `public/video/`. Quem chegar primeiro
 * já traz a seção junto.
 */
const existe = (arquivo: string) =>
  fs.existsSync(path.join(process.cwd(), 'public', 'video', arquivo));

export function ProvasEmVideo({ className = '' }: { className?: string }) {
  const provas = provasEmVideo.filter((p) => existe(p.arquivo));
  if (provas.length === 0) return null;

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
          {provas.map((p) => (
            <li key={p.arquivo} className="w-[72vw] flex-none snap-start sm:w-[48vw] md:w-auto">
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

      </div>
    </section>
  );
}
