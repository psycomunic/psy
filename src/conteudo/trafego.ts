/**
 * A página de venda de tráfego pago.
 *
 * ============================================================
 * PARA QUEM ELA FALA
 * ============================================================
 * Empresa que JÁ anuncia e não sabe o que voltou. Não é a empresa que
 * nunca anunciou: essa precisa de outro texto, mais didático, e
 * atender as duas ao mesmo tempo deixa a mensagem morna para as duas.
 *
 * A dor concreta: verba saindo todo mês, relatório que fala de alcance
 * e impressão, e ninguém respondendo "entrou quanto".
 *
 * ============================================================
 * A REGRA QUE VALE PARA TODO O SITE
 * ============================================================
 * Nenhum número de resultado entra aqui sem autorização escrita do
 * cliente e sem período declarado (`prova.ts`). Por isso não há
 * "aumentamos 340% o faturamento" em lugar nenhum desta página. O que
 * convence sem inventar é o MÉTODO e o que dá para verificar: as marcas
 * atendidas, o painel que o cliente abre, e o que a agência se
 * compromete a mostrar.
 *
 * Preço também não entra. Site público não carrega valor, e o número
 * sai na proposta.
 */

export const heroi = {
  rotulo: 'Tráfego pago de alta performance',
  titulo: 'Sua empresa investe em anúncio todo mês. Sabe dizer quanto voltou?',
  texto:
    'A maior parte das empresas que chega até a Psy Comunic já anuncia. O problema quase nunca é falta de verba: é não saber qual campanha traz cliente, qual só gasta, e ninguém conseguir responder isso sem abrir uma planilha.',
  acao: 'Quero uma análise da minha conta',
  apoio: 'Sem custo e sem compromisso. Em 48 horas você recebe o que encontramos.',
};

/**
 * O diagnóstico da dor, em três sintomas reconhecíveis.
 *
 * Cada um é uma frase que a pessoa já disse em voz alta. Reconhecer a
 * própria situação escrita por outra pessoa é o que faz ler o resto.
 */
export const sintomas = [
  {
    titulo: 'O relatório fala de alcance, não de venda',
    texto:
      'Impressões, cliques, engajamento. Números que sobem e descem sem ninguém explicar o que fazer com eles, e que nunca chegam em quanto entrou no caixa.',
  },
  {
    titulo: 'Ninguém sabe qual campanha está pagando a conta',
    texto:
      'A verba está distribuída entre Google, Meta e o que mais apareceu. Se alguém perguntar qual delas trouxe os últimos dez clientes, a resposta é um palpite.',
  },
  {
    titulo: 'A conta continua rodando no piloto automático',
    texto:
      'Campanha subiu há oito meses e ninguém mexeu desde então. O que funcionava no lançamento continua consumindo verba muito depois de parar de funcionar.',
  },
];

/**
 * O método. É o que substitui o número inventado.
 *
 * Quatro etapas nomeadas, na ordem em que acontecem, cada uma dizendo o
 * que sai dela. Promessa vaga qualquer agência faz; sequência com
 * entrega em cada passo é verificável.
 */
export const metodo = [
  {
    n: '01',
    titulo: 'Antes de anunciar, medir',
    texto:
      'Conferimos se o que a sua conta registra hoje é verdade. Pixel duplicado, conversão contando o mesmo lead três vezes, formulário que não dispara evento nenhum: tudo isso é comum, e enquanto existe, qualquer decisão em cima do número está errada.',
    entrega: 'Rastreamento conferido e corrigido, com o que estava quebrado listado',
  },
  {
    n: '02',
    titulo: 'Estrutura que separa o que funciona',
    texto:
      'Campanha montada para responder perguntas, e não só para gastar: por canal, por oferta, por público. Quando a estrutura mistura tudo, o resultado bom e o ruim se anulam na média e ninguém descobre qual era qual.',
    entrega: 'Conta reestruturada, com cada campanha respondendo por uma hipótese',
  },
  {
    n: '03',
    titulo: 'Criativo que é testado, não escolhido no gosto',
    texto:
      'A peça que converte raramente é a que a equipe achou mais bonita. Rodam variações em paralelo, e a decisão de manter ou matar vem do número, não da reunião.',
    entrega: 'Rodadas de criativo com o vencedor identificado e o motivo registrado',
  },
  {
    n: '04',
    titulo: 'Ajuste toda semana, com a mão dentro da conta',
    texto:
      'Verba migra para o que está performando, o que travou é pausado, e o que mudou fica escrito. Conta de anúncio não é projeto que se entrega: é operação que se acompanha.',
    entrega: 'Ajustes semanais e um registro do que foi mudado, e por quê',
  },
];

/**
 * O diferencial que dá para conferir: o painel existe de verdade.
 *
 * Não é promessa de transparência. É uma tela que o cliente abre com
 * login próprio e vê o mesmo número que a agência vê.
 */
export const painel = {
  titulo: 'Você acompanha os números, não espera o relatório',
  texto:
    'Todo cliente da Psy Comunic recebe acesso a um painel próprio. Receita, investimento, retorno por canal e o histórico do que foi feito na conta, atualizados sozinhos. Não é um PDF que chega dia 5 falando do mês passado.',
  itens: [
    'Quanto entrou e quanto saiu, lado a lado, sem misturar a verba com o valor da agência',
    'Retorno por canal, para saber onde vale colocar o próximo real',
    'Diário do que foi mexido na conta, com data',
    'O mesmo número que a equipe usa para decidir. Não existe versão para o cliente',
  ],
};

/**
 * Social media entra como APOIO, e a página diz isso.
 *
 * Fingir que as duas frentes têm o mesmo peso confundiria quem chegou
 * procurando tráfego. E vender social media como se fosse o carro-chefe
 * seria vender a coisa errada para este público.
 */
export const social = {
  titulo: 'E o social media, onde entra',
  texto:
    'O anúncio leva a pessoa para um perfil e para um site. Se os dois estiverem abandonados, parte da verba paga a visita de alguém que desiste ali. Por isso a Psy Comunic também cuida do conteúdo, mas como sustentação do tráfego, e não como serviço solto.',
  itens: [
    {
      titulo: 'Criativo para anúncio',
      texto:
        'As peças que rodam na campanha, em variações feitas para serem testadas uma contra a outra.',
    },
    {
      titulo: 'Conteúdo do dia a dia',
      texto:
        'O perfil que a pessoa visita depois de clicar. Os vídeos principais costumam ser gravados pela própria empresa, que conhece o produto, e a agência cuida da direção e do acabamento.',
    },
    {
      titulo: 'Presença que sustenta a decisão',
      texto:
        'Quem está decidindo procura o nome da empresa antes de comprar. Perfil parado há seis meses responde essa busca do jeito errado.',
    },
  ],
};

/** Para quem funciona. Honesto nos dois sentidos: inclui e exclui. */
export const paraQuem = {
  serve: [
    'Empresa que já investe pelo menos alguns milhares por mês e não consegue dizer o retorno',
    'Negócio que vende por WhatsApp, telefone ou visita, e não só por carrinho',
    'E-commerce que quer separar o que a mídia traz do que já viria sozinho',
    'Quem trocou de agência e não quer repetir a experiência de não entender o que está sendo feito',
  ],
  naoServe: [
    'Quem procura o menor preço de gestão. A conta não fecha, e o barato costuma sair em conta parada',
    'Quem quer resultado em duas semanas. Rastreamento e estrutura levam o primeiro mês',
    'Quem não pode investir em mídia além da gestão. A verba é do cliente e é ela que compra o clique',
  ],
};

/**
 * Quem opera. Aqui o Angelo aparece em terceira pessoa, porque a
 * informação é sobre ele.
 */
export const quemOpera = {
  titulo: 'Quem coloca a mão na conta',
  texto:
    'A Psy Comunic é conduzida por Angelo Garcia, que tem mais de 17 anos de design e passou de criar a peça para responder pelo resultado dela. É mentorado na Vinci Society, com Tay Dantas, e sócio em uma operação de e-commerce de milhões, o que significa que as decisões de mídia aqui são tomadas por quem também vive do outro lado, olhando o próprio caixa.',
  pontos: [
    '17+ anos de design, com a peça pensada para converter e não só para agradar',
    'Mentoria na Vinci Society, com Tay Dantas',
    'Sócio em operação de e-commerce, decidindo verba com o próprio dinheiro',
  ],
};

export const perguntas = [
  {
    p: 'Quanto preciso investir em mídia para começar?',
    r: 'Depende do ticket e do ciclo de venda do seu negócio, e isso a gente vê na análise. O que dá para dizer antes é que a verba de mídia é sua e vai direto para o Google e para a Meta: ela não passa pela agência nem se mistura com o valor do serviço.',
  },
  {
    p: 'Em quanto tempo vejo resultado?',
    r: 'O primeiro mês costuma ser de correção e estrutura, porque quase sempre há rastreamento errado por baixo. É desconfortável e é honesto: otimizar em cima de número falso dá a sensação de progresso e não move venda.',
  },
  {
    p: 'Preciso ter site pronto?',
    r: 'Não necessariamente. Muita empresa vende por WhatsApp e isso funciona bem com tráfego. Se o destino do anúncio estiver fraco, a análise vai apontar, porque de nada adianta melhorar o clique e perder a pessoa na chegada.',
  },
  {
    p: 'Vocês assumem a conta que já existe ou criam outra?',
    r: 'Sempre que possível assumimos a que existe. Conta antiga carrega histórico de aprendizado que vale dinheiro, e recomeçar do zero joga isso fora. A conta e os dados continuam sendo seus, em nome da sua empresa.',
  },
  {
    p: 'Tem fidelidade?',
    r: 'Não. O combinado é aviso de 30 dias, dos dois lados. Prender cliente com contrato longo é o jeito de continuar sendo pago sem continuar entregando.',
  },
  {
    p: 'Como sei o que está sendo feito?',
    r: 'Pelo painel, que fica aberto para você o tempo todo, e pelo WhatsApp direto com quem opera, com resposta no mesmo dia. O que foi mudado na conta fica registrado com data.',
  },
];

/** Faixas de verba do formulário. Servem para qualificar, e viram
    `valor_verba_estimada` no CRM, usando o piso da faixa. */
export const FAIXAS_DE_VERBA = [
  { valor: '', rotulo: 'Prefiro não dizer agora', piso: null },
  { valor: 'ate-1500', rotulo: 'Até R$ 1.500 por mês', piso: 1000 },
  { valor: '1500-5000', rotulo: 'Entre R$ 1.500 e R$ 5.000', piso: 1500 },
  { valor: '5000-15000', rotulo: 'Entre R$ 5.000 e R$ 15.000', piso: 5000 },
  { valor: '15000-50000', rotulo: 'Entre R$ 15.000 e R$ 50.000', piso: 15000 },
  { valor: 'acima-50000', rotulo: 'Acima de R$ 50.000', piso: 50000 },
  { valor: 'nao-invisto', rotulo: 'Ainda não invisto', piso: 0 },
] as const;

export const CANAIS_HOJE = [
  { valor: 'google', rotulo: 'Google Ads' },
  { valor: 'meta', rotulo: 'Meta (Instagram e Facebook)' },
  { valor: 'ambos', rotulo: 'Os dois' },
  { valor: 'outros', rotulo: 'Outros canais' },
  { valor: 'nenhum', rotulo: 'Nenhum ainda' },
] as const;

export const formulario = {
  titulo: 'Peça a análise da sua conta',
  texto:
    'A equipe abre a sua conta de anúncio, confere o rastreamento e a estrutura, e devolve em até 48 horas o que encontrou. Sem custo, e sem virar apresentação de uma hora.',
  rodape:
    'Seus dados ficam com a Psy Comunic e servem só para esse contato. Nada de lista de disparo.',
};
