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
| Schema do banco com RLS (`supabase/migrations/`) | **Escrito, não aplicado** |
| Camada de KPIs de e-commerce (migração 0004) | **Escrita, não aplicada** |
| Login real (`/entrar`) | **Escrito, esperando o projeto Supabase** |
| Sessão e trava de rota (`src/middleware.ts`) | **Escrito, esperando o projeto Supabase** |
| Painel: visão geral, métricas, CRM, contas, financeiro, tarefas, equipe | **Construído, rodando em dados de demonstração** |
| Portal do cliente | **Construído** (é a mesma tela de métricas, com escopo do RLS) |
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

Três migrações em `supabase/migrations/`, para rodar **em ordem**:

| Arquivo | O que cria |
|---|---|
| `0001_base_e_papeis.sql` | `conta`, `perfil`, as funções que sustentam todo o RLS, o gatilho que cria perfil no cadastro |
| `0002_crm_e_comercial.sql` | `lead`, `interacao`, `proposta` e a função de leitura pública da proposta pelo link |
| `0003_financeiro_operacao_auditoria.sql` | `contrato`, `lancamento`, `fatura`, `tarefa`, `metrica_diaria`, `integracao`, `log_auditoria` |

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

| Módulo | Admin | Vendedor | CS | Cliente |
|---|---|---|---|---|
| CRM | ver, editar, excluir | ver, editar | ver, editar | — |
| Propostas | ver, editar, excluir | ver, editar | ver | — |
| Financeiro | ver, editar, excluir | — | — | só a própria fatura |
| Clientes | ver, editar, excluir | ver, editar | ver, editar | — |
| Métricas | ver | ver | ver | **só a própria conta** |
| Tarefas | ver, editar, excluir | ver, editar | ver, editar | — |
| Relatórios | ver, editar | — | ver | ver |
| Equipe | ver, editar, excluir | — | — | — |
| Configurações | ver, editar | — | — | — |

**O vendedor não vê financeiro.** Quem vende não precisa da margem nem da lista
de inadimplentes para trabalhar, e menos acesso é menos superfície de vazamento.

**O CS não edita proposta.** Assim não há dúvida sobre quem mexeu em condição
comercial depois de assinada.

**Só o admin exclui.** Exclusão em CRM e financeiro é irreversível na prática.

**Só o admin edita perfil.** Se o vendedor pudesse, ele se promoveria a admin em
dois cliques e a matriz inteira viraria enfeite.

A matriz está em dois lugares que precisam continuar de acordo: `src/lib/papeis.ts`
(interface) e as políticas RLS (banco). Se mudar uma, mude a outra.

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

## 10. Ordem sugerida do que falta

1. Ligar o banco (seção 9)
2. Contas e usuários: convidar time e clientes
3. CRM: leads, estágios, interações
4. Propostas ligadas ao banco, substituindo `src/dados/propostas.ts`
5. Financeiro: contratos, lançamentos, faturas
6. Portal de métricas, uma integração por vez
7. 2FA e o pacote de LGPD

Os passos 3 a 6 são independentes entre si: dá para fazer em qualquer ordem, ou
em paralelo. O passo 1 trava todos.
