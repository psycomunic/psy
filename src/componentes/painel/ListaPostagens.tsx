'use client';

import Link from 'next/link';
import { useActionState, useOptimistic, useState, useTransition } from 'react';
import {
  criarPostagem,
  atualizarPostagem,
  moverPostagem,
  excluirPostagem,
} from '@/app/painel/acoes-postagem';
import type { Resultado } from '@/app/painel/acoes';
import type { Postagem, PerfilSocial, SituacaoPost } from '@/lib/dados/tipos';
import {
  PERFIS_SOCIAIS,
  FORMATOS_POST,
  SITUACOES_POST,
  SITUACOES_POST_ABERTAS,
  rotuloPerfilSocial,
  rotuloFormatoPost,
  rotuloSituacaoPost,
  faltaNaSituacao,
  quemFalaNoPerfil,
} from '@/lib/dados/tipos';
import { Anexos } from './Anexos';
import { BotaoCopiar } from './BotaoCopiar';

const campo =
  'w-full rounded-xl border border-fio bg-white/[0.03] px-4 py-2.5 text-sm text-branco ' +
  'outline-none transition-colors placeholder:text-cinza/60 focus:border-magenta';
const rotuloCss = 'block font-mono text-[0.75rem] uppercase tracking-[0.14em] text-cinza';

/* A cor separa quem fala. Nunca sozinha: o @ está escrito ao lado. */
const corDoPerfil: Record<PerfilSocial, string> = {
  reysonmkt: 'border-[#7C5CFF]/50 bg-[#7C5CFF]/15 text-[#B9A7FF]',
  psycomunic: 'border-magenta/50 bg-magenta/15 text-magenta-texto',
};

const DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

/** "2026-10-05" -> "segunda, 5". Sem `new Date(iso)` puro, que desloca
    um dia por fuso em datas sem hora. */
function rotuloDoDia(iso: string) {
  const [a, m, d] = iso.split('-').map(Number);
  const data = new Date(a, m - 1, d);
  return `${DIAS[data.getDay()]}, ${d}`;
}

export function ListaPostagens({
  postagens,
  mes,
  podeEditar,
  podeExcluir,
  equipe,
}: {
  postagens: Postagem[];
  mes: string;
  podeEditar: boolean;
  podeExcluir: boolean;
  equipe: { id: string; nome: string }[];
}) {
  const [perfil, setPerfil] = useState<PerfilSocial | 'todos'>('todos');
  const [situacao, setSituacao] = useState<SituacaoPost | 'abertas' | 'todas'>('todas');
  const [criando, setCriando] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);

  /* O estado da ação mora aqui, e não no formulário: quem faz o
     formulário sumir é o estado DESTE componente, e mexer no estado do
     pai durante o render do filho é o que o React proíbe. */
  const [estadoCriar, acaoCriar, criandoPendente] = useActionState<Resultado | null, FormData>(
    criarPostagem,
    null,
  );
  const [estadoEditar, acaoEditar, editandoPendente] = useActionState<Resultado | null, FormData>(
    atualizarPostagem,
    null,
  );

  const [ultimoCriar, setUltimoCriar] = useState(estadoCriar);
  if (estadoCriar !== ultimoCriar) {
    setUltimoCriar(estadoCriar);
    /* Ao criar, a tela ABRE a edição da postagem nova, em vez de só
       fechar: o passo seguinte é sempre anexar o arquivo, e o id vem na
       mensagem justamente para isso. */
    if (estadoCriar?.ok) {
      setCriando(false);
      const id = estadoCriar.mensagem.split('|')[1];
      if (id) setEditando(id);
    }
  }

  const [ultimoEditar, setUltimoEditar] = useState(estadoEditar);
  if (estadoEditar !== ultimoEditar) {
    setUltimoEditar(estadoEditar);
    if (estadoEditar?.ok) setEditando(null);
  }

  const visiveis = postagens.filter((p) => {
    if (perfil !== 'todos' && p.perfil !== perfil) return false;
    if (situacao === 'abertas' && !SITUACOES_POST_ABERTAS.includes(p.situacao)) return false;
    if (situacao !== 'abertas' && situacao !== 'todas' && p.situacao !== situacao) return false;
    return true;
  });

  /* Agrupadas por dia, e as sem data num grupo no fim. Um calendário
     que esconde as ideias sem data esconde metade do trabalho. */
  const porDia = new Map<string, Postagem[]>();
  const semData: Postagem[] = [];
  for (const p of visiveis) {
    if (!p.data) semData.push(p);
    else porDia.set(p.data, [...(porDia.get(p.data) ?? []), p]);
  }

  const [ano, m] = mes.split('-').map(Number);
  const anterior = m === 1 ? `${ano - 1}-12` : `${ano}-${String(m - 1).padStart(2, '0')}`;
  const seguinte = m === 12 ? `${ano + 1}-01` : `${ano}-${String(m + 1).padStart(2, '0')}`;
  const nomeDoMes = new Date(ano, m - 1, 1).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Link
            href={`/painel/postagens?mes=${anterior}`}
            aria-label="Mês anterior"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-fio text-neve transition-colors hover:bg-white/5"
          >
            <span aria-hidden>←</span>
          </Link>
          <p className="min-w-[11rem] text-center font-display text-lg font-bold tracking-[-0.02em] first-letter:uppercase">
            {nomeDoMes}
          </p>
          <Link
            href={`/painel/postagens?mes=${seguinte}`}
            aria-label="Próximo mês"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-fio text-neve transition-colors hover:bg-white/5"
          >
            <span aria-hidden>→</span>
          </Link>
        </div>

        {podeEditar && !criando ? (
          <button
            type="button"
            onClick={() => setCriando(true)}
            className="inline-flex items-center gap-2.5 rounded-full bg-magenta px-6 py-3 text-sm font-semibold text-branco transition-colors hover:bg-magenta-forte"
          >
            <span aria-hidden className="text-base leading-none">+</span>
            Nova postagem
          </button>
        ) : null}
      </div>

      {criando ? (
        <div className="mt-5">
          <FormPostagem
            mes={mes}
            equipe={equipe}
            acao={acaoCriar}
            estado={estadoCriar}
            pendente={criandoPendente}
            aoCancelar={() => setCriando(false)}
          />
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5" role="group" aria-label="Filtrar por perfil">
          {(['todos', ...PERFIS_SOCIAIS] as const).map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={perfil === f}
              onClick={() => setPerfil(f)}
              title={f === 'todos' ? 'Os dois perfis' : quemFalaNoPerfil[f]}
              className={
                'min-h-[36px] rounded-full border px-4 text-xs font-semibold transition-colors ' +
                (perfil === f
                  ? 'border-magenta bg-magenta text-branco'
                  : 'border-fio text-neve hover:bg-white/5')
              }
            >
              {f === 'todos' ? 'Os dois' : rotuloPerfilSocial[f]}
            </button>
          ))}
        </div>

        <label className="sr-only" htmlFor="filtro-situacao">Situação</label>
        <select
          id="filtro-situacao"
          value={situacao}
          onChange={(e) => setSituacao(e.target.value as SituacaoPost | 'abertas' | 'todas')}
          className="min-h-[36px] rounded-full border border-fio bg-white/[0.03] px-4 text-xs text-branco outline-none focus:border-magenta"
        >
          <option value="todas">Todas as situações</option>
          <option value="abertas">Só o que dá trabalho</option>
          {SITUACOES_POST.map((s) => (
            <option key={s} value={s}>{rotuloSituacaoPost[s]}</option>
          ))}
        </select>

        <span aria-live="polite" className="text-xs text-cinza">
          {visiveis.length} {visiveis.length === 1 ? 'postagem' : 'postagens'}
        </span>
      </div>

      {visiveis.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-fio px-5 py-10 text-center text-sm leading-relaxed text-cinza">
          {postagens.length === 0
            ? 'Nenhuma postagem neste mês. Crie a primeira acima, ou volte um mês.'
            : 'Nenhuma postagem com esses filtros.'}
        </p>
      ) : (
        <div className="mt-6 space-y-8">
          {[...porDia.entries()].map(([dia, lista]) => (
            <section key={dia}>
              <h3 className="font-mono text-[0.75rem] uppercase tracking-[0.14em] text-magenta-texto">
                {rotuloDoDia(dia)}
              </h3>
              <ul className="mt-3 grid gap-4 xl:grid-cols-2">
                {lista.map((p) => (
                  <li key={p.id}>
                    {editando === p.id ? (
                      <FormPostagem
                        postagem={p}
                        mes={mes}
                        equipe={equipe}
                        acao={acaoEditar}
                        estado={estadoEditar}
                        pendente={editandoPendente}
                        aoCancelar={() => setEditando(null)}
                        podeEditar={podeEditar}
                      />
                    ) : (
                      <Cartao
                        postagem={p}
                        podeEditar={podeEditar}
                        podeExcluir={podeExcluir}
                        aoEditar={() => setEditando(p.id)}
                      />
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}

          {semData.length > 0 ? (
            <section>
              <h3 className="font-mono text-[0.75rem] uppercase tracking-[0.14em] text-cinza">
                Sem data
              </h3>
              <ul className="mt-3 grid gap-4 xl:grid-cols-2">
                {semData.map((p) => (
                  <li key={p.id}>
                    {editando === p.id ? (
                      <FormPostagem
                        postagem={p}
                        mes={mes}
                        equipe={equipe}
                        acao={acaoEditar}
                        estado={estadoEditar}
                        pendente={editandoPendente}
                        aoCancelar={() => setEditando(null)}
                        podeEditar={podeEditar}
                      />
                    ) : (
                      <Cartao
                        postagem={p}
                        podeEditar={podeEditar}
                        podeExcluir={podeExcluir}
                        aoEditar={() => setEditando(p.id)}
                      />
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      )}
    </>
  );
}

function Cartao({
  postagem: p,
  podeEditar,
  podeExcluir,
  aoEditar,
}: {
  postagem: Postagem;
  podeEditar: boolean;
  podeExcluir: boolean;
  aoEditar: () => void;
}) {
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();
  const [situacao, mover] = useOptimistic(p.situacao, (_a, nova: SituacaoPost) => nova);

  function trocar(nova: SituacaoPost) {
    if (nova === situacao) return;
    setErro(null);
    iniciar(async () => {
      mover(nova);
      const fd = new FormData();
      fd.set('id', p.id);
      fd.set('situacao', nova);
      const r = await moverPostagem(null, fd);
      if (!r.ok) setErro(r.mensagem);
    });
  }

  return (
    <article className="cartao flex h-full flex-col p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2">
            <span
              title={quemFalaNoPerfil[p.perfil]}
              className={'rounded-full border px-3 py-1 text-[0.75rem] font-semibold ' + corDoPerfil[p.perfil]}
            >
              {rotuloPerfilSocial[p.perfil]}
            </span>
            <span className="rounded-full border border-fio px-3 py-1 text-[0.75rem] text-cinza">
              {rotuloFormatoPost[p.formato]}
            </span>
            {p.hora ? (
              <span className="tabular text-[0.75rem] text-cinza">{p.hora.slice(0, 5)}</span>
            ) : null}
          </p>
          <h4 className="mt-2.5 font-display text-lg font-bold leading-snug tracking-[-0.02em]">
            {p.tema}
          </h4>
        </div>

        <span
          title={faltaNaSituacao[situacao]}
          className="flex-none rounded-full border border-fio px-3 py-1 text-[0.75rem] font-semibold text-neve"
        >
          {rotuloSituacaoPost[situacao]}
        </span>
      </header>

      {p.legenda ? (
        <details className="group mt-4 rounded-xl border border-fio bg-white/[0.02]">
          <summary className="cursor-pointer list-none px-4 py-3 text-xs font-semibold text-neve transition-colors hover:bg-white/5">
            <span aria-hidden className="mr-2 text-magenta-texto group-open:hidden">+</span>
            <span aria-hidden className="mr-2 hidden text-magenta-texto group-open:inline">−</span>
            A legenda
          </summary>
          <div className="space-y-3 px-4 pb-4">
            <p className="whitespace-pre-line text-sm leading-relaxed text-neve">{p.legenda}</p>
            <BotaoCopiar texto={p.legenda} rotulo="Copiar legenda" />
          </div>
        </details>
      ) : null}

      <Anexos postagemId={p.id} arquivos={p.arquivos} podeEditar={podeEditar} />

      {p.observacoes ? (
        <p className="mt-4 border-l-2 border-magenta/50 pl-3 text-sm leading-relaxed text-cinza">
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
            Ver no Instagram
            <span aria-hidden>&#8599;</span>
          </a>
        ) : null}

        {podeEditar ? (
          <div className="flex flex-wrap items-center gap-2.5">
            <label className="sr-only" htmlFor={`sp-${p.id}`}>Situação de {p.tema}</label>
            <select
              id={`sp-${p.id}`}
              value={situacao}
              disabled={pendente}
              onChange={(e) => trocar(e.target.value as SituacaoPost)}
              className="min-h-[36px] rounded-full border border-fio bg-white/[0.03] px-4 text-xs text-branco outline-none focus:border-magenta disabled:opacity-60"
            >
              {SITUACOES_POST.map((s) => (
                <option key={s} value={s}>{rotuloSituacaoPost[s]}</option>
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

        {podeExcluir ? <BotaoExcluir postagem={p} /> : null}
      </div>
    </article>
  );
}

function FormPostagem({
  postagem,
  mes,
  equipe,
  acao,
  estado,
  pendente,
  aoCancelar,
  podeEditar = true,
}: {
  postagem?: Postagem;
  mes: string;
  equipe: { id: string; nome: string }[];
  acao: (fd: FormData) => void;
  estado: Resultado | null;
  pendente: boolean;
  aoCancelar: () => void;
  podeEditar?: boolean;
}) {
  return (
    <div className="cartao p-6">
      <form action={acao} className="space-y-5">
        {postagem ? <input type="hidden" name="id" value={postagem.id} /> : null}

        <div>
          <h3 className="font-display text-lg font-bold tracking-[-0.02em]">
            {postagem ? 'Editar postagem' : 'Nova postagem'}
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-cinza">
            Perfil e tema bastam para salvar. Legenda, data e arquivos entram depois.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label htmlFor="po-perfil" className={rotuloCss}>Perfil *</label>
            <select
              id="po-perfil"
              name="perfil"
              required
              defaultValue={postagem?.perfil ?? 'psycomunic'}
              className={`mt-2 ${campo}`}
            >
              {PERFIS_SOCIAIS.map((x) => (
                <option key={x} value={x}>{rotuloPerfilSocial[x]}</option>
              ))}
            </select>
            <p className="mt-1.5 text-xs leading-relaxed text-cinza">
              {quemFalaNoPerfil[postagem?.perfil ?? 'psycomunic']}
            </p>
          </div>
          <div>
            <label htmlFor="po-formato" className={rotuloCss}>Formato</label>
            <select
              id="po-formato"
              name="formato"
              defaultValue={postagem?.formato ?? 'feed'}
              className={`mt-2 ${campo}`}
            >
              {FORMATOS_POST.map((x) => (
                <option key={x} value={x}>{rotuloFormatoPost[x]}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="po-situacao" className={rotuloCss}>Situação</label>
            <select
              id="po-situacao"
              name="situacao"
              defaultValue={postagem?.situacao ?? 'ideia'}
              className={`mt-2 ${campo}`}
            >
              {SITUACOES_POST.map((x) => (
                <option key={x} value={x}>{rotuloSituacaoPost[x]}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="po-tema" className={rotuloCss}>Do que é *</label>
          <input
            id="po-tema"
            name="tema"
            required
            autoFocus
            defaultValue={postagem?.tema}
            placeholder="5 erros no cadastro de grade, bastidor da gravação"
            className={`mt-2 ${campo}`}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label htmlFor="po-data" className={rotuloCss}>Vai ao ar em</label>
            <input
              id="po-data"
              name="data"
              type="date"
              defaultValue={postagem?.data ?? ''}
              min={`${mes}-01`}
              className={`mt-2 ${campo}`}
            />
          </div>
          <div>
            <label htmlFor="po-hora" className={rotuloCss}>Hora</label>
            <input
              id="po-hora"
              name="hora"
              type="time"
              defaultValue={postagem?.hora?.slice(0, 5) ?? ''}
              className={`mt-2 ${campo}`}
            />
          </div>
          <div>
            <label htmlFor="po-resp" className={rotuloCss}>Responsável</label>
            <select
              id="po-resp"
              name="responsavel_id"
              defaultValue={postagem?.responsavelId ?? ''}
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
          <label htmlFor="po-legenda" className={rotuloCss}>A legenda</label>
          <textarea
            id="po-legenda"
            name="legenda"
            rows={5}
            defaultValue={postagem?.legenda ?? ''}
            placeholder="O texto que vai junto com o post, com emoji e quebra de linha"
            className={`mt-2 ${campo}`}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="po-link" className={rotuloCss}>Link do post, depois de publicado</label>
            <input
              id="po-link"
              name="link"
              type="url"
              inputMode="url"
              defaultValue={postagem?.link ?? ''}
              placeholder="https://www.instagram.com/p/..."
              className={`mt-2 ${campo}`}
            />
          </div>
          <div>
            <label htmlFor="po-obs" className={rotuloCss}>Anotações</label>
            <input
              id="po-obs"
              name="observacoes"
              defaultValue={postagem?.observacoes ?? ''}
              placeholder="A trilha, o corte, o que falta"
              className={`mt-2 ${campo}`}
            />
          </div>
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
            {pendente ? 'Salvando...' : postagem ? 'Salvar' : 'Criar e anexar arquivos'}
          </button>
          <button
            type="button"
            onClick={aoCancelar}
            className="rounded-full border border-fio px-6 py-3 text-sm text-neve transition-colors hover:bg-white/5"
          >
            {postagem ? 'Fechar' : 'Cancelar'}
          </button>
        </div>
      </form>

      {/*
        O anexo fica FORA do formulário, e não dentro.

        O envio é imediato e direto para o Storage: não espera o
        "Salvar", porque não passa pelo formulário. Dentro dele, um
        Enter no meio do envio submeteria a postagem no susto, e o botão
        de anexar viraria `submit` por padrão.
      */}
      {postagem ? (
        <div className="mt-6 border-t border-fio pt-5">
          <p className={rotuloCss}>Arquivos</p>
          <Anexos postagemId={postagem.id} arquivos={postagem.arquivos} podeEditar={podeEditar} />
        </div>
      ) : null}
    </div>
  );
}

function BotaoExcluir({ postagem: p }: { postagem: Postagem }) {
  const [estado, acao, pendente] = useActionState<Resultado | null, FormData>(
    excluirPostagem,
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
          Apagar postagem
        </button>
      </div>
    );
  }

  return (
    <form action={acao} className="mt-4 border-t border-fio pt-3">
      <input type="hidden" name="id" value={p.id} />
      <input type="hidden" name="confirmo" value="sim" />
      <p className="text-xs leading-relaxed text-neve">
        Apagar &ldquo;{p.tema}&rdquo;?
        {p.arquivos.length > 0
          ? ` Vão junto ${p.arquivos.length} ${p.arquivos.length === 1 ? 'arquivo' : 'arquivos'}, e não tem volta.`
          : ' Não tem volta.'}
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
