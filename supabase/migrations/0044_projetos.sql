-- =====================================================================
-- 0044 - Projetos: o que está sendo entregue, e em que pé está.
--
-- POR QUE NÃO É UM CAMPO EM `tarefa`
--
-- Tarefa é item com prazo: faz, conclui, some. Projeto é entrega com
-- ciclo de vida: nasce em briefing, anda, volta em alteração, espera o
-- cliente, entrega. Um site em alteração há duas semanas não é uma
-- tarefa atrasada, é um projeto parado esperando resposta, e a pergunta
-- que ele responde é outra.
--
-- Guardar os dois na mesma tabela obrigaria `status_tarefa` a crescer
-- com estados que não significam nada para uma tarefa, e o relatório de
-- tarefa atrasada passaria a contar projeto como atraso.
--
-- As duas coisas convivem: um projeto PODE ter tarefas, e quem quiser
-- ligá-las usa a conta em comum. Não criei a chave estrangeira entre
-- elas porque ninguém pediu, e coluna que ninguém preenche é coluna que
-- confunde quem lê a tabela depois.
--
-- O QUE CADA SITUAÇÃO QUER DIZER
--
--   briefing            combinado, ainda não começou
--   andamento           está sendo feito agora
--   alteracao           foi entregue e voltou com ajuste pedido
--   aguardando_cliente  parado esperando material, acesso ou resposta
--   entregue            fechado
--   pausado             parado por decisão, e não por espera
--
-- `alteracao` e `aguardando_cliente` existem separadas de propósito. As
-- duas param o projeto, mas uma é trabalho que voltou para a mesa e a
-- outra é trabalho que não pode andar. Quem olha a lista para decidir o
-- dia precisa saber qual das duas é.
--
-- POR QUE `cliente` É TEXTO ALÉM DE `conta_id`
--
-- Projeto aparece antes do contrato. A logo é feita para quem ainda é
-- lead, a landing page para quem está testando. Exigir uma conta criada
-- antes de registrar o projeto faria o projeto não ser registrado, e o
-- painel existe para saber o que falta terminar.
--
-- Quando a conta existir, `conta_id` manda e o texto fica de lado: é a
-- `coalesce` da consulta que decide, e não duas verdades no banco.
-- =====================================================================

create type projeto_tipo as enum (
  'site', 'lp', 'ecommerce', 'sistema', 'logo', 'identidade', 'outro'
);

create type projeto_situacao as enum (
  'briefing', 'andamento', 'alteracao', 'aguardando_cliente', 'entregue', 'pausado'
);

create table projeto (
  id             uuid primary key default gen_random_uuid(),
  nome           text not null,
  tipo           projeto_tipo not null default 'site',

  /* `set null`, e não `cascade`: apagar a conta não pode apagar o
     registro de um trabalho que foi feito. O projeto perde o vínculo e
     mantém o nome do cliente em `cliente`. */
  conta_id       uuid references conta(id) on delete set null,
  cliente        text,

  situacao       projeto_situacao not null default 'briefing',
  responsavel_id uuid references perfil(id) on delete set null,
  prazo          date,

  /* Preview, repositório, Figma. Um projeto que ninguém acha é um
     projeto que vai ser refeito. */
  link           text,
  observacoes    text,

  /* Mantidos pelo BANCO, por gatilho, e não pela tela. Se dependessem
     de quem clica, uma alteração por SQL pararia o relógio, e o aviso
     de "parado há X dias" mentiria justamente no projeto esquecido,
     que é o que ele existe para pegar. */
  situacao_desde timestamptz not null default now(),
  entregue_em    date,

  criado_em      timestamptz not null default now(),
  atualizado_em  timestamptz not null default now()
);

create index projeto_situacao_idx   on projeto(situacao);
create index projeto_prazo_idx      on projeto(prazo) where situacao <> 'entregue';
create index projeto_responsavel_idx on projeto(responsavel_id);

comment on table projeto is
  'Entregas com ciclo de vida: site, LP, e-commerce, sistema, logo, identidade. NÃO confundir com tarefa, que é item com prazo.';
comment on column projeto.cliente is
  'Nome livre, para quando o cliente ainda não é conta. Com conta_id preenchido, quem manda é a conta.';
comment on column projeto.situacao_desde is
  'Mantido por gatilho. É daqui que sai "parado há X dias".';

-- ---------------------------------------------------------------------
-- O relógio da situação, e a data de entrega
--
-- Os dois no mesmo gatilho porque mudam pelo mesmo motivo: a situação
-- mudou. Separados, seriam duas leituras da mesma linha para responder
-- a mesma pergunta.
--
-- `entregue_em` é LIMPO quando o projeto sai de entregue. Projeto que
-- volta em alteração não está mais entregue, e manter a data faria o
-- relatório do mês contar uma entrega que foi desfeita.
-- ---------------------------------------------------------------------
create or replace function public.tocar_situacao_projeto()
returns trigger
language plpgsql
set search_path = ''
as $fn$
begin
  if new.situacao is distinct from old.situacao then
    new.situacao_desde := now();
    new.entregue_em := case when new.situacao = 'entregue' then current_date end;
  end if;
  return new;
end;
$fn$;

drop trigger if exists projeto_situacao_desde on projeto;
create trigger projeto_situacao_desde before update on projeto
  for each row execute function public.tocar_situacao_projeto();

drop trigger if exists projeto_toca on projeto;
create trigger projeto_toca before update on projeto
  for each row execute function public.tocar_atualizado_em();

-- ---------------------------------------------------------------------
-- RLS
--
-- Mesma regra de `tarefa`, e pelo mesmo motivo: é trabalho interno da
-- agência. Interno lê e escreve, só o administrador apaga.
--
-- Cliente não recebe linha nenhuma. Não há política para ele, e sem
-- política a linha não volta: a ausência AQUI é o que protege. Um dia
-- isto pode virar "o cliente vê os projetos da própria loja", e nesse
-- dia a política nova passa por `tem_acesso_conta()`, como as outras.
-- ---------------------------------------------------------------------
alter table projeto enable row level security;
alter table projeto force  row level security;

create policy projeto_interno_le on projeto for select
  to authenticated using (public.e_interno());

create policy projeto_interno_cria on projeto for insert
  to authenticated with check (public.e_interno());

create policy projeto_interno_altera on projeto for update
  to authenticated using (public.e_interno()) with check (public.e_interno());

create policy projeto_admin_exclui on projeto for delete
  to authenticated using (public.e_admin());

-- Apagar projeto é irreversível e leva o histórico junto, como em
-- `lead`. Só o DELETE é auditado: criar e mover acontecem o dia inteiro.
drop trigger if exists projeto_auditoria_delete on projeto;
create trigger projeto_auditoria_delete after delete on projeto
  for each row execute function public.registrar_auditoria();
