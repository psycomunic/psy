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

/* Caminho relativo e com extensao: os testes deste diretorio rodam no
   `node --test`, que nao conhece o atalho `@/` do Next. */
import { whatsappEscrito } from '../../conteudo/navegacao.ts';

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
/**
 * @param marca Nome da loja, como ela se chama no perfil. Entra na
 *   frase do mapeamento, que é onde ele faz trabalho: diz que a
 *   mensagem foi escrita para aquele perfil, e não disparada para uma
 *   lista. Sem ele, as cinquenta saem idênticas, e mensagem repetida
 *   em sequência é o que o Instagram lê como automação.
 */
/**
 * O nicho em que a operação de R$ 16 milhões aconteceu.
 *
 * A credencial só cita o nicho quando ele é o MESMO do lead, e aí ela
 * para de ser currículo e vira prova: "já fiz isso no seu mercado" é
 * outra conversa, e quem recebe sabe disso.
 *
 * Para todo o resto, a frase volta a ser a das plataformas. Dizer "já
 * faturei 16 milhões no nicho de vocês" para quem vende lingerie seria
 * mentira, e é a pior espécie: não cai na hora, cai na reunião, depois
 * de a pessoa ter apostado uma agenda em você.
 */
const NICHO_PROVADO = {
  /* Casa com "Quadros e molduras", que é o segmento das fichas de
     L071 a L090, e com qualquer variação que apareça depois. */
  reconhece: /quadro|moldura/i,
  nome: 'quadros decorativos',
};

export function montarAbordagem(marca?: string | null, segmento?: string | null): string {
  const nome = (marca ?? '').trim();
  const mesmoNicho = NICHO_PROVADO.reconhece.test((segmento ?? '').trim());
  const blocos = [`Opa${MARCADOR}, tudo bem?`];

  /*
    O BLOCO DO ELOGIO SAIU, E COM ELE A PERSONALIZAÇÃO

    Ele era a única parte que mudava de marca para marca, e por isso a
    única coisa que fazia as cinquenta mensagens serem cinquenta
    mensagens. Sem ele, todas são idênticas palavra por palavra.

    Isso tem um preço conhecido, e ele não é de estilo: o Instagram usa
    mensagem repetida em sequência como sinal de spam, e a conta paga
    com alcance de direct e, no limite, com bloqueio de envio.

    Fica registrado porque foi uma escolha, e não um esquecimento. O
    gancho continua gravado em `prospeccao.gancho` e aparece na ficha,
    então reinserir o parágrafo é desfazer este bloco de código, e nada
    mais.
  */

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
  /*
    QUEM ESTÁ FALANDO, ANTES DA CREDENCIAL

    Direct de marca recebe mensagem de desconhecido o dia inteiro, e a
    primeira pergunta de quem lê é "quem é você". Um nome e uma
    empresa respondem isso em cinco palavras, e sem elas a credencial
    seguinte é um número sem dono.

    E a credencial muda com o nicho: no mercado onde a operação de
    R$ 16 milhões aconteceu, ela cita o nicho e vira prova. Fora dele,
    cita as plataformas, que é o que de fato se repete entre clientes.
  */
  blocos.push(
    mesmoNicho
      ? `Angelo da Psy Comunic aqui. Sou especialista em e-commerce e já toquei uma operação que faturou R$ 16 milhões no ano no nicho de ${NICHO_PROVADO.nome}.`
      : 'Angelo da Psy Comunic aqui. Sou especialista em e-commerce: já toquei uma operação que faturou R$ 16 milhões no ano e conheço por dentro plataformas como Magazord, Loja Integrada, entre outras.',
  );

  /*
    O segmento SAIU desta frase.

    Ele vinha da ficha de pesquisa, e a ficha descreve com a precisão
    de quem cataloga: "Jeans", "Moda feminina (P ao G4)", "Lingerie,
    pijamas e plus size". Dito na cara do dono, isso soa como etiqueta,
    e etiqueta errada é pior que nenhuma: quem se vê como marca de moda
    feminina não gosta de ser "a marca de jeans".

    "Marcas de destaque aqui da região" diz a mesma coisa sem arriscar
    a classificação, e serve às cinquenta sem concordância de gênero,
    que era o outro problema que o segmento trazia.
  */
  /* "O perfil de X chamou a atenção", e não "X entrou na lista".
     Dizer que existe uma lista é confessar o disparo em massa, que é
     justamente o que a frase precisa não parecer. */
  /*
    "AQUI DA REGIÃO" SAIU, E NÃO POR ESTILO

    A frase nasceu quando a lista inteira era do Vale do Itajaí, e era
    verdade. Com leads em São Paulo, Minas, Rio e Rio Grande do Sul,
    uma agência de Santa Catarina dizendo "aqui da região" para quem
    está em Franca escreve uma frase que não se sustenta se a pessoa
    perguntar de onde a gente é.

    Sem o complemento, a frase continua inteira e verdadeira para os
    noventa. Mentira pequena em mensagem de abertura é a que custa
    caro: ela não é descoberta na hora, é descoberta na reunião.
  */
  blocos.push(
    nome
      ? `Estamos mapeando marcas de destaque para apresentar uma proposta de expansão nas vendas online, e o perfil de ${nome} chamou a atenção.`
      : 'Estamos mapeando marcas de destaque para apresentar uma proposta de expansão nas vendas online.',
  );

  /* O pedido, sem alternativa que atrapalhe: um nome e um contato.
     "Pode me chamar quando puder" devolve a bola para quem não decide,
     e a conversa morre lida. */
  blocos.push(
    'Com quem eu consigo falar sobre novos projetos e canais de venda de vocês? Consegue me passar o WhatsApp ou o e-mail do responsável?',
  );

  /*
    O MEU CONTATO VEM DEPOIS DO PEDIDO, E NÃO NO LUGAR DELE

    Dar o número antes de perguntar seria trocar um pedido que quem lê
    consegue atender ("me passa o contato de quem decide") por um que
    não depende dele ("peça para me chamarem"), e esse segundo morre na
    primeira pessoa que esquecer.

    Depois, ele faz o contrário: abre a saída fácil para quem não quer
    passar contato de ninguém sem autorização. Repassar um número é
    coisa que social media faz sem pedir licença.
  */
  blocos.push(
    `Se for mais fácil, pode repassar o meu contato para essa pessoa: ${whatsappEscrito}.`,
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
