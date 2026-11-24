-- =====================================================================
-- 0052 - Trilha e trava anti-duplicidade dos alertas de saldo via WhatsApp.
--
-- Escopo estrito: apenas alertas críticos de saldo das contas de mídia
-- (`saldo_critico` e `saldo_zerado`) saem para o WhatsApp configurado;
-- tarefas, propostas, faturas e leads permanecem restritos ao sino do painel.
-- =====================================================================

create table if not exists public.whatsapp_enviado (
  id          bigserial primary key,
  tipo        text not null,
  chave       text,
  destino     text not null,
  resumo      text not null,
  provedor    text not null default 'cloud_api',
  provedor_id text,
  status      text not null default 'enviado' check (status in ('enviado', 'falhou')),
  erro        text,
  em          timestamptz not null default now()
);

create unique index if not exists whatsapp_chave_unica
  on public.whatsapp_enviado (tipo, chave)
  where chave is not null and status = 'enviado';

create index if not exists whatsapp_recentes_idx
  on public.whatsapp_enviado (em desc);

comment on table public.whatsapp_enviado is
  'Registro e trava de idempotência diária dos alertas de saldo enviados por WhatsApp.';

alter table public.whatsapp_enviado enable row level security;
alter table public.whatsapp_enviado force  row level security;

drop policy if exists whatsapp_admin_le on public.whatsapp_enviado;
create policy whatsapp_admin_le on public.whatsapp_enviado
  for select to authenticated
  using (public.meu_papel() = 'administrador');
