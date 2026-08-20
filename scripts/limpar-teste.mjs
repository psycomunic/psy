/**
 * Remove do banco o que os testes deixaram para trás.
 *
 *   npm run limpar-teste              mostra o que seria apagado
 *   npm run limpar-teste -- --apagar  apaga de verdade
 *
 * ============================================================
 * POR QUE ISTO EXISTE
 * ============================================================
 * Os scripts de teste criam loja, lead, contrato e proposta com nomes
 * marcados, e limpam no fim. Só que `conta` é protegida por
 * `on delete restrict` vindo de `contrato` e de `fatura`: apagar uma
 * loja com contrato FALHA.
 *
 * Os scripts não conferiam esse erro. Eles imprimiam "dados de teste
 * removidos" e seguiam, enquanto seis lojas falsas com contrato de
 * R$ 4.500, trinta tarefas e seis marcos ficavam no banco de produção,
 * indistinguíveis de cliente de verdade na tela do painel.
 *
 * O RESTRICT está certo e fica: contrato assinado e fatura são
 * histórico financeiro, e não devem sumir porque alguém apagou um
 * cadastro. Quem estava errado era a limpeza, que precisa apagar o
 * dependente antes.
 *
 * ============================================================
 * POR QUE ELE NÃO APAGA SEM `--apagar`
 * ============================================================
 * Isto roda contra o banco de produção, onde moram os dados reais dos
 * clientes. Um script destrutivo que age no primeiro comando é um
 * acidente esperando a distração de alguém. Sem a flag, ele só mostra.
 */
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = {};
for (const l of readFileSync('.env.local', 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SEC = env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !SEC) {
  console.error('\nFaltam NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em .env.local.\n');
  process.exit(1);
}

const admin = createClient(URL, SEC, { auth: { persistSession: false } });
const apagar = process.argv.includes('--apagar');

/**
 * Os prefixos que os scripts de teste usam.
 *
 * São literais, e não uma heurística tipo "nome curto" ou "sem
 * plataforma". Heurística num script destrutivo apagaria o cadastro
 * recém-criado de um cliente de verdade.
 */
const PREFIXOS_CONTA = ['conv-', 'ing-', 'cred-', 'http-', 'dbg-', 'iso-', 'medida-'];
const PREFIXOS_SLUG = ['medida-', 'deck-', 'deck2-', 'dest-', 'preco-', 'loja-teste-', 'exemplo-'];
const PREFIXOS_CREDENCIAL = ['cred-', 'dbg-'];

const ehDeTeste = (texto, prefixos) =>
  typeof texto === 'string' && prefixos.some((p) => texto.startsWith(p));

console.log(apagar ? '\nAPAGANDO\n' : '\nSIMULAÇÃO. Nada será apagado. Use -- --apagar para valer.\n');

let total = 0;

/* ------------------------------------------------------------------ */
/* Lojas de teste                                                      */
/* ------------------------------------------------------------------ */
const { data: contas } = await admin.from('conta').select('id, nome');
const contasTeste = (contas ?? []).filter((c) => ehDeTeste(c.nome, PREFIXOS_CONTA));

console.log(`Lojas de teste: ${contasTeste.length} de ${(contas ?? []).length} no banco`);

for (const c of contasTeste) {
  const ids = { conta_id: c.id };

  const { count: nContratos } = await admin
    .from('contrato').select('id', { count: 'exact', head: true }).match(ids);
  const { count: nFaturas } = await admin
    .from('fatura').select('id', { count: 'exact', head: true }).match(ids);

  console.log(`  ${c.nome}  (contratos: ${nContratos ?? 0}, faturas: ${nFaturas ?? 0})`);
  total += 1;

  if (!apagar) continue;

  /* A ordem importa: contrato e fatura primeiro, porque são eles que
     travam o delete da loja. O resto cai por cascade. */
  const { error: eF } = await admin.from('fatura').delete().match(ids);
  if (eF) console.log(`    fatura: ${eF.message}`);

  const { error: eC } = await admin.from('contrato').delete().match(ids);
  if (eC) console.log(`    contrato: ${eC.message}`);

  const { error: eL } = await admin.from('conta').delete().eq('id', c.id);
  console.log(eL ? `    NAO APAGOU: ${eL.message}` : '    apagada');
}

/* ------------------------------------------------------------------ */
/* Propostas de teste                                                  */
/* ------------------------------------------------------------------ */
const { data: propostas } = await admin.from('proposta').select('id, slug, cliente');
const propostasTeste = (propostas ?? []).filter((p) => ehDeTeste(p.slug, PREFIXOS_SLUG));

console.log(`\nPropostas de teste: ${propostasTeste.length} de ${(propostas ?? []).length} no banco`);

for (const p of propostasTeste) {
  console.log(`  ${p.slug}  (${p.cliente})`);
  total += 1;
  if (!apagar) continue;
  const { error } = await admin.from('proposta').delete().eq('id', p.id);
  console.log(error ? `    NAO APAGOU: ${error.message}` : '    apagada');
}

/* ------------------------------------------------------------------ */
/* Credenciais de teste                                                */
/* ------------------------------------------------------------------ */
const { data: creds } = await admin.from('credencial_agencia').select('id, rotulo, provedor');
const credsTeste = (creds ?? []).filter((c) => ehDeTeste(c.rotulo, PREFIXOS_CREDENCIAL));

console.log(`\nCredenciais de teste: ${credsTeste.length} de ${(creds ?? []).length} no banco`);

for (const c of credsTeste) {
  console.log(`  ${c.provedor} · ${c.rotulo}`);
  total += 1;
  if (!apagar) continue;
  const { error } = await admin.from('credencial_agencia').delete().eq('id', c.id);
  console.log(error ? `    NAO APAGOU: ${error.message}` : '    apagada');
}

/* ------------------------------------------------------------------ */
/* Usuários de teste                                                   */
/* ------------------------------------------------------------------ */
const { data: usuarios } = await admin.auth.admin.listUsers({ perPage: 200 });
const usuariosTeste = (usuarios?.users ?? []).filter((u) =>
  String(u.email ?? '').endsWith('@teste.local'),
);

console.log(`\nUsuários de teste: ${usuariosTeste.length} de ${(usuarios?.users ?? []).length} no banco`);

for (const u of usuariosTeste) {
  console.log(`  ${u.email}`);
  total += 1;
  if (!apagar) continue;
  const { error } = await admin.auth.admin.deleteUser(u.id);
  console.log(error ? `    NAO APAGOU: ${error.message}` : '    apagado');
}

/* ------------------------------------------------------------------ */
/* O que sobrou                                                        */
/* ------------------------------------------------------------------ */
if (apagar) {
  const conferir = async (t, campo, prefixos) => {
    const { data } = await admin.from(t).select(campo);
    return (data ?? []).filter((r) => ehDeTeste(r[campo], prefixos)).length;
  };

  const sobrou =
    (await conferir('conta', 'nome', PREFIXOS_CONTA)) +
    (await conferir('proposta', 'slug', PREFIXOS_SLUG)) +
    (await conferir('credencial_agencia', 'rotulo', PREFIXOS_CREDENCIAL));

  console.log(
    sobrou === 0
      ? '\nBANCO LIMPO: nenhum resto de teste.\n'
      : `\nAINDA SOBRARAM ${sobrou} REGISTRO(S). Veja as mensagens acima.\n`,
  );
  process.exit(sobrou === 0 ? 0 : 1);
}

console.log(
  total === 0
    ? '\nNada de teste no banco.\n'
    : `\n${total} registro(s) seriam apagados. Rode com -- --apagar para confirmar.\n`,
);
