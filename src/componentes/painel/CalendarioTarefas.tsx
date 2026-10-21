'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Tarefa } from '@/lib/dados/tipos';
import { rotuloPrioridade } from '@/lib/dados/tipos';
import { AcoesTarefa } from './FormTarefa';
import { CORES_SITUACAO } from './paleta';

/**
 * O mês de trabalho, em grade.
 *
 * ============================================================
 * POR QUE CALENDÁRIO, E NÃO LISTA
 * ============================================================
 * Lista ordenada por prazo responde "o que faço agora", e responde
 * bem. O que ela não responde é "como está a minha semana": quantas
 * caem na terça, se a sexta está vazia, se dá para aceitar mais uma
 * coisa na quinta. Essa é uma pergunta de forma, e forma se vê em
 * grade, não em fila.
 *
 * Então a grade é o retrato, e a lista do dia é o trabalho: clicar
 * num dia abre as tarefas dele com os mesmos botões de sempre.
 *
 * ============================================================
 * O QUE NÃO PODE SUMIR NUM CALENDÁRIO
 * ============================================================
 * Duas coisas, e as duas somem por padrão em qualquer calendário mal
 * feito:
 *
 * 1. TAREFA SEM PRAZO. Ela não tem casa na grade, e ficaria invisível.
 *    Vai numa coluna própria, ao lado, porque "não tem data" é
 *    diferente de "não existe".
 *
 * 2. ATRASO DE OUTRO MÊS. A tarefa que venceu dia 28 do mês passado
 *    continua atrasada hoje, e quem abre novembro não a veria. Por
 *    isso o aviso do topo conta TODAS as atrasadas, inclusive as que
 *    não estão na tela, e leva até elas.
 *
 * ============================================================
 * A SEMANA COMEÇA NO DOMINGO
 * ============================================================
 * Como no calendário do telefone e no Google Agenda, que é com o que
 * esta tela vai ser comparada todos os dias.
 */

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const COR_PRIORIDADE: Record<Tarefa['prioridade'], string> = {
  baixa: CORES_SITUACAO.sem_dado,
  media: CORES_SITUACAO.sem_dado,
  alta: CORES_SITUACAO.atencao,
  urgente: CORES_SITUACAO.critico,
};

/** Cor NUNCA sozinha: a forma carrega a mesma informação. */
const FORMA_PRIORIDADE: Record<Tarefa['prioridade'], string> = {
  baixa: '○',
  media: '●',
  alta: '▲',
  urgente: '■',
};

const emAberto = (t: Tarefa) => t.status === 'aberta' || t.status === 'fazendo';

/** "2026-10-07" sem passar por `new Date`, que empurraria para ontem. */
function diaDoMes(dia: string) {
  return Number(dia.slice(8, 10));
}

/**
 * Os dias da grade, do domingo antes do dia 1 até o sábado depois do
 * último. Tudo em texto `YYYY-MM-DD`, e nunca em `Date`: construir
 * data a partir de string no navegador do usuário é como o dia 1 vira
 * dia 30 do mês anterior em quem está a oeste de Greenwich.
 */
function gradeDoMes(mes: string): string[] {
  const [ano, m] = mes.split('-').map(Number);
  const primeiro = new Date(Date.UTC(ano, m - 1, 1));
  const ultimo = new Date(Date.UTC(ano, m, 0));

  const inicio = new Date(primeiro);
  inicio.setUTCDate(inicio.getUTCDate() - inicio.getUTCDay());
  const fim = new Date(ultimo);
  fim.setUTCDate(fim.getUTCDate() + (6 - fim.getUTCDay()));

  const dias: string[] = [];
  for (const d = new Date(inicio); d <= fim; d.setUTCDate(d.getUTCDate() + 1)) {
    dias.push(d.toISOString().slice(0, 10));
  }
  return dias;
}

export function CalendarioTarefas({
  tarefas,
  mes,
  hoje,
  clientes,
  equipe,
  podeEscrever,
  podeExcluir,
}: {
  /** Todas as tarefas visíveis, inclusive as de outros meses: o aviso
      de atraso e a coluna sem prazo dependem delas. */
  tarefas: Tarefa[];
  mes: string;
  hoje: string;
  clientes: { id: string; nome: string }[];
  equipe: { id: string; nome: string }[];
  podeEscrever: boolean;
  podeExcluir: boolean;
}) {
  const dias = gradeDoMes(mes);
  const dentroDoMes = (dia: string) => dia.slice(0, 7) === mes;

  /* O dia que abre selecionado: hoje, quando hoje está no mês que se
     está olhando. Noutro mês, nenhum, porque abrir o dia 1 de um mês
     qualquer não é informação, é ruído. */
  const [selecionado, setSelecionado] = useState<string | null>(
    hoje.slice(0, 7) === mes ? hoje : null,
  );

  const porDia = new Map<string, Tarefa[]>();
  const semPrazo: Tarefa[] = [];
  for (const t of tarefas) {
    if (!t.prazo) {
      if (emAberto(t)) semPrazo.push(t);
      continue;
    }
    porDia.set(t.prazo, [...(porDia.get(t.prazo) ?? []), t]);
  }

  const atrasadas = tarefas.filter(
    (t) => emAberto(t) && t.prazo !== null && t.prazo < hoje,
  );
  const atrasadasForaDaTela = atrasadas.filter((t) => !dentroDoMes(t.prazo!));

  const [ano, m] = mes.split('-').map(Number);
  const anterior = m === 1 ? `${ano - 1}-12` : `${ano}-${String(m - 1).padStart(2, '0')}`;
  const seguinte = m === 12 ? `${ano + 1}-01` : `${ano}-${String(m + 1).padStart(2, '0')}`;
  const nomeDoMes = new Date(Date.UTC(ano, m - 1, 1)).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

  const doDia = selecionado ? (porDia.get(selecionado) ?? []) : [];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Link
            href={`/painel/tarefas?mes=${anterior}`}
            aria-label="Mês anterior"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-fio text-neve transition-colors hover:bg-white/5"
          >
            <span aria-hidden>←</span>
          </Link>
          <p className="min-w-[11rem] text-center font-display text-lg font-bold tracking-[-0.02em] first-letter:uppercase">
            {nomeDoMes}
          </p>
          <Link
            href={`/painel/tarefas?mes=${seguinte}`}
            aria-label="Próximo mês"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-fio text-neve transition-colors hover:bg-white/5"
          >
            <span aria-hidden>→</span>
          </Link>
          {hoje.slice(0, 7) !== mes ? (
            <Link
              href={`/painel/tarefas?mes=${hoje.slice(0, 7)}`}
              className="ml-1 rounded-full border border-fio px-4 py-2 text-xs font-semibold text-neve transition-colors hover:bg-white/5"
            >
              Hoje
            </Link>
          ) : null}
        </div>

        {/* O atraso que não está na tela é o que some em calendário.
            Aqui ele aparece com número e com caminho até lá. */}
        {atrasadasForaDaTela.length > 0 ? (
          <Link
            href={`/painel/tarefas?mes=${atrasadasForaDaTela[0].prazo!.slice(0, 7)}`}
            className="flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition-colors hover:bg-white/5"
            style={{ borderColor: `${CORES_SITUACAO.critico}66`, color: CORES_SITUACAO.critico }}
          >
            <span aria-hidden>▲</span>
            {atrasadasForaDaTela.length}{' '}
            {atrasadasForaDaTela.length === 1 ? 'atrasada' : 'atrasadas'} fora deste mês
          </Link>
        ) : null}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div>
          <table className="w-full table-fixed border-separate border-spacing-1">
            <caption className="sr-only">
              Tarefas de {nomeDoMes}, por dia. Escolha um dia para ver e editar as tarefas
              dele.
            </caption>
            <thead>
              <tr>
                {DIAS.map((d) => (
                  <th
                    key={d}
                    scope="col"
                    className="pb-1 font-mono text-[0.68rem] font-normal uppercase tracking-[0.14em] text-cinza"
                  >
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: dias.length / 7 }, (_, semana) => (
                <tr key={semana}>
                  {dias.slice(semana * 7, semana * 7 + 7).map((dia) => {
                    const doMes = dentroDoMes(dia);
                    const daCelula = porDia.get(dia) ?? [];
                    const abertas = daCelula.filter(emAberto);
                    const temAtraso = abertas.length > 0 && dia < hoje;
                    const eHoje = dia === hoje;
                    const escolhido = dia === selecionado;

                    return (
                      <td key={dia} className="p-0 align-top">
                        <button
                          type="button"
                          onClick={() => setSelecionado(dia)}
                          aria-pressed={escolhido}
                          aria-label={`${diaDoMes(dia)}, ${daCelula.length} ${
                            daCelula.length === 1 ? 'tarefa' : 'tarefas'
                          }`}
                          className={
                            'h-full min-h-[5.5rem] w-full rounded-xl border p-2 text-left transition-colors ' +
                            (escolhido
                              ? 'border-magenta bg-magenta/10'
                              : 'border-fio hover:bg-white/[0.04] ') +
                            (doMes ? ' bg-white/[0.02]' : ' bg-transparent opacity-45')
                          }
                        >
                          <span className="flex items-center justify-between gap-1">
                            <span
                              className={
                                'tabular text-xs font-semibold ' +
                                (eHoje
                                  ? 'flex h-5 w-5 items-center justify-center rounded-full bg-magenta text-branco'
                                  : 'text-neve')
                              }
                            >
                              {diaDoMes(dia)}
                            </span>
                            {temAtraso ? (
                              <span
                                aria-hidden
                                className="text-[0.7rem]"
                                style={{ color: CORES_SITUACAO.critico }}
                              >
                                ▲
                              </span>
                            ) : null}
                          </span>

                          {/*
                            NO CELULAR, PONTO. NO RESTO, TÍTULO.

                            Medido: a célula tem 44px num telefone de
                            390px, e 127px numa tela de 1600px. Em 44px
                            não cabe título nenhum, e texto cortado em
                            duas letras não informa, só suja.

                            O ponto diz o que o telefone precisa saber
                            de relance, que é "tem coisa neste dia, e
                            quão urgente". O título vem no painel do
                            dia, a um toque, que é como o calendário do
                            telefone sempre funcionou.
                          */}
                          <span className="mt-1.5 flex flex-wrap gap-1 md:hidden">
                            {daCelula.slice(0, 4).map((t) => (
                              <span
                                key={t.id}
                                aria-hidden
                                className="h-1.5 w-1.5 rounded-full"
                                style={{
                                  backgroundColor:
                                    t.status === 'concluida'
                                      ? 'rgba(255,255,255,0.25)'
                                      : COR_PRIORIDADE[t.prioridade],
                                }}
                              />
                            ))}
                            {daCelula.length > 4 ? (
                              <span aria-hidden className="text-[0.6rem] leading-none text-cinza">
                                +{daCelula.length - 4}
                              </span>
                            ) : null}
                          </span>

                          <span className="mt-1.5 hidden space-y-1 md:block">
                            {daCelula.slice(0, 3).map((t) => (
                              <span
                                key={t.id}
                                /* O título inteiro no `title`: a grade
                                   corta por falta de largura, e quem
                                   quiser ler sem abrir o dia passa o
                                   mouse. */
                                title={t.titulo}
                                className={
                                  'block truncate rounded-md px-1.5 py-0.5 text-[0.7rem] leading-snug ' +
                                  (t.status === 'concluida'
                                    ? 'text-cinza line-through'
                                    : 'text-neve')
                                }
                                style={{
                                  backgroundColor:
                                    t.status === 'concluida'
                                      ? 'rgba(255,255,255,0.04)'
                                      : `${COR_PRIORIDADE[t.prioridade]}22`,
                                }}
                              >
                                <span aria-hidden className="mr-1">
                                  {t.status === 'concluida'
                                    ? '✓'
                                    : FORMA_PRIORIDADE[t.prioridade]}
                                </span>
                                {t.titulo}
                              </span>
                            ))}
                            {daCelula.length > 3 ? (
                              <span className="block px-1.5 text-[0.7rem] text-cinza">
                                mais {daCelula.length - 3}
                              </span>
                            ) : null}
                          </span>
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-5">
          <section className="cartao p-5">
            <h3 className="font-display text-base font-bold tracking-[-0.02em]">
              {selecionado
                ? new Date(`${selecionado}T12:00:00Z`).toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    day: '2-digit',
                    month: 'long',
                    timeZone: 'UTC',
                  })
                : 'Escolha um dia'}
            </h3>

            {selecionado && doDia.length === 0 ? (
              <p className="mt-3 text-sm leading-relaxed text-cinza">
                Nada marcado para este dia.
              </p>
            ) : null}

            <ul className="mt-4 space-y-4">
              {doDia.map((t) => (
                <li key={t.id} className="border-t border-fio pt-4 first:border-0 first:pt-0">
                  <p
                    className={
                      'text-sm font-semibold leading-snug ' +
                      (t.status === 'concluida' ? 'text-cinza line-through' : '')
                    }
                  >
                    <span
                      aria-hidden
                      className="mr-1.5"
                      style={{ color: COR_PRIORIDADE[t.prioridade] }}
                    >
                      {FORMA_PRIORIDADE[t.prioridade]}
                    </span>
                    {t.titulo}
                  </p>
                  <p className="mt-1 text-xs text-cinza">
                    {rotuloPrioridade[t.prioridade]}
                    {t.conta ? ` · ${t.conta}` : ''}
                    {t.responsavel ? ` · ${t.responsavel}` : ''}
                  </p>
                  {t.detalhe ? (
                    <p className="mt-1.5 text-xs leading-relaxed text-cinza">{t.detalhe}</p>
                  ) : null}
                  {podeEscrever ? (
                    <div className="mt-2.5">
                      <AcoesTarefa
                        tarefa={t}
                        clientes={clientes}
                        equipe={equipe}
                        hoje={hoje}
                        podeExcluir={podeExcluir}
                      />
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>

          {/* Sem prazo não é sem importância: é o que ninguém marcou
              ainda. Fora da grade por não ter dia, e na tela porque
              sumir daqui é sumir do trabalho. */}
          <section className="cartao p-5">
            <h3 className="font-display text-base font-bold tracking-[-0.02em]">
              Sem prazo
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-cinza">
              {semPrazo.length === 0
                ? 'Tudo o que está aberto tem dia marcado.'
                : 'Não cabem na grade porque não têm dia. Arraste para uma data abrindo a tarefa.'}
            </p>
            <ul className="mt-3 space-y-2">
              {semPrazo.map((t) => (
                <li key={t.id} className="flex items-start gap-2 text-sm">
                  <span
                    aria-hidden
                    className="mt-0.5"
                    style={{ color: COR_PRIORIDADE[t.prioridade] }}
                  >
                    {FORMA_PRIORIDADE[t.prioridade]}
                  </span>
                  <span className="min-w-0">
                    <span className="block leading-snug">{t.titulo}</span>
                    {t.conta ? (
                      <span className="mt-0.5 block text-xs text-cinza">{t.conta}</span>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
