/**
 * Prova as duas propriedades de que a ingestão inteira depende.
 *
 *   npm run testar-ingestao
 *
 * PRIMEIRA: reimportar SOBRESCREVE, nunca soma. Toda sincronização
 * repete dias de propósito, porque pedido aprovado muda de status
 * depois do fato. Se a gravação somasse, o faturamento do cliente
 * dobraria a cada rodada — e dobraria em silêncio, com o gráfico
 * subindo bonito.
 *
 * SEGUNDA: cada fonte escreve só as colunas que são dela. A loja manda
 * receita, o Google manda verba, e as duas caem na MESMA linha (mesma
 * conta, mesmo dia, mesmo canal). Um `do update` que escrevesse a linha
 * inteira faria a última fonte a rodar zerar o que a outra gravou.
 *
 * Testa também que a função não é chamável pela chave pública, que dia
 * no futuro é recusado, e que `hoje()` é o dia de Brasília e não o de
 * Londres.
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

if (!URL || !SEC) {
  console.error('\nFaltam NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em .env.local.\n');
  process.exit(1);
}

const admin = createClient(URL, SEC, { auth: { persistSession: false } });
const publico = createClient(URL, PUB, { auth: { persistSession: false } });

const marca = `ing-${Date.now()}`;
let falhas = 0;
let contaId = null;

const ok = (b, t) => {
  console.log(`  ${b ? 'PASSA' : 'FALHA'}  ${t}`);
  if (!b) falhas++;
};

/** O dia de ontem no fuso de Brasília, em aaaa-mm-dd. */
function ontemBR() {
  const agora = new Date();
  const br = new Date(agora.getTime() - 3 * 60 * 60 * 1000);
  br.setUTCDate(br.getUTCDate() - 1);
  return br.toISOString().slice(0, 10);
}

const DIA = ontemBR();

const linhas = async () =>
  (await admin
    .from('metrica_diaria')
    .select('dia, canal, receita, investimento, sessoes, pedidos_aprovados, cliques, receita_atribuida')
    .eq('conta_id', contaId)
    .order('canal')).data ?? [];

try {
  await admin.from('conta').delete().like('nome', 'ing-%');

  const { data: conta, error: eConta } = await admin
    .from('conta')
    .insert({ nome: marca, situacao: 'ativa' })
    .select('id')
    .single();
  if (eConta) throw new Error(`não criou a loja: ${eConta.message}`);
  contaId = conta.id;

  /* ---------------------------------------------------------------- */
  console.log('\nhoje() no fuso da operação');

  const { data: hoje, error: eHoje } = await admin.rpc('hoje');
  if (eHoje) throw new Error(`hoje() falhou: ${eHoje.message}`);

  const agoraBR = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
  ok(hoje === agoraBR, `hoje() = ${hoje}, que é o dia em Brasília`);

  /* ---------------------------------------------------------------- */
  console.log('\nGravação idempotente');

  const gravar = (provedor, ls) =>
    admin.rpc('registrar_metricas', {
      p_conta: contaId,
      p_provedor: provedor,
      p_linhas: ls,
    });

  const { error: e1 } = await gravar('loja', [
    { dia: DIA, canal: 'loja', receita: 10000, pedidos_aprovados: 40 },
  ]);
  ok(!e1, `primeira gravação aceita${e1 ? `: ${e1.message}` : ''}`);

  await gravar('loja', [{ dia: DIA, canal: 'loja', receita: 10000, pedidos_aprovados: 40 }]);
  await gravar('loja', [{ dia: DIA, canal: 'loja', receita: 10000, pedidos_aprovados: 40 }]);

  const trip = await linhas();
  const loja = trip.find((l) => l.canal === 'loja');
  ok(trip.length === 1, `três gravações do mesmo dia geram UMA linha (gerou ${trip.length})`);
  ok(Number(loja?.receita) === 10000, `receita continua 10.000 e não triplicou (está ${loja?.receita})`);

  /* ---------------------------------------------------------------- */
  console.log('\nCorreção do mesmo dia');

  await gravar('loja', [{ dia: DIA, canal: 'loja', receita: 12500, pedidos_aprovados: 47 }]);
  const corrigido = (await linhas()).find((l) => l.canal === 'loja');
  ok(Number(corrigido?.receita) === 12500, 'reimportar corrige o valor em vez de somar');

  /* ---------------------------------------------------------------- */
  console.log('\nCada fonte escreve só as colunas dela');

  await gravar('google_ads', [
    { dia: DIA, canal: 'loja', investimento: 3000, cliques: 900, receita_atribuida: 8000 },
  ]);

  const misto = (await linhas()).find((l) => l.canal === 'loja');
  ok(Number(misto?.investimento) === 3000, 'a verba do Google entrou na mesma linha');
  ok(Number(misto?.receita) === 12500, 'a receita da loja SOBREVIVEU à gravação do Google');
  ok(Number(misto?.pedidos_aprovados) === 47, 'o pedido aprovado também sobreviveu');

  await gravar('ga4', [{ dia: DIA, canal: 'loja', sessoes: 5400 }]);
  const comSessao = (await linhas()).find((l) => l.canal === 'loja');
  ok(Number(comSessao?.sessoes) === 5400, 'a sessão do GA4 entrou');
  ok(
    Number(comSessao?.receita) === 12500 && Number(comSessao?.investimento) === 3000,
    'receita e verba continuam intactas depois do GA4',
  );

  /* ---------------------------------------------------------------- */
  console.log('\nO que precisa ser recusado');

  const amanha = new Date(Date.now() + 30 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const { error: eFuturo } = await gravar('loja', [{ dia: amanha, receita: 1 }]);
  ok(!!eFuturo, 'dia no futuro é recusado, e não vira buraco no gráfico de amanhã');

  const { error: eProv } = await gravar('xpto', [{ dia: DIA, receita: 1 }]);
  ok(!!eProv, 'provedor desconhecido é recusado');

  const { error: eNeg } = await admin.from('metrica_diaria').insert({
    conta_id: contaId,
    dia: DIA,
    canal: 'negativo',
    receita: -500,
  });
  ok(!!eNeg, 'receita negativa é barrada pela trava do banco');

  const { error: ePub } = await publico.rpc('registrar_metricas', {
    p_conta: contaId,
    p_provedor: 'loja',
    p_linhas: [{ dia: DIA, receita: 999999 }],
  });
  ok(!!ePub, 'a chave PÚBLICA não consegue gravar métrica');

  /* ---------------------------------------------------------------- */
  console.log('\nO log da sincronização');

  const { data: sincs } = await admin
    .from('sincronizacao')
    .select('id')
    .eq('conta_id', contaId);
  ok(
    (sincs ?? []).length === 0,
    'chamar a função direta não inventa log: quem registra é a camada do servidor',
  );

  const { data: brutaPub } = await publico.from('metrica_bruta').select('id').limit(1);
  ok(
    (brutaPub ?? []).length === 0,
    'a carga crua não sai pela chave pública',
  );

  const { data: sincPub } = await publico.from('sincronizacao').select('id').limit(1);
  ok((sincPub ?? []).length === 0, 'o log de sincronização não sai pela chave pública');

  /* ---------------------------------------------------------------- */
  console.log('\nFrescor');

  const { data: fresco } = await admin
    .from('frescor_conta')
    .select('ultimo_dia, atraso_dias, dias_com_dado_30')
    .eq('conta_id', contaId)
    .single();
  ok(fresco?.ultimo_dia === DIA, `frescor aponta o último dia (${fresco?.ultimo_dia})`);
  ok(Number(fresco?.atraso_dias) === 1, 'atraso de 1 dia, que é o esperado para ontem');
} catch (e) {
  console.error(`\nErro no teste: ${e.message}`);
  falhas++;
} finally {
  if (contaId) await admin.from('conta').delete().eq('id', contaId);
  await admin.from('conta').delete().like('nome', 'ing-%');
  console.log('\nDados de teste removidos.');
}

console.log(falhas === 0 ? '\nINGESTAO OK\n' : `\n${falhas} FALHA(S) NA INGESTAO\n`);
process.exit(falhas === 0 ? 0 : 1);
