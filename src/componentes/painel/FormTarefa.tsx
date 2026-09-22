'use client';

import { useActionState, useState } from 'react';
import {
  criarTarefa,
  editarTarefa,
  concluirTarefa,
  mudarStatusTarefa,
  apagarTarefa,
} from '@/app/painel/acoes-tarefa';
import {
  PRIORIDADES,
  RECORRENCIAS,
  rotuloPrioridade,
  rotuloRecorrencia,
  type Tarefa,
} from '@/lib/dados/tipos';
import type { Resultado } from '@/app/painel/acoes';

const campo =
  'w-full rounded-xl border border-fio bg-white/[0.03] px-4 py-3 text-sm text-branco ' +
  'outline-none transition-colors placeholder:text-cinza/60 focus:border-magenta focus:bg-white/[0.05]';
const rotuloCss = 'block font-mono text-[0.75rem] uppercase tracking-[0.14em] text-cinza';
const pilula =
  'inline-flex min-h-[24px] items-center gap-2 rounded-full border border-fio px-4 py-2 text-xs font-semibold text-neve transition-colors hover:bg-white/5 disabled:opacity-60';

export type OpcaoSimples = { id: string; nome: string };

function Aviso({ r }: { r: Resultado | null }) {
  if (!r) return null;
  return (
    <p
      role="status"
      className={
        'flex items-start gap-3 rounded-xl border px-4 py-3 text-sm leading-relaxed ' +
        (r.ok
          ? 'border-[#4ADE80]/40 bg-[#4ADE80]/10 text-[#4ADE80]'
          : 'border-magenta/40 bg-magenta/10 text-magenta-texto')
      }
    >
      <span aria-hidden className="mt-0.5">{r.ok ? '●' : '■'}</span>
      {r.mensagem}
    </p>
  );
}

/**
 * Os campos, compartilhados entre criar e editar.
 *
 * Um formulário só para os dois casos porque as regras são as mesmas —
 * recorrência exige prazo, lembrete vai de 0 a 30 dias. Dois
 * formulários seriam duas chances de a regra divergir, e a divergência
 * apareceria como "criar aceita, editar recusa".
 */
function Campos({
  tarefa,
  clientes,
  equipe,
  hoje,
}: {
  tarefa?: Tarefa;
  clientes: OpcaoSimples[];
  equipe: OpcaoSimples[];
  hoje: string;
}) {
  const [recorrencia, setRecorrencia] = useState(tarefa?.recorrencia ?? 'nenhuma');

  return (
    <>
      <div>
        <label className={rotuloCss}>O que precisa ser feito *</label>
        <input
          name="titulo"
          required
          defaultValue={tarefa?.titulo}
          placeholder="Revisar as campanhas de Performance Max"
          className={`mt-2 ${campo}`}
        />
      </div>

      <div>
        <label className={rotuloCss}>Detalhe</label>
        <textarea
          name="detalhe"
          rows={2}
          defaultValue={tarefa?.detalhe ?? ''}
          placeholder="O que precisa ser conferido, e onde"
          className={`mt-2 ${campo} resize-y`}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className={rotuloCss}>Cliente</label>
          <select
            name="conta_id"
            defaultValue={tarefa?.contaId ?? ''}
            className={`mt-2 ${campo}`}
          >
            <option value="">Da agência</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={rotuloCss}>Responsável</label>
          <select
            name="responsavel_id"
            defaultValue={tarefa?.responsavelId ?? ''}
            className={`mt-2 ${campo}`}
          >
            <option value="">Sem responsável</option>
            {equipe.map((p) => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </select>
          <p className="mt-1.5 text-xs leading-relaxed text-cinza">
            Sem responsável, o lembrete vai para os administradores.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className={rotuloCss}>Prazo</label>
          <input
            name="prazo"
            type="date"
            defaultValue={tarefa?.prazo ?? hoje}
            className={`mt-2 ${campo}`}
          />
        </div>
        <div>
          <label className={rotuloCss}>Prioridade</label>
          <select
            name="prioridade"
            defaultValue={tarefa?.prioridade ?? 'media'}
            className={`mt-2 ${campo}`}
          >
            {PRIORIDADES.map((p) => (
              <option key={p} value={p}>{rotuloPrioridade[p]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={rotuloCss}>Avisar</label>
          <select
            name="lembrar_dias"
            defaultValue={String(tarefa?.lembrarDias ?? 1)}
            className={`mt-2 ${campo}`}
          >
            <option value="0">No dia</option>
            <option value="1">1 dia antes</option>
            <option value="2">2 dias antes</option>
            <option value="3">3 dias antes</option>
            <option value="7">1 semana antes</option>
            <option value="15">15 dias antes</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className={rotuloCss}>Repete</label>
          <select
            name="recorrencia"
            value={recorrencia}
            onChange={(e) => setRecorrencia(e.target.value as Tarefa['recorrencia'])}
            className={`mt-2 ${campo}`}
          >
            {RECORRENCIAS.map((r) => (
              <option key={r} value={r}>{rotuloRecorrencia[r]}</option>
            ))}
          </select>
          {recorrencia !== 'nenhuma' ? (
            <p className="mt-1.5 text-xs leading-relaxed text-cinza">
              Ao concluir, a próxima nasce sozinha — contada a partir do prazo, e não do dia
              em que você concluiu.
            </p>
          ) : null}
        </div>
        {recorrencia !== 'nenhuma' ? (
          <div>
            <label className={rotuloCss}>Repetir até</label>
            <input
              name="recorrencia_ate"
              type="date"
              defaultValue={tarefa?.prazo ? '' : ''}
              className={`mt-2 ${campo}`}
            />
            <p className="mt-1.5 text-xs leading-relaxed text-cinza">
              Em branco, repete sem fim.
            </p>
          </div>
        ) : null}
      </div>
    </>
  );
}

/* ================================================================== */
/* Nova tarefa                                                        */
/* ================================================================== */

export function FormNovaTarefa({
  clientes,
  equipe,
  hoje,
}: {
  clientes: OpcaoSimples[];
  equipe: OpcaoSimples[];
  hoje: string;
}) {
  const [estado, acao, pendente] = useActionState<Resultado | null, FormData>(
    criarTarefa,
    null,
  );
  const [aberto, setAberto] = useState(false);

  const [visto, setVisto] = useState(estado);
  if (estado !== visto) {
    setVisto(estado);
    if (estado?.ok) setAberto(false);
  }

  if (!aberto) {
    return (
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setAberto(true)}
          className="inline-flex items-center gap-2.5 rounded-full bg-magenta px-6 py-3 text-sm font-semibold text-branco transition-colors hover:bg-magenta-forte"
        >
          <span aria-hidden className="text-base leading-none">+</span>
          Nova tarefa
        </button>
        {estado?.ok ? (
          <p role="status" className="text-sm font-semibold text-[#4ADE80]">
            <span aria-hidden className="mr-1.5">●</span>
            {estado.mensagem}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <form action={acao} className="cartao space-y-5 p-6">
      <div>
        <h3 className="font-display text-lg font-bold tracking-[-0.02em]">Nova tarefa</h3>
        <p className="mt-1.5 max-w-[68ch] text-sm leading-relaxed text-cinza">
          O prazo é o que faz a tarefa virar lembrete. Sem ele, ela existe mas nunca cobra
          ninguém.
        </p>
      </div>

      <Campos clientes={clientes} equipe={equipe} hoje={hoje} />

      <Aviso r={estado} />

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={pendente}
          className="rounded-full bg-magenta px-7 py-3 text-sm font-semibold text-branco transition-colors hover:bg-magenta-forte disabled:opacity-60"
        >
          {pendente ? 'Criando...' : 'Criar tarefa'}
        </button>
        <button
          type="button"
          onClick={() => setAberto(false)}
          className="rounded-full border border-fio px-6 py-3 text-sm text-neve transition-colors hover:bg-white/5"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

/* ================================================================== */
/* O que se faz com uma tarefa                                        */
/* ================================================================== */

export function AcoesTarefa({
  tarefa,
  clientes,
  equipe,
  hoje,
  podeExcluir,
}: {
  tarefa: Tarefa;
  clientes: OpcaoSimples[];
  equipe: OpcaoSimples[];
  hoje: string;
  podeExcluir: boolean;
}) {
  const [editando, setEditando] = useState(false);

  const [rConcluir, aConcluir, pConcluir] = useActionState<Resultado | null, FormData>(
    concluirTarefa,
    null,
  );
  const [rStatus, aStatus, pStatus] = useActionState<Resultado | null, FormData>(
    mudarStatusTarefa,
    null,
  );
  const [rApagar, aApagar, pApagar] = useActionState<Resultado | null, FormData>(
    apagarTarefa,
    null,
  );
  const [rEditar, aEditar, pEditar] = useActionState<Resultado | null, FormData>(
    editarTarefa,
    null,
  );

  const [visto, setVisto] = useState(rEditar);
  if (rEditar !== visto) {
    setVisto(rEditar);
    if (rEditar?.ok) setEditando(false);
  }

  const feito = [rConcluir, rStatus, rApagar, rEditar].find((r) => r?.ok) ?? null;
  const erro = [rConcluir, rStatus, rApagar, rEditar].find((r) => r && !r.ok) ?? null;

  if (editando) {
    return (
      <form action={aEditar} className="space-y-5 rounded-xl border border-fio bg-white/[0.02] p-5">
        <input type="hidden" name="id" value={tarefa.id} />
        <Campos tarefa={tarefa} clientes={clientes} equipe={equipe} hoje={hoje} />
        <Aviso r={rEditar} />
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={pEditar}
            className="rounded-full bg-magenta px-5 py-2.5 text-xs font-semibold text-branco transition-colors hover:bg-magenta-forte disabled:opacity-60"
          >
            {pEditar ? 'Salvando...' : 'Salvar'}
          </button>
          <button type="button" onClick={() => setEditando(false)} className={pilula}>
            Cancelar
          </button>
        </div>
      </form>
    );
  }

  const concluida = tarefa.status === 'concluida';
  const cancelada = tarefa.status === 'cancelada';

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center gap-2">
        {concluida || cancelada ? (
          <form action={aStatus} className="inline">
            <input type="hidden" name="id" value={tarefa.id} />
            <input type="hidden" name="status" value="aberta" />
            <button type="submit" disabled={pStatus} className={pilula}>
              {pStatus ? 'Reabrindo...' : 'Reabrir'}
            </button>
          </form>
        ) : (
          <>
            <form action={aConcluir} className="inline">
              <input type="hidden" name="id" value={tarefa.id} />
              <button
                type="submit"
                disabled={pConcluir}
                className="inline-flex min-h-[24px] items-center gap-2 rounded-full bg-magenta px-5 py-2.5 text-xs font-semibold text-branco transition-colors hover:bg-magenta-forte disabled:opacity-60"
              >
                {pConcluir ? 'Concluindo...' : 'Concluir'}
              </button>
            </form>

            {tarefa.status === 'aberta' ? (
              <form action={aStatus} className="inline">
                <input type="hidden" name="id" value={tarefa.id} />
                <input type="hidden" name="status" value="fazendo" />
                <button type="submit" disabled={pStatus} className={pilula}>
                  Comecei
                </button>
              </form>
            ) : null}

            <button type="button" onClick={() => setEditando(true)} className={pilula}>
              Editar
            </button>

            <form action={aStatus} className="inline">
              <input type="hidden" name="id" value={tarefa.id} />
              <input type="hidden" name="status" value="cancelada" />
              <button
                type="submit"
                disabled={pStatus}
                className="inline-flex min-h-[24px] items-center rounded-full border border-fio px-4 py-2 text-xs text-cinza transition-colors hover:bg-white/5 hover:text-magenta-texto disabled:opacity-60"
              >
                Cancelar
              </button>
            </form>
          </>
        )}

        {podeExcluir ? (
          <form action={aApagar} className="inline">
            <input type="hidden" name="id" value={tarefa.id} />
            <button
              type="submit"
              disabled={pApagar}
              className="inline-flex min-h-[24px] items-center rounded-full border border-fio px-4 py-2 text-xs text-cinza transition-colors hover:bg-white/5 hover:text-magenta-texto disabled:opacity-60"
            >
              {pApagar ? 'Removendo...' : 'Remover'}
            </button>
          </form>
        ) : null}
      </div>

      {erro ? (
        <p role="status" className="text-xs font-semibold leading-relaxed text-magenta-texto">
          <span aria-hidden className="mr-1.5">■</span>
          {erro.mensagem}
        </p>
      ) : feito ? (
        <p role="status" className="text-xs font-semibold leading-relaxed text-[#4ADE80]">
          <span aria-hidden className="mr-1.5">●</span>
          {feito.mensagem}
        </p>
      ) : null}
    </div>
  );
}
