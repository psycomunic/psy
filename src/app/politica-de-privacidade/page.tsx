import type { Metadata } from 'next';
import Link from 'next/link';
import { Casca, TopoPagina, secao, canonical } from '@/componentes/Casca';
import { site } from '@/conteudo/site';
import { marca } from '@/conteudo/marca';

export const metadata: Metadata = {
  title: 'Política de privacidade',
  description:
    'Como a Psy Comunic coleta, usa e protege dados pessoais, e como exercer seus direitos previstos na LGPD.',
  ...canonical('/politica-de-privacidade'),
};

/*
  ATENÇÃO, PENDÊNCIA JURÍDICA.

  Este texto é uma BASE honesta do que o site faz hoje, escrita para a
  LGPD (Lei 13.709/2018). Ele NÃO substitui revisão de advogado, e três
  campos dependem de dado que ainda não temos: razão social, CNPJ e
  endereço. Estão marcados no texto.

  Enquanto o site não tiver formulário nem cookie de análise, esta
  política precisa dizer exatamente isso. Política que promete tratar
  dados que não são tratados é tão errada quanto a que esconde.
*/

const secoes = [
  {
    t: 'Quem é o controlador',
    p: [
      `A ${marca.nome} é a controladora dos dados pessoais tratados neste site, nos termos da Lei Geral de Proteção de Dados (Lei 13.709/2018).`,
      'Razão social, CNPJ e endereço: a preencher.',
    ],
  },
  {
    t: 'Quais dados são coletados',
    p: [
      'Este site não possui formulário de cadastro, área de comentários nem carrinho de compras. Ele não coleta nome, e-mail ou telefone por conta própria.',
      'Os dados que você envia chegam por canais externos que você mesmo escolhe abrir: WhatsApp, e-mail ou Instagram. Nesses casos, valem também as políticas de privacidade dessas plataformas.',
      'O provedor de hospedagem registra dados técnicos de acesso, como endereço IP, tipo de navegador e páginas visitadas. É registro operacional, usado para segurança e funcionamento do serviço.',
    ],
  },
  {
    t: 'Para que os dados são usados',
    p: [
      'Para responder ao seu contato, elaborar proposta comercial e executar o serviço contratado.',
      'Não vendemos, alugamos nem cedemos dados pessoais a terceiros para fins de marketing.',
    ],
  },
  {
    t: 'Cookies',
    p: [
      'O site não utiliza cookies de publicidade nem de rastreamento de terceiros.',
      'Se no futuro forem adicionadas ferramentas de análise ou de mídia, esta política será atualizada antes, e um aviso de consentimento passará a aparecer na primeira visita.',
    ],
  },
  {
    t: 'Propostas comerciais',
    p: [
      'Propostas são documentos privados, acessíveis por um link único enviado ao cliente. Elas não são indexadas por buscadores e não ficam listadas em nenhum lugar público do site.',
    ],
  },
  {
    t: 'Por quanto tempo os dados ficam guardados',
    p: [
      'Dados de contato comercial são mantidos enquanto durar a relação e pelo prazo legal aplicável depois dela. Registros técnicos de acesso seguem o prazo do provedor de hospedagem.',
    ],
  },
  {
    t: 'Seus direitos',
    p: [
      'A LGPD garante a você: confirmação de que existe tratamento, acesso aos dados, correção de dado incompleto ou desatualizado, anonimização ou eliminação de dado desnecessário, portabilidade, informação sobre compartilhamento e revogação do consentimento.',
      `Para exercer qualquer um deles, escreva para ${site.contato.email}. O pedido é respondido em até 15 dias.`,
    ],
  },
  {
    t: 'Segurança',
    p: [
      'O site é servido exclusivamente por conexão criptografada (HTTPS). O acesso à infraestrutura é restrito às pessoas que precisam dele para operar o serviço.',
    ],
  },
  {
    t: 'Mudanças nesta política',
    p: [
      'Alterações relevantes passam a valer a partir da publicação nesta página, com a data de atualização revista abaixo.',
    ],
  },
];

export default function Privacidade() {
  return (
    <Casca>
      <TopoPagina
        rotulo="Legal"
        titulo={<>Política de privacidade</>}
        texto="O que este site coleta, o que ele não coleta, e como você exerce os direitos que a LGPD garante."
        trilha={[]}
      />

      <section className="pb-24">
        <div className={secao}>
          <div className="max-w-[68ch]">
            <p className="rounded-[var(--raio-p)] border border-magenta/40 bg-magenta/10 px-6 py-5 text-sm leading-relaxed text-neve">
              <strong className="text-magenta-texto">Documento em finalização.</strong>{' '}
              O texto abaixo descreve com precisão o que o site faz hoje, mas ainda
              depende de razão social, CNPJ e endereço, e de revisão jurídica antes de
              valer como documento definitivo.
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
              Dúvidas sobre este documento:{' '}
              <a
                href={`mailto:${site.contato.email}`}
                className="text-magenta-texto underline underline-offset-4"
              >
                {site.contato.email}
              </a>
              . Veja também os{' '}
              <Link
                href="/termos-de-uso"
                className="text-magenta-texto underline underline-offset-4"
              >
                termos de uso
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
    </Casca>
  );
}
