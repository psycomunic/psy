# Design

<!-- impeccable:design-schema 1 -->

## World

**Expedição.** A operação vendida como carga despachada.

O lojista de moda que já vende passa o dia dentro deste vocabulário:
etiqueta, lista de separação, conferência, rastreio, remessa. A palavra
que o próprio conteúdo já usava para as entregas da Psy Comunic é
**entrega**. O site não pede emprestada uma metáfora: usa o documento
que esse leitor assina todo dia.

O que o mundo carrega sem esforço: fase com fim declarado vira remessa
fechada com número de itens; entrega contínua vira rastreio que não
encerra; a lista de 9 e 8 entregas vira lista de separação; o pedido de
diagnóstico vira despacho.

### Duas disciplinas tomadas dos desafiantes vencidos

- **Do cartaz de sessão dupla:** o rosa deixa de ser respingo e passa a
  ocupar **região inteira**, como a tarja de PRIORITÁRIO numa etiqueta.
  Cor que preenche campo, não detalhe que decora.
- **Do minihompy:** a remessa é **um objeto só e persistente**. O mesmo
  documento acompanha o visitante do topo ao rodapé, em vez de um
  cartão solto por seção.

### Tradução do material

O mundo é de papel kraft e cinza de papelão. A marca é marinho e rosa,
e marca fixada vence material sorteado. A tradução: o **papel** fica
(fundo de etiqueta, quase branco, levemente quente), a **tinta** é o
marinho, e a **tarja** é o rosa. O papelão sai.

## Ground

**Claro.** Não por categoria: pela cena de uso. O leitor abre no
celular, no meio do expediente, muitas vezes dentro da loja ou na rua,
com luz alta. Etiqueta é objeto de luz refletida, não de tela acesa.

## Palette

| Papel | `--exp-papel` | `#F4F2ED` | fundo de etiqueta, quase branco e levemente quente |
| Papel fundo | `--exp-fundo` | `#EAE7E0` | segundo plano, vão entre documentos |
| Tinta | `--exp-tinta` | `#0B1437` | marinho da marca; todo texto e todo fio |
| Tinta fraca | `--exp-tinta-fraca` | `#5C6178` | carimbo desbotado, texto de campo |
| Tarja | `--exp-tarja` | `#FF2E63` | rosa da marca, em REGIÃO: faixa, campo, tarja |
| Tarja tinta | `--exp-tarja-tinta` | `#D91A4A` | rosa escurecido, para texto e fundo de botão |

Estratégia: **Committed**. O rosa não é acento espalhado: ele toma
faixas inteiras, e o resto da página é papel e tinta.

## Type

**Archivo** variável, eixo de largura em 78%, peso 800, caixa alta nos
títulos. Fixada pela marca e mantida: é a condensada de letreiro, e
letreiro é o que uma etiqueta tem.

**Inter** no corpo e em todo campo de formulário.

**Tabular em todo número**, sem exceção: peso, quantidade, código,
contagem de item. Documento de carga com número dançando é documento
falso.

## Composition

O documento é **um só**, com campos rotulados, e a página inteira vive
dentro dele. Fios de 1px dividem campos, como numa etiqueta impressa.

- Campo rotulado: rótulo em 11px na tinta fraca, valor logo abaixo.
- Fio de campo: 1px na tinta a 14%.
- Tarja: bloco de rosa cheio, com o texto em papel dentro.
- Picote: linha tracejada onde o documento se separa em partes.

## Motion

**Um momento autorado, e só um: o carimbo.** O botão de despacho recebe
o carimbo de CONFERIDO no hover, entrando levemente girado e assentando
em 180ms com saída exponencial. Nada mais na página anima sozinho.

`prefers-reduced-motion` entrega o carimbo já assentado.

## Browser surfaces

O que o navegador desenha também é o design:

- Seleção de texto: tarja rosa com texto em papel.
- Cursor de texto (`caret-color`): tinta.
- Barra de rolagem: trilho papel-fundo, polegar tinta a 30%.
- Anel de foco: 2px tarja, deslocamento 3px.
- Sublinhado de link: deslocamento 3px, espessura 1px.
- `font-variant-numeric: tabular-nums` em todo dado.

## Bans carried from the craft floor

- **Sem olho acima do título.** O rótulo pequeno que existia em toda
  seção foi removido: o título carrega o próprio peso. Rótulo aqui só
  existe como **rótulo de campo**, que é outra coisa: ele nomeia um
  dado, não anuncia um título.
- **Sem numeração de seção decorativa.** Número só onde a sequência
  informa: as duas remessas e os itens dentro delas.
- **Sem vidro decorativo.** O painel do formulário de tráfego pago é
  efeito específico, com brilho atrás para borrar, e fica. Nada de
  blur novo como enfeite.
- Sem card de ícone mais título mais texto como estrutura de página.
