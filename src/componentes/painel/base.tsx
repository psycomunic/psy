import type { ReactNode } from 'react';
import type { Situacao, Procedencia } from '@/lib/dados/tipos';
import { rotuloSituacao } from '@/lib/dados/tipos';
import { CORES_SITUACAO } from './paleta';

/**
 * Selo de situação da conta.
 *
 * Cor + FORMA + TEXTO. Nunca cor sozinha: para quem não distingue verde
 * de vermelho, um ponto colorido sem rótulo não é informação nenhuma. É
 * a mesma razão pela qual semáforo de rua tem posição fixa.
 */
const FORMAS: Record<Situacao, string> = {
  saudavel: '●',
  atencao: '▲',
  critico: '■',
  sem_dado: '—',
};

export function SeloSituacao({ situacao }: { situacao: Situacao }) {
  const cor = CORES_SITUACAO[situacao];
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold"
      style={{ color: cor, borderColor: `${cor}44`, background: `${cor}14` }}
    >
      <span aria-hidden className="text-[0.6rem] leading-none">
        {FORMAS[situacao]}
      </span>
      {rotuloSituacao[situacao]}
    </span>
  );
}

/**
 * Cartão de número.
 *
 * Um número grande e um rótulo. Sem gráfico: quando a resposta é UM
 * valor, desenhar uma linha de dois pontos é decoração que atrapalha a
 * leitura.
 */
export function Kpi({
  rotulo,
  valor,
  apoio,
  variacao,
  invertido = false,
}: {
  rotulo: string;
  valor: string;
  apoio?: string;
  /** Variação percentual. Null esconde a linha. */
  variacao?: number | null;
  /** true quando SUBIR é ruim: CAC, inadimplência, custo por clique. */
  invertido?: boolean;
}) {
  const bom = variacao === null || variacao === undefined
    ? null
    : invertido ? variacao <= 0 : variacao >= 0;

  return (
    <div className="cartao p-6">
      <p className="font-mono text-[0.64rem] uppercase tracking-[0.16em] text-cinza">
        {rotulo}
      </p>
      <p className="tabular mt-3 font-display text-3xl font-extrabold tracking-[-0.035em]">
        {valor}
      </p>
      {apoio ? <p className="mt-2 text-xs leading-relaxed text-cinza">{apoio}</p> : null}
      {variacao !== null && variacao !== undefined ? (
        <p
          className="tabular mt-3 text-xs font-semibold"
          style={{ color: bom ? CORES_SITUACAO.saudavel : CORES_SITUACAO.critico }}
        >
          {/* Seta além da cor: mesma regra do selo. */}
          <span aria-hidden>{variacao >= 0 ? '↑' : '↓'}</span>{' '}
          {`${variacao > 0 ? '+' : ''}${variacao.toFixed(1).replace('.', ',')}%`}
          <span className="ml-1 font-normal text-cinza">vs. 7 dias antes</span>
        </p>
      ) : null}
    </div>
  );
}

/** Barra de progresso da meta, com o alvo sempre visível. */
export function Progresso({ percentual }: { percentual: number | null }) {
  if (percentual === null) {
    return <p className="text-xs text-cinza">Meta não definida</p>;
  }
  const cor =
    percentual >= 90 ? CORES_SITUACAO.saudavel
    : percentual >= 70 ? CORES_SITUACAO.atencao
    : CORES_SITUACAO.critico;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="tabular text-sm font-semibold" style={{ color: cor }}>
          {percentual.toFixed(0)}%
        </span>
        <span className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-cinza">
          da meta do mês
        </span>
      </div>
      <div
        className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]"
        role="progressbar"
        aria-valuenow={Math.round(percentual)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progresso da meta do mês"
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.min(percentual, 100)}%`, background: cor }}
        />
      </div>
    </div>
  );
}

/**
 * Aviso de procedência.
 *
 * Aparece em TODA tela que mostra número vindo da demonstração. Sem
 * isso, um print do painel circula como se fosse resultado de cliente, e
 * ninguém consegue provar o contrário depois.
 */
export function AvisoProcedencia({ procedencia }: { procedencia: Procedencia }) {
  if (procedencia === 'banco') return null;
  return (
    <p className="rounded-xl border border-magenta/40 bg-magenta/10 px-5 py-3.5 text-sm leading-relaxed text-neve">
      <strong className="text-magenta-texto">Dados de demonstração.</strong> O banco
      ainda não está configurado, então os números e nomes desta tela são fictícios e
      servem só para desenhar o sistema. Nenhum cliente real aparece aqui.
    </p>
  );
}

export function Secao({
  titulo,
  apoio,
  acao,
  children,
}: {
  titulo: string;
  apoio?: string;
  acao?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold tracking-[-0.02em]">{titulo}</h2>
          {apoio ? <p className="mt-1.5 text-sm text-cinza">{apoio}</p> : null}
        </div>
        {acao}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

/** Tabela com rolagem própria. Ver o comentário em /planos: a rolagem
    horizontal mora no container, nunca no body. */
export function Tabela({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-fio">
      <table className="w-full min-w-[44rem] border-collapse text-left text-sm">
        {children}
      </table>
    </div>
  );
}

export const th =
  'px-5 py-4 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-cinza font-normal';
export const td = 'px-5 py-4 border-t border-fio';
