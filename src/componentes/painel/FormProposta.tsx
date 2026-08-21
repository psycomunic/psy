'use client';

import { useActionState, useState } from 'react';
import { gerarProposta, mudarStatusProposta } from '@/app/painel/acoes-proposta';
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

/** Os três planos, com o preço, para a escolha ser feita com o número à
    vista. O preço vem do servidor: este arquivo é de cliente e não pode
    importar `@/dados/planos`, que é server-only. */
export type OpcaoPlano = { id: string; nome: string; fee: string; paraQuem: string };

/** O lead de origem, quando a proposta nasce do funil. */
export type LeadDeOrigem = {
  id: string;
  cliente: string;
  contato: string;
  fee: number | null;
};

export function FormProposta({
  planos,
  lead = null,
}: {
  planos: OpcaoPlano[];
  lead?: LeadDeOrigem | null;
}) {
  const [estado, acao, pendente] = useActionState<Resultado | null, FormData>(
    gerarProposta,
    null,
  );

  /*
    Vindo do funil, o plano sugerido é o mais próximo do fee negociado,
    e não o do meio.

    Quem já conversou sobre R$ 10 mil não deveria precisar corrigir a
    tela para Apollo: o valor já foi dito, e repetir a escolha é onde
    entra a divergência entre o que foi combinado e o que a proposta diz.
  */
  const sugerido = (() => {
    if (!lead?.fee) return planos[1]?.id ?? planos[0]?.id;
    const numero = (t: string) => Number(t.replace(/\D/g, '')) || 0;
    return planos.reduce((melhor, p) =>
      Math.abs(numero(p.fee) - lead.fee!) < Math.abs(numero(melhor.fee) - lead.fee!) ? p : melhor,
    ).id;
  })();

  const [escolhido, setEscolhido] = useState(sugerido);

  return (
    <form action={acao} className="cartao space-y-6 p-6 md:p-8">
      {lead ? <input type="hidden" name="lead_id" value={lead.id} /> : null}

      <div>
        <h3 className="font-display text-lg font-bold tracking-[-0.02em]">
          {lead ? `Proposta para ${lead.cliente}` : 'Gerar link de proposta'}
        </h3>
        <p className="mt-2 max-w-[68ch] text-sm leading-relaxed text-cinza">
          {lead
            ? 'Veio do funil, então os dados já estão preenchidos e a proposta fica ligada ao lead. O link nasce como rascunho e não abre para ninguém até você publicar.'
            : 'O link nasce como rascunho e não abre para ninguém até você publicar. Por padrão a página mostra só o plano recomendado.'}
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label htmlFor="pr-cliente" className={rotuloCss}>Loja *</label>
          <input
            id="pr-cliente"
            name="cliente"
            required
            defaultValue={lead?.cliente ?? ''}
            placeholder="Loja Aurora"
            className={`mt-2 ${campo}`}
          />
        </div>
        <div>
          <label htmlFor="pr-contato" className={rotuloCss}>Com quem você está falando *</label>
          <input
            id="pr-contato"
            name="contato"
            required
            defaultValue={lead?.contato ?? ''}
            placeholder="Mariana, sócia"
            className={`mt-2 ${campo}`}
          />
        </div>
      </div>

      <fieldset>
        <legend className={rotuloCss}>Plano recomendado *</legend>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {planos.map((p) => (
            <label
              key={p.id}
              className={
                'cursor-pointer rounded-xl border p-4 transition-colors ' +
                (escolhido === p.id
                  ? 'border-magenta bg-magenta/10'
                  : 'border-fio bg-white/[0.02] hover:bg-white/[0.05]')
              }
            >
              <input
                type="radio"
                name="plano"
                value={p.id}
                checked={escolhido === p.id}
                onChange={() => setEscolhido(p.id)}
                className="sr-only"
              />
              <span className="flex items-baseline justify-between gap-2">
                <span className="font-display text-base font-bold">{p.nome}</span>
                <span className="tabular text-sm font-semibold text-magenta-texto">{p.fee}</span>
              </span>
              <span className="mt-2 block text-xs leading-relaxed text-cinza">{p.paraQuem}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="pr-diag" className={rotuloCss}>
          Diagnóstico, uma linha por item
        </label>
        <textarea
          id="pr-diag"
          name="diagnostico"
          rows={4}
          placeholder={'Tráfego chega, mas a conversão fica abaixo da média do segmento.\nCheckout com etapas demais e sem recuperação de carrinho.\nMídia sem leitura de ROI por canal.'}
          className={`mt-2 ${campo}`}
        />
        <p className="mt-1.5 text-xs leading-relaxed text-cinza">
          É a parte que faz a proposta parecer feita para esta loja, e não um modelo. Vale
          mais que o resto junto.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label htmlFor="pr-passos" className={rotuloCss}>Próximos passos, um por linha</label>
          <textarea
            id="pr-passos"
            name="proximos_passos"
            rows={4}
            placeholder={'Aprovação desta proposta.\nKick off e briefing da operação.\nPlano de mídia com projeção.\nEstruturação das contas e início das campanhas.'}
            className={`mt-2 ${campo}`}
          />
        </div>
        <div>
          <label htmlFor="pr-validade" className={rotuloCss}>Validade, em dias</label>
          <input
            id="pr-validade"
            name="validade_dias"
            type="number"
            min={1}
            max={90}
            defaultValue={15}
            className={`mt-2 ${campo}`}
          />
          <p className="mt-1.5 text-xs leading-relaxed text-cinza">
            Depois disso a página avisa que venceu. Prazo é o que faz a proposta ser
            respondida em vez de esquecida.
          </p>
        </div>
      </div>

      <div>
        <label htmlFor="pr-resumo" className={rotuloCss}>Resumo (opcional)</label>
        <textarea id="pr-resumo" name="resumo" rows={2} className={`mt-2 ${campo}`} />
      </div>

      <Aviso r={estado} />

      <button
        type="submit"
        disabled={pendente}
        className="rounded-full bg-magenta px-7 py-3 text-sm font-semibold text-branco transition-colors hover:bg-magenta-forte disabled:opacity-60"
      >
        {pendente ? 'Gerando...' : 'Gerar rascunho'}
      </button>
    </form>
  );
}

/* ------------------------------------------------------------------ */

export function CopiarLink({ slug }: { slug: string }) {
  const [copiado, setCopiado] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        /* `window.location.origin` em vez de uma URL fixa: em
           pré-visualização da Vercel o domínio é outro, e um link
           copiado com o domínio de produção abriria a proposta errada. */
        await navigator.clipboard.writeText(`${window.location.origin}/proposta/${slug}`);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2500);
      }}
      className="inline-flex min-h-[24px] items-center text-xs font-semibold text-magenta-texto underline-offset-4 hover:underline"
    >
      {copiado ? 'copiado ✓' : 'copiar link'}
    </button>
  );
}

export function BotaoStatus({
  id,
  status,
  rotulo,
}: {
  id: string;
  status: string;
  rotulo: string;
}) {
  const [estado, acao, pendente] = useActionState<Resultado | null, FormData>(
    mudarStatusProposta,
    null,
  );

  return (
    <form action={acao} className="inline">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <button
        type="submit"
        disabled={pendente}
        className="rounded-full border border-fio px-3 py-1.5 text-xs font-semibold text-neve transition-colors hover:bg-white/5 disabled:opacity-60"
      >
        {pendente ? '...' : rotulo}
      </button>
      {estado && !estado.ok ? (
        <span className="ml-2 text-xs text-magenta-texto">{estado.mensagem}</span>
      ) : null}
    </form>
  );
}
