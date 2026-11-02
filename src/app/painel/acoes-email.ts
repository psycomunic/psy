'use server';

import { revalidatePath } from 'next/cache';
import { sessaoAtual } from '@/lib/supabase/servidor';
import { enviarEmail, remetente } from '@/lib/email/remetente';
import { testeDeEnvio } from '@/lib/email/modelos';

/**
 * Disparar um e-mail de teste do painel.
 *
 * ============================================================
 * POR QUE ISSO É UMA AÇÃO DO PAINEL, E NÃO SÓ UM SCRIPT
 * ============================================================
 * Já existe `npm run testar-email`, e ele serve para quem está com o
 * repositório aberto. O problema é que a configuração que importa é a
 * da Vercel, não a da máquina: a chave pode estar no `.env.local` e
 * faltar na produção, ou o contrário, e o script testa só o lado dele.
 *
 * Em outubro a inscrição de Bragança foi gravada e a confirmação não
 * saiu. Descobrir o motivo levou consulta ao banco e log de uma hora de
 * retenção no plano Hobby, que já havia expirado. O motivo estava no
 * servidor de produção e não havia nenhuma forma de perguntar a ele.
 *
 * Esta ação é essa pergunta. Ela roda onde o e-mail de verdade roda, com
 * a mesma chave e o mesmo remetente, e devolve a resposta do Resend
 * palavra por palavra, porque a mensagem dele é específica: "domain is
 * not verified" e "API key is invalid" são diagnósticos diferentes que
 * ninguém adivinha a partir de "não chegou".
 *
 * Vai para a caixa de quem clicou, nunca para um endereço digitado. É de
 * propósito: um campo livre aqui transformaria o painel em disparador de
 * e-mail com o domínio da agência no remetente, e quem entra como
 * cliente não tem nada que fazer isso. Admin, e só para si mesmo.
 */

export type Resultado = { ok: boolean; mensagem: string };

export async function testarEnvioDeEmail(
  _anterior: Resultado | null,
  _fd: FormData,
): Promise<Resultado> {
  const sessao = await sessaoAtual();

  if (!sessao) return { ok: false, mensagem: 'Sessão expirada. Entre de novo.' };
  if (sessao.papel !== 'administrador') {
    return { ok: false, mensagem: 'Só administradores podem disparar o teste.' };
  }

  const envio = await enviarEmail({
    tipo: 'teste',
    /* Sem chave de idempotência: o teste tem que poder repetir. É a
       primeira coisa que se faz depois de mexer na configuração. */
    para: sessao.email,
    ...testeDeEnvio({ quem: sessao.nome }),
  });

  /* A trilha em email_enviado ganhou uma linha. Mostrar na hora. */
  revalidatePath('/painel/configuracoes');

  if (envio.ok) {
    return {
      ok: true,
      mensagem: `Saiu de ${remetente} para ${sessao.email}. Se não estiver na entrada, olhe em promoções e em spam.`,
    };
  }

  return { ok: false, mensagem: envio.erro };
}
