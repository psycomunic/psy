-- =====================================================================
-- 0042 - "Pegamos", e não "a gente pega".
--
-- O PROBLEMA NÃO ERA A PALAVRA SOLTA
--
-- Era a troca de registro dentro do mesmo parágrafo. A frase anterior é
-- "NÓS somos uma agência especializada em e-commerce de moda", e a
-- seguinte emendava "A GENTE pega poucas operações por vez". Duas
-- primeiras pessoas do plural diferentes, coladas, e a segunda é a
-- informal.
--
-- Numa mensagem que já se apresenta e pede uma reunião, essa mistura faz
-- o texto soar montado por pedaços, que é justamente o que ele passou
-- as últimas versões tentando não parecer.
--
-- A CONCORDÂNCIA VAI EM CADEIA
--
-- Não bastava trocar o verbo da frente: os três seguintes estavam na
-- terceira pessoa por causa de "a gente".
--
--   A gente PEGA ... porque ACOMPANHA ... e não só ENTREGA ... e SOME
--   PEGAMOS ... porque ACOMPANHAMOS ... e não só ENTREGAMOS ... e SUMIMOS
--
-- POR QUE UM `replace`, E NÃO OS 49 TEXTOS DE NOVO
--
-- Porque a frase é idêntica nas 49, e reescrever tudo para mudar uma
-- oração abriria espaço para diferença onde ninguém pediu. Assim a
-- alteração é exatamente a que está escrita aqui, e rodar duas vezes não
-- faz nada na segunda.
-- =====================================================================

update prospeccao
   set mensagem_abertura = replace(
         mensagem_abertura,
         'A gente pega poucas operações por vez, porque acompanha todo mês depois do lançamento, e não só entrega a loja e some.',
         'Pegamos poucas operações por vez, porque acompanhamos todo mês depois do lançamento, e não só entregamos a loja e sumimos.')
 where mensagem_abertura like '%A gente pega poucas operações por vez%';
