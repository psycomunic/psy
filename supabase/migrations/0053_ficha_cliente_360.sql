-- =====================================================================
-- 0053 - Ficha 360° do cliente: escopo contratado, briefing estratégico,
-- links operacionais e checklist de onboarding.
-- =====================================================================

alter table public.conta
  add column if not exists instagram             text,
  add column if not exists escopo                text[] not null default '{}',
  add column if not exists objetivo_principal    text,
  add column if not exists publico_alvo          text,
  add column if not exists oferta_principal      text,
  add column if not exists diferenciais          text,
  add column if not exists links_uteis           jsonb not null default '{}'::jsonb,
  add column if not exists checklist_onboarding  jsonb not null default '{}'::jsonb;

comment on column public.conta.instagram is
  'Arroba ou URL do perfil principal do cliente no Instagram.';

comment on column public.conta.escopo is
  'Lista dos serviços contratados (ex.: Tráfego Meta Ads, Google Ads, Criativos, Landing Page).';

comment on column public.conta.objetivo_principal is
  'Objetivo macro combinado com o cliente para nortear a operação.';

comment on column public.conta.links_uteis is
  'Links rápidos de operação: pasta Drive/criativos, motor de reservas/CRM, Figma, etc.';

comment on column public.conta.checklist_onboarding is
  'Mapa booleano dos itens de setup e onboarding concluídos na conta.';
