-- =====================================================================
-- 0014 - `frete` passa a ter como ser preenchido.
--
-- A migração 0012 criou a coluna e parou aí: nenhuma fonte escrevia
-- nela. Coluna que ninguém preenche é pior que coluna nenhuma — ela
-- aparece no schema, alguém confia, e o que sai é zero.
--
-- A definição do operador é "receita = pedido aprovado, valor total com
-- frete". `frete` é a PARCELA já contida em `receita`, e não uma
-- segunda receita: somar as duas contaria o frete duas vezes. Ela só
-- existe para a definição poder mudar sem reimportar histórico.
--
-- Único bloco alterado: o da loja. Nem Google nem Meta sabem quanto foi
-- frete, e escrever zero a partir deles apagaria o que a loja gravou.
-- =====================================================================
create or replace function public.registrar_metricas(
  p_conta    uuid,
  p_provedor text,
  p_linhas   jsonb
) returns integer
language plpgsql
set search_path = ''
as $$
declare
  v_gravadas integer := 0;
  v_max_dia  date;
begin
  if p_linhas is null or jsonb_typeof(p_linhas) <> 'array' then
    raise exception 'registrar_metricas espera um array de linhas.';
  end if;

  select max((l->>'dia')::date) into v_max_dia
    from jsonb_array_elements(p_linhas) l;

  if v_max_dia > public.hoje() then
    raise exception 'Linha com dia no futuro (%). Confira o fuso da fonte.', v_max_dia;
  end if;

  if p_provedor in ('loja', 'magazord', 'shopify', 'planilha_loja') then
    insert into public.metrica_diaria as m (
      conta_id, dia, canal,
      pedidos_captados, pedidos_aprovados, receita, receita_bruta, frete,
      novos_clientes, pedidos,
      sincronizada_em
    )
    select
      p_conta,
      (l->>'dia')::date,
      coalesce(nullif(l->>'canal', ''), 'loja'),
      coalesce((l->>'pedidos_captados')::integer, 0),
      coalesce((l->>'pedidos_aprovados')::integer, 0),
      coalesce((l->>'receita')::numeric, 0),
      coalesce((l->>'receita_bruta')::numeric, 0),
      coalesce((l->>'frete')::numeric, 0),
      coalesce((l->>'novos_clientes')::integer, 0),
      coalesce((l->>'pedidos_aprovados')::integer, 0),
      now()
    from jsonb_array_elements(p_linhas) l
    on conflict (conta_id, dia, canal) do update set
      pedidos_captados  = excluded.pedidos_captados,
      pedidos_aprovados = excluded.pedidos_aprovados,
      receita           = excluded.receita,
      receita_bruta     = excluded.receita_bruta,
      frete             = excluded.frete,
      novos_clientes    = excluded.novos_clientes,
      pedidos           = excluded.pedidos_aprovados,
      sincronizada_em   = now();

  elsif p_provedor in ('ga4', 'analytics', 'planilha_sessao') then
    insert into public.metrica_diaria as m (
      conta_id, dia, canal, sessoes, sincronizada_em
    )
    select
      p_conta,
      (l->>'dia')::date,
      coalesce(nullif(l->>'canal', ''), 'organico'),
      coalesce((l->>'sessoes')::integer, 0),
      now()
    from jsonb_array_elements(p_linhas) l
    on conflict (conta_id, dia, canal) do update set
      sessoes         = excluded.sessoes,
      sincronizada_em = now();

  elsif p_provedor in ('google_ads', 'meta_ads', 'tiktok_ads', 'planilha_midia') then
    insert into public.metrica_diaria as m (
      conta_id, dia, canal,
      investimento, cliques, impressoes, receita_atribuida,
      sincronizada_em
    )
    select
      p_conta,
      (l->>'dia')::date,
      nullif(l->>'canal', ''),
      coalesce((l->>'investimento')::numeric, 0),
      coalesce((l->>'cliques')::integer, 0),
      coalesce((l->>'impressoes')::integer, 0),
      coalesce((l->>'receita_atribuida')::numeric, 0),
      now()
    from jsonb_array_elements(p_linhas) l
    on conflict (conta_id, dia, canal) do update set
      investimento      = excluded.investimento,
      cliques           = excluded.cliques,
      impressoes        = excluded.impressoes,
      receita_atribuida = excluded.receita_atribuida,
      sincronizada_em   = now();

  else
    raise exception 'Provedor desconhecido: %.', p_provedor;
  end if;

  get diagnostics v_gravadas = row_count;
  return v_gravadas;
end;
$$;

revoke execute on function public.registrar_metricas(uuid, text, jsonb) from public;
revoke execute on function public.registrar_metricas(uuid, text, jsonb) from anon;
revoke execute on function public.registrar_metricas(uuid, text, jsonb) from authenticated;
