import type { Metadata } from 'next';
import Link from 'next/link';
import { Casca, TopoPagina, secao, canonical } from '@/componentes/Casca';
import { site } from '@/conteudo/site';
import { marca } from '@/conteudo/marca';

export const metadata: Metadata = {
  title: 'Termos de uso',
  description:
    'Condições de uso do site da Psy Comunic: propriedade do conteúdo, limites de responsabilidade e natureza das informações publicadas.',
  ...canonical('/termos-de-uso'),
};

/*
  PENDÊNCIA JURÍDICA, igual à política de privacidade: base honesta do
  que o site é hoje, faltando razão social, CNPJ, endereço e revisão de
  advogado.
*/

const secoes = [
  {
    t: 'Aceitação',
    p: [
      `Ao navegar neste site você concorda com estes termos. Se não concordar, o caminho é não utilizá-lo.`,
    ],
  },
  {
    t: 'O que este site é',
    p: [
      `Este site apresenta os serviços da ${marca.nome} e serve de canal de contato comercial. Ele não é loja: não há venda, pagamento nem cadastro por aqui.`,
    ],
  },
  {
    t: 'Conteúdo e propriedade intelectual',
    p: [
      `Textos, imagens, marca, layout e código deste site pertencem à ${marca.nome} ou foram licenciados para uso dela. Reprodução sem autorização escrita não é permitida.`,
      'Logotipos e imagens de clientes aparecem para identificar trabalhos realizados, e continuam pertencendo às respectivas empresas.',
    ],
  },
  {
    t: 'Trabalhos apresentados',
    p: [
      'As imagens da seção de trabalhos são registros de páginas efetivamente construídas pela Psy Comunic. Elas mostram o que foi entregue, e não prometem resultado igual para outro projeto.',
      'Estudos de caso com número, período e base de comparação só são publicados mediante autorização escrita do cliente.',
    ],
  },
  {
    t: 'Natureza das informações',
    p: [
      'O conteúdo tem caráter informativo. Nenhuma página deste site constitui proposta comercial vinculante nem garantia de resultado.',
      'Condições, prazos e valores valem apenas quando formalizados em proposta e contrato assinados.',
    ],
  },
  {
    t: 'Links para outros sites',
    p: [
      'O site aponta para plataformas de terceiros, como WhatsApp e Instagram. O conteúdo e a política de privacidade desses serviços são responsabilidade de quem os opera.',
    ],
  },
  {
    t: 'Disponibilidade',
    p: [
      'O site pode ficar indisponível para manutenção ou por falha de infraestrutura de terceiros. Não há garantia de disponibilidade ininterrupta.',
    ],
  },
  {
    t: 'Foro e legislação',
    p: [
      'Estes termos são regidos pela legislação brasileira. Foro a definir junto com razão social, CNPJ e endereço.',
    ],
  },
];

export default function Termos() {
  return (
    <Casca>
      <TopoPagina
        rotulo="Legal"
        titulo={<>Termos de uso</>}
        texto="As condições de uso deste site, o que o conteúdo publicado significa e o que ele não significa."
        trilha={[]}
      />

      <section className="pb-24">
        <div className={secao}>
          <div className="max-w-[68ch]">
            <p className="rounded-[var(--raio-p)] border border-magenta/40 bg-magenta/10 px-6 py-5 text-sm leading-relaxed text-neve">
              <strong className="text-magenta-texto">Documento em finalização.</strong>{' '}
              Falta razão social, CNPJ, endereço e foro, além de revisão jurídica.
            </p>

            <ol className="mt-14 space-y-12">
              {secoes.map((s, i) => (
                <li key={s.t}>
                  <h2 className="font-display text-xl font-bold tracking-[-0.02em] md:text-2xl">
                    <span className="mr-3 font-mono text-sm text-magenta-texto">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    {s.t}
                  </h2>
                  <div className="mt-4 space-y-4">
                    {s.p.map((t) => (
                      <p key={t} className="leading-relaxed text-neve">
                        {t}
                      </p>
                    ))}
                  </div>
                </li>
              ))}
            </ol>

            <p className="mt-16 border-t border-fio pt-8 text-sm text-cinza">
              Dúvidas:{' '}
              <a
                href={`mailto:${site.contato.email}`}
                className="text-magenta-texto underline underline-offset-4"
              >
                {site.contato.email}
              </a>
              . Veja também a{' '}
              <Link
                href="/politica-de-privacidade"
                className="text-magenta-texto underline underline-offset-4"
              >
                política de privacidade
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
    </Casca>
  );
}
