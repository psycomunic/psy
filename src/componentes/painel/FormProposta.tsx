'use client';

import { useActionState, useState } from 'react';
import {
  gerarProposta,
  editarProposta,
  apagarProposta,
  mudarStatusProposta,
} from '@/app/painel/acoes-proposta';
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

/** Serviço avulso do catálogo. Sem preço: o valor de gestão de tráfego
    muda por cliente, e é campo desta proposta, não do catálogo. */
export type OpcaoServico = {
  id: string;
  nome: string;
  papel: 'principal' | 'complemento';
  paraQuem: string;
  /** Preenche o campo de valor quando o servico tem tabela. */
  precoSugerido: number | null;
};

/** A proposta que está sendo editada. Ausente quando é uma nova. */
export type PropostaEmEdicao = {
  id: string;
  cliente: string;
  contato: string;
  resumo: string;
  validadeDias: number;
  plano: string | null;
  servicos: { id: string; fee: number }[];
  diagnostico: string[];
  proximosPassos: string[];
  status: string;
};

/** O lead de origem, quando a proposta nasce do funil. */
export type LeadDeOrigem = {
  id: string;
  cliente: string;
  contato: string;
  fee: number | null;
};

export function FormProposta({
  planos,
  servicos,
  lead = null,
  editando = null,
}: {
  planos: OpcaoPlano[];
  servicos: OpcaoServico[];
  lead?: LeadDeOrigem | null;
  editando?: PropostaEmEdicao | null;
}) {
  /* Um formulário só para criar e editar. Dois divergiriam na primeira
     vez que um campo mudasse, e a divergência apareceria como campo que
     existe na criação e some na edição. */
  const [estado, acao, pendente] = useActionState<Resultado | null, FormData>(
    editando ? editarProposta : gerarProposta,
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

  const [escolhido, setEscolhido] = useState(editando?.plano ?? sugerido);

  /*
    O modo começa em "pacote" porque é o caso mais antigo e o que já
    tinha fluxo. Um lead cujo fee negociado fica abaixo do menor pacote
    quase certamente não é loja virtual: começar em pacote ali obrigaria
    a corrigir a tela toda vez.
  */
  const [modo, setModo] = useState<'plano' | 'servicos'>(() => {
    const menorPacote = Math.min(
      ...planos.map((p) => Number(p.fee.replace(/\D/g, '')) || Infinity),
    );
    if (editando) return editando.servicos.length > 0 ? 'servicos' : 'plano';
    return lead?.fee && lead.fee < menorPacote ? 'servicos' : 'plano';
  });

  const [escolhidos, setEscolhidos] = useState<Record<string, boolean>>(() =>
    /* O principal já vem marcado: é o que a pessoa quase sempre quer, e
       o complemento é decisão consciente. */
    Object.fromEntries(
      servicos.map((s) => [
        s.id,
        editando
          ? editando.servicos.some((x) => x.id === s.id)
          : s.papel === 'principal',
      ]),
    ),
  );

  return (
    <form action={acao} className="cartao space-y-6 p-6 md:p-8">
      {lead ? <input type="hidden" name="lead_id" value={lead.id} /> : null}
      {editando ? <input type="hidden" name="id" value={editando.id} /> : null}

      <div>
        <h3 className="font-display text-lg font-bold tracking-[-0.02em]">
          {editando
            ? `Editando a proposta de ${editando.cliente}`
            : lead
              ? `Proposta para ${lead.cliente}`
              : 'Gerar link de proposta'}
        </h3>
        <p className="mt-2 max-w-[68ch] text-sm leading-relaxed text-cinza">
          {editando
            ? editando.status === 'rascunho'
              ? 'O link continua fechado enquanto for rascunho. Salvar aqui não publica nada.'
              : 'Esta proposta já está publicada. O que você salvar aqui passa a ser o que o cliente vê no mesmo link.'
            : lead
              ? 'Veio do funil, então os dados já estão preenchidos e a proposta fica ligada ao lead. O link nasce como rascunho e não abre para ninguém até você publicar.'
              : 'O link nasce como rascunho e não abre para ninguém até você publicar. Por padrão a página mostra só o plano recomendado.'}
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label htmlFor="pr-cliente" className={rotuloCss}>Cliente *</label>
          <input
            id="pr-cliente"
            name="cliente"
            required
            defaultValue={editando?.cliente ?? lead?.cliente ?? ''}
            placeholder="Carol Abreu Advocacia"
            className={`mt-2 ${campo}`}
          />
        </div>
        <div>
          <label htmlFor="pr-contato" className={rotuloCss}>Com quem você está falando *</label>
          <input
            id="pr-contato"
            name="contato"
            required
            defaultValue={editando?.contato ?? lead?.contato ?? ''}
            placeholder="Mariana, sócia"
            className={`mt-2 ${campo}`}
          />
        </div>
      </div>

      {/*
        As duas formas de propor, e nunca as duas juntas.

        Pacote é para loja virtual e começa em R$ 5.000. Serviço avulso
        é para quem compra uma coisa só, em qualquer nicho: advogada que
        vende curso, clínica, chalé, concessionária. Aí o valor é desta
        negociação, e não de uma tabela.

        O seletor é um radio, e não duas abas independentes, justamente
        para o formulário não conseguir enviar as duas coisas.
      */}
      <fieldset>
        <legend className={rotuloCss}>O que você está propondo *</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {[
            {
              k: 'plano' as const,
              t: 'Pacote de e-commerce',
              d: 'Saturno, Falcon ou Apollo. Para loja virtual, com as quatro frentes.',
            },
            {
              k: 'servicos' as const,
              t: 'Serviço avulso',
              d: 'Gestão de tráfego, com criação de conteúdo por cima se o cliente precisar. Serve para qualquer nicho. Valor desta proposta.',
            },
          ].map((m) => (
            <label
              key={m.k}
              className={
                'cursor-pointer rounded-xl border p-4 transition-colors ' +
                (modo === m.k
                  ? 'border-magenta bg-magenta/10'
                  : 'border-fio bg-white/[0.02] hover:bg-white/[0.05]')
              }
            >
              <input
                type="radio"
                name="modo"
                value={m.k}
                checked={modo === m.k}
                onChange={() => setModo(m.k)}
                className="sr-only"
              />
              <span className="font-display text-base font-bold">{m.t}</span>
              <span className="mt-2 block text-xs leading-relaxed text-cinza">{m.d}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {modo === 'servicos' ? (
        <fieldset>
          <legend className={rotuloCss}>Serviços e valores *</legend>
          <p className="mt-2 max-w-[70ch] text-xs leading-relaxed text-cinza">
            O que cada serviço entrega está no catálogo e aparece igual em toda proposta. O
            valor é desta: gestão de tráfego para quem vende curso e para uma
            concessionária não custam o mesmo, e uma tabela fixa aqui viraria preço que
            ninguém cumpre.
          </p>

          <div className="mt-3 space-y-3">
            {servicos.map((s) => {
              const marcado = escolhidos[s.id] ?? false;
              return (
                <div
                  key={s.id}
                  className={
                    'rounded-xl border p-4 transition-colors ' +
                    (marcado ? 'border-magenta bg-magenta/10' : 'border-fio bg-white/[0.02]')
                  }
                >
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      name={`servico_${s.id}`}
                      checked={marcado}
                      onChange={(e) =>
                        setEscolhidos((a) => ({ ...a, [s.id]: e.target.checked }))
                      }
                      className="mt-1 h-4 w-4 flex-none accent-[var(--magenta)]"
                    />
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-display text-base font-bold">{s.nome}</span>
                        {s.papel === 'complemento' ? (
                          <span className="rounded-full border border-fio px-2.5 py-0.5 font-mono text-[0.7rem] uppercase tracking-[0.12em] text-cinza">
                            complemento
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-1.5 block text-xs leading-relaxed text-cinza">
                        {s.paraQuem}
                      </span>
                    </span>
                  </label>

                  {marcado ? (
                    <div className="mt-3.5 border-t border-fio pt-3.5">
                      <label htmlFor={`fee-${s.id}`} className={rotuloCss}>
                        Valor mensal
                      </label>
                      <input
                        id={`fee-${s.id}`}
                        name={`fee_${s.id}`}
                        inputMode="decimal"
                        defaultValue={(() => {
                          const jaTem = editando?.servicos.find((x) => x.id === s.id);
                          if (jaTem) return jaTem.fee.toLocaleString('pt-BR');
                          return s.precoSugerido
                            ? s.precoSugerido.toLocaleString('pt-BR')
                            : '';
                        })()}
                        placeholder="1.800"
                        className={`mt-2 ${campo}`}
                      />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </fieldset>
      ) : null}

      <fieldset className={modo === 'servicos' ? 'hidden' : ''}>
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
          defaultValue={editando?.diagnostico.join('\n') ?? ''}
          placeholder={'Tráfego chega, mas a conversão fica abaixo da média do segmento.\nCheckout com etapas demais e sem recuperação de carrinho.\nMídia sem leitura de ROI por canal.'}
          className={`mt-2 ${campo}`}
        />
        <p className="mt-1.5 text-xs leading-relaxed text-cinza">
          É a parte que faz a proposta parecer feita para este cliente, e não um modelo. Vale
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
            defaultValue={editando?.proximosPassos.join('\n') ?? ''}
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
            defaultValue={editando?.validadeDias ?? 15}
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
        {pendente
          ? editando
            ? 'Salvando...'
            : 'Gerando...'
          : editando
            ? 'Salvar alterações'
            : 'Gerar rascunho'}
      </button>
    </form>
  );
}

/* ------------------------------------------------------------------ */

/**
 * Copia o link, com a versão junto.
 *
 * ============================================================
 * POR QUE O `?v=` EXISTE
 * ============================================================
 * O WhatsApp guarda a prévia do link nos servidores dele, e a chave
 * desse cache é a URL exata. Editada a proposta, quem recebe o mesmo
 * endereço continua vendo o cartão antigo: o título de antes, o valor
 * de antes, às vezes o nome do cliente errado.
 *
 * A versão sobe a cada edição, então o link copiado muda junto e a
 * prévia é remontada. É uma URL diferente para o cache deles e a mesma
 * página para o servidor, que ignora o parâmetro.
 *
 * Também resolve o caso de agora: um link já compartilhado antes de a
 * prévia existir sai daqui com `?v=1` e é tratado como novo.
 */
export function CopiarLink({ slug, versao = 1 }: { slug: string; versao?: number }) {
  const [copiado, setCopiado] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        /* `window.location.origin` em vez de uma URL fixa: em
           pré-visualização da Vercel o domínio é outro, e um link
           copiado com o domínio de produção abriria a proposta errada. */
        await navigator.clipboard.writeText(
          `${window.location.origin}/proposta/${slug}?v=${versao}`,
        );
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

/**
 * Remover, com confirmação em dois passos.
 *
 * Botão de apagar que apaga no primeiro clique é como se apaga por
 * engano. O segundo clique não é burocracia: é o intervalo em que dá
 * para perceber que era a linha de cima.
 */
export function BotaoApagarProposta({ id, cliente }: { id: string; cliente: string }) {
  const [estado, acao, pendente] = useActionState<Resultado | null, FormData>(
    apagarProposta,
    null,
  );
  const [confirmando, setConfirmando] = useState(false);

  if (estado && !estado.ok) {
    return (
      <span role="status" className="text-xs font-semibold leading-relaxed text-magenta-texto">
        <span aria-hidden className="mr-1.5">■</span>
        {estado.mensagem}
      </span>
    );
  }

  if (!confirmando) {
    return (
      <button
        type="button"
        onClick={() => setConfirmando(true)}
        className="rounded-full border border-fio px-3 py-1.5 text-xs font-semibold text-cinza transition-colors hover:bg-white/5 hover:text-magenta-texto"
      >
        Remover
      </button>
    );
  }

  return (
    <form action={acao} className="inline-flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <span className="text-xs text-cinza">Apagar a de {cliente}?</span>
      <button
        type="submit"
        disabled={pendente}
        className="rounded-full bg-magenta px-3 py-1.5 text-xs font-semibold text-branco transition-colors hover:bg-magenta-forte disabled:opacity-60"
      >
        {pendente ? 'Apagando...' : 'Sim, apagar'}
      </button>
      <button
        type="button"
        onClick={() => setConfirmando(false)}
        className="rounded-full border border-fio px-3 py-1.5 text-xs text-neve transition-colors hover:bg-white/5"
      >
        Não
      </button>
    </form>
  );
}
