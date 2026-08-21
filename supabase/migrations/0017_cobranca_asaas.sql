-- =====================================================================
-- 0017 - Cobrança pelo Asaas.
--
-- O financeiro do painel sabia SOMAR: receita recorrente, a receber,
-- inadimplência. Não sabia cobrar. Fatura nascia à mão, ninguém mandava
-- para o cliente, e "pago" era alguém marcando na tela depois de olhar
-- o extrato.
--
-- Esta migração prepara o banco para o Asaas emitir a cobrança e avisar
-- de volta quando ela for paga.
--
-- ============================================================
-- O QUE NÃO ENTRA AQUI
-- ============================================================
-- A chave de API do Asaas NÃO ganha coluna nova. Ela é uma credencial
-- da agência como a da Meta e a do Google, e vai para
-- `credencial_agencia`, cifrada com a mesma chave que não mora no
-- banco. Um segundo lugar para guardar segredo é um segundo lugar para
-- vazar.
-- =====================================================================


-- =====================================================================
-- 1. O cliente do lado do Asaas
--
-- O Asaas exige criar um "customer" antes de qualquer cobrança, e
-- devolve um id que precisa ser reusado: criar de novo a cada fatura
-- gera clientes duplicados na conta deles e quebra a conciliação.
-- =====================================================================
alter table conta
  add column if not exists asaas_cliente_id text;

create unique index if not exists conta_asaas_unica
  on conta (asaas_cliente_id)
  where asaas_cliente_id is not null;

comment on column conta.asaas_cliente_id is
  'Id do cliente no Asaas. Criado uma vez e reusado: criar a cada fatura duplicaria o cliente lá e quebraria a conciliação.';


-- =====================================================================
-- 2. A cobrança do lado do Asaas
--
-- `asaas_id` é a chave de conciliação nos dois sentidos: daqui para lá
-- ao consultar, e de lá para cá quando o webhook chega dizendo que
-- pagaram.
--
-- `link_pagamento` guarda a página de cobrança, que serve para boleto,
-- PIX e cartão ao mesmo tempo. `link_boleto`, de 0003, continua
-- existindo para o caso de alguém precisar do PDF puro.
-- =====================================================================
alter table fatura
  add column if not exists asaas_id        text,
  add column if not exists link_pagamento  text,
  add column if not exists forma_pagamento text,
  add column if not exists pix_copia_cola  text,
  add column if not exists sincronizada_em timestamptz;

create unique index if not exists fatura_asaas_unica
  on fatura (asaas_id)
  where asaas_id is not null;

comment on column fatura.asaas_id is
  'Id da cobrança no Asaas. Chave de conciliação nos dois sentidos, e o que torna o webhook idempotente.';
comment on column fatura.forma_pagamento is
  'Como foi pago de fato: BOLETO, PIX, CREDIT_CARD. Vem do Asaas na confirmação, e não da nossa escolha na emissão.';

/* Fatura ligada ao contrato que a originou.

   Sem isso não dá para responder "esta loja pagou o mês de março do
   contrato antigo ou do novo?", que é a pergunta que aparece na
   primeira renegociação de fee. */
alter table fatura
  add column if not exists contrato_id uuid references contrato(id) on delete set null;


-- =====================================================================
-- 3. Uma fatura por competência, por contrato
--
-- A geração é idempotente de propósito: a rotina mensal pode rodar
-- duas vezes, o botão pode ser clicado duas vezes, e o cliente não
-- pode receber duas cobranças do mesmo mês. É o mesmo princípio da
-- ingestão de métrica — repetir SOBRESCREVE, não duplica.
-- =====================================================================
create unique index if not exists fatura_unica_por_competencia
  on fatura (contrato_id, competencia)
  where contrato_id is not null;


-- =====================================================================
-- 4. O diário das chamadas ao Asaas
--
-- Mesmo papel que `sincronizacao` tem para a métrica: sem ele,
-- "a cobrança não chegou no cliente" não tem resposta. Ninguém sabe se
-- não foi emitida, se foi emitida e falhou, ou se foi emitida e o
-- e-mail caiu no spam.
--
-- Também é onde o webhook deixa rastro. Evento de pagamento que chega e
-- não vira registro é dinheiro entrando sem explicação.
-- =====================================================================
create table cobranca_evento (
  id           bigserial primary key,
  fatura_id    uuid references fatura(id) on delete cascade,
  asaas_id     text,
  origem       text not null check (origem in ('emissao', 'webhook', 'consulta', 'cancelamento')),
  evento       text,
  status       text not null check (status in ('sucesso', 'erro')),
  erro         text,
  /* O payload como chegou. Mesma razão de `metrica_bruta`: dá para
     reprocessar sem pedir de novo, e é a prova quando o cliente diz
     que pagou. */
  carga        jsonb,
  em           timestamptz not null default now()
);

create index cobranca_evento_fatura_idx on cobranca_evento (fatura_id, em desc);
create index cobranca_evento_asaas_idx  on cobranca_evento (asaas_id);

alter table cobranca_evento enable row level security;
alter table cobranca_evento force  row level security;

/* Só o time da agência lê, e ninguém escreve pela chave pública: quem
   grava é a rotina no servidor, com a service role. */
create policy cobranca_evento_interno_le on cobranca_evento for select
  to authenticated using (public.e_interno());

comment on table cobranca_evento is
  'Uma linha por chamada ao Asaas e por webhook recebido. É o que responde "por que a cobrança não chegou".';


-- =====================================================================
-- 5. Emissão idempotente da fatura do mês
--
-- Cria a fatura da competência se ela ainda não existir, e devolve a
-- que existe se já houver. Roda dentro do Postgres para a checagem e a
-- inserção acontecerem na MESMA transação: feito em duas requisições
-- daqui, dois cliques simultâneos passariam os dois pela checagem antes
-- de qualquer um inserir.
--
-- Não fala com o Asaas. Isso é da camada do servidor: função de banco
-- que faz chamada HTTP trava a transação enquanto espera a rede.
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

  /* Já existe a do mês? Devolve ela. O índice único de (contrato,
     competência) é a garantia de verdade; esta consulta é o caminho
     rápido para não depender de capturar erro de constraint. */
  select id into v_fatura_id
    from public.fatura
   where contrato_id = p_contrato_id
     and competencia = date_trunc('month', p_competencia)::date;

  if v_fatura_id is not null then
    return v_fatura_id;
  end if;

  /* Vencimento no dia 10 da competência. O contrato de 0003 não tem
     dia de vencimento próprio, e inventar um por loja aqui seria
     esconder a regra num lugar que ninguém vai procurar. */
  v_venc := (date_trunc('month', p_competencia) + interval '9 days')::date;

  /* Número legível e único: ano-mês mais os oito primeiros do contrato.
     Sequência global obrigaria uma tabela de contador só para isso. */
  v_numero := to_char(p_competencia, 'YYYYMM') || '-' || substr(p_contrato_id::text, 1, 8);

  insert into public.fatura (
    conta_id, contrato_id, numero, status, valor, competencia, vencimento
  ) values (
    v_contrato.conta_id,
    p_contrato_id,
    v_numero,
    'aberta',
    v_contrato.fee_mensal,
    date_trunc('month', p_competencia)::date,
    v_venc
  )
  returning id into v_fatura_id;

  return v_fatura_id;
end;
$$;

revoke execute on function public.emitir_fatura(uuid, date) from public;
revoke execute on function public.emitir_fatura(uuid, date) from anon;
grant  execute on function public.emitir_fatura(uuid, date) to authenticated;

comment on function public.emitir_fatura(uuid, date) is
  'Cria a fatura da competência, ou devolve a que já existe. Idempotente: a rotina mensal pode rodar duas vezes sem o cliente receber duas cobranças.';
