/**
 * Cadastra uma loja cliente e, opcionalmente, o acesso do lojista.
 *
 *   npm run criar-conta -- "Loja do Joao"
 *   npm run criar-conta -- "Loja do Joao" joao@loja.com
 *   npm run criar-conta -- "Loja do Joao" joao@loja.com Nuvemshop
 *
 * Existe porque o painel hoje LÊ o banco e ainda não tem formulário de
 * cadastro. É o caminho honesto até as telas de escrita existirem:
 * melhor um comando que faz a coisa certa do que uma tela que finge.
 *
 * A senha do lojista é gerada aqui e mostrada uma vez. Não fica gravada
 * em lugar nenhum: se perder, use "reset password" no painel do
 * Supabase.
 */
import { readFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const env = {};
for (const l of readFileSync('.env.local', 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const [nome, email, plataforma] = process.argv.slice(2);

if (!nome) {
  console.error('Uso: npm run criar-conta -- "Nome da Loja" [email@lojista.com] [plataforma]');
  process.exit(1);
}

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

/* Nome único: duas contas com o mesmo nome no painel são duas linhas
   iguais, e ninguém sabe qual é qual na hora de olhar o faturamento. */
const { data: existente } = await admin.from('conta').select('id').eq('nome', nome).maybeSingle();
if (existente) {
  console.error(`Já existe uma conta chamada "${nome}".`);
  process.exit(1);
}

const { data: conta, error: erroConta } = await admin
  .from('conta')
  .insert({ nome, plataforma: plataforma ?? null })
  .select('id, nome, plataforma')
  .single();

if (erroConta) {
  console.error(`Não criou a conta: ${erroConta.message}`);
  process.exit(1);
}

console.log(`Conta criada: ${conta.nome}`);
console.log(`id: ${conta.id}`);
if (conta.plataforma) console.log(`plataforma: ${conta.plataforma}`);

if (!email) {
  console.log('\nSem e-mail informado: nenhum acesso de lojista foi criado.');
  console.log(`Para criar depois: npm run criar-conta -- "${nome}" email@lojista.com`);
  process.exit(0);
}

const abc = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
let bruta = '';
for (const b of randomBytes(20)) bruta += abc[b % abc.length];
const senha = `${bruta.slice(0, 6)}-${bruta.slice(6, 12)}-${bruta.slice(12, 18)}`;

const { data: novo, error: erroUsuario } = await admin.auth.admin.createUser({
  email,
  password: senha,
  email_confirm: true,
  /* papel e conta_id em app_metadata: só a chave secreta escreve ali.
     Em user_metadata, o próprio lojista se promoveria a admin. */
  app_metadata: { papel: 'cliente', conta_id: conta.id },
  user_metadata: { nome },
});

if (erroUsuario) {
  console.error(`\nA conta foi criada, mas o usuário não: ${erroUsuario.message}`);
  console.error(`Tente de novo com: npm run criar-conta -- "${nome}" outro@email.com`);
  process.exit(1);
}

/* Conferir o perfil: usuário sem perfil loga e não enxerga nada, e o
   sintoma disso é confuso de diagnosticar depois. */
const { data: perfil } = await admin
  .from('perfil')
  .select('papel, conta_id')
  .eq('id', novo.user.id)
  .single();

if (!perfil || perfil.conta_id !== conta.id) {
  console.error('\nO usuário foi criado mas o perfil não ficou amarrado à conta.');
  console.error('Rode npm run migrar para garantir que a migração 0005 foi aplicada.');
  process.exit(1);
}

console.log(`\nAcesso do lojista criado: ${email}`);
console.log(`papel: ${perfil.papel} · conta: ${conta.nome}`);
console.log('\n---------------------------------------------');
console.log(`  SENHA (mostrada uma vez): ${senha}`);
console.log('---------------------------------------------');
console.log('\nEle enxerga apenas os números desta conta. Confirmado por');
console.log('npm run testar-isolamento, que prova isso contra o banco.');
