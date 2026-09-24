'use client';

import { useActionState, useMemo, useState } from 'react';
import { marcarAbordado } from '@/app/painel/acoes-prospeccao';
import type { Resultado } from '@/app/painel/acoes';
import type { Prospecto, PrioridadeProspeccao } from '@/lib/dados/tipos';
import { PRIORIDADES_PROSPECCAO, explicaPrioridadeProspeccao, rotuloEstagio } from '@/lib/dados/tipos';
import { contagemCurta } from '@/lib/formato';

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
}: {
  prospectos: Prospecto[];
  podeEditar: boolean;
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
              <CartaoProspecto prospecto={p} podeEditar={podeEditar} />
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
}: {
  prospecto: Prospecto;
  podeEditar: boolean;
}) {
  const [estado, acao, pendente] = useActionState<Resultado | null, FormData>(
    marcarAbordado,
    null,
  );

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

      {p.mensagemAbertura ? (
        <details className="group mt-4 rounded-xl border border-fio bg-white/[0.02]">
          <summary className="cursor-pointer list-none px-4 py-3 text-xs font-semibold text-neve transition-colors hover:bg-white/5">
            <span aria-hidden className="mr-2 text-magenta-texto group-open:hidden">+</span>
            <span aria-hidden className="mr-2 hidden text-magenta-texto group-open:inline">−</span>
            Mensagem de abertura
            {p.canal ? <span className="ml-2 font-normal text-cinza">{p.canal}</span> : null}
          </summary>

          <div className="space-y-3 px-4 pb-4">
            <p className="text-sm leading-relaxed text-neve">{p.mensagemAbertura}</p>
            <BotaoCopiar texto={p.mensagemAbertura} />

            {p.perguntas ? (
              <div className="border-t border-fio pt-3">
                <p className="font-mono text-[0.75rem] uppercase tracking-[0.14em] text-cinza">
                  Perguntas de qualificação
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-neve">{p.perguntas}</p>
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
      </div>
    </article>
  );
}

/**
 * Copiar a mensagem.
 *
 * `navigator.clipboard` não existe fora de HTTPS e pode ser negado por
 * permissão. Quando falha, o botão não finge que deu certo: ele SELECIONA
 * o texto e diz para copiar à mão, que é o que sobra.
 */
function BotaoCopiar({ texto }: { texto: string }) {
  const [copiado, setCopiado] = useState<'nao' | 'sim' | 'falhou'>('nao');

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado('sim');
      setTimeout(() => setCopiado('nao'), 2500);
    } catch {
      setCopiado('falhou');
    }
  }

  return (
    <p className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={copiar}
        className="rounded-full border border-fio px-4 py-2 text-xs font-semibold text-neve transition-colors hover:bg-white/5"
      >
        Copiar mensagem
      </button>
      <span aria-live="polite" className="text-xs text-cinza">
        {copiado === 'sim' ? 'Copiada.' : null}
        {copiado === 'falhou' ? 'O navegador não deixou copiar. Selecione o texto acima.' : null}
      </span>
    </p>
  );
}
