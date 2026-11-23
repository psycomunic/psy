-- =====================================================================
-- 0050 - Métricas para múltiplos nichos e abertura por campanha.
--
-- Até aqui a plataforma media tudo pela régua de loja virtual: receita,
-- pedido captado, pedido aprovado e MER. Para chalé, clínica, negócio
-- local, captação de leads ou campanha institucional, essa régua exibe
-- R$ 0 mesmo com anúncio rodando e gerando conversas todos os dias.
--
-- Três entregas nesta migração:
--   1. Perfil de métricas na `conta` e metas multi-objetivo em `meta_conta`
--   2. Colunas de funil completo em `metrica_diaria` + atualização das views
--   3. Tabela `metrica_campanha` com gravação idempotente e RLS espelhado
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Lente de leitura de cada cliente
--
-- `automatico` respeita o `conta.tipo` que já existe (`ecommerce` lê
-- vendas; `trafego` e `outro` leem WhatsApp e atendimento), sem obrigar
-- ninguém a reconfigurar a carteira atual. Os demais valores permitem
-- escolher o modelo exato de operação de cada conta.
-- ---------------------------------------------------------------------
alter table public.conta
  add column if not exists perfil_metrica text not null default 'automatico',
  add column if not exists kpis_visiveis  text[];

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'conta_perfil_metrica_valido'
  ) then
    alter table public.conta
      add constraint conta_perfil_metrica_valido check (
        perfil_metrica in (
          'automatico',
          'whatsapp',
          'leads',
          'ecommerce',
          'vendas_midia',
          'branding',
          'personalizado'
        )
      );
  end if;
end $$;

comment on column public.conta.perfil_metrica is
  'Define quais KPIs, funil e série temporal abrem por padrão para este cliente.';

comment on column public.conta.kpis_visiveis is
  'Lista personalizada de chaves de KPI quando perfil_metrica = personalizado.';

-- ---------------------------------------------------------------------
-- 2. Metas além de receita de loja
-- ---------------------------------------------------------------------
alter table public.meta_conta
  add column if not exists verba_meta           numeric(14,2),
  add column if not exists resultado_meta       integer,
  add column if not exists custo_resultado_teto numeric(12,2);

/* Em clientes de tráfego/leads não existe meta de receita de loja, então
   `receita_meta` passa a aceitar zero quando a meta real for de conversas,
   leads ou orçamento de mídia. */
alter table public.meta_conta
  alter column receita_meta set default 0;

comment on column public.meta_conta.verba_meta is
  'Orçamento de mídia planejado para o mês, usado para acompanhar ritmo de gasto.';

comment on column public.meta_conta.resultado_meta is
  'Meta de volume do mês no objetivo principal da conta (conversas, leads ou vendas).';

comment on column public.meta_conta.custo_resultado_teto is
  'Custo máximo aceitável por resultado principal (custo por conversa, CPL ou CPA).';

-- ---------------------------------------------------------------------
-- 3. Colunas multi-objetivo em `metrica_diaria`
-- ---------------------------------------------------------------------
alter table public.metrica_diaria
  add column if not exists alcance             integer not null default 0,
  add column if not exists cliques_link        integer not null default 0,
  add column if not exists visitas_pagina      integer not null default 0,
  add column if not exists conversas           integer not null default 0,
  add column if not exists leads_captados      integer not null default 0,
  add column if not exists compras_atribuidas  integer not null default 0,
  add column if not exists carrinhos           integer not null default 0,
  add column if not exists checkouts           integer not null default 0,
  add column if not exists engajamentos        integer not null default 0,
  add column if not exists visualizacoes_video integer not null default 0;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'metrica_multinicho_sem_negativo'
  ) then
    alter table public.metrica_diaria
      add constraint metrica_multinicho_sem_negativo check (
        alcance             >= 0 and
        cliques_link        >= 0 and
        visitas_pagina      >= 0 and
        conversas           >= 0 and
        leads_captados      >= 0 and
        compras_atribuidas  >= 0 and
        carrinhos           >= 0 and
        checkouts           >= 0 and
        engajamentos        >= 0 and
        visualizacoes_video >= 0
      ) not valid;
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 4. Tabela `metrica_campanha`: o recorte por campanha e objetivo
--
-- Um mesmo cliente roda ao mesmo tempo campanha de WhatsApp e campanha
-- de alcance no Reels. Juntar as duas num número só faz a verba de
-- alcance inflar o custo por conversa. Separar por campanha resolve.
-- ---------------------------------------------------------------------
create table if not exists public.metrica_campanha (
  id                  uuid primary key default gen_random_uuid(),
  conta_id            uuid not null references public.conta(id) on delete cascade,
  provedor            text not null,
  canal               text not null,
  campanha_id         text not null,
  campanha_nome       text not null,
  objetivo            text not null default 'outro'
                        check (objetivo in (
                          'mensagens',
                          'leads',
                          'vendas',
                          'trafego',
                          'alcance',
                          'engajamento',
                          'video',
                          'outro'
                        )),
  status_campanha     text,
  dia                 date not null,
  investimento        numeric(14,2) not null default 0,
  impressoes          integer not null default 0,
  alcance             integer not null default 0,
  cliques             integer not null default 0,
  cliques_link        integer not null default 0,
  visitas_pagina      integer not null default 0,
  conversas           integer not null default 0,
  leads_captados      integer not null default 0,
  compras_atribuidas  integer not null default 0,
  receita_atribuida   numeric(14,2) not null default 0,
  carrinhos           integer not null default 0,
  checkouts           integer not null default 0,
  engajamentos        integer not null default 0,
  visualizacoes_video integer not null default 0,
  sincronizada_em     timestamptz not null default now(),

  constraint metrica_campanha_unica unique (conta_id, provedor, campanha_id, dia),
  constraint metrica_campanha_sem_negativo check (
    investimento        >= 0 and
    impressoes          >= 0 and
    alcance             >= 0 and
    cliques             >= 0 and
    cliques_link        >= 0 and
    visitas_pagina      >= 0 and
    conversas           >= 0 and
    leads_captados      >= 0 and
    compras_atribuidas  >= 0 and
    receita_atribuida   >= 0 and
    carrinhos           >= 0 and
    checkouts           >= 0 and
    engajamentos        >= 0 and
    visualizacoes_video >= 0
  )
);

create index if not exists metrica_campanha_conta_dia_idx
  on public.metrica_campanha(conta_id, dia desc);

comment on table public.metrica_campanha is
  'Desempenho diário por campanha e objetivo. Mesma regra de isolamento de metrica_diaria.';

alter table public.metrica_campanha enable row level security;
alter table public.metrica_campanha force  row level security;

drop policy if exists metrica_campanha_leitura on public.metrica_campanha;
create policy metrica_campanha_leitura on public.metrica_campanha for select
  to authenticated using (public.pode_ver_conta(conta_id));

-- ---------------------------------------------------------------------
-- 5. `registrar_metricas`: preserva frete da loja (0014) e grava o funil
--    completo da mídia de forma idempotente.
-- ---------------------------------------------------------------------
create or replace function public.registrar_metricas(
  p_conta    uuid,
  p_provedor text,
  p_linhas   jsonb
) returns integer
language plpgsql
set search_path = ''
as $$
declare
  v_gravadas integer := 0;
  v_max_dia  date;
begin
  if p_linhas is null or jsonb_typeof(p_linhas) <> 'array' then
    raise exception 'registrar_metricas espera um array de linhas.';
  end if;

  select max((l->>'dia')::date) into v_max_dia
    from jsonb_array_elements(p_linhas) l;

  if v_max_dia > public.hoje() then
    raise exception 'Linha com dia no futuro (%). Confira o fuso da fonte.', v_max_dia;
  end if;

  if p_provedor in ('loja', 'magazord', 'shopify', 'planilha_loja') then
    insert into public.metrica_diaria as m (
      conta_id, dia, canal,
      pedidos_captados, pedidos_aprovados, receita, receita_bruta, frete,
      novos_clientes, pedidos,
      sincronizada_em
    )
    select
      p_conta,
      (l->>'dia')::date,
      coalesce(nullif(l->>'canal', ''), 'loja'),
      coalesce((l->>'pedidos_captados')::integer, 0),
      coalesce((l->>'pedidos_aprovados')::integer, 0),
      coalesce((l->>'receita')::numeric, 0),
      coalesce((l->>'receita_bruta')::numeric, 0),
      coalesce((l->>'frete')::numeric, 0),
      coalesce((l->>'novos_clientes')::integer, 0),
      coalesce((l->>'pedidos_aprovados')::integer, 0),
      now()
    from jsonb_array_elements(p_linhas) l
    on conflict (conta_id, dia, canal) do update set
      pedidos_captados  = excluded.pedidos_captados,
      pedidos_aprovados = excluded.pedidos_aprovados,
      receita           = excluded.receita,
      receita_bruta     = excluded.receita_bruta,
      frete             = excluded.frete,
      novos_clientes    = excluded.novos_clientes,
      pedidos           = excluded.pedidos_aprovados,
      sincronizada_em   = now();

  elsif p_provedor in ('ga4', 'analytics', 'planilha_sessao') then
    insert into public.metrica_diaria as m (
      conta_id, dia, canal, sessoes, sincronizada_em
    )
    select
      p_conta,
      (l->>'dia')::date,
      coalesce(nullif(l->>'canal', ''), 'organico'),
      coalesce((l->>'sessoes')::integer, 0),
      now()
    from jsonb_array_elements(p_linhas) l
    on conflict (conta_id, dia, canal) do update set
      sessoes         = excluded.sessoes,
      sincronizada_em = now();

  elsif p_provedor in ('google_ads', 'meta_ads', 'tiktok_ads', 'planilha_midia') then
    insert into public.metrica_diaria as m (
      conta_id, dia, canal,
      investimento, cliques, impressoes, receita_atribuida,
      alcance, cliques_link, visitas_pagina, conversas, leads_captados,
      compras_atribuidas, carrinhos, checkouts, engajamentos, visualizacoes_video,
      sincronizada_em
    )
    select
      p_conta,
      (l->>'dia')::date,
      nullif(l->>'canal', ''),
      coalesce((l->>'investimento')::numeric, 0),
      coalesce((l->>'cliques')::integer, 0),
      coalesce((l->>'impressoes')::integer, 0),
      coalesce((l->>'receita_atribuida')::numeric, 0),
      coalesce((l->>'alcance')::integer, 0),
      coalesce((l->>'cliques_link')::integer, 0),
      coalesce((l->>'visitas_pagina')::integer, 0),
      coalesce((l->>'conversas')::integer, 0),
      coalesce((l->>'leads_captados')::integer, 0),
      coalesce((l->>'compras_atribuidas')::integer, 0),
      coalesce((l->>'carrinhos')::integer, 0),
      coalesce((l->>'checkouts')::integer, 0),
      coalesce((l->>'engajamentos')::integer, 0),
      coalesce((l->>'visualizacoes_video')::integer, 0),
      now()
    from jsonb_array_elements(p_linhas) l
    on conflict (conta_id, dia, canal) do update set
      investimento        = excluded.investimento,
      cliques             = excluded.cliques,
      impressoes          = excluded.impressoes,
      receita_atribuida   = excluded.receita_atribuida,
      alcance             = excluded.alcance,
      cliques_link        = excluded.cliques_link,
      visitas_pagina      = excluded.visitas_pagina,
      conversas           = excluded.conversas,
      leads_captados      = excluded.leads_captados,
      compras_atribuidas  = excluded.compras_atribuidas,
      carrinhos           = excluded.carrinhos,
      checkouts           = excluded.checkouts,
      engajamentos        = excluded.engajamentos,
      visualizacoes_video = excluded.visualizacoes_video,
      sincronizada_em     = now();

  else
    raise exception 'Provedor desconhecido: %.', p_provedor;
  end if;

  get diagnostics v_gravadas = row_count;
  return v_gravadas;
end;
$$;

revoke execute on function public.registrar_metricas(uuid, text, jsonb) from public;
revoke execute on function public.registrar_metricas(uuid, text, jsonb) from anon;
revoke execute on function public.registrar_metricas(uuid, text, jsonb) from authenticated;

-- ---------------------------------------------------------------------
-- 6. `registrar_metricas_campanha`: gravação idempotente por campanha
-- ---------------------------------------------------------------------
create or replace function public.registrar_metricas_campanha(
  p_conta     uuid,
  p_provedor  text,
  p_campanhas jsonb
) returns integer
language plpgsql
set search_path = ''
as $$
declare
  v_gravadas integer := 0;
  v_max_dia  date;
begin
  if p_campanhas is null or jsonb_typeof(p_campanhas) <> 'array' then
    raise exception 'registrar_metricas_campanha espera um array.';
  end if;

  if jsonb_array_length(p_campanhas) = 0 then
    return 0;
  end if;

  select max((c->>'dia')::date) into v_max_dia
    from jsonb_array_elements(p_campanhas) c;

  if v_max_dia > public.hoje() then
    raise exception 'Campanha com dia no futuro (%). Confira o fuso da fonte.', v_max_dia;
  end if;

  insert into public.metrica_campanha (
    conta_id, provedor, canal, campanha_id, campanha_nome, objetivo, status_campanha, dia,
    investimento, impressoes, alcance, cliques, cliques_link, visitas_pagina,
    conversas, leads_captados, compras_atribuidas, receita_atribuida,
    carrinhos, checkouts, engajamentos, visualizacoes_video,
    sincronizada_em
  )
  select
    p_conta,
    p_provedor,
    coalesce(nullif(c->>'canal', ''), 'meta'),
    c->>'campanha_id',
    coalesce(nullif(c->>'campanha_nome', ''), 'Campanha sem nome'),
    case
      when (c->>'objetivo') in ('mensagens','leads','vendas','trafego','alcance','engajamento','video','outro')
        then c->>'objetivo'
      else 'outro'
    end,
    nullif(c->>'status_campanha', ''),
    (c->>'dia')::date,
    coalesce((c->>'investimento')::numeric, 0),
    coalesce((c->>'impressoes')::integer, 0),
    coalesce((c->>'alcance')::integer, 0),
    coalesce((c->>'cliques')::integer, 0),
    coalesce((c->>'cliques_link')::integer, 0),
    coalesce((c->>'visitas_pagina')::integer, 0),
    coalesce((c->>'conversas')::integer, 0),
    coalesce((c->>'leads_captados')::integer, 0),
    coalesce((c->>'compras_atribuidas')::integer, 0),
    coalesce((c->>'receita_atribuida')::numeric, 0),
    coalesce((c->>'carrinhos')::integer, 0),
    coalesce((c->>'checkouts')::integer, 0),
    coalesce((c->>'engajamentos')::integer, 0),
    coalesce((c->>'visualizacoes_video')::integer, 0),
    now()
  from jsonb_array_elements(p_campanhas) c
  where nullif(c->>'campanha_id', '') is not null
  on conflict (conta_id, provedor, campanha_id, dia) do update set
    canal               = excluded.canal,
    campanha_nome       = excluded.campanha_nome,
    objetivo            = excluded.objetivo,
    status_campanha     = coalesce(excluded.status_campanha, public.metrica_campanha.status_campanha),
    investimento        = excluded.investimento,
    impressoes          = excluded.impressoes,
    alcance             = excluded.alcance,
    cliques             = excluded.cliques,
    cliques_link        = excluded.cliques_link,
    visitas_pagina      = excluded.visitas_pagina,
    conversas           = excluded.conversas,
    leads_captados      = excluded.leads_captados,
    compras_atribuidas  = excluded.compras_atribuidas,
    receita_atribuida   = excluded.receita_atribuida,
    carrinhos           = excluded.carrinhos,
    checkouts           = excluded.checkouts,
    engajamentos        = excluded.engajamentos,
    visualizacoes_video = excluded.visualizacoes_video,
    sincronizada_em     = now();

  get diagnostics v_gravadas = row_count;
  return v_gravadas;
end;
$$;

revoke execute on function public.registrar_metricas_campanha(uuid, text, jsonb) from public;
revoke execute on function public.registrar_metricas_campanha(uuid, text, jsonb) from anon;
revoke execute on function public.registrar_metricas_campanha(uuid, text, jsonb) from authenticated;

-- ---------------------------------------------------------------------
-- 7. Views atualizadas (colunas novas sempre ao final para preservar a
--    assinatura de todas as views dependentes, e `security_invoker = on`).
-- ---------------------------------------------------------------------
create or replace view public.kpi_diario
with (security_invoker = on) as
select
  m.conta_id,
  m.dia,
  sum(m.sessoes)           as sessoes,
  sum(m.pedidos_captados)  as pedidos_captados,
  sum(m.pedidos_aprovados) as pedidos_aprovados,
  sum(m.novos_clientes)    as novos_clientes,
  sum(m.receita)           as receita,
  sum(m.investimento)      as investimento,
  sum(m.cliques)           as cliques,
  sum(m.impressoes)        as impressoes,
  case when sum(m.investimento) > 0
       then round(sum(m.receita) / sum(m.investimento), 2) end as mer,
  case when sum(m.pedidos_aprovados) > 0
       then round(sum(m.receita) / sum(m.pedidos_aprovados), 2) end as ticket_medio,
  case when sum(m.novos_clientes) > 0
       then round(sum(m.investimento) / sum(m.novos_clientes), 2) end as cac,
  case when sum(m.sessoes) > 0
       then round(100.0 * sum(m.pedidos_captados) / sum(m.sessoes), 2) end as taxa_conversao,
  case when sum(m.pedidos_captados) > 0
       then round(100.0 * sum(m.pedidos_aprovados) / sum(m.pedidos_captados), 2) end as taxa_aprovacao,
  -- Colunas novas no final:
  sum(m.receita_atribuida)   as receita_atribuida,
  sum(m.alcance)             as alcance,
  sum(m.cliques_link)        as cliques_link,
  sum(m.visitas_pagina)      as visitas_pagina,
  sum(m.conversas)           as conversas,
  sum(m.leads_captados)      as leads_captados,
  sum(m.compras_atribuidas)  as compras_atribuidas,
  sum(m.carrinhos)           as carrinhos,
  sum(m.checkouts)           as checkouts,
  sum(m.engajamentos)        as engajamentos,
  sum(m.visualizacoes_video) as visualizacoes_video
from public.metrica_diaria m
group by m.conta_id, m.dia;

create or replace view public.kpi_canal
with (security_invoker = on) as
select
  m.conta_id,
  m.canal,
  m.dia,
  sum(m.receita)      as receita,
  sum(m.investimento) as investimento,
  sum(m.sessoes)      as sessoes,
  sum(m.pedidos_aprovados) as pedidos_aprovados,
  sum(m.cliques)      as cliques,
  sum(m.impressoes)   as impressoes,
  case when sum(m.investimento) > 0
       then round(sum(m.receita) / sum(m.investimento), 2) end as roas,
  case when sum(m.cliques) > 0
       then round(sum(m.investimento) / sum(m.cliques), 2) end as cpc,
  case when sum(m.impressoes) > 0
       then round(100.0 * sum(m.cliques) / sum(m.impressoes), 2) end as ctr,
  sum(m.receita_atribuida) as receita_atribuida,
  case when sum(m.investimento) > 0
       then round(sum(m.receita_atribuida) / sum(m.investimento), 2) end as roas_declarado,
  -- Colunas novas no final:
  sum(m.alcance)             as alcance,
  sum(m.cliques_link)        as cliques_link,
  sum(m.visitas_pagina)      as visitas_pagina,
  sum(m.conversas)           as conversas,
  sum(m.leads_captados)      as leads_captados,
  sum(m.compras_atribuidas)  as compras_atribuidas,
  sum(m.carrinhos)           as carrinhos,
  sum(m.checkouts)           as checkouts,
  sum(m.engajamentos)        as engajamentos,
  sum(m.visualizacoes_video) as visualizacoes_video
from public.metrica_diaria m
group by m.conta_id, m.canal, m.dia;

create or replace view public.kpi_mes
with (security_invoker = on) as
select
  c.id                                as conta_id,
  c.nome                              as conta_nome,
  date_trunc('month', public.hoje())::date as mes,
  coalesce(sum(k.receita), 0)         as receita,
  coalesce(sum(k.investimento), 0)    as investimento,
  coalesce(sum(k.pedidos_aprovados), 0) as pedidos,
  coalesce(sum(k.novos_clientes), 0)  as novos_clientes,
  mt.receita_meta,
  mt.roas_alvo,
  mt.cac_teto,
  case when coalesce(sum(k.investimento), 0) > 0
       then round(sum(k.receita) / sum(k.investimento), 2) end as mer,
  case when mt.receita_meta > 0
       then round(100.0 * coalesce(sum(k.receita), 0) / mt.receita_meta, 1) end as meta_atingida,
  case when mt.receita_meta > 0 then
    round(
      greatest(mt.receita_meta - coalesce(sum(k.receita), 0), 0)
      / greatest(
          (date_trunc('month', public.hoje()) + interval '1 month - 1 day')::date
          - public.hoje() + 1,
          1),
      2)
  end as receita_dia_necessaria,
  -- Colunas novas no final:
  coalesce(sum(k.conversas), 0)          as conversas,
  coalesce(sum(k.leads_captados), 0)     as leads_captados,
  coalesce(sum(k.compras_atribuidas), 0) as compras_atribuidas,
  coalesce(sum(k.receita_atribuida), 0)  as receita_atribuida,
  coalesce(sum(k.alcance), 0)            as alcance,
  coalesce(sum(k.cliques_link), 0)       as cliques_link,
  mt.verba_meta,
  mt.resultado_meta,
  mt.custo_resultado_teto
from public.conta c
left join public.kpi_diario k
       on k.conta_id = c.id
      and k.dia >= date_trunc('month', public.hoje())::date
left join public.meta_conta mt
       on mt.conta_id = c.id
      and mt.mes = date_trunc('month', public.hoje())::date
where c.situacao in ('ativa', 'onboarding')
group by c.id, c.nome, mt.receita_meta, mt.roas_alvo, mt.cac_teto,
         mt.verba_meta, mt.resultado_meta, mt.custo_resultado_teto;

grant select on public.metrica_campanha to authenticated;
grant select on public.kpi_diario       to authenticated;
grant select on public.kpi_canal        to authenticated;
grant select on public.kpi_mes          to authenticated;
