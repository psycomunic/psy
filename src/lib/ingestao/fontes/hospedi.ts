import type { LinhaMetrica } from '../csv.ts';

/**
 * Conector Hospedi (hospedi.app) — reservas, hóspedes e receita real.
 *
 * A Hospedi opera sobre Supabase Auth + PostgREST. Com o login autorizado
 * (conta admin da assessoria na Hospedi ou login da própria hospedagem),
 * autenticamos via `grant_type=password`, localizamos o perfil do chalé/
 * pousada correspondente ao `identificador` e buscamos as reservas não
 * canceladas criadas na janela `[de, ate]`.
 *
 * Os dias da janela sem reservas são emitidos com zeros de propósito:
 *   1. Uma semana sem reserva nova continua sendo sincronização válida,
 *      e não "erro de resposta vazia".
 *   2. Se uma reserva lançada ontem for cancelada hoje na Hospedi,
 *      regravar o dia com zero limpa o valor antigo no banco.
 */

const HOSPEDI_SUPABASE_URL_PADRAO = 'https://jpvjzplixfcjkmqpggwj.supabase.co';
const HOSPEDI_ANON_KEY_PADRAO =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impwdmp6cGxpeGZjamttcXBnZ3dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4ODExMjksImV4cCI6MjA4MzQ1NzEyOX0.5gloaziKzFslM1B3wgF5BlzdLGbDPdE4pKDyOJCZ9c4';

export type SegredoHospedi = {
  email: string;
  senha: string;
};

export type PerfilHospedi = {
  id: string;
  name?: string | null;
  company_name?: string | null;
  email?: string | null;
  role?: string | null;
};

export type PropriedadeHospedi = {
  id: string;
  user_id?: string | null;
  name?: string | null;
};

export type ReservaHospedi = {
  id?: string;
  user_id?: string | null;
  property_id?: string | null;
  created_at?: string | null;
  check_in?: string | null;
  check_out?: string | null;
  status?: string | null;
  gross_value?: number | string | null;
  paid_amount?: number | string | null;
  channel_fee_value?: number | string | null;
  channel?: string | null;
  detailed_channel?: string | null;
  guest_id?: string | null;
  guest_name?: string | null;
  guest_phone?: string | null;
  guest_email?: string | null;
};

export type RespostaHospedi = {
  clienteId: string;
  clienteNome: string;
  reservas: ReservaHospedi[];
};

const normalizarTexto = (s: string | null | undefined) =>
  (s ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();

const numero = (v: unknown): number => {
  const n = typeof v === 'string' ? Number(v) : typeof v === 'number' ? v : 0;
  return Number.isFinite(n) && n > 0 ? n : 0;
};

/** Converte timestamp ISO UTC para `AAAA-MM-DD` no fuso de Brasília. */
export function diaBrasiliaDeIso(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) {
    return /^\d{4}-\d{2}-\d{2}/.test(iso) ? iso.slice(0, 10) : null;
  }
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(data);
  const get = (t: string) => partes.find((p) => p.type === t)?.value ?? '';
  const dia = `${get('year')}-${get('month')}-${get('day')}`;
  return /^\d{4}-\d{2}-\d{2}$/.test(dia) ? dia : null;
}

function listarDiasNoIntervalo(de: string, ate: string): string[] {
  const dias: string[] = [];
  const cursor = new Date(`${de}T12:00:00Z`);
  const limite = new Date(`${ate}T12:00:00Z`);
  if (Number.isNaN(cursor.getTime()) || Number.isNaN(limite.getTime())) return dias;

  while (cursor.getTime() <= limite.getTime() && dias.length <= 370) {
    dias.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dias;
}

/**
 * Escolhe qual perfil da Hospedi corresponde ao cliente vinculado no painel.
 *
 * Aceita:
 * - `"propria"` / `"atual"` (usa o próprio usuário autenticado);
 * - UUID exato do usuário na Hospedi;
 * - E-mail do cliente na Hospedi;
 * - Nome fantasia (`company_name`) ou nome do responsável (ex.: "Chalés Encantos da Natureza").
 */
export function localizarPerfilHospedi(
  perfis: PerfilHospedi[],
  usuarioLogadoId: string,
  identificador: string,
): PerfilHospedi {
  const alvo = normalizarTexto(identificador);

  if (!alvo || alvo === 'propria' || alvo === 'atual' || alvo === 'padrao') {
    const proprio = perfis.find((p) => p.id === usuarioLogadoId);
    if (proprio) return proprio;
    if (perfis.length === 1) return perfis[0];
    return { id: usuarioLogadoId, company_name: identificador || 'Hospedi' };
  }

  /* 1. Casamento exato por ID ou e-mail. */
  const exato = perfis.find(
    (p) =>
      p.id.toLowerCase() === identificador.trim().toLowerCase() ||
      (p.email && p.email.trim().toLowerCase() === identificador.trim().toLowerCase()),
  );
  if (exato) return exato;

  /* 2. Casamento exato por nome fantasia ou nome pessoal sem acentos. */
  const nomeExato = perfis.find(
    (p) =>
      normalizarTexto(p.company_name) === alvo ||
      normalizarTexto(p.name) === alvo,
  );
  if (nomeExato) return nomeExato;

  /* 3. Casamento parcial seguro (ex.: "Encantos da Natureza"). */
  const parcial = perfis.filter((p) => {
    const emp = normalizarTexto(p.company_name);
    const nom = normalizarTexto(p.name);
    return (emp && (emp.includes(alvo) || alvo.includes(emp))) ||
      (nom && (nom.includes(alvo) || alvo.includes(nom)));
  });
  if (parcial.length === 1) return parcial[0];

  /* Se a credencial é de um cliente individual (RLS só devolve o próprio perfil),
     usa esse perfil diretamente sem exigir que o nome seja idêntico letra a letra. */
  const apenasClientes = perfis.filter((p) => p.role !== 'admin');
  if (perfis.length === 1 && perfis[0].role !== 'admin') {
    return perfis[0];
  }

  const disponiveis = apenasClientes
    .map((p) => p.company_name || p.name || p.email)
    .filter(Boolean)
    .slice(0, 12)
    .join(', ');

  throw new Error(
    disponiveis
      ? `Hospedi: não encontrei "${identificador}". Hospedagens disponíveis neste login: ${disponiveis}.`
      : `Hospedi: não encontrei a hospedagem "${identificador}" neste login.`,
  );
}

/**
 * Converte a lista de reservas da Hospedi em linhas diárias por canal:
 * - `hospedi_direto`: reservas diretas (WhatsApp, link da bio, site próprio)
 * - `hospedi_ota`: reservas vindas de Airbnb, Booking e outros portais
 */
export function mapear(
  bruto: unknown,
  de?: string,
  ate?: string,
): LinhaMetrica[] {
  const carga = (bruto ?? {}) as Partial<RespostaHospedi>;
  const reservas = Array.isArray(carga.reservas) ? carga.reservas : [];

  type Balde = {
    dia: string;
    canal: 'hospedi_direto' | 'hospedi_ota';
    captados: number;
    aprovados: number;
    receita: number;
    receitaBruta: number;
    hospedes: Set<string>;
  };

  const mapa = new Map<string, Balde>();

  const garantir = (dia: string, canal: 'hospedi_direto' | 'hospedi_ota'): Balde => {
    const chave = `${dia}|${canal}`;
    let atual = mapa.get(chave);
    if (!atual) {
      atual = {
        dia,
        canal,
        captados: 0,
        aprovados: 0,
        receita: 0,
        receitaBruta: 0,
        hospedes: new Set<string>(),
      };
      mapa.set(chave, atual);
    }
    return atual;
  };

  /* Pré-popula os dias da janela para manter a série limpa e zerar eventuais
     cancelamentos posteriores. */
  if (de && ate) {
    for (const d of listarDiasNoIntervalo(de, ate)) {
      garantir(d, 'hospedi_direto');
      garantir(d, 'hospedi_ota');
    }
  }

  for (const r of reservas) {
    const status = (r.status ?? 'confirmed').toLowerCase();
    if (status === 'cancelled' || status === 'cancelado' || status === 'canceled') {
      continue;
    }

    const dia = diaBrasiliaDeIso(r.created_at ?? r.check_in ?? null);
    if (!dia) continue;
    if (de && dia < de) continue;
    if (ate && dia > ate) continue;

    const ch = (r.channel ?? 'direct').toLowerCase();
    const canal: 'hospedi_direto' | 'hospedi_ota' =
      ch === 'direct' || ch === 'direto' || ch === '' ? 'hospedi_direto' : 'hospedi_ota';

    const valorBruto = numero(r.gross_value);
    const b = garantir(dia, canal);

    b.captados += 1;
    b.aprovados += 1;
    b.receita += valorBruto;
    b.receitaBruta += valorBruto;

    const chaveHospede =
      r.guest_id?.trim() ||
      r.guest_phone?.replace(/\D/g, '') ||
      r.guest_email?.trim().toLowerCase() ||
      r.guest_name?.trim().toLowerCase() ||
      r.id ||
      `${dia}-${b.aprovados}`;
    b.hospedes.add(chaveHospede);
  }

  return [...mapa.values()]
    .sort((a, b) => (a.dia === b.dia ? a.canal.localeCompare(b.canal) : a.dia.localeCompare(b.dia)))
    .map((b) => ({
      dia: b.dia,
      canal: b.canal,
      pedidos_captados: b.captados,
      pedidos_aprovados: b.aprovados,
      receita: Number(b.receita.toFixed(2)),
      receita_bruta: Number(b.receitaBruta.toFixed(2)),
      novos_clientes: b.hospedes.size,
    }));
}

export async function buscar({
  segredo,
  identificador,
  de,
  ate,
}: {
  segredo: SegredoHospedi;
  identificador: string;
  de: string;
  ate: string;
}): Promise<RespostaHospedi> {
  const email = segredo.email?.trim();
  const password = segredo.senha?.trim();

  if (!email || !password) {
    throw new Error('Hospedi: informe o e-mail e a senha de acesso nas Configurações.');
  }

  const baseUrl = (process.env.HOSPEDI_SUPABASE_URL ?? HOSPEDI_SUPABASE_URL_PADRAO).replace(/\/$/, '');
  const anonKey = process.env.HOSPEDI_SUPABASE_ANON_KEY ?? HOSPEDI_ANON_KEY_PADRAO;

  /* 1. Autentica na Hospedi via Supabase Auth oficial. */
  const authRes = await fetch(`${baseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
    cache: 'no-store',
  });

  const authCorpo = (await authRes.json().catch(() => ({}))) as {
    access_token?: string;
    user?: { id?: string; email?: string };
    error_description?: string;
    msg?: string;
  };

  if (!authRes.ok || !authCorpo.access_token || !authCorpo.user?.id) {
    const motivo = authCorpo.error_description ?? authCorpo.msg ?? `HTTP ${authRes.status}`;
    throw new Error(`Hospedi: falha no login (${motivo}). Confira o e-mail e a senha em Configurações.`);
  }

  const cabecalhos = {
    apikey: anonKey,
    Authorization: `Bearer ${authCorpo.access_token}`,
  };

  /* 2. Busca perfis visíveis a este login para localizar a hospedagem certa. */
  const perfisRes = await fetch(
    `${baseUrl}/rest/v1/profiles?select=id,name,company_name,email,role`,
    { headers: cabecalhos, cache: 'no-store' },
  );

  if (!perfisRes.ok) {
    throw new Error(`Hospedi: erro HTTP ${perfisRes.status} ao consultar perfis.`);
  }

  const perfis = (await perfisRes.json()) as PerfilHospedi[];
  const alvo = localizarPerfilHospedi(perfis, authCorpo.user.id, identificador);

  /* 3. Carrega os chalés/acomodações desse cliente para pegar reservas tanto por
        `user_id` quanto por `property_id`. */
  const propRes = await fetch(
    `${baseUrl}/rest/v1/properties?select=id,user_id,name&user_id=eq.${encodeURIComponent(alvo.id)}`,
    { headers: cabecalhos, cache: 'no-store' },
  );
  const propriedades = propRes.ok ? ((await propRes.json()) as PropriedadeHospedi[]) : [];
  const idsPropriedades = new Set(propriedades.map((p) => p.id));

  /* 4. Busca reservas criadas dentro do intervalo no fuso de Brasília (-03:00). */
  const inicioIso = `${de}T00:00:00-03:00`;
  const fimIso = `${ate}T23:59:59.999-03:00`;

  const params = new URLSearchParams({
    select:
      'id,user_id,property_id,created_at,check_in,check_out,status,gross_value,paid_amount,channel_fee_value,channel,detailed_channel,guest_id,guest_name,guest_phone,guest_email',
    status: 'neq.cancelled',
    order: 'created_at.asc',
  });
  /* PostgREST exige dois parâmetros `created_at` para intervalo fechado;
     montamos a query string preservando os dois filtros. */
  const qs =
    `${params.toString()}` +
    `&created_at=gte.${encodeURIComponent(inicioIso)}` +
    `&created_at=lte.${encodeURIComponent(fimIso)}`;

  const resReservas = await fetch(`${baseUrl}/rest/v1/bookings?${qs}`, {
    headers: cabecalhos,
    cache: 'no-store',
  });

  if (!resReservas.ok) {
    const erroTxt = await resReservas.text().catch(() => '');
    throw new Error(`Hospedi: erro HTTP ${resReservas.status} ao ler reservas (${erroTxt.slice(0, 140)}).`);
  }

  const todas = (await resReservas.json()) as ReservaHospedi[];
  const reservasDoCliente = todas.filter(
    (r) => r.user_id === alvo.id || (r.property_id ? idsPropriedades.has(r.property_id) : false),
  );

  return {
    clienteId: alvo.id,
    clienteNome: alvo.company_name || alvo.name || alvo.email || identificador,
    reservas: reservasDoCliente,
  };
}
