'use client';

import { useActionState, useState } from 'react';
import {
  criarContrato,
  reajustarContrato,
  encerrarContrato,
} from '@/app/painel/acoes-contrato';
import type { Resultado } from '@/app/painel/acoes';

const campo =
  'w-full rounded-xl border border-fio bg-white/[0.03] px-4 py-3 text-sm text-branco ' +
  'outline-none transition-colors placeholder:text-cinza/60 focus:border-magenta focus:bg-white/[0.05]';
const rotuloCss = 'block font-mono text-[0.75rem] uppercase tracking-[0.14em] text-cinza';

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

/** O primeiro dia do mês que vem, no fuso da operação. Padrão para
    reajuste: mudar fee no meio do mês faz a fatura já emitida e a
    próxima discordarem, e alguém tem que explicar a diferença. */
function primeiroDoMesQueVem() {
  const agora = new Date(Date.now() - 3 * 60 * 60 * 1000);
  const d = new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth() + 1, 1));
  return d.toISOString().slice(0, 10);
}

/* ================================================================== */
/* Novo contrato                                                      */
/* ================================================================== */

export type LojaParaContrato = { id: string; nome: string; comContrato: boolean };

export function FormContrato({ lojas }: { lojas: LojaParaContrato[] }) {
  const [estado, acao, pendente] = useActionState<Resultado | null, FormData>(
    criarContrato,
    null,
  );
  const [aberto, setAberto] = useState(false);

  const [ultimo, setUltimo] = useState(estado);
  if (estado !== ultimo) {
    setUltimo(estado);
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
          Novo contrato
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
        <h3 className="font-display text-lg font-bold tracking-[-0.02em]">Novo contrato</h3>
        <p className="mt-1.5 max-w-[68ch] text-sm leading-relaxed text-cinza">
          É o contrato que diz o que faturar todo mês. Sem ele, a loja não aparece na tela
          de cobrança.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="ct-loja" className={rotuloCss}>Loja *</label>
          <select id="ct-loja" name="conta_id" required className={`mt-2 ${campo}`}>
            <option value="">Escolha</option>
            {lojas.map((l) => (
              /* Loja que já tem vigência aberta aparece, mas travada. Sumir
                 com ela faria a pessoa procurar a loja que não está na
                 lista; assim a própria opção diz por quê. */
              <option key={l.id} value={l.id} disabled={l.comContrato}>
                {l.nome}
                {l.comContrato ? ' — já tem contrato' : ''}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-xs leading-relaxed text-cinza">
            A loja precisa ter CNPJ cadastrado: o Asaas exige documento para emitir.
          </p>
        </div>
        <div>
          <label htmlFor="ct-plano" className={rotuloCss}>Plano *</label>
          <input
            id="ct-plano"
            name="plano"
            required
            list="planos-contrato"
            placeholder="Saturno"
            className={`mt-2 ${campo}`}
          />
          <datalist id="planos-contrato">
            <option value="Saturno" />
            <option value="Falcon" />
            <option value="Apollo" />
          </datalist>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label htmlFor="ct-fee" className={rotuloCss}>Fee mensal *</label>
          <input
            id="ct-fee"
            name="fee_mensal"
            required
            inputMode="decimal"
            placeholder="5.000"
            className={`mt-2 ${campo}`}
          />
          <p className="mt-1.5 text-xs leading-relaxed text-cinza">
            Só o fee. Verba de mídia é do cliente e não entra aqui.
          </p>
        </div>
        <div>
          <label htmlFor="ct-inicio" className={rotuloCss}>Início *</label>
          <input id="ct-inicio" name="inicio" type="date" required className={`mt-2 ${campo}`} />
        </div>
        <div>
          <label htmlFor="ct-fim" className={rotuloCss}>Fim</label>
          <input id="ct-fim" name="fim" type="date" className={`mt-2 ${campo}`} />
          <p className="mt-1.5 text-xs leading-relaxed text-cinza">
            Em branco significa sem prazo, que é o normal.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="ct-reajuste" className={rotuloCss}>Índice de reajuste</label>
          <input id="ct-reajuste" name="reajuste" placeholder="IPCA anual" className={`mt-2 ${campo}`} />
        </div>
        <div>
          <label htmlFor="ct-obs" className={rotuloCss}>Observações</label>
          <input id="ct-obs" name="observacoes" className={`mt-2 ${campo}`} />
        </div>
      </div>

      <Aviso r={estado} />

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={pendente}
          className="rounded-full bg-magenta px-7 py-3 text-sm font-semibold text-branco transition-colors hover:bg-magenta-forte disabled:opacity-60"
        >
          {pendente ? 'Salvando...' : 'Cadastrar contrato'}
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
/* Reajustar e encerrar                                               */
/* ================================================================== */

export function AcoesContrato({
  contratoId,
  feeAtual,
  encerrado,
}: {
  contratoId: string;
  feeAtual: number;
  /** Já tem data de fim: nada mais a mexer, só o que já foi dito. */
  encerrado: boolean;
}) {
  const [aba, setAba] = useState<null | 'reajuste' | 'fim'>(null);
  const [rReajuste, aReajuste, pReajuste] = useActionState<Resultado | null, FormData>(
    reajustarContrato,
    null,
  );
  const [rFim, aFim, pFim] = useActionState<Resultado | null, FormData>(
    encerrarContrato,
    null,
  );

  /*
    ESTE COMPONENTE FICA MONTADO DEPOIS DE ENCERRADO, DE PROPÓSITO.

    A ação chama `revalidatePath`, o servidor devolve a lista de novo e o
    contrato volta com data de fim. Se a condição de montar fosse "só
    quando está aberto", ele sumiria junto com o aviso — e a pessoa
    veria a tela piscar sem uma palavra dizendo se deu certo. Ficando
    montado, o resultado da ação continua na tela ao lado do contrato
    que ela acabou de mudar.
  */
  const feito = rReajuste?.ok ? rReajuste : rFim?.ok ? rFim : null;

  /* Deu certo, fecha o formulário. Ajuste na renderização, e não em
     efeito: `setState` dentro de `useEffect` roda depois de pintar, e a
     regra do React aqui é comparar com o último resultado visto. */
  const [visto, setVisto] = useState(feito);
  if (feito !== visto) {
    setVisto(feito);
    if (feito) setAba(null);
  }

  if (encerrado) {
    return feito ? (
      <p role="status" className="text-xs font-semibold leading-relaxed text-[#4ADE80]">
        <span aria-hidden className="mr-1.5">●</span>
        {feito.mensagem}
      </p>
    ) : null;
  }

  if (!aba) {
    return (
      <div className="space-y-2.5">
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setAba('reajuste')}
            className="inline-flex min-h-[24px] items-center rounded-full border border-fio px-4 py-2 text-xs font-semibold text-neve transition-colors hover:bg-white/5"
          >
            Reajustar
          </button>
          <button
            type="button"
            onClick={() => setAba('fim')}
            className="inline-flex min-h-[24px] items-center rounded-full border border-fio px-4 py-2 text-xs font-semibold text-cinza transition-colors hover:bg-white/5 hover:text-magenta-texto"
          >
            Encerrar
          </button>
        </div>
        {feito ? (
          <p role="status" className="text-xs font-semibold leading-relaxed text-[#4ADE80]">
            <span aria-hidden className="mr-1.5">●</span>
            {feito.mensagem}
          </p>
        ) : null}
      </div>
    );
  }

  if (aba === 'reajuste') {
    return (
      <form action={aReajuste} className="space-y-3 rounded-xl border border-fio bg-white/[0.02] p-4">
        <input type="hidden" name="id" value={contratoId} />

        {/* O aviso onde a dúvida nasce. Sem ele, a pessoa espera que
            "reajustar" edite o número, e estranha ver dois contratos. */}
        <p className="text-xs leading-relaxed text-cinza">
          O contrato atual é encerrado na véspera e um novo começa com o fee novo. As
          faturas já emitidas continuam ligadas ao antigo, para o valor de cada mês
          continuar explicável.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={rotuloCss}>Novo fee *</label>
            <input
              name="fee_mensal"
              required
              inputMode="decimal"
              defaultValue={String(feeAtual)}
              className={`mt-2 ${campo}`}
            />
          </div>
          <div>
            <label className={rotuloCss}>A partir de *</label>
            <input
              name="a_partir_de"
              type="date"
              required
              defaultValue={primeiroDoMesQueVem()}
              className={`mt-2 ${campo}`}
            />
          </div>
        </div>

        <input name="motivo" placeholder="Motivo, opcional" className={campo} />

        <Aviso r={rReajuste} />

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={pReajuste}
            className="rounded-full bg-magenta px-5 py-2.5 text-xs font-semibold text-branco transition-colors hover:bg-magenta-forte disabled:opacity-60"
          >
            {pReajuste ? 'Salvando...' : 'Confirmar reajuste'}
          </button>
          <button
            type="button"
            onClick={() => setAba(null)}
            className="rounded-full border border-fio px-4 py-2.5 text-xs text-neve transition-colors hover:bg-white/5"
          >
            Cancelar
          </button>
        </div>
      </form>
    );
  }

  return (
    <form action={aFim} className="space-y-3 rounded-xl border border-fio bg-white/[0.02] p-4">
      <input type="hidden" name="id" value={contratoId} />

      <p className="text-xs leading-relaxed text-cinza">
        Encerrar não apaga. As faturas já emitidas continuam no histórico, e é o contrato
        encerrado que explica o valor delas.
      </p>

      <div>
        <label className={rotuloCss}>Último dia *</label>
        <input name="fim" type="date" required className={`mt-2 ${campo}`} />
      </div>

      <input name="motivo" placeholder="Motivo, opcional" className={campo} />

      <Aviso r={rFim} />

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={pFim}
          className="rounded-full bg-magenta px-5 py-2.5 text-xs font-semibold text-branco transition-colors hover:bg-magenta-forte disabled:opacity-60"
        >
          {pFim ? 'Encerrando...' : 'Confirmar encerramento'}
        </button>
        <button
          type="button"
          onClick={() => setAba(null)}
          className="rounded-full border border-fio px-4 py-2.5 text-xs text-neve transition-colors hover:bg-white/5"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
