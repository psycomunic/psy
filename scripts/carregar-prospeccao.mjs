/**
 * Confere e carrega leads novos na prospecção, a partir de um CSV.
 *
 *   npm run carregar-prospeccao -- caminho/do/arquivo.csv
 *   npm run carregar-prospeccao -- caminho/do/arquivo.csv --gravar
 *
 * ============================================================
 * DOIS MODOS, E O PRIMEIRO NÃO GRAVA NADA
 * ============================================================
 * Sem `--gravar`, ele só confere e mostra o que achou. A separação não
 * é zelo: o erro aqui sai caro de um jeito que erro de tela não sai.
 * Um @ trocado manda a mensagem para o perfil de outra pessoa, e um
 * telefone errado abre conversa no WhatsApp de um estranho.
 *
 * ============================================================
 * O QUE ELE RECUSA, E O QUE SÓ AVISA
 * ============================================================
 * Recusa e não grava nada: @ fora do formato, @ ou marca que já estão
 * na base, @ repetido dentro do próprio arquivo, URL que não bate com
 * o @, prioridade fora de A/B/C, telefone que não tem 10 ou 11
 * dígitos, CNPJ que não tem 14, e linha sem gancho.
 *
 * Avisa e deixa passar: telefone de 10 dígitos (costuma ser fixo com
 * WhatsApp Business, que é comum em fábrica), gancho terminado em
 * ponto, gancho comprido demais e gancho vago. São coisas de texto, e
 * texto se conserta depois.
 *
 * ============================================================
 * O FORMATO DO CSV
 * ============================================================
 * Separado por PONTO E VÍRGULA, com cabeçalho. Colunas:
 *
 *   empresa, instagram, instagram_url, cidade, uf, regiao, segmento,
 *   modelo_venda, fabricacao_propria, situacao_site, seguidores,
 *   prioridade, oportunidade, gancho, telefone, cnpj, notas
 *
 * E mais duas opcionais, `site` e `plataforma`, que a ficha não tem
 * como coluna e entram no começo das notas: saber que a marca já está
 * no Magazord é o que decide se a conversa é de migração ou de
 * upgrade.
 *
 * O código (L051, L052…) é gerado aqui, continuando do último que
 * existe no banco. O lead nasce em `novo`, com `nome` igual ao @ da
 * marca, que é a convenção que `donoConhecido` usa para saber que
 * ninguém descobriu o dono ainda.
 */
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = {};
for (const l of readFileSync('.env.local', 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
}
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const CAMINHO = process.argv.slice(2).find((a) => !a.startsWith('--'));
const GRAVAR = process.argv.includes('--gravar');

if (!CAMINHO) {
  console.error('Uso: npm run carregar-prospeccao -- arquivo.csv [--gravar]');
  process.exit(1);
}

const linhas = readFileSync(CAMINHO, 'utf8').trim().split('\n');
const cabecalho = linhas[0].split(';').map((c) => c.trim());
const registros = linhas.slice(1).map((linha) => {
  const campos = linha.split(';');
  return Object.fromEntries(cabecalho.map((c, i) => [c, (campos[i] ?? '').trim()]));
});

const { data: existentes } = await admin
  .from('prospeccao')
  .select('codigo, instagram, lead:lead_id(empresa)');
const arrobas = new Set(existentes.map((x) => (x.instagram ?? '').toLowerCase()));
const marcas = new Set(existentes.map((x) => (x.lead?.empresa ?? '').toLowerCase()));
const ultimo = existentes
  .map((x) => Number((x.codigo ?? '').replace(/\D/g, '')))
  .reduce((a, b) => Math.max(a, b), 0);

const problemas = [];
const avisos = [];
const vistos = new Set();

registros.forEach((r, i) => {
  const onde = `linha ${i + 2} (${r.empresa || 'sem nome'})`;
  if (!r.empresa) problemas.push(`${onde}: sem nome de empresa`);
  if (!/^@[a-z0-9._]+$/i.test(r.instagram)) problemas.push(`${onde}: @ estranho: ${r.instagram}`);
  if (arrobas.has(r.instagram.toLowerCase())) problemas.push(`${onde}: @ JÁ EXISTE na base`);
  if (marcas.has(r.empresa.toLowerCase())) problemas.push(`${onde}: marca JÁ EXISTE na base`);
  if (vistos.has(r.instagram.toLowerCase())) problemas.push(`${onde}: @ repetido no próprio arquivo`);
  vistos.add(r.instagram.toLowerCase());

  if (r.instagram_url && !r.instagram_url.includes(r.instagram.slice(1))) {
    problemas.push(`${onde}: a URL não bate com o @`);
  }
  if (!['A', 'B', 'C'].includes(r.prioridade)) problemas.push(`${onde}: prioridade ${r.prioridade}`);

  const tel = r.telefone.replace(/\D/g, '');
  if (tel && (tel.length < 10 || tel.length > 11)) {
    problemas.push(`${onde}: telefone com ${tel.length} dígitos`);
  }
  if (tel && tel.length === 10) avisos.push(`${onde}: telefone de 10 dígitos, parece fixo: ${tel}`);

  const cnpj = r.cnpj.replace(/\D/g, '');
  if (cnpj && cnpj.length !== 14) problemas.push(`${onde}: CNPJ com ${cnpj.length} dígitos`);

  const seg = r.seguidores.replace(/\D/g, '');
  if (r.seguidores && !seg) problemas.push(`${onde}: seguidores não numérico: ${r.seguidores}`);

  /* O gancho é lido como "Vocês + a frase". Verbo com inicial
     maiúscula e sem ponto final é o que faz a emenda funcionar. */
  const g = r.gancho;
  if (!g) problemas.push(`${onde}: sem gancho`);
  else {
    if (g.endsWith('.')) avisos.push(`${onde}: gancho termina com ponto`);
    if (g.split(/\s+/).length > 16) {
      avisos.push(`${onde}: gancho com ${g.split(/\s+/).length} palavras`);
    }
    if (/^(são referência|somos|é |a empresa)/i.test(g)) avisos.push(`${onde}: gancho vago`);
  }
});

console.log(`${registros.length} registros lidos de ${CAMINHO}`);
console.log(`já na base: ${existentes.length} | último código: L${String(ultimo).padStart(3, '0')}\n`);

if (avisos.length) {
  console.log('AVISOS (não impedem a carga):');
  for (const a of avisos) console.log('  ·', a);
  console.log();
}
if (problemas.length) {
  console.log('PROBLEMAS:');
  for (const p of problemas) console.log('  !!', p);
  console.log('\nNada foi gravado.');
  process.exit(1);
}
console.log('Nenhum problema: @ válidos, nenhum duplicado, telefones e CNPJs com o tamanho certo.\n');

const porCidade = {};
for (const r of registros) porCidade[r.cidade] = (porCidade[r.cidade] ?? 0) + 1;
console.log('por cidade:', Object.entries(porCidade).map(([c, n]) => `${c} ${n}`).join(' · '));
console.log('com WhatsApp:', registros.filter((r) => r.telefone.replace(/\D/g, '')).length);
console.log('com site:', registros.filter((r) => r.site).length);

if (!GRAVAR) {
  console.log('\nModo conferência. Rode de novo com --gravar para inserir.');
  process.exit(0);
}

let n = 0;
for (const [i, r] of registros.entries()) {
  const codigo = `L${String(ultimo + 1 + i).padStart(3, '0')}`;
  const tel = r.telefone.replace(/\D/g, '');

  const { data: lead, error: e1 } = await admin
    .from('lead')
    .insert({
      nome: r.instagram,
      empresa: r.empresa,
      telefone: tel || null,
      estagio: 'novo',
      origem: 'Prospecção ativa',
      proximo_passo: 'Enviar DM de abertura',
      cobranca: 'mensal',
    })
    .select('id')
    .single();
  if (e1) {
    console.log(`!! ${codigo} ${r.empresa}: ${e1.message}`);
    continue;
  }

  const notas = [
    r.plataforma ? `Plataforma: ${r.plataforma}` : null,
    r.site ? (r.site.startsWith('http') ? r.site : `https://${r.site}`) : null,
    r.notas || null,
  ]
    .filter(Boolean)
    .join(' · ');

  const { error: e2 } = await admin.from('prospeccao').insert({
    lead_id: lead.id,
    codigo,
    instagram: r.instagram,
    instagram_url: r.instagram_url || null,
    cidade: r.cidade || null,
    uf: r.uf || null,
    regiao: r.regiao || null,
    segmento: r.segmento || null,
    modelo_venda: r.modelo_venda || null,
    fabricacao_propria: r.fabricacao_propria || null,
    situacao_site: r.situacao_site || null,
    seguidores: r.seguidores.replace(/\D/g, '') || null,
    prioridade: r.prioridade,
    oportunidade: r.oportunidade || null,
    gancho: r.gancho,
    cnpj: r.cnpj.replace(/\D/g, '') || null,
    canal: 'Instagram DM',
    notas: notas || null,
  });
  if (e2) {
    /* O lead sem ficha de prospecção seria um card órfão no funil,
       sem pesquisa e sem abordagem. Melhor desfazer. */
    console.log(`!! ${codigo} ${r.empresa} (prospeccao): ${e2.message}`);
    await admin.from('lead').delete().eq('id', lead.id);
    continue;
  }
  n++;
  console.log(`   ${codigo}  ${r.empresa.padEnd(26)} ${r.instagram}`);
}
console.log(`\n${n} de ${registros.length} carregados.`);
