/**
 * A casca HTML de todo e-mail que sai daqui.
 *
 * ============================================================
 * POR QUE TABELA E ESTILO EM CADA TAG
 * ============================================================
 * Não é desleixo nem código antigo. O Outlook no Windows renderiza
 * e-mail com o motor do Word, que não conhece flexbox, grid nem
 * `border-radius` em div. O Gmail apaga a tag `<style>` inteira em
 * parte dos clientes, então regra em folha de estilo é regra que pode
 * simplesmente não existir na hora da leitura.
 *
 * Tabela com estilo em cada célula é o único layout que chega igual nos
 * dois. Vale para e-mail e só para e-mail: nada disso encosta no site.
 *
 * ============================================================
 * A LOGO É TEXTO, DE PROPÓSITO
 * ============================================================
 * As três logos deste projeto são SVG, e e-mail não renderiza SVG: o
 * Gmail descarta, e o Outlook mostra o ícone de imagem quebrada. PNG
 * resolveria o formato e não resolveria o resto, porque quase todo
 * cliente bloqueia imagem até a pessoa clicar em "exibir", e aí o
 * cabeçalho da marca é um retângulo vazio.
 *
 * Então a assinatura visual é tipográfica: o nome em caixa alta, com o
 * magenta da marca e o espaçamento da identidade. Chega sempre, em
 * qualquer cliente, com imagem bloqueada ou não.
 *
 * ============================================================
 * O MAGENTA DO TEXTO NÃO É O MAGENTA DO BOTÃO
 * ============================================================
 * Mesma regra do site, pelo mesmo motivo de contraste: #E4155F sobre o
 * marinho dá 3.4:1 e reprova na WCAG para texto. Texto usa #FF6B96,
 * botão usa #E4155F com letra branca. Ver `src/app/globals.css`.
 */

export const CORES = {
  fundo: '#0B1730',
  cartao: '#101F3F',
  borda: '#1A2E56',
  magenta: '#E4155F',
  magentaTexto: '#FF6B96',
  branco: '#FFFFFF',
  neve: '#E8ECF5',
  cinza: '#93A0BC',
} as const;

const FONTE =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

/**
 * Escapa o que a pessoa digitou.
 *
 * O nome, a empresa e o texto livre do formulário entram no HTML do
 * aviso interno. Sem escapar, um `<` no meio de uma frase quebra o
 * layout do e-mail, e um bloco de HTML colado no campo "por que merece
 * a vaga" vira conteúdo renderizado dentro da caixa de quem lê.
 *
 * Não é o mesmo risco de uma página, porque cliente de e-mail não roda
 * script. Continua sendo conteúdo de estranho desenhando a tela de
 * quem abriu.
 */
export function esc(valor: string | null | undefined): string {
  return String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function paragrafo(html: string, cor: string = CORES.neve) {
  return `<p style="margin:0 0 18px;font:400 16px/1.65 ${FONTE};color:${cor};">${html}</p>`;
}

export function titulo(texto: string) {
  return `<h1 style="margin:0 0 20px;font:300 28px/1.15 ${FONTE};color:${CORES.branco};letter-spacing:-0.02em;">${esc(texto)}</h1>`;
}

export function rotulo(texto: string) {
  return `<p style="margin:0 0 14px;font:700 11px/1 ${FONTE};letter-spacing:0.16em;text-transform:uppercase;color:${CORES.magentaTexto};">${esc(texto)}</p>`;
}

/** Lista numerada, desenhada à mão: `<ol>` sai com recuo diferente em cada cliente. */
export function passos(itens: string[]) {
  const linhas = itens
    .map(
      (t, i) => `
      <tr>
        <td width="30" valign="top" style="padding:0 0 12px;font:700 15px/1.6 ${FONTE};color:${CORES.magentaTexto};">${i + 1}.</td>
        <td valign="top" style="padding:0 0 12px;font:400 15px/1.6 ${FONTE};color:${CORES.neve};">${t}</td>
      </tr>`,
    )
    .join('');
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 22px;">${linhas}</table>`;
}

/** Ficha de dados: rótulo em cima, valor embaixo. Usada nos avisos internos. */
export function ficha(campos: { rotulo: string; valor: string }[]) {
  const linhas = campos
    .filter((c) => c.valor)
    .map(
      (c) => `
      <tr>
        <td style="padding:0 0 14px;">
          <span style="display:block;font:700 10px/1 ${FONTE};letter-spacing:0.14em;text-transform:uppercase;color:${CORES.cinza};">${esc(c.rotulo)}</span>
          <span style="display:block;margin-top:4px;font:400 15px/1.5 ${FONTE};color:${CORES.neve};">${c.valor}</span>
        </td>
      </tr>`,
    )
    .join('');
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:4px 0 8px;">${linhas}</table>`;
}

/**
 * Botão que sobrevive ao Outlook.
 *
 * O `<a>` com padding é o que funciona em quase tudo; a tabela em volta
 * é o que dá área clicável no resto. Sem a célula com cor de fundo, o
 * botão aparece como link sublinhado no Outlook antigo, que ainda é o
 * cliente de muita empresa.
 */
export function botao(url: string, texto: string) {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 10px;">
    <tr>
      <td align="center" bgcolor="${CORES.magenta}" style="border-radius:999px;">
        <a href="${esc(url)}" style="display:inline-block;padding:15px 30px;font:700 15px/1 ${FONTE};color:${CORES.branco};text-decoration:none;border-radius:999px;">${esc(texto)}</a>
      </td>
    </tr>
  </table>`;
}

export function separador() {
  return `<div style="height:1px;background:${CORES.borda};margin:26px 0;"></div>`;
}

export function miudo(html: string) {
  return `<p style="margin:0 0 6px;font:400 13px/1.6 ${FONTE};color:${CORES.cinza};">${html}</p>`;
}

/**
 * Monta a página.
 *
 * O `preheader` é a linha que a caixa de entrada mostra ao lado do
 * assunto. Sem ele, o cliente pega as primeiras palavras do HTML, que
 * costumam ser lixo de layout. A div fica escondida por três
 * propriedades porque nenhuma funciona em todos os clientes sozinha.
 */
export function casca({
  assunto,
  preheader,
  corpo,
  rodape,
}: {
  assunto: string;
  preheader: string;
  corpo: string;
  rodape: string;
}) {
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark light">
<meta name="supported-color-schemes" content="dark light">
<title>${esc(assunto)}</title>
</head>
<body style="margin:0;padding:0;width:100%;background:${CORES.fundo};-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${CORES.fundo};">
  <tr>
    <td align="center" style="padding:32px 16px 40px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:100%;max-width:600px;">
        <tr>
          <td style="padding:0 4px 22px;">
            <span style="font:700 14px/1 ${FONTE};letter-spacing:0.2em;text-transform:uppercase;color:${CORES.magentaTexto};">Psy&nbsp;Comunic</span>
          </td>
        </tr>
        <tr>
          <td style="background:${CORES.cartao};border:1px solid ${CORES.borda};border-radius:20px;padding:36px 32px 30px;">
${corpo}
          </td>
        </tr>
        <tr>
          <td style="padding:22px 6px 0;">
${rodape}
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}
