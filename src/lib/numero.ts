/**
 * Texto digitado por gente → número.
 *
 * Quem preenche meta digita como fala: "320.000", "320.000,50",
 * "R$ 320 mil". E planilha exportada de Excel em português vem no mesmo
 * formato. A regra que desempata os dois padrões:
 *
 *   O último separador é DECIMAL só quando sobram 1 ou 2 dígitos
 *   depois dele. Com 3, é separador de milhar.
 *
 * Sem essa condição, "320.000" vira 320 — meta mil vezes menor, gravada
 * sem erro nenhum. Foi exatamente o que a primeira versão fazia, e só
 * apareceu quando testei os formatos de verdade.
 *
 * Mora sozinha neste arquivo porque dois caminhos diferentes dependem
 * dela: o formulário de meta e a importação de planilha. Deixá-la no
 * módulo de validação obrigaria o leitor de CSV a arrastar o Zod junto.
 */
export function paraNumero(entrada: string): number {
  const limpo = entrada.replace(/[^\d,.-]/g, '');
  if (limpo === '') return NaN;

  const ultimaVirgula = limpo.lastIndexOf(',');
  const ultimoPonto = limpo.lastIndexOf('.');
  const posSeparador = Math.max(ultimaVirgula, ultimoPonto);

  if (posSeparador === -1) return Number(limpo);

  const digitosDepois = limpo.length - posSeparador - 1;

  /* 3 dígitos depois = milhar. "320.000" e "1.234.567" caem aqui. */
  if (digitosDepois === 3) return Number(limpo.replace(/[.,]/g, ''));

  const separadorDecimal = ultimaVirgula > ultimoPonto ? ',' : '.';
  const outro = separadorDecimal === ',' ? '.' : ',';

  return Number(
    limpo.split(outro).join('').replace(separadorDecimal, '.'),
  );
}
