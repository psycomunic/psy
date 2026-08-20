'use client';

import { useActionState, useState } from 'react';
import {
  vincularFonte,
  desvincularFonte,
  sincronizarAgora,
} from '@/app/painel/acoes-integracao';
import type { Resultado } from '@/app/painel/acoes';

const campo =
  'w-full rounded-xl border border-fio bg-white/[0.03] px-4 py-3 text-sm text-branco ' +
  'outline-none transition-colors placeholder:text-cinza/60 focus:border-magenta focus:bg-white/[0.05]';
const rotuloCss = 'block font-mono text-[0.62rem] uppercase tracking-[0.14em] text-cinza';

/** O que pedir por provedor. Errar o formato do identificador é o
    primeiro erro de todo mundo, então o exemplo fica no campo. */
const FONTES = [
  {
    v: 'meta_ads',
    r: 'Meta Ads',
    exemplo: 'act_1234567890',
    onde: 'Gerenciador de Anúncios > o ID da conta, no seletor de contas.',
  },
  {
    v: 'google_ads',
    r: 'Google Ads',
    exemplo: '123-456-7890',
    onde: 'Google Ads > o ID da conta do cliente, no topo direito.',
  },
  {
    v: 'ga4',
    r: 'Google Analytics 4',
    exemplo: '456789012',
    onde: 'GA4 > Administrador > Detalhes da propriedade > ID da propriedade.',
  },
] as const;

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

export function FormFonte({ contaId }: { contaId: string }) {
  const [estado, acao, pendente] = useActionState<Resultado | null, FormData>(
    vincularFonte,
    null,
  );
  const [fonte, setFonte] = useState<(typeof FONTES)[number]>(FONTES[0]);

  return (
    <form action={acao} className="cartao space-y-5 p-6">
      <input type="hidden" name="conta_id" value={contaId} />

      <div>
        <h3 className="font-display text-lg font-bold tracking-[-0.02em]">
          Vincular conta de anúncio
        </h3>
        <p className="mt-2 max-w-[64ch] text-sm leading-relaxed text-cinza">
          A conta do cliente já precisa estar na BM e na conta gerenciadora da agência. Aqui
          entra só o número dela: a credencial é a mesma para todas as lojas, e o cliente
          não gera token nenhum.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <div>
          <label htmlFor="f-provedor" className={rotuloCss}>
            Fonte
          </label>
          <select
            id="f-provedor"
            name="provedor"
            value={fonte.v}
            onChange={(e) => setFonte(FONTES.find((f) => f.v === e.target.value) ?? FONTES[0])}
            className={`mt-2 ${campo}`}
          >
            {FONTES.map((f) => (
              <option key={f.v} value={f.v}>
                {f.r}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="f-id" className={rotuloCss}>
            Conta desta loja *
          </label>
          <input
            id="f-id"
            name="identificador"
            required
            placeholder={fonte.exemplo}
            autoComplete="off"
            className={`mt-2 ${campo}`}
          />
          <p className="mt-1.5 text-xs leading-relaxed text-cinza">{fonte.onde}</p>
        </div>

        <div>
          <label htmlFor="f-janela" className={rotuloCss}>
            Janela, em dias
          </label>
          <input
            id="f-janela"
            name="janela_dias"
            type="number"
            min={1}
            max={90}
            defaultValue={7}
            className={`mt-2 ${campo}`}
          />
          <p className="mt-1.5 text-xs leading-relaxed text-cinza">
            Quantos dias reprocessar a cada rodada. Pedido aprovado muda de status depois
            do fato, então buscar só ontem congela a aprovação num número que ainda ia
            mudar.
          </p>
        </div>
      </div>

      <Aviso r={estado} />

      <button
        type="submit"
        disabled={pendente}
        className="rounded-full bg-magenta px-7 py-3 text-sm font-semibold text-branco transition-colors hover:bg-magenta-forte disabled:opacity-60"
      >
        {pendente ? 'Vinculando...' : 'Vincular'}
      </button>
    </form>
  );
}

export function BotaoSincronizar({ contaId }: { contaId?: string }) {
  const [estado, acao, pendente] = useActionState<Resultado | null, FormData>(
    sincronizarAgora,
    null,
  );

  return (
    <form action={acao} className="space-y-3">
      {contaId ? <input type="hidden" name="conta_id" value={contaId} /> : null}
      <button
        type="submit"
        disabled={pendente}
        className="rounded-full bg-magenta px-6 py-2.5 text-sm font-semibold text-branco transition-colors hover:bg-magenta-forte disabled:opacity-60"
      >
        {pendente ? 'Puxando das APIs...' : 'Sincronizar agora'}
      </button>
      <Aviso r={estado} />
    </form>
  );
}

export function BotaoDesvincular({ id }: { id: string }) {
  const [estado, acao, pendente] = useActionState<Resultado | null, FormData>(
    desvincularFonte,
    null,
  );

  return (
    <form action={acao} className="inline">
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pendente}
        className="text-xs font-semibold text-cinza underline-offset-4 transition-colors hover:text-magenta-texto hover:underline disabled:opacity-60"
      >
        {pendente ? 'Removendo...' : 'Desvincular'}
      </button>
      {estado && !estado.ok ? (
        <span className="ml-3 text-xs text-magenta-texto">{estado.mensagem}</span>
      ) : null}
    </form>
  );
}
