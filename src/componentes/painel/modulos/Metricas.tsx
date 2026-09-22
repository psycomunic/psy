import Link from 'next/link';
import { listarContas, serieDaConta, canaisDaConta, marcosDaConta } from '@/lib/dados/consultas';
import { SerieTempo, BarrasCanal } from '../Graficos';
import { Kpi, SeloSituacao, Progresso, AvisoProcedencia, Secao, Tabela, th, td } from '../base';
import { dinheiro, vezes, porcento, numero, diaLongo, nomeCanal } from '@/lib/formato';
import type { Papel } from '@/lib/papeis';

/**
 * Métricas de uma conta.
 *
 * A MESMA tela serve o time da agência e o lojista. Não existe versão
 * "do cliente" com menos números: se um dado é bom o bastante para
 * decidir, ele é bom o bastante para o dono da loja ver.
 *
 * O que muda é o ESCOPO, e ele é decidido no banco. Para o time, a
 * lista traz todas as contas; para o cliente, o RLS devolve só a dele.
 * Nenhuma linha de front esconde nada, porque esconder no front é
 * maquiagem: quem abrir a aba de rede vê o resto.
 */
export async function Metricas({
  papel,
  contaPedida,
}: {
  papel: Papel;
  contaPedida?: string;
}) {
  const { dados: todas, procedencia } = await listarContas();

  /*
    Escopo do cliente.

    Com banco, esta linha não faz nada: o RLS já devolveu só a conta
    dele, e `todas` tem um item. Sem banco não existe RLS, e a
    demonstração devolveria as cinco contas fictícias para um perfil de
    cliente. Isso desenharia um sistema que vaza, e alguém olharia a
    tela e concluiria que está tudo certo.

    Recortar aqui não é segurança, é fidelidade da maquete. A segurança
    de verdade está na política `metrica_leitura`, no Postgres.
  */
  const contas =
    papel === 'cliente' && procedencia === 'demonstracao' ? todas.slice(0, 1) : todas;

  if (contas.length === 0) {
    return (
      <>
        <AvisoProcedencia procedencia={procedencia} />
        <p className="cartao mt-8 p-8 text-cinza">
          Nenhuma conta disponível para o seu acesso.
        </p>
      </>
    );
  }

  const conta = contas.find((c) => c.id === contaPedida) ?? contas[0];

  const [{ dados: serie }, { dados: canais }, { dados: marcos }] = await Promise.all([
    serieDaConta(conta.id, 30),
    canaisDaConta(conta.id, 30),
    marcosDaConta(conta.id),
  ]);

  /* Comparação de 7 dias contra os 7 anteriores. É a janela que a
     agência usa na reunião semanal, e a que absorve o efeito de fim de
     semana sem precisar de média móvel. */
  const ult7 = serie.slice(-7);
  const ant7 = serie.slice(-14, -7);
  const soma = (l: typeof serie, k: keyof (typeof serie)[number]) =>
    l.reduce((s, d) => s + (Number(d[k]) || 0), 0);

  const varPct = (a: number, b: number) =>
    b > 0 ? Number(((100 * (a - b)) / b).toFixed(1)) : null;

  const rec7 = soma(ult7, 'receita');
  const inv7 = soma(ult7, 'investimento');
  const ped7 = soma(ult7, 'pedidosAprovados');
  const cap7 = soma(ult7, 'pedidosCaptados');
  const nov7 = soma(ult7, 'novosClientes');
  const ses7 = soma(ult7, 'sessoes');

  const recAnt = soma(ant7, 'receita');
  const pedAnt = soma(ant7, 'pedidosAprovados');
  const invAnt = soma(ant7, 'investimento');
  const novAnt = soma(ant7, 'novosClientes');

  const mer = inv7 > 0 ? Number((rec7 / inv7).toFixed(2)) : null;
  const merAnt = invAnt > 0 ? recAnt / invAnt : 0;
  const ticket = ped7 > 0 ? Number((rec7 / ped7).toFixed(2)) : null;
  const ticketAnt = pedAnt > 0 ? recAnt / pedAnt : 0;
  const cac = nov7 > 0 ? Number((inv7 / nov7).toFixed(2)) : null;
  const cacAnt = novAnt > 0 ? invAnt / novAnt : 0;
  const aprovacao = cap7 > 0 ? Number(((100 * ped7) / cap7).toFixed(1)) : null;
  const conversao = ses7 > 0 ? Number(((100 * cap7) / ses7).toFixed(2)) : null;

  const perdidos = cap7 - ped7;
  const perdaEstimada = ticket ? perdidos * ticket : 0;

  return (
    <>
      <AvisoProcedencia procedencia={procedencia} />

      {/* Seletor de conta: só aparece para quem tem mais de uma. O
          cliente enxerga uma, então não recebe um seletor inútil. */}
      {contas.length > 1 ? (
        <nav aria-label="Escolher conta" className="mt-6 flex flex-wrap gap-2">
          {contas.map((c) => (
            <Link
              key={c.id}
              href={`/painel/metricas?conta=${c.id}`}
              aria-current={c.id === conta.id ? 'true' : undefined}
              className={
                'rounded-full px-4 py-2 text-sm transition-colors ' +
                (c.id === conta.id
                  ? 'bg-magenta font-semibold text-branco'
                  : 'border border-fio text-neve hover:bg-white/5')
              }
            >
              {c.nome}
            </Link>
          ))}
        </nav>
      ) : null}

      {/* Cabeçalho da conta */}
      <header className="mt-8 flex flex-wrap items-start justify-between gap-6">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-[-0.035em]">
            {conta.nome}
          </h1>
          <p className="mt-2 font-mono text-[0.75rem] uppercase tracking-[0.16em] text-cinza">
            {conta.plataforma ?? 'Plataforma a definir'}
            {conta.ultimoDia ? ` · dado até ${diaLongo(conta.ultimoDia)}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-5">
          <SeloSituacao situacao={conta.situacao} />
          <div className="w-44">
            <Progresso percentual={conta.metaAtingida} />
          </div>
        </div>
      </header>

      {conta.situacao === 'sem_dado' ? (
        <p className="mt-6 rounded-xl border border-magenta/40 bg-magenta/10 px-5 py-4 text-sm leading-relaxed text-neve">
          <strong className="text-magenta-texto">A sincronização parou.</strong> O último
          dado é de {conta.ultimoDia ? diaLongo(conta.ultimoDia) : 'data desconhecida'}. Os
          números abaixo estão desatualizados: conferir a integração antes de tomar
          qualquer decisão de verba.
        </p>
      ) : null}

      {/* Os números da semana */}
      <Secao
        titulo="Últimos 7 dias"
        apoio="Comparado com os 7 dias anteriores. A janela de 7 absorve o efeito de fim de semana."
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Kpi rotulo="Receita aprovada" valor={dinheiro(rec7)} variacao={varPct(rec7, recAnt)} />
          <Kpi
            rotulo="MER"
            valor={vezes(mer)}
            apoio="Receita total ÷ investimento total. Diferente do ROAS de plataforma."
            variacao={merAnt > 0 && mer ? varPct(mer, merAnt) : null}
          />
          <Kpi rotulo="Ticket médio" valor={dinheiro(ticket)} variacao={ticketAnt > 0 && ticket ? varPct(ticket, ticketAnt) : null} />
          <Kpi
            rotulo="CAC"
            valor={dinheiro(cac)}
            apoio="Investimento ÷ clientes novos. Recompra não entra na conta."
            variacao={cacAnt > 0 && cac ? varPct(cac, cacAnt) : null}
            invertido
          />
        </div>
      </Secao>

      {/* O funil, que é onde o dinheiro some sem aparecer em relatório */}
      <Secao
        titulo="O funil, da visita ao pagamento"
        apoio="O buraco entre pedido captado e pedido aprovado é o que nenhum painel de mídia mostra."
      >
        <div className="cartao p-7">
          <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { r: 'Sessões', v: numero(ses7), a: 'Visitas na loja' },
              { r: 'Pedidos captados', v: numero(cap7), a: `Conversão de ${porcento(conversao, 2)}` },
              { r: 'Pedidos aprovados', v: numero(ped7), a: `Aprovação de ${porcento(aprovacao)}` },
              { r: 'Clientes novos', v: numero(nov7), a: `${numero(ped7 - nov7)} foram recompra` },
            ].map((e, i) => (
              <li key={e.r} className={i > 0 ? 'sm:border-l sm:border-fio sm:pl-6' : ''}>
                <p className="font-mono text-[0.75rem] uppercase tracking-[0.14em] text-cinza">
                  {e.r}
                </p>
                <p className="tabular mt-2 font-display text-2xl font-extrabold tracking-[-0.03em]">
                  {e.v}
                </p>
                <p className="mt-1.5 text-xs text-cinza">{e.a}</p>
              </li>
            ))}
          </ol>

          {perdidos > 0 && ticket ? (
            <p className="mt-7 border-t border-fio pt-6 text-sm leading-relaxed text-neve">
              <strong className="text-magenta-texto">
                {numero(perdidos)} pedidos não foram pagos nesta semana.
              </strong>{' '}
              No ticket médio atual, são cerca de {dinheiro(perdaEstimada)} que entraram no
              checkout e não viraram receita. Boleto vencido, PIX expirado e cartão recusado
              por antifraude somem aqui, e não aparecem em nenhum relatório de mídia.
            </p>
          ) : null}
        </div>
      </Secao>

      {/* Série temporal */}
      <Secao titulo="Receita e investimento, dia a dia" apoio="Últimos 30 dias. Passe o cursor para ver o dia.">
        <div className="cartao p-7">
          <SerieTempo serie={serie} />
        </div>
      </Secao>

      {/* Canais */}
      <Secao titulo="De onde vem a receita" apoio="Acumulado de 30 dias. Orgânico e direto não têm custo de mídia atribuído.">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="cartao p-7">
            <h3 className="font-mono text-[0.75rem] uppercase tracking-[0.16em] text-cinza">
              Receita por canal
            </h3>
            <div className="mt-6">
              <BarrasCanal canais={canais} medida="receita" />
            </div>
          </div>
          <div className="cartao p-7">
            <h3 className="font-mono text-[0.75rem] uppercase tracking-[0.16em] text-cinza">
              ROAS por canal
            </h3>
            <div className="mt-6">
              <BarrasCanal canais={canais} medida="roas" />
            </div>
          </div>
        </div>

        {/* Tabela: mesma informação em texto, para leitor de tela e para
            quem precisa do número exato. */}
        <div className="mt-6">
          <Tabela>
            <caption className="sr-only">Desempenho por canal nos últimos 30 dias</caption>
            <thead>
              <tr>
                <th scope="col" className={th}>Canal</th>
                <th scope="col" className={th}>Receita</th>
                <th scope="col" className={th}>Investimento</th>
                <th scope="col" className={th}>Pedidos</th>
                <th scope="col" className={th}>ROAS</th>
                <th scope="col" className={th}>CPC</th>
                <th scope="col" className={th}>CTR</th>
              </tr>
            </thead>
            <tbody>
              {canais.map((c) => (
                <tr key={c.canal}>
                  <th scope="row" className={`${td} font-normal`}>{nomeCanal(c.canal)}</th>
                  <td className={`${td} tabular`}>{dinheiro(c.receita)}</td>
                  <td className={`${td} tabular`}>{c.investimento > 0 ? dinheiro(c.investimento) : '—'}</td>
                  <td className={`${td} tabular`}>{numero(c.pedidos)}</td>
                  <td className={`${td} tabular`}>{c.roas === null ? 'sem mídia' : vezes(c.roas)}</td>
                  <td className={`${td} tabular`}>{c.cpc === null ? '—' : dinheiro(c.cpc)}</td>
                  <td className={`${td} tabular`}>{porcento(c.ctr, 2)}</td>
                </tr>
              ))}
            </tbody>
          </Tabela>
        </div>
      </Secao>

      {/* Diário de bordo */}
      <Secao
        titulo="Diário de bordo"
        apoio="O que explica os degraus no gráfico. Sem isso, três meses depois ninguém lembra por que a curva mudou."
      >
        {marcos.length === 0 ? (
          <p className="cartao p-6 text-sm text-cinza">Nenhum marco registrado ainda.</p>
        ) : (
          <ol className="space-y-3">
            {marcos.map((m) => (
              <li key={m.id} className="cartao flex flex-wrap gap-x-6 gap-y-2 p-5">
                <span className="font-mono text-[0.75rem] uppercase tracking-[0.14em] text-magenta-texto">
                  {diaLongo(m.dia)}
                </span>
                <div className="min-w-0 grow">
                  <p className="font-semibold">{m.titulo}</p>
                  {m.detalhe ? <p className="mt-1 text-sm text-cinza">{m.detalhe}</p> : null}
                </div>
                <span className="rounded-full border border-fio px-3 py-1 font-mono text-[0.75rem] uppercase tracking-[0.12em] text-cinza">
                  {m.tipo}
                </span>
              </li>
            ))}
          </ol>
        )}
      </Secao>

      {papel === 'cliente' ? (
        <p className="mt-12 rounded-xl border border-fio bg-white/[0.02] px-6 py-5 text-sm leading-relaxed text-cinza">
          Estes são os números da sua loja, atualizados automaticamente. Dúvida sobre
          qualquer linha: fale com a Psy Comunic pelo WhatsApp.
        </p>
      ) : null}
    </>
  );
}
