/**
 * Prova que o RLS isola um cliente do outro.
 *
 * Este é o teste que decide se a plataforma pode ir ao ar. Todo o resto
 * é conveniência; se um lojista consegue ler o faturamento de outro, o
 * sistema não pode existir.
 *
 * O método: cria DUAS contas com métricas diferentes, cria um usuário
 * cliente amarrado à primeira, faz login DE VERDADE com ele e verifica o
 * que a sessão dele consegue enxergar. Não checa código nem lê política:
 * pergunta ao banco, com o token do cliente, e olha a resposta.
 *
 *   npm run testar-isolamento
 *
 * Limpa tudo que criou no fim, inclusive em caso de falha.
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

const admin = createClient(URL, SEC, { auth: { persistSession: false } });

const marca = `teste-rls-${Date.now()}`;
const senha = 'Teste-Isolamento-2026-xyz';
let idUsuario = null;
let contaA = null;
let contaB = null;
let falhas = 0;

const ok = (b, t) => {
  console.log(`  ${b ? 'PASSA' : 'FALHA'}  ${t}`);
  if (!b) falhas++;
};

try {
  /* --- Montagem ---------------------------------------------------- */
  const { data: cA } = await admin.from('conta')
    .insert({ nome: `${marca}-A`, plataforma: 'Teste' }).select('id').single();
  const { data: cB } = await admin.from('conta')
    .insert({ nome: `${marca}-B`, plataforma: 'Teste' }).select('id').single();
  contaA = cA.id; contaB = cB.id;

  const hoje = new Date().toISOString().slice(0, 10);
  await admin.from('metrica_diaria').insert([
    { conta_id: contaA, dia: hoje, canal: 'google', receita: 1000, investimento: 250,
      sessoes: 500, pedidos_captados: 12, pedidos_aprovados: 10, novos_clientes: 6 },
    { conta_id: contaB, dia: hoje, canal: 'google', receita: 9999, investimento: 999,
      sessoes: 800, pedidos_captados: 30, pedidos_aprovados: 25, novos_clientes: 15 },
  ]);

  const { data: novo, error: erroUsuario } = await admin.auth.admin.createUser({
    email: `${marca}@exemplo.invalido`,
    password: senha,
    email_confirm: true,
    app_metadata: { papel: 'cliente', conta_id: contaA },
    user_metadata: { nome: 'Cliente de Teste' },
  });
  if (erroUsuario) throw new Error(`nao criou o usuario: ${erroUsuario.message}`);
  idUsuario = novo.user.id;

  const { data: perfil } = await admin.from('perfil')
    .select('papel, conta_id').eq('id', idUsuario).single();

  console.log('\nMontagem');
  ok(!!perfil, 'o gatilho criou o perfil');
  ok(perfil?.papel === 'cliente', 'papel gravado como cliente');
  ok(perfil?.conta_id === contaA, 'amarrado a conta A');

  /* --- Login de verdade -------------------------------------------- */
  const cliente = createClient(URL, PUB, { auth: { persistSession: false } });
  const { error: erroLogin } = await cliente.auth.signInWithPassword({
    email: `${marca}@exemplo.invalido`, password: senha,
  });

  console.log('\nSessao do cliente');
  ok(!erroLogin, 'login com a chave publica funciona');

  /* --- O que ele consegue ver -------------------------------------- */
  const { data: contasVistas } = await cliente.from('conta').select('id, nome');
  const { data: metricas } = await cliente.from('metrica_diaria').select('conta_id, receita');
  const { data: kpis } = await cliente.from('kpi_diario').select('conta_id, receita');

  const soDele = (l) => (l ?? []).every((x) => x.conta_id === contaA || x.id === contaA);

  console.log('\nIsolamento');
  ok((contasVistas ?? []).length === 1, `ve 1 conta, e nao ${(contasVistas ?? []).length}`);
  ok(soDele(contasVistas), 'a conta que ve e a dele');
  ok(soDele(metricas), 'metrica_diaria: so linhas da conta dele');
  ok(soDele(kpis), 'kpi_diario: a VIEW tambem isola (security_invoker)');
  ok(!(metricas ?? []).some((m) => Number(m.receita) === 9999), 'nao ve a receita da conta B');

  /* --- Pedindo explicitamente os dados do outro -------------------- */
  const { data: espiando } = await cliente
    .from('metrica_diaria').select('receita').eq('conta_id', contaB);
  ok((espiando ?? []).length === 0, 'pedir a conta B pelo id devolve vazio');

  /* --- Dados internos da agencia ----------------------------------- */
  const { data: leads } = await cliente.from('lead').select('id');
  const { data: contratos } = await cliente.from('contrato').select('id');
  const { data: integracoes } = await cliente.from('integracao').select('id');

  console.log('\nDados internos da agencia');
  ok((leads ?? []).length === 0, 'nao ve o CRM');
  ok((contratos ?? []).length === 0, 'nao ve contratos');
  ok((integracoes ?? []).length === 0, 'nao ve tokens de integracao');

  /* --- Tentando escrever ------------------------------------------- */
  const { error: erroEscrita } = await cliente
    .from('metrica_diaria')
    .insert({ conta_id: contaA, dia: hoje, canal: 'meta', receita: 500000 });
  ok(!!erroEscrita, 'nao consegue inventar a propria receita');

  const { error: erroPromocao } = await cliente
    .from('perfil').update({ papel: 'admin' }).eq('id', idUsuario);
  const { data: depois } = await admin.from('perfil')
    .select('papel').eq('id', idUsuario).single();
  ok(!!erroPromocao || depois?.papel === 'cliente', 'nao consegue se promover a admin');

  await cliente.auth.signOut();
} catch (e) {
  console.error(`\nERRO: ${e.message}`);
  falhas++;
} finally {
  /* Limpeza. Conta de teste esquecida no banco vira "cliente" no painel
     amanha, e alguem perde tempo procurando quem e. */
  if (idUsuario) await admin.auth.admin.deleteUser(idUsuario).catch(() => {});
  if (contaA) await admin.from('conta').delete().eq('id', contaA);
  if (contaB) await admin.from('conta').delete().eq('id', contaB);
  console.log('\nDados de teste removidos.');
}

console.log(falhas === 0 ? '\nISOLAMENTO OK\n' : `\n${falhas} FALHA(S) - NAO SUBIR PARA PRODUCAO\n`);
process.exit(falhas === 0 ? 0 : 1);
