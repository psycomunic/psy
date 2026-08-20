-- =====================================================================
-- 0005 - Conserta o gatilho que cria o perfil no cadastro.
--
-- O QUE QUEBROU
-- Criar o primeiro admin pela API falhou com:
--   new row for relation "perfil" violates check constraint
--   "cliente_precisa_de_conta"
--
-- Diagnostico: no momento do INSERT em auth.users, o GoTrue ainda nao
-- gravou o app_metadata que enviamos. O gatilho leu `papel` como nulo,
-- caiu no coalesce para 'cliente', e cliente sem conta_id e proibido
-- pela constraint de 0001.
--
-- A constraint estava CERTA e pegou o erro. Quem estava errado era o
-- gatilho, que assumia que o metadado ja existia.
--
-- TRES MUDANCAS
--
-- 1. Roda tambem no UPDATE de raw_app_meta_data. Se o papel chega num
--    segundo comando, o perfil e criado ali.
--
-- 2. NUNCA levanta excecao. Gatilho que falha aborta o INSERT em
--    auth.users inteiro, e o erro que chega na tela de cadastro nao tem
--    relacao visivel com a causa.
--
-- 3. Sem papel, NAO cria perfil. E o padrao seguro: usuario sem perfil
--    nao enxerga nada, porque `sessaoAtual()` devolve null e o RLS nao
--    encontra linha. As alternativas eram piores: cair em 'cliente'
--    quebra a constraint, e cair num papel interno daria acesso a
--    carteira inteira para quem se cadastrasse sozinho.
-- =====================================================================

create or replace function public.criar_perfil_novo_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_papel public.papel_usuario;
  v_conta uuid;
  v_nome  text;
begin
  -- Papel só do app_metadata, que o usuário não escreve. user_metadata
  -- é editável pelo próprio dono da conta: papel lido de lá seria
  -- promoção a admin em uma requisição.
  begin
    v_papel := (new.raw_app_meta_data ->> 'papel')::public.papel_usuario;
  exception when others then
    v_papel := null;   -- valor fora do enum: trata como ausente
  end;

  if v_papel is null then
    return new;        -- sem papel definido, sem perfil, sem acesso
  end if;

  begin
    v_conta := (new.raw_app_meta_data ->> 'conta_id')::uuid;
  exception when others then
    v_conta := null;
  end;

  -- Cliente sem conta não passa na constraint. Melhor não criar o
  -- perfil do que abortar a criação do usuário.
  if v_papel = 'cliente' and v_conta is null then
    return new;
  end if;

  v_nome := coalesce(
    new.raw_user_meta_data ->> 'nome',
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'Sem nome'
  );

  insert into public.perfil (id, nome, email, papel, conta_id)
  values (new.id, v_nome, coalesce(new.email, ''), v_papel, v_conta)
  on conflict (id) do update
    set papel    = excluded.papel,
        conta_id = excluded.conta_id,
        -- Nome e email só entram se ainda não havia nada, para um
        -- convite reprocessado não sobrescrever o que a pessoa já
        -- ajustou no perfil dela.
        nome     = coalesce(nullif(public.perfil.nome, ''), excluded.nome),
        email    = coalesce(nullif(public.perfil.email, ''), excluded.email);

  return new;
exception when others then
  -- Última rede: qualquer falha inesperada não pode derrubar o cadastro.
  -- O perfil ausente é detectado pelo script de criação e pelo painel.
  return new;
end;
$fn$;

-- O gatilho de INSERT continua; este cobre o caso do metadado chegar
-- depois. `is distinct from` evita reprocessar em todo UPDATE de
-- auth.users, que acontece a cada login.
drop trigger if exists ao_atualizar_metadados on auth.users;

create trigger ao_atualizar_metadados
  after update of raw_app_meta_data on auth.users
  for each row
  when (old.raw_app_meta_data is distinct from new.raw_app_meta_data)
  execute function public.criar_perfil_novo_usuario();
