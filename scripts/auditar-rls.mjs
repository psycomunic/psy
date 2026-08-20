/**
 * Auditoria de Row Level Security.
 *
 * Critério de aceite nº 2 da plataforma: nenhuma tabela sem RLS.
 * `pg_tables` cruzado com `pg_policies` não pode retornar sobra.
 *
 *   npm run auditar-rls
 *
 * Sai com código 1 se achar problema, para poder travar o CI.
 *
 * O que ele NÃO faz: dizer se a política está certa. Política existir é
 * pré-requisito, não garantia. Quem prova que o isolamento funciona é
 * `npm run testar-isolamento`, que faz login de verdade e pergunta ao
 * banco. Os dois são necessários e nenhum substitui o outro.
 */
import { readFileSync } from 'node:fs';
import pg from 'pg';

const env = {};
for (const l of readFileSync('.env.local', 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

/**
 * Tabelas que podem ficar sem POLÍTICA — mas nunca sem RLS.
 *
 * RLS ligado com zero políticas significa "nenhuma linha para ninguém"
 * pela chave pública. É mais restritivo que qualquer política, e é
 * exatamente o que se quer para essas duas.
 */
const SEM_POLITICA_DE_PROPOSITO = {
  integracao:
    'guarda token de anúncio de cliente: nada disso pode trafegar até um navegador, nem para admin',
  migracao_aplicada:
    'controle do aplicador de migrações: quem escreve conecta direto no Postgres, fora do RLS',
  metrica_bruta:
    'payload cru das APIs: carrega id de campanha e às vezes dado de pedido. Só a rotina de sincronização lê, com a service role',
};

/**
 * Views que rodam como DEFINER de propósito.
 *
 * Uma view definer passa por cima do RLS da tabela que lê, então cada
 * caso aqui precisa se defender sozinho: ou ela não seleciona a coluna
 * sensível, ou ela filtra por papel no próprio corpo. As duas, de
 * preferência.
 */
const DEFINER_DE_PROPOSITO = {
  integracao_status:
    'lê `integracao`, que não tem política nenhuma. Não seleciona a coluna `segredo`, então não há token a vazar, e filtra por e_interno()',
};

const c = new pg.Client({
  connectionString: env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
});

let problemas = 0;
const aviso = (t) => { console.log(`  FALHA  ${t}`); problemas++; };

try {
  await c.connect();

  const { rows: tabelas } = await c.query(`
    select t.tablename,
           t.rowsecurity as rls,
           (select count(*)::int from pg_policies p
             where p.schemaname = t.schemaname and p.tablename = t.tablename) as politicas
      from pg_tables t
     where t.schemaname = 'public'
     order by t.tablename`);

  console.log(`\nRLS em ${tabelas.length} tabelas do schema public\n`);

  for (const t of tabelas) {
    const isento = SEM_POLITICA_DE_PROPOSITO[t.tablename];

    if (!t.rls) {
      aviso(`${t.tablename}: RLS DESLIGADO`);
      continue;
    }
    if (t.politicas === 0 && !isento) {
      aviso(`${t.tablename}: RLS ligado, mas nenhuma política — ninguém consegue ler`);
      continue;
    }
    if (t.politicas === 0 && isento) {
      console.log(`  ok     ${t.tablename.padEnd(20)} sem política de propósito (${isento})`);
      continue;
    }
    console.log(`  ok     ${t.tablename.padEnd(20)} ${t.politicas} políticas`);
  }

  /* `force row level security` vale também para o DONO da tabela. Sem
     ele, qualquer rotina que rode como owner passa por cima de tudo sem
     avisar, e a auditoria acima daria "ok" mesmo assim. */
  const { rows: semForce } = await c.query(`
    select relname from pg_class
     where relnamespace = 'public'::regnamespace
       and relkind = 'r'
       and relrowsecurity
       and not relforcerowsecurity
     order by relname`);

  console.log('');
  if (semForce.length > 0) {
    for (const r of semForce) {
      aviso(`${r.relname}: sem "force row level security" — o dono da tabela ignora as políticas`);
    }
  } else {
    console.log('  ok     todas com force row level security');
  }

  /* Views que leem tabela protegida precisam de security_invoker; sem
     ele elas rodam com os privilégios de quem as criou e viram um
     buraco no isolamento. */
  const { rows: views } = await c.query(`
    select c.relname,
           coalesce(
             (select option_value from pg_options_to_table(c.reloptions)
               where option_name = 'security_invoker'), 'off') as invoker,
           pg_get_viewdef(c.oid) as corpo,
           (select string_agg(a.attname, ',')
              from pg_attribute a
             where a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped)
             as colunas
      from pg_class c
     where c.relnamespace = 'public'::regnamespace and c.relkind = 'v'
     order by c.relname`);

  /* Nome de coluna que nunca pode sair de uma view definer. */
  const SEGREDO = /^(segredo|token|senha|secret|refresh_token|access_token|chave)$/i;

  console.log('');
  for (const v of views) {
    /* O Postgres guarda o valor como 'on', e não 'true'. A primeira
       versão deste script comparava com 'true' e acusou as cinco views
       como desprotegidas — falso positivo, que só apareceu porque
       `npm run testar-isolamento` afirmava o contrário. Duas checagens
       independentes discordando é como se descobre que uma delas está
       errada. */
    if (['on', 'true', '1'].includes(String(v.invoker).toLowerCase())) {
      console.log(`  ok     ${v.relname.padEnd(20)} security_invoker`);
      continue;
    }

    const motivo = DEFINER_DE_PROPOSITO[v.relname];
    if (!motivo) {
      aviso(`${v.relname}: VIEW sem security_invoker — ignora o RLS de quem consulta`);
      continue;
    }

    /* A isenção não vale por estar na lista: vale enquanto as duas
       propriedades que a justificam continuarem verdadeiras. Alguém
       adicionar `segredo` ao select desta view amanhã tem que quebrar a
       auditoria, e não herdar a permissão. */
    const expostas = String(v.colunas).split(',').filter((n) => SEGREDO.test(n));
    if (expostas.length > 0) {
      aviso(`${v.relname}: VIEW definer expondo coluna sensível (${expostas.join(', ')})`);
    } else if (!/e_interno\(\)|e_admin\(\)|pode_ver_conta\(/.test(v.corpo)) {
      aviso(`${v.relname}: VIEW definer sem filtro de papel no corpo`);
    } else {
      console.log(`  ok     ${v.relname.padEnd(20)} definer — ${motivo}`);
    }
  }
} catch (e) {
  console.error(`\nNão foi possível auditar: ${e.message}`);
  process.exit(1);
} finally {
  await c.end().catch(() => {});
}

console.log(
  problemas === 0
    ? '\nAUDITORIA OK: nenhuma tabela desprotegida.\n'
    : `\n${problemas} PROBLEMA(S) DE RLS.\n`,
);
process.exit(problemas === 0 ? 0 : 1);
