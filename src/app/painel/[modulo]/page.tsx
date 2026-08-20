import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Marca } from '@/componentes/Marca';
import {
  MODULOS,
  PAPEIS,
  modulosDoPapel,
  rotuloModulo,
  rotuloPapel,
  pode,
  type Modulo,
  type Papel,
} from '@/lib/papeis';
import { bancoConfigurado } from '@/lib/supabase/ambiente';
import { sessaoAtual } from '@/lib/supabase/servidor';
import { Sair } from '../Sair';
import { Visao } from '@/componentes/painel/modulos/Visao';
import { Metricas } from '@/componentes/painel/modulos/Metricas';
import {
  Crm,
  Contas,
  Financeiro,
  Tarefas,
  Equipe,
  Auditoria,
  EmConstrucao,
} from '@/componentes/painel/modulos/Outros';

export const metadata = {
  title: 'Painel',
  robots: { index: false, follow: false },
};

const AINDA_NAO: Partial<Record<Modulo, string[]>> = {
  propostas: [
    'Gerar proposta a partir do lead, com o escopo das quatro frentes',
    'Versões e status, para saber qual foi a última enviada',
    'Link único por cliente, sem indexação',
    'Aviso de validade vencida',
  ],
  relatorios: [
    'Relatório mensal por conta, com o diário de bordo junto',
    'Exportação em PDF',
    'Envio automático no fechamento do mês',
  ],
  configuracoes: [
    'Dados da agência: razão social, CNPJ, endereço',
    'Integrações por conta: Google Ads, Meta, GA4 e plataforma da loja',
    'Metas por conta e por mês',
    'Modelos de proposta',
  ],
};

export default async function PainelModulo({
  params,
  searchParams,
}: {
  params: Promise<{ modulo: string }>;
  searchParams: Promise<{ papel?: string; conta?: string }>;
}) {
  const { modulo } = await params;
  const { papel: papelDaUrl, conta } = await searchParams;

  if (!MODULOS.includes(modulo as Modulo)) notFound();
  const moduloAtual = modulo as Modulo;

  /*
    De onde vem o papel.

    Com banco: da sessão validada no servidor, e a URL não influencia
    nada. É isso que faz a matriz de permissões valer alguma coisa.

    Sem banco: da URL, porque aqui não existe sessão e a tela serve para
    desenhar o sistema. Esta rota responde 404 em produção enquanto for
    assim, então a maquete nunca vai ao ar.
  */
  let papel: Papel;
  let nome: string | null = null;
  let meuId: string | null = null;

  if (bancoConfigurado) {
    const sessao = await sessaoAtual();
    if (!sessao) redirect(`/entrar?destino=/painel/${moduloAtual}`);
    papel = sessao.papel;
    nome = sessao.nome;
    meuId = sessao.id;
  } else {
    papel = PAPEIS.includes(papelDaUrl as Papel) ? (papelDaUrl as Papel) : 'administrador';
  }

  const visiveis = modulosDoPapel(papel);
  const permitido = pode(papel, moduloAtual, 'ver');

  const comPapel = (rota: string) =>
    bancoConfigurado ? rota : `${rota}${rota.includes('?') ? '&' : '?'}papel=${papel}`;

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Navegação lateral */}
      <aside className="shrink-0 border-b border-fio bg-marinho-fundo p-6 lg:w-64 lg:border-b-0 lg:border-r">
        <Marca />

        {bancoConfigurado ? (
          <div className="mt-8">
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-magenta-texto">
              {rotuloPapel[papel]}
            </p>
            <p className="mt-1 truncate text-sm text-neve">{nome}</p>
          </div>
        ) : (
          <>
            <p className="mt-8 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-magenta-texto">
              Perfil em visualização
            </p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {PAPEIS.map((p) => (
                <li key={p}>
                  <Link
                    href={`/painel/${modulosDoPapel(p)[0]}?papel=${p}`}
                    className={
                      'inline-block rounded-full px-3 py-1.5 text-[0.68rem] font-semibold transition-colors ' +
                      (p === papel ? 'bg-magenta text-branco' : 'bg-white/10 text-neve hover:bg-white/20')
                    }
                  >
                    {rotuloPapel[p]}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}

        <nav aria-label="Módulos" className="mt-8">
          <ul className="space-y-1">
            {visiveis.map((m) => (
              <li key={m}>
                <Link
                  href={comPapel(`/painel/${m}`)}
                  aria-current={m === moduloAtual ? 'page' : undefined}
                  className={
                    'block rounded-xl px-4 py-2.5 text-sm transition-colors ' +
                    (m === moduloAtual
                      ? 'bg-marinho-alto font-semibold text-branco'
                      : 'text-neve hover:bg-white/5')
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
            ? 'Você enxerga apenas os números da sua conta.'
            : `${rotuloPapel[papel]} enxerga ${visiveis.length} de ${MODULOS.length} módulos.`}
        </p>

        <p className="mt-6">
          {bancoConfigurado ? (
            <Sair />
          ) : (
            <Link href="/entrar" className="text-sm text-magenta-texto underline underline-offset-4">
              Trocar de perfil
            </Link>
          )}
        </p>
      </aside>

      {/* Conteúdo */}
      <main id="conteudo" className="min-w-0 flex-1 p-6 md:p-10">
        {!permitido ? (
          <>
            <h1 className="font-display text-3xl font-extrabold tracking-tight">Sem acesso</h1>
            <p className="mt-4 max-w-[52ch] text-neve">
              O perfil {rotuloPapel[papel]} não enxerga {rotuloModulo[moduloAtual]}. Isso é a
              matriz de permissões funcionando, e não um erro.
            </p>
            <p className="mt-6 max-w-[60ch] text-sm leading-relaxed text-cinza">
              Com o banco ligado, esta checagem acontece em três camadas: aqui, na sessão do
              servidor, e nas políticas do Postgres. Mesmo que as duas primeiras falhassem, o
              banco se recusaria a devolver a linha.
            </p>
          </>
        ) : (
          <>
            {/* O módulo de métricas monta o próprio cabeçalho, com o
                nome da conta. Repetir o título aqui seria dizer duas
                vezes onde a pessoa está. */}
            {moduloAtual !== 'metricas' ? (
              <header>
                <p className="font-mono text-[0.64rem] uppercase tracking-[0.16em] text-magenta-texto">
                  {rotuloPapel[papel]}
                </p>
                <h1 className="mt-3 font-display text-3xl font-extrabold tracking-[-0.035em]">
                  {rotuloModulo[moduloAtual]}
                </h1>
              </header>
            ) : null}

            <div className={moduloAtual !== 'metricas' ? 'mt-8' : ''}>
              {moduloAtual === 'visao' ? <Visao papel={papel} /> : null}
              {moduloAtual === 'metricas' ? <Metricas papel={papel} contaPedida={conta} /> : null}
              {moduloAtual === 'crm' ? <Crm /> : null}
              {moduloAtual === 'contas' ? <Contas papel={papel} /> : null}
              {moduloAtual === 'financeiro' ? <Financeiro /> : null}
              {moduloAtual === 'tarefas' ? <Tarefas /> : null}
              {moduloAtual === 'equipe' ? <Equipe papel={papel} meuId={meuId} /> : null}
              {moduloAtual === 'auditoria' ? <Auditoria /> : null}
              {AINDA_NAO[moduloAtual] ? (
                <EmConstrucao
                  nome={rotuloModulo[moduloAtual]}
                  itens={AINDA_NAO[moduloAtual]!}
                />
              ) : null}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
