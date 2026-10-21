-- ===================================================================
-- A TAREFA LEMBRA DO EVENTO QUE ELA CRIOU
--
-- Sem esta coluna, a sincronização só saberia criar. Toda vez que a
-- tarefa fosse salva, um evento novo nasceria na agenda, e em uma
-- semana o Google estaria com a mesma tarefa repetida trinta vezes.
--
-- Com o id guardado, salvar vira `PATCH` no evento que já existe,
-- apagar a tarefa vira `DELETE` nele, e tirar o prazo tira o
-- compromisso do dia em vez de deixar um fantasma marcado.
--
-- ===================================================================
-- POR QUE TEXTO, E POR QUE PODE SER NULO
-- ===================================================================
-- Texto porque o id do Google é opaco e deles: tratar como número ou
-- validar formato é inventar regra sobre dado de terceiro.
--
-- Nulo é o estado normal de quase tudo: tarefa sem prazo não vira
-- evento, e enquanto ninguém conectar a agenda, nenhuma tarefa tem
-- evento. A coluna vazia não significa erro, significa "ainda não".
--
-- ===================================================================
-- RLS NÃO MUDA
-- ===================================================================
-- A coluna entra numa tabela que já tem as políticas dela, e não cria
-- caminho novo de leitura. O id de um evento de agenda não é segredo
-- por si: quem já podia ler a tarefa passa a ler também o id dela.
-- ===================================================================

alter table tarefa
  add column if not exists google_evento_id text;

comment on column tarefa.google_evento_id is
  'Id do evento correspondente no Google Agenda. Nulo quando a tarefa não tem prazo, quando a agenda não está conectada, ou quando o evento ainda não foi criado. Sem ele, toda gravação criaria um evento novo em vez de atualizar o que existe.';

-- Índice parcial: as consultas que importam procuram "quem já tem
-- evento", e as linhas sem evento são a maioria e não interessam a
-- essa pergunta.
create index if not exists tarefa_com_evento
  on tarefa (google_evento_id)
  where google_evento_id is not null;
