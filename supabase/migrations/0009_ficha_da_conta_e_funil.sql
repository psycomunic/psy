-- =====================================================================
-- 0009 - FASE 2: ficha da conta, funil completo e conversão atômica.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Ciclo de vida da loja
--
-- `conta.ativa` era um booleano. Booleano não distingue a loja que ainda
-- não começou da que foi embora, e as duas somem do painel do mesmo
-- jeito. Sem essa distinção não existe churn: não dá para contar quem
-- saiu se "não ativo" também significa "ainda não entrou".
-- ---------------------------------------------------------------------
create type situacao_conta as enum (
  'prospect', 'onboarding', 'ativa', 'pausada', 'encerrada'
);

alter table conta
  add column if not exists slug            text,
  add column if not exists razao_social     text,
  add column if not exists segmento         text,
  add column if not exists situacao         situacao_conta not null default 'ativa',
  add column if not exists data_inicio      date,
  add column if not exists data_encerramento date,
  add column if not exists motivo_encerramento text,
  add column if not exists logo_url         text,
  add column if not exists cor_marca        text,
  add column if not exists responsavel_id   uuid references perfil(id) on delete set null,
  add column if not exists observacoes      text;

/* A coluna antiga vira derivada da nova, para nada que já lê `ativa`
   quebrar. Só 'ativa' e 'onboarding' contam como carteira viva:
   prospect ainda não paga, pausada não está sendo operada. */
update conta
   set situacao = (case when ativa then 'ativa' else 'encerrada' end)::situacao_conta;

create unique index if not exists conta_slug_unico on conta(slug) where slug is not null;
create index if not exists conta_situacao_idx on conta(situacao);

-- ---------------------------------------------------------------------
-- 2. O funil ganha o que faltava para ser acionável
--
-- `proximo_passo` com data é a diferença entre um CRM que lista e um que
-- cobra. Sem ele, "em negociação" é um estado onde o lead fica até
-- alguém lembrar.
-- ---------------------------------------------------------------------
alter table lead
  add column if not exists proximo_passo        text,
  add column if not exists proximo_passo_em     date,
  add column if not exists estagio_desde        timestamptz not null default now(),
  add column if not exists probabilidade        integer,
  add column if not exists valor_verba_estimada numeric(12,2),
  add column if not exists telefone_extra       text;

alter table lead
  add constraint probabilidade_valida
  check (probabilidade is null or (probabilidade >= 0 and probabilidade <= 100));

/*
  `estagio_desde` precisa ser mantido pelo BANCO, e não pela tela.

  Se a atualização dependesse de quem move o card, bastaria uma alteração
  por SQL, por importação ou por outra tela para o relógio parar — e o
  alerta de "lead parado" passaria a mentir justamente nos leads que
  ninguém está tocando, que são os que ele existe para pegar.
*/
create or replace function public.tocar_estagio_desde()
returns trigger
language plpgsql
set search_path = ''
as $fn$
begin
  if new.estagio is distinct from old.estagio then
    new.estagio_desde = now();
  end if;
  return new;
end;
$fn$;

create trigger lead_estagio_desde before update on lead
  for each row execute function public.tocar_estagio_desde();

-- ---------------------------------------------------------------------
-- 3. Interação ganha o vínculo com quem foi feito
-- ---------------------------------------------------------------------
alter table interacao
  add column if not exists conta_id uuid references conta(id) on delete cascade;

create index if not exists interacao_conta_idx on interacao(conta_id, criada_em desc);

-- =====================================================================
-- 4. A CONVERSÃO DE LEAD EM CLIENTE
--
-- Uma função de banco, e não uma sequência de chamadas do aplicativo.
--
-- O motivo é atomicidade real. Ganhar um lead cria a loja, o contrato, o
-- vínculo do responsável e as tarefas de onboarding. Feito em cinco
-- requisições pelo PostgREST, uma falha no meio deixa loja sem contrato,
-- ou contrato sem tarefa, e alguém descobre semanas depois.
--
-- Aqui é tudo ou nada: a função inteira roda numa transação.
-- =====================================================================
create or replace function public.converter_lead(
  p_lead_id      uuid,
  p_fee_mensal   numeric,
  p_dia_vencimento integer default 10,
  p_plataforma   text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_lead      public.lead%rowtype;
  v_conta_id  uuid;
  v_nome      text;
  v_tarefa    text;
begin
  -- Só quem pode mexer no comercial converte.
  if not (public.papel_atual() in ('administrador','gestor','comercial')) then
    raise exception 'Sem permissão para converter lead.';
  end if;

  select * into v_lead from public.lead where id = p_lead_id;
  if not found then
    raise exception 'Lead não encontrado.';
  end if;

  if v_lead.conta_id is not null then
    raise exception 'Este lead já virou cliente.';
  end if;

  v_nome := coalesce(nullif(v_lead.empresa, ''), v_lead.nome);

  if exists (select 1 from public.conta where lower(nome) = lower(v_nome)) then
    raise exception 'Já existe uma loja chamada "%".', v_nome;
  end if;

  insert into public.conta (nome, plataforma, situacao, data_inicio, responsavel_id)
  values (v_nome, p_plataforma, 'onboarding', current_date, v_lead.responsavel_id)
  returning id into v_conta_id;

  insert into public.contrato (conta_id, plano, fee_mensal, inicio)
  values (v_conta_id, 'A definir', p_fee_mensal, current_date);

  -- O responsável comercial passa a enxergar a loja que ele trouxe.
  if v_lead.responsavel_id is not null then
    insert into public.acessos_conta (usuario_id, conta_id, responsavel, aceito_em)
    values (v_lead.responsavel_id, v_conta_id, true, now())
    on conflict (usuario_id, conta_id) do nothing;
  end if;

  /*
    Onboarding não é lembrete: é a diferença entre um cliente que começa
    a ver resultado no primeiro mês e um que fica esperando. Por isso as
    tarefas nascem junto, e não "quando alguém lembrar".
  */
  foreach v_tarefa in array array[
    'Kick off: entender desafios, prioridades e metas',
    'Conectar Google Ads, Meta e a plataforma da loja',
    'Definir a meta de receita do primeiro mês',
    'Diagnóstico das quatro frentes',
    'Apresentar o plano de mídia'
  ] loop
    insert into public.tarefa (conta_id, titulo, responsavel_id, prazo, status)
    values (v_conta_id, v_tarefa, v_lead.responsavel_id, current_date + 7, 'aberta');
  end loop;

  update public.lead
     set estagio = 'ganho',
         conta_id = v_conta_id
   where id = p_lead_id;

  insert into public.marco_conta (conta_id, dia, tipo, titulo, detalhe, autor_id)
  values (v_conta_id, current_date, 'outro', 'Início da operação',
          format('Convertido do lead %s.', coalesce(v_lead.empresa, v_lead.nome)),
          auth.uid());

  return v_conta_id;
end;
$fn$;

revoke all on function public.converter_lead(uuid, numeric, integer, text) from public;
grant execute on function public.converter_lead(uuid, numeric, integer, text) to authenticated;

-- =====================================================================
-- 5. Health score
--
-- A view antiga olhava só receita, MER e meta. O documento pede também
-- tarefa atrasada, inadimplência e tempo desde a última interação —
-- porque conta que perde contrato raramente perde por número ruim
-- sozinho: perde por número ruim MAIS silêncio.
-- =====================================================================
drop view if exists saude_conta;

create view saude_conta
with (security_invoker = on) as
with janela as (
  select
    conta_id,
    sum(receita)      filter (where dia >  current_date - 7)  as receita_7,
    sum(receita)      filter (where dia <= current_date - 7
                               and dia >  current_date - 14)  as receita_7_ant,
    sum(investimento) filter (where dia >  current_date - 7)  as inv_7,
    sum(investimento) filter (where dia <= current_date - 7
                               and dia >  current_date - 14)  as inv_7_ant,
    max(dia)                                                  as ultimo_dia
  from kpi_diario
  where dia > current_date - 14
  group by conta_id
),
operacao as (
  select
    c.id as conta_id,
    (select count(*)::int from tarefa t
      where t.conta_id = c.id
        and t.status in ('aberta','fazendo')
        and t.prazo < current_date)                       as tarefas_atrasadas,
    (select coalesce(sum(f.valor), 0) from fatura f
      where f.conta_id = c.id
        and f.status <> 'cancelada'
        and f.paga_em is null
        and f.vencimento < current_date)                  as inadimplencia,
    (select (current_date - max(m.dia))::int from marco_conta m
      where m.conta_id = c.id)                            as dias_sem_registro
  from conta c
)
select
  c.id   as conta_id,
  c.nome as conta_nome,
  j.receita_7,
  j.receita_7_ant,
  j.ultimo_dia,

  case when j.receita_7_ant > 0
       then round(100.0 * (j.receita_7 - j.receita_7_ant) / j.receita_7_ant, 1) end
       as variacao_receita,

  case when j.inv_7 > 0     then round(j.receita_7 / j.inv_7, 2) end     as mer_7,
  case when j.inv_7_ant > 0 then round(j.receita_7_ant / j.inv_7_ant, 2) end as mer_7_ant,

  km.meta_atingida,

  case
    when j.ultimo_dia is null or j.ultimo_dia < current_date - 2 then 'sem_dado'
    when j.receita_7_ant > 0
         and (j.receita_7 - j.receita_7_ant) / j.receita_7_ant < -0.25 then 'critico'
    when j.inv_7 > 0 and j.receita_7 / j.inv_7 < 1                     then 'critico'
    when o.inadimplencia > 0                                           then 'atencao'
    when j.receita_7_ant > 0
         and (j.receita_7 - j.receita_7_ant) / j.receita_7_ant < -0.10 then 'atencao'
    when km.meta_atingida is not null and km.meta_atingida < 70        then 'atencao'
    when o.tarefas_atrasadas >= 3                                      then 'atencao'
    else 'saudavel'
  end as situacao,

  -- Colunas novas, no fim: `create or replace view` exige que as
  -- anteriores mantenham nome e ordem.
  o.tarefas_atrasadas,
  o.inadimplencia,
  o.dias_sem_registro,

  /*
    Pontuação de 0 a 100, por DESCONTO a partir de 100.

    Somar pontos positivos obriga a inventar peso para "estar normal".
    Descontar é mais honesto: a conta começa saudável e cada problema
    tira um pedaço, na proporção do estrago que causa.

    O maior desconto é o silêncio. Cliente que não recebe notícia há um
    mês cancela mesmo com número bom, e é o único item desta lista que
    depende só da agência.
  */
  greatest(0, least(100,
    100
    - case when j.ultimo_dia is null or j.ultimo_dia < current_date - 2 then 30 else 0 end
    - case when km.meta_atingida is null then 0
           when km.meta_atingida >= 90 then 0
           when km.meta_atingida >= 70 then 10
           else 20 end
    - case when j.receita_7_ant is null or j.receita_7_ant = 0 then 0
           when (j.receita_7 - j.receita_7_ant) / j.receita_7_ant < -0.25 then 25
           when (j.receita_7 - j.receita_7_ant) / j.receita_7_ant < -0.10 then 12
           else 0 end
    - case when j.inv_7 > 0 and j.receita_7 / j.inv_7 < 1 then 20 else 0 end
    - least(o.tarefas_atrasadas * 5, 15)
    - case when o.inadimplencia > 0 then 15 else 0 end
    - case when o.dias_sem_registro is null then 10
           when o.dias_sem_registro > 30 then 20
           when o.dias_sem_registro > 14 then 8
           else 0 end
  ))::int as pontuacao

from conta c
left join janela   j  on j.conta_id  = c.id
left join kpi_mes  km on km.conta_id = c.id
left join operacao o  on o.conta_id  = c.id
where c.situacao in ('ativa', 'onboarding');

grant select on saude_conta to authenticated;

/* `kpi_mes` também precisa acompanhar o novo ciclo de vida: ela filtrava
   por `c.ativa`, que agora é a coluna derivada. */
create or replace view kpi_mes
with (security_invoker = on) as
select
  c.id                                as conta_id,
  c.nome                              as conta_nome,
  date_trunc('month', current_date)::date as mes,
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
          (date_trunc('month', current_date) + interval '1 month - 1 day')::date
          - current_date + 1,
          1),
      2)
  end as receita_dia_necessaria
from conta c
left join kpi_diario k
       on k.conta_id = c.id
      and k.dia >= date_trunc('month', current_date)::date
left join meta_conta mt
       on mt.conta_id = c.id
      and mt.mes = date_trunc('month', current_date)::date
where c.situacao in ('ativa', 'onboarding')
group by c.id, c.nome, mt.receita_meta, mt.roas_alvo, mt.cac_teto;

-- =====================================================================
-- 6. Métricas do funil
-- =====================================================================

/*
  O rename vem ANTES da view que usa a coluna.

  Tudo aqui roda numa transação só, e criar a view referenciando o nome
  novo antes do rename falharia com "column does not exist". Foi o que
  aconteceu na primeira escrita deste arquivo.

  Motivo do rename: com `valor_verba_estimada` ao lado, um campo chamado
  só `valor_estimado` não diz estimado de quê. Fee e verba são coisas
  diferentes e o sistema inteiro depende de não confundi-las.
*/
alter table lead rename column valor_estimado to valor_fee_estimado;

create or replace view funil_comercial
with (security_invoker = on) as
select
  l.estagio,
  count(*)::int                                   as quantidade,
  coalesce(sum(l.valor_fee_estimado), 0)          as valor_total,
  /* Previsão PONDERADA pela probabilidade. A soma crua do funil é sempre
     otimista: trata como certo o lead que ainda não respondeu. */
  coalesce(sum(l.valor_fee_estimado * coalesce(l.probabilidade, 50) / 100.0), 0)
                                                  as valor_ponderado,
  round(avg(extract(epoch from (now() - l.estagio_desde)) / 86400)::numeric, 1)
                                                  as dias_medios_no_estagio,
  count(*) filter (where l.estagio_desde < now() - interval '7 days')::int
                                                  as parados
from lead l
group by l.estagio;

grant select on funil_comercial to authenticated;

