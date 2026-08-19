import type { Metadata } from 'next';
import { Casca, TopoPagina, secao, canonical } from '@/componentes/Casca';
import { Botao } from '@/componentes/Botao';
import { IconeFrente } from '@/componentes/IconeFrente';
import { frentes, metodologia } from '@/conteudo/frentes';
import { linkWhatsapp } from '@/conteudo/navegacao';
import { urlAbsoluta, site } from '@/conteudo/site';

export const metadata: Metadata = {
  title: 'Diagnóstico gratuito de e-commerce',
  description:
    'Descubra onde a sua loja perde venda: checkout, prazo de entrega, aprovação de pagamento, cadastro de produto ou mídia. Diagnóstico gratuito e sem compromisso.',
  ...canonical('/diagnostico'),
  openGraph: { url: urlAbsoluta('/diagnostico'), type: 'website' },
};

export default function Diagnostico() {
  return (
    <Casca>
      <TopoPagina
        rotulo="Diagnóstico gratuito"
        titulo={<>Onde a sua loja está perdendo venda?</>}
        texto="A Psy Comunic olha as quatro frentes e devolve as prioridades por ordem de impacto no faturamento. É gratuito, não obriga a nada, e serve mesmo que você decida resolver sozinho."
        trilha={[]}
      />

      {/* O CTA vem cedo: quem chegou aqui já decidiu, e fazer essa pessoa
          rolar a página inteira para achar o botão custa conversão. */}
      <section className="pb-8">
        <div className={secao}>
          <div className="flex flex-wrap gap-4">
            <Botao href={linkWhatsapp} externo>
              Pedir meu diagnóstico no WhatsApp
            </Botao>
            <Botao href={`mailto:${site.contato.email}`} variante="secundario" externo>
              Prefiro por e-mail
            </Botao>
          </div>
          <p className="mt-5 font-mono text-[0.68rem] uppercase tracking-[0.16em] text-cinza">
            Sem custo · sem compromisso · resposta em até 24h úteis
          </p>
        </div>
      </section>

      {/* O que é analisado */}
      <section className="py-16 md:py-20">
        <div className={secao}>
          <p className="flex items-center gap-3 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-magenta-texto">
            <span aria-hidden className="h-px w-8 bg-magenta" />
            O que é analisado
          </p>
          <h2 className="mt-5 max-w-[22ch] font-display text-titulo font-extrabold tracking-[-0.035em]">
            As perguntas que o diagnóstico responde.
          </h2>
          <p className="mt-7 max-w-[62ch] text-guia text-neve">
            Na maioria das vezes o problema não está no anúncio: está no checkout, no
            prazo de entrega, na aprovação do pagamento ou no cadastro do produto. Por
            isso a análise cobre as quatro frentes, e não só a mídia.
          </p>

          <div className="mt-14 grid gap-6 lg:grid-cols-2">
            {frentes.map((f) => (
              <div key={f.slug} className="cartao p-8 md:p-9">
                <div className="flex items-center gap-4">
                  <IconeFrente slug={f.slug} className="h-7 w-7 text-magenta-texto" />
                  <h3 className="font-display text-xl font-bold tracking-[-0.02em]">
                    {f.nome}
                  </h3>
                </div>
                <ul className="mt-6 space-y-3 border-t border-fio pt-6">
                  {f.duvidas.map((d) => (
                    <li key={d} className="flex gap-3 leading-relaxed text-cinza">
                      <span aria-hidden className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-magenta" />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section className="border-y border-fio bg-marinho-fundo py-20 md:py-24">
        <div className={secao}>
          <h2 className="max-w-[22ch] font-display text-titulo font-extrabold tracking-[-0.035em]">
            Como funciona, na prática.
          </h2>
          <ol className="mt-12 grid gap-8 md:grid-cols-3">
            {metodologia.map((m, i) => (
              <li key={m.nome} className="border-t border-fio pt-7">
                <span className="tabular font-display text-3xl font-extrabold tracking-[-0.04em] text-magenta-texto">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-4 font-display text-xl font-bold tracking-[-0.02em]">
                  {m.nome}
                </h3>
                <p className="mt-3 leading-relaxed text-cinza">{m.texto}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA final */}
      <section className="relative isolate overflow-hidden bg-magenta py-20 md:py-24">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(120%_100%_at_15%_0%,rgba(255,255,255,0.22),transparent_55%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(200deg,transparent_35%,rgba(16,31,63,0.55))]" />
        </div>
        <div className={secao}>
          <h2 className="max-w-[18ch] font-display text-titulo font-extrabold tracking-[-0.04em] text-branco">
            Manda o link da sua loja que a gente olha.
          </h2>
          <p className="mt-6 max-w-[52ch] text-guia text-branco/90">
            Não precisa preparar nada nem montar planilha. O endereço da loja já basta
            para a primeira leitura.
          </p>
          <div className="mt-9">
            <Botao href={linkWhatsapp} variante="claro" externo>
              Começar pelo WhatsApp
            </Botao>
          </div>
        </div>
      </section>
    </Casca>
  );
}
