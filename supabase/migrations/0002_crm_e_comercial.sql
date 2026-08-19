-- =====================================================================
-- 0002 - CRM e comercial: lead, interacao, proposta.
--
-- Depende das funcoes criadas em 0001.
-- =====================================================================

create type estagio_lead as enum (
  'novo', 'contato', 'diagnostico', 'proposta', 'negociacao', 'ganho', 'perdido'
);

create type status_proposta as enum (
  'rascunho', 'enviada', 'em_analise', 'aceita', 'recusada', 'vencida'
);

-- ---------------------------------------------------------------------
-- lead
-- ---------------------------------------------------------------------
create table lead (
  id             uuid primary key default gen_random_uuid(),
  nome           text not null,
  empresa        text,
  email          text,
  telefone       text,
  origem         text,                    -- google, meta, indicacao, organico
  estagio        estagio_lead not null default 'novo',
  valor_estimado numeric(12,2),
  responsavel_id uuid references perfil(id) on delete set null,
  conta_id       uuid references conta(id) on delete set null,  -- preenchido ao virar cliente
  observacoes    text,
  perdido_por    text,
  criado_em      timestamptz not null default now(),
  atualizado_em  timestamptz not null default now()
);

create index lead_estagio_idx      on lead(estagio);
create index lead_responsavel_idx  on lead(responsavel_id);

-- ---------------------------------------------------------------------
-- interacao: o historico do lead. Sem isto o CRM vira lista de nomes.
-- ---------------------------------------------------------------------
create table interacao (
  id        uuid primary key default gen_random_uuid(),
  lead_id   uuid not null references lead(id) on delete cascade,
  autor_id  uuid references perfil(id) on delete set null,
  canal     text not null,                -- whatsapp, ligacao, email, reuniao
  resumo    text not null,
  criada_em timestamptz not null default now()
);

create index interacao_lead_idx on interacao(lead_id, criada_em desc);

-- ---------------------------------------------------------------------
-- proposta
--
-- O slug é a chave do link enviado ao cliente. unique + índice porque a
-- busca por slug acontece em toda abertura da página.
-- ---------------------------------------------------------------------
create table proposta (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  lead_id       uuid references lead(id) on delete set null,
  conta_id      uuid references conta(id) on delete set null,
  cliente       text not null,
  contato       text not null,
  status        status_proposta not null default 'rascunho',
  versao        integer not null default 1,
  resumo        text not null,
  -- Diagnóstico, escopo, investimento, condições e próximos passos são
  -- listas de tamanho variável que só esta proposta usa. Em jsonb elas
  -- ficam junto do documento; em tabelas separadas seriam cinco joins
  -- para montar uma página que é sempre lida inteira.
  corpo         jsonb not null default '{}'::jsonb,
  valor_total   numeric(12,2),
  emitida_em    date not null default current_date,
  validade_dias integer not null default 15,
  aceita_em     timestamptz,
  criada_por    uuid references perfil(id) on delete set null,
  criada_em     timestamptz not null default now(),
  atualizada_em timestamptz not null default now()
);

create index proposta_status_idx on proposta(status);
create index proposta_conta_idx  on proposta(conta_id);

-- =====================================================================
-- RLS
--
-- CRM é dado da agência, não do cliente. Nenhum lojista tem motivo para
-- ver o funil, então aqui não existe política de cliente: quem não é
-- interno simplesmente não recebe linha nenhuma.
-- =====================================================================

alter table lead      enable row level security;
alter table lead      force  row level security;
alter table interacao enable row level security;
alter table interacao force  row level security;
alter table proposta  enable row level security;
alter table proposta  force  row level security;

-- lead ----------------------------------------------------------------
create policy lead_interno_le on lead for select
  to authenticated using (public.e_interno());

create policy lead_interno_cria on lead for insert
  to authenticated with check (public.e_interno());

create policy lead_interno_altera on lead for update
  to authenticated using (public.e_interno()) with check (public.e_interno());

create policy lead_admin_exclui on lead for delete
  to authenticated using (public.e_admin());

-- interacao -----------------------------------------------------------
create policy interacao_interno_le on interacao for select
  to authenticated using (public.e_interno());

create policy interacao_interno_cria on interacao for insert
  to authenticated with check (public.e_interno());

-- Histórico não se reescreve. Se a conversa foi registrada errada,
-- registra-se outra corrigindo; apagar rastro de negociação é
-- exatamente o que não se quer poder fazer.
create policy interacao_admin_exclui on interacao for delete
  to authenticated using (public.e_admin());

-- proposta ------------------------------------------------------------
create policy proposta_interno_le on proposta for select
  to authenticated using (public.e_interno());

-- Vendedor e admin criam e editam. O CS lê e não escreve, para não
-- haver dúvida sobre quem mexeu em condição comercial depois de
-- assinada.
create policy proposta_comercial_cria on proposta for insert
  to authenticated
  with check (public.papel_atual() in ('admin','vendedor'));

create policy proposta_comercial_altera on proposta for update
  to authenticated
  using (public.papel_atual() in ('admin','vendedor'))
  with check (public.papel_atual() in ('admin','vendedor'));

create policy proposta_admin_exclui on proposta for delete
  to authenticated using (public.e_admin());

create trigger lead_toca before update on lead
  for each row execute function public.tocar_atualizado_em();

create trigger proposta_toca before update on proposta
  for each row execute function public.tocar_atualizada_em();

-- =====================================================================
-- Leitura publica da proposta pelo link
--
-- O cliente que recebe o link nao tem login. Nao se resolve isso com
-- policy para `anon`: qualquer chave publica do navegador listaria a
-- tabela inteira. Resolve-se com uma funcao que aceita UM slug e
-- devolve UMA proposta, e so se ela estiver enviada e dentro da
-- validade.
-- =====================================================================
create or replace function public.proposta_por_link(p_slug text)
returns table (
  slug          text,
  cliente       text,
  contato       text,
  resumo        text,
  corpo         jsonb,
  emitida_em    date,
  validade_dias integer,
  status        status_proposta
)
language sql
stable
security definer
set search_path = ''
as $fn$
  select p.slug, p.cliente, p.contato, p.resumo, p.corpo,
         p.emitida_em, p.validade_dias, p.status
  from public.proposta p
  where p.slug = p_slug
    and p.status in ('enviada', 'em_analise', 'aceita')
$fn$;

-- Rascunho nunca vaza: o filtro de status acima é o que garante isso.
revoke all on function public.proposta_por_link(text) from public;
grant execute on function public.proposta_por_link(text) to anon, authenticated;
