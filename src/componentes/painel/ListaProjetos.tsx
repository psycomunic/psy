'use client';

import { useActionState, useOptimistic, useState, useTransition } from 'react';
import { criarProjeto, atualizarProjeto, excluirProjeto, moverProjeto } from '@/app/painel/acoes-projeto';
import type { Resultado } from '@/app/painel/acoes';
import type { Projeto, SituacaoProjeto } from '@/lib/dados/tipos';
import {
  SITUACOES_PROJETO,
  SITUACOES_ABERTAS,
  TIPOS_PROJETO,
  rotuloSituacaoProjeto,
  rotuloTipoProjeto,
  explicaSituacaoProjeto,
} from '@/lib/dados/tipos';
import { diaCurto } from '@/lib/formato';

const campo =
  'w-full rounded-xl border border-fio bg-white/[0.03] px-4 py-2.5 text-sm text-branco ' +
  'outline-none transition-colors placeholder:text-cinza/60 focus:border-magenta';
const rotuloCss = 'block font-mono text-[0.75rem] uppercase tracking-[0.14em] text-cinza';

/*
  A cor diz de quem é a vez.

  Magenta onde a bola está com a gente, cinza onde está com o cliente ou
  parada por decisão, verde no que acabou. Nunca cor sozinha: o rótulo
  escrito está sempre ao lado, e o `title` explica a situação.
*/
const corDaSituacao: Record<SituacaoProjeto, string> = {
  briefing: 'border-fio bg-white/5 text-neve',
  andamento: 'border-magenta/50 bg-magenta/15 text-magenta-texto',
  alteracao: 'border-magenta/50 bg-magenta/15 text-magenta-texto',
  aguardando_cliente: 'border-[#FBBF24]/40 bg-[#FBBF24]/10 text-[#FBBF24]',
  entregue: 'border-[#4ADE80]/40 bg-[#4ADE80]/10 text-[#4ADE80]',
  pausado: 'border-fio bg-white/[0.02] text-cinza',
};

/**
 * A lista de projetos.
 *
 * ============================================================
 * POR QUE NÃO É UM QUADRO DE ARRASTAR
 * ============================================================
 * O CRM tem um, e lá ele serve: o funil tem cinco colunas e a pergunta
 * é "onde está cada negócio". Aqui são seis situações e a pergunta é
 * outra: "o que eu preciso terminar". Isso se responde com uma lista
 * ordenada por prazo, não com um quadro onde o mais urgente pode estar
 * no pé da terceira coluna.
 *
 * ============================================================
 * A SITUAÇÃO SE MUDA DE DENTRO DO CARTÃO
 * ============================================================
 * Sem abrir formulário, porque é o gesto mais repetido: um projeto anda
 * várias vezes por semana e os outros campos quase nunca mudam. Abrir o
 * formulário inteiro para mover um passo é também como um campo editado
 * noutra aba se perde.
 */
export function ListaProjetos({
  projetos,
  podeEditar,
  podeExcluir,
  contas,
  equipe,
}: {
  projetos: Projeto[];
  podeEditar: boolean;
  podeExcluir: boolean;
  contas: { id: string; nome: string }[];
  equipe: { id: string; nome: string }[];
}) {
  const [filtro, setFiltro] = useState<SituacaoProjeto | 'abertos' | 'todos'>('abertos');
  const [busca, setBusca] = useState('');
  const [editando, setEditando] = useState<Projeto | null>(null);
  const [criando, setCriando] = useState(false);

  /*
    ============================================================
    POR QUE O ESTADO DA AÇÃO MORA AQUI, E NÃO NO FORMULÁRIO
    ============================================================
    O formulário precisa SUMIR quando o salvamento dá certo, e quem o
    faz sumir é o estado deste componente (`criando` e `editando`).

    Na primeira versão quem fechava era o próprio formulário, chamando
    uma função do pai enquanto renderizava. O React reclamou em voz
    alta: "Cannot update a component while rendering a different
    component". Mexer no estado de outro componente durante o render é
    proibido, e o aviso de hoje é o erro de amanhã.

    Com os dois estados aqui, o ajuste acontece no render DESTE
    componente, sobre o estado DELE, que é o padrão documentado para
    "derivar estado de algo que mudou". O formulário fica burro: recebe
    a ação e o resultado, e não sabe quem o fecha.
  */
  const [estadoCriar, acaoCriar, criandoPendente] = useActionState<Resultado | null, FormData>(
    criarProjeto,
    null,
  );
  const [estadoEditar, acaoEditar, editandoPendente] = useActionState<Resultado | null, FormData>(
    atualizarProjeto,
    null,
  );

  const [ultimoCriar, setUltimoCriar] = useState(estadoCriar);
  if (estadoCriar !== ultimoCriar) {
    setUltimoCriar(estadoCriar);
    if (estadoCriar?.ok) setCriando(false);
  }

  const [ultimoEditar, setUltimoEditar] = useState(estadoEditar);
  if (estadoEditar !== ultimoEditar) {
    setUltimoEditar(estadoEditar);
    if (estadoEditar?.ok) setEditando(null);
  }

  const normalizar = (t: string) =>
    t.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
  const termo = normalizar(busca.trim());

  const visiveis = projetos.filter((p) => {
    if (filtro === 'abertos' && !SITUACOES_ABERTAS.includes(p.situacao)) return false;
    if (filtro !== 'abertos' && filtro !== 'todos' && p.situacao !== filtro) return false;
    if (!termo) return true;
    return normalizar(
      [p.nome, p.cliente, rotuloTipoProjeto[p.tipo], p.responsavel].filter(Boolean).join(' '),
    ).includes(termo);
  });

  const contagem = (s: SituacaoProjeto) => projetos.filter((p) => p.situacao === s).length;

  return (
    <>
      {podeEditar ? (
        <div className="mb-6">
          {criando ? (
            <FormProjeto
              contas={contas}
              equipe={equipe}
              acao={acaoCriar}
              estado={estadoCriar}
              pendente={criandoPendente}
              aoCancelar={() => setCriando(false)}
            />
          ) : (
            <button
              type="button"
              onClick={() => setCriando(true)}
              className="inline-flex items-center gap-2.5 rounded-full bg-magenta px-6 py-3 text-sm font-semibold text-branco transition-colors hover:bg-magenta-forte"
            >
              <span aria-hidden className="text-base leading-none">+</span>
              Novo projeto
            </button>
          )}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por projeto, cliente ou tipo"
          aria-label="Buscar nos projetos"
          className="min-w-0 grow rounded-full border border-fio bg-white/[0.03] px-5 py-2.5 text-sm text-branco outline-none transition-colors placeholder:text-cinza/60 focus:border-magenta sm:max-w-xs"
        />

        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filtrar por situação">
          {(['abertos', ...SITUACOES_PROJETO, 'todos'] as const).map((f) => {
            const n =
              f === 'abertos'
                ? projetos.filter((p) => SITUACOES_ABERTAS.includes(p.situacao)).length
                : f === 'todos'
                  ? projetos.length
                  : contagem(f);
            if (n === 0 && f !== 'abertos' && f !== 'todos') return null;
            return (
              <button
                key={f}
                type="button"
                aria-pressed={filtro === f}
                onClick={() => setFiltro(f)}
                title={f === 'abertos' || f === 'todos' ? undefined : explicaSituacaoProjeto[f]}
                className={
                  'min-h-[36px] rounded-full border px-4 text-xs font-semibold transition-colors ' +
                  (filtro === f
                    ? 'border-magenta bg-magenta text-branco'
                    : 'border-fio text-neve hover:bg-white/5')
                }
              >
                {f === 'abertos' ? 'Na mão' : f === 'todos' ? 'Todos' : rotuloSituacaoProjeto[f]}
                <span className="ml-2 opacity-70">{n}</span>
              </button>
            );
          })}
        </div>
      </div>

      {visiveis.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-fio px-5 py-10 text-center text-sm leading-relaxed text-cinza">
          {projetos.length === 0
            ? 'Nenhum projeto por aqui ainda. Crie o primeiro acima.'
            : 'Nenhum projeto com esse filtro.'}
        </p>
      ) : (
        <ul className="mt-6 grid gap-4 xl:grid-cols-2">
          {visiveis.map((p) => (
            <li key={p.id}>
              {editando?.id === p.id ? (
                <FormProjeto
                  projeto={p}
                  contas={contas}
                  equipe={equipe}
                  acao={acaoEditar}
                  estado={estadoEditar}
                  pendente={editandoPendente}
                  aoCancelar={() => setEditando(null)}
                />
              ) : (
                <CartaoProjeto
                  projeto={p}
                  podeEditar={podeEditar}
                  podeExcluir={podeExcluir}
                  aoEditar={() => setEditando(p)}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function CartaoProjeto({
  projeto: p,
  podeEditar,
  podeExcluir,
  aoEditar,
}: {
  projeto: Projeto;
  podeEditar: boolean;
  podeExcluir: boolean;
  aoEditar: () => void;
}) {
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();

  /*
    A situação muda na hora, e o servidor confirma depois.

    Sem isso, o `select` volta ao valor antigo até a resposta chegar, e
    quem acabou de escolher vê a própria escolha ser desfeita por meio
    segundo. Se o servidor recusar, o React devolve o valor anterior
    sozinho ao fim da transição.
  */
  const [situacao, mover] = useOptimistic(p.situacao, (_atual, nova: SituacaoProjeto) => nova);

  function trocar(nova: SituacaoProjeto) {
    if (nova === situacao) return;
    setErro(null);
    iniciar(async () => {
      mover(nova);
      const fd = new FormData();
      fd.set('id', p.id);
      fd.set('situacao', nova);
      const r = await moverProjeto(null, fd);
      if (!r.ok) setErro(r.mensagem);
    });
  }

  /* Atrasado só conta no que ainda está na mão. Projeto entregue com
     prazo vencido foi entregue depois, e isso não é um alerta: é
     história. */
  const aberto = SITUACOES_ABERTAS.includes(situacao);
  const atrasado = aberto && p.diasAteOPrazo !== null && p.diasAteOPrazo < 0;

  return (
    <article
      className={
        'cartao flex h-full flex-col p-6 ' + (atrasado ? 'border-[#FF7A7A]/40' : '')
      }
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-lg font-bold leading-snug tracking-[-0.02em]">
            {p.nome}
          </h3>
          <p className="mt-1 text-sm text-cinza">
            {rotuloTipoProjeto[p.tipo]}
            {p.cliente ? <span> · {p.cliente}</span> : <span> · Da agência</span>}
          </p>
        </div>

        <span
          title={explicaSituacaoProjeto[situacao]}
          className={
            'flex-none rounded-full border px-3 py-1 text-[0.75rem] font-semibold ' +
            corDaSituacao[situacao]
          }
        >
          {rotuloSituacaoProjeto[situacao]}
        </span>
      </header>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className={rotuloCss}>Prazo</dt>
          <dd className="tabular mt-1">
            {p.prazo ? diaCurto(p.prazo) : <span className="text-cinza">sem prazo</span>}
          </dd>
        </div>
        <div>
          <dt className={rotuloCss}>Responsável</dt>
          <dd className="mt-1">
            {p.responsavel ?? <span className="text-cinza">sem responsável</span>}
          </dd>
        </div>
      </dl>

      {/* Cor + ÍCONE + texto: nunca cor sozinha. */}
      {atrasado ? (
        <p className="mt-3 flex items-center gap-1.5 text-[0.75rem] font-semibold text-[#FF7A7A]">
          <span aria-hidden>▲</span>
          venceu há {Math.abs(p.diasAteOPrazo!)} {Math.abs(p.diasAteOPrazo!) === 1 ? 'dia' : 'dias'}
        </p>
      ) : null}

      {aberto && p.diasNaSituacao >= 7 ? (
        <p className="mt-2 flex items-center gap-1.5 text-[0.75rem] text-cinza">
          <span aria-hidden>●</span>
          nesta situação há {p.diasNaSituacao} dias
        </p>
      ) : null}

      {p.observacoes ? (
        <p className="mt-4 border-l-2 border-magenta/50 pl-3 text-sm leading-relaxed text-neve">
          {p.observacoes}
        </p>
      ) : null}

      <div className="mt-auto pt-5">
        {p.link ? (
          <a
            href={p.link}
            target="_blank"
            rel="noopener"
            className="mb-3 inline-flex min-h-[24px] items-center gap-2 rounded-full border border-fio px-4 py-2 text-xs font-semibold text-neve transition-colors hover:bg-white/5"
          >
            Abrir o projeto
            <span aria-hidden>&#8599;</span>
          </a>
        ) : null}

        {podeEditar ? (
          <div className="flex flex-wrap items-center gap-2.5">
            <label className="sr-only" htmlFor={`sit-${p.id}`}>
              Situação de {p.nome}
            </label>
            <select
              id={`sit-${p.id}`}
              value={situacao}
              disabled={pendente}
              onChange={(e) => trocar(e.target.value as SituacaoProjeto)}
              className="min-h-[36px] rounded-full border border-fio bg-white/[0.03] px-4 text-xs text-branco outline-none focus:border-magenta disabled:opacity-60"
            >
              {SITUACOES_PROJETO.map((s) => (
                <option key={s} value={s}>
                  {rotuloSituacaoProjeto[s]}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={aoEditar}
              className="min-h-[36px] rounded-full border border-fio px-4 text-xs font-semibold text-neve transition-colors hover:bg-white/5"
            >
              Editar
            </button>
          </div>
        ) : null}

        {erro ? (
          <p role="status" className="mt-3 text-xs font-semibold text-magenta-texto">
            <span aria-hidden className="mr-1.5">■</span>
            {erro}
          </p>
        ) : null}

        {podeExcluir ? <BotaoExcluirProjeto projeto={p} /> : null}
      </div>
    </article>
  );
}

/**
 * O formulário, que serve para criar e para editar.
 *
 * Um só, e não dois: os campos são os mesmos, e duas cópias divergem na
 * primeira vez que alguém acrescenta um campo de um lado só. O que muda
 * é a ação e o `defaultValue`.
 */
function FormProjeto({
  projeto,
  contas,
  equipe,
  acao,
  estado,
  pendente,
  aoCancelar,
}: {
  projeto?: Projeto;
  contas: { id: string; nome: string }[];
  equipe: { id: string; nome: string }[];
  /* A ação, o resultado e o "salvando" vêm de cima. Quem some quando dá
     certo é este formulário, e quem o faz sumir é o estado do pai: ele
     precisa ver o resultado para decidir. */
  acao: (fd: FormData) => void;
  estado: Resultado | null;
  pendente: boolean;
  aoCancelar: () => void;
}) {
  return (
    <form action={acao} className="cartao space-y-5 p-6">
      {projeto ? <input type="hidden" name="id" value={projeto.id} /> : null}

      <div>
        <h3 className="font-display text-lg font-bold tracking-[-0.02em]">
          {projeto ? 'Editar projeto' : 'Novo projeto'}
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-cinza">
          Só o nome é obrigatório. O resto entra conforme o trabalho anda.
        </p>
      </div>

      <div>
        <label htmlFor="pj-nome" className={rotuloCss}>O que é *</label>
        <input
          id="pj-nome"
          name="nome"
          required
          autoFocus
          defaultValue={projeto?.nome}
          placeholder="Loja da Reiwiu, identidade da Alekids"
          className={`mt-2 ${campo}`}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label htmlFor="pj-tipo" className={rotuloCss}>Tipo</label>
          <select id="pj-tipo" name="tipo" defaultValue={projeto?.tipo ?? 'site'} className={`mt-2 ${campo}`}>
            {TIPOS_PROJETO.map((t) => (
              <option key={t} value={t}>{rotuloTipoProjeto[t]}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="pj-sit" className={rotuloCss}>Situação</label>
          <select
            id="pj-sit"
            name="situacao"
            defaultValue={projeto?.situacao ?? 'briefing'}
            className={`mt-2 ${campo}`}
          >
            {SITUACOES_PROJETO.map((s) => (
              <option key={s} value={s}>{rotuloSituacaoProjeto[s]}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="pj-prazo" className={rotuloCss}>Prazo</label>
          <input
            id="pj-prazo"
            name="prazo"
            type="date"
            defaultValue={projeto?.prazo ?? ''}
            className={`mt-2 ${campo}`}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label htmlFor="pj-conta" className={rotuloCss}>Cliente da carteira</label>
          <select
            id="pj-conta"
            name="conta_id"
            defaultValue={projeto?.contaId ?? ''}
            className={`mt-2 ${campo}`}
          >
            <option value="">Da agência ou fora da carteira</option>
            {contas.map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="pj-cliente" className={rotuloCss}>Ou o nome, à mão</label>
          <input
            id="pj-cliente"
            name="cliente"
            defaultValue={projeto?.contaId ? '' : (projeto?.cliente ?? '')}
            placeholder="Para quem ainda não é cliente"
            className={`mt-2 ${campo}`}
          />
          {/* O aviso onde a dúvida nasce: são dois campos para o mesmo
              fato, e a consulta prefere a conta. */}
          <p className="mt-1.5 text-xs leading-relaxed text-cinza">
            Com a conta escolhida, este campo é ignorado.
          </p>
        </div>
        <div>
          <label htmlFor="pj-resp" className={rotuloCss}>Responsável</label>
          <select
            id="pj-resp"
            name="responsavel_id"
            defaultValue={projeto?.responsavelId ?? ''}
            className={`mt-2 ${campo}`}
          >
            <option value="">Sem responsável</option>
            {equipe.map((e) => (
              <option key={e.id} value={e.id}>{e.nome}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="pj-link" className={rotuloCss}>Link</label>
        <input
          id="pj-link"
          name="link"
          type="url"
          inputMode="url"
          defaultValue={projeto?.link ?? ''}
          placeholder="https://preview.vercel.app, Figma, repositório"
          className={`mt-2 ${campo}`}
        />
      </div>

      <div>
        <label htmlFor="pj-obs" className={rotuloCss}>O que falta, ou o que foi pedido</label>
        <textarea
          id="pj-obs"
          name="observacoes"
          rows={3}
          defaultValue={projeto?.observacoes ?? ''}
          placeholder="A alteração que o cliente pediu, o que trava a entrega"
          className={`mt-2 ${campo}`}
        />
      </div>

      {estado && !estado.ok ? (
        <p
          role="status"
          className="flex items-start gap-3 rounded-xl border border-magenta/40 bg-magenta/10 px-4 py-3 text-sm text-magenta-texto"
        >
          <span aria-hidden className="mt-0.5">■</span>
          {estado.mensagem}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={pendente}
          className="rounded-full bg-magenta px-7 py-3 text-sm font-semibold text-branco transition-colors hover:bg-magenta-forte disabled:opacity-60"
        >
          {pendente ? 'Salvando...' : projeto ? 'Salvar' : 'Criar projeto'}
        </button>
        <button
          type="button"
          onClick={aoCancelar}
          className="rounded-full border border-fio px-6 py-3 text-sm text-neve transition-colors hover:bg-white/5"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

/**
 * Apagar, em dois cliques, e o segundo nomeia o projeto.
 *
 * Mesmo desenho do botão da prospecção, e pelo mesmo motivo: `confirm()`
 * do navegador é bloqueado, some em aba de fundo e não dá para escrever
 * nele o que vai ser perdido.
 */
function BotaoExcluirProjeto({ projeto: p }: { projeto: Projeto }) {
  const [estado, acao, pendente] = useActionState<Resultado | null, FormData>(
    excluirProjeto,
    null,
  );
  const [confirmando, setConfirmando] = useState(false);

  if (estado && !estado.ok) {
    return (
      <p role="status" className="mt-4 text-xs font-semibold text-magenta-texto">
        <span aria-hidden className="mr-1.5">■</span>
        {estado.mensagem}
      </p>
    );
  }

  if (!confirmando) {
    return (
      <div className="mt-4 border-t border-fio pt-3">
        <button
          type="button"
          onClick={() => setConfirmando(true)}
          className="inline-flex min-h-[24px] items-center text-xs text-cinza underline-offset-4 transition-colors hover:text-neve hover:underline"
        >
          Apagar projeto
        </button>
      </div>
    );
  }

  return (
    <form action={acao} className="mt-4 border-t border-fio pt-3">
      <input type="hidden" name="id" value={p.id} />
      <input type="hidden" name="confirmo" value="sim" />

      <p className="text-xs leading-relaxed text-neve">
        Apagar {p.nome}? Some o histórico da entrega, e não tem volta.
      </p>

      <div className="mt-2.5 flex flex-wrap gap-2">
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
