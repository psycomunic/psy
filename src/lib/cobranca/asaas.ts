import 'server-only';

/**
 * Cliente do Asaas.
 *
 * ============================================================
 * SANDBOX E PRODUÇÃO SÃO A MESMA API COM OUTRO ENDEREÇO
 * ============================================================
 * As chaves são diferentes e não se misturam: uma chave de sandbox
 * apontada para produção responde 401. O ambiente vem da configuração
 * da credencial, e não de `NODE_ENV` — dá para querer sandbox rodando
 * em produção enquanto o financeiro está sendo testado, e amarrar isso
 * ao ambiente do deploy tiraria essa escolha.
 *
 * ============================================================
 * ERRO DO ASAAS VEM COM DESCRIÇÃO, E ELA IMPORTA
 * ============================================================
 * A API devolve `{errors:[{code, description}]}` com mensagens como
 * "O CPF/CNPJ informado é inválido". Engolir isso e mostrar "falha ao
 * cobrar" transforma um problema de cinco segundos numa investigação.
 * A descrição sobe inteira.
 */

const BASE = {
  producao: 'https://api.asaas.com/v3',
  sandbox: 'https://api-sandbox.asaas.com/v3',
} as const;

export type AmbienteAsaas = keyof typeof BASE;

export type SegredoAsaas = { api_key: string };

export class ErroAsaas extends Error {
  constructor(
    mensagem: string,
    readonly status: number,
    readonly codigo?: string,
  ) {
    super(mensagem);
  }
}

async function chamar<T>(
  { chave, ambiente }: { chave: string; ambiente: AmbienteAsaas },
  caminho: string,
  init: RequestInit = {},
): Promise<T> {
  const r = await fetch(`${BASE[ambiente]}${caminho}`, {
    ...init,
    headers: {
      access_token: chave,
      'content-type': 'application/json',
      /* O Asaas pede identificação do integrador. Sem isso o suporte
         deles não consegue rastrear a chamada quando algo dá errado. */
      'User-Agent': 'PsyComunic/1.0',
      ...(init.headers ?? {}),
    },
    cache: 'no-store',
  });

  const corpo = await r.json().catch(() => null);

  if (!r.ok) {
    const primeiro = (corpo as { errors?: { code?: string; description?: string }[] })
      ?.errors?.[0];
    throw new ErroAsaas(
      primeiro?.description ?? `Asaas respondeu ${r.status}`,
      r.status,
      primeiro?.code,
    );
  }

  return corpo as T;
}

/* ================================================================== */
/* Cliente                                                            */
/* ================================================================== */

type ClienteAsaas = { id: string; name: string; cpfCnpj?: string };

/**
 * Cria o cliente no Asaas, ou devolve o que já existe.
 *
 * A busca por documento vem ANTES da criação de propósito. O Asaas
 * aceita dois clientes com o mesmo CNPJ sem reclamar, e aí a conta
 * deles fica com "Loja Aurora" duas vezes, cada uma com metade das
 * cobranças. Conciliar isso depois é trabalho manual.
 */
export async function garantirCliente(
  cred: { chave: string; ambiente: AmbienteAsaas },
  dados: { nome: string; documento: string; email?: string | null; telefone?: string | null },
): Promise<ClienteAsaas> {
  const doc = dados.documento.replace(/\D/g, '');

  const busca = await chamar<{ data: ClienteAsaas[] }>(
    cred,
    `/customers?cpfCnpj=${encodeURIComponent(doc)}&limit=1`,
  );

  if (busca.data?.length > 0) return busca.data[0];

  return chamar<ClienteAsaas>(cred, '/customers', {
    method: 'POST',
    body: JSON.stringify({
      name: dados.nome,
      cpfCnpj: doc,
      email: dados.email ?? undefined,
      mobilePhone: dados.telefone?.replace(/\D/g, '') || undefined,
      notificationDisabled: false,
    }),
  });
}

/* ================================================================== */
/* Cobrança                                                           */
/* ================================================================== */

export type CobrancaAsaas = {
  id: string;
  status: string;
  value: number;
  /** O que sobra depois da taxa do gateway. R$ 300 viram R$ 293,54. */
  netValue?: number;
  dueDate: string;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  billingType?: string;
  /** Id do parcelamento, quando a cobrança foi dividida. */
  installment?: string;
};

/**
 * Como o cliente pode pagar.
 *
 * `UNDEFINED` é o padrão e devolve uma página onde ele escolhe entre o
 * que a conta tiver habilitado. Fixar é para o caso em que a agência
 * precisa do meio específico: boleto porque o financeiro do cliente só
 * paga boleto, cartão porque foi combinado parcelar.
 */
export type FormaCobranca = 'UNDEFINED' | 'BOLETO' | 'PIX' | 'CREDIT_CARD';

/**
 * Emite a cobrança.
 *
 * `billingType: UNDEFINED` é escolha, e não omissão: o Asaas devolve
 * uma página onde o cliente escolhe entre boleto, PIX e cartão, com o
 * que estiver habilitado na conta. Fixar boleto na emissão obrigaria a
 * agência a adivinhar como cada lojista prefere pagar, e a errar
 * significa uma segunda cobrança manual.
 *
 * `externalReference` leva o id da nossa fatura. É o que permite o
 * webhook achar a linha certa mesmo que o `asaas_id` ainda não tenha
 * sido gravado — a resposta da emissão e o primeiro evento podem
 * chegar fora de ordem.
 */
export async function emitirCobranca(
  cred: { chave: string; ambiente: AmbienteAsaas },
  dados: {
    clienteAsaas: string;
    valor: number;
    vencimento: string;
    descricao: string;
    faturaId: string;
    forma?: FormaCobranca;
    /** Parcelas no cartão ou boleto. 1 ou ausente emite cobrança única. */
    parcelas?: number;
    /** Multa por atraso, em % do valor. */
    multa?: number;
    /** Juros ao mês, em %. */
    juros?: number;
  },
): Promise<CobrancaAsaas> {
  const parcelas = Math.max(1, Math.trunc(dados.parcelas ?? 1));

  return chamar<CobrancaAsaas>(cred, '/payments', {
    method: 'POST',
    body: JSON.stringify({
      customer: dados.clienteAsaas,
      billingType: dados.forma ?? 'UNDEFINED',
      dueDate: dados.vencimento,
      description: dados.descricao,
      externalReference: dados.faturaId,

      /* Parcelado manda `totalValue` e o Asaas divide. Mandar `value`
         junto significaria "cada parcela vale isto", e uma cobrança de
         R$ 900 em 3x viraria R$ 2.700. */
      ...(parcelas > 1
        ? { installmentCount: parcelas, totalValue: dados.valor }
        : { value: dados.valor }),

      /* Multa e juros só vão quando pedidos. O padrão do Asaas é zero, e
         cobrar encargo de um cliente que não foi avisado é a forma mais
         rápida de transformar atraso de três dias em discussão. */
      ...(dados.multa ? { fine: { value: dados.multa } } : {}),
      ...(dados.juros ? { interest: { value: dados.juros } } : {}),
    }),
  });
}

/**
 * Marca a cobrança como recebida fora do Asaas.
 *
 * O caso real: o cliente manda PIX direto para a conta da agência em
 * vez de usar o link. O dinheiro entrou, mas o Asaas nunca vai saber
 * sozinho, e a fatura ficaria vencida para sempre — cobrando de novo
 * alguém que já pagou.
 */
export async function receberEmDinheiro(
  cred: { chave: string; ambiente: AmbienteAsaas },
  asaasId: string,
  dados: { valor: number; data: string; avisarCliente?: boolean },
): Promise<CobrancaAsaas> {
  return chamar<CobrancaAsaas>(cred, `/payments/${asaasId}/receiveInCash`, {
    method: 'POST',
    body: JSON.stringify({
      paymentDate: dados.data,
      value: dados.valor,
      notifyCustomer: dados.avisarCliente ?? false,
    }),
  });
}

/** Saldo da conta Asaas da agência. */
export async function saldoAsaas(cred: {
  chave: string;
  ambiente: AmbienteAsaas;
}): Promise<number | null> {
  try {
    const r = await chamar<{ balance?: number }>(cred, '/finance/balance');
    return typeof r.balance === 'number' ? r.balance : null;
  } catch {
    /* Saldo é informação de apoio. Se a chamada falhar, o resto da tela
       continua valendo, e mostrar "—" é melhor que derrubar o módulo
       inteiro por causa de um número decorativo. */
    return null;
  }
}

export async function consultarCobranca(
  cred: { chave: string; ambiente: AmbienteAsaas },
  asaasId: string,
): Promise<CobrancaAsaas> {
  return chamar<CobrancaAsaas>(cred, `/payments/${asaasId}`);
}

/**
 * O código PIX copia e cola.
 *
 * Vem numa chamada separada de propósito na API deles, e só existe
 * depois de a cobrança ser criada. Falha aqui NÃO é falha da emissão:
 * a cobrança já está de pé e o link de pagamento funciona.
 */
export async function pixDaCobranca(
  cred: { chave: string; ambiente: AmbienteAsaas },
  asaasId: string,
): Promise<string | null> {
  try {
    const r = await chamar<{ payload?: string }>(cred, `/payments/${asaasId}/pixQrCode`);
    return r.payload ?? null;
  } catch {
    return null;
  }
}

export async function cancelarCobranca(
  cred: { chave: string; ambiente: AmbienteAsaas },
  asaasId: string,
): Promise<void> {
  await chamar(cred, `/payments/${asaasId}`, { method: 'DELETE' });
}

/**
 * Do status do Asaas para o nosso.
 *
 * A lista deles é maior que a nossa, e não deve virar a nossa: o
 * enum `status_fatura` existe para o painel responder "recebi ou não",
 * e não para espelhar a máquina de estados de um fornecedor. Trocar de
 * gateway não pode mudar o significado das nossas colunas.
 */
export function statusDaFatura(asaas: string): 'aberta' | 'enviada' | 'paga' | 'vencida' | 'cancelada' {
  switch (asaas) {
    case 'RECEIVED':
    case 'CONFIRMED':
    case 'RECEIVED_IN_CASH':
      return 'paga';
    case 'OVERDUE':
      return 'vencida';
    case 'REFUNDED':
    case 'DELETED':
    case 'CHARGEBACK_REQUESTED':
    case 'CHARGEBACK_DISPUTE':
      return 'cancelada';
    case 'PENDING':
    case 'AWAITING_RISK_ANALYSIS':
      return 'enviada';
    default:
      return 'aberta';
  }
}
