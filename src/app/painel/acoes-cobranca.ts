'use server';

import { revalidatePath } from 'next/cache';
import { sessaoAtual, clienteServidor } from '@/lib/supabase/servidor';
import {
  faturarContrato,
  cobrarFatura,
  conferirFatura,
  criarCobrancaAvulsa,
  cancelarFatura,
  receberForaDoAsaas,
  faturarTodos,
  conferirTodas,
} from '@/lib/cobranca/faturamento';
import {
  esquemaCobrancaAvulsa,
  esquemaBaixaManual,
  esquemaDespesa,
  esquemaPagarDespesa,
  esquemaId,
  validar,
} from '@/lib/validacao/painel';
import { hojeBR } from '@/lib/datas';
import type { Resultado } from './acoes';

/**
 * Cobrança: emitir, cobrar e conferir.
 *
 * Dinheiro é o módulo mais estreito da plataforma. Só administrador e
 * financeiro passam daqui, e a checagem é a primeira linha de todas as
 * ações: a conversa com o Asaas usa a service role, então o RLS não
 * está atrás para consertar um esquecimento.
 */

async function exigirFinanceiro() {
  const sessao = await sessaoAtual();
  if (!sessao) throw new Error('Sessão expirada. Entre de novo.');
  if (sessao.papel !== 'administrador' && sessao.papel !== 'financeiro') {
    throw new Error('Só administrador e financeiro emitem cobrança.');
  }
  return sessao;
}

function atualizarTelas() {
  revalidatePath('/painel/financeiro');
  revalidatePath('/painel/visao');
  revalidatePath('/painel/contas');
}

/**
 * Fatura o mês de um contrato e emite a cobrança.
 *
 * A competência vem de `hojeBR()`, e não de um campo: faturar "o mês
 * passado por engano" é o tipo de erro que o cliente descobre antes da
 * agência. Para meses anteriores existe a emissão por fatura, feita a
 * partir de uma linha que já está na tela.
 */
export async function faturarMes(
  _anterior: Resultado | null,
  fd: FormData,
): Promise<Resultado> {
  try {
    await exigirFinanceiro();

    const contratoId = String(fd.get('contrato_id') ?? '');
    if (!contratoId) return { ok: false, mensagem: 'Contrato não informado.' };

    const competencia = `${hojeBR().slice(0, 7)}-01`;
    const r = await faturarContrato(contratoId, competencia);

    atualizarTelas();
    return { ok: r.ok, mensagem: r.mensagem };
  } catch (e) {
    return { ok: false, mensagem: (e as Error).message };
  }
}

/** Emite a cobrança de uma fatura que já existe. */
export async function cobrar(
  _anterior: Resultado | null,
  fd: FormData,
): Promise<Resultado> {
  try {
    await exigirFinanceiro();

    const faturaId = String(fd.get('fatura_id') ?? '');
    if (!faturaId) return { ok: false, mensagem: 'Fatura não informada.' };

    const r = await cobrarFatura(faturaId);
    atualizarTelas();
    return { ok: r.ok, mensagem: r.mensagem };
  } catch (e) {
    return { ok: false, mensagem: (e as Error).message };
  }
}

/**
 * Puxa do Asaas o estado real da cobrança.
 *
 * Existe porque webhook se perde: rede cai, deploy acontece no meio, a
 * rota fica fora do ar por dois minutos. Sem um caminho de puxar, uma
 * fatura paga fica "enviada" para sempre e alguém cobra um cliente que
 * já pagou.
 */
export async function conferir(
  _anterior: Resultado | null,
  fd: FormData,
): Promise<Resultado> {
  try {
    await exigirFinanceiro();

    const faturaId = String(fd.get('fatura_id') ?? '');
    if (!faturaId) return { ok: false, mensagem: 'Fatura não informada.' };

    const r = await conferirFatura(faturaId);
    atualizarTelas();
    return { ok: r.ok, mensagem: r.mensagem };
  } catch (e) {
    return { ok: false, mensagem: (e as Error).message };
  }
}

/* ------------------------------------------------------------------ */
/* Cobrança avulsa                                                     */
/* ------------------------------------------------------------------ */

/**
 * Cobra o que não é fee do mês: setup, projeto, extra, reembolso.
 *
 * Sem isto, essas cobranças eram feitas à mão no site do Asaas. O
 * problema não era o trabalho: era que elas não entravam em nenhum
 * indicador, e ninguém tinha uma lista para conferir se foram pagas.
 */
export async function criarCobranca(
  _anterior: Resultado | null,
  fd: FormData,
): Promise<Resultado> {
  try {
    await exigirFinanceiro();

    const v = validar(esquemaCobrancaAvulsa, fd);
    if (!v.ok) return v;

    const r = await criarCobrancaAvulsa({
      contaId: v.dados.conta_id,
      valor: v.dados.valor,
      vencimento: v.dados.vencimento,
      descricao: v.dados.descricao,
      parcelas: v.dados.parcelas,
    });

    atualizarTelas();
    return { ok: r.ok, mensagem: r.mensagem };
  } catch (e) {
    return { ok: false, mensagem: (e as Error).message };
  }
}

/** Cancela a cobrança aqui e no Asaas. */
export async function cancelar(
  _anterior: Resultado | null,
  fd: FormData,
): Promise<Resultado> {
  try {
    await exigirFinanceiro();

    const faturaId = String(fd.get('fatura_id') ?? '');
    if (!faturaId) return { ok: false, mensagem: 'Fatura não informada.' };

    const r = await cancelarFatura(faturaId);
    atualizarTelas();
    return { ok: r.ok, mensagem: r.mensagem };
  } catch (e) {
    return { ok: false, mensagem: (e as Error).message };
  }
}

/**
 * Baixa manual: o cliente pagou por fora.
 *
 * PIX direto na conta da agência é o caso de todo mês. Sem um caminho
 * para registrar isso, a fatura fica vencida para sempre e o painel
 * segue cobrando quem já pagou.
 */
export async function baixarManual(
  _anterior: Resultado | null,
  fd: FormData,
): Promise<Resultado> {
  try {
    await exigirFinanceiro();

    const v = validar(esquemaBaixaManual, fd);
    if (!v.ok) return v;

    const r = await receberForaDoAsaas(v.dados.fatura_id, v.dados.data);
    atualizarTelas();
    return { ok: r.ok, mensagem: r.mensagem };
  } catch (e) {
    return { ok: false, mensagem: (e as Error).message };
  }
}

/* ------------------------------------------------------------------ */
/* Em lote                                                             */
/* ------------------------------------------------------------------ */

/**
 * Fatura todos os contratos vigentes do mês corrente.
 *
 * A competência vem de `hojeBR()` e não de um campo, pela mesma razão
 * de `faturarMes`: faturar o mês errado em LOTE é o mesmo erro
 * multiplicado por toda a carteira.
 */
export async function faturarTudo(
  _anterior: Resultado | null,
): Promise<Resultado> {
  try {
    await exigirFinanceiro();

    const competencia = `${hojeBR().slice(0, 7)}-01`;
    const r = await faturarTodos(competencia);

    atualizarTelas();

    /* As falhas vão na mensagem, com o nome da loja. "3 emitidas, 1
       falhou" sem dizer qual obriga a pessoa a conferir a lista inteira
       para achar a que ficou de fora. */
    const detalhe =
      r.falhas.length > 0
        ? ` ${r.falhas.map((f) => `${f.loja}: ${f.motivo}`).join(' · ')}`
        : '';

    return { ok: r.ok, mensagem: r.mensagem + detalhe };
  } catch (e) {
    return { ok: false, mensagem: (e as Error).message };
  }
}

/** Puxa do Asaas o estado de todas as cobranças ainda abertas. */
export async function conferirTudo(
  _anterior: Resultado | null,
): Promise<Resultado> {
  try {
    await exigirFinanceiro();
    const r = await conferirTodas();
    atualizarTelas();
    return { ok: r.ok, mensagem: r.mensagem };
  } catch (e) {
    return { ok: false, mensagem: (e as Error).message };
  }
}

/* ------------------------------------------------------------------ */
/* Despesas da agência                                                 */
/* ------------------------------------------------------------------ */

/**
 * O outro lado do financeiro.
 *
 * Faturamento sozinho não responde "sobrou quanto?". `lancamento` é o
 * livro de despesa desde a 0020, e é ele que transforma a tela de
 * faturamento em tela de resultado.
 */
export async function criarDespesa(
  _anterior: Resultado | null,
  fd: FormData,
): Promise<Resultado> {
  try {
    await exigirFinanceiro();

    const v = validar(esquemaDespesa, fd);
    if (!v.ok) return v;

    const supabase = await clienteServidor();
    const { error } = await supabase.from('lancamento').insert({
      tipo: 'despesa',
      status: 'previsto',
      descricao: v.dados.descricao,
      categoria: v.dados.categoria,
      valor: v.dados.valor,
      vencimento: v.dados.vencimento,
      conta_id: v.dados.conta_id,
    });

    if (error) return { ok: false, mensagem: error.message };

    atualizarTelas();
    return { ok: true, mensagem: 'Despesa lançada.' };
  } catch (e) {
    return { ok: false, mensagem: (e as Error).message };
  }
}

export async function pagarDespesa(
  _anterior: Resultado | null,
  fd: FormData,
): Promise<Resultado> {
  try {
    await exigirFinanceiro();

    const v = validar(esquemaPagarDespesa, fd);
    if (!v.ok) return v;

    const supabase = await clienteServidor();
    const { error } = await supabase
      .from('lancamento')
      .update({ status: 'pago', pago_em: v.dados.pago_em })
      .eq('id', v.dados.id);

    if (error) return { ok: false, mensagem: error.message };

    atualizarTelas();
    return { ok: true, mensagem: `Baixada como paga em ${v.dados.pago_em}.` };
  } catch (e) {
    return { ok: false, mensagem: (e as Error).message };
  }
}

/**
 * Apaga a despesa.
 *
 * Aqui apagar é aceitável, e em fatura não é: despesa lançada errada
 * não tem contraparte no mundo — ninguém recebeu um boleto por causa
 * dela. Fatura apagada some com a explicação de um valor cobrado.
 */
export async function apagarDespesa(
  _anterior: Resultado | null,
  fd: FormData,
): Promise<Resultado> {
  try {
    const sessao = await exigirFinanceiro();
    if (sessao.papel !== 'administrador') {
      return { ok: false, mensagem: 'Só o administrador exclui lançamento.' };
    }

    const v = validar(esquemaId, fd);
    if (!v.ok) return v;

    const supabase = await clienteServidor();
    const { error } = await supabase.from('lancamento').delete().eq('id', v.dados.id);
    if (error) return { ok: false, mensagem: error.message };

    atualizarTelas();
    return { ok: true, mensagem: 'Despesa removida.' };
  } catch (e) {
    return { ok: false, mensagem: (e as Error).message };
  }
}
