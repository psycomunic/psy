-- =====================================================================
-- 0020 — o financeiro passa a somar o que ele mesmo cobra
-- =====================================================================
--
-- ============================================================
-- O DEFEITO QUE ESTA MIGRAÇÃO CONSERTA
-- ============================================================
-- `financeiro_mes` calculava "recebido no mês", "a receber" e
-- "inadimplência" a partir de `lancamento`. A cobrança inteira — a
-- emissão, o Asaas, o webhook de pagamento — escreve em `fatura`.
-- Ninguém nunca escreveu em `lancamento`.
--
-- Resultado: três indicadores que só sabem responder R$ 0. Não é um
-- número errado por pouco, é um número que nunca vai mudar. A agência
-- podia receber trinta mil no mês e o painel seguiria dizendo zero.
--
-- Isso é a regra de "uma autoridade por número" quebrada no lugar mais
-- caro. A autoridade da receita da agência passa a ser `fatura`, que é
-- onde o dinheiro realmente é registrado.
--
-- `lancamento` vira o que faltava: o livro de DESPESA da agência.
-- Ferramenta, salário, imposto, verba de tráfego da própria casa. Com
-- ele o painel para de mostrar só faturamento e passa a mostrar
-- resultado.
--
-- A restrição a despesa é uma constraint, e não um comentário: receita
-- que entrasse aqui não seria contada em lugar nenhum, e sumir com
-- dinheiro silenciosamente é justamente o defeito que se está
-- consertando.


-- =====================================================================
-- 1. lancamento é o livro de despesa
-- =====================================================================
delete from lancamento where tipo = 'receita';

alter table lancamento
  add constraint lancamento_so_despesa check (tipo = 'despesa');

comment on table lancamento is
  'Despesas da agência. A receita NÃO mora aqui: ela é `fatura`, que é o que o Asaas cobra e o webhook confirma. Duas autoridades para o mesmo número foi o defeito que a 0020 consertou.';

comment on column lancamento.categoria is
  'Agrupador livre: ferramentas, pessoal, impostos, mídia própria. Serve para a pergunta "onde o dinheiro está indo".';


-- =====================================================================
-- 2. A fatura ganha o que a cobrança avulsa precisa
--
-- Até aqui toda fatura vinha de um contrato mensal. Setup, projeto,
-- criativo extra, reembolso de mídia: nada disso tinha por onde ser
-- cobrado, e acabava virando link gerado à mão no site do Asaas — fora
-- do painel, sem entrar em nenhum indicador.
-- =====================================================================
alter table fatura
  add column if not exists descricao        text,
  add column if not exists valor_liquido    numeric(12,2),
  add column if not exists parcelas         integer not null default 1,
  add column if not exists asaas_parcelamento text,
  add column if not exists cancelada_em     timestamptz;

alter table fatura
  add constraint fatura_parcelas_positivas check (parcelas >= 1);

comment on column fatura.descricao is
  'O que está sendo cobrado. Aparece na cobrança que o cliente recebe: "Fee de gestão — agosto" ou "Setup da loja".';

comment on column fatura.valor_liquido is
  'O que sobra depois da taxa do gateway. Vem do `netValue` do Asaas na confirmação. Faturar R$ 5.000 e receber R$ 4.893 é a diferença entre faturamento e caixa.';

comment on column fatura.parcelas is
  'Quantas parcelas no Asaas. 1 é o normal. Só se aplica a cobrança avulsa: fee mensal já é recorrente por natureza.';


-- =====================================================================
-- 3. Cobrança avulsa
--
-- Não passa por `emitir_fatura` porque não tem contrato nem
-- competência única: a mesma loja pode receber três cobranças avulsas
-- no mesmo mês, e isso é normal. A idempotência de `emitir_fatura`
-- existe para o fee mensal, que é exatamente o caso oposto.
-- =====================================================================
create or replace function public.criar_cobranca_avulsa(
  p_conta_id   uuid,
  p_valor      numeric,
  p_vencimento date,
  p_descricao  text,
  p_parcelas   integer default 1
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id     uuid := gen_random_uuid();
  v_numero text;
begin
  if not coalesce(
       public.papel_atual() in ('administrador', 'financeiro'),
       false) then
    raise exception 'Sem permissão para criar cobrança.';
  end if;

  if p_valor is null or p_valor <= 0 then
    raise exception 'O valor da cobrança tem de ser maior que zero.';
  end if;

  if coalesce(p_parcelas, 1) < 1 then
    raise exception 'O número de parcelas tem de ser pelo menos 1.';
  end if;

  if p_descricao is null or btrim(p_descricao) = '' then
    raise exception 'A cobrança precisa de descrição: é o que o cliente lê na fatura.';
  end if;

  if not exists (select 1 from public.conta where id = p_conta_id) then
    raise exception 'Loja não encontrada.';
  end if;

  /* O "A" separa da fatura de contrato na hora de olhar a lista. Os
     seis do uuid evitam a colisão que uma sequência por mês teria. */
  v_numero := to_char(p_vencimento, 'YYYYMM') || '-A' || substr(v_id::text, 1, 6);

  insert into public.fatura (
    id, conta_id, numero, status, valor, competencia, vencimento,
    descricao, parcelas
  ) values (
    v_id,
    p_conta_id,
    v_numero,
    'aberta',
    p_valor,
    date_trunc('month', p_vencimento)::date,
    p_vencimento,
    btrim(p_descricao),
    coalesce(p_parcelas, 1)
  );

  return v_id;
end;
$$;

revoke execute on function public.criar_cobranca_avulsa(uuid, numeric, date, text, integer) from public;
revoke execute on function public.criar_cobranca_avulsa(uuid, numeric, date, text, integer) from anon;
grant  execute on function public.criar_cobranca_avulsa(uuid, numeric, date, text, integer) to authenticated;

comment on function public.criar_cobranca_avulsa(uuid, numeric, date, text, integer) is
  'Cobrança fora do contrato mensal: setup, projeto, extra. Sem idempotência de propósito — três cobranças avulsas no mesmo mês para a mesma loja é situação normal.';


-- =====================================================================
-- 4. financeiro_mes sobre a fatura
--
-- Uma decisão que muda o significado da tela: "recebido" é o que foi
-- PAGO no mês, e "faturado" é o que foi EMITIDO para a competência.
-- Não são a mesma coisa e nunca vão bater — a fatura de agosto que o
-- cliente paga em setembro entra em faturado de agosto e em recebido de
-- setembro. Misturar os dois é como agência descobre tarde que o
-- faturamento subiu e o caixa não.
-- =====================================================================
/* DROP e não REPLACE: `create or replace view` recusa mudança de nome
   ou de ordem de coluna, e aqui entram colunas novas no meio. O grant
   vai junto porque some com o drop. */
drop view if exists financeiro_mes;

create view financeiro_mes
with (security_invoker = on) as
with mes as (select date_trunc('month', current_date)::date as m)
select
  (select m from mes) as mes,

  (select coalesce(sum(ct.fee_mensal), 0)
     from contrato ct
    where ct.inicio <= current_date
      and (ct.fim is null or ct.fim >= current_date)) as receita_recorrente,

  (select count(*)
     from contrato ct
    where ct.inicio <= current_date
      and (ct.fim is null or ct.fim >= current_date)) as contratos_ativos,

  (select coalesce(sum(f.valor), 0)
     from fatura f
    where f.status <> 'cancelada'
      and f.competencia = (select m from mes)) as faturado_mes,

  (select coalesce(sum(f.valor), 0)
     from fatura f
    where f.status = 'paga'
      and f.paga_em >= (select m from mes)
      and f.paga_em <  (select m from mes) + interval '1 month') as recebido_mes,

  /* Líquido: o mesmo recebimento menos a taxa do gateway. Quando o
     Asaas não informou, cai no bruto — melhor um número levemente
     otimista que um buraco. */
  (select coalesce(sum(coalesce(f.valor_liquido, f.valor)), 0)
     from fatura f
    where f.status = 'paga'
      and f.paga_em >= (select m from mes)
      and f.paga_em <  (select m from mes) + interval '1 month') as recebido_liquido_mes,

  (select coalesce(sum(f.valor), 0)
     from fatura f
    where f.status not in ('paga', 'cancelada')
      and f.vencimento >= (select m from mes)
      and f.vencimento <  (select m from mes) + interval '1 month') as a_receber_mes,

  (select coalesce(sum(f.valor), 0)
     from fatura f
    where f.status not in ('paga', 'cancelada')
      and f.vencimento < current_date) as inadimplencia,

  (select count(*)
     from fatura f
    where f.status not in ('paga', 'cancelada')
      and f.vencimento < current_date) as faturas_vencidas,

  (select coalesce(sum(l.valor), 0)
     from lancamento l
    where l.status = 'pago'
      and l.pago_em >= (select m from mes)
      and l.pago_em <  (select m from mes) + interval '1 month') as despesa_mes,

  (select coalesce(sum(l.valor), 0)
     from lancamento l
    where l.status in ('previsto', 'atrasado')
      and l.vencimento >= (select m from mes)
      and l.vencimento <  (select m from mes) + interval '1 month') as despesa_prevista_mes,

  (select coalesce(sum(k.investimento), 0)
     from kpi_diario k
    where k.dia >= (select m from mes)) as verba_sob_gestao;

grant select on financeiro_mes to authenticated;


-- =====================================================================
-- 5. A série dos últimos 12 meses
--
-- KPI de mês corrente responde "como estamos hoje". Não responde "isto
-- é bom?", que é uma pergunta sobre a linha, não sobre o ponto. Sem
-- série, todo mês parece normal.
-- =====================================================================
create or replace view serie_financeira
with (security_invoker = on) as
select
  g.mes::date as mes,

  (select coalesce(sum(f.valor), 0)
     from fatura f
    where f.status <> 'cancelada'
      and f.competencia = g.mes::date) as faturado,

  (select coalesce(sum(f.valor), 0)
     from fatura f
    where f.status = 'paga'
      and f.paga_em >= g.mes::date
      and f.paga_em <  (g.mes + interval '1 month')::date) as recebido,

  (select coalesce(sum(l.valor), 0)
     from lancamento l
    where l.status = 'pago'
      and l.pago_em >= g.mes::date
      and l.pago_em <  (g.mes + interval '1 month')::date) as despesa

from generate_series(
       date_trunc('month', current_date) - interval '11 months',
       date_trunc('month', current_date),
       interval '1 month'
     ) as g(mes);

grant select on serie_financeira to authenticated;

comment on view serie_financeira is
  'Doze meses de faturado, recebido e despesa. Sempre 12 linhas, inclusive as vazias: mês sem movimento é informação, e some se a série vier só do que existe.';
