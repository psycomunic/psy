/**
 * Aplica as migrações de supabase/migrations no banco, em ordem.
 *
 *   npm run migrar          aplica o que falta
 *   npm run migrar -- --ver mostra o que seria aplicado, sem executar
 *
 * A senha do banco NUNCA passa por aqui como argumento: ela vem de
 * SUPABASE_DB_URL no .env.local, que está no .gitignore. Senha em linha
 * de comando fica no histórico do shell e na lista de processos.
 *
 * Cada migração roda dentro de UMA transação. Se qualquer comando do
 * arquivo falhar, o arquivo inteiro volta atrás. Migração aplicada pela
 * metade é o pior estado possível: o banco fica num formato que nenhum
 * arquivo descreve.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import pg from 'pg';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');

/* Lê o .env.local na mão: este script roda fora do Next, que é quem
   normalmente carrega esse arquivo. */
function lerEnv() {
  const env = {};
  try {
    const txt = readFileSync(join(raiz, '.env.local'), 'utf8');
    for (const linha of txt.split('\n')) {
      const m = linha.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch {
    /* sem arquivo: cai na checagem abaixo */
  }
  return { ...env, ...process.env };
}

const env = lerEnv();
const url = env.SUPABASE_DB_URL;
const apenasVer = process.argv.includes('--ver');

if (!url || url.includes('[YOUR-PASSWORD]') || url.includes('SUA-SENHA')) {
  console.error(`
Falta a senha do banco.

  1. Abra .env.local
  2. Em SUPABASE_DB_URL, troque SUA-SENHA pela senha do banco

  Onde achar: painel do Supabase > Project Settings > Database >
  Database password. Se você não guardou, use "Reset database password"
  ali mesmo.

  Se a conexão direta falhar por IPv6, use a string do POOLER, na mesma
  tela, em Connection pooling > Session mode.
`);
  process.exit(1);
}

const dir = join(raiz, 'supabase', 'migrations');
const arquivos = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();

const cliente = new pg.Client({
  connectionString: url,
  /* Supabase exige TLS. rejectUnauthorized false porque o certificado é
     de uma CA interna deles; a conexão continua criptografada. */
  ssl: { rejectUnauthorized: false },
});

try {
  await cliente.connect();
  const { rows: [info] } = await cliente.query(
    'select current_database() as banco, version() as versao',
  );
  console.log(`Conectado em ${info.banco}`);
  console.log(`${info.versao.split(',')[0]}\n`);

  /* Controle de o que já rodou. Sem isso, rodar o script duas vezes
     quebraria em "type already exists" e não dá para saber onde parou. */
  await cliente.query(`
    create table if not exists migracao_aplicada (
      arquivo     text primary key,
      aplicada_em timestamptz not null default now()
    )
  `);

  const { rows: jaFeitas } = await cliente.query('select arquivo from migracao_aplicada');
  const feitas = new Set(jaFeitas.map((r) => r.arquivo));

  let aplicadas = 0;

  for (const arquivo of arquivos) {
    if (feitas.has(arquivo)) {
      console.log(`  ja aplicada   ${arquivo}`);
      continue;
    }
    if (apenasVer) {
      console.log(`  aplicaria     ${arquivo}`);
      continue;
    }

    const sql = readFileSync(join(dir, arquivo), 'utf8');
    process.stdout.write(`  aplicando     ${arquivo} ... `);

    try {
      await cliente.query('begin');
      await cliente.query(sql);
      await cliente.query('insert into migracao_aplicada (arquivo) values ($1)', [arquivo]);
      await cliente.query('commit');
      console.log('ok');
      aplicadas++;
    } catch (erro) {
      await cliente.query('rollback');
      console.log('FALHOU');
      console.error(`\n${erro.message}`);
      if (erro.position) {
        /* Mostra o trecho exato: procurar a linha na mão num arquivo de
           300 linhas de SQL é perda de tempo. */
        const pos = Number(erro.position);
        const ate = sql.slice(0, pos);
        const linha = ate.split('\n').length;
        console.error(`\nLinha ${linha} de ${arquivo}:`);
        console.error(sql.split('\n').slice(Math.max(0, linha - 3), linha + 2).join('\n'));
      }
      console.error('\nNada foi aplicado deste arquivo. O banco continua no estado anterior.');
      process.exit(1);
    }
  }

  if (apenasVer) {
    console.log('\nNada foi executado (--ver).');
  } else {
    console.log(`\n${aplicadas} ${aplicadas === 1 ? 'migracao aplicada' : 'migracoes aplicadas'}.`);

    const { rows: tabelas } = await cliente.query(`
      select table_name from information_schema.tables
       where table_schema = 'public' and table_type = 'BASE TABLE'
       order by table_name
    `);
    const { rows: views } = await cliente.query(`
      select table_name from information_schema.views
       where table_schema = 'public' order by table_name
    `);
    const { rows: [{ n: politicas }] } = await cliente.query(
      `select count(*)::int as n from pg_policies where schemaname = 'public'`,
    );

    console.log(`\nTabelas (${tabelas.length}): ${tabelas.map((t) => t.table_name).join(', ')}`);
    console.log(`Views (${views.length}): ${views.map((v) => v.table_name).join(', ')}`);
    console.log(`Politicas de RLS: ${politicas}`);
  }
} catch (erro) {
  console.error(`\nNao foi possivel conectar: ${erro.message}`);
  if (/ENOTFOUND|ENETUNREACH|EHOSTUNREACH/.test(erro.message)) {
    console.error(`
A conexao DIRETA do Supabase e IPv6. Se a sua rede nao tem IPv6, use a
string do POOLER: painel > Project Settings > Database > Connection
pooling > Session mode. Ela e IPv4 e serve para migracao.`);
  }
  process.exit(1);
} finally {
  await cliente.end().catch(() => {});
}
