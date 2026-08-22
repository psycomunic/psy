/**
 * Confere se o webhook do Asaas fala a mesma língua que a produção.
 *
 *   npm run conferir-webhook
 *
 * O QUE ELE FAZ
 *
 * Lê o token que está guardado no painel (cifrado no banco, decifrado
 * aqui com a mesma chave da aplicação) e bate na rota de produção com
 * ele. Se a rota aceitar, o token dos dois lados é o mesmo — que é a
 * única coisa que este script consegue provar sem o Asaas disparar um
 * evento de verdade.
 *
 * O evento de teste aponta para uma cobrança que NÃO EXISTE. Ele entra
 * no diário como "não encontrada" e não toca em fatura nenhuma. O
 * registro é apagado no fim: é produção, e o diário de cobrança serve
 * para explicar dinheiro, não para guardar ruído de teste.
 */
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { createDecipheriv } from 'node:crypto';

const env = {};
for (const l of readFileSync('.env.local', 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const APP = process.env.APP_URL ?? 'https://www.psycomunic.com.br';
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

let falhas = 0;
const ok = (b, t) => {
  console.log(`  ${b ? 'PASSA' : 'FALHA'}  ${t}`);
  if (!b) falhas++;
};

const MARCA = `pay_conferencia_${Date.now()}`;

try {
  console.log(`\nConferindo o webhook em ${APP}\n`);

  /* ---- o token guardado no painel -------------------------------- */
  const { data: cred } = await admin
    .from('credencial_agencia')
    .select('segredo, configuracao, ativa')
    .eq('provedor', 'asaas')
    .maybeSingle();

  if (!cred?.segredo) {
    console.error('O Asaas não está conectado no painel. Configure a chave primeiro.\n');
    process.exit(1);
  }

  const chave = Buffer.from((env.CRIPTO_CHAVE ?? '').trim(), 'base64url');
  const [v, iv, tag, cif] = cred.segredo.split('.');
  if (v !== 'v1') throw new Error('segredo em formato desconhecido');
  const d = createDecipheriv('aes-256-gcm', chave, Buffer.from(iv, 'base64url'));
  d.setAuthTag(Buffer.from(tag, 'base64url'));
  const s = JSON.parse(
    d.update(Buffer.from(cif, 'base64url'), undefined, 'utf8') + d.final('utf8'),
  );

  ok(cred.ativa === true, 'a credencial está ativa no painel');
  ok(Boolean(s.webhook_token), 'existe um token de webhook salvo no painel');
  ok(
    Boolean(s.api_key),
    `e a chave de API (${(cred.configuracao ?? {}).ambiente ?? 'sandbox'})`,
  );

  if (!s.webhook_token) {
    console.error('\nSem token salvo, não há o que conferir.\n');
    process.exit(1);
  }

  /* ---- a rota está de pé? ---------------------------------------- */
  const pronta = await fetch(`${APP}/api/asaas`).then((r) => r.json());
  ok(pronta.pronta === true, `a rota de retorno está pronta (ambiente ${pronta.ambiente})`);

  const evento = (token) =>
    fetch(`${APP}/api/asaas`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(token ? { 'asaas-access-token': token } : {}),
      },
      /* Cobrança inexistente de propósito: o painel registra "não
         encontrada" e não mexe em nada. */
      body: JSON.stringify({
        event: 'PAYMENT_UPDATED',
        payment: { id: MARCA, status: 'PENDING' },
      }),
    });

  /* ---- as três respostas que importam ---------------------------- */
  const semToken = await evento(null);
  ok(semToken.status === 401, `sem token, a rota recusa (${semToken.status})`);

  const errado = await evento('este-token-esta-errado-de-proposito');
  ok(errado.status === 401, `com token errado, recusa (${errado.status})`);

  const certo = await evento(s.webhook_token);
  const corpo = await certo.json().catch(() => ({}));
  ok(
    certo.status === 200,
    `com o token do painel, ACEITA (${certo.status})${certo.status !== 200 ? ' — os dois lados não batem' : ''}`,
  );

  if (certo.status === 200) {
    ok(
      /não encontrada|nao encontrada|sem fatura/i.test(corpo.mensagem ?? ''),
      `e responde o esperado para cobrança inexistente ("${corpo.mensagem ?? ''}")`,
    );

    /* ---- o evento chegou ao diário? ------------------------------ */
    const { data: registro } = await admin
      .from('cobranca_evento')
      .select('id, origem, evento, status, erro')
      .eq('asaas_id', MARCA)
      .maybeSingle();

    ok(Boolean(registro), 'o evento virou registro no diário de cobrança');
    ok(registro?.origem === 'webhook', 'marcado como vindo do webhook');

    if (registro) {
      await admin.from('cobranca_evento').delete().eq('id', registro.id);
      console.log('\nRegistro de teste removido do diário.');
    }
  }
} catch (e) {
  console.error(`\nErro: ${e.message}`);
  falhas++;
}

if (falhas === 0) {
  console.log('\nWEBHOOK OK — os dois lados usam o mesmo token.\n');
  console.log('Falta só o Asaas religar a fila. Se a tela ainda disser "Interrompido",');
  console.log('abra Configurações de Webhooks e reative a sincronização.\n');
} else {
  console.log(`\n${falhas} FALHA(S) NO WEBHOOK\n`);
}
process.exit(falhas === 0 ? 0 : 1);
