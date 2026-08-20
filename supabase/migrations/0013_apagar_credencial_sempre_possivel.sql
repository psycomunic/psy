-- =====================================================================
-- 0013 - Apagar uma credencial vazada não pode ser impossível.
--
-- O QUE ESTAVA ERRADO
--
-- A migração 0012 criou duas coisas boas que, juntas, se tornaram uma
-- ruim:
--
--   1. `integracao.credencial_id` com `on delete set null`, para que
--      apagar a credencial não apagasse o vínculo da loja.
--   2. O check `integracao_tem_de_onde_autenticar`, para que nenhuma
--      integração ativa ficasse parada sem credencial "sem erro
--      nenhum".
--
-- O resultado: ao apagar a credencial, o Postgres tenta pôr NULL em
-- `credencial_id`, e o check recusa a linha resultante. O DELETE falha
-- inteiro, com uma mensagem sobre violação de constraint numa tabela
-- que quem apagou nem mencionou.
--
-- POR QUE ISSO É GRAVE, E NÃO CHATO
--
-- A hora em que se apaga uma credencial é a hora em que ela vazou. É
-- exatamente o momento em que nada pode dar errado, e o sistema
-- respondia "não dá" — quanto mais lojas conectadas, mais firme o
-- bloqueio. A proteção estava protegendo o token, e não a agência.
--
-- Foi `npm run testar-credenciais` que encontrou, na asserção de que
-- apagar a credencial não apaga a loja.
--
-- O CONSERTO
--
-- Um gatilho BEFORE DELETE que desliga as integrações que dependiam
-- dela, ANTES de o `on delete set null` acontecer. Uma integração
-- desligada satisfaz o check pelo ramo `not ativa`, o DELETE passa, e a
-- loja fica num estado honesto: fonte desligada, com o motivo escrito.
--
-- O check continua valendo para todo o resto — ninguém consegue LIGAR
-- uma integração sem credencial nenhuma.
-- =====================================================================

create or replace function public.soltar_integracoes_da_credencial()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.integracao
     set ativa         = false,
         credencial_id = null,
         ultimo_erro   = 'Credencial da agência removida. Vincule outra para voltar a sincronizar.',
         erro_em       = now()
   where credencial_id = old.id;

  return old;
end;
$$;

comment on function public.soltar_integracoes_da_credencial() is
  'Desliga as integrações que usavam a credencial, antes de apagá-la. Sem isto, o check de "tem de onde autenticar" impediria remover um token vazado.';

drop trigger if exists credencial_solta_integracoes on credencial_agencia;

create trigger credencial_solta_integracoes
  before delete on credencial_agencia
  for each row execute function public.soltar_integracoes_da_credencial();
