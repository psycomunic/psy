import Link from 'next/link';
import {
  fichaDaConta,
  contratosDaConta,
  interacoesDaConta,
  marcosDaConta,
  serieDaConta,
} from '@/lib/dados/consultas';
import { AvisoProcedencia, Secao, Kpi } from '../base';
import { FormInteracao } from '../FormInteracao';
import { rotuloSituacaoConta } from '@/lib/dados/tipos';
import { dinheiro, dinheiroCurto, vezes, diaLongo, numero } from '@/lib/formato';
import { CORES_SITUACAO } from '../paleta';
import { mer } from '@/lib/dominio/metricas';
import type { Papel } from '@/lib/papeis';

/**
 * Ficha da loja, em abas.
 *
 * As abas são LINKS, e não estado de componente. Assim cada aba tem URL
 * própria: dá para mandar "olha a aba de contrato da Loja Aurora" no
 * WhatsApp, e o botão voltar do navegador funciona.
 */
const ABAS = [
  { k: 'resumo', r: 'Resumo' },
  { k: 'diario', r: 'Diário de bordo' },
  { k: 'contrato', r: 'Contrato' },
] as const;

type Aba = (typeof ABAS)[number]['k'];

/** Aba vinda da URL. Valor desconhecido cai no resumo, e não em erro:
    link velho ou digitado errado não deve virar tela quebrada. */
export function abaDaUrl(v: string | undefined): Aba {
  return ABAS.some((a) => a.k === v) ? (v as Aba) : 'resumo';
}

/** Faixa do health score. Cor com FORMA e TEXTO, nunca cor sozinha. */
function faixa(n: number | null) {
  if (n === null) return { cor: CORES_SITUACAO.sem_dado, rotulo: 'sem nota', forma: '—' };
  if (n >= 80) return { cor: CORES_SITUACAO.saudavel, rotulo: 'saudável', forma: '●' };
  if (n >= 55) return { cor: CORES_SITUACAO.atencao, rotulo: 'atenção', forma: '▲' };
  return { cor: CORES_SITUACAO.critico, rotulo: 'risco', forma: '■' };
}

export async function Ficha({
  contaId,
  aba = 'resumo',
  papel,
}: {
  contaId: string;
  aba?: Aba;
  papel: Papel;
}) {
  const { dados: conta, procedencia } = await fichaDaConta(contaId);

  if (!conta) {
    return (
      <>
        <AvisoProcedencia procedencia={procedencia} />
        <p className="cartao mt-8 p-8 text-cinza">
          Loja não encontrada, ou fora do seu acesso.
        </p>
        <p className="mt-6">
          <Link href="/painel/contas" className="text-sm font-semibold text-magenta-texto">
            ← Voltar para a carteira
          </Link>
        </p>
      </>
    );
  }

  const f = faixa(conta.pontuacao);
  const podeRegistrar = ['administrador', 'gestor', 'operador', 'comercial'].includes(papel);

  return (
    <>
      <AvisoProcedencia procedencia={procedencia} />

      <p className="mt-6">
        <Link href="/painel/contas" className="text-sm text-cinza transition-colors hover:text-neve">
          ← Carteira
        </Link>
      </p>

      <header className="mt-4 flex flex-wrap items-start justify-between gap-6">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-[-0.035em]">
            {conta.nome}
          </h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[0.64rem] uppercase tracking-[0.14em] text-cinza">
            <span>{rotuloSituacaoConta[conta.situacao]}</span>
            {conta.plataforma ? <span>· {conta.plataforma}</span> : null}
            {conta.responsavel ? <span>· {conta.responsavel}</span> : null}
            {conta.dataInicio ? <span>· desde {diaLongo(conta.dataInicio)}</span> : null}
          </p>
        </div>

        {/* Health score com a razão junto: nota sem motivo obriga a
            procurar o que houve, e é esse tempo que ela deveria poupar. */}
        <div className="cartao min-w-[13rem] p-5">
          <p className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-cinza">
            Health score
          </p>
          <p className="tabular mt-2 flex items-baseline gap-2">
            <span
              className="font-display text-3xl font-extrabold tracking-[-0.04em]"
              style={{ color: f.cor }}
            >
              {conta.pontuacao ?? '—'}
            </span>
            <span className="text-xs" style={{ color: f.cor }}>
              <span aria-hidden className="mr-1">{f.forma}</span>
              {f.rotulo}
            </span>
          </p>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full"
              style={{ width: `${conta.pontuacao ?? 0}%`, background: f.cor }}
            />
          </div>
        </div>
      </header>

      {/* O que está descontando pontos, em texto */}
      <ul className="mt-6 flex flex-wrap gap-2">
        {conta.tarefasAtrasadas > 0 ? (
          <li className="rounded-full border border-fio bg-white/[0.03] px-4 py-2 text-xs text-neve">
            {conta.tarefasAtrasadas}{' '}
            {conta.tarefasAtrasadas === 1 ? 'tarefa atrasada' : 'tarefas atrasadas'}
          </li>
        ) : null}
        {conta.inadimplencia > 0 ? (
          <li className="rounded-full border border-fio bg-white/[0.03] px-4 py-2 text-xs text-neve">
            {dinheiro(conta.inadimplencia)} vencido e não pago
          </li>
        ) : null}
        {conta.diasSemRegistro !== null && conta.diasSemRegistro > 14 ? (
          <li className="rounded-full border border-fio bg-white/[0.03] px-4 py-2 text-xs text-neve">
            {conta.diasSemRegistro} dias sem registro no diário
          </li>
        ) : null}
        {conta.tarefasAtrasadas === 0 &&
        conta.inadimplencia === 0 &&
        (conta.diasSemRegistro === null || conta.diasSemRegistro <= 14) ? (
          <li className="rounded-full border border-fio bg-white/[0.03] px-4 py-2 text-xs text-cinza">
            Nada descontando pontos.
          </li>
        ) : null}
      </ul>

      <nav aria-label="Abas da ficha" className="mt-8 flex flex-wrap gap-2 border-b border-fio pb-4">
        {ABAS.map((a) => (
          <Link
            key={a.k}
            href={`/painel/contas?ficha=${conta.id}&aba=${a.k}`}
            aria-current={aba === a.k ? 'page' : undefined}
            className={
              'rounded-full px-4 py-2 text-sm transition-colors ' +
              (aba === a.k
                ? 'bg-magenta font-semibold text-branco'
                : 'border border-fio text-neve hover:bg-white/5')
            }
          >
            {a.r}
          </Link>
        ))}
        <Link
          href={`/painel/metricas?conta=${conta.id}`}
          className="rounded-full border border-fio px-4 py-2 text-sm text-neve transition-colors hover:bg-white/5"
        >
          Métricas →
        </Link>
      </nav>

      <div className="mt-8">
        {aba === 'resumo' ? <AbaResumo contaId={conta.id} /> : null}
        {aba === 'diario' ? (
          <AbaDiario contaId={conta.id} podeRegistrar={podeRegistrar} />
        ) : null}
        {aba === 'contrato' ? <AbaContrato contaId={conta.id} papel={papel} /> : null}
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */

async function AbaResumo({ contaId }: { contaId: string }) {
  const { dados: serie } = await serieDaConta(contaId, 30);

  const ult7 = serie.slice(-7);
  const soma = (k: 'receita' | 'investimento' | 'pedidosAprovados') =>
    ult7.reduce((s, d) => s + d[k], 0);

  const receita = soma('receita');
  const investimento = soma('investimento');

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Kpi rotulo="Receita, 7 dias" valor={dinheiroCurto(receita)} />
      <Kpi rotulo="Verba, 7 dias" valor={dinheiroCurto(investimento)} />
      {/* MER pela função de domínio, e não por conta feita aqui: é a
          mesma que os testes cobrem e a que trata divisão por zero. */}
      <Kpi rotulo="MER" valor={vezes(mer(receita, investimento))} />
      <Kpi rotulo="Pedidos aprovados" valor={numero(soma('pedidosAprovados'))} />
    </div>
  );
}

async function AbaDiario({
  contaId,
  podeRegistrar,
}: {
  contaId: string;
  podeRegistrar: boolean;
}) {
  const [{ dados: marcos }, { dados: interacoes }] = await Promise.all([
    marcosDaConta(contaId),
    interacoesDaConta(contaId),
  ]);

  return (
    <>
      {podeRegistrar ? <FormInteracao contaId={contaId} /> : null}

      <Secao
        titulo="Marcos"
        apoio="O que explica os degraus no gráfico. Sem isso, três meses depois ninguém lembra por que a curva mudou."
      >
        {marcos.length === 0 ? (
          <p className="cartao p-6 text-sm text-cinza">Nenhum marco registrado.</p>
        ) : (
          <ol className="space-y-3">
            {marcos.map((m) => (
              <li key={m.id} className="cartao flex flex-wrap gap-x-6 gap-y-2 p-5">
                <span className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-magenta-texto">
                  {diaLongo(m.dia)}
                </span>
                <div className="min-w-0 grow">
                  <p className="font-semibold">{m.titulo}</p>
                  {m.detalhe ? <p className="mt-1 text-sm text-cinza">{m.detalhe}</p> : null}
                </div>
                <span className="rounded-full border border-fio px-3 py-1 font-mono text-[0.58rem] uppercase tracking-[0.12em] text-cinza">
                  {m.tipo}
                </span>
              </li>
            ))}
          </ol>
        )}
      </Secao>

      <Secao titulo="Conversas" apoio="Ligação, reunião e mensagem registradas pelo time.">
        {interacoes.length === 0 ? (
          <p className="cartao p-6 text-sm text-cinza">Nenhuma interação registrada.</p>
        ) : (
          <ol className="space-y-3">
            {interacoes.map((i) => (
              <li key={i.id} className="cartao p-5">
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <span className="rounded-full border border-fio px-3 py-1 font-mono text-[0.58rem] uppercase tracking-[0.12em] text-magenta-texto">
                    {i.tipo}
                  </span>
                  <span className="text-sm text-cinza">{i.autor ?? 'Sistema'}</span>
                  <span className="ml-auto font-mono text-[0.6rem] uppercase tracking-[0.12em] text-cinza">
                    {new Date(i.em).toLocaleString('pt-BR', {
                      timeZone: 'America/Sao_Paulo',
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="mt-3 leading-relaxed text-neve">{i.resumo}</p>
              </li>
            ))}
          </ol>
        )}
      </Secao>
    </>
  );
}

async function AbaContrato({ contaId, papel }: { contaId: string; papel: Papel }) {
  const podeVer = ['administrador', 'financeiro'].includes(papel);

  /* A checagem de papel aqui é para dar a MENSAGEM certa. Quem impede de
     verdade é o RLS: para os outros papéis a consulta volta vazia, e sem
     este aviso a tela diria "sem contrato" quando o certo é "sem
     permissão". */
  if (!podeVer) {
    return (
      <p className="cartao p-6 text-sm leading-relaxed text-cinza">
        Contrato e fee são visíveis para administrador e financeiro. Não é ausência de
        contrato: é o recorte de acesso funcionando.
      </p>
    );
  }

  const { dados: contratos } = await contratosDaConta(contaId);

  if (contratos.length === 0) {
    return <p className="cartao p-6 text-sm text-cinza">Nenhum contrato cadastrado.</p>;
  }

  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {contratos.map((c) => (
        <li key={c.id} className="cartao p-6">
          <p className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-magenta-texto">
            {c.plano}
          </p>
          <p className="tabular mt-3 font-display text-2xl font-extrabold tracking-[-0.03em]">
            {dinheiro(c.feeMensal)}
            <span className="ml-1 text-sm font-normal text-cinza">/mês</span>
          </p>
          <dl className="mt-5 space-y-2 border-t border-fio pt-4 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-cinza">Vencimento</dt>
              <dd className="tabular">dia {c.diaVencimento}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-cinza">Início</dt>
              <dd className="tabular">{diaLongo(c.inicio)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-cinza">Fim</dt>
              <dd className="tabular">{c.fim ? diaLongo(c.fim) : 'sem prazo'}</dd>
            </div>
          </dl>
        </li>
      ))}
    </ul>
  );
}

