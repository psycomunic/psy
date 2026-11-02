'use client';

import { useActionState } from 'react';
import { testarEnvioDeEmail, type Resultado } from '@/app/painel/acoes-email';

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

  return (
    <form action={acao} className="mt-5 border-t border-fio pt-5">
      <button
        type="submit"
        disabled={pendente}
        className="rounded-full bg-magenta px-7 py-3 text-sm font-semibold text-branco transition-colors hover:bg-magenta-forte disabled:opacity-60"
      >
        {pendente ? 'Enviando...' : 'Enviar um teste para mim'}
      </button>

      <p className="mt-3 text-sm leading-relaxed text-cinza">
        Vai para <span className="break-all font-mono text-xs text-neve">{destino}</span>,
        que é o endereço desta conta. O teste usa a chave e o remetente da produção, então
        o que ele diz é o que acontece com a confirmação de quem preenche o formulário.
      </p>

      {estado ? (
        <p
          role="status"
          className={
            'mt-4 rounded-xl border px-4 py-3 text-sm leading-relaxed ' +
            (estado.ok
              ? 'border-[#4ADE80]/40 bg-[#4ADE80]/10 text-[#4ADE80]'
              : 'border-magenta/40 bg-magenta/10 text-magenta-texto')
          }
        >
          <span aria-hidden className="mr-1.5">
            {estado.ok ? '●' : '■'}
          </span>
          {estado.mensagem}
        </p>
      ) : null}
    </form>
  );
}
