# Pasta de imagens

Quase toda imagem aqui tem duas versões: o **original** que você mandou e a
**versão web** que a página realmente usa. Os originais ficam fora do
versionamento (ver `.gitignore`), porque somam mais de 100 MB.

## O que a página usa

| Arquivo | Onde aparece | Peso |
|---|---|---|
| `angelo-final.jpg` | foto da hero | 147 KB |
| `reyson.jpg` | foto da seção Sobre | 193 KB |
| `ipad.jpg` | mockup da seção de nicho | 161 KB |
| `vinci-society.jpg` | foto do encontro da Vinci Society | 526 KB |
| `cases/*.png` | 28 silhuetas do carrossel de marcas | 153 KB |
| `sites/web/*.jpg` | 12 prints do portfólio | 2,4 MB |
| `logos-vinci-society/*` | fonte do `logos-vinci.css` | 130 KB |

Falta ainda: **`og-capa.jpg`**, 1200 × 630 px. É a imagem que aparece quando
alguém compartilha o link no WhatsApp ou nas redes. Hoje o arquivo não existe,
então o compartilhamento sai sem prévia.

## Adicionar um projeto ao portfólio

1. Print da página inteira, 1920px de largura, salvo em `sites/`
2. Gere a versão web: **560px de largura, no máximo 4000px de altura, JPEG**
3. Salve em `sites/web/`
4. Copie um bloco `<a class="work">` no `index.html`, troque `src`, `alt` e nome
5. Ajuste o `--dur`: `(altura ÷ largura) × 1,35`, entre `5s` e `12s`

O teto de 4000px existe porque alguns prints passavam de 20.000px. Cortar não
prejudica: a janela serve para dar a noção da página, não para entregar o site
inteiro.

## Adicionar uma marca ao carrossel de cases

A silhueta precisa ser **branca, fundo transparente, recortada rente ao
desenho**. Se vier logo preto em fundo branco, converta luminância em canal
alfa antes. Salve em `cases/` e adicione o `<img class="caso">` **nos dois
blocos** `logos__set` do `index.html`.

## Regra geral de peso

Comprima tudo antes de subir, em https://squoosh.app. Página lenta derruba
conversão, e imagem é sempre o que pesa mais. Referência: nenhuma imagem
isolada acima de 300 KB, exceto as fotos de largura total.
