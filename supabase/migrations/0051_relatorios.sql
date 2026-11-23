-- =====================================================================
-- 0051 - Módulo de Relatórios de Desempenho (/painel/relatorios e /relatorio/[slug]).
--
-- Segue o mesmo modelo de segurança e publicação das propostas:
--   - Nasce como `rascunho`, invisível fora do painel.
--   - Quando publicado, congela os números da época em `snapshot` para
--     que um relatório entregue em outubro nunca mude de valor em janeiro.
--   - O link externo (`/relatorio/[slug]`) lê exclusivamente por
--     `relatorio_por_link(text)`, que exige o slug aleatório exato e
--     status `publicado`. Nenhuma política `anon` na tabela.
-- =====================================================================

create table if not exists public.relatorio (
  id                  uuid primary key default gen_random_uuid(),
  conta_id            uuid not null references public.conta(id) on delete cascade,
  slug                text not null unique,
  titulo              text not null,
  contato             text,
  periodo_de          date not null,
  periodo_ate         date not null,
  perfil_metrica      text not null default 'whatsapp'
                        check (perfil_metrica in (
                          'whatsapp',
                          'leads',
                          'ecommerce',
                          'vendas_midia',
                          'branding',
                          'personalizado'
                        )),
  status              text not null default 'rascunho'
                        check (status in ('rascunho', 'publicado', 'arquivado')),
  versao              integer not null default 1 check (versao >= 1),

  -- Narrativa da equipe para o cliente
  resumo_executivo    text not null default '',
  acoes_executadas    jsonb not null default '[]'::jsonb,
  proximos_passos     jsonb not null default '[]'::jsonb,

  -- Quais seções entram no documento (kpis, funil, serie, campanhas, canais, marcos, comercial)
  blocos_visiveis     jsonb not null default '["kpis","funil","serie","campanhas","canais","marcos"]'::jsonb,

  -- Retorno comercial informado pelo cliente (ex.: reservas/vendas fechadas no WhatsApp)
  resultado_comercial jsonb,

  -- Fotografia congelada dos números no momento da geração/atualização
  snapshot            jsonb not null default '{}'::jsonb,

  publicado_em        timestamptz,
  enviado_em          timestamptz,
  autor_id            uuid references public.perfil(id) on delete set null,
  criado_em           timestamptz not null default now(),
  atualizado_em       timestamptz not null default now(),

  constraint relatorio_periodo_coerente check (periodo_ate >= periodo_de)
);

create index if not exists relatorio_conta_idx  on public.relatorio(conta_id, periodo_ate desc);
create index if not exists relatorio_status_idx on public.relatorio(status);

comment on table public.relatorio is
  'Relatórios de desempenho por cliente e período, com snapshot congelado e link único.';

-- =====================================================================
-- RLS (espelha `src/lib/papeis.ts` em `relatorios`)
--   administrador: ver, editar, excluir
--   gestor:        ver, editar
--   comercial:     ver
--   operador:      ver, editar (restrito às contas às quais tem acesso ou geral interno)
--   cliente / cliente_leitura: ver somente publicados da própria conta
--   financeiro:    não vê métricas nem relatórios
-- =====================================================================
alter table public.relatorio enable row level security;
alter table public.relatorio force  row level security;

drop policy if exists relatorio_interno_le    on public.relatorio;
drop policy if exists relatorio_cliente_le    on public.relatorio;
drop policy if exists relatorio_equipe_cria   on public.relatorio;
drop policy if exists relatorio_equipe_altera on public.relatorio;
drop policy if exists relatorio_admin_exclui  on public.relatorio;

create policy relatorio_interno_le on public.relatorio for select
  to authenticated
  using (
    public.papel_atual() in ('administrador', 'gestor', 'comercial', 'operador')
    and public.pode_ver_conta(conta_id)
  );

create policy relatorio_cliente_le on public.relatorio for select
  to authenticated
  using (
    public.papel_atual() in ('cliente', 'cliente_leitura')
    and status = 'publicado'
    and public.tem_acesso_conta(conta_id)
  );

create policy relatorio_equipe_cria on public.relatorio for insert
  to authenticated
  with check (
    public.papel_atual() in ('administrador', 'gestor', 'operador')
    and public.pode_ver_conta(conta_id)
  );

create policy relatorio_equipe_altera on public.relatorio for update
  to authenticated
  using (
    public.papel_atual() in ('administrador', 'gestor', 'operador')
    and public.pode_ver_conta(conta_id)
  )
  with check (
    public.papel_atual() in ('administrador', 'gestor', 'operador')
    and public.pode_ver_conta(conta_id)
  );

create policy relatorio_admin_exclui on public.relatorio for delete
  to authenticated
  using (public.e_admin());

drop trigger if exists relatorio_toca on public.relatorio;
create trigger relatorio_toca before update on public.relatorio
  for each row execute function public.tocar_atualizado_em();

grant select, insert, update, delete on public.relatorio to authenticated;

-- =====================================================================
-- Leitura pública controlada pelo slug (`/relatorio/[slug]`)
--
-- Rascunho e arquivado respondem vazio (404 na página). Nunca lista mais
-- de um registro e exige o slug exato gerado com 16 bytes aleatórios.
-- =====================================================================
create or replace function public.relatorio_por_link(p_slug text)
returns table (
  slug                text,
  cliente             text,
  segmento            text,
  titulo              text,
  contato             text,
  periodo_de          date,
  periodo_ate         date,
  perfil_metrica      text,
  versao              integer,
  resumo_executivo    text,
  acoes_executadas    jsonb,
  proximos_passos     jsonb,
  blocos_visiveis     jsonb,
  resultado_comercial jsonb,
  snapshot            jsonb,
  publicado_em        timestamptz,
  criado_em           timestamptz
)
language sql
stable
security definer
set search_path = ''
as $fn$
  select
    r.slug,
    c.nome as cliente,
    c.segmento,
    r.titulo,
    r.contato,
    r.periodo_de,
    r.periodo_ate,
    r.perfil_metrica,
    r.versao,
    r.resumo_executivo,
    r.acoes_executadas,
    r.proximos_passos,
    r.blocos_visiveis,
    r.resultado_comercial,
    r.snapshot,
    r.publicado_em,
    r.criado_em
  from public.relatorio r
  join public.conta c on c.id = r.conta_id
  where r.slug = p_slug
    and r.status = 'publicado'
$fn$;

revoke all on function public.relatorio_por_link(text) from public;
grant execute on function public.relatorio_por_link(text) to anon, authenticated;
