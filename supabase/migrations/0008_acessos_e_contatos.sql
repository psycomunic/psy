-- =====================================================================
-- 0008 - FASE 1: multi-tenancy de verdade.
--
-- O vínculo usuário-loja deixa de ser uma coluna e vira uma tabela.
--
-- POR QUE ISTO ERA NECESSÁRIO
-- `perfil.conta_id` permite UMA loja por pessoa. Na operação real, uma
-- loja tem várias pessoas (o dono aprova, o gerente acompanha) e uma
-- pessoa pode ter várias lojas (mesmo dono, duas marcas).
--
-- POR QUE ISTO É BARATO
-- Nenhuma das 38 políticas muda. Todas passam por
-- `tem_acesso_conta(uuid)`, e o que acontece aqui é a troca do CORPO
-- dessa função. Foi para isso que a lógica de acesso ficou centralizada
-- desde a primeira migração.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. O vínculo
-- ---------------------------------------------------------------------
create table acessos_conta (
  id            uuid primary key default gen_random_uuid(),
  usuario_id    uuid not null references perfil(id) on delete cascade,
  conta_id      uuid not null references conta(id)  on delete cascade,

  /* Um operador pode ser responsável por uma loja e apenas
     acompanhar outra. O papel GLOBAL continua em `perfil.papel`; este
     campo qualifica o vínculo. */
  responsavel   boolean not null default false,

  convidado_por uuid references perfil(id) on delete set null,
  aceito_em     timestamptz,
  criado_em     timestamptz not null default now(),

  /* Sem isto, o mesmo usuário entraria duas vezes na mesma loja e a
     lista de acessos mostraria linhas duplicadas. */
  constraint acesso_unico unique (usuario_id, conta_id)
);

create index acessos_usuario_idx on acessos_conta(usuario_id);
create index acessos_conta_idx   on acessos_conta(conta_id);

comment on table acessos_conta is
  'Quem enxerga qual loja. É a chave do multi-tenancy: tem_acesso_conta() lê daqui.';

-- ---------------------------------------------------------------------
-- 2. Migra o que já existe.
--
-- Antes de trocar a função. Se a ordem fosse invertida, existiria uma
-- janela em que o cliente atual perderia acesso à própria loja.
-- ---------------------------------------------------------------------
insert into acessos_conta (usuario_id, conta_id, aceito_em)
select p.id, p.conta_id, p.criado_em
  from perfil p
 where p.conta_id is not null
on conflict (usuario_id, conta_id) do nothing;

-- ---------------------------------------------------------------------
-- 3. A troca.
--
-- `perfil.conta_id` NÃO é removida: ela passa a significar "loja
-- principal", que é o que o portal usa para decidir qual abrir quando a
-- pessoa tem mais de uma. E a constraint `cliente_precisa_de_conta`
-- continua valendo, garantindo que nenhum cliente nasça sem loja.
-- ---------------------------------------------------------------------
create or replace function public.tem_acesso_conta(alvo uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $fn$
  select alvo is not null
     and exists (
       select 1
         from public.acessos_conta a
         join public.perfil p on p.id = a.usuario_id
        where a.usuario_id = auth.uid()
          and a.conta_id = alvo
          and p.ativo)
$fn$;

comment on column perfil.conta_id is
  'Loja principal: qual abrir por padrão. O acesso de verdade vive em acessos_conta.';

/* Todas as lojas que o usuário atual enxerga. O portal usa para montar
   o seletor de loja sem precisar de uma consulta em cada tela. */
create or replace function public.minhas_contas()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $fn$
  select a.conta_id
    from public.acessos_conta a
    join public.perfil p on p.id = a.usuario_id
   where a.usuario_id = auth.uid() and p.ativo
$fn$;

-- ---------------------------------------------------------------------
-- 4. O gatilho de perfil também cria o vínculo.
--
-- Sem isto, um cliente convidado nasceria com `perfil.conta_id`
-- preenchido e SEM linha em acessos_conta — ou seja, com loja
-- principal definida e sem enxergar nada.
-- ---------------------------------------------------------------------
create or replace function public.criar_perfil_novo_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_papel public.papel_usuario;
  v_conta uuid;
  v_nome  text;
begin
  begin
    v_papel := (new.raw_app_meta_data ->> 'papel')::public.papel_usuario;
  exception when others then
    v_papel := null;
  end;

  if v_papel is null then
    return new;   -- sem papel definido, sem perfil, sem acesso
  end if;

  begin
    v_conta := (new.raw_app_meta_data ->> 'conta_id')::uuid;
  exception when others then
    v_conta := null;
  end;

  if v_papel in ('cliente','cliente_leitura') and v_conta is null then
    return new;   -- não passaria na constraint
  end if;

  v_nome := coalesce(
    new.raw_user_meta_data ->> 'nome',
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'Sem nome');

  insert into public.perfil (id, nome, email, papel, conta_id)
  values (new.id, v_nome, coalesce(new.email, ''), v_papel, v_conta)
  on conflict (id) do update
    set papel    = excluded.papel,
        conta_id = excluded.conta_id,
        nome     = coalesce(nullif(public.perfil.nome, ''), excluded.nome),
        email    = coalesce(nullif(public.perfil.email, ''), excluded.email);

  if v_conta is not null then
    insert into public.acessos_conta (usuario_id, conta_id, aceito_em)
    values (new.id, v_conta, now())
    on conflict (usuario_id, conta_id) do nothing;
  end if;

  return new;
exception when others then
  return new;   -- gatilho nunca derruba a criação do usuário
end;
$fn$;

-- ---------------------------------------------------------------------
-- 5. Contatos da loja
--
-- Pessoas do lado do cliente que NÃO necessariamente têm login: o
-- financeiro que recebe a fatura, o gerente que atende o WhatsApp.
-- Separado de `perfil` de propósito: virar contato não deve exigir
-- criar acesso, e criar acesso para quem só recebe boleto é superfície
-- de risco à toa.
-- ---------------------------------------------------------------------
create table contato (
  id            uuid primary key default gen_random_uuid(),
  conta_id      uuid not null references conta(id) on delete cascade,
  nome          text not null,
  cargo         text,
  email         text,
  telefone      text,
  whatsapp      text,
  principal     boolean not null default false,
  aniversario   date,
  observacoes   text,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index contato_conta_idx on contato(conta_id);

/* Um principal por loja. Dois "principais" é o mesmo que nenhum: na
   hora de escolher para quem ligar, ninguém sabe. */
create unique index contato_principal_unico
    on contato(conta_id) where principal;

-- =====================================================================
-- 6. RLS
-- =====================================================================
alter table acessos_conta enable row level security;
alter table acessos_conta force  row level security;
alter table contato       enable row level security;
alter table contato       force  row level security;

/* Acessos: o time interno vê todos; cada pessoa vê os próprios, para
   saber a quais lojas tem acesso. */
create policy acessos_interno_le on acessos_conta for select
  to authenticated using (public.e_interno());

create policy acessos_proprio_le on acessos_conta for select
  to authenticated using (usuario_id = auth.uid());

/* Só admin concede e revoga acesso. Se o gestor pudesse, ele se
   vincularia a qualquer loja, e o recorte do operador viraria enfeite. */
create policy acessos_admin_escreve on acessos_conta for insert
  to authenticated with check (public.e_admin());

create policy acessos_admin_altera on acessos_conta for update
  to authenticated using (public.e_admin()) with check (public.e_admin());

create policy acessos_admin_exclui on acessos_conta for delete
  to authenticated using (public.e_admin());

/* Contato: dado operacional da agência. O cliente NÃO vê a lista de
   contatos da própria loja — é cadastro interno, e expor quem a agência
   anotou como responsável não ajuda o lojista em nada. */
create policy contato_interno_le on contato for select
  to authenticated using (public.e_interno());

create policy contato_interno_cria on contato for insert
  to authenticated with check (public.e_interno());

create policy contato_interno_altera on contato for update
  to authenticated using (public.e_interno()) with check (public.e_interno());

create policy contato_admin_exclui on contato for delete
  to authenticated using (public.e_admin());

create trigger contato_toca before update on contato
  for each row execute function public.tocar_atualizada_em();

-- =====================================================================
-- 7. Auditoria nas tabelas que faltavam
--
-- 0003 já cobria contrato, lancamento, fatura, proposta e perfil.
-- Faltavam as que decidem QUEM VÊ O QUÊ e as que guardam credencial:
-- são justamente as que se quer poder reconstituir depois.
-- =====================================================================
create trigger acessos_auditoria after insert or update or delete on acessos_conta
  for each row execute function public.registrar_auditoria();

create trigger conta_auditoria after insert or update or delete on conta
  for each row execute function public.registrar_auditoria();

create trigger integracao_auditoria after insert or update or delete on integracao
  for each row execute function public.registrar_auditoria();

create trigger meta_auditoria after insert or update or delete on meta_conta
  for each row execute function public.registrar_auditoria();

/* O gestor passa a ler a auditoria. Ele não pode excluir nem gerir
   usuários, mas precisa conseguir responder "quem mudou isso?" sem
   depender do administrador. */
drop policy if exists log_admin_le on log_auditoria;

create policy log_leitura on log_auditoria for select
  to authenticated
  using (public.papel_atual() in ('administrador','gestor'));

/*
  A auditoria guarda `antes` e `depois` como jsonb da linha inteira.
  Em `integracao`, isso incluiria o token de anúncio do cliente, e o
  log viraria o lugar mais fácil de vazar credencial no banco todo.

  Por isso o registrador apaga o campo `segredo` antes de gravar.
*/
create or replace function public.registrar_auditoria()
returns trigger
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_antes  jsonb;
  v_depois jsonb;
begin
  v_antes  := case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) end;
  v_depois := case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) end;

  if tg_table_name = 'integracao' then
    v_antes  := v_antes  - 'segredo';
    v_depois := v_depois - 'segredo';
  end if;

  insert into public.log_auditoria
    (autor_id, autor_papel, acao, tabela, registro_id, antes, depois)
  values (
    auth.uid(),
    public.papel_atual(),
    lower(tg_op),
    tg_table_name,
    coalesce(new.id, old.id)::text,
    v_antes,
    v_depois);

  return coalesce(new, old);
end;
$fn$;
