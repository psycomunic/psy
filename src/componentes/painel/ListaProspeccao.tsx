'use client';

import { useActionState, useMemo, useState } from 'react';
import { excluirProspecto, marcarAbordado, salvarDono } from '@/app/painel/acoes-prospeccao';
import type { Resultado } from '@/app/painel/acoes';
import type { Prospecto, PrioridadeProspeccao } from '@/lib/dados/tipos';
import { PRIORIDADES_PROSPECCAO, explicaPrioridadeProspeccao, rotuloEstagio } from '@/lib/dados/tipos';
import { contagemCurta } from '@/lib/formato';
import { BotaoCopiar } from './BotaoCopiar';
import { donoConhecido, partesDaAbordagem } from '@/lib/dominio/abordagem.ts';

const campo =
  'w-full rounded-xl border border-fio bg-white/[0.03] px-4 py-2.5 text-sm text-branco ' +
  'outline-none transition-colors placeholder:text-cinza/60 focus:border-magenta';
const rotuloCampo = 'block font-mono text-[0.75rem] uppercase tracking-[0.14em] text-cinza';

/**
 * A lista de prospecção ativa.
 *
 * ============================================================
 * POR QUE NÃO É UMA TABELA
 * ============================================================
 * Cada linha carrega uma mensagem de abertura de quatro linhas e um
 * gancho. Numa tabela, isso vira uma célula que ou trunca o texto que
 * importa, ou estica a linha até a rolagem horizontal. Cartão empilha
 * no telefone sem virar planilha deitada.
 *
 * ============================================================
 * A MENSAGEM FICA FECHADA
 * ============================================================
 * Cinquenta mensagens abertas é uma parede de texto onde ninguém acha
 * nada. `<details>` abre a que interessa, funciona sem JavaScript, e o
 * Ctrl+F do navegador acha o texto mesmo fechado.
 *
 * ============================================================
 * O FILTRO RODA NO CLIENTE
 * ============================================================
 * A lista inteira já veio, e cabe na memória. Ir ao servidor a cada
 * tecla daria latência a um filtro cuja resposta está aqui.
 */
export function ListaProspeccao({
  prospectos,
  podeEditar,
  podeExcluir = false,
}: {
  prospectos: Prospecto[];
  podeEditar: boolean;
  /** Só o administrador. Vem da matriz de permissões, e o RLS diz o
      mesmo: esconder o botão é conforto, quem impede é o Postgres. */
  podeExcluir?: boolean;
}) {
  const [prioridade, setPrioridade] = useState<PrioridadeProspeccao | 'todas'>('todas');
  const [cidade, setCidade] = useState('todas');
  const [soFaltando, setSoFaltando] = useState(false);
  const [busca, setBusca] = useState('');

  /* Sem acento e sem caixa: quem digita "brusque" quer achar "Brusque",
     e quem digita "intima" quer achar "Moda íntima". */
  const normalizar = (t: string) =>
    t.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

  const cidades = useMemo(
    () =>
      [...new Set(prospectos.map((p) => p.cidade).filter(Boolean) as string[])].sort(
        (a, b) => a.localeCompare(b, 'pt-BR'),
      ),
    [prospectos],
  );

  const termo = normalizar(busca.trim());

  const visiveis = prospectos.filter((p) => {
    if (prioridade !== 'todas' && p.prioridade !== prioridade) return false;
    if (cidade !== 'todas' && p.cidade !== cidade) return false;
    if (soFaltando && !p.aguardandoAbordagem) return false;
    if (!termo) return true;
    return normalizar(
      [p.empresa, p.instagram, p.cidade, p.segmento, p.oportunidade, p.situacaoSite]
        .filter(Boolean)
        .join(' '),
    ).includes(termo);
  });

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por marca, @, cidade ou segmento"
          aria-label="Buscar na lista de prospecção"
          className="min-w-0 grow rounded-full border border-fio bg-white/[0.03] px-5 py-2.5 text-sm text-branco outline-none transition-colors placeholder:text-cinza/60 focus:border-magenta sm:max-w-xs"
        />

        <div className="flex items-center gap-1.5" role="group" aria-label="Filtrar por prioridade">
          {(['todas', ...PRIORIDADES_PROSPECCAO] as const).map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={prioridade === p}
              onClick={() => setPrioridade(p)}
              title={p === 'todas' ? 'Todas as prioridades' : explicaPrioridadeProspeccao[p]}
              className={
                'min-h-[36px] rounded-full border px-4 text-xs font-semibold transition-colors ' +
                (prioridade === p
                  ? 'border-magenta bg-magenta text-branco'
                  : 'border-fio text-neve hover:bg-white/5')
              }
            >
              {p === 'todas' ? 'Todas' : p}
            </button>
          ))}
        </div>

        <label className="sr-only" htmlFor="pro-cidade">
          Cidade
        </label>
        <select
          id="pro-cidade"
          value={cidade}
          onChange={(e) => setCidade(e.target.value)}
          className="min-h-[36px] rounded-full border border-fio bg-white/[0.03] px-4 text-xs text-branco outline-none focus:border-magenta"
        >
          <option value="todas">Todas as cidades</option>
          {cidades.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <button
          type="button"
          aria-pressed={soFaltando}
          onClick={() => setSoFaltando((v) => !v)}
          className={
            'min-h-[36px] rounded-full border px-4 text-xs font-semibold transition-colors ' +
            (soFaltando
              ? 'border-magenta bg-magenta text-branco'
              : 'border-fio text-neve hover:bg-white/5')
          }
        >
          Só quem falta abordar
        </button>

        <span aria-live="polite" className="text-xs text-cinza">
          {visiveis.length} de {prospectos.length}
        </span>
      </div>

      {visiveis.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-fio px-5 py-8 text-center text-sm text-cinza">
          Nenhuma marca com esses filtros.
        </p>
      ) : (
        <ul className="mt-6 grid gap-4 xl:grid-cols-2">
          {visiveis.map((p) => (
            <li key={p.id}>
              <CartaoProspecto
                prospecto={p}
                podeEditar={podeEditar}
                podeExcluir={podeExcluir}
              />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

/* A cor da prioridade nunca vem sozinha: a letra está escrita dentro do
   selo, e o título diz o que ela significa. */
const corPrioridade: Record<PrioridadeProspeccao, string> = {
  A: 'border-magenta/50 bg-magenta/15 text-magenta-texto',
  B: 'border-fio bg-white/5 text-neve',
  C: 'border-fio bg-white/[0.02] text-cinza',
};

function CartaoProspecto({
  prospecto: p,
  podeEditar,
  podeExcluir,
}: {
  prospecto: Prospecto;
  podeEditar: boolean;
  podeExcluir: boolean;
}) {
  const [estado, acao, pendente] = useActionState<Resultado | null, FormData>(
    marcarAbordado,
    null,
  );

  /* O nome entra no texto aqui, e não no banco: a mensagem chega pela
     carga e o dono é descoberto depois, um a um. Ver
     `src/lib/dominio/abordagem.ts`. */
  const dono = donoConhecido(p.nomeContato, p.instagram);
  const partes = partesDaAbordagem(p.mensagemAbertura, dono);
  const oferta = partesDaAbordagem(p.mensagemOferta, dono);

  const fatos = [
    p.modeloVenda,
    p.fabricacaoPropria === 'Sim' ? 'Fabricação própria' : 'Fabricação a confirmar',
    p.situacaoSite,
    p.seguidores !== null ? `${contagemCurta(p.seguidores)} seguidores` : null,
  ].filter(Boolean) as string[];

  return (
    <article className="cartao flex h-full flex-col p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-lg font-bold leading-snug tracking-[-0.02em]">
            {p.empresa ?? p.instagram ?? 'Sem nome'}
          </h3>
          <p className="mt-1 text-sm text-cinza">
            {p.instagramUrl && p.instagram ? (
              <a
                href={p.instagramUrl}
                target="_blank"
                rel="noopener"
                className="text-magenta-texto underline-offset-4 hover:underline"
              >
                {p.instagram}
              </a>
            ) : (
              p.instagram
            )}
            {p.cidade ? <span className="text-cinza"> · {p.cidade}</span> : null}
            {p.regiao && p.regiao !== p.cidade ? (
              <span className="text-cinza"> · {p.regiao}</span>
            ) : null}
          </p>
        </div>

        <div className="flex flex-none items-center gap-2">
          {p.prioridade ? (
            <span
              title={explicaPrioridadeProspeccao[p.prioridade]}
              className={
                'rounded-full border px-3 py-1 font-mono text-[0.75rem] font-semibold tracking-[0.1em] ' +
                corPrioridade[p.prioridade]
              }
            >
              {p.prioridade}
            </span>
          ) : null}
          {!p.aguardandoAbordagem ? (
            <span className="rounded-full border border-fio px-3 py-1 text-[0.75rem] font-semibold text-neve">
              {rotuloEstagio[p.estagio]}
            </span>
          ) : null}
        </div>
      </header>

      {p.segmento ? (
        <p className="mt-3 text-sm text-neve">{p.segmento}</p>
      ) : null}

      <ul className="mt-3 flex flex-wrap gap-2">
        {fatos.map((f) => (
          <li
            key={f}
            className="rounded-full border border-fio px-3 py-1 text-xs text-cinza"
          >
            {f}
          </li>
        ))}
      </ul>

      {p.gancho ? (
        <p className="mt-4 border-l-2 border-magenta/50 pl-3 text-sm leading-relaxed text-neve">
          {p.gancho}
        </p>
      ) : null}

      <BlocoDono prospecto={p} podeEditar={podeEditar} />

      {p.mensagemAbertura ? (
        <details className="group mt-4 rounded-xl border border-fio bg-white/[0.02]">
          <summary className="cursor-pointer list-none px-4 py-3 text-xs font-semibold text-neve transition-colors hover:bg-white/5">
            <span aria-hidden className="mr-2 text-magenta-texto group-open:hidden">+</span>
            <span aria-hidden className="mr-2 hidden text-magenta-texto group-open:inline">−</span>
            1. A abordagem
            {p.canal ? <span className="ml-2 font-normal text-cinza">{p.canal}</span> : null}
            <span className="ml-2 font-normal text-cinza">
              {partes.length} {partes.length === 1 ? 'mensagem' : 'mensagens'}
            </span>
          </summary>

          <div className="space-y-3 px-4 pb-4">
            <ListaDeMensagens partes={partes} />

            {!dono ? (
              <p className="text-xs leading-relaxed text-cinza">
                Sem o nome do dono, a mensagem abre com &ldquo;Oi, tudo bem?&rdquo;. Preencha em
                &ldquo;Quem é o dono?&rdquo; e ela passa a chamar a pessoa pelo nome.
              </p>
            ) : null}

            {/* A segunda mensagem, com botão próprio. São dois envios de
                propósito: mensagem com duas coisas dentro é respondida
                pela primeira ou por nenhuma. O número "2" está escrito,
                e não só sugerido pela ordem na tela. */}
            {/* A oferta vem ANTES da cobranca na tela porque vem antes
                na conversa: quem responde recebe isto, e só quem fica
                em silêncio recebe o lembrete. */}
            {oferta.length > 0 ? (
              <div className="border-t border-fio pt-3">
                <p className="font-mono text-[0.75rem] uppercase tracking-[0.14em] text-magenta-texto">
                  2. Quando ele responder
                </p>
                <div className="mt-2.5">
                  <ListaDeMensagens partes={oferta} />
                </div>
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

      {p.notas ? <p className="mt-3 text-xs leading-relaxed text-cinza">{p.notas}</p> : null}

      {/* `mt-auto` empurra a ação para o rodapé: numa grade de dois, os
          cartões têm alturas diferentes e os botões desalinhados fazem
          a lista parecer quebrada. */}
      <div className="mt-auto pt-5">
        {p.aguardandoAbordagem && podeEditar ? (
          <form action={acao} className="flex flex-wrap items-center gap-3">
            <input type="hidden" name="lead_id" value={p.leadId} />
            <button
              type="submit"
              disabled={pendente}
              className="rounded-full bg-magenta px-5 py-2.5 text-sm font-semibold text-branco transition-colors hover:bg-magenta-forte disabled:opacity-60"
            >
              {pendente ? 'Registrando...' : 'Marcar abordagem enviada'}
            </button>
            {p.instagramUrl ? (
              <a
                href={p.instagramUrl}
                target="_blank"
                rel="noopener"
                className="rounded-full border border-fio px-5 py-2.5 text-sm text-neve transition-colors hover:bg-white/5"
              >
                Abrir o perfil
              </a>
            ) : null}
          </form>
        ) : p.proximoPasso ? (
          <p className="text-xs leading-relaxed text-cinza">
            <span aria-hidden className="mr-1 text-magenta-texto">→</span>
            {p.proximoPasso}
          </p>
        ) : null}

        {estado ? (
          <p
            role="status"
            className={
              'mt-3 text-xs font-semibold ' +
              (estado.ok ? 'text-[#4ADE80]' : 'text-magenta-texto')
            }
          >
            <span aria-hidden className="mr-1.5">{estado.ok ? '●' : '■'}</span>
            {estado.mensagem}
          </p>
        ) : null}

        {podeExcluir ? <BotaoExcluir prospecto={p} /> : null}
      </div>
    </article>
  );
}

/**
 * Tirar a marca da lista.
 *
 * ============================================================
 * DOIS CLIQUES, E O SEGUNDO DIZ O QUE VAI SUMIR
 * ============================================================
 * `confirm()` do navegador é bloqueado, some em aba de fundo e não dá
 * para escrever nele o que vai ser perdido. A confirmação mora aqui,
 * no cartão, e nomeia a marca: "Apagar Dukali?" é uma pergunta que se
 * responde; "Tem certeza?" é uma que se clica sem ler.
 *
 * ============================================================
 * DISCRETO DE PROPÓSITO
 * ============================================================
 * A tela existe para abordar, e não para limpar. O botão fica no pé do
 * cartão, pequeno e sem cor de alerta enquanto não foi tocado: o
 * vermelho aparece só na confirmação, onde ele realmente avisa de algo.
 */
function BotaoExcluir({ prospecto: p }: { prospecto: Prospecto }) {
  const [estado, acao, pendente] = useActionState<Resultado | null, FormData>(
    excluirProspecto,
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
          /* `min-h-[24px]` como os outros links pequenos do painel: um
             botão de texto puro fica com 16px de altura de toque, e foi
             o menor alvo da rota inteira na medição. */
          className="inline-flex min-h-[24px] items-center text-xs text-cinza underline-offset-4 transition-colors hover:text-neve hover:underline"
        >
          Apagar da lista
        </button>
      </div>
    );
  }

  return (
    <form action={acao} className="mt-4 border-t border-fio pt-3">
      <input type="hidden" name="id" value={p.leadId} />
      <input type="hidden" name="confirmo" value="sim" />

      <p className="text-xs leading-relaxed text-neve">
        Apagar {p.empresa ?? p.instagram}? Some a pesquisa e o histórico de conversa, e não
        tem volta.
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

/* ================================================================== */
/* O dono da marca                                                     */
/* ================================================================== */

/**
 * Quem é a pessoa, e onde ela está.
 *
 * ============================================================
 * POR QUE É UM CAMPO, E NÃO UMA BUSCA AUTOMÁTICA
 * ============================================================
 * O caminho é conhecido e curto: consulta o CNPJ, lê a razão social,
 * acha o perfil pessoal. Numa empresa individual a razão social É o
 * nome da pessoa. Automatizar isso significaria raspar um site de
 * terceiro, que muda de formato e bloqueia robô, para economizar trinta
 * segundos por marca. O que o painel faz é o que importa: guardar o
 * resultado, para ninguém refazer a busca na semana seguinte.
 *
 * ============================================================
 * DOBRADO, E RESUMIDO NA PRÓPRIA DOBRA
 * ============================================================
 * Cinquenta formulários abertos são cinquenta caixas de texto entre a
 * pessoa e a lista. Fechado, o título já mostra o nome e o arroba, que
 * é o que se quer ler depois de preencher.
 */
function BlocoDono({
  prospecto: p,
  podeEditar,
}: {
  prospecto: Prospecto;
  podeEditar: boolean;
}) {
  const [estado, acao, pendente] = useActionState<Resultado | null, FormData>(salvarDono, null);

  const nome = donoConhecido(p.nomeContato, p.instagram);
  const sabido = nome || p.instagramDono || p.cnpj;

  if (!podeEditar) {
    if (!sabido) return null;
    return (
      <p className="mt-3 text-sm text-neve">
        {nome ?? 'Dono'}
        {p.instagramDono ? <span className="text-cinza"> · {p.instagramDono}</span> : null}
      </p>
    );
  }

  return (
    <details className="group mt-4 rounded-xl border border-fio bg-white/[0.02]">
      <summary className="cursor-pointer list-none px-4 py-3 text-xs font-semibold text-neve transition-colors hover:bg-white/5">
        <span aria-hidden className="mr-2 text-magenta-texto group-open:hidden">+</span>
        <span aria-hidden className="mr-2 hidden text-magenta-texto group-open:inline">-</span>
        {sabido ? (
          <>
            Dono: <span className="font-normal text-cinza">{nome ?? 'sem nome'}</span>
            {p.instagramDono ? (
              <span className="ml-2 font-normal text-magenta-texto">{p.instagramDono}</span>
            ) : null}
          </>
        ) : (
          'Quem é o dono?'
        )}
      </summary>

      <div className="space-y-4 px-4 pb-4">
        {/* Os atalhos primeiro: com o dado preenchido, o que se quer
            daqui é sair para o perfil, e não reeditar o campo. */}
        {p.instagramDono || p.cnpj ? (
          <p className="flex flex-wrap gap-2">
            {p.instagramDono ? (
              <a
                href={`https://www.instagram.com/${p.instagramDono.replace('@', '')}/`}
                target="_blank"
                rel="noopener"
                className="inline-flex min-h-[24px] items-center gap-2 rounded-full border border-fio px-4 py-2 text-xs font-semibold text-neve transition-colors hover:bg-white/5"
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
                className="inline-flex min-h-[24px] items-center gap-2 rounded-full border border-fio px-4 py-2 text-xs font-semibold text-neve transition-colors hover:bg-white/5"
              >
                Ver o CNPJ
                <span aria-hidden>&#8599;</span>
              </a>
            ) : null}
          </p>
        ) : null}

        <form action={acao} className="space-y-3">
          <input type="hidden" name="lead_id" value={p.leadId} />

          <div>
            <label htmlFor={`cnpj-${p.id}`} className={rotuloCampo}>
              CNPJ
            </label>
            <input
              id={`cnpj-${p.id}`}
              name="cnpj"
              defaultValue={p.cnpj ?? ''}
              inputMode="numeric"
              placeholder="45.160.542/0001-60"
              className={`mt-1.5 ${campo}`}
            />
            <p className="mt-1.5 text-xs leading-relaxed text-cinza">
              Cole com pontuação ou sem. Em empresa individual, a razão social é o nome do dono.
            </p>
          </div>

          <div>
            <label htmlFor={`dono-${p.id}`} className={rotuloCampo}>
              Nome do dono
            </label>
            <input
              id={`dono-${p.id}`}
              name="nome"
              defaultValue={nome ?? ''}
              placeholder="Mirian Alves Maia"
              className={`mt-1.5 ${campo}`}
            />
          </div>

          <div>
            <label htmlFor={`iga-${p.id}`} className={rotuloCampo}>
              Instagram do dono
            </label>
            <input
              id={`iga-${p.id}`}
              name="instagram_dono"
              defaultValue={p.instagramDono ?? ''}
              placeholder="@mirianalves"
              className={`mt-1.5 ${campo}`}
            />
            <p className="mt-1.5 text-xs leading-relaxed text-cinza">
              Vale colar o endereço inteiro do perfil.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={pendente}
              className="rounded-full border border-fio px-5 py-2.5 text-xs font-semibold text-neve transition-colors hover:bg-white/5 disabled:opacity-60"
            >
              {pendente ? 'Salvando...' : 'Salvar'}
            </button>
            {estado ? (
              <span
                role="status"
                className={
                  'text-xs font-semibold ' +
                  (estado.ok ? 'text-[#4ADE80]' : 'text-magenta-texto')
                }
              >
                <span aria-hidden className="mr-1.5">{estado.ok ? '●' : '■'}</span>
                {estado.mensagem}
              </span>
            ) : null}
          </div>
        </form>
      </div>
    </details>
  );
}

/* ================================================================== */
/* As mensagens da abertura, uma a uma                                 */
/* ================================================================== */

/**
 * Cada parte com o seu botão.
 *
 * ============================================================
 * POR QUE NÃO UM BOTÃO SÓ, COM O TEXTO INTEIRO
 * ============================================================
 * Porque não é assim que a mensagem é enviada. No direct ela sai em
 * quatro: a saudação, quem é e por que achou a pessoa, a prova, e o
 * convite. Um botão só devolveria o bloco que já estava sendo
 * recortado à mão antes de colar.
 *
 * O número na frente não é enfeite: ele diz que existe uma ORDEM, e
 * que a terceira só faz sentido depois da segunda.
 *
 * O "copiar tudo" continua embaixo, para quem preferir mandar de uma
 * vez ou colar noutro lugar.
 */
function ListaDeMensagens({ partes }: { partes: string[] }) {
  if (partes.length === 0) return null;
  if (partes.length === 1) {
    return (
      <>
        <p className="text-sm leading-relaxed text-neve">{partes[0]}</p>
        <BotaoCopiar texto={partes[0]} />
      </>
    );
  }

  return (
    <>
      <ol className="space-y-2.5">
        {partes.map((parte, i) => (
          <li
            key={parte}
            className="flex items-start gap-3 rounded-xl border border-fio bg-white/[0.02] p-3"
          >
            <span
              aria-hidden
              className="tabular mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-magenta/15 text-[0.75rem] font-bold text-magenta-texto"
            >
              {i + 1}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm leading-relaxed text-neve">{parte}</span>
              <span className="mt-2 block">
                <BotaoCopiar texto={parte} rotulo={`Copiar a ${i + 1}ª`} />
              </span>
            </span>
          </li>
        ))}
      </ol>

      <div className="space-y-2">
        <BotaoCopiar texto={partes.join('\n\n')} rotulo="Copiar todas" />
        {/* O lugar do elogio que não dá para gravar: contagem de
            seguidor envelhece entre o levantamento e o envio, e errar o
            número na frase em que se elogia a pessoa é pior do que não
            citar. Quem manda confere no perfil e encaixa na hora. */}
        <p className="text-xs leading-relaxed text-cinza">
          O número de seguidores fica de fora da 2ª de propósito. Confira no perfil e encaixe
          na hora, com o parabéns.
        </p>
      </div>
    </>
  );
}
