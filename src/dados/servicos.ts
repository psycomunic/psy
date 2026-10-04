import 'server-only';

/**
 * SERVIÇOS AVULSOS — a proposta que não é um pacote de e-commerce.
 *
 * ============================================================
 * POR QUE ISTO EXISTE AO LADO DOS TRÊS PLANOS
 * ============================================================
 * Saturno, Falcon e Apollo foram desenhados para loja virtual com as
 * quatro frentes rodando juntas, e começam em R$ 5.000 por mês. Boa
 * parte da carteira não compra isso. Compra UMA coisa: a construção do
 * site, ou a gestão do tráfego, e às vezes soma outra por cima.
 *
 * ============================================================
 * PROJETO E MENSALIDADE NÃO SE SOMAM
 * ============================================================
 * É a regra que organiza este arquivo. Construir uma loja é obra com
 * fim: entrega, e acabou. Gerir tráfego é operação que recomeça todo
 * mês. Jogar os dois na mesma linha faria a proposta mostrar um site de
 * R$ 15.000 como se fosse mensalidade, e não existe erro pior de se
 * cometer num documento sobre dinheiro.
 *
 * Por isso todo serviço declara `cobranca`, e a tela da conta fecha
 * dois totais separados. Um serviço novo que esqueça esse campo não
 * compila.
 *
 * ============================================================
 * O TEXTO NÃO PODE ASSUMIR NICHO
 * ============================================================
 * A primeira versão deste catálogo falava de "receita" e de "loja", e
 * ele é lido por quem vende curso, quem preenche agenda, quem aluga
 * equipamento e quem marca consulta. Para essas pessoas, "aumentar a
 * receita da loja" descreve o negócio de outro, e a proposta passa a
 * parecer um modelo reaproveitado.
 *
 * Então o vocabulário aqui é o do RESULTADO, e não o do formato:
 * conversão em vez de venda, cliente em vez de comprador, procura em
 * vez de tráfego de loja. O que conta como conversão muda de nicho para
 * nicho (matrícula, orçamento, reserva, consulta, pedido) e isso é
 * definido com o cliente, não presumido aqui.
 *
 * ============================================================
 * PREÇO SÓ ONDE ELE NÃO MUDA
 * ============================================================
 * Criação de conteúdo tem valor sugerido: a entrega é a mesma para todo
 * mundo e o trabalho não muda com o porte do cliente.
 *
 * Nenhum outro tem. Gestão de tráfego com uma campanha e com doze não
 * dão o mesmo trabalho. Loja de quarenta produtos e loja de quatro mil
 * não dão a mesma obra. Cravar número aqui viraria preço que ninguém
 * cumpre: bastaria o segundo cliente pagar diferente para o arquivo
 * passar a mentir, e arquivo que mente sobre preço é pior que arquivo
 * sem preço.
 *
 * Onde existe, o número é SUGERIDO: preenche o campo do gerador e
 * continua editável. A negociação manda.
 *
 * ============================================================
 * PRAZO NÃO ESTÁ AQUI, DE PROPÓSITO
 * ============================================================
 * Prazo de entrega é compromisso, e compromisso inventado por quem
 * escreve o catálogo vira briga com quem executa. Ele entra por
 * proposta, no campo "próximos passos", com a data que a equipe
 * assumiu para AQUELE escopo.
 */

export type Servico =
  | 'ecommerce'
  | 'repaginacao'
  | 'siteServicos'
  | 'institucional'
  | 'landing'
  | 'trafego'
  | 'social'
  | 'manutencao';

/**
 * A ordem manda na tela: é nela que os slides saem e que o formulário
 * lista. Primeiro o que se constrói, depois o que roda todo mês, e os
 * opcionais por último, que é a ordem em que a conversa acontece.
 */
export const SERVICOS: Servico[] = [
  'ecommerce',
  'repaginacao',
  'siteServicos',
  'institucional',
  'landing',
  'trafego',
  'social',
  'manutencao',
];

export type FichaServico = {
  id: Servico;
  nome: string;
  /**
   * `principal` sustenta a proposta sozinho. `complemento` existe para
   * somar, e a tela diz isso: vender conteúdo solto para quem procurou
   * tráfego é entregar a coisa errada.
   */
  papel: 'principal' | 'complemento';
  /**
   * `projeto` cobra uma vez e termina. `mensal` recomeça todo mês.
   *
   * Não é rótulo: é o que impede a conta de somar uma obra com uma
   * mensalidade e apresentar o resultado como "total por mês".
   */
  cobranca: 'projeto' | 'mensal';
  paraQuem: string;
  promessa: string;
  /**
   * Valor sugerido, quando o serviço TEM tabela.
   *
   * Só criação de conteúdo tem, porque a entrega é a mesma para todo
   * mundo. Sugerido, e não fixo: o campo do gerador vem preenchido com
   * ele e continua editável.
   */
  precoSugerido?: number;
  entregas: string[];
  /**
   * O trabalho que acontece UMA VEZ, dentro de um serviço mensal.
   *
   * Existe separado de `entregas` por dois motivos, e o primeiro é de
   * leitura: montar o ecossistema de anúncio dá onze entregas, e na
   * mesma lista da operação do mês elas viram um paredão de vinte
   * marcadores num slide que passa de três mil pixels no telefone. Com
   * campo próprio, a implantação ganha a tela dela.
   *
   * O segundo é de preço. O que sustenta a mensalidade do primeiro mês
   * é justamente isto, e o que não está escrito o cliente conclui que
   * não existe.
   *
   * Não é outra cobrança: continua dentro da mensalidade, e por isso
   * `cobranca` não muda. Quem quiser faturar a implantação à parte cria
   * um serviço `projeto` para ela, e aí os dois totais se fecham
   * separados, como manda o cabeçalho deste arquivo.
   */
  implantacao?: string[];
  /** O que este serviço NÃO cobre. Dito antes, e não na primeira
      cobrança de algo que o cliente achava incluso. */
  naoInclui: string[];
};

export const fichasDeServico: Record<Servico, FichaServico> = {
  ecommerce: {
    id: 'ecommerce',
    nome: 'Loja virtual do zero ao lançamento',
    papel: 'principal',
    cobranca: 'projeto',
    paraQuem: 'Quem vai vender ou alugar pela internet e ainda não tem loja de pé',
    promessa:
      'A loja construída inteira, do catálogo ao primeiro pedido: as telas que decidem a compra, o pagamento, o frete e o rastreamento, tudo testado com pedido real antes de abrir. Quando o catálogo é de locação, o mesmo caminho termina numa reserva com período e devolução em vez de um pedido avulso.',
    entregas: [
      'Arquitetura da loja desenhada a partir do seu catálogo: categorias, filtros e busca que servem ao que você vende, e não a um modelo pronto',
      'Layout das telas que decidem a compra, que são a de produto, a do carrinho e a do checkout',
      'Padrão de cadastro definido antes do primeiro item: título, foto, descrição, variação e estoque',
      'Meios de pagamento e regras de frete configurados e conferidos com um pedido de verdade',
      'Quando o catálogo é de locação, o fluxo de período, disponibilidade e devolução',
      'Rastreamento instalado desde o primeiro dia, porque loja que abre cega não recupera os primeiros meses depois',
      'Páginas e políticas obrigatórias: troca, devolução, privacidade e prazo de entrega',
      'Teste em celular tratado como o principal, que é de onde vem a maior parte dos acessos',
      'Acompanhamento do lançamento e ajuste do que o primeiro movimento real mostrar',
    ],
    naoInclui: [
      'Mensalidade de plataforma, domínio e certificado, que ficam em nome da sua empresa',
      'Fotografia e vídeo de produto',
      'Redação das descrições do catálogo inteiro, que é orçada pelo volume de itens',
      'Integração com ERP, estoque ou emissor fiscal, que depende do sistema e é orçada à parte',
      'Cadastro em massa dos produtos, quando a base não vem pronta para importação',
      'A operação de anúncio depois do lançamento, que é o serviço de tráfego',
    ],
  },

  repaginacao: {
    id: 'repaginacao',
    nome: 'Repaginação da loja virtual',
    papel: 'principal',
    cobranca: 'projeto',
    paraQuem: 'Quem já vende pela internet e sente que a loja atrapalha em vez de ajudar',
    promessa:
      'A loja que já existe refeita onde a venda se perde. Começa pelo lugar em que o visitante desiste hoje, que é medido e não adivinhado, e termina com as telas de produto, carrinho e checkout reconstruídas, o celular tratado como principal e o rastreamento conferido evento por evento. Catálogo, pedidos e endereço continuam os mesmos, então ninguém recomeça do zero nem perde histórico.',
    entregas: [
      'Leitura do que a loja faz hoje: por onde entra o acesso, em que tela ele desiste, e quanto disso é velocidade, texto ou navegação confusa',
      'Redesenho das telas que decidem a compra, que são a de produto, a do carrinho e a do checkout',
      'Navegação, categorias, filtros e busca reorganizados a partir do catálogo real, e não de um menu que cresceu sem plano',
      'Página inicial refeita para levar à categoria e ao produto, em vez de ser um mural de banners',
      'Identidade aplicada na loja inteira, com um padrão só de tipografia, cor, botão e espaçamento',
      'Velocidade atacada onde ela custa venda, que é no celular: peso de imagem, script sobrando e o que atrasa a primeira pintura',
      'Resposta à dúvida na tela em que ela aparece: frete, prazo, troca, devolução e formas de pagamento ditos antes de o cliente ir procurar',
      'Padrão de cadastro revisado e aplicado nos itens que mais vendem: título, foto, descrição, variação e estoque',
      'Rastreamento conferido evento por evento, porque loja repaginada com medição errada não consegue provar que melhorou',
      'Publicação acompanhada, com o comparativo do antes e do depois nos números que importam',
    ],
    naoInclui: [
      'Troca de plataforma, que é mudança de endereço e de base de dados, e é orçada à parte',
      'Mensalidade de plataforma, domínio, certificado e licença de extensão',
      'Fotografia e vídeo de produto',
      'Reescrita das descrições do catálogo inteiro, que é orçada pelo volume de itens',
      'Integração com ERP, estoque ou emissor fiscal, que depende do sistema',
      'Criação de marca nova, que é outro trabalho',
      'A operação de anúncio depois da entrega, que é o serviço de tráfego',
    ],
  },

  siteServicos: {
    id: 'siteServicos',
    nome: 'Site de serviços',
    papel: 'principal',
    cobranca: 'projeto',
    paraQuem: 'Quem vende serviço e precisa que a página termine em orçamento, agendamento ou contato',
    promessa:
      'O site que apresenta o que a empresa faz e termina em pedido. Cada serviço ganha a própria página, para poder ser anunciado e medido separado, e o formulário pergunta o que a sua equipe precisa saber para responder sem uma segunda rodada de perguntas.',
    entregas: [
      'Estrutura montada a partir dos serviços que você vende, com uma página para cada um',
      'Formulário de orçamento com as perguntas que a sua equipe precisa para já responder com preço ou prazo',
      'Prova social publicada apenas com autorização escrita do cliente citado e período declarado',
      'Rastreamento de quem preencheu e por onde chegou, por origem',
      'Textos revisados para busca, com o vocabulário que a pessoa realmente digita',
      'Versão de celular tratada como a principal',
      'Publicação, domínio e certificado configurados',
    ],
    naoInclui: [
      'Hospedagem e domínio, que ficam em nome da sua empresa',
      'Produção de foto e vídeo',
      'Atendimento de quem preenche o formulário, que continua com a sua equipe',
      'Sistema de agenda com pagamento, que depende da ferramenta e é orçado à parte',
      'A operação de anúncio, que é o serviço de tráfego',
    ],
  },

  institucional: {
    id: 'institucional',
    nome: 'Site institucional',
    papel: 'principal',
    cobranca: 'projeto',
    paraQuem: 'A empresa que precisa existir direito quando procuram o nome dela',
    promessa:
      'Quem está decidindo procura o seu nome antes de fechar, e encontra o que estiver lá. O site institucional é a resposta a essa busca: quem é a empresa, o que ela faz, com quem já trabalhou e por onde falar com ela.',
    entregas: [
      'Mapa de páginas definido a partir do que a empresa precisa responder, e não de um modelo de mercado',
      'Identidade aplicada nas telas, a partir do material de marca que você já tem',
      'Página de contato que funciona, com formulário, WhatsApp e os dados fiscais da empresa',
      'Textos escritos para leitura rápida, que é como essa página é lida',
      'Base técnica de busca: títulos, descrições, endereço legível e mapa do site',
      'Versão de celular tratada como a principal',
      'Publicação, domínio e certificado configurados',
    ],
    naoInclui: [
      'Hospedagem e domínio, que ficam em nome da sua empresa',
      'Criação de identidade visual do zero, quando a empresa ainda não tem marca definida',
      'Produção de foto e vídeo',
      'Blog com publicação contínua, que é trabalho de todo mês e não de entrega única',
      'Área logada, catálogo com preço ou carrinho, que é loja virtual',
    ],
  },

  landing: {
    id: 'landing',
    nome: 'Landing page de campanha',
    papel: 'principal',
    cobranca: 'projeto',
    paraQuem: 'Quem vai anunciar e precisa de uma página feita para uma oferta só',
    promessa:
      'Uma página, uma oferta, uma ação. Mandar verba de anúncio para a home é pagar por visita que se perde no menu: aqui as saídas saem e sobra um caminho, do primeiro argumento até o formulário.',
    entregas: [
      'Estrutura de argumento montada para uma oferta única, na ordem em que a objeção aparece',
      'Formulário curto, pedindo só o que a sua equipe usa para responder',
      'Rastreamento de conversão conferido antes de a campanha subir, porque página que não mede transforma verba em palpite',
      'Velocidade tratada como requisito, já que quem chega por anúncio abandona antes de a página abrir',
      'Versão de celular tratada como a principal',
      'Uma segunda versão do título e da chamada, para o anúncio poder testar duas',
      'Publicação no seu domínio, em endereço próprio',
    ],
    naoInclui: [
      'A verba de mídia e a operação da campanha, que são o serviço de tráfego',
      'Produção de foto e vídeo',
      'Páginas adicionais: cada oferta nova é uma landing nova',
      'Ferramenta de e-mail ou CRM, quando a captura precisa cair num sistema que você ainda não tem',
    ],
  },

  trafego: {
    id: 'trafego',
    nome: 'Gestão de tráfego pago',
    papel: 'principal',
    cobranca: 'mensal',
    paraQuem:
      'Quem precisa de cliente entrando com previsibilidade, e não de sorte no algoritmo',
    promessa:
      'Google e Meta operados por quem responde pelo resultado. O primeiro mês não é só subir campanha: é construir o ecossistema inteiro, que são as contas, a medição e a presença nas duas plataformas, e definir o que conta como conversão no seu negócio, seja matrícula, orçamento, reserva, consulta ou pedido. Daí para frente, tudo é medido contra isso.',
    /* A implantação vive em campo próprio e ganha o slide dela. Nesta
       lista ela virava mais oito marcadores no meio da operação do mês,
       e era justamente o que o cliente precisava ver para entender o
       que está pagando. Ver `implantacao` no tipo, acima. */
    implantacao: [
      'Business Manager da Meta criada ou arrumada, com a página, o Instagram, o domínio verificado e os acessos da equipe organizados num lugar só',
      'Conta de anúncio em nome da sua empresa, com forma de pagamento, fuso, moeda e limite de gasto conferidos antes de a primeira verba rodar',
      'Google Ads criado e vinculado ao Analytics, ao Search Console e, quando o catálogo é de produto, ao Merchant Center, para as ferramentas trocarem dados em vez de cada uma contar a sua versão',
      'Gerenciador de tags instalado no site, com o pixel da Meta e a tag do Google saindo de um lugar só, e não de cinco scripts colados em épocas diferentes',
      'Eventos de conversão nomeados, instalados e testados um por um, com o valor do pedido ou do orçamento viajando junto',
      'API de conversões da Meta ligada, porque evento que depende só do navegador chega pela metade e faz a plataforma otimizar com dado errado',
      'Analytics configurado com as conversões marcadas e os públicos prontos, para a audiência começar a crescer no primeiro dia',
      'Perfil da Empresa no Google reivindicado e completo, que é o que aparece quando alguém procura o seu nome depois de ver o anúncio',
      'Públicos de remarketing e listas de clientes criados e aquecendo desde o começo, porque público frio é o anúncio mais caro que existe',
      'Caminho inteiro conferido com um pedido ou um envio de verdade, antes de a primeira campanha subir',
      'Inventário dos acessos entregue por escrito: o que foi criado, onde mora e quem entra',
    ],
    entregas: [
      'Operação diária das duas plataformas, com a verba acompanhada e remanejada para o que está entregando',
      'Estrutura de campanha montada por canal, oferta e público, para dar para saber qual funcionou',
      'Criativos de anúncio testados em variação, com o vencedor decidido pelo número',
      'Ajuste semanal de verba, com o que mudou registrado por data',
      'Vigilância do rastreamento mês a mês: evento que parou de disparar ou que passou a contar duas vezes invalida toda decisão tomada depois dele',
      'Painel com o que entrou, o que foi investido e o retorno por canal, atualizado sozinho',
      'WhatsApp direto com quem opera a conta, resposta no mesmo dia',
      'Reunião mensal de leitura dos números e do plano do mês seguinte',
    ],
    naoInclui: [
      'A verba de mídia, que é sua e vai direto para o Google e para a Meta',
      'Produção de conteúdo, que é o outro serviço',
      'Desenvolvimento de site, loja ou página de captura',
      'Atendimento de quem chega: responder o lead continua com a sua equipe',
    ],
  },

  social: {
    id: 'social',
    nome: 'Criação de conteúdo',
    papel: 'complemento',
    cobranca: 'mensal',
    paraQuem: 'Quem anuncia e manda a pessoa para um perfil parado',
    precoSugerido: 2500,
    promessa:
      'O criativo que roda no anúncio e o perfil que a pessoa encontra depois de clicar, cuidados juntos. Quem está decidindo procura o seu nome antes de comprar, e perfil abandonado responde essa busca do jeito errado.',
    entregas: [
      'Criativos para as campanhas, em variações feitas para serem testadas uma contra a outra',
      'Calendário de conteúdo alinhado ao que a campanha está promovendo',
      'Artes e carrosséis para o feed',
      'Legendas escritas para o público que o anúncio traz',
      'Publicação e leitura do que rendeu',
    ],
    naoInclui: [
      'Gravação em locação, que fica com a equipe do cliente ou é orçada à parte',
      'Aparição em vídeo: quem aparece é você, que é quem tem autoridade no assunto',
      'Gestão de comentários e mensagens diretas',
      'Impulsionamento, que faz parte da verba de mídia',
    ],
  },

  manutencao: {
    id: 'manutencao',
    nome: 'Sustentação do site',
    papel: 'complemento',
    cobranca: 'mensal',
    paraQuem: 'Quem colocou um site no ar e não quer que ele envelheça sozinho',
    promessa:
      'Site publicado não é site pronto. Preço muda, serviço entra, plataforma atualiza e formulário para de entregar sem avisar ninguém. Este é o acordo de quem fica olhando para isso depois da entrega.',
    entregas: [
      'Atualização de plataforma, tema e extensões, com cópia de segurança antes de cada uma',
      'Alterações de conteúdo pedidas no mês: texto, imagem, produto, serviço e página',
      'Conferência mensal de que os formulários chegam e de que o rastreamento ainda dispara',
      'Monitoramento de página fora do ar e de certificado vencendo',
      'Correção dos defeitos que aparecerem no que foi entregue',
    ],
    naoInclui: [
      'Página ou funcionalidade nova, que é projeto e é orçada à parte',
      'Hospedagem, domínio e licença de extensão',
      'Redesenho do site',
      'Recuperação de site invadido por acesso que não passou pela Psy Comunic',
    ],
  },
};

/**
 * As condições que valem para a proposta, escolhidas pelo que ela tem
 * dentro.
 *
 * Era uma lista fixa, e ela falava de conta de anúncio e de verba de
 * mídia. Numa proposta só de site, isso é condição do serviço de
 * outra pessoa: quem lê não tem conta de anúncio nenhuma para ficar em
 * nome da empresa dele, e a proposta parece o que de fato era, um
 * modelo reaproveitado.
 */
export function condicoesDoAvulso(ids: Servico[]): string[] {
  const fichas = ids.map((i) => fichasDeServico[i]).filter(Boolean);
  const temProjeto = fichas.some((f) => f.cobranca === 'projeto');
  const temMensal = fichas.some((f) => f.cobranca === 'mensal');
  const temTrafego = ids.includes('trafego');

  const lista = ['Tudo o que for criado é seu: código, contas, acessos e domínio ficam em nome da sua empresa'];

  if (temProjeto) {
    lista.push(
      'Escopo, etapas e o que entra em cada uma ficam definidos antes de começar',
      'O que surgir fora do escopo vira orçamento à parte, combinado antes, e não uma surpresa na fatura',
    );
  }

  if (temMensal) {
    lista.push('Contrato sem fidelidade: aviso de 30 dias dos dois lados');
  }

  if (temTrafego) {
    lista.push(
      'As contas de anúncio ficam em nome da sua empresa, e os dados são seus',
      'A verba de mídia nunca se mistura com o valor do serviço',
      'Painel próprio, com login seu, aberto o tempo todo',
    );
  }

  return lista;
}

export const fichaDoServico = (s: Servico) => fichasDeServico[s];

export const emReais = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

/** Um serviço escolhido nesta proposta, com o valor negociado. */
export type ServicoEscolhido = { id: Servico; fee: number };
