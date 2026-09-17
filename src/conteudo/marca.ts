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
    'Uma operação de crescimento para e-commerce. Não uma agência de mídia.',
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
    t: '17+ anos em design e web',
    d: 'Angelo Garcia trabalha com design gráfico e web desde antes de e-commerce virar assunto de todo mundo. É a base de por que a Psy Comunic trata a loja como produto, e não como suporte de anúncio.',
  },
  {
    i: '02',
    t: 'Ex-sócio de e-commerces de milhões',
    d: 'Ele foi sócio da Casa Linda Decorações e da Lar e Vida, dois e-commerces com faturamento na casa dos milhões. Já viveu o estoque parado, o boleto que não é pago e a entrega que atrasa, do lado de quem responde por eles.',
  },
  {
    i: '03',
    t: 'Mentorado na Vinci Society',
    d: 'Mentoria com Tay Dantas, fundadora da Vinci Society, ex-COO da Boca Rosa e ex-sócia e diretora de branding do G4 Educação. É de onde vem o método que a Psy Comunic aplica na aquisição.',
  },
] as const;
