-- =====================================================================
-- 0043 - Mais respiro: os dois parágrafos pesados viram quatro.
--
-- O QUE ESTAVA DESEQUILIBRADO
--
-- Medido, parágrafo a parágrafo:
--
--   1   3 palavras   a saudação
--   2  13 palavras   como cheguei
--   3  31 palavras   duas frases
--   4  44 palavras   TRÊS frases
--   5  25 palavras   os quinze minutos
--   6   6 palavras   a pergunta
--
-- O quarto sozinho carregava um terço da mensagem. Num direct, bloco
-- desse tamanho é onde o olho desiste, e ele estava logo antes do
-- convite, que é a parte que precisa ser lida.
--
-- ONDE CADA UM SE PARTE
--
-- Nos dois pontos em que a ideia já mudava sozinha, e a frase seguinte
-- só estava colada por falta de linha:
--
--   3  o que chamei atenção  |  por que isso é a parte difícil
--   4  quem somos e como     |  por que estou falando com VOCÊ
--
-- Vira uma ideia por bloco, de 3 a 25 palavras. Nenhuma palavra muda.
--
-- POR QUE AS ÂNCORAS SÃO ESSAS
--
-- ". Produto próprio e marca conhecida" e ". Enxergo um potencial
-- grande" são texto fixo, igual nas 49, e aparecem UMA vez em cada. O
-- gancho e o nome da empresa, que mudam de lead para lead, ficam de
-- fora do trecho procurado. Conferido antes de escrever esta migração.
-- =====================================================================

update prospeccao
   set mensagem_abertura = replace(
         replace(
           mensagem_abertura,
           '. Produto próprio e marca conhecida',
           E'.\n\nProduto próprio e marca conhecida'),
         '. Enxergo um potencial grande',
         E'.\n\nEnxergo um potencial grande')
 where mensagem_abertura like '%. Produto próprio e marca conhecida%'
    or mensagem_abertura like '%. Enxergo um potencial grande%';
