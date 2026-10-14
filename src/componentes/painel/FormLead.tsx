'use client';

import { useActionState, useState } from 'react';
import { criarLead } from '@/app/painel/acoes-crm';
import type { Resultado } from '@/app/painel/acoes';
import { ESTAGIOS, rotuloEstagio, SERVICOS_AVULSOS, type Cobranca } from '@/lib/dados/tipos';

const campo =
  'w-full rounded-xl border border-fio bg-white/[0.03] px-4 py-3 text-sm text-branco ' +
  'outline-none transition-colors placeholder:text-cinza/60 focus:border-magenta focus:bg-white/[0.05]';
const rotuloCss = 'block font-mono text-[0.75rem] uppercase tracking-[0.14em] text-cinza';

/* Origens comuns, para não digitar. A lista é sugestão, e o campo
   aceita qualquer texto: engessar a origem faria o comercial escolher
   "outro" para tudo, e aí a coluna deixa de informar. */
const ORIGENS = [
  'Indicação',
  'Instagram',
  'Google',
  'Prospecção ativa',
  'Evento',
  'Site',
  'WhatsApp',
];

/**
 * Captação de lead.
 *
 * ============================================================
 * SÓ O NOME É OBRIGATÓRIO
 * ============================================================
 * Formulário que exige e-mail, telefone e valor antes de deixar salvar
 * empurra o comercial de volta para o bloco de notas, e é lá que o lead
 * morre. O resto se preenche conforme a conversa acontece.
 *
 * Nasce numa dobra fechada porque a tela do CRM existe para LER o
 * funil. Um formulário sempre aberto empurraria o quadro para baixo da
 * dobra em toda visita.
 */
export function FormLead() {
  const [estado, acao, pendente] = useActionState<Resultado | null, FormData>(criarLead, null);
  const [aberto, setAberto] = useState(false);
  /* Mensalidade no padrão: é o que a Psy Comunic mais vende, e o campo
     que abre preenchido certo é um campo que ninguém erra com pressa. */
  const [cobranca, setCobranca] = useState<Cobranca>('mensal');

  /*
    Fecha depois do sucesso, e só depois dele: fechar no envio apagaria
    o que alguém escreveu e esbarrou numa validação.

    O ajuste acontece no RENDER, comparando com o último resultado já
    visto, e não num `useEffect`. Chamar `setState` dentro de efeito
    causa um segundo render depois da tela já ter pintado, e o lint do
    React barra por isso. Ajustar no render é o padrão documentado para
    "derivar estado de algo que mudou".

    Também não há `reset()` de formulário: fechar DESMONTA o form, e os
    campos nascem limpos na próxima abertura.
  */
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
          Novo lead
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
        <h3 className="font-display text-lg font-bold tracking-[-0.02em]">Novo lead</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-cinza">
          Só o nome é obrigatório. O resto entra conforme a conversa avança.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="l-nome" className={rotuloCss}>Com quem você falou *</label>
          <input id="l-nome" name="nome" required autoFocus placeholder="Mariana Souza" className={`mt-2 ${campo}`} />
        </div>
        <div>
          <label htmlFor="l-empresa" className={rotuloCss}>Loja</label>
          <input id="l-empresa" name="empresa" placeholder="Loja Aurora" className={`mt-2 ${campo}`} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label htmlFor="l-email" className={rotuloCss}>E-mail</label>
          <input id="l-email" name="email" type="email" className={`mt-2 ${campo}`} />
        </div>
        <div>
          <label htmlFor="l-tel" className={rotuloCss}>WhatsApp</label>
          <input id="l-tel" name="telefone" inputMode="tel" placeholder="47 99999-0000" className={`mt-2 ${campo}`} />
        </div>
        <div>
          <label htmlFor="l-origem" className={rotuloCss}>Como chegou</label>
          <input id="l-origem" name="origem" list="origens-lead" placeholder="Indicação" className={`mt-2 ${campo}`} />
          <datalist id="origens-lead">
            {ORIGENS.map((o) => (
              <option key={o} value={o} />
            ))}
          </datalist>
        </div>
      </div>

      {/*
        MENSALIDADE OU TRABALHO AVULSO, ANTES DO VALOR

        A pergunta vem ANTES do campo de dinheiro porque é ela que diz
        o que o número significa. R$ 3.500 de site e R$ 3.500 de fee
        são grandezas diferentes, e o funil fecha as duas em totais
        separados: somar obra com mensalidade produziria um número que
        não existe em lugar nenhum.
      */}
      <fieldset>
        <legend className={rotuloCss}>O que está sendo vendido</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {([
            { v: 'mensal' as const, t: 'Mensalidade', d: 'Tráfego, conteúdo, sustentação. Recomeça todo mês.' },
            { v: 'projeto' as const, t: 'Trabalho avulso', d: 'Site, landing page, identidade visual, SEO. Pagamento único.' },
          ]).map((o) => (
            <label
              key={o.v}
              className={
                'cursor-pointer rounded-xl border p-4 transition-colors ' +
                (cobranca === o.v ? 'border-magenta bg-magenta/10' : 'border-fio bg-white/[0.02]')
              }
            >
              <span className="flex items-center gap-2.5">
                <input
                  type="radio"
                  name="cobranca"
                  value={o.v}
                  checked={cobranca === o.v}
                  onChange={() => setCobranca(o.v)}
                  className="h-4 w-4 accent-[var(--magenta)]"
                />
                <span className="font-display text-base font-bold">{o.t}</span>
              </span>
              <span className="mt-1.5 block text-xs leading-relaxed text-cinza">{o.d}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 md:grid-cols-4">
        <div>
          <label htmlFor="l-estagio" className={rotuloCss}>Estágio</label>
          <select id="l-estagio" name="estagio" defaultValue="novo" className={`mt-2 ${campo}`}>
            {ESTAGIOS.filter((e) => e !== 'ganho' && e !== 'perdido').map((e) => (
              <option key={e} value={e}>
                {rotuloEstagio[e]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="l-fee" className={rotuloCss}>
            {cobranca === 'projeto' ? 'Valor do projeto' : 'Fee mensal'}
          </label>
          <input
            id="l-fee"
            name="valor_fee_estimado"
            inputMode="decimal"
            placeholder={cobranca === 'projeto' ? '3500' : '5000'}
            className={`mt-2 ${campo}`}
          />
          <p className="mt-1.5 text-xs leading-relaxed text-cinza">
            {cobranca === 'projeto' ? 'Cobrado uma vez.' : 'Todo mês, enquanto durar.'}
          </p>
        </div>

        {/*
          `hidden`, e NÃO desmontado.

          Campo que sai da árvore não entra no FormData, e o esquema
          recebe `undefined` onde espera texto. Já custou uma tarde:
          cada clique em salvar dizia "expected string, received
          undefined" sem dizer de qual campo.
        */}
        <div className={cobranca === 'projeto' ? 'hidden' : ''}>
          <label htmlFor="l-verba" className={rotuloCss}>Verba estimada</label>
          <input id="l-verba" name="valor_verba_estimada" inputMode="decimal" placeholder="15000" className={`mt-2 ${campo}`} />
          {/* O aviso onde a dúvida nasce: são dois dinheiros de donos
              diferentes, e o sistema inteiro depende de não os somar. */}
          <p className="mt-1.5 text-xs leading-relaxed text-cinza">
            Verba é do cliente e nunca entra no fee.
          </p>
        </div>

        <div className={cobranca === 'projeto' ? '' : 'hidden'}>
          <label htmlFor="l-servico" className={rotuloCss}>Serviço</label>
          <input
            id="l-servico"
            name="servico"
            list="servicos-avulsos"
            placeholder="Criação de site"
            className={`mt-2 ${campo}`}
          />
          <datalist id="servicos-avulsos">
            {SERVICOS_AVULSOS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
          <p className="mt-1.5 text-xs leading-relaxed text-cinza">
            A lista é sugestão. Pode escrever qualquer coisa.
          </p>
        </div>
        <div>
          <label htmlFor="l-prob" className={rotuloCss}>Probabilidade</label>
          <input
            id="l-prob"
            name="probabilidade"
            type="number"
            min={0}
            max={100}
            placeholder="50"
            className={`mt-2 ${campo}`}
          />
          <p className="mt-1.5 text-xs leading-relaxed text-cinza">
            É ela que pondera a previsão do funil.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
        <div>
          <label htmlFor="l-passo" className={rotuloCss}>Próximo passo</label>
          <input
            id="l-passo"
            name="proximo_passo"
            placeholder="Mandar diagnóstico do checkout"
            className={`mt-2 ${campo}`}
          />
        </div>
        <div>
          <label htmlFor="l-quando" className={rotuloCss}>Quando</label>
          <input id="l-quando" name="proximo_passo_em" type="date" className={`mt-2 ${campo}`} />
        </div>
      </div>

      {estado && !estado.ok ? (
        <p
          role="status"
          className="flex items-start gap-3 rounded-xl border border-magenta/40 bg-magenta/10 px-4 py-3 text-sm text-magenta-texto"
        >
          <span aria-hidden className="mt-0.5">■</span>
          {estado.mensagem}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={pendente}
          className="rounded-full bg-magenta px-7 py-3 text-sm font-semibold text-branco transition-colors hover:bg-magenta-forte disabled:opacity-60"
        >
          {pendente ? 'Salvando...' : 'Colocar no funil'}
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
