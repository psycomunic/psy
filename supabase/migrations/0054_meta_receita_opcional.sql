-- =====================================================================
-- 0054 - Torna meta de receita opcional em `meta_conta` para contas de
-- WhatsApp, leads e tráfego que acompanham conversas, verba ou CPL/CPA.
-- =====================================================================

alter table public.meta_conta
  drop constraint if exists meta_receita_positiva;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'meta_receita_nao_negativa'
  ) then
    alter table public.meta_conta
      add constraint meta_receita_nao_negativa check (receita_meta >= 0);
  end if;
end $$;
