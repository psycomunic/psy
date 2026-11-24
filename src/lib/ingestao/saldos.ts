import 'server-only';
import { bancoConfigurado } from '@/lib/supabase/ambiente';
import { clienteServico } from '@/lib/supabase/servico';
import { hojeBR, somarDias } from '@/lib/datas';
import { dinheiroExato } from '@/lib/formato';
import { abrirSegredo } from './credenciais';
import * as meta from './fontes/meta';
import { lerConfigWhatsapp, dispararAlertasSaldoWhatsapp } from '@/lib/whatsapp/remetente';
import {
  emailConfigurado,
  caixaDaAgencia,
  enviarEmail,
} from '@/lib/email/remetente';
import { avisoSaldoBaixo } from '@/lib/email/modelos';
import type { SaldoContaMidia, NivelSaldoMidia } from '@/lib/dados/tipos';

const PESO_NIVEL: Record<NivelSaldoMidia, number> = {
  zerado: 0,
  critico: 1,
  atencao: 2,
  saudavel: 3,
  pos_pago: 4,
};

/**
 * Consulta o saldo ao vivo de todas as contas Meta Ads vinculadas (ou de uma
 * conta específica) e cruza com o gasto real dos últimos 7 dias para estimar
 * quantos dias de verba ainda restam.
 *
 * Quando encontra saldo esgotado ou crítico (< R$ 150 ou < 3 dias), grava
 * uma notificação idempotente do dia em `notificacao` para administradores e
 * gestores verem no sino do menu lateral.
 */
export async function consultarSaldosMidia({
  contaId,
  notificarNoPainel = true,
  notificarNoWhatsapp = true,
  notificarNoEmail = true,
}: {
  contaId?: string;
  notificarNoPainel?: boolean;
  notificarNoWhatsapp?: boolean;
  notificarNoEmail?: boolean;
} = {}): Promise<SaldoContaMidia[]> {
  if (!bancoConfigurado) return [];

  try {
    const supabase = clienteServico();
    const cfgWpp = await lerConfigWhatsapp().catch(() => null);
    const pisoAlertaReais = cfgWpp?.pisoAlerta ?? 150;

    let qInt = supabase
      .from('integracao')
      .select('conta_id, identificador, ativa, credencial:credencial_id(segredo, ativa), conta:conta_id(nome, situacao)')
      .eq('provedor', 'meta_ads')
      .eq('ativa', true);

    if (contaId) qInt = qInt.eq('conta_id', contaId);

    const { data: integracoes } = await qInt;
    if (!integracoes || integracoes.length === 0) return [];

    const ativas = integracoes.filter((i) => {
      const c = i.conta as unknown as { nome?: string; situacao?: string } | null;
      return i.identificador && (!c?.situacao || ['ativa', 'onboarding'].includes(c.situacao));
    });
    if (ativas.length === 0) return [];

    const hoje = hojeBR();
    const seteDiasAtras = somarDias(hoje, -7);
    const idsContas = ativas.map((i) => i.conta_id as string);

    const { data: gastos7d } = await supabase
      .from('metrica_diaria')
      .select('conta_id, investimento')
      .in('conta_id', idsContas)
      .eq('canal', 'meta')
      .gte('dia', seteDiasAtras)
      .lte('dia', hoje);

    const gastoPorConta = new Map<string, number>();
    for (const g of gastos7d ?? []) {
      const cid = g.conta_id as string;
      gastoPorConta.set(cid, (gastoPorConta.get(cid) ?? 0) + Number(g.investimento ?? 0));
    }

    const promessas = ativas.map(async (i) => {
      const cred = i.credencial as unknown as { segredo: string | null; ativa: boolean } | null;
      const contaObj = i.conta as unknown as { nome?: string } | null;
      if (!cred?.segredo || !cred.ativa) return null;

      try {
        const segredo = abrirSegredo(cred.segredo) as unknown as meta.SegredoMeta;
        if (!segredo?.access_token) return null;

        return await meta.buscarSaldoConta({
          segredo,
          identificador: i.identificador as string,
          contaId: i.conta_id as string,
          contaNome: contaObj?.nome ?? 'Cliente',
          gastoUltimos7Dias: gastoPorConta.get(i.conta_id as string) ?? 0,
          pisoAlertaReais,
        });
      } catch {
        return null;
      }
    });

    const brutos = await Promise.all(promessas);
    const saldos = brutos
      .filter((s): s is SaldoContaMidia => s !== null)
      .sort((a, b) => {
        const d = PESO_NIVEL[a.nivel] - PESO_NIVEL[b.nivel];
        if (d !== 0) return d;
        return (a.saldoDisponivel ?? 999999) - (b.saldoDisponivel ?? 999999);
      });

    if (notificarNoPainel || notificarNoWhatsapp || notificarNoEmail) {
      const urgentes = saldos.filter((s) => s.nivel === 'zerado' || s.nivel === 'critico');
      if (urgentes.length > 0) {
        if (notificarNoPainel) {
          await emitirNotificacoesSaldoBaixo(urgentes, hoje).catch((e) =>
            console.warn('emitirNotificacoesSaldoBaixo:', (e as Error).message),
          );
        }
        if (notificarNoEmail && emailConfigurado) {
          await dispararAlertasSaldoEmail(urgentes).catch((e) =>
            console.warn('dispararAlertasSaldoEmail:', (e as Error).message),
          );
        }
        if (notificarNoWhatsapp && cfgWpp) {
          await dispararAlertasSaldoWhatsapp(urgentes).catch((e) =>
            console.warn('dispararAlertasSaldoWhatsapp:', (e as Error).message),
          );
        }
      }
    }

    return saldos;
  } catch (e) {
    console.warn('consultarSaldosMidia:', (e as Error).message);
    return [];
  }
}

export async function dispararAlertasSaldoEmail(
  saldosUrgentes: SaldoContaMidia[],
  opcoes?: { forcarTeste?: boolean; destinoTeste?: string },
): Promise<{ enviado: boolean; destino: string; mensagem: string }> {
  const ehTeste = Boolean(opcoes?.forcarTeste);

  if (!emailConfigurado) {
    return {
      enviado: false,
      destino: caixaDaAgencia,
      mensagem: 'Falta RESEND_API_KEY no ambiente do servidor.',
    };
  }

  const supabase = clienteServico();
  const hoje = hojeBR();

  let destinos: string[] = [];
  if (ehTeste && opcoes?.destinoTeste) {
    destinos = [opcoes.destinoTeste];
  } else {
    const { data: admins } = await supabase
      .from('perfil')
      .select('email')
      .eq('papel', 'administrador')
      .eq('ativo', true);

    destinos = [
      ...new Set(
        [caixaDaAgencia, ...(admins ?? []).map((a) => String(a.email ?? '').trim())].filter(
          Boolean,
        ),
      ),
    ];
  }

  let pendentes = saldosUrgentes;

  if (!ehTeste) {
    if (saldosUrgentes.length === 0) {
      return {
        enviado: false,
        destino: destinos.join(', '),
        mensagem: 'Nenhuma conta com saldo crítico no momento.',
      };
    }

    /* Verifica na trilha `email_enviado` quais contas já receberam alerta hoje neste nível,
       evitando e-mails repetidos a cada rodada do cron ou abertura do painel. */
    const jaAlertadasHoje = new Set<string>();
    const { data: jaEnviados } = await supabase
      .from('email_enviado')
      .select('chave')
      .eq('tipo', 'saldo_midia')
      .eq('status', 'enviado')
      .like('chave', `${hoje}|%`);

    for (const linha of jaEnviados ?? []) {
      const partes = String(linha.chave ?? '').split('|')[1] ?? '';
      for (const item of partes.split(',')) {
        if (item) jaAlertadasHoje.add(item);
      }
    }

    pendentes = saldosUrgentes.filter((s) => !jaAlertadasHoje.has(`${s.contaId}:${s.nivel}`));

    if (pendentes.length === 0) {
      return {
        enviado: false,
        destino: destinos.join(', '),
        mensagem: 'Os alertas de saldo baixo de hoje já foram enviados por e-mail.',
      };
    }
  }

  const chave = ehTeste
    ? undefined
    : `${hoje}|${pendentes
        .map((s) => `${s.contaId}:${s.nivel}`)
        .sort()
        .join(',')}`;

  const modelo = avisoSaldoBaixo({ saldos: pendentes, ehTeste });
  const r = await enviarEmail({
    tipo: ehTeste ? 'teste_saldo_midia' : 'saldo_midia',
    para: destinos,
    chave,
    ...modelo,
  });

  if (!r.ok) {
    return {
      enviado: false,
      destino: destinos.join(', '),
      mensagem: r.erro,
    };
  }

  return {
    enviado: !r.repetido,
    destino: destinos.join(', '),
    mensagem: r.repetido
      ? 'O alerta de saldo baixo de hoje já havia saído por e-mail.'
      : `Alerta de saldo enviado por e-mail para ${destinos.join(', ')}.`,
  };
}

async function emitirNotificacoesSaldoBaixo(urgentes: SaldoContaMidia[], hoje: string) {
  const supabase = clienteServico();

  const { data: destinatarios } = await supabase
    .from('perfil')
    .select('id')
    .in('papel', ['administrador', 'gestor'])
    .eq('ativo', true);

  if (!destinatarios || destinatarios.length === 0) return;

  const linhas = [];
  for (const s of urgentes) {
    const valorFmt = dinheiroExato(s.saldoDisponivel ?? 0);
    const titulo =
      s.nivel === 'zerado'
        ? `Saldo esgotado: ${s.contaNome} (${valorFmt})`
        : `Saldo baixo: ${s.contaNome} (${valorFmt})`;
    const corpo =
      s.nivel === 'zerado'
        ? `A conta Meta Ads (${s.adAccountNome}) está sem saldo disponível e pode travar as campanhas.`
        : s.diasRestantes !== null
          ? `Restam ${valorFmt} (~${s.diasRestantes.toFixed(1).replace('.', ',')} dias no ritmo atual). Providencie recarga.`
          : `O saldo disponível na Meta Ads está em ${valorFmt}. Providencie recarga.`;

    const chave = `saldo_${s.nivel}:${s.contaId}:${hoje}`;

    for (const p of destinatarios) {
      linhas.push({
        perfil_id: p.id as string,
        tipo: 'aviso',
        titulo,
        corpo,
        link: `/painel/metricas?conta=${s.contaId}`,
        chave,
      });
    }
  }

  if (linhas.length > 0) {
    await supabase
      .from('notificacao')
      .upsert(linhas, { onConflict: 'perfil_id,chave', ignoreDuplicates: true });
  }
}
