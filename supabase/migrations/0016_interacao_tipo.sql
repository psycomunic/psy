-- =====================================================================
-- 0016 - `interacao.canal` passa a se chamar `interacao.tipo`.
--
-- O QUE ESTAVA QUEBRADO
--
-- A migração 0002 criou a coluna como `canal`. A aplicação usa `tipo`
-- em cinco lugares: a consulta do diário de bordo, a ação que registra
-- a conversa, o esquema de validação, o formulário da ficha e o do
-- kanban.
--
-- Consequência: ler o diário de bordo falhava, e REGISTRAR uma conversa
-- falhava também. Nunca funcionou desde que foi escrito.
--
-- POR QUE O BANCO É QUE MUDA, E NÃO O CÓDIGO
--
-- `canal` já significa outra coisa neste banco, e significa em toda
-- parte: é a origem da venda em `metrica_diaria`, em `kpi_canal`, na
-- importação de planilha e nos conectores. Google, Meta, orgânico,
-- direto.
--
-- Uma segunda `canal` querendo dizer "ligação, reunião, WhatsApp" na
-- tabela ao lado é o tipo de colisão que produz consulta errada meses
-- depois, escrita por alguém que leu o nome e assumiu o significado
-- mais comum. `tipo` não colide com nada.
--
-- SOBRE `ocorrida_em`
--
-- A ação de registrar interação também gravava `ocorrida_em`, coluna
-- que nunca existiu. Ela sai do código, e não entra aqui: `criada_em`
-- já tem `default now()` e responde a mesma pergunta. Coluna nova só
-- se justifica quando a conversa aconteceu num dia e foi registrada em
-- outro, e isso ninguém pediu.
-- =====================================================================

do $$
begin
  if exists (
    select 1 from information_schema.columns
     where table_schema = 'public'
       and table_name = 'interacao'
       and column_name = 'canal'
  ) then
    alter table public.interacao rename column canal to tipo;
  end if;
end $$;

comment on column public.interacao.tipo is
  'Como a conversa aconteceu: ligacao, reuniao, whatsapp, email ou nota. NÃO confundir com `canal` de mídia, que é a origem da venda em metrica_diaria.';
