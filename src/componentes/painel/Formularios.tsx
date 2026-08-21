'use client';

import { useActionState, useState, useId } from 'react';
import {
  criarConta,
  convidarUsuario,
  alterarAcesso,
  definirMeta,
  vincularConta,
  desvincularConta,
  transferirCarteira,
} from '@/app/painel/acoes';
import type { Resultado } from '@/app/painel/acoes';
import { PAPEIS, rotuloPapel, descricaoPapel, type Papel } from '@/lib/papeis';

/* Estilos compartilhados: campo e rótulo iguais em toda a plataforma. */
const campo =
  'w-full rounded-xl border border-fio bg-white/[0.03] px-4 py-3 text-sm text-branco ' +
  'outline-none transition-colors placeholder:text-cinza/60 focus:border-magenta focus:bg-white/[0.05]';
const rotulo = 'block font-mono text-[0.75rem] uppercase tracking-[0.14em] text-cinza';

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

  const precisaConta = papel === 'cliente' || papel === 'cliente_leitura';

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

        </div>

        {/*
          Lojas em CAIXAS, e não numa lista de seleção múltipla.

          Um <select multiple> exige segurar Ctrl para marcar a segunda
          opção, e quem não sabe disso marca uma e conclui que só dá para
          escolher uma. Como o ponto desta fase é justamente permitir
          várias, o controle não pode esconder isso.
        */}
        <fieldset>
          <legend className={rotulo}>
            Lojas que esta pessoa enxerga {precisaConta ? '*' : '(opcional)'}
          </legend>

          {contas.length === 0 ? (
            <p className="mt-3 rounded-xl border border-fio bg-white/[0.02] px-4 py-3 text-xs text-cinza">
              Nenhuma loja cadastrada ainda. Cadastre em Clientes antes de dar acesso a um
              lojista.
            </p>
          ) : (
            <>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {contas.map((c) => (
                  <label
                    key={c.id}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-fio bg-white/[0.02] px-4 py-3 text-sm transition-colors hover:bg-white/[0.05]"
                  >
                    <input
                      type="checkbox"
                      name="contas"
                      value={c.id}
                      className="h-4 w-4 shrink-0 accent-[#E4155F]"
                    />
                    {c.nome}
                  </label>
                ))}
              </div>
              <p className="mt-2.5 text-xs leading-relaxed text-cinza">
                {precisaConta
                  ? 'A primeira marcada vira a loja principal, que é a que abre por padrão.'
                  : 'Papel interno enxerga todas as lojas. Marcar aqui só define de quais a pessoa é responsável.'}
              </p>
            </>
          )}
        </fieldset>

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

/* ================================================================== */
/* Vínculo com loja                                                    */
/* ================================================================== */

/**
 * As lojas de uma pessoa, com adicionar e remover.
 *
 * Mostra as LOJAS, e não a contagem. Um "3 lojas" na tabela obriga a
 * abrir outra tela para descobrir quais, e essa é sempre a pergunta
 * seguinte.
 */
export function LojasDaPessoa({
  usuarioId,
  atuais,
  todas,
  editavel,
}: {
  usuarioId: string;
  atuais: { id: string; nome: string }[];
  todas: { id: string; nome: string }[];
  editavel: boolean;
}) {
  const [vincular, acaoVincular, vinculando] = useActionState<Resultado | null, FormData>(
    vincularConta,
    null,
  );
  const [desvincular, acaoDesvincular, desvinculando] = useActionState<
    Resultado | null,
    FormData
  >(desvincularConta, null);

  const disponiveis = todas.filter((t) => !atuais.some((a) => a.id === t.id));
  const erro = [vincular, desvincular].find((r) => r && !r.ok);

  if (atuais.length === 0 && !editavel) {
    return <span className="text-xs text-cinza">todas</span>;
  }

  return (
    <div className="space-y-2">
      <ul className="flex flex-wrap gap-1.5">
        {atuais.length === 0 ? (
          <li className="text-xs text-cinza">todas as lojas</li>
        ) : (
          atuais.map((c) => (
            <li key={c.id}>
              <span className="inline-flex items-center gap-2 rounded-full border border-fio bg-white/[0.03] py-1 pl-3 pr-1.5 text-xs">
                {c.nome}
                {editavel ? (
                  <form action={acaoDesvincular} className="inline">
                    <input type="hidden" name="usuario_id" value={usuarioId} />
                    <input type="hidden" name="conta_id" value={c.id} />
                    <button
                      type="submit"
                      disabled={desvinculando}
                      aria-label={`Remover acesso a ${c.nome}`}
                      className="flex h-4 w-4 items-center justify-center rounded-full text-cinza transition-colors hover:bg-magenta/20 hover:text-magenta-texto disabled:opacity-40"
                    >
                      <span aria-hidden>×</span>
                    </button>
                  </form>
                ) : null}
              </span>
            </li>
          ))
        )}
      </ul>

      {editavel && disponiveis.length > 0 ? (
        <form action={acaoVincular} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="usuario_id" value={usuarioId} />
          <select
            name="conta_id"
            defaultValue=""
            required
            aria-label="Adicionar loja"
            className="rounded-lg border border-fio bg-white/[0.03] px-3 py-1.5 text-xs text-branco outline-none focus:border-magenta"
          >
            <option value="" disabled>
              adicionar loja
            </option>
            {disponiveis.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={vinculando}
            className="text-xs font-semibold text-magenta-texto disabled:opacity-50"
          >
            {vinculando ? '...' : '+ dar acesso'}
          </button>
        </form>
      ) : null}

      {erro ? <p className="text-xs text-magenta-texto">{erro.mensagem}</p> : null}
    </div>
  );
}

/* ================================================================== */
/* Transferência de carteira                                           */
/* ================================================================== */

export function FormTransferencia({
  pessoas,
}: {
  pessoas: { id: string; nome: string; contas: number }[];
}) {
  const [estado, acao, pendente] = useActionState<Resultado | null, FormData>(
    transferirCarteira,
    null,
  );

  const comCarteira = pessoas.filter((p) => p.contas > 0);

  return (
    <Dobra titulo="Transferir carteira" acaoRotulo="Transferir">
      <form action={acao} className="space-y-5">
        <p className="text-sm leading-relaxed text-cinza">
          Passa todas as lojas de uma pessoa para outra. Existe porque desativar alguém sem
          passar a carteira adiante deixa contas órfãs: ninguém responsável, ninguém
          recebendo o alerta, e o problema só aparece quando o cliente liga reclamando.
        </p>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label htmlFor="t-de" className={rotulo}>De quem sai *</label>
            <select id="t-de" name="de_id" required defaultValue="" className={`mt-2 ${campo}`}>
              <option value="" disabled>Escolha</option>
              {comCarteira.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome} ({p.contas} {p.contas === 1 ? 'loja' : 'lojas'})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="t-para" className={rotulo}>Para quem vai *</label>
            <select id="t-para" name="para_id" required defaultValue="" className={`mt-2 ${campo}`}>
              <option value="" disabled>Escolha</option>
              {pessoas.map((p) => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </select>
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-3 text-sm text-neve">
          <input type="checkbox" name="desativar" value="true" className="h-4 w-4 accent-[#E4155F]" />
          Desativar o acesso de quem sai
        </label>

        <Aviso r={estado} />

        <button
          type="submit"
          disabled={pendente || comCarteira.length === 0}
          className="rounded-full bg-magenta px-7 py-3 text-sm font-semibold text-branco transition-colors hover:bg-magenta-forte disabled:opacity-60"
        >
          {pendente ? 'Transferindo...' : 'Transferir carteira'}
        </button>
      </form>
    </Dobra>
  );
}
