'use client';

import { useActionState, useState } from 'react';
import {
  criarCobranca,
  cancelar,
  baixarManual,
  faturarTudo,
  conferirTudo,
  criarDespesa,
  pagarDespesa,
  apagarDespesa,
} from '@/app/painel/acoes-cobranca';
import type { Resultado } from '@/app/painel/acoes';

/**
 * Os formulários do financeiro.
 *
 * Todo botão que mexe em dinheiro tem estado de pendência visível e
 * mensagem de retorno. Ação de cobrança que não diz o que fez faz a
 * pessoa clicar de novo, e o segundo clique numa emissão seria a
 * segunda cobrança no cliente. A idempotência do servidor cobre isso,
 * mas o retorno é o que evita a dúvida antes de virar clique.
 */

const campo =
  'w-full rounded-xl border border-fio bg-white/[0.03] px-4 py-3 text-sm text-branco ' +
  'outline-none transition-colors placeholder:text-cinza/60 focus:border-magenta focus:bg-white/[0.05]';
const rotuloCss = 'block font-mono text-[0.75rem] uppercase tracking-[0.14em] text-cinza';
const pilula =
  'inline-flex min-h-[24px] items-center gap-2 rounded-full border border-fio px-4 py-2 text-xs font-semibold text-neve transition-colors hover:bg-white/5 disabled:opacity-60';
const principal =
  'inline-flex min-h-[24px] items-center gap-2 rounded-full bg-magenta px-5 py-2.5 text-xs font-semibold text-branco transition-colors hover:bg-magenta-forte disabled:opacity-60';

function Aviso({ r, grande = false }: { r: Resultado | null; grande?: boolean }) {
  if (!r) return null;
  if (grande) {
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
  return (
    <p
      role="status"
      className={
        'mt-2 flex items-start gap-2 text-xs leading-relaxed ' +
        (r.ok ? 'text-[#4ADE80]' : 'text-magenta-texto')
      }
    >
      <span aria-hidden className="mt-0.5">{r.ok ? '●' : '■'}</span>
      {r.mensagem}
    </p>
  );
}

/** Fecha o formulário quando a ação dá certo, na renderização. */
function useFechaAoDarCerto(r: Resultado | null, fechar: () => void) {
  const [visto, setVisto] = useState(r);
  if (r !== visto) {
    setVisto(r);
    if (r?.ok) fechar();
  }
}

/* ================================================================== */
/* Ações do mês inteiro                                               */
/* ================================================================== */

export function AcoesDoMes() {
  const [rFat, aFat, pFat] = useActionState<Resultado | null, FormData>(faturarTudo, null);
  const [rConf, aConf, pConf] = useActionState<Resultado | null, FormData>(conferirTudo, null);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <form action={aFat}>
          <button type="submit" disabled={pFat} className={principal}>
            {pFat ? 'Faturando...' : 'Faturar o mês inteiro'}
          </button>
        </form>
        <form action={aConf}>
          <button
            type="submit"
            disabled={pConf}
            title="Puxa do Asaas o estado real de todas as cobranças abertas"
            className={pilula}
          >
            {pConf ? 'Conferindo...' : 'Conferir cobranças'}
          </button>
        </form>
      </div>
      <Aviso r={rFat} grande />
      <Aviso r={rConf} grande />
    </div>
  );
}

/* ================================================================== */
/* Cobrança avulsa                                                    */
/* ================================================================== */

/**
 * @param contaFixa quando o formulário abre dentro da ficha de um
 *   cliente. Ver a nota em `FormContrato`: seletor ali só cria a chance
 *   de cobrar quem não era.
 */
export function FormCobrancaAvulsa({
  lojas = [],
  contaFixa,
  rotuloBotao = 'Nova cobrança',
}: {
  lojas?: { id: string; nome: string; temDocumento: boolean }[];
  contaFixa?: { id: string; nome: string };
  rotuloBotao?: string;
}) {
  const [estado, acao, pendente] = useActionState<Resultado | null, FormData>(
    criarCobranca,
    null,
  );
  const [aberto, setAberto] = useState(false);
  const [parcelas, setParcelas] = useState('1');
  const [valor, setValor] = useState('');

  useFechaAoDarCerto(estado, () => setAberto(false));

  if (!aberto) {
    return (
      <div className="space-y-3">
        <button type="button" onClick={() => setAberto(true)} className={principal}>
          <span aria-hidden className="text-sm leading-none">+</span>
          {rotuloBotao}
        </button>
        {estado?.ok ? <Aviso r={estado} /> : null}
      </div>
    );
  }

  /* A conta da parcela feita aqui, e não deixada para o cliente
     descobrir no boleto. "10x" num valor que não divide redondo vira
     pergunta no WhatsApp. */
  const n = Math.max(1, Math.trunc(Number(parcelas) || 1));
  const bruto = Number(valor.replace(/\./g, '').replace(',', '.'));
  const porParcela =
    n > 1 && Number.isFinite(bruto) && bruto > 0
      ? (bruto / n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      : null;

  return (
    <form action={acao} className="cartao space-y-5 p-6">
      <div>
        <h3 className="font-display text-lg font-bold tracking-[-0.02em]">Nova cobrança</h3>
        <p className="mt-1.5 max-w-[68ch] text-sm leading-relaxed text-cinza">
          Para o que não é o fee do mês: setup, projeto, criativo extra, reembolso de mídia.
          Sai no Asaas na hora, e o cliente escolhe entre PIX, boleto e cartão.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="cb-loja" className={rotuloCss}>Cliente *</label>
          {contaFixa ? (
            <>
              <input type="hidden" name="conta_id" value={contaFixa.id} />
              <p className="mt-2 rounded-xl border border-fio bg-white/[0.03] px-4 py-3 text-sm font-semibold text-branco">
                {contaFixa.nome}
              </p>
            </>
          ) : (
            <select id="cb-loja" name="conta_id" required className={`mt-2 ${campo}`}>
              <option value="">Escolha</option>
              {lojas.map((l) => (
                <option key={l.id} value={l.id} disabled={!l.temDocumento}>
                  {l.nome}
                  {l.temDocumento ? '' : ' — sem CNPJ'}
                </option>
              ))}
            </select>
          )}
          <p className="mt-1.5 text-xs leading-relaxed text-cinza">
            Cliente sem CNPJ ou CPF fica travado: o Asaas exige documento para emitir.
          </p>
        </div>

        <div>
          <label htmlFor="cb-desc" className={rotuloCss}>O que está cobrando *</label>
          <input
            id="cb-desc"
            name="descricao"
            required
            placeholder="Setup da loja"
            className={`mt-2 ${campo}`}
          />
          <p className="mt-1.5 text-xs leading-relaxed text-cinza">
            É o texto que o cliente lê no e-mail e no boleto.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label htmlFor="cb-valor" className={rotuloCss}>Valor total *</label>
          <input
            id="cb-valor"
            name="valor"
            required
            inputMode="decimal"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder="1.500"
            className={`mt-2 ${campo}`}
          />
        </div>
        <div>
          <label htmlFor="cb-venc" className={rotuloCss}>Vencimento *</label>
          <input id="cb-venc" name="vencimento" type="date" required className={`mt-2 ${campo}`} />
        </div>
        <div>
          <label htmlFor="cb-parc" className={rotuloCss}>Parcelas</label>
          <input
            id="cb-parc"
            name="parcelas"
            inputMode="numeric"
            value={parcelas}
            onChange={(e) => setParcelas(e.target.value)}
            className={`mt-2 ${campo}`}
          />
          <p className="mt-1.5 text-xs leading-relaxed text-cinza">
            {porParcela ? `${n}x de ${porParcela}` : 'Uma parcela é o normal.'}
          </p>
        </div>
      </div>

      <Aviso r={estado} grande />

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={pendente}
          className="rounded-full bg-magenta px-7 py-3 text-sm font-semibold text-branco transition-colors hover:bg-magenta-forte disabled:opacity-60"
        >
          {pendente ? 'Emitindo...' : 'Emitir cobrança'}
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
/* O que se faz com uma fatura                                        */
/* ================================================================== */

export function AcoesFatura({
  faturaId,
  paga,
  cancelada,
  hoje,
}: {
  faturaId: string;
  paga: boolean;
  cancelada: boolean;
  /** Data de hoje vinda do servidor: `new Date()` no render é impuro. */
  hoje: string;
}) {
  const [aba, setAba] = useState<null | 'baixa' | 'cancelar'>(null);
  const [rBaixa, aBaixa, pBaixa] = useActionState<Resultado | null, FormData>(
    baixarManual,
    null,
  );
  const [rCanc, aCanc, pCanc] = useActionState<Resultado | null, FormData>(cancelar, null);

  const feito = rBaixa?.ok ? rBaixa : rCanc?.ok ? rCanc : null;
  useFechaAoDarCerto(feito, () => setAba(null));

  if (paga || cancelada) {
    return feito ? <Aviso r={feito} /> : null;
  }

  if (aba === 'baixa') {
    return (
      <form action={aBaixa} className="space-y-2.5 rounded-xl border border-fio bg-white/[0.02] p-3.5">
        <input type="hidden" name="fatura_id" value={faturaId} />
        <p className="text-xs leading-relaxed text-cinza">
          Para quando o cliente pagou por fora, como PIX direto na conta. O Asaas é avisado
          junto, para os dois lados continuarem contando a mesma coisa.
        </p>
        <label className={rotuloCss}>Entrou em</label>
        <input name="data" type="date" required defaultValue={hoje} className={campo} />
        <Aviso r={rBaixa} />
        <div className="flex flex-wrap gap-2">
          <button type="submit" disabled={pBaixa} className={principal}>
            {pBaixa ? 'Baixando...' : 'Confirmar recebimento'}
          </button>
          <button type="button" onClick={() => setAba(null)} className={pilula}>
            Voltar
          </button>
        </div>
      </form>
    );
  }

  if (aba === 'cancelar') {
    return (
      <form action={aCanc} className="space-y-2.5 rounded-xl border border-fio bg-white/[0.02] p-3.5">
        <input type="hidden" name="fatura_id" value={faturaId} />
        <p className="text-xs leading-relaxed text-cinza">
          Cancela aqui e no Asaas. O cliente para de receber lembrete, e a fatura continua
          no histórico marcada como cancelada.
        </p>
        <Aviso r={rCanc} />
        <div className="flex flex-wrap gap-2">
          <button type="submit" disabled={pCanc} className={principal}>
            {pCanc ? 'Cancelando...' : 'Confirmar cancelamento'}
          </button>
          <button type="button" onClick={() => setAba(null)} className={pilula}>
            Voltar
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={() => setAba('baixa')} className={pilula}>
        Recebi por fora
      </button>
      <button
        type="button"
        onClick={() => setAba('cancelar')}
        className="inline-flex min-h-[24px] items-center rounded-full border border-fio px-4 py-2 text-xs font-semibold text-cinza transition-colors hover:bg-white/5 hover:text-magenta-texto"
      >
        Cancelar
      </button>
    </div>
  );
}

/**
 * Manda o link de pagamento no WhatsApp do cliente.
 *
 * A régua de cobrança da agência é o WhatsApp, e não o e-mail que o
 * Asaas dispara — que é onde ele costuma morrer. O texto já vai pronto
 * para não depender de alguém escrever bem às sete da noite.
 */
export function LembrarWhatsApp({
  telefone,
  loja,
  numero,
  vencimento,
  valor,
  link,
  atrasada,
}: {
  telefone: string | null;
  loja: string;
  numero: string;
  vencimento: string;
  valor: string;
  link: string | null;
  atrasada: boolean;
}) {
  const [dia, mes] = [vencimento.slice(8, 10), vencimento.slice(5, 7)];

  const texto =
    `Oi! Aqui é da Psy Comunic.\n\n` +
    (atrasada
      ? `A cobrança ${numero} de ${loja}, no valor de ${valor}, venceu em ${dia}/${mes}.`
      : `Passando o link da cobrança ${numero} de ${loja}, no valor de ${valor}, com vencimento em ${dia}/${mes}.`) +
    (link ? `\n\n${link}` : '') +
    `\n\nQualquer coisa é só chamar por aqui.`;

  /* Sem telefone, abre o WhatsApp sem destinatário: a pessoa escolhe o
     contato. Melhor que esconder o botão e obrigar a copiar à mão. */
  const url = telefone
    ? `https://wa.me/55${telefone.replace(/\D/g, '')}?text=${encodeURIComponent(texto)}`
    : `https://wa.me/?text=${encodeURIComponent(texto)}`;

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={pilula}>
      Cobrar no WhatsApp
    </a>
  );
}

/** Copia o link de pagamento. */
export function CopiarTexto({ texto, rotulo }: { texto: string; rotulo: string }) {
  const [copiado, setCopiado] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(texto);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2500);
      }}
      className="inline-flex min-h-[24px] items-center text-xs font-semibold text-magenta-texto underline-offset-4 hover:underline"
    >
      {copiado ? 'copiado ✓' : rotulo}
    </button>
  );
}

/* ================================================================== */
/* Despesas                                                           */
/* ================================================================== */

export function FormDespesa({
  lojas,
  categorias,
}: {
  lojas: { id: string; nome: string }[];
  categorias: string[];
}) {
  const [estado, acao, pendente] = useActionState<Resultado | null, FormData>(
    criarDespesa,
    null,
  );
  const [aberto, setAberto] = useState(false);

  useFechaAoDarCerto(estado, () => setAberto(false));

  if (!aberto) {
    return (
      <div className="space-y-3">
        <button type="button" onClick={() => setAberto(true)} className={principal}>
          <span aria-hidden className="text-sm leading-none">+</span>
          Nova despesa
        </button>
        {estado?.ok ? <Aviso r={estado} /> : null}
      </div>
    );
  }

  return (
    <form action={acao} className="cartao space-y-5 p-6">
      <div>
        <h3 className="font-display text-lg font-bold tracking-[-0.02em]">Nova despesa</h3>
        <p className="mt-1.5 max-w-[68ch] text-sm leading-relaxed text-cinza">
          É o que transforma faturamento em resultado. Ferramenta, salário, imposto,
          mídia paga do próprio bolso.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="dp-desc" className={rotuloCss}>Descrição *</label>
          <input
            id="dp-desc"
            name="descricao"
            required
            placeholder="Assinatura do Meta Business"
            className={`mt-2 ${campo}`}
          />
        </div>
        <div>
          <label htmlFor="dp-cat" className={rotuloCss}>Categoria</label>
          <input
            id="dp-cat"
            name="categoria"
            list="categorias-despesa"
            placeholder="ferramentas"
            className={`mt-2 ${campo}`}
          />
          <datalist id="categorias-despesa">
            {['ferramentas', 'pessoal', 'impostos', 'mídia', 'escritório', ...categorias]
              .filter((c, i, t) => t.indexOf(c) === i)
              .map((c) => (
                <option key={c} value={c} />
              ))}
          </datalist>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label htmlFor="dp-valor" className={rotuloCss}>Valor *</label>
          <input
            id="dp-valor"
            name="valor"
            required
            inputMode="decimal"
            placeholder="890"
            className={`mt-2 ${campo}`}
          />
        </div>
        <div>
          <label htmlFor="dp-venc" className={rotuloCss}>Vencimento *</label>
          <input id="dp-venc" name="vencimento" type="date" required className={`mt-2 ${campo}`} />
        </div>
        <div>
          <label htmlFor="dp-loja" className={rotuloCss}>Cliente</label>
          <select id="dp-loja" name="conta_id" className={`mt-2 ${campo}`}>
            <option value="">Da agência</option>
            {lojas.map((l) => (
              <option key={l.id} value={l.id}>{l.nome}</option>
            ))}
          </select>
          <p className="mt-1.5 text-xs leading-relaxed text-cinza">
            Só quando a despesa é de um cliente específico.
          </p>
        </div>
      </div>

      <Aviso r={estado} grande />

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={pendente}
          className="rounded-full bg-magenta px-7 py-3 text-sm font-semibold text-branco transition-colors hover:bg-magenta-forte disabled:opacity-60"
        >
          {pendente ? 'Lançando...' : 'Lançar despesa'}
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

export function AcoesDespesa({
  id,
  paga,
  hoje,
  podeExcluir,
}: {
  id: string;
  paga: boolean;
  hoje: string;
  podeExcluir: boolean;
}) {
  const [aba, setAba] = useState<null | 'pagar'>(null);
  const [rPagar, aPagar, pPagar] = useActionState<Resultado | null, FormData>(
    pagarDespesa,
    null,
  );
  const [rApagar, aApagar, pApagar] = useActionState<Resultado | null, FormData>(
    apagarDespesa,
    null,
  );

  useFechaAoDarCerto(rPagar, () => setAba(null));

  if (aba === 'pagar') {
    return (
      <form action={aPagar} className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="id" value={id} />
        <div>
          <label className={rotuloCss}>Pago em</label>
          <input
            name="pago_em"
            type="date"
            required
            defaultValue={hoje}
            className={`mt-1.5 ${campo}`}
          />
        </div>
        <button type="submit" disabled={pPagar} className={principal}>
          {pPagar ? 'Baixando...' : 'Confirmar'}
        </button>
        <button type="button" onClick={() => setAba(null)} className={pilula}>
          Voltar
        </button>
        <Aviso r={rPagar} />
      </form>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {paga ? null : (
        <button type="button" onClick={() => setAba('pagar')} className={pilula}>
          Marcar paga
        </button>
      )}
      {podeExcluir ? (
        <form action={aApagar} className="inline">
          <input type="hidden" name="id" value={id} />
          <button
            type="submit"
            disabled={pApagar}
            className="inline-flex min-h-[24px] items-center rounded-full border border-fio px-4 py-2 text-xs text-cinza transition-colors hover:bg-white/5 hover:text-magenta-texto disabled:opacity-60"
          >
            {pApagar ? 'Removendo...' : 'Remover'}
          </button>
        </form>
      ) : null}
      <Aviso r={rPagar?.ok ? rPagar : rApagar} />
    </div>
  );
}
