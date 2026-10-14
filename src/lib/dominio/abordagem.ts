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

/* ================================================================== */
/* O texto da abordagem                                                */
/* ================================================================== */

/**
 * A mensagem de abertura, montada AQUI e não gravada no banco.
 *
 * ============================================================
 * POR QUE SAIU DO BANCO
 * ============================================================
 * O texto já foi reescrito oito vezes, da 0028 à 0043, e cada versão
 * custou uma migração que reescrevia cinquenta linhas com `replace`
 * em cima de frases inteiras. Quando o acesso ao banco some, como
 * aconteceu, a próxima ideia de copy fica presa.
 *
 * O banco continua guardando os INGREDIENTES, que são de cada marca e
 * só mudam quando alguém pesquisa de novo: o gancho, o segmento, o
 * nome. O texto que junta os três é decisão de copy, muda toda semana,
 * e por isso vive no código, onde se testa e se publica num deploy.
 *
 * ============================================================
 * O QUE ESTA MENSAGEM PERSEGUE
 * ============================================================
 * Um nome e um telefone, e mais nada. Quem lê um direct de marca quase
 * nunca decide: é social media ou atendimento. Então a mensagem não
 * tenta vender, não pede reunião e não pede quinze minutos. Ela faz UM
 * pedido, que quem lê consegue atender sem pedir autorização: o
 * contato de quem responde pelo marketing.
 *
 * Quatro blocos, porque é o que cabe na tela do celular antes do olho
 * desistir: saudação, elogio com o diferencial concreto, por que
 * estamos falando, e o pedido.
 */
export type IngredientesDaAbordagem = {
  /** Nome da marca, como ela se chama no perfil. */
  marca: string | null | undefined;
  /** O diferencial, em frase começada por verbo: "Fabricam fitness…". */
  gancho: string | null | undefined;
  /** "Moda íntima", "Infantil (RN ao 16)". */
  segmento: string | null | undefined;
};

/**
 * O gancho vira sujeito da frase.
 *
 * Os ganchos foram escritos como frases de terceira pessoa do plural,
 * sem sujeito: "Fabricam fitness e vendem 100% no atacado". Conferidos
 * os cinquenta, todos começam assim. Colar "Vocês" na frente e baixar
 * a primeira letra transforma a ficha em fala, sem reescrever nenhum.
 */
function comVoces(gancho: string): string {
  const g = gancho.trim().replace(/[.!]+$/, '');
  return `Vocês ${g.charAt(0).toLowerCase()}${g.slice(1)}`;
}

/**
 * O segmento sem o detalhe entre parênteses.
 *
 * "Infantil (RN ao 16)" e "Moda feminina (P ao G4)" são ótimos na
 * ficha e péssimos no meio de uma frase. A faixa de tamanho é detalhe
 * de pesquisa, não de conversa.
 *
 * A preposição é "de", e não "em" nem "no": ela é a única que serve a
 * todos sem concordar em gênero. "de moda íntima", "de jeans", "de
 * calçados femininos". Com "no" seria "no moda íntima".
 */
function segmentoEmFrase(segmento: string): string {
  const limpo = segmento.replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();
  return limpo.charAt(0).toLowerCase() + limpo.slice(1);
}

export function montarAbordagem({ marca, gancho, segmento }: IngredientesDaAbordagem): string {
  const nome = (marca ?? '').trim();
  const g = (gancho ?? '').trim();
  const s = (segmento ?? '').trim();

  const blocos = [`Opa${MARCADOR}, tudo bem?`];

  /* O elogio só existe se houver um diferencial de verdade para citar.
     Sem gancho, "parabéns pelo trabalho" sozinho é a frase que todo
     robô de prospecção manda, e queima o contato na primeira linha. */
  if (g) {
    blocos.push(
      nome
        ? `Parabéns pelo trabalho de vocês em ${nome}! ${comVoces(g)}, e isso não se constrói da noite para o dia.`
        : `${comVoces(g)}, e isso não se constrói da noite para o dia.`,
    );
  } else if (nome) {
    blocos.push(`Parabéns pelo trabalho de vocês em ${nome}!`);
  }

  /*
    A CREDENCIAL, EM UMA FRASE SÓ

    Ela existe para responder "por que eu te daria o contato do meu
    chefe?", e essa pergunta se responde com o que já foi feito, não
    com adjetivo. Por isso um número e duas plataformas, que quem é do
    ramo reconhece, em vez de "somos especialistas em soluções".

    Uma frase, e não um parágrafo: a mensagem inteira passou de 80 para
    105 palavras com este bloco, e foi o limite que eu aceitei. Acima
    disso o direct vira texto, e texto no direct não é lido.
  */
  blocos.push(
    'Sou especialista em e-commerce: já toquei uma operação que faturou R$ 16 milhões no ano e conheço a rotina por dentro, de Magazord a Loja Integrada.',
  );

  blocos.push(
    s
      ? `Estamos mapeando marcas de destaque de ${segmentoEmFrase(s)} aqui da região para apresentar uma proposta de expansão nas vendas online.`
      : 'Estamos mapeando marcas de destaque aqui da região para apresentar uma proposta de expansão nas vendas online.',
  );

  /* O pedido, sem alternativa que atrapalhe: um nome e um contato.
     "Pode me chamar quando puder" devolve a bola para quem não decide,
     e a conversa morre lida. */
  blocos.push(
    'Com quem eu consigo falar sobre novos projetos e canais de venda de vocês? Consegue me passar o WhatsApp ou o e-mail do responsável?',
  );

  return blocos.join('\n\n');
}

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
