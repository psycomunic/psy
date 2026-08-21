'use server';

import { revalidatePath } from 'next/cache';
import { sessaoAtual } from '@/lib/supabase/servidor';
import { clienteServidor } from '@/lib/supabase/servidor';
import {
  esquemaMoverLead,
  esquemaLead,
  esquemaPerderLead,
  esquemaConverter,
  esquemaInteracao,
  esquemaNovoLead,
  esquemaEditarLead,
  validar,
} from '@/lib/validacao/painel';
import type { Resultado } from './acoes';

/**
 * Ações do funil comercial.
 *
 * ============================================================
 * A DIFERENÇA EM RELAÇÃO A acoes.ts
 * ============================================================
 * Aqui NÃO se usa a chave de serviço. Estas ações escrevem com
 * `clienteServidor()`, que carrega a sessão do usuário e passa pelo RLS.
 *
 * O motivo: o RLS já permite ao comercial escrever em `lead` e
 * `interacao`. Contornar a proteção onde ela funciona seria trocar
 * segurança por nada.
 *
 * A chave de serviço fica reservada para o que o RLS IMPEDE por
 * definição — criar usuário e gravar papel — e isso vive em `acoes.ts`,
 * com o aviso correspondente.
 *
 * Consequência prática: `exigirComercial()` aqui existe para dar
 * mensagem clara, e não para proteger. Se ela falhasse, o Postgres ainda
 * recusaria a escrita.
 */

async function exigirComercial() {
  const sessao = await sessaoAtual();
  if (!sessao) throw new Error('Sessão expirada. Entre de novo.');
  if (!['administrador', 'gestor', 'comercial'].includes(sessao.papel)) {
    throw new Error('Seu perfil não mexe no funil comercial.');
  }
  return sessao;
}

export async function moverLead(
  _anterior: Resultado | null,
  fd: FormData,
): Promise<Resultado> {
  try {
    await exigirComercial();

    const v = validar(esquemaMoverLead, fd);
    if (!v.ok) return v;
    const { id, estagio } = v.dados;

    /*
      Ganho e perdido são estados FINAIS, e cada um tem fluxo próprio.

      Arrastar o card para "Ganho" e pronto deixaria um lead marcado como
      ganho sem loja, sem contrato e sem onboarding — exatamente o buraco
      que a conversão em transação única existe para fechar.

      "Perdido" sem motivo vira cemitério sem aprendizado.
    */
    if (estagio === 'ganho') {
      return {
        ok: false,
        mensagem: 'Para marcar como ganho, use "Converter em cliente" e informe o fee.',
      };
    }
    if (estagio === 'perdido') {
      return { ok: false, mensagem: 'Para marcar como perdido, informe o motivo.' };
    }

    const supabase = await clienteServidor();
    const { error } = await supabase.from('lead').update({ estagio }).eq('id', id);

    if (error) return { ok: false, mensagem: error.message };

    /* `estagio_desde` é reiniciado por GATILHO no banco, e não aqui.
       Se dependesse desta linha, uma alteração feita por SQL ou por
       importação pararia o relógio do alerta de lead parado. */
    revalidatePath('/painel/crm');
    return { ok: true, mensagem: 'Lead movido.' };
  } catch (e) {
    return { ok: false, mensagem: (e as Error).message };
  }
}

export async function atualizarLead(
  _anterior: Resultado | null,
  fd: FormData,
): Promise<Resultado> {
  try {
    await exigirComercial();

    const v = validar(esquemaLead, fd);
    if (!v.ok) return v;
    const { id, proximo_passo, proximo_passo_em, probabilidade } = v.dados;

    const supabase = await clienteServidor();
    const { error } = await supabase
      .from('lead')
      .update({ proximo_passo, proximo_passo_em, probabilidade })
      .eq('id', id);

    if (error) return { ok: false, mensagem: error.message };

    revalidatePath('/painel/crm');
    return { ok: true, mensagem: 'Lead atualizado.' };
  } catch (e) {
    return { ok: false, mensagem: (e as Error).message };
  }
}

export async function perderLead(
  _anterior: Resultado | null,
  fd: FormData,
): Promise<Resultado> {
  try {
    await exigirComercial();

    const v = validar(esquemaPerderLead, fd);
    if (!v.ok) return v;
    const { id, motivo_perda } = v.dados;

    const supabase = await clienteServidor();
    const { error } = await supabase
      .from('lead')
      .update({ estagio: 'perdido', motivo_perda, proximo_passo: null })
      .eq('id', id);

    if (error) return { ok: false, mensagem: error.message };

    revalidatePath('/painel/crm');
    return { ok: true, mensagem: 'Lead marcado como perdido.' };
  } catch (e) {
    return { ok: false, mensagem: (e as Error).message };
  }
}

/**
 * Lead vira cliente.
 *
 * Toda a criação acontece dentro de `converter_lead()`, no Postgres:
 * loja, contrato, acesso do responsável, cinco tarefas de onboarding e o
 * marco no diário nascem na MESMA transação.
 *
 * Feito em cinco requisições daqui, uma falha no meio deixaria loja sem
 * contrato ou contrato sem tarefa, e alguém descobriria semanas depois.
 */
export async function converterEmCliente(
  _anterior: Resultado | null,
  fd: FormData,
): Promise<Resultado> {
  try {
    await exigirComercial();

    const v = validar(esquemaConverter, fd);
    if (!v.ok) return v;
    const { id, fee_mensal, plataforma } = v.dados;

    const supabase = await clienteServidor();
    const { error } = await supabase.rpc('converter_lead', {
      p_lead_id: id,
      p_fee_mensal: fee_mensal,
      p_plataforma: plataforma,
    });

    if (error) return { ok: false, mensagem: error.message };

    revalidatePath('/painel/crm');
    revalidatePath('/painel/contas');
    revalidatePath('/painel/visao');

    return {
      ok: true,
      mensagem: 'Cliente criado, com contrato e as cinco tarefas de onboarding.',
    };
  } catch (e) {
    return { ok: false, mensagem: (e as Error).message };
  }
}

export async function registrarInteracao(
  _anterior: Resultado | null,
  fd: FormData,
): Promise<Resultado> {
  try {
    const sessao = await sessaoAtual();
    if (!sessao) return { ok: false, mensagem: 'Sessão expirada. Entre de novo.' };

    const v = validar(esquemaInteracao, fd);
    if (!v.ok) return v;
    const { lead_id, conta_id, tipo, resumo } = v.dados;

    if (!lead_id && !conta_id) {
      return {
        ok: false,
        mensagem: 'A interação precisa estar ligada a um lead ou a uma loja.',
      };
    }

    const supabase = await clienteServidor();
    const { error } = await supabase.from('interacao').insert({
      lead_id,
      conta_id,
      tipo,
      resumo,
      autor_id: sessao.id,
      /* Sem `ocorrida_em`: a coluna nunca existiu, e este insert
         falhava inteiro por causa dela. `criada_em` tem default now()
         e responde a mesma pergunta. */
    });

    if (error) return { ok: false, mensagem: error.message };

    revalidatePath('/painel/crm');
    if (conta_id) revalidatePath('/painel/contas');

    return { ok: true, mensagem: 'Interação registrada.' };
  } catch (e) {
    return { ok: false, mensagem: (e as Error).message };
  }
}

/**
 * Cria um lead.
 *
 * Faltava. O CRM sabia mover, editar próximo passo, perder e converter,
 * mas não sabia CRIAR — e um funil onde a primeira coluna só enche por
 * SQL não é um funil, é um relatório.
 *
 * O responsável nasce sendo quem cadastrou. Lead sem dono é lead que
 * ninguém cobra, e a lista de "parados há 7 dias" existe justamente
 * para cobrar alguém.
 */
export async function criarLead(
  _anterior: Resultado | null,
  fd: FormData,
): Promise<Resultado> {
  try {
    const sessao = await exigirComercial();

    const v = validar(esquemaNovoLead, fd);
    if (!v.ok) return v;

    const supabase = await clienteServidor();
    const { error } = await supabase.from('lead').insert({
      ...v.dados,
      responsavel_id: sessao.id,
    });

    if (error) return { ok: false, mensagem: error.message };

    revalidatePath('/painel/crm');
    revalidatePath('/painel/visao');

    return { ok: true, mensagem: `${v.dados.empresa ?? v.dados.nome} entrou no funil.` };
  } catch (e) {
    return { ok: false, mensagem: (e as Error).message };
  }
}

/**
 * Edita a ficha inteira do lead.
 *
 * Diferente de `atualizarLead`, que só mexe em próximo passo e
 * probabilidade. Os dois existem de propósito: o rápido é o do card, e
 * salvar a ficha inteira a partir dele apagaria contato e valor, porque
 * campo ausente no FormData chega como vazio.
 */
export async function editarLead(
  _anterior: Resultado | null,
  fd: FormData,
): Promise<Resultado> {
  try {
    await exigirComercial();

    const v = validar(esquemaEditarLead, fd);
    if (!v.ok) return v;
    const { id, ...campos } = v.dados;

    const supabase = await clienteServidor();
    const { error } = await supabase.from('lead').update(campos).eq('id', id);

    if (error) return { ok: false, mensagem: error.message };

    revalidatePath('/painel/crm');
    return { ok: true, mensagem: 'Lead atualizado.' };
  } catch (e) {
    return { ok: false, mensagem: (e as Error).message };
  }
}
