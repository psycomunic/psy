'use client';

import { useActionState, useState } from 'react';
import { definirMeta, type Resultado } from '@/app/painel/acoes';
import {
  salvarFichaCadastral,
  alternarChecklistConta,
  salvarContatoCliente,
  removerContatoCliente,
} from '@/app/painel/acoes-cliente';
import { criarTarefa, concluirTarefa } from '@/app/painel/acoes-tarefa';
import { criarProjeto, moverProjeto } from '@/app/painel/acoes-projeto';
import {
  ESCOPOS_CONTA,
  ITENS_CHECKLIST_ONBOARDING,
  PRIORIDADES,
  RECORRENCIAS,
  SITUACOES_PROJETO,
  TIPOS_PROJETO,
  rotuloPrioridade,
  rotuloRecorrencia,
  rotuloSituacaoConta,
  rotuloSituacaoProjeto,
  rotuloTipoProjeto,
  type ContaFicha,
  type Contato,
  type MetaMesConta,
  type SituacaoProjeto,
} from '@/lib/dados/tipos';
import {
  PERFIS_METRICA,
  rotuloPerfilMetrica,
  type PerfilMetricaEfetivo,
} from '@/lib/dominio/perfis-metrica';

const campo =
  'w-full rounded-xl border border-fio bg-white/[0.03] px-4 py-2.5 text-sm text-branco ' +
  'outline-none transition-colors placeholder:text-cinza/60 focus:border-magenta focus:bg-white/[0.05]';
const rotuloCss = 'block font-mono text-[0.72rem] uppercase tracking-[0.14em] text-cinza';

function Aviso({ r }: { r: Resultado | null }) {
  if (!r) return null;
  return (
    <p
      role="status"
      className={
        'mt-3 flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm leading-relaxed ' +
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

/* ================================================================== */
/* 1. Editor inline das Metas do Mês na Ficha                         */
/* ================================================================== */

export function FormMetaRapidaFicha({
  contaId,
  perfil,
  metaAtual,
}: {
  contaId: string;
  perfil: PerfilMetricaEfetivo;
  metaAtual: MetaMesConta;
}) {
  const [aberto, setAberto] = useState(false);
  const [estado, acao, pendente] = useActionState<Resultado | null, FormData>(definirMeta, null);
  const [ultimo, setUltimo] = useState(estado);

  if (estado !== ultimo) {
    setUltimo(estado);
    if (estado?.ok) setAberto(false);
  }

  const rotuloVolume =
    perfil === 'leads'
      ? 'Meta de leads no mês'
      : perfil === 'vendas_midia'
        ? 'Meta de vendas na mídia'
        : perfil === 'branding'
          ? 'Meta de alcance único'
          : 'Meta de conversas no mês';

  const rotuloTeto =
    perfil === 'leads'
      ? 'Teto de CPL (R$)'
      : perfil === 'ecommerce'
        ? 'Teto de CAC (R$)'
        : perfil === 'vendas_midia'
          ? 'Teto de CPA (R$)'
          : 'Teto de custo por conversa (R$)';

  if (!aberto) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setAberto(true)}
          className="rounded-full border border-fio px-4 py-2 text-xs font-semibold text-magenta-texto transition-colors hover:border-magenta/50 hover:bg-magenta/10"
        >
          {metaAtual.verbaMeta || metaAtual.resultadoMeta || metaAtual.receitaMeta || metaAtual.custoResultadoTeto
            ? 'Ajustar metas deste mês'
            : '+ Definir metas deste mês'}
        </button>
        <Aviso r={estado} />
      </div>
    );
  }

  return (
    <form action={acao} className="mt-4 rounded-2xl border border-fio bg-white/[0.02] p-5">
      <input type="hidden" name="conta_id" value={contaId} />
      <p className="font-display text-base font-bold text-branco">Metas do mês corrente</p>
      <p className="mt-1 text-xs text-cinza">
        Preencha os indicadores que fazem sentido para esta operação. O painel calcula sozinho o ritmo diário necessário.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className={rotuloCss}>Orçamento de mídia (R$)</label>
          <input
            name="verba_meta"
            defaultValue={metaAtual.verbaMeta ?? ''}
            placeholder="Ex.: 1500"
            className={`mt-1.5 ${campo}`}
          />
        </div>
        <div>
          <label className={rotuloCss}>{rotuloVolume}</label>
          <input
            name="resultado_meta"
            defaultValue={metaAtual.resultadoMeta ?? ''}
            placeholder="Ex.: 250"
            className={`mt-1.5 ${campo}`}
          />
        </div>
        <div>
          <label className={rotuloCss}>{rotuloTeto}</label>
          <input
            name="custo_resultado_teto"
            defaultValue={metaAtual.custoResultadoTeto ?? ''}
            placeholder="Ex.: 6,50"
            className={`mt-1.5 ${campo}`}
          />
        </div>
        <div>
          <label className={rotuloCss}>Meta de receita comercial (R$)</label>
          <input
            name="receita_meta"
            defaultValue={metaAtual.receitaMeta && metaAtual.receitaMeta > 0 ? metaAtual.receitaMeta : ''}
            placeholder="Ex.: 25000"
            className={`mt-1.5 ${campo}`}
          />
        </div>
      </div>

      <Aviso r={estado} />

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={pendente}
          className="rounded-full bg-magenta px-6 py-2.5 text-xs font-semibold text-branco transition-colors hover:bg-magenta-forte disabled:opacity-60"
        >
          {pendente ? 'Salvando...' : 'Salvar metas do mês'}
        </button>
        <button
          type="button"
          onClick={() => setAberto(false)}
          className="rounded-full border border-fio px-5 py-2.5 text-xs text-neve transition-colors hover:bg-white/5"
        >
          Fechar
        </button>
      </div>
    </form>
  );
}

/* ================================================================== */
/* 2. Checklist de Onboarding & Setup                                 */
/* ================================================================== */

function ItemChecklist({
  contaId,
  chave,
  rotulo,
  marcado,
  editavel,
}: {
  contaId: string;
  chave: string;
  rotulo: string;
  marcado: boolean;
  editavel: boolean;
}) {
  const [, acao, pendente] = useActionState<Resultado | null, FormData>(
    alternarChecklistConta,
    null,
  );

  if (!editavel) {
    return (
      <li className="flex items-center gap-3 rounded-xl border border-fio bg-white/[0.02] px-4 py-3 text-sm">
        <span style={{ color: marcado ? '#4ADE80' : '#93A0BC' }}>{marcado ? '✓' : '○'}</span>
        <span className={marcado ? 'text-cinza line-through' : 'text-neve'}>{rotulo}</span>
      </li>
    );
  }

  return (
    <li>
      <form action={acao}>
        <input type="hidden" name="conta_id" value={contaId} />
        <input type="hidden" name="chave" value={chave} />
        <input type="hidden" name="marcado" value={marcado ? 'false' : 'true'} />
        <button
          type="submit"
          disabled={pendente}
          className="flex w-full items-center gap-3 rounded-xl border border-fio bg-white/[0.02] px-4 py-3 text-left text-sm transition-colors hover:border-magenta/40 hover:bg-white/[0.04] disabled:opacity-60"
        >
          <span
            aria-hidden
            className={
              'inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs font-bold ' +
              (marcado
                ? 'border-[#4ADE80] bg-[#4ADE80]/20 text-[#4ADE80]'
                : 'border-fio text-transparent')
            }
          >
            ✓
          </span>
          <span className={marcado ? 'text-cinza line-through' : 'text-neve'}>{rotulo}</span>
        </button>
      </form>
    </li>
  );
}

export function ChecklistOnboardingFicha({
  contaId,
  mapa,
  editavel,
}: {
  contaId: string;
  mapa: Record<string, boolean>;
  editavel: boolean;
}) {
  const concluidos = ITENS_CHECKLIST_ONBOARDING.filter((i) => mapa[i.chave]).length;
  const total = ITENS_CHECKLIST_ONBOARDING.length;

  return (
    <div className="cartao p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <p className="font-mono text-[0.72rem] uppercase tracking-[0.14em] text-magenta-texto">
            Setup & Onboarding da conta
          </p>
          <h3 className="mt-1 font-display text-lg font-bold text-branco">
            {concluidos} de {total} etapas concluídas
          </h3>
        </div>
        <span className="tabular font-mono text-xs text-cinza">
          {Math.round((100 * concluidos) / total)}%
        </span>
      </div>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full bg-[#4ADE80] transition-all"
          style={{ width: `${Math.round((100 * concluidos) / total)}%` }}
        />
      </div>

      <ul className="mt-4 grid gap-2.5 md:grid-cols-2">
        {ITENS_CHECKLIST_ONBOARDING.map((item) => (
          <ItemChecklist
            key={item.chave}
            contaId={contaId}
            chave={item.chave}
            rotulo={item.rotulo}
            marcado={Boolean(mapa[item.chave])}
            editavel={editavel}
          />
        ))}
      </ul>
    </div>
  );
}

/* ================================================================== */
/* 3. Controles rápidos de Tarefa e Projeto dentro da Ficha           */
/* ================================================================== */

export function BotaoConcluirTarefaRapido({ id }: { id: string }) {
  const [, acao, pendente] = useActionState<Resultado | null, FormData>(concluirTarefa, null);

  return (
    <form action={acao} className="inline">
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pendente}
        className="inline-flex min-h-[28px] items-center gap-1.5 rounded-full border border-[#4ADE80]/40 bg-[#4ADE80]/10 px-3.5 py-1 text-xs font-semibold text-[#4ADE80] transition-colors hover:bg-[#4ADE80]/20 disabled:opacity-50"
      >
        <span aria-hidden>✓</span>
        {pendente ? 'Concluindo...' : 'Concluir'}
      </button>
    </form>
  );
}

export function FormTarefaRapidaFicha({
  contaId,
  equipe,
  hoje,
}: {
  contaId: string;
  equipe: { id: string; nome: string }[];
  hoje: string;
}) {
  const [aberto, setAberto] = useState(false);
  const [estado, acao, pendente] = useActionState<Resultado | null, FormData>(criarTarefa, null);
  const [ultimo, setUltimo] = useState(estado);

  if (estado !== ultimo) {
    setUltimo(estado);
    if (estado?.ok) setAberto(false);
  }

  if (!aberto) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setAberto(true)}
          className="inline-flex items-center gap-2 rounded-full bg-magenta px-5 py-2.5 text-xs font-semibold text-branco transition-colors hover:bg-magenta-forte"
        >
          <span aria-hidden>+</span> Nova tarefa para este cliente
        </button>
        <Aviso r={estado} />
      </div>
    );
  }

  return (
    <form action={acao} className="space-y-4 rounded-2xl border border-fio bg-white/[0.02] p-5">
      <input type="hidden" name="conta_id" value={contaId} />
      <input type="hidden" name="lembrar_dias" value="1" />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className={rotuloCss}>O que precisa ser feito *</label>
          <input
            name="titulo"
            required
            placeholder="Ex.: Testar 3 novos ganchos de Reels para fim de semana"
            className={`mt-1.5 ${campo}`}
          />
        </div>
        <div>
          <label className={rotuloCss}>Prazo</label>
          <input name="prazo" type="date" defaultValue={hoje} className={`mt-1.5 ${campo}`} />
        </div>
        <div>
          <label className={rotuloCss}>Prioridade</label>
          <select name="prioridade" defaultValue="media" className={`mt-1.5 ${campo}`}>
            {PRIORIDADES.map((p) => (
              <option key={p} value={p}>{rotuloPrioridade[p]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={rotuloCss}>Responsável</label>
          <select name="responsavel_id" defaultValue="" className={`mt-1.5 ${campo}`}>
            <option value="">Equipe / Admin</option>
            {equipe.map((e) => (
              <option key={e.id} value={e.id}>{e.nome}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={rotuloCss}>Recorrência</label>
          <select name="recorrencia" defaultValue="nenhuma" className={`mt-1.5 ${campo}`}>
            {RECORRENCIAS.map((r) => (
              <option key={r} value={r}>{rotuloRecorrencia[r]}</option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className={rotuloCss}>Detalhes / instruções</label>
          <textarea
            name="detalhe"
            rows={2}
            placeholder="Contexto ou link de referência"
            className={`mt-1.5 ${campo}`}
          />
        </div>
      </div>

      <Aviso r={estado} />

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={pendente}
          className="rounded-full bg-magenta px-6 py-2.5 text-xs font-semibold text-branco transition-colors hover:bg-magenta-forte disabled:opacity-60"
        >
          {pendente ? 'Criando...' : 'Criar tarefa'}
        </button>
        <button
          type="button"
          onClick={() => setAberto(false)}
          className="rounded-full border border-fio px-5 py-2.5 text-xs text-neve transition-colors hover:bg-white/5"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

export function SeletorSituacaoProjetoRapido({
  id,
  situacaoAtual,
}: {
  id: string;
  situacaoAtual: SituacaoProjeto;
}) {
  const [, acao, pendente] = useActionState<Resultado | null, FormData>(moverProjeto, null);

  return (
    <form action={acao} className="inline-flex items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <select
        name="situacao"
        defaultValue={situacaoAtual}
        disabled={pendente}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        aria-label="Mudar situação do projeto"
        className="rounded-full border border-fio bg-marinho-cartao px-3.5 py-1.5 text-xs font-semibold text-neve outline-none transition-colors focus:border-magenta disabled:opacity-50"
      >
        {SITUACOES_PROJETO.map((s) => (
          <option key={s} value={s}>{rotuloSituacaoProjeto[s]}</option>
        ))}
      </select>
    </form>
  );
}

export function FormProjetoRapidoFicha({
  contaId,
  equipe,
}: {
  contaId: string;
  equipe: { id: string; nome: string }[];
}) {
  const [aberto, setAberto] = useState(false);
  const [estado, acao, pendente] = useActionState<Resultado | null, FormData>(criarProjeto, null);
  const [ultimo, setUltimo] = useState(estado);

  if (estado !== ultimo) {
    setUltimo(estado);
    if (estado?.ok) setAberto(false);
  }

  if (!aberto) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setAberto(true)}
          className="inline-flex items-center gap-2 rounded-full border border-fio px-5 py-2.5 text-xs font-semibold text-neve transition-colors hover:bg-white/5"
        >
          <span aria-hidden>+</span> Nova entrega / projeto
        </button>
        <Aviso r={estado} />
      </div>
    );
  }

  return (
    <form action={acao} className="space-y-4 rounded-2xl border border-fio bg-white/[0.02] p-5">
      <input type="hidden" name="conta_id" value={contaId} />

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className={rotuloCss}>Nome da entrega / projeto *</label>
          <input
            name="nome"
            required
            placeholder="Ex.: Nova Landing Page de Temporada"
            className={`mt-1.5 ${campo}`}
          />
        </div>
        <div>
          <label className={rotuloCss}>Tipo</label>
          <select name="tipo" defaultValue="lp" className={`mt-1.5 ${campo}`}>
            {TIPOS_PROJETO.map((t) => (
              <option key={t} value={t}>{rotuloTipoProjeto[t]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={rotuloCss}>Etapa inicial</label>
          <select name="situacao" defaultValue="andamento" className={`mt-1.5 ${campo}`}>
            {SITUACOES_PROJETO.map((s) => (
              <option key={s} value={s}>{rotuloSituacaoProjeto[s]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={rotuloCss}>Prazo combinado</label>
          <input name="prazo" type="date" className={`mt-1.5 ${campo}`} />
        </div>
        <div>
          <label className={rotuloCss}>Responsável</label>
          <select name="responsavel_id" defaultValue="" className={`mt-1.5 ${campo}`}>
            <option value="">Sem responsável fixo</option>
            {equipe.map((e) => (
              <option key={e.id} value={e.id}>{e.nome}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={rotuloCss}>Link (Figma, preview, Drive)</label>
          <input name="link" type="url" placeholder="https://..." className={`mt-1.5 ${campo}`} />
        </div>
        <div className="md:col-span-2">
          <label className={rotuloCss}>Observações</label>
          <textarea name="observacoes" rows={2} className={`mt-1.5 ${campo}`} />
        </div>
      </div>

      <Aviso r={estado} />

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={pendente}
          className="rounded-full bg-magenta px-6 py-2.5 text-xs font-semibold text-branco transition-colors hover:bg-magenta-forte disabled:opacity-60"
        >
          {pendente ? 'Criando...' : 'Registrar projeto'}
        </button>
        <button
          type="button"
          onClick={() => setAberto(false)}
          className="rounded-full border border-fio px-5 py-2.5 text-xs text-neve transition-colors hover:bg-white/5"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

/* ================================================================== */
/* 4. Ficha Cadastral, Escopo, Links e Briefing Estratégico           */
/* ================================================================== */

export function FormFichaCadastralEBriefing({
  conta,
  equipe,
}: {
  conta: ContaFicha;
  equipe: { id: string; nome: string }[];
}) {
  const [estado, acao, pendente] = useActionState<Resultado | null, FormData>(
    salvarFichaCadastral,
    null,
  );
  const escopoSet = new Set(conta.escopo);

  return (
    <form action={acao} className="cartao space-y-6 p-6">
      <input type="hidden" name="conta_id" value={conta.id} />

      <div>
        <p className="font-mono text-[0.72rem] uppercase tracking-[0.14em] text-magenta-texto">
          Editar dossiê do cliente
        </p>
        <h3 className="mt-1 font-display text-lg font-bold text-branco">
          Cadastro, escopo contratado e briefing estratégico
        </h3>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className={rotuloCss}>Nome do cliente *</label>
          <input name="nome" required defaultValue={conta.nome} className={`mt-1.5 ${campo}`} />
        </div>
        <div>
          <label className={rotuloCss}>Situação da conta</label>
          <select name="situacao" defaultValue={conta.situacao} className={`mt-1.5 ${campo}`}>
            {(Object.keys(rotuloSituacaoConta) as ContaFicha['situacao'][]).map((s) => (
              <option key={s} value={s}>{rotuloSituacaoConta[s]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={rotuloCss}>Responsável interno</label>
          <select
            name="responsavel_id"
            defaultValue={conta.responsavelId ?? ''}
            className={`mt-1.5 ${campo}`}
          >
            <option value="">Definir responsável</option>
            {equipe.map((e) => (
              <option key={e.id} value={e.id}>{e.nome}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={rotuloCss}>Tipo de operação</label>
          <select name="tipo" defaultValue={conta.tipo} className={`mt-1.5 ${campo}`}>
            <option value="trafego">Tráfego / Negócio local / WhatsApp</option>
            <option value="ecommerce">Loja online (E-commerce)</option>
            <option value="outro">Outro</option>
          </select>
        </div>
        <div>
          <label className={rotuloCss}>Modelo de leitura (KPIs)</label>
          <select
            name="perfil_metrica"
            defaultValue={conta.perfilMetrica}
            className={`mt-1.5 ${campo}`}
          >
            {PERFIS_METRICA.map((p) => (
              <option key={p} value={p}>{rotuloPerfilMetrica[p]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={rotuloCss}>Segmento / Nicho</label>
          <input
            name="segmento"
            defaultValue={conta.segmento ?? ''}
            placeholder="Ex.: Chalés e pousadas"
            className={`mt-1.5 ${campo}`}
          />
        </div>

        <div>
          <label className={rotuloCss}>Razão social</label>
          <input
            name="razao_social"
            defaultValue={conta.razaoSocial ?? ''}
            className={`mt-1.5 ${campo}`}
          />
        </div>
        <div>
          <label className={rotuloCss}>CNPJ ou CPF</label>
          <input
            name="documento"
            defaultValue={conta.documento ?? ''}
            placeholder="00.000.000/0001-00"
            className={`mt-1.5 ${campo}`}
          />
        </div>
        <div>
          <label className={rotuloCss}>Cliente desde</label>
          <input
            name="data_inicio"
            type="date"
            defaultValue={conta.dataInicio ?? ''}
            className={`mt-1.5 ${campo}`}
          />
        </div>

        <div>
          <label className={rotuloCss}>Instagram</label>
          <input
            name="instagram"
            defaultValue={conta.instagram ?? ''}
            placeholder="@perfil"
            className={`mt-1.5 ${campo}`}
          />
        </div>
        <div>
          <label className={rotuloCss}>Site oficial / LP</label>
          <input
            name="site"
            defaultValue={conta.site ?? ''}
            placeholder="https://..."
            className={`mt-1.5 ${campo}`}
          />
        </div>
        <div>
          <label className={rotuloCss}>Plataforma / Sistema</label>
          <input
            name="plataforma"
            defaultValue={conta.plataforma ?? ''}
            placeholder="Hospedi, Shopify, Nuvemshop..."
            className={`mt-1.5 ${campo}`}
          />
        </div>
      </div>

      {/* Escopo contratado */}
      <div className="border-t border-fio pt-5">
        <label className={rotuloCss}>Escopo contratado pela conta</label>
        <div className="mt-3 flex flex-wrap gap-2.5">
          {ESCOPOS_CONTA.map((item) => (
            <label
              key={item}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-fio bg-white/[0.02] px-4 py-2 text-xs text-neve transition-colors hover:border-magenta/40"
            >
              <input
                type="checkbox"
                name="escopo"
                value={item}
                defaultChecked={escopoSet.has(item)}
                className="accent-magenta"
              />
              {item}
            </label>
          ))}
        </div>
      </div>

      {/* Links operacionais */}
      <div className="grid gap-4 border-t border-fio pt-5 md:grid-cols-2">
        <div>
          <label className={rotuloCss}>Pasta de Criativos / Google Drive</label>
          <input
            name="link_drive"
            defaultValue={conta.linksUteis.drive ?? ''}
            placeholder="https://drive.google.com/..."
            className={`mt-1.5 ${campo}`}
          />
        </div>
        <div>
          <label className={rotuloCss}>Painel Comercial / Hospedi / CRM</label>
          <input
            name="link_comercial"
            defaultValue={conta.linksUteis.comercial ?? ''}
            placeholder="https://hospedi.app/..."
            className={`mt-1.5 ${campo}`}
          />
        </div>
        <div>
          <label className={rotuloCss}>Link direto Gerenciador / BM</label>
          <input
            name="link_gerenciador"
            defaultValue={conta.linksUteis.gerenciador ?? ''}
            placeholder="https://adsmanager.facebook.com/..."
            className={`mt-1.5 ${campo}`}
          />
        </div>
        <div>
          <label className={rotuloCss}>Outro link importante (Figma, Cardápio, Mapa)</label>
          <input
            name="link_extra"
            defaultValue={conta.linksUteis.extra ?? ''}
            placeholder="https://..."
            className={`mt-1.5 ${campo}`}
          />
        </div>
      </div>

      {/* Briefing estratégico */}
      <div className="grid gap-4 border-t border-fio pt-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className={rotuloCss}>Objetivo principal combinado com o cliente</label>
          <input
            name="objetivo_principal"
            defaultValue={conta.objetivoPrincipal ?? ''}
            placeholder="Ex.: Manter ocupação acima de 80% nos finais de semana com reservas diretas no WhatsApp"
            className={`mt-1.5 ${campo}`}
          />
        </div>
        <div>
          <label className={rotuloCss}>Público-alvo e praças</label>
          <textarea
            name="publico_alvo"
            rows={3}
            defaultValue={conta.publicoAlvo ?? ''}
            placeholder="Quem compra, faixa de renda, cidades/raio de atuação..."
            className={`mt-1.5 ${campo}`}
          />
        </div>
        <div>
          <label className={rotuloCss}>Oferta principal / Produto carro-chefe</label>
          <textarea
            name="oferta_principal"
            rows={3}
            defaultValue={conta.ofertaPrincipal ?? ''}
            placeholder="Pacotes, preços médios, condições, ganchos que mais convertem..."
            className={`mt-1.5 ${campo}`}
          />
        </div>
        <div>
          <label className={rotuloCss}>Diferenciais e argumentos de venda</label>
          <textarea
            name="diferenciais"
            rows={3}
            defaultValue={conta.diferenciais ?? ''}
            placeholder="O que destaca este cliente da concorrência..."
            className={`mt-1.5 ${campo}`}
          />
        </div>
        <div>
          <label className={rotuloCss}>Observações fixas e restrições</label>
          <textarea
            name="observacoes"
            rows={3}
            defaultValue={conta.observacoes ?? ''}
            placeholder="Regras de atendimento, horários, sazonalidade, avisos importantes..."
            className={`mt-1.5 ${campo}`}
          />
        </div>
      </div>

      <Aviso r={estado} />

      <button
        type="submit"
        disabled={pendente}
        className="rounded-full bg-magenta px-7 py-3 text-sm font-semibold text-branco transition-colors hover:bg-magenta-forte disabled:opacity-60"
      >
        {pendente ? 'Salvando ficha...' : 'Salvar ficha completa'}
      </button>
    </form>
  );
}

/* ================================================================== */
/* 5. Contatos do Cliente (com 1-clique para WhatsApp)                */
/* ================================================================== */

function BotaoRemoverContato({ id }: { id: string }) {
  const [, acao, pendente] = useActionState<Resultado | null, FormData>(
    removerContatoCliente,
    null,
  );
  return (
    <form action={acao} className="inline">
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pendente}
        className="text-xs text-cinza underline-offset-4 hover:text-magenta-texto hover:underline disabled:opacity-50"
      >
        {pendente ? 'Removendo...' : 'Remover'}
      </button>
    </form>
  );
}

export function GestaoContatosFicha({
  contaId,
  contatos,
  podeEditar,
}: {
  contaId: string;
  contatos: Contato[];
  podeEditar: boolean;
}) {
  const [aberto, setAberto] = useState(false);
  const [estado, acao, pendente] = useActionState<Resultado | null, FormData>(
    salvarContatoCliente,
    null,
  );
  const [ultimo, setUltimo] = useState(estado);

  if (estado !== ultimo) {
    setUltimo(estado);
    if (estado?.ok) setAberto(false);
  }

  return (
    <div className="space-y-4">
      {contatos.length === 0 ? (
        <p className="cartao p-5 text-sm text-cinza">
          Nenhum contato cadastrado ainda. Adicione o decisor/financeiro para habilitar os atalhos diretos de WhatsApp e envio de relatórios.
        </p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {contatos.map((c) => {
            const fone = (c.whatsapp || c.telefone || '').replace(/\D/g, '');
            const zapHref = fone
              ? `https://wa.me/${fone.length <= 11 ? `55${fone}` : fone}`
              : null;

            return (
              <li key={c.id} className="cartao flex flex-col justify-between gap-4 p-5">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-branco">{c.nome}</p>
                    {c.principal ? (
                      <span className="rounded-full border border-magenta/40 bg-magenta/15 px-2.5 py-0.5 font-mono text-[0.65rem] uppercase tracking-[0.12em] text-magenta-texto">
                        Principal
                      </span>
                    ) : null}
                  </div>
                  {c.cargo ? <p className="mt-0.5 text-xs text-cinza">{c.cargo}</p> : null}

                  <dl className="mt-3 space-y-1 text-xs text-neve">
                    {c.whatsapp || c.telefone ? (
                      <div>WhatsApp/Tel: {c.whatsapp ?? c.telefone}</div>
                    ) : null}
                    {c.email ? <div className="break-all">E-mail: {c.email}</div> : null}
                  </dl>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-fio pt-3">
                  {zapHref ? (
                    <a
                      href={zapHref}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#4ADE80]/40 bg-[#4ADE80]/10 px-3.5 py-1.5 text-xs font-semibold text-[#4ADE80] transition-colors hover:bg-[#4ADE80]/20"
                    >
                      Chamar no WhatsApp →
                    </a>
                  ) : (
                    <span className="text-xs text-cinza">Sem WhatsApp</span>
                  )}
                  {podeEditar ? <BotaoRemoverContato id={c.id} /> : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {podeEditar ? (
        aberto ? (
          <form action={acao} className="space-y-4 rounded-2xl border border-fio bg-white/[0.02] p-5">
            <input type="hidden" name="conta_id" value={contaId} />
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className={rotuloCss}>Nome *</label>
                <input name="nome" required placeholder="Nome do responsável" className={`mt-1.5 ${campo}`} />
              </div>
              <div>
                <label className={rotuloCss}>Cargo / Papel</label>
                <input name="cargo" placeholder="Sócio, Comercial, Financeiro..." className={`mt-1.5 ${campo}`} />
              </div>
              <div>
                <label className={rotuloCss}>WhatsApp (com DDD)</label>
                <input name="whatsapp" placeholder="(47) 99999-9999" className={`mt-1.5 ${campo}`} />
              </div>
              <div>
                <label className={rotuloCss}>E-mail</label>
                <input name="email" type="email" placeholder="contato@cliente.com.br" className={`mt-1.5 ${campo}`} />
              </div>
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-neve">
              <input type="checkbox" name="principal" defaultChecked={contatos.length === 0} className="accent-magenta" />
              Definir como contato principal desta conta
            </label>
            <Aviso r={estado} />
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={pendente}
                className="rounded-full bg-magenta px-6 py-2.5 text-xs font-semibold text-branco transition-colors hover:bg-magenta-forte disabled:opacity-60"
              >
                {pendente ? 'Salvando...' : 'Adicionar contato'}
              </button>
              <button
                type="button"
                onClick={() => setAberto(false)}
                className="rounded-full border border-fio px-5 py-2.5 text-xs text-neve transition-colors hover:bg-white/5"
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setAberto(true)}
            className="rounded-full border border-fio px-5 py-2.5 text-xs font-semibold text-neve transition-colors hover:bg-white/5"
          >
            + Adicionar pessoa de contato
          </button>
        )
      ) : null}
    </div>
  );
}
