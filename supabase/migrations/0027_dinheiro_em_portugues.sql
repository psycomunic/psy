-- =====================================================================
-- 0027 - Dinheiro em portugues nas notificacoes.
--
-- O QUE ESTAVA ERRADO
--
-- O sino mostrava "Cobranca vencida: R$ 1,000.00" e "investe cerca de
-- R$ 5,000/mes". Formato americano, em texto portugues, num aviso sobre
-- dinheiro: "1,000" se le como um real numa tela e como mil na outra.
--
-- POR QUE ACONTECIA
--
-- `to_char` com `G` e `D` na mascara pergunta o separador ao
-- `lc_numeric` do servidor, e no Supabase ele e `en_US.UTF-8`. Nao ha
-- como trocar isso por projeto, e depender dele seria deixar o formato
-- do dinheiro na mao da configuracao de outra pessoa.
--
-- O CONSERTO
--
-- `,` e `.` na mascara NAO sao locais: saem sempre virgula e ponto.
-- Escritos assim e trocados por `translate`, o resultado e o mesmo em
-- qualquer servidor: 1234567.5 -> "1.234.567,50".
--
-- So o texto muda. Nenhuma coluna, nenhuma politica, nenhum valor
-- guardado: o numero no banco continua sendo numero.
--
-- As duas funcoes voltam INTEIRAS, como estao no banco hoje, e nao por
-- remendo: funcao redefinida pela metade e o tipo de coisa que ninguem
-- consegue reconstituir lendo as migracoes em ordem.
-- =====================================================================

CREATE OR REPLACE FUNCTION public.gerar_lembretes()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_criadas integer := 0;
  v_hoje    date := public.hoje();
begin
  /* --- tarefa que vence dentro da janela do lembrete --------------- */
  with alvo as (
    select t.id, t.titulo, t.prazo, t.prioridade,
           coalesce(t.responsavel_id, a.id) as destino,
           (t.prazo - v_hoje) as faltam
      from public.tarefa t
      left join lateral (
        select p.id from public.perfil p
         where p.papel = 'administrador' and p.ativo
      ) a on t.responsavel_id is null
     where t.status in ('aberta', 'fazendo')
       and t.prazo is not null
       and t.prazo >= v_hoje
       and t.prazo <= v_hoje + t.lembrar_dias
  ),
  gravadas as (
    insert into public.notificacao (perfil_id, tipo, titulo, corpo, link, chave)
    select
      destino,
      'tarefa_vence',
      case when faltam = 0 then 'Vence hoje: ' || titulo
           when faltam = 1 then 'Vence amanhã: ' || titulo
           else 'Vence em ' || faltam || ' dias: ' || titulo end,
      'Prioridade ' || prioridade || '. Prazo ' || to_char(prazo, 'DD/MM/YYYY') || '.',
      '/painel/tarefas',
      'tarefa_vence:' || id || ':' || v_hoje
    from alvo
    where destino is not null
    on conflict (perfil_id, chave) do nothing
    returning 1
  )
  select count(*) into v_criadas from gravadas;

  /* --- tarefa que já passou do prazo ------------------------------- */
  with alvo as (
    select t.id, t.titulo, t.prazo,
           coalesce(t.responsavel_id, a.id) as destino,
           (v_hoje - t.prazo) as atraso
      from public.tarefa t
      left join lateral (
        select p.id from public.perfil p
         where p.papel = 'administrador' and p.ativo
      ) a on t.responsavel_id is null
     where t.status in ('aberta', 'fazendo')
       and t.prazo is not null
       and t.prazo < v_hoje
  ),
  gravadas as (
    insert into public.notificacao (perfil_id, tipo, titulo, corpo, link, chave)
    select
      destino,
      'tarefa_atrasada',
      'Atrasada há ' || atraso || case when atraso = 1 then ' dia: ' else ' dias: ' end || titulo,
      'O prazo era ' || to_char(prazo, 'DD/MM/YYYY') || '.',
      '/painel/tarefas',
      'tarefa_atrasada:' || id || ':' || v_hoje
    from alvo
    where destino is not null
    on conflict (perfil_id, chave) do nothing
    returning 1
  )
  select v_criadas + count(*) into v_criadas from gravadas;

  /* --- fatura vencida: vai para administrador e financeiro --------- */
  with alvo as (
    select f.id, f.numero, f.valor, f.vencimento, c.nome as cliente, p.id as destino
      from public.fatura f
      join public.conta c on c.id = f.conta_id
      cross join public.perfil p
     where f.status not in ('paga', 'cancelada')
       and f.vencimento < v_hoje
       and p.ativo
       and p.papel in ('administrador', 'financeiro')
  ),
  gravadas as (
    insert into public.notificacao (perfil_id, tipo, titulo, corpo, link, chave)
    select
      destino,
      'fatura_vencida',
      'Cobrança vencida: ' || cliente,
      numero || ' · R$ ' || translate(to_char(valor, 'FM999,999,990.00'), ',.', '.,')
        || ' · venceu em ' || to_char(vencimento, 'DD/MM/YYYY'),
      '/painel/financeiro?aba=cobrancas',
      'fatura_vencida:' || id || ':' || v_hoje
    from alvo
    on conflict (perfil_id, chave) do nothing
    returning 1
  )
  select v_criadas + count(*) into v_criadas from gravadas;

  return v_criadas;
end;
$function$;

CREATE OR REPLACE FUNCTION public.registrar_lead_do_site(p_nome text, p_empresa text, p_telefone text, p_email text DEFAULT NULL::text, p_verba numeric DEFAULT NULL::numeric, p_origem text DEFAULT 'site'::text, p_contexto text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
              then ' · investe cerca de R$ ' || translate(to_char(p_verba, 'FM999,999,990'), ',.', '.,') || '/mês'
              else '' end,
    '/painel/crm',
    'lead_novo:' || v_id
  from public.perfil p
  where p.ativo and p.papel in ('administrador', 'comercial')
  on conflict (perfil_id, chave) do nothing;

  return v_id;
end;
$function$;
