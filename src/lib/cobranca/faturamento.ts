import 'server-only';
import { clienteServico } from '@/lib/supabase/servico';
import { clienteServidor } from '@/lib/supabase/servidor';
import { abrirSegredo } from '@/lib/ingestao/credenciais';
import { hojeBR } from '@/lib/datas';
import {
  garantirCliente,
  emitirCobranca,
  pixDaCobranca,
  consultarCobranca,
  cancelarCobranca,
  receberEmDinheiro,
  saldoAsaas,
  criarAssinatura,
  cancelarAssinatura,
  cobrancasDaAssinatura,
  statusDaFatura,
  ErroAsaas,
  type AmbienteAsaas,
} from './asaas';

/**
 * Faturamento: da fatura no nosso banco à cobrança no Asaas.
 *
 * ============================================================
 * A ORDEM É DELIBERADA
 * ============================================================
 *   1. a fatura nasce AQUI, por uma função do Postgres idempotente
 *   2. só então a cobrança é criada lá
 *   3. e o id de lá volta para a nossa linha
 *
 * O contrário — criar no Asaas e depois gravar — deixa cobrança órfã
 * quando a gravação falha: o cliente recebe um boleto que o painel não
 * conhece, e ninguém descobre até ele pagar.
 *
 * Se a etapa 3 falhar, a cobrança existe lá e a fatura existe aqui sem
 * o vínculo. O `externalReference` carrega o id da nossa fatura, então
 * o webhook ainda encontra a linha certa. É a rede de segurança do
 * caso raro.
 */

export type ResultadoCobranca = {
  ok: boolean;
  faturaId: string | null;
  link: string | null;
  mensagem: string;
};

/* ------------------------------------------------------------------ */
/* Credencial                                                          */
/* ------------------------------------------------------------------ */

export type CredencialAsaas = {
  chave: string;
  ambiente: AmbienteAsaas;
  webhookToken: string | null;
};

/**
 * A credencial do Asaas, decifrada.
 *
 * Lê com a service role porque `credencial_agencia` não tem política
 * nenhuma. Quem chama precisa ter conferido o papel: não há RLS atrás
 * disto para consertar um esquecimento.
 */
export async function credencialAsaas(): Promise<CredencialAsaas | null> {
  const supabase = clienteServico();
  const { data } = await supabase
    .from('credencial_agencia')
    .select('segredo, configuracao')
    .eq('provedor', 'asaas')
    .eq('ativa', true)
    .not('segredo', 'is', null)
    .limit(1)
    .maybeSingle();

  if (!data?.segredo) return null;

  const s = abrirSegredo(data.segredo as string);
  const cfg = (data.configuracao ?? {}) as Record<string, string>;

  /* Qualquer coisa diferente de "producao" cai em sandbox. Falha para o
     lado seguro: um erro de digitação na configuração não pode emitir
     cobrança de verdade para o cliente. */
  const ambiente: AmbienteAsaas = cfg.ambiente === 'producao' ? 'producao' : 'sandbox';

  return {
    chave: s.api_key,
    ambiente,
    webhookToken: s.webhook_token ?? null,
  };
}

/* ------------------------------------------------------------------ */
/* Diário                                                              */
/* ------------------------------------------------------------------ */

async function registrar(dados: {
  faturaId?: string | null;
  asaasId?: string | null;
  origem: 'emissao' | 'webhook' | 'consulta' | 'cancelamento';
  evento?: string | null;
  status: 'sucesso' | 'erro';
  erro?: string | null;
  carga?: unknown;
}) {
  const supabase = clienteServico();
  await supabase.from('cobranca_evento').insert({
    fatura_id: dados.faturaId ?? null,
    asaas_id: dados.asaasId ?? null,
    origem: dados.origem,
    evento: dados.evento ?? null,
    status: dados.status,
    erro: dados.erro ?? null,
    carga: dados.carga ?? null,
  });
}

/* ------------------------------------------------------------------ */
/* Emissão                                                             */
/* ------------------------------------------------------------------ */

/**
 * Emite a fatura da competência e cria a cobrança no Asaas.
 *
 * Idempotente nas duas pontas: `emitir_fatura` devolve a fatura que já
 * existe em vez de criar outra, e uma fatura que já tem `asaas_id` não
 * gera segunda cobrança. Clicar duas vezes no botão não custa dinheiro
 * ao cliente.
 */
export async function faturarContrato(
  contratoId: string,
  competencia: string,
): Promise<ResultadoCobranca> {
  const supabase = await clienteServidor();

  /* A criação da fatura passa pelo RLS e pela checagem de papel dentro
     da função do Postgres. Só a conversa com o Asaas usa service role,
     porque a credencial não é legível pela chave pública. */
  const { data: faturaId, error } = await supabase.rpc('emitir_fatura', {
    p_contrato_id: contratoId,
    p_competencia: competencia,
  });

  if (error) return { ok: false, faturaId: null, link: null, mensagem: error.message };

  return cobrarFatura(faturaId as string);
}

/** Cria a cobrança no Asaas para uma fatura que já existe. */
export async function cobrarFatura(faturaId: string): Promise<ResultadoCobranca> {
  const servico = clienteServico();

  const { data: fatura } = await servico
    .from('fatura')
    .select('id, numero, valor, vencimento, competencia, descricao, parcelas, contrato_id, asaas_id, link_pagamento, conta:conta_id(id, nome, documento, asaas_cliente_id)')
    .eq('id', faturaId)
    .maybeSingle();

  if (!fatura) {
    return { ok: false, faturaId, link: null, mensagem: 'Fatura não encontrada.' };
  }

  /* Já cobrada. Devolve o link em vez de emitir de novo. */
  if (fatura.asaas_id) {
    return {
      ok: true,
      faturaId,
      link: (fatura.link_pagamento as string) ?? null,
      mensagem: 'Esta fatura já tinha cobrança. Nada foi emitido de novo.',
    };
  }

  const cred = await credencialAsaas();
  if (!cred) {
    return {
      ok: false,
      faturaId,
      link: null,
      mensagem: 'O Asaas não está conectado. Configure a chave em Configurações.',
    };
  }

  const conta = fatura.conta as unknown as {
    id: string;
    nome: string;
    documento: string | null;
    asaas_cliente_id: string | null;
  };

  if (!conta.documento) {
    /* O Asaas exige CPF ou CNPJ para criar o cliente. Falhar aqui, com
       o motivo, é melhor que mandar um documento vazio e receber de
       volta "cpfCnpj inválido", que não diz onde consertar. */
    return {
      ok: false,
      faturaId,
      link: null,
      mensagem: `A loja ${conta.nome} está sem CNPJ. O Asaas exige o documento para emitir cobrança.`,
    };
  }

  try {
    /* 1. Cliente no Asaas, criado uma vez e reusado. */
    let clienteAsaas = conta.asaas_cliente_id;
    if (!clienteAsaas) {
      const c = await garantirCliente(cred, { nome: conta.nome, documento: conta.documento });
      clienteAsaas = c.id;
      await servico.from('conta').update({ asaas_cliente_id: c.id }).eq('id', conta.id);
    }

    /* 2. A cobrança.

       A descrição é o que o cliente lê no e-mail e no boleto. Cobrança
       avulsa traz a sua; fatura de contrato não tem uma, e o mês por
       extenso é o que responde "que cobrança é essa?" sem ninguém
       precisar perguntar. */
    const descricao =
      (fatura.descricao as string | null)?.trim() ||
      `Psy Comunic · fee de ${new Date(`${fatura.competencia}T12:00:00Z`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' })}`;

    const cobranca = await emitirCobranca(cred, {
      clienteAsaas,
      valor: Number(fatura.valor),
      vencimento: fatura.vencimento as string,
      descricao,
      faturaId,
      parcelas: Number(fatura.parcelas ?? 1),
    });

    /* 3. O PIX é uma chamada à parte e pode falhar sozinho. Falha aqui
       não derruba a emissão: a cobrança já está de pé. */
    const pix = await pixDaCobranca(cred, cobranca.id);

    await servico
      .from('fatura')
      .update({
        asaas_id: cobranca.id,
        link_pagamento: cobranca.invoiceUrl ?? null,
        link_boleto: cobranca.bankSlipUrl ?? null,
        pix_copia_cola: pix,
        status: statusDaFatura(cobranca.status),
        /* Já na emissão o Asaas informa quanto vai sobrar depois da
           taxa. É o número que responde "faturei cinco mil, entra
           quanto?", e ele não aparece em lugar nenhum se não for
           guardado agora. */
        valor_liquido: cobranca.netValue ?? null,
        asaas_parcelamento: cobranca.installment ?? null,
        sincronizada_em: new Date().toISOString(),
      })
      .eq('id', faturaId);

    await registrar({
      faturaId,
      asaasId: cobranca.id,
      origem: 'emissao',
      status: 'sucesso',
      carga: cobranca,
    });

    return {
      ok: true,
      faturaId,
      link: cobranca.invoiceUrl ?? null,
      mensagem: `Cobrança de ${Number(fatura.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} emitida${cred.ambiente === 'sandbox' ? ' no SANDBOX' : ''}.`,
    };
  } catch (e) {
    const msg = e instanceof ErroAsaas ? e.message : (e as Error).message;
    await registrar({ faturaId, origem: 'emissao', status: 'erro', erro: msg });
    return { ok: false, faturaId, link: null, mensagem: `Asaas: ${msg}` };
  }
}

/* ------------------------------------------------------------------ */
/* Retorno do Asaas                                                    */
/* ------------------------------------------------------------------ */

/**
 * Aplica um evento de pagamento vindo do webhook.
 *
 * Idempotente porque precisa ser: o Asaas reenvia o evento quando não
 * recebe 200, e a mesma confirmação pode chegar três vezes. Como tudo
 * o que ela faz é ESCREVER O ESTADO ATUAL — e não somar nem alternar —
 * repetir não muda o resultado.
 *
 * Acha a fatura por `asaas_id` e, se não achar, por `externalReference`.
 * O segundo caminho cobre a corrida em que o evento chega antes de a
 * emissão terminar de gravar o id.
 */
export async function aplicarEventoAsaas(corpo: {
  event?: string;
  payment?: {
    id?: string;
    status?: string;
    billingType?: string;
    paymentDate?: string;
    externalReference?: string;
    invoiceUrl?: string;
    netValue?: number;
    /** Presente quando a cobrança nasceu de uma assinatura. */
    subscription?: string;
    value?: number;
    dueDate?: string;
  };
}): Promise<{ ok: boolean; mensagem: string }> {
  const pagamento = corpo.payment;
  if (!pagamento?.id) {
    return { ok: false, mensagem: 'Evento sem pagamento.' };
  }

  const servico = clienteServico();

  let { data: fatura } = await servico
    .from('fatura')
    .select('id, status')
    .eq('asaas_id', pagamento.id)
    .maybeSingle();

  /* O `externalReference` de uma cobrança avulsa ou de contrato carrega
     o id da NOSSA fatura. Numa cobrança de assinatura ele carrega o id
     do CONTRATO, herdado da assinatura — por isso a busca é guardada
     por um teste de uuid e continua sendo por `fatura.id`: contrato e
     fatura são tabelas diferentes, e um acerto por acaso aqui aplicaria
     um pagamento na linha errada. */
  if (!fatura && pagamento.externalReference && !pagamento.subscription) {
    const r = await servico
      .from('fatura')
      .select('id, status')
      .eq('id', pagamento.externalReference)
      .maybeSingle();
    fatura = r.data;
  }

  /*
    A cobrança que a assinatura gerou sozinha.

    Ela nasce no Asaas, no dia, sem ninguém clicar em nada. Este painel
    nunca a viu. Sem criar a linha aqui, o evento viraria só um registro
    dizendo "não encontrada" — e um cliente com cobrança automática
    pagaria todo mês sem entrar em nenhum indicador.
  */
  if (!fatura && pagamento.subscription) {
    const { data: novaId } = await servico.rpc('fatura_de_assinatura', {
      p_assinatura: pagamento.subscription,
      p_asaas_id: pagamento.id,
      p_valor: pagamento.value ?? 0,
      p_vencimento: pagamento.dueDate ?? hojeBR(),
    });

    if (novaId) {
      const r = await servico
        .from('fatura')
        .select('id, status')
        .eq('id', novaId as string)
        .maybeSingle();
      fatura = r.data;
    }
  }

  if (!fatura) {
    /* Evento de uma cobrança que este painel não conhece. Registrar
       mesmo assim: pode ser cobrança criada direto no Asaas, e o
       silêncio aqui vira "o dinheiro entrou e ninguém sabe de onde". */
    await registrar({
      asaasId: pagamento.id,
      origem: 'webhook',
      evento: corpo.event,
      status: 'erro',
      erro: 'Cobrança não encontrada no painel.',
      carga: corpo,
    });
    return { ok: true, mensagem: 'Evento registrado, sem fatura correspondente.' };
  }

  const novoStatus = statusDaFatura(pagamento.status ?? '');

  /*
    Fatura paga não volta a "vencida" por evento antigo reentregue.

    O Asaas reenvia o que falhou, com espera crescente. Um
    PAYMENT_OVERDUE que ficou preso na fila pode chegar DEPOIS de um
    PAYMENT_RECEIVED já processado, e sem esta guarda ele viraria uma
    cobrança em cima de quem já pagou.

    "Cancelada" passa de propósito: estorno e chargeback são justamente
    os casos em que uma fatura paga deixa de estar paga, e ignorá-los
    esconderia dinheiro que voltou.
  */
  if (fatura.status === 'paga' && novoStatus !== 'paga' && novoStatus !== 'cancelada') {
    await registrar({
      faturaId: fatura.id as string,
      asaasId: pagamento.id,
      origem: 'webhook',
      evento: corpo.event,
      status: 'sucesso',
      erro: `Ignorado: fatura já paga, evento diria "${novoStatus}".`,
      carga: corpo,
    });
    return { ok: true, mensagem: 'Evento antigo ignorado: a fatura já está paga.' };
  }

  await servico
    .from('fatura')
    .update({
      asaas_id: pagamento.id,
      status: novoStatus,
      /* `paga_em` só quando de fato pagou. Gravar a data em qualquer
         evento faria uma cobrança vencida parecer paga no relatório. */
      paga_em: novoStatus === 'paga' ? (pagamento.paymentDate ?? new Date().toISOString().slice(0, 10)) : null,
      forma_pagamento: pagamento.billingType ?? null,
      link_pagamento: pagamento.invoiceUrl ?? undefined,
      /* O líquido só é definitivo na confirmação: a taxa depende de
         como o cliente escolheu pagar, e PIX, boleto e cartão custam
         diferente. `undefined` mantém o que a emissão estimou. */
      valor_liquido: typeof pagamento.netValue === 'number' ? pagamento.netValue : undefined,
      sincronizada_em: new Date().toISOString(),
    })
    .eq('id', fatura.id);

  await registrar({
    faturaId: fatura.id as string,
    asaasId: pagamento.id,
    origem: 'webhook',
    evento: corpo.event,
    status: 'sucesso',
    carga: corpo,
  });

  return { ok: true, mensagem: `Fatura marcada como ${novoStatus}.` };
}

/**
 * Confere no Asaas o estado real de uma cobrança.
 *
 * Existe porque webhook se perde: rede cai, deploy acontece no meio,
 * a rota fica fora do ar por dois minutos. Sem um caminho de puxar,
 * uma fatura paga fica "enviada" para sempre e alguém cobra um cliente
 * que já pagou.
 */
export async function conferirFatura(faturaId: string): Promise<ResultadoCobranca> {
  const servico = clienteServico();
  const { data: fatura } = await servico
    .from('fatura')
    .select('id, asaas_id')
    .eq('id', faturaId)
    .maybeSingle();

  if (!fatura?.asaas_id) {
    return { ok: false, faturaId, link: null, mensagem: 'Esta fatura ainda não foi cobrada.' };
  }

  const cred = await credencialAsaas();
  if (!cred) return { ok: false, faturaId, link: null, mensagem: 'O Asaas não está conectado.' };

  try {
    const c = await consultarCobranca(cred, fatura.asaas_id as string);
    await aplicarEventoAsaas({ event: 'CONSULTA_MANUAL', payment: c });
    return {
      ok: true,
      faturaId,
      link: c.invoiceUrl ?? null,
      mensagem: `Estado no Asaas: ${c.status}.`,
    };
  } catch (e) {
    const msg = e instanceof ErroAsaas ? e.message : (e as Error).message;
    await registrar({ faturaId, origem: 'consulta', status: 'erro', erro: msg });
    return { ok: false, faturaId, link: null, mensagem: `Asaas: ${msg}` };
  }
}

/* ------------------------------------------------------------------ */
/* Cobrança avulsa                                                     */
/* ------------------------------------------------------------------ */

/**
 * Cobra qualquer coisa que não seja o fee do mês.
 *
 * Setup, projeto de loja, criativo extra, reembolso de mídia. Antes
 * disso, essas cobranças eram feitas à mão no site do Asaas — fora do
 * painel, fora de todo indicador, e sem ninguém para lembrar de
 * conferir se foram pagas.
 */
export async function criarCobrancaAvulsa(dados: {
  contaId: string;
  valor: number;
  vencimento: string;
  descricao: string;
  parcelas?: number;
}): Promise<ResultadoCobranca> {
  const supabase = await clienteServidor();

  /* Nasce aqui primeiro, pela função do Postgres, que confere o papel.
     Mesma ordem da fatura de contrato, e pela mesma razão: cobrança
     criada lá e não gravada aqui é boleto que o painel não conhece. */
  const { data: faturaId, error } = await supabase.rpc('criar_cobranca_avulsa', {
    p_conta_id: dados.contaId,
    p_valor: dados.valor,
    p_vencimento: dados.vencimento,
    p_descricao: dados.descricao,
    p_parcelas: dados.parcelas ?? 1,
  });

  if (error) return { ok: false, faturaId: null, link: null, mensagem: error.message };

  return cobrarFatura(faturaId as string);
}

/* ------------------------------------------------------------------ */
/* Fim de vida de uma cobrança                                         */
/* ------------------------------------------------------------------ */

/**
 * Cancela a cobrança no Asaas e marca a fatura.
 *
 * A ordem é lá primeiro. Marcar cancelada aqui e falhar lá deixaria o
 * cliente recebendo lembrete de uma cobrança que o painel já considera
 * morta, e a agência sem saber por que ele está reclamando.
 *
 * Fatura paga não cancela por aqui: dinheiro que já entrou se desfaz
 * com estorno, que é outra operação e tem consequência contábil.
 */
export async function cancelarFatura(faturaId: string): Promise<ResultadoCobranca> {
  const servico = clienteServico();

  const { data: fatura } = await servico
    .from('fatura')
    .select('id, numero, status, asaas_id')
    .eq('id', faturaId)
    .maybeSingle();

  if (!fatura) return { ok: false, faturaId, link: null, mensagem: 'Fatura não encontrada.' };

  if (fatura.status === 'paga') {
    return {
      ok: false,
      faturaId,
      link: null,
      mensagem:
        'Esta fatura já foi paga. Cancelar não devolve dinheiro: o caminho é estorno, direto no Asaas.',
    };
  }

  if (fatura.status === 'cancelada') {
    return { ok: true, faturaId, link: null, mensagem: 'Esta fatura já estava cancelada.' };
  }

  if (fatura.asaas_id) {
    const cred = await credencialAsaas();
    if (!cred) {
      return { ok: false, faturaId, link: null, mensagem: 'O Asaas não está conectado.' };
    }
    try {
      await cancelarCobranca(cred, fatura.asaas_id as string);
    } catch (e) {
      const msg = e instanceof ErroAsaas ? e.message : (e as Error).message;
      await registrar({
        faturaId,
        asaasId: fatura.asaas_id as string,
        origem: 'cancelamento',
        status: 'erro',
        erro: msg,
      });
      return { ok: false, faturaId, link: null, mensagem: `Asaas: ${msg}` };
    }
  }

  await servico
    .from('fatura')
    .update({ status: 'cancelada', cancelada_em: new Date().toISOString() })
    .eq('id', faturaId);

  await registrar({
    faturaId,
    asaasId: (fatura.asaas_id as string) ?? null,
    origem: 'cancelamento',
    status: 'sucesso',
  });

  return {
    ok: true,
    faturaId,
    link: null,
    mensagem: `Fatura ${fatura.numero} cancelada${fatura.asaas_id ? ' aqui e no Asaas' : ''}.`,
  };
}

/**
 * Registra pagamento que não passou pelo Asaas.
 *
 * O caso é comum: o cliente manda PIX direto para a conta da agência.
 * O dinheiro entrou, o Asaas não tem como saber, e sem isto a fatura
 * fica vencida para sempre, mandando lembrete para quem já pagou.
 *
 * Passa pelo Asaas quando existe cobrança lá, e não só marca aqui, para
 * que a conciliação continue tendo um lugar só como verdade.
 */
export async function receberForaDoAsaas(
  faturaId: string,
  data: string,
): Promise<ResultadoCobranca> {
  const servico = clienteServico();

  const { data: fatura } = await servico
    .from('fatura')
    .select('id, numero, status, valor, asaas_id')
    .eq('id', faturaId)
    .maybeSingle();

  if (!fatura) return { ok: false, faturaId, link: null, mensagem: 'Fatura não encontrada.' };

  if (fatura.status === 'paga') {
    return { ok: true, faturaId, link: null, mensagem: 'Esta fatura já constava como paga.' };
  }

  if (fatura.asaas_id) {
    const cred = await credencialAsaas();
    if (!cred) {
      return { ok: false, faturaId, link: null, mensagem: 'O Asaas não está conectado.' };
    }
    try {
      const c = await receberEmDinheiro(cred, fatura.asaas_id as string, {
        valor: Number(fatura.valor),
        data,
      });
      await aplicarEventoAsaas({ event: 'RECEBIDO_FORA_DO_ASAAS', payment: c });
      return {
        ok: true,
        faturaId,
        link: null,
        mensagem: `Fatura ${fatura.numero} baixada como recebida em ${data}.`,
      };
    } catch (e) {
      const msg = e instanceof ErroAsaas ? e.message : (e as Error).message;
      await registrar({ faturaId, origem: 'consulta', status: 'erro', erro: msg });
      return { ok: false, faturaId, link: null, mensagem: `Asaas: ${msg}` };
    }
  }

  /* Sem cobrança no Asaas, a baixa é só nossa. */
  await servico
    .from('fatura')
    .update({ status: 'paga', paga_em: data, forma_pagamento: 'FORA_DO_ASAAS' })
    .eq('id', faturaId);

  await registrar({ faturaId, origem: 'consulta', status: 'sucesso', evento: 'BAIXA_MANUAL' });

  return {
    ok: true,
    faturaId,
    link: null,
    mensagem: `Fatura ${fatura.numero} baixada como recebida em ${data}.`,
  };
}

/* ------------------------------------------------------------------ */
/* Em lote                                                             */
/* ------------------------------------------------------------------ */

export type ResultadoLote = {
  ok: boolean;
  emitidas: number;
  jaExistiam: number;
  falhas: { loja: string; motivo: string }[];
  mensagem: string;
};

/**
 * Fatura todos os contratos vigentes de uma competência.
 *
 * Uma por uma, e não em paralelo, de propósito: são chamadas a uma API
 * de terceiro com limite de requisição, e disparar trinta de uma vez
 * troca "demora dez segundos" por "metade falhou com 429".
 *
 * Uma loja que falha NÃO interrompe as outras. O motivo mais comum é
 * loja sem CNPJ, e travar a rodada inteira por causa de um cadastro
 * incompleto obrigaria a agência a consertar antes de cobrar quem está
 * em ordem.
 */
export async function faturarTodos(competencia: string): Promise<ResultadoLote> {
  const supabase = await clienteServidor();

  const { data: contratos, error } = await supabase
    .from('contrato')
    .select('id, conta:conta_id(nome)')
    .lte('inicio', competencia)
    .or(`fim.is.null,fim.gte.${competencia}`);

  if (error) {
    return { ok: false, emitidas: 0, jaExistiam: 0, falhas: [], mensagem: error.message };
  }

  let emitidas = 0;
  let jaExistiam = 0;
  const falhas: { loja: string; motivo: string }[] = [];

  for (const c of contratos ?? []) {
    const loja = (c.conta as unknown as { nome: string } | null)?.nome ?? 'sem nome';
    const r = await faturarContrato(c.id as string, competencia);

    if (!r.ok) falhas.push({ loja, motivo: r.mensagem });
    else if (r.mensagem.includes('já tinha cobrança')) jaExistiam += 1;
    else emitidas += 1;
  }

  const partes = [
    emitidas > 0
      ? `${emitidas} cobrança${emitidas > 1 ? 's' : ''} emitida${emitidas > 1 ? 's' : ''}`
      : null,
    jaExistiam > 0 ? `${jaExistiam} já existia${jaExistiam > 1 ? 'm' : ''}` : null,
    falhas.length > 0 ? `${falhas.length} falhou` : null,
  ].filter(Boolean);

  return {
    ok: falhas.length === 0,
    emitidas,
    jaExistiam,
    falhas,
    mensagem:
      partes.length > 0 ? `${partes.join(', ')}.` : 'Nenhum contrato vigente para faturar.',
  };
}

/** Confere no Asaas todas as cobranças que ainda não foram pagas. */
export async function conferirTodas(): Promise<{ ok: boolean; mensagem: string }> {
  const servico = clienteServico();

  const { data: faturas } = await servico
    .from('fatura')
    .select('id, status')
    .not('asaas_id', 'is', null)
    .not('status', 'in', '("paga","cancelada")');

  if (!faturas || faturas.length === 0) {
    return { ok: true, mensagem: 'Nenhuma cobrança aberta para conferir.' };
  }

  let mudou = 0;
  for (const f of faturas) {
    const r = await conferirFatura(f.id as string);
    if (!r.ok) continue;
    const { data: depois } = await servico
      .from('fatura')
      .select('status')
      .eq('id', f.id)
      .maybeSingle();
    if (depois?.status !== f.status) mudou += 1;
  }

  return {
    ok: true,
    mensagem:
      mudou === 0
        ? `${faturas.length} cobrança(s) conferida(s). Nenhuma mudou de estado.`
        : `${faturas.length} conferida(s), ${mudou} mudou de estado.`,
  };
}

/** Saldo da conta Asaas da agência, ou null quando não dá para saber. */
export async function saldoDaAgencia(): Promise<{
  saldo: number | null;
  ambiente: AmbienteAsaas | null;
}> {
  const cred = await credencialAsaas();
  if (!cred) return { saldo: null, ambiente: null };
  return { saldo: await saldoAsaas(cred), ambiente: cred.ambiente };
}

/* ------------------------------------------------------------------ */
/* Assinatura: a recorrência que não depende de alguém lembrar         */
/* ------------------------------------------------------------------ */

/**
 * Liga a cobrança automática de um contrato.
 *
 * A partir daqui quem emite a fatura mensal é o Asaas, e o webhook cria
 * a linha aqui. O botão "Faturar o mês" continua existindo e continua
 * idempotente — mas deixa de ser necessário.
 *
 * O PRIMEIRO VENCIMENTO é calculado, e não pedido: a assinatura cria a
 * primeira cobrança na hora, e uma data passada faria o cliente receber
 * hoje uma cobrança já vencida. Se o dia do contrato ainda não passou
 * neste mês, é ele; se passou, é o do mês que vem.
 */
export async function ativarAssinatura(contratoId: string): Promise<ResultadoCobranca> {
  const servico = clienteServico();

  const { data: contrato } = await servico
    .from('contrato')
    .select('id, plano, fee_mensal, inicio, fim, dia_vencimento, asaas_assinatura_id, conta:conta_id(id, nome, documento, asaas_cliente_id)')
    .eq('id', contratoId)
    .maybeSingle();

  if (!contrato) {
    return { ok: false, faturaId: null, link: null, mensagem: 'Contrato não encontrado.' };
  }

  if (contrato.asaas_assinatura_id) {
    return {
      ok: true,
      faturaId: null,
      link: null,
      mensagem: 'Este contrato já cobra automaticamente. Nada foi criado de novo.',
    };
  }

  if (contrato.fim) {
    return {
      ok: false,
      faturaId: null,
      link: null,
      mensagem: 'Contrato com data de fim não vira assinatura: ela cobraria depois do fim.',
    };
  }

  const conta = contrato.conta as unknown as {
    id: string;
    nome: string;
    documento: string | null;
    asaas_cliente_id: string | null;
  };

  if (!conta.documento) {
    return {
      ok: false,
      faturaId: null,
      link: null,
      mensagem: `${conta.nome} está sem CNPJ ou CPF. O Asaas exige o documento para criar a assinatura.`,
    };
  }

  const cred = await credencialAsaas();
  if (!cred) {
    return { ok: false, faturaId: null, link: null, mensagem: 'O Asaas não está conectado.' };
  }

  try {
    let clienteAsaas = conta.asaas_cliente_id;
    if (!clienteAsaas) {
      const c = await garantirCliente(cred, { nome: conta.nome, documento: conta.documento });
      clienteAsaas = c.id;
      await servico.from('conta').update({ asaas_cliente_id: c.id }).eq('id', conta.id);
    }

    const dia = Number(contrato.dia_vencimento ?? 10);
    const primeiro = proximoVencimento(dia);

    const assinatura = await criarAssinatura(cred, {
      clienteAsaas,
      valor: Number(contrato.fee_mensal),
      primeiroVencimento: primeiro,
      descricao: `Psy Comunic · ${contrato.plano}`,
      contratoId,
    });

    await servico
      .from('contrato')
      .update({ asaas_assinatura_id: assinatura.id })
      .eq('id', contratoId);

    /* A primeira cobrança já nasceu junto. Puxa agora em vez de esperar
       o webhook: o painel tem de mostrar a fatura no mesmo clique, ou a
       pessoa acha que não funcionou e clica de novo. */
    const trazidas = await importarCobrancasDaAssinatura(assinatura.id);

    await registrar({
      asaasId: assinatura.id,
      origem: 'emissao',
      evento: 'ASSINATURA_CRIADA',
      status: 'sucesso',
      carga: assinatura,
    });

    return {
      ok: true,
      faturaId: null,
      link: null,
      mensagem:
        `Cobrança automática ligada: todo dia ${dia}, ${Number(contrato.fee_mensal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}.` +
        (trazidas > 0 ? ` A primeira já foi emitida, para ${primeiro}.` : '') +
        (cred.ambiente === 'sandbox' ? ' (SANDBOX)' : ''),
    };
  } catch (e) {
    const msg = e instanceof ErroAsaas ? e.message : (e as Error).message;
    await registrar({ origem: 'emissao', evento: 'ASSINATURA_CRIADA', status: 'erro', erro: msg });
    return { ok: false, faturaId: null, link: null, mensagem: `Asaas: ${msg}` };
  }
}

/**
 * Desliga a cobrança automática.
 *
 * As cobranças JÁ EMITIDAS continuam de pé. O cliente ainda deve os
 * meses que venceram, e cancelá-los junto seria perdoar dívida sem
 * ninguém ter decidido isso.
 */
export async function desativarAssinatura(contratoId: string): Promise<ResultadoCobranca> {
  const servico = clienteServico();

  const { data: contrato } = await servico
    .from('contrato')
    .select('id, asaas_assinatura_id')
    .eq('id', contratoId)
    .maybeSingle();

  if (!contrato?.asaas_assinatura_id) {
    return {
      ok: true,
      faturaId: null,
      link: null,
      mensagem: 'Este contrato não tinha cobrança automática.',
    };
  }

  const cred = await credencialAsaas();
  if (!cred) {
    return { ok: false, faturaId: null, link: null, mensagem: 'O Asaas não está conectado.' };
  }

  try {
    await cancelarAssinatura(cred, contrato.asaas_assinatura_id as string);
  } catch (e) {
    const msg = e instanceof ErroAsaas ? e.message : (e as Error).message;
    await registrar({
      asaasId: contrato.asaas_assinatura_id as string,
      origem: 'cancelamento',
      evento: 'ASSINATURA_CANCELADA',
      status: 'erro',
      erro: msg,
    });
    return { ok: false, faturaId: null, link: null, mensagem: `Asaas: ${msg}` };
  }

  await servico
    .from('contrato')
    .update({ asaas_assinatura_id: null })
    .eq('id', contratoId);

  await registrar({
    asaasId: contrato.asaas_assinatura_id as string,
    origem: 'cancelamento',
    evento: 'ASSINATURA_CANCELADA',
    status: 'sucesso',
  });

  return {
    ok: true,
    faturaId: null,
    link: null,
    mensagem: 'Cobrança automática desligada. As cobranças já emitidas continuam valendo.',
  };
}

/**
 * Traz para cá as cobranças que a assinatura gerou lá.
 *
 * É a rede de segurança do webhook. Assinatura roda por meses; basta
 * uma janela de deploy no dia da emissão para uma cobrança nunca virar
 * linha no painel — e cobrança que o painel não conhece é dinheiro
 * entrando sem aparecer em indicador nenhum.
 *
 * Devolve quantas foram criadas ou atualizadas.
 */
export async function importarCobrancasDaAssinatura(assinaturaId: string): Promise<number> {
  const cred = await credencialAsaas();
  if (!cred) return 0;

  const servico = clienteServico();
  let contadas = 0;

  try {
    for (const c of await cobrancasDaAssinatura(cred, assinaturaId)) {
      const { data: faturaId } = await servico.rpc('fatura_de_assinatura', {
        p_assinatura: assinaturaId,
        p_asaas_id: c.id,
        p_valor: c.value,
        p_vencimento: c.dueDate,
      });

      if (!faturaId) continue;
      contadas += 1;

      await servico
        .from('fatura')
        .update({
          status: statusDaFatura(c.status),
          paga_em: statusDaFatura(c.status) === 'paga' ? (c.paymentDate ?? null) : null,
          link_pagamento: c.invoiceUrl ?? null,
          link_boleto: c.bankSlipUrl ?? null,
          valor_liquido: c.netValue ?? null,
          forma_pagamento: c.billingType ?? null,
          sincronizada_em: new Date().toISOString(),
        })
        .eq('id', faturaId as string);
    }
  } catch (e) {
    const msg = e instanceof ErroAsaas ? e.message : (e as Error).message;
    await registrar({
      asaasId: assinaturaId,
      origem: 'consulta',
      evento: 'IMPORTAR_ASSINATURA',
      status: 'erro',
      erro: msg,
    });
  }

  return contadas;
}

/** Confere no Asaas todas as assinaturas ligadas, e traz o que faltar. */
export async function conferirAssinaturas(): Promise<{ ok: boolean; mensagem: string }> {
  const servico = clienteServico();

  const { data: contratos } = await servico
    .from('contrato')
    .select('asaas_assinatura_id')
    .not('asaas_assinatura_id', 'is', null);

  if (!contratos || contratos.length === 0) {
    return { ok: true, mensagem: 'Nenhum contrato com cobrança automática.' };
  }

  let total = 0;
  for (const c of contratos) {
    total += await importarCobrancasDaAssinatura(c.asaas_assinatura_id as string);
  }

  return {
    ok: true,
    mensagem: `${contratos.length} assinatura(s) conferida(s), ${total} cobrança(s) em dia com o painel.`,
  };
}

/**
 * O próximo dia `dia` que ainda não passou.
 *
 * Se hoje é 21 e o vencimento é 10, a primeira cobrança vai para o dia
 * 10 do mês que vem. Mandar o 10 deste mês criaria, hoje, uma cobrança
 * nascida vencida — e o cliente recebe um lembrete de atraso no mesmo
 * minuto em que a agência liga a cobrança automática.
 */
function proximoVencimento(dia: number): string {
  const hoje = hojeBR();
  const [ano, mes, d] = hoje.split('-').map(Number);
  const alvo = Math.min(Math.max(dia, 1), 28);

  const data = alvo > d
    ? new Date(Date.UTC(ano, mes - 1, alvo))
    : new Date(Date.UTC(ano, mes, alvo));

  return data.toISOString().slice(0, 10);
}
