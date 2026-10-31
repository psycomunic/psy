import type { Metadata } from 'next';
import { Onest } from 'next/font/google';
import { selecao as s } from '@/conteudo/selecao-braganca';
import { CenaCaete, Seta } from '@/componentes/selecao/CenaCaete';
import { CenaCadeiras } from '@/componentes/selecao/CenaCadeiras';
import { FormularioSelecao } from '@/componentes/selecao/FormularioSelecao';
import { Interacoes } from '@/componentes/selecao/Interacoes';
import './selecao.css';

/**
 * Apresentação "10 empresas" da unidade de Bragança, no Pará.
 *
 * Página própria, sem a casca do site (cabeçalho e rodapé globais):
 * é um link que a equipe manda no WhatsApp para donos de negócio da
 * região, e o único caminho que interessa daqui é o formulário. Menu
 * com seis destinos seria seis portas de saída.
 *
 * Fora do índice do Google de propósito: quem procura "marketing em
 * Bragança" deve cair em `/braganca-pa`, a página da unidade. Esta é
 * uma apresentação de campanha, com prazo de vida.
 *
 * Visual: design system Kage (noite, tipografia osso, lua) adaptado ao
 * Pará. Textos em `src/conteudo/selecao-braganca.ts`.
 */

const onest = Onest({
  variable: '--font-onest',
  subsets: ['latin'],
  weight: ['200', '300', '400', '500', '600'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: s.meta.titulo,
  description: s.meta.descricao,
  robots: { index: false, follow: true },
  alternates: { canonical: `/${s.slug}` },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: `/${s.slug}`,
    title: s.meta.titulo,
    description: s.meta.descricao,
    images: [{ url: '/selecao/og.jpg', width: 1200, height: 630 }],
  },
};

function Logo({ qual }: { qual: string }) {
  if (qual === 'meta')
    return (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="sel-logo sel-logo--meta" src="/selecao/meta.svg" alt="" />
        <span style={{ fontSize: 30, fontWeight: 500, letterSpacing: '-.02em' }}>Meta</span>
      </>
    );
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="sel-logo" src="/imagens/plataformas/google.svg" alt="" />
      <span style={{ fontSize: 30, fontWeight: 500, letterSpacing: '-.02em' }}>Google</span>
    </>
  );
}

function Cabeca({ numero, rotulo }: { numero: string; rotulo: string }) {
  return (
    <div className="sel-cap-cabeca" data-sel-revela>
      <span className="sel-rotulo">
        <b>{numero}</b> · {rotulo}
      </span>
      <span>Bragança · PA</span>
    </div>
  );
}

export default function PaginaSelecao() {
  return (
    <div className={`sel sel-sem-js ${onest.variable}`}>
      <header className="sel-topo">
        <a href="#topo" className="sel-marca" aria-label="Psy Comunic, voltar ao topo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-psy.svg" alt="Psy Comunic" />
          <span>
            Unidade
            <br />
            Bragança · PA
          </span>
        </a>
        <a href="#inscricao" className="sel-botao" data-sel-abrir>
          Fazer inscrição
          <Seta />
        </a>
      </header>

      <main>
        <CenaCaete />

        {/* 01 · O projeto */}
        <section className="sel-cap" id="projeto" aria-labelledby="sel-projeto">
          <Cabeca numero={s.projeto.numero} rotulo={s.projeto.rotulo} />
          <div className="sel-grade">
            <h2 className="sel-titulo" id="sel-projeto" data-sel-revela>
              {s.projeto.titulo.map((l) => (
                <span key={l}>{l}</span>
              ))}
            </h2>
            <div className="sel-corpo" data-sel-revela style={{ '--i': 1 } as React.CSSProperties}>
              {s.projeto.texto.map((t) => (
                <p key={t.slice(0, 20)}>{t}</p>
              ))}
            </div>
          </div>
          <div className="sel-numeros">
            {s.numeros.map((n, i) => (
              <div key={n.rotulo} data-sel-revela style={{ '--i': i } as React.CSSProperties}>
                <b>
                  {n.prefixo ?? ''}
                  {String(n.valor)}
                  {n.sufixo}
                </b>
                <small>{n.rotulo}</small>
              </div>
            ))}
          </div>
        </section>

        {/* 02 · Como funciona: Meta e Google */}
        <section className="sel-cap" id="como-funciona" aria-labelledby="sel-como">
          <Cabeca numero={s.plataformas.numero} rotulo={s.plataformas.rotulo} />
          <div className="sel-grade">
            <h2 className="sel-titulo" id="sel-como" data-sel-revela>
              {s.plataformas.titulo.map((l) => (
                <span key={l}>{l}</span>
              ))}
            </h2>
            <div className="sel-corpo" data-sel-revela style={{ '--i': 1 } as React.CSSProperties}>
              <p>{s.plataformas.texto}</p>
            </div>
          </div>
          <div className="sel-plataformas">
            {s.plataformas.cartoes.map((c, i) => (
              <article
                key={c.logo}
                className={`sel-plataforma sel-plataforma--${c.logo}`}
                data-sel-revela
                style={{ '--i': i } as React.CSSProperties}
              >
                <div className="sel-plataforma-logo">
                  <Logo qual={c.logo} />
                </div>
                <small className="sel-rotulo" style={{ marginBottom: 12 }}>
                  {c.apoio}
                </small>
                <h3>{c.nome}</h3>
                <p>{c.texto}</p>
              </article>
            ))}
          </div>
          <ul className="sel-garantias" data-sel-revela>
            {s.plataformas.garantias.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
        </section>

        {/* 03 · O que a Psy faz */}
        <section className="sel-cap" aria-labelledby="sel-entregas">
          <Cabeca numero={s.entregas.numero} rotulo={s.entregas.rotulo} />
          <h2 className="sel-titulo" id="sel-entregas" data-sel-revela style={{ marginBottom: 'clamp(40px, 7vh, 80px)' }}>
            {s.entregas.titulo.map((l) => (
              <span key={l}>{l}</span>
            ))}
          </h2>
          <ol className="sel-lista">
            {s.entregas.itens.map((it, i) => (
              <li key={it.nome} data-sel-revela style={{ '--i': i } as React.CSSProperties}>
                <b>{String(i + 1).padStart(2, '0')}</b>
                <h3>
                  {it.nome}
                  <small>{it.apoio}</small>
                </h3>
                <p>{it.texto}</p>
                <em>Psy Comunic</em>
              </li>
            ))}
          </ol>
        </section>

        {/* 04 · As 10 vagas (scroll cinema) */}
        <CenaCadeiras />

        {/* 05 · Para quem é */}
        <section className="sel-cap" aria-labelledby="sel-quem">
          <Cabeca numero={s.paraQuem.numero} rotulo={s.paraQuem.rotulo} />
          <h2 className="sel-titulo" id="sel-quem" data-sel-revela style={{ marginBottom: 'clamp(40px, 7vh, 80px)' }}>
            {s.paraQuem.titulo.map((l) => (
              <span key={l}>{l}</span>
            ))}
          </h2>
          <div className="sel-quem">
            <div data-sel-revela>
              <h3>É para você se</h3>
              <ul>
                {s.paraQuem.sim.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
            <div className="sel-quem-nao" data-sel-revela style={{ '--i': 1 } as React.CSSProperties}>
              <h3>Não é para você se</h3>
              <ul>
                {s.paraQuem.nao.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="sel-autoridade" data-sel-revela>
            <p>{s.autoridade.texto}</p>
            <div className="sel-selos">
              <span>Google Partner</span>
              <span>Meta Business Partner</span>
              {s.autoridade.trabalhos.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
          </div>
        </section>

        {/* 06 · A seleção */}
        <section className="sel-cap" id="selecao" aria-labelledby="sel-passos">
          <Cabeca numero={s.passos.numero} rotulo={s.passos.rotulo} />
          <div className="sel-grade" style={{ marginBottom: 'clamp(40px, 7vh, 80px)' }}>
            <h2 className="sel-titulo" id="sel-passos" data-sel-revela>
              {s.passos.titulo.map((l) => (
                <span key={l}>{l}</span>
              ))}
            </h2>
            <div data-sel-revela style={{ '--i': 1, alignSelf: 'end' } as React.CSSProperties}>
              <a href="#inscricao" className="sel-botao" data-sel-abrir>
                Começar a inscrição
                <Seta />
              </a>
            </div>
          </div>
          <ol className="sel-lista">
            {s.passos.itens.map((it, i) => (
              <li key={it.nome} data-sel-revela style={{ '--i': i } as React.CSSProperties}>
                <b>{String(i + 1).padStart(2, '0')}</b>
                <h3>
                  {it.nome}
                  <small>{it.apoio}</small>
                </h3>
                <p>{it.texto}</p>
                <em>{it.tempo}</em>
              </li>
            ))}
          </ol>
        </section>

        {/* Perguntas */}
        <section className="sel-cap" aria-labelledby="sel-faq">
          <Cabeca numero="07" rotulo="Perguntas" />
          <div className="sel-grade">
            <h2 className="sel-titulo" id="sel-faq" data-sel-revela>
              <span>O que todo</span>
              <span>mundo pergunta.</span>
            </h2>
            <div className="sel-faq" data-sel-revela style={{ '--i': 1 } as React.CSSProperties}>
              {s.perguntas.map((q) => (
                <details key={q.p}>
                  <summary>{q.p}</summary>
                  <p>{q.r}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Fechamento */}
        <section className="sel-final" aria-labelledby="sel-final">
          <span className="sel-rotulo" data-sel-revela>
            Seleção aberta · Bragança e região
          </span>
          <h2 id="sel-final" data-sel-revela>
            {s.final.titulo.map((l) => (
              <span key={l}>{l}</span>
            ))}
          </h2>
          <p data-sel-revela>{s.final.texto}</p>
          <a href="#inscricao" className="sel-botao" data-sel-abrir data-sel-revela>
            {s.final.acao}
            <Seta />
          </a>
        </section>
      </main>

      <footer className="sel-rodape">
        <span>© {new Date().getFullYear()} Psy Comunic · Unidade Bragança, PA</span>
        <span>
          <a href={`https://wa.me/${s.whatsapp}`} target="_blank" rel="noopener noreferrer">
            WhatsApp (91) 98911-0478
          </a>
          {'  ·  '}
          <a href="/politica-de-privacidade">Privacidade</a>
        </span>
      </footer>

      <div className="sel-barra">
        <a href="#inscricao" className="sel-botao" data-sel-abrir>
          Quero participar
          <Seta />
        </a>
      </div>

      <FormularioSelecao />
      <Interacoes />
    </div>
  );
}
