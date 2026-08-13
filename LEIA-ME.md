# Landing page. Angelo Garcia

Página estática (HTML, CSS e JS puro). Sem build, sem dependência.
Abrir `index.html` no navegador já funciona.

```
index.html    conteúdo e textos
style.css     sistema visual
script.js     contato, animações e o cérebro de partículas
imagens/      seus prints e sua foto (ver imagens/LEIA-ME.md)
DESIGN.md     o style guide que este projeto segue
```

## Posicionamento

A página vende **sites e landing pages de alta conversão para agências nichadas**.
Isso aparece em três lugares: no `<title>`, no label do hero e na seção de declaração
logo abaixo da barra de prova social.

## O que EDITAR antes de publicar

Procure no código pelos comentários `EDITAR:`.

| # | Onde | O quê |
|---|---|---|
| 1 | `script.js`, linha ~11 | **Seu WhatsApp.** Troque `5511999999999` pelo seu número (DDI, DDD e número, só dígitos). Isso atualiza todos os botões da página de uma vez. |
| 2 | `index.html`, seção de prova | O número **200 projetos** é um chute meu. Coloque o real. |
| 3 | `index.html`, depoimentos | Substitua os 3 textos entre colchetes por depoimentos reais, com nome e nicho. |
| 4 | `index.html`, investimento | Ajuste os valores de partida (R$ 1.997 e R$ 3.497). |
| 5 | `index.html`, trabalhos | Troque os nomes dos projetos e as tags. |
| 6 | `index.html`, rodapé | Seu e-mail e seu Instagram. |
| 7 | `imagens/` | Suas imagens (ver `imagens/LEIA-ME.md`). |

## Regras do sistema visual

Este projeto segue o `DESIGN.md` ao pé da letra. Se você for editar o CSS,
mantenha estas regras, porque são elas que dão a identidade:

- `#000000` puro em toda seção. Nenhum card, painel, borda ou sombra.
- Hierarquia por **escala** e tracking negativo, nunca por peso da fonte.
- Todo título em peso 400. Todo corpo de texto em peso 200.
- `#8052ff` só em botão de ação preenchido. Nunca como fundo de bloco.
- `#ffb829` só em ênfase e em label de seção.
- Sem gradiente em componente de UI. Só na logo e nas partículas.
- Raio de 24px. Pill somente em elementos pequenos.
- Um único botão preenchido por tela. Os secundários são link de texto.

## Tipografia

Duas fontes, as duas da Fontshare, uso comercial livre.

| Fonte | Onde | Por quê |
|---|---|---|
| **Bebas Neue** | títulos, números da prova social, preços, nomes de projeto e links do menu | condensada, caixa alta, peso único. Cara de cartaz. Ela converte minúsculas em maiúsculas sozinha, então o HTML segue escrito em caixa mista e você não precisa digitar gritando |
| **Switzer** | corpo, nav, labels, botões, perguntas do FAQ e depoimentos | equivalente livre da PP Neue Montreal, a fonte real da referência do `DESIGN.md` |

FAQ e depoimentos ficaram de fora da Bebas de propósito: caixa alta em bloco
de leitura cansa a vista e derruba a compreensão justamente onde o visitante
está resolvendo a última objeção.

Dois ajustes que a condensada exigiu, e que valem manter se você trocar de fonte:

- **Espacejamento neutro** (`0.005em`) em vez do `-0.04em` do sistema. Tracking
  negativo serve para grotesca em caixa mista. Em condensada de caixa alta ele
  gruda as letras.
- **Corpo maior** nos títulos. Condensada ocupa menos largura, então precisa de
  tamanho maior para ter a mesma presença que a escala do sistema previa.

Pesos em uso, como o sistema pede:

| Peso | Onde |
|---|---|
| 200 | corpo de texto de 18px, a assinatura do sistema |
| 400 | todos os títulos. Nunca bold, a hierarquia vem da escala |
| 600 | nav, labels e botões, em caixa alta |

Para trocar a fonte dos títulos, mude dois pontos: o `<link>` do Google Fonts no
`<head>` do `index.html` e a variável `--font-display` no topo do `style.css`.
Deixei três alternativas condensadas comentadas ali: `Anton` (mais pesada e
fechada), `Oswald` (condensada com minúsculas de verdade) e
`Big Shoulders Display` (condensada extrema, mais técnica).

Se quiser a PP Neue Montreal original, compre em pangrampangram.com, coloque os
arquivos em `/fontes` e declare um `@font-face` no topo do `style.css`.

## O carrossel de logos da Vinci Society

Cada marca é desenhada como **máscara**, não como imagem. A forma vem do canal
alfa do arquivo e a cor vem do `background-color`. É isso que permite pintar
SVG e PNG de origens diferentes com a mesma cor e trocar essa cor no hover,
coisa que uma `<img>` comum não faz.

Cor de repouso: violeta `#8052ff`. No hover: âmbar `#ffb829`. Para mudar, procure
`.marca` no `style.css`.

Para adicionar ou remover uma marca, edite **os dois blocos** `logos__set` do
`index.html`. Eles são idênticos de propósito: o carrossel anda exatamente a
largura de um bloco, então a emenda cai no ponto igual e o laço parece infinito.
Mexer em só um dos blocos quebra a continuidade.

Requisito do arquivo do logo: **fundo transparente**. Logo sobre fundo branco
chapado vira um retângulo sólido, porque a máscara usa o canal alfa. Foi o caso
do Salvy, que veio sem alfa e por isso tem uma versão `02-salvy-alpha.png`
gerada a partir da luminância do original.

## O cérebro do hero

Não é imagem nem vídeo. É gerado no canvas em três passos, dentro do `script.js`:

1. A silhueta (córtex, cerebelo e tronco) é desenhada num canvas invisível de 300 por 300,
   com cada região pintada numa cor-código: vermelho para o miolo, verde para as
   circunvoluções e azul para o contorno.
2. Os pixels são lidos e milhares de posições são sorteadas dentro de cada região.
   É isso que faz o formato aparecer.
3. Cada partícula ganha profundidade, gira devagar e se afasta quando o cursor chega perto.

Para mudar o formato, mexa no array `CORTEX`. Para mudar a densidade,
mexa nos números dentro de `semearRegiao`.

## Publicar

Vercel (grátis, com domínio próprio):

```bash
npm i -g vercel
vercel        # preview
vercel --prod # produção
```

Sem terminal: arraste a pasta inteira em https://app.netlify.com/drop

## Antes de rodar tráfego

- [ ] Instalar o Pixel do Meta e o Google Analytics antes de `</head>`
- [ ] Testar todos os botões de WhatsApp no celular
- [ ] Rodar em https://pagespeed.web.dev, mirando 90 ou mais no mobile
- [ ] Comprimir as imagens em https://squoosh.app
- [ ] Trocar `og-capa.jpg`, que é o que aparece quando compartilham o link
