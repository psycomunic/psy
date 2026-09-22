import { criteriosDeLancamento } from '@/conteudo/jornada';
import type { EtapaCusto } from '@/dados/propostas';
import { Slide, Bloco } from './Slide';

/**
 * Quanto o cliente vai gastar, com a conta feita, por período.
 *
 * ============================================================
 * POR QUE A CONTA VEM PRONTA
 * ============================================================
 * Proposta que informa "fee de R$ 4.000" num slide e "R$ 100 por dia"
 * em outro obriga o cliente a multiplicar, somar e adivinhar se as duas
 * começam no mesmo mês. Ele faz essa conta de qualquer jeito, só que
 * sozinho, na cabeça e com pressa. Se errar para mais, a proposta morre
 * por um número que não é o nosso.
 *
 * ============================================================
 * POR QUE POR PERÍODO, E NÃO UMA MENSALIDADE SÓ
 * ============================================================
 * Negociação de e-commerce novo quase nunca é valor fixo: o fee entra
 * menor enquanto a loja é construída, segura mais um mês na estreia
 * para sobrar verba de anúncio, e volta ao valor do plano quando a
 * operação começa a se pagar.
 *
 * Cada etapa carrega o PORQUÊ do valor. Desconto sem motivo escrito
 * vira preço normal na cabeça do cliente, e o aumento seguinte vira
 * surpresa — que é como uma boa condição comercial se transforma em
 * atrito no quarto mês.
 *
 * ============================================================
 * FEE E VERBA NUNCA VIRAM UM NÚMERO SÓ
 * ============================================================
 * Eles somam para dizer o desembolso do mês, e é isso que o cliente
 * precisa saber. Mas aparecem sempre separados, porque são dinheiros de
 * donos diferentes: o fee é receita da Psy Comunic, e a verba vai
 * direto para o Google e para a Meta. Apresentar "R$ 8.000 para a
 * agência" seria falso.
 */

const reais = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

/* 30 dias, e não o mês do calendário. Campanha roda por dia, e o mês
   de 28 contra o de 31 mudaria o número de fevereiro para março. */
const DIAS_DO_MES = 30;

const faixa = (a: number, b: number) => (a === b ? reais(a) : `${reais(a)} a ${reais(b)}`);

export function SlideCusto({
  etapas,
  notaPlataforma,
}: {
  etapas: EtapaCusto[];
  notaPlataforma: string | null;
}) {
  return (
    <Slide
      rotulo="Investimento"
      titulo={
        <>
          Quanto você vai <span className="text-magenta-texto">gastar por mês.</span>
        </>
      }
      apoio="A conta inteira, já somada. O fee é da Psy Comunic; a verba de anúncio vai direto para o Google e para a Meta e não passa por nós."
    >
      <div
        className={
          'mt-2 grid gap-4 ' +
          (etapas.length >= 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2')
        }
      >
        {etapas.map((e) => {
          const midiaMin = e.midiaMinDia * DIAS_DO_MES;
          const midiaMax = e.midiaMaxDia * DIAS_DO_MES;
          const temMidia = midiaMax > 0;

          return (
            <Bloco key={e.rotulo} destaque={e.destaque} className="flex h-full flex-col">
              <p
                className={
                  'font-mono text-[0.7rem] uppercase leading-relaxed tracking-[0.14em] ' +
                  (e.destaque ? 'text-magenta-texto' : 'text-cinza')
                }
              >
                {e.rotulo}
                <span className="text-cinza"> · {e.nota}</span>
              </p>

              {/* Sem fee definido não existe total, e inventar um seria
                  pior que não mostrar. O que se sabe do período é a
                  verba, então é ela que aparece grande. */}
              <p className="tabular mt-4 font-display text-3xl font-extrabold leading-[1.05] tracking-[-0.045em] text-branco">
                {e.fee === null
                  ? temMidia
                    ? faixa(midiaMin, midiaMax)
                    : (e.feeTexto ?? 'A combinar')
                  : faixa(e.fee + midiaMin, e.fee + midiaMax)}
                <span className="ml-1.5 text-sm font-normal text-cinza">
                  {e.fee === null ? '/mês de verba' : '/mês'}
                </span>
              </p>

              {e.fee === null ? (
                <p className="mt-1.5 text-xs leading-relaxed text-magenta-texto">
                  mais o fee, a combinar
                </p>
              ) : null}

              <dl className="mt-5 space-y-3 border-t border-fio pt-5 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-cinza">Fee da Psy Comunic</dt>
                  <dd className="tabular flex-none text-neve">
                    {e.fee === null ? (e.feeTexto ?? 'A combinar') : reais(e.fee)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-cinza">
                    Verba de anúncio
                    {temMidia ? (
                      <span className="mt-0.5 block text-xs text-cinza/80">
                        {faixa(e.midiaMinDia, e.midiaMaxDia)} por dia
                      </span>
                    ) : null}
                  </dt>
                  <dd className="tabular flex-none text-neve">
                    {temMidia ? faixa(midiaMin, midiaMax) : reais(0)}
                  </dd>
                </div>
              </dl>

              <p className="mt-auto pt-5 text-xs leading-relaxed text-cinza">{e.explicacao}</p>
            </Bloco>
          );
        })}
      </div>

      {notaPlataforma ? (
        <Bloco className="mt-4">
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-cinza">
            Fora dessa conta · plataforma
          </p>
          <p className="mt-3 text-sm leading-relaxed text-neve">{notaPlataforma}</p>
        </Bloco>
      ) : null}
    </Slide>
  );
}

/**
 * Quando a verba começa a ser gasta.
 *
 * Slide próprio porque "após o lançamento" sozinho é data que ninguém
 * consegue cobrar. A lista transforma o marco em algo verificável: o
 * cliente sabe o que espera receber antes de pagar o primeiro real de
 * anúncio, e a agência sabe onde a montagem termina.
 */
export function SlideLancamento({ prazoTexto }: { prazoTexto: string | null }) {
  return (
    <Slide
      rotulo="Início da operação"
      titulo={
        <>
          A verba só começa{' '}
          <span className="text-magenta-texto">quando tudo estiver pronto.</span>
        </>
      }
      apoio="Nenhum real de anúncio é gasto antes desta lista inteira estar fechada. Antes disso não existe para onde mandar tráfego."
    >
      <ul className="mt-2 grid gap-3 sm:grid-cols-2">
        {criteriosDeLancamento.map((c, i) => (
          <li key={c}>
            <Bloco className="flex h-full items-center gap-4">
              <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-magenta/15 font-mono text-[0.7rem] font-semibold text-magenta-texto">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="min-w-0 text-sm leading-snug text-neve">{c}</span>
            </Bloco>
          </li>
        ))}
      </ul>

      {prazoTexto ? (
        <p className="mt-6 rounded-2xl border border-fio bg-white/[0.03] p-5 text-sm leading-relaxed text-neve">
          O prazo é de{' '}
          <strong className="font-semibold text-branco">{prazoTexto}</strong>. Pode ficar
          pronto antes, e a intenção é essa. O prazo maior está aqui para caber imprevisto
          de catálogo e de integração, que é onde loja nova costuma atrasar.
        </p>
      ) : null}
    </Slide>
  );
}

/**
 * O que esta proposta dá além do plano.
 *
 * Concessão só vale se o cliente souber que foi concessão. Escrita com
 * o plano de onde ela vem e o motivo dela, vira argumento; escondida no
 * meio da lista, vira expectativa de que já era assim.
 */
export function SlideInclusoes({ itens }: { itens: string[] }) {
  return (
    <Slide
      rotulo="Nesta proposta"
      titulo={
        <>
          O que vai <span className="text-magenta-texto">além do plano.</span>
        </>
      }
      apoio="Entregas de um plano superior, incluídas aqui sem custo adicional."
    >
      <ul className="mt-2 grid gap-3">
        {itens.map((item) => (
          <li key={item}>
            <Bloco destaque className="flex gap-4">
              <span aria-hidden className="mt-0.5 flex-none text-lg leading-none text-magenta-texto">
                +
              </span>
              <span className="text-sm leading-relaxed text-neve sm:text-[1rem]">{item}</span>
            </Bloco>
          </li>
        ))}
      </ul>
    </Slide>
  );
}
