'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Marca } from '@/componentes/Marca';
import { BotaoMenu } from './BotaoMenu';
import { IconeModulo } from './IconeModulo';
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

type Contadores = Partial<Record<Modulo, { n: number; grave?: boolean; titulo: string }>>;

export function MenuLateral({
  papel,
  nome,
  bancoConfigurado,
  contadores = {},
}: {
  papel: Papel;
  nome: string | null;
  bancoConfigurado: boolean;
  contadores?: Contadores;
}) {
  const caminho = usePathname();
  const moduloAtual = (caminho?.split('/')[2] ?? '') as Modulo;
  const visiveis = modulosDoPapel(papel);
  const temAcesso = (m: Modulo) => visiveis.includes(m);

  const comPapel = (rota: string) =>
    bancoConfigurado ? rota : `${rota}?papel=${papel}`;

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
            'menu-item group relative flex items-center gap-3 rounded-xl py-2.5 pl-3.5 pr-3 text-sm transition-all duration-150 ' +
            (ativo
              ? 'botao-3d-azul font-semibold'
              : 'font-medium text-neve hover:bg-marinho-alto/70 hover:text-branco')
          }
        >
          <span
            className={
              'flex-none transition-colors ' +
              (ativo ? 'text-[#FFFFFF]' : 'text-cinza group-hover:text-magenta-texto')
            }
          >
            <IconeModulo modulo={m} />
          </span>

          <span className="menu-rotulo min-w-0 flex-1 truncate">{rotuloModulo[m]}</span>

          {c && c.n > 0 ? (
            <span
              title={c.titulo}
              className={
                'menu-rotulo tabular flex-none rounded-full px-2 py-0.5 text-[0.7rem] font-bold ' +
                (ativo
                  ? 'bg-white/20 text-[#FFFFFF]'
                  : c.grave
                    ? 'bg-[#E11D48]/15 text-[var(--p-critico,#E11D48)]'
                    : 'border border-fio bg-marinho-alto text-neve')
              }
            >
              {c.n}
            </span>
          ) : null}

          {c && c.n > 0 ? (
            <span
              aria-hidden
              className="menu-ponto absolute right-2 top-2 h-2 w-2 rounded-full"
              style={{ background: c.grave ? '#E11D48' : 'var(--p-azul-vivo,#1D4ED8)' }}
            />
          ) : null}
        </Link>
      </li>
    );
  };

  return (
    <aside className="menu-lateral relative z-20 shrink-0 border-b border-fio bg-[var(--p-sidebar,#FFFFFF)] px-4 py-5 transition-[width] duration-200 lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:flex-col lg:overflow-y-auto lg:border-b-0 lg:border-r">
      <div className="flex items-center justify-between gap-3 px-1">
        <span className="menu-rotulo min-w-0">
          <Marca />
        </span>
        <span className="menu-acoes flex flex-none items-center gap-2">
          <BotaoMenu />
        </span>
      </div>

      <div className="menu-corpo flex flex-1 flex-col">
        {!bancoConfigurado ? (
          <div className="menu-rotulo mt-5 rounded-xl border border-fio bg-marinho-alto/50 p-3">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-magenta-texto">
              Perfil de demonstração
            </p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {PAPEIS.map((p) => (
                <li key={p}>
                  <Link
                    href={`/painel/${modulosDoPapel(p)[0]}?papel=${p}`}
                    className={
                      'inline-block rounded-full px-2.5 py-1 text-[0.7rem] font-semibold transition-colors ' +
                      (p === papel ? 'botao-3d-azul' : 'border border-fio text-neve hover:bg-marinho-alto')
                    }
                  >
                    {rotuloPapel[p]}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <nav aria-label="Módulos" className="mt-6 flex-1">
          {temAcesso(MODULO_INICIAL) ? (
            <ul className="space-y-1">{item(MODULO_INICIAL)}</ul>
          ) : null}

          {GRUPOS_DE_MODULOS.map((grupo) => {
            const doGrupo = grupo.modulos.filter(temAcesso);
            if (doGrupo.length === 0) return null;

            return (
              <div key={grupo.titulo} className="mt-5">
                <p className="menu-rotulo mb-1.5 px-3.5 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-cinza">
                  {grupo.titulo}
                </p>
                <span aria-hidden className="menu-fio mx-3 mb-2 block h-px bg-fio" />
                <ul className="space-y-1">{doGrupo.map(item)}</ul>
              </div>
            );
          })}
        </nav>

        <div className="mt-6 border-t border-fio pt-4">
          {bancoConfigurado ? (
            <div className="flex items-center justify-between gap-2 px-1">
              <div className="flex min-w-0 items-center gap-2.5">
                <span
                  aria-hidden
                  className="botao-3d-azul flex h-8 w-8 flex-none items-center justify-center rounded-full font-display text-xs font-bold"
                >
                  {iniciais || 'P'}
                </span>
                <div className="menu-rotulo min-w-0">
                  <p className="truncate text-xs font-semibold text-branco">{nome}</p>
                  <p className="truncate text-[0.68rem] text-cinza">
                    {papel === 'cliente' || papel === 'cliente_leitura'
                      ? 'Portal do cliente'
                      : `${visiveis.length}/${MODULOS.length} módulos`}
                  </p>
                </div>
              </div>
              <div className="menu-rotulo shrink-0">
                <Sair />
              </div>
            </div>
          ) : (
            <Link href="/entrar" className="px-2 text-xs font-semibold text-magenta-texto hover:underline">
              Trocar de perfil
            </Link>
          )}
        </div>
      </div>
    </aside>
  );
}
