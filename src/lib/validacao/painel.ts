import { z } from 'zod';
import { PAPEIS } from '../papeis.ts';
import { paraNumero } from '../numero.ts';

/* Reexportado: a validação era a dona desta função, e os testes e as
   actions ainda a importam por aqui. */
export { paraNumero };

/**
 * Validação de tudo que entra por Server Action.
 *
 * Server Action é um endpoint HTTP: qualquer pessoa chama, com qualquer
 * corpo, sem passar pelo formulário. O `required` do HTML e o
 * `type="email"` do input não são validação — são conforto para quem
 * usa a tela.
 *
 * O que este arquivo faz é transformar `FormData` (tudo string, tudo
 * opcional) em objeto tipado, com as regras do domínio aplicadas. O que
 * não passa aqui não chega no banco.
 */

const textoObrigatorio = (min: number, msg: string) =>
  z.string().trim().min(min, msg);

const textoOpcional = z
  .string()
  .trim()
  .transform((v) => (v === '' ? null : v))
  .nullable();

/**
 * Nem todo cliente vende online.
 *
 * A carteira tem chalé, concessionária e outros nichos onde a agência
 * faz só tráfego. O tipo muda o CÁLCULO do health score, e não só a
 * palavra na tela: sem ele, um cliente de tráfego puro ficaria
 * eternamente crítico por "gastou em mídia e não teve receita".
 */
export const TIPOS_DE_CONTA = ['ecommerce', 'trafego', 'outro'] as const;

export const esquemaConta = z.object({
  nome: textoObrigatorio(2, 'Informe o nome do cliente.'),
  /* `default` e não `catch`: campo AUSENTE vira e-commerce, que é o
     padrão e o mais rigoroso no health score; valor INVÁLIDO é recusado
     em vez de virar e-commerce em silêncio. Um POST dizendo
     tipo: 'chale' merece erro, e não um dado trocado sem aviso. */
  tipo: z.enum(TIPOS_DE_CONTA).default('ecommerce'),
  segmento: textoOpcional.optional().transform((s) => s ?? null),
  plataforma: textoOpcional,
  /* URL só é validada quando existe: campo opcional vazio não pode
     falhar por "url inválida". */
  site: z
    .string()
    .trim()
    .transform((v) => (v === '' ? null : v))
    .nullable()
    .refine((v) => v === null || /^https?:\/\/.+\..+/.test(v), 'Site inválido.'),
  documento: textoOpcional,
});

/** Lista de uuid vinda de um campo repetido no formulário. */
const listaDeLojas = z
  .array(z.uuid('Loja inválida.'))
  .default([])
  /* Marcar a mesma loja duas vezes não é erro do usuário, é ruído do
     formulário. Deduplica em silêncio em vez de recusar. */
  .transform((v) => [...new Set(v)]);

export const esquemaUsuario = z
  .object({
    nome: textoObrigatorio(2, 'Informe o nome da pessoa.'),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[^@\s]+@[^@\s]+\.[^@\s]+$/, 'E-mail inválido.'),
    /* Lista fechada, e não string livre. Sem isto, um POST manual com
       um papel inventado entraria no app_metadata e o gatilho tentaria
       convertê-lo para o enum. */
    papel: z.enum(PAPEIS),
    /* Várias lojas: uma pessoa pode ser dona de duas marcas, e um
       operador pode ser responsável por três contas. */
    contas: listaDeLojas,
    /* Doze, e não os seis que o Supabase aceita: esta senha guarda o
       faturamento de uma loja inteira. */
    senha: z.string().min(12, 'A senha precisa de pelo menos 12 caracteres.'),
  })
  .refine(
    (d) => !(d.papel === 'cliente' || d.papel === 'cliente_leitura') || d.contas.length > 0,
    {
      message: 'Cliente precisa estar vinculado a pelo menos uma loja.',
      path: ['contas'],
    },
  );

export const esquemaVinculo = z.object({
  usuario_id: z.uuid('Usuário inválido.'),
  conta_id: z.uuid('Loja inválida.'),
});

export const esquemaTransferencia = z
  .object({
    de_id: z.uuid('Escolha de quem sai.'),
    para_id: z.uuid('Escolha para quem vai.'),
    /* Desativar junto é o caso normal: transfere-se carteira quando
       alguém sai do time. Mas transferir sem desativar também acontece,
       na redistribuição entre operadores. */
    desativar: z.enum(['true', 'false']).default('false').transform((v) => v === 'true'),
  })
  .refine((d) => d.de_id !== d.para_id, {
    message: 'A carteira não pode ser transferida para a mesma pessoa.',
    path: ['para_id'],
  });

export const esquemaAcesso = z.object({
  id: z.uuid('Usuário inválido.'),
  /* FormData manda "true"/"false" como texto. */
  ativo: z.enum(['true', 'false']).transform((v) => v === 'true'),
});

export const esquemaMeta = z.object({
  conta_id: z.uuid('Escolha a loja.'),
  receita_meta: z
    .string()
    .trim()
    .transform(paraNumero)
    .refine((n) => Number.isFinite(n) && n > 0, 'A meta precisa ser maior que zero.'),
});

/**
 * Converte FormData e valida numa só chamada.
 *
 * Devolve `{ok:false, mensagem}` no formato que as actions já usam, em
 * vez de lançar: erro de preenchimento não é exceção, é resposta.
 */
export function validar<T extends z.ZodType>(
  esquema: T,
  fd: FormData,
): { ok: true; dados: z.infer<T> } | { ok: false; mensagem: string } {
  /*
    `Object.fromEntries(fd.entries())` descarta valores repetidos e fica
    só com o último. Num formulário com várias caixas de "loja" marcadas,
    isso silenciosamente vincularia a pessoa a UMA loja só — e o bug
    apareceria semanas depois, como "o cliente não vê a segunda loja".

    Por isso campo repetido vira array.
  */
  const bruto: Record<string, unknown> = {};
  for (const chave of new Set(fd.keys())) {
    const valores = fd.getAll(chave);
    bruto[chave] = valores.length > 1 ? valores : valores[0];
  }

  /* Campo de múltipla escolha com UMA marcada chega como string. O
     esquema espera array, então normaliza aqui: a alternativa seria
     cada campo lidar com os dois formatos. */
  for (const chave of ['contas']) {
    if (chave in bruto && !Array.isArray(bruto[chave])) {
      bruto[chave] = bruto[chave] === '' ? [] : [bruto[chave]];
    }
  }

  const r = esquema.safeParse(bruto);

  if (r.success) return { ok: true, dados: r.data };

  /* Uma mensagem por vez, a primeira. Lista de erros num formulário de
     cinco campos vira parede de texto vermelho. */
  const primeiro = r.error.issues[0];
  return { ok: false, mensagem: primeiro?.message ?? 'Dados inválidos.' };
}

/* ================================================================== */
/* Funil comercial                                                     */
/* ================================================================== */

const ESTAGIOS_VALIDOS = [
  'novo',
  'contato',
  'diagnostico',
  'proposta',
  'negociacao',
  'ganho',
  'perdido',
] as const;

export const esquemaMoverLead = z.object({
  id: z.uuid('Lead inválido.'),
  estagio: z.enum(ESTAGIOS_VALIDOS),
});

export const esquemaLead = z.object({
  id: z.uuid('Lead inválido.'),
  proximo_passo: textoOpcional,
  proximo_passo_em: z
    .string()
    .trim()
    .transform((v) => (v === '' ? null : v))
    .nullable(),
  probabilidade: z
    .string()
    .trim()
    .transform((v) => (v === '' ? null : Number(v)))
    .nullable()
    .refine(
      (v) => v === null || (Number.isFinite(v) && v >= 0 && v <= 100),
      'A probabilidade vai de 0 a 100.',
    ),
});

export const esquemaPerderLead = z.object({
  id: z.uuid('Lead inválido.'),
  /* Motivo OBRIGATÓRIO. Sem ele, "perdido" vira um cemitério de leads
     sem aprendizado, e três meses depois ninguém sabe se o padrão era
     preço, prazo ou um concorrente específico. */
  motivo_perda: textoObrigatorio(3, 'Diga por que este lead foi perdido.'),
});

export const esquemaConverter = z.object({
  id: z.uuid('Lead inválido.'),
  fee_mensal: z
    .string()
    .trim()
    .transform(paraNumero)
    .refine(
      (n) => Number.isFinite(n) && n > 0,
      'O fee mensal precisa ser maior que zero.',
    ),
  plataforma: textoOpcional,
});

export const esquemaInteracao = z.object({
  lead_id: z
    .string()
    .trim()
    .transform((v) => (v === '' ? null : v))
    .nullable(),
  conta_id: z
    .string()
    .trim()
    .transform((v) => (v === '' ? null : v))
    .nullable(),
  tipo: z.enum(['ligacao', 'reuniao', 'whatsapp', 'email', 'nota']),
  resumo: textoObrigatorio(3, 'Escreva o que aconteceu.'),
});

/**
 * Lead novo.
 *
 * Só o nome é obrigatório. Um formulário de captação que exige
 * e-mail, telefone e valor antes de deixar salvar empurra o comercial
 * de volta para o bloco de notas, e é lá que o lead morre.
 *
 * O resto se preenche depois, conforme a conversa acontece.
 */
export const esquemaNovoLead = z.object({
  nome: textoObrigatorio(2, 'Diga com quem você falou.'),
  empresa: textoOpcional,
  email: z
    .string()
    .trim()
    .transform((v) => (v === '' ? null : v.toLowerCase()))
    .nullable()
    .refine((v) => v === null || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v), 'E-mail inválido.'),
  telefone: textoOpcional,
  origem: textoOpcional,
  estagio: z.enum(ESTAGIOS_VALIDOS).default('novo'),
  valor_fee_estimado: z
    .string()
    .trim()
    .transform((v) => (v === '' ? null : paraNumero(v)))
    .nullable()
    .refine((n) => n === null || (Number.isFinite(n) && n >= 0), 'Valor inválido.'),
  valor_verba_estimada: z
    .string()
    .trim()
    .transform((v) => (v === '' ? null : paraNumero(v)))
    .nullable()
    .refine((n) => n === null || (Number.isFinite(n) && n >= 0), 'Valor inválido.'),
  probabilidade: z
    .string()
    .trim()
    .transform((v) => (v === '' ? null : Number(v)))
    .nullable()
    .refine((n) => n === null || (n >= 0 && n <= 100), 'A probabilidade vai de 0 a 100.'),
  proximo_passo: textoOpcional,
  proximo_passo_em: z
    .string()
    .trim()
    .transform((v) => (v === '' ? null : v))
    .nullable(),
});

/**
 * Edição da ficha do lead.
 *
 * Separado de `esquemaLead`, que só cobre próximo passo e
 * probabilidade: aquele é o formulário rápido do card, este é a ficha
 * inteira. Um esquema só faria o formulário rápido apagar contato e
 * valor toda vez que fosse salvo, porque campo ausente no FormData
 * chega como vazio.
 */
export const esquemaEditarLead = esquemaNovoLead.extend({
  id: z.uuid('Lead inválido.'),
});

/**
 * Contrato: o que sustenta a cobrança.
 *
 * `fee_mensal` é obrigatório e maior que zero. Contrato com fee zero
 * gera fatura de zero real, que o Asaas recusa e o painel registra como
 * erro — melhor barrar aqui, onde dá para explicar.
 */
export const esquemaContrato = z.object({
  conta_id: z.uuid('Escolha a loja.'),
  plano: textoObrigatorio(2, 'Diga o nome do plano.'),
  fee_mensal: z
    .string()
    .trim()
    .transform(paraNumero)
    .refine((n) => Number.isFinite(n) && n > 0, 'O fee mensal precisa ser maior que zero.'),
  inicio: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe a data de início.'),
  /* Até 28: 29, 30 e 31 não existem em todo mês, e a assinatura do Asaas
     empurraria a cobrança de fevereiro para março. */
  dia_vencimento: z
    .string()
    .trim()
    .transform((v) => (v === '' ? 10 : Math.trunc(paraNumero(v))))
    .refine(
      (n) => Number.isFinite(n) && n >= 1 && n <= 28,
      'O dia do vencimento vai de 1 a 28.',
    ),
  fim: z
    .string()
    .trim()
    .transform((v) => (v === '' ? null : v))
    .nullable(),
  reajuste: textoOpcional,
  observacoes: textoOpcional,
});

/**
 * Reajuste de fee.
 *
 * Não altera o contrato: encerra o atual e abre outro. Ver o comentário
 * da ação, em `acoes-contrato.ts`.
 */
export const esquemaReajuste = z.object({
  id: z.uuid('Contrato inválido.'),
  fee_mensal: z
    .string()
    .trim()
    .transform(paraNumero)
    .refine((n) => Number.isFinite(n) && n > 0, 'O novo fee precisa ser maior que zero.'),
  a_partir_de: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe a partir de quando vale.'),
  motivo: textoOpcional,
});

export const esquemaEncerrar = z.object({
  id: z.uuid('Contrato inválido.'),
  fim: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe a data de encerramento.'),
  motivo: textoOpcional,
});

/* ------------------------------------------------------------------ */
/* Cobrança avulsa e despesa                                           */
/* ------------------------------------------------------------------ */

const dataObrigatoria = (msg: string) =>
  z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, msg);

const valorPositivo = (msg: string) =>
  z
    .string()
    .trim()
    .transform(paraNumero)
    .refine((n) => Number.isFinite(n) && n > 0, msg);

/**
 * Cobrança fora do contrato mensal.
 *
 * A descrição é obrigatória de propósito: ela é o que o cliente lê no
 * e-mail e no boleto. Cobrança que chega dizendo só "Psy Comunic" e um
 * valor gera uma mensagem no WhatsApp perguntando o que é.
 */
export const esquemaCobrancaAvulsa = z.object({
  conta_id: z.uuid('Escolha a loja.'),
  descricao: textoObrigatorio(3, 'Diga o que está sendo cobrado.'),
  valor: valorPositivo('O valor precisa ser maior que zero.'),
  vencimento: dataObrigatoria('Informe o vencimento.'),
  parcelas: z
    .string()
    .trim()
    .transform((v) => (v === '' ? 1 : Math.trunc(paraNumero(v))))
    .refine((n) => Number.isFinite(n) && n >= 1 && n <= 24, 'Entre 1 e 24 parcelas.'),
});

export const esquemaBaixaManual = z.object({
  fatura_id: z.uuid('Fatura inválida.'),
  data: dataObrigatoria('Informe a data em que o dinheiro entrou.'),
});

export const esquemaDespesa = z.object({
  descricao: textoObrigatorio(3, 'Diga qual é a despesa.'),
  categoria: textoOpcional,
  valor: valorPositivo('O valor precisa ser maior que zero.'),
  vencimento: dataObrigatoria('Informe o vencimento.'),
  /* Loja opcional: a maior parte da despesa é da agência inteira, mas
     "verba de mídia da loja X paga por nós" precisa de dono. */
  conta_id: z
    .string()
    .trim()
    .transform((v) => (v === '' ? null : v))
    .nullable()
    .refine(
      (v) => v === null || /^[0-9a-f-]{36}$/i.test(v),
      'Loja inválida.',
    ),
});

export const esquemaPagarDespesa = z.object({
  id: z.uuid('Despesa inválida.'),
  pago_em: dataObrigatoria('Informe a data do pagamento.'),
});

export const esquemaId = z.object({ id: z.uuid('Registro inválido.') });
