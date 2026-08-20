# Arquitetura — Psy Comunic

Estado real do repositório e as decisões que o sustentam. Escrito na
FASE 0 da evolução para plataforma de agência.

Para o estado da área logada e o que falta construir, ver
**`PLATAFORMA.md`**. Para as regras de conteúdo e as armadilhas de CSS
da landing page antiga, ver **`CLAUDE.md`**.

---

## 1. O que este repositório entrega

| O quê | Onde | Público |
|---|---|---|
| Site público de e-commerce e performance | `src/app/` (11 rotas) | lojistas |
| Landing page "Páginas que vendem" | `public/paginas-que-vendem/` (HTML estático) | agências nichadas |
| Proposta comercial por link | `src/app/proposta/[slug]` | um cliente por vez |
| Painel da agência | `src/app/painel/[modulo]` | time interno |

O painel **responde 404 em produção** enquanto as variáveis do Supabase
não estiverem no ambiente de produção. Ver a seção 2 de `PLATAFORMA.md`.

---

## 2. Estrutura

```
src/
  app/
    (rotas públicas)      / /servicos /planos /cases /sobre /contato ...
    entrar/               login real (duas colunas, sem cadastro aberto)
    painel/
      [modulo]/           despacha os 10 módulos
      acoes.ts            Server Actions de escrita
    proposta/[slug]/      documento privado, noindex
    robots.ts sitemap.ts opengraph-image.tsx
  componentes/            ← português, NÃO "components"
    painel/               base.tsx Graficos.tsx Formularios.tsx paleta.ts
      modulos/            Visao Metricas Outros
  conteudo/               conteúdo-como-configuração do site público
  dados/                  propostas.ts (estático, server-only)
  lib/
    papeis.ts             matriz de permissão da INTERFACE
    dominio/              regras de negócio puras + testes
    validacao/            esquemas Zod de tudo que entra por action
    dados/                consultas.ts tipos.ts demonstracao.ts
    supabase/             ambiente servidor navegador servico
    formato.ts            moeda, percentual, datas
supabase/migrations/      SQL versionado e incremental
scripts/                  migrar, auditar-rls, testar-isolamento, criar-*
```

**Divergências propositais em relação ao documento de evolução**, que
descrevia uma estrutura diferente da real:

| Documento | Aqui | Por quê |
|---|---|---|
| `src/components/` | `src/componentes/` | o repositório é todo em português |
| `supabase/{servidor,cliente,admin}` | `{servidor,navegador,servico}` + `ambiente` | `cliente` é ambíguo: significa navegador e também lojista |
| tabelas no plural | **singular** (`perfil`, `conta`, `lead`) | já existiam; renomear quebraria 38 políticas |
| `auditoria` | `log_auditoria` | idem |
| `metas`, `diario_bordo` | `meta_conta`, `marco_conta` | idem |

---

## 3. Os três clientes Supabase

| Arquivo | Chave | Onde pode ser usado | O que respeita |
|---|---|---|---|
| `navegador.ts` | publicável | Client Component | RLS |
| `servidor.ts` | publicável + sessão | RSC e Server Action | RLS, como o usuário logado |
| `servico.ts` | **secreta** | só rota de servidor controlada | **nada** — passa por cima de todo o RLS |

`servico.ts` começa com `import 'server-only'`, o que faz o **build
falhar** se um componente de cliente importar. Testado: com o import
forçado num `'use client'`, o build para com
`'server-only' cannot be imported from a Client Component module`.

`sessaoAtual()` usa **`getUser()`, nunca `getSession()`**. `getSession`
lê o cookie e acredita nele; `getUser` valida o token no servidor de
auth. Numa decisão de acesso, é a diferença entre confiar e verificar.

---

## 4. Onde a segurança mora

Quatro camadas. Segurança que existe num lugar só cai junto com ele.

| Camada | O que faz | Onde |
|---|---|---|
| Middleware | barra quem não está logado, antes da página existir | `src/middleware.ts` |
| Validação | recusa entrada malformada e papel inventado | `src/lib/validacao/` |
| Página / Action | confere o papel contra a matriz | `sessaoAtual()` + `papeis.ts` |
| Banco | recusa a linha, mesmo que as três de cima falhem | políticas RLS |

**A exceção que exige atenção:** as Server Actions de `acoes.ts` usam a
chave de serviço, porque criar usuário e gravar papel são justamente as
operações que o RLS impede. Ali **não há rede embaixo** — `exigirAdmin()`
é a única barreira, e por isso é a primeira linha de cada função.

### Verificação automatizada

```
npm run auditar-rls        toda tabela tem RLS, force e política; toda view tem security_invoker
npm run testar-isolamento  login de cliente de verdade; tenta ler a conta alheia e falha
```

Os dois são necessários e nenhum substitui o outro: o primeiro prova que
a proteção **existe**, o segundo prova que ela **funciona**.

Duas tabelas ficam sem política **de propósito**, e o auditor conhece a
exceção pelo nome:

- `integracao` — guarda token de anúncio de cliente. RLS ligado sem
  política = nenhuma linha para ninguém pela chave pública, nem para
  admin. Quem lê é a sincronização, no servidor.
- `migracao_aplicada` — quem escreve conecta direto no Postgres.

---

## 5. Papéis

Sete, definidos em `src/lib/papeis.ts` e no enum `papel_usuario`.

| Papel | Escopo |
|---|---|
| `administrador` | tudo, inclusive financeiro, equipe e exclusão |
| `gestor` | tudo menos cobrança, gestão de usuários e exclusão |
| `comercial` | funil, propostas, contratos |
| `operador` | métricas, tarefas e relatórios das lojas atribuídas |
| `financeiro` | fee, cobrança, inadimplência. Não vê campanha |
| `cliente` | portal da própria loja |
| `cliente_leitura` | igual, sem aprovar nem abrir solicitação |

O papel vive em `app_metadata`, que **só a chave secreta escreve**. Em
`user_metadata`, o próprio usuário se promoveria a admin numa
requisição.

`papeis.ts` decide o que a **interface** mostra. Quem decide quais
**linhas** voltam é o Postgres. As duas precisam continuar de acordo.

---

## 6. Decisões que contrariam o documento de evolução

### 6.1 Dinheiro fica em `numeric`, e não em `bigint` de centavos

O documento manda centavos inteiros para evitar ponto flutuante. A
premissa está errada para este banco: **`numeric` no Postgres é decimal
exato**, não float. A regra "nunca float" já está cumprida.

Migrar 14 colunas para centavos seria uma migração grande e arriscada
sem ganho de correção.

**Onde o risco de float existe de verdade é no JavaScript**, onde
`number` é float64. A resposta a isso é de arquitetura, não de tipo de
coluna:

- toda **soma** de dinheiro acontece em SQL, nas views
- `src/lib/dominio/` faz **divisão e comparação**, que toleram o
  arredondamento, e passa o resultado por `arredondar()`
- JavaScript trata dinheiro como camada de **exibição**

### 6.2 O multi-loja entra por uma função, não por 38 políticas

Todas as políticas chamam `tem_acesso_conta(uuid)`. Hoje ela lê
`perfil.conta_id` (uma loja por usuário). Na FASE 1 o corpo passa a ler
`acessos_conta` (N:N) e **nenhuma política precisa ser reescrita**.

Foi para isso que a lógica de acesso ficou centralizada desde a primeira
migração.

---

## 7. Migrações

`npm run migrar` aplica em ordem, **uma transação por arquivo**.
Migração aplicada pela metade deixa o banco num formato que nenhum
arquivo descreve.

| Arquivo | O que traz |
|---|---|
| 0001 | `conta`, `perfil`, as funções que sustentam o RLS, gatilho de perfil |
| 0002 | `lead`, `interacao`, `proposta`, leitura pública da proposta por token |
| 0003 | `contrato`, `lancamento`, `fatura`, `tarefa`, `metrica_diaria`, `integracao`, `log_auditoria` |
| 0004 | KPIs de e-commerce: colunas do funil, `meta_conta`, `marco_conta` e as 5 views |
| 0005 | gatilho de perfil resiliente |
| 0006 | papéis renomeados, RLS em `migracao_aplicada` |
| 0007 | papéis novos em uso, `tem_acesso_conta()` |

**0006 e 0007 são duas porque o Postgres proíbe usar um valor de enum na
mesma transação em que ele é criado.**

A conexão usa o **pooler de sa-east-1**, não a direta: o host
`db.<ref>.supabase.co` só resolve em IPv6.

---

## 8. Verificação

```
npm run verificar          lint + typecheck + testes + build
npm run teste              53 testes de domínio e validação
npm run auditar-rls        precisa do banco
npm run testar-isolamento  precisa do banco
```

O CI roda os quatro primeiros a cada push. Os dois que dependem do banco
ficam de fora do CI de propósito: o build precisa funcionar **sem
segredo**, senão ninguém que clone o repositório consegue compilar.

Os testes rodam TypeScript direto, com `--experimental-strip-types` do
Node 24. Sem transpilador, sem dependência de teste.

### O que os testes cobrem

Os **casos de borda**, e não o caminho feliz. Fórmula certa com número
redondo passa em qualquer implementação; o que quebra painel é divisão
por zero, mês virando, conta nova sem histórico e a diferença entre
"zero" e "não sei".

Dois bugs reais foram encontrados assim, e cada um tem um teste que
impede a volta:

- `paraNumero('320.000')` devolvia **320**, e não 320 mil. Uma meta mil
  vezes menor, gravada sem erro nenhum na tela.
- O auditor de RLS acusava as cinco views como desprotegidas. Falso
  positivo: o Postgres guarda `security_invoker` como `'on'`, e o script
  comparava com `'true'`. Só apareceu porque o teste de isolamento
  afirmava o contrário — **duas checagens independentes discordando é
  como se descobre que uma delas está errada**.

---

## 9. Verificação visual

Captura de tela em headless com rolagem programática **mente neste
projeto**: volta preta de forma sistemática, e o mesmo vale para captura
por âncora. Para conferir layout, meça geometria
(`getBoundingClientRect`, `elementFromPoint`, `getComputedStyle`) ou
esconda as seções de cima por CSS e capture sem rolar.

---

## 10. Convenções

- Server Component por padrão. `'use client'` só onde há interação real.
- Mutação sempre por Server Action, com Zod na entrada e checagem de
  papel no servidor.
- Toda tabela: `id uuid default gen_random_uuid()`, `criado_em`,
  `atualizado_em`.
- Horário em `timestamptz`, gravado em UTC, exibido em
  `America/Sao_Paulo`.
- Texto de interface em português do Brasil.
- Comentário explica **por quê**, não o quê.
