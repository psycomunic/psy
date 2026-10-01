import { notFound, redirect } from 'next/navigation';
import {
  MODULOS,
  PAPEIS,
  pode,
  rotuloModulo,
  rotuloPapel,
  type Modulo,
  type Papel,
} from '@/lib/papeis';
import { bancoConfigurado } from '@/lib/supabase/ambiente';
import { sessaoAtual } from '@/lib/supabase/servidor';
import { Visao } from '@/componentes/painel/modulos/Visao';
import { Metricas } from '@/componentes/painel/modulos/Metricas';
import {
  Crm,
  Contas,
  Equipe,
  Auditoria,
  EmConstrucao,
} from '@/componentes/painel/modulos/Outros';
import { Ficha, abaDaUrl } from '@/componentes/painel/modulos/Ficha';
import { Financeiro, abaFinanceiro } from '@/componentes/painel/modulos/Financeiro';
import { Tarefas, filtroDaUrl } from '@/componentes/painel/modulos/Tarefas';
import { Configuracoes } from '@/componentes/painel/modulos/Configuracoes';
import { Propostas } from '@/componentes/painel/modulos/Propostas';
import { Prospeccao } from '@/componentes/painel/modulos/Prospeccao';
import { Projetos } from '@/componentes/painel/modulos/Projetos';
import { Postagens, mesDaUrl } from '@/componentes/painel/modulos/Postagens';

/**
 * O CONTEÚDO de um módulo. A casca mora no layout, um nível acima.
 *
 * A separação não é organização: é o que faz trocar de aba ser rápido.
 * Layout do segmento pai não é refeito quando o filho muda, então o
 * menu fica parado e só isto aqui é buscado. E é o que permite o
 * `loading.tsx` ao lado aparecer na hora do clique, dentro do `<main>`,
 * sem piscar a navegação.
 */

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
  searchParams: Promise<{
    papel?: string; conta?: string; ficha?: string; aba?: string;
    pagina?: string; lead?: string; filtro?: string; editar?: string; mes?: string;
  }>;
}) {
  const { modulo } = await params;
  const { papel: papelDaUrl, conta, ficha, aba, pagina, lead, filtro, editar, mes } =
    await searchParams;

  if (!MODULOS.includes(modulo as Modulo)) notFound();
  const moduloAtual = modulo as Modulo;

  /*
    De onde vem o papel.

    Com banco: da sessão validada no servidor, e a URL não influencia
    nada. É isso que faz a matriz de permissões valer alguma coisa. A
    leitura é memorizada por requisição, então esta chamada e a do
    layout são uma consulta só.

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

  const permitido = pode(papel, moduloAtual, 'ver');

  /* A ficha da loja monta o próprio cabeçalho, com o nome da loja e o
     health score. Mora dentro de /painel/contas em vez de virar
     /painel/contas/[id] porque uma pasta estática `contas` passaria à
     frente do [modulo] e derrubaria as outras rotas do painel. */
  const naFicha = moduloAtual === 'contas' && !!ficha;

  if (!permitido) {
    return (
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
    );
  }

  return (
    <>
      {/* O módulo de métricas monta o próprio cabeçalho, com o nome da
          conta. Repetir o título aqui seria dizer duas vezes onde a
          pessoa está. */}
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
        {moduloAtual === 'prospeccao' ? <Prospeccao papel={papel} /> : null}
        {moduloAtual === 'crm' ? <Crm papel={papel} /> : null}
        {naFicha ? (
          <Ficha contaId={ficha!} aba={abaDaUrl(aba)} papel={papel} />
        ) : moduloAtual === 'contas' ? (
          <Contas papel={papel} />
        ) : null}
        {moduloAtual === 'financeiro' ? <Financeiro aba={abaFinanceiro(aba)} /> : null}
        {moduloAtual === 'projetos' ? <Projetos papel={papel} /> : null}
        {moduloAtual === 'postagens' ? <Postagens papel={papel} mes={mesDaUrl(mes)} /> : null}
        {moduloAtual === 'tarefas' ? (
          <Tarefas papel={papel} filtro={filtroDaUrl(filtro)} />
        ) : null}
        {moduloAtual === 'equipe' ? <Equipe papel={papel} meuId={meuId} /> : null}
        {moduloAtual === 'auditoria' ? (
          <Auditoria pagina={Math.max(0, Number(pagina) || 0)} />
        ) : null}
        {moduloAtual === 'configuracoes' ? <Configuracoes papel={papel} /> : null}
        {moduloAtual === 'propostas' ? (
          <Propostas papel={papel} leadId={lead} editarId={editar} />
        ) : null}
        {AINDA_NAO[moduloAtual] ? (
          <EmConstrucao nome={rotuloModulo[moduloAtual]} itens={AINDA_NAO[moduloAtual]!} />
        ) : null}
      </div>
    </>
  );
}
