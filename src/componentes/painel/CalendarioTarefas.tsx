'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Tarefa } from '@/lib/dados/tipos';
import { rotuloPrioridade, rotuloRecorrencia } from '@/lib/dados/tipos';
import { AcoesTarefa, FormNovaTarefa } from './FormTarefa';
import { CORES_SITUACAO } from './paleta';

/**
 * O mês de trabalho, em grade, e o dia num popup.
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
 * ============================================================
 * POR QUE O DIA ABRE EM POPUP, E NÃO NUMA COLUNA AO LADO
 * ============================================================
 * A primeira versão tinha uma coluna de 20rem à direita. O formulário
 * de edição não cabia nela: os rótulos colidiam, "PRIORIDADE" e
 * "AVISAR" apareciam colados na mesma linha, e a grade perdia um
 * quarto da largura o tempo todo para um painel que fica vazio na
 * maior parte do uso.
 *
 * No popup, a grade usa a tela inteira e o dia recebe a largura de que
 * precisa quando é chamado. É também o gesto que a pessoa já tem: no
 * calendário do telefone, tocar num dia abre o dia.
 *
 * ============================================================
 * O QUE NÃO PODE SUMIR NUM CALENDÁRIO
 * ============================================================
 * 1. TAREFA SEM PRAZO. Não tem casa na grade, e ficaria invisível. Vai
 *    numa seção própria, porque "não tem data" é diferente de "não
 *    existe".
 *
 * 2. ATRASO DE OUTRO MÊS. A tarefa que venceu dia 28 do mês passado
 *    continua atrasada hoje, e quem abre novembro não a veria. O aviso
 *    do topo conta TODAS as atrasadas, inclusive as que não estão na
 *    tela, e leva até elas.
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
const diaDoMes = (dia: string) => Number(dia.slice(8, 10));

/** Data por extenso a partir do texto, com o meio-dia UTC fixo para o
    fuso do navegador não mudar o dia. */
function porExtenso(dia: string, opcoes: Intl.DateTimeFormatOptions) {
  return new Date(`${dia}T12:00:00Z`).toLocaleDateString('pt-BR', {
    ...opcoes,
    timeZone: 'UTC',
  });
}

/**
 * Os dias da grade, do domingo antes do dia 1 até o sábado depois do
 * último. Tudo em texto `YYYY-MM-DD`, e nunca em `Date` montado a
 * partir de string: é assim que o dia 1 vira dia 30 do mês anterior
 * para quem está a oeste de Greenwich.
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
      de atraso e a seção sem prazo dependem delas. */
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
  const [aberto, setAberto] = useState<string | null>(null);

  const porDia = new Map<string, Tarefa[]>();
  const semPrazo: Tarefa[] = [];
  for (const t of tarefas) {
    if (!t.prazo) {
      if (emAberto(t)) semPrazo.push(t);
      continue;
    }
    porDia.set(t.prazo, [...(porDia.get(t.prazo) ?? []), t]);
  }

  const atrasadas = tarefas.filter((t) => emAberto(t) && t.prazo !== null && t.prazo < hoje);
  const foraDaTela = atrasadas.filter((t) => !dentroDoMes(t.prazo!));

  const [ano, m] = mes.split('-').map(Number);
  const anterior = m === 1 ? `${ano - 1}-12` : `${ano}-${String(m - 1).padStart(2, '0')}`;
  const seguinte = m === 12 ? `${ano + 1}-01` : `${ano}-${String(m + 1).padStart(2, '0')}`;
  const nomeDoMes = porExtenso(`${mes}-01`, { month: 'long', year: 'numeric' });

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
        {foraDaTela.length > 0 ? (
          <Link
            href={`/painel/tarefas?mes=${foraDaTela[0].prazo!.slice(0, 7)}`}
            className="flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition-colors hover:bg-white/5"
            style={{ borderColor: `${CORES_SITUACAO.critico}66`, color: CORES_SITUACAO.critico }}
          >
            <span aria-hidden>▲</span>
            {foraDaTela.length} {foraDaTela.length === 1 ? 'atrasada' : 'atrasadas'} fora
            deste mês
          </Link>
        ) : null}
      </div>

      <table className="mt-5 w-full table-fixed border-separate border-spacing-1">
        <caption className="sr-only">
          Tarefas de {nomeDoMes}, por dia. Escolha um dia para abrir as tarefas dele.
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
                const abertasNoDia = daCelula.filter(emAberto);
                const temAtraso = abertasNoDia.length > 0 && dia < hoje;
                const eHoje = dia === hoje;

                return (
                  <td key={dia} className="p-0 align-top">
                    <button
                      type="button"
                      onClick={() => setAberto(dia)}
                      aria-label={`${porExtenso(dia, { day: '2-digit', month: 'long' })}, ${
                        daCelula.length
                      } ${daCelula.length === 1 ? 'tarefa' : 'tarefas'}`}
                      className={
                        'group h-full min-h-[6rem] w-full rounded-xl border p-2 text-left transition-colors md:min-h-[7rem] ' +
                        (temAtraso
                          ? 'border-[#F8717166] bg-[#F871710d] hover:bg-[#F8717118] '
                          : 'border-fio hover:border-magenta/50 hover:bg-white/[0.05] ') +
                        (doMes ? 'bg-white/[0.02]' : 'bg-transparent opacity-45')
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
                        {daCelula.length > 0 ? (
                          <span className="tabular text-[0.65rem] text-cinza">
                            {daCelula.length}
                          </span>
                        ) : null}
                      </span>

                      {/*
                        NO CELULAR, PONTO. NO RESTO, TÍTULO.

                        Medido: a célula tem 44px num telefone de 390px
                        e 127px numa tela de 1600px. Em 44px não cabe
                        título, e texto cortado em duas letras não
                        informa, suja. O ponto diz o que o telefone
                        precisa saber de relance, e o título vem no
                        popup, a um toque.
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
                            /* O título inteiro no `title`: a grade corta
                               por falta de largura, e quem quiser ler
                               sem abrir o dia passa o mouse. */
                            title={t.titulo}
                            className={
                              'flex items-center gap-1 truncate rounded-md px-1.5 py-0.5 text-[0.7rem] leading-snug ' +
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
                            <span
                              aria-hidden
                              className="flex-none"
                              style={{
                                color:
                                  t.status === 'concluida'
                                    ? 'var(--cinza)'
                                    : COR_PRIORIDADE[t.prioridade],
                              }}
                            >
                              {t.status === 'concluida' ? '✓' : FORMA_PRIORIDADE[t.prioridade]}
                            </span>
                            <span className="truncate">{t.titulo}</span>
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

      {/* Sem prazo não é sem importância: é o que ninguém marcou ainda.
          Fora da grade por não ter dia, e na tela porque sumir daqui é
          sumir do trabalho. */}
      {semPrazo.length > 0 ? (
        <section className="cartao mt-6 p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h3 className="font-display text-base font-bold tracking-[-0.02em]">
              {semPrazo.length} {semPrazo.length === 1 ? 'tarefa sem prazo' : 'tarefas sem prazo'}
            </h3>
            <p className="text-xs text-cinza">
              Não cabem na grade porque não têm dia. Abra e defina um prazo.
            </p>
          </div>
          <ul className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {semPrazo.map((t) => (
              <li key={t.id} className="rounded-xl border border-fio bg-white/[0.02] p-4">
                <p className="flex items-start gap-2 text-sm leading-snug">
                  <span
                    aria-hidden
                    className="mt-0.5 flex-none"
                    style={{ color: COR_PRIORIDADE[t.prioridade] }}
                  >
                    {FORMA_PRIORIDADE[t.prioridade]}
                  </span>
                  <span className="min-w-0">{t.titulo}</span>
                </p>
                {t.conta || t.responsavel ? (
                  <p className="mt-1.5 text-xs text-cinza">
                    {[t.conta, t.responsavel].filter(Boolean).join(' · ')}
                  </p>
                ) : null}
                {podeEscrever ? (
                  <div className="mt-3">
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
      ) : null}

      {aberto ? (
        <PopupDoDia
          dia={aberto}
          tarefas={porDia.get(aberto) ?? []}
          hoje={hoje}
          clientes={clientes}
          equipe={equipe}
          podeEscrever={podeEscrever}
          podeExcluir={podeExcluir}
          aoFechar={() => setAberto(null)}
        />
      ) : null}
    </div>
  );
}

/* ================================================================== */
/* O dia                                                              */
/* ================================================================== */

/**
 * Tudo o que existe num dia, com o que se faz com cada coisa.
 *
 * ============================================================
 * POPUP CENTRADO, E NÃO GAVETA LATERAL
 * ============================================================
 * A ficha do lead é uma gaveta à direita porque o quadro do funil
 * precisa continuar visível ao lado: dá para ver de onde o card saiu.
 * Aqui é o contrário. O dia é o assunto inteiro enquanto está aberto,
 * e o formulário de edição precisa de largura, que foi exatamente o
 * que faltou na primeira versão.
 *
 * ============================================================
 * ESC FECHA
 * ============================================================
 * Modal que só fecha no X obriga a mão a sair do teclado. O ouvinte
 * vive num efeito porque é assinatura de evento do documento, e não
 * estado derivado de render.
 */
function PopupDoDia({
  dia,
  tarefas,
  hoje,
  clientes,
  equipe,
  podeEscrever,
  podeExcluir,
  aoFechar,
}: {
  dia: string;
  tarefas: Tarefa[];
  hoje: string;
  clientes: { id: string; nome: string }[];
  equipe: { id: string; nome: string }[];
  podeEscrever: boolean;
  podeExcluir: boolean;
  aoFechar: () => void;
}) {
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') aoFechar();
    };
    document.addEventListener('keydown', aoTeclar);
    return () => document.removeEventListener('keydown', aoTeclar);
  }, [aoFechar]);

  const abertas = tarefas.filter(emAberto);
  const feitas = tarefas.filter((t) => t.status === 'concluida');
  const atrasadas = abertas.filter(() => dia < hoje);
  const eHoje = dia === hoje;

  const resumo = [
    `${tarefas.length} ${tarefas.length === 1 ? 'tarefa' : 'tarefas'}`,
    feitas.length > 0 ? `${feitas.length} concluída${feitas.length === 1 ? '' : 's'}` : null,
    atrasadas.length > 0
      ? `${atrasadas.length} em atraso`
      : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Fechar"
        onClick={aoFechar}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={porExtenso(dia, { weekday: 'long', day: '2-digit', month: 'long' })}
        className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border border-fio bg-marinho-fundo sm:max-h-[85vh] sm:rounded-3xl"
      >
        {/* Cabeçalho fixo: numa lista longa, o dia e o botão de fechar
            não podem subir junto com a rolagem. */}
        <div className="flex items-start justify-between gap-4 border-b border-fio p-6">
          <div className="min-w-0">
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-magenta-texto">
              {eHoje ? 'Hoje' : porExtenso(dia, { weekday: 'long' })}
            </p>
            <h2 className="mt-1.5 font-display text-2xl font-extrabold tracking-[-0.03em] first-letter:uppercase">
              {porExtenso(dia, { day: '2-digit', month: 'long', year: 'numeric' })}
            </h2>
            <p className="mt-1 text-sm text-cinza">
              {tarefas.length === 0 ? 'Nada marcado neste dia' : resumo}
            </p>
          </div>
          <button
            type="button"
            onClick={aoFechar}
            aria-label="Fechar"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-fio text-cinza transition-colors hover:bg-white/5"
          >
            <span aria-hidden>×</span>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          {tarefas.length === 0 ? (
            <p className="max-w-[60ch] text-sm leading-relaxed text-cinza">
              O dia está livre. Se alguma coisa precisa acontecer aqui, crie abaixo: o prazo
              já vem com esta data.
            </p>
          ) : (
            <ul className="space-y-4">
              {[...tarefas]
                /* Em aberto primeiro, e concluída no fim: o que falta
                   fazer disputa atenção com o que já foi feito, e quem
                   abre o dia abre para trabalhar. */
                .sort((a, b) => Number(emAberto(b)) - Number(emAberto(a)))
                .map((t) => {
                  const feita = t.status === 'concluida';
                  const emAtraso = emAberto(t) && dia < hoje;

                  return (
                    <li
                      key={t.id}
                      className={
                        'rounded-2xl border p-5 ' +
                        (emAtraso
                          ? 'border-[#F8717166] bg-[#F871710d]'
                          : 'border-fio bg-white/[0.02]')
                      }
                    >
                      <div className="flex flex-wrap items-start justify-between gap-x-5 gap-y-2">
                        <p
                          className={
                            'min-w-0 text-base font-semibold leading-snug ' +
                            (feita || t.status === 'cancelada'
                              ? 'text-cinza line-through'
                              : 'text-branco')
                          }
                        >
                          <span
                            aria-hidden
                            className="mr-2"
                            style={{ color: COR_PRIORIDADE[t.prioridade] }}
                          >
                            {feita ? '✓' : FORMA_PRIORIDADE[t.prioridade]}
                          </span>
                          {t.titulo}
                        </p>

                        <span
                          className="shrink-0 font-mono text-[0.7rem] uppercase tracking-[0.12em]"
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
                              : emAtraso
                                ? 'em atraso'
                                : t.status === 'fazendo'
                                  ? 'fazendo'
                                  : 'aberta'}
                        </span>
                      </div>

                      {t.detalhe ? (
                        <p className="mt-2 max-w-[70ch] text-sm leading-relaxed text-cinza">
                          {t.detalhe}
                        </p>
                      ) : null}

                      {/* Os selos trazem o que a grade não coube: de
                          quem é, de qual cliente, e se repete. */}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full border border-fio px-3 py-1 text-xs text-neve">
                          {rotuloPrioridade[t.prioridade]}
                        </span>
                        {t.conta ? (
                          <span className="rounded-full border border-fio px-3 py-1 text-xs text-neve">
                            {t.conta}
                          </span>
                        ) : null}
                        <span className="rounded-full border border-fio px-3 py-1 text-xs text-neve">
                          {t.responsavel ?? 'sem responsável'}
                        </span>
                        {t.recorrencia !== 'nenhuma' ? (
                          <span className="rounded-full border border-fio px-3 py-1 text-xs text-neve">
                            <span aria-hidden className="mr-1">↻</span>
                            {rotuloRecorrencia[t.recorrencia]}
                          </span>
                        ) : null}
                      </div>

                      {podeEscrever ? (
                        <div className="mt-4 border-t border-fio pt-4">
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
                  );
                })}
            </ul>
          )}

          {podeEscrever ? (
            <div className="mt-6 border-t border-fio pt-6">
              <FormNovaTarefa
                clientes={clientes}
                equipe={equipe}
                hoje={hoje}
                prazoInicial={dia}
                rotulo={`Nova tarefa em ${porExtenso(dia, { day: '2-digit', month: 'short' })}`}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
