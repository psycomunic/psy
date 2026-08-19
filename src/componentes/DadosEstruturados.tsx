import { site, urlAbsoluta } from '@/conteudo/site';
import { frentes } from '@/conteudo/frentes';
import { marca } from '@/conteudo/marca';

/**
 * JSON-LD: o que o Google lê para entender O QUE é este site, e não só
 * quais palavras ele contém.
 *
 * É daqui que saem o painel de conhecimento, o nome da organização na
 * busca e as perguntas expandidas no resultado. Texto sozinho não
 * produz nada disso.
 *
 * Vai num <script type="application/ld+json"> porque é o formato que o
 * Google recomenda: fica fora do HTML visível, então mudar o layout não
 * quebra os dados.
 */

const ORG_ID = urlAbsoluta('/#organizacao');
const SITE_ID = urlAbsoluta('/#site');

/* Endereço só entra se existir de verdade. Ver a pendência em site.ts:
   endereço inventado é sinal de desconfiança para o Google, e busca
   local é onde a maior parte do "quero uma agência" acontece. */
const endereco =
  site.local.cidade && site.local.estado
    ? {
        address: {
          '@type': 'PostalAddress',
          addressLocality: site.local.cidade,
          addressRegion: site.local.estado,
          addressCountry: site.local.pais,
        },
      }
    : {};

export function DadosEstruturados() {
  const grafo = {
    '@context': 'https://schema.org',
    '@graph': [
      /* A organização. `@id` fixo para as outras entidades apontarem
         para ela em vez de repetirem os dados. */
      {
        '@type': ['Organization', 'ProfessionalService'],
        '@id': ORG_ID,
        name: site.nome,
        url: urlAbsoluta('/'),
        description: marca.posicionamento,
        slogan: marca.posicionamento,
        email: site.contato.email,
        telephone: site.contato.telefone,
        areaServed: { '@type': 'Country', name: 'Brasil' },
        knowsLanguage: 'pt-BR',
        sameAs: [site.contato.instagram],
        founder: {
          '@type': 'Person',
          name: site.fundador,
          jobTitle: 'Fundador',
          worksFor: { '@id': ORG_ID },
        },
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'sales',
          telephone: site.contato.telefone,
          email: site.contato.email,
          availableLanguage: 'Portuguese',
        },
        ...endereco,
      },

      /* O site em si. É o que permite ao Google mostrar o nome do site
         em vez do domínio cru no resultado. */
      {
        '@type': 'WebSite',
        '@id': SITE_ID,
        url: urlAbsoluta('/'),
        name: site.nome,
        description: site.descricao,
        inLanguage: 'pt-BR',
        publisher: { '@id': ORG_ID },
      },

      /* O catálogo de serviços. Cada frente é um Service com página
         própria, o que dá ao Google o mapa do que a empresa vende. */
      {
        '@type': 'OfferCatalog',
        name: 'Serviços para e-commerce',
        url: urlAbsoluta('/servicos'),
        itemListElement: frentes.map((f, i) => ({
          '@type': 'Offer',
          position: i + 1,
          itemOffered: {
            '@type': 'Service',
            name: `${f.nome} para e-commerce`,
            description: f.resumo,
            url: urlAbsoluta(`/servicos/${f.slug}`),
            provider: { '@id': ORG_ID },
            areaServed: { '@type': 'Country', name: 'Brasil' },
          },
        })),
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      // O conteúdo é gerado por nós a partir de arquivos do próprio
      // repositório, nunca de entrada de usuário.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(grafo) }}
    />
  );
}

/**
 * Perguntas frequentes de uma frente, em FAQPage.
 *
 * As `duvidas` de cada frente são literalmente o que um lojista digita
 * no Google, com as palavras dele. Marcadas assim, podem aparecer como
 * resultado expandido, que ocupa mais espaço na página de busca.
 *
 * Regra do Google: só marcar pergunta que está VISÍVEL na página. Por
 * isso este componente só é usado na página que de fato as mostra.
 */
export function PerguntasFrequentes({
  perguntas,
}: {
  perguntas: { pergunta: string; resposta: string }[];
}) {
  const dados = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: perguntas.map((p) => ({
      '@type': 'Question',
      name: p.pergunta,
      acceptedAnswer: { '@type': 'Answer', text: p.resposta },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(dados) }}
    />
  );
}

/** Trilha de navegação, para o Google mostrar o caminho no resultado. */
export function Trilha({ itens }: { itens: { nome: string; caminho: string }[] }) {
  const dados = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [{ nome: 'Início', caminho: '/' }, ...itens].map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.nome,
      item: urlAbsoluta(it.caminho),
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(dados) }}
    />
  );
}
