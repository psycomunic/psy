import {
  CORES,
  botao,
  casca,
  esc,
  ficha,
  miudo,
  paragrafo,
  passos,
  rotulo,
  separador,
  titulo,
} from './casca.ts';
import { whatsapp, whatsappEscrito } from '../../conteudo/navegacao.ts';
import { selecao } from '../../conteudo/selecao-braganca.ts';
import { dinheiroExato } from '../formato.ts';
import type { SaldoContaMidia } from '../dados/tipos.ts';

/**
 * Os e-mails que o sistema manda, um por situação.
 *
 * ============================================================
 * A VOZ É A DA EMPRESA
 * ============================================================
 * Mesma regra do site, e por isso nada de "eu" aqui: quem escreve é a
 * Psy Comunic. Angelo aparece em terceira pessoa e só quando a
 * informação é sobre ele, o que nestes modelos nunca acontece.
 *
 * As mensagens de prospecção no Instagram são a exceção conhecida, e
 * vivem em `src/lib/dominio/abordagem.ts`: lá é uma pessoa falando com
 * outra, e assinar "a equipe" numa DM soa a robô.
 *
 * Sem travessão no meio da frase.
 *
 * ============================================================
 * TODO MODELO DEVOLVE OS DOIS CORPOS
 * ============================================================
 * `html` e `texto`. O texto não é enfeite: parte dos filtros de spam
 * pontua mal mensagem que só tem HTML, e quem lê no relógio, no leitor
 * de tela ou com imagens desligadas recebe a versão de texto. Escrever
 * os dois à mão custa pouco e é a diferença entre chegar na caixa de
 * entrada e chegar na promoções.
 *
 * ============================================================
 * O QUE ESTES E-MAILS NUNCA DIZEM
 * ============================================================
 * Nota da seleção, verba, faturamento e qualquer juízo sobre o negócio
 * ficam no aviso INTERNO. A pessoa que se inscreveu recebe confirmação
 * de recebimento, e nada mais: a nota é instrumento de leitura da
 * equipe, e ver "você tirou 54" num e-mail automático é a pior maneira
 * possível de descobrir isso.
 */

export type Modelo = { assunto: string; html: string; texto: string };

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.psycomunic.com.br';

const zapGeral = `https://wa.me/${whatsapp.numero}`;
const zapBraganca = `https://wa.me/${selecao.whatsapp}`;
const bragancaEscrito = selecao.whatsapp
  .replace(/^55/, '')
  .replace(/^(\d{2})(\d{5})(\d{4})$/, '$1 $2-$3');

/** Rodapé de e-mail que vai para fora: contato, origem e nada mais. */
function rodapeExterno({ zap, numero, porque }: { zap: string; numero: string; porque: string }) {
  return `${miudo(
    `<a href="${zap}" style="color:${CORES.magentaTexto};text-decoration:none;">WhatsApp ${esc(numero)}</a> &nbsp;·&nbsp; <a href="https://instagram.com/reysonmkt" style="color:${CORES.magentaTexto};text-decoration:none;">@reysonmkt</a> &nbsp;·&nbsp; <a href="${SITE}" style="color:${CORES.magentaTexto};text-decoration:none;">psycomunic.com.br</a>`,
  )}${miudo(esc(porque))}`;
}

/** Rodapé de aviso interno. Ninguém de fora lê, então aqui vai o atalho do painel. */
function rodapeInterno(caminho: string) {
  return miudo(
    `Aviso automático do painel. <a href="${SITE}${caminho}" style="color:${CORES.magentaTexto};text-decoration:none;">Abrir ${esc(caminho)}</a>`,
  );
}

/* ================================================================== */
/* 1. Seleção de Bragança: confirmação para quem se inscreveu         */
/* ================================================================== */

export function inscricaoRecebida({
  nome,
  empresa,
}: {
  nome: string;
  empresa: string;
}): Modelo {
  const primeiro = nome.trim().split(/\s+/)[0];
  const assunto = 'Inscrição recebida na seleção das 10 empresas';

  const corpo = [
    rotulo('Seleção · 10 empresas · Bragança, PA'),
    titulo('Inscrição recebida.'),
    paragrafo(
      `Olá, ${esc(primeiro)}. A inscrição da <strong style="color:${CORES.branco};">${esc(empresa)}</strong> chegou, e já está na mesa da equipe.`,
    ),
    paragrafo(
      'São 10 vagas, e cada inscrição é lida uma por uma. A Psy Comunic vai escolher as empresas que mais têm a ganhar com anúncio bem feito, e não as que responderam mais rápido.',
    ),
    separador(),
    paragrafo(`<strong style="color:${CORES.branco};">O que acontece agora</strong>`),
    passos([
      'A equipe lê a sua inscrição inteira, com calma.',
      'A resposta chega no seu WhatsApp em até 48 horas, seja ela qual for.',
      `Se a ${esc(empresa)} ficar com uma das vagas, a conversa de início já é marcada na hora.`,
    ]),
    paragrafo(
      'Não precisa fazer nada até lá. Se quiser adiantar alguma coisa, a unidade de Bragança atende por aqui:',
    ),
    botao(zapBraganca, 'Falar com a unidade de Bragança'),
  ].join('\n');

  const html = casca({
    assunto,
    preheader: 'A equipe analisa cada inscrição e responde pelo WhatsApp em até 48 horas.',
    corpo,
    rodape: rodapeExterno({
      zap: zapBraganca,
      numero: bragancaEscrito,
      porque:
        'Você recebeu este e-mail porque se inscreveu na seleção das 10 empresas, no site da Psy Comunic.',
    }),
  });

  const texto = `INSCRIÇÃO RECEBIDA
Seleção · 10 empresas · Bragança, PA

Olá, ${primeiro}. A inscrição da ${empresa} chegou, e já está na mesa da equipe.

São 10 vagas, e cada inscrição é lida uma por uma. A Psy Comunic vai escolher as empresas que mais têm a ganhar com anúncio bem feito, e não as que responderam mais rápido.

O QUE ACONTECE AGORA
1. A equipe lê a sua inscrição inteira, com calma.
2. A resposta chega no seu WhatsApp em até 48 horas, seja ela qual for.
3. Se a ${empresa} ficar com uma das vagas, a conversa de início já é marcada na hora.

Não precisa fazer nada até lá. Se quiser adiantar alguma coisa, a unidade de Bragança atende no WhatsApp ${bragancaEscrito}: ${zapBraganca}

Psy Comunic · ${SITE}
Você recebeu este e-mail porque se inscreveu na seleção das 10 empresas, no site da Psy Comunic.`;

  return { assunto, html, texto };
}

/* ================================================================== */
/* 2. Seleção de Bragança: aviso para a agência                       */
/* ================================================================== */

export function avisoDeInscricao({
  nome,
  empresa,
  telefone,
  email,
  instagram,
  nota,
  respostas,
  motivo,
}: {
  nome: string;
  empresa: string;
  telefone: string;
  email: string | null;
  instagram: string | null;
  nota: number;
  respostas: string[];
  motivo: string | null;
}): Modelo {
  const assunto = `Inscrição de Bragança: ${empresa} (${nota}/100)`;
  const zap = `https://wa.me/${telefone.replace(/\D/g, '').replace(/^(?!55)/, '55')}`;

  const corpo = [
    rotulo(`Nota ${nota} de 100`),
    titulo(empresa),
    ficha([
      { rotulo: 'Quem preencheu', valor: esc(nome) },
      {
        rotulo: 'WhatsApp',
        valor: `<a href="${zap}" style="color:${CORES.magentaTexto};text-decoration:none;">${esc(telefone)}</a>`,
      },
      email ? { rotulo: 'E-mail', valor: esc(email) } : { rotulo: '', valor: '' },
      instagram ? { rotulo: 'Instagram', valor: esc(instagram) } : { rotulo: '', valor: '' },
    ]),
    separador(),
    paragrafo(`<strong style="color:${CORES.branco};">As respostas</strong>`),
    paragrafo(
      respostas.map((r) => esc(r)).join('<br>'),
      CORES.cinza,
    ),
    motivo
      ? [
          separador(),
          paragrafo(`<strong style="color:${CORES.branco};">Por que merece a vaga</strong>`),
          paragrafo(esc(motivo)),
        ].join('\n')
      : '',
    botao(`${SITE}/painel/crm`, 'Abrir o funil'),
  ].join('\n');

  const html = casca({
    assunto,
    preheader: `${nome} inscreveu a ${empresa}. Nota ${nota} de 100.`,
    corpo,
    rodape: rodapeInterno('/painel/crm'),
  });

  const texto = `INSCRIÇÃO DE BRAGANÇA · nota ${nota}/100

${empresa}
Quem preencheu: ${nome}
WhatsApp: ${telefone}
${email ? `E-mail: ${email}\n` : ''}${instagram ? `Instagram: ${instagram}\n` : ''}
AS RESPOSTAS
${respostas.join('\n')}
${motivo ? `\nPOR QUE MERECE A VAGA\n${motivo}\n` : ''}
Funil: ${SITE}/painel/crm`;

  return { assunto, html, texto };
}

/* ================================================================== */
/* 3. Formulário de tráfego pago: confirmação para quem pediu análise */
/* ================================================================== */

export function analiseRecebida({
  nome,
  empresa,
}: {
  nome: string;
  empresa: string;
}): Modelo {
  const primeiro = nome.trim().split(/\s+/)[0];
  const assunto = 'Pedido de análise recebido';

  const corpo = [
    rotulo('Tráfego pago'),
    titulo('Pedido recebido.'),
    paragrafo(
      `Olá, ${esc(primeiro)}. O pedido de análise da <strong style="color:${CORES.branco};">${esc(empresa)}</strong> chegou.`,
    ),
    paragrafo(
      'A equipe olha a operação antes de falar com você: o que está anunciando, por onde vêm as vendas hoje e onde o dinheiro está sendo deixado na mesa. Isso leva um pouco mais de tempo que uma resposta automática, e é o que faz a primeira conversa valer a pena.',
    ),
    separador(),
    paragrafo(`<strong style="color:${CORES.branco};">O que acontece agora</strong>`),
    passos([
      'A equipe analisa a sua conta e a sua operação.',
      'O retorno chega em até 48 horas, pelo WhatsApp ou por aqui.',
      'Na conversa, o diagnóstico vem pronto, com número e não com palpite.',
    ]),
    paragrafo('Se preferir adiantar, a Psy Comunic atende no WhatsApp:'),
    botao(zapGeral, 'Falar no WhatsApp'),
  ].join('\n');

  const html = casca({
    assunto,
    preheader: 'A equipe analisa a operação e responde em até 48 horas.',
    corpo,
    rodape: rodapeExterno({
      zap: zapGeral,
      numero: whatsappEscrito,
      porque:
        'Você recebeu este e-mail porque pediu uma análise no site da Psy Comunic.',
    }),
  });

  const texto = `PEDIDO RECEBIDO
Tráfego pago

Olá, ${primeiro}. O pedido de análise da ${empresa} chegou.

A equipe olha a operação antes de falar com você: o que está anunciando, por onde vêm as vendas hoje e onde o dinheiro está sendo deixado na mesa. Isso leva um pouco mais de tempo que uma resposta automática, e é o que faz a primeira conversa valer a pena.

O QUE ACONTECE AGORA
1. A equipe analisa a sua conta e a sua operação.
2. O retorno chega em até 48 horas, pelo WhatsApp ou por aqui.
3. Na conversa, o diagnóstico vem pronto, com número e não com palpite.

WhatsApp ${whatsappEscrito}: ${zapGeral}

Psy Comunic · ${SITE}
Você recebeu este e-mail porque pediu uma análise no site da Psy Comunic.`;

  return { assunto, html, texto };
}

/* ================================================================== */
/* 4. Formulário de tráfego pago: aviso para a agência                */
/* ================================================================== */

export function avisoDeLead({
  nome,
  empresa,
  telefone,
  email,
  observacao,
  origem,
}: {
  nome: string;
  empresa: string;
  telefone: string;
  email: string | null;
  observacao: string;
  origem: string;
}): Modelo {
  const assunto = `Lead novo do site: ${empresa}`;
  const zap = `https://wa.me/${telefone.replace(/\D/g, '').replace(/^(?!55)/, '55')}`;

  const corpo = [
    rotulo(origem),
    titulo(empresa),
    ficha([
      { rotulo: 'Quem preencheu', valor: esc(nome) },
      {
        rotulo: 'WhatsApp',
        valor: `<a href="${zap}" style="color:${CORES.magentaTexto};text-decoration:none;">${esc(telefone)}</a>`,
      },
      email ? { rotulo: 'E-mail', valor: esc(email) } : { rotulo: '', valor: '' },
      { rotulo: 'O que contou', valor: esc(observacao) },
    ]),
    botao(`${SITE}/painel/crm`, 'Abrir o funil'),
  ].join('\n');

  const html = casca({
    assunto,
    preheader: `${nome} pediu análise para a ${empresa}.`,
    corpo,
    rodape: rodapeInterno('/painel/crm'),
  });

  const texto = `LEAD NOVO DO SITE · ${origem}

${empresa}
Quem preencheu: ${nome}
WhatsApp: ${telefone}
${email ? `E-mail: ${email}\n` : ''}
O QUE CONTOU
${observacao}

Funil: ${SITE}/painel/crm`;

  return { assunto, html, texto };
}

/* ================================================================== */
/* 5. Proposta comercial                                              */
/* ================================================================== */

export function propostaPronta({
  cliente,
  contato,
  resumo,
  slug,
  versao,
  diasParaVencer,
}: {
  cliente: string;
  contato: string;
  resumo: string;
  slug: string;
  versao: number;
  diasParaVencer: number;
}): Modelo {
  const primeiro = contato.trim().split(/\s+/)[0];
  const assunto = `Proposta da Psy Comunic para ${cliente}`;
  const url = `${SITE}/proposta/${slug}?v=${versao}`;

  const prazo =
    diasParaVencer > 1
      ? `A proposta vale por ${diasParaVencer} dias.`
      : diasParaVencer === 1
        ? 'A proposta vale até amanhã.'
        : 'A proposta está no último dia de validade.';

  const corpo = [
    rotulo('Proposta comercial'),
    titulo(`Para a ${cliente}.`),
    paragrafo(`Olá, ${esc(primeiro)}. A proposta está pronta e abre pelo link abaixo.`),
    paragrafo(esc(resumo)),
    botao(url, 'Abrir a proposta'),
    miudo(`${esc(prazo)} Qualquer dúvida, é só responder este e-mail.`),
  ].join('\n');

  const html = casca({
    assunto,
    preheader: resumo.slice(0, 140),
    corpo,
    rodape: rodapeExterno({
      zap: zapGeral,
      numero: whatsappEscrito,
      porque: 'Você recebeu este e-mail porque pediu uma proposta à Psy Comunic.',
    }),
  });

  const texto = `PROPOSTA COMERCIAL
Para a ${cliente}

Olá, ${primeiro}. A proposta está pronta e abre por este link:

${url}

${resumo}

${prazo} Qualquer dúvida, é só responder este e-mail.

Psy Comunic · WhatsApp ${whatsappEscrito} · ${SITE}`;

  return { assunto, html, texto };
}

/* ================================================================== */
/* 6. Acesso ao painel                                                */
/* ================================================================== */

/**
 * O acesso foi criado, e a senha NÃO vem neste e-mail.
 *
 * Quem cria o acesso digita a senha no painel, então ela existe e
 * poderia ser escrita aqui. Não é. Senha em caixa de e-mail fica
 * guardada para sempre, passa por servidor de terceiro e vaza junto com
 * a conta de e-mail da pessoa anos depois.
 *
 * Ela é combinada por WhatsApp, que é por onde a conversa já acontece,
 * e este e-mail serve para o que e-mail serve: dizer onde entrar e com
 * qual endereço.
 */
export function acessoCriado({
  nome,
  login,
  papel,
}: {
  nome: string;
  login: string;
  papel: string;
}): Modelo {
  const primeiro = nome.trim().split(/\s+/)[0];
  const assunto = 'Seu acesso ao painel da Psy Comunic';

  const corpo = [
    rotulo('Painel'),
    titulo('O seu acesso está pronto.'),
    paragrafo(`Olá, ${esc(primeiro)}. A Psy Comunic criou o seu acesso ao painel.`),
    ficha([
      { rotulo: 'Endereço de entrada', valor: `${esc(SITE)}/entrar` },
      { rotulo: 'Seu login', valor: esc(login) },
      { rotulo: 'Seu perfil', valor: esc(papel) },
    ]),
    paragrafo(
      'A senha não vai por e-mail de propósito. Ela é combinada direto com quem criou o seu acesso, e depois de entrar você pode trocar quando quiser.',
    ),
    botao(`${SITE}/entrar`, 'Entrar no painel'),
  ].join('\n');

  const html = casca({
    assunto,
    preheader: 'Entre em psycomunic.com.br/entrar com este e-mail.',
    corpo,
    rodape: rodapeExterno({
      zap: zapGeral,
      numero: whatsappEscrito,
      porque: 'Você recebeu este e-mail porque a Psy Comunic criou um acesso para você.',
    }),
  });

  const texto = `PAINEL
O seu acesso está pronto.

Olá, ${primeiro}. A Psy Comunic criou o seu acesso ao painel.

Endereço de entrada: ${SITE}/entrar
Seu login: ${login}
Seu perfil: ${papel}

A senha não vai por e-mail de propósito. Ela é combinada direto com quem criou o seu acesso, e depois de entrar você pode trocar quando quiser.

Psy Comunic · WhatsApp ${whatsappEscrito} · ${SITE}`;

  return { assunto, html, texto };
}

/* ================================================================== */
/* 7. Teste de configuração                                           */
/* ================================================================== */

/**
 * O e-mail que não comunica nada: só prova que o caminho existe.
 *
 * Ele existe porque "a confirmação não chegou" tem quatro causas com o
 * mesmo sintoma: a chave não está no servidor, o domínio não passou no
 * Resend, o remetente é de fora do domínio, ou chegou e caiu em spam.
 * As três primeiras o Resend responde por escrito; a quarta só aparece
 * olhando a caixa. Um envio sob demanda, disparado por quem está no
 * painel, separa as quatro em um clique.
 *
 * Por isso o texto diz, em letras grandes, que é um teste: se ele
 * escapar para a caixa de um cliente algum dia, não vai parecer uma
 * mensagem de verdade mal escrita.
 */
export function testeDeEnvio({ quem }: { quem: string }): Modelo {
  const primeiro = quem.trim().split(/\s+/)[0];
  const assunto = 'Teste de envio do painel da Psy Comunic';

  const corpo = [
    rotulo('Teste'),
    titulo('O envio de e-mail está funcionando.'),
    paragrafo(
      `Olá, ${esc(primeiro)}. Esta mensagem foi disparada do painel para conferir a configuração do Resend, e não é aviso de nada.`,
    ),
    paragrafo(
      'Se ela chegou na caixa de entrada, o caminho inteiro está de pé: a chave no servidor, o domínio verificado e o remetente aceito. Se tiver caído em promoções ou em spam, vale marcar como "não é spam" uma vez, que é o que ensina o filtro.',
      CORES.cinza,
    ),
    separador(),
    paragrafo(
      'Os e-mails de verdade são quatro: a confirmação de quem preenche um formulário, o aviso interno de lead novo, a proposta comercial e o acesso ao painel.',
      CORES.cinza,
    ),
  ].join('\n');

  const html = casca({
    assunto,
    preheader: 'Disparado do painel para conferir a configuração. Não é aviso de nada.',
    corpo,
    rodape: rodapeInterno('/painel/configuracoes'),
  });

  const texto = `TESTE
O envio de e-mail está funcionando.

Olá, ${primeiro}. Esta mensagem foi disparada do painel para conferir a configuração do Resend, e não é aviso de nada.

Se ela chegou na caixa de entrada, o caminho inteiro está de pé: a chave no servidor, o domínio verificado e o remetente aceito. Se tiver caído em promoções ou em spam, vale marcar como "não é spam" uma vez, que é o que ensina o filtro.

Os e-mails de verdade são quatro: a confirmação de quem preenche um formulário, o aviso interno de lead novo, a proposta comercial e o acesso ao painel.

Aviso automático do painel · ${SITE}/painel/configuracoes`;

  return { assunto, html, texto };
}

/* ================================================================== */
/* 8. Relatório de desempenho para o cliente                          */
/* ================================================================== */

export function relatorioPronto({
  cliente,
  contato,
  periodo,
  resumo,
  slug,
  versao,
}: {
  cliente: string;
  contato: string;
  periodo: string;
  resumo: string;
  slug: string;
  versao: number;
}): Modelo {
  const primeiro = (contato.trim().split(/\s+/)[0] || cliente).trim();
  const assuntoBase = `Relatório da Psy Comunic para ${cliente}`;
  const assunto = assuntoBase.length <= 70 ? assuntoBase : `Relatório de desempenho: ${cliente}`.slice(0, 70);
  const url = `${SITE}/relatorio/${slug}?v=${versao}`;
  const resumoLimpo = resumo
    .replace(/—/g, ', ')
    .replace(/R\$\s?[\d.,]+/gi, 'valor registrado no painel')
    .replace(/\bfaturamento\b/gi, 'resultado');

  const corpo = [
    rotulo(`Relatório · ${periodo}`),
    titulo(`Resultados da ${cliente}.`),
    paragrafo(
      `Olá, ${esc(primeiro)}. O relatório referente ao período de <strong style="color:${CORES.branco};">${esc(periodo)}</strong> está publicado e abre pelo link abaixo, inclusive com opção de salvar em PDF.`,
    ),
    resumoLimpo ? paragrafo(esc(resumoLimpo)) : '',
    botao(url, 'Abrir o relatório completo'),
    miudo('Os indicadores detalhados ficam dentro do documento privado. Qualquer dúvida, basta responder este e-mail.'),
  ]
    .filter(Boolean)
    .join('\n');

  const html = casca({
    assunto,
    preheader: `Período ${periodo}. Abra o documento completo e os próximos passos da operação.`,
    corpo,
    rodape: rodapeExterno({
      zap: zapGeral,
      numero: whatsappEscrito,
      porque: 'Você recebeu este e-mail porque acompanha os relatórios de desempenho da Psy Comunic.',
    }),
  });

  const texto = `RELATÓRIO DE DESEMPENHO
Período: ${periodo}
Cliente: ${cliente}

Olá, ${primeiro}. O relatório referente ao período de ${periodo} está publicado e abre por este link:

${url}
${resumoLimpo ? `\n${resumoLimpo}\n` : ''}
Os indicadores detalhados, campanhas e próximos passos ficam dentro do documento privado, com opção de salvar em PDF. Qualquer dúvida, basta responder este e-mail.

Psy Comunic · WhatsApp ${whatsappEscrito} · ${SITE}`;

  return { assunto, html, texto };
}

/* ================================================================== */
/* 9. Alerta interno de saldo baixo nas contas de anúncio             */
/* ================================================================== */

export function avisoSaldoBaixo({
  saldos,
  ehTeste = false,
}: {
  saldos: SaldoContaMidia[];
  ehTeste?: boolean;
}): Modelo {
  const temZerado = saldos.some((s) => s.nivel === 'zerado');
  const assuntoCru = ehTeste
    ? 'Teste de alerta de saldo baixo da Psy Comunic'
    : temZerado
      ? `Urgente: saldo esgotado em ${saldos.length === 1 ? saldos[0].contaNome : `${saldos.length} contas`}`
      : `Alerta de saldo baixo: ${saldos.length === 1 ? saldos[0].contaNome : `${saldos.length} contas`}`;
  const assunto = assuntoCru.replace(/—/g, '-').slice(0, 70);

  const caminhoDestino =
    saldos.length === 1
      ? `/painel/metricas?conta=${encodeURIComponent(saldos[0].contaId)}`
      : '/painel/visao';
  const urlBotao = `${SITE}${caminhoDestino}`;

  if (saldos.length === 0) {
    const corpoVazio = [
      rotulo(ehTeste ? 'Teste · Monitoramento de saldo' : 'Monitoramento de saldo'),
      titulo('Nenhuma conta com saldo crítico.'),
      paragrafo(
        'O disparo automático de alertas de saldo por e-mail está ativo e validado na Psy Comunic. Neste momento todas as contas pré-pagas monitoradas estão com saldo saudável.',
      ),
      botao(`${SITE}/painel/visao`, 'Abrir visão geral do painel'),
    ].join('\n');

    const htmlVazio = casca({
      assunto,
      preheader: 'Monitoramento automático de saldo por e-mail validado com sucesso.',
      corpo: corpoVazio,
      rodape: rodapeInterno('/painel/visao'),
    });

    const textoVazio = `MONITORAMENTO DE SALDO · PSY COMUNIC

Nenhuma conta com saldo crítico neste momento.

O disparo automático de alertas de saldo por e-mail está ativo e validado na Psy Comunic. Quando alguma conta pré-paga ficar abaixo do piso configurado ou com menos de 3 dias de autonomia, o aviso chega automaticamente nesta caixa.

Painel: ${SITE}/painel/visao`;

    return { assunto, html: htmlVazio, texto: textoVazio };
  }

  const blocosHtml = saldos
    .map((s) => {
      const limpoConta = s.contaNome.replace(/—/g, '-');
      const limpoAd = s.adAccountNome.replace(/—/g, '-');
      const situacaoTxt =
        s.nivel === 'zerado'
          ? 'Saldo esgotado (risco imediato de pausa)'
          : s.nivel === 'critico'
            ? 'Saldo crítico (providenciar recarga)'
            : 'Acompanhamento de saldo';
      const valor = dinheiroExato(s.saldoDisponivel ?? 0);
      const autonomia =
        s.diasRestantes !== null
          ? `Cerca de ${s.diasRestantes.toFixed(1).replace('.', ',')} dias restantes no ritmo de ${dinheiroExato(s.gastoMedioDiario)}/dia`
          : `Gasto médio recente: ${dinheiroExato(s.gastoMedioDiario)}/dia`;

      return [
        ficha([
          { rotulo: 'Cliente', valor: `<strong style="color:${CORES.branco};">${esc(limpoConta)}</strong>` },
          { rotulo: 'Conta Meta Ads', valor: esc(limpoAd) },
          {
            rotulo: 'Saldo disponível',
            valor: `<strong style="color:${CORES.magentaTexto};">${esc(valor)}</strong> · ${esc(situacaoTxt)}`,
          },
          { rotulo: 'Autonomia estimada', valor: esc(autonomia) },
        ]),
      ].join('\n');
    })
    .join(`\n${separador()}\n`);

  const corpo = [
    rotulo(ehTeste ? 'Teste · Alerta de saldo baixo' : 'Operação · Alerta de saldo baixo'),
    titulo(
      temZerado
        ? 'Há conta de anúncio sem saldo disponível.'
        : 'Saldo baixo identificado nas contas de mídia.',
    ),
    paragrafo(
      ehTeste
        ? 'Este é um disparo de teste com a leitura real das contas pré-pagas conectadas hoje na Psy Comunic.'
        : 'O monitoramento automático da Psy Comunic identificou saldo abaixo do limite de segurança nas contas abaixo. Solicite recarga via PIX ou boleto para evitar interrupção na entrega das campanhas.',
    ),
    separador(),
    blocosHtml,
    separador(),
    botao(urlBotao, saldos.length === 1 ? 'Abrir métricas desta conta' : 'Conferir saldos no painel'),
  ].join('\n');

  const html = casca({
    assunto,
    preheader: `${saldos[0].contaNome.replace(/—/g, '-')}: saldo em ${dinheiroExato(saldos[0].saldoDisponivel ?? 0)}.`,
    corpo,
    rodape: rodapeInterno(caminhoDestino),
  });

  const blocosTexto = saldos
    .map((s) => {
      const limpoConta = s.contaNome.replace(/—/g, '-');
      const limpoAd = s.adAccountNome.replace(/—/g, '-');
      const valor = dinheiroExato(s.saldoDisponivel ?? 0);
      const autonomia =
        s.diasRestantes !== null
          ? `Cerca de ${s.diasRestantes.toFixed(1).replace('.', ',')} dias restantes (${dinheiroExato(s.gastoMedioDiario)}/dia)`
          : `Gasto médio: ${dinheiroExato(s.gastoMedioDiario)}/dia`;
      return [
        `Cliente: ${limpoConta}`,
        `Conta Meta Ads: ${limpoAd}`,
        `Saldo disponível: ${valor}`,
        `Autonomia: ${autonomia}`,
      ].join('\n');
    })
    .join('\n\n');

  const texto = `${ehTeste ? 'TESTE · ' : ''}ALERTA DE SALDO BAIXO · PSY COMUNIC

${ehTeste ? 'Disparo de teste com os dados reais das contas conectadas hoje.' : 'O monitoramento automático identificou saldo abaixo do limite de segurança nas contas abaixo. Solicite recarga via PIX ou boleto para evitar pausa nas campanhas.'}

${blocosTexto}

Conferir no painel: ${urlBotao}`;

  return { assunto, html, texto };
}
