'use client';

import { useActionState } from 'react';
import {
  testarEnvioDeEmail,
  testarAlertaSaldoPorEmail,
  type Resultado,
} from '@/app/painel/acoes-email';

/**
 * O botão que responde "o e-mail sai?" sem ninguém abrir um terminal.
 *
 * A resposta do Resend aparece inteira, inclusive quando é feia. Erro de
 * provedor resumido em "falhou" obriga a próxima pessoa a adivinhar, e
 * o texto dele já vem pronto e específico. Ver acoes-email.ts.
 */
export function TesteDeEmail({ destino }: { destino: string }) {
  const [estado, acao, pendente] = useActionState<Resultado | null, FormData>(
    testarEnvioDeEmail,
    null,
  );
  const [estadoSaldo, acaoSaldo, pendenteSaldo] = useActionState<Resultado | null, FormData>(
    testarAlertaSaldoPorEmail,
    null,
  );

  return (
    <div className="mt-5 border-t border-fio pt-5">
      <div className="flex flex-wrap gap-3">
        <form action={acao}>
          <button
            type="submit"
            disabled={pendente}
            className="rounded-full bg-magenta px-7 py-3 text-sm font-semibold text-branco transition-colors hover:bg-magenta-forte disabled:opacity-60"
          >
            {pendente ? 'Enviando...' : 'Enviar um teste para mim'}
          </button>
        </form>

        <form action={acaoSaldo}>
          <button
            type="submit"
            disabled={pendenteSaldo}
            className="rounded-full border border-fio px-6 py-3 text-sm font-semibold text-neve transition-colors hover:bg-white/5 disabled:opacity-60"
          >
            {pendenteSaldo ? 'Consultando saldos e enviando...' : 'Testar alerta de saldo por e-mail'}
          </button>
        </form>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-cinza">
        Vai para <span className="break-all font-mono text-xs text-neve">{destino}</span>. Os
        alertas automáticos de saldo baixo nas contas de anúncio também saem automaticamente para
        este endereço (além do sino do painel e do WhatsApp).
      </p>

      {[estado, estadoSaldo].map((est, idx) =>
        est ? (
          <p
            key={idx}
            role="status"
            className={
              'mt-4 rounded-xl border px-4 py-3 text-sm leading-relaxed ' +
              (est.ok
                ? 'border-[#4ADE80]/40 bg-[#4ADE80]/10 text-[#4ADE80]'
                : 'border-magenta/40 bg-magenta/10 text-magenta-texto')
            }
          >
            <span aria-hidden className="mr-1.5">
              {est.ok ? '●' : '■'}
            </span>
            {est.mensagem}
          </p>
        ) : null,
      )}
    </div>
  );
}
