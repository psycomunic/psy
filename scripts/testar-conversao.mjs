/**
 * Prova que converter um lead em cliente é atômico e exige papel.
 *
 *   npm run testar-conversao
 *
 * POR QUE ESTE TESTE EXISTE
 * A primeira versão de `converter_lead()` tinha um furo: a checagem de
 * papel usava `if not (papel_atual() in (...))`, e sem sessão
 * `papel_atual()` devolve NULL. Em SQL, `not NULL` é NULL, e um `IF NULL`
 * simplesmente não executa — a exceção nunca era levantada, e a função
 * criava loja, contrato e tarefas para quem não tinha papel nenhum.
 *
 * Não era hipotético: o gatilho de 0005 cria usuário SEM perfil de
 * propósito quando o convite não traz papel. Essa pessoa loga com
 * `papel_atual()` nulo.
 *
 * Foi este teste que encontrou. Ele fica.
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

const marca = `conv-${Date.now()}`;
const SENHA = 'Conversao-Teste-2026-xyz';

let falhas = 0;
let usuarioId = null;
let leadId = null;
let contaId = null;

const ok = (b, t) => {
  console.log(`  ${b ? 'PASSA' : 'FALHA'}  ${t}`);
  if (!b) falhas++;
};

try {
  /* Sobra de execução anterior interrompida. */
  await admin.from('conta').delete().like('nome', 'conv-%');
  await admin.from('lead').delete().like('empresa', 'conv-%');

  const { data: lead } = await admin
    .from('lead')
    .insert({
      nome: 'Contato de Teste',
      empresa: marca,
      estagio: 'negociacao',
      valor_fee_estimado: 4500,
      probabilidade: 70,
    })
    .select('id')
    .single();
  leadId = lead.id;

  /* ---------------------------------------------------------------- */
  console.log('\nSem papel');
  const { error: semPapel } = await admin.rpc('converter_lead', {
    p_lead_id: leadId,
    p_fee_mensal: 4500,
  });
  ok(!!semPapel, 'conversao recusada');

  const { count: criadas } = await admin
    .from('conta').select('*', { count: 'exact', head: true }).eq('nome', marca);
  ok((criadas ?? 0) === 0, 'nenhuma loja criada pela tentativa recusada');

  /* ---------------------------------------------------------------- */
  const { data: novo } = await admin.auth.admin.createUser({
    email: `${marca}@exemplo.invalido`,
    password: SENHA,
    email_confirm: true,
    app_metadata: { papel: 'comercial' },
    user_metadata: { nome: 'Comercial de Teste' },
  });
  usuarioId = novo.user.id;
  await admin.from('lead').update({ responsavel_id: usuarioId }).eq('id', leadId);

  const cli = createClient(URL, PUB, { auth: { persistSession: false } });
  await cli.auth.signInWithPassword({
    email: `${marca}@exemplo.invalido`,
    password: SENHA,
  });

  console.log('\nCom papel comercial');
  const { data: id, error: erroConversao } = await cli.rpc('converter_lead', {
    p_lead_id: leadId,
    p_fee_mensal: 4500,
    p_plataforma: 'Shopify',
  });
  ok(!erroConversao, `conversao aceita${erroConversao ? ` — ${erroConversao.message}` : ''}`);
  contaId = id;

  if (contaId) {
    const [contratos, marcos, tarefas, acessos, leadDepois] = await Promise.all([
      admin.from('contrato').select('*', { count: 'exact', head: true }).eq('conta_id', contaId),
      admin.from('marco_conta').select('*', { count: 'exact', head: true }).eq('conta_id', contaId),
      admin.from('tarefa').select('*', { count: 'exact', head: true }).eq('conta_id', contaId),
      admin.from('acessos_conta').select('*', { count: 'exact', head: true }).eq('conta_id', contaId),
      admin.from('lead').select('estagio, conta_id').eq('id', leadId).single(),
    ]);

    /* Tudo isto tem que existir DEPOIS de uma única chamada. É o que
       "transação única" significa na prática. */
    ok(contratos.count === 1, 'contrato criado');
    ok(tarefas.count === 5, `5 tarefas de onboarding (criou ${tarefas.count})`);
    ok(acessos.count === 1, 'responsavel ganhou acesso a loja');
    ok(marcos.count === 1, 'marco de inicio no diario de bordo');
    ok(
      leadDepois.data?.estagio === 'ganho' && leadDepois.data?.conta_id === contaId,
      'lead marcado como ganho e ligado a loja',
    );

    const { error: duasVezes } = await cli.rpc('converter_lead', {
      p_lead_id: leadId,
      p_fee_mensal: 4500,
    });
    ok(!!duasVezes, 'converter o mesmo lead duas vezes e recusado');

    const { error: feeZero } = await cli.rpc('converter_lead', {
      p_lead_id: leadId,
      p_fee_mensal: 0,
    });
    ok(!!feeZero, 'fee zero e recusado');
  }

  await cli.auth.signOut();
} catch (e) {
  console.error(`\nERRO: ${e.message}`);
  falhas++;
} finally {
  /*
    A ordem importa, e a versão anterior estava errada.

    `conta` é protegida por `on delete restrict` vindo de `contrato` e
    de `fatura`: apagar a loja ANTES do contrato falha. E como o erro
    não era conferido, o script imprimia "dados de teste removidos" e
    seguia — deixando no banco de produção seis lojas falsas com
    contrato de R$ 4.500, trinta tarefas e seis marcos, indistinguíveis
    de cliente de verdade na tela do painel.

    O RESTRICT está certo e fica: contrato assinado é histórico
    financeiro, e não some porque alguém apagou um cadastro. Quem
    estava errado era a limpeza.

    Limpeza que MENTE é pior que limpeza que não existe: sem ela
    alguém percebe a sujeira, com ela ninguém procura.
  */
  if (usuarioId) await admin.auth.admin.deleteUser(usuarioId).catch(() => {});
  if (leadId) await admin.from('lead').delete().eq('id', leadId);

  const { data: sobras } = await admin.from('conta').select('id').like('nome', 'conv-%');
  for (const c of sobras ?? []) {
    await admin.from('fatura').delete().eq('conta_id', c.id);
    await admin.from('contrato').delete().eq('conta_id', c.id);
    const { error } = await admin.from('conta').delete().eq('id', c.id);
    if (error) {
      console.error(`  NAO REMOVEU a loja de teste ${c.id}: ${error.message}`);
      falhas++;
    }
  }

  const { data: resto } = await admin.from('conta').select('id').like('nome', 'conv-%');
  if ((resto ?? []).length > 0) {
    console.error(`\n  ${resto.length} loja(s) de teste ficaram no banco.`);
    falhas++;
  } else {
    console.log('\nDados de teste removidos.');
  }
}

console.log(falhas === 0 ? '\nCONVERSAO OK\n' : `\n${falhas} FALHA(S)\n`);
process.exit(falhas === 0 ? 0 : 1);
