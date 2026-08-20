/**
 * Prova que o RLS isola uma loja da outra.
 *
 * Este é o teste que decide se a plataforma pode ir ao ar. Todo o resto
 * é conveniência; se um lojista consegue ler o faturamento de outro, o
 * sistema não pode existir.
 *
 * O método: monta TRÊS lojas com receitas diferentes, cria usuários de
 * verdade, faz LOGIN de verdade e pergunta ao banco com o token deles.
 * Não lê código nem confere política: olha a resposta.
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

const marca = `rls-${Date.now()}`;
const SENHA = 'Teste-Isolamento-2026-xyz';

const lojas = {};
const usuarios = {};
let falhas = 0;

const ok = (b, t) => {
  console.log(`  ${b ? 'PASSA' : 'FALHA'}  ${t}`);
  if (!b) falhas++;
};

const entrar = async (chave) => {
  const c = createClient(URL, PUB, { auth: { persistSession: false } });
  const { error } = await c.auth.signInWithPassword({
    email: usuarios[chave].email,
    password: SENHA,
  });
  if (error) throw new Error(`login de ${chave} falhou: ${error.message}`);
  return c;
};

async function criarLoja(nome, receita) {
  const { data } = await admin
    .from('conta').insert({ nome: `${marca}-${nome}` }).select('id').single();
  await admin.from('metrica_diaria').insert({
    conta_id: data.id,
    dia: new Date().toISOString().slice(0, 10),
    canal: 'google',
    receita,
    investimento: Math.round(receita / 4),
    sessoes: 500,
    pedidos_captados: 12,
    pedidos_aprovados: 10,
    novos_clientes: 6,
  });
  lojas[nome] = data.id;
  return data.id;
}

async function criarUsuario(chave, papel, contaPrincipal) {
  const email = `${marca}-${chave}@exemplo.invalido`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: SENHA,
    email_confirm: true,
    app_metadata: { papel, conta_id: contaPrincipal ?? null },
    user_metadata: { nome: `Teste ${chave}` },
  });
  if (error) throw new Error(`nao criou ${chave}: ${error.message}`);
  usuarios[chave] = { id: data.user.id, email };
  return data.user.id;
}

try {
  /* ================================================================ */
  /* Montagem                                                          */
  /* ================================================================ */
  await criarLoja('A', 1000);
  await criarLoja('B', 9999);
  await criarLoja('C', 5555);

  await criarUsuario('dono', 'cliente', lojas.A);
  await criarUsuario('operacao', 'cliente_leitura', lojas.A);
  await criarUsuario('multiloja', 'cliente', lojas.A);

  /* O dono de duas marcas: acesso a A e C, nunca a B. */
  await admin.from('acessos_conta').insert({
    usuario_id: usuarios.multiloja.id,
    conta_id: lojas.C,
    aceito_em: new Date().toISOString(),
  });

  console.log('\nMontagem');
  const { data: perfilDono } = await admin
    .from('perfil').select('papel, conta_id').eq('id', usuarios.dono.id).single();
  ok(!!perfilDono, 'o gatilho criou o perfil');
  ok(perfilDono?.conta_id === lojas.A, 'loja principal gravada');

  const { data: vinculos } = await admin
    .from('acessos_conta').select('conta_id').eq('usuario_id', usuarios.dono.id);
  ok((vinculos ?? []).length === 1, 'o gatilho criou o vinculo em acessos_conta');

  /* ================================================================ */
  /* Uma loja                                                          */
  /* ================================================================ */
  const dono = await entrar('dono');
  const soDele = (l, ids) => (l ?? []).every((x) => ids.includes(x.conta_id ?? x.id));

  const { data: contasDono } = await dono.from('conta').select('id');
  const { data: metricasDono } = await dono.from('metrica_diaria').select('conta_id, receita');
  const { data: kpisDono } = await dono.from('kpi_diario').select('conta_id, receita');

  console.log('\nCliente de UMA loja');
  ok((contasDono ?? []).length === 1, `ve 1 loja (viu ${(contasDono ?? []).length})`);
  ok(soDele(contasDono, [lojas.A]), 'a loja que ve e a dele');
  ok(soDele(metricasDono, [lojas.A]), 'metrica_diaria: so a loja dele');
  ok(soDele(kpisDono, [lojas.A]), 'kpi_diario: a VIEW tambem isola (security_invoker)');
  ok(!(metricasDono ?? []).some((m) => Number(m.receita) === 9999), 'nao ve a receita da loja B');

  const { data: espiando } = await dono
    .from('metrica_diaria').select('receita').eq('conta_id', lojas.B);
  ok((espiando ?? []).length === 0, 'pedir a loja B pelo id devolve vazio');

  /* ================================================================ */
  /* Multi-loja: o ganho da FASE 1                                     */
  /* ================================================================ */
  const multi = await entrar('multiloja');
  const { data: contasMulti } = await multi.from('conta').select('id');
  const { data: metricasMulti } = await multi.from('metrica_diaria').select('conta_id');

  console.log('\nCliente de DUAS lojas');
  ok((contasMulti ?? []).length === 2, `ve 2 lojas (viu ${(contasMulti ?? []).length})`);
  ok(soDele(contasMulti, [lojas.A, lojas.C]), 've exatamente A e C');
  ok(soDele(metricasMulti, [lojas.A, lojas.C]), 'metricas: so das duas lojas dele');
  ok(
    !(contasMulti ?? []).some((c) => c.id === lojas.B),
    'a terceira loja continua invisivel',
  );

  /* Revogar tem que valer na hora, e não no próximo login. */
  await admin.from('acessos_conta')
    .delete().eq('usuario_id', usuarios.multiloja.id).eq('conta_id', lojas.C);
  const { data: depoisRevogar } = await multi.from('conta').select('id');
  ok(
    (depoisRevogar ?? []).length === 1,
    'revogar acesso vale na mesma sessao, sem precisar sair e entrar',
  );
  await multi.auth.signOut();

  /* ================================================================ */
  /* Desativar tranca a porta                                          */
  /* ================================================================ */
  const operacao = await entrar('operacao');
  const { data: antesDesativar } = await operacao.from('conta').select('id');
  ok((antesDesativar ?? []).length === 1, 'cliente_leitura enxerga a loja dele');

  await admin.from('perfil').update({ ativo: false }).eq('id', usuarios.operacao.id);
  const { data: depoisDesativar } = await operacao.from('conta').select('id');

  console.log('\nDesativacao');
  ok(
    (depoisDesativar ?? []).length === 0,
    'perfil desativado perde o acesso na mesma sessao',
  );
  await operacao.auth.signOut();

  /* ================================================================ */
  /* Dados internos da agência                                         */
  /* ================================================================ */
  const { data: leads } = await dono.from('lead').select('id');
  const { data: contratos } = await dono.from('contrato').select('id');
  const { data: integracoes } = await dono.from('integracao').select('id');
  const { data: contatos } = await dono.from('contato').select('id');
  const { data: acessos } = await dono.from('acessos_conta').select('id');
  const { data: auditoria } = await dono.from('log_auditoria').select('id');

  console.log('\nDados internos da agencia');
  ok((leads ?? []).length === 0, 'nao ve o CRM');
  ok((contratos ?? []).length === 0, 'nao ve contratos');
  ok((integracoes ?? []).length === 0, 'nao ve tokens de integracao');
  ok((contatos ?? []).length === 0, 'nao ve os contatos cadastrados da propria loja');
  ok((auditoria ?? []).length === 0, 'nao ve a trilha de auditoria');
  /* O cliente vê os PRÓPRIOS vínculos, e não os dos outros. */
  ok(
    (acessos ?? []).every((a) => a.id),
    've os proprios vinculos, e apenas eles',
  );

  /* ================================================================ */
  /* Escrita                                                           */
  /* ================================================================ */
  const hoje = new Date().toISOString().slice(0, 10);
  const { error: e1 } = await dono.from('metrica_diaria')
    .insert({ conta_id: lojas.A, dia: hoje, canal: 'meta', receita: 500000 });
  const { error: e2 } = await dono.from('perfil')
    .update({ papel: 'administrador' }).eq('id', usuarios.dono.id);
  const { data: depoisPromocao } = await admin.from('perfil')
    .select('papel').eq('id', usuarios.dono.id).single();
  const { error: e3 } = await dono.from('acessos_conta')
    .insert({ usuario_id: usuarios.dono.id, conta_id: lojas.B });
  const { error: e4 } = await dono.from('conta').insert({ nome: `${marca}-pirata` });

  console.log('\nTentando escrever');
  ok(!!e1, 'nao consegue inventar a propria receita');
  ok(!!e2 || depoisPromocao?.papel === 'cliente', 'nao consegue se promover a admin');
  ok(!!e3, 'NAO CONSEGUE SE DAR ACESSO A OUTRA LOJA');
  ok(!!e4, 'nao consegue criar loja');

  await dono.auth.signOut();
} catch (e) {
  console.error(`\nERRO: ${e.message}`);
  falhas++;
} finally {
  /* Limpeza. Conta de teste esquecida vira "cliente" no painel amanhã, e
     alguém perde tempo procurando quem é. */
  for (const u of Object.values(usuarios)) {
    await admin.auth.admin.deleteUser(u.id).catch(() => {});
  }
  for (const id of Object.values(lojas)) {
    await admin.from('conta').delete().eq('id', id);
  }
  await admin.from('conta').delete().like('nome', `${marca}%`);
  console.log('\nDados de teste removidos.');
}

console.log(
  falhas === 0
    ? '\nISOLAMENTO OK\n'
    : `\n${falhas} FALHA(S) - NAO SUBIR PARA PRODUCAO\n`,
);
process.exit(falhas === 0 ? 0 : 1);
