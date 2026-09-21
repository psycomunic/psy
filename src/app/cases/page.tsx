import type { Metadata } from 'next';
import { Casca, TopoPagina, ChamadaFinal, secao, canonical } from '@/componentes/Casca';
import { Vitrine } from '@/componentes/Vitrine';
import { lojas } from '@/conteudo/trabalhos';
import { marcasAtendidas, cases } from '@/conteudo/prova';
import { urlAbsoluta } from '@/conteudo/site';

export const metadata: Metadata = {
  title: 'Trabalhos: lojas que construímos',
  description:
    'Portfólio de e-commerces, landing pages e sites institucionais construídos pela Psy Comunic. Percorra cada projeto por inteiro, do topo ao rodapé.',
  ...canonical('/cases'),
  openGraph: { url: urlAbsoluta('/cases'), type: 'website' },
};

export default function Cases() {
  return (
    <Casca>
      <TopoPagina
        rotulo="Trabalhos"
        titulo={<>Lojas que a Psy Comunic construiu.</>}
        texto="Passe o cursor em qualquer projeto para percorrer a página inteira, do topo ao rodapé. No celular, um toque rola e outro devolve."
        trilha={[]}
      />

      <section className="py-12 md:py-16">
        <div className={secao}>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {lojas.map((t) => (
              <Vitrine key={t.arquivo} trabalho={t} />
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-fio bg-papel-alt py-20 md:py-24">
        <div className={secao}>
          <p className="flex items-center gap-3 text-[0.7rem] text-acento">
            <span aria-hidden className="h-px w-8 bg-rosa" />
            Marcas atendidas
          </p>
          <h2 className="mt-5 max-w-[20ch] font-display text-titulo titulo-revista">
            Algumas das muitas marcas que já confiaram a operação.
          </h2>

          <ul className="mt-10 flex flex-wrap gap-3">
            {marcasAtendidas.map((m) => (
              <li
                key={m}
                className="rounded-full border border-fio px-5 py-2.5 text-[0.72rem] text-tinta-fraca"
              >
                {m}
              </li>
            ))}
          </ul>

          {cases.length === 0 ? (
            <p className="mt-12 max-w-[64ch] leading-relaxed text-tinta">
              Os estudos de caso, com métrica, período e base de comparação, entram aqui
              assim que as autorizações de uso de resultado estiverem assinadas. A Psy
              Comunic não publica número de cliente sem autorização escrita e sem período
              declarado.
            </p>
          ) : null}
        </div>
      </section>

      <ChamadaFinal titulo="Quer que a sua loja seja o próximo?" />
    </Casca>
  );
}
