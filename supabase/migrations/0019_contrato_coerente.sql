-- =====================================================================
-- 0019 — contrato não termina antes de começar
-- =====================================================================
--
-- Apareceu ao testar o encerramento de um contrato AGENDADO: o
-- formulário oferecia "último dia", a pessoa punha a data de hoje, e
-- gravava um contrato que começa em setembro e termina em agosto.
--
-- A tela também passou a barrar isso, com mensagem melhor. A constraint
-- fica porque a tela é uma das portas: a rotina de conversão de lead, a
-- importação e qualquer script escrevem na mesma tabela. Invariante que
-- não pode quebrar mora no banco.

alter table contrato
  add constraint contrato_fim_depois_do_inicio
  check (fim is null or fim >= inicio);

alter table contrato
  add constraint contrato_fee_nao_negativo
  check (fee_mensal >= 0);
