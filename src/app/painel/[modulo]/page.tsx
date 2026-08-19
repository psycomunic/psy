import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Marca } from '@/componentes/Marca';
import {
  MODULOS,
  PAPEIS,
  modulosDoPapel,
  rotuloModulo,
  rotuloPapel,
  permissoes,
  type Modulo,
  type Papel,
} from '@/lib/papeis';

/*
  Casca do painel. Navegação real por papel, DADOS NENHUM.

  O seletor de papel existe só para conferir o que cada perfil enxerga.
  Numa versão com autenticação, o papel vem da sessão, nunca da URL.
*/
export const metadata = {
  title: 'Painel',
  robots: { index: false, follow: false },
};

/** O que cada módulo vai conter. Serve de mapa do que falta construir. */
const oQueVem: Record<Modulo, string[]> = {
  crm: ['Funil por estágio', 'Ficha do lead com histórico', 'Origem e responsável', 'Conversão por etapa'],
  propostas: ['Gerar proposta a partir do lead', 'Versões e status', 'Link único por cliente', 'Aviso de validade'],
  financeiro: ['Contratos e fees', 'Lançamentos a receber e a pagar', 'Faturas e inadimplência', 'Receita recorrente mensal'],
  contas: ['Ficha da loja', 'Plataforma e integrações', 'Contatos e contrato', 'Time responsável'],
  metricas: ['Sessões, pedidos e receita', 'Investimento e ROAS por canal', 'Ticket médio e conversão', 'Comparativo de período'],
  tarefas: ['Checklist operacional por conta', 'Responsável e prazo', 'Recorrentes do onboarding'],
  relatorios: ['Relatório mensal por conta', 'Exportação em PDF', 'Envio automático'],
  equipe: ['Usuários e papéis', 'Contas atribuídas', 'Registro de acesso'],
  configuracoes: ['Dados da agência', 'Integrações', 'Modelos de proposta'],
};

export default async function PainelModulo({
  params,
  searchParams,
}: {
  params: Promise<{ modulo: string }>;
  searchParams: Promise<{ papel?: string }>;
}) {
  const { modulo } = await params;
  const { papel: papelBruto } = await searchParams;

  if (!MODULOS.includes(modulo as Modulo)) notFound();
  const moduloAtual = modulo as Modulo;

  const papel: Papel = PAPEIS.includes(papelBruto as Papel) ? (papelBruto as Papel) : 'admin';
  const visiveis = modulosDoPapel(papel);

  /* Trava de papel. Com autenticação real esta checagem acontece no
     servidor a partir da sessão, e não a partir da URL. */
  const permitido = visiveis.includes(moduloAtual);
  const acoes = permissoes[papel][moduloAtual] ?? [];

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Navegação lateral */}
      <aside className="border-b border-white/10 bg-marinho-fundo p-6 md:w-72 md:border-b-0 md:border-r">
        <Marca />

        <p className="mt-8 text-xs font-semibold uppercase tracking-[0.14em] text-magenta-texto">
          Perfil em visualização
        </p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {PAPEIS.map((p) => (
            <li key={p}>
              <Link
                href={`/painel/${modulosDoPapel(p)[0]}?papel=${p}`}
                className={
                  'inline-block rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ' +
                  (p === papel ? 'bg-magenta text-branco' : 'bg-white/10 text-neve hover:bg-white/20')
                }
              >
                {rotuloPapel[p]}
              </Link>
            </li>
          ))}
        </ul>

        <nav aria-label="Módulos" className="mt-8">
          <ul className="space-y-1">
            {visiveis.map((m) => (
              <li key={m}>
                <Link
                  href={`/painel/${m}?papel=${papel}`}
                  aria-current={m === moduloAtual ? 'page' : undefined}
                  className={
                    'block rounded-xl px-4 py-2.5 text-sm transition-colors ' +
                    (m === moduloAtual ? 'bg-marinho-alto font-semibold text-branco' : 'text-neve hover:bg-white/5')
                  }
                >
                  {rotuloModulo[m]}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <p className="mt-8 text-xs leading-relaxed text-cinza">
          {papel === 'cliente'
            ? 'O cliente enxerga apenas a própria conta. O filtro precisa acontecer no servidor.'
            : `${rotuloPapel[papel]} enxerga ${visiveis.length} de ${MODULOS.length} módulos.`}
        </p>

        <p className="mt-6 text-sm">
          <Link href="/entrar" className="text-magenta-texto underline underline-offset-4">
            Trocar de perfil
          </Link>
        </p>
      </aside>

      {/* Conteúdo */}
      <main id="conteudo" className="flex-1 p-8 md:p-12">
        <div className="rounded-2xl border border-magenta/40 bg-magenta/10 p-4">
          <p className="text-sm leading-relaxed text-neve">
            <strong className="text-magenta-texto">Casca sem dados.</strong> Não há banco
            nem autenticação por trás. Esta área está bloqueada em produção.
          </p>
        </div>

        {!permitido ? (
          <>
            <h1 className="mt-10 text-3xl font-extrabold tracking-tight">Sem acesso</h1>
            <p className="mt-4 max-w-[52ch] text-neve">
              O perfil {rotuloPapel[papel]} não enxerga {rotuloModulo[moduloAtual]}. Isso
              é a matriz de permissões funcionando, e não um erro.
            </p>
          </>
        ) : (
          <>
            <p className="mt-10 text-xs font-semibold uppercase tracking-[0.16em] text-magenta-texto">
              {rotuloPapel[papel]}
            </p>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight">
              {rotuloModulo[moduloAtual]}
            </h1>
            <p className="mt-3 text-sm text-cinza">
              Permissões neste módulo: {acoes.join(', ')}
            </p>

            <h2 className="mt-12 text-sm font-semibold uppercase tracking-[0.14em] text-cinza">
              O que este módulo vai conter
            </h2>
            <ul className="mt-5 grid gap-4 md:grid-cols-2">
              {oQueVem[moduloAtual].map((item) => (
                <li key={item} className="rounded-2xl bg-marinho-alto/60 px-6 py-5 text-neve">
                  {item}
                </li>
              ))}
            </ul>
          </>
        )}
      </main>
    </div>
  );
}
