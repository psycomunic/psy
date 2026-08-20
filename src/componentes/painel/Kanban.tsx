'use client';

import { useState, useOptimistic, useTransition, useRef } from 'react';
import { moverLead, perderLead, atualizarLead, converterEmCliente } from '@/app/painel/acoes-crm';
import type { Resultado } from '@/app/painel/acoes';
import type { Lead, Estagio } from '@/lib/dados/tipos';
import { ESTAGIOS, rotuloEstagio } from '@/lib/dados/tipos';
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
}: {
  leads: Lead[];
  podeEditar: boolean;
}) {
  const [pendente, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [aberto, setAberto] = useState<Lead | null>(null);
  const [sobre, setSobre] = useState<Estagio | null>(null);
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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {COLUNAS.map((estagio) => {
          const daColuna = otimista.filter((l) => l.estagio === estagio);
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
                <h3 className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-magenta-texto">
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
                              className="mt-2.5 flex items-center gap-1.5 text-[0.68rem] font-semibold"
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
        <p className="mt-4 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-cinza">
          salvando...
        </p>
      ) : null}

      {aberto ? (
        <FichaLead lead={aberto} podeEditar={podeEditar} aoFechar={() => setAberto(null)} />
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
  aoFechar,
}: {
  lead: Lead;
  podeEditar: boolean;
  aoFechar: () => void;
}) {
  const [aba, setAba] = useState<'passo' | 'ganhar' | 'perder'>('passo');
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
            <p className="mt-1 text-sm text-cinza">{lead.nome}</p>
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
            <dt className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-cinza">
              Fee estimado
            </dt>
            <dd className="tabular mt-1 font-semibold">{dinheiro(lead.valorFee)}</dd>
          </div>
          <div>
            <dt className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-cinza">
              Verba estimada
            </dt>
            <dd className="tabular mt-1 font-semibold">{dinheiro(lead.valorVerba)}</dd>
          </div>
          <div>
            <dt className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-cinza">
              Estágio
            </dt>
            <dd className="mt-1">{rotuloEstagio[lead.estagio]}</dd>
          </div>
          <div>
            <dt className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-cinza">
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

        {podeEditar && lead.estagio !== 'ganho' && lead.estagio !== 'perdido' ? (
          <>
            <nav className="mt-7 flex gap-2" aria-label="O que fazer com este lead">
              {[
                { k: 'passo' as const, r: 'Próximo passo' },
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
              {aba === 'passo' ? (
                <form onSubmit={enviar(atualizarLead)} className="space-y-4">
                  <input type="hidden" name="id" value={lead.id} />
                  <div>
                    <label htmlFor="pp" className="block font-mono text-[0.6rem] uppercase tracking-[0.14em] text-cinza">
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
                      <label htmlFor="ppe" className="block font-mono text-[0.6rem] uppercase tracking-[0.14em] text-cinza">
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
                      <label htmlFor="pb" className="block font-mono text-[0.6rem] uppercase tracking-[0.14em] text-cinza">
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
                    <label htmlFor="fee" className="block font-mono text-[0.6rem] uppercase tracking-[0.14em] text-cinza">
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
                    <label htmlFor="plat" className="block font-mono text-[0.6rem] uppercase tracking-[0.14em] text-cinza">
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
                    <label htmlFor="mp" className="block font-mono text-[0.6rem] uppercase tracking-[0.14em] text-cinza">
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
