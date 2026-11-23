'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import {
  gerarRelatorio,
  gerarRelatoriosEmLote,
  editarRelatorio,
  atualizarNumerosRelatorio,
  mudarStatusRelatorio,
  apagarRelatorio,
  enviarRelatorioPorEmail,
} from '@/app/painel/acoes-relatorio';
import type { Resultado } from '@/app/painel/acoes';
import {
  BLOCOS_RELATORIO,
  rotuloBlocoRelatorio,
  type BlocoRelatorio,
  type RelatorioResumo,
} from '@/lib/dados/tipos';
import {
  PERFIS_METRICA,
  rotuloPerfilMetrica,
  resolverJanelaPeriodo,
  type PerfilMetrica,
} from '@/lib/dominio/perfis-metrica';
import { somarDias } from '@/lib/datas';

const campo =
  'w-full rounded-xl border border-fio bg-white/[0.03] px-4 py-3 text-sm text-branco ' +
  'outline-none transition-colors placeholder:text-cinza/60 focus:border-magenta focus:bg-white/[0.05]';
const rotulo = 'block font-mono text-[0.75rem] uppercase tracking-[0.14em] text-cinza';

type OpcaoConta = {
  id: string;
  nome: string;
  segmento: string | null;
  perfilEfetivo: string;
  contatoPadrao: string | null;
};

function Aviso({ r }: { r: Resultado | null }) {
  if (!r) return null;
  return (
    <p
      role="status"
      className={
        'flex items-start gap-3 rounded-xl border px-4 py-3 text-sm leading-relaxed ' +
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

const BLOCOS_PADRAO: BlocoRelatorio[] = [
  'kpis',
  'funil',
  'serie',
  'campanhas',
  'canais',
  'marcos',
];

export function FormRelatorio({
  contas,
  contaInicial,
  deInicial,
  ateInicial,
  hojeReferencia,
  editando,
}: {
  contas: OpcaoConta[];
  contaInicial?: string;
  deInicial: string;
  ateInicial: string;
  hojeReferencia: string;
  editando?: RelatorioResumo | null;
}) {
  const [modo, setModo] = useState<'um' | 'lote'>('um');
  const [aberto, setAberto] = useState(Boolean(editando || contaInicial));

  const [estadoUm, acaoUm, pendenteUm] = useActionState<Resultado | null, FormData>(
    editando ? editarRelatorio : gerarRelatorio,
    null,
  );
  const [estadoLote, acaoLote, pendenteLote] = useActionState<Resultado | null, FormData>(
    gerarRelatoriosEmLote,
    null,
  );

  const [contaSel, setContaSel] = useState(
    editando?.contaId ?? contaInicial ?? contas[0]?.id ?? '',
  );
  const contaObj = contas.find((c) => c.id === contaSel);

  const [contato, setContato] = useState(
    editando?.contato ?? contaObj?.contatoPadrao ?? '',
  );
  const [de, setDe] = useState(editando?.periodoDe ?? deInicial);
  const [ate, setAte] = useState(editando?.periodoAte ?? ateInicial);
  const [perfil, setPerfil] = useState<PerfilMetrica>(
    editando?.perfilMetrica ?? 'automatico',
  );
  const [blocos, setBlocos] = useState<BlocoRelatorio[]>(
    editando?.blocosVisiveis ?? BLOCOS_PADRAO,
  );
  const [contasLote, setContasLote] = useState<string[]>(contas.map((c) => c.id));

  function trocarConta(id: string) {
    setContaSel(id);
    const achada = contas.find((c) => c.id === id);
    if (!editando && achada?.contatoPadrao) setContato(achada.contatoPadrao);
  }

  function alternarBloco(b: BlocoRelatorio) {
    setBlocos((atual) =>
      atual.includes(b) ? atual.filter((x) => x !== b) : [...atual, b],
    );
  }

  function alternarLote(id: string) {
    setContasLote((atual) =>
      atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id],
    );
  }

  function aplicarAtalhoDatas(tipo: '7d' | '15d' | '30d' | 'mes_passado') {
    if (tipo === 'mes_passado') {
      const j = resolverJanelaPeriodo({ periodo: 'mes_anterior', hoje: hojeReferencia });
      setDe(j.de);
      setAte(j.ate);
      return;
    }
    const dias = tipo === '7d' ? 7 : tipo === '15d' ? 15 : 30;
    const ontem = somarDias(hojeReferencia, -1);
    setDe(somarDias(ontem, -(dias - 1)));
    setAte(ontem);
  }

  if (contas.length === 0) {
    return (
      <p className="cartao p-6 text-sm text-cinza">
        Cadastre pelo menos um cliente em <strong className="text-neve">Clientes</strong> para gerar relatórios.
      </p>
    );
  }

  if (!aberto && !editando) {
    return (
      <div className="cartao flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <h2 className="font-display text-lg font-bold tracking-[-0.02em]">
            Gerador de relatórios para clientes
          </h2>
          <p className="mt-1 text-sm text-cinza">
            Monte um relatório individual personalizado ou gere o fechamento de vários clientes de uma só vez.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              setModo('um');
              setAberto(true);
            }}
            className="rounded-full bg-magenta px-6 py-2.5 text-sm font-semibold text-branco transition-colors hover:bg-magenta-forte"
          >
            + Novo relatório
          </button>
          {contas.length > 1 ? (
            <button
              type="button"
              onClick={() => {
                setModo('lote');
                setAberto(true);
              }}
              className="rounded-full border border-fio px-5 py-2.5 text-sm font-semibold text-neve transition-colors hover:bg-white/5"
            >
              Fechamento em lote ({contas.length})
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <section className="cartao space-y-6 p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-fio pb-5">
        <div>
          <h2 className="font-display text-xl font-extrabold tracking-[-0.03em]">
            {editando ? `Editando relatório de ${editando.cliente}` : 'Montar relatório de desempenho'}
          </h2>
          <p className="mt-1 text-sm text-cinza">
            Os números são congelados no momento da geração para preservar o histórico entregue ao cliente.
          </p>
        </div>

        {!editando && contas.length > 1 ? (
          <div className="flex rounded-full border border-fio p-1 text-xs">
            <button
              type="button"
              onClick={() => setModo('um')}
              className={
                'rounded-full px-4 py-1.5 font-semibold transition-colors ' +
                (modo === 'um' ? 'bg-magenta text-branco' : 'text-cinza hover:text-neve')
              }
            >
              Um cliente
            </button>
            <button
              type="button"
              onClick={() => setModo('lote')}
              className={
                'rounded-full px-4 py-1.5 font-semibold transition-colors ' +
                (modo === 'lote' ? 'bg-magenta text-branco' : 'text-cinza hover:text-neve')
              }
            >
              Vários clientes em lote
            </button>
          </div>
        ) : null}
      </div>

      {/* Atalhos rápidos de janela */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-cinza">
          Atalho de datas:
        </span>
        {[
          { k: '7d' as const, r: 'Últimos 7 dias' },
          { k: '15d' as const, r: 'Últimos 15 dias' },
          { k: '30d' as const, r: 'Últimos 30 dias' },
          { k: 'mes_passado' as const, r: 'Mês fechado anterior' },
        ].map((at) => (
          <button
            key={at.k}
            type="button"
            onClick={() => aplicarAtalhoDatas(at.k)}
            className="rounded-full border border-fio px-3 py-1 text-xs text-neve transition-colors hover:bg-white/[0.06]"
          >
            {at.r}
          </button>
        ))}
      </div>

      {modo === 'lote' && !editando ? (
        <form action={acaoLote} className="space-y-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="l-de" className={rotulo}>Data inicial *</label>
              <input
                id="l-de"
                type="date"
                name="periodo_de"
                required
                value={de}
                onChange={(e) => setDe(e.target.value)}
                className={`mt-2 ${campo}`}
              />
            </div>
            <div>
              <label htmlFor="l-ate" className={rotulo}>Data final *</label>
              <input
                id="l-ate"
                type="date"
                name="periodo_ate"
                required
                value={ate}
                onChange={(e) => setAte(e.target.value)}
                className={`mt-2 ${campo}`}
              />
            </div>
          </div>

          <fieldset>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <legend className={rotulo}>
                Clientes incluídos ({contasLote.length} de {contas.length}) *
              </legend>
              <div className="flex gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setContasLote(contas.map((c) => c.id))}
                  className="font-semibold text-magenta-texto hover:underline"
                >
                  Marcar todos
                </button>
                <button
                  type="button"
                  onClick={() => setContasLote([])}
                  className="text-cinza hover:text-neve"
                >
                  Limpar
                </button>
              </div>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {contas.map((c) => (
                <label
                  key={c.id}
                  className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-fio bg-white/[0.02] px-4 py-3 text-sm transition-colors hover:bg-white/[0.05]"
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <input
                      type="checkbox"
                      name="contas_lote"
                      value={c.id}
                      checked={contasLote.includes(c.id)}
                      onChange={() => alternarLote(c.id)}
                      className="h-4 w-4 shrink-0 accent-[#E4155F]"
                    />
                    <span className="truncate text-branco">{c.nome}</span>
                  </span>
                  <span className="shrink-0 font-mono text-[0.68rem] uppercase text-cinza">
                    {c.perfilEfetivo}
                  </span>
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs text-cinza">
              Cada cliente recebe automaticamente os indicadores do próprio nicho e os marcos registrados no Diário de Bordo do período.
            </p>
          </fieldset>

          <label className="flex cursor-pointer items-center gap-3 text-sm text-neve">
            <input type="checkbox" name="publicar_direto" className="h-4 w-4 accent-[#E4155F]" />
            Já nascer publicado (libera os links externos imediatamente)
          </label>

          <Aviso r={estadoLote} />

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={pendenteLote}
              className="rounded-full bg-magenta px-7 py-3 text-sm font-semibold text-branco transition-colors hover:bg-magenta-forte disabled:opacity-60"
            >
              {pendenteLote ? 'Gerando lote...' : `Gerar ${contasLote.length} relatório(s)`}
            </button>
            <button
              type="button"
              onClick={() => setAberto(false)}
              className="rounded-full border border-fio px-6 py-3 text-sm text-neve transition-colors hover:bg-white/5"
            >
              Fechar
            </button>
          </div>
        </form>
      ) : (
        <form action={acaoUm} className="space-y-6">
          {editando ? <input type="hidden" name="id" value={editando.id} /> : null}

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {!editando ? (
              <div className="lg:col-span-2">
                <label htmlFor="r-conta" className={rotulo}>Cliente *</label>
                <select
                  id="r-conta"
                  name="conta_id"
                  required
                  value={contaSel}
                  onChange={(e) => trocarConta(e.target.value)}
                  className={`mt-2 ${campo}`}
                >
                  {contas.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome} ({c.perfilEfetivo})
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div>
              <label htmlFor="r-de" className={rotulo}>De *</label>
              <input
                id="r-de"
                type="date"
                name="periodo_de"
                required
                value={de}
                onChange={(e) => setDe(e.target.value)}
                className={`mt-2 ${campo}`}
              />
            </div>

            <div>
              <label htmlFor="r-ate" className={rotulo}>Até *</label>
              <input
                id="r-ate"
                type="date"
                name="periodo_ate"
                required
                value={ate}
                onChange={(e) => setAte(e.target.value)}
                className={`mt-2 ${campo}`}
              />
            </div>

            <div className="lg:col-span-2">
              <label htmlFor="r-titulo" className={rotulo}>Título do documento</label>
              <input
                id="r-titulo"
                name="titulo"
                defaultValue={editando?.titulo ?? ''}
                placeholder="Automático pelo período se ficar em branco"
                className={`mt-2 ${campo}`}
              />
            </div>

            <div>
              <label htmlFor="r-contato" className={rotulo}>Aos cuidados de</label>
              <input
                id="r-contato"
                name="contato"
                value={contato}
                onChange={(e) => setContato(e.target.value)}
                placeholder="Nome do responsável"
                className={`mt-2 ${campo}`}
              />
            </div>

            <div>
              <label htmlFor="r-perfil" className={rotulo}>Modelo de métricas</label>
              <select
                id="r-perfil"
                name="perfil_metrica"
                value={perfil}
                onChange={(e) => setPerfil(e.target.value as PerfilMetrica)}
                className={`mt-2 ${campo}`}
              >
                {PERFIS_METRICA.map((p) => (
                  <option key={p} value={p}>{rotuloPerfilMetrica[p]}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Seções visíveis */}
          <fieldset>
            <legend className={rotulo}>Seções exibidas no relatório</legend>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {BLOCOS_RELATORIO.filter((b) => b !== 'comercial').map((b) => (
                <label
                  key={b}
                  className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-fio bg-white/[0.02] px-3.5 py-2.5 text-xs text-neve transition-colors hover:bg-white/[0.05]"
                >
                  <input
                    type="checkbox"
                    name={`bloco_${b}`}
                    checked={blocos.includes(b)}
                    onChange={() => alternarBloco(b)}
                    className="h-4 w-4 shrink-0 accent-[#E4155F]"
                  />
                  {rotuloBlocoRelatorio[b]}
                </label>
              ))}
            </div>
          </fieldset>

          {/* Retorno comercial informado pelo cliente (WhatsApp / Local / B2B) */}
          <div className="rounded-2xl border border-fio bg-white/[0.02] p-5 space-y-4">
            <div>
              <p className="font-display text-base font-bold text-branco">
                Fechamento comercial informado pelo cliente <span className="text-xs font-normal text-cinza">(opcional)</span>
              </p>
              <p className="mt-1 text-xs leading-relaxed text-cinza">
                Ideal para chalés, clínicas, concessionárias e B2B: preencha quantas reservas/vendas fecharam no atendimento e o valor gerado para o relatório exibir o ROAS Comercial Real.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="r-rotulo-venda" className={rotulo}>Nome do fechamento</label>
                <input
                  id="r-rotulo-venda"
                  name="rotulo_venda"
                  defaultValue={editando?.resultadoComercial?.rotuloVenda ?? ''}
                  placeholder="Ex.: Reservas fechadas, Contratos"
                  className={`mt-2 ${campo}`}
                />
              </div>
              <div>
                <label htmlFor="r-vendas" className={rotulo}>Quantidade fechada</label>
                <input
                  id="r-vendas"
                  name="vendas_fechadas"
                  inputMode="numeric"
                  defaultValue={editando?.resultadoComercial?.vendasFechadas ?? ''}
                  placeholder="Ex.: 18"
                  className={`mt-2 ${campo}`}
                />
              </div>
              <div>
                <label htmlFor="r-rec-fechada" className={rotulo}>Receita gerada (R$)</label>
                <input
                  id="r-rec-fechada"
                  name="receita_fechada"
                  inputMode="decimal"
                  defaultValue={editando?.resultadoComercial?.receitaFechada ?? ''}
                  placeholder="Ex.: 24.500"
                  className={`mt-2 ${campo}`}
                />
              </div>
            </div>
            <div>
              <label htmlFor="r-obs-com" className={rotulo}>Observação comercial</label>
              <input
                id="r-obs-com"
                name="obs_comercial"
                defaultValue={editando?.resultadoComercial?.observacao ?? ''}
                placeholder="Ex.: Números confirmados pela recepção referente aos feriados de novembro."
                className={`mt-2 ${campo}`}
              />
            </div>
          </div>

          {/* Narrativa da agência */}
          <div className="grid gap-5 lg:grid-cols-3">
            <div>
              <label htmlFor="r-resumo" className={rotulo}>Resumo executivo</label>
              <textarea
                id="r-resumo"
                name="resumo_executivo"
                rows={4}
                defaultValue={editando?.resumoExecutivo ?? ''}
                placeholder="Leitura direta do período: o que funcionou melhor, como o custo se comportou e o destaque principal."
                className={`mt-2 ${campo}`}
              />
            </div>
            <div>
              <label htmlFor="r-acoes" className={rotulo}>O que a Psy Comunic executou (1 por linha)</label>
              <textarea
                id="r-acoes"
                name="acoes_executadas"
                rows={4}
                defaultValue={editando?.acoesExecutadas.join('\n') ?? ''}
                placeholder="Se ficar em branco, puxa automaticamente os marcos do Diário de Bordo do período."
                className={`mt-2 ${campo}`}
              />
            </div>
            <div>
              <label htmlFor="r-passos" className={rotulo}>Próximos passos (1 por linha)</label>
              <textarea
                id="r-passos"
                name="proximos_passos"
                rows={4}
                defaultValue={editando?.proximosPassos.join('\n') ?? ''}
                placeholder="Ex.: Subir criativos novos de Natal&#10;Redirecionar 20% da verba para a campanha campeã"
                className={`mt-2 ${campo}`}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            {!editando ? (
              <label className="flex cursor-pointer items-center gap-3 text-sm text-neve">
                <input
                  type="checkbox"
                  name="publicar_direto"
                  defaultChecked
                  className="h-4 w-4 accent-[#E4155F]"
                />
                Publicar imediatamente (o link já nasce ativo para enviar ao cliente)
              </label>
            ) : (
              <label className="flex cursor-pointer items-center gap-3 text-sm text-neve">
                <input
                  type="checkbox"
                  name="recalcular_snapshot"
                  className="h-4 w-4 accent-[#E4155F]"
                />
                Recalcular números com os dados sincronizados mais recentes
              </label>
            )}
          </div>

          <Aviso r={estadoUm} />

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={pendenteUm}
              className="rounded-full bg-magenta px-7 py-3 text-sm font-semibold text-branco transition-colors hover:bg-magenta-forte disabled:opacity-60"
            >
              {pendenteUm
                ? 'Salvando...'
                : editando
                  ? 'Salvar alterações'
                  : 'Gerar relatório'}
            </button>
            {!editando ? (
              <button
                type="button"
                onClick={() => setAberto(false)}
                className="rounded-full border border-fio px-6 py-3 text-sm text-neve transition-colors hover:bg-white/5"
              >
                Cancelar
              </button>
            ) : (
              <Link
                href="/painel/relatorios"
                className="rounded-full border border-fio px-6 py-3 text-sm text-neve transition-colors hover:bg-white/5"
              >
                Sair da edição
              </Link>
            )}
          </div>
        </form>
      )}
    </section>
  );
}

/* ================================================================== */
/* Ações de compartilhamento e gestão na lista                        */
/* ================================================================== */

export function CopiarLinkRelatorio({ slug, versao }: { slug: string; versao: number }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    const url = `${window.location.origin}/relatorio/${slug}?v=${versao}`;
    await navigator.clipboard.writeText(url);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2200);
  }

  return (
    <button
      type="button"
      onClick={copiar}
      className="rounded-full border border-fio px-3.5 py-1.5 text-xs font-semibold text-neve transition-colors hover:bg-white/[0.06]"
    >
      {copiado ? '● Link copiado' : 'Copiar link'}
    </button>
  );
}

export function EnviarRelatorioWhatsApp({
  cliente,
  contato,
  periodoDe,
  periodoAte,
  slug,
  versao,
  cartoes,
  whatsapp,
  publicado,
}: {
  cliente: string;
  contato: string | null;
  periodoDe: string;
  periodoAte: string;
  slug: string;
  versao: number;
  cartoes: { rotulo: string; valor: string }[];
  whatsapp: string | null;
  publicado: boolean;
}) {
  const [copiado, setCopiado] = useState(false);

  function montarMensagem() {
    const origem = typeof window !== 'undefined' ? window.location.origin : 'https://www.psycomunic.com.br';
    const url = `${origem}/relatorio/${slug}?v=${versao}`;
    const nome = (contato ?? cliente).trim().split(/\s+/)[0];
    const intervalo = `${periodoDe.split('-').reverse().join('/')} a ${periodoAte.split('-').reverse().join('/')}`;
    const destaques = cartoes
      .slice(0, 3)
      .map((c) => `• ${c.rotulo}: ${c.valor}`)
      .join('\n');

    return [
      `Olá, ${nome}! Tudo bem?`,
      ``,
      `A equipe da Psy Comunic fechou o relatório de desempenho da *${cliente}* referente ao período de *${intervalo}*:`,
      destaques ? `\n${destaques}\n` : '',
      `Relatório completo (com gráficos, campanhas e opção de salvar em PDF):`,
      url,
    ]
      .filter((l) => l !== '')
      .join('\n');
  }

  async function disparar() {
    const msg = montarMensagem();
    if (whatsapp) {
      const limpo = whatsapp.replace(/\D/g, '');
      const ddi = limpo.startsWith('55') ? limpo : `55${limpo}`;
      window.open(`https://wa.me/${ddi}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
      return;
    }
    await navigator.clipboard.writeText(msg);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  }

  if (!publicado) return null;

  return (
    <button
      type="button"
      onClick={disparar}
      className="rounded-full border border-[#4ADE80]/40 bg-[#4ADE80]/10 px-3.5 py-1.5 text-xs font-semibold text-[#4ADE80] transition-colors hover:bg-[#4ADE80]/20"
    >
      {copiado ? '● Resumo copiado' : whatsapp ? 'Enviar no WhatsApp →' : 'Copiar resumo p/ WhatsApp'}
    </button>
  );
}

export function EnviarRelatorioEmail({
  id,
  emailSugerido,
  publicado,
}: {
  id: string;
  emailSugerido: string | null;
  publicado: boolean;
}) {
  const [aberto, setAberto] = useState(false);
  const [estado, acao, pendente] = useActionState<Resultado | null, FormData>(
    enviarRelatorioPorEmail,
    null,
  );

  if (!publicado) return null;

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="rounded-full border border-fio px-3.5 py-1.5 text-xs text-neve transition-colors hover:bg-white/[0.06]"
      >
        Enviar por e-mail
      </button>
    );
  }

  return (
    <form action={acao} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <input
        name="email"
        type="email"
        required
        defaultValue={emailSugerido ?? ''}
        placeholder="cliente@empresa.com"
        className="rounded-lg border border-fio bg-white/[0.04] px-3 py-1.5 text-xs text-branco outline-none focus:border-magenta"
      />
      <button
        type="submit"
        disabled={pendente}
        className="rounded-lg bg-magenta px-3.5 py-1.5 text-xs font-semibold text-branco hover:bg-magenta-forte disabled:opacity-60"
      >
        {pendente ? 'Enviando...' : 'Disparar'}
      </button>
      <button
        type="button"
        onClick={() => setAberto(false)}
        className="text-xs text-cinza hover:text-neve"
      >
        Cancelar
      </button>
      {estado ? (
        <span className={`text-xs ${estado.ok ? 'text-[#4ADE80]' : 'text-magenta-texto'}`}>
          {estado.mensagem}
        </span>
      ) : null}
    </form>
  );
}

export function AcoesCardRelatorio({
  id,
  status,
  podeExcluir,
}: {
  id: string;
  status: 'rascunho' | 'publicado' | 'arquivado';
  podeExcluir: boolean;
}) {
  const [estStatus, acaoStatus, pendStatus] = useActionState<Resultado | null, FormData>(
    mudarStatusRelatorio,
    null,
  );
  const [estSync, acaoSync, pendSync] = useActionState<Resultado | null, FormData>(
    atualizarNumerosRelatorio,
    null,
  );
  const [estDel, acaoDel, pendDel] = useActionState<Resultado | null, FormData>(
    apagarRelatorio,
    null,
  );

  const erro = [estStatus, estSync, estDel].find((e) => e && !e.ok);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <form action={acaoStatus} className="inline">
        <input type="hidden" name="id" value={id} />
        <input
          type="hidden"
          name="status"
          value={status === 'publicado' ? 'rascunho' : 'publicado'}
        />
        <button
          type="submit"
          disabled={pendStatus}
          className={
            'rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ' +
            (status === 'publicado'
              ? 'border border-fio text-cinza hover:text-neve'
              : 'bg-magenta text-branco hover:bg-magenta-forte')
          }
        >
          {pendStatus ? '...' : status === 'publicado' ? 'Recolher link' : 'Publicar link'}
        </button>
      </form>

      <form action={acaoSync} className="inline">
        <input type="hidden" name="id" value={id} />
        <button
          type="submit"
          disabled={pendSync}
          className="text-xs text-cinza underline-offset-4 hover:text-neve hover:underline disabled:opacity-50"
        >
          {pendSync ? 'Recalculando...' : 'Atualizar números'}
        </button>
      </form>

      {podeExcluir ? (
        <form action={acaoDel} className="inline">
          <input type="hidden" name="id" value={id} />
          <button
            type="submit"
            disabled={pendDel}
            className="text-xs text-cinza underline-offset-4 hover:text-magenta-texto hover:underline disabled:opacity-50"
          >
            {pendDel ? '...' : 'Excluir'}
          </button>
        </form>
      ) : null}

      {erro ? <span className="text-xs text-magenta-texto">{erro.mensagem}</span> : null}
    </div>
  );
}
