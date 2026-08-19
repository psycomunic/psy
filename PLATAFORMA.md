# Plataforma Psy Comunic — estado atual e o que falta

Documento de engenharia da área logada: CRM, financeiro, gestão de clientes e
portal de métricas. Serve para você saber exatamente o que já existe, o que é
maquete e o que está travado esperando decisão.

---

## 1. O que já existe

| Item | Estado |
|---|---|
| Página de proposta por link (`/proposta/[slug]`) | **Funcionando** |
| Modelo de papéis e permissões (`src/lib/papeis.ts`) | **Funcionando** |
| Tela de login (`/entrar`) | Interface pronta, **sem autenticação real** |
| Painel (`/painel/*`) | Casca navegável, **sem banco** |

---

## 2. O que é maquete e por quê

A tela de login e o painel **não autenticam ninguém de verdade**. Não existe
banco de dados, sessão nem senha. Eles estão bloqueados fora de
desenvolvimento por uma trava no middleware: em produção retornam 404.

Isso é deliberado. Uma tela de login que aceita qualquer coisa e parece
funcionar é pior que nenhuma tela: cria a impressão de que os dados estão
protegidos quando não estão. Ela só passa a existir em produção quando houver
autenticação real por trás.

---

## 3. A decisão que trava tudo: onde ficam os dados

Nada da área logada avança sem isto. As duas opções realistas:

### Opção A — Supabase (recomendada)

Postgres + autenticação + Row Level Security no mesmo lugar.

- **A favor:** o RLS aplica o isolamento por cliente no próprio banco. É a
  diferença entre "o front não mostra os dados do outro cliente" e "o banco se
  recusa a entregá-los". Para um portal onde cada lojista vê o próprio
  faturamento, isso não é luxo.
- **Contra:** mais um fornecedor no stack.
- **Nota:** existe um conector Supabase nesta sessão, mas ele **precisa ser
  autorizado por você** nas configurações de conectores do claude.ai. Enquanto
  não estiver, eu não consigo provisionar o banco daqui.

### Opção B — Neon + Auth.js + Drizzle

Postgres puro, login e ORM montados à mão.

- **A favor:** controle total, sem amarras de fornecedor.
- **Contra:** o isolamento por cliente passa a ser responsabilidade de cada
  consulta que eu escrever. Um `where` esquecido vaza dados de um cliente para
  outro, e não há rede de proteção no banco.

---

## 4. Modelo de dados proposto

```
conta            loja cliente da agência (multi-inquilino)
usuario          pessoa, com papel e vínculo a uma conta
lead             CRM: origem, estágio, responsável, valor estimado
interacao        histórico de contato do lead
proposta         versão, status, link, valor, validade
contrato         início, fim, plano, fee, reajuste
lancamento       financeiro: receita/despesa, vencimento, pago em
fatura           agrupa lançamentos, status de cobrança
tarefa           responsável, prazo, conta relacionada
metrica_diaria   conta, data, sessões, pedidos, receita, investimento
integracao       tokens por conta (Google Ads, Meta, GA4, plataforma)
log_auditoria    quem fez o quê, quando, em qual registro
```

`log_auditoria` não é opcional: financeiro sem trilha de auditoria é problema
na primeira divergência de cobrança.

---

## 5. Papéis (já implementados em `src/lib/papeis.ts`)

| Módulo | Admin | Vendedor | CS | Cliente |
|---|---|---|---|---|
| CRM | ver, editar, excluir | ver, editar | ver, editar | — |
| Propostas | ver, editar, excluir | ver, editar | ver | — |
| Financeiro | ver, editar, excluir | — | — | — |
| Clientes | ver, editar, excluir | ver, editar | ver, editar | — |
| Métricas | ver | ver | ver | **só a própria conta** |
| Tarefas | ver, editar, excluir | ver, editar | ver, editar | — |
| Relatórios | ver, editar | — | ver | ver |
| Equipe | ver, editar, excluir | — | — | — |
| Configurações | ver, editar | — | — | — |

Três escolhas que valem explicação:

**O vendedor não vê financeiro.** Quem vende não precisa da margem nem da lista
de inadimplentes para trabalhar, e menos acesso é menos superfície de vazamento.

**O CS não edita proposta.** Assim não há dúvida sobre quem mexeu em condição
comercial depois de assinada.

**Só o admin exclui.** Exclusão em CRM e financeiro é irreversível na prática.

Se alguma dessas regras não bate com a sua operação, mude a matriz no arquivo:
é um lugar só.

---

## 6. Portal de métricas do cliente

A parte mais subestimada do pedido. O painel do lojista não é uma tela: é uma
cadeia de integrações, cada uma com autenticação e limite de requisição
próprios.

| Fonte | O que traz | Dificuldade |
|---|---|---|
| Google Ads API | investimento, cliques, conversões | OAuth + token de desenvolvedor (aprovação do Google) |
| Meta Marketing API | investimento, alcance, conversões | App em análise na Meta |
| GA4 Data API | sessões, origem, funil | OAuth por conta |
| Plataforma da loja | pedidos, receita, ticket | Varia por plataforma: VTEX, Nuvemshop, Shopify, Magazord, Tray |

**A plataforma da loja é o item mais caro:** cada uma tem API própria, e cobrir
cinco significa cinco integrações separadas. Recomendo começar por **uma só**, a
mais comum na base atual, e crescer conforme a demanda.

O token de desenvolvedor do Google Ads e a análise do app na Meta levam dias ou
semanas de aprovação. Vale abrir esses pedidos **antes** de o código estar
pronto, porque eles não dependem de nós.

---

## 7. LGPD

A área logada guarda dado de faturamento de terceiros. Isso muda o patamar de
responsabilidade em relação a um site institucional:

- contrato de operador de dados com cada cliente
- criptografia dos tokens de integração em repouso
- trilha de auditoria de todo acesso a dado financeiro
- política de retenção e rotina de expurgo declaradas
- 2FA obrigatório para admin

---

## 8. Ordem sugerida

1. Decidir o backend (seção 3) e provisionar
2. Autenticação real, sessão e as travas de papel no servidor
3. Contas e usuários
4. CRM: leads, estágios, interações
5. Propostas ligadas ao banco, substituindo o arquivo estático
6. Financeiro: contratos, lançamentos, faturas
7. Portal de métricas, uma integração por vez
8. Auditoria, 2FA e o pacote de LGPD

Os passos 1 e 2 não têm atalho. Tudo depois deles depende dos dois.
