/**
 * Fundação da marca.
 *
 * ATENÇÃO: os hex abaixo foram lidos do PDF da apresentação e são
 * APROXIMAÇÕES. Confirmar no manual de marca antes do go-live. Está tudo
 * num lugar só justamente para essa troca ser de uma linha.
 * (Pendência 1 da seção 17 do escopo.)
 */
export const marca = {
  nome: 'Psy Comunic',
  posicionamento:
    'Uma operação de crescimento para e-commerce de moda. Não uma agência de mídia.',
  proposito:
    'Transformar a maneira como crescemos ao evoluir o meio onde compramos.',

  cores: {
    marinho: '#101F3F',   // fundo dominante
    magenta: '#E4155F',   // destaque, CTAs, títulos
    branco: '#FFFFFF',
    /* Variante clara do magenta para TEXTO sobre o marinho.
       O magenta original reprova no contraste 4.5:1 exigido pela
       WCAG 2.2 AA, então ele fica restrito a fundo de botão e a
       elementos gráficos. Ver seção 13 do escopo. */
    magentaTexto: '#FF6B96',
  },

  pilares: [
    'Crescimento, aprendizado e cultura de compartilhar',
    'Democratizar o acesso das pessoas a produtos e serviços',
    'Contribuir com o crescimento de empresas e o desenvolvimento socioeconômico',
  ],

  valores: [
    {
      nome: 'Evolução',
      texto:
        'Capacidade de se adaptar com humildade para aprender e ensinar. Trabalhar sempre com as melhores referências e ver nos desafios oportunidades de crescimento.',
    },
    {
      nome: 'Entrega',
      texto:
        'Iniciativa somada a capacidade de execução e finalização. Alto desempenho e qualidade acima de procedimentos e burocracias.',
    },
    {
      nome: 'Cuidado coletivo',
      texto:
        'Compartilhar conhecimento e cuidar uns dos outros. Ambiente saudável e colaborativo, em que ninguém espera o companheiro pedir ajuda.',
    },
    {
      nome: 'Crescimento',
      texto:
        'Quando o cliente vence, a Psy vence. Empreender e unir pessoas para alavancar o desenvolvimento socioeconômico.',
    },
    {
      nome: 'Legado',
      texto:
        'Impacto positivo no mercado e na sociedade. Garantir que quem se juntar ao time possa melhorar o que já está construído.',
    },
  ],

  assinatura: {
    frase:
      'Cada sonho que você deixa para trás é um pedaço do seu futuro que deixa de existir.',
    autor: 'Steve Jobs',
  },
} as const;

/**
 * O faturamento da operação de onde vem a credencial.
 *
 * Uma constante, e não uma frase digitada em cada lugar. O site diz o
 * número três vezes: no cartão da capa, na credencial 01 e na hero. As
 * três precisam dizer EXATAMENTE o mesmo, porque quem lê "milhões" num
 * lugar e "R$ 16 milhões" no outro conclui que o primeiro era enfeite.
 *
 * `ano` e `mes` são o mesmo fato em duas escalas, e existem porque o
 * mês impressiona quem não consegue imaginar o ano. Usar as duas na
 * mesma frase é proposital; usar uma terceira redação não é.
 */
export const faturamento = {
  ano: 'R$ 16 milhões por ano',
  mes: 'mais de R$ 1 milhão por mês',
  curto: 'R$ 16 milhões',
} as const;

/**
 * Os quatro cartões da capa, logo abaixo da hero.
 *
 * Estavam escritos dentro do JSX da home. Saíram de lá pela regra do
 * projeto: texto do site mora em `src/conteudo`. Era também onde o
 * número do faturamento podia divergir da credencial sem ninguém ver.
 *
 * `n` é o que aparece grande. `u` é a unidade em letra pequena ao
 * lado, e é `null` quando o número já é uma frase. `d` é a linha de
 * baixo, que diz de onde o número vem: número sem origem declarada é
 * o tipo de coisa que o visitante desconta sozinho.
 */
export const numerosDaCapa = [
  {
    n: `${faturamento.curto}`,
    u: 'por ano',
    d: 'o faturamento do e-commerce do qual Angelo Garcia foi sócio',
  },
  {
    n: '17',
    u: 'anos',
    d: 'de mercado em design, tecnologia e performance',
  },
  {
    n: 'Centenas',
    u: 'de lojas',
    d: 'criadas, lançadas e colocadas para vender',
  },
  {
    n: 'Do zero',
    u: 'ao lançamento',
    d: 'e as entregas contínuas depois dele, com o mesmo time',
  },
] as const;

/**
 * Por que Angelo Garcia é quem responde pela operação.
 *
 * ============================================================
 * ESTAVA EM DOIS LUGARES, PALAVRA POR PALAVRA
 * ============================================================
 * A mesma lista vivia copiada dentro de `page.tsx` e de
 * `sobre/page.tsx`. Duas cópias de um texto só sobrevivem até alguém
 * editar uma delas, e aí o site passa a dizer duas coisas diferentes
 * sobre a mesma pessoa, sem ninguém perceber. Foi exatamente o que
 * quase aconteceu quando os nomes das lojas entraram aqui.
 *
 * Agora é uma lista só, e a regra do projeto volta a valer: texto do
 * site mora em `src/conteudo`, não espalhado em JSX.
 *
 * ============================================================
 * O NÚMERO É UM SÓ, E OS NOMES NÃO ENTRAM
 * ============================================================
 * O cartão 01 citava duas lojas pelo nome. Não cita mais: a operação
 * de onde vem a credencial não é identificada no site.
 *
 * O faturamento é R$ 16 milhões por ano, e essa é a ÚNICA forma de
 * escrever. "Milhões", "na casa dos milhões" e "R$ 16 mi" são a mesma
 * afirmação com três pesos diferentes, e quem lê duas delas na mesma
 * página desconfia das duas. Se o número mudar, muda aqui e em
 * `faturamento`, logo acima, e todo lugar que o cita acompanha.
 *
 * ============================================================
 * CARGO SE CONFERE ANTES DE PUBLICAR
 * ============================================================
 * O cartão 03 dizia só "uma das maiores especialistas em marketing do
 * Brasil", que é superlativo e não se checa. Agora diz os cargos, que
 * se checam, e por isso foram checados: ela é fundadora e CEO da Vinci
 * Society, foi COO da Boca Rosa Company e foi SÓCIA E DIRETORA DE
 * BRANDING do G4 Educação.
 *
 * Fundadora do G4 ela não é, e essa era a versão que quase entrou.
 * Errar o cargo de uma pessoa real num site comercial é o tipo de coisa
 * que qualquer um confere em trinta segundos.
 *
 * ============================================================
 * ELE, E NÃO EU
 * ============================================================
 * Quem fala no site é a empresa. Angelo aparece em terceira pessoa, e
 * só quando a informação é sobre ele, que é o caso desta lista inteira.
 */
export const credenciais = [
  {
    i: '01',
    t: `Ex-sócio de e-commerce de ${faturamento.ano}`,
    d: `Angelo Garcia foi sócio de um e-commerce que fatura ${faturamento.ano}, ${faturamento.mes}. Já viveu o estoque parado, o boleto que não é pago, a grade furada e a entrega que atrasa, do lado de quem responde por eles. É diferente de quem só gerencia anúncio.`,
  },
  {
    i: '02',
    t: '17+ anos em design e web',
    d: 'Angelo trabalha com design gráfico e web desde antes de e-commerce virar assunto de todo mundo. É a base de por que a Psy Comunic trata a loja como produto, e não como suporte de anúncio.',
  },
  {
    i: '03',
    t: 'Mentorado na Vinci Society',
    /* Foto da turma do evento, de fundo. Só este cartão tem: é o único
       em que existe imagem de verdade do que a frase afirma. */
    bg: '/imagens/mentoria-vinci.jpg',
    d: 'Mentoria com Tay Dantas, fundadora da Vinci Society, ex-COO da Boca Rosa e ex-sócia e diretora de branding do G4 Educação. É de onde vem o método que a Psy Comunic aplica na aquisição.',
  },
] as const;
