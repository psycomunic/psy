-- ===================================================================
-- LEAD DE TRABALHO AVULSO
--
-- Nem toda venda é mensalidade. Site, landing page, identidade visual
-- e otimização de SEO são obra com fim: entrega, e acabou. O CRM só
-- sabia falar de fee mensal, então quem vendia um site de R$ 3.500
-- escrevia 3500 no campo de fee e o funil passava a prometer R$ 3.500
-- POR MÊS, todo mês, para sempre.
--
-- ===================================================================
-- POR QUE A COLUNA, E NÃO UM CAMPO DE TEXTO QUALQUER
-- ===================================================================
-- Porque a soma depende dela. `cobranca` não é rótulo: é o que impede
-- a previsão do funil de somar uma obra com uma mensalidade e
-- apresentar o resultado como um número só.
--
-- É a mesma regra que `src/dados/servicos.ts` já aplica na proposta,
-- onde projeto e mensalidade fecham dois totais separados. O funil
-- estava livre dela, e era o único lugar onde o dinheiro da casa ainda
-- podia se misturar.
--
-- O padrão é `mensal` porque é o que todos os leads existentes são, e
-- porque é o que o site e a prospecção continuam criando: nenhum
-- gatilho, nenhuma função e nenhum formulário precisa saber desta
-- coluna para continuar funcionando.
-- ===================================================================

create type cobranca_lead as enum ('mensal', 'projeto');

alter table lead
  add column cobranca cobranca_lead not null default 'mensal',
  add column servico  text;

comment on column lead.cobranca is
  'mensal: fee que recomeça todo mês. projeto: pagamento único, obra com fim. Define em qual dos dois totais do funil o valor entra, e os dois NUNCA se somam.';

comment on column lead.servico is
  'O que está sendo vendido quando a cobrança é de projeto: site, landing page, identidade visual, SEO. Texto livre de propósito: a lista de serviços avulsos muda mais rápido que um enum.';

-- ===================================================================
-- O FUNIL PASSA A FECHAR DOIS VALORES
-- ===================================================================
-- `valor_total` e `valor_ponderado` somavam os dois tipos de dinheiro
-- numa coluna só. Não dá para consertar mantendo as colunas antigas:
-- elas continuariam ali, certas na aparência e erradas no conteúdo, e
-- a primeira tela que as lesse voltaria a mentir. Então elas saem, e
-- quem lê a view é obrigado a escolher de qual dinheiro está falando.
-- ===================================================================

/* `create or replace view` NÃO serve aqui: o Postgres só deixa
   acrescentar coluna no fim, nunca renomear nem remover, e recusaria
   com "cannot change name of view column valor_total to valor_mensal".
   Derrubar e recriar é o único caminho, e é seguro porque nada no
   banco depende desta view: quem a lê é a aplicação. */
drop view if exists funil_comercial;

create view funil_comercial
with (security_invoker = on) as
select
  l.estagio,
  count(*)::int                                   as quantidade,

  coalesce(sum(l.valor_fee_estimado)
    filter (where l.cobranca = 'mensal'), 0)      as valor_mensal,
  coalesce(sum(l.valor_fee_estimado)
    filter (where l.cobranca = 'projeto'), 0)     as valor_projeto,

  /* Previsão PONDERADA pela probabilidade. A soma crua do funil é
     sempre otimista: trata como certo o lead que ainda não respondeu.
     Ponderada separada por tipo, pela mesma razão da soma. */
  coalesce(sum(l.valor_fee_estimado * coalesce(l.probabilidade, 50) / 100.0)
    filter (where l.cobranca = 'mensal'), 0)      as ponderado_mensal,
  coalesce(sum(l.valor_fee_estimado * coalesce(l.probabilidade, 50) / 100.0)
    filter (where l.cobranca = 'projeto'), 0)     as ponderado_projeto,

  round(avg(extract(epoch from (now() - l.estagio_desde)) / 86400)::numeric, 1)
                                                  as dias_medios_no_estagio,
  count(*) filter (where l.estagio_desde < now() - interval '7 days')::int
                                                  as parados
from lead l
group by l.estagio;

grant select on funil_comercial to authenticated;
