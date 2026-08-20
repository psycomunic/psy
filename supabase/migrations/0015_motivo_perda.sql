-- =====================================================================
-- 0015 - `lead.perdido_por` passa a se chamar `motivo_perda`.
--
-- O QUE ESTAVA QUEBRADO
--
-- A migração 0002 criou a coluna como `perdido_por`. A aplicação
-- inteira, escrita depois, usa `motivo_perda`: a consulta do CRM, a
-- ação que marca o lead como perdido, o formulário do kanban e o
-- esquema de validação. Seis lugares contra um.
--
-- Resultado: a consulta de leads falhava com "column lead.motivo_perda
-- does not exist" em TODA abertura do CRM, desde que o campo foi
-- criado. E marcar um lead como perdido também falharia, porque a
-- escrita usa o mesmo nome.
--
-- O nome da aplicação é o melhor dos dois, e é por isso que o banco é
-- que muda: `perdido_por` se lê como "perdido por QUEM", e o conteúdo é
-- o motivo, não a pessoa. Num CRM, onde existe `responsavel_id` ao
-- lado, a ambiguidade não é teórica.
--
-- POR QUE ISSO PASSOU DESPERCEBIDO POR TANTO TEMPO
--
-- Porque a camada de dados tratava QUALQUER erro com "does not exist"
-- na mensagem como "as tabelas ainda não existem" e caía em dados de
-- DEMONSTRAÇÃO. A tela não mostrava erro nenhum: mostrava um funil
-- inventado, com nomes de empresa fictícios e R$ 13,6 mil de previsão,
-- para um administrador logado no banco de verdade.
--
-- O conserto dessa parte está em `src/lib/dados/consultas.ts`, e é o
-- mais importante dos dois: sem ele, o próximo erro de coluna volta a
-- virar dado falso em silêncio.
-- =====================================================================

do $$
begin
  if exists (
    select 1 from information_schema.columns
     where table_schema = 'public'
       and table_name = 'lead'
       and column_name = 'perdido_por'
  ) then
    alter table public.lead rename column perdido_por to motivo_perda;
  end if;
end $$;

comment on column public.lead.motivo_perda is
  'Por que o lead foi perdido, em texto. É o motivo, e não a pessoa: quem é responsável está em responsavel_id.';
