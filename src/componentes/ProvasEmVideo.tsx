import fs from 'node:fs';
import path from 'node:path';
import { provasEmVideo } from '@/conteudo/prova';

/**
 * Os depoimentos em vídeo vertical, logo abaixo dos números.
 *
 * ============================================================
 * CONFERE NO DISCO, E NÃO NA INTENÇÃO
 * ============================================================
 * Componente de servidor: no build ele olha `public/video/` e mantém
 * só os arquivos que existem de verdade. Nenhum existindo, devolve
 * `null` e a seção some da página.
 *
 * O que isso evita: três molduras pretas com "em breve" na segunda
 * dobra de um site que está pedindo contato. Espaço reservado é útil
 * para quem edita e péssimo para quem visita.
 *
 * Quando os arquivos chegarem, a seção aparece sozinha no próximo
 * deploy, sem mexer em código.
 */
const existe = (arquivo: string) =>
  fs.existsSync(path.join(process.cwd(), 'public', 'video', arquivo));

export function ProvasEmVideo({ className = '' }: { className?: string }) {
  const provas = provasEmVideo.filter((p) => existe(p.arquivo));
  if (provas.length === 0) return null;

  return (
    <section aria-labelledby="provas-titulo" className={'secao-ar ' + className}>
      <div className="mx-auto w-full max-w-[1180px] px-5 md:px-10">
        <div className="max-w-[52ch]">
          <p className="text-[13px] font-semibold text-acento">Quem já passou por aqui</p>
          <h2
            id="provas-titulo"
            className="mt-5 font-display text-titulo titulo-revista"
          >
            Elas contam melhor do que a gente.
          </h2>
        </div>

        {/*
          Três em fileira no computador, e uma ao lado da outra com
          rolagem lateral no telefone: empilhar três vídeos de 9:16 num
          celular daria uma coluna de três telas de altura, e ninguém
          desce isso.
        */}
        <ul
          className="mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 md:mt-16
                     md:grid md:grid-cols-3 md:gap-8 md:overflow-visible md:pb-0"
        >
          {provas.map((p) => (
            <li key={p.arquivo} className="w-[72vw] flex-none snap-start sm:w-[48vw] md:w-auto">
              <video
                /* `controls` e nada de autoplay: são três vídeos de
                   depoimento, e três reproduções automáticas ao mesmo
                   tempo brigam entre si e gastam dado de quem está no
                   celular. Quem quiser ouvir, toca. */
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
