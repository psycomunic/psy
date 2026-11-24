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
export const TEMPLATE_PADRAO_META = 'alerta_saldo_conta';

/**
 * Valida e limpa o `Phone Number ID` da Cloud API da Meta (sempre numérico de 8 a 25 dígitos).
 * Rejeita textos como `"Principal"` inseridos por preenchimento automático do navegador.
 */
export function limparPhoneNumberId(bruto: string | null | undefined): string | null {
  const limpo = (bruto ?? '').trim().replace(/\s+/g, '');
  if (!limpo) return null;
  return /^\d{8,25}$/.test(limpo) ? limpo : null;
}

/**
 * Monta o parâmetro `{{1}}` de corpo para templates `UTILITY` da Meta.
 * A Cloud API proíbe `\n`, `\t` e mais de 4 espaços seguidos em parâmetros de template (#132018).
 */
export function montarParametroTemplateSaldo(saldos: SaldoContaMidia[]): string {
  if (saldos.length === 0) {
    return 'Teste de conexão validado — nenhuma conta com saldo crítico neste momento';
  }

  const texto = saldos
    .map((s) => {
      const valor = dinheiroExato(s.saldoDisponivel ?? 0);
      const dias =
        s.diasRestantes !== null
          ? ` — ~${s.diasRestantes.toFixed(1).replace('.', ',')} dias no ritmo de ${dinheiroExato(s.gastoMedioDiario)}/dia`
          : '';
      return `${s.contaNome} (saldo ${valor}${dias})`;
    })
    .join('; ');

  return texto
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, 900);
}

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
