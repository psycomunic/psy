-- =====================================================================
-- 0011 - A espinha da ingestão.
--
-- Até aqui o painel sabia LER métrica. Esta migração resolve como ela
-- ENTRA, e o problema da entrada não é buscar o dado: é garantir que
-- reimportar não duplique, que duas fontes não se atropelem, que dia
-- faltando apareça como falta, e que dê para responder "por que o
-- número está velho" sem abrir o código.
-- =====================================================================


-- =====================================================================
-- 1. Que dia é hoje
--
-- O Postgres do Supabase roda em UTC. `current_date` às 21h de Brasília
-- já devolve o dia SEGUINTE, e a partir daí tudo escorrega: a janela de
-- 7 dias derruba o dia mais antigo cedo demais, o "mês corrente" vira o
-- mês que vem no último dia, e a rotina noturna de sincronização pede à
-- API o dia errado — justamente no horário em que cron de madrugada
-- costuma rodar.
--
-- `hoje()` é o dia no fuso da operação. Toda janela passa a sair daqui,
-- e nenhuma conta de data no sistema volta a usar `current_date`.
-- =====================================================================
create or replace function public.hoje()
returns date
language sql
stable
set search_path = ''
as $$
  select (now() at time zone 'America/Sao_Paulo')::date
$$;

comment on function public.hoje() is
  'O dia corrente no fuso da operação. O banco roda em UTC: current_date vira o dia seguinte às 21h de Brasília.';


-- =====================================================================
-- 2. Receita da loja e receita que a plataforma se atribui
--
-- São números diferentes e confundi-los é o erro mais caro do setor.
--
-- `receita` é o que a LOJA faturou e aprovou. É a única que entra em MER
-- e a única que o cliente reconhece no extrato.
--
-- `receita_atribuida` é o que o Google e o Meta dizem ter gerado. Cada
-- um conta a mesma venda para si, então a soma das duas plataformas
-- costuma passar do faturamento real. Guardar as duas lado a lado
-- permite medir esse excesso em vez de discutir de memória.
-- =====================================================================
alter table metrica_diaria
  add column if not exists receita_atribuida numeric(14,2) not null default 0;

comment on column metrica_diaria.receita_atribuida is
  'Receita que a própria plataforma de mídia se atribui. NUNCA entra em MER: só serve para medir o excesso de atribuição.';

/*
  Números negativos não existem aqui, e sem estas travas um sinal
  trocado no mapeamento de uma API entra calado e só aparece semanas
  depois, como uma queda que ninguém consegue explicar.

  `not valid` porque a checagem vale para o que entrar de agora em
  diante; validar linha a linha uma tabela de métrica grande travaria a
  migração sem ganho, já que o dado atual veio de carga controlada.
*/
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'metrica_sem_negativo'
  ) then
    alter table public.metrica_diaria
      add constraint metrica_sem_negativo check (
        sessoes           >= 0 and
        pedidos_captados  >= 0 and
        pedidos_aprovados >= 0 and
        novos_clientes    >= 0 and
        receita           >= 0 and
        receita_bruta     >= 0 and
        receita_atribuida >= 0 and
        investimento      >= 0 and
        cliques           >= 0 and
        impressoes        >= 0
      ) not valid;
  end if;
end $$;


-- =====================================================================
-- 3. O diário das sincronizações
--
-- Sem este log, "o dado está velho" não tem resposta: ninguém sabe se a
-- rotina não rodou, se rodou e falhou, ou se rodou e a API devolveu
-- vazio. As três têm conserto diferente.
--
-- O cliente não lê esta tabela. Mensagem de erro de API carrega id de
-- conta de anúncio e às vezes pedaço de token.
-- =====================================================================
create table sincronizacao (
  id               bigserial primary key,
  conta_id         uuid references conta(id) on delete cascade,
  provedor         text not null,
  origem           text not null default 'manual'
                     check (origem in ('cron', 'manual', 'importacao')),
  autor_id         uuid references perfil(id) on delete set null,
  dia_de           date,
  dia_ate          date,
  status           text not null default 'rodando'
                     check (status in ('rodando', 'sucesso', 'erro')),
  linhas_lidas     integer not null default 0,
  linhas_gravadas  integer not null default 0,
  erro             text,
  comecou_em       timestamptz not null default now(),
  terminou_em      timestamptz
);

create index sincronizacao_conta_idx on sincronizacao(conta_id, comecou_em desc);
create index sincronizacao_provedor_idx on sincronizacao(provedor, comecou_em desc);

comment on table sincronizacao is
  'Uma linha por tentativa de sincronização. É o que responde por que o número está velho.';


-- =====================================================================
-- 4. A carga crua, como chegou
--
-- Guardar o payload original custa espaço e paga o custo na primeira
-- vez que o mapeamento erra: dá para reprocessar sem pedir de novo à
-- API, que quase sempre já não devolve o histórico. É também a prova
-- quando o cliente contesta um número.
--
-- Sem política nenhuma, igual a `integracao`: RLS ligado e nenhuma
-- política significa nenhuma linha para ninguém pela chave pública. A
-- carga crua carrega id de campanha, e às vezes dado de pedido.
-- =====================================================================
create table metrica_bruta (
  id               bigserial primary key,
  sincronizacao_id bigint references sincronizacao(id) on delete cascade,
  conta_id         uuid not null references conta(id) on delete cascade,
  provedor         text not null,
  dia              date,
  carga            jsonb not null,
  recebida_em      timestamptz not null default now()
);

create index metrica_bruta_conta_idx on metrica_bruta(conta_id, dia desc);

comment on table metrica_bruta is
  'Payload original da fonte, para reprocessar mapeamento sem refazer a busca. Descartável depois de 90 dias.';


-- =====================================================================
-- 5. Estado de cada conexão
-- =====================================================================
alter table integracao
  add column if not exists ultima_sync_ok timestamptz,
  add column if not exists ultimo_erro    text,
  add column if not exists erro_em        timestamptz,
  add column if not exists janela_dias    integer not null default 7;

comment on column integracao.janela_dias is
  'Quantos dias para trás reprocessar a cada rodada. Pedido aprovado muda de status depois do fato: buscar só ontem congela a reprovação num número que ainda ia mudar.';


-- =====================================================================
-- 6. A gravação idempotente
--
-- Duas propriedades, e o sistema inteiro depende delas.
--
-- PRIMEIRA: rodar o mesmo dia duas vezes SOBRESCREVE, nunca soma. Toda
-- sincronização repete dias de propósito (ver `janela_dias`), e sem isto
-- o faturamento do cliente dobraria na tela.
--
-- SEGUNDA: cada fonte escreve só as COLUNAS que são dela. A loja é dona
-- de pedido e receita; o GA4, de sessão; Google e Meta, de verba, clique
-- e atribuição. Como as três podem cair na mesma linha (mesma conta,
-- mesmo dia, mesmo canal), um `do update` que escrevesse a linha inteira
-- faria a última fonte a rodar zerar o que as outras gravaram.
--
-- Não é `security definer`: quem grava métrica é a rotina do servidor
-- com a service role, que passa por cima de RLS por definição. Como
-- `invoker`, se esta função escapasse para o cliente, o RLS de
-- `metrica_diaria` — que não tem política de escrita — barraria assim
-- mesmo. O `revoke` abaixo é a segunda tranca.
-- =====================================================================
create or replace function public.registrar_metricas(
  p_conta    uuid,
  p_provedor text,
  p_linhas   jsonb
) returns integer
language plpgsql
set search_path = ''
as $$
declare
  v_gravadas integer := 0;
  v_max_dia  date;
begin
  if p_linhas is null or jsonb_typeof(p_linhas) <> 'array' then
    raise exception 'registrar_metricas espera um array de linhas.';
  end if;

  /* Dia no futuro é sempre erro de fuso ou de mapeamento, e entra
     calado: vira um buraco no gráfico de amanhã. */
  select max((l->>'dia')::date) into v_max_dia
    from jsonb_array_elements(p_linhas) l;

  if v_max_dia > public.hoje() then
    raise exception 'Linha com dia no futuro (%). Confira o fuso da fonte.', v_max_dia;
  end if;

  if p_provedor in ('loja', 'magazord', 'shopify', 'planilha_loja') then
    insert into public.metrica_diaria as m (
      conta_id, dia, canal,
      pedidos_captados, pedidos_aprovados, receita, receita_bruta, novos_clientes,
      /* `pedidos` é a coluna anterior à separação captado/aprovado, de
         0003. Continua preenchida com o aprovado para não virar um zero
         silencioso em consulta antiga que ainda a leia. */
      pedidos,
      sincronizada_em
    )
    select
      p_conta,
      (l->>'dia')::date,
      coalesce(nullif(l->>'canal', ''), 'loja'),
      coalesce((l->>'pedidos_captados')::integer, 0),
      coalesce((l->>'pedidos_aprovados')::integer, 0),
      coalesce((l->>'receita')::numeric, 0),
      coalesce((l->>'receita_bruta')::numeric, 0),
      coalesce((l->>'novos_clientes')::integer, 0),
      coalesce((l->>'pedidos_aprovados')::integer, 0),
      now()
    from jsonb_array_elements(p_linhas) l
    on conflict (conta_id, dia, canal) do update set
      pedidos_captados  = excluded.pedidos_captados,
      pedidos_aprovados = excluded.pedidos_aprovados,
      receita           = excluded.receita,
      receita_bruta     = excluded.receita_bruta,
      novos_clientes    = excluded.novos_clientes,
      pedidos           = excluded.pedidos_aprovados,
      sincronizada_em   = now();

  elsif p_provedor in ('ga4', 'analytics', 'planilha_sessao') then
    insert into public.metrica_diaria as m (
      conta_id, dia, canal, sessoes, sincronizada_em
    )
    select
      p_conta,
      (l->>'dia')::date,
      coalesce(nullif(l->>'canal', ''), 'organico'),
      coalesce((l->>'sessoes')::integer, 0),
      now()
    from jsonb_array_elements(p_linhas) l
    on conflict (conta_id, dia, canal) do update set
      sessoes         = excluded.sessoes,
      sincronizada_em = now();

  elsif p_provedor in ('google_ads', 'meta_ads', 'tiktok_ads', 'planilha_midia') then
    insert into public.metrica_diaria as m (
      conta_id, dia, canal,
      investimento, cliques, impressoes, receita_atribuida,
      sincronizada_em
    )
    select
      p_conta,
      (l->>'dia')::date,
      /* Canal é obrigatório na mídia: sem ele não dá para dizer onde a
         verba foi, que é a única pergunta que a tabela de canal responde. */
      nullif(l->>'canal', ''),
      coalesce((l->>'investimento')::numeric, 0),
      coalesce((l->>'cliques')::integer, 0),
      coalesce((l->>'impressoes')::integer, 0),
      coalesce((l->>'receita_atribuida')::numeric, 0),
      now()
    from jsonb_array_elements(p_linhas) l
    on conflict (conta_id, dia, canal) do update set
      investimento      = excluded.investimento,
      cliques           = excluded.cliques,
      impressoes        = excluded.impressoes,
      receita_atribuida = excluded.receita_atribuida,
      sincronizada_em   = now();

  else
    raise exception 'Provedor desconhecido: %.', p_provedor;
  end if;

  get diagnostics v_gravadas = row_count;
  return v_gravadas;
end;
$$;

revoke execute on function public.registrar_metricas(uuid, text, jsonb) from public;
revoke execute on function public.registrar_metricas(uuid, text, jsonb) from anon;
revoke execute on function public.registrar_metricas(uuid, text, jsonb) from authenticated;

comment on function public.registrar_metricas(uuid, text, jsonb) is
  'Gravação idempotente de métrica. Sobrescreve o dia em vez de somar, e cada fonte escreve só as colunas que são dela.';


-- =====================================================================
-- 7. RLS das tabelas novas
-- =====================================================================
alter table sincronizacao enable row level security;
alter table sincronizacao force  row level security;
alter table metrica_bruta enable row level security;
alter table metrica_bruta force  row level security;

/* Só o time da agência lê o log, e ninguém escreve pela chave pública:
   quem grava é a rotina, com a service role. */
create policy sincronizacao_interno_le on sincronizacao for select
  to authenticated using (public.e_interno());

-- metrica_bruta: nenhuma política, de propósito. Ver o comentário da
-- tabela.


-- =====================================================================
-- 8. Frescor: o dado está velho, e quantos dias faltam
--
-- Um gráfico com buraco no meio parece queda. Esta view separa "vendeu
-- menos" de "não chegou dado", que é a diferença entre ligar para o
-- cliente e ligar para o suporte da API.
--
-- `security_invoker` faz a política `metrica_leitura` continuar valendo
-- aqui dentro: o lojista vê o frescor da loja dele e de mais nenhuma.
-- =====================================================================
create or replace view frescor_conta
with (security_invoker = on) as
select
  c.id   as conta_id,
  c.nome as conta_nome,
  max(m.dia)                                    as ultimo_dia,
  (public.hoje() - max(m.dia))::int             as atraso_dias,
  count(distinct m.dia) filter (
    where m.dia > public.hoje() - 30)::int      as dias_com_dado_30,
  (30 - count(distinct m.dia) filter (
    where m.dia > public.hoje() - 30))::int     as dias_sem_dado_30
from conta c
left join metrica_diaria m on m.conta_id = c.id
group by c.id, c.nome;

grant select on frescor_conta to authenticated;


-- =====================================================================
-- 9. O excesso de atribuição
--
-- Quando Google e Meta dizem 4x cada um e a loja fatura metade da soma,
-- não é que alguém mentiu: os dois contaram a mesma venda. Esta view
-- põe o excesso em número, por conta e por mês, e é o que sustenta a
-- conversa de verba com o cliente.
-- =====================================================================
create or replace view atribuicao_conta
with (security_invoker = on) as
select
  m.conta_id,
  date_trunc('month', m.dia)::date        as mes,
  sum(m.receita)                          as receita_loja,
  sum(m.receita_atribuida)                as receita_declarada,
  sum(m.investimento)                     as investimento,
  case when sum(m.receita) > 0
       then round(100.0 * (sum(m.receita_atribuida) - sum(m.receita))
                  / sum(m.receita), 1) end as excesso_percentual
from metrica_diaria m
group by m.conta_id, date_trunc('month', m.dia);

grant select on atribuicao_conta to authenticated;


-- =====================================================================
-- 10. Status das conexões, sem o segredo
--
-- `integracao` não tem política nenhuma, então uma view `invoker` sobre
-- ela devolveria vazio para todo mundo. Esta é `definer` de propósito, e
-- o que a torna segura é o que ela NÃO seleciona: a coluna `segredo`
-- não aparece, então não há o que vazar mesmo passando por cima do RLS.
-- O filtro por `e_interno()` faz o resto.
-- =====================================================================
create or replace view integracao_status as
select
  i.id,
  i.conta_id,
  i.provedor,
  i.identificador,
  i.ativa,
  i.janela_dias,
  i.ultima_sync,
  i.ultima_sync_ok,
  i.ultimo_erro,
  i.erro_em,
  (i.segredo is not null and i.segredo <> '') as tem_credencial,
  case
    when not i.ativa                                          then 'desligada'
    when i.segredo is null or i.segredo = ''                  then 'sem_credencial'
    when i.ultimo_erro is not null
     and (i.ultima_sync_ok is null or i.erro_em > i.ultima_sync_ok) then 'com_erro'
    when i.ultima_sync_ok is null                             then 'nunca_rodou'
    when i.ultima_sync_ok < now() - interval '2 days'          then 'atrasada'
    else 'ok'
  end as estado
from integracao i
where public.e_interno();

grant select on integracao_status to authenticated;


-- =====================================================================
-- 11. As views que dependiam de `current_date`
--
-- Recriadas com `hoje()`. O corpo é o mesmo de 0004 e 0009: a única
-- mudança é a fonte da data. `create or replace view` exige repetir o
-- corpo inteiro, e não há como trocar só uma expressão.
-- =====================================================================

create or replace view kpi_mes
with (security_invoker = on) as
select
  c.id                                as conta_id,
  c.nome                              as conta_nome,
  date_trunc('month', public.hoje())::date as mes,
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
          (date_trunc('month', public.hoje()) + interval '1 month - 1 day')::date
          - public.hoje() + 1,
          1),
      2)
  end as receita_dia_necessaria
from conta c
left join kpi_diario k
       on k.conta_id = c.id
      and k.dia >= date_trunc('month', public.hoje())::date
left join meta_conta mt
       on mt.conta_id = c.id
      and mt.mes = date_trunc('month', public.hoje())::date
where c.situacao in ('ativa', 'onboarding')
group by c.id, c.nome, mt.receita_meta, mt.roas_alvo, mt.cac_teto;

create or replace view financeiro_mes
with (security_invoker = on) as
select
  date_trunc('month', public.hoje())::date as mes,

  (select coalesce(sum(ct.fee_mensal), 0)
     from contrato ct
    where ct.inicio <= public.hoje()
      and (ct.fim is null or ct.fim >= public.hoje())) as receita_recorrente,

  (select count(*)
     from contrato ct
    where ct.inicio <= public.hoje()
      and (ct.fim is null or ct.fim >= public.hoje())) as contratos_ativos,

  (select coalesce(sum(l.valor), 0)
     from lancamento l
    where l.tipo = 'receita' and l.status = 'pago'
      and l.pago_em >= date_trunc('month', public.hoje())::date) as recebido_mes,

  (select coalesce(sum(l.valor), 0)
     from lancamento l
    where l.tipo = 'receita' and l.status in ('previsto', 'atrasado')
      and l.vencimento >= date_trunc('month', public.hoje())::date
      and l.vencimento <  (date_trunc('month', public.hoje()) + interval '1 month')::date)
    as a_receber_mes,

  (select coalesce(sum(l.valor), 0)
     from lancamento l
    where l.tipo = 'receita' and l.status <> 'cancelado'
      and l.pago_em is null and l.vencimento < public.hoje()) as inadimplencia,

  (select coalesce(sum(k.investimento), 0)
     from kpi_diario k
    where k.dia >= date_trunc('month', public.hoje())::date) as verba_sob_gestao;

drop view if exists saude_conta;

create view saude_conta
with (security_invoker = on) as
with janela as (
  select
    conta_id,
    sum(receita)      filter (where dia >  public.hoje() - 7)  as receita_7,
    sum(receita)      filter (where dia <= public.hoje() - 7
                               and dia >  public.hoje() - 14)  as receita_7_ant,
    sum(investimento) filter (where dia >  public.hoje() - 7)  as inv_7,
    sum(investimento) filter (where dia <= public.hoje() - 7
                               and dia >  public.hoje() - 14)  as inv_7_ant,
    max(dia)                                                   as ultimo_dia
  from kpi_diario
  where dia > public.hoje() - 14
  group by conta_id
),
operacao as (
  select
    c.id as conta_id,
    (select count(*)::int from tarefa t
      where t.conta_id = c.id
        and t.status in ('aberta','fazendo')
        and t.prazo < public.hoje())                      as tarefas_atrasadas,
    (select coalesce(sum(f.valor), 0) from fatura f
      where f.conta_id = c.id
        and f.status <> 'cancelada'
        and f.paga_em is null
        and f.vencimento < public.hoje())                 as inadimplencia,
    (select (public.hoje() - max(m.dia))::int from marco_conta m
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
    when j.ultimo_dia is null or j.ultimo_dia < public.hoje() - 2 then 'sem_dado'
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

  o.tarefas_atrasadas,
  o.inadimplencia,
  o.dias_sem_registro,

  greatest(0, least(100,
    100
    - case when j.ultimo_dia is null or j.ultimo_dia < public.hoje() - 2 then 30 else 0 end
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


-- =====================================================================
-- 12. `kpi_canal` passa a mostrar as duas receitas
--
-- Colunas novas vão no FIM: `create or replace view` exige que as
-- anteriores mantenham nome, tipo e ordem.
-- =====================================================================
create or replace view kpi_canal
with (security_invoker = on) as
select
  m.conta_id,
  m.canal,
  m.dia,
  sum(m.receita)      as receita,
  sum(m.investimento) as investimento,
  sum(m.sessoes)      as sessoes,
  sum(m.pedidos_aprovados) as pedidos_aprovados,
  sum(m.cliques)      as cliques,
  sum(m.impressoes)   as impressoes,
  case when sum(m.investimento) > 0
       then round(sum(m.receita) / sum(m.investimento), 2) end as roas,
  case when sum(m.cliques) > 0
       then round(sum(m.investimento) / sum(m.cliques), 2) end as cpc,
  case when sum(m.impressoes) > 0
       then round(100.0 * sum(m.cliques) / sum(m.impressoes), 2) end as ctr,

  sum(m.receita_atribuida) as receita_atribuida,
  /* O ROAS que a plataforma anuncia no painel dela. Fica ao lado do
     ROAS real, e nunca no lugar dele. */
  case when sum(m.investimento) > 0
       then round(sum(m.receita_atribuida) / sum(m.investimento), 2) end as roas_declarado
from metrica_diaria m
group by m.conta_id, m.canal, m.dia;


-- =====================================================================
-- 13. Limpeza da carga crua
--
-- Payload cru serve para reprocessar mapeamento recente. Depois de 90
-- dias ele só ocupa disco e aumenta a superfície de um vazamento.
-- =====================================================================
create or replace function public.limpar_metrica_bruta(p_dias integer default 90)
returns integer
language plpgsql
set search_path = ''
as $$
declare
  v integer;
begin
  delete from public.metrica_bruta
   where recebida_em < now() - make_interval(days => p_dias);
  get diagnostics v = row_count;
  return v;
end;
$$;

revoke execute on function public.limpar_metrica_bruta(integer) from public;
revoke execute on function public.limpar_metrica_bruta(integer) from anon;
revoke execute on function public.limpar_metrica_bruta(integer) from authenticated;
