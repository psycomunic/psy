import type { Metadata } from 'next';
import { Casca, TopoPagina, ChamadaFinal, secao, canonical } from '@/componentes/Casca';
import { metodologia, entregas } from '@/conteudo/frentes';
import { urlAbsoluta } from '@/conteudo/site';

export const metadata: Metadata = {
  title: 'Como trabalhamos: método e entregas',
  description:
    'Briefing e diagnóstico, checklist operacional e acompanhamento mensal. Veja o que a Psy Comunic entrega em cada etapa, do kick off ao relatório mensal.',
  ...canonical('/como-trabalhamos'),
  openGraph: { url: urlAbsoluta('/como-trabalhamos'), type: 'website' },
};

export default function ComoTrabalhamos() {
  return (
    <Casca>
      <TopoPagina
        rotulo="Como trabalhamos"
        titulo={<>Três processos. Zero achismo.</>}
        texto="Nada aqui começa por chute de campanha. Começa por entender onde a operação perde dinheiro hoje, e a ordem das tarefas sai daí."
        trilha={[]}
      />

      {/* Metodologia */}
      <section className="py-12 md:py-16">
        <div className={secao}>
          <ol className="relative grid gap-10 md:grid-cols-3 md:gap-8">
            <span
              aria-hidden
              className="absolute left-0 right-0 top-[1.1rem] hidden h-px bg-gradient-to-r from-magenta/60 via-fio to-transparent md:block"
            />
            {metodologia.map((m, i) => (
              <li key={m.nome} className="relative">
                <span className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full border border-magenta/50 bg-marinho font-mono text-xs text-magenta-texto">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h2 className="mt-7 font-display text-xl font-bold tracking-[-0.02em]">
                  {m.nome}
                </h2>
                <p className="mt-3 max-w-[38ch] leading-relaxed text-cinza">{m.texto}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Mapa de entregas do onboarding */}
      <section className="border-y border-fio bg-marinho-fundo py-20 md:py-28">
        <div className={secao}>
          <p className="flex items-center gap-3 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-magenta-texto">
            <span aria-hidden className="h-px w-8 bg-magenta" />
            O que chega, e quando
          </p>
          <h2 className="mt-5 max-w-[20ch] font-display text-titulo font-extrabold tracking-[-0.035em]">
            Do kick off ao ciclo que se repete.
          </h2>
          <p className="mt-7 max-w-[62ch] text-guia text-neve">
            Oito entregas, na ordem em que acontecem. É o mapa que o cliente recebe no
            primeiro dia, para saber o que esperar de cada semana em vez de perguntar.
          </p>

          <ol className="mt-14 grid gap-5 md:grid-cols-2">
            {entregas.map((e, i) => (
              <li key={e.nome} className="cartao flex gap-6 p-7 md:p-8">
                <span className="tabular shrink-0 font-mono text-xs text-magenta-texto">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="min-w-0">
                  <h3 className="font-display text-lg font-bold tracking-[-0.02em] md:text-xl">
                    {e.nome}
                  </h3>
                  <p className="mt-2.5 max-w-[52ch] leading-relaxed text-cinza">{e.texto}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <ChamadaFinal
        titulo="O primeiro passo é o diagnóstico."
        texto="Ele é gratuito e não obriga a nada. Serve para você saber onde está perdendo dinheiro, mesmo que decida resolver sozinho."
      />
    </Casca>
  );
}
