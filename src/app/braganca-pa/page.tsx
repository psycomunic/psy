import type { Metadata } from 'next';
import { Casca, canonical } from '@/componentes/Casca';
import {
  HeroLocal,
  ProblemasLocal,
  ServicosLocal,
  PassosLocal,
  ParaQuemLocal,
  CidadesLocal,
  PerguntasLocal,
  AutoridadeLocal,
  FechamentoLocal,
  ZapFlutuanteLocal,
} from '@/componentes/local/Blocos';
import {
  PerguntasFrequentes,
  Trilha,
  UnidadeLocal,
} from '@/componentes/DadosEstruturados';
import { braganca as u, linkDaUnidade } from '@/conteudo/braganca';
import { parcerias } from '@/conteudo/prova';
import { trabalhos } from '@/conteudo/trabalhos';
import { site, urlAbsoluta } from '@/conteudo/site';

/**
 * A página da unidade de Bragança, no Pará.
 *
 * ============================================================
 * OUTRO PÚBLICO, MESMA CASA
 * ============================================================
 * O resto do site fala com dono de e-commerce. Esta fala com dono de
 * negócio de rua: loja, clínica, pousada, oficina, escritório. Ele sabe
 * que precisa de cliente e não precisa saber o que é ROAS, então o
 * vocabulário técnico fica no rodapé de cada bloco, nunca no título.
 *
 * ============================================================
 * SEM CENA DE VÍDEO
 * ============================================================
 * A home carrega três cenas de vídeo somando dezenas de megabytes. Aqui
 * não entra nenhuma: quem abre esta página vem de anúncio, no celular,
 * com internet móvel. O clima do site fica por conta da grade e dos
 * brilhos, que são CSS e não custam requisição.
 *
 * ============================================================
 * O NÚMERO DAQUI É O (91)
 * ============================================================
 * `Casca` recebe `semZap` para desligar o botão flutuante global, que
 * leva para o número de Blumenau. Quem atende Bragança é a unidade, e
 * oferecer os dois números na mesma tela seria erro de montagem.
 */

/* Os três trabalhos locais e institucionais do portfólio do site.
   E-commerce fica de fora: não é o que esta página vende. */
const PORTFOLIO = ['Torres Contabilidade', 'Grupo Diságua', 'Medi Marketing'];

export const metadata: Metadata = {
  title: u.meta.titulo,
  description: u.meta.descricao,
  ...canonical(`/${u.slug}`),
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: urlAbsoluta(`/${u.slug}`),
    siteName: site.nome,
    title: `${u.meta.titulo} · ${site.nome}`,
    description: u.meta.descricao,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${u.meta.titulo} · ${site.nome}`,
    description: u.meta.descricao,
  },
};

export default function PaginaBraganca() {
  const doPortfolio = trabalhos.filter((t) => PORTFOLIO.includes(t.nome));

  return (
    <Casca
      semZap
      /* O rodape e o unico lugar da pagina que mostrava o numero de
         Blumenau. Aqui ele passa a mostrar o da unidade: duas linhas
         diferentes na mesma pagina mandariam o cliente para o
         atendimento errado. */
      zapRodape={{
        link: linkDaUnidade(u, u.fechamento.mensagem),
        visivel: u.telefoneVisivel,
        pagina: u.slug,
      }}
    >
      <UnidadeLocal
        id="#unidade"
        nome={site.nome}
        caminho={`/${u.slug}`}
        descricao={u.meta.descricao}
        telefone={u.telefoneEstruturado}
        cidade={u.cidade}
        estado={u.estado}
        pais="BR"
        atende={u.cidades}
      />
      <PerguntasFrequentes perguntas={u.perguntas} />
      <Trilha itens={[{ nome: `${u.cidade}, ${u.estado}`, caminho: `/${u.slug}` }]} />

      <HeroLocal u={u} />
      <ProblemasLocal u={u} />
      <ServicosLocal u={u} />
      <PassosLocal u={u} />
      <ParaQuemLocal u={u} />
      <AutoridadeLocal
        u={u}
        /* Vem do mesmo texto que a home usa. Número novo aqui seria
           número que envelhece em dois lugares diferentes. */
        anos="17 anos"
        parcerias={parcerias.slice(0, 2).map((p) => p.nome)}
        trabalhos={doPortfolio}
      />
      <CidadesLocal u={u} />
      <PerguntasLocal u={u} />
      <FechamentoLocal u={u} />

      <ZapFlutuanteLocal u={u} />
    </Casca>
  );
}
