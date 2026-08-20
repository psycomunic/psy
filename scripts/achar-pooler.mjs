/**
 * Descobre a região do pooler do Supabase, testando conexão.
 *
 * A conexão direta (db.<ref>.supabase.co) é IPv6 desde 2024, e rede sem
 * IPv6 nem resolve o nome. O pooler é IPv4, mas o hostname carrega a
 * região, que o painel mostra e o DNS não: todos os
 * aws-N-<regiao>.pooler.supabase.com resolvem, inclusive os errados.
 *
 * Região errada responde "Tenant or user not found", que é a resposta do
 * roteador do pooler quando o projeto não está naquele cluster. Senha
 * errada responde outra coisa. Por isso dá para separar os dois casos e
 * dizer qual é o problema de verdade.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import pg from 'pg';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');

const env = {};
for (const linha of readFileSync(join(raiz, '.env.local'), 'utf8').split('\n')) {
  const m = linha.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const direta = env.SUPABASE_DB_URL ?? '';
const senha = decodeURIComponent(direta.replace(/^postgresql:\/\/[^:]+:/, '').replace(/@.*$/, ''));
const ref = (env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/^https:\/\//, '').replace(/\.supabase\.co.*$/, '');

if (!senha || senha === 'SUA-SENHA' || !ref) {
  console.error('Preencha SUPABASE_DB_URL com a senha em .env.local.');
  process.exit(1);
}

const regioes = [
  'sa-east-1', 'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  'eu-central-1', 'eu-west-1', 'eu-west-2', 'ap-southeast-1', 'ap-southeast-2',
  'ap-northeast-1', 'ap-south-1', 'ca-central-1',
];

console.log(`Projeto ${ref}. Testando o pooler regiao por regiao...\n`);

for (const prefixo of ['aws-1', 'aws-0']) {
  for (const regiao of regioes) {
    const host = `${prefixo}-${regiao}.pooler.supabase.com`;
    /* Porta 5432 = session mode. Migração precisa de sessão: a porta
       6543 é transaction mode, que não aceita comando fora de
       transação nem mantém estado entre statements. */
    const url = `postgresql://postgres.${ref}:${encodeURIComponent(senha)}@${host}:5432/postgres`;

    const c = new pg.Client({
      connectionString: url,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 8000,
      query_timeout: 8000,
    });

    try {
      await c.connect();
      const { rows: [r] } = await c.query('select current_database() as b');
      await c.end();
      console.log(`\nACHOU: ${host}`);
      console.log(`banco: ${r.b}\n`);
      console.log('Troque a linha do .env.local por:\n');
      console.log(`SUPABASE_DB_URL=postgresql://postgres.${ref}:SUA-SENHA@${host}:5432/postgres`);
      console.log('\n(mantendo a senha que voce ja pos)');
      process.exit(0);
    } catch (e) {
      const m = e.message ?? '';
      await c.end().catch(() => {});
      if (/Tenant or user not found/i.test(m)) {
        process.stdout.write('.');
      } else if (/password authentication failed|SASL|SCRAM/i.test(m)) {
        console.log(`\n\n${host} respondeu, mas a SENHA esta errada.`);
        console.log('O projeto esta nesta regiao. Confira a senha em');
        console.log('Supabase > Project Settings > Database > Database password.');
        process.exit(1);
      } else {
        process.stdout.write('x');
      }
    }
  }
}

console.log('\n\nNenhuma regiao aceitou. Copie a string do painel:');
console.log('Supabase > Project Settings > Database > Connection pooling > Session mode');
process.exit(1);
