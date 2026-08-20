'use client';

import { useActionState, useRef, useEffect } from 'react';
import { registrarInteracao } from '@/app/painel/acoes-crm';
import type { Resultado } from '@/app/painel/acoes';

const campo =
  'w-full rounded-xl border border-fio bg-white/[0.03] px-4 py-3 text-sm text-branco ' +
  'outline-none transition-colors placeholder:text-cinza/60 focus:border-magenta focus:bg-white/[0.05]';
const rotulo = 'block font-mono text-[0.62rem] uppercase tracking-[0.14em] text-cinza';

const TIPOS = [
  { v: 'ligacao', r: 'Ligação' },
  { v: 'reuniao', r: 'Reunião' },
  { v: 'whatsapp', r: 'WhatsApp' },
  { v: 'email', r: 'E-mail' },
  { v: 'nota', r: 'Nota' },
] as const;

/**
 * Registro rápido de conversa na ficha da loja.
 *
 * Fica ABERTO, ao contrário dos formulários de cadastro: o diário de
 * bordo só serve se for alimentado logo depois da conversa, e um clique
 * a mais é o suficiente para a pessoa deixar para depois.
 */
export function FormInteracao({ contaId }: { contaId: string }) {
  const [estado, acao, pendente] = useActionState<Resultado | null, FormData>(
    registrarInteracao,
    null,
  );
  const form = useRef<HTMLFormElement>(null);

  /* Limpar só depois do sucesso. Limpar no submit apagaria o texto de
     quem escreveu bem e esbarrou numa validação. */
  useEffect(() => {
    if (estado?.ok) form.current?.reset();
  }, [estado]);

  return (
    <form ref={form} action={acao} className="cartao space-y-4 p-6">
      <input type="hidden" name="conta_id" value={contaId} />
      <input type="hidden" name="lead_id" value="" />

      <div className="flex flex-wrap items-end gap-4">
        <div className="w-40">
          <label htmlFor="i-tipo" className={rotulo}>
            Tipo
          </label>
          <select id="i-tipo" name="tipo" defaultValue="nota" className={`mt-2 ${campo}`}>
            {TIPOS.map((t) => (
              <option key={t.v} value={t.v}>
                {t.r}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[16rem] grow">
          <label htmlFor="i-resumo" className={rotulo}>
            O que aconteceu
          </label>
          <input
            id="i-resumo"
            name="resumo"
            required
            placeholder="Reunião de alinhamento: subir verba do Meta em 20%"
            className={`mt-2 ${campo}`}
          />
        </div>
        <button
          type="submit"
          disabled={pendente}
          className="rounded-full bg-magenta px-7 py-3 text-sm font-semibold text-branco transition-colors hover:bg-magenta-forte disabled:opacity-60"
        >
          {pendente ? 'Salvando...' : 'Registrar'}
        </button>
      </div>

      {estado ? (
        <p
          role="status"
          className={
            'flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ' +
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
    </form>
  );
}
