/**
 * Prévia e teste de verdade dos e-mails do sistema.
 *
 *   npm run testar-email
 *       Monta os seis modelos, escreve o HTML em .previa-email/ e
 *       imprime a versão de texto. Não manda nada.
 *
 *   npm run testar-email -- --enviar seu@email.com
 *       Manda os seis para esse endereço, de verdade, pelo Resend.
 *
 *   npm run testar-email -- --enviar seu@email.com --modelo proposta
 *       Manda só um.
 *
 * ============================================================
 * POR QUE ESTE SCRIPT EXISTE
 * ============================================================
 * Dá para ler o HTML de um e-mail e achar que está certo. O que não dá
 * é descobrir, lendo, que o domínio não está verificado no Resend, que
 * o SPF não propagou ou que o Gmail está jogando tudo em promoções.
 *
 * Essas três coisas só aparecem com um e-mail chegando numa caixa de
 * verdade. Então o modo `--enviar` manda para o endereço que você
 * escolher, e aí é olhar a caixa de entrada.
 *
 * A prévia em arquivo serve para outra pergunta, que é como o texto
 * ficou: abrir no navegador mostra o layout, e a versão de texto
 * impressa no terminal é a que metade dos filtros de spam lê primeiro.
 */

import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import {
  inscricaoRecebida,
  avisoDeInscricao,
  analiseRecebida,
  avisoDeLead,
  propostaPronta,
  acessoCriado,
  testeDeEnvio,
} from '../src/lib/email/modelos.ts';

const env = {};
try {
  for (const l of readFileSync('.env.local', 'utf8').split('\n')) {
    const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
} catch {
  /* Sem .env.local, só a prévia funciona. É o caso de quem clonou o
     repositório agora. */
}

const argv = process.argv.slice(2);
const ENVIAR = argv.includes('--enviar');
const DESTINO = argv[argv.indexOf('--enviar') + 1];
const SO_ESTE = argv.includes('--modelo') ? argv[argv.indexOf('--modelo') + 1] : null;

/* Dados de exemplo CLARAMENTE falsos. "Loja Exemplo" e não o nome de um
   cliente de verdade: a prévia de um e-mail é a coisa mais fácil do
   mundo de mandar para a pessoa errada, e um print com nome real
   circulando é vazamento. */
const MODELOS = {
  inscricao: {
    titulo: 'Confirmação de inscrição (Bragança)',
    modelo: inscricaoRecebida({ nome: 'Maria Exemplo', empresa: 'Padaria Exemplo' }),
  },
  'aviso-inscricao': {
    titulo: 'Aviso interno de inscrição',
    modelo: avisoDeInscricao({
      nome: 'Maria Exemplo',
      empresa: 'Padaria Exemplo',
      telefone: '(91) 90000-0000',
      email: 'maria@exemplo.com.br',
      instagram: '@padariaexemplo',
      nota: 82,
      respostas: [
        'Área: Alimentação e delivery.',
        'Cidade: Bragança.',
        'Tempo de empresa: De 3 a 10 anos.',
        'Responde o WhatsApp: Em poucos minutos.',
        'Verba de R$ 35 a 50/dia: Sim, tenho disponível.',
      ],
      motivo: 'A padaria atende bem e quer crescer sem perder a qualidade.',
    }),
  },
  analise: {
    titulo: 'Confirmação de pedido de análise (tráfego pago)',
    modelo: analiseRecebida({ nome: 'João Exemplo', empresa: 'Loja Exemplo' }),
  },
  'aviso-lead': {
    titulo: 'Aviso interno de lead do site',
    modelo: avisoDeLead({
      nome: 'João Exemplo',
      empresa: 'Loja Exemplo',
      telefone: '47 90000-0000',
      email: 'joao@exemplo.com.br',
      observacao:
        'Anuncia hoje em: Meta. Verba declarada: de R$ 5 mil a R$ 15 mil. Veio pela página de tráfego pago.',
      origem: 'Página de tráfego pago',
    }),
  },
  proposta: {
    titulo: 'Proposta comercial',
    modelo: propostaPronta({
      cliente: 'Loja Exemplo',
      contato: 'João Exemplo',
      resumo:
        'Proposta de gestão de tráfego pago e repaginação da loja virtual para a Loja Exemplo.',
      slug: 'loja-exemplo-a1b2c3d4',
      versao: 1,
      diasParaVencer: 15,
    }),
  },
  acesso: {
    titulo: 'Acesso ao painel',
    modelo: acessoCriado({
      nome: 'Carla Exemplo',
      login: 'carla@exemplo.com.br',
      papel: 'Cliente',
    }),
  },
  teste: {
    titulo: 'Teste de configuração',
    modelo: testeDeEnvio({ quem: 'Angelo Exemplo' }),
  },
};

const escolhidos = SO_ESTE
  ? Object.entries(MODELOS).filter(([k]) => k === SO_ESTE)
  : Object.entries(MODELOS);

if (escolhidos.length === 0) {
  console.error(`Modelo "${SO_ESTE}" não existe. Há: ${Object.keys(MODELOS).join(', ')}`);
  process.exit(1);
}

/* ------------------------------------------------------------------ */
/* Prévia                                                             */
/* ------------------------------------------------------------------ */

mkdirSync('.previa-email', { recursive: true });

for (const [chave, { titulo, modelo }] of escolhidos) {
  writeFileSync(`.previa-email/${chave}.html`, modelo.html, 'utf8');
  console.log(`\n${'='.repeat(68)}`);
  console.log(titulo);
  console.log(`assunto: ${modelo.assunto}   (${modelo.assunto.length} caracteres)`);
  console.log(`html:    .previa-email/${chave}.html`);
  console.log('-'.repeat(68));
  console.log(modelo.texto);
}

console.log(`\n${'='.repeat(68)}`);
console.log(`${escolhidos.length} modelo(s). O HTML está em .previa-email/, abra no navegador.`);

/* ------------------------------------------------------------------ */
/* Envio de verdade                                                   */
/* ------------------------------------------------------------------ */

if (!ENVIAR) {
  console.log('Nada foi enviado. Para mandar de verdade:');
  console.log('  npm run testar-email -- --enviar seu@email.com');
  process.exit(0);
}

if (!DESTINO || !/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(DESTINO)) {
  console.error('\nFalta o endereço: npm run testar-email -- --enviar seu@email.com');
  process.exit(1);
}

if (!env.RESEND_API_KEY) {
  console.error('\nFalta RESEND_API_KEY no .env.local. Pegue em resend.com/api-keys.');
  process.exit(1);
}

const remetente = env.EMAIL_REMETENTE || 'Psy Comunic <contato@psycomunic.com.br>';
console.log(`\nMandando ${escolhidos.length} e-mail(s) de ${remetente} para ${DESTINO}...\n`);

let falhou = 0;

for (const [chave, { modelo }] of escolhidos) {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      from: remetente,
      to: [DESTINO],
      /* O prefixo existe para o teste nunca ser confundido com o
         e-mail de verdade na caixa de ninguém. */
      subject: `[teste] ${modelo.assunto}`,
      html: modelo.html,
      text: modelo.texto,
      reply_to: env.EMAIL_RESPOSTA || 'psycomunic@gmail.com',
    }),
  });

  const corpo = await r.json().catch(() => null);

  if (r.ok) {
    console.log(`  ok    ${chave.padEnd(18)} id ${corpo?.id ?? '?'}`);
  } else {
    falhou++;
    console.log(`  FALHA ${chave.padEnd(18)} ${r.status}: ${corpo?.message ?? 'sem mensagem'}`);
  }
}

console.log('');

if (falhou > 0) {
  console.log('O que as falhas costumam ser:');
  console.log('  "domain is not verified"  o domínio ainda não passou no Resend.');
  console.log('  "from address" recusado   o remetente é de fora do domínio verificado.');
  console.log('  401                       a chave da API está errada ou foi revogada.');
  process.exit(1);
}

console.log('Todos saíram. Agora confira a caixa de entrada:');
console.log('  chegou na entrada, ou foi para promoções e spam?');
console.log('  o remetente aparece como "Psy Comunic"?');
console.log('  o layout abre certo no celular?');
