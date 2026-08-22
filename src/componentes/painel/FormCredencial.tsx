'use client';

import { useActionState, useState } from 'react';
import { salvarCredencial, desligarCredencial } from '@/app/painel/acoes-integracao';
import type { Resultado } from '@/app/painel/acoes';

const campo =
  'w-full rounded-xl border border-fio bg-white/[0.03] px-4 py-3 text-sm text-branco ' +
  'outline-none transition-colors placeholder:text-cinza/60 focus:border-magenta focus:bg-white/[0.05]';
const rotuloCss = 'block font-mono text-[0.75rem] uppercase tracking-[0.14em] text-cinza';

/* Espelha `CAMPOS_DO_PROVEDOR`, em `credenciais.ts`. Duplicado porque
   aquele arquivo é `server-only` e este é componente de cliente:
   importar de lá faria o build falhar, que é exatamente o que o
   `server-only` existe para fazer. */
type Campo = {
  chave: string;
  rotulo: string;
  segredo: boolean;
  obrigatorio: boolean;
  ajuda: string;
  opcoes?: { valor: string; rotulo: string }[];
};

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
 * O formulário de credencial da agência.
 *
 * Nasce FECHADO e some depois de salvar. Um formulário de token sempre
 * aberto convida a colar de novo o que já está guardado, e cada colagem
 * é mais uma chance de o token passar por um histórico de navegador ou
 * uma captura de tela.
 */
export function FormCredencial({
  provedor,
  rotuloProvedor,
  campos,
  jaExiste,
}: {
  provedor: string;
  rotuloProvedor: string;
  campos: Campo[];
  jaExiste: boolean;
}) {
  const [estado, acao, pendente] = useActionState<Resultado | null, FormData>(
    salvarCredencial,
    null,
  );
  const [aberto, setAberto] = useState(false);

  if (!aberto) {
    return (
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setAberto(true)}
          className="rounded-full border border-fio px-5 py-2.5 text-sm font-semibold text-neve transition-colors hover:bg-white/5"
        >
          {jaExiste ? 'Substituir credencial' : `Conectar ${rotuloProvedor}`}
        </button>
        <Aviso r={estado} />
      </div>
    );
  }

  return (
    <form action={acao} className="space-y-5 rounded-xl border border-fio bg-white/[0.02] p-5">
      <input type="hidden" name="provedor" value={provedor} />

      <p className="text-sm leading-relaxed text-cinza">
        Cole os valores uma vez. Eles são cifrados antes de ir para o banco e{' '}
        <strong className="text-neve">não voltam a aparecer nesta tela</strong> — nem para
        você. Para trocar, cole de novo.
      </p>

      {/* A regra do campo em branco, dita onde a dúvida nasce. Sem
          isto, quem troca só a chave fica sem saber se o resto
          sobreviveu — e a resposta importa: é o token do webhook que
          faz a confirmação de pagamento voltar. */}
      <p className="text-sm leading-relaxed text-cinza">
        <strong className="text-neve">Campo em branco mantém o que já está guardado.</strong>{' '}
        Dá para trocar só a chave sem mexer no resto. Para apagar de verdade, use
        &ldquo;Desligar e apagar token&rdquo;.
      </p>

      <div>
        <label htmlFor={`${provedor}-rotulo`} className={rotuloCss}>
          Apelido
        </label>
        <input
          id={`${provedor}-rotulo`}
          name="rotulo"
          defaultValue="Principal"
          className={`mt-2 ${campo}`}
        />
      </div>

      {campos.map((c) => (
        <div key={c.chave}>
          <label htmlFor={`${provedor}-${c.chave}`} className={rotuloCss}>
            {c.rotulo} {c.obrigatorio && !jaExiste ? '*' : ''}
          </label>
          {c.opcoes ? (
            /*
              Lista fechada em vez de texto livre.

              O "ambiente" do Asaas era digitado à mão, e a aplicação
              trata qualquer coisa diferente de `producao` como sandbox
              — de propósito, para um erro de digitação não emitir
              cobrança de verdade. Só que a queda era silenciosa: quem
              escrevia "produção", com acento, continuava em sandbox
              achando que tinha virado a chave, e descobria pela
              cobrança que nunca chegou no cliente.
            */
            <select
              id={`${provedor}-${c.chave}`}
              name={c.chave}
              required={c.obrigatorio && !jaExiste}
              defaultValue={jaExiste ? '' : (c.opcoes[0]?.valor ?? '')}
              className={`mt-2 ${campo}`}
            >
              {jaExiste ? <option value="">Manter o que está guardado</option> : null}
              {c.opcoes.map((o) => (
                <option key={o.valor} value={o.valor}>
                  {o.rotulo}
                </option>
              ))}
            </select>
          ) : (
          <input
            id={`${provedor}-${c.chave}`}
            name={c.chave}
            /*
              Obrigatório só na PRIMEIRA vez.

              Com uma credencial já guardada, campo em branco significa
              "não mexi neste" — e o `required` do HTML tornava isso
              impossível de expressar: o navegador barrava o envio antes
              de o servidor ver qualquer coisa. Trocar só a chave do
              Asaas exigiria redigitar o token do webhook, que a tela
              não mostra e ninguém tem à mão.
            */
            required={c.obrigatorio && !jaExiste}
            /* `password` não é sobre esconder de quem está digitando: é
               para o navegador não guardar no autofill e para a captura
               de tela de suporte não levar o token junto. */
            type={c.segredo ? 'password' : 'text'}
            autoComplete="off"
            spellCheck={false}
            className={`mt-2 ${campo}`}
          />
          )}
          <p className="mt-1.5 text-xs leading-relaxed text-cinza">{c.ajuda}</p>
        </div>
      ))}

      <Aviso r={estado} />

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={pendente}
          className="rounded-full bg-magenta px-7 py-3 text-sm font-semibold text-branco transition-colors hover:bg-magenta-forte disabled:opacity-60"
        >
          {pendente ? 'Cifrando...' : 'Guardar'}
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

/** Desligar apaga o token junto. Guardar o segredo de uma credencial
    que ninguém usa é manter o risco sem nenhum benefício. */
export function BotaoDesligarCredencial({ id, rotulo }: { id: string; rotulo: string }) {
  const [estado, acao, pendente] = useActionState<Resultado | null, FormData>(
    desligarCredencial,
    null,
  );

  return (
    <form action={acao} className="inline">
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pendente}
        title={`Desligar ${rotulo} e apagar o token`}
        className="inline-flex min-h-[24px] items-center text-xs font-semibold text-magenta-texto underline-offset-4 hover:underline disabled:opacity-60"
      >
        {pendente ? 'Desligando...' : 'Desligar e apagar token'}
      </button>
      {estado && !estado.ok ? (
        <span className="ml-3 text-xs text-magenta-texto">{estado.mensagem}</span>
      ) : null}
    </form>
  );
}
