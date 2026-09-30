-- =====================================================================
-- 0041 - Uma mensagem só, na estrutura que converte.
--
-- DE ONDE VEIO O MOLDE
--
-- De uma abordagem real que quem envia recebeu como referência, de
-- outra agência, em outro nicho. A estrutura dela é a que foi copiada,
-- e não as palavras:
--
--   1  a saudação pelo nome
--   2  COMO cheguei até você, específico
--   3  O ELOGIO, e é aqui que ela ganha: diz o que chamou atenção
--      naquela empresa, com detalhe que só quem olhou consegue dar
--   4  quem somos, no nicho, e por que estou falando com VOCÊ
--   5  quinze minutos, com o que EU vou mostrar neles
--   6  a pergunta fechada
--
-- E TUDO NUMA MENSAGEM
--
-- As versões anteriores mandavam em quatro ou cinco envios. Uma só,
-- com parágrafos, é o que o molde faz, e é o que quem envia pediu.
-- Consequência no código: `mensagem_abertura` volta a ser um texto
-- inteiro, e o divisor em partes sai, porque agora as linhas em branco
-- são parágrafos e não fronteiras de envio.
--
-- O QUE EU NÃO COPIEI, E POR QUE
--
-- O molde diz "estamos com vagas disponíveis para entrada de clientes
-- este ano". É escassez, funciona, e eu não sei se é verdade aqui.
-- Escassez inventada é dado falso, que este projeto não publica, e é a
-- primeira coisa que desmorona se a pessoa perguntar "quantas vagas?".
--
-- No lugar entrou o motivo REAL de a agência pegar pouca gente: ela
-- acompanha todo mês depois do lançamento, e não entrega a loja e some.
-- Isso está em `jornada.ts`, é verdade, e convence mais do que a frase
-- solta, porque explica a causa em vez de anunciar o efeito.
--
-- OS QUINZE MINUTOS TÊM ENTREGÁVEL, E ELE MUDA
--
-- No molde, quem já anuncia recebe análise de campanha e quem não
-- anuncia recebe o custo da concorrência. Mesma lógica aqui:
--
--   só marketplaces  comparo a margem do marketplace com a da loja própria
--   já tem site      analiso a loja e aponto onde ela perde venda
--   só atacado       mostro como fábricas do porte vendem direto
--   o resto          mostro quanto o segmento vende online
--
-- Sem isso, "quinze minutos" é pedir tempo. Com isso, é oferecer algo.
-- =====================================================================

with nova(codigo, mensagem) as (values
  ('L001', 'Oi{dono}, tudo bem?

Me chamo Angelo e cheguei até você pelo Instagram de Reiwiu Confecções.

Primeiro queria dizer o que me chamou atenção: vocês têm fabricação própria há mais de 26 anos e 3 lojas em Brusque. Produto próprio e marca conhecida na região é a parte difícil, e vocês já têm as duas.

Nós somos uma agência especializada em e-commerce de moda. A gente pega poucas operações por vez, porque acompanha todo mês depois do lançamento, e não só entrega a loja e some. Enxergo um potencial grande em Reiwiu Confecções para vender online, por isso o contato.

Se você tiver 15 minutos, eu te mostro quanto o seu segmento já vende online e como ficaria a loja de vocês.

Então, você tem interesse? Podemos marcar?'),
  ('L002', 'Oi{dono}, tudo bem?

Me chamo Angelo e cheguei até você pelo Instagram de Peka''s Jeans.

Primeiro queria dizer o que me chamou atenção: vocês estão há 26 anos no jeans com loja de fábrica em Brusque. Produto próprio e marca conhecida na região é a parte difícil, e vocês já têm as duas.

Nós somos uma agência especializada em e-commerce de moda. A gente pega poucas operações por vez, porque acompanha todo mês depois do lançamento, e não só entrega a loja e some. Enxergo um potencial grande em Peka''s Jeans para vender online, por isso o contato.

Se você tiver 15 minutos, eu te mostro quanto o seu segmento já vende online e como ficaria a loja de vocês.

Então, você tem interesse? Podemos marcar?'),
  ('L003', 'Oi{dono}, tudo bem?

Me chamo Angelo e cheguei até você pelo Instagram de YouMen.

Primeiro queria dizer o que me chamou atenção: vocês fabricam básicos masculinos e atendem atacado e varejo na FIP. Produto próprio e marca conhecida na região é a parte difícil, e vocês já têm as duas.

Nós somos uma agência especializada em e-commerce de moda. A gente pega poucas operações por vez, porque acompanha todo mês depois do lançamento, e não só entrega a loja e some. Enxergo um potencial grande em YouMen para vender online, por isso o contato.

Se você tiver 15 minutos, eu te mostro quanto o seu segmento já vende online e como ficaria a loja de vocês.

Então, você tem interesse? Podemos marcar?'),
  ('L004', 'Oi{dono}, tudo bem?

Me chamo Angelo e cheguei até você pelo Instagram de Diamond Atacado.

Primeiro queria dizer o que me chamou atenção: vocês têm fabricação própria e hoje vendem pelo direct. Produto próprio e marca conhecida na região é a parte difícil, e vocês já têm as duas.

Nós somos uma agência especializada em e-commerce de moda. A gente pega poucas operações por vez, porque acompanha todo mês depois do lançamento, e não só entrega a loja e some. Enxergo um potencial grande em Diamond Atacado para vender online, por isso o contato.

Se você tiver 15 minutos, eu te mostro quanto o seu segmento já vende online e como ficaria a loja de vocês.

Então, você tem interesse? Podemos marcar?'),
  ('L005', 'Oi{dono}, tudo bem?

Me chamo Angelo e cheguei até você pelo Instagram de Fábrica de Camisetas Brusque.

Primeiro queria dizer o que me chamou atenção: vocês fabricam camisetas e já enviam para todo o Brasil pelo WhatsApp. Produto próprio e marca conhecida na região é a parte difícil, e vocês já têm as duas.

Nós somos uma agência especializada em e-commerce de moda. A gente pega poucas operações por vez, porque acompanha todo mês depois do lançamento, e não só entrega a loja e some. Enxergo um potencial grande em Fábrica de Camisetas Brusque para vender online, por isso o contato.

Se você tiver 15 minutos, eu te mostro quanto o seu segmento já vende online e como ficaria a loja de vocês.

Então, você tem interesse? Podemos marcar?'),
  ('L006', 'Oi{dono}, tudo bem?

Me chamo Angelo e cheguei até você pelo Instagram de Mulher Única.

Primeiro queria dizer o que me chamou atenção: vocês têm fabricação própria no plus size. Produto próprio e marca conhecida na região é a parte difícil, e vocês já têm as duas.

Nós somos uma agência especializada em e-commerce de moda. A gente pega poucas operações por vez, porque acompanha todo mês depois do lançamento, e não só entrega a loja e some. Enxergo um potencial grande em Mulher Única para vender online, por isso o contato.

Se você tiver 15 minutos, eu te mostro quanto o seu segmento já vende online e como ficaria a loja de vocês.

Então, você tem interesse? Podemos marcar?'),
  ('L007', 'Oi{dono}, tudo bem?

Me chamo Angelo e cheguei até você pelo Instagram de Ana Gonçalves Tricot.

Primeiro queria dizer o que me chamou atenção: vocês trabalham com tricot desde 1980. Produto próprio e marca conhecida na região é a parte difícil, e vocês já têm as duas.

Nós somos uma agência especializada em e-commerce de moda. A gente pega poucas operações por vez, porque acompanha todo mês depois do lançamento, e não só entrega a loja e some. Enxergo um potencial grande em Ana Gonçalves Tricot para vender online, por isso o contato.

Se você tiver 15 minutos, eu te mostro como fábricas do porte de vocês estão vendendo direto ao consumidor sem brigar com o próprio lojista.

Então, você tem interesse? Podemos marcar?'),
  ('L008', 'Oi{dono}, tudo bem?

Me chamo Angelo e cheguei até você pelo Instagram de Atacadão das Malhas.

Primeiro queria dizer o que me chamou atenção: vocês têm loja de fábrica de tricot em Brusque. Produto próprio e marca conhecida na região é a parte difícil, e vocês já têm as duas.

Nós somos uma agência especializada em e-commerce de moda. A gente pega poucas operações por vez, porque acompanha todo mês depois do lançamento, e não só entrega a loja e some. Enxergo um potencial grande em Atacadão das Malhas para vender online, por isso o contato.

Se você tiver 15 minutos, eu analiso a loja que vocês já têm e aponto onde ela está perdendo venda, do anúncio até o checkout.

Então, você tem interesse? Podemos marcar?'),
  ('L009', 'Oi{dono}, tudo bem?

Me chamo Angelo e cheguei até você pelo Instagram de La Miller Tricot.

Primeiro queria dizer o que me chamou atenção: vocês fabricam tricot no All Shopping com envio imediato. Produto próprio e marca conhecida na região é a parte difícil, e vocês já têm as duas.

Nós somos uma agência especializada em e-commerce de moda. A gente pega poucas operações por vez, porque acompanha todo mês depois do lançamento, e não só entrega a loja e some. Enxergo um potencial grande em La Miller Tricot para vender online, por isso o contato.

Se você tiver 15 minutos, eu te mostro como fábricas do porte de vocês estão vendendo direto ao consumidor sem brigar com o próprio lojista.

Então, você tem interesse? Podemos marcar?'),
  ('L010', 'Oi{dono}, tudo bem?

Me chamo Angelo e cheguei até você pelo Instagram de Vida Fit.

Primeiro queria dizer o que me chamou atenção: vocês fabricam fitness e vendem 100% no atacado. Produto próprio e marca conhecida na região é a parte difícil, e vocês já têm as duas.

Nós somos uma agência especializada em e-commerce de moda. A gente pega poucas operações por vez, porque acompanha todo mês depois do lançamento, e não só entrega a loja e some. Enxergo um potencial grande em Vida Fit para vender online, por isso o contato.

Se você tiver 15 minutos, eu te mostro como fábricas do porte de vocês estão vendendo direto ao consumidor sem brigar com o próprio lojista.

Então, você tem interesse? Podemos marcar?'),
  ('L011', 'Oi{dono}, tudo bem?

Me chamo Angelo e cheguei até você pelo Instagram de De Pijama Brusque.

Primeiro queria dizer o que me chamou atenção: vocês fabricam pijamas e já vendem online. Produto próprio e marca conhecida na região é a parte difícil, e vocês já têm as duas.

Nós somos uma agência especializada em e-commerce de moda. A gente pega poucas operações por vez, porque acompanha todo mês depois do lançamento, e não só entrega a loja e some. Enxergo um potencial grande em De Pijama Brusque para vender online, por isso o contato.

Se você tiver 15 minutos, eu analiso a loja que vocês já têm e aponto onde ela está perdendo venda, do anúncio até o checkout.

Então, você tem interesse? Podemos marcar?'),
  ('L012', 'Oi{dono}, tudo bem?

Me chamo Angelo e cheguei até você pelo Instagram de Leleco Peteleco.

Primeiro queria dizer o que me chamou atenção: vocês são fabricantes de moda infantil e atendem pelo WhatsApp. Produto próprio e marca conhecida na região é a parte difícil, e vocês já têm as duas.

Nós somos uma agência especializada em e-commerce de moda. A gente pega poucas operações por vez, porque acompanha todo mês depois do lançamento, e não só entrega a loja e some. Enxergo um potencial grande em Leleco Peteleco para vender online, por isso o contato.

Se você tiver 15 minutos, eu te mostro como fábricas do porte de vocês estão vendendo direto ao consumidor sem brigar com o próprio lojista.

Então, você tem interesse? Podemos marcar?'),
  ('L013', 'Oi{dono}, tudo bem?

Me chamo Angelo e cheguei até você pelo Instagram de Pega Mania.

Primeiro queria dizer o que me chamou atenção: vocês produzem infantil e estão na maioria dos estados. Produto próprio e marca conhecida na região é a parte difícil, e vocês já têm as duas.

Nós somos uma agência especializada em e-commerce de moda. A gente pega poucas operações por vez, porque acompanha todo mês depois do lançamento, e não só entrega a loja e some. Enxergo um potencial grande em Pega Mania para vender online, por isso o contato.

Se você tiver 15 minutos, eu analiso a loja que vocês já têm e aponto onde ela está perdendo venda, do anúncio até o checkout.

Então, você tem interesse? Podemos marcar?'),
  ('L014', 'Oi{dono}, tudo bem?

Me chamo Angelo e cheguei até você pelo Instagram de Iduna Fitness.

Primeiro queria dizer o que me chamou atenção: vocês têm loja de fábrica fitness vendendo para todo o Brasil. Produto próprio e marca conhecida na região é a parte difícil, e vocês já têm as duas.

Nós somos uma agência especializada em e-commerce de moda. A gente pega poucas operações por vez, porque acompanha todo mês depois do lançamento, e não só entrega a loja e some. Enxergo um potencial grande em Iduna Fitness para vender online, por isso o contato.

Se você tiver 15 minutos, eu analiso a loja que vocês já têm e aponto onde ela está perdendo venda, do anúncio até o checkout.

Então, você tem interesse? Podemos marcar?'),
  ('L015', 'Oi{dono}, tudo bem?

Me chamo Angelo e cheguei até você pelo Instagram de Brulini Moda Íntima.

Primeiro queria dizer o que me chamou atenção: vocês produzem moda íntima direto da fábrica. Produto próprio e marca conhecida na região é a parte difícil, e vocês já têm as duas.

Nós somos uma agência especializada em e-commerce de moda. A gente pega poucas operações por vez, porque acompanha todo mês depois do lançamento, e não só entrega a loja e some. Enxergo um potencial grande em Brulini Moda Íntima para vender online, por isso o contato.

Se você tiver 15 minutos, eu te mostro quanto o seu segmento já vende online e como ficaria a loja de vocês.

Então, você tem interesse? Podemos marcar?'),
  ('L016', 'Oi{dono}, tudo bem?

Me chamo Angelo e cheguei até você pelo Instagram de Summer Girl.

Primeiro queria dizer o que me chamou atenção: vocês têm mais de 20 anos no atacado e selo ABVTEX. Produto próprio e marca conhecida na região é a parte difícil, e vocês já têm as duas.

Nós somos uma agência especializada em e-commerce de moda. A gente pega poucas operações por vez, porque acompanha todo mês depois do lançamento, e não só entrega a loja e some. Enxergo um potencial grande em Summer Girl para vender online, por isso o contato.

Se você tiver 15 minutos, eu te mostro como fábricas do porte de vocês estão vendendo direto ao consumidor sem brigar com o próprio lojista.

Então, você tem interesse? Podemos marcar?'),
  ('L017', 'Oi{dono}, tudo bem?

Me chamo Angelo e cheguei até você pelo Instagram de Xá Plus.

Primeiro queria dizer o que me chamou atenção: vocês atendem lojistas de plus size no Master Shopping. Produto próprio e marca conhecida na região é a parte difícil, e vocês já têm as duas.

Nós somos uma agência especializada em e-commerce de moda. A gente pega poucas operações por vez, porque acompanha todo mês depois do lançamento, e não só entrega a loja e some. Enxergo um potencial grande em Xá Plus para vender online, por isso o contato.

Se você tiver 15 minutos, eu te mostro como fábricas do porte de vocês estão vendendo direto ao consumidor sem brigar com o próprio lojista.

Então, você tem interesse? Podemos marcar?'),
  ('L018', 'Oi{dono}, tudo bem?

Me chamo Angelo e cheguei até você pelo Instagram de Alekids.

Primeiro queria dizer o que me chamou atenção: vocês têm coleções exclusivas no atacado infantil. Produto próprio e marca conhecida na região é a parte difícil, e vocês já têm as duas.

Nós somos uma agência especializada em e-commerce de moda. A gente pega poucas operações por vez, porque acompanha todo mês depois do lançamento, e não só entrega a loja e some. Enxergo um potencial grande em Alekids para vender online, por isso o contato.

Se você tiver 15 minutos, eu analiso a loja que vocês já têm e aponto onde ela está perdendo venda, do anúncio até o checkout.

Então, você tem interesse? Podemos marcar?'),
  ('L019', 'Oi{dono}, tudo bem?

Me chamo Angelo e cheguei até você pelo Instagram de Lunedi.

Primeiro queria dizer o que me chamou atenção: vocês atendem lojistas do P ao 16 direto de Gaspar. Produto próprio e marca conhecida na região é a parte difícil, e vocês já têm as duas.

Nós somos uma agência especializada em e-commerce de moda. A gente pega poucas operações por vez, porque acompanha todo mês depois do lançamento, e não só entrega a loja e some. Enxergo um potencial grande em Lunedi para vender online, por isso o contato.

Se você tiver 15 minutos, eu te mostro como fábricas do porte de vocês estão vendendo direto ao consumidor sem brigar com o próprio lojista.

Então, você tem interesse? Podemos marcar?'),
  ('L020', 'Oi{dono}, tudo bem?

Me chamo Angelo e cheguei até você pelo Instagram de Rollu.

Primeiro queria dizer o que me chamou atenção: vocês são uma indústria com 36 anos no infantil. Produto próprio e marca conhecida na região é a parte difícil, e vocês já têm as duas.

Nós somos uma agência especializada em e-commerce de moda. A gente pega poucas operações por vez, porque acompanha todo mês depois do lançamento, e não só entrega a loja e some. Enxergo um potencial grande em Rollu para vender online, por isso o contato.

Se você tiver 15 minutos, eu te mostro como fábricas do porte de vocês estão vendendo direto ao consumidor sem brigar com o próprio lojista.

Então, você tem interesse? Podemos marcar?'),
  ('L021', 'Oi{dono}, tudo bem?

Me chamo Angelo e cheguei até você pelo Instagram de TMX Kids & Teens.

Primeiro queria dizer o que me chamou atenção: vocês vendem bebê a juvenil no atacado e hoje o pedido é por e-mail. Produto próprio e marca conhecida na região é a parte difícil, e vocês já têm as duas.

Nós somos uma agência especializada em e-commerce de moda. A gente pega poucas operações por vez, porque acompanha todo mês depois do lançamento, e não só entrega a loja e some. Enxergo um potencial grande em TMX Kids & Teens para vender online, por isso o contato.

Se você tiver 15 minutos, eu te mostro como fábricas do porte de vocês estão vendendo direto ao consumidor sem brigar com o próprio lojista.

Então, você tem interesse? Podemos marcar?'),
  ('L022', 'Oi{dono}, tudo bem?

Me chamo Angelo e cheguei até você pelo Instagram de Jidi Kids.

Primeiro queria dizer o que me chamou atenção: vocês têm confecção infantil própria em Gaspar. Produto próprio e marca conhecida na região é a parte difícil, e vocês já têm as duas.

Nós somos uma agência especializada em e-commerce de moda. A gente pega poucas operações por vez, porque acompanha todo mês depois do lançamento, e não só entrega a loja e some. Enxergo um potencial grande em Jidi Kids para vender online, por isso o contato.

Se você tiver 15 minutos, eu te mostro como fábricas do porte de vocês estão vendendo direto ao consumidor sem brigar com o próprio lojista.

Então, você tem interesse? Podemos marcar?'),
  ('L023', 'Oi{dono}, tudo bem?

Me chamo Angelo e cheguei até você pelo Instagram de Serelepe Kids.

Primeiro queria dizer o que me chamou atenção: vocês fabricam infantil em Gaspar desde 2003. Produto próprio e marca conhecida na região é a parte difícil, e vocês já têm as duas.

Nós somos uma agência especializada em e-commerce de moda. A gente pega poucas operações por vez, porque acompanha todo mês depois do lançamento, e não só entrega a loja e some. Enxergo um potencial grande em Serelepe Kids para vender online, por isso o contato.

Se você tiver 15 minutos, eu te mostro como fábricas do porte de vocês estão vendendo direto ao consumidor sem brigar com o próprio lojista.

Então, você tem interesse? Podemos marcar?'),
  ('L024', 'Oi{dono}, tudo bem?

Me chamo Angelo e cheguei até você pelo Instagram de PHO Kids.

Primeiro queria dizer o que me chamou atenção: vocês têm confecção própria no atacado infantil. Produto próprio e marca conhecida na região é a parte difícil, e vocês já têm as duas.

Nós somos uma agência especializada em e-commerce de moda. A gente pega poucas operações por vez, porque acompanha todo mês depois do lançamento, e não só entrega a loja e some. Enxergo um potencial grande em PHO Kids para vender online, por isso o contato.

Se você tiver 15 minutos, eu analiso a loja que vocês já têm e aponto onde ela está perdendo venda, do anúncio até o checkout.

Então, você tem interesse? Podemos marcar?'),
  ('L025', 'Oi{dono}, tudo bem?

Me chamo Angelo e cheguei até você pelo Instagram de DHC Atacado Infantil.

Primeiro queria dizer o que me chamou atenção: vocês atendem atacado infantil em Gaspar. Produto próprio e marca conhecida na região é a parte difícil, e vocês já têm as duas.

Nós somos uma agência especializada em e-commerce de moda. A gente pega poucas operações por vez, porque acompanha todo mês depois do lançamento, e não só entrega a loja e some. Enxergo um potencial grande em DHC Atacado Infantil para vender online, por isso o contato.

Se você tiver 15 minutos, eu te mostro como fábricas do porte de vocês estão vendendo direto ao consumidor sem brigar com o próprio lojista.

Então, você tem interesse? Podemos marcar?'),
  ('L026', 'Oi{dono}, tudo bem?

Me chamo Angelo e cheguei até você pelo Instagram de Vanetex.

Primeiro queria dizer o que me chamou atenção: vocês fabricam infantil e hoje dependem de Mercado Livre, Shein e TikTok. Produto próprio e marca conhecida na região é a parte difícil, e vocês já têm as duas.

Nós somos uma agência especializada em e-commerce de moda. A gente pega poucas operações por vez, porque acompanha todo mês depois do lançamento, e não só entrega a loja e some. Enxergo um potencial grande em Vanetex para vender online, por isso o contato.

Se você tiver 15 minutos, eu comparo quanto sobra de margem vendendo no marketplace e vendendo na loja própria, com os números do seu segmento.

Então, você tem interesse? Podemos marcar?'),
  ('L027', 'Oi{dono}, tudo bem?

Me chamo Angelo e cheguei até você pelo Instagram de Lua da Moda Confecções.

Primeiro queria dizer o que me chamou atenção: vocês têm confecção própria em Blumenau. Produto próprio e marca conhecida na região é a parte difícil, e vocês já têm as duas.

Nós somos uma agência especializada em e-commerce de moda. A gente pega poucas operações por vez, porque acompanha todo mês depois do lançamento, e não só entrega a loja e some. Enxergo um potencial grande em Lua da Moda Confecções para vender online, por isso o contato.

Se você tiver 15 minutos, eu te mostro quanto o seu segmento já vende online e como ficaria a loja de vocês.

Então, você tem interesse? Podemos marcar?'),
  ('L028', 'Oi{dono}, tudo bem?

Me chamo Angelo e cheguei até você pelo Instagram de AltSide.

Primeiro queria dizer o que me chamou atenção: vocês estão começando uma marca fitness com fabricação própria. Produto próprio e marca conhecida na região é a parte difícil, e vocês já têm as duas.

Nós somos uma agência especializada em e-commerce de moda. A gente pega poucas operações por vez, porque acompanha todo mês depois do lançamento, e não só entrega a loja e some. Enxergo um potencial grande em AltSide para vender online, por isso o contato.

Se você tiver 15 minutos, eu analiso a loja que vocês já têm e aponto onde ela está perdendo venda, do anúncio até o checkout.

Então, você tem interesse? Podemos marcar?'),
  ('L029', 'Oi{dono}, tudo bem?

Me chamo Angelo e cheguei até você pelo Instagram de Kunsler.

Primeiro queria dizer o que me chamou atenção: vocês fabricam moda íntima do infantil ao adulto. Produto próprio e marca conhecida na região é a parte difícil, e vocês já têm as duas.

Nós somos uma agência especializada em e-commerce de moda. A gente pega poucas operações por vez, porque acompanha todo mês depois do lançamento, e não só entrega a loja e some. Enxergo um potencial grande em Kunsler para vender online, por isso o contato.

Se você tiver 15 minutos, eu analiso a loja que vocês já têm e aponto onde ela está perdendo venda, do anúncio até o checkout.

Então, você tem interesse? Podemos marcar?'),
  ('L030', 'Oi{dono}, tudo bem?

Me chamo Angelo e cheguei até você pelo Instagram de Maria Guilhermina.

Primeiro queria dizer o que me chamou atenção: vocês têm confecção própria de moda feminina. Produto próprio e marca conhecida na região é a parte difícil, e vocês já têm as duas.

Nós somos uma agência especializada em e-commerce de moda. A gente pega poucas operações por vez, porque acompanha todo mês depois do lançamento, e não só entrega a loja e some. Enxergo um potencial grande em Maria Guilhermina para vender online, por isso o contato.

Se você tiver 15 minutos, eu te mostro quanto o seu segmento já vende online e como ficaria a loja de vocês.

Então, você tem interesse? Podemos marcar?'),
  ('L031', 'Oi{dono}, tudo bem?

Me chamo Angelo e cheguei até você pelo Instagram de Outlet Arte D''Vestir.

Primeiro queria dizer o que me chamou atenção: vocês vendem direto da fábrica no varejo. Produto próprio e marca conhecida na região é a parte difícil, e vocês já têm as duas.

Nós somos uma agência especializada em e-commerce de moda. A gente pega poucas operações por vez, porque acompanha todo mês depois do lançamento, e não só entrega a loja e some. Enxergo um potencial grande em Outlet Arte D''Vestir para vender online, por isso o contato.

Se você tiver 15 minutos, eu te mostro quanto o seu segmento já vende online e como ficaria a loja de vocês.

Então, você tem interesse? Podemos marcar?'),
  ('L032', 'Oi{dono}, tudo bem?

Me chamo Angelo e cheguei até você pelo Instagram de Rio Açu.

Primeiro queria dizer o que me chamou atenção: vocês fabricam moda praia e lingerie desde 1991. Produto próprio e marca conhecida na região é a parte difícil, e vocês já têm as duas.

Nós somos uma agência especializada em e-commerce de moda. A gente pega poucas operações por vez, porque acompanha todo mês depois do lançamento, e não só entrega a loja e some. Enxergo um potencial grande em Rio Açu para vender online, por isso o contato.

Se você tiver 15 minutos, eu analiso a loja que vocês já têm e aponto onde ela está perdendo venda, do anúncio até o checkout.

Então, você tem interesse? Podemos marcar?'),
  ('L033', 'Oi{dono}, tudo bem?

Me chamo Angelo e cheguei até você pelo Instagram de Ilhas Rio.

Primeiro queria dizer o que me chamou atenção: vocês têm 36 anos de moda praia em Ilhota. Produto próprio e marca conhecida na região é a parte difícil, e vocês já têm as duas.

Nós somos uma agência especializada em e-commerce de moda. A gente pega poucas operações por vez, porque acompanha todo mês depois do lançamento, e não só entrega a loja e some. Enxergo um potencial grande em Ilhas Rio para vender online, por isso o contato.

Se você tiver 15 minutos, eu analiso a loja que vocês já têm e aponto onde ela está perdendo venda, do anúncio até o checkout.

Então, você tem interesse? Podemos marcar?'),
  ('L034', 'Oi{dono}, tudo bem?

Me chamo Angelo e cheguei até você pelo Instagram de KSI.

Primeiro queria dizer o que me chamou atenção: vocês produzem fitness, lingerie e pijamas desde 2005. Produto próprio e marca conhecida na região é a parte difícil, e vocês já têm as duas.

Nós somos uma agência especializada em e-commerce de moda. A gente pega poucas operações por vez, porque acompanha todo mês depois do lançamento, e não só entrega a loja e some. Enxergo um potencial grande em KSI para vender online, por isso o contato.

Se você tiver 15 minutos, eu analiso a loja que vocês já têm e aponto onde ela está perdendo venda, do anúncio até o checkout.

Então, você tem interesse? Podemos marcar?'),
  ('L035', 'Oi{dono}, tudo bem?

Me chamo Angelo e cheguei até você pelo Instagram de Julemar Moda Íntima.

Primeiro queria dizer o que me chamou atenção: vocês fabricam moda íntima e já exportam. Produto próprio e marca conhecida na região é a parte difícil, e vocês já têm as duas.

Nós somos uma agência especializada em e-commerce de moda. A gente pega poucas operações por vez, porque acompanha todo mês depois do lançamento, e não só entrega a loja e some. Enxergo um potencial grande em Julemar Moda Íntima para vender online, por isso o contato.

Se você tiver 15 minutos, eu te mostro quanto o seu segmento já vende online e como ficaria a loja de vocês.

Então, você tem interesse? Podemos marcar?'),
  ('L036', 'Oi{dono}, tudo bem?

Me chamo Angelo e cheguei até você pelo Instagram de HP Moda Íntima.

Primeiro queria dizer o que me chamou atenção: vocês já têm site para atacadista mas não para o consumidor final. Produto próprio e marca conhecida na região é a parte difícil, e vocês já têm as duas.

Nós somos uma agência especializada em e-commerce de moda. A gente pega poucas operações por vez, porque acompanha todo mês depois do lançamento, e não só entrega a loja e some. Enxergo um potencial grande em HP Moda Íntima para vender online, por isso o contato.

Se você tiver 15 minutos, eu analiso a loja que vocês já têm e aponto onde ela está perdendo venda, do anúncio até o checkout.

Então, você tem interesse? Podemos marcar?'),
  ('L037', 'Oi{dono}, tudo bem?

Me chamo Angelo e cheguei até você pelo Instagram de Dukali.

Primeiro queria dizer o que me chamou atenção: vocês fabricam moda íntima e vendem pelo WhatsApp. Produto próprio e marca conhecida na região é a parte difícil, e vocês já têm as duas.

Nós somos uma agência especializada em e-commerce de moda. A gente pega poucas operações por vez, porque acompanha todo mês depois do lançamento, e não só entrega a loja e some. Enxergo um potencial grande em Dukali para vender online, por isso o contato.

Se você tiver 15 minutos, eu te mostro quanto o seu segmento já vende online e como ficaria a loja de vocês.

Então, você tem interesse? Podemos marcar?'),
  ('L038', 'Oi{dono}, tudo bem?

Me chamo Angelo e cheguei até você pelo Instagram de Diara.

Primeiro queria dizer o que me chamou atenção: vocês estão desde 1997 com lojas em Ilhota e Brusque. Produto próprio e marca conhecida na região é a parte difícil, e vocês já têm as duas.

Nós somos uma agência especializada em e-commerce de moda. A gente pega poucas operações por vez, porque acompanha todo mês depois do lançamento, e não só entrega a loja e some. Enxergo um potencial grande em Diara para vender online, por isso o contato.

Se você tiver 15 minutos, eu analiso a loja que vocês já têm e aponto onde ela está perdendo venda, do anúncio até o checkout.

Então, você tem interesse? Podemos marcar?'),
  ('L039', 'Oi{dono}, tudo bem?

Me chamo Angelo e cheguei até você pelo Instagram de Atacadão da Moda Íntima (Two).

Primeiro queria dizer o que me chamou atenção: vocês atendem atacado e varejo de moda íntima. Produto próprio e marca conhecida na região é a parte difícil, e vocês já têm as duas.

Nós somos uma agência especializada em e-commerce de moda. A gente pega poucas operações por vez, porque acompanha todo mês depois do lançamento, e não só entrega a loja e some. Enxergo um potencial grande em Atacadão da Moda Íntima (Two) para vender online, por isso o contato.

Se você tiver 15 minutos, eu analiso a loja que vocês já têm e aponto onde ela está perdendo venda, do anúncio até o checkout.

Então, você tem interesse? Podemos marcar?'),
  ('L040', 'Oi{dono}, tudo bem?

Me chamo Angelo e cheguei até você pelo Instagram de Pamella Nattacha.

Primeiro queria dizer o que me chamou atenção: vocês têm confecção própria com showroom de atacado. Produto próprio e marca conhecida na região é a parte difícil, e vocês já têm as duas.

Nós somos uma agência especializada em e-commerce de moda. A gente pega poucas operações por vez, porque acompanha todo mês depois do lançamento, e não só entrega a loja e some. Enxergo um potencial grande em Pamella Nattacha para vender online, por isso o contato.

Se você tiver 15 minutos, eu te mostro como fábricas do porte de vocês estão vendendo direto ao consumidor sem brigar com o próprio lojista.

Então, você tem interesse? Podemos marcar?'),
  ('L041', 'Oi{dono}, tudo bem?

Me chamo Angelo e cheguei até você pelo Instagram de Camboriú.

Primeiro queria dizer o que me chamou atenção: vocês estão desde 1995 no fitness e na moda praia. Produto próprio e marca conhecida na região é a parte difícil, e vocês já têm as duas.

Nós somos uma agência especializada em e-commerce de moda. A gente pega poucas operações por vez, porque acompanha todo mês depois do lançamento, e não só entrega a loja e some. Enxergo um potencial grande em Camboriú para vender online, por isso o contato.

Se você tiver 15 minutos, eu analiso a loja que vocês já têm e aponto onde ela está perdendo venda, do anúncio até o checkout.

Então, você tem interesse? Podemos marcar?'),
  ('L042', 'Oi{dono}, tudo bem?

Me chamo Angelo e cheguei até você pelo Instagram de Divina Forma Fitness.

Primeiro queria dizer o que me chamou atenção: vocês fabricam fitness e enviam para o Brasil e exterior. Produto próprio e marca conhecida na região é a parte difícil, e vocês já têm as duas.

Nós somos uma agência especializada em e-commerce de moda. A gente pega poucas operações por vez, porque acompanha todo mês depois do lançamento, e não só entrega a loja e some. Enxergo um potencial grande em Divina Forma Fitness para vender online, por isso o contato.

Se você tiver 15 minutos, eu analiso a loja que vocês já têm e aponto onde ela está perdendo venda, do anúncio até o checkout.

Então, você tem interesse? Podemos marcar?'),
  ('L043', 'Oi{dono}, tudo bem?

Me chamo Angelo e cheguei até você pelo Instagram de Robsur.

Primeiro queria dizer o que me chamou atenção: vocês têm confecção própria desde 1991 e 3 lojas em Joinville. Produto próprio e marca conhecida na região é a parte difícil, e vocês já têm as duas.

Nós somos uma agência especializada em e-commerce de moda. A gente pega poucas operações por vez, porque acompanha todo mês depois do lançamento, e não só entrega a loja e some. Enxergo um potencial grande em Robsur para vender online, por isso o contato.

Se você tiver 15 minutos, eu te mostro quanto o seu segmento já vende online e como ficaria a loja de vocês.

Então, você tem interesse? Podemos marcar?'),
  ('L044', 'Oi{dono}, tudo bem?

Me chamo Angelo e cheguei até você pelo Instagram de Dalbelli Confecções.

Primeiro queria dizer o que me chamou atenção: vocês têm produção própria há mais de 30 anos. Produto próprio e marca conhecida na região é a parte difícil, e vocês já têm as duas.

Nós somos uma agência especializada em e-commerce de moda. A gente pega poucas operações por vez, porque acompanha todo mês depois do lançamento, e não só entrega a loja e some. Enxergo um potencial grande em Dalbelli Confecções para vender online, por isso o contato.

Se você tiver 15 minutos, eu te mostro quanto o seu segmento já vende online e como ficaria a loja de vocês.

Então, você tem interesse? Podemos marcar?'),
  ('L045', 'Oi{dono}, tudo bem?

Me chamo Angelo e cheguei até você pelo Instagram de Ana Jullian Calçados.

Primeiro queria dizer o que me chamou atenção: vocês fabricam calçados no polo de São João Batista. Produto próprio e marca conhecida na região é a parte difícil, e vocês já têm as duas.

Nós somos uma agência especializada em e-commerce de moda. A gente pega poucas operações por vez, porque acompanha todo mês depois do lançamento, e não só entrega a loja e some. Enxergo um potencial grande em Ana Jullian Calçados para vender online, por isso o contato.

Se você tiver 15 minutos, eu te mostro quanto o seu segmento já vende online e como ficaria a loja de vocês.

Então, você tem interesse? Podemos marcar?'),
  ('L046', 'Oi{dono}, tudo bem?

Me chamo Angelo e cheguei até você pelo Instagram de Rocksham Jeans.

Primeiro queria dizer o que me chamou atenção: vocês fabricam jeans e têm 4 lojas. Produto próprio e marca conhecida na região é a parte difícil, e vocês já têm as duas.

Nós somos uma agência especializada em e-commerce de moda. A gente pega poucas operações por vez, porque acompanha todo mês depois do lançamento, e não só entrega a loja e some. Enxergo um potencial grande em Rocksham Jeans para vender online, por isso o contato.

Se você tiver 15 minutos, eu analiso a loja que vocês já têm e aponto onde ela está perdendo venda, do anúncio até o checkout.

Então, você tem interesse? Podemos marcar?'),
  ('L047', 'Oi{dono}, tudo bem?

Me chamo Angelo e cheguei até você pelo Instagram de Priori.

Primeiro queria dizer o que me chamou atenção: vocês têm fabricação própria e 6 lojas físicas. Produto próprio e marca conhecida na região é a parte difícil, e vocês já têm as duas.

Nós somos uma agência especializada em e-commerce de moda. A gente pega poucas operações por vez, porque acompanha todo mês depois do lançamento, e não só entrega a loja e some. Enxergo um potencial grande em Priori para vender online, por isso o contato.

Se você tiver 15 minutos, eu analiso a loja que vocês já têm e aponto onde ela está perdendo venda, do anúncio até o checkout.

Então, você tem interesse? Podemos marcar?'),
  ('L048', 'Oi{dono}, tudo bem?

Me chamo Angelo e cheguei até você pelo Instagram de Talinda.

Primeiro queria dizer o que me chamou atenção: vocês vendem do P ao G4 pelo WhatsApp com 4 lojas. Produto próprio e marca conhecida na região é a parte difícil, e vocês já têm as duas.

Nós somos uma agência especializada em e-commerce de moda. A gente pega poucas operações por vez, porque acompanha todo mês depois do lançamento, e não só entrega a loja e some. Enxergo um potencial grande em Talinda para vender online, por isso o contato.

Se você tiver 15 minutos, eu te mostro quanto o seu segmento já vende online e como ficaria a loja de vocês.

Então, você tem interesse? Podemos marcar?'),
  ('L049', 'Oi{dono}, tudo bem?

Me chamo Angelo e cheguei até você pelo Instagram de Atacado de Brusque.

Primeiro queria dizer o que me chamou atenção: vocês lançam coleção toda semana. Produto próprio e marca conhecida na região é a parte difícil, e vocês já têm as duas.

Nós somos uma agência especializada em e-commerce de moda. A gente pega poucas operações por vez, porque acompanha todo mês depois do lançamento, e não só entrega a loja e some. Enxergo um potencial grande em Atacado de Brusque para vender online, por isso o contato.

Se você tiver 15 minutos, eu analiso a loja que vocês já têm e aponto onde ela está perdendo venda, do anúncio até o checkout.

Então, você tem interesse? Podemos marcar?'),
  ('L050', 'Oi{dono}, tudo bem?

Me chamo Angelo e cheguei até você pelo Instagram de Miss Glamour.

Primeiro queria dizer o que me chamou atenção: vocês estão há 15 anos no atacado feminino no Catarina Shopping. Produto próprio e marca conhecida na região é a parte difícil, e vocês já têm as duas.

Nós somos uma agência especializada em e-commerce de moda. A gente pega poucas operações por vez, porque acompanha todo mês depois do lançamento, e não só entrega a loja e some. Enxergo um potencial grande em Miss Glamour para vender online, por isso o contato.

Se você tiver 15 minutos, eu te mostro como fábricas do porte de vocês estão vendendo direto ao consumidor sem brigar com o próprio lojista.

Então, você tem interesse? Podemos marcar?'))
update prospeccao p
   set mensagem_abertura = nova.mensagem
  from nova
 where p.codigo = nova.codigo
   and p.mensagem_abertura is distinct from nova.mensagem;
