import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

/**
 * Cifra dos segredos de terceiro.
 *
 * O que está sendo protegido: o token da BM da agência e da conta do
 * Google Ads. Com ele, quem tiver acesso mexe nas campanhas de TODOS os
 * clientes de uma vez — sobe verba, baixa verba, pausa tudo.
 *
 * ============================================================
 * A AMEAÇA QUE ISTO RESOLVE
 * ============================================================
 * Um dump do banco. Backup que vaza, réplica mal configurada, alguém
 * com acesso de leitura ao Postgres. Token em texto puro numa coluna
 * transforma qualquer uma dessas em acesso às contas de anúncio.
 *
 * Por isso a chave NÃO mora no banco. Cifrar dentro do Postgres, com
 * pgcrypto e uma chave guardada em outra tabela, protege contra quase
 * nada: quem leu uma tabela leu a outra. A chave vive só no ambiente da
 * aplicação, e o banco guarda texto que sozinho não serve para nada.
 *
 * ============================================================
 * POR QUE GCM, E NÃO CBC
 * ============================================================
 * GCM autentica: adulterar um byte do texto cifrado faz a decifragem
 * FALHAR, em vez de devolver lixo silenciosamente. Sem isso, alguém com
 * escrita no banco poderia trocar o token de um cliente pelo de outro e
 * a aplicação usaria o valor trocado sem perceber.
 *
 * As funções recebem a chave como argumento de propósito: quem lê o
 * ambiente é `credenciais.ts`, que é `server-only`. Aqui não há nada que
 * dependa de onde a chave veio, e por isso dá para testar de verdade.
 */

const VERSAO = 'v1';
const TAMANHO_CHAVE = 32; // AES-256
const TAMANHO_IV = 12; // o recomendado para GCM

export class ErroDeCripto extends Error {}

/** Converte a chave do formato do ambiente (base64url) para bytes. */
export function lerChave(bruta: string): Buffer {
  const chave = Buffer.from(bruta.trim(), 'base64url');
  if (chave.length !== TAMANHO_CHAVE) {
    throw new ErroDeCripto(
      `A chave precisa ter ${TAMANHO_CHAVE} bytes em base64url (tem ${chave.length}). ` +
        'Gere com: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64url\'))"',
    );
  }
  return chave;
}

/**
 * Texto claro → `v1.iv.tag.cifrado`, tudo em base64url.
 *
 * O IV é sorteado a cada chamada. Cifrar o mesmo token duas vezes dá
 * resultados diferentes, e é assim que tem que ser: saída igual
 * denunciaria que dois clientes usam a mesma credencial.
 */
export function cifrarCom(chave: Buffer, claro: string): string {
  const iv = randomBytes(TAMANHO_IV);
  const cifra = createCipheriv('aes-256-gcm', chave, iv);
  const cifrado = Buffer.concat([cifra.update(claro, 'utf8'), cifra.final()]);
  const tag = cifra.getAuthTag();

  return [
    VERSAO,
    iv.toString('base64url'),
    tag.toString('base64url'),
    cifrado.toString('base64url'),
  ].join('.');
}

export function decifrarCom(chave: Buffer, guardado: string): string {
  const partes = guardado.split('.');

  if (partes.length !== 4 || partes[0] !== VERSAO) {
    throw new ErroDeCripto('Formato de segredo desconhecido.');
  }

  const [, ivB64, tagB64, cifradoB64] = partes;

  try {
    const decifra = createDecipheriv(
      'aes-256-gcm',
      chave,
      Buffer.from(ivB64, 'base64url'),
    );
    decifra.setAuthTag(Buffer.from(tagB64, 'base64url'));

    return Buffer.concat([
      decifra.update(Buffer.from(cifradoB64, 'base64url')),
      decifra.final(),
    ]).toString('utf8');
  } catch {
    /* Chave errada e texto adulterado caem os dois aqui, e a mensagem
       não distingue: dizer qual dos dois foi ajuda quem está tentando. */
    throw new ErroDeCripto('Não foi possível decifrar o segredo.');
  }
}

/** `true` quando o valor já está no formato cifrado. Serve para não
    cifrar duas vezes o que veio do banco. */
export function estaCifrado(valor: string): boolean {
  return valor.startsWith(`${VERSAO}.`) && valor.split('.').length === 4;
}

/**
 * As últimas letras do segredo, para conferir na tela qual token está
 * lá sem mostrar o token. É o mesmo recurso do cartão de crédito, e
 * pela mesma razão: reconhecer não exige ler inteiro.
 */
export function final(claro: string, quantas = 4): string {
  if (claro.length <= quantas) return '•'.repeat(claro.length);
  return `••••${claro.slice(-quantas)}`;
}
