/**
 * Roda TODA consulta do painel contra o banco e reporta o que quebra.
 *
 *   npm run conferir-consultas
 *
 * ============================================================
 * POR QUE ISTO PRECISOU EXISTIR
 * ============================================================
 * O CRM pedia `lead.motivo_perda`, uma coluna que nunca foi criada com
 * esse nome. A consulta falhava em toda abertura da tela, e ninguém
 * via: a camada de dados lia "does not exist" na mensagem, concluía que
 * as tabelas ainda não existiam, e devolvia DADOS DE DEMONSTRAÇÃO. Um
 * funil inventado, com nomes de empresa fictícios, para um
 * administrador logado no banco de produção.
 *
 * O TypeScript não pega isso. Ele confere o texto do `select` contra os
 * tipos gerados do Supabase; sem esses tipos gerados, o nome da coluna
 * é só uma string. Só o banco sabe.
 *
 * Este script extrai os `select` de `consultas.ts` e executa cada um
 * com `limit 0`: nenhuma linha volta, mas o Postgres valida tabela,
 * coluna e junção. É barato e pega a classe inteira do erro.
 *
 * `limit 0` também é o que torna seguro rodar contra produção: a
 * consulta é planejada e validada, e nada é lido nem escrito.
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

/* Os arquivos que consultam o banco pelo cliente do Supabase. */
const ARQUIVOS = [
  'src/lib/dados/consultas.ts',
  'src/lib/ingestao/credenciais.ts',
  'src/lib/ingestao/sincronizar.ts',
];

/**
 * Acha `.from('tabela')` seguido de `.select('...')`.
 *
 * Regex e não um analisador de verdade porque o alvo é estreito e
 * conhecido: o projeto exige `select` LITERAL, sem concatenação, para
 * a inferência de tipos do Supabase funcionar. Essa mesma regra torna
 * a extração confiável.
 */
function extrair(texto, arquivo) {
  const achados = [];
  const re = /\.from\(\s*'([a-z_]+)'\s*\)[\s\S]{0,400}?\.select\(\s*'([^']*)'/g;
  let m;
  while ((m = re.exec(texto)) !== null) {
    const linha = texto.slice(0, m.index).split('\n').length;
    achados.push({ arquivo, linha, tabela: m[1], select: m[2] });
  }
  return achados;
}

/* Selects montados fora do padrão acima, declarados na mão. */
const EXTRAS = [
  {
    arquivo: 'src/lib/ingestao/sincronizar.ts',
    linha: 0,
    tabela: 'integracao',
    select:
      'id, conta_id, provedor, identificador, janela_dias, ativa, segredo, credencial:credencial_id(id, segredo, configuracao, ativa), conta:conta_id(nome, situacao)',
  },
];

const consultas = [
  ...ARQUIVOS.flatMap((a) => extrair(readFileSync(a, 'utf8'), a)),
  ...EXTRAS,
];

/* Duas consultas idênticas não precisam ser testadas duas vezes. */
const unicas = [...new Map(consultas.map((c) => [`${c.tabela}|${c.select}`, c])).values()];

console.log(`\n${unicas.length} consulta(s) distintas em ${ARQUIVOS.length} arquivos\n`);

let falhas = 0;

for (const c of unicas) {
  /* `limit 0`: valida tabela, coluna e junção sem ler linha nenhuma. */
  const { error } = await admin.from(c.tabela).select(c.select).limit(0);

  if (!error) {
    console.log(`  ok     ${c.tabela.padEnd(20)} ${c.select.slice(0, 46)}${c.select.length > 46 ? '…' : ''}`);
    continue;
  }

  falhas++;
  console.log(`  FALHA  ${c.tabela.padEnd(20)} ${c.arquivo}:${c.linha}`);
  console.log(`         ${error.code ?? 'sem código'}: ${error.message}`);

  /* O aviso que importa: com este código, a tela mostra dado FALSO em
     vez de erro. É o que aconteceu com `motivo_perda`. */
  if (/does not exist/i.test(error.message ?? '') && error.code !== '42P01') {
    console.log('         ATENÇÃO: erro de coluna, não de tabela. A tela deve mostrar VAZIO, nunca demonstração.');
  }
}

console.log(
  falhas === 0
    ? '\nCONSULTAS OK: todas batem com o banco.\n'
    : `\n${falhas} CONSULTA(S) QUEBRADA(S).\n`,
);
process.exit(falhas === 0 ? 0 : 1);
