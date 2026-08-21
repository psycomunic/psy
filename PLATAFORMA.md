# Plataforma Psy Comunic — estado atual e o que falta

Documento de engenharia da área logada: CRM, financeiro, gestão de clientes e
portal de métricas. Serve para você saber exatamente o que já existe, o que
ainda não foi construído e o que depende de você.

**Backend escolhido: Supabase.** Postgres, autenticação e Row Level Security no
mesmo lugar.

---

## 1. O que já existe

| Item | Estado |
|---|---|
| Página de proposta por link (`/proposta/[slug]`) | **Funcionando** |
| Modelo de papéis e permissões (`src/lib/papeis.ts`) | **Funcionando** |
| Schema do banco com RLS (`supabase/migrations/`) | **Aplicado** — 11 migrações |
| Camada de KPIs de e-commerce | **Aplicada** |
| Login real (`/entrar`) | **Funcionando** |
| Sessão e trava de rota (`src/middleware.ts`) | **Funcionando** |
| Painel: visão geral, métricas, CRM, contas, financeiro, tarefas, equipe, auditoria | **Funcionando** contra o banco |
| Ficha da loja em abas, com health score | **Funcionando** |
| CRM com kanban, funil e conversão de lead em cliente | **Funcionando** |
| Ingestão de métrica: planilha, `/api/ingestao`, frescor | **Funcionando** |
| Portal do cliente | **Construído** (é a mesma tela de métricas, com escopo do RLS) |
| Conectores de Google Ads, Meta, GA4, Magazord e Shopify | **Não construídos** (FASE 4) |
| Propostas, relatórios e configurações no painel | **Não construídos** |

### Como o painel se comporta hoje

Cada consulta em `src/lib/dados/consultas.ts` tem dois caminhos: com banco
configurado consulta o Supabase; sem banco devolve dados de **demonstração**,
com nomes fictícios. A resposta carrega a `procedencia`, e toda tela que mostra
dado de demonstração exibe um aviso.

Isso existe para o sistema poder ser visto e corrigido antes do banco. Nenhum
nome de cliente real aparece na demonstração, de propósito: número inventado ao
lado de uma marca de verdade é como um print vira "resultado" por engano.

---

## 2. A trava, e como ela se levanta sozinha

Enquanto `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`
estiverem vazias, `/entrar` e `/painel` **respondem 404 em produção**.

Isso é deliberado. Uma tela de login que aceita qualquer coisa e parece
funcionar é pior que nenhuma tela: cria a impressão de que os dados estão
protegidos quando não estão.

A trava não é um interruptor manual que alguém esquece de virar. Ela olha para
o ambiente: **no minuto em que as variáveis existirem, o 404 vira login de
verdade**, e volta a ser 404 sozinha se as credenciais sumirem.

Verificado nas duas pontas:

```
sem as variaveis, em producao:
  /entrar            404
  /painel/crm        404

com as variaveis, em producao, sem sessao:
  /entrar            200
  /painel/crm        307  ->  /entrar?destino=/painel/crm
```

---

## 3. Onde a segurança mora (três camadas, não uma)

Segurança que existe num lugar só cai junto com esse lugar.

| Camada | O que faz | Onde |
|---|---|---|
| Middleware | barra quem não está logado, antes da página existir | `src/middleware.ts` |
| Página | confere o papel contra a matriz | `sessaoAtual()` + `src/lib/papeis.ts` |
| Banco | recusa a linha, mesmo que as duas de cima falhem | políticas RLS |

O middleware não consulta a tabela `perfil`: ele sabe que **há alguém** logado,
não **quem**. Isso é de propósito, porque middleware roda em toda requisição e
uma consulta ali custa caro. A decisão de papel acontece na página e no banco.

Duas escolhas que merecem nota:

**`getUser()`, nunca `getSession()`.** `getSession` lê o cookie e acredita nele.
`getUser` valida o token no servidor de autenticação. Numa decisão de acesso, é
a diferença entre confiar e verificar.

**O papel vive na tabela `perfil`, nunca no JWT.** Metadado de usuário é
gravável pelo próprio usuário em várias configurações do Supabase. Papel que o
usuário consegue escrever não é permissão, é sugestão.

---

## 4. O banco

Migrações em `supabase/migrations/`, para rodar **em ordem** (`npm run migrar`):

| Arquivo | O que cria |
|---|---|
| `0001_base_e_papeis.sql` | `conta`, `perfil`, as funções que sustentam todo o RLS, o gatilho que cria perfil no cadastro |
| `0002_crm_e_comercial.sql` | `lead`, `interacao`, `proposta` e a função de leitura pública da proposta pelo link |
| `0003_financeiro_operacao_auditoria.sql` | `contrato`, `lancamento`, `fatura`, `tarefa`, `metrica_diaria`, `integracao`, `log_auditoria` |
| `0004_kpis_de_ecommerce.sql` | `meta_conta`, `marco_conta` e as views `kpi_diario`, `kpi_canal`, `kpi_mes` e `financeiro_mes` |
| `0005_gatilho_de_perfil_resiliente.sql` | o gatilho de perfil deixa de derrubar cadastro quando o `app_metadata` ainda não chegou |
| `0006_papeis_renomeados.sql` | `analista` → `operador`, `cliente_admin` → `cliente` |
| `0007_papeis_novos_em_uso.sql` | 7 papéis em uso e `tem_acesso_conta()`, o ponto único de decisão de acesso |
| `0008_acessos_e_contatos.sql` | `acessos_conta` (multi-loja N:N), `contato`, gatilhos de auditoria |
| `0009_ficha_da_conta_e_funil.sql` | view `saude_conta` (health score), view `funil_comercial`, dias no estágio por gatilho |
| `0010_conversao_recusa_sem_papel.sql` | `converter_lead()` passa a recusar quem não tem papel |
| `0011_ingestao_de_metricas.sql` | `hoje()`, `registrar_metricas()`, `sincronizacao`, `metrica_bruta`, views `frescor_conta`, `atribuicao_conta` e `integracao_status` |
| `0012_credenciais_da_agencia.sql` | `credencial_agencia` (segredo cifrado, sem política de leitura), `metrica_diaria.frete` |
| `0013_apagar_credencial_sempre_possivel.sql` | gatilho que solta as integrações antes do delete: credencial vazada tinha de poder sair |
| `0014_frete_na_gravacao.sql` | `registrar_metricas()` grava `frete` |
| `0015_motivo_perda.sql` | `lead.perdido_por` → `motivo_perda` |
| `0016_interacao_tipo.sql` | `interacao.canal` → `tipo` |
| `0017_cobranca_asaas.sql` | `cobranca_evento`, `emitir_fatura()` idempotente, campos de Asaas em `conta` e `fatura` |
| `0018_fatura_dentro_da_vigencia.sql` | `emitir_fatura()` recusa mês fora do início/fim do contrato |
| `0019_contrato_coerente.sql` | contrato não termina antes de começar, e fee não é negativo |

21 tabelas, 9 views, 49 políticas. `npm run testar-banco` confere o que não
pode quebrar: RLS ligado em tudo, isolamento entre lojas, conversão de lead,
gravação idempotente de métrica, cobrança que não duplica, e o ciclo de vida do
contrato pela tela de verdade (`npm run testar-contratos`, que precisa do
`npm run dev` rodando).

Quatro decisões que valem explicação:

**A política mais importante do banco é `metrica_leitura`.** É ela que impede um
lojista de ler o faturamento de outro. Tudo mais é conveniência; essa é a que
não pode falhar.

**A tabela `integracao` não tem política nenhuma.** RLS ligado sem política
significa: nenhuma linha para ninguém pela chave pública, nem para o admin.
Token de anúncio de cliente não precisa trafegar até um navegador em hipótese
alguma. Quem lê é a rotina de sincronização, no servidor.

**`force row level security` em todas as tabelas.** Sem isso, uma rotina que
rode como dono da tabela passa por cima de tudo sem avisar.

**As funções auxiliares são `security definer` com `search_path` vazio.** O
`security definer` quebra a recursão (uma política sobre `perfil` que consulte
`perfil` trava o banco). O `search_path` vazio impede que alguém plante uma
tabela homônima e sequestre a função — por isso todo nome ali é qualificado.

O `log_auditoria` não é opcional: financeiro sem trilha de auditoria vira
problema na primeira divergência de cobrança, porque ninguém consegue provar
quem alterou o valor. Ele não tem política de update nem de delete — se desse
para editar, não seria log.

---

## 5. A chave de service role

`SUPABASE_SERVICE_ROLE_KEY` passa por cima de **todo** o RLS. Num bundle de
navegador, ela entrega o banco inteiro: o faturamento de todos os clientes e os
tokens de anúncio deles.

`src/lib/supabase/servico.ts` começa com `import 'server-only'`, que faz o
**build falhar** se um componente de cliente importar o arquivo. Testado: com o
import forçado num componente `'use client'`, o build para com
`'server-only' cannot be imported from a Client Component module`.

Ela nunca leva o prefixo `NEXT_PUBLIC_`. O prefixo é literalmente o que publica
a variável no navegador.

---

## 6. Papéis

São sete: **administrador**, **gestor**, **comercial**, **operador**,
**financeiro**, **cliente** e **cliente_leitura**. A matriz completa vive em
`src/lib/papeis.ts`, e repetir os 77 cruzamentos aqui só criaria uma segunda
versão para ficar desatualizada.

O que a matriz decide, em uma frase cada:

**O comercial não vê financeiro.** Quem vende não precisa da margem nem da lista de
inadimplentes para trabalhar, e menos acesso é menos superfície de vazamento.

**O operador não edita proposta.** Assim não há dúvida sobre quem mexeu em condição
comercial depois de assinada.

**Só o administrador exclui.** Exclusão em CRM e financeiro é irreversível na prática.

**Só o administrador edita perfil.** Se o comercial pudesse, ele se promoveria a
administrador em dois cliques e a matriz inteira viraria enfeite.

**O cliente vive no portal, não no painel.** Ele enxerga métricas e relatórios
da própria loja, e nada mais — nunca a margem da agência, nunca outra loja,
nunca um botão que não pode usar.

A matriz está em dois lugares que precisam continuar de acordo:
`src/lib/papeis.ts` (interface) e as políticas RLS (banco). Se mudar uma, mude
a outra. A única exceção é `metricas: editar`, que não tem política
correspondente de propósito — está explicada no próprio `papeis.ts`.

---

## 7. Portal de métricas do cliente

A parte mais subestimada do pedido. O painel do lojista não é uma tela: é uma
cadeia de integrações, cada uma com autenticação e limite de requisição
próprios.

| Fonte | O que traz | Dificuldade |
|---|---|---|
| Google Ads API | investimento, cliques, conversões | OAuth + token de desenvolvedor (aprovação do Google) |
| Meta Marketing API | investimento, alcance, conversões | App em análise na Meta |
| GA4 Data API | sessões, origem, funil | OAuth por conta |
| Plataforma da loja | pedidos, receita, ticket | Varia: VTEX, Nuvemshop, Shopify, Magazord, Tray |

**A plataforma da loja é o item mais caro:** cada uma tem API própria, e cobrir
cinco significa cinco integrações separadas. Recomendo começar por **uma só**, a
mais comum na base atual.

**Abra os pedidos de aprovação agora.** O token de desenvolvedor do Google Ads e
a análise do app na Meta levam dias ou semanas, e não dependem do nosso código.
Se esperarem o código ficar pronto, o prazo vira a soma dos dois.

---

## 8. LGPD

A área logada guarda dado de faturamento de terceiros. Isso muda o patamar de
responsabilidade em relação a um site institucional:

- contrato de operador de dados com cada cliente
- criptografia dos tokens de integração em repouso (`integracao.segredo`)
- trilha de auditoria de todo acesso a dado financeiro — já implementada
- política de retenção e rotina de expurgo declaradas
- 2FA obrigatório para admin

---

## 9. Como ligar o banco

1. Criar o projeto no Supabase
2. SQL Editor: rodar as três migrações em ordem
3. Copiar `.env.example` para `.env.local` e preencher as três chaves
4. Criar o primeiro admin: cadastrar o usuário em Authentication e depois, no
   SQL Editor, `update perfil set papel = 'admin' where email = '...'`
   (o gatilho cria todo mundo como `cliente`, e o menor acesso possível é o
   padrão certo)
5. `npm run dev` — a trava se levanta sozinha

---

## 10. Como a métrica entra

Três caminhos, todos terminando na mesma função do banco:

| Caminho | Para quê | Onde |
|---|---|---|
| Planilha CSV | a loja cuja plataforma não tem API decente, e todo mês de histórico | aba "Origem dos dados" da ficha |
| `POST /api/ingestao` | automação da Merge, n8n, cron — máquina mandando dia fechado | cabeçalho `x-psy-token` |
| Conector | Google Ads, Meta, GA4, Magazord, Shopify | FASE 4, ainda não existe |

**`registrar_metricas()` é o único ponto de escrita.** Duas propriedades, e
tudo depende delas:

1. **Reimportar sobrescreve, nunca soma.** Toda rodada repete dias de propósito,
   porque pedido aprovado muda de status depois do fato — é o que a coluna
   `integracao.janela_dias` controla. Se somasse, o faturamento do cliente
   dobraria a cada rodada, com o gráfico subindo bonito.
2. **Cada fonte escreve só as colunas que são dela.** Loja é dona de pedido e
   receita, GA4 de sessão, Google e Meta de verba, clique e atribuição. As três
   caem na mesma linha (mesma conta, mesmo dia, mesmo canal), e um `do update`
   que escrevesse a linha inteira faria a última a rodar zerar as outras.

`npm run testar-ingestao` prova as duas, além de recusar dia no futuro,
provedor desconhecido, valor negativo e chamada pela chave pública.

**`receita` e `receita_atribuida` nunca se misturam.** A primeira é o que a
loja faturou e aprovou, e é a única que entra em MER. A segunda é o que a
plataforma de mídia diz ter gerado — cada uma conta a mesma venda para si, então
a soma costuma passar do faturamento real. A view `atribuicao_conta` põe esse
excesso em número, e é o que sustenta a conversa de verba com o cliente.

**`hoje()` em vez de `current_date`.** O Postgres do Supabase roda em UTC, e
`current_date` às 21h de Brasília já devolve o dia seguinte. Toda janela de
data do sistema saiu de `current_date` e passou para `hoje()` na migração
0011.

**Buraco na série não é queda.** A view `frescor_conta` conta os dias sem dado
nos últimos 30, e a ficha mostra isso antes de qualquer gráfico: a diferença
entre ligar para o cliente e ligar para o suporte da API.

### O token da ingestão

`INGESTAO_TOKEN` no ambiente, mínimo de 24 caracteres. Sem ele a rota responde
503 e não grava nada — falha **fechada**, porque uma rota aberta aqui escreve no
faturamento de qualquer cliente. A comparação é em tempo constante.

```bash
curl -X POST https://SEU-DOMINIO/api/ingestao   -H 'x-psy-token: SEGREDO' -H 'content-type: application/json'   -d '{"conta_id":"...","provedor":"loja",
       "linhas":[{"dia":"2026-08-19","canal":"loja","receita":8800.50,
                  "pedidos_captados":38,"pedidos_aprovados":31}]}'
```

---

## 11. Ordem das fases

| Fase | O que entrega | Estado |
|---|---|---|
| 0 | Base, papéis, login, painel, RLS | **pronta** |
| 1 | 7 papéis, multi-loja, contatos, auditoria em tela | **pronta** |
| 2 | Ficha da loja em abas com health score, CRM com kanban e conversão de lead | **pronta** |
| 3 | Métricas e ingestão: gravação idempotente, planilha, `/api/ingestao`, frescor | **pronta** |
| 4 | Plataformas: Magazord, Shopify, Merge para WhatsApp | a fazer |
| 5 | Portal do cliente | a fazer |
| 6 | Propostas e contratos ligados ao banco | **pronta** |
| 7 | Tarefas, diário e solicitações | a fazer |
| 8 | Relatórios | a fazer |
| 9 | Financeiro e cobrança pelo Asaas | **pronta** (Mercado Pago segue de fora) |
| 10 | Notificações e configurações | a fazer |

As fases 3 a 10 são bastante independentes: dá para trocar a ordem. O que não
muda é a regra de sempre — tabela nova nasce com RLS e política explícita, e a
matriz de `src/lib/papeis.ts` acompanha.

**A plataforma está no ar.** As variáveis do Supabase estão na Vercel, e
`/entrar` e `/painel` respondem em produção. Sem elas o painel volta a responder
404 de propósito, que é o comportamento correto para um deploy sem banco.

### Contratos e cobrança

O contrato é o que diz quanto faturar. Nasce em dois lugares: quando um lead
vira cliente no CRM, e no botão **Novo contrato** dentro de Financeiro.

Três regras que o teste `testar-contratos` protege:

1. **Uma vigência aberta por loja.** Duas abertas gerariam duas faturas no mesmo
   mês. A tela trava a opção e o servidor recusa de novo, porque uma tela aberta
   há dez minutos não sabe o que mudou desde então.
2. **Reajuste não edita o fee: encerra um contrato e abre outro.** A fatura
   aponta para o contrato que a originou. Sobrescrever o valor faria a fatura de
   março passar a dizer um número que ela nunca cobrou.
3. **A fatura tem de caber na vigência.** `emitir_fatura()` recusa competência
   anterior ao início ou posterior ao fim, por mês. É o que impede o contrato
   agendado de cobrar o fee novo antes da data combinada.

Encerrar nunca apaga: `fatura` aponta para `contrato` com `on delete restrict`,
e é o contrato encerrado que explica o valor de uma fatura de dois anos atrás.
