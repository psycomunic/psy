'use client';

import { useActionState } from 'react';
import { sincronizarAgenda, desligarAgenda } from '@/app/painel/acoes-agenda';
import type { Resultado } from '@/app/painel/acoes';

/**
 * O botão que empurra o que já existe para a agenda.
 *
 * Ele resolve dois momentos. O primeiro dia, quando a agenda acabou de
 * ser conectada e todas as tarefas antigas estão fora dela. E o depois
 * de uma falha: a sincronização de cada tarefa nunca derruba o
 * salvamento, e o preço dessa escolha é que uma falha de rede deixa
 * aquela tarefa para trás, calada.
 */
export function AcoesDaAgenda() {
  const [estado, acao, pendente] = useActionState<Resultado | null, FormData>(
    sincronizarAgenda,
    null,
  );
  /* Desligar tem estado próprio: o aviso de "token apagado" não pode
     aparecer no lugar do resultado da sincronização, e vice-versa. */
  const [rDesligar, aDesligar, pDesligar] = useActionState<Resultado | null, FormData>(
    desligarAgenda,
    null,
  );

  return (
    <>
    <form action={acao} className="mt-4 flex flex-wrap items-center gap-3">
      <button
        type="submit"
        disabled={pendente}
        className="rounded-full border border-fio px-5 py-2.5 text-sm font-semibold text-neve transition-colors hover:bg-white/5 disabled:opacity-60"
      >
        {pendente ? 'Sincronizando...' : 'Sincronizar tudo agora'}
      </button>
      {estado ? (
        <p
          role="status"
          className={
            'text-sm font-semibold ' + (estado.ok ? 'text-[#4ADE80]' : 'text-magenta-texto')
          }
        >
          <span aria-hidden className="mr-1.5">{estado.ok ? '●' : '■'}</span>
          {estado.mensagem}
        </p>
      ) : null}
    </form>

    <form action={aDesligar} className="mt-4 border-t border-fio pt-4">
      <button
        type="submit"
        disabled={pDesligar}
        className="inline-flex min-h-[24px] items-center text-xs text-cinza underline-offset-4 transition-colors hover:text-neve hover:underline disabled:opacity-60"
      >
        {pDesligar ? 'Desconectando...' : 'Desconectar e apagar o token'}
      </button>
      {rDesligar ? (
        <p
          role="status"
          className={
            'mt-2 text-sm font-semibold ' +
            (rDesligar.ok ? 'text-[#4ADE80]' : 'text-magenta-texto')
          }
        >
          <span aria-hidden className="mr-1.5">{rDesligar.ok ? '●' : '■'}</span>
          {rDesligar.mensagem}
        </p>
      ) : null}
    </form>
    </>
  );
}
