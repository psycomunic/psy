'use client';

import { useState, useOptimistic, useTransition, useRef, useActionState } from 'react';
import Link from 'next/link';
import {
  moverLead,
  perderLead,
  atualizarLead,
  converterEmCliente,
  registrarInteracao,
  excluirLead,
} from '@/app/painel/acoes-crm';
import type { Resultado } from '@/app/painel/acoes';
import type { Lead, Estagio, Interacao, Prospecto } from '@/lib/dados/tipos';
import { ESTAGIOS, rotuloEstagio, explicaPrioridadeProspeccao, unidadeCobranca } from '@/lib/dados/tipos';
import { contagemCurta } from '@/lib/formato';
import { BotaoCopiar } from './BotaoCopiar';
import { donoConhecido, textoDaAbordagem } from '@/lib/dominio/abordagem.ts';
import { dinheiro, dinheiroCurto } from '@/lib/formato';
import { LIMIAR_PARADO_DIAS } from '@/lib/dominio/metricas.ts';

/*
  Kanban do funil.

  As colunas são os estágios ABERTOS. "Ganho" e "perdido" ficam de fora
  do quadro de propósito: são estados finais, e uma coluna de ganhos que
  cresce para sempre empurra o funil de trabalho para fora da tela.
*/
const COLUNAS = ESTAGIOS.filter((e) => e !== 'ganho' && e !== 'perdido');

/**
 * A força do magenta cresce com o estágio.
 *
 * É encoding sequencial, e não decoração: a mesma cor ficando mais
 * densa diz "mais perto do fim" sem precisar de legenda, e o olho lê a
 * ordem do quadro antes de ler os rótulos.
 *
 * UMA matiz só, em opacidades. Trocar de cor por coluna exigiria cinco
 * hexes novos, e as cores deste painel passaram por um validador de
 * contraste e daltonismo que eu não vou burlar no olho. Ver
 * `paleta.ts`.
 */
const FORCA_DO_ESTAGIO: Record<string, number> = {
  novo: 0.32,
  contato: 0.49,
  diagnostico: 0.66,
  proposta: 0.83,
  negociacao: 1,
};

const campo =
  'w-full rounded-xl border border-fio bg-white/[0.03] px-4 py-3 text-sm text-branco ' +
  'outline-none transition-colors placeholder:text-cinza/60 focus:border-magenta';

export function Kanban({
  leads,
  podeEditar,
  podeExcluir = false,
  interacoes = {},
  pesquisas = {},
}: {
  leads: Lead[];
  podeEditar: boolean;
  /** Separado de `podeEditar` porque é outro papel: mexer no funil é
      do comercial, apagar é só do administrador. Apagar não tem volta,
      e a diferença entre as duas permissões é essa. */
  podeExcluir?: boolean;
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

  /* Lead apagado em outra aba, ou aqui mesmo: a lista volta do
     servidor sem ele e a ficha fecha sozinha. Ajustar o próprio estado
     durante o render é o caminho que o React recomenda para isto, e
     evita um efeito que roda depois da pintura mostrando por um quadro
     uma ficha de algo que não existe mais. */
  if (aberto && !leads.some((l) => l.id === aberto.id)) setAberto(null);
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
          const mensal = daColuna
            .filter((l) => l.cobranca === 'mensal')
            .reduce((s, l) => s + (l.valorFee ?? 0), 0);
          const projeto = daColuna
            .filter((l) => l.cobranca === 'projeto')
            .reduce((s, l) => s + (l.valorFee ?? 0), 0);
          const total = mensal + projeto;
          const fatia = filtrados.length > 0 ? (daColuna.length / filtrados.length) * 100 : 0;

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
                <span className="tabular font-display text-lg font-extrabold leading-none">
                  {daColuna.length}
                </span>
              </header>

              {/* A barra é a fatia DESTA coluna no funil aberto. Cinco
                  números soltos obrigam a fazer a conta de cabeça para
                  saber onde a carteira está parada; a barra responde
                  isso de relance, e o texto ao lado continua citável
                  numa reunião. */}
              <div
                className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-white/[0.07]"
                aria-hidden
              >
                <div
                  className="h-full rounded-full bg-magenta transition-[width] duration-300"
                  style={{
                    width: `${fatia}%`,
                    opacity: FORCA_DO_ESTAGIO[estagio] ?? 1,
                  }}
                />
              </div>

              <p className="mt-2 flex items-baseline justify-between gap-2 text-xs text-cinza">
                <span className="tabular">{fatia.toFixed(0)}% do funil</span>
                {/* `R$ 0` seria mentira: o lead de prospecção não vale
                    zero, ele ainda não foi orçado. Afirmar zero sobre
                    dinheiro é o pior tipo de arredondamento. */}
                {/* Os dois valores lado a lado, e nunca somados. A
                     coluna que tem os dois mostra os dois. */}
                <span className="tabular">
                  {total === 0 ? 'sem valor ainda' : null}
                  {mensal > 0 ? `${dinheiroCurto(mensal)}/mês` : null}
                  {mensal > 0 && projeto > 0 ? ' · ' : null}
                  {projeto > 0 ? `${dinheiroCurto(projeto)} em projeto` : null}
                </span>
              </p>

              {/*
                A COLUNA ROLA POR DENTRO

                Cinquenta leads de prospecção empilhados davam 5.928px
                só nesta coluna, e 10,4 telas de rolagem no celular para
                ver um quadro que existe para ser visto de relance. Com
                teto, o quadro inteiro cabe em uma tela e cada coluna
                anda sozinha.

                O teto é generoso de propósito: mostra cinco cards, que
                é quanto basta para saber se a coluna tem fila.
              */}
              <ul className="mt-4 max-h-[30rem] space-y-2.5 overflow-y-auto pr-1">
                {daColuna.length === 0 ? (
                  <li className="rounded-xl border border-dashed border-fio px-4 py-6 text-center text-xs text-cinza">
                    {podeEditar ? 'Arraste um lead para cá' : 'Vazio'}
                  </li>
                ) : (
                  daColuna.map((l) => {
                    const parado = l.diasNoEstagio >= LIMIAR_PARADO_DIAS;
                    const temValor = (l.valorFee ?? 0) > 0;
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
                          <div className="flex items-start gap-2.5">
                            {/* A inicial faz a coluna ser varrida pela
                                forma, e não lida nome por nome. Com
                                cinquenta cards numa coluna, isso é a
                                diferença entre achar e procurar. */}
                            <span
                              aria-hidden
                              className="mt-0.5 grid h-7 w-7 flex-none place-items-center rounded-lg bg-magenta/15 font-display text-xs font-extrabold text-magenta-texto"
                            >
                              {(l.empresa ?? l.nome).trim().charAt(0).toUpperCase()}
                            </span>
                            <span className="min-w-0 grow">
                              <span className="block truncate text-sm font-semibold leading-snug">
                                {l.empresa ?? l.nome}
                              </span>
                              <span className="mt-0.5 block truncate text-xs text-cinza">
                                {l.nome}
                              </span>
                            </span>
                          </div>

                          {/*
                            SELOS, E SÓ OS QUE TÊM O QUE DIZER

                            Antes esta linha existia sempre, e num lead
                            de prospecção ela mostrava um traço sozinho,
                            que o olho lê como "valor zero". Lead sem
                            orçamento não vale zero: ele ainda não foi
                            orçado, e a ausência do selo diz isso melhor
                            que qualquer símbolo.
                          */}
                          {temValor || l.probabilidade !== null || parado ? (
                            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                              {/* O valor NUNCA aparece sem a unidade.
                                   "R$ 3.500" ao lado de "R$ 5.000" num
                                   quadro só faz o olho somar, e um dos
                                   dois é pagamento único. */}
                              {temValor ? (
                                <span className="tabular rounded-md bg-white/[0.06] px-2 py-0.5 text-xs font-semibold text-branco">
                                  {dinheiro(l.valorFee)}
                                  <span className="font-normal text-cinza">
                                    {unidadeCobranca[l.cobranca]}
                                  </span>
                                </span>
                              ) : null}
                              {l.servico ? (
                                <span className="rounded-md border border-fio px-2 py-0.5 text-xs text-neve">
                                  {l.servico}
                                </span>
                              ) : null}
                              {l.probabilidade !== null ? (
                                <span className="tabular rounded-md border border-fio px-2 py-0.5 text-xs text-neve">
                                  {l.probabilidade}% de chance
                                </span>
                              ) : null}
                              {/* Cor + ÍCONE + texto: nunca cor sozinha. */}
                              {parado ? (
                                <span
                                  className="tabular flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold"
                                  style={{ color: '#FBBF24', backgroundColor: '#FBBF2420' }}
                                >
                                  <span aria-hidden>▲</span>
                                  {l.diasNoEstagio} dias parado
                                </span>
                              ) : null}
                            </div>
                          ) : null}

                          {l.proximoPasso ? (
                            <p className="mt-2.5 flex gap-1.5 border-t border-fio pt-2.5 text-xs leading-snug text-cinza">
                              <span aria-hidden className="flex-none text-magenta-texto">→</span>
                              <span className="min-w-0">{l.proximoPasso}</span>
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
          podeExcluir={podeExcluir}
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
  podeExcluir,
  conversas,
  pesquisa,
  aoFechar,
}: {
  lead: Lead;
  podeEditar: boolean;
  podeExcluir: boolean;
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

        {/* No PÉ da ficha, e nunca entre as abas. Apagar não é uma das
            coisas que se faz num lead: é a que se faz uma vez, por
            engano de cadastro, e precisa estar longe do caminho de
            quem só queria mudar o próximo passo. */}
        {podeExcluir ? <ApagarLead lead={lead} /> : null}
      </div>
    </div>
  );
}

/**
 * Apagar o lead, em dois passos.
 *
 * ============================================================
 * POR QUE A CONFIRMAÇÃO NÃO É UM `confirm()`
 * ============================================================
 * Porque ela precisa DIZER o que some junto. A pesquisa de prospecção
 * e o histórico de conversa vão embora com o lead, por cascade no
 * banco, e isso não cabe numa caixinha do navegador que a pessoa fecha
 * no reflexo.
 *
 * A proposta sobrevive: ela é `on delete set null`, perde o vínculo e
 * não a existência, porque documento comercial enviado não some junto
 * com uma limpeza de funil.
 *
 * ============================================================
 * O RASTRO FICA
 * ============================================================
 * O gatilho `lead_auditoria_delete` grava a linha inteira em
 * `log_auditoria` antes de ela sumir (migração 0035). É o que permite
 * responder depois "o que tinha ali", que é a única pergunta que
 * importa quando o engano aparece uma semana depois.
 */
function ApagarLead({ lead }: { lead: Lead }) {
  const [estado, acao, pendente] = useActionState<Resultado | null, FormData>(
    excluirLead,
    null,
  );
  const [confirmando, setConfirmando] = useState(false);

  /* Quem fecha a ficha é o Kanban, e não este botão.
     Chamar o `aoFechar` do pai daqui seria mudar o estado de outro
     componente durante o render deste, que é o aviso "Cannot update a
     component while rendering a different component". O pai já sabe
     fechar sozinho: quando a lista volta do servidor sem este lead,
     ele ajusta o PRÓPRIO estado, que é o padrão sancionado. */
  if (estado?.ok) {
    return (
      <p role="status" className="mt-6 border-t border-fio pt-4 text-xs text-cinza">
        Apagado.
      </p>
    );
  }

  if (!confirmando) {
    return (
      <div className="mt-6 border-t border-fio pt-4">
        <button
          type="button"
          onClick={() => setConfirmando(true)}
          className="inline-flex min-h-[24px] items-center text-xs text-cinza underline-offset-4 transition-colors hover:text-neve hover:underline"
        >
          Apagar este lead
        </button>
      </div>
    );
  }

  return (
    <form action={acao} className="mt-6 border-t border-fio pt-4">
      <input type="hidden" name="id" value={lead.id} />
      <input type="hidden" name="confirmo" value="sim" />

      <p className="text-xs leading-relaxed text-neve">
        Apagar {lead.empresa ?? lead.nome}? Somem junto a pesquisa de prospecção e o
        histórico de conversa. A proposta, se houver, continua existindo e perde só o
        vínculo. Não tem volta.
      </p>

      {estado && !estado.ok ? (
        <p role="status" className="mt-2 text-xs font-semibold text-magenta-texto">
          <span aria-hidden className="mr-1.5">■</span>
          {estado.mensagem}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={pendente}
          className="rounded-full border border-magenta/50 bg-magenta/10 px-4 py-2 text-xs font-semibold text-magenta-texto transition-colors hover:bg-magenta hover:text-branco disabled:opacity-60"
        >
          {pendente ? 'Apagando...' : 'Apagar'}
        </button>
        <button
          type="button"
          onClick={() => setConfirmando(false)}
          className="rounded-full border border-fio px-4 py-2 text-xs font-semibold text-neve transition-colors hover:bg-white/5"
        >
          Cancelar
        </button>
      </div>
    </form>
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
  const abertura = textoDaAbordagem(
    p.mensagemAbertura,
    donoConhecido(p.nomeContato, p.instagram),
  );

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
            <p className="whitespace-pre-line text-sm leading-relaxed text-neve">{abertura}</p>
            <div className="mt-3">
              <BotaoCopiar texto={abertura} />
            </div>

            {p.perguntaSeguinte ? (
              <div className="border-t border-fio pt-3">
                <p className="font-mono text-[0.75rem] uppercase tracking-[0.14em] text-magenta-texto">
                  2. Se ficar no vácuo
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
