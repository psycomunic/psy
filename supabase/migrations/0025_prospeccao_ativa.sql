-- =====================================================================
-- 0025 - Prospecção ativa: a pesquisa que antecede o primeiro contato.
--
-- O QUE ESTA TABELA É, E O QUE ELA NÃO É
--
-- `lead` é o FUNIL: em que estágio está, quanto vale, qual o próximo
-- passo, quem responde por ele. Isso não muda por lead ter vindo de
-- indicação ou de uma lista levantada à mão.
--
-- O que muda é o que se sabe ANTES de falar. Numa lista de prospecção
-- existe pesquisa: a cidade, o segmento, se fabrica, se já vende
-- online, quantos seguidores tem, qual o gancho e qual a mensagem que
-- vai ser enviada. Nada disso existe num lead que chegou pelo site.
--
-- Por isso são duas tabelas e não onze colunas quase sempre nulas em
-- `lead`. E por isso NENHUM campo aparece nas duas: estágio, próximo
-- passo, data e responsável continuam morando só em `lead`. Dado
-- repetido em dois lugares é dado que vai divergir.
--
-- POR QUE `id` PRÓPRIO, SE A CHAVE NATURAL É `lead_id`
--
-- `lead_id unique` já garantiria o um-para-um. O `id` existe porque
-- `registrar_auditoria()` lê `new.id`: uma tabela sem essa coluna
-- quebra o gatilho no dia em que alguém resolver auditá-la, e o erro
-- aparece na escrita, não na criação.
--
-- SOBRE AUDITORIA
--
-- Esta tabela NÃO grava auditoria, pelo mesmo motivo que `lead` não
-- grava: não guarda dinheiro, permissão nem credencial. É pesquisa
-- pública sobre empresa pública. O que decide "quem pode ver" continua
-- sendo o RLS, e esse tem política escrita abaixo.
-- =====================================================================

create table if not exists prospeccao (
  id                  uuid primary key default gen_random_uuid(),

  /* Um por lead. `on delete cascade` porque a pesquisa sem o lead não
     responde pergunta nenhuma: ela existe para abordar aquela empresa. */
  lead_id             uuid not null unique references lead(id) on delete cascade,

  /* O código da lista de origem (L001...). É o que torna a importação
     repetível: rodar a carga duas vezes não duplica ninguém. */
  codigo              text unique,

  instagram           text,
  instagram_url       text,
  cidade              text,
  uf                  text,
  regiao              text,
  segmento            text,
  modelo_venda        text,

  /* Texto, e não booleano: a lista distingue "Sim" de "Confirmar", e
     "ainda não sei" não é o mesmo que "não". Um booleano nulável diria
     as três coisas, mas o `false` nunca seria escrito e a coluna
     viraria "sim ou talvez" com cara de sim ou não. */
  fabricacao_propria  text,

  situacao_site       text,

  /* Aproximado, e assumido como tal: vem do perfil no dia do
     levantamento e envelhece sozinho. Inteiro para ordenar, que é a
     única pergunta que ele responde aqui. Nulo é "não informado". */
  seguidores          integer,

  prioridade          text check (prioridade in ('A','B','C')),
  oportunidade        text,

  /* O que chamou atenção, a mensagem que vai ser enviada e o que
     perguntar quando responderem. Escrito antes de abordar, e não
     durante: é isso que separa prospecção de improviso. */
  gancho              text,
  mensagem_abertura   text,
  perguntas           text,

  /* Onde a abordagem acontece: DM, WhatsApp, e-mail. Não confundir com
     `origem` do lead, que é como ele chegou até a agência. */
  canal               text,

  notas               text,
  criado_em           timestamptz not null default now(),
  atualizado_em       timestamptz not null default now()
);

create index if not exists prospeccao_prioridade_idx on prospeccao(prioridade);
create index if not exists prospeccao_cidade_idx     on prospeccao(cidade);

comment on table prospeccao is
  'Pesquisa de prospecção ativa, um para um com lead. O funil (estágio, próximo passo, responsável) continua em lead: nenhum campo vive nas duas.';
comment on column prospeccao.seguidores is
  'Aproximado, do dia do levantamento. Serve para ordenar, não para relatório.';
comment on column prospeccao.canal is
  'Onde a abordagem acontece (DM, WhatsApp). NÃO é o `canal` de mídia de metrica_diaria nem a `origem` do lead.';

-- ---------------------------------------------------------------------
-- RLS
--
-- Mesma regra de `lead`, e pelo mesmo motivo: é informação comercial
-- da agência. Interno lê e escreve, só o administrador apaga.
--
-- Cliente não recebe linha nenhuma. Não há política para ele, e sem
-- política a linha não volta: a ausência AQUI é o que protege.
-- ---------------------------------------------------------------------
alter table prospeccao enable row level security;
alter table prospeccao force  row level security;

drop policy if exists prospeccao_interno_le     on prospeccao;
drop policy if exists prospeccao_interno_cria   on prospeccao;
drop policy if exists prospeccao_interno_altera on prospeccao;
drop policy if exists prospeccao_admin_exclui   on prospeccao;

create policy prospeccao_interno_le on prospeccao for select
  to authenticated using (public.e_interno());

create policy prospeccao_interno_cria on prospeccao for insert
  to authenticated with check (public.e_interno());

create policy prospeccao_interno_altera on prospeccao for update
  to authenticated using (public.e_interno()) with check (public.e_interno());

create policy prospeccao_admin_exclui on prospeccao for delete
  to authenticated using (public.e_admin());

drop trigger if exists prospeccao_toca on prospeccao;
create trigger prospeccao_toca before update on prospeccao
  for each row execute function public.tocar_atualizado_em();
