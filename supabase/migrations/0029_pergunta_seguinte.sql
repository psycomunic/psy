-- =====================================================================
-- 0029 - A pergunta que vai DEPOIS da mensagem de abertura.
--
-- POR QUE ELA É UM CAMPO, E NÃO O FIM DA MENSAGEM
--
-- São dois envios, e de propósito. A abertura apresenta e para. A
-- pergunta vai na mensagem seguinte, sozinha, porque uma mensagem com
-- duas coisas dentro é respondida pela primeira ou por nenhuma.
--
-- POR QUE ELA NÃO É `perguntas`
--
-- `perguntas` guarda a qualificação: fabrica ou revende, quanto vem do
-- WhatsApp, já pensou em loja própria. São três, e servem para a
-- CONVERSA, quando já existe conversa. Mandar as três de uma vez numa
-- DM é formulário, e formulário ninguém responde.
--
-- Esta aqui é uma só, e o trabalho dela é outro: fazer a pessoa
-- responder. Por isso pergunta a rotina dela, e não o interesse dela
-- na agência. "Tem interesse?" se responde com silêncio; "hoje o seu
-- lojista consegue fechar o pedido sozinho?" se responde com um não
-- que já é a dor.
--
-- AS QUATRO VERSÕES, pelo mesmo corte da oferta:
--
--   atacado   o lojista consegue comprar sem falar com alguém?
--   varejo    a cliente consegue comprar sem falar com alguém?
--   os dois   os dois pedidos saem do mesmo WhatsApp?
--   upgrade   a loja que já existe fecha venda sozinha?
--
-- Todas terminam em pergunta, e nenhuma pede reunião. O interesse se
-- mede pela resposta, e não por perguntar se existe.
-- =====================================================================

alter table prospeccao add column if not exists pergunta_seguinte text;

comment on column prospeccao.pergunta_seguinte is
  'A segunda mensagem da abordagem, uma pergunta só. NÃO confundir com `perguntas`, que é a qualificação para quando a conversa já existe.';

with nova(codigo, pergunta) as (values
  ('L001', 'Posso te perguntar uma coisa? Hoje o pedido do lojista e a venda para a cliente final saem do mesmo WhatsApp, com a mesma pessoa respondendo?'),
  ('L002', 'Posso te perguntar uma coisa? Hoje o pedido do lojista e a venda para a cliente final saem do mesmo WhatsApp, com a mesma pessoa respondendo?'),
  ('L003', 'Posso te perguntar uma coisa? Hoje o pedido do lojista e a venda para a cliente final saem do mesmo WhatsApp, com a mesma pessoa respondendo?'),
  ('L004', 'Posso te perguntar uma coisa? Hoje o pedido do lojista e a venda para a cliente final saem do mesmo WhatsApp, com a mesma pessoa respondendo?'),
  ('L005', 'Posso te perguntar uma coisa? Hoje o pedido do lojista e a venda para a cliente final saem do mesmo WhatsApp, com a mesma pessoa respondendo?'),
  ('L006', 'Posso te perguntar uma coisa? Hoje a sua cliente consegue ver a medida, escolher o tamanho e pagar sozinha, ou ainda depende de alguém responder no direct?'),
  ('L007', 'Posso te perguntar uma coisa? Hoje o seu lojista precisa falar com alguém para saber grade, preço e o que tem pronto, ou ele consegue fechar o pedido sozinho, a qualquer hora?'),
  ('L008', 'Posso te perguntar uma coisa? Hoje o seu lojista precisa falar com alguém para saber grade, preço e o que tem pronto, ou ele consegue fechar o pedido sozinho, a qualquer hora?'),
  ('L009', 'Posso te perguntar uma coisa? Hoje o seu lojista precisa falar com alguém para saber grade, preço e o que tem pronto, ou ele consegue fechar o pedido sozinho, a qualquer hora?'),
  ('L010', 'Posso te perguntar uma coisa? Hoje o seu lojista precisa falar com alguém para saber grade, preço e o que tem pronto, ou ele consegue fechar o pedido sozinho, a qualquer hora?'),
  ('L011', 'Posso te perguntar uma coisa? Hoje o pedido do lojista e a venda para a cliente final saem do mesmo WhatsApp, com a mesma pessoa respondendo?'),
  ('L012', 'Posso te perguntar uma coisa? Hoje o seu lojista precisa falar com alguém para saber grade, preço e o que tem pronto, ou ele consegue fechar o pedido sozinho, a qualquer hora?'),
  ('L013', 'Posso te perguntar uma coisa? A loja que vocês já têm fecha venda sozinha, ou o cliente ainda precisa chamar alguém no WhatsApp para concluir?'),
  ('L014', 'Posso te perguntar uma coisa? A loja que vocês já têm fecha venda sozinha, ou o cliente ainda precisa chamar alguém no WhatsApp para concluir?'),
  ('L015', 'Posso te perguntar uma coisa? Hoje o pedido do lojista e a venda para a cliente final saem do mesmo WhatsApp, com a mesma pessoa respondendo?'),
  ('L016', 'Posso te perguntar uma coisa? Hoje o seu lojista precisa falar com alguém para saber grade, preço e o que tem pronto, ou ele consegue fechar o pedido sozinho, a qualquer hora?'),
  ('L017', 'Posso te perguntar uma coisa? Hoje o seu lojista precisa falar com alguém para saber grade, preço e o que tem pronto, ou ele consegue fechar o pedido sozinho, a qualquer hora?'),
  ('L018', 'Posso te perguntar uma coisa? Hoje o seu lojista precisa falar com alguém para saber grade, preço e o que tem pronto, ou ele consegue fechar o pedido sozinho, a qualquer hora?'),
  ('L019', 'Posso te perguntar uma coisa? Hoje o seu lojista precisa falar com alguém para saber grade, preço e o que tem pronto, ou ele consegue fechar o pedido sozinho, a qualquer hora?'),
  ('L020', 'Posso te perguntar uma coisa? Hoje o seu lojista precisa falar com alguém para saber grade, preço e o que tem pronto, ou ele consegue fechar o pedido sozinho, a qualquer hora?'),
  ('L021', 'Posso te perguntar uma coisa? Hoje o seu lojista precisa falar com alguém para saber grade, preço e o que tem pronto, ou ele consegue fechar o pedido sozinho, a qualquer hora?'),
  ('L022', 'Posso te perguntar uma coisa? Hoje o seu lojista precisa falar com alguém para saber grade, preço e o que tem pronto, ou ele consegue fechar o pedido sozinho, a qualquer hora?'),
  ('L023', 'Posso te perguntar uma coisa? Hoje o seu lojista precisa falar com alguém para saber grade, preço e o que tem pronto, ou ele consegue fechar o pedido sozinho, a qualquer hora?'),
  ('L024', 'Posso te perguntar uma coisa? A loja que vocês já têm fecha venda sozinha, ou o cliente ainda precisa chamar alguém no WhatsApp para concluir?'),
  ('L025', 'Posso te perguntar uma coisa? Hoje o seu lojista precisa falar com alguém para saber grade, preço e o que tem pronto, ou ele consegue fechar o pedido sozinho, a qualquer hora?'),
  ('L026', 'Posso te perguntar uma coisa? Hoje a sua cliente consegue ver a medida, escolher o tamanho e pagar sozinha, ou ainda depende de alguém responder no direct?'),
  ('L027', 'Posso te perguntar uma coisa? Hoje o pedido do lojista e a venda para a cliente final saem do mesmo WhatsApp, com a mesma pessoa respondendo?'),
  ('L028', 'Posso te perguntar uma coisa? Hoje o pedido do lojista e a venda para a cliente final saem do mesmo WhatsApp, com a mesma pessoa respondendo?'),
  ('L029', 'Posso te perguntar uma coisa? A loja que vocês já têm fecha venda sozinha, ou o cliente ainda precisa chamar alguém no WhatsApp para concluir?'),
  ('L030', 'Posso te perguntar uma coisa? Hoje a sua cliente consegue ver a medida, escolher o tamanho e pagar sozinha, ou ainda depende de alguém responder no direct?'),
  ('L031', 'Posso te perguntar uma coisa? Hoje a sua cliente consegue ver a medida, escolher o tamanho e pagar sozinha, ou ainda depende de alguém responder no direct?'),
  ('L032', 'Posso te perguntar uma coisa? A loja que vocês já têm fecha venda sozinha, ou o cliente ainda precisa chamar alguém no WhatsApp para concluir?'),
  ('L033', 'Posso te perguntar uma coisa? A loja que vocês já têm fecha venda sozinha, ou o cliente ainda precisa chamar alguém no WhatsApp para concluir?'),
  ('L034', 'Posso te perguntar uma coisa? A loja que vocês já têm fecha venda sozinha, ou o cliente ainda precisa chamar alguém no WhatsApp para concluir?'),
  ('L035', 'Posso te perguntar uma coisa? Hoje o pedido do lojista e a venda para a cliente final saem do mesmo WhatsApp, com a mesma pessoa respondendo?'),
  ('L036', 'Posso te perguntar uma coisa? A loja que vocês já têm fecha venda sozinha, ou o cliente ainda precisa chamar alguém no WhatsApp para concluir?'),
  ('L037', 'Posso te perguntar uma coisa? Hoje o pedido do lojista e a venda para a cliente final saem do mesmo WhatsApp, com a mesma pessoa respondendo?'),
  ('L038', 'Posso te perguntar uma coisa? A loja que vocês já têm fecha venda sozinha, ou o cliente ainda precisa chamar alguém no WhatsApp para concluir?'),
  ('L039', 'Posso te perguntar uma coisa? A loja que vocês já têm fecha venda sozinha, ou o cliente ainda precisa chamar alguém no WhatsApp para concluir?'),
  ('L040', 'Posso te perguntar uma coisa? Hoje o seu lojista precisa falar com alguém para saber grade, preço e o que tem pronto, ou ele consegue fechar o pedido sozinho, a qualquer hora?'),
  ('L041', 'Posso te perguntar uma coisa? A loja que vocês já têm fecha venda sozinha, ou o cliente ainda precisa chamar alguém no WhatsApp para concluir?'),
  ('L042', 'Posso te perguntar uma coisa? A loja que vocês já têm fecha venda sozinha, ou o cliente ainda precisa chamar alguém no WhatsApp para concluir?'),
  ('L043', 'Posso te perguntar uma coisa? Hoje a sua cliente consegue ver a medida, escolher o tamanho e pagar sozinha, ou ainda depende de alguém responder no direct?'),
  ('L044', 'Posso te perguntar uma coisa? Hoje o pedido do lojista e a venda para a cliente final saem do mesmo WhatsApp, com a mesma pessoa respondendo?'),
  ('L045', 'Posso te perguntar uma coisa? Hoje o pedido do lojista e a venda para a cliente final saem do mesmo WhatsApp, com a mesma pessoa respondendo?'),
  ('L046', 'Posso te perguntar uma coisa? A loja que vocês já têm fecha venda sozinha, ou o cliente ainda precisa chamar alguém no WhatsApp para concluir?'),
  ('L047', 'Posso te perguntar uma coisa? A loja que vocês já têm fecha venda sozinha, ou o cliente ainda precisa chamar alguém no WhatsApp para concluir?'),
  ('L048', 'Posso te perguntar uma coisa? Hoje o pedido do lojista e a venda para a cliente final saem do mesmo WhatsApp, com a mesma pessoa respondendo?'),
  ('L049', 'Posso te perguntar uma coisa? A loja que vocês já têm fecha venda sozinha, ou o cliente ainda precisa chamar alguém no WhatsApp para concluir?'),
  ('L050', 'Posso te perguntar uma coisa? Hoje o seu lojista precisa falar com alguém para saber grade, preço e o que tem pronto, ou ele consegue fechar o pedido sozinho, a qualquer hora?'))
update prospeccao p
   set pergunta_seguinte = nova.pergunta
  from nova
 where p.codigo = nova.codigo
   and p.pergunta_seguinte is distinct from nova.pergunta;
