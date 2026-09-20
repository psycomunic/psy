/**
 * Identidade do site para buscadores e redes.
 *
 * Um lugar só. URL canônica escrita errada em dois arquivos é como o
 * Google acaba indexando duas versões do mesmo site e dividindo a
 * autoridade entre elas.
 */
export const site = {
  /* COM www e COM https. O domínio sem www responde 308 para cá, então
     esta é a versão canônica de verdade. Trocar aqui exige trocar o
     redirecionamento no DNS, e não o contrário. */
  url: 'https://www.psycomunic.com.br',

  nome: 'Psy Comunic',
  nomeCurto: 'Psy Comunic',

  titulo: 'Psy Comunic · E-commerce de moda, tráfego pago e performance',

  /* Até 155 caracteres. Mais que isso o Google corta no meio da frase.
     Esta tem 152. */
  descricao:
    'Criamos e operamos e-commerce de moda: plataforma, página de produto, categorização, tráfego pago no Google e Meta e marketplaces. Diagnóstico gratuito.',

  /*
    O par que vai para o Facebook, o Instagram e o WhatsApp.

    É texto DIFERENTE do de busca, e não uma segunda cópia dele. O
    título de busca disputa uma lista de dez resultados e por isso
    carrega as palavras que a pessoa digitou. O título de rede social
    aparece sozinho, embaixo de uma imagem, e o que ele precisa é dar
    vontade de tocar. Antes os dois eram o mesmo, e o de rede social
    pagava o preço.
  */
  og: {
    titulo: 'Psy Comunic · E-commerce de moda que vende',
    descricao:
      'Operação completa para loja de moda, do catálogo ao tráfego pago. Diagnóstico gratuito nas quatro frentes.',
    alt: 'Psy Comunic · operação de crescimento para e-commerce de moda',
  },

  /*
    PENDÊNCIA: cidade e estado.

    O DDD 47 cobre Joinville, Blumenau, Itajaí, Balneário Camboriú e
    Jaraguá do Sul, então não dá para deduzir a cidade do telefone.
    Endereço inventado em dado estruturado não é só impreciso: o Google
    trata divergência de endereço entre o site e o Perfil da Empresa como
    sinal de desconfiança, e busca local é onde a maior parte do "quero
    uma agência" acontece.

    Preencher junto com razão social e CNPJ, que já estão pendentes no
    rodapé. Assim que houver cidade e estado, descomentar as duas linhas
    e o endereço entra no JSON-LD sozinho.
  */
  local: {
    // cidade: '',
    // estado: '',
    pais: 'BR',
  } as { cidade?: string; estado?: string; pais: string },

  /*
    Medição do GA4.

    Não é segredo e por isso não vai para variável de ambiente: o ID sai
    no HTML de toda página e serve só para dizer em qual propriedade os
    eventos caem. Guardá-lo como se fosse segredo daria a ilusão de
    proteção e mais uma configuração para esquecer no deploy.

    Vazio desliga o script inteiro, sem quebrar nada.
  */
  analytics: { ga4: 'G-X20YYMLKSV' },

  contato: {
    email: 'psycomunic@gmail.com',
    telefone: '+5547992406661',
    instagram: 'https://www.instagram.com/reysonmkt',
  },

  fundador: 'Angelo Garcia',
} as const;

/** Monta URL absoluta. Buscadores e redes exigem absoluta, nunca relativa. */
export const urlAbsoluta = (caminho = '/') =>
  new URL(caminho, site.url).toString();
