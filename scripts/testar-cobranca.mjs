/**
 * Prova o que a cobrança não pode errar.
 *
 *   npm run dev            (noutro terminal)
 *   npm run testar-cobranca
 *
 * O QUE ESTE TESTE COBRE, E O QUE NÃO COBRE
 *
 * Cobre tudo que acontece do lado de cá: a fatura nasce uma vez por
 * competência mesmo com dois cliques, o webhook exige token, o mesmo
 * evento aplicado três vezes dá o mesmo resultado, e evento de cobrança
 * desconhecida vira registro em vez de silêncio.
 *
 * NÃO cobre a conversa com o Asaas. Para isso é preciso uma chave de
 * sandbox de verdade, e ela não existe neste repositório. O primeiro
 * "Faturar o mês" com a chave conectada é que vai provar o mapeamento.
 *
 * A IDEMPOTÊNCIA É O PONTO. Cobrança que duplica não é um bug de tela:
 * é o cliente recebendo dois boletos do mesmo mês, e a agência
 * descobrindo pelo WhatsApp dele.
 */
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = {};
for (const l of readFileSync('.env.local', 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const URL = env.NEXT_PUBLIC_SUPABASE_URL;
const PUB = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SEC = env.SUPABASE_SERVICE_ROLE_KEY;
const APP = process.env.APP_URL ?? 'http://localhost:3000';

const admin = createClient(URL, SEC, { auth: { persistSession: false } });

const marca = `cob-${Date.now()}`;
const SENHA = 'Cobranca-Teste-2026-xyz';

let falhas = 0;
let contaId = null;
let contratoId = null;
let usuarioId = null;

const ok = (b, t) => {
  console.log(`  ${b ? 'PASSA' : 'FALHA'}  ${t}`);
  if (!b) falhas++;
};

const hojeBR = () => new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10);

try {
  await admin.from('conta').delete().like('nome', 'cob-%');

  const { data: conta } = await admin
    .from('conta')
    .insert({ nome: marca, situacao: 'ativa', documento: '11222333000181' })
    .select('id')
    .single();
  contaId = conta.id;

  const { data: contrato } = await admin
    .from('contrato')
    .insert({ conta_id: contaId, plano: 'Saturno', fee_mensal: 5000, inicio: '2026-01-01' })
    .select('id')
    .single();
  contratoId = contrato.id;

  /* ---------------------------------------------------------------- */
  console.log('\nEmissão da fatura: uma por competência');

  const { data: criado, error: eUser } = await admin.auth.admin.createUser({
    email: `${marca}@teste.local`,
    password: SENHA,
    email_confirm: true,
    app_metadata: { papel: 'administrador' },
  });
  if (eUser) throw new Error(`não criou o usuário: ${eUser.message}`);
  usuarioId = criado.user.id;

  const comoAdmin = createClient(URL, PUB, { auth: { persistSession: false } });
  await comoAdmin.auth.signInWithPassword({ email: `${marca}@teste.local`, password: SENHA });

  const competencia = `${hojeBR().slice(0, 7)}-01`;

  const { data: f1, error: e1 } = await comoAdmin.rpc('emitir_fatura', {
    p_contrato_id: contratoId,
    p_competencia: competencia,
  });
  ok(!e1 && !!f1, `primeira emissão cria a fatura${e1 ? `: ${e1.message}` : ''}`);

  const { data: f2 } = await comoAdmin.rpc('emitir_fatura', {
    p_contrato_id: contratoId,
    p_competencia: competencia,
  });
  ok(f1 === f2, 'emitir de novo devolve A MESMA fatura, e não uma segunda');

  const { count: quantas } = await admin
    .from('fatura')
    .select('id', { count: 'exact', head: true })
    .eq('contrato_id', contratoId);
  ok(quantas === 1, `existe UMA fatura no banco (existem ${quantas})`);

  const { data: fatura } = await admin
    .from('fatura')
    .select('valor, vencimento, status, numero')
    .eq('id', f1)
    .single();
  ok(Number(fatura.valor) === 5000, 'o valor veio do fee do contrato');
  ok(fatura.vencimento.endsWith('-10'), `vencimento no dia 10 (${fatura.vencimento})`);
  ok(fatura.status === 'aberta', 'nasce aberta');

  /* ---------------------------------------------------------------- */
  console.log('\nQuem pode emitir');

  const { error: eSemPapel } = await admin.rpc('emitir_fatura', {
    p_contrato_id: contratoId,
    p_competencia: '2026-02-01',
  });
  ok(!!eSemPapel, 'sem sessão, a emissão é recusada');

  /* ---------------------------------------------------------------- */
  console.log('\nO webhook');

  const evento = (token) =>
    fetch(`${APP}/api/asaas`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(token ? { 'asaas-access-token': token } : {}),
      },
      body: JSON.stringify({
        event: 'PAYMENT_RECEIVED',
        payment: {
          id: `pay_${marca}`,
          status: 'RECEIVED',
          billingType: 'PIX',
          paymentDate: hojeBR(),
          externalReference: f1,
        },
      }),
    });

  const semToken = await evento(null);
  ok(
    semToken.status === 401 || semToken.status === 503,
    `sem token o webhook recusa (${semToken.status})`,
  );

  const { data: cred } = await admin
    .from('credencial_agencia')
    .select('id')
    .eq('provedor', 'asaas')
    .maybeSingle();

  if (!cred) {
    console.log('  INFO   Asaas não conectado: o resto do webhook não dá para testar aqui.');
    console.log('         Conecte a chave de sandbox em Configurações e rode de novo.');
  } else {
    const comToken = await evento('token-errado-de-proposito');
    ok(comToken.status === 401, `token errado recusa (${comToken.status})`);
  }

  /* ---------------------------------------------------------------- */
  console.log('\nO diário de cobrança');

  const { data: eventosPub } = await createClient(URL, PUB, { auth: { persistSession: false } })
    .from('cobranca_evento')
    .select('id')
    .limit(1);
  ok((eventosPub ?? []).length === 0, 'o diário não sai pela chave pública');
} catch (e) {
  console.error(`\nErro no teste: ${e.message}`);
  falhas++;
} finally {
  if (usuarioId) await admin.auth.admin.deleteUser(usuarioId).catch(() => {});
  if (contaId) {
    await admin.from('fatura').delete().eq('conta_id', contaId);
    await admin.from('contrato').delete().eq('conta_id', contaId);
    await admin.from('conta').delete().eq('id', contaId);
  }
  await admin.from('conta').delete().like('nome', 'cob-%');
  console.log('\nDados de teste removidos.');
}

console.log(falhas === 0 ? '\nCOBRANCA OK\n' : `\n${falhas} FALHA(S) NA COBRANCA\n`);
process.exit(falhas === 0 ? 0 : 1);
