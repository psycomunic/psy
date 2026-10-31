-- ===================================================================
-- O QUE SAIU DAQUI, E PARA QUEM
--
-- E-mail é a única coisa que este sistema faz e que não deixa rastro
-- sozinha. Cobrança fica na fatura, tarefa fica na tarefa, lead fica no
-- funil. Mensagem enviada sai pela rede e acabou: sem registro, a
-- pergunta "a confirmação chegou para ela?" não tem resposta dentro do
-- painel, só no painel do provedor, que é de outra empresa e um dia
-- muda de dono.
--
-- ===================================================================
-- A CHAVE É O QUE EVITA O SEGUNDO ENVIO
-- ===================================================================
-- `registrar_lead_do_site` é idempotente por telefone em dez minutos:
-- clique duplo devolve o MESMO lead em vez de criar outro. Sem a chave
-- aqui, o lead seria um e a confirmação sairia duas vezes, e quem
-- preencheu o formulário receberia o mesmo e-mail em dobro por ter
-- clicado com vontade.
--
-- O índice é parcial de propósito. Aviso interno repetido não é
-- problema (chega outro e-mail para a agência, e pronto), então esses
-- vão sem chave, e `null` não conflita com `null` num índice único.
--
-- ===================================================================
-- O CORPO NÃO ENTRA
-- ===================================================================
-- Fica o tipo, o destino e o assunto. O corpo carrega o que a pessoa
-- escreveu no formulário, e isso já está no lead: guardar de novo aqui
-- seria uma segunda cópia do mesmo dado pessoal, em tabela que ninguém
-- lembra de olhar quando chega pedido de exclusão pela LGPD.
-- ===================================================================

create table if not exists email_enviado (
  id          bigserial primary key,
  tipo        text not null,
  chave       text,
  destino     text not null,
  assunto     text not null,
  -- Id que o provedor devolve. É por ele que se procura a entrega do
  -- lado de lá quando alguém diz que não recebeu.
  provedor_id text,
  -- enviado | falhou. Falha fica gravada: e-mail que não saiu é
  -- justamente o que precisa aparecer.
  status      text not null default 'enviado',
  erro        text,
  em          timestamptz not null default now()
);

create unique index if not exists email_chave_unica
  on email_enviado (tipo, chave)
  where chave is not null;

create index if not exists email_recentes
  on email_enviado (em desc);

comment on table email_enviado is
  'Trilha do que o sistema mandou por e-mail. Sem corpo da mensagem: o conteudo vive no lead ou na proposta de origem.';

comment on column email_enviado.chave is
  'Identidade do envio dentro do tipo, para o mesmo e-mail nao sair duas vezes. Nulo quando repetir nao faz mal.';

-- =====================================================================
-- RLS
--
-- Quem escreve aqui é o servidor, com a service role, que passa por
-- cima do RLS por definição. Nenhuma política de insert existe de
-- propósito: pela chave pública, esta tabela é somente leitura, e só
-- para o administrador.
--
-- Cliente não lê. O registro mostra para quem a agência escreveu, e
-- isso é a lista de contatos dela.
-- =====================================================================

alter table email_enviado enable row level security;
alter table email_enviado force  row level security;

create policy email_admin_le on email_enviado for select
  to authenticated using (public.e_admin());
