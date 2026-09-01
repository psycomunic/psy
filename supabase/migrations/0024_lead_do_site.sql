-- =====================================================================
-- 0024 — o formulário do site vira lead no CRM
-- =====================================================================
--
-- ============================================================
-- POR QUE NÃO EXISTE POLÍTICA DE ESCRITA PARA `anon`
-- ============================================================
-- O caminho óbvio seria dar `insert` em `lead` para a chave pública e
-- deixar o formulário gravar direto. Seria um erro: qualquer pessoa com
-- a chave — que vai no navegador, por definição — poderia despejar
-- linhas na tabela em qualquer volume, com qualquer conteúdo, sem
-- passar por validação nenhuma.
--
-- CRM entupido de lixo não é só incômodo. É a lista onde alguém procura
-- o cliente que ligou ontem, e ela deixa de servir.
--
-- Então `lead` continua fechada para a chave pública. Quem grava é esta
-- função, chamada pela server action com a service role, depois de
-- validar. A superfície pública é a action, que a gente controla, e não
-- a tabela.
--
-- ============================================================
-- E POR QUE ELA AVISA
-- ============================================================
-- Lead que chega e ninguém vê é lead perdido. A função cria a
-- notificação junto, na mesma transação: gravar o lead e avisar não
-- podem ter destinos diferentes em caso de falha.

/* O tipo novo precisa entrar no check antes de ser usado. */
alter table notificacao drop constraint if exists notificacao_tipo_check;
alter table notificacao
  add constraint notificacao_tipo_check
  check (tipo in ('tarefa_vence', 'tarefa_atrasada', 'fatura_vencida', 'lead_novo', 'aviso'));


create or replace function public.registrar_lead_do_site(
  p_nome      text,
  p_empresa   text,
  p_telefone  text,
  p_email     text default null,
  p_verba     numeric default null,
  p_origem    text default 'site',
  p_contexto  text default null
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id      uuid;
  v_recente uuid;
begin
  if p_nome is null or btrim(p_nome) = '' then
    raise exception 'Nome é obrigatório.';
  end if;
  if p_telefone is null or btrim(p_telefone) = '' then
    raise exception 'Telefone é obrigatório.';
  end if;

  /*
    Mesmo telefone nos últimos dez minutos é envio repetido, não lead
    novo. Acontece por clique duplo, por voltar e reenviar, e por robô.

    Devolve o lead que já existe em vez de recusar: para quem preencheu,
    o formulário deu certo — e deu mesmo. Recusar faria a pessoa achar
    que falhou e tentar de novo, criando o terceiro.
  */
  select id into v_recente
    from public.lead
   where telefone = btrim(p_telefone)
     and criado_em > now() - interval '10 minutes'
   order by criado_em desc
   limit 1;

  if v_recente is not null then
    return v_recente;
  end if;

  insert into public.lead (
    nome, empresa, telefone, email, origem,
    valor_verba_estimada, observacoes,
    proximo_passo, proximo_passo_em
  ) values (
    btrim(p_nome),
    nullif(btrim(coalesce(p_empresa, '')), ''),
    btrim(p_telefone),
    nullif(btrim(lower(coalesce(p_email, ''))), ''),
    coalesce(p_origem, 'site'),
    p_verba,
    p_contexto,
    'Responder e marcar a análise da conta',
    (public.hoje() + 1)
  )
  returning id into v_id;

  /*
    Avisa administrador e comercial. Sem responsável definido ainda —
    quem chegar primeiro pega —, então o aviso vai para todos que
    podem atender.
  */
  insert into public.notificacao (perfil_id, tipo, titulo, corpo, link, chave)
  select
    p.id,
    'lead_novo',
    'Lead novo: ' || coalesce(nullif(btrim(coalesce(p_empresa, '')), ''), btrim(p_nome)),
    btrim(p_nome) || ' · ' || btrim(p_telefone)
      || case when p_verba is not null
              then ' · investe cerca de R$ ' || to_char(p_verba, 'FM999G999G990') || '/mês'
              else '' end,
    '/painel/crm',
    'lead_novo:' || v_id
  from public.perfil p
  where p.ativo and p.papel in ('administrador', 'comercial')
  on conflict (perfil_id, chave) do nothing;

  return v_id;
end;
$$;

/*
  Ninguém executa isto pela chave pública, nem logado. Só a service
  role, que vive no servidor. É o que separa "formulário do site" de
  "endpoint de escrita aberto".
*/
revoke execute on function public.registrar_lead_do_site(text, text, text, text, numeric, text, text) from public;
revoke execute on function public.registrar_lead_do_site(text, text, text, text, numeric, text, text) from anon;
revoke execute on function public.registrar_lead_do_site(text, text, text, text, numeric, text, text) from authenticated;

comment on function public.registrar_lead_do_site(text, text, text, text, numeric, text, text) is
  'Grava o lead vindo do site e avisa quem atende, na mesma transação. Idempotente por telefone em janela de 10 minutos: clique duplo não vira dois leads.';
