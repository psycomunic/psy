'use server';

import { revalidatePath } from 'next/cache';
import { sessaoAtual } from '@/lib/supabase/servidor';
import { clienteServico } from '@/lib/supabase/servico';
import { ESCOPOS_CONTA, ITENS_CHECKLIST_ONBOARDING, TIPOS_CONTA, type TipoConta } from '@/lib/dados/tipos';
import { PERFIS_METRICA, type PerfilMetrica } from '@/lib/dominio/perfis-metrica';
import type { Resultado } from './acoes';

const SITUACOES_CONTA = ['prospect', 'onboarding', 'ativa', 'pausada', 'encerrada'] as const;

async function exigirEquipeInterna() {
  const sessao = await sessaoAtual();
  if (!sessao) throw new Error('Sessão expirada. Entre de novo.');
  if (!['administrador', 'gestor', 'operador', 'comercial'].includes(sessao.papel)) {
    throw new Error('Seu perfil não altera os dados operacionais do cliente.');
  }
  return sessao;
}

function limparTexto(fd: FormData, chave: string, max = 2000): string | null {
  const v = String(fd.get(chave) ?? '').trim();
  return v ? v.slice(0, max) : null;
}

function revalidarFicha() {
  revalidatePath('/painel/contas');
  revalidatePath('/painel/metricas');
  revalidatePath('/painel/visao');
  revalidatePath('/painel/relatorios');
}

export async function salvarFichaCadastral(
  _anterior: Resultado | null,
  fd: FormData,
): Promise<Resultado> {
  try {
    const sessao = await exigirEquipeInterna();
    const contaId = String(fd.get('conta_id') ?? '').trim();
    if (!contaId) return { ok: false, mensagem: 'Cliente não informado.' };

    const nome = limparTexto(fd, 'nome', 140);
    if (!nome) return { ok: false, mensagem: 'O nome do cliente é obrigatório.' };

    const tipoBruto = String(fd.get('tipo') ?? 'trafego') as TipoConta;
    const tipo: TipoConta = TIPOS_CONTA.includes(tipoBruto) ? tipoBruto : 'trafego';

    const perfilBruto = String(fd.get('perfil_metrica') ?? 'automatico') as PerfilMetrica;
    const perfilMetrica: PerfilMetrica = PERFIS_METRICA.includes(perfilBruto)
      ? perfilBruto
      : 'automatico';

    const sitBruta = String(fd.get('situacao') ?? 'ativa');
    const situacao = (SITUACOES_CONTA as readonly string[]).includes(sitBruta)
      ? sitBruta
      : 'ativa';

    const escopoBruto = fd.getAll('escopo').map((v) => String(v).trim()).filter(Boolean);
    const escopoPermitido = new Set<string>(ESCOPOS_CONTA);
    const escopo = escopoBruto.filter((e) => escopoPermitido.has(e));

    const linksUteis: Record<string, string> = {};
    for (const k of ['drive', 'comercial', 'gerenciador', 'extra'] as const) {
      const url = limparTexto(fd, `link_${k}`, 500);
      if (url) linksUteis[k] = url;
    }

    const basePayload: Record<string, unknown> = {
      nome,
      razao_social: limparTexto(fd, 'razao_social', 180),
      documento: limparTexto(fd, 'documento', 40),
      tipo,
      perfil_metrica: perfilMetrica,
      segmento: limparTexto(fd, 'segmento', 120),
      plataforma: limparTexto(fd, 'plataforma', 120),
      site: limparTexto(fd, 'site', 300),
      situacao,
      data_inicio: limparTexto(fd, 'data_inicio', 10),
      responsavel_id: limparTexto(fd, 'responsavel_id', 60),
      observacoes: limparTexto(fd, 'observacoes', 4000),
    };

    const payloadCompleto: Record<string, unknown> = {
      ...basePayload,
      instagram: limparTexto(fd, 'instagram', 160),
      escopo,
      objetivo_principal: limparTexto(fd, 'objetivo_principal', 600),
      publico_alvo: limparTexto(fd, 'publico_alvo', 1500),
      oferta_principal: limparTexto(fd, 'oferta_principal', 1500),
      diferenciais: limparTexto(fd, 'diferenciais', 1500),
      links_uteis: linksUteis,
    };

    const s = clienteServico();
    let { error } = await s.from('conta').update(payloadCompleto).eq('id', contaId);
    let migrou0053 = true;

    /* Fallback transparente caso a migração 0053 ainda não tenha sido rodada no Supabase */
    if (error && /instagram|escopo|objetivo_principal|links_uteis|publico_alvo/i.test(error.message)) {
      migrou0053 = false;
      const fb = await s.from('conta').update(basePayload).eq('id', contaId);
      error = fb.error;
    }

    if (error) return { ok: false, mensagem: error.message };

    await s
      .from('log_auditoria')
      .insert({
        autor_id: sessao.id,
        autor_papel: sessao.papel,
        acao: 'atualizou ficha',
        tabela: 'conta',
        registro_id: contaId,
      })
      .then(() => undefined, () => undefined);

    revalidarFicha();

    return {
      ok: true,
      mensagem: migrou0053
        ? 'Ficha e briefing estratégico do cliente atualizados.'
        : 'Dados básicos salvos. Para habilitar também escopo, links e briefing estruturado, rode a migração 0053 no Supabase.',
    };
  } catch (e) {
    return { ok: false, mensagem: (e as Error).message };
  }
}

export async function alternarChecklistConta(
  _anterior: Resultado | null,
  fd: FormData,
): Promise<Resultado> {
  try {
    await exigirEquipeInterna();
    const contaId = String(fd.get('conta_id') ?? '').trim();
    const chave = String(fd.get('chave') ?? '').trim();
    const marcado = String(fd.get('marcado') ?? '') === 'true';

    const validas = new Set<string>(ITENS_CHECKLIST_ONBOARDING.map((i) => i.chave));
    if (!contaId || !validas.has(chave)) {
      return { ok: false, mensagem: 'Item de checklist inválido.' };
    }

    const s = clienteServico();
    const { data: atual, error: erroLeitura } = await s
      .from('conta')
      .select('*')
      .eq('id', contaId)
      .maybeSingle();

    if (erroLeitura || !atual) {
      return { ok: false, mensagem: erroLeitura?.message ?? 'Conta não encontrada.' };
    }

    const rec = atual as Record<string, unknown>;
    const mapaAtual =
      rec.checklist_onboarding && typeof rec.checklist_onboarding === 'object'
        ? { ...(rec.checklist_onboarding as Record<string, boolean>) }
        : {};
    mapaAtual[chave] = marcado;

    const { error } = await s
      .from('conta')
      .update({ checklist_onboarding: mapaAtual })
      .eq('id', contaId);

    if (error) {
      if (/checklist_onboarding/i.test(error.message)) {
        return {
          ok: false,
          mensagem: 'Rode a migração 0053 no Supabase para salvar o checklist de onboarding.',
        };
      }
      return { ok: false, mensagem: error.message };
    }

    revalidarFicha();
    return { ok: true, mensagem: 'Checklist atualizado.' };
  } catch (e) {
    return { ok: false, mensagem: (e as Error).message };
  }
}

export async function salvarContatoCliente(
  _anterior: Resultado | null,
  fd: FormData,
): Promise<Resultado> {
  try {
    await exigirEquipeInterna();
    const contaId = String(fd.get('conta_id') ?? '').trim();
    const id = limparTexto(fd, 'id', 60);
    const nome = limparTexto(fd, 'nome', 140);
    if (!contaId || !nome) {
      return { ok: false, mensagem: 'Informe o nome da pessoa de contato.' };
    }

    const principal = fd.get('principal') === 'on' || fd.get('principal') === 'true';
    const payload = {
      conta_id: contaId,
      nome,
      cargo: limparTexto(fd, 'cargo', 100),
      whatsapp: limparTexto(fd, 'whatsapp', 40),
      telefone: limparTexto(fd, 'telefone', 40),
      email: limparTexto(fd, 'email', 160),
      principal,
    };

    const s = clienteServico();
    if (principal) {
      await s.from('contato').update({ principal: false }).eq('conta_id', contaId);
    }

    const { error } = id
      ? await s.from('contato').update(payload).eq('id', id).eq('conta_id', contaId)
      : await s.from('contato').insert(payload);

    if (error) return { ok: false, mensagem: error.message };

    revalidarFicha();
    return { ok: true, mensagem: id ? 'Contato atualizado.' : 'Contato adicionado à ficha.' };
  } catch (e) {
    return { ok: false, mensagem: (e as Error).message };
  }
}

export async function removerContatoCliente(
  _anterior: Resultado | null,
  fd: FormData,
): Promise<Resultado> {
  try {
    await exigirEquipeInterna();
    const id = String(fd.get('id') ?? '').trim();
    if (!id) return { ok: false, mensagem: 'Contato não informado.' };

    const s = clienteServico();
    const { error } = await s.from('contato').delete().eq('id', id);
    if (error) return { ok: false, mensagem: error.message };

    revalidarFicha();
    return { ok: true, mensagem: 'Contato removido.' };
  } catch (e) {
    return { ok: false, mensagem: (e as Error).message };
  }
}
