/**
 * Cria o primeiro usuário administrador.
 *
 *   npm run criar-admin -- email@dominio.com "senha forte"
 *
 * Roda DEPOIS das migrações: o gatilho `ao_criar_usuario`, criado em
 * 0001, é quem transforma o usuário de auth num perfil com papel. Sem as
 * tabelas, o usuário nasce em auth.users e não existe em `perfil`, ou
 * seja, loga e fica invisível para o RLS.
 *
 * O papel vai em `app_metadata`, e não em `user_metadata`. A diferença é
 * a única coisa que impede alguém de se promover a admin: user_metadata
 * o próprio usuário edita pelo endpoint de update; app_metadata só a
 * chave secreta escreve.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');

function lerEnv() {
  const env = {};
  try {
    const txt = readFileSync(join(raiz, '.env.local'), 'utf8');
    for (const linha of txt.split('\n')) {
      const m = linha.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch { /* segue para a checagem */ }
  return { ...env, ...process.env };
}

const env = lerEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const secreta = env.SUPABASE_SERVICE_ROLE_KEY;

const [email, senha] = process.argv.slice(2);

if (!url || !secreta) {
  console.error('Falta NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY no .env.local.');
  process.exit(1);
}
if (!email || !senha) {
  console.error('Uso: npm run criar-admin -- email@dominio.com "senha forte"');
  process.exit(1);
}
if (senha.length < 12) {
  /* O Supabase aceita 6. Doze é o mínimo razoável para uma conta que
     enxerga o faturamento de todos os clientes da carteira. */
  console.error('Senha curta. Use pelo menos 12 caracteres: esta conta vê o faturamento de todos os clientes.');
  process.exit(1);
}

const cab = {
  apikey: secreta,
  Authorization: `Bearer ${secreta}`,
  'Content-Type': 'application/json',
};

/* email_confirm true porque não há servidor de e-mail configurado
   ainda; sem isso o usuário nasceria pendente e não conseguiria entrar. */
const resposta = await fetch(`${url}/auth/v1/admin/users`, {
  method: 'POST',
  headers: cab,
  body: JSON.stringify({
    email,
    password: senha,
    email_confirm: true,
    app_metadata: { papel: 'admin' },
    user_metadata: { nome: 'Angelo Garcia' },
  }),
});

const corpo = await resposta.json();

if (!resposta.ok) {
  console.error(`Falhou: ${corpo.msg ?? corpo.message ?? JSON.stringify(corpo)}`);
  process.exit(1);
}

console.log(`Usuario criado: ${corpo.email}`);
console.log(`id: ${corpo.id}`);

/* Conferir que o gatilho fez o trabalho dele. Usuário sem perfil é
   usuário que loga e não enxerga nada, e o sintoma disso é confuso. */
const perfil = await fetch(
  `${url}/rest/v1/perfil?id=eq.${corpo.id}&select=nome,email,papel,ativo`,
  { headers: cab },
);
const linhas = await perfil.json();

if (!Array.isArray(linhas) || linhas.length === 0) {
  console.error(`
O usuario foi criado, mas NAO existe linha na tabela perfil.

Isso significa que o gatilho ao_criar_usuario nao rodou, quase sempre
porque as migracoes ainda nao foram aplicadas. Rode npm run migrar e
depois apague este usuario no painel do Supabase para recria-lo.`);
  process.exit(1);
}

console.log(`perfil: ${linhas[0].nome} · ${linhas[0].papel} · ${linhas[0].ativo ? 'ativo' : 'inativo'}`);
console.log('\nPronto. Entre em /entrar com este e-mail.');
