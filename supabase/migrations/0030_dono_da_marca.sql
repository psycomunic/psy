-- =====================================================================
-- 0030 - O perfil do dono, ao lado do perfil da marca.
--
-- A ABORDAGEM MUDOU, E O DADO ACOMPANHA
--
-- A lista nasceu para falar com o @ da marca. Na prática a conversa
-- acontece com a pessoa: segue o dono, chama o dono. São dois perfis
-- diferentes, e o segundo não tinha onde morar.
--
-- POR QUE O CNPJ ENTRA JUNTO
--
-- É por ele que o nome aparece. Numa empresa individual, a RAZÃO
-- SOCIAL registrada É o nome da pessoa: "Mirian Alves Maia" para o
-- "Atacadão das Malhas". O caminho é consultar o CNPJ, ler a razão
-- social e seguir a pessoa. Guardar o CNPJ é guardar o passo que já
-- foi dado, para ninguém refazer a busca na semana seguinte.
--
-- Guardado só com os dígitos. Pontuação é decoração de tela, e é o que
-- faz duas gravações do mesmo CNPJ não se reconhecerem.
--
-- POR QUE O NOME NÃO GANHA COLUNA
--
-- O NOME do dono não entra aqui. Ele já tem casa: `lead.nome`, que é
-- "com quem você falou" e hoje guarda o @ da marca só porque, na
-- importação, não havia nada melhor para pôr num campo obrigatório.
--
-- Guardar o nome também em `prospeccao` criaria o caso que esta base
-- evita desde a 0025: o mesmo fato em duas tabelas, divergindo na
-- primeira correção feita de um lado só. A ficha do CRM mostraria um
-- nome e o cartão da prospecção mostraria outro.
--
-- Sobram o @ do dono e o CNPJ, que não têm equivalente em `lead`:
-- `instagram` já é o da marca, e os dois precisam existir juntos,
-- porque é pelo da marca que se confere que é a pessoa certa.
--
-- SÓ O ARROBA, E NÃO O ENDEREÇO
--
-- A URL sai do arroba por concatenação, e guardar as duas coisas seria
-- deixar que discordassem. Quem preenche pode colar o link inteiro: a
-- ação normaliza antes de gravar.
-- =====================================================================

alter table prospeccao
  add column if not exists instagram_dono text,
  add column if not exists cnpj           text;

alter table prospeccao drop constraint if exists cnpj_so_digitos;
alter table prospeccao
  add constraint cnpj_so_digitos
  check (cnpj is null or cnpj ~ '^[0-9]{14}$');

comment on column prospeccao.instagram_dono is
  'O @ do PERFIL PESSOAL do dono, normalizado com arroba. O perfil da marca continua em `instagram`. O nome dele mora em lead.nome, e não aqui.';
comment on column prospeccao.cnpj is
  'Só os 14 dígitos. É por ele que se acha a razão social, que numa empresa individual é o nome do dono.';
