import 'server-only';
import { bancoConfigurado } from '@/lib/supabase/ambiente';
import { clienteServico } from '@/lib/supabase/servico';
import { hojeBR } from '@/lib/datas';
import { abrirSegredo } from '@/lib/ingestao/credenciais';
import type { SaldoContaMidia } from '@/lib/dados/tipos';
import {
  NUMERO_DESTINO_PADRAO,
  PISO_ALERTA_PADRAO_REAIS,
  TEMPLATE_PADRAO_META,
  limparPhoneNumberId,
  normalizarNumeroWhatsapp,
  montarMensagemSaldoBaixo,
  montarParametroTemplateSaldo,
  montarRequisicaoGateway,
} from './formato';

const VERSAO_META_API = 'v21.0';

type ConfigWhatsapp = {
  ativa: boolean;
  credencialId: string;
  modo: 'cloud_api' | 'webhook';
  destinatario: string;
  pisoAlerta: number;
  phoneNumberId: string | null;
  accessToken: string | null;
  templateNome: string | null;
  templateIdioma: string;
  webhookUrl: string | null;
  webhookToken: string | null;
  configuracaoBruta: Record<string, unknown>;
};

export type ResultadoDisparoWhatsapp = {
  enviado: boolean;
  modo: 'cloud_api' | 'webhook' | 'desconfigurado';
  destino: string;
  provedorId?: string | null;
  mensagem: string;
};

export async function lerConfigWhatsapp(): Promise<ConfigWhatsapp | null> {
  if (!bancoConfigurado) return null;

  const supabase = clienteServico();
  const { data: cred } = await supabase
    .from('credencial_agencia')
    .select('id, segredo, configuracao, ativa')
    .eq('provedor', 'whatsapp_alertas')
    .eq('ativa', true)
    .limit(1)
    .maybeSingle();

  if (!cred || !cred.ativa) return null;

  const cfg = ((cred.configuracao ?? {}) as Record<string, unknown>);
  let segredos: Record<string, string> = {};
  if (cred.segredo) {
    try {
      segredos = abrirSegredo(cred.segredo as string);
    } catch {
      segredos = {};
    }
  }

  /* Na Opção A (Meta Cloud API), se o usuário deixou o token em branco,
     reaproveita automaticamente o token do usuário de sistema já salvo em `meta_ads`. */
  let tokenMeta = segredos.access_token?.trim() || null;
  if (!tokenMeta) {
    const { data: credMeta } = await supabase
      .from('credencial_agencia')
      .select('segredo, ativa')
      .eq('provedor', 'meta_ads')
      .eq('ativa', true)
      .not('segredo', 'is', null)
      .order('rotulo', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (credMeta?.segredo) {
      try {
        const dec = abrirSegredo(credMeta.segredo as string);
        tokenMeta = dec.access_token?.trim() || null;
      } catch {
        tokenMeta = null;
      }
    }
  }

  const modo = String(cfg.modo ?? 'cloud_api') === 'webhook' ? 'webhook' : 'cloud_api';
  const pisoBruto = Number(String(cfg.piso_alerta ?? PISO_ALERTA_PADRAO_REAIS).replace(',', '.'));
  const pisoAlerta =
    Number.isFinite(pisoBruto) && pisoBruto > 0 ? pisoBruto : PISO_ALERTA_PADRAO_REAIS;

  return {
    ativa: true,
    credencialId: cred.id as string,
    modo,
    destinatario: normalizarNumeroWhatsapp(String(cfg.destinatario ?? NUMERO_DESTINO_PADRAO)),
    pisoAlerta,
    phoneNumberId: limparPhoneNumberId(String(cfg.phone_number_id ?? '')),
    accessToken: tokenMeta,
    templateNome: String(cfg.template_nome ?? '').trim() || null,
    templateIdioma: String(cfg.template_idioma ?? 'pt_BR').trim() || 'pt_BR',
    webhookUrl: String(cfg.webhook_url ?? '').trim() || null,
    webhookToken: segredos.webhook_token?.trim() || null,
    configuracaoBruta: cfg,
  };
}

/**
 * Descobre automaticamente o primeiro número `CLOUD_API` conectado nas WABAs da BM
 * quando o `phone_number_id` foi deixado em branco ou preenchido incorretamente.
 */
async function descobrirPhoneNumberIdMeta(accessToken: string): Promise<string | null> {
  try {
    const resContas = await fetch(
      `https://graph.facebook.com/${VERSAO_META_API}/me/adaccounts?fields=business{id}&limit=25&access_token=${encodeURIComponent(accessToken)}`,
      { cache: 'no-store' },
    );
    const jsonContas = (await resContas.json().catch(() => ({}))) as {
      data?: { business?: { id?: string } }[];
    };
    const bms = [
      ...new Set(
        (jsonContas.data ?? [])
          .map((c) => c.business?.id)
          .filter((id): id is string => Boolean(id)),
      ),
    ];

    for (const bmId of bms) {
      const resWaba = await fetch(
        `https://graph.facebook.com/${VERSAO_META_API}/${encodeURIComponent(bmId)}/owned_whatsapp_business_accounts?fields=phone_numbers{id,status,platform_type}&limit=25&access_token=${encodeURIComponent(accessToken)}`,
        { cache: 'no-store' },
      );
      const jsonWaba = (await resWaba.json().catch(() => ({}))) as {
        data?: {
          phone_numbers?: {
            data?: { id?: string; status?: string; platform_type?: string }[];
          };
        }[];
      };

      const todos = (jsonWaba.data ?? []).flatMap((w) => w.phone_numbers?.data ?? []);
      const conectadoCloud =
        todos.find((p) => p.status === 'CONNECTED' && p.platform_type === 'CLOUD_API') ??
        todos.find((p) => p.status === 'CONNECTED');

      const limpo = limparPhoneNumberId(conectadoCloud?.id);
      if (limpo) return limpo;
    }
  } catch {
    return null;
  }
  return null;
}

async function enviarPelaCloudApiMeta({
  cfg,
  texto,
  saldos,
}: {
  cfg: ConfigWhatsapp;
  texto: string;
  saldos: SaldoContaMidia[];
}): Promise<{ ok: boolean; id?: string | null; erro?: string }> {
  if (!cfg.accessToken) {
    return {
      ok: false,
      erro: 'Falta o token de acesso da Meta (com permissão whatsapp_business_messaging).',
    };
  }

  let phoneNumberId = cfg.phoneNumberId;
  if (!phoneNumberId) {
    phoneNumberId = await descobrirPhoneNumberIdMeta(cfg.accessToken);
    if (phoneNumberId && bancoConfigurado) {
      /* Persiste o ID numérico descoberto para não precisar buscar toda vez */
      await clienteServico()
        .from('credencial_agencia')
        .update({
          configuracao: {
            ...cfg.configuracaoBruta,
            phone_number_id: phoneNumberId,
          },
        })
        .eq('id', cfg.credencialId)
        .then(() => undefined, () => undefined);
    }
  }

  if (!phoneNumberId) {
    return {
      ok: false,
      erro: 'Falta informar o Phone Number ID numérico da Meta (ex.: 1201735229697128) em Configurações > WhatsApp · Alertas de Saldo.',
    };
  }

  const endpoint = `https://graph.facebook.com/${VERSAO_META_API}/${encodeURIComponent(phoneNumberId)}/messages`;
  const headers = {
    Authorization: `Bearer ${cfg.accessToken}`,
    'Content-Type': 'application/json',
  };

  /* Prioriza template `UTILITY` (informado pelo usuário ou `alerta_saldo_conta` padrão)
     porque entrega 24h/7 mesmo quando o destinatário não conversou nas últimas 24h.
     Se o template padrão ainda estiver em análise na Meta (#132001), cai automaticamente
     para o envio de texto livre. */
  const templateEscolhido = cfg.templateNome || TEMPLATE_PADRAO_META;
  const usouTemplatePadraoAutomatico = !cfg.templateNome;

  {
    const ehHelloWorld = templateEscolhido === 'hello_world';
    const idioma = ehHelloWorld ? 'en_US' : cfg.templateIdioma;
    const resumoCurto = montarParametroTemplateSaldo(saldos);

    const corpoComParam = {
      messaging_product: 'whatsapp',
      to: cfg.destinatario,
      type: 'template',
      template: {
        name: templateEscolhido,
        language: { code: idioma },
        ...(ehHelloWorld
          ? {}
          : {
              components: [
                {
                  type: 'body',
                  parameters: [{ type: 'text', text: resumoCurto }],
                },
              ],
            }),
      },
    };

    let res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(corpoComParam),
      cache: 'no-store',
    });
    let json = (await res.json().catch(() => ({}))) as {
      messages?: { id?: string }[];
      error?: { code?: number; message?: string };
    };

    /* Código 132000 = número de parâmetros diferente (ex.: template estático sem variáveis) */
    if (!res.ok && json.error?.code === 132000 && !ehHelloWorld) {
      res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: cfg.destinatario,
          type: 'template',
          template: {
            name: templateEscolhido,
            language: { code: idioma },
          },
        }),
        cache: 'no-store',
      });
      json = await res.json().catch(() => ({}));
    }

    if (res.ok) {
      return { ok: true, id: json.messages?.[0]?.id ?? null };
    }

    /* Se o usuário digitou um nome de template específico e a Meta recusou, devolve o erro exato.
       Se era apenas a tentativa automática com `alerta_saldo_conta` (ex.: ainda pendente de aprovação),
       segue adiante para o disparo de texto livre. */
    const codigoErro = json.error?.code;
    const templateIndisponivel = codigoErro === 132001 || codigoErro === 132005 || codigoErro === 100;
    if (!usouTemplatePadraoAutomatico || !templateIndisponivel) {
      return {
        ok: false,
        erro: `Meta WhatsApp (#${codigoErro ?? res.status}): ${json.error?.message ?? 'Falha ao enviar template.'}`,
      };
    }
  }

  /* Sem template configurado: envia mensagem de texto livre completa (funciona
     gratuitamente sempre que houver janela de 24h aberta entre o 47992406661 e o número da API). */
  const resTxt = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: cfg.destinatario,
      type: 'text',
      text: { preview_url: false, body: texto },
    }),
    cache: 'no-store',
  });

  const jsonTxt = (await resTxt.json().catch(() => ({}))) as {
    messages?: { id?: string }[];
    error?: { code?: number; message?: string };
  };

  if (!resTxt.ok) {
    if (jsonTxt.error?.code === 131047) {
      return {
        ok: false,
        erro:
          'Meta WhatsApp: a janela de 24h está fechada. Envie um "oi" do seu WhatsApp (47) 99240-6661 para o número conectado na API ou informe um Nome de Template aprovado em Configurações.',
      };
    }
    return {
      ok: false,
      erro: `Meta WhatsApp (#${jsonTxt.error?.code ?? resTxt.status}): ${jsonTxt.error?.message ?? 'Falha no envio.'}`,
    };
  }

  return { ok: true, id: jsonTxt.messages?.[0]?.id ?? null };
}

async function enviarPeloGateway({
  cfg,
  texto,
}: {
  cfg: ConfigWhatsapp;
  texto: string;
}): Promise<{ ok: boolean; id?: string | null; erro?: string }> {
  if (!cfg.webhookUrl) {
    return {
      ok: false,
      erro: 'Falta informar a URL da API / Webhook em Configurações > WhatsApp · Alertas de Saldo.',
    };
  }

  const req = montarRequisicaoGateway({
    url: cfg.webhookUrl,
    token: cfg.webhookToken,
    numero: cfg.destinatario,
    texto,
  });

  const res = await fetch(cfg.webhookUrl, {
    method: 'POST',
    headers: req.headers,
    body: JSON.stringify(req.body),
    cache: 'no-store',
  });

  const bruto = await res.text().catch(() => '');
  if (!res.ok) {
    return {
      ok: false,
      erro: `Gateway HTTP ${res.status}: ${bruto.slice(0, 160) || 'sem detalhe'}`,
    };
  }

  let id: string | null = null;
  try {
    const j = JSON.parse(bruto) as Record<string, unknown>;
    id = String(j.messageId ?? j.zaapId ?? j.id ?? '') || null;
  } catch {
    id = null;
  }

  return { ok: true, id };
}

/**
 * Filtra contas que ainda NÃO receberam alerta neste nível hoje (trava anti-spam),
 * envia 1 única mensagem consolidada para `5547992406661` e grava as chaves enviadas.
 */
export async function dispararAlertasSaldoWhatsapp(
  saldosUrgentes: SaldoContaMidia[],
  opcoes?: { forcarTeste?: boolean },
): Promise<ResultadoDisparoWhatsapp> {
  const cfg = await lerConfigWhatsapp();
  if (!cfg) {
    return {
      enviado: false,
      modo: 'desconfigurado',
      destino: NUMERO_DESTINO_PADRAO,
      mensagem:
        'Configure o cartão "WhatsApp · Alertas de Saldo" em Configurações antes de disparar.',
    };
  }

  const supabase = clienteServico();
  const hoje = hojeBR();
  const ehTeste = Boolean(opcoes?.forcarTeste);

  let pendentes = saldosUrgentes;

  if (!ehTeste) {
    if (saldosUrgentes.length === 0) {
      return {
        enviado: false,
        modo: cfg.modo,
        destino: cfg.destinatario,
        mensagem: 'Nenhuma conta com saldo crítico no momento.',
      };
    }

    const chavesDesejadas = saldosUrgentes.map(
      (s) => `saldo_${s.nivel}:${s.contaId}:${hoje}`,
    );

    /* 1. Checa na tabela `whatsapp_enviado` (quando a migração 0052 está aplicada) */
    const jaEnviadas = new Set<string>();
    const { data: gravadas, error: erroTab } = await supabase
      .from('whatsapp_enviado')
      .select('chave')
      .eq('tipo', 'saldo_midia')
      .eq('status', 'enviado')
      .in('chave', chavesDesejadas);

    if (!erroTab && Array.isArray(gravadas)) {
      for (const g of gravadas) {
        if (g.chave) jaEnviadas.add(g.chave as string);
      }
    }

    /* 2. Fallback em memória persistida na própria configuração da credencial
          para funcionar mesmo sem rodar a migração 0052. */
    const cacheHoje = Array.isArray(cfg.configuracaoBruta._enviados_hoje)
      ? (cfg.configuracaoBruta._enviados_hoje as string[])
      : [];
    for (const ch of cacheHoje) {
      if (ch.endsWith(`:${hoje}`)) jaEnviadas.add(ch);
    }

    pendentes = saldosUrgentes.filter(
      (s) => !jaEnviadas.has(`saldo_${s.nivel}:${s.contaId}:${hoje}`),
    );

    if (pendentes.length === 0) {
      return {
        enviado: false,
        modo: cfg.modo,
        destino: cfg.destinatario,
        mensagem: 'Os alertas de saldo baixo de hoje já foram enviados anteriormente.',
      };
    }
  }

  const urlSite = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.psycomunic.com.br';
  const texto = montarMensagemSaldoBaixo(pendentes, { urlSite, ehTeste });

  const resultado =
    cfg.modo === 'cloud_api'
      ? await enviarPelaCloudApiMeta({ cfg, texto, saldos: pendentes })
      : await enviarPeloGateway({ cfg, texto });

  if (!resultado.ok) {
    /* Registra falha na tabela se ela existir, sem derrubar o fluxo */
    await supabase
      .from('whatsapp_enviado')
      .insert({
        tipo: ehTeste ? 'teste_saldo' : 'saldo_midia',
        chave: null,
        destino: cfg.destinatario,
        resumo: pendentes.map((s) => s.contaNome).join(', ') || 'Teste',
        provedor: cfg.modo,
        status: 'falhou',
        erro: resultado.erro ?? 'Falha desconhecida',
      })
      .then(() => undefined, () => undefined);

    return {
      enviado: false,
      modo: cfg.modo,
      destino: cfg.destinatario,
      mensagem: resultado.erro ?? 'Falha ao enviar mensagem no WhatsApp.',
    };
  }

  if (!ehTeste && pendentes.length > 0) {
    const novasChaves = pendentes.map((s) => `saldo_${s.nivel}:${s.contaId}:${hoje}`);

    await supabase
      .from('whatsapp_enviado')
      .upsert(
        pendentes.map((s) => ({
          tipo: 'saldo_midia',
          chave: `saldo_${s.nivel}:${s.contaId}:${hoje}`,
          destino: cfg.destinatario,
          resumo: `${s.contaNome}: R$ ${(s.saldoDisponivel ?? 0).toFixed(2)}`,
          provedor: cfg.modo,
          provedor_id: resultado.id ?? null,
          status: 'enviado',
        })),
        { onConflict: 'tipo,chave', ignoreDuplicates: true },
      )
      .then(() => undefined, () => undefined);

    /* Mantém apenas as chaves de hoje no fallback JSONB para nunca crescer sem limite */
    const antigasDeHoje = (
      Array.isArray(cfg.configuracaoBruta._enviados_hoje)
        ? (cfg.configuracaoBruta._enviados_hoje as string[])
        : []
    ).filter((ch) => ch.endsWith(`:${hoje}`));

    await supabase
      .from('credencial_agencia')
      .update({
        configuracao: {
          ...cfg.configuracaoBruta,
          _enviados_hoje: [...new Set([...antigasDeHoje, ...novasChaves])],
        },
      })
      .eq('id', cfg.credencialId)
      .then(() => undefined, () => undefined);
  }

  return {
    enviado: true,
    modo: cfg.modo,
    destino: cfg.destinatario,
    provedorId: resultado.id ?? null,
    mensagem: `Alerta enviado no WhatsApp para +${cfg.destinatario}${resultado.id ? ` (ID: ${resultado.id.slice(0, 18)})` : ''}.`,
  };
}
