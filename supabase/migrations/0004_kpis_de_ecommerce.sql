-- =====================================================================
-- 0004 - A camada que transforma numero solto em decisao de operacao.
--
-- As tabelas de 0001 a 0003 guardam FATOS. Esta migracao cria as
-- METRICAS, as METAS e o SINAL DE RISCO. E aqui que o sistema deixa de
-- ser um cadastro e vira um painel de agencia de performance.
--
-- Regra de ouro desta migracao: toda conta derivada mora numa VIEW, e
-- nunca numa coluna gravada. ROAS gravado numa coluna e ROAS que fica
-- errado no dia em que alguem corrige a receita e esquece de recalcular.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. O funil de pedido, que e onde o e-commerce brasileiro sangra.
--
-- `pedidos` sozinho esconde o problema mais caro do e-commerce no
-- Brasil: a diferenca entre o pedido CAPTADO e o pedido APROVADO. Boleto
-- que nao e pago, PIX que expira e cartao recusado por antifraude somem
-- entre um e outro, e essa perda nao aparece em nenhum relatorio de
-- midia. Uma loja com 30% de reprovacao esta jogando fora um terco da
-- verba, e o gestor de trafego ve ROAS bom mesmo assim.
--
-- `novos_clientes` separa aquisicao de recompra. Sem isso nao existe CAC
-- de verdade: dividir investimento por TODOS os pedidos subestima o
-- custo de aquisicao toda vez que a base recompra.
-- ---------------------------------------------------------------------
alter table metrica_diaria
  add column if not exists pedidos_captados  integer not null default 0,
  add column if not exists pedidos_aprovados integer not null default 0,
  add column if not exists novos_clientes    integer not null default 0,
  add column if not exists receita_bruta     numeric(14,2) not null default 0;

comment on column metrica_diaria.pedidos_captados is
  'Pedido gerado no checkout, pago ou nao.';
comment on column metrica_diaria.pedidos_aprovados is
  'Pedido com pagamento confirmado. A diferenca para captados e a perda por meio de pagamento.';
comment on column metrica_diaria.receita is
  'Receita APROVADA. E a unica que entra em ROAS e MER: receita captada que nunca foi paga infla o resultado.';
comment on column metrica_diaria.novos_clientes is
  'Compradores de primeira compra no dia. Base do CAC.';

-- Migra o dado antigo: antes de existir a separacao, `pedidos` era o que
-- a loja reportava, e o mais proximo disso e o pedido aprovado.
update metrica_diaria
   set pedidos_aprovados = pedidos,
       pedidos_captados  = pedidos
 where pedidos_aprovados = 0 and pedidos_captados = 0 and pedidos > 0;

-- ---------------------------------------------------------------------
-- 2. Metas por conta.
--
-- Painel sem meta e so um relatorio bonito: mostra o numero e nao diz se
-- ele e bom. Meta e o que transforma "R$ 180 mil" em "83% do mes" ou
-- "faltam 12 dias e 40%".
--
-- Uma linha por conta por mes, porque meta de dezembro nao e meta de
-- fevereiro em nenhum e-commerce do mundo.
-- ---------------------------------------------------------------------
create table meta_conta (
  id             uuid primary key default gen_random_uuid(),
  conta_id       uuid not null references conta(id) on delete cascade,
  mes            date not null,               -- sempre dia 1 do mes
  receita_meta   numeric(14,2) not null,
  investimento_teto numeric(14,2),
  roas_alvo      numeric(6,2),
  cac_teto       numeric(10,2),
  criada_em      timestamptz not null default now(),
  atualizada_em  timestamptz not null default now(),

  constraint meta_unica_por_mes unique (conta_id, mes),
  -- Meta de receita zero ou negativa quebra toda divisao de progresso.
  constraint meta_receita_positiva check (receita_meta > 0)
);

create index meta_conta_idx on meta_conta(conta_id, mes desc);

-- ---------------------------------------------------------------------
-- 3. Diario de bordo da conta.
--
-- Toda mudanca relevante que explica um degrau no grafico: subiu verba,
-- trocou criativo, entrou frete gratis, caiu o site. Sem isso, tres
-- meses depois ninguem lembra por que a curva mudou, e a agencia perde a
-- capacidade de provar o que funcionou.
-- ---------------------------------------------------------------------
create type tipo_marco as enum (
  'verba', 'criativo', 'campanha', 'site', 'preco', 'promocao', 'incidente', 'outro'
);

create table marco_conta (
  id        uuid primary key default gen_random_uuid(),
  conta_id  uuid not null references conta(id) on delete cascade,
  dia       date not null,
  tipo      tipo_marco not null default 'outro',
  titulo    text not null,
  detalhe   text,
  autor_id  uuid references perfil(id) on delete set null,
  criado_em timestamptz not null default now()
);

create index marco_conta_idx on marco_conta(conta_id, dia desc);

-- =====================================================================
-- 4. AS VIEWS DE KPI
--
-- security_invoker = on e o detalhe que faz toda a diferenca aqui.
--
-- Por padrao uma view roda com os privilegios de quem a CRIOU, o que
-- faria dela um buraco no RLS: o cliente A consultaria a view e receberia
-- os numeros do cliente B. Com security_invoker, a view executa com os
-- privilegios de QUEM CONSULTA, entao a politica `metrica_leitura` de
-- 0003 continua valendo dentro dela.
--
-- Sem esta linha, o isolamento por cliente cai inteiro.
-- =====================================================================

-- --- 4.1 Dia a dia, por conta, ja com as taxas do funil ---------------
create or replace view kpi_diario
with (security_invoker = on) as
select
  m.conta_id,
  m.dia,
  sum(m.sessoes)           as sessoes,
  sum(m.pedidos_captados)  as pedidos_captados,
  sum(m.pedidos_aprovados) as pedidos_aprovados,
  sum(m.novos_clientes)    as novos_clientes,
  sum(m.receita)           as receita,
  sum(m.investimento)      as investimento,
  sum(m.cliques)           as cliques,
  sum(m.impressoes)        as impressoes,

  -- MER: receita TOTAL sobre investimento TOTAL.
  -- Diferente do ROAS de plataforma, que conta so a receita que a
  -- propria plataforma se atribui. Quando Google e Meta somam ROAS 4x
  -- cada um e a loja fatura metade disso, o MER e quem denuncia.
  case when sum(m.investimento) > 0
       then round(sum(m.receita) / sum(m.investimento), 2) end as mer,

  -- Ticket medio sobre pedido APROVADO. Sobre captado, ele mente.
  case when sum(m.pedidos_aprovados) > 0
       then round(sum(m.receita) / sum(m.pedidos_aprovados), 2) end as ticket_medio,

  -- CAC real: so o cliente novo entra na conta.
  case when sum(m.novos_clientes) > 0
       then round(sum(m.investimento) / sum(m.novos_clientes), 2) end as cac,

  -- Conversao do site: da sessao ao pedido gerado.
  case when sum(m.sessoes) > 0
       then round(100.0 * sum(m.pedidos_captados) / sum(m.sessoes), 2) end as taxa_conversao,

  -- Aprovacao: do pedido gerado ao pedido pago. E o vazamento que
  -- nenhum painel de midia mostra.
  case when sum(m.pedidos_captados) > 0
       then round(100.0 * sum(m.pedidos_aprovados) / sum(m.pedidos_captados), 2) end as taxa_aprovacao
from metrica_diaria m
group by m.conta_id, m.dia;

-- --- 4.2 Por canal: onde a verba rende ------------------------------
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
       then round(100.0 * sum(m.cliques) / sum(m.impressoes), 2) end as ctr
from metrica_diaria m
group by m.conta_id, m.canal, m.dia;

-- --- 4.3 Mes corrente contra a meta ---------------------------------
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

  -- Progresso da meta em porcento.
  case when mt.receita_meta > 0
       then round(100.0 * coalesce(sum(k.receita), 0) / mt.receita_meta, 1) end as meta_atingida,

  /*
    Ritmo necessario: quanto a loja precisa faturar POR DIA no que resta
    do mes para bater a meta.

    E o numero mais acionavel do painel inteiro. "Faltam R$ 84 mil" nao
    diz o que fazer hoje; "precisa de R$ 7 mil por dia, e a media dos
    ultimos 7 foi R$ 4,2 mil" diz.

    O greatest(...,1) evita divisao por zero no ultimo dia do mes.
  */
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
where c.ativa
group by c.id, c.nome, mt.receita_meta, mt.roas_alvo, mt.cac_teto;

-- --- 4.4 Sinal de risco por conta ------------------------------------
/*
  O numero que faz a agencia ligar para o cliente ANTES de ele ligar
  reclamando.

  Compara os ultimos 7 dias com os 7 anteriores, em receita e em MER, e
  cruza com o progresso da meta. Nao e nota de crédito nem previsao: e um
  alarme com regra explicita, que qualquer pessoa do time consegue
  auditar lendo este SQL.
*/
create or replace view saude_conta
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

  /*
    O semaforo. Ordem importa: o primeiro caso que casar vence, e os
    mais graves vem antes.

    sem_dado  a sincronizacao parou. Antes de discutir performance,
              conferir a integracao: painel com dado velho leva a decisao
              errada com confianca total.
    critico   receita caindo mais de 25% na semana, ou MER abaixo de 1,
              que e vender abaixo do custo de midia.
    atencao   queda entre 10 e 25%, ou meta em menos de 70% do ritmo.
    saudavel  o resto.
  */
  case
    when j.ultimo_dia is null or j.ultimo_dia < current_date - 2 then 'sem_dado'
    when j.receita_7_ant > 0
         and (j.receita_7 - j.receita_7_ant) / j.receita_7_ant < -0.25 then 'critico'
    when j.inv_7 > 0 and j.receita_7 / j.inv_7 < 1                     then 'critico'
    when j.receita_7_ant > 0
         and (j.receita_7 - j.receita_7_ant) / j.receita_7_ant < -0.10 then 'atencao'
    when km.meta_atingida is not null and km.meta_atingida < 70        then 'atencao'
    else 'saudavel'
  end as situacao
from conta c
left join janela j on j.conta_id = c.id
left join kpi_mes km on km.conta_id = c.id
where c.ativa;

-- --- 4.5 Painel financeiro da agencia --------------------------------
/*
  Receita recorrente e verba sob gestao NAO se somam.

  O fee e a receita da Psy Comunic. A verba de midia passa pela agencia
  mas pertence ao cliente. Misturar as duas infla o faturamento e
  distorce qualquer decisao de contratacao. Por isso saem em colunas
  separadas, sempre.
*/
create or replace view financeiro_mes
with (security_invoker = on) as
select
  date_trunc('month', current_date)::date as mes,

  (select coalesce(sum(ct.fee_mensal), 0)
     from contrato ct
    where ct.inicio <= current_date
      and (ct.fim is null or ct.fim >= current_date)) as receita_recorrente,

  (select count(*)
     from contrato ct
    where ct.inicio <= current_date
      and (ct.fim is null or ct.fim >= current_date)) as contratos_ativos,

  (select coalesce(sum(l.valor), 0)
     from lancamento l
    where l.tipo = 'receita' and l.status = 'pago'
      and l.pago_em >= date_trunc('month', current_date)::date) as recebido_mes,

  (select coalesce(sum(l.valor), 0)
     from lancamento l
    where l.tipo = 'receita' and l.status in ('previsto', 'atrasado')
      and l.vencimento >= date_trunc('month', current_date)::date
      and l.vencimento <  (date_trunc('month', current_date) + interval '1 month')::date)
    as a_receber_mes,

  (select coalesce(sum(l.valor), 0)
     from lancamento l
    where l.tipo = 'receita' and l.status <> 'cancelado'
      and l.pago_em is null and l.vencimento < current_date) as inadimplencia,

  (select coalesce(sum(k.investimento), 0)
     from kpi_diario k
    where k.dia >= date_trunc('month', current_date)::date) as verba_sob_gestao;

-- =====================================================================
-- 5. RLS das tabelas novas
-- =====================================================================
alter table meta_conta  enable row level security;
alter table meta_conta  force  row level security;
alter table marco_conta enable row level security;
alter table marco_conta force  row level security;

-- Meta: o cliente VE a propria meta, porque um painel que mostra
-- progresso sem mostrar o alvo e um numero sem referencia. Mas so o time
-- da agencia define qual e o alvo.
create policy meta_leitura on meta_conta for select
  to authenticated using (public.pode_ver_conta(conta_id));

create policy meta_interno_escreve on meta_conta for insert
  to authenticated with check (public.e_interno());

create policy meta_interno_altera on meta_conta for update
  to authenticated using (public.e_interno()) with check (public.e_interno());

create policy meta_admin_exclui on meta_conta for delete
  to authenticated using (public.e_admin());

-- Marco: o cliente ve o diario da propria conta. É o que responde
-- "por que caiu na semana passada?" sem precisar de reuniao.
create policy marco_leitura on marco_conta for select
  to authenticated using (public.pode_ver_conta(conta_id));

create policy marco_interno_escreve on marco_conta for insert
  to authenticated with check (public.e_interno());

create policy marco_interno_altera on marco_conta for update
  to authenticated using (public.e_interno()) with check (public.e_interno());

create policy marco_admin_exclui on marco_conta for delete
  to authenticated using (public.e_admin());

create trigger meta_conta_toca before update on meta_conta
  for each row execute function public.tocar_atualizada_em();

-- =====================================================================
-- 6. Quem enxerga as views
--
-- As views herdam o RLS das tabelas por baixo, graças ao
-- security_invoker. O grant apenas permite consultar; QUAIS LINHAS
-- voltam continua sendo decidido pelas politicas de 0003.
--
-- financeiro_mes e a excecao: ela le contrato e lancamento, que sao
-- admin-only, entao um vendedor consultando recebe zero linha. O
-- isolamento acontece no banco, e nao numa checagem que eu poderia
-- esquecer de escrever na tela.
-- =====================================================================
grant select on kpi_diario, kpi_canal, kpi_mes, saude_conta, financeiro_mes
  to authenticated;
