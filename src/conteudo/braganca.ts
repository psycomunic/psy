/**
 * A unidade de Bragança, no Pará.
 *
 * ============================================================
 * ESTE ARQUIVO É UM MOLDE, E NÃO UMA PÁGINA
 * ============================================================
 * O tipo `Unidade` é o contrato. Capanema e Salinópolis vão ser um
 * arquivo novo cada, exportando o mesmo formato, e a rota reaproveita
 * os componentes inteiros. Nada de texto de cidade dentro de JSX.
 *
 * Por isso tudo o que muda de cidade para cidade está aqui: número de
 * WhatsApp, cidades atendidas, exemplos de negócio, perguntas.
 *
 * ============================================================
 * OUTRO PÚBLICO, OUTRO VOCABULÁRIO
 * ============================================================
 * O resto do site fala com dono de e-commerce e usa "operação",
 * "frentes", "performance". Aqui não. Quem lê tem uma loja de material
 * de construção, uma clínica, uma pousada em Ajuruteua. Ele sabe que
 * precisa de cliente, e não sabe (nem precisa saber) o que é ROAS.
 *
 * A regra prática: o benefício vem no título, o termo técnico vem
 * depois e entre parênteses, quando vier. "Anúncios no Instagram" no
 * título; "tráfego pago" só no apoio, para quem já ouviu falar.
 *
 * ============================================================
 * O QUE NÃO ENTRA
 * ============================================================
 * Endereço de rua: o escritório ainda não abriu, e endereço inventado
 * em dado estruturado é sinal de desconfiança para o Google. Só a
 * cidade.
 *
 * Número de resultado, depoimento e nome de cliente da região: não
 * existem ainda. A regra de compliance do projeto vale igual aqui.
 */

export type ServicoLocal = {
  id: string;
  /** Título no vocabulário do cliente, sem termo técnico. */
  nome: string;
  /** O termo que o mercado usa. Aparece como apoio, nunca no h2. */
  tecnico: string;
  paraQuem: string;
  /** Duas ou três frases: o que é, para quem serve, o que a pessoa recebe. */
  texto: string;
  entrega: string[];
  /**
   * A imagem que mostra o entregavel: o anuncio no feed, o resultado no
   * Google, a tela do site, o perfil no Maps.
   *
   * Opcional. Sem ela o bloco fica como era, em largura inteira, e nao
   * abre moldura vazia esperando arquivo.
   *
   * Formato: 4:3, algo como 1200x900. A caixa recorta pelo centro e
   * ancora no topo, entao o que importa deve estar na metade de cima.
   */
  imagem?: { arquivo: string; alt: string };
  /** Texto do botão, sempre no benefício. */
  acao: string;
  /** Mensagem que abre no WhatsApp a partir deste bloco. */
  mensagem: string;
};

export type Unidade = {
  /** Usado na rota, no canonical e no @id do JSON-LD. */
  slug: string;
  cidade: string;
  estado: string;
  /** Só dígitos, formato do wa.me. */
  whatsapp: string;
  /** Formato E.164, para o JSON-LD. */
  telefoneEstruturado: string;
  /** Como o número aparece escrito na tela. */
  telefoneVisivel: string;
  meta: { titulo: string; descricao: string };
  heroi: {
    rotulo: string;
    titulo: string;
    destaque: string;
    sub: string;
    acao: string;
    mensagem: string;
    acaoSecundaria: string;
  };
  problemas: { titulo: string; texto: string }[];
  servicos: ServicoLocal[];
  passos: { n: string; titulo: string; texto: string }[];
  paraQuem: { grupo: string; exemplos: string }[];
  cidades: string[];
  /** Frase que apresenta as cidades em texto corrido. */
  cidadesTexto: string;
  /**
   * O convite que abre no fim da cena da abertura.
   *
   * `video` e opcional de proposito. Hoje o popup abre so com texto e o
   * botao de WhatsApp, que ja e um convite completo. No dia em que o
   * arquivo existir, basta apontar `video` para ele em /public/video e
   * o player entra no mesmo lugar, sem mexer em componente.
   */
  apresentacao: {
    video?: string;
    poster?: string;
    titulo: string;
    texto: string;
    /** Os pontos que o convite promete cobrir. Viram lista sem o video. */
    topicos: string[];
    acao: string;
    mensagem: string;
  };
  perguntas: { pergunta: string; resposta: string }[];
  fechamento: { titulo: string; texto: string; acao: string; mensagem: string };
};

export const braganca: Unidade = {
  slug: 'braganca-pa',
  cidade: 'Bragança',
  estado: 'PA',

  whatsapp: '5591989110478',
  telefoneEstruturado: '+55-91-98911-0478',
  telefoneVisivel: '(91) 98911-0478',

  meta: {
    /* 33 caracteres. O layout acrescenta " · Psy Comunic" e fecha em 47,
       dentro dos 60 que o Google mostra. */
    titulo: 'Marketing digital em Bragança, PA',
    /* 130 caracteres. */
    descricao:
      'Anúncios no Instagram, no Google e criação de sites para empresas de Bragança e região. Peça sua análise gratuita pelo WhatsApp.',
  },

  heroi: {
    rotulo: 'Unidade Bragança, PA',
    titulo: 'Marketing digital em Bragança, PA, para sua empresa ter',
    destaque: 'mais clientes.',
    sub: 'A Psy Comunic coloca sua empresa na frente de quem mora aqui e está procurando o que você vende.',
    acao: 'Quero minha análise gratuita',
    mensagem: 'Olá! Vi a página de Bragança e quero mais clientes para minha empresa.',
    acaoSecundaria: 'Ver o que a gente faz',
  },

  problemas: [
    {
      titulo: 'Cliente novo só chega por indicação',
      texto:
        'Quando o movimento cai, não há o que fazer além de esperar. Quem só vende por indicação não escolhe quantos clientes quer no mês.',
    },
    {
      titulo: 'O Instagram está parado há meses',
      texto:
        'A pessoa ouve falar da sua empresa, procura o perfil e encontra a última publicação de julho do ano passado. Ela conclui o que qualquer um concluiria.',
    },
    {
      titulo: 'Sua empresa não aparece quando procuram no Google',
      texto:
        'Alguém em Bragança digita o que você vende e acha o concorrente. Não é que ele seja melhor: é que ele está cadastrado e você não.',
    },
    {
      titulo: 'Você já impulsionou post e não veio nada',
      texto:
        'O botão de impulsionar mostra o post para quem o Instagram quiser. Sem dizer quem deve ver, onde mora e o que deve fazer depois, o dinheiro vira curtida.',
    },
  ],

  servicos: [
    {
      id: 'instagram',
      nome: 'Anúncios no Instagram e no Facebook',
      tecnico: 'tráfego pago no Meta Ads',
      paraQuem: 'Para quem precisa de gente chamando no WhatsApp toda semana',
      texto:
        'A gente monta e cuida dos anúncios que aparecem para quem mora em Bragança e nas cidades da região. O anúncio leva a pessoa direto para a sua conversa no WhatsApp, e não para um perfil que ela vai esquecer.',
      entrega: [
        'Anúncio no ar mostrando para quem mora na sua área de atendimento',
        'Conversa caindo no seu WhatsApp, com a pessoa já sabendo o que você vende',
        'Criação das artes e dos textos do anúncio',
        'Acompanhamento e ajuste do que está funcionando',
      ],
      acao: 'Quero anunciar no Instagram',
      mensagem: 'Olá! Quero anunciar no Instagram e no Facebook para minha empresa em Bragança.',
    },
    {
      id: 'google',
      nome: 'Anúncios no Google',
      tecnico: 'Google Ads',
      paraQuem: 'Para quem vende o que as pessoas procuram na hora da necessidade',
      texto:
        'Tem coisa que ninguém compra por ver anúncio no feed: procura na hora que precisa. Conserto, advogado, material de construção, dentista. A gente coloca sua empresa nas primeiras posições de quem digita isso aqui na região.',
      entrega: [
        'Sua empresa aparecendo para quem está procurando naquele momento',
        'Anúncio limitado à sua região, sem gastar com clique de outro estado',
        'Escolha das palavras que trazem cliente, e corte das que só gastam',
        'Relatório simples do que entrou no mês',
      ],
      acao: 'Quero aparecer no Google',
      mensagem: 'Olá! Quero anunciar no Google para minha empresa em Bragança.',
    },
    {
      id: 'sites',
      nome: 'Criação de sites profissionais',
      tecnico: 'desenvolvimento e SEO',
      paraQuem: 'Para quem manda o cliente para um perfil e queria mandar para algo sério',
      texto:
        'Um site que abre rápido no celular, explica o que você faz e termina no seu WhatsApp. É ele que responde quando a pessoa procura seu nome antes de fechar, e é dele que saem os anúncios que precisam de uma página para chegar.',
      entrega: [
        'Site feito para celular primeiro, que é de onde vem quase todo acesso',
        'Uma página por serviço, para cada um poder ser anunciado separado',
        'Botão de WhatsApp em toda a página',
        'Publicação, domínio e o básico para o Google encontrar',
      ],
      /* Exemplo real, e nao ilustracao: e um site que saiu daqui e que
         ja esta no portfolio do proprio site. Os outros tres blocos
         esperam arquivo. */
      imagem: {
        arquivo: 'sites/torres-contabilidade.jpg',
        alt: 'Site da Torres Contabilidade, criado pela Psy Comunic, aberto no topo da página inicial',
      },
      acao: 'Quero um site para minha empresa',
      mensagem: 'Olá! Quero saber sobre criação de site para minha empresa em Bragança.',
    },
    {
      id: 'google-meu-negocio',
      nome: 'Google Meu Negócio',
      tecnico: 'perfil da empresa no Google e no Maps',
      paraQuem: 'Para quem quer começar pelo mais barato e mais rápido',
      texto:
        'É o cadastro que faz sua empresa aparecer no Google e no Maps com telefone, horário, fotos e avaliações. Não custa mídia e costuma ser a primeira coisa que traz ligação. Por isso é por aqui que a gente prefere começar com quem nunca anunciou.',
      entrega: [
        'Perfil criado ou arrumado, com horário, telefone e serviços certos',
        'Sua empresa no mapa, com o caminho até a porta',
        'Fotos organizadas e categoria escolhida direito',
        'Orientação de como pedir avaliação para quem já é cliente',
      ],
      acao: 'Quero a análise gratuita do meu perfil',
      mensagem: 'Olá! Quero a análise gratuita do meu perfil no Google.',
    },
  ],

  passos: [
    {
      n: '01',
      titulo: 'Você chama no WhatsApp',
      texto:
        'Conta o que sua empresa faz e o que está te incomodando hoje. Sem formulário longo e sem compromisso.',
    },
    {
      n: '02',
      titulo: 'A gente olha e devolve a análise',
      texto:
        'Olhamos como sua empresa aparece hoje no Google e no Instagram, e mandamos o que encontramos. Essa parte é gratuita.',
    },
    {
      n: '03',
      titulo: 'Você recebe a proposta',
      texto:
        'Com o que dá para fazer, em que ordem e quanto custa. Se fizer sentido, começa. Se não fizer, a análise fica com você.',
    },
  ],

  paraQuem: [
    { grupo: 'Comércio', exemplos: 'Lojas, materiais de construção, móveis, autopeças e supermercados' },
    { grupo: 'Saúde', exemplos: 'Clínicas, consultórios, dentistas, laboratórios e academias' },
    { grupo: 'Alimentação', exemplos: 'Restaurantes, lanchonetes, açaí, padarias e distribuidoras' },
    { grupo: 'Turismo', exemplos: 'Pousadas e negócios de praia em Ajuruteua, passeios e aluguel de temporada' },
    { grupo: 'Serviços', exemplos: 'Oficinas, assistência técnica, construção, limpeza e transporte' },
    { grupo: 'Escritórios', exemplos: 'Contabilidade, advocacia, engenharia, arquitetura e corretagem' },
  ],

  cidades: [
    'Bragança', 'Tracuateua', 'Augusto Corrêa', 'Capanema', 'Primavera',
    'Quatipuru', 'Santa Luzia do Pará', 'Peixe-Boi', 'Bonito',
    'Nova Timboteua', 'Salinópolis', 'São João de Pirabas', 'Santarém Novo',
    'Ourém', 'Capitão Poço', 'Viseu', 'Cachoeira do Piriá',
  ],

  cidadesTexto:
    'O atendimento sai de Bragança e alcança toda a região. Se a sua empresa fica em Tracuateua, Augusto Corrêa, Capanema, Primavera, Quatipuru ou Santa Luzia do Pará, atendemos. O mesmo vale para Peixe-Boi, Bonito, Nova Timboteua, Salinópolis, São João de Pirabas, Santarém Novo, Ourém, Capitão Poço, Viseu e Cachoeira do Piriá. A conversa acontece por WhatsApp e por chamada de vídeo, que é como a maior parte dos clientes prefere.',

  apresentacao: {
    /* AQUI entra o vídeo: aponte para o arquivo em /public/video e o
       player aparece no lugar da lista, sem mexer em componente. */
    poster: '/imagens/braganca-pa-frame-b.jpg',
    titulo: 'Tudo o que a Psy Comunic faz aqui na região',
    texto:
      'Você chegou ao fim da apresentação. Em uma conversa de WhatsApp a gente olha como sua empresa aparece hoje e diz o que dá para melhorar primeiro.',
    topicos: [
      'Anúncios no Instagram e no Facebook para quem mora na sua área',
      'Anúncios no Google para quem procura na hora que precisa',
      'Criação de site que termina no seu WhatsApp',
      'Perfil da empresa no Google e no Maps, que é por onde vale começar',
    ],
    acao: 'Quero minha análise gratuita',
    mensagem: 'Olá! Vi a apresentação da unidade de Bragança e quero a análise gratuita.',
  },

  perguntas: [
    {
      pergunta: 'Quanto custa anunciar no Instagram ou no Google?',
      resposta:
        'São dois valores separados. Um é a verba que vai para o Google ou para a Meta, que é sua e você define quanto quer investir por mês. O outro é o valor do nosso serviço, que depende do que a sua empresa precisa. Na análise gratuita a gente indica um ponto de partida que faça sentido para o seu caso, e você decide.',
    },
    {
      pergunta: 'Preciso ter site para poder anunciar?',
      resposta:
        'Não. Dá para anunciar levando a pessoa direto para o seu WhatsApp, e é assim que a maioria começa aqui. O site ajuda quando você vende algo que precisa ser explicado antes, ou quando quer aparecer no Google sem pagar por clique.',
    },
    {
      pergunta: 'Em quanto tempo eu vejo resultado?',
      resposta:
        'As primeiras conversas costumam chegar nos primeiros dias depois que o anúncio entra no ar. Ajustar o anúncio até ele ficar bom leva algumas semanas, porque é preciso ver o que funciona com o seu público. Quem prometer número exato antes de começar está chutando.',
    },
    {
      pergunta: 'Vocês atendem presencialmente em Bragança?',
      resposta:
        'O escritório ainda está sendo montado, então hoje o atendimento é por WhatsApp e por chamada de vídeo. Na prática isso não atrapalha: tudo o que a gente faz é acompanhado à distância mesmo, e você fala com quem mexe na sua conta.',
    },
    {
      pergunta: 'Eu já impulsiono pelo Instagram. Qual a diferença?',
      resposta:
        'O botão de impulsionar mostra o post para uma audiência ampla e devolve curtida. O anúncio feito no gerenciador escolhe quem vê, em que cidade, com que idade e o que a pessoa faz depois de clicar, que é o que transforma dinheiro em conversa no WhatsApp.',
    },
    {
      pergunta: 'Vocês atendem minha cidade?',
      resposta:
        'Atendemos Bragança e as cidades da região, incluindo Tracuateua, Augusto Corrêa, Capanema, Salinópolis, Viseu, Capitão Poço e Ourém. A lista completa está logo acima. Se a sua cidade não estiver lá, mande mensagem que a gente confirma.',
    },
    {
      pergunta: 'Preciso assinar contrato longo?',
      resposta:
        'Não. O combinado é mensal, com aviso de 30 dias dos dois lados. As contas de anúncio ficam no nome da sua empresa, e os dados são seus. Se um dia você quiser sair, leva tudo.',
    },
  ],

  fechamento: {
    titulo: 'Vamos ver como sua empresa está aparecendo hoje.',
    texto:
      'A análise da sua presença no Google e no Instagram é gratuita e sai em poucos dias. Você recebe o que encontramos mesmo que decida não contratar nada.',
    acao: 'Falar no WhatsApp agora',
    mensagem: 'Olá! Quero a análise gratuita da minha empresa em Bragança.',
  },
};

/** Monta o link do WhatsApp da unidade com a mensagem da seção. */
export const linkDaUnidade = (u: Unidade, mensagem: string) =>
  `https://wa.me/${u.whatsapp}?text=${encodeURIComponent(mensagem)}`;
