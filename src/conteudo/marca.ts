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
