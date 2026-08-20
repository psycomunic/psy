-- =====================================================================
-- 0010 - Conserta um furo em converter_lead().
--
-- O QUE ESTAVA ERRADO
-- A checagem era:
--
--   if not (public.papel_atual() in ('administrador','gestor','comercial'))
--   then raise exception ...
--
-- Sem sessão, `papel_atual()` devolve NULL. Em SQL:
--
--   NULL in (...)   ->  NULL
--   not NULL        ->  NULL
--   if NULL then    ->  não executa
--
-- Ou seja: a exceção NUNCA era levantada para quem não tinha papel, e a
-- função seguia criando loja, contrato, acessos e tarefas.
--
-- Quem cai nesse caso não é hipotético: o gatilho de 0005 cria usuário
-- SEM perfil de propósito quando o papel não vem no convite. Essa pessoa
-- loga, `papel_atual()` devolve NULL, e ela convertia lead.
--
-- Encontrado por teste, e não por leitura: o teste chamou a função com a
-- chave de serviço esperando recusa, e ela criou a loja.
--
-- A CORREÇÃO
-- `coalesce(..., false)`, que é o mesmo padrão que `e_interno()` e
-- `e_admin()` já usavam desde 0001. Só esta função tinha ficado de fora.
-- =====================================================================

/* `dia_vencimento` não existia em contrato: o contrato guardava início,
   fim e fee, mas não o dia em que a fatura vence. Sem ele, a geração
   automática de fatura da FASE 9 não teria data para usar. */
alter table contrato
  add column if not exists dia_vencimento integer not null default 10;

alter table contrato
  add constraint dia_vencimento_valido
  check (dia_vencimento between 1 and 28);

comment on column contrato.dia_vencimento is
  'Até 28 de propósito: 29, 30 e 31 não existem em todo mês, e a fatura ficaria sem data em fevereiro.';

create or replace function public.converter_lead(
  p_lead_id        uuid,
  p_fee_mensal     numeric,
  p_dia_vencimento integer default 10,
  p_plataforma     text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_lead     public.lead%rowtype;
  v_conta_id uuid;
  v_nome     text;
  v_tarefa   text;
begin
  /* coalesce OBRIGATÓRIO: sem ele, papel nulo passa pela checagem.
     Ver o cabeçalho desta migração. */
  if not coalesce(
       public.papel_atual() in ('administrador','gestor','comercial'),
       false) then
    raise exception 'Sem permissão para converter lead.';
  end if;

  if p_fee_mensal is null or p_fee_mensal <= 0 then
    raise exception 'O fee mensal precisa ser maior que zero.';
  end if;

  select * into v_lead from public.lead where id = p_lead_id;
  if not found then
    raise exception 'Lead não encontrado.';
  end if;

  if v_lead.conta_id is not null then
    raise exception 'Este lead já virou cliente.';
  end if;

  v_nome := coalesce(nullif(v_lead.empresa, ''), v_lead.nome);

  if exists (select 1 from public.conta where lower(nome) = lower(v_nome)) then
    raise exception 'Já existe uma loja chamada "%".', v_nome;
  end if;

  insert into public.conta (nome, plataforma, situacao, data_inicio, responsavel_id)
  values (v_nome, p_plataforma, 'onboarding', current_date, v_lead.responsavel_id)
  returning id into v_conta_id;

  insert into public.contrato (conta_id, plano, fee_mensal, inicio, dia_vencimento)
  values (v_conta_id, 'A definir', p_fee_mensal, current_date, p_dia_vencimento);

  if v_lead.responsavel_id is not null then
    insert into public.acessos_conta (usuario_id, conta_id, responsavel, aceito_em)
    values (v_lead.responsavel_id, v_conta_id, true, now())
    on conflict (usuario_id, conta_id) do nothing;
  end if;

  foreach v_tarefa in array array[
    'Kick off: entender desafios, prioridades e metas',
    'Conectar Google Ads, Meta e a plataforma da loja',
    'Definir a meta de receita do primeiro mês',
    'Diagnóstico das quatro frentes',
    'Apresentar o plano de mídia'
  ] loop
    insert into public.tarefa (conta_id, titulo, responsavel_id, prazo, status)
    values (v_conta_id, v_tarefa, v_lead.responsavel_id, current_date + 7, 'aberta');
  end loop;

  update public.lead
     set estagio = 'ganho',
         conta_id = v_conta_id
   where id = p_lead_id;

  insert into public.marco_conta (conta_id, dia, tipo, titulo, detalhe, autor_id)
  values (v_conta_id, current_date, 'outro', 'Início da operação',
          format('Convertido do lead %s.', coalesce(v_lead.empresa, v_lead.nome)),
          auth.uid());

  return v_conta_id;
end;
$fn$;

revoke all on function public.converter_lead(uuid, numeric, integer, text) from public;
grant execute on function public.converter_lead(uuid, numeric, integer, text) to authenticated;
