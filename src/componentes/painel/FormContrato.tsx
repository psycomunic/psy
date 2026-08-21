'use client';

import { useActionState, useState } from 'react';
import {
  criarContrato,
  reajustarContrato,
  encerrarContrato,
} from '@/app/painel/acoes-contrato';
import { ligarAutomatico, desligarAutomatico } from '@/app/painel/acoes-cobranca';
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

/** A confirmação verde de uma ação que já terminou. */
function Confirmado({ r }: { r: Resultado | null }) {
  if (!r) return null;
  return (
    <span role="status" className="text-xs font-semibold leading-relaxed text-[#4ADE80]">
      <span aria-hidden className="mr-1.5">●</span>
      {r.mensagem}
    </span>
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
          É o contrato que diz o que faturar todo mês. Sem ele, o cliente não aparece na
          tela de cobrança. Serve para loja online e para cliente de tráfego igual.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="ct-loja" className={rotuloCss}>Cliente *</label>
          <select id="ct-loja" name="conta_id" required className={`mt-2 ${campo}`}>
            <option value="">Escolha</option>
            {lojas.map((l) => (
              /* Cliente que já tem vigência aberta aparece, mas travado.
                 Sumir com ele faria a pessoa procurar quem não está na
                 lista; assim a própria opção diz por quê. */
              <option key={l.id} value={l.id} disabled={l.comContrato}>
                {l.nome}
                {l.comContrato ? ' — já tem contrato' : ''}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-xs leading-relaxed text-cinza">
            O cliente precisa ter CNPJ ou CPF cadastrado: o Asaas exige documento para emitir.
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
          <label htmlFor="ct-dia" className={rotuloCss}>Vence todo dia</label>
          <input
            id="ct-dia"
            name="dia_vencimento"
            inputMode="numeric"
            defaultValue="10"
            className={`mt-2 ${campo}`}
          />
          <p className="mt-1.5 text-xs leading-relaxed text-cinza">
            De 1 a 28. Dia 29, 30 e 31 não existem em todo mês.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
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
  automatica,
  diaVencimento,
}: {
  contratoId: string;
  feeAtual: number;
  /** Já tem data de fim: nada mais a mexer, só o que já foi dito. */
  encerrado: boolean;
  /** A assinatura do Asaas está ligada para este contrato. */
  automatica: boolean;
  diaVencimento: number;
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
          <AutomaticoDoContrato
            contratoId={contratoId}
            ligada={automatica}
            diaVencimento={diaVencimento}
          />
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

/* ================================================================== */
/* Cobrança automática                                                */
/* ================================================================== */

/**
 * Liga e desliga a assinatura mensal no Asaas.
 *
 * ============================================================
 * POR QUE ISTO NÃO É UM INTERRUPTOR SILENCIOSO
 * ============================================================
 * Ligar cria uma cobrança de verdade AGORA, e o cliente recebe um
 * e-mail no minuto seguinte. Um botão que faz isso sem avisar é a
 * diferença entre "configurei o painel" e "cobrei o cliente sem
 * querer" — então ele confirma antes, dizendo o dia e o valor.
 */
function AutomaticoDoContrato({
  contratoId,
  ligada,
  diaVencimento,
}: {
  contratoId: string;
  ligada: boolean;
  diaVencimento: number;
}) {
  const [confirmando, setConfirmando] = useState(false);
  const [rLigar, aLigar, pLigar] = useActionState<Resultado | null, FormData>(
    ligarAutomatico,
    null,
  );
  const [rDesligar, aDesligar, pDesligar] = useActionState<Resultado | null, FormData>(
    desligarAutomatico,
    null,
  );

  const resposta = rLigar ?? rDesligar;
  const [visto, setVisto] = useState(resposta);
  if (resposta !== visto) {
    setVisto(resposta);
    if (resposta?.ok) setConfirmando(false);
  }

  /*
    O AVISO ATRAVESSA A TROCA DE ESTADO.

    A ação chama `revalidatePath`, e o contrato volta do servidor já com
    a assinatura ligada — então este componente re-renderiza no OUTRO
    ramo. Mostrar a mensagem só no ramo onde o botão foi clicado faria
    ela sumir no mesmo instante em que aparecia, e a tela trocaria de
    estado sem uma palavra dizendo o que aconteceu.
  */
  const feito = resposta?.ok ? resposta : null;

  if (ligada) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <span
          className="inline-flex min-h-[24px] items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold"
          style={{
            borderColor: 'rgba(74,222,128,0.4)',
            background: 'rgba(74,222,128,0.08)',
            color: '#4ADE80',
          }}
        >
          <span aria-hidden>●</span>
          Cobra sozinho todo dia {diaVencimento}
        </span>
        <form action={aDesligar} className="inline">
          <input type="hidden" name="contrato_id" value={contratoId} />
          <button
            type="submit"
            disabled={pDesligar}
            className="inline-flex min-h-[24px] items-center rounded-full border border-fio px-4 py-2 text-xs text-cinza transition-colors hover:bg-white/5 hover:text-magenta-texto disabled:opacity-60"
          >
            {pDesligar ? 'Desligando...' : 'Desligar'}
          </button>
        </form>
        {rDesligar && !rDesligar.ok ? (
          <span role="status" className="text-xs font-semibold text-magenta-texto">
            {rDesligar.mensagem}
          </span>
        ) : null}
        <Confirmado r={feito} />
      </div>
    );
  }

  if (confirmando) {
    return (
      <form
        action={aLigar}
        className="w-full space-y-2.5 rounded-xl border border-fio bg-white/[0.02] p-4"
      >
        <input type="hidden" name="contrato_id" value={contratoId} />
        <p className="text-xs leading-relaxed text-cinza">
          O Asaas passa a emitir a cobrança todo mês, no dia {diaVencimento}, sem ninguém
          clicar em nada. A primeira sai agora, e o cliente recebe por e-mail. Se o dia{' '}
          {diaVencimento} já passou neste mês, ela vai para o mês que vem.
        </p>
        {rLigar && !rLigar.ok ? (
          <p role="status" className="text-xs font-semibold leading-relaxed text-magenta-texto">
            <span aria-hidden className="mr-1.5">■</span>
            {rLigar.mensagem}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={pLigar}
            className="rounded-full bg-magenta px-5 py-2.5 text-xs font-semibold text-branco transition-colors hover:bg-magenta-forte disabled:opacity-60"
          >
            {pLigar ? 'Ligando...' : 'Ligar cobrança automática'}
          </button>
          <button
            type="button"
            onClick={() => setConfirmando(false)}
            className="rounded-full border border-fio px-4 py-2.5 text-xs text-neve transition-colors hover:bg-white/5"
          >
            Agora não
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={() => setConfirmando(true)}
        className="inline-flex min-h-[24px] items-center rounded-full border border-fio px-4 py-2 text-xs font-semibold text-neve transition-colors hover:bg-white/5"
      >
        Cobrar automaticamente
      </button>
      <Confirmado r={feito} />
    </div>
  );
}
