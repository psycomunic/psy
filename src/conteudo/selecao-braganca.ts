/**
 * Apresentação "10 empresas" da unidade de Bragança, no Pará.
 *
 * ============================================================
 * O QUE ESTA PÁGINA É
 * ============================================================
 * Não é a página da unidade (`/braganca-pa`), que continua como está.
 * É uma apresentação que a equipe manda, por link, para donos de
 * negócio da região: a Psy Comunic vai escolher 10 empresas e cuidar do
 * marketing delas sem cobrar a agência. A pessoa lê, se interessa e
 * preenche o formulário de seleção.
 *
 * ============================================================
 * DUAS REGRAS QUE NÃO SE QUEBRAM
 * ============================================================
 * 1. Nenhum valor de verba na página. O número (R$ 35 a R$ 50 por dia)
 *    só aparece dentro do formulário, na pergunta da verba. Na página
 *    o investimento é "o anúncio, pago direto para a Meta ou o Google".
 * 2. Nenhum prazo. O projeto não diz por quanto tempo dura.
 *
 * Sem travessão no meio da frase. Quem fala é a empresa.
 */

export const selecao = {
  slug: 'braganca-pa/selecao',
  meta: {
    titulo: '10 empresas de Bragança com marketing feito pela Psy Comunic',
    descricao:
      'A Psy Comunic vai escolher 10 empresas de Bragança e região para cuidar do marketing e dos anúncios. Sem pagar agência. Faça a sua inscrição.',
  },
  whatsapp: '5591989110478',

  heroi: {
    rotulo: 'Bragança, PA · Seleção aberta',
    /* Montserrat mesclada: a primeira linha leve, a segunda pesada. */
    linhas: ['10 empresas de Bragança', 'vão vender mais.'],
    destaque: 'Sem pagar agência.',
    texto:
      'A Psy Comunic vai escolher 10 empresas de Bragança e região para cuidar dos anúncios e fazer vender mais. O único investimento da empresa é o anúncio, pago direto para a Meta ou o Google.',
    acao: 'Quero participar da seleção',
    dica: 'Role para entrar',
    vertical: 'CAETÉ',
    capitulos: ['O projeto', 'Como funciona', 'As 10 vagas', 'A seleção'],
  },

  numeros: [
    { valor: 10, sufixo: '', rotulo: 'empresas escolhidas' },
    { valor: 17, sufixo: '', rotulo: 'cidades da região' },
    { valor: 17, sufixo: ' anos', rotulo: 'de mercado' },
    { valor: 0, sufixo: '', rotulo: 'reais de agência', prefixo: 'R$ ' },
  ],

  projeto: {
    numero: '01',
    rotulo: 'O projeto',
    titulo: ['A gente cuida.', 'Sua empresa vende.'],
    texto: [
      'A unidade de Bragança da Psy Comunic está chegando, e quer chegar com resultado na mão. Por isso, em vez de começar vendendo pacote, a agência vai escolher 10 empresas da região e trabalhar para elas vender mais, sem cobrar pelo serviço.',
      'A equipe monta as campanhas, escreve os anúncios, escolhe o público da sua cidade, acompanha todo dia e ajusta o que não estiver trazendo cliente. Você cuida de atender quem chega.',
    ],
  },

  plataformas: {
    numero: '02',
    rotulo: 'Como funciona',
    titulo: ['O único investimento', 'é o anúncio.'],
    texto:
      'O dinheiro do anúncio vai direto para a plataforma, na conta da sua empresa, no seu nome. A Psy Comunic não toca nele e não cobra nada por cima.',
    cartoes: [
      {
        logo: 'meta',
        nome: 'Instagram e Facebook',
        apoio: 'Anúncios na Meta',
        texto:
          'Seu anúncio aparece para quem mora em Bragança e nas cidades vizinhas, rolando o feed e os stories. Quem se interessa chama você no WhatsApp.',
      },
      {
        logo: 'google',
        nome: 'Pesquisa no Google',
        apoio: 'Anúncios no Google',
        texto:
          'Quando alguém da região procura o que você vende, a sua empresa aparece primeiro. É o cliente que já está com vontade de comprar.',
      },
    ],
    garantias: [
      'A conta de anúncio fica no nome da sua empresa',
      'Você vê quanto gastou direto na plataforma',
      'Nenhuma taxa de agência, nenhum contrato longo',
    ],
  },

  entregas: {
    numero: '03',
    rotulo: 'O que a Psy faz',
    titulo: ['Tudo o que fica', 'entre o anúncio', 'e a venda.'],
    itens: [
      { nome: 'Estratégia da conta', apoio: 'Plano', texto: 'O que anunciar primeiro, para quem e em quais cidades.' },
      { nome: 'Criação dos anúncios', apoio: 'Criativos', texto: 'Texto e arte de cada anúncio, feitos pela equipe de design.' },
      { nome: 'Público da região', apoio: 'Segmentação', texto: 'Bragança e as cidades que fazem sentido para o seu negócio.' },
      { nome: 'Acompanhamento diário', apoio: 'Gestão', texto: 'O que não traz cliente sai, o que traz recebe mais.' },
      { nome: 'Conversa sobre vendas', apoio: 'Retorno', texto: 'Um contato por mês para ver o que entrou no caixa e o próximo passo.' },
    ],
  },

  vagas: {
    numero: '04',
    rotulo: 'As 10 vagas',
    titulo: ['São 10 portas.', 'Uma delas pode', 'ser a sua.'],
    texto:
      'Cada loja que acende é uma empresa da região escolhida para o projeto. A equipe acompanha de perto um número limitado de empresas, por isso a seleção: entra quem tem estrutura para atender os clientes que os anúncios vão trazer.',
    contador: 'vagas abertas',
  },

  paraQuem: {
    numero: '05',
    rotulo: 'Para quem é',
    titulo: ['Feito para quem', 'quer crescer de verdade.'],
    sim: [
      'Tem empresa aberta em Bragança ou numa das cidades da região',
      'Consegue responder rápido quem chama no WhatsApp',
      'Tem estrutura para atender mais clientes do que atende hoje',
      'Pode investir no anúncio todo mês, direto na plataforma',
    ],
    nao: [
      'Quer resultado sem atender quem chega',
      'Não tem como investir no anúncio agora',
      'Está procurando só alguém para postar no Instagram',
    ],
  },

  passos: {
    numero: '06',
    rotulo: 'A seleção',
    titulo: ['Três passos.', 'Poucos minutos.'],
    itens: [
      { nome: 'Você responde o formulário', apoio: 'Inscrição', texto: 'Perguntas rápidas sobre a sua empresa, uma de cada vez.', tempo: '3 min' },
      { nome: 'A equipe analisa', apoio: 'Análise', texto: 'Cada inscrição é lida por uma pessoa, não por robô.', tempo: '48 h' },
      { nome: 'Você recebe a resposta', apoio: 'Resultado', texto: 'Se a empresa for escolhida, a equipe chama no WhatsApp para começar.', tempo: 'WhatsApp' },
    ],
  },

  autoridade: {
    rotulo: 'Quem está por trás',
    texto:
      'A Psy Comunic tem 17 anos de mercado em design, tecnologia e anúncios, com clientes em todo o Brasil. É Google Partner e Meta Business Partner.',
    trabalhos: ['Torres Contabilidade', 'Grupo Diságua', 'Medi Marketing'],
  },

  perguntas: [
    {
      p: 'Qual é o custo para a minha empresa?',
      r: 'O serviço da agência não é cobrado. O único investimento é o valor do anúncio, pago direto para a Meta ou o Google, na conta da sua empresa. O valor sugerido aparece no formulário de inscrição.',
    },
    {
      p: 'Por que a Psy Comunic faria isso sem cobrar?',
      r: 'A unidade de Bragança é nova. Em vez de pedir confiança, a agência prefere mostrar resultado em empresas da própria região. As empresas escolhidas viram os primeiros cases da unidade.',
    },
    {
      p: 'Preciso ter site?',
      r: 'Não. Os anúncios podem levar o cliente direto para o seu WhatsApp ou para o seu Instagram.',
    },
    {
      p: 'Quem atende os clientes que chegarem?',
      r: 'Você e a sua equipe. A Psy Comunic traz o cliente até a conversa. Responder rápido é o que transforma a conversa em venda, e é por isso que essa pergunta está no formulário.',
    },
    {
      p: 'Atendem a minha cidade?',
      r: 'Bragança, Tracuateua, Augusto Corrêa, Capanema, Primavera, Quatipuru, Santa Luzia do Pará, Peixe-Boi, Bonito, Nova Timboteua, Salinópolis, São João de Pirabas, Santarém Novo, Ourém, Capitão Poço, Viseu e Cachoeira do Piriá.',
    },
    {
      p: 'Se eu não for escolhido?',
      r: 'A equipe avisa do mesmo jeito. Se fizer sentido, a Psy Comunic apresenta outro caminho para a sua empresa, sem compromisso.',
    },
  ],

  final: {
    titulo: ['Ainda tem', 'cadeira vazia.'],
    texto: 'A seleção fecha quando as 10 vagas forem preenchidas.',
    acao: 'Fazer minha inscrição',
  },
};

/* ================================================================
   O FORMULÁRIO DE SELEÇÃO
   ================================================================
   Uma pergunta por tela, no estilo Typeform. Cada opção carrega
   `pontos`: a soma vira a nota do lead no CRM, para a equipe ordenar
   as inscrições sem ler todas do zero. A nota não aparece para quem
   preenche.

   A verba é a ÚNICA tela em que o valor aparece. */

export type Opcao = { valor: string; rotulo: string; pontos: number };

export type Pergunta =
  | { id: string; tipo: 'texto'; titulo: string; apoio?: string; placeholder: string; obrigatoria: boolean; min?: number }
  | { id: string; tipo: 'longo'; titulo: string; apoio?: string; placeholder: string; obrigatoria: boolean }
  | { id: string; tipo: 'telefone'; titulo: string; apoio?: string; placeholder: string; obrigatoria: true }
  | { id: string; tipo: 'email'; titulo: string; apoio?: string; placeholder: string; obrigatoria: true }
  | { id: string; tipo: 'escolha'; titulo: string; apoio?: string; opcoes: Opcao[]; obrigatoria: true }
  | { id: string; tipo: 'multipla'; titulo: string; apoio?: string; opcoes: Opcao[]; obrigatoria: true };

export const CIDADES = [
  'Bragança', 'Tracuateua', 'Augusto Corrêa', 'Capanema', 'Primavera', 'Quatipuru',
  'Santa Luzia do Pará', 'Peixe-Boi', 'Bonito', 'Nova Timboteua', 'Salinópolis',
  'São João de Pirabas', 'Santarém Novo', 'Ourém', 'Capitão Poço', 'Viseu',
  'Cachoeira do Piriá',
];

export const perguntas: Pergunta[] = [
  { id: 'nome', tipo: 'texto', titulo: 'Para começar, qual é o seu nome?', placeholder: 'Seu nome', obrigatoria: true, min: 2 },
  { id: 'empresa', tipo: 'texto', titulo: 'Qual é o nome da sua empresa?', placeholder: 'Nome da empresa', obrigatoria: true, min: 2 },
  { id: 'instagram', tipo: 'texto', titulo: 'A empresa tem Instagram?', apoio: 'Se tiver, escreva o @. Se não tiver, pode pular.', placeholder: '@suaempresa', obrigatoria: false },
  {
    id: 'segmento', tipo: 'escolha', titulo: 'Em qual área a sua empresa trabalha?', obrigatoria: true,
    opcoes: [
      { valor: 'comercio', rotulo: 'Comércio e lojas', pontos: 6 },
      { valor: 'saude', rotulo: 'Saúde, clínica ou estética', pontos: 6 },
      { valor: 'alimentacao', rotulo: 'Alimentação e delivery', pontos: 6 },
      { valor: 'turismo', rotulo: 'Turismo, pousada ou passeio', pontos: 6 },
      { valor: 'servicos', rotulo: 'Serviços (oficina, construção, assistência)', pontos: 6 },
      { valor: 'escritorio', rotulo: 'Escritório (contabilidade, advocacia, imóveis)', pontos: 6 },
      { valor: 'outro', rotulo: 'Outra área', pontos: 3 },
    ],
  },
  {
    id: 'cidade', tipo: 'escolha', titulo: 'Em qual cidade fica a empresa?', obrigatoria: true,
    opcoes: [
      ...CIDADES.map((c) => ({ valor: c, rotulo: c, pontos: c === 'Bragança' ? 6 : 4 })),
      { valor: 'outra', rotulo: 'Outra cidade', pontos: 0 },
    ],
  },
  {
    id: 'tempo', tipo: 'escolha', titulo: 'Há quanto tempo a empresa está aberta?', obrigatoria: true,
    opcoes: [
      { valor: 'menos-1', rotulo: 'Menos de 1 ano', pontos: 3 },
      { valor: '1-3', rotulo: 'De 1 a 3 anos', pontos: 6 },
      { valor: '3-10', rotulo: 'De 3 a 10 anos', pontos: 8 },
      { valor: 'mais-10', rotulo: 'Mais de 10 anos', pontos: 8 },
    ],
  },
  {
    id: 'faturamento', tipo: 'escolha', titulo: 'Quanto a empresa fatura por mês, mais ou menos?', apoio: 'Fica só com a equipe. Serve para entender o tamanho do negócio.', obrigatoria: true,
    opcoes: [
      { valor: 'ate-10', rotulo: 'Até R$ 10 mil', pontos: 2 },
      { valor: '10-30', rotulo: 'De R$ 10 mil a R$ 30 mil', pontos: 6 },
      { valor: '30-100', rotulo: 'De R$ 30 mil a R$ 100 mil', pontos: 10 },
      { valor: 'mais-100', rotulo: 'Mais de R$ 100 mil', pontos: 12 },
      { valor: 'prefiro-nao', rotulo: 'Prefiro não dizer', pontos: 4 },
    ],
  },
  {
    id: 'origem', tipo: 'multipla', titulo: 'Hoje, de onde vêm os seus clientes?', apoio: 'Pode marcar mais de uma.', obrigatoria: true,
    opcoes: [
      { valor: 'indicacao', rotulo: 'Indicação, boca a boca', pontos: 0 },
      { valor: 'passa-na-frente', rotulo: 'Quem passa na frente', pontos: 0 },
      { valor: 'instagram', rotulo: 'Instagram', pontos: 1 },
      { valor: 'google', rotulo: 'Google ou Maps', pontos: 1 },
      { valor: 'anuncios', rotulo: 'Anúncios pagos', pontos: 1 },
      { valor: 'whatsapp', rotulo: 'Lista de WhatsApp', pontos: 0 },
    ],
  },
  {
    id: 'anuncios', tipo: 'escolha', titulo: 'A empresa já anunciou na internet?', obrigatoria: true,
    opcoes: [
      { valor: 'nunca', rotulo: 'Nunca anunciou', pontos: 5 },
      { valor: 'impulsionou', rotulo: 'Só impulsionou post', pontos: 6 },
      { valor: 'agencia', rotulo: 'Já teve agência ou gestor', pontos: 6 },
      { valor: 'anuncia-hoje', rotulo: 'Anuncia hoje', pontos: 5 },
    ],
  },
  {
    id: 'atendimento', tipo: 'escolha', titulo: 'Quando um cliente chama no WhatsApp, em quanto tempo alguém responde?', obrigatoria: true,
    opcoes: [
      { valor: 'minutos', rotulo: 'Em poucos minutos', pontos: 14 },
      { valor: '1-hora', rotulo: 'Em até 1 hora', pontos: 10 },
      { valor: 'mesmo-dia', rotulo: 'No mesmo dia', pontos: 5 },
      { valor: 'demora', rotulo: 'Às vezes demora mais de um dia', pontos: 0 },
    ],
  },
  {
    id: 'capacidade', tipo: 'escolha', titulo: 'Se chegarem 30 clientes novos por mês, a empresa consegue atender?', obrigatoria: true,
    opcoes: [
      { valor: 'sim', rotulo: 'Sim, com folga', pontos: 12 },
      { valor: 'ajustando', rotulo: 'Sim, com alguns ajustes', pontos: 8 },
      { valor: 'nao', rotulo: 'Hoje não conseguiria', pontos: 0 },
    ],
  },
  {
    id: 'verba', tipo: 'escolha',
    titulo: 'A Psy Comunic não cobra nada pelo serviço. O único investimento é o anúncio, pago direto para a Meta ou o Google: entre R$ 35 e R$ 50 por dia.',
    apoio: 'Isso dá de R$ 1.050 a R$ 1.500 por mês, na conta da sua empresa. Você tem esse valor disponível para investir?',
    obrigatoria: true,
    opcoes: [
      { valor: 'sim', rotulo: 'Sim, tenho disponível', pontos: 20 },
      { valor: 'proximo-mes', rotulo: 'Sim, a partir do mês que vem', pontos: 12 },
      { valor: 'parte', rotulo: 'Só uma parte desse valor', pontos: 3 },
      { valor: 'nao', rotulo: 'Não tenho agora', pontos: 0 },
    ],
  },
  {
    id: 'case', tipo: 'escolha', titulo: 'Se der certo, a Psy Comunic pode mostrar os resultados da sua empresa como case?', obrigatoria: true,
    opcoes: [
      { valor: 'sim', rotulo: 'Pode, com certeza', pontos: 8 },
      { valor: 'conversar', rotulo: 'Prefiro conversar antes', pontos: 4 },
      { valor: 'nao', rotulo: 'Prefiro que não', pontos: 0 },
    ],
  },
  { id: 'motivo', tipo: 'longo', titulo: 'Por que a sua empresa merece uma das 10 vagas?', apoio: 'Conte em poucas linhas. É o que a equipe lê primeiro.', placeholder: 'Escreva aqui', obrigatoria: true },
  { id: 'telefone', tipo: 'telefone', titulo: 'Qual é o seu WhatsApp?', apoio: 'É por ele que a equipe dá a resposta.', placeholder: '(91) 99999-9999', obrigatoria: true },
  /* O e-mail entra por último e é obrigatório, porque é por ele que sai
     a confirmação de que a inscrição chegou. Opcional, metade não
     preencheria, e metade das inscrições ficaria sem confirmação
     nenhuma: a pessoa clica em enviar, vê a tela de obrigado e passa a
     semana sem nada escrito em lugar nenhum. */
  { id: 'email', tipo: 'email', titulo: 'Por último: qual é o seu e-mail?', apoio: 'A confirmação da inscrição chega nele na hora.', placeholder: 'voce@suaempresa.com.br', obrigatoria: true },
];

/** Nota máxima possível, para a nota sair em porcentagem. */
export const NOTA_MAXIMA = perguntas.reduce((soma, p) => {
  if (p.tipo === 'escolha') return soma + Math.max(...p.opcoes.map((o) => o.pontos));
  if (p.tipo === 'multipla') return soma + p.opcoes.reduce((s, o) => s + o.pontos, 0);
  return soma;
}, 0);
