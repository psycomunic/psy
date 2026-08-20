-- =====================================================================
-- 0007 - FASE 0, parte 2: os papéis novos entram em uso.
--
-- Só agora, porque `alter type ... add value` proíbe usar o valor na
-- mesma transação em que ele nasce. Ver o cabeçalho de 0006.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Quem é "do time da agência".
--
-- Os cinco papéis internos. `financeiro` entra aqui porque ele precisa
-- ler conta, contrato e fatura; o que ele NÃO pode ver (métrica de
-- campanha) é decidido na matriz da interface e nas políticas
-- específicas, não neste guarda-chuva.
-- ---------------------------------------------------------------------
create or replace function public.e_interno()
returns boolean
language sql
stable
security definer
set search_path = ''
as $fn$
  select coalesce(
    public.papel_atual() in
      ('administrador','gestor','comercial','operador','financeiro'),
    false)
$fn$;

-- ---------------------------------------------------------------------
-- 2. Quem manda de verdade.
--
-- `gestor` NÃO entra: pelo escopo do produto ele faz tudo menos
-- cobrança, gestão de usuários e exclusão definitiva. Essas três são o
-- que `e_admin()` protege.
-- ---------------------------------------------------------------------
create or replace function public.e_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $fn$
  select coalesce(public.papel_atual() = 'administrador', false)
$fn$;

/* Quem enxerga dinheiro da agência: fee, margem, inadimplência. */
create or replace function public.e_financeiro()
returns boolean
language sql
stable
security definer
set search_path = ''
as $fn$
  select coalesce(
    public.papel_atual() in ('administrador','financeiro'),
    false)
$fn$;

-- ---------------------------------------------------------------------
-- 3. `tem_acesso_conta(uuid)`
--
-- O PONTO DE TROCA DO MULTI-LOJA.
--
-- Hoje o vínculo é um-para-um: `perfil.conta_id`. Na FASE 1 ele vira
-- N:N pela tabela `acessos_conta`, e a mudança acontece TROCANDO O
-- CORPO DESTA FUNÇÃO — nenhuma das políticas precisa ser reescrita,
-- porque todas passam por aqui.
--
-- É o motivo de a lógica de acesso ter sido centralizada desde 0001.
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
       select 1 from public.perfil p
        where p.id = auth.uid()
          and p.ativo
          and p.conta_id = alvo)
$fn$;

comment on function public.tem_acesso_conta(uuid) is
  'Vínculo usuário-loja. FASE 1 troca o corpo para acessos_conta (N:N); as políticas não mudam.';

-- ---------------------------------------------------------------------
-- 4. `pode_ver_conta` passa a delegar.
--
-- Antes ela comparava com `conta_atual()` direto. Agora chama
-- `tem_acesso_conta()`, para existir UM lugar que sabe o que é ter
-- acesso a uma loja.
-- ---------------------------------------------------------------------
create or replace function public.pode_ver_conta(alvo uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $fn$
  select public.e_interno() or public.tem_acesso_conta(alvo)
$fn$;

-- ---------------------------------------------------------------------
-- 5. Políticas que citavam papel por nome.
--
-- O rename preservou o oid, então elas continuavam corretas. São
-- recriadas mesmo assim: política cujo texto no banco diz uma coisa e
-- cujo significado é outro é uma armadilha para quem for auditar
-- depois com `\d+` ou `pg_policies`.
-- ---------------------------------------------------------------------
drop policy if exists proposta_comercial_cria   on proposta;
drop policy if exists proposta_comercial_altera on proposta;

create policy proposta_comercial_cria on proposta for insert
  to authenticated
  with check (public.papel_atual() in ('administrador','gestor','comercial'));

create policy proposta_comercial_altera on proposta for update
  to authenticated
  using      (public.papel_atual() in ('administrador','gestor','comercial'))
  with check (public.papel_atual() in ('administrador','gestor','comercial'));

-- Fatura: o cliente vê a própria, e agora o papel de leitura também.
drop policy if exists fatura_cliente_le on fatura;

create policy fatura_cliente_le on fatura for select
  to authenticated
  using (
    public.papel_atual() in ('cliente','cliente_leitura')
    and public.tem_acesso_conta(conta_id));

-- Financeiro deixa de ser exclusividade do administrador.
drop policy if exists contrato_admin   on contrato;
drop policy if exists lancamento_admin on lancamento;
drop policy if exists fatura_admin     on fatura;

create policy contrato_financeiro on contrato for all
  to authenticated
  using (public.e_financeiro()) with check (public.e_financeiro());

create policy lancamento_financeiro on lancamento for all
  to authenticated
  using (public.e_financeiro()) with check (public.e_financeiro());

create policy fatura_financeiro on fatura for all
  to authenticated
  using (public.e_financeiro()) with check (public.e_financeiro());

-- ---------------------------------------------------------------------
-- 6. O gatilho aceita os papéis novos sem mudança.
--
-- Ele já lê o papel do app_metadata e converte para o enum, então
-- valores novos entram sozinhos. A única regra que continua: papel
-- ausente ou fora do enum não cria perfil, e cliente sem loja também
-- não. Ver 0005.
-- ---------------------------------------------------------------------
