'use client';

import { useActionState, useState, useId } from 'react';
import { criarConta, convidarUsuario, alterarAcesso, definirMeta } from '@/app/painel/acoes';
import type { Resultado } from '@/app/painel/acoes';
import { PAPEIS, rotuloPapel, descricaoPapel, type Papel } from '@/lib/papeis';

/* Estilos compartilhados: campo e rótulo iguais em toda a plataforma. */
const campo =
  'w-full rounded-xl border border-fio bg-white/[0.03] px-4 py-3 text-sm text-branco ' +
  'outline-none transition-colors placeholder:text-cinza/60 focus:border-magenta focus:bg-white/[0.05]';
const rotulo = 'block font-mono text-[0.62rem] uppercase tracking-[0.14em] text-cinza';

function Aviso({ r }: { r: Resultado | null }) {
  if (!r) return null;
  return (
    <p
      role="status"
      className={
        'flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ' +
        (r.ok
          ? 'border-[#4ADE80]/40 bg-[#4ADE80]/10 text-[#4ADE80]'
          : 'border-magenta/40 bg-magenta/10 text-magenta-texto')
      }
    >
      <span aria-hidden className="mt-0.5">{r.ok ? '●' : '■'}</span>
      {r.mensagem}
    </p>
  );
}

/**
 * Painel dobrável.
 *
 * O formulário nasce fechado: a tela de contas existe para LER a
 * carteira, e um formulário sempre aberto empurraria a lista para baixo
 * da dobra em toda visita.
 */
function Dobra({
  titulo,
  acaoRotulo,
  children,
}: {
  titulo: string;
  acaoRotulo: string;
  children: React.ReactNode;
}) {
  const [aberto, setAberto] = useState(false);
  const id = useId();

  return (
    <div className="cartao overflow-hidden">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        aria-controls={id}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-white/[0.03]"
      >
        <span className="font-display text-lg font-bold tracking-[-0.02em]">{titulo}</span>
        <span className="flex items-center gap-2 text-sm font-semibold text-magenta-texto">
          {aberto ? 'Fechar' : acaoRotulo}
          <span
            aria-hidden
            className={'transition-transform duration-300 ' + (aberto ? 'rotate-45' : '')}
          >
            +
          </span>
        </span>
      </button>
      <div id={id} hidden={!aberto} className="border-t border-fio p-6">
        {children}
      </div>
    </div>
  );
}

/* ================================================================== */
/* Nova loja                                                           */
/* ================================================================== */

export function FormNovaConta() {
  const [estado, acao, pendente] = useActionState<Resultado | null, FormData>(criarConta, null);

  return (
    <Dobra titulo="Cadastrar uma loja" acaoRotulo="Nova loja">
      <form action={acao} className="space-y-5">
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label htmlFor="c-nome" className={rotulo}>Nome da loja *</label>
            <input id="c-nome" name="nome" required placeholder="Loja do João" className={`mt-2 ${campo}`} />
          </div>
          <div>
            <label htmlFor="c-plat" className={rotulo}>Plataforma</label>
            {/* Lista dos que aparecem de verdade na base, mas o campo
                aceita texto: plataforma nova não pode travar o cadastro. */}
            <input
              id="c-plat"
              name="plataforma"
              list="plataformas"
              placeholder="Nuvemshop, VTEX, Shopify..."
              className={`mt-2 ${campo}`}
            />
            <datalist id="plataformas">
              {['Nuvemshop', 'VTEX', 'Shopify', 'Tray', 'Magazord', 'WooCommerce', 'Loja Integrada'].map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </div>
          <div>
            <label htmlFor="c-site" className={rotulo}>Site</label>
            <input id="c-site" name="site" type="url" placeholder="https://loja.com.br" className={`mt-2 ${campo}`} />
          </div>
          <div>
            <label htmlFor="c-doc" className={rotulo}>CNPJ</label>
            <input id="c-doc" name="documento" placeholder="00.000.000/0001-00" className={`mt-2 ${campo}`} />
          </div>
        </div>

        <Aviso r={estado} />

        <button
          type="submit"
          disabled={pendente}
          className="rounded-full bg-magenta px-7 py-3 text-sm font-semibold text-branco transition-colors hover:bg-magenta-forte disabled:opacity-60"
        >
          {pendente ? 'Cadastrando...' : 'Cadastrar loja'}
        </button>
      </form>
    </Dobra>
  );
}

/* ================================================================== */
/* Novo usuário                                                        */
/* ================================================================== */

export function FormNovoUsuario({ contas }: { contas: { id: string; nome: string }[] }) {
  const [estado, acao, pendente] = useActionState<Resultado | null, FormData>(
    convidarUsuario,
    null,
  );
  const [papel, setPapel] = useState<Papel>('cliente');
  const [senha, setSenha] = useState('');

  /* Gerar a senha aqui evita o padrão de sempre: o admin com pressa
     digita "cliente123" e essa senha guarda o faturamento da loja. */
  function gerar() {
    const abc = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const bytes = new Uint8Array(18);
    crypto.getRandomValues(bytes);
    let s = '';
    for (const b of bytes) s += abc[b % abc.length];
    setSenha(`${s.slice(0, 6)}-${s.slice(6, 12)}-${s.slice(12, 18)}`);
  }

  const precisaConta = papel === 'cliente';

  return (
    <Dobra titulo="Dar acesso a alguém" acaoRotulo="Novo acesso">
      <form action={acao} className="space-y-5">
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label htmlFor="u-nome" className={rotulo}>Nome *</label>
            <input id="u-nome" name="nome" required placeholder="Maria Silva" className={`mt-2 ${campo}`} />
          </div>
          <div>
            <label htmlFor="u-email" className={rotulo}>E-mail *</label>
            <input id="u-email" name="email" type="email" required placeholder="maria@empresa.com" className={`mt-2 ${campo}`} />
          </div>

          <div>
            <label htmlFor="u-papel" className={rotulo}>Papel *</label>
            <select
              id="u-papel"
              name="papel"
              value={papel}
              onChange={(e) => setPapel(e.target.value as Papel)}
              className={`mt-2 ${campo}`}
            >
              {PAPEIS.map((p) => (
                <option key={p} value={p}>{rotuloPapel[p]}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="u-conta" className={rotulo}>
              Loja {precisaConta ? '*' : '(opcional)'}
            </label>
            <select
              id="u-conta"
              name="conta_id"
              required={precisaConta}
              className={`mt-2 ${campo}`}
              disabled={contas.length === 0}
            >
              <option value="">{contas.length === 0 ? 'Nenhuma loja cadastrada' : 'Sem loja'}</option>
              {contas.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>
        </div>

        {/* A consequencia de cada papel vem da matriz, e nao de texto
            repetido aqui: um lugar so descreve o que cada um enxerga. */}
        <p className="rounded-xl border border-fio bg-white/[0.02] px-4 py-3 text-xs leading-relaxed text-cinza">
          {descricaoPapel[papel]}
        </p>

        <div>
          <label htmlFor="u-senha" className={rotulo}>Senha provisória *</label>
          <div className="mt-2 flex flex-wrap gap-2">
            <input
              id="u-senha"
              name="senha"
              required
              minLength={12}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="mínimo 12 caracteres"
              className={`${campo} min-w-[14rem] flex-1 font-mono`}
            />
            <button
              type="button"
              onClick={gerar}
              className="rounded-xl border border-fio px-5 py-3 text-sm font-semibold text-neve transition-colors hover:bg-white/5"
            >
              Gerar
            </button>
          </div>
          <p className="mt-2 text-xs text-cinza">
            Anote e entregue por um canal seguro. Ela não fica salva em lugar nenhum,
            e esta tela não vai mostrá-la de novo.
          </p>
        </div>

        <Aviso r={estado} />

        <button
          type="submit"
          disabled={pendente}
          className="rounded-full bg-magenta px-7 py-3 text-sm font-semibold text-branco transition-colors hover:bg-magenta-forte disabled:opacity-60"
        >
          {pendente ? 'Criando acesso...' : 'Criar acesso'}
        </button>
      </form>
    </Dobra>
  );
}

/* ================================================================== */
/* Ativar e desativar                                                  */
/* ================================================================== */

export function BotaoAcesso({
  id,
  ativo,
  eVoce,
}: {
  id: string;
  ativo: boolean;
  eVoce: boolean;
}) {
  const [estado, acao, pendente] = useActionState<Resultado | null, FormData>(
    alterarAcesso,
    null,
  );

  if (eVoce) {
    return <span className="text-xs text-cinza">você</span>;
  }

  return (
    <form action={acao} className="flex items-center gap-3">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="ativo" value={String(!ativo)} />
      <button
        type="submit"
        disabled={pendente}
        className="text-sm font-semibold text-magenta-texto transition-opacity hover:opacity-80 disabled:opacity-50"
      >
        {pendente ? '...' : ativo ? 'Desativar' : 'Reativar'}
      </button>
      {estado && !estado.ok ? (
        <span className="text-xs text-magenta-texto">{estado.mensagem}</span>
      ) : null}
    </form>
  );
}

/* ================================================================== */
/* Meta do mês                                                         */
/* ================================================================== */

export function FormMeta({ contas }: { contas: { id: string; nome: string }[] }) {
  const [estado, acao, pendente] = useActionState<Resultado | null, FormData>(definirMeta, null);

  return (
    <Dobra titulo="Definir meta do mês" acaoRotulo="Nova meta">
      <form action={acao} className="space-y-5">
        <p className="text-sm leading-relaxed text-cinza">
          Sem meta, o painel mostra o número e não diz se ele é bom. É a meta que
          transforma &ldquo;R$ 180 mil&rdquo; em &ldquo;83% do mês&rdquo; e calcula
          quanto a loja precisa faturar por dia no que resta.
        </p>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label htmlFor="m-conta" className={rotulo}>Loja *</label>
            <select id="m-conta" name="conta_id" required className={`mt-2 ${campo}`}>
              <option value="">Escolha</option>
              {contas.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="m-receita" className={rotulo}>Meta de receita do mês *</label>
            <input
              id="m-receita"
              name="receita_meta"
              required
              inputMode="decimal"
              placeholder="320000"
              className={`mt-2 ${campo}`}
            />
          </div>
        </div>

        <Aviso r={estado} />

        <button
          type="submit"
          disabled={pendente}
          className="rounded-full bg-magenta px-7 py-3 text-sm font-semibold text-branco transition-colors hover:bg-magenta-forte disabled:opacity-60"
        >
          {pendente ? 'Salvando...' : 'Salvar meta'}
        </button>
      </form>
    </Dobra>
  );
}
