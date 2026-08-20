/**
 * Datas no fuso da operação.
 *
 * O servidor roda em UTC, e o banco também. Às 21h de Brasília, um
 * `new Date().toISOString().slice(0,10)` já devolve o dia SEGUINTE — e
 * é justamente o horário em que rotina de madrugada roda, o que faria a
 * sincronização pedir à API um dia que ainda não aconteceu.
 *
 * É o mesmo problema que `public.hoje()` resolve do lado do banco, e as
 * duas precisam concordar: se discordassem, a rotina buscaria um
 * intervalo e o banco recusaria a gravação por "dia no futuro".
 *
 * O Brasil não tem mais horário de verão desde 2019, então o
 * deslocamento fixo de três horas está certo e continua certo. No dia
 * em que voltar, este arquivo é o único lugar a mudar.
 */

const HORAS_ATRAS_DE_UTC = 3;

/** O dia corrente em São Paulo, no formato aaaa-mm-dd. */
export function hojeBR(agora: Date = new Date()): string {
  const deslocado = new Date(agora.getTime() - HORAS_ATRAS_DE_UTC * 60 * 60 * 1000);
  return deslocado.toISOString().slice(0, 10);
}

/**
 * Soma (ou subtrai) dias de uma data aaaa-mm-dd.
 *
 * Aritmética em UTC de propósito: somar 24 horas a um `Date` local
 * erraria na virada de fuso, e aqui só interessa o calendário.
 */
export function somarDias(dia: string, n: number): string {
  const [a, m, d] = dia.split('-').map(Number);
  const dt = new Date(Date.UTC(a, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}

/**
 * A janela que a rotina pede à API.
 *
 * Termina ONTEM, e não hoje. Dia em andamento chega pela metade, e meio
 * dia de receita no fim da série desenha uma queda que não existe —
 * quem olha o gráfico às 10h da manhã vê a conta despencando. O dado de
 * hoje entra amanhã, inteiro.
 *
 * Começa `janelaDias` atrás porque pedido aprovado muda de status
 * depois do fato: boleto pago no terceiro dia, cartão liberado no
 * segundo. Buscar só ontem congelaria a taxa de aprovação num número
 * que ainda ia mudar.
 */
export function janela(janelaDias: number, agora: Date = new Date()) {
  const ate = somarDias(hojeBR(agora), -1);
  const de = somarDias(ate, -(Math.max(1, janelaDias) - 1));
  return { de, ate };
}
