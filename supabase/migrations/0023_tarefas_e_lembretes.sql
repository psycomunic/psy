-- =====================================================================
-- 0023 — tarefa que se cobra sozinha
-- =====================================================================
--
-- A tabela `tarefa` existe desde a 0003 e nunca ganhou tela de escrita:
-- o painel só sabia listar. Sem prioridade, sem recorrência, sem
-- ninguém avisando de nada.
--
-- ============================================================
-- POR QUE RECORRÊNCIA É O CAMPO QUE MAIS IMPORTA AQUI
-- ============================================================
-- Operação de agência é feita de tarefa que volta: revisar campanha
-- toda segunda, fechar relatório todo dia 1, conferir verba na
-- quinzena. Sem recorrência, ou alguém recadastra tudo toda semana — e
-- para de fazer no segundo mês — ou a tarefa fica "aberta" para sempre
-- e o painel perde a noção do que é atraso.
--
-- Concluir uma tarefa recorrente ABRE A PRÓXIMA, na mesma transação. É
-- o que faz a lista continuar sendo verdade sem trabalho manual.
--
-- ============================================================
-- E POR QUE O LEMBRETE É UMA TABELA, E NÃO UM E-MAIL
-- ============================================================
-- Este projeto não tem provedor de e-mail nem de WhatsApp configurado.
-- Fingir que tem — escrever a função de envio e deixá-la falhando em
-- silêncio — seria pior que não ter: a pessoa confiaria num aviso que
-- nunca chega.
--
-- Então o lembrete nasce como LINHA em `notificacao`, que é o que o
-- painel sabe mostrar hoje, e a rotina que a gera é a mesma que um dia
-- vai alimentar o envio externo. O canal muda; a decisão de "isto
-- merece um aviso" fica num lugar só.

create type prioridade_tarefa as enum ('baixa', 'media', 'alta', 'urgente');
create type recorrencia_tarefa as enum ('nenhuma', 'diaria', 'semanal', 'quinzenal', 'mensal');

alter table tarefa
  add column if not exists prioridade      prioridade_tarefa not null default 'media',
  add column if not exists recorrencia     recorrencia_tarefa not null default 'nenhuma',
  add column if not exists recorrencia_ate date,
  /* Quantos dias ANTES do prazo o lembrete aparece. Zero = no dia. */
  add column if not exists lembrar_dias    integer not null default 1,
  add column if not exists criada_por      uuid references perfil(id) on delete set null,
  add column if not exists concluida_por   uuid references perfil(id) on delete set null,
  /* A ocorrência anterior, quando esta nasceu de uma recorrência.
     Serve para responder "há quanto tempo isso se repete?". */
  add column if not exists origem_id       uuid references tarefa(id) on delete set null;

alter table tarefa
  add constraint tarefa_lembrar_dias_valido check (lembrar_dias between 0 and 30);

/* Recorrência sem prazo não tem de onde calcular a próxima ocorrência.
   Aceitar isso criaria tarefa que se diz semanal e nunca se repete. */
alter table tarefa
  add constraint tarefa_recorrente_tem_prazo
  check (recorrencia = 'nenhuma' or prazo is not null);

create index if not exists tarefa_prazo_idx on tarefa (prazo)
  where status in ('aberta', 'fazendo');

comment on column tarefa.recorrencia is
  'Concluir uma tarefa recorrente abre a próxima automaticamente. É o que faz "revisar campanha toda segunda" continuar existindo no segundo mês.';
comment on column tarefa.lembrar_dias is
  'Dias antes do prazo em que o lembrete aparece. 0 avisa no próprio dia.';


-- =====================================================================
-- 2. Notificações
--
-- Uma linha por aviso, endereçada a UMA pessoa. Não é log: log é para
-- depois, notificação é para agora, e por isso tem `lida_em`.
--
-- `chave` é o que torna a geração idempotente. A rotina de lembretes
-- roda de hora em hora; sem uma chave estável por (assunto + dia), a
-- mesma tarefa viraria vinte e quatro avisos por dia e o sino
-- deixaria de significar alguma coisa.
-- =====================================================================
create table notificacao (
  id         bigserial primary key,
  perfil_id  uuid not null references perfil(id) on delete cascade,
  tipo       text not null check (tipo in ('tarefa_vence', 'tarefa_atrasada', 'fatura_vencida', 'aviso')),
  titulo     text not null,
  corpo      text,
  /* Para onde o clique leva. Caminho relativo: notificação com host
     dentro vira link quebrado quando o domínio muda. */
  link       text,
  chave      text not null,
  lida_em    timestamptz,
  criada_em  timestamptz not null default now()
);

create unique index notificacao_unica on notificacao (perfil_id, chave);
create index notificacao_caixa_idx on notificacao (perfil_id, lida_em, criada_em desc);

alter table notificacao enable row level security;
alter table notificacao force  row level security;

/* Cada um lê as SUAS. Não há política de leitura para as dos outros —
   nem para o administrador: aviso é correspondência, e a auditoria de
   quem fez o quê já vive em `log_auditoria`. */
create policy notificacao_minha_le on notificacao for select
  to authenticated using (perfil_id = auth.uid());

/* Marcar como lida é a única escrita pela chave pública, e só na
   própria linha. Criar notificação é papel da rotina, com a service
   role: usuário que cria o próprio aviso não é aviso, é anotação. */
create policy notificacao_minha_marca on notificacao for update
  to authenticated using (perfil_id = auth.uid()) with check (perfil_id = auth.uid());

comment on table notificacao is
  'Avisos endereçados a uma pessoa. `chave` é única por perfil e torna a geração idempotente: a rotina roda de hora em hora e não pode transformar uma tarefa em vinte e quatro avisos.';


-- =====================================================================
-- 3. Concluir tarefa, e abrir a próxima quando ela se repete
-- =====================================================================
create or replace function public.concluir_tarefa(p_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  t          record;
  v_proxima  date;
  v_nova     uuid;
begin
  if not coalesce(public.e_interno(), false) then
    raise exception 'Sem permissão para concluir tarefa.';
  end if;

  select * into t from public.tarefa where id = p_id;
  if not found then
    raise exception 'Tarefa não encontrada.';
  end if;

  if t.status = 'concluida' then
    /* Idempotente: clicar duas vezes não pode criar duas ocorrências
       seguintes da mesma tarefa recorrente. */
    return null;
  end if;

  update public.tarefa
     set status        = 'concluida',
         concluida_em  = now(),
         concluida_por = auth.uid(),
         atualizada_em = now()
   where id = p_id;

  if t.recorrencia = 'nenhuma' then
    return null;
  end if;

  /* A próxima parte do PRAZO, e não de hoje. Concluir com três dias de
     atraso não pode empurrar todas as ocorrências seguintes: a reunião
     de segunda continua sendo de segunda. */
  v_proxima := case t.recorrencia
    when 'diaria'    then t.prazo + 1
    when 'semanal'   then t.prazo + 7
    when 'quinzenal' then t.prazo + 14
    when 'mensal'    then (t.prazo + interval '1 month')::date
  end;

  if t.recorrencia_ate is not null and v_proxima > t.recorrencia_ate then
    return null;
  end if;

  insert into public.tarefa (
    conta_id, titulo, detalhe, status, responsavel_id, prazo,
    prioridade, recorrencia, recorrencia_ate, lembrar_dias,
    criada_por, origem_id
  ) values (
    t.conta_id, t.titulo, t.detalhe, 'aberta', t.responsavel_id, v_proxima,
    t.prioridade, t.recorrencia, t.recorrencia_ate, t.lembrar_dias,
    t.criada_por, p_id
  )
  returning id into v_nova;

  return v_nova;
end;
$$;

revoke execute on function public.concluir_tarefa(uuid) from public;
revoke execute on function public.concluir_tarefa(uuid) from anon;
grant  execute on function public.concluir_tarefa(uuid) to authenticated;

comment on function public.concluir_tarefa(uuid) is
  'Conclui e, se recorrente, abre a próxima a partir do PRAZO (não de hoje): concluir com atraso não empurra as ocorrências seguintes. Idempotente.';


-- =====================================================================
-- 4. A rotina que decide o que merece aviso
--
-- Roda quantas vezes quiser: o índice único em (perfil, chave) faz o
-- `on conflict do nothing` cuidar da repetição. A chave carrega o DIA,
-- então uma tarefa que segue atrasada rende um aviso por dia — que é o
-- comportamento certo, e não um por hora.
--
-- Sem responsável, o aviso vai para os ADMINISTRADORES. Tarefa órfã
-- atrasada é problema de quem toca a agência, e o silêncio aqui seria
-- exatamente o caso que ninguém vê.
-- =====================================================================
create or replace function public.gerar_lembretes()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_criadas integer := 0;
  v_hoje    date := public.hoje();
begin
  /* --- tarefa que vence dentro da janela do lembrete --------------- */
  with alvo as (
    select t.id, t.titulo, t.prazo, t.prioridade,
           coalesce(t.responsavel_id, a.id) as destino,
           (t.prazo - v_hoje) as faltam
      from public.tarefa t
      left join lateral (
        select p.id from public.perfil p
         where p.papel = 'administrador' and p.ativo
      ) a on t.responsavel_id is null
     where t.status in ('aberta', 'fazendo')
       and t.prazo is not null
       and t.prazo >= v_hoje
       and t.prazo <= v_hoje + t.lembrar_dias
  ),
  gravadas as (
    insert into public.notificacao (perfil_id, tipo, titulo, corpo, link, chave)
    select
      destino,
      'tarefa_vence',
      case when faltam = 0 then 'Vence hoje: ' || titulo
           when faltam = 1 then 'Vence amanhã: ' || titulo
           else 'Vence em ' || faltam || ' dias: ' || titulo end,
      'Prioridade ' || prioridade || '. Prazo ' || to_char(prazo, 'DD/MM/YYYY') || '.',
      '/painel/tarefas',
      'tarefa_vence:' || id || ':' || v_hoje
    from alvo
    where destino is not null
    on conflict (perfil_id, chave) do nothing
    returning 1
  )
  select count(*) into v_criadas from gravadas;

  /* --- tarefa que já passou do prazo ------------------------------- */
  with alvo as (
    select t.id, t.titulo, t.prazo,
           coalesce(t.responsavel_id, a.id) as destino,
           (v_hoje - t.prazo) as atraso
      from public.tarefa t
      left join lateral (
        select p.id from public.perfil p
         where p.papel = 'administrador' and p.ativo
      ) a on t.responsavel_id is null
     where t.status in ('aberta', 'fazendo')
       and t.prazo is not null
       and t.prazo < v_hoje
  ),
  gravadas as (
    insert into public.notificacao (perfil_id, tipo, titulo, corpo, link, chave)
    select
      destino,
      'tarefa_atrasada',
      'Atrasada há ' || atraso || case when atraso = 1 then ' dia: ' else ' dias: ' end || titulo,
      'O prazo era ' || to_char(prazo, 'DD/MM/YYYY') || '.',
      '/painel/tarefas',
      'tarefa_atrasada:' || id || ':' || v_hoje
    from alvo
    where destino is not null
    on conflict (perfil_id, chave) do nothing
    returning 1
  )
  select v_criadas + count(*) into v_criadas from gravadas;

  /* --- fatura vencida: vai para administrador e financeiro --------- */
  with alvo as (
    select f.id, f.numero, f.valor, f.vencimento, c.nome as cliente, p.id as destino
      from public.fatura f
      join public.conta c on c.id = f.conta_id
      cross join public.perfil p
     where f.status not in ('paga', 'cancelada')
       and f.vencimento < v_hoje
       and p.ativo
       and p.papel in ('administrador', 'financeiro')
  ),
  gravadas as (
    insert into public.notificacao (perfil_id, tipo, titulo, corpo, link, chave)
    select
      destino,
      'fatura_vencida',
      'Cobrança vencida: ' || cliente,
      numero || ' · R$ ' || to_char(valor, 'FM999G999G990D00')
        || ' · venceu em ' || to_char(vencimento, 'DD/MM/YYYY'),
      '/painel/financeiro?aba=cobrancas',
      'fatura_vencida:' || id || ':' || v_hoje
    from alvo
    on conflict (perfil_id, chave) do nothing
    returning 1
  )
  select v_criadas + count(*) into v_criadas from gravadas;

  return v_criadas;
end;
$$;

revoke execute on function public.gerar_lembretes() from public;
revoke execute on function public.gerar_lembretes() from anon;
revoke execute on function public.gerar_lembretes() from authenticated;

comment on function public.gerar_lembretes() is
  'Cria as notificações do dia: tarefa perto do prazo, tarefa atrasada, fatura vencida. Idempotente pela chave, que carrega o dia — repetir na mesma hora não duplica, e um atraso que continua rende um aviso por dia. Só a service role executa: é rotina, não ação de usuário.';


-- =====================================================================
-- 5. A caixa de avisos de quem está logado
--
-- View em vez de consulta solta porque a contagem de não lidas aparece
-- no menu de TODA página. Uma view mantém a definição num lugar só.
-- =====================================================================
create or replace view minhas_notificacoes
with (security_invoker = on) as
select n.id, n.tipo, n.titulo, n.corpo, n.link, n.lida_em, n.criada_em
  from notificacao n
 where n.perfil_id = auth.uid()
 order by n.criada_em desc;

grant select on minhas_notificacoes to authenticated;
