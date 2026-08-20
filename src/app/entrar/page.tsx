import Link from 'next/link';
import { Marca } from '@/componentes/Marca';
import { PAPEIS, rotuloPapel, rotaInicial } from '@/lib/papeis';
import { bancoConfigurado } from '@/lib/supabase/ambiente';
import { linkWhatsapp } from '@/conteudo/navegacao';
import { FormularioEntrar } from './FormularioEntrar';

export const metadata = {
  title: 'Entrar',
  /* Página de login nunca entra no índice: não há nada a rankear, e o
     resultado de busca "login psy comunic" só ajudaria quem procura
     porta de entrada. */
  robots: { index: false, follow: false },
};

export default async function Entrar({
  searchParams,
}: {
  searchParams: Promise<{ destino?: string }>;
}) {
  const { destino } = await searchParams;

  /*
    Só aceita destino interno.

    Sem esta checagem, /entrar?destino=https://site-falso vira um
    redirecionador aberto hospedado no domínio da Psy Comunic, que é
    exatamente o que golpe de phishing procura: o link começa com o
    domínio real.

    O teste de "//" é o caso que engana: "//outro.com" é URL absoluta
    com protocolo herdado, e passaria num teste que só olhasse a
    primeira barra.
  */
  const seguro =
    destino && destino.startsWith('/') && !destino.startsWith('//') ? destino : '/painel';

  return (
    <main id="conteudo" className="relative isolate flex min-h-screen flex-col lg:flex-row">
      {/* ============================================================
          Coluna da marca. Some no celular: numa tela de 360px, ela
          empurraria o formulário para baixo da dobra, e quem abre um
          login quer o campo de e-mail, não um manifesto.
          ============================================================ */}
      <section className="relative hidden overflow-hidden border-r border-fio bg-marinho-fundo lg:flex lg:w-[46%] lg:flex-col lg:justify-between lg:p-14">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="grade absolute inset-0" />
          <div className="brilho-magenta absolute -left-[20%] top-[8%] h-[560px] w-[560px] opacity-40" />
          <div className="brilho-frio absolute -right-[25%] bottom-[5%] h-[520px] w-[520px] opacity-25" />
        </div>

        <div className="relative">
          <Marca />
        </div>

        <div className="relative">
          <p className="flex items-center gap-3 font-mono text-[0.68rem] uppercase tracking-[0.2em] text-magenta-texto">
            <span aria-hidden className="h-px w-8 bg-magenta" />
            Plataforma
          </p>
          <h1 className="mt-6 max-w-[16ch] font-display text-titulo font-extrabold tracking-[-0.04em]">
            A operação da sua loja, num lugar só.
          </h1>
          <p className="mt-6 max-w-[42ch] text-guia text-neve">
            Receita, verba, ROAS por canal e o funil da visita ao pagamento. Atualizado
            todo dia, sem você pedir relatório.
          </p>

          <ul className="mt-10 space-y-3">
            {[
              'Receita e investimento, dia a dia',
              'MER e ticket médio contra a semana anterior',
              'Quanto do checkout não virou pagamento',
            ].map((i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-cinza">
                <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-magenta" />
                {i}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative font-mono text-[0.62rem] uppercase tracking-[0.14em] text-cinza">
          Acesso restrito · dados de cliente
        </p>
      </section>

      {/* ============================================================
          Coluna do formulário
          ============================================================ */}
      <section className="relative flex flex-1 flex-col justify-center px-5 py-12 md:px-12">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 lg:hidden">
          <div className="grade absolute inset-0" />
          <div className="brilho-magenta absolute -right-[30%] -top-[10%] h-[520px] w-[520px] opacity-35" />
        </div>

        <div className="mx-auto w-full max-w-[26rem]">
          {/* A marca reaparece no celular, onde a coluna da esquerda não existe */}
          <div className="lg:hidden">
            <Marca />
          </div>

          {bancoConfigurado ? (
            <>
              <h2 className="mt-10 font-display text-3xl font-extrabold tracking-[-0.035em] lg:mt-0">
                Entrar
              </h2>
              <p className="mt-3 text-neve">
                Acesso para o time da Psy Comunic e para clientes acompanharem os
                próprios números.
              </p>

              <FormularioEntrar destino={seguro} />

              <div className="mt-10 space-y-4 border-t border-fio pt-8">
                <p className="text-sm leading-relaxed text-cinza">
                  <strong className="text-neve">Não tem acesso?</strong> As contas são
                  criadas por um administrador da Psy Comunic. Não existe cadastro
                  aberto nesta página.
                </p>
                <p className="text-sm leading-relaxed text-cinza">
                  Esqueceu a senha ou perdeu o acesso?{' '}
                  <a
                    href={linkWhatsapp}
                    target="_blank"
                    rel="noopener"
                    className="text-magenta-texto underline underline-offset-4"
                  >
                    Fale com a Psy Comunic
                  </a>
                  .
                </p>
              </div>
            </>
          ) : (
            /* Sem banco não existe login. Esta rota já responde 404 em
               produção; em desenvolvimento ela mostra a navegação por
               perfil e diz com todas as letras que não protege nada. */
            <>
              <div className="mt-10 rounded-3xl border border-magenta/40 bg-magenta/10 p-5 lg:mt-0">
                <p className="text-sm font-semibold text-magenta-texto">
                  Banco não configurado: isto não é um login
                </p>
                <p className="mt-2 text-sm leading-relaxed text-neve">
                  Sem as variáveis do Supabase não há autenticação possível. Os botões
                  abaixo só mostram a navegação de cada perfil, e não protegem nada.
                </p>
              </div>

              <h2 className="mt-10 font-display text-2xl font-extrabold tracking-[-0.03em]">
                Pré-visualização por perfil
              </h2>

              <ul className="mt-8 space-y-3">
                {PAPEIS.map((papel) => (
                  <li key={papel}>
                    <Link
                      href={`${rotaInicial[papel]}?papel=${papel}`}
                      className="flex items-center justify-between rounded-2xl border border-fio bg-white/[0.03] px-6 py-5 transition-colors hover:bg-white/[0.06]"
                    >
                      <span className="font-semibold">{rotuloPapel[papel]}</span>
                      <span className="text-sm text-magenta-texto">Ver painel →</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}

          <p className="mt-10 text-sm">
            <Link href="/" className="text-cinza transition-colors hover:text-neve">
              ← Voltar para o site
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
