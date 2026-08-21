-- =====================================================================
-- 0018 — a fatura tem de caber na vigência do contrato
-- =====================================================================
--
-- `emitir_fatura` só olhava se a fatura da competência já existia. Ela
-- emitia igual para contrato que ainda não começou e para contrato já
-- encerrado.
--
-- Isso deixou de ser hipótese quando o reajuste passou a encerrar um
-- contrato e abrir outro: por algumas semanas as duas vigências existem
-- ao mesmo tempo, uma terminando e outra agendada. Emitir pela agendada
-- cobraria o fee novo num mês que ainda vale pelo antigo — e a conversa
-- que vem depois é o cliente perguntando por que a fatura subiu antes
-- da data combinada.
--
-- A regra é por MÊS, não por dia: contrato que começa dia 15 fatura o
-- mês inteiro em que começou, e contrato que termina dia 10 ainda
-- fatura o mês em que terminou. Quem decide proporcional é a
-- negociação, não o banco.

create or replace function public.emitir_fatura(
  p_contrato_id uuid,
  p_competencia date
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_contrato  record;
  v_fatura_id uuid;
  v_venc      date;
  v_numero    text;
  v_mes       date;
begin
  if not coalesce(
       public.papel_atual() in ('administrador', 'financeiro'),
       false) then
    raise exception 'Sem permissão para emitir fatura.';
  end if;

  select * into v_contrato from public.contrato where id = p_contrato_id;
  if not found then
    raise exception 'Contrato não encontrado.';
  end if;

  v_mes := date_trunc('month', p_competencia)::date;

  if v_mes < date_trunc('month', v_contrato.inicio)::date then
    raise exception 'Este contrato começa em % e não fatura %.',
      to_char(v_contrato.inicio, 'DD/MM/YYYY'), to_char(v_mes, 'MM/YYYY');
  end if;

  if v_contrato.fim is not null
     and v_mes > date_trunc('month', v_contrato.fim)::date then
    raise exception 'Este contrato terminou em % e não fatura %.',
      to_char(v_contrato.fim, 'DD/MM/YYYY'), to_char(v_mes, 'MM/YYYY');
  end if;

  /* Já existe a do mês? Devolve ela. O índice único de (contrato,
     competência) é a garantia de verdade; esta consulta é o caminho
     rápido para não depender de capturar erro de constraint. */
  select id into v_fatura_id
    from public.fatura
   where contrato_id = p_contrato_id
     and competencia = v_mes;

  if v_fatura_id is not null then
    return v_fatura_id;
  end if;

  /* Vencimento no dia 10 da competência. O contrato de 0003 não tem
     dia de vencimento próprio, e inventar um por loja aqui seria
     esconder a regra num lugar que ninguém vai procurar. */
  v_venc := (date_trunc('month', p_competencia) + interval '9 days')::date;

  /* Número legível e único: ano-mês mais os oito primeiros do contrato.
     Sequência global obrigaria uma tabela de contador só para isso. */
  v_numero := to_char(p_competencia, 'YYYYMM') || '-' || substr(p_contrato_id::text, 1, 8);

  insert into public.fatura (
    conta_id, contrato_id, numero, status, valor, competencia, vencimento
  ) values (
    v_contrato.conta_id,
    p_contrato_id,
    v_numero,
    'aberta',
    v_contrato.fee_mensal,
    v_mes,
    v_venc
  )
  returning id into v_fatura_id;

  return v_fatura_id;
end;
$$;

revoke execute on function public.emitir_fatura(uuid, date) from public;
revoke execute on function public.emitir_fatura(uuid, date) from anon;
grant  execute on function public.emitir_fatura(uuid, date) to authenticated;

comment on function public.emitir_fatura(uuid, date) is
  'Cria a fatura da competência, ou devolve a que já existe. Idempotente e restrita à vigência do contrato: não fatura mês anterior ao início nem posterior ao fim.';
