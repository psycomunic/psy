# Depoimentos em vídeo

Salve aqui os vídeos que seus clientes mandarem, com **exatamente** estes nomes:

```
depoimento-1.mp4
depoimento-2.mp4
depoimento-3.mp4
```

Enquanto o arquivo não existir, o card aparece como espaço reservado mostrando
o nome esperado, e o botão de play fica escondido. Assim que o vídeo carrega,
o card libera sozinho, sem você precisar mexer em código.

## Formato

| item | valor |
|---|---|
| Proporção | **9:16** (stories) |
| Resolução ideal | 720 × 1280 |
| Duração | 20 a 45 segundos |
| Peso | até 2 MB por vídeo |
| Áudio | **obrigatório**, é ele que faz o depoimento valer |

Vídeo de stories já sai nessa proporção no celular. Se o cliente mandar em
outro formato, o card corta pelas laterais e mantém o centro, então o rosto
dele precisa estar centralizado.

## Como funciona na página

O card fica mudo e parado. Ao **clicar**, ele toca **com som**. Só um toca por
vez: clicar em outro pausa o anterior. Sair da tela também pausa.

Se o navegador bloquear o som (alguns bloqueiam sem interação prévia), o vídeo
toca mudo em vez de não tocar.

## Mais de três depoimentos

Copie um bloco `<figure class="story">` inteiro no `index.html` e mude o número
do arquivo. Se passar de três, vale trocar a grade para duas linhas: no
`style.css`, procure `.stories` e mude `repeat(3,1fr)` para `repeat(2,1fr)`.

## Peso

Comprima antes de subir, em https://www.freeconvert.com/video-compressor ou
qualquer editor. Três vídeos de 5 MB somam 15 MB e derrubam a página no
celular. Com 2 MB cada, o total fica em 6 MB e carrega sob demanda, porque
eles só baixam quando entram na tela.
