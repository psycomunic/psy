import Link from 'next/link';
import { Marca } from './Marca';
import { navRodape, linkWhatsapp, whatsapp } from '@/conteudo/navegacao';
import { marca } from '@/conteudo/marca';
import { LinkWhatsapp } from './local/LinkWhatsapp';

const formatado = whatsapp.numero.replace(
  /^55(\d{2})(\d{5})(\d{4})$/,
  '($1) $2-$3',
);

/**
 * `zap` troca o WhatsApp do rodape nesta pagina.
 *
 * Existe para as paginas de unidade. A de Braganca atende no (91), e o
 * rodape global mostra o numero de Blumenau: sem esta troca, a mesma
 * pagina ofereceria dois numeros diferentes, e quem chamasse pelo
 * rodape cairia em outro atendimento.
 */
export function Rodape({
  zap,
}: { zap?: { link: string; visivel: string; pagina: string } } = {}) {
  return (
    <footer className="relative mt-auto overflow-hidden border-t border-fio bg-marinho-fundo">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="brilho-magenta absolute -bottom-64 left-1/2 h-[520px] w-[900px] -translate-x-1/2 opacity-[0.14]" />
      </div>

      <div className={'relative mx-auto w-full max-w-[1320px] px-5 py-20 md:px-10'}>
        <div className="grid gap-14 lg:grid-cols-[1.5fr_repeat(4,1fr)]">
          <div>
            <Marca />
            <p className="mt-5 max-w-[30ch] leading-relaxed text-cinza">
              {marca.posicionamento}
            </p>

            <div className="mt-8 space-y-2.5">
              {/* Com unidade, o link vira o componente de cliente que
                  avisa o GA4: era o unico WhatsApp da pagina que ficava
                  de fora da contagem. Sem unidade, segue <a> comum, e o
                  rodape continua sendo componente de servidor em todas
                  as outras paginas do site. */}
              {zap ? (
                <LinkWhatsapp
                  href={zap.link}
                  pagina={zap.pagina}
                  secao="rodape"
                  className="block text-sm text-neve transition-colors hover:text-branco"
                >
                  {`WhatsApp ${zap.visivel}`}
                </LinkWhatsapp>
              ) : (
                <a
                  href={linkWhatsapp}
                  target="_blank"
                  rel="noopener"
                  className="block text-sm text-neve transition-colors hover:text-branco"
                >
                  WhatsApp {formatado}
                </a>
              )}
              <a
                href="mailto:psycomunic@gmail.com"
                className="block text-sm text-neve transition-colors hover:text-branco"
              >
                psycomunic@gmail.com
              </a>
              <a
                href="https://instagram.com/reysonmkt"
                target="_blank"
                rel="noopener"
                className="block text-sm text-neve transition-colors hover:text-branco"
              >
                @reysonmkt
              </a>
            </div>
          </div>

          {navRodape.map((grupo) => (
            <nav key={grupo.titulo} aria-label={grupo.titulo}>
              <h2 className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-magenta-texto">
                {grupo.titulo}
              </h2>
              <ul className="mt-5 space-y-3">
                {grupo.itens.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm text-neve transition-colors hover:text-branco"
                    >
                      {item.rotulo}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* PENDENTE: razão social, CNPJ e endereço.

            A linha "a preencher" que ficava aqui saiu. Ela não era
            informação falsa, era um recado interno impresso em toda
            página do site: quem chega para contratar lia que a empresa
            não terminou de se cadastrar.

            Rodapé sem CNPJ é normal e não chama atenção. Rodapé
            avisando que falta o CNPJ chama.

            Quando os dados chegarem, entram aqui e também em
            `site.ts`, onde a cidade e o estado alimentam o JSON-LD. */}
        <div className="mt-16 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-fio pt-8">
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-cinza">
            © {new Date().getFullYear()} {marca.nome}
          </p>
          {/* A unidade fica aqui, junto dos dados da empresa, e nao numa
              coluna de navegacao: ela e informacao de onde a empresa
              esta, e nao mais um servico a vender. Link em toda pagina e
              o que faz o Google achar a pagina local sem depender de
              busca. */}
          <Link
            href="/braganca-pa"
            className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-cinza transition-colors hover:text-neve"
          >
            Bragança, PA
          </Link>
        </div>
      </div>
    </footer>
  );
}
