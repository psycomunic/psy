/**
 * Prova que a credencial da agência atravessa cifra, banco e rotina.
 *
 *   npm run dev              (noutro terminal)
 *   npm run testar-credenciais
 *
 * O QUE ESTE TESTE PROVA, E O QUE NÃO PROVA
 *
 * Prova: que o segredo cifrado sobrevive ao banco inteiro, que a rotina
 * de sincronização o DECIFRA, que ela escolhe o conector certo, e que o
 * erro da API vira linha no diário em vez de sumir.
 *
 * O jeito de provar isso sem token de verdade é usar um token FALSO. Se
 * a decifragem falhasse, o erro seria "Não foi possível decifrar". Como
 * ele é um erro da Meta reclamando do token, a cifra funcionou e o
 * caminho inteiro até a chamada HTTP está de pé.
 *
 * Não prova: que o mapeamento bate com o que a API responde de fato.
 * Isso só se descobre com uma conta conectada de verdade, e aí o
 * diário de sincronização é onde vai aparecer.
 *
 * O formato do cifrado é reproduzido aqui de propósito, em vez de
 * importado: assim o teste confere que a aplicação lê o que o FORMATO
 * diz, e não o que uma função compartilhada devolve.
 */
import { readFileSync } from 'node:fs';
import { createCipheriv, randomBytes } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const env = {};
for (const l of readFileSync('.env.local', 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const URL_SUPA = env.NEXT_PUBLIC_SUPABASE_URL;
const PUB = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SEC = env.SUPABASE_SERVICE_ROLE_KEY;
const CHAVE = env.CRIPTO_CHAVE;
const TOKEN = env.INGESTAO_TOKEN;
const APP = process.env.APP_URL ?? 'http://localhost:3000';

for (const [nome, v] of Object.entries({ CRIPTO_CHAVE: CHAVE, INGESTAO_TOKEN: TOKEN, SUPABASE_SERVICE_ROLE_KEY: SEC })) {
  if (!v) {
    console.error(`\nFalta ${nome} em .env.local.\n`);
    process.exit(1);
  }
}

const admin = createClient(URL_SUPA, SEC, { auth: { persistSession: false } });
const publico = createClient(URL_SUPA, PUB, { auth: { persistSession: false } });

/** O mesmo formato de src/lib/cripto.ts: v1.iv.tag.cifrado, base64url. */
function cifrar(claro) {
  const chave = Buffer.from(CHAVE.trim(), 'base64url');
  const iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', chave, iv);
  const ct = Buffer.concat([c.update(claro, 'utf8'), c.final()]);
  return ['v1', iv.toString('base64url'), c.getAuthTag().toString('base64url'), ct.toString('base64url')].join('.');
}

const marca = `cred-${Date.now()}`;
const SENHA = 'Credencial-Teste-2026-xyz';
let falhas = 0;
let contaId = null;
let credId = null;
let usuarioId = null;

const ok = (b, t) => {
  console.log(`  ${b ? 'PASSA' : 'FALHA'}  ${t}`);
  if (!b) falhas++;
};

async function limpar() {
  if (usuarioId) await admin.auth.admin.deleteUser(usuarioId).catch(() => {});
  if (contaId) await admin.from('conta').delete().eq('id', contaId);
  await admin.from('conta').delete().like('nome', 'cred-%');
  await admin.from('credencial_agencia').delete().like('rotulo', 'cred-%');
}

try {
  await limpar();

  /* ---------------------------------------------------------------- */
  console.log('\nO segredo não sai pela chave pública');

  const { data: cred, error: eCred } = await admin
    .from('credencial_agencia')
    .insert({
      provedor: 'meta_ads',
      rotulo: marca,
      segredo: cifrar(JSON.stringify({ access_token: 'TOKEN-FALSO-DE-TESTE' })),
      pista: '••••STE',
      configuracao: {},
    })
    .select('id')
    .single();
  if (eCred) throw new Error(`não criou a credencial: ${eCred.message}`);
  credId = cred.id;

  const { data: pub } = await publico.from('credencial_agencia').select('id').limit(1);
  ok((pub ?? []).length === 0, 'credencial_agencia é invisível pela chave pública');

  const { data: guardado } = await admin
    .from('credencial_agencia')
    .select('segredo')
    .eq('id', credId)
    .single();
  ok(
    !String(guardado.segredo).includes('TOKEN-FALSO'),
    'o token não está em texto puro na coluna',
  );
  ok(String(guardado.segredo).startsWith('v1.'), 'o que está gravado é o formato cifrado');

  /* ---------------------------------------------------------------- */
  console.log('\nO upsert substitui em vez de duplicar');

  await admin.from('credencial_agencia').upsert(
    {
      provedor: 'meta_ads',
      rotulo: marca,
      segredo: cifrar(JSON.stringify({ access_token: 'TOKEN-FALSO-DE-TESTE' })),
      pista: '••••STE',
      configuracao: { nota: 'segunda vez' },
    },
    { onConflict: 'provedor,rotulo' },
  );

  const { data: todas } = await admin
    .from('credencial_agencia')
    .select('id')
    .eq('rotulo', marca);
  ok((todas ?? []).length === 1, `guardar de novo não duplica (${(todas ?? []).length} linha)`);

  /* ---------------------------------------------------------------- */
  console.log('\nO vínculo da loja');

  const { data: conta } = await admin
    .from('conta')
    .insert({ nome: marca, situacao: 'ativa' })
    .select('id')
    .single();
  contaId = conta.id;

  const { error: eSemCred } = await admin.from('integracao').insert({
    conta_id: contaId,
    provedor: 'shopify',
    identificador: 'loja.myshopify.com',
    ativa: true,
  });
  ok(
    !!eSemCred,
    'integração ativa sem credencial nenhuma é recusada pelo banco',
  );

  const { data: integ, error: eInteg } = await admin
    .from('integracao')
    .insert({
      conta_id: contaId,
      provedor: 'meta_ads',
      identificador: 'act_000000000000000',
      credencial_id: credId,
      janela_dias: 3,
      ativa: true,
    })
    .select('id')
    .single();
  if (eInteg) throw new Error(`não criou o vínculo: ${eInteg.message}`);

  /* ---------------------------------------------------------------- */
  console.log('\nA rotina decifra e chama a API');

  const r = await fetch(`${APP}/api/sincronizar?conta=${contaId}`, {
    method: 'POST',
    headers: { 'x-psy-token': TOKEN },
  });
  const corpo = await r.json().catch(() => ({}));

  ok(r.status === 200, `a rotina responde 200 mesmo com fonte falhando (deu ${r.status})`);
  ok(corpo.fontes === 1, `viu a fonte vinculada (viu ${corpo.fontes})`);

  const msg = corpo.resultados?.[0]?.mensagem ?? '';
  ok(
    !/decifrar/i.test(msg),
    `a decifragem funcionou: o erro não é de cifra ("${String(msg).slice(0, 70)}")`,
  );
  ok(
    /^Meta:/.test(msg),
    'o erro veio da API da Meta, ou seja: o conector certo foi escolhido e chamado',
  );

  /* ---------------------------------------------------------------- */
  console.log('\nA falha vira registro, e não silêncio');

  const { data: log } = await admin
    .from('sincronizacao')
    .select('status, erro, dia_de, dia_ate, origem')
    .eq('conta_id', contaId);
  ok((log ?? []).length === 1, 'a tentativa virou uma linha no diário');
  ok(log?.[0]?.status === 'erro', 'marcada como erro');
  ok(!!log?.[0]?.erro, `com a mensagem da API junto`);
  ok(log?.[0]?.dia_de !== log?.[0]?.dia_ate, 'a janela de 3 dias tem começo e fim diferentes');

  const hoje = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
  ok(log?.[0]?.dia_ate < hoje, 'a janela termina ONTEM, e não hoje');

  const { data: depois } = await admin
    .from('integracao')
    .select('ultimo_erro, ultima_sync_ok')
    .eq('id', integ.id)
    .single();
  ok(!!depois?.ultimo_erro, 'a integração guarda o último erro');
  ok(!depois?.ultima_sync_ok, 'e não marca sucesso que não houve');

  /* ---------------------------------------------------------------- */
  console.log('\nO status na tela');

  /* `integracao_status` filtra por `e_interno()`, e a service role não
     tem sessão nenhuma: para ela a view volta VAZIA, que é o correto.
     Consultar como service role aqui devolvia "undefined" e passava a
     impressão de que a view estava quebrada. Quem consulta é gente
     logada, então o teste loga. */
  const { data: criado, error: eUser } = await admin.auth.admin.createUser({
    email: `${marca}@teste.local`,
    password: SENHA,
    email_confirm: true,
    app_metadata: { papel: 'administrador' },
  });
  if (eUser) throw new Error(`não criou o usuário: ${eUser.message}`);
  usuarioId = criado.user.id;

  const comoAdmin = createClient(URL_SUPA, PUB, { auth: { persistSession: false } });
  const { error: eLogin } = await comoAdmin.auth.signInWithPassword({
    email: `${marca}@teste.local`,
    password: SENHA,
  });
  if (eLogin) throw new Error(`não logou: ${eLogin.message}`);

  const { data: vazio } = await admin
    .from('integracao_status')
    .select('estado')
    .eq('id', integ.id);
  ok(
    (vazio ?? []).length === 0,
    'a view de status volta vazia para quem não tem sessão, e não vaza por fora',
  );

  const { data: st } = await comoAdmin
    .from('integracao_status')
    .select('estado, tem_credencial, credencial_rotulo')
    .eq('id', integ.id)
    .single();
  ok(st?.tem_credencial === true, 'a integração é reconhecida como credenciada pela agência');
  ok(st?.estado === 'com_erro', `o estado é "com_erro" (é "${st?.estado}")`);
  ok(st?.credencial_rotulo === marca, 'e diz qual credencial está em uso');

  /* ---------------------------------------------------------------- */
  console.log('\nApagar a credencial não apaga a loja');

  const { error: eDel } = await admin.from('credencial_agencia').delete().eq('id', credId);
  ok(!eDel, `apagar a credencial é sempre possível${eDel ? `: ${eDel.message}` : ''}`);
  credId = null;

  const { data: orfa } = await admin
    .from('integracao')
    .select('credencial_id')
    .eq('id', integ.id)
    .single();
  ok(orfa !== null, 'o vínculo continua existindo');
  ok(orfa?.credencial_id === null, 'apontando para credencial nenhuma, em vez de sumir junto');

  const { data: orfaAtiva } = await admin
    .from('integracao')
    .select('ativa, ultimo_erro')
    .eq('id', integ.id)
    .single();
  ok(orfaAtiva?.ativa === false, 'a fonte foi desligada junto, em vez de ficar parada em silêncio');
  ok(/removida/i.test(orfaAtiva?.ultimo_erro ?? ''), 'com o motivo escrito na própria integração');

  const { data: stOrfa } = await comoAdmin
    .from('integracao_status')
    .select('estado')
    .eq('id', integ.id)
    .single();
  ok(stOrfa?.estado === 'desligada', `e a tela passa a dizer "desligada" (diz "${stOrfa?.estado}")`);
} catch (e) {
  if (/fetch failed|ECONNREFUSED/.test(String(e.message))) {
    console.error(`\nO app precisa estar rodando em ${APP}. Suba com "npm run dev".\n`);
  } else {
    console.error(`\nErro no teste: ${e.message}`);
  }
  falhas++;
} finally {
  await limpar();
  console.log('\nDados de teste removidos.');
}

console.log(falhas === 0 ? '\nCREDENCIAIS OK\n' : `\n${falhas} FALHA(S) NAS CREDENCIAIS\n`);
process.exit(falhas === 0 ? 0 : 1);
