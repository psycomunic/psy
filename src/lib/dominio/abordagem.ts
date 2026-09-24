/**
 * O texto da abordagem, com o nome de quem vai receber.
 *
 * ============================================================
 * POR QUE O NOME NÃO ESTÁ GRAVADO NA MENSAGEM
 * ============================================================
 * A mensagem chega pela carga, e o dono é descoberto depois, um a um,
 * consultando o CNPJ. Se o nome fosse escrito dentro do texto, cada
 * descoberta exigiria reescrever aquela linha no banco, e as marcas
 * sem dono ficariam com a saudação pela metade.
 *
 * Por isso o texto guarda `{dono}` no lugar da saudação, e a troca
 * acontece na hora de mostrar e de copiar. Quem ainda não tem nome
 * recebe "Oi, tudo bem?", que é uma frase inteira, e não um buraco.
 */

/** O marcador que as mensagens gravadas carregam. */
const MARCADOR = '{dono}';

/**
 * O nome do dono, quando alguém já descobriu quem é.
 *
 * `lead.nome` é obrigatório no banco, e a carga o preencheu com o @ da
 * marca por falta de coisa melhor. Igual ao @ da marca, então, quer
 * dizer "ninguém descobriu ainda", e não "o dono se chama arroba".
 */
export function donoConhecido(
  nomeContato: string | null | undefined,
  instagramDaMarca: string | null | undefined,
): string | null {
  const nome = (nomeContato ?? '').trim();
  if (!nome) return null;
  if (nome === (instagramDaMarca ?? '').trim()) return null;
  /* Nem nome que ainda é um arroba qualquer: a marca pode ter sido
     importada com um @ e o campo editado para outro. */
  if (nome.startsWith('@')) return null;
  return nome;
}

/**
 * Só o primeiro nome, que é como se chama alguém numa conversa.
 *
 * "Oi, Mirian Alves Maia, tudo bem?" é um cadastro falando, e não uma
 * pessoa. Partículas de sobrenome ficam de fora junto com o resto.
 */
export function primeiroNome(nome: string): string {
  return nome.trim().split(/\s+/)[0] ?? nome;
}

/**
 * Troca o marcador pelo vocativo, ou o apaga.
 *
 * O marcador vive colado ao "Oi", e não depois da vírgula, justamente
 * para os dois casos saírem pontuados certo:
 *
 *   com nome  "Oi{dono}, tudo bem?" -> "Oi, Mirian, tudo bem?"
 *   sem nome  "Oi{dono}, tudo bem?" -> "Oi, tudo bem?"
 *
 * Texto sem marcador passa intacto: as mensagens antigas e a pergunta
 * de seguimento não têm saudação, e não podem ganhar uma.
 */
export function textoDaAbordagem(
  texto: string | null | undefined,
  nomeDoDono: string | null | undefined,
): string {
  if (!texto) return '';
  const nome = (nomeDoDono ?? '').trim();
  return texto.split(MARCADOR).join(nome ? `, ${primeiroNome(nome)}` : '');
}

/**
 * A abertura quebrada nas mensagens que vão ser enviadas.
 *
 * ============================================================
 * POR QUE PARTES, E NÃO UM TEXTO SÓ
 * ============================================================
 * No direct, um parágrafo de cem palavras chega como um bloco que a
 * pessoa precisa decidir se lê. Quatro mensagens curtas chegam como
 * alguém falando: a saudação, quem é e por que achou você, a prova, e
 * o convite. Cada uma delas cabe na tela sem "ver mais".
 *
 * Era isso que já estava sendo feito à mão, recortando o texto do
 * painel antes de colar. O painel passa a entregar recortado.
 *
 * ============================================================
 * A LINHA EM BRANCO É O SEPARADOR
 * ============================================================
 * E não uma coluna de lista, nem um caractere inventado. `mensagem_
 * abertura` continua sendo UM campo, legível e editável por SQL do
 * jeito que sempre foi, e a divisão é a convenção que qualquer pessoa
 * reconhece ao ler o texto.
 *
 * Mensagem sem linha em branco devolve uma parte só, que é o
 * comportamento certo para as mensagens antigas e para a pergunta de
 * seguimento.
 */
export function partesDaAbordagem(
  texto: string | null | undefined,
  nomeDoDono: string | null | undefined,
): string[] {
  const inteiro = textoDaAbordagem(texto, nomeDoDono);
  if (!inteiro) return [];
  return inteiro
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}
