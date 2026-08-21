-- =====================================================================
-- 0022 — devolve à saude_conta as colunas que a 0021 derrubou
-- =====================================================================
--
-- A 0021 reescreveu a view para o health score parar de punir cliente
-- de tráfego. Fez isso certo, e junto derrubou oito colunas que a
-- ficha da loja lê: receita_7, mer_7, meta_atingida, tarefas_atrasadas,
-- inadimplencia, dias_sem_registro e as duas de comparação.
--
-- `npm run conferir-consultas` pegou: "column saude_conta.tarefas_atrasadas
-- does not exist". Sem ele, a ficha de cada cliente teria voltado
-- VAZIA — sem erro visível, porque a camada de dados registra o erro no
-- log do servidor e devolve nada.
--
-- Aqui a view volta inteira, com o cálculo por tipo que a 0021 trouxe.
-- A gradação de `situacao` é a de antes: inadimplência é ATENÇÃO, e não
-- crítico. Mudar a severidade de um alarme de propósito é uma decisão;
-- mudar por descuido ao reescrever é como um painel deixa de ser
-- confiável.

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
    coalesce(sum(k.investimento) filter (where k.dia >= current_date - 7),  0) as inv_7,
    coalesce(sum(k.investimento) filter (where k.dia >= current_date - 14
                                           and k.dia <  current_date - 7),  0) as inv_7_ant
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
  j.receita_7,
  j.receita_7_ant,
  j.ultimo_dia,

  case when j.receita_7_ant > 0
       then round(100.0 * (j.receita_7 - j.receita_7_ant) / j.receita_7_ant, 1) end
       as variacao_receita,

  case when j.inv_7 > 0     then round(j.receita_7 / j.inv_7, 2) end         as mer_7,
  case when j.inv_7_ant > 0 then round(j.receita_7_ant / j.inv_7_ant, 2) end as mer_7_ant,

  km.meta_atingida,

  /*
    O semáforo.

    A ordem é a de sempre: falta de dado primeiro, depois queda forte,
    depois mídia sem retorno, depois inadimplência e o resto. O que a
    0021 mudou é QUEM entra nas comparações de venda — só conta do tipo
    ecommerce. Para um chalé, "gastou em mídia e não teve receita" não
    descreve nada: a venda dele acontece na recepção.
  */
  case
    when j.ultimo_dia is null or j.ultimo_dia < current_date - 2 then 'sem_dado'
    when c.tipo = 'ecommerce'
         and j.receita_7_ant > 0
         and (j.receita_7 - j.receita_7_ant) / j.receita_7_ant < -0.25 then 'critico'
    when c.tipo = 'ecommerce'
         and j.inv_7 > 0 and j.receita_7 / j.inv_7 < 1                 then 'critico'
    when o.inadimplencia > 0                                           then 'atencao'
    when c.tipo = 'ecommerce'
         and j.receita_7_ant > 0
         and (j.receita_7 - j.receita_7_ant) / j.receita_7_ant < -0.10 then 'atencao'
    when c.tipo = 'ecommerce'
         and km.meta_atingida is not null and km.meta_atingida < 70    then 'atencao'
    when o.tarefas_atrasadas >= 3                                      then 'atencao'
    else 'saudavel'
  end as situacao,

  o.tarefas_atrasadas,
  o.inadimplencia,
  o.dias_sem_registro,

  greatest(0, least(100,
    100
    /* --- universais: medem a AGÊNCIA, e valem para todo cliente --- */
    - case when j.ultimo_dia is null or j.ultimo_dia < current_date - 2 then 30 else 0 end
    - least(o.tarefas_atrasadas * 5, 15)
    - case when o.inadimplencia > 0 then 15 else 0 end
    - case when o.dias_sem_registro is null then 10
           when o.dias_sem_registro > 30 then 20
           when o.dias_sem_registro > 14 then 8
           else 0 end

    /* --- só onde existe venda registrada -------------------------- */
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
