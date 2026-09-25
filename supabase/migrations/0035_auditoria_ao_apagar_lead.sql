-- =====================================================================
-- 0035 - Apagar lead passa a deixar rastro.
--
-- POR QUE SÓ AGORA, E SÓ O DELETE
--
-- `lead` nunca teve auditoria, e estava certo: o funil muda o dia
-- inteiro, e gravar cada arrastar de card encheria a trilha de ruído
-- sem responder pergunta nenhuma.
--
-- Apagar é outra coisa. É a única operação em `lead` que não tem volta:
-- a linha some, e com ela a pesquisa de prospecção e todo o histórico
-- de conversa, por cascata. Uma lista que ganhou um botão de excluir
-- precisa poder responder "quem apagou a Dukali, e o que tinha nela?".
--
-- O registrador guarda a linha inteira em `antes`, então a resposta é
-- completa: dá para recriar o lead a partir do log se tiver sido
-- engano.
--
-- POR QUE ISSO NÃO É UMA POLÍTICA NOVA
--
-- Quem pode apagar continua sendo só o administrador, e isso já está
-- decidido em dois lugares que precisam concordar: `lead_admin_exclui`,
-- aqui no banco, e `permissoes` em `src/lib/papeis.ts`. Este arquivo
-- não mexe em nenhum dos dois. Ele só garante que, quando o
-- administrador apagar, sobre registro.
-- =====================================================================

drop trigger if exists lead_auditoria_delete on lead;

create trigger lead_auditoria_delete after delete on lead
  for each row execute function public.registrar_auditoria();

comment on trigger lead_auditoria_delete on lead is
  'Só DELETE. Insert e update do funil acontecem o dia inteiro e virariam ruído na trilha; apagar é o que não tem volta.';
