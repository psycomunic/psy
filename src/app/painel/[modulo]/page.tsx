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
import { Ficha, abaDaUrl } from '@/componentes/painel/modulos/Ficha';
import { Configuracoes } from '@/componentes/painel/modulos/Configuracoes';
import { Propostas } from '@/componentes/painel/modulos/Propostas';
import { BotaoMenu } from '@/componentes/painel/BotaoMenu';

export const metadata = {
  title: 'Painel',
  robots: { index: false, follow: false },
};

const AINDA_NAO: Partial<Record<Modulo, string[]>> = {
  relatorios: [
    'Relatório mensal por conta, com o diário de bordo junto',
    'Exportação em PDF',
    'Envio automático no fechamento do mês',
  ],
};

export default async function PainelModulo({
  params,
  searchParams,
}: {
  params: Promise<{ modulo: string }>;
  searchParams: Promise<{ papel?: string; conta?: string; ficha?: string; aba?: string; pagina?: string; lead?: string }>;
}) {
  const { modulo } = await params;
  const { papel: papelDaUrl, conta, ficha, aba, pagina, lead } = await searchParams;

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

  /* A ficha da loja monta o próprio cabeçalho, com o nome da loja e o
     health score. Mora dentro de /painel/contas em vez de virar
     /painel/contas/[id] porque uma pasta estática `contas` passaria à
     frente do [modulo] e derrubaria as outras rotas do painel. */
  const naFicha = moduloAtual === 'contas' && !!ficha;

  const comPapel = (rota: string) =>
    bancoConfigurado ? rota : `${rota}${rota.includes('?') ? '&' : '?'}papel=${papel}`;

  return (
    <div className="relative flex min-h-screen flex-col lg:flex-row">
      {/* Aplica a preferência de menu antes da primeira pintura.
          `dangerouslySetInnerHTML` é o único jeito de embutir script
          numa árvore do React, e aqui o conteúdo é uma constante
          escrita à mão: nada vem de fora, nada vem do usuário. */}
      <script
        dangerouslySetInnerHTML={{
          __html:
            "try{if(localStorage.getItem('psy-menu')==='recolhido')" +
            "document.documentElement.dataset.menu='recolhido'}catch(e){}",
        }}
      />
      {/* Cenário fixo, igual ao do site. Não rola com o conteúdo: se
          rolasse, o brilho passaria correndo e viraria efeito barato. */}
      {/* `overflow-hidden` recorta os brilhos. Eles têm 680px de
          propósito, para o degradê sangrar fora da tela; sem o recorte
          ficam maiores que a janela e sujam qualquer medição de
          largura, mesmo sem criar rolagem. */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="grade absolute inset-0 opacity-50" />
        <div className="brilho-magenta absolute -right-[22%] -top-[28%] h-[680px] w-[680px] opacity-[0.22]" />
        <div className="brilho-frio absolute -left-[20%] bottom-[-24%] h-[600px] w-[600px] opacity-[0.16]" />
      </div>
      {/* Navegação lateral */}
      <aside className="menu-lateral relative z-10 shrink-0 border-b border-fio bg-marinho-fundo/85 p-6 backdrop-blur-sm transition-[width] duration-200 lg:w-64 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-3">
          <span className="menu-rotulo min-w-0">
            <Marca />
          </span>
          <BotaoMenu />
        </div>

        <div className="menu-corpo">
        {bancoConfigurado ? (
          <div className="menu-rotulo mt-8">
            <p className="font-mono text-[0.75rem] uppercase tracking-[0.14em] text-magenta-texto">
              {rotuloPapel[papel]}
            </p>
            <p className="mt-1 truncate text-sm text-neve">{nome}</p>
          </div>
        ) : (
          <div className="menu-rotulo">
            <p className="mt-8 font-mono text-[0.75rem] uppercase tracking-[0.14em] text-magenta-texto">
              Perfil em visualização
            </p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {PAPEIS.map((p) => (
                <li key={p}>
                  <Link
                    href={`/painel/${modulosDoPapel(p)[0]}?papel=${p}`}
                    className={
                      'inline-block rounded-full px-3 py-1.5 text-[0.75rem] font-semibold transition-colors ' +
                      (p === papel ? 'bg-magenta text-branco' : 'bg-white/10 text-neve hover:bg-white/20')
                    }
                  >
                    {rotuloPapel[p]}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <nav aria-label="Módulos" className="mt-8">
          <ul className="space-y-1">
            {visiveis.map((m) => (
              <li key={m}>
                <Link
                  href={comPapel(`/painel/${m}`)}
                  aria-current={m === moduloAtual ? 'page' : undefined}
                  title={rotuloModulo[m]}
                  className={
                    'menu-item flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition-colors ' +
                    (m === moduloAtual
                      ? 'bg-marinho-alto font-semibold text-branco'
                      : 'text-neve hover:bg-white/5')
                  }
                >
                  {/* A inicial, só no modo recolhido. O `title` acima é
                      o que devolve o nome inteiro ao parar o mouse. */}
                  <span
                    aria-hidden
                    className="menu-icone h-6 w-6 flex-none items-center justify-center rounded-md bg-white/[0.06] font-mono text-[0.75rem] uppercase"
                  >
                    {rotuloModulo[m].charAt(0)}
                  </span>
                  <span className="menu-rotulo truncate">{rotuloModulo[m]}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <p className="menu-rotulo mt-8 text-xs leading-relaxed text-cinza">
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
        </div>
      </aside>

      {/* Conteúdo */}
      <main id="conteudo" className="relative z-10 min-w-0 flex-1 p-6 md:p-10">
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
            {moduloAtual !== 'metricas' && !naFicha ? (
              <header>
                <p className="font-mono text-[0.75rem] uppercase tracking-[0.16em] text-magenta-texto">
                  {rotuloPapel[papel]}
                </p>
                <h1 className="mt-3 font-display text-3xl font-extrabold tracking-[-0.035em]">
                  {rotuloModulo[moduloAtual]}
                </h1>
              </header>
            ) : null}

            <div className={moduloAtual !== 'metricas' && !naFicha ? 'mt-8' : ''}>
              {moduloAtual === 'visao' ? <Visao papel={papel} nome={nome} /> : null}
              {moduloAtual === 'metricas' ? <Metricas papel={papel} contaPedida={conta} /> : null}
              {moduloAtual === 'crm' ? <Crm papel={papel} /> : null}
              {naFicha ? (
                <Ficha contaId={ficha!} aba={abaDaUrl(aba)} papel={papel} />
              ) : moduloAtual === 'contas' ? (
                <Contas papel={papel} />
              ) : null}
              {moduloAtual === 'financeiro' ? <Financeiro /> : null}
              {moduloAtual === 'tarefas' ? <Tarefas /> : null}
              {moduloAtual === 'equipe' ? <Equipe papel={papel} meuId={meuId} /> : null}
              {moduloAtual === 'auditoria' ? (
                <Auditoria pagina={Math.max(0, Number(pagina) || 0)} />
              ) : null}
              {moduloAtual === 'configuracoes' ? <Configuracoes papel={papel} /> : null}
              {moduloAtual === 'propostas' ? <Propostas papel={papel} leadId={lead} /> : null}
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

      {/* Grão por cima de tudo. É o que separa "azul chapado" de
          superfície, e é a mesma camada do site. */}
      <div aria-hidden className="grao-camada" />
    </div>
  );
}
