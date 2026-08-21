import Link from 'next/link';
import { Marca } from '@/componentes/Marca';
import { BotaoMenu } from './BotaoMenu';
import { IconeModulo } from './IconeModulo';
import { Sino } from './Sino';
import { Sair } from '@/app/painel/Sair';
import {
  GRUPOS_DE_MODULOS,
  MODULO_INICIAL,
  MODULOS,
  PAPEIS,
  modulosDoPapel,
  rotuloModulo,
  rotuloPapel,
  type Modulo,
  type Papel,
} from '@/lib/papeis';
import type { Notificacao } from '@/lib/dados/tipos';

/**
 * A navegação do painel.
 *
 * ============================================================
 * POR QUE AGRUPAR
 * ============================================================
 * Onze itens no mesmo peso visual não são um menu, são uma lista. Quem
 * procura "onde vejo inadimplência" lê os onze de cima a baixo toda vez,
 * porque nada indica onde a resposta mora.
 *
 * Os grupos respondem uma pergunta cada: de onde vem cliente novo, o que
 * se faz com quem já entrou, e o que sustenta a agência por trás. A
 * divisão vive em `papeis.ts`, junto da matriz, e há uma trava que
 * quebra o build se um módulo novo ficar sem grupo.
 *
 * ============================================================
 * OS CONTADORES
 * ============================================================
 * Sinal no item de navegação é o único jeito de alguém descobrir que
 * precisa abrir uma tela em que não ia clicar hoje. Três aparecem, e só
 * quando há o que mostrar: tarefa atrasada, lead esquecido e integração
 * quebrada. Contador em zero é ruído — ele diz "está tudo bem" ocupando
 * o mesmo espaço de quem diz "vem aqui".
 */

type Contadores = Partial<Record<Modulo, { n: number; grave?: boolean; titulo: string }>>;

export function MenuLateral({
  papel,
  nome,
  moduloAtual,
  bancoConfigurado,
  contadores = {},
  avisos,
}: {
  papel: Papel;
  nome: string | null;
  moduloAtual: Modulo;
  bancoConfigurado: boolean;
  contadores?: Contadores;
  avisos?: { lista: Notificacao[]; naoLidas: number; agora: string };
}) {
  const visiveis = modulosDoPapel(papel);
  const temAcesso = (m: Modulo) => visiveis.includes(m);

  const comPapel = (rota: string) =>
    bancoConfigurado ? rota : `${rota}?papel=${papel}`;

  /* Iniciais para o avatar. Duas, e não uma: "AG" identifica muito mais
     que "A" num time onde metade dos nomes começa com a mesma letra. */
  const iniciais = (nome ?? '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');

  const item = (m: Modulo) => {
    const ativo = m === moduloAtual;
    const c = contadores[m];

    return (
      <li key={m}>
        <Link
          href={comPapel(`/painel/${m}`)}
          aria-current={ativo ? 'page' : undefined}
          title={rotuloModulo[m]}
          className={
            'menu-item group relative flex items-center gap-3 rounded-xl py-2.5 pl-3.5 pr-3 text-sm transition-colors ' +
            (ativo
              ? 'bg-marinho-alto font-semibold text-branco'
              : 'text-neve hover:bg-white/[0.05] hover:text-branco')
          }
        >
          {/* Trilho de cor na aresta, só no ativo. É o que se vê de
              relance, sem ler: a posição na lista já diz onde você está. */}
          {ativo ? (
            <span
              aria-hidden
              className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-magenta"
            />
          ) : null}

          <span
            className={
              'flex-none transition-colors ' +
              (ativo ? 'text-magenta-texto' : 'text-cinza group-hover:text-neve')
            }
          >
            <IconeModulo modulo={m} />
          </span>

          <span className="menu-rotulo min-w-0 flex-1 truncate">{rotuloModulo[m]}</span>

          {c && c.n > 0 ? (
            <span
              title={c.titulo}
              className={
                'menu-rotulo tabular flex-none rounded-full px-2 py-0.5 text-[0.75rem] font-semibold ' +
                (c.grave
                  ? 'bg-magenta text-branco'
                  : 'border border-fio bg-white/[0.06] text-neve')
              }
            >
              {c.n}
            </span>
          ) : null}

          {/* No menu recolhido o número não cabe, então vira um ponto.
              Sem ele, recolher o menu esconderia o aviso justamente de
              quem escolheu ver menos coisa na tela. */}
          {c && c.n > 0 ? (
            <span
              aria-hidden
              className="menu-ponto absolute right-2 top-2 h-2 w-2 rounded-full"
              style={{ background: c.grave ? 'var(--magenta)' : 'var(--cinza)' }}
            />
          ) : null}
        </Link>
      </li>
    );
  };

  return (
    <aside className="menu-lateral relative z-10 shrink-0 border-b border-fio bg-marinho-fundo/85 px-5 py-6 backdrop-blur-sm transition-[width] duration-200 lg:w-64 lg:border-b-0 lg:border-r">
      <div className="flex items-center justify-between gap-3">
        <span className="menu-rotulo min-w-0">
          <Marca />
        </span>
        <span className="flex items-center gap-2">
          {/* O sino no topo do menu, e nao dentro de um modulo: e o
              unico lugar por onde toda navegacao passa. Lembrete que
              exige abrir a tela certa nao e lembrete. */}
          {avisos ? <Sino lista={avisos.lista} naoLidas={avisos.naoLidas} agora={avisos.agora} /> : null}
          <BotaoMenu />
        </span>
      </div>

      <div className="menu-corpo">
        {/* Quem está logado. O avatar existe para o menu recolhido:
            sem ele, some qualquer sinal de qual conta está aberta. */}
        {bancoConfigurado ? (
          <div className="mt-7 flex items-center gap-3">
            <span
              aria-hidden
              className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-magenta/15 font-display text-sm font-extrabold text-magenta-texto"
            >
              {iniciais || '—'}
            </span>
            <span className="menu-rotulo min-w-0">
              <span className="block truncate text-sm font-semibold text-branco">{nome}</span>
              <span className="block font-mono text-[0.75rem] uppercase tracking-[0.12em] text-magenta-texto">
                {rotuloPapel[papel]}
              </span>
            </span>
          </div>
        ) : (
          <div className="menu-rotulo mt-7">
            <p className="font-mono text-[0.75rem] uppercase tracking-[0.14em] text-magenta-texto">
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

        <nav aria-label="Módulos" className="mt-7">
          {/* A visão geral fica solta no topo: é a porta de entrada, e
              não uma das áreas. Dentro de um grupo, some no meio de
              outras quatro. */}
          {temAcesso(MODULO_INICIAL) ? (
            <ul className="space-y-1">{item(MODULO_INICIAL)}</ul>
          ) : null}

          {GRUPOS_DE_MODULOS.map((grupo) => {
            const doGrupo = grupo.modulos.filter(temAcesso);
            /* Grupo sem nenhum módulo visível para este papel não vira
               um título órfão: some inteiro. */
            if (doGrupo.length === 0) return null;

            return (
              <div key={grupo.titulo} className="mt-6">
                <p className="menu-rotulo mb-2 px-3.5 font-mono text-[0.75rem] uppercase tracking-[0.16em] text-cinza">
                  {grupo.titulo}
                </p>
                {/* Fio no lugar do título quando recolhido: sem ele os
                    onze itens voltam a ser uma lista só. */}
                <span aria-hidden className="menu-fio mx-3 mb-2 block h-px bg-fio" />
                <ul className="space-y-1">{doGrupo.map(item)}</ul>
              </div>
            );
          })}
        </nav>

        <div className="menu-rotulo mt-8 border-t border-fio pt-5">
          <p className="text-xs leading-relaxed text-cinza">
            {papel === 'cliente' || papel === 'cliente_leitura'
              ? 'Você enxerga apenas os números da sua loja.'
              : `${rotuloPapel[papel]} enxerga ${visiveis.length} de ${MODULOS.length} módulos.`}
          </p>
        </div>

        <p className="mt-5">
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
  );
}
