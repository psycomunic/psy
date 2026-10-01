-- =====================================================================
-- 0045 - Postagens: o calendário de conteúdo, com os arquivos.
--
-- OS DOIS PERFIS SÃO UM ENUM, E NÃO TEXTO LIVRE
--
-- São dois, conhecidos, e cada um tem voz própria: @reysonmkt é a
-- pessoa e @psycomunic é a empresa. Texto livre deixaria entrar
-- "Reyson", "reyson mkt" e "@reysonmkt" como três perfis diferentes, e
-- o filtro do mês passaria a mentir. Um terceiro perfil é uma linha
-- neste arquivo no dia em que existir.
--
-- POR QUE `situacao` E NÃO UM "publicado: sim/não"
--
-- Porque o que trava uma postagem quase nunca é "falta publicar". É
-- falta gravar, falta editar, falta escrever a legenda. Com um
-- booleano, tudo o que não foi ao ar vira a mesma coisa, e a tela deixa
-- de responder o que se vai fazer hoje.
--
-- OS ARQUIVOS EM TABELA PRÓPRIA
--
-- Um carrossel tem dez imagens, e cada uma precisa de nome, tipo e
-- tamanho para a tela mostrar miniatura e peso. Um `text[]` de caminhos
-- guardaria só o caminho, e o nome original (que é como a pessoa
-- reconhece o arquivo) se perderia.
--
-- `on delete cascade`: a lista some com a postagem. Os OBJETOS no bucket
-- não somem sozinhos, e é a ação de apagar que cuida disso. O banco não
-- tem como apagar arquivo, e fingir que tem seria pior que não ter.
--
-- O BUCKET É PRIVADO
--
-- Criativo de campanha que ainda não foi ao ar é informação comercial.
-- Bucket público significa que qualquer pessoa com o endereço vê, e
-- endereço vaza em print, em histórico e em log. A tela monta links
-- assinados de hora em hora, e quem não está logado não recebe nada.
-- =====================================================================

create type perfil_social as enum ('reysonmkt', 'psycomunic');

create type formato_post as enum ('feed', 'carrossel', 'reels', 'story');

create type situacao_post as enum (
  'ideia', 'roteiro', 'gravar', 'editar', 'pronto', 'agendado', 'publicado'
);

create table postagem (
  id             uuid primary key default gen_random_uuid(),
  perfil         perfil_social not null,
  formato        formato_post not null default 'feed',

  /* O assunto, para a lista. A legenda é outra coisa: é o que vai ao
     ar, e cabe inteira com emoji e quebra de linha. */
  tema           text not null,
  legenda        text,

  /* Quando vai ao ar. Nulo é ideia sem data, que é metade de um
     calendário de conteúdo honesto. */
  data           date,
  hora           time,

  situacao       situacao_post not null default 'ideia',
  responsavel_id uuid references perfil(id) on delete set null,
  observacoes    text,

  /* O endereço do post depois de publicado, para achar o que rendeu. */
  link           text,
  publicado_em   date,

  /* Mantido por gatilho, como em `projeto`: se dependesse da tela, uma
     alteração por SQL pararia o relógio. */
  situacao_desde timestamptz not null default now(),

  criado_em      timestamptz not null default now(),
  atualizado_em  timestamptz not null default now()
);

create index postagem_data_idx    on postagem(data);
create index postagem_perfil_idx  on postagem(perfil, situacao);

comment on table postagem is
  'Calendário de conteúdo dos perfis da casa. Os arquivos ficam em postagem_arquivo e no bucket `midia`.';

create table postagem_arquivo (
  id          uuid primary key default gen_random_uuid(),
  postagem_id uuid not null references postagem(id) on delete cascade,

  /* O caminho DENTRO do bucket. Nunca uma URL: endereço assinado vence,
     e guardar um vencido é guardar lixo que parece link. */
  caminho     text not null unique,
  nome        text not null,
  tipo        text,
  tamanho     bigint,
  criado_em   timestamptz not null default now()
);

create index postagem_arquivo_idx on postagem_arquivo(postagem_id);

comment on column postagem_arquivo.caminho is
  'Caminho dentro do bucket `midia`. O endereço de leitura é assinado na hora, e por isso não se guarda.';

-- ---------------------------------------------------------------------
-- O relógio da situação, e a data de publicação
-- ---------------------------------------------------------------------
create or replace function public.tocar_situacao_postagem()
returns trigger
language plpgsql
set search_path = ''
as $fn$
begin
  if new.situacao is distinct from old.situacao then
    new.situacao_desde := now();
    new.publicado_em := case when new.situacao = 'publicado' then current_date end;
  end if;
  return new;
end;
$fn$;

drop trigger if exists postagem_situacao_desde on postagem;
create trigger postagem_situacao_desde before update on postagem
  for each row execute function public.tocar_situacao_postagem();

drop trigger if exists postagem_toca on postagem;
create trigger postagem_toca before update on postagem
  for each row execute function public.tocar_atualizado_em();

-- ---------------------------------------------------------------------
-- RLS das duas tabelas
--
-- Mesma regra do resto do trabalho interno: interno lê e escreve, só o
-- administrador apaga, cliente não recebe linha nenhuma.
-- ---------------------------------------------------------------------
alter table postagem enable row level security;
alter table postagem force  row level security;
alter table postagem_arquivo enable row level security;
alter table postagem_arquivo force  row level security;

create policy postagem_interno_le on postagem for select
  to authenticated using (public.e_interno());
create policy postagem_interno_cria on postagem for insert
  to authenticated with check (public.e_interno());
create policy postagem_interno_altera on postagem for update
  to authenticated using (public.e_interno()) with check (public.e_interno());
create policy postagem_admin_exclui on postagem for delete
  to authenticated using (public.e_admin());

/* O arquivo acompanha a postagem: quem pode mexer numa pode mexer na
   outra. A exceção é apagar, e aqui ela é DIFERENTE da tabela acima: um
   arquivo trocado é edição do dia a dia, e não ato irreversível de
   administrador. Quem apaga a postagem inteira continua sendo só ele. */
create policy arquivo_interno_le on postagem_arquivo for select
  to authenticated using (public.e_interno());
create policy arquivo_interno_cria on postagem_arquivo for insert
  to authenticated with check (public.e_interno());
create policy arquivo_interno_apaga on postagem_arquivo for delete
  to authenticated using (public.e_interno());

drop trigger if exists postagem_auditoria_delete on postagem;
create trigger postagem_auditoria_delete after delete on postagem
  for each row execute function public.registrar_auditoria();

-- ---------------------------------------------------------------------
-- O bucket, e quem pode mexer nele
--
-- `public: false`. A leitura acontece por endereço assinado, montado no
-- servidor a cada carregamento, e as políticas abaixo valem para a
-- chave pública, que é a única que chega no navegador.
--
-- `storage.objects` já nasce com RLS ligada no Supabase. Sem política
-- nenhuma, ninguém lê nem escreve, que é o estado de agora.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('midia', 'midia', false)
on conflict (id) do nothing;

drop policy if exists midia_interno_le     on storage.objects;
drop policy if exists midia_interno_envia  on storage.objects;
drop policy if exists midia_interno_altera on storage.objects;
drop policy if exists midia_interno_apaga  on storage.objects;

create policy midia_interno_le on storage.objects for select
  to authenticated using (bucket_id = 'midia' and public.e_interno());

create policy midia_interno_envia on storage.objects for insert
  to authenticated with check (bucket_id = 'midia' and public.e_interno());

create policy midia_interno_altera on storage.objects for update
  to authenticated using (bucket_id = 'midia' and public.e_interno())
  with check (bucket_id = 'midia' and public.e_interno());

create policy midia_interno_apaga on storage.objects for delete
  to authenticated using (bucket_id = 'midia' and public.e_interno());
