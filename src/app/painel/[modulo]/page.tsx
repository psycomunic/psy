import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import {
  MODULOS,
  PAPEIS,
  rotuloModulo,
  rotuloPapel,
  eInterno,
  pode,
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
import { MenuLateral } from '@/componentes/painel/MenuLateral';
import { resumoDaOperacao } from '@/lib/dados/operacao';
import { minhasNotificacoes } from '@/lib/dados/consultas';

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

/**
 * O que aparece enquanto o módulo carrega.
 *
 * Blocos do tamanho do que vem depois, e não um relógio girando: a
 * forma já no lugar faz a chegada do conteúdo parecer continuação, e
 * não troca de tela. `animate-pulse` diz que está vivo.
 *
 * `aria-hidden` com um aviso de leitor de tela ao lado: a forma é
 * decoração, e quem não enxerga precisa da palavra.
 */
function Carregando() {
  return (
    <div>
      <p role="status" className="sr-only">
        Carregando
      </p>
      <div aria-hidden className="animate-pulse space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-[136px] rounded-[var(--raio-p)] border border-fio bg-white/[0.02]" />
          ))}
        </div>
        <div className="h-[52px] rounded-[var(--raio-p)] border border-fio bg-white/[0.02]" />
        <div className="h-[280px] rounded-[var(--raio-p)] border border-fio bg-white/[0.02]" />
      </div>
    </div>
  );
}

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

  const permitido = pode(papel, moduloAtual, 'ver');

  /* A ficha da loja monta o próprio cabeçalho, com o nome da loja e o
     health score. Mora dentro de /painel/contas em vez de virar
     /painel/contas/[id] porque uma pasta estática `contas` passaria à
     frente do [modulo] e derrubaria as outras rotas do painel. */
  const naFicha = moduloAtual === 'contas' && !!ficha;

  /*
    Contadores do menu.

    Buscados aqui, uma vez por navegação, e não dentro do MenuLateral:
    componente de layout que vai ao banco sozinho vira consulta
    escondida, e ninguém acha depois por que a rota ficou lenta.

    Só para papel interno. Cliente não tem tarefa da agência nem lead.
  */

  /* Os avisos vem aqui, e nao dentro do menu: o menu e componente de
     cliente, e consulta de banco em componente de cliente nao existe.
     O relogio vai junto pelo mesmo motivo de sempre - Date.now() no
     render do navegador divergiria do HTML que o servidor mandou. */
  /*
    AS DUAS JUNTAS, E NÃO UMA DEPOIS DA OUTRA.

    Elas não dependem uma da outra, e estavam em dois `await` seguidos:
    o segundo só começava quando o primeiro voltasse. Cada um é uma ida
    ao banco, e a página inteira esperava as duas antes de pintar
    qualquer coisa.
  */
  const [resumo, avisos] = await Promise.all([
    eInterno(papel) && bancoConfigurado ? resumoDaOperacao() : Promise.resolve(null),
    bancoConfigurado
      ? minhasNotificacoes().then((r) => ({ ...r.dados, agora: new Date().toISOString() }))
      : Promise.resolve(undefined),
  ]);

  const contadores = resumo
    ? {
        tarefas: {
          n: resumo.tarefasAtrasadas,
          grave: true,
          titulo: 'Tarefas com prazo vencido',
        },
        crm: {
          n: resumo.leadsParados,
          titulo: 'Leads há mais de 7 dias no mesmo estágio',
        },
        configuracoes: {
          n: resumo.integracoesComErro,
          grave: true,
          titulo: 'Integrações com erro ou sem credencial',
        },
      }
    : {};

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
      {/* Navegação lateral. Agrupada, com ícone e contador: treze itens
          no mesmo peso visual não são um menu, são uma lista. */}
      <MenuLateral
        papel={papel}
        nome={nome}
        moduloAtual={moduloAtual}
        bancoConfigurado={bancoConfigurado}
        contadores={contadores}
        avisos={avisos}
      />

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

            {/*
              O MÓDULO CHEGA DEPOIS DA CASCA, E NÃO JUNTO.

              Sem isto a página inteira esperava as consultas do módulo
              para pintar o primeiro pixel: medido em produção, o HTML
              levava de 1,5 a 3,5 segundos para fechar, e desses, 11 a
              84ms eram do navegador. Era tudo espera de banco, e a
              pessoa olhava para o nada enquanto durava.

              Com `Suspense`, o Next manda o cabeçalho e o menu na hora e
              transmite o conteúdo quando ele fica pronto. O tempo total
              é o mesmo; o tempo até ver alguma coisa deixa de ser.

              A `key` é o módulo: sem ela, trocar de página reaproveita a
              fronteira e a tela fica no conteúdo ANTIGO até o novo
              chegar, o que parece travamento.
            */}
            <div className={moduloAtual !== 'metricas' && !naFicha ? 'mt-8' : ''}>
              <Suspense key={`${moduloAtual}:${ficha ?? ''}:${mes ?? ''}`} fallback={<Carregando />}>
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
                <EmConstrucao
                  nome={rotuloModulo[moduloAtual]}
                  itens={AINDA_NAO[moduloAtual]!}
                />
              ) : null}
              </Suspense>
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
