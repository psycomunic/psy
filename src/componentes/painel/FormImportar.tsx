'use client';

import { useActionState, useState } from 'react';
import { importarPlanilha } from '@/app/painel/acoes-metricas';
import type { Resultado } from '@/app/painel/acoes';
import { PROVEDORES, rotuloProvedor, type ProvedorPlanilha } from '@/lib/ingestao/csv';

const campo =
  'w-full rounded-xl border border-fio bg-white/[0.03] px-4 py-3 text-sm text-branco ' +
  'outline-none transition-colors file:mr-4 file:rounded-full file:border-0 ' +
  'file:bg-white/10 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-branco ' +
  'placeholder:text-cinza/60 focus:border-magenta focus:bg-white/[0.05]';
const rotulo = 'block font-mono text-[0.62rem] uppercase tracking-[0.14em] text-cinza';

/** As colunas que cada tipo de planilha aceita, para caber na tela sem
    virar documentação em outro lugar. */
const COLUNAS: Record<ProvedorPlanilha, string> = {
  planilha_loja:
    'dia · pedidos captados · pedidos aprovados · receita (aprovada, total com frete) · frete · receita bruta · novos clientes',
  planilha_midia:
    'dia · canal (obrigatório) · investimento · cliques · impressões · receita atribuída',
  planilha_sessao: 'dia · canal · sessões',
};

export function FormImportar({ contaId }: { contaId: string }) {
  const [estado, acao, pendente] = useActionState<Resultado | null, FormData>(
    importarPlanilha,
    null,
  );
  const [provedor, setProvedor] = useState<ProvedorPlanilha>('planilha_loja');

  return (
    <form action={acao} className="cartao space-y-5 p-6">
      <input type="hidden" name="conta_id" value={contaId} />

      <div>
        <h3 className="font-display text-lg font-bold tracking-[-0.02em]">Importar planilha</h3>
        <p className="mt-2 max-w-[62ch] text-sm leading-relaxed text-cinza">
          Enquanto as APIs não estão ligadas, é por aqui que o número entra. Reimportar o
          mesmo período sobrescreve o dia em vez de somar, então dá para corrigir e mandar
          de novo sem medo de dobrar o faturamento.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label htmlFor="p-tipo" className={rotulo}>
            O que a planilha traz
          </label>
          <select
            id="p-tipo"
            name="provedor"
            value={provedor}
            onChange={(e) => setProvedor(e.target.value as ProvedorPlanilha)}
            className={`mt-2 ${campo}`}
          >
            {PROVEDORES.map((p) => (
              <option key={p} value={p}>
                {rotuloProvedor[p]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="p-arquivo" className={rotulo}>
            Arquivo CSV
          </label>
          <input
            id="p-arquivo"
            name="arquivo"
            type="file"
            accept=".csv,text/csv"
            required
            className={`mt-2 ${campo}`}
          />
        </div>
      </div>

      <p className="rounded-xl border border-fio bg-white/[0.02] px-4 py-3 text-xs leading-relaxed text-cinza">
        <span className="font-mono uppercase tracking-[0.12em] text-magenta-texto">
          Colunas aceitas
        </span>
        <br />
        {COLUNAS[provedor]}
        <br />
        <span className="text-cinza/80">
          Data em dd/mm/aaaa ou aaaa-mm-dd. Ponto e vírgula, vírgula ou tabulação como
          separador. Número no formato brasileiro. Nome de coluna com acento e maiúscula
          funciona igual.
        </span>
      </p>

      {estado ? (
        <p
          role="status"
          className={
            'flex items-start gap-3 rounded-xl border px-4 py-3 text-sm leading-relaxed ' +
            (estado.ok
              ? 'border-[#4ADE80]/40 bg-[#4ADE80]/10 text-[#4ADE80]'
              : 'border-magenta/40 bg-magenta/10 text-magenta-texto')
          }
        >
          <span aria-hidden className="mt-0.5">
            {estado.ok ? '●' : '■'}
          </span>
          {estado.mensagem}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pendente}
        className="rounded-full bg-magenta px-7 py-3 text-sm font-semibold text-branco transition-colors hover:bg-magenta-forte disabled:opacity-60"
      >
        {pendente ? 'Lendo...' : 'Importar'}
      </button>
    </form>
  );
}
