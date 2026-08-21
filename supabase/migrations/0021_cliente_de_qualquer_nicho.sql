-- =====================================================================
-- 0021 — cliente que não é loja
-- =====================================================================
--
-- A plataforma nasceu assumindo que todo cliente vende online: `conta`
-- tem plataforma de e-commerce, o health score desconta por meta de
-- receita não batida, e o painel chama todo mundo de "loja".
--
-- Mas a carteira tem chalé, concessionária e outros nichos onde a
-- agência faz só tráfego. Para eles, o e-commerce não existe: não há
-- pedido, não há ticket médio, e a receita que importa acontece fora de
-- qualquer sistema que a gente integre.
--
-- ============================================================
-- POR QUE ISSO NÃO É SÓ UM RÓTULO
-- ============================================================
-- Sem distinguir o tipo, um chalé entra e o painel diz que ele está
-- CRÍTICO — para sempre. O health score desconta 20 pontos por "gastou
-- em mídia e não teve receita", e um cliente de tráfego puro nunca vai
-- ter receita registrada aqui. O semáforo passaria a mentir sobre a
-- metade da carteira, e um semáforo que mente é pior que semáforo
-- nenhum: ninguém mais olha para o vermelho.
--
-- Então o tipo muda o CÁLCULO, e não só a palavra na tela.

create type tipo_conta as enum ('ecommerce', 'trafego', 'outro');

alter table conta
  add column if not exists tipo tipo_conta not null default 'ecommerce';

comment on column conta.tipo is
  'ecommerce: loja com plataforma e métrica de venda. trafego: a agência faz só mídia, e receita de venda não passa por aqui. outro: qualquer outro arranjo. Muda o health score, não só o rótulo.';

comment on column conta.segmento is
  'O nicho, em texto livre: chalés, concessionária, clínica. Serve para agrupar a carteira e para a proposta falar a língua do cliente.';


-- =====================================================================
-- 2. O health score que sabe de que cliente está falando
--
-- Os descontos ficam divididos em dois grupos:
--
--   universais    silêncio, tarefa atrasada, inadimplência, falta de
--                 registro no diário. Valem para qualquer cliente,
--                 porque medem a AGÊNCIA.
--
--   de e-commerce meta de receita, queda de receita, ROAS abaixo de 1.
--                 Só fazem sentido onde existe venda registrada.
--
-- Um cliente de tráfego com a operação em dia tira 100, como deve.
-- =====================================================================
drop view if exists saude_conta;

create view saude_conta
with (security_invoker = on) as
with janela as (
  select
    k.conta_id,
    max(k.dia) as ultimo_dia,
    coalesce(sum(k.receita)      filter (where k.dia >= current_date - 7),  0) as receita_7,
    coalesce(sum(k.receita)      filter (where k.dia >= current_date - 14
                                           and k.dia <  current_date - 7),  0) as receita_7_ant,
    coalesce(sum(k.investimento) filter (where k.dia >= current_date - 7),  0) as inv_7
  from kpi_diario k
  where k.dia >= current_date - 14
  group by k.conta_id
),
operacao as (
  select
    c.id as conta_id,
    (select count(*) from tarefa t
      where t.conta_id = c.id
        and t.status in ('aberta', 'fazendo')
        and t.prazo is not null
        and t.prazo < current_date) as tarefas_atrasadas,
    (select coalesce(sum(f.valor), 0) from fatura f
      where f.conta_id = c.id
        and f.status not in ('paga', 'cancelada')
        and f.vencimento < current_date) as inadimplencia,
    (select current_date - max(m.dia) from marco_conta m
      where m.conta_id = c.id) as dias_sem_registro
  from conta c
)
select
  c.id   as conta_id,
  c.nome as conta_nome,
  c.tipo,
  j.ultimo_dia,

  case
    when j.receita_7_ant is null or j.receita_7_ant = 0 then null
    else round(100.0 * (j.receita_7 - j.receita_7_ant) / j.receita_7_ant, 1)
  end as variacao_receita,

  case
    when j.ultimo_dia is null or j.ultimo_dia < current_date - 2 then 'sem_dado'
    when o.inadimplencia > 0 then 'critico'
    when c.tipo = 'ecommerce'
         and j.inv_7 > 0 and j.receita_7 / j.inv_7 < 1 then 'critico'
    when o.tarefas_atrasadas > 0 then 'atencao'
    when c.tipo = 'ecommerce'
         and j.receita_7_ant > 0
         and (j.receita_7 - j.receita_7_ant) / j.receita_7_ant < -0.10 then 'atencao'
    else 'saudavel'
  end as situacao,

  greatest(0, least(100,
    100
    /* --- universais: medem a agência ---------------------------- */
    - case when j.ultimo_dia is null or j.ultimo_dia < current_date - 2 then 30 else 0 end
    - least(o.tarefas_atrasadas * 5, 15)
    - case when o.inadimplencia > 0 then 15 else 0 end
    - case when o.dias_sem_registro is null then 10
           when o.dias_sem_registro > 30 then 20
           when o.dias_sem_registro > 14 then 8
           else 0 end

    /* --- só onde existe venda registrada ------------------------- */
    - case when c.tipo <> 'ecommerce' then 0
           when km.meta_atingida is null then 0
           when km.meta_atingida >= 90 then 0
           when km.meta_atingida >= 70 then 10
           else 20 end
    - case when c.tipo <> 'ecommerce' then 0
           when j.receita_7_ant is null or j.receita_7_ant = 0 then 0
           when (j.receita_7 - j.receita_7_ant) / j.receita_7_ant < -0.25 then 25
           when (j.receita_7 - j.receita_7_ant) / j.receita_7_ant < -0.10 then 12
           else 0 end
    - case when c.tipo <> 'ecommerce' then 0
           when j.inv_7 > 0 and j.receita_7 / j.inv_7 < 1 then 20
           else 0 end
  ))::int as pontuacao

from conta c
left join janela   j  on j.conta_id  = c.id
left join kpi_mes  km on km.conta_id = c.id
left join operacao o  on o.conta_id  = c.id
where c.situacao in ('ativa', 'onboarding');

grant select on saude_conta to authenticated;

comment on view saude_conta is
  'Semáforo e nota de 0 a 100. Os descontos de venda (meta, queda de receita, ROAS) só valem para conta do tipo ecommerce: cliente de tráfego puro não registra receita aqui, e puni-lo por isso faria o semáforo mentir sobre metade da carteira.';


-- =====================================================================
-- 3. Cobrança recorrente de verdade
--
-- Até agora a recorrência era um clique por mês em "Faturar". Funciona,
-- e depende de alguém lembrar. Um mês esquecido é um mês não cobrado, e
-- ninguém percebe até fechar o caixa.
--
-- A assinatura do Asaas emite sozinha, todo mês, e avisa por webhook. O
-- contrato passa a poder apontar para ela.
--
-- `dia_vencimento` sai do fixo 10 que estava escondido em
-- `emitir_fatura`: cliente que paga todo dia 5 não deveria depender de
-- alguém achar aquela linha de SQL.
-- =====================================================================
alter table contrato
  add column if not exists dia_vencimento integer not null default 10,
  add column if not exists asaas_assinatura_id text;

alter table contrato
  add constraint contrato_dia_vencimento_valido
  check (dia_vencimento between 1 and 28);

create unique index if not exists contrato_assinatura_unica
  on contrato (asaas_assinatura_id)
  where asaas_assinatura_id is not null;

comment on column contrato.dia_vencimento is
  'Dia do mês em que a fatura vence. Até 28 de propósito: 29, 30 e 31 não existem em todo mês, e o Asaas empurraria para o mês seguinte em fevereiro.';

comment on column contrato.asaas_assinatura_id is
  'Assinatura no Asaas, quando a cobrança é automática. Com ela, quem emite a fatura mensal é o Asaas, e o webhook cria a linha aqui.';

/* A fatura precisa saber que veio de assinatura: é por aí que o webhook
   de uma cobrança que este painel nunca criou encontra o contrato. */
alter table fatura
  add column if not exists asaas_assinatura_id text;

create index if not exists fatura_assinatura_idx
  on fatura (asaas_assinatura_id)
  where asaas_assinatura_id is not null;


-- =====================================================================
-- 4. emitir_fatura respeita o dia de vencimento do contrato
-- =====================================================================
create or replace function public.emitir_fatura(
  p_contrato_id uuid,
  p_competencia date
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_contrato  record;
  v_fatura_id uuid;
  v_venc      date;
  v_numero    text;
  v_mes       date;
begin
  if not coalesce(
       public.papel_atual() in ('administrador', 'financeiro'),
       false) then
    raise exception 'Sem permissão para emitir fatura.';
  end if;

  select * into v_contrato from public.contrato where id = p_contrato_id;
  if not found then
    raise exception 'Contrato não encontrado.';
  end if;

  v_mes := date_trunc('month', p_competencia)::date;

  if v_mes < date_trunc('month', v_contrato.inicio)::date then
    raise exception 'Este contrato começa em % e não fatura %.',
      to_char(v_contrato.inicio, 'DD/MM/YYYY'), to_char(v_mes, 'MM/YYYY');
  end if;

  if v_contrato.fim is not null
     and v_mes > date_trunc('month', v_contrato.fim)::date then
    raise exception 'Este contrato terminou em % e não fatura %.',
      to_char(v_contrato.fim, 'DD/MM/YYYY'), to_char(v_mes, 'MM/YYYY');
  end if;

  select id into v_fatura_id
    from public.fatura
   where contrato_id = p_contrato_id
     and competencia = v_mes;

  if v_fatura_id is not null then
    return v_fatura_id;
  end if;

  /* O dia vem do contrato agora. O 10 continua sendo o padrão, mas
     virou default de coluna, que é onde dá para mudar sem editar SQL. */
  v_venc := v_mes + (coalesce(v_contrato.dia_vencimento, 10) - 1);

  v_numero := to_char(p_competencia, 'YYYYMM') || '-' || substr(p_contrato_id::text, 1, 8);

  insert into public.fatura (
    conta_id, contrato_id, numero, status, valor, competencia, vencimento
  ) values (
    v_contrato.conta_id,
    p_contrato_id,
    v_numero,
    'aberta',
    v_contrato.fee_mensal,
    v_mes,
    v_venc
  )
  returning id into v_fatura_id;

  return v_fatura_id;
end;
$$;

revoke execute on function public.emitir_fatura(uuid, date) from public;
revoke execute on function public.emitir_fatura(uuid, date) from anon;
grant  execute on function public.emitir_fatura(uuid, date) to authenticated;


-- =====================================================================
-- 5. A fatura que nasce de uma assinatura
--
-- O Asaas cria a cobrança sozinho todo mês. O webhook chega falando de
-- uma cobrança que este painel nunca viu, e sem esta função ela viraria
-- só uma linha em `cobranca_evento` dizendo "não encontrada" — dinheiro
-- entrando sem aparecer em indicador nenhum.
--
-- SECURITY DEFINER porque quem chama é o webhook, que não tem sessão.
-- A validação é a existência da assinatura: só cria fatura para
-- contrato que ESTE painel ligou ao Asaas.
-- =====================================================================
create or replace function public.fatura_de_assinatura(
  p_assinatura text,
  p_asaas_id   text,
  p_valor      numeric,
  p_vencimento date
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_contrato record;
  v_id       uuid;
  v_mes      date;
begin
  select * into v_contrato
    from public.contrato
   where asaas_assinatura_id = p_assinatura;

  if not found then
    return null;
  end if;

  /* Já existe? A cobrança pode chegar duas vezes: o Asaas reenvia, e
     PAYMENT_CREATED e PAYMENT_UPDATED falam da mesma linha. */
  select id into v_id from public.fatura where asaas_id = p_asaas_id;
  if v_id is not null then
    return v_id;
  end if;

  /* A competência é o mês do VENCIMENTO. Poderia ser o da criação, mas
     a assinatura gera com dias de antecedência, e a cobrança que vence
     em 10 de setembro seria contada em agosto. */
  v_mes := date_trunc('month', p_vencimento)::date;

  select id into v_id
    from public.fatura
   where contrato_id = v_contrato.id
     and competencia = v_mes;

  if v_id is not null then
    update public.fatura
       set asaas_id = p_asaas_id,
           asaas_assinatura_id = p_assinatura
     where id = v_id;
    return v_id;
  end if;

  insert into public.fatura (
    conta_id, contrato_id, numero, status, valor, competencia, vencimento,
    asaas_id, asaas_assinatura_id, descricao
  ) values (
    v_contrato.conta_id,
    v_contrato.id,
    to_char(p_vencimento, 'YYYYMM') || '-' || substr(v_contrato.id::text, 1, 8),
    'enviada',
    p_valor,
    v_mes,
    p_vencimento,
    p_asaas_id,
    p_assinatura,
    'Fee de gestão · ' || to_char(v_mes, 'MM/YYYY')
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke execute on function public.fatura_de_assinatura(text, text, numeric, date) from public;
revoke execute on function public.fatura_de_assinatura(text, text, numeric, date) from anon;
revoke execute on function public.fatura_de_assinatura(text, text, numeric, date) from authenticated;

comment on function public.fatura_de_assinatura(text, text, numeric, date) is
  'Cria aqui a fatura que o Asaas gerou pela assinatura. Chamada só pelo webhook, com a service role: sem ela, cobrança automática paga seria dinheiro entrando sem aparecer em indicador nenhum.';
