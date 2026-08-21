'use server';

import { revalidatePath } from 'next/cache';
import { sessaoAtual } from '@/lib/supabase/servidor';
import { faturarContrato, cobrarFatura, conferirFatura } from '@/lib/cobranca/faturamento';
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
