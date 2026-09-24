'use server';

import { revalidatePath } from 'next/cache';
import { sessaoAtual, clienteServidor } from '@/lib/supabase/servidor';
import { esquemaAbordagem, validar } from '@/lib/validacao/painel';
import type { Resultado } from './acoes';

/**
 * A única escrita da prospecção ativa.
 *
 * ============================================================
 * POR QUE ELA NÃO ESCREVE EM `prospeccao`
 * ============================================================
 * A pesquisa é o que se sabia ANTES de falar, e não muda por alguém ter
 * mandado a mensagem. O que muda é o lead: ele sai de "novo" e entra em
 * "contato". Gravar um "status" também na pesquisa criaria dois donos
 * para a mesma verdade, e um dia eles discordariam.
 *
 * ============================================================
 * SEM CHAVE DE SERVIÇO
 * ============================================================
 * Como em `acoes-crm.ts`: escreve com a sessão do usuário, e o RLS
 * decide. `exigirComercial()` existe para dar mensagem clara, e não
 * para proteger — se falhasse, o Postgres ainda recusaria.
 *
 * ============================================================
 * A INTERAÇÃO VEM JUNTO, E NA MESMA AÇÃO
 * ============================================================
 * Mover o card sem registrar nada deixaria, semanas depois, um lead em
 * "contato" sem ninguém saber o que foi dito nem quando. O histórico é
 * o que transforma "já falei com esse" em informação.
 *
 * A ordem importa: a interação PRIMEIRO. Se ela falhar, o lead
 * continua em "novo" e a pessoa tenta de novo. Ao contrário, o lead
 * sairia da lista de quem falta abordar sem deixar rastro, e ninguém
 * descobriria.
 */
export async function marcarAbordado(
  _anterior: Resultado | null,
  fd: FormData,
): Promise<Resultado> {
  try {
    const sessao = await sessaoAtual();
    if (!sessao) return { ok: false, mensagem: 'Sessão expirada. Entre de novo.' };
    if (!['administrador', 'gestor', 'comercial'].includes(sessao.papel)) {
      return { ok: false, mensagem: 'Seu perfil não mexe na prospecção.' };
    }

    const v = validar(esquemaAbordagem, fd);
    if (!v.ok) return v;
    const { lead_id, nota } = v.dados;

    const supabase = await clienteServidor();

    const { error: erroInteracao } = await supabase.from('interacao').insert({
      lead_id,
      tipo: 'nota',
      resumo: nota ?? 'Mensagem de abertura enviada.',
      autor_id: sessao.id,
    });
    if (erroInteracao) return { ok: false, mensagem: erroInteracao.message };

    /*
      `eq('estagio', 'novo')` não é otimização: é o que impede um clique
      repetido, ou dois navegadores abertos, de puxar de volta para
      "contato" um lead que já avançou para diagnóstico ou proposta.
    */
    const { error } = await supabase
      .from('lead')
      .update({ estagio: 'contato', proximo_passo: 'Aguardar resposta' })
      .eq('id', lead_id)
      .eq('estagio', 'novo');

    if (error) return { ok: false, mensagem: error.message };

    revalidatePath('/painel/prospeccao');
    revalidatePath('/painel/crm');

    return { ok: true, mensagem: 'Abordagem registrada. O lead foi para "Em contato".' };
  } catch (e) {
    return { ok: false, mensagem: (e as Error).message };
  }
}
