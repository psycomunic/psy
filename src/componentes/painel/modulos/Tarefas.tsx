import Link from 'next/link';
import { listarTarefas, listarContas, listarEquipe } from '@/lib/dados/consultas';
import { Kpi, AvisoProcedencia, Secao } from '../base';
import { rotuloPrioridade, rotuloRecorrencia, type Tarefa } from '@/lib/dados/tipos';
import { hojeBR } from '@/lib/datas';
import { CORES_SITUACAO } from '../paleta';
import { FormNovaTarefa, AcoesTarefa } from '../FormTarefa';
import type { Papel } from '@/lib/papeis';

/**
 * Tarefas.
 *
 * ============================================================
 * A ORDEM DA LISTA É A DECISÃO MAIS IMPORTANTE AQUI
 * ============================================================
 * Atrasadas primeiro, depois hoje, depois o resto por prazo. Dentro do
 * mesmo dia, prioridade decide.
 *
 * Ordenar por data de criação, que é o padrão de todo sistema, faria a
 * tarefa urgente de ontem afundar abaixo de cinco tarefas sem prazo
 * criadas hoje de manhã. A lista existe para responder "o que eu faço
 * agora", e não "o que entrou por último".
 */

const FILTROS = [
  { k: 'abertas', r: 'Em aberto' },
  { k: 'hoje', r: 'Hoje e atrasadas' },
  { k: 'minhas', r: 'Minhas' },
  { k: 'concluidas', r: 'Concluídas' },
  { k: 'todas', r: 'Todas' },
] as const;

export type FiltroTarefa = (typeof FILTROS)[number]['k'];

export function filtroDaUrl(v: string | undefined): FiltroTarefa {
  return FILTROS.some((f) => f.k === v) ? (v as FiltroTarefa) : 'abertas';
}

const COR_PRIORIDADE: Record<Tarefa['prioridade'], string> = {
  baixa: CORES_SITUACAO.sem_dado,
  media: CORES_SITUACAO.sem_dado,
  alta: CORES_SITUACAO.atencao,
  urgente: CORES_SITUACAO.critico,
};

/** Cor NUNCA sozinha: o triângulo e o texto carregam a mesma informação. */
const FORMA_PRIORIDADE: Record<Tarefa['prioridade'], string> = {
  baixa: '○',
  media: '●',
  alta: '▲',
  urgente: '■',
};

function prazoTexto(t: Tarefa) {
  if (t.prazo === null) return 'sem prazo';
  const d = t.diasAtePrazo ?? 0;
  if (d < 0) return `${Math.abs(d)} ${Math.abs(d) === 1 ? 'dia' : 'dias'} em atraso`;
  if (d === 0) return 'vence hoje';
  if (d === 1) return 'vence amanhã';
  return `vence em ${d} dias`;
}

const emAberto = (t: Tarefa) => t.status === 'aberta' || t.status === 'fazendo';

/**
 * Concluída hoje continua na lista de abertas.
 *
 * Não é enfeite: sem isso, clicar em Concluir faz o cartão sumir na
 * hora, junto com a mensagem que ele acabou de produzir. A pessoa não
 * lê que a próxima ocorrência nasceu, não confirma que era a tarefa
 * certa, e não tem por onde desfazer.
 *
 * O que se fez hoje é o registro do dia. Some amanhã, quando já não
 * disputa atenção com o que falta.
 */
/*
  "Hoje" é o dia de BRASÍLIA, dos dois lados da comparação.

  `concluida_em` é `now()` do Postgres e chega em UTC. Cortar os dez
  primeiros caracteres dá o dia UTC, e entre 21h e meia-noite de
  Brasília isso já é AMANHÃ: a tarefa que a pessoa acabou de concluir
  saía da lista de abertas no mesmo instante, levando junto a mensagem
  de confirmação, que vive no cartão. Quem concluísse uma tarefa que se
  repete nunca era avisado de que a próxima tinha nascido.

  Medido às 22h05 de Brasília, com o teste reprovando por isso e a
  recorrência funcionando perfeitamente no banco: o defeito só aparecia
  em três horas do dia, que é o pior tipo de defeito.

  `hojeBR` já faz a conversão e tem teste próprio.
*/
const concluidaHoje = (t: Tarefa, hoje: string) =>
  t.status === 'concluida' &&
  t.concluidaEm !== null &&
  hojeBR(new Date(t.concluidaEm)) === hoje;
const atrasada = (t: Tarefa) => emAberto(t) && t.prazo !== null && (t.diasAtePrazo ?? 0) < 0;
const paraHoje = (t: Tarefa) => emAberto(t) && t.diasAtePrazo === 0;

const PESO: Record<Tarefa['prioridade'], number> = {
  urgente: 0,
  alta: 1,
  media: 2,
  baixa: 3,
};

export async function Tarefas({ papel, filtro = 'abertas' }: { papel: Papel; filtro?: FiltroTarefa }) {
  const [{ dados: tarefas, procedencia }, { dados: contas }, { dados: equipe }] =
    await Promise.all([listarTarefas(), listarContas(), listarEquipe()]);

  const podeEscrever =
    papel !== 'cliente' && papel !== 'cliente_leitura' && procedencia === 'banco';
  const hoje = hojeBR();

  const abertas = tarefas.filter(emAberto);
  const asAtrasadas = tarefas.filter(atrasada);
  const deHoje = tarefas.filter(paraHoje);
  const concluidas = tarefas.filter((t) => t.status === 'concluida');

  const visiveis = tarefas.filter((t) => {
    switch (filtro) {
      case 'abertas':
        return emAberto(t) || concluidaHoje(t, hoje);
      case 'hoje':
        return atrasada(t) || paraHoje(t);
      case 'minhas':
        /* "Minhas" é quem tem responsável definido e está em aberto. O
           filtro por pessoa acontece no banco, pelo RLS? Não: tarefa é
           visível a todo interno de propósito, porque operação é
           coletiva. Aqui o recorte é de tela. */
        return emAberto(t) && t.responsavelId !== null;
      case 'concluidas':
        return t.status === 'concluida';
      default:
        return true;
    }
  });

  const ordenadas = [...visiveis].sort((a, b) => {
    /* Sem prazo vai para o fim: não é urgente por não ter data, é
       indefinido, e indefinido não disputa espaço com o que tem hora
       marcada. */
    const pa = a.prazo === null ? 99999 : (a.diasAtePrazo ?? 0);
    const pb = b.prazo === null ? 99999 : (b.diasAtePrazo ?? 0);
    if (pa !== pb) return pa - pb;
    return PESO[a.prioridade] - PESO[b.prioridade];
  });

  const clientes = contas.map((c) => ({ id: c.id, nome: c.nome }));
  const pessoas = equipe.map((p) => ({ id: p.id, nome: p.nome }));

  return (
    <>
      <AvisoProcedencia procedencia={procedencia} />

      {podeEscrever ? (
        <div className="mt-8">
          <FormNovaTarefa clientes={clientes} equipe={pessoas} hoje={hoje} />
        </div>
      ) : null}

      <Secao titulo="A operação hoje">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi rotulo="Em aberto" valor={String(abertas.length)} />
          <Kpi
            rotulo="Atrasadas"
            valor={String(asAtrasadas.length)}
            apoio={asAtrasadas.length > 0 ? 'Passaram do prazo' : 'Nada passou do prazo'}
            invertido
          />
          <Kpi rotulo="Vencem hoje" valor={String(deHoje.length)} />
          <Kpi
            rotulo="Concluídas"
            valor={String(concluidas.length)}
            apoio="No histórico visível"
          />
        </div>
      </Secao>

      <nav
        aria-label="Filtros de tarefa"
        className="mt-8 flex flex-wrap gap-2 border-b border-fio pb-4"
      >
        {FILTROS.map((f) => (
          <Link
            key={f.k}
            href={`/painel/tarefas?filtro=${f.k}`}
            aria-current={filtro === f.k ? 'page' : undefined}
            className={
              'rounded-full px-4 py-2 text-sm transition-colors ' +
              (filtro === f.k
                ? 'bg-magenta font-semibold text-branco'
                : 'border border-fio text-neve hover:bg-white/5')
            }
          >
            {f.r}
          </Link>
        ))}
      </nav>

      <div className="mt-8">
        {ordenadas.length === 0 ? (
          <p className="max-w-[70ch] text-sm leading-relaxed text-cinza">
            Nada nesta lista.{' '}
            {filtro === 'abertas'
              ? 'Toda tarefa em aberto foi concluída ou não existe ainda.'
              : 'Troque o filtro acima para ver o resto.'}
          </p>
        ) : (
          <ul className="space-y-4">
            {ordenadas.map((t) => {
              const emAtraso = atrasada(t);
              const feita = t.status === 'concluida';

              return (
                <li key={t.id} className="cartao space-y-4 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
                    <div className="min-w-0">
                      <p
                        className={
                          feita || t.status === 'cancelada'
                            ? 'text-cinza line-through'
                            : 'font-semibold text-branco'
                        }
                      >
                        {t.titulo}
                      </p>

                      {t.detalhe ? (
                        <p className="mt-1.5 max-w-[70ch] text-sm leading-relaxed text-cinza">
                          {t.detalhe}
                        </p>
                      ) : null}

                      <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[0.75rem] uppercase tracking-[0.12em] text-cinza">
                        <span style={{ color: COR_PRIORIDADE[t.prioridade] }}>
                          <span aria-hidden className="mr-1.5">
                            {FORMA_PRIORIDADE[t.prioridade]}
                          </span>
                          {rotuloPrioridade[t.prioridade]}
                        </span>
                        <span aria-hidden>·</span>
                        <span>{t.conta ?? 'Da agência'}</span>
                        <span aria-hidden>·</span>
                        <span>{t.responsavel ?? 'Sem responsável'}</span>
                        {t.recorrencia !== 'nenhuma' ? (
                          <>
                            <span aria-hidden>·</span>
                            <span>{rotuloRecorrencia[t.recorrencia]}</span>
                          </>
                        ) : null}
                      </p>
                    </div>

                    <p
                      className="shrink-0 font-mono text-[0.75rem] uppercase tracking-[0.12em]"
                      style={{
                        color: feita
                          ? CORES_SITUACAO.saudavel
                          : emAtraso
                            ? CORES_SITUACAO.critico
                            : 'var(--cinza)',
                      }}
                    >
                      {feita
                        ? 'concluída'
                        : t.status === 'cancelada'
                          ? 'cancelada'
                          : prazoTexto(t)}
                    </p>
                  </div>

                  {podeEscrever ? (
                    <AcoesTarefa
                      tarefa={t}
                      clientes={clientes}
                      equipe={pessoas}
                      hoje={hoje}
                      podeExcluir={papel === 'administrador'}
                    />
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
