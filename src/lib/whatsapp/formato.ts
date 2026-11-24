import { dinheiroExato } from '../formato.ts';
import type { SaldoContaMidia } from '../dados/tipos.ts';

/**
 * Formatação pura e adaptadores de protocolo para envio de alertas de saldo
 * via WhatsApp:
 *   - Opção A (`cloud_api`): WhatsApp Cloud API Oficial da Meta (v21.0)
 *   - Opção B (`webhook`): Z-API, Evolution API, Uazapi ou Webhook genérico (n8n/Make)
 */

export const NUMERO_DESTINO_PADRAO = '5547992406661';
export const PISO_ALERTA_PADRAO_REAIS = 150;

/**
 * Normaliza telefone brasileiro para E.164 sem sinal de `+` (`5547992406661`).
 */
export function normalizarNumeroWhatsapp(bruto: string | null | undefined): string {
  const digitos = (bruto ?? '').replace(/\D/g, '');
  if (!digitos) return NUMERO_DESTINO_PADRAO;
  if (digitos.length === 10 || digitos.length === 11) {
    return `55${digitos}`;
  }
  return digitos;
}

export function montarMensagemSaldoBaixo(
  saldos: SaldoContaMidia[],
  opcoes?: { urlSite?: string; ehTeste?: boolean },
): string {
  const base = (opcoes?.urlSite ?? 'https://www.psycomunic.com.br').replace(/\/$/, '');
  const cabecalho = opcoes?.ehTeste
    ? '🔔 *Teste de Alerta de Saldo — Psy Comunic*'
    : saldos.some((s) => s.nivel === 'zerado')
      ? '🚨 *Alerta Urgente: Saldo Esgotado — Psy Comunic*'
      : '⚠️ *Alerta de Saldo Baixo — Psy Comunic*';

  if (saldos.length === 0) {
    return [
      cabecalho,
      '',
      '✅ Conexão com o seu WhatsApp validada com sucesso!',
      'Nenhuma conta de anúncios está com saldo crítico neste momento.',
      `🔗 Painel: ${base}/painel/visao`,
    ].join('\n');
  }

  const blocos = saldos.map((s) => {
    const icone =
      s.nivel === 'zerado' ? '🔴' : s.nivel === 'critico' ? '🟠' : s.nivel === 'atencao' ? '🟡' : '🟢';
    const valor =
      s.modalidade === 'pre_pago' || s.saldoDisponivel !== null
        ? dinheiroExato(s.saldoDisponivel ?? 0)
        : 'Pós-pago';
    const autonomia =
      s.diasRestantes !== null
        ? ` (~${s.diasRestantes.toFixed(1).replace('.', ',')} dias no ritmo de ${dinheiroExato(s.gastoMedioDiario)}/dia)`
        : '';

    return [
      `${icone} *${s.contaNome}*`,
      `• Conta Meta: ${s.adAccountNome}`,
      `• Saldo disponível: *${valor}*${autonomia}`,
    ].join('\n');
  });

  const rodape =
    saldos.length === 1
      ? `🔗 Conferir conta: ${base}/painel/metricas?conta=${saldos[0].contaId}`
      : `🔗 Conferir todas no painel: ${base}/painel/visao`;

  return [
    cabecalho,
    '',
    blocos.join('\n\n'),
    '',
    'Solicite recarga via PIX/Boleto para evitar pausa nas campanhas.',
    rodape,
  ].join('\n');
}

/**
 * Monta cabeçalhos e corpo HTTP compatíveis automaticamente com Z-API,
 * Evolution API, Uazapi ou Webhook genérico (n8n / Make) para a Opção B.
 */
export function montarRequisicaoGateway({
  url,
  token,
  numero,
  texto,
}: {
  url: string;
  token?: string | null;
  numero: string;
  texto: string;
}): { headers: Record<string, string>; body: Record<string, unknown> } {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const limpo = token?.trim();

  if (limpo) {
    if (/z-api\.io/i.test(url)) {
      headers['Client-Token'] = limpo;
    } else if (/sendText|evolution/i.test(url)) {
      headers.apikey = limpo;
    } else {
      headers.Authorization = `Bearer ${limpo}`;
      headers.apikey = limpo;
    }
  }

  /* Z-API espera `{ phone, message }` */
  if (/z-api\.io/i.test(url)) {
    return {
      headers,
      body: { phone: numero, message: texto },
    };
  }

  /* Evolution API v1/v2 aceita `{ number, text }` */
  if (/message\/sendText/i.test(url)) {
    return {
      headers,
      body: { number: numero, text: texto, textMessage: { text: texto } },
    };
  }

  /* Formato universal (Uazapi, n8n, Make ou endpoint próprio) */
  return {
    headers,
    body: {
      phone: numero,
      number: numero,
      to: numero,
      text: texto,
      message: texto,
      origem: 'psy_comunic',
      evento: 'alerta_saldo_midia',
    },
  };
}
