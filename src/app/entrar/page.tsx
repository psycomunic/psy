import Link from 'next/link';
import { Marca } from '@/componentes/Marca';
import { PAPEIS, rotuloPapel, rotaInicial } from '@/lib/papeis';
import { bancoConfigurado } from '@/lib/supabase/ambiente';
import { FormularioEntrar } from './FormularioEntrar';

export const metadata = {
  title: 'Entrar',
  robots: { index: false, follow: false },
};

export default async function Entrar({
  searchParams,
}: {
  searchParams: Promise<{ destino?: string }>;
}) {
  const { destino } = await searchParams;

  // Só aceita destino interno. Sem esta checagem, /entrar?destino=https://
  // outro-site vira um redirecionador aberto com o nome da Psy Comunic
  // na URL, que é o que golpe de phishing procura.
  const seguro = destino && destino.startsWith('/') && !destino.startsWith('//')
    ? destino
    : '/painel';

  return (
    <main
      id="conteudo"
      className="mx-auto flex min-h-screen max-w-[480px] flex-col justify-center px-5 py-16"
    >
      <Marca />

      {bancoConfigurado ? (
        <>
          <h1 className="mt-10 text-3xl font-extrabold tracking-tight">
            Entrar na plataforma
          </h1>
          <p className="mt-3 text-neve">
            Acesso para o time da Psy Comunic e para clientes acompanharem os
            próprios números.
          </p>

          <FormularioEntrar destino={seguro} />

          <p className="mt-8 text-sm leading-relaxed text-cinza">
            Não tem acesso? A conta é criada por um administrador. Fale com a
            Psy Comunic.
          </p>
        </>
      ) : (
        /* Sem banco não existe login. Esta rota já responde 404 em
           produção; em desenvolvimento ela mostra a navegação por
           perfil, e diz com todas as letras que não protege nada. */
        <>
          <div className="mt-10 rounded-3xl border border-magenta/40 bg-magenta/10 p-5">
            <p className="text-sm font-semibold text-magenta-texto">
              Banco não configurado: isto não é um login
            </p>
            <p className="mt-2 text-sm leading-relaxed text-neve">
              Sem as variáveis do Supabase não há autenticação possível. Os
              botões abaixo só mostram a navegação de cada perfil, e não
              protegem nada. Esta rota responde 404 em produção enquanto
              estiver assim.
            </p>
          </div>

          <h1 className="mt-10 text-3xl font-extrabold tracking-tight">
            Pré-visualização por perfil
          </h1>

          <ul className="mt-8 space-y-3">
            {PAPEIS.map((papel) => (
              <li key={papel}>
                <Link
                  href={`${rotaInicial[papel]}?papel=${papel}`}
                  className="flex items-center justify-between rounded-2xl bg-marinho-alto/60 px-6 py-5 transition-colors hover:bg-marinho-alto"
                >
                  <span className="font-semibold">{rotuloPapel[papel]}</span>
                  <span className="text-sm text-magenta-texto">Ver painel</span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="mt-10 text-sm">
        <Link href="/" className="text-magenta-texto underline underline-offset-4">
          Voltar para o site
        </Link>
      </p>
    </main>
  );
}
