-- =====================================================================
-- 0001 - Base: contas, perfis e as funcoes que sustentam todo o RLS.
--
-- Ordem importa: as funcoes auxiliares desta migracao sao usadas nas
-- politicas de TODAS as outras. Rode esta primeiro.
-- =====================================================================

create type papel_usuario as enum ('admin', 'vendedor', 'cs', 'cliente');

-- ---------------------------------------------------------------------
-- conta: a loja cliente da agência. É a unidade de isolamento.
-- Todo dado sensível pendura numa conta, e é por ela que o RLS filtra.
-- ---------------------------------------------------------------------
create table conta (
  id            uuid primary key default gen_random_uuid(),
  nome          text not null,
  documento     text,
  plataforma    text,               -- VTEX, Nuvemshop, Shopify, Tray...
  site          text,
  ativa         boolean not null default true,
  criada_em     timestamptz not null default now(),
  atualizada_em timestamptz not null default now()
);

comment on table conta is 'Loja cliente da agencia. Unidade de isolamento multi-inquilino.';

-- ---------------------------------------------------------------------
-- perfil: espelha auth.users e carrega papel e vínculo de conta.
--
-- O papel NÃO fica no JWT e nem em campo que o usuário edita: fica aqui,
-- numa tabela que só o admin escreve. Papel que o próprio usuário
-- consegue alterar não é permissão, é sugestão.
-- ---------------------------------------------------------------------
create table perfil (
  id            uuid primary key references auth.users(id) on delete cascade,
  nome          text not null,
  email         text not null,
  papel         papel_usuario not null default 'cliente',
  conta_id      uuid references conta(id) on delete set null,
  ativo         boolean not null default true,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  -- Um cliente sem conta enxergaria o quê? Nada, e ficaria travado numa
  -- tela vazia sem explicação. Melhor o banco recusar o registro.
  constraint cliente_precisa_de_conta
    check (papel <> 'cliente' or conta_id is not null)
);

create index perfil_conta_idx on perfil(conta_id);

comment on table perfil is 'Pessoa com acesso. Papel e conta vivem aqui, nunca no JWT.';

-- =====================================================================
-- Funcoes auxiliares do RLS
--
-- security definer de propósito: uma política sobre `perfil` que
-- consultasse `perfil` diretamente entraria em recursão infinita. Estas
-- funções rodam com os privilégios do dono e ignoram RLS, quebrando o
-- ciclo.
--
-- search_path vazio é obrigatório em security definer: sem isso, alguém
-- com permissão de criar schema pode plantar uma tabela homônima e
-- sequestrar a função. Por isso todo nome aqui é qualificado.
-- =====================================================================

create or replace function public.papel_atual()
returns papel_usuario
language sql
stable
security definer
set search_path = ''
as $fn$
  select p.papel from public.perfil p
  where p.id = auth.uid() and p.ativo
$fn$;

create or replace function public.conta_atual()
returns uuid
language sql
stable
security definer
set search_path = ''
as $fn$
  select p.conta_id from public.perfil p
  where p.id = auth.uid() and p.ativo
$fn$;

-- Time da agência enxerga a base toda. Cliente não é interno.
create or replace function public.e_interno()
returns boolean
language sql
stable
security definer
set search_path = ''
as $fn$
  select coalesce(public.papel_atual() in ('admin','vendedor','cs'), false)
$fn$;

create or replace function public.e_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $fn$
  select coalesce(public.papel_atual() = 'admin', false)
$fn$;

-- Um cliente só passa por aqui para a própria conta. Esta função é a
-- tradução em SQL da regra escrita em src/lib/papeis.ts.
create or replace function public.pode_ver_conta(alvo uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $fn$
  select public.e_interno() or (alvo is not null and alvo = public.conta_atual())
$fn$;

-- =====================================================================
-- RLS
--
-- force row level security também vale para o DONO da tabela. Sem isso,
-- uma rotina que rode como owner passa por cima de tudo sem avisar.
-- =====================================================================

alter table conta  enable row level security;
alter table conta  force  row level security;
alter table perfil enable row level security;
alter table perfil force  row level security;

-- conta ---------------------------------------------------------------
create policy conta_leitura on conta for select
  to authenticated
  using (public.pode_ver_conta(id));

create policy conta_escrita on conta for insert
  to authenticated
  with check (public.e_interno());

create policy conta_alteracao on conta for update
  to authenticated
  using (public.e_interno())
  with check (public.e_interno());

create policy conta_exclusao on conta for delete
  to authenticated
  using (public.e_admin());

-- perfil --------------------------------------------------------------
-- Todo mundo lê o próprio perfil, senão nem descobre o próprio papel.
create policy perfil_proprio on perfil for select
  to authenticated
  using (id = auth.uid());

create policy perfil_interno_le on perfil for select
  to authenticated
  using (public.e_interno());

-- Só admin cria e altera perfil. Se o vendedor pudesse editar perfil,
-- ele se promoveria a admin em dois cliques e a matriz de permissões
-- inteira viraria enfeite.
create policy perfil_admin_escreve on perfil for insert
  to authenticated
  with check (public.e_admin());

create policy perfil_admin_altera on perfil for update
  to authenticated
  using (public.e_admin())
  with check (public.e_admin());

create policy perfil_admin_exclui on perfil for delete
  to authenticated
  using (public.e_admin());

-- =====================================================================
-- Perfil automático no cadastro
--
-- Sem isto, quem se cadastra existe em auth.users e não existe em
-- perfil: loga e fica sem papel nenhum, invisível para o RLS.
-- =====================================================================
create or replace function public.criar_perfil_novo_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $fn$
begin
  insert into public.perfil (id, nome, email, papel, conta_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nome', split_part(new.email, '@', 1)),
    new.email,
    -- Papel vem do convite gravado por um admin (app_meta_data, que o
    -- usuário não escreve), nunca do que ele mandou no cadastro. Na
    -- dúvida, o menor acesso possível.
    coalesce((new.raw_app_meta_data ->> 'papel')::public.papel_usuario, 'cliente'),
    (new.raw_app_meta_data ->> 'conta_id')::uuid
  )
  on conflict (id) do nothing;
  return new;
end;
$fn$;

create trigger ao_criar_usuario
  after insert on auth.users
  for each row execute function public.criar_perfil_novo_usuario();

-- =====================================================================
-- atualizado_em automatico
-- =====================================================================
create or replace function public.tocar_atualizado_em()
returns trigger
language plpgsql
set search_path = ''
as $fn$
begin
  new.atualizado_em = now();
  return new;
end;
$fn$;

create or replace function public.tocar_atualizada_em()
returns trigger
language plpgsql
set search_path = ''
as $fn$
begin
  new.atualizada_em = now();
  return new;
end;
$fn$;

create trigger conta_toca before update on conta
  for each row execute function public.tocar_atualizada_em();

create trigger perfil_toca before update on perfil
  for each row execute function public.tocar_atualizado_em();
