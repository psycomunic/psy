-- =====================================================================
-- 0012 - A credencial é da AGÊNCIA, e não do cliente.
--
-- Decisão do operador, e ela muda o modelo inteiro: a conta de anúncio
-- de cada cliente é vinculada à BM da Psy Comunic e ao MCC do Google da
-- Psy Comunic. Nenhum lojista gera token nenhum.
--
-- Consequência prática: existe UM segredo por provedor, não um por
-- loja. Por loja fica guardado só QUAL conta de anúncio é dela.
--
-- Isso é melhor de três jeitos: um segredo para rotacionar em vez de
-- trinta, nenhum cliente precisa aprender a gerar token, e a superfície
-- de vazamento cai na mesma proporção. E é pior de um: o dia em que
-- esse token vazar, vaza o acesso a TODAS as contas de anúncio de uma
-- vez. É por isso que ele é cifrado, e é por isso que a chave da cifra
-- não mora no banco.
-- =====================================================================


-- =====================================================================
-- 1. O que "receita" quer dizer
--
-- Definição do operador: pedido APROVADO, valor TOTAL do pedido, frete
-- incluído.
--
-- Não é detalhe de contabilidade. Essa escolha muda MER, ticket médio e
-- CAC ao mesmo tempo, e a hora de cravá-la é antes do primeiro cliente
-- ver o número — depois, qualquer mudança faz o histórico inteiro
-- parecer que a operação piorou.
--
-- `frete` entra numa coluna própria mesmo sem entrar em indicador
-- nenhum hoje. O motivo é assimetria: guardar custa uma coluna nula, e
-- não guardar é irreversível. No dia em que a definição mudar para
-- "receita sem frete", a conta se faz em cima do histórico que já
-- existe, em vez de reimportar dois anos de planilha.
-- =====================================================================
alter table metrica_diaria
  add column if not exists frete numeric(14,2) not null default 0;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'metrica_frete_positivo') then
    alter table public.metrica_diaria
      add constraint metrica_frete_positivo check (frete >= 0) not valid;
  end if;
end $$;

comment on column metrica_diaria.receita is
  'Receita APROVADA: pedido com pagamento confirmado, valor TOTAL do pedido, frete incluído. É a única que entra em MER, ROAS e ticket médio.';

comment on column metrica_diaria.frete is
  'Parcela de frete já contida em `receita`. Não entra em nenhum indicador hoje; existe para a definição poder mudar sem reimportar histórico.';


-- =====================================================================
-- 2. A credencial da agência
--
-- `segredo` guarda um JSON CIFRADO com tudo que é sensível do provedor
-- de uma vez: refresh token, client secret, developer token. Um campo
-- por segredo espalharia a cifra por cinco colunas e criaria cinco
-- chances de alguém gravar uma delas em texto puro.
--
-- `configuracao` guarda o que NÃO é segredo e precisa ser consultável:
-- id da conta gerenciadora, versão da API. Se um dia algo aí virar
-- sensível, muda de lado — nunca o contrário.
--
-- Sem política nenhuma, igual a `integracao`: RLS ligado e nenhuma
-- política significa nenhuma linha para ninguém pela chave pública. Só
-- a service role lê, no servidor.
-- =====================================================================
create table credencial_agencia (
  id             uuid primary key default gen_random_uuid(),
  provedor       text not null,
  rotulo         text not null,
  segredo        text,
  /* Últimos caracteres do token, em claro, para reconhecer na tela qual
     credencial está lá sem precisar mostrar o token. Mesmo recurso do
     cartão de crédito, e pela mesma razão. */
  pista          text,
  configuracao   jsonb not null default '{}'::jsonb,
  expira_em      timestamptz,
  ativa          boolean not null default true,
  criada_em      timestamptz not null default now(),
  atualizado_em  timestamptz not null default now(),

  constraint credencial_unica unique (provedor, rotulo)
);

create trigger credencial_toca before update on credencial_agencia
  for each row execute function public.tocar_atualizado_em();

alter table credencial_agencia enable row level security;
alter table credencial_agencia force  row level security;

comment on table credencial_agencia is
  'Um segredo por PROVEDOR, da agência. Cifrado na aplicação, com chave que não mora no banco: dump de banco sozinho não vira acesso a conta de anúncio.';
comment on column credencial_agencia.segredo is
  'JSON cifrado (AES-256-GCM) com refresh token, client secret e developer token. Nunca em texto puro, nunca fora do servidor.';


-- =====================================================================
-- 3. O vínculo: qual conta de anúncio é de qual loja
--
-- `integracao` deixa de ser "a credencial da loja" e passa a ser o
-- VÍNCULO. Para Meta, Google Ads e GA4 o segredo vem da agência, e aqui
-- fica só o identificador da conta.
--
-- A coluna `segredo` continua existindo porque nem toda fonte é da
-- agência: Magazord e Shopify são da LOJA, com chave de API por loja.
-- As duas formas convivem, e `credencial_id` nulo com `segredo`
-- preenchido é o caso da plataforma própria.
-- =====================================================================
alter table integracao
  add column if not exists credencial_id uuid
    references credencial_agencia(id) on delete set null;

comment on column integracao.identificador is
  'Qual conta do provedor pertence a esta loja: act_<id> no Meta, customer id no Google Ads, property id no GA4, domínio na Shopify.';
comment on column integracao.credencial_id is
  'Qual credencial da agência usar. Nulo significa fonte com chave da própria loja, e aí o segredo fica em integracao.segredo.';

/*
  Uma fonte precisa de credencial de algum lado.

  Sem esta trava, uma integração ativa sem credencial nenhuma ficaria
  parada para sempre "sem erro nenhum": a rotina passaria por ela, não
  teria como autenticar, e o estado na tela seria "nunca rodou". É o
  tipo de silêncio que se descobre no fechamento do mês.
*/
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'integracao_tem_de_onde_autenticar') then
    alter table public.integracao
      add constraint integracao_tem_de_onde_autenticar check (
        not ativa
        or credencial_id is not null
        or (segredo is not null and segredo <> '')
      ) not valid;
  end if;
end $$;


-- =====================================================================
-- 4. `integracao_status` passa a mostrar de onde vem a credencial
--
-- Continua DEFINER e continua sem selecionar `segredo`. O que muda: o
-- estado `sem_credencial` agora olha para os dois caminhos, porque uma
-- integração de Meta com `credencial_id` preenchido está credenciada
-- mesmo com `segredo` nulo — e a versão anterior a acusaria de faltando
-- token todo dia.
-- =====================================================================
create or replace view integracao_status as
select
  i.id,
  i.conta_id,
  i.provedor,
  i.identificador,
  i.ativa,
  i.janela_dias,
  i.ultima_sync,
  i.ultima_sync_ok,
  i.ultimo_erro,
  i.erro_em,
  (
    (i.credencial_id is not null and c.ativa and c.segredo is not null)
    or (i.segredo is not null and i.segredo <> '')
  ) as tem_credencial,
  case
    when not i.ativa then 'desligada'
    when not (
      (i.credencial_id is not null and c.ativa and c.segredo is not null)
      or (i.segredo is not null and i.segredo <> '')
    ) then 'sem_credencial'
    when i.ultimo_erro is not null
     and (i.ultima_sync_ok is null or i.erro_em > i.ultima_sync_ok) then 'com_erro'
    when i.ultima_sync_ok is null then 'nunca_rodou'
    when i.ultima_sync_ok < now() - interval '2 days' then 'atrasada'
    else 'ok'
  end as estado,

  /* Colunas novas no FIM: `create or replace view` exige que as
     anteriores mantenham nome, tipo e ordem. */
  c.rotulo as credencial_rotulo
from integracao i
left join credencial_agencia c on c.id = i.credencial_id
where public.e_interno();

grant select on integracao_status to authenticated;


-- =====================================================================
-- 5. Onde a rotina descobre o que sincronizar
--
-- Em lugar nenhum do banco, de propósito.
--
-- A primeira versão desta migração criava uma view juntando integração,
-- credencial e loja, para a rotina ler tudo de uma vez. Duas coisas
-- estavam erradas nela.
--
-- A primeira, de fato: eu tentei protegê-la com `where false`,
-- imaginando que a service role passaria por cima. Não passa. Service
-- role ignora POLÍTICA de RLS; um `where` dentro da view é parte da
-- consulta, e a view voltaria vazia para todo mundo, inclusive para a
-- rotina que ela existia para servir.
--
-- A segunda, de julgamento: era um objeto de banco cujas colunas de
-- saída seriam `segredo_da_loja` e `segredo_da_agencia`. Criar uma
-- superfície nova que expõe segredo, para poupar um join, é troca ruim.
--
-- A rotina faz o join do lado do servidor, com a service role, em
-- `src/lib/ingestao/sincronizar.ts`. Nenhum objeto novo, nenhuma
-- coluna de segredo em view alguma.
-- =====================================================================
