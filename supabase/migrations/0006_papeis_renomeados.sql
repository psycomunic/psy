-- =====================================================================
-- 0006 - FASE 0, parte 1: vocabulário de papéis e RLS que faltava.
--
-- POR QUE ISTO É DUAS MIGRAÇÕES E NÃO UMA
-- `alter type ... add value` roda dentro de transação no Postgres 12+,
-- mas o valor novo NÃO PODE SER USADO na mesma transação. O aplicador
-- (scripts/migrar.mjs) envolve cada arquivo numa transação, de
-- propósito, para migração aplicada pela metade não existir.
--
-- Então: aqui os valores nascem. Em 0007 eles passam a ser usados.
--
-- POR QUE RENOMEAR EM VEZ DE CRIAR NOVOS
-- `alter type ... rename value` preserva o oid do valor. As linhas de
-- `perfil.papel` e as políticas que comparam com o literal continuam
-- valendo sem uma linha de update, porque ambas guardam o oid, e não o
-- texto.
--
-- A exceção são os CORPOS DE FUNÇÃO, que são texto: `e_interno()` tem
-- 'admin' escrito dentro. Esses quebram no primeiro uso depois do
-- rename, e por isso são reescritos aqui embaixo.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. A tabela de controle do aplicador estava sem RLS.
--
-- Ela não guarda dado de cliente, mas expõe o histórico de migrações,
-- que é mapa da estrutura interna. E "RLS em todas as tabelas, sem
-- exceção" só vale como regra se não tiver exceção.
--
-- Sem política nenhuma: ninguém lê pela chave pública. Quem escreve é o
-- aplicador, conectado direto no Postgres, que não passa por RLS.
-- ---------------------------------------------------------------------
alter table migracao_aplicada enable row level security;
alter table migracao_aplicada force  row level security;

comment on table migracao_aplicada is
  'Controle do aplicador de migrações. RLS ligado sem política: nenhuma linha via chave pública.';

-- ---------------------------------------------------------------------
-- 2. Renomeia os três papéis internos para o vocabulário do produto.
-- ---------------------------------------------------------------------
alter type papel_usuario rename value 'admin'    to 'administrador';
alter type papel_usuario rename value 'vendedor' to 'comercial';
alter type papel_usuario rename value 'cs'       to 'operador';

-- ---------------------------------------------------------------------
-- 3. Os três papéis novos. Só ficam utilizáveis em 0007.
-- ---------------------------------------------------------------------
alter type papel_usuario add value if not exists 'gestor'          after 'administrador';
alter type papel_usuario add value if not exists 'financeiro'      after 'comercial';
alter type papel_usuario add value if not exists 'cliente_leitura' after 'cliente';

-- ---------------------------------------------------------------------
-- 4. Corpos de função que tinham o nome antigo escrito em texto.
--
-- Ainda sem os papéis novos: eles não podem ser referenciados nesta
-- transação. 0007 completa.
-- ---------------------------------------------------------------------
create or replace function public.e_interno()
returns boolean
language sql
stable
security definer
set search_path = ''
as $fn$
  select coalesce(
    public.papel_atual() in ('administrador','comercial','operador'),
    false)
$fn$;

create or replace function public.e_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $fn$
  select coalesce(public.papel_atual() = 'administrador', false)
$fn$;

-- ---------------------------------------------------------------------
-- 5. app_metadata dos usuários existentes.
--
-- `perfil.papel` migra sozinho pelo oid, mas o app_metadata em
-- auth.users guarda o papel como TEXTO. Deixá-lo em 'admin' faria o
-- gatilho falhar no cast na próxima vez que o metadado mudasse, e o
-- efeito seria o usuário perder o perfil sem erro visível.
-- ---------------------------------------------------------------------
update auth.users
   set raw_app_meta_data = jsonb_set(
         raw_app_meta_data,
         '{papel}',
         to_jsonb(
           case raw_app_meta_data ->> 'papel'
             when 'admin'    then 'administrador'
             when 'vendedor' then 'comercial'
             when 'cs'       then 'operador'
             else raw_app_meta_data ->> 'papel'
           end))
 where raw_app_meta_data ->> 'papel' in ('admin','vendedor','cs');
