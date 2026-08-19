import Link from 'next/link';
import { Marca } from '@/componentes/Marca';
import { PAPEIS, rotuloPapel, rotaInicial } from '@/lib/papeis';

/*
  Tela de login: INTERFACE, sem autenticação por trás.

  Não existe banco, sessão nem senha. Os botões abaixo apenas levam para
  o painel no papel escolhido, para dar para ver a navegação de cada
  perfil. Nada aqui protege nada.

  O middleware devolve 404 nesta rota em produção, justamente para esta
  maquete não ir ao ar parecendo um login de verdade.
*/
export const metadata = {
  title: 'Entrar',
  robots: { index: false, follow: false },
};

export default function Entrar() {
  return (
    <main id="conteudo" className="mx-auto flex min-h-screen max-w-[520px] flex-col justify-center px-5 py-16">
      <Marca />

      <div className="mt-10 rounded-3xl border border-magenta/40 bg-magenta/10 p-5">
        <p className="text-sm font-semibold text-magenta-texto">
          Ainda não é um login de verdade
        </p>
        <p className="mt-2 text-sm leading-relaxed text-neve">
          Não existe banco de dados, sessão nem senha por trás desta tela. Os botões
          abaixo servem só para você ver a navegação de cada perfil. Esta rota está
          bloqueada em produção até a autenticação real existir.
        </p>
      </div>

      <h1 className="mt-10 text-3xl font-extrabold tracking-tight">Entrar na plataforma</h1>
      <p className="mt-3 text-neve">Escolha um perfil para visualizar o painel dele.</p>

      <ul className="mt-8 space-y-3">
        {PAPEIS.map((papel) => (
          <li key={papel}>
            <Link
              href={rotaInicial[papel]}
              className="flex items-center justify-between rounded-2xl bg-marinho-alto/60 px-6 py-5 transition-colors hover:bg-marinho-alto"
            >
              <span className="font-semibold">{rotuloPapel[papel]}</span>
              <span className="text-sm text-magenta-texto">Ver painel</span>
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-10 text-sm">
        <Link href="/" className="text-magenta-texto underline underline-offset-4">
          Voltar para o site
        </Link>
      </p>
    </main>
  );
}
