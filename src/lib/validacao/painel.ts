import { z } from 'zod';
import { PAPEIS } from '../papeis.ts';

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

export const esquemaConta = z.object({
  nome: textoObrigatorio(2, 'Informe o nome da loja.'),
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

/**
 * Texto digitado por gente → número.
 *
 * Quem preenche meta digita como fala: "320.000", "320.000,50",
 * "R$ 320 mil". A regra que desempata os dois formatos:
 *
 *   O último separador é DECIMAL só quando sobram 1 ou 2 dígitos
 *   depois dele. Com 3, é separador de milhar.
 *
 * Sem essa condição, "320.000" vira 320 — meta mil vezes menor, gravada
 * sem erro nenhum. Foi exatamente o que a primeira versão fazia, e só
 * apareceu quando testei os formatos de verdade.
 *
 * Exportada para poder ser testada sozinha: é a função que decide
 * quanto vale uma meta.
 */
export function paraNumero(entrada: string): number {
  const limpo = entrada.replace(/[^\d,.-]/g, '');
  if (limpo === '') return NaN;

  const ultimaVirgula = limpo.lastIndexOf(',');
  const ultimoPonto = limpo.lastIndexOf('.');
  const posSeparador = Math.max(ultimaVirgula, ultimoPonto);

  if (posSeparador === -1) return Number(limpo);

  const digitosDepois = limpo.length - posSeparador - 1;

  /* 3 dígitos depois = milhar. "320.000" e "1.234.567" caem aqui. */
  if (digitosDepois === 3) return Number(limpo.replace(/[.,]/g, ''));

  const separadorDecimal = ultimaVirgula > ultimoPonto ? ',' : '.';
  const outro = separadorDecimal === ',' ? '.' : ',';

  return Number(
    limpo.split(outro).join('').replace(separadorDecimal, '.'),
  );
}

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
