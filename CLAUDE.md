@AGENTS.md

# Psy Comunic

## Voz da copy

**Quem fala é a empresa, não o Angelo.** Nada de "em mim", "meu trabalho",
"eu faço". É "a Psy Comunic", "nosso", "a equipe".

Angelo Garcia aparece **em terceira pessoa** e **só quando a informação é sobre
ele**: os 17+ anos de design, a mentoria na Vinci Society com Tay Dantas, a
sociedade no e-commerce de milhões. Fora isso, ele não é o sujeito da frase.

Sem travessões no meio da frase.

## Contatos oficiais

- WhatsApp: 47 99240-6661 (`5547992406661`)
- Instagram: `reysonmkt`
- Email: psycomunic@gmail.com

Nomes: é **Vinci Society**, não "Vincy Socyete".

## As duas coisas que este repositório entrega

| O quê | Onde | Público |
|---|---|---|
| Landing page "Páginas que vendem" | `public/paginas-que-vendem/` (HTML estático) | agências nichadas — sites a R$ 797 e R$ 1.497 |
| Site principal: e-commerce e performance | `src/app/` (Next.js) | lojistas — tráfego pago e desenvolvimento |

A landing page antiga é servida por um rewrite em `next.config.ts`, porque o
Next só serve `/public` por caminho exato. Ela é HTML/CSS/JS puro e **não deve
ser convertida** para Next sem pedido explícito.

### Armadilhas de CSS na landing page

Já quebraram uma vez cada. Não regridam:

```css
body { overflow-x: clip; }   /* NUNCA hidden: hidden mata position:sticky */
.hero { overflow: clip; }    /* mesmo motivo */
```

- `overflow:hidden` em **qualquer ancestral** quebra `position:sticky`.
  `clip` corta sem criar contexto de rolagem.
- Nada de seletor coringa tipo `body > *:not(#id)`. Um id dentro de `:not()`
  conta como id na especificidade, e isso já roubou `position` e `z-index` de
  meia dúzia de elementos.
- As logos do carrossel são **data URI** em `logos-vinci.css`, de propósito:
  `mask-image` com URL externa é bloqueado sob `file://`, e máscara que falha
  esconde o elemento inteiro.

## Verificação

Captura de tela em headless com rolagem programática **mente** neste projeto:
volta preta de forma sistemática. Para conferir layout, meça geometria
(`getBoundingClientRect`, `elementFromPoint`, `getComputedStyle`), não confie na
imagem.

## Conteúdo é configuração

Textos do site principal ficam em `src/conteudo/*.ts`, não espalhados em JSX.

Dado privado (proposta comercial) fica em `src/dados/`, com `import 'server-only'`
no topo — isso faz o build falhar se um componente de cliente importar.

## Plataforma

Estado, decisões e o que falta: **`PLATAFORMA.md`**. Leia antes de mexer em
`/entrar`, `/painel`, `src/lib/supabase/` ou `supabase/migrations/`.

Regra que não se quebra: a matriz de permissões vive em **dois** lugares que
precisam continuar de acordo — `src/lib/papeis.ts` e as políticas RLS. Mudou
uma, mude a outra.

## Pendências com o cliente

- Fontes MADE Tommy em `public/paginas-que-vendem/fontes/` são a versão
  **PERSONAL USE**. Falta licença comercial (pixelsurplus.com), e o repositório
  é público.
- Hex das cores em `src/app/globals.css` foram lidos do PDF do manual. Confirmar
  com os valores oficiais.
- Autorização escrita para usar logos e resultados de clientes.
