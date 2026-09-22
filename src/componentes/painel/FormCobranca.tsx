'use client';

import { useActionState, useState } from 'react';
import { faturarMes, cobrar, conferir } from '@/app/painel/acoes-cobranca';
import type { Resultado } from '@/app/painel/acoes';

/**
 * Os botões que mexem em dinheiro.
 *
 * Todos com estado de pendência visível e mensagem de retorno logo
 * abaixo. Ação que mexe com cobrança e não diz o que fez faz a pessoa
 * clicar de novo — e o segundo clique numa emissão é o que gera a
 * segunda cobrança para o cliente.
 *
 * A idempotência do lado do servidor cobre esse caso mesmo assim, mas
 * feedback é o que evita a dúvida antes de ela virar clique.
 */

function Aviso({ r }: { r: Resultado | null }) {
  if (!r) return null;
  return (
    <p
      role="status"
      className={
        'mt-2 flex items-start gap-2 text-xs leading-relaxed ' +
        (r.ok ? 'text-[#4ADE80]' : 'text-magenta-texto')
      }
    >
      <span aria-hidden className="mt-0.5">{r.ok ? '●' : '■'}</span>
      {r.mensagem}
    </p>
  );
}

/** Emite a fatura do mês corrente e cria a cobrança, num clique. */
export function BotaoFaturar({ contratoId, jaFaturado }: { contratoId: string; jaFaturado: boolean }) {
  const [estado, acao, pendente] = useActionState<Resultado | null, FormData>(faturarMes, null);

  return (
    <form action={acao}>
      <input type="hidden" name="contrato_id" value={contratoId} />
      <button
        type="submit"
        disabled={pendente}
        className={
          'inline-flex min-h-[24px] items-center rounded-full px-5 py-2.5 text-xs font-semibold transition-colors disabled:opacity-60 ' +
          (jaFaturado
            ? 'border border-fio text-neve hover:bg-white/5'
            : 'bg-magenta text-branco hover:bg-magenta-forte')
        }
      >
        {pendente ? 'Emitindo...' : jaFaturado ? 'Já faturado' : 'Faturar o mês'}
      </button>
      <Aviso r={estado} />
    </form>
  );
}

export function BotaoCobrar({ faturaId }: { faturaId: string }) {
  const [estado, acao, pendente] = useActionState<Resultado | null, FormData>(cobrar, null);

  return (
    <form action={acao} className="inline">
      <input type="hidden" name="fatura_id" value={faturaId} />
      <button
        type="submit"
        disabled={pendente}
        className="inline-flex min-h-[24px] items-center rounded-full bg-magenta px-4 py-2 text-xs font-semibold text-branco transition-colors hover:bg-magenta-forte disabled:opacity-60"
      >
        {pendente ? 'Emitindo...' : 'Emitir cobrança'}
      </button>
      <Aviso r={estado} />
    </form>
  );
}

export function BotaoConferir({ faturaId }: { faturaId: string }) {
  const [estado, acao, pendente] = useActionState<Resultado | null, FormData>(conferir, null);

  return (
    <form action={acao} className="inline">
      <input type="hidden" name="fatura_id" value={faturaId} />
      <button
        type="submit"
        disabled={pendente}
        title="Puxa do Asaas o estado real desta cobrança"
        className="inline-flex min-h-[24px] items-center rounded-full border border-fio px-4 py-2 text-xs font-semibold text-neve transition-colors hover:bg-white/5 disabled:opacity-60"
      >
        {pendente ? 'Conferindo...' : 'Conferir'}
      </button>
      <Aviso r={estado} />
    </form>
  );
}

/** Copia o link de pagamento, para colar no WhatsApp do cliente. */
export function CopiarCobranca({ link }: { link: string }) {
  const [copiado, setCopiado] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(link);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2500);
      }}
      className="inline-flex min-h-[24px] items-center text-xs font-semibold text-magenta-texto underline-offset-4 hover:underline"
    >
      {copiado ? 'copiado ✓' : 'copiar link'}
    </button>
  );
}
