'use client';

import { useState, useOptimistic, useTransition, useRef } from 'react';
import Link from 'next/link';
import {
  moverLead,
  perderLead,
  atualizarLead,
  converterEmCliente,
  registrarInteracao,
} from '@/app/painel/acoes-crm';
import type { Resultado } from '@/app/painel/acoes';
import type { Lead, Estagio, Interacao, Prospecto } from '@/lib/dados/tipos';
import { ESTAGIOS, rotuloEstagio, explicaPrioridadeProspeccao } from '@/lib/dados/tipos';
import { contagemCurta } from '@/lib/formato';
import { BotaoCopiar } from './BotaoCopiar';
import { donoConhecido, partesDaAbordagem } from '@/lib/dominio/abordagem.ts';
import { dinheiro, dinheiroCurto } from '@/lib/formato';
import { LIMIAR_PARADO_DIAS } from '@/lib/dominio/metricas.ts';

/*
  Kanban do funil.

  As colunas são os estágios ABERTOS. "Ganho" e "perdido" ficam de fora
  do quadro de propósito: são estados finais, e uma coluna de ganhos que
  cresce para sempre empurra o funil de trabalho para fora da tela.
*/
const COLUNAS = ESTAGIOS.filter((e) => e !== 'ganho' && e !== 'perdido');

const campo =
  'w-full rounded-xl border border-fio bg-white/[0.03] px-4 py-3 text-sm text-branco ' +
  'outline-none transition-colors placeholder:text-cinza/60 focus:border-magenta';

export function Kanban({
  leads,
  podeEditar,
  interacoes = {},
  pesquisas = {},
}: {
  leads: Lead[];
  podeEditar: boolean;
  /** Conversas já registradas, por lead. Vêm prontas do servidor: uma
      consulta por card seria N+1 com o funil inteiro na tela. */
  interacoes?: Record<string, Interacao[]>;
  /** A pesquisa de prospecção, para os leads que vieram de uma lista.
      Quem chegou pelo site não tem, e a ficha simplesmente não mostra
      o bloco. */
  pesquisas?: Record<string, Prospecto>;
}) {
  const [pendente, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [aberto, setAberto] = useState<Lead | null>(null);
  const [sobre, setSobre] = useState<Estagio | null>(null);
  const [busca, setBusca] = useState('');
  const arrastando = useRef<string | null>(null);

  /*
    Atualização otimista.

    Sem ela, o card só muda de coluna depois da ida e volta ao servidor,
    e o cursor solta o card num lugar e ele aparece no outro meio segundo
    depois. Com ela, o card muda na hora; se o servidor recusar, o React
    devolve o estado anterior sozinho ao fim da transição.
  */
  const [otimista, moverOtimista] = useOptimistic(
    leads,
    (atual: Lead[], mudanca: { id: string; estagio: Estagio }) =>
      atual.map((l) =>
        l.id === mudanca.id ? { ...l, estagio: mudanca.estagio, diasNoEstagio: 0 } : l,
      ),
  );

  function soltar(estagio: Estagio) {
    const id = arrastando.current;
    arrastando.current = null;
    setSobre(null);
    if (!id) return;

    const lead = otimista.find((l) => l.id === id);
    if (!lead || lead.estagio === estagio) return;

    setErro(null);
    iniciar(async () => {
      moverOtimista({ id, estagio });
      const fd = new FormData();
      fd.set('id', id);
      fd.set('estagio', estagio);
      const r: Resultado = await moverLead(null, fd);
      if (!r.ok) setErro(r.mensagem);
    });
  }

  /* Busca sem acento e sem caixa: quem procura "aurora" quer achar
     "Loja Aurora", e quem digita "indicacao" quer achar "Indicação". */
  const normalizar = (t: string) =>
    t.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

  const termo = normalizar(busca.trim());
  const filtrados = termo
    ? otimista.filter((l) =>
        normalizar(
          [l.empresa, l.nome, l.origem, l.responsavel, l.proximoPasso].filter(Boolean).join(' '),
        ).includes(termo),
      )
    : otimista;

  return (
    <>
      {erro ? (
        <p
          role="alert"
          className="mb-4 rounded-xl border border-magenta/40 bg-magenta/10 px-4 py-3 text-sm text-magenta-texto"
        >
          {erro}
        </p>
      ) : null}

      {/* Busca no funil.

          Com quarenta leads, achar um vira rolagem por cinco colunas. O
          filtro roda no CLIENTE, sobre a lista que já está na memória:
          ir ao servidor a cada tecla daria latência a um filtro que a
          resposta cabe inteira na tela.

          A contagem de cada coluna continua sendo a dos leads FILTRADOS,
          e não a do funil todo. Coluna dizendo 12 com 2 cards à vista é
          o tipo de número que faz alguém desconfiar da tela inteira. */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por loja, contato ou origem"
          aria-label="Buscar no funil"
          className="min-w-0 grow rounded-full border border-fio bg-white/[0.03] px-5 py-2.5 text-sm text-branco outline-none transition-colors placeholder:text-cinza/60 focus:border-magenta sm:max-w-sm"
        />
        {busca ? (
          <button
            type="button"
            onClick={() => setBusca('')}
            className="inline-flex min-h-[24px] items-center rounded-full border border-fio px-4 py-2 text-xs font-semibold text-neve transition-colors hover:bg-white/5"
          >
            Limpar
          </button>
        ) : null}
        {busca ? (
          <span aria-live="polite" className="text-xs text-cinza">
            {filtrados.length} de {otimista.length}
          </span>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {COLUNAS.map((estagio) => {
          const daColuna = filtrados.filter((l) => l.estagio === estagio);
          const total = daColuna.reduce((s, l) => s + (l.valorFee ?? 0), 0);

          return (
            <section
              key={estagio}
              onDragOver={(e) => {
                if (!podeEditar) return;
                /* preventDefault é o que AUTORIZA o drop. Sem ele o
                   navegador recusa e o card volta para a origem. */
                e.preventDefault();
                setSobre(estagio);
              }}
              onDragLeave={() => setSobre((s) => (s === estagio ? null : s))}
              onDrop={() => soltar(estagio)}
              className={
                'rounded-2xl border p-4 transition-colors ' +
                (sobre === estagio
                  ? 'border-magenta bg-magenta/10'
                  : 'border-fio bg-white/[0.02]')
              }
            >
              <header className="flex items-baseline justify-between gap-2">
                <h3 className="font-mono text-[0.75rem] uppercase tracking-[0.14em] text-magenta-texto">
                  {rotuloEstagio[estagio]}
                </h3>
                <span className="tabular text-sm font-semibold">{daColuna.length}</span>
              </header>
              <p className="tabular mt-1 text-xs text-cinza">{dinheiroCurto(total)}</p>

              <ul className="mt-4 space-y-2.5">
                {daColuna.length === 0 ? (
                  <li className="rounded-xl border border-dashed border-fio px-4 py-6 text-center text-xs text-cinza">
                    {podeEditar ? 'Arraste um lead para cá' : 'Vazio'}
                  </li>
                ) : (
                  daColuna.map((l) => {
                    const parado = l.diasNoEstagio >= LIMIAR_PARADO_DIAS;
                    return (
                      <li key={l.id}>
                        <button
                          type="button"
                          draggable={podeEditar}
                          onDragStart={() => {
                            arrastando.current = l.id;
                          }}
                          onDragEnd={() => {
                            arrastando.current = null;
                            setSobre(null);
                          }}
                          onClick={() => setAberto(l)}
                          className={
                            'w-full rounded-xl border bg-marinho-alto/50 p-4 text-left transition-colors hover:bg-marinho-alto ' +
                            (parado ? 'border-[#FBBF24]/40' : 'border-fio') +
                            (podeEditar ? ' cursor-grab active:cursor-grabbing' : '')
                          }
                        >
                          <p className="text-sm font-semibold leading-snug">
                            {l.empresa ?? l.nome}
                          </p>
                          <p className="mt-1 text-xs text-cinza">{l.nome}</p>

                          <p className="tabular mt-2.5 text-xs">
                            <span className="text-neve">{dinheiro(l.valorFee)}</span>
                            {l.probabilidade !== null ? (
                              <span className="ml-2 text-cinza">{l.probabilidade}%</span>
                            ) : null}
                          </p>

                          {l.proximoPasso ? (
                            <p className="mt-2.5 border-t border-fio pt-2.5 text-xs leading-snug text-cinza">
                              <span aria-hidden className="mr-1 text-magenta-texto">→</span>
                              {l.proximoPasso}
                            </p>
                          ) : null}

                          {/* Cor + ÍCONE + texto: nunca cor sozinha. */}
                          {parado ? (
                            <p
                              className="mt-2.5 flex items-center gap-1.5 text-[0.75rem] font-semibold"
                              style={{ color: '#FBBF24' }}
                            >
                              <span aria-hidden>▲</span>
                              parado há {l.diasNoEstagio} dias
                            </p>
                          ) : null}
                        </button>
                      </li>
                    );
                  })
                )}
              </ul>
            </section>
          );
        })}
      </div>

      {pendente ? (
        <p className="mt-4 font-mono text-[0.75rem] uppercase tracking-[0.14em] text-cinza">
          salvando...
        </p>
      ) : null}

      {aberto ? (
        <FichaLead
          lead={aberto}
          podeEditar={podeEditar}
          conversas={interacoes[aberto.id] ?? []}
          pesquisa={pesquisas[aberto.id]}
          aoFechar={() => setAberto(null)}
        />
      ) : null}
    </>
  );
}

/* ================================================================== */
/* Ficha do lead                                                       */
/* ================================================================== */

function FichaLead({
  lead,
  podeEditar,
  conversas,
  pesquisa,
  aoFechar,
}: {
  lead: Lead;
  podeEditar: boolean;
  conversas: Interacao[];
  pesquisa?: Prospecto;
  aoFechar: () => void;
}) {
  const [aba, setAba] = useState<'passo' | 'conversa' | 'ganhar' | 'perder'>('passo');
  const [r, setR] = useState<Resultado | null>(null);
  const [pendente, iniciar] = useTransition();

  const enviar = (acao: (a: Resultado | null, f: FormData) => Promise<Resultado>) =>
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      iniciar(async () => {
        const res = await acao(null, fd);
        setR(res);
        if (res.ok) setTimeout(aoFechar, 900);
      });
    };

  return (
    /* Painel lateral, e não modal centralizado: o quadro continua
       visível ao lado, e dá para ver de onde o card saiu. */
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Fechar"
        onClick={aoFechar}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      <div className="relative flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-fio bg-marinho-fundo p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-extrabold tracking-[-0.03em]">
              {lead.empresa ?? lead.nome}
            </h2>
            {/* O @ vira link quando a pesquisa trouxe o endereço. É o
                gesto que a pessoa faria de qualquer jeito: copiar o
                arroba e procurar no Instagram. */}
            <p className="mt-1 text-sm text-cinza">
              {pesquisa?.instagramUrl ? (
                <a
                  href={pesquisa.instagramUrl}
                  target="_blank"
                  rel="noopener"
                  className="text-magenta-texto underline-offset-4 hover:underline"
                >
                  {lead.nome}
                </a>
              ) : (
                lead.nome
              )}
              {pesquisa?.cidade ? <span> · {pesquisa.cidade}</span> : null}
            </p>
          </div>
          <button
            type="button"
            onClick={aoFechar}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-fio text-cinza transition-colors hover:bg-white/5"
          >
            <span aria-hidden>×</span>
            <span className="sr-only">Fechar</span>
          </button>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-4 border-y border-fio py-5 text-sm">
          <div>
            <dt className="font-mono text-[0.75rem] uppercase tracking-[0.14em] text-cinza">
              Fee estimado
            </dt>
            <dd className="tabular mt-1 font-semibold">{dinheiro(lead.valorFee)}</dd>
          </div>
          <div>
            <dt className="font-mono text-[0.75rem] uppercase tracking-[0.14em] text-cinza">
              Verba estimada
            </dt>
            <dd className="tabular mt-1 font-semibold">{dinheiro(lead.valorVerba)}</dd>
          </div>
          <div>
            <dt className="font-mono text-[0.75rem] uppercase tracking-[0.14em] text-cinza">
              Estágio
            </dt>
            <dd className="mt-1">{rotuloEstagio[lead.estagio]}</dd>
          </div>
          <div>
            <dt className="font-mono text-[0.75rem] uppercase tracking-[0.14em] text-cinza">
              Há quanto tempo
            </dt>
            <dd className="mt-1">{lead.diasNoEstagio} dias</dd>
          </div>
        </dl>

        {lead.motivoPerda ? (
          <p className="mt-5 rounded-xl border border-fio bg-white/[0.02] px-4 py-3 text-sm text-cinza">
            <strong className="text-neve">Motivo da perda:</strong> {lead.motivoPerda}
          </p>
        ) : null}

        {/* Contato à mão. Abrir o WhatsApp direto daqui é o gesto que a
            pessoa ia fazer de qualquer jeito, copiando o número para
            outro app. */}
        {lead.telefone || lead.email ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {lead.telefone ? (
              <a
                href={`https://wa.me/55${lead.telefone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener"
                className="inline-flex min-h-[24px] items-center rounded-full border border-fio px-4 py-2 text-xs font-semibold text-neve transition-colors hover:bg-white/5"
              >
                WhatsApp
              </a>
            ) : null}
            {lead.email ? (
              <a
                href={`mailto:${lead.email}`}
                className="inline-flex min-h-[24px] items-center rounded-full border border-fio px-4 py-2 text-xs font-semibold text-neve transition-colors hover:bg-white/5"
              >
                {lead.email}
              </a>
            ) : null}
          </div>
        ) : null}

        {pesquisa ? <BlocoPesquisa pesquisa={pesquisa} /> : null}

        {/*
          Proposta a partir do lead.

          Antes eram dois cadastros separados e o nome da loja era
          digitado duas vezes. Pior que o trabalho repetido é a
          divergência: "Loja Aurora" no funil e "Aurora Store" na
          proposta viram dois clientes na cabeça de quem lê o relatório.

          O link leva o id, e a tela de propostas preenche o resto.
        */}
        {podeEditar && lead.estagio !== 'ganho' && lead.estagio !== 'perdido' ? (
          <Link
            href={`/painel/propostas?lead=${lead.id}`}
            className="mt-5 inline-flex items-center gap-2 rounded-full border border-magenta/50 bg-magenta/10 px-5 py-2.5 text-sm font-semibold text-magenta-texto transition-colors hover:bg-magenta hover:text-branco"
          >
            Gerar proposta para este lead
            <span aria-hidden>→</span>
          </Link>
        ) : null}

        {podeEditar && lead.estagio !== 'ganho' && lead.estagio !== 'perdido' ? (
          <>
            {/* `flex-wrap`: com "Conversas (3)" os quatro rótulos passavam de
                  390px e a ficha ganhava 1px de rolagem lateral. */}
            <nav className="mt-7 flex flex-wrap gap-2" aria-label="O que fazer com este lead">
              {[
                { k: 'passo' as const, r: 'Próximo passo' },
                { k: 'conversa' as const, r: `Conversas${conversas.length ? ` (${conversas.length})` : ''}` },
                { k: 'ganhar' as const, r: 'Converter' },
                { k: 'perder' as const, r: 'Perder' },
              ].map((t) => (
                <button
                  key={t.k}
                  type="button"
                  onClick={() => { setAba(t.k); setR(null); }}
                  aria-current={aba === t.k ? 'true' : undefined}
                  className={
                    'rounded-full px-4 py-2 text-xs font-semibold transition-colors ' +
                    (aba === t.k ? 'bg-magenta text-branco' : 'border border-fio text-neve hover:bg-white/5')
                  }
                >
                  {t.r}
                </button>
              ))}
            </nav>

            <div className="mt-5">
              {aba === 'conversa' ? (
                <div className="space-y-5">
                  {/* Registro rápido, aberto. O diário de um lead só
                      serve se for alimentado logo depois da conversa, e
                      um clique a mais é o suficiente para a pessoa
                      deixar para depois. */}
                  <form onSubmit={enviar(registrarInteracao)} className="space-y-3">
                    <input type="hidden" name="lead_id" value={lead.id} />
                    <input type="hidden" name="conta_id" value="" />

                    <div className="flex gap-3">
                      <select
                        name="tipo"
                        defaultValue="whatsapp"
                        aria-label="Tipo de conversa"
                        className={`w-36 shrink-0 ${campo}`}
                      >
                        {[
                          ['whatsapp', 'WhatsApp'],
                          ['ligacao', 'Ligação'],
                          ['reuniao', 'Reunião'],
                          ['email', 'E-mail'],
                          ['nota', 'Nota'],
                        ].map(([v, r]) => (
                          <option key={v} value={v}>
                            {r}
                          </option>
                        ))}
                      </select>
                      <input
                        name="resumo"
                        required
                        placeholder="O que ficou combinado"
                        aria-label="Resumo da conversa"
                        className={campo}
                      />
                    </div>

                    <Botao pendente={pendente}>Registrar</Botao>
                  </form>

                  {conversas.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-fio px-4 py-6 text-center text-xs leading-relaxed text-cinza">
                      Nenhuma conversa registrada. É esse histórico que responde
                      &ldquo;por que esse lead parou?&rdquo; três semanas depois.
                    </p>
                  ) : (
                    <ol className="space-y-3 border-t border-fio pt-5">
                      {conversas.map((c) => (
                        <li key={c.id} className="rounded-xl border border-fio bg-white/[0.02] p-4">
                          <p className="flex flex-wrap items-baseline gap-x-3">
                            <span className="rounded-full border border-fio px-2.5 py-0.5 font-mono text-[0.75rem] uppercase tracking-[0.1em] text-magenta-texto">
                              {c.tipo}
                            </span>
                            <span className="text-xs text-cinza">{c.autor ?? 'Sistema'}</span>
                            <span className="tabular ml-auto font-mono text-[0.75rem] text-cinza">
                              {new Date(c.em).toLocaleDateString('pt-BR', {
                                timeZone: 'America/Sao_Paulo',
                                day: '2-digit',
                                month: '2-digit',
                              })}
                            </span>
                          </p>
                          <p className="mt-2 text-sm leading-relaxed text-neve">{c.resumo}</p>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              ) : null}

              {aba === 'passo' ? (
                <form onSubmit={enviar(atualizarLead)} className="space-y-4">
                  <input type="hidden" name="id" value={lead.id} />
                  <div>
                    <label htmlFor="pp" className="block font-mono text-[0.75rem] uppercase tracking-[0.14em] text-cinza">
                      Próximo passo
                    </label>
                    <input
                      id="pp"
                      name="proximo_passo"
                      defaultValue={lead.proximoPasso ?? ''}
                      placeholder="Cobrar retorno da proposta"
                      className={`mt-2 ${campo}`}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="ppe" className="block font-mono text-[0.75rem] uppercase tracking-[0.14em] text-cinza">
                        Quando
                      </label>
                      <input
                        id="ppe"
                        name="proximo_passo_em"
                        type="date"
                        defaultValue={lead.proximoPassoEm ?? ''}
                        className={`mt-2 ${campo}`}
                      />
                    </div>
                    <div>
                      <label htmlFor="pb" className="block font-mono text-[0.75rem] uppercase tracking-[0.14em] text-cinza">
                        Probabilidade
                      </label>
                      <input
                        id="pb"
                        name="probabilidade"
                        type="number"
                        min={0}
                        max={100}
                        defaultValue={lead.probabilidade ?? ''}
                        placeholder="0 a 100"
                        className={`mt-2 ${campo}`}
                      />
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed text-cinza">
                    A probabilidade pondera a previsão do funil. Sem ela, a soma trata
                    como certo o lead que ainda não respondeu.
                  </p>
                  <Botao pendente={pendente}>Salvar</Botao>
                </form>
              ) : null}

              {aba === 'ganhar' ? (
                <form onSubmit={enviar(converterEmCliente)} className="space-y-4">
                  <input type="hidden" name="id" value={lead.id} />
                  <p className="text-sm leading-relaxed text-cinza">
                    Converter cria a loja, o contrato, o acesso do responsável e as cinco
                    tarefas de onboarding — tudo numa transação só. Se qualquer parte
                    falhar, nada é criado.
                  </p>
                  <div>
                    <label htmlFor="fee" className="block font-mono text-[0.75rem] uppercase tracking-[0.14em] text-cinza">
                      Fee mensal fechado *
                    </label>
                    <input
                      id="fee"
                      name="fee_mensal"
                      required
                      defaultValue={lead.valorFee ?? ''}
                      inputMode="decimal"
                      className={`mt-2 ${campo}`}
                    />
                  </div>
                  <div>
                    <label htmlFor="plat" className="block font-mono text-[0.75rem] uppercase tracking-[0.14em] text-cinza">
                      Plataforma da loja
                    </label>
                    <input
                      id="plat"
                      name="plataforma"
                      list="plataformas-lead"
                      placeholder="Shopify, Magazord..."
                      className={`mt-2 ${campo}`}
                    />
                    <datalist id="plataformas-lead">
                      {['Shopify', 'Magazord', 'Nuvemshop', 'Tray', 'VTEX', 'WooCommerce'].map((p) => (
                        <option key={p} value={p} />
                      ))}
                    </datalist>
                  </div>
                  <Botao pendente={pendente}>Converter em cliente</Botao>
                </form>
              ) : null}

              {aba === 'perder' ? (
                <form onSubmit={enviar(perderLead)} className="space-y-4">
                  <input type="hidden" name="id" value={lead.id} />
                  <div>
                    <label htmlFor="mp" className="block font-mono text-[0.75rem] uppercase tracking-[0.14em] text-cinza">
                      Por que foi perdido? *
                    </label>
                    <textarea
                      id="mp"
                      name="motivo_perda"
                      required
                      rows={3}
                      placeholder="Escolheu uma agência mais barata"
                      className={`mt-2 ${campo}`}
                    />
                  </div>
                  <p className="text-xs leading-relaxed text-cinza">
                    O motivo é obrigatório. Sem ele, &ldquo;perdido&rdquo; vira um
                    cemitério sem aprendizado, e três meses depois ninguém sabe se o
                    padrão era preço, prazo ou um concorrente específico.
                  </p>
                  <Botao pendente={pendente}>Marcar como perdido</Botao>
                </form>
              ) : null}
            </div>
          </>
        ) : null}

        {r ? (
          <p
            role="status"
            className={
              'mt-5 rounded-xl border px-4 py-3 text-sm ' +
              (r.ok
                ? 'border-[#4ADE80]/40 bg-[#4ADE80]/10 text-[#4ADE80]'
                : 'border-magenta/40 bg-magenta/10 text-magenta-texto')
            }
          >
            {r.mensagem}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function Botao({ pendente, children }: { pendente: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={pendente}
      className="w-full rounded-full bg-magenta px-7 py-3 text-sm font-semibold text-branco transition-colors hover:bg-magenta-forte disabled:opacity-60"
    >
      {pendente ? 'Salvando...' : children}
    </button>
  );
}

/* ================================================================== */
/* A pesquisa, quando o lead veio de uma lista de prospecção           */
/* ================================================================== */

/**
 * O que se sabia da empresa ANTES de falar com ela.
 *
 * Aparece só para quem veio de prospecção ativa. Um lead que chegou
 * pelo site não tem pesquisa nenhuma, e um bloco vazio dizendo "—"
 * quatro vezes só ocuparia a ficha.
 *
 * A ordem é a da conversa: quem é e onde fica, como vende, o que
 * chamou atenção, e por último a mensagem pronta. O painel tem 448px,
 * então nada aqui assume duas colunas.
 */
function BlocoPesquisa({ pesquisa: p }: { pesquisa: Prospecto }) {
  const dono = donoConhecido(p.nomeContato, p.instagram);
  const partes = partesDaAbordagem(p.mensagemAbertura, dono);
  const oferta = partesDaAbordagem(p.mensagemOferta, dono);

  const fatos = [
    p.segmento,
    p.modeloVenda,
    p.fabricacaoPropria === 'Sim' ? 'Fabricação própria' : 'Fabricação a confirmar',
    p.situacaoSite,
    p.seguidores !== null ? `${contagemCurta(p.seguidores)} seguidores` : null,
  ].filter(Boolean) as string[];

  return (
    <section className="mt-6 rounded-2xl border border-fio bg-white/[0.02] p-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-mono text-[0.75rem] uppercase tracking-[0.14em] text-magenta-texto">
          Prospecção
        </h3>
        {p.prioridade ? (
          <span
            title={explicaPrioridadeProspeccao[p.prioridade]}
            className="rounded-full border border-fio px-3 py-1 font-mono text-[0.75rem] font-semibold tracking-[0.1em] text-neve"
          >
            Prioridade {p.prioridade}
          </span>
        ) : null}
      </header>

      {p.regiao || p.oportunidade ? (
        <p className="mt-3 text-sm leading-relaxed text-neve">
          {[p.regiao, p.oportunidade].filter(Boolean).join(' · ')}
        </p>
      ) : null}

      <ul className="mt-3 flex flex-wrap gap-2">
        {fatos.map((f) => (
          <li key={f} className="rounded-full border border-fio px-3 py-1 text-xs text-cinza">
            {f}
          </li>
        ))}
      </ul>

      {p.gancho ? (
        <p className="mt-4 border-l-2 border-magenta/50 pl-3 text-sm leading-relaxed text-neve">
          {p.gancho}
        </p>
      ) : null}

      {/* O perfil do DONO vem antes do da marca: a abordagem acontece
          com a pessoa, e o da marca serve para conferir que é ela. */}
      {p.instagramDono ? (
        <a
          href={`https://www.instagram.com/${p.instagramDono.replace('@', '')}/`}
          target="_blank"
          rel="noopener"
          className="mt-4 mr-2 inline-flex min-h-[24px] items-center gap-2 rounded-full border border-magenta/50 bg-magenta/10 px-4 py-2 text-xs font-semibold text-magenta-texto transition-colors hover:bg-magenta hover:text-branco"
        >
          Abrir {p.instagramDono}
          <span aria-hidden>&#8599;</span>
        </a>
      ) : null}

      {p.cnpj ? (
        <a
          href={`https://cnpj.biz/${p.cnpj}`}
          target="_blank"
          rel="noopener"
          className="mt-4 mr-2 inline-flex min-h-[24px] items-center gap-2 rounded-full border border-fio px-4 py-2 text-xs font-semibold text-neve transition-colors hover:bg-white/5"
        >
          Ver o CNPJ
          <span aria-hidden>&#8599;</span>
        </a>
      ) : null}

      {p.instagramUrl ? (
        <a
          href={p.instagramUrl}
          target="_blank"
          rel="noopener"
          className="mt-4 inline-flex min-h-[24px] items-center gap-2 rounded-full border border-fio px-4 py-2 text-xs font-semibold text-neve transition-colors hover:bg-white/5"
        >
          Abrir {p.instagram ?? 'o perfil'}
          <span aria-hidden>↗</span>
        </a>
      ) : null}

      {/* Fechada por padrão: a ficha existe para decidir o próximo
          passo, e a mensagem inteira empurraria os botões para fora da
          primeira tela. O Ctrl+F acha o texto mesmo assim. */}
      {p.mensagemAbertura ? (
        <details className="group mt-4 rounded-xl border border-fio">
          <summary className="cursor-pointer list-none px-4 py-3 text-xs font-semibold text-neve transition-colors hover:bg-white/5">
            <span aria-hidden className="mr-2 text-magenta-texto group-open:hidden">+</span>
            <span aria-hidden className="mr-2 hidden text-magenta-texto group-open:inline">−</span>
            1. A abordagem
            {p.canal ? <span className="ml-2 font-normal text-cinza">{p.canal}</span> : null}
          </summary>

          <div className="space-y-3 px-4 pb-4">
            {/* Na ficha, as partes numeradas sem moldura: o painel tem
                448px, e quatro caixas dentro de uma dobra dentro de um
                painel viram borda demais para pouco texto. */}
            <ol className="space-y-3">
              {partes.map((parte, i) => (
                <li key={parte}>
                  <p className="text-sm leading-relaxed text-neve">
                    <span aria-hidden className="mr-2 font-bold text-magenta-texto">
                      {i + 1}
                    </span>
                    {parte}
                  </p>
                  <div className="mt-2">
                    <BotaoCopiar texto={parte} rotulo={`Copiar a ${i + 1}ª`} />
                  </div>
                </li>
              ))}
            </ol>

            {oferta.length > 0 ? (
              <div className="border-t border-fio pt-3">
                <p className="font-mono text-[0.75rem] uppercase tracking-[0.14em] text-magenta-texto">
                  2. Quando ele responder
                </p>
                {oferta.map((parte, i) => (
                  <div key={parte} className="mt-2.5">
                    <p className="text-sm leading-relaxed text-neve">{parte}</p>
                    <div className="mt-2">
                      <BotaoCopiar texto={parte} rotulo={`Copiar a ${i + 1}ª`} />
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {p.perguntaSeguinte ? (
              <div className="border-t border-fio pt-3">
                <p className="font-mono text-[0.75rem] uppercase tracking-[0.14em] text-magenta-texto">
                  3. Se ficar no vácuo
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-neve">{p.perguntaSeguinte}</p>
                <div className="mt-3">
                  <BotaoCopiar texto={p.perguntaSeguinte} rotulo="Copiar pergunta" />
                </div>
              </div>
            ) : null}

            {p.perguntas ? (
              <div className="border-t border-fio pt-3">
                <p className="font-mono text-[0.75rem] uppercase tracking-[0.14em] text-cinza">
                  Perguntas de qualificação
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-cinza">{p.perguntas}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-cinza">
                  Para a conversa, quando ela existir. Não mande as três numa DM.
                </p>
              </div>
            ) : null}
          </div>
        </details>
      ) : null}

      {p.notas ? (
        <p className="mt-3 text-xs leading-relaxed text-cinza">{p.notas}</p>
      ) : null}

      <p className="mt-4 text-xs text-cinza">
        <Link
          href="/painel/prospeccao"
          className="text-magenta-texto underline-offset-4 hover:underline"
        >
          Ver a lista de prospecção
        </Link>
        {p.codigo ? <span className="ml-2">· {p.codigo}</span> : null}
      </p>
    </section>
  );
}
