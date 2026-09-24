-- =====================================================================
-- 0034 - Cinco mensagens, e o número de seguidores sai do texto.
--
-- DE ONDE VEIO, DE NOVO: DA CONVERSA REAL
--
-- Na abordagem à Dukali, a terceira mensagem foi partida em duas na
-- hora de enviar. E fazia sentido: a credencial e a oferta são duas
-- afirmações diferentes, e juntas viravam o bloco mais pesado da
-- sequência. Separadas, a credencial fica sozinha, que é onde ela
-- trabalha melhor.
--
--   1  a saudação
--   2  quem é, por que achou a pessoa, e o que viu da marca
--   3  a credencial, sozinha
--   4  o que a Psy monta
--   5  o convite
--
-- Nenhuma parte passa de 42 palavras.
--
-- O NÚMERO DE SEGUIDORES SAI DO GRAVADO
--
-- Quem envia confere no perfil na hora e encaixa o elogio com o número
-- certo. E é melhor assim por um motivo que não é só preferência:
-- contagem de seguidor envelhece entre o levantamento e a mensagem, e
-- errar o número de alguém na frase em que se está elogiando essa
-- pessoa é pior do que não citar.
--
-- Doze ganchos citavam seguidores. Nenhum virou elogio genérico no
-- lugar: todos passaram a dizer outro fato da mesma pesquisa, porque o
-- gancho existe para provar que alguém olhou aquele perfil, e "parabéns
-- pelo trabalho" não prova nada.
--
--   L006  audiência enorme no plus size  -> fabricação própria no plus size
--   L008  120 mil seguidores             -> loja de fábrica de tricot em Brusque
--   L012  150 mil seguidores             -> fabricantes de moda infantil
--   L018  120 mil seguidores             -> coleções exclusivas no atacado infantil
--   L024  64 mil seguidores              -> confecção própria no atacado infantil
--   L030  35 mil seguidores              -> confecção própria de moda feminina
--   L031  37 mil seguidores              -> vendem direto da fábrica no varejo
--   L035  100 mil seguidores             -> fabricam moda íntima e já exportam
--   L037  117 mil seguidores             -> fabricam moda íntima e vendem pelo WhatsApp
--   L041  160 mil seguidores             -> desde 1995 no fitness e na moda praia
--   L046  68 mil seguidores              -> fabricam jeans e têm 4 lojas
--   L049  100 mil seguidores             -> lançam coleção toda semana
--
-- O número continua em `prospeccao.seguidores`, que é onde ele serve:
-- ordenar a lista por alcance. Ele só não entra mais no texto.
-- =====================================================================

with nova(codigo, mensagem) as (values
  ('L001', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de Reiwiu Confecções. Vi que vocês têm fabricação própria há mais de 26 anos e 3 lojas em Brusque.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano.

Montamos a loja de atacado, a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L002', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de Peka''s Jeans. Vi que vocês estão há 26 anos no jeans com loja de fábrica em Brusque.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano.

Montamos a loja de atacado, a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L003', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de YouMen. Vi que vocês fabricam básicos masculinos e atendem atacado e varejo na FIP.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano.

Montamos a loja de atacado, a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L004', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de Diamond Atacado. Vi que vocês têm fabricação própria e hoje vendem pelo direct.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano.

Montamos a loja de atacado, a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L005', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de Fábrica de Camisetas Brusque. Vi que vocês fabricam camisetas e já enviam para todo o Brasil pelo WhatsApp.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano.

Montamos a loja de atacado, a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L006', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de Mulher Única. Vi que vocês têm fabricação própria no plus size.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano.

Montamos a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L007', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de Ana Gonçalves Tricot. Vi que vocês trabalham com tricot desde 1980.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano.

Montamos a loja de atacado e a de varejo, com pedido mínimo e tabela por CNPJ, e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L008', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de Atacadão das Malhas. Vi que vocês têm loja de fábrica de tricot em Brusque.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano.

Montamos a loja de atacado e a de varejo, com pedido mínimo e tabela por CNPJ, e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L009', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de La Miller Tricot. Vi que vocês fabricam tricot no All Shopping com envio imediato.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano.

Montamos a loja de atacado e a de varejo, com pedido mínimo e tabela por CNPJ, e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L010', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de Vida Fit. Vi que vocês fabricam fitness e vendem 100% no atacado.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano.

Montamos a loja de atacado e a de varejo, com pedido mínimo e tabela por CNPJ, e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L011', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de De Pijama Brusque. Vi que vocês fabricam pijamas e já vendem online.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano.

Montamos a loja de atacado, a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L012', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de Leleco Peteleco. Vi que vocês são fabricantes de moda infantil e atendem pelo WhatsApp.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano.

Montamos a loja de atacado e a de varejo, com pedido mínimo e tabela por CNPJ, e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L013', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de Pega Mania. Vi que vocês produzem infantil e estão na maioria dos estados.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano.

Refazemos a loja de atacado e a de varejo, com pedido mínimo e tabela por CNPJ, e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L014', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de Iduna Fitness. Vi que vocês têm loja de fábrica fitness vendendo para todo o Brasil.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano.

Refazemos a loja de atacado, a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L015', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de Brulini Moda Íntima. Vi que vocês produzem moda íntima direto da fábrica.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano.

Montamos a loja de atacado, a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L016', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de Summer Girl. Vi que vocês têm mais de 20 anos no atacado e selo ABVTEX.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano.

Montamos a loja de atacado e a de varejo, com pedido mínimo e tabela por CNPJ, e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L017', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de Xá Plus. Vi que vocês atendem lojistas de plus size no Master Shopping.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano.

Montamos a loja de atacado e a de varejo, com pedido mínimo e tabela por CNPJ, e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L018', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de Alekids. Vi que vocês têm coleções exclusivas no atacado infantil.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano.

Montamos a loja de atacado e a de varejo, com pedido mínimo e tabela por CNPJ, e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L019', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de Lunedi. Vi que vocês atendem lojistas do P ao 16 direto de Gaspar.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano.

Montamos a loja de atacado e a de varejo, com pedido mínimo e tabela por CNPJ, e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L020', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de Rollu. Vi que vocês são uma indústria com 36 anos no infantil.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano.

Montamos a loja de atacado e a de varejo, com pedido mínimo e tabela por CNPJ, e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L021', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de TMX Kids & Teens. Vi que vocês vendem bebê a juvenil no atacado e hoje o pedido é por e-mail.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano.

Montamos a loja de atacado e a de varejo, com pedido mínimo e tabela por CNPJ, e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L022', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de Jidi Kids. Vi que vocês têm confecção infantil própria em Gaspar.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano.

Montamos a loja de atacado e a de varejo, com pedido mínimo e tabela por CNPJ, e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L023', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de Serelepe Kids. Vi que vocês fabricam infantil em Gaspar desde 2003.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano.

Montamos a loja de atacado e a de varejo, com pedido mínimo e tabela por CNPJ, e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L024', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de PHO Kids. Vi que vocês têm confecção própria no atacado infantil.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano.

Refazemos a loja de atacado e a de varejo, com pedido mínimo e tabela por CNPJ, e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L025', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de DHC Atacado Infantil. Vi que vocês atendem atacado infantil em Gaspar.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano.

Montamos a loja de atacado e a de varejo, com pedido mínimo e tabela por CNPJ, e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L026', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de Vanetex. Vi que vocês fabricam infantil e hoje dependem de Mercado Livre, Shein e TikTok.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano.

Montamos a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L027', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de Lua da Moda Confecções. Vi que vocês têm confecção própria em Blumenau.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano.

Montamos a loja de atacado, a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L028', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de AltSide. Vi que vocês estão começando uma marca fitness com fabricação própria.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano.

Montamos a loja de atacado, a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L029', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de Kunsler. Vi que vocês fabricam moda íntima do infantil ao adulto.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano.

Refazemos a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L030', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de Maria Guilhermina. Vi que vocês têm confecção própria de moda feminina.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano.

Montamos a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L031', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de Outlet Arte D''Vestir. Vi que vocês vendem direto da fábrica no varejo.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano.

Montamos a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L032', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de Rio Açu. Vi que vocês fabricam moda praia e lingerie desde 1991.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano.

Refazemos a loja de atacado, a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L033', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de Ilhas Rio. Vi que vocês têm 36 anos de moda praia em Ilhota.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano.

Refazemos a loja de atacado, a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L034', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de KSI. Vi que vocês produzem fitness, lingerie e pijamas desde 2005.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano.

Refazemos a loja de atacado, a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L035', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de Julemar Moda Íntima. Vi que vocês fabricam moda íntima e já exportam.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano.

Montamos a loja de atacado, a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L036', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de HP Moda Íntima. Vi que vocês já têm site para atacadista mas não para o consumidor final.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano.

Montamos o que falta: a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L037', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de Dukali. Vi que vocês fabricam moda íntima e vendem pelo WhatsApp.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano.

Montamos a loja de atacado, a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L038', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de Diara. Vi que vocês estão desde 1997 com lojas em Ilhota e Brusque.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano.

Refazemos a loja de atacado, a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L039', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de Atacadão da Moda Íntima (Two). Vi que vocês atendem atacado e varejo de moda íntima.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano.

Refazemos a loja de atacado, a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L040', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de Pamella Nattacha. Vi que vocês têm confecção própria com showroom de atacado.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano.

Montamos a loja de atacado e a de varejo, com pedido mínimo e tabela por CNPJ, e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L041', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de Camboriú. Vi que vocês estão desde 1995 no fitness e na moda praia.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano.

Refazemos a loja de atacado, a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L042', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de Divina Forma Fitness. Vi que vocês fabricam fitness e enviam para o Brasil e exterior.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano.

Refazemos a loja de atacado, a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L043', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de Robsur. Vi que vocês têm confecção própria desde 1991 e 3 lojas em Joinville.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano.

Montamos a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L044', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de Dalbelli Confecções. Vi que vocês têm produção própria há mais de 30 anos.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano.

Montamos a loja de atacado, a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L045', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de Ana Jullian Calçados. Vi que vocês fabricam calçados no polo de São João Batista.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano.

Montamos a loja de atacado, a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L046', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de Rocksham Jeans. Vi que vocês fabricam jeans e têm 4 lojas.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano.

Refazemos a loja de atacado, a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L047', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de Priori. Vi que vocês têm fabricação própria e 6 lojas físicas.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano.

Refazemos a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L048', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de Talinda. Vi que vocês vendem do P ao G4 pelo WhatsApp com 4 lojas.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano.

Montamos a loja de atacado, a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L049', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de Atacado de Brusque. Vi que vocês lançam coleção toda semana.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano.

Refazemos a loja de atacado, a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L050', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de Miss Glamour. Vi que vocês estão há 15 anos no atacado feminino no Catarina Shopping.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano.

Montamos a loja de atacado e a de varejo, com pedido mínimo e tabela por CNPJ, e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'))
update prospeccao p
   set mensagem_abertura = nova.mensagem
  from nova
 where p.codigo = nova.codigo
   and p.mensagem_abertura is distinct from nova.mensagem;
