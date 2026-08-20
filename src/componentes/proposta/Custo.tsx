import { fichas, type Plano } from '@/dados/planos';
import { criteriosDeLancamento } from '@/conteudo/jornada';
import { Slide, Bloco } from './Slide';

/**
 * Quanto o cliente vai gastar, com a conta feita.
 *
 * ============================================================
 * POR QUE A CONTA VEM PRONTA
 * ============================================================
 * Proposta que informa "fee de R$ 5.000" e "verba de R$ 100 por dia"
 * em lugares diferentes obriga o cliente a multiplicar, somar e
 * adivinhar se as duas começam no mesmo mês. Ele faz essa conta de
 * qualquer jeito, só que sozinho, na cabeça e com pressa. Se ele errar
 * para mais, a proposta morre por um número que não é o nosso.
 *
 * Então a conta sai feita, por período, com o total de cada um.
 *
 * ============================================================
 * FEE E VERBA NUNCA VIRAM UM NÚMERO SÓ
 * ============================================================
 * Eles somam para dizer o desembolso do mês, e é isso que o cliente
 * precisa saber. Mas aparecem sempre separados na mesma linha, porque
 * são dinheiros de donos diferentes: o fee é receita da Psy Comunic, e
 * a verba vai direto para o Google e para a Meta, sem passar pela
 * agência. Apresentar "R$ 8.000 para a agência" seria falso.
 */

const reais = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

/* 30 dias, e não o mês do calendário. Campanha roda por dia, e o mês
   de 28 contra o de 31 mudaria o número de novembro para dezembro. */
const DIAS_DO_MES = 30;

export function SlideCusto({
  plano,
  midia,
  implantacao,
  notaPlataforma,
}: {
  plano: Plano;
  midia: { minDia: number; maxDia: number };
  implantacao: { de: number; ate: number } | null;
  notaPlataforma: string | null;
}) {
  const fee = fichas[plano].fee;
  const midiaMin = midia.minDia * DIAS_DO_MES;
  const midiaMax = midia.maxDia * DIAS_DO_MES;

  const faixa = (a: number, b: number) => (a === b ? reais(a) : `${reais(a)} a ${reais(b)}`);

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
      <div className="mt-2 grid gap-4 lg:grid-cols-2">
        {/* Período de implantação: só o fee. */}
        {implantacao ? (
          <Bloco className="flex h-full flex-col">
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-cinza">
              {implantacao.de === implantacao.ate
                ? `Mês ${implantacao.de}`
                : `Meses ${implantacao.de} a ${implantacao.ate}`}{' '}
              · montagem da loja
            </p>

            <p className="tabular mt-4 font-display text-4xl font-extrabold tracking-[-0.045em] text-branco">
              {reais(fee)}
              <span className="ml-1.5 text-sm font-normal text-cinza">/mês</span>
            </p>

            <dl className="mt-5 space-y-2.5 border-t border-fio pt-5 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-cinza">Fee da Psy Comunic</dt>
                <dd className="tabular text-neve">{reais(fee)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-cinza">Verba de anúncio</dt>
                <dd className="tabular text-neve">{reais(0)}</dd>
              </div>
            </dl>

            <p className="mt-auto pt-5 text-xs leading-relaxed text-cinza">
              Zero de anúncio aqui, e não é desconto: é que a loja ainda não está no ar.
              Não se compra tráfego para uma página que não vende.
            </p>
          </Bloco>
        ) : null}

        {/* Depois do lançamento: fee mais verba. */}
        <Bloco destaque className="flex h-full flex-col">
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-magenta-texto">
            {implantacao ? `A partir do mês ${implantacao.ate + 1}` : 'Todo mês'} · loja no ar
          </p>

          <p className="tabular mt-4 font-display text-4xl font-extrabold leading-[1.05] tracking-[-0.045em] text-branco">
            {faixa(fee + midiaMin, fee + midiaMax)}
            <span className="ml-1.5 text-sm font-normal text-cinza">/mês</span>
          </p>

          <dl className="mt-5 space-y-2.5 border-t border-fio pt-5 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-cinza">Fee da Psy Comunic</dt>
              <dd className="tabular text-neve">{reais(fee)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-cinza">
                Verba de anúncio
                <span className="mt-0.5 block text-xs text-cinza/80">
                  {faixa(midia.minDia, midia.maxDia)} por dia
                </span>
              </dt>
              <dd className="tabular text-neve">{faixa(midiaMin, midiaMax)}</dd>
            </div>
          </dl>

          <p className="mt-auto pt-5 text-xs leading-relaxed text-cinza">
            A verba é sua e fica na sua conta de anúncio, no seu nome. A Psy Comunic
            opera, e não fatura nada em cima dela.
          </p>
        </Bloco>
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
export function SlideLancamento({
  implantacao,
}: {
  implantacao: { de: number; ate: number } | null;
}) {
  return (
    <Slide
      rotulo="Início da operação"
      titulo={
        <>
          A verba só começa <span className="text-magenta-texto">quando tudo estiver pronto.</span>
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

      {implantacao ? (
        <p className="mt-6 rounded-2xl border border-fio bg-white/[0.03] p-5 text-sm leading-relaxed text-neve">
          O prazo é de{' '}
          <strong className="font-semibold text-branco">
            {implantacao.de} a {implantacao.ate}{' '}
            {implantacao.ate === 1 ? 'mês' : 'meses'}
          </strong>
          . Pode ficar pronto antes, e a intenção é essa. O prazo maior está aqui para
          caber imprevisto de catálogo e de integração, que é onde loja nova costuma
          atrasar.
        </p>
      ) : null}
    </Slide>
  );
}

/**
 * O que esta proposta dá além do plano.
 *
 * Concessão só vale se o cliente souber que foi concessão. Escrita ao
 * lado do plano de onde ela vem, ela vira argumento; escondida no meio
 * da lista, vira expectativa de que já era assim.
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
              <span aria-hidden className="mt-0.5 flex-none text-magenta-texto">
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
