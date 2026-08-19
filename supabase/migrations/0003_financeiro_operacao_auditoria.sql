-- =====================================================================
-- 0003 - Financeiro, operacao, metricas do cliente e auditoria.
--
-- Depende de 0001 e 0002.
-- =====================================================================

create type tipo_lancamento   as enum ('receita', 'despesa');
create type status_lancamento as enum ('previsto', 'pago', 'atrasado', 'cancelado');
create type status_fatura     as enum ('aberta', 'enviada', 'paga', 'vencida', 'cancelada');
create type status_tarefa     as enum ('aberta', 'fazendo', 'concluida', 'cancelada');

-- ---------------------------------------------------------------------
-- contrato
-- ---------------------------------------------------------------------
create table contrato (
  id            uuid primary key default gen_random_uuid(),
  conta_id      uuid not null references conta(id) on delete restrict,
  plano         text not null,
  fee_mensal    numeric(12,2) not null,
  inicio        date not null,
  fim           date,
  reajuste      text,
  observacoes   text,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index contrato_conta_idx on contrato(conta_id);

-- ---------------------------------------------------------------------
-- lancamento
-- ---------------------------------------------------------------------
create table lancamento (
  id            uuid primary key default gen_random_uuid(),
  conta_id      uuid references conta(id) on delete set null,
  contrato_id   uuid references contrato(id) on delete set null,
  tipo          tipo_lancamento not null,
  status        status_lancamento not null default 'previsto',
  descricao     text not null,
  valor         numeric(12,2) not null,
  vencimento    date not null,
  pago_em       date,
  categoria     text,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index lancamento_vencimento_idx on lancamento(vencimento);
create index lancamento_conta_idx      on lancamento(conta_id);

-- ---------------------------------------------------------------------
-- fatura
-- ---------------------------------------------------------------------
create table fatura (
  id            uuid primary key default gen_random_uuid(),
  conta_id      uuid not null references conta(id) on delete restrict,
  numero        text not null unique,
  status        status_fatura not null default 'aberta',
  valor         numeric(12,2) not null,
  competencia   date not null,
  vencimento    date not null,
  paga_em       date,
  link_boleto   text,
  criada_em     timestamptz not null default now(),
  atualizada_em timestamptz not null default now()
);

create index fatura_conta_idx on fatura(conta_id);

-- ---------------------------------------------------------------------
-- tarefa
-- ---------------------------------------------------------------------
create table tarefa (
  id             uuid primary key default gen_random_uuid(),
  conta_id       uuid references conta(id) on delete cascade,
  titulo         text not null,
  detalhe        text,
  status         status_tarefa not null default 'aberta',
  responsavel_id uuid references perfil(id) on delete set null,
  prazo          date,
  concluida_em   timestamptz,
  criada_em      timestamptz not null default now(),
  atualizada_em  timestamptz not null default now()
);

create index tarefa_responsavel_idx on tarefa(responsavel_id, status);

-- ---------------------------------------------------------------------
-- metrica_diaria: o que o lojista ve no portal dele.
--
-- Uma linha por conta, por dia, por canal. A chave unica evita que uma
-- reimportacao duplique o dia: sincronizacao de API repete, e sem isto
-- o faturamento do cliente dobraria na tela.
-- ---------------------------------------------------------------------
create table metrica_diaria (
  id            uuid primary key default gen_random_uuid(),
  conta_id      uuid not null references conta(id) on delete cascade,
  dia           date not null,
  canal         text not null,             -- google, meta, organico, direto, loja
  sessoes       integer      not null default 0,
  pedidos       integer      not null default 0,
  receita       numeric(14,2) not null default 0,
  investimento  numeric(14,2) not null default 0,
  cliques       integer      not null default 0,
  impressoes    integer      not null default 0,
  sincronizada_em timestamptz not null default now(),

  constraint metrica_unica_por_dia_e_canal unique (conta_id, dia, canal)
);

create index metrica_conta_dia_idx on metrica_diaria(conta_id, dia desc);

-- ---------------------------------------------------------------------
-- integracao
--
-- Guarda credencial de terceiro. Nao ha politica de leitura para
-- ninguem, nem para admin: token de anuncio de cliente nao precisa
-- trafegar ate um navegador em nenhuma hipotese. Quem le e a rotina de
-- sincronizacao, no servidor, com a service role.
-- ---------------------------------------------------------------------
create table integracao (
  id            uuid primary key default gen_random_uuid(),
  conta_id      uuid not null references conta(id) on delete cascade,
  provedor      text not null,             -- google_ads, meta_ads, ga4, loja
  identificador text,                      -- id da conta de anuncio
  segredo       text,                      -- cifrado. Ver comentario abaixo.
  ativa         boolean not null default true,
  ultima_sync   timestamptz,
  criada_em     timestamptz not null default now(),

  constraint integracao_unica unique (conta_id, provedor)
);

comment on column integracao.segredo is
  'Cifrado antes de gravar. Nunca gravar token em texto puro: um dump de banco viraria acesso as contas de anuncio dos clientes.';

-- ---------------------------------------------------------------------
-- log_auditoria
--
-- Financeiro sem trilha de auditoria e problema na primeira divergencia
-- de cobranca: ninguem consegue provar quem alterou o valor.
-- ---------------------------------------------------------------------
create table log_auditoria (
  id         bigserial primary key,
  autor_id   uuid references perfil(id) on delete set null,
  autor_papel papel_usuario,
  acao       text not null,                -- criou, alterou, excluiu, acessou
  tabela     text not null,
  registro_id text,
  antes      jsonb,
  depois     jsonb,
  em         timestamptz not null default now()
);

create index log_tabela_idx on log_auditoria(tabela, em desc);
create index log_autor_idx  on log_auditoria(autor_id, em desc);

-- =====================================================================
-- RLS
-- =====================================================================

alter table contrato       enable row level security;
alter table contrato       force  row level security;
alter table lancamento     enable row level security;
alter table lancamento     force  row level security;
alter table fatura         enable row level security;
alter table fatura         force  row level security;
alter table tarefa         enable row level security;
alter table tarefa         force  row level security;
alter table metrica_diaria enable row level security;
alter table metrica_diaria force  row level security;
alter table integracao     enable row level security;
alter table integracao     force  row level security;
alter table log_auditoria  enable row level security;
alter table log_auditoria  force  row level security;

-- financeiro: só admin ---------------------------------------------
-- Vendedor e CS não veem margem nem inadimplente. Menos acesso é menos
-- superfície de vazamento, e nenhum dos dois precisa disso para
-- trabalhar. A única exceção é a fatura, que o próprio cliente precisa
-- conseguir ver para pagar.

create policy contrato_admin on contrato for all
  to authenticated using (public.e_admin()) with check (public.e_admin());

create policy lancamento_admin on lancamento for all
  to authenticated using (public.e_admin()) with check (public.e_admin());

create policy fatura_admin on fatura for all
  to authenticated using (public.e_admin()) with check (public.e_admin());

create policy fatura_cliente_le on fatura for select
  to authenticated
  using (public.papel_atual() = 'cliente' and conta_id = public.conta_atual());

-- tarefa: operação interna -----------------------------------------
create policy tarefa_interno_le on tarefa for select
  to authenticated using (public.e_interno());

create policy tarefa_interno_cria on tarefa for insert
  to authenticated with check (public.e_interno());

create policy tarefa_interno_altera on tarefa for update
  to authenticated using (public.e_interno()) with check (public.e_interno());

create policy tarefa_admin_exclui on tarefa for delete
  to authenticated using (public.e_admin());

-- metricas ----------------------------------------------------------
-- ESTA É A POLÍTICA MAIS IMPORTANTE DO BANCO. É ela que impede um
-- lojista de ler o faturamento de outro. pode_ver_conta devolve true
-- para o time da agência e, para cliente, apenas quando a conta é a
-- dele.
create policy metrica_leitura on metrica_diaria for select
  to authenticated using (public.pode_ver_conta(conta_id));

-- Ninguém escreve métrica pela API pública: quem grava é a rotina de
-- sincronização, no servidor, com a service role, que passa por cima de
-- RLS por definição. Sem política de escrita aqui, de propósito.

-- integracao: nenhuma politica ---------------------------------------
-- RLS ligado sem política nenhuma significa: nenhuma linha para
-- ninguém, via chave pública. Só a service role enxerga.

-- auditoria ----------------------------------------------------------
create policy log_admin_le on log_auditoria for select
  to authenticated using (public.e_admin());

-- Log não se altera nem se apaga. Se desse para editar, não seria log.

create trigger contrato_toca   before update on contrato
  for each row execute function public.tocar_atualizado_em();
create trigger lancamento_toca before update on lancamento
  for each row execute function public.tocar_atualizado_em();
create trigger fatura_toca     before update on fatura
  for each row execute function public.tocar_atualizada_em();
create trigger tarefa_toca     before update on tarefa
  for each row execute function public.tocar_atualizada_em();

-- =====================================================================
-- Trigger de auditoria para o que envolve dinheiro
-- =====================================================================
create or replace function public.registrar_auditoria()
returns trigger
language plpgsql
security definer
set search_path = ''
as $fn$
begin
  insert into public.log_auditoria (autor_id, autor_papel, acao, tabela, registro_id, antes, depois)
  values (
    auth.uid(),
    public.papel_atual(),
    lower(tg_op),
    tg_table_name,
    coalesce(new.id, old.id)::text,
    case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) end
  );
  return coalesce(new, old);
end;
$fn$;

create trigger contrato_auditoria after insert or update or delete on contrato
  for each row execute function public.registrar_auditoria();
create trigger lancamento_auditoria after insert or update or delete on lancamento
  for each row execute function public.registrar_auditoria();
create trigger fatura_auditoria after insert or update or delete on fatura
  for each row execute function public.registrar_auditoria();
create trigger proposta_auditoria after insert or update or delete on proposta
  for each row execute function public.registrar_auditoria();
create trigger perfil_auditoria after insert or update or delete on perfil
  for each row execute function public.registrar_auditoria();
