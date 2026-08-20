'use server';

import { revalidatePath } from 'next/cache';
import { sessaoAtual } from '@/lib/supabase/servidor';
import { clienteServico } from '@/lib/supabase/servico';
import {
  guardarCredencial,
  CAMPOS_DO_PROVEDOR,
  PROVEDORES_DE_API,
  type ProvedorApi,
} from '@/lib/ingestao/credenciais';
import { sincronizar } from '@/lib/ingestao/sincronizar';
import type { Resultado } from './acoes';

/**
 * Credenciais da agência e vínculo das contas de anúncio.
 *
 * Tudo aqui usa a SERVICE ROLE, porque `credencial_agencia` e
 * `integracao` não têm política de RLS nenhuma — de propósito, para que
 * token de anúncio não trafegue até navegador em hipótese alguma.
 *
 * Como o RLS não vai segurar nada, `exigirAdmin()` é a primeira linha
 * de todas elas, e é a proteção de verdade. Não há segunda instância.
 */

async function exigirAdmin() {
  const sessao = await sessaoAtual();
  if (!sessao) throw new Error('Sessão expirada. Entre de novo.');
  if (sessao.papel !== 'administrador') {
    throw new Error('Só o administrador mexe nas credenciais da agência.');
  }
  return sessao;
}

/* ================================================================== */
/* Credencial da agência                                              */
/* ================================================================== */

export async function salvarCredencial(
  _anterior: Resultado | null,
  fd: FormData,
): Promise<Resultado> {
  try {
    await exigirAdmin();

    const provedor = String(fd.get('provedor') ?? '') as ProvedorApi;
    if (!PROVEDORES_DE_API.includes(provedor)) {
      return { ok: false, mensagem: 'Provedor inválido.' };
    }

    const rotulo = String(fd.get('rotulo') ?? '').trim() || 'Principal';

    const valores: Record<string, string> = {};
    for (const campo of CAMPOS_DO_PROVEDOR[provedor]) {
      valores[campo.chave] = String(fd.get(campo.chave) ?? '').trim();
    }

    await guardarCredencial({ provedor, rotulo, valores });

    revalidatePath('/painel/configuracoes');
    revalidatePath('/painel/contas');

    return {
      ok: true,
      mensagem: `Credencial de ${provedor} guardada e cifrada. Ela não volta a aparecer nesta tela.`,
    };
  } catch (e) {
    return { ok: false, mensagem: (e as Error).message };
  }
}

export async function desligarCredencial(
  _anterior: Resultado | null,
  fd: FormData,
): Promise<Resultado> {
  try {
    await exigirAdmin();

    const id = String(fd.get('id') ?? '');
    if (!id) return { ok: false, mensagem: 'Credencial não informada.' };

    const supabase = clienteServico();

    /* Desliga, e APAGA o segredo. Guardar o token de uma credencial que
       ninguém mais usa é manter o risco sem nenhum benefício. */
    const { error } = await supabase
      .from('credencial_agencia')
      .update({ ativa: false, segredo: null, pista: null })
      .eq('id', id);

    if (error) return { ok: false, mensagem: error.message };

    revalidatePath('/painel/configuracoes');
    return { ok: true, mensagem: 'Credencial desligada e o token apagado.' };
  } catch (e) {
    return { ok: false, mensagem: (e as Error).message };
  }
}

/* ================================================================== */
/* Vínculo da conta de anúncio com a loja                             */
/* ================================================================== */

export async function vincularFonte(
  _anterior: Resultado | null,
  fd: FormData,
): Promise<Resultado> {
  try {
    await exigirAdmin();

    const contaId = String(fd.get('conta_id') ?? '');
    const provedor = String(fd.get('provedor') ?? '') as ProvedorApi;
    const identificador = String(fd.get('identificador') ?? '').trim();
    const janela = Number(String(fd.get('janela_dias') ?? '7'));

    if (!contaId) return { ok: false, mensagem: 'Loja não informada.' };
    if (!PROVEDORES_DE_API.includes(provedor)) {
      return { ok: false, mensagem: 'Escolha a fonte.' };
    }
    if (!identificador) {
      return { ok: false, mensagem: 'Informe qual conta do provedor pertence a esta loja.' };
    }
    if (!Number.isFinite(janela) || janela < 1 || janela > 90) {
      return { ok: false, mensagem: 'A janela precisa ficar entre 1 e 90 dias.' };
    }

    const supabase = clienteServico();

    const { data: cred } = await supabase
      .from('credencial_agencia')
      .select('id')
      .eq('provedor', provedor)
      .eq('ativa', true)
      .not('segredo', 'is', null)
      .limit(1)
      .maybeSingle();

    if (!cred) {
      return {
        ok: false,
        mensagem:
          `Não há credencial ativa de ${provedor}. Configure em Configurações antes de vincular a loja.`,
      };
    }

    const { error } = await supabase.from('integracao').upsert(
      {
        conta_id: contaId,
        provedor,
        identificador,
        credencial_id: cred.id,
        janela_dias: janela,
        ativa: true,
        /* Vínculo novo zera o erro anterior: o estado antigo descreve
           uma configuração que não existe mais, e deixá-lo na tela
           faria a integração nascer "com erro". */
        ultimo_erro: null,
        erro_em: null,
      },
      { onConflict: 'conta_id,provedor' },
    );

    if (error) return { ok: false, mensagem: error.message };

    revalidatePath('/painel/contas');
    return {
      ok: true,
      mensagem: 'Fonte vinculada. Rode a sincronização para trazer o histórico da janela.',
    };
  } catch (e) {
    return { ok: false, mensagem: (e as Error).message };
  }
}

export async function desvincularFonte(
  _anterior: Resultado | null,
  fd: FormData,
): Promise<Resultado> {
  try {
    await exigirAdmin();

    const id = String(fd.get('id') ?? '');
    if (!id) return { ok: false, mensagem: 'Vínculo não informado.' };

    const supabase = clienteServico();
    const { error } = await supabase.from('integracao').delete().eq('id', id);
    if (error) return { ok: false, mensagem: error.message };

    /* A métrica já gravada FICA. Desligar a fonte não é motivo para
       apagar o histórico da loja, e apagar seria irreversível. */
    revalidatePath('/painel/contas');
    return { ok: true, mensagem: 'Vínculo removido. O histórico já gravado continua.' };
  } catch (e) {
    return { ok: false, mensagem: (e as Error).message };
  }
}

/* ================================================================== */
/* Sincronizar agora                                                  */
/* ================================================================== */

export async function sincronizarAgora(
  _anterior: Resultado | null,
  fd: FormData,
): Promise<Resultado> {
  try {
    await exigirAdmin();

    const contaId = String(fd.get('conta_id') ?? '') || undefined;
    const resultados = await sincronizar({ contaId });

    revalidatePath('/painel/contas');
    revalidatePath('/painel/metricas');

    if (resultados.length === 0) {
      return { ok: false, mensagem: 'Nenhuma fonte ativa para sincronizar.' };
    }

    const bons = resultados.filter((r) => r.ok);
    const ruins = resultados.filter((r) => !r.ok);

    /* Sucesso parcial se conta como sucesso, mas o que falhou vai
       NOMEADO: "3 de 5 fontes" sem dizer quais obriga a caçar. */
    if (ruins.length === 0) {
      const total = bons.reduce((s, r) => s + r.gravadas, 0);
      return { ok: true, mensagem: `${bons.length} fonte(s), ${total} linha(s) gravadas.` };
    }

    const detalhe = ruins.map((r) => `${r.provedor}: ${r.mensagem}`).join(' · ');

    return {
      ok: bons.length > 0,
      mensagem:
        bons.length > 0
          ? `${bons.length} fonte(s) ok. Falhou — ${detalhe}`
          : `Nenhuma fonte sincronizou. ${detalhe}`,
    };
  } catch (e) {
    return { ok: false, mensagem: (e as Error).message };
  }
}
