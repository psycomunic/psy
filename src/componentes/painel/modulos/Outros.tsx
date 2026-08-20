import Link from 'next/link';
import {
  listarContas,
  listarLeads,
  listarTarefas,
  listarEquipe,
  listarAuditoria,
  listarFunil,
  financeiroDoMes,
} from '@/lib/dados/consultas';
import { Kpi, SeloSituacao, Progresso, AvisoProcedencia, Secao, Tabela, th, td } from '../base';
import { rotuloEstagio } from '@/lib/dados/tipos';
import { dinheiro, dinheiroCurto, vezes, diasAte } from '@/lib/formato';
import { rotuloPapel, type Papel } from '@/lib/papeis';
import {
  FormNovaConta,
  FormNovoUsuario,
  FormMeta,
  BotaoAcesso,
  LojasDaPessoa,
  FormTransferencia,
} from '../Formularios';
import { Kanban } from '../Kanban';
import { previsaoPonderada, leadParado } from '@/lib/dominio/metricas.ts';

/* ================================================================== */
/* CRM: o funil                                                        */
/* ================================================================== */

export async function Crm({ papel }: { papel: Papel }) {
  const [{ dados: leads, procedencia }, { dados: funil }] = await Promise.all([
    listarLeads(),
    listarFunil(),
  ]);

  const podeEditar =
    ['administrador', 'gestor', 'comercial'].includes(papel) && procedencia === 'banco';

  const abertos = leads.filter((l) => l.estagio !== 'ganho' && l.estagio !== 'perdido');
  const ganhos = leads.filter((l) => l.estagio === 'ganho');
  const emJogo = abertos.reduce((s, l) => s + (l.valorFee ?? 0), 0);

  const ponderado = previsaoPonderada(
    abertos.map((l) => ({ valorFee: l.valorFee, probabilidade: l.probabilidade })),
  );

  const parados = abertos.filter((l) => leadParado(l.diasNoEstagio, l.estagio));

  /* Ciclo de venda: quantos dias, em média, do primeiro contato ao
     ganho. Só faz sentido sobre quem já foi ganho — a média incluindo
     quem ainda está negociando mediria o tempo até HOJE, e não até o
     fechamento. */
  /* `diasDesdeEntrada` vem pronto da camada de dados. Calcular aqui
     exigiria Date.now() durante o render, que e chamada impura: em
     componente de cliente causaria divergencia de hidratacao, e a regra
     do React vale para os dois casos. */
  const cicloDias =
    ganhos.length > 0
      ? Math.round(ganhos.reduce((s, l) => s + l.diasDesdeEntrada, 0) / ganhos.length)
      : null;

  /* Conversão de ganho sobre o que já foi DECIDIDO, e não sobre a base
     inteira. Contar os que ainda estão em negociação como derrota
     rebaixa a taxa artificialmente. */
  const decididos = leads.filter((l) => l.estagio === 'ganho' || l.estagio === 'perdido');
  const taxaGanho = decididos.length > 0
    ? Number(((100 * ganhos.length) / decididos.length).toFixed(0))
    : null;

  return (
    <>
      <AvisoProcedencia procedencia={procedencia} />

      <Secao titulo="O funil hoje">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi
            rotulo="Previsão ponderada"
            valor={dinheiroCurto(ponderado)}
            apoio={`De ${dinheiroCurto(emJogo)} em jogo. Ponderado pela probabilidade: a soma crua trata como certo quem ainda não respondeu.`}
          />
          <Kpi rotulo="Em negociação" valor={String(abertos.length)} apoio="Leads ainda não decididos" />
          <Kpi
            rotulo="Taxa de ganho"
            valor={taxaGanho === null ? '—' : `${taxaGanho}%`}
            apoio="Sobre os leads já decididos, e não sobre a base inteira"
          />
          <Kpi
            rotulo="Ciclo de venda"
            valor={cicloDias === null ? '—' : `${cicloDias} dias`}
            apoio="Média do primeiro contato ao ganho"
          />
        </div>
      </Secao>

      {/* O que exige ação vem ANTES do quadro: quem abre o CRM de manhã
          precisa saber o que travou, e não admirar o funil. */}
      {parados.length > 0 ? (
        <Secao
          titulo={`${parados.length} ${parados.length === 1 ? 'lead parado' : 'leads parados'}`}
          apoio="Sete dias no mesmo estágio. Não é prazo de vendas, é limiar de esquecimento."
        >
          <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {parados
              .sort((a, b) => b.diasNoEstagio - a.diasNoEstagio)
              .map((l) => (
                <li key={l.id} className="cartao flex items-center gap-4 p-4">
                  <span aria-hidden className="text-sm" style={{ color: '#FBBF24' }}>▲</span>
                  <div className="min-w-0 grow">
                    <p className="truncate text-sm font-semibold">{l.empresa ?? l.nome}</p>
                    <p className="mt-0.5 text-xs text-cinza">
                      {rotuloEstagio[l.estagio]} · {l.diasNoEstagio} dias
                    </p>
                  </div>
                  <span className="tabular shrink-0 text-xs text-neve">
                    {dinheiroCurto(l.valorFee ?? 0)}
                  </span>
                </li>
              ))}
          </ul>
        </Secao>
      ) : null}

      <Secao
        titulo="Funil"
        apoio={
          podeEditar
            ? 'Arraste um card para mudar de estágio. Clique para abrir a ficha.'
            : 'Clique num card para abrir a ficha.'
        }
      >
        <Kanban leads={leads} podeEditar={podeEditar} />
      </Secao>

      <Secao titulo="Tempo em cada estágio" apoio="Onde o funil trava.">
        <Tabela>
          <caption className="sr-only">Quantidade, valor e tempo médio por estágio</caption>
          <thead>
            <tr>
              <th scope="col" className={th}>Estágio</th>
              <th scope="col" className={th}>Leads</th>
              <th scope="col" className={th}>Valor</th>
              <th scope="col" className={th}>Ponderado</th>
              <th scope="col" className={th}>Dias médios</th>
              <th scope="col" className={th}>Parados</th>
            </tr>
          </thead>
          <tbody>
            {funil.map((f) => (
              <tr key={f.estagio}>
                <th scope="row" className={`${td} font-normal text-branco`}>
                  {rotuloEstagio[f.estagio]}
                </th>
                <td className={`${td} tabular`}>{f.quantidade}</td>
                <td className={`${td} tabular`}>{dinheiro(f.valorTotal)}</td>
                <td className={`${td} tabular`}>{dinheiro(f.valorPonderado)}</td>
                <td className={`${td} tabular`}>{f.diasMedios === null ? '—' : f.diasMedios}</td>
                <td className={`${td} tabular`}>
                  {f.parados > 0 ? (
                    <span style={{ color: '#FBBF24' }}>▲ {f.parados}</span>
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Tabela>
      </Secao>

      {leads.some((l) => l.estagio === 'perdido') ? (
        <Secao
          titulo="Por que perdemos"
          apoio="O padrão só aparece com o motivo registrado. É por isso que ele é obrigatório."
        >
          <ul className="space-y-2">
            {leads
              .filter((l) => l.estagio === 'perdido')
              .map((l) => (
                <li key={l.id} className="cartao flex flex-wrap gap-x-4 gap-y-1 px-5 py-4">
                  <span className="font-semibold">{l.empresa ?? l.nome}</span>
                  <span className="text-sm text-cinza">{l.motivoPerda ?? 'sem motivo registrado'}</span>
                  <span className="tabular ml-auto text-sm text-cinza">
                    {dinheiro(l.valorFee)}
                  </span>
                </li>
              ))}
          </ul>
        </Secao>
      ) : null}
    </>
  );
}

/* ================================================================== */
/* Contas                                                              */
/* ================================================================== */

export async function Contas({ papel }: { papel: Papel }) {
  const { dados: contas, procedencia } = await listarContas();
  const podeEscrever = papel === 'administrador' && procedencia === 'banco';

  return (
    <>
      <AvisoProcedencia procedencia={procedencia} />

      {/* Escrita so para admin, e so com banco de verdade: formulario
          gravando em dados de demonstracao nao grava em lugar nenhum. */}
      {podeEscrever ? (
        <div className="mt-8 grid gap-4">
          <FormNovaConta />
          <FormMeta contas={contas.map((c) => ({ id: c.id, nome: c.nome }))} />
        </div>
      ) : null}

      <Secao titulo="Carteira" apoio="Ordenada por receita do mês.">
        <Tabela>
          <caption className="sr-only">Contas ativas com receita, MER e progresso da meta</caption>
          <thead>
            <tr>
              <th scope="col" className={th}>Conta</th>
              <th scope="col" className={th}>Situação</th>
              <th scope="col" className={th}>Receita do mês</th>
              <th scope="col" className={th}>Verba</th>
              <th scope="col" className={th}>MER</th>
              <th scope="col" className={th}>Meta</th>
              <th scope="col" className={th}></th>
            </tr>
          </thead>
          <tbody>
            {[...contas].sort((a, b) => b.receita - a.receita).map((c) => (
              <tr key={c.id}>
                <th scope="row" className={`${td} font-normal`}>
                  <Link
                    href={`/painel/contas?ficha=${c.id}`}
                    className="font-semibold text-branco underline-offset-4 hover:underline"
                  >
                    {c.nome}
                  </Link>
                  <span className="mt-1 block font-mono text-[0.58rem] uppercase tracking-[0.12em] text-cinza">
                    {c.plataforma ?? '—'}
                  </span>
                </th>
                <td className={td}><SeloSituacao situacao={c.situacao} /></td>
                <td className={`${td} tabular`}>{dinheiro(c.receita)}</td>
                <td className={`${td} tabular`}>{dinheiro(c.investimento)}</td>
                <td className={`${td} tabular`}>{vezes(c.mer)}</td>
                <td className={`${td} w-40`}><Progresso percentual={c.metaAtingida} /></td>
                <td className={td}>
                  <Link href={`/painel/contas?ficha=${c.id}`} className="text-sm font-semibold text-magenta-texto">
                    Ficha →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </Tabela>
      </Secao>
    </>
  );
}

/* ================================================================== */
/* Financeiro                                                          */
/* ================================================================== */

export async function Financeiro() {
  const [{ dados: fin, procedencia }, { dados: contas }] = await Promise.all([
    financeiroDoMes(),
    listarContas(),
  ]);

  const ticketMedio = fin.contratosAtivos > 0
    ? Math.round(fin.receitaRecorrente / fin.contratosAtivos)
    : 0;

  return (
    <>
      <AvisoProcedencia procedencia={procedencia} />

      <Secao
        titulo="Receita da agência"
        apoio="O fee é receita da Psy Comunic. A verba de mídia passa pela agência mas pertence ao cliente, e por isso nunca se somam."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi rotulo="Receita recorrente" valor={dinheiro(fin.receitaRecorrente)} apoio={`${fin.contratosAtivos} contratos ativos`} />
          <Kpi rotulo="Fee médio" valor={dinheiro(ticketMedio)} apoio="Receita recorrente ÷ contratos" />
          <Kpi rotulo="Recebido no mês" valor={dinheiro(fin.recebidoMes)} />
          <Kpi rotulo="A receber" valor={dinheiro(fin.aReceberMes)} />
        </div>
      </Secao>

      <Secao titulo="Risco">
        <div className="grid gap-4 sm:grid-cols-2">
          <Kpi
            rotulo="Inadimplência"
            valor={dinheiro(fin.inadimplencia)}
            apoio="Vencido e ainda não pago"
            invertido
          />
          <Kpi
            rotulo="Verba sob gestão"
            valor={dinheiro(fin.verbaSobGestao)}
            apoio="Dinheiro de cliente investido em mídia no mês. NÃO é receita da agência."
          />
        </div>
      </Secao>

      <Secao titulo="Concentração da carteira" apoio="Quanto do faturamento depende de um cliente só. Acima de 30% num único contrato, a saída dele vira problema de caixa.">
        <ul className="space-y-3">
          {[...contas].sort((a, b) => b.receita - a.receita).map((c) => {
            const total = contas.reduce((s, x) => s + x.receita, 0) || 1;
            const fatia = (100 * c.receita) / total;
            return (
              <li key={c.id} className="cartao p-5">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="font-semibold">{c.nome}</span>
                  <span className="tabular text-sm">{fatia.toFixed(1).replace('.', ',')}%</span>
                </div>
                <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-white/[0.05]">
                  <div
                    className="h-full rounded-full bg-magenta"
                    style={{ width: `${Math.max(fatia, 1)}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </Secao>
    </>
  );
}

/* ================================================================== */
/* Tarefas                                                             */
/* ================================================================== */

export async function Tarefas() {
  const { dados: tarefas, procedencia } = await listarTarefas();

  const abertas = tarefas.filter((t) => t.status === 'aberta' || t.status === 'fazendo');
  const atrasadas = abertas.filter((t) => (diasAte(t.prazo) ?? 1) < 0);

  const prazoTexto = (prazo: string | null) => {
    const d = diasAte(prazo);
    if (d === null) return 'sem prazo';
    if (d < 0) return `${Math.abs(d)} ${Math.abs(d) === 1 ? 'dia' : 'dias'} em atraso`;
    if (d === 0) return 'hoje';
    if (d === 1) return 'amanhã';
    return `em ${d} dias`;
  };

  return (
    <>
      <AvisoProcedencia procedencia={procedencia} />

      <Secao titulo="Operação">
        <div className="grid gap-4 sm:grid-cols-3">
          <Kpi rotulo="Abertas" valor={String(abertas.length)} />
          <Kpi rotulo="Atrasadas" valor={String(atrasadas.length)} invertido variacao={null} />
          <Kpi rotulo="Concluídas" valor={String(tarefas.filter((t) => t.status === 'concluida').length)} />
        </div>
      </Secao>

      <Secao titulo="Lista" apoio="Atrasadas primeiro, depois por prazo.">
        <ul className="space-y-3">
          {[...tarefas]
            .sort((a, b) => (diasAte(a.prazo) ?? 999) - (diasAte(b.prazo) ?? 999))
            .map((t) => {
              const d = diasAte(t.prazo);
              const atrasada = t.status !== 'concluida' && t.status !== 'cancelada' && (d ?? 1) < 0;
              return (
                <li key={t.id} className="cartao flex flex-wrap items-center gap-x-6 gap-y-2 p-5">
                  <span
                    aria-hidden
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{
                      background:
                        t.status === 'concluida' ? '#4ADE80' : atrasada ? '#FF7A7A' : '#93A0BC',
                    }}
                  />
                  <div className="min-w-0 grow">
                    <p className={t.status === 'concluida' ? 'text-cinza line-through' : 'font-semibold'}>
                      {t.titulo}
                    </p>
                    <p className="mt-1 text-xs text-cinza">
                      {t.conta ?? 'Sem conta'} · {t.responsavel ?? 'Sem responsável'}
                    </p>
                  </div>
                  <span
                    className="shrink-0 font-mono text-[0.62rem] uppercase tracking-[0.12em]"
                    style={{ color: atrasada ? '#FF7A7A' : 'var(--cinza)' }}
                  >
                    {t.status === 'concluida' ? 'concluída' : prazoTexto(t.prazo)}
                  </span>
                </li>
              );
            })}
        </ul>
      </Secao>
    </>
  );
}

/* ================================================================== */
/* Equipe                                                              */
/* ================================================================== */

export async function Equipe({ papel, meuId }: { papel: Papel; meuId: string | null }) {
  const [{ dados: equipe, procedencia }, { dados: contas }] = await Promise.all([
    listarEquipe(),
    listarContas(),
  ]);
  const podeEscrever = papel === 'administrador' && procedencia === 'banco';
  const listaLojas = contas.map((c) => ({ id: c.id, nome: c.nome }));

  return (
    <>
      <AvisoProcedencia procedencia={procedencia} />

      {podeEscrever ? (
        <div className="mt-8 grid gap-4">
          <FormNovoUsuario contas={listaLojas} />
          <FormTransferencia
            pessoas={equipe.map((p) => ({
              id: p.id,
              nome: p.nome,
              contas: p.contas.length,
            }))}
          />
        </div>
      ) : null}

      <Secao
        titulo="Pessoas com acesso"
        apoio="O papel decide quais MÓDULOS a pessoa enxerga. As lojas decidem quais LINHAS ela recebe, e isso é aplicado no banco."
      >
        <Tabela>
          <caption className="sr-only">
            Usuários da plataforma, papéis e lojas às quais têm acesso
          </caption>
          <thead>
            <tr>
              <th scope="col" className={th}>Nome</th>
              <th scope="col" className={th}>Papel</th>
              <th scope="col" className={th}>Lojas</th>
              <th scope="col" className={th}>Situação</th>
              <th scope="col" className={th}></th>
            </tr>
          </thead>
          <tbody>
            {equipe.map((p) => (
              <tr key={p.id}>
                <th scope="row" className={`${td} font-normal`}>
                  <span className="font-semibold text-branco">{p.nome}</span>
                  <span className="mt-1 block text-xs text-cinza">{p.email}</span>
                </th>
                <td className={td}>{rotuloPapel[p.papel as Papel] ?? p.papel}</td>
                <td className={`${td} min-w-[18rem]`}>
                  <LojasDaPessoa
                    usuarioId={p.id}
                    atuais={p.contas}
                    todas={listaLojas}
                    editavel={podeEscrever}
                  />
                </td>
                <td className={td}>
                  {/* Cor com FORMA junto: quem não distingue verde de
                      vermelho lê o símbolo e o texto. */}
                  <span
                    className="inline-flex items-center gap-2"
                    style={{ color: p.ativo ? '#4ADE80' : '#93A0BC' }}
                  >
                    <span aria-hidden className="text-[0.6rem]">{p.ativo ? '●' : '—'}</span>
                    {p.ativo ? 'Ativo' : 'Desativado'}
                  </span>
                </td>
                <td className={td}>
                  {podeEscrever ? (
                    <BotaoAcesso id={p.id} ativo={p.ativo} eVoce={p.id === meuId} />
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </Tabela>
      </Secao>

      <Secao titulo="Como o acesso funciona">
        <div className="cartao space-y-4 p-6 text-sm leading-relaxed text-cinza">
          <p>
            O convite grava o papel e a loja em{' '}
            <code className="text-neve">app_metadata</code>, que o usuário não consegue
            editar, e um gatilho do banco cria o perfil no primeiro acesso. Por isso não
            existe cadastro aberto: quem se cadastrasse sozinho entraria sem papel e sem
            loja, e ficaria logado sem lugar nenhum.
          </p>
          <p>
            <strong className="text-neve">Desativar não apaga.</strong> O acesso é cortado
            na mesma sessão, sem esperar o próximo login, e o histórico da pessoa continua
            na auditoria. Excluir apagaria quem fez o quê.
          </p>
          <p>
            Um cliente precisa de ao menos uma loja. Tirar a última seria deixá-lo logado
            enxergando nada, então o sistema recusa e pede que você desative o acesso.
          </p>
        </div>
      </Secao>
    </>
  );
}

/* ================================================================== */
/* Auditoria                                                           */
/* ================================================================== */

/** Como um valor de banco vira algo legível numa linha de tabela. */
function valorLegivel(v: unknown): string {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'boolean') return v ? 'sim' : 'não';
  if (typeof v === 'object') return JSON.stringify(v);
  const s = String(v);
  /* uuid inteiro numa célula empurra a tabela para o lado sem informar
     nada: os oito primeiros já servem para conferir. */
  return /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(s) ? `${s.slice(0, 8)}…` : s;
}

const ROTULO_ACAO: Record<string, string> = {
  insert: 'criou',
  update: 'alterou',
  delete: 'excluiu',
};

const ROTULO_TABELA: Record<string, string> = {
  conta: 'Loja',
  perfil: 'Usuário',
  acessos_conta: 'Acesso a loja',
  contrato: 'Contrato',
  fatura: 'Fatura',
  lancamento: 'Lançamento',
  proposta: 'Proposta',
  meta_conta: 'Meta',
  integracao: 'Integração',
};

export async function Auditoria() {
  const { dados: registros, procedencia } = await listarAuditoria(100);

  return (
    <>
      <AvisoProcedencia procedencia={procedencia} />

      <Secao
        titulo="Quem fez o quê"
        apoio="Últimos 100 registros das tabelas sensíveis. O log não se altera nem se apaga: se desse para editar, não seria log."
      >
        {registros.length === 0 ? (
          <p className="cartao p-6 text-sm text-cinza">
            Nenhum registro ainda. A trilha começa na primeira alteração de contrato,
            fatura, acesso, integração ou meta.
          </p>
        ) : (
          <ol className="space-y-3">
            {registros.map((r) => (
              <li key={r.id} className="cartao p-5">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="font-semibold text-branco">{r.autor ?? 'Sistema'}</span>
                  <span className="text-sm text-cinza">
                    {ROTULO_ACAO[r.acao] ?? r.acao}{' '}
                    <span className="text-neve">
                      {ROTULO_TABELA[r.tabela] ?? r.tabela}
                    </span>
                  </span>
                  <span className="ml-auto font-mono text-[0.62rem] uppercase tracking-[0.12em] text-cinza">
                    {new Date(r.em).toLocaleString('pt-BR', {
                      timeZone: 'America/Sao_Paulo',
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                {r.mudancas.length > 0 ? (
                  <ul className="mt-3 space-y-1.5 border-t border-fio pt-3">
                    {r.mudancas.slice(0, 6).map((m) => (
                      <li key={m.campo} className="flex flex-wrap items-baseline gap-2 text-xs">
                        <span className="font-mono uppercase tracking-[0.1em] text-cinza">
                          {m.campo}
                        </span>
                        <span className="text-cinza line-through">{valorLegivel(m.de)}</span>
                        <span aria-hidden className="text-magenta-texto">→</span>
                        <span className="text-neve">{valorLegivel(m.para)}</span>
                      </li>
                    ))}
                    {r.mudancas.length > 6 ? (
                      <li className="text-xs text-cinza">
                        e mais {r.mudancas.length - 6} campos
                      </li>
                    ) : null}
                  </ul>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </Secao>
    </>
  );
}

/* ================================================================== */
/* Módulos ainda sem tela própria                                      */
/* ================================================================== */

export function EmConstrucao({ nome, itens }: { nome: string; itens: string[] }) {
  return (
    <Secao titulo={nome} apoio="Ainda não construído. O que vem aqui:">
      <ul className="grid gap-4 md:grid-cols-2">
        {itens.map((i) => (
          <li key={i} className="cartao px-6 py-5 text-neve">{i}</li>
        ))}
      </ul>
    </Secao>
  );
}
