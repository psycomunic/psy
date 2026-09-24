-- =====================================================================
-- 0033 - A abertura passa a vir quebrada nas mensagens que são enviadas.
--
-- DE ONDE VEIO A MUDANÇA
--
-- Da conversa real com a Alekids. O texto saía do painel como um
-- parágrafo só e era recortado à mão antes de colar, em quatro
-- mensagens: a saudação, quem é e por que achou a pessoa, a prova, e o
-- convite. No direct é assim que funciona: cem palavras num bloco só
-- chegam como algo que a pessoa precisa decidir se lê; quatro
-- mensagens curtas chegam como alguém falando.
--
-- O painel passa a entregar recortado, com um botão de copiar por
-- parte. Nenhuma parte passa de 55 palavras.
--
-- A LINHA EM BRANCO É O SEPARADOR
--
-- E não uma coluna de lista nem um caractere inventado.
-- `mensagem_abertura` continua sendo UM campo, legível e editável por
-- SQL do jeito que sempre foi. Quem não tem linha em branco, como a
-- pergunta de seguimento, volta como uma parte só.
--
-- DUAS PALAVRAS QUE VIERAM DA CONVERSA, E NÃO DAQUI
--
--   "A gente monta"                -> "Montamos"
--   "o que dá para melhorar"       -> "como poderíamos te ajudar"
--
-- Foram as duas edições feitas na hora de enviar. Quem está mandando
-- sabe como soa melhor no direct, e o texto gravado acompanha em vez de
-- obrigar a mesma correção cinquenta vezes.
--
-- E O ATACADO DEIXA DE SER EXCLUSIVO
--
-- Pelo mesmo motivo. A 0028 dizia que quem só vende no atacado não
-- devia ouvir oferta de varejo, porque "loja de varejo não resolve o
-- problema dela". Na hora de mandar virou "atacado/varejo": a fábrica
-- que vende só no atacado hoje é justamente quem pode querer começar a
-- vender direto. A tabela por CNPJ continua ali, que é a parte que só
-- faz sentido para quem atende lojista.
--
-- Nenhuma coluna muda. `{dono}` continua sendo trocado na hora de
-- copiar, por `src/lib/dominio/abordagem.ts`.
-- =====================================================================

with nova(codigo, mensagem) as (values
  ('L001', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de Reiwiu Confecções. Vi que vocês têm fabricação própria há mais de 26 anos e 3 lojas em Brusque.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano. Montamos a loja de atacado, a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L002', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de Peka''s Jeans. Vi que vocês estão há 26 anos no jeans com loja de fábrica em Brusque.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano. Montamos a loja de atacado, a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L003', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de YouMen. Vi que vocês fabricam básicos masculinos e atendem atacado e varejo na FIP.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano. Montamos a loja de atacado, a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L004', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de Diamond Atacado. Vi que vocês têm fabricação própria e hoje vendem pelo direct.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano. Montamos a loja de atacado, a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L005', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de Fábrica de Camisetas Brusque. Vi que vocês fabricam camisetas e já enviam para todo o Brasil pelo WhatsApp.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano. Montamos a loja de atacado, a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L006', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de Mulher Única. Vi que vocês têm uma audiência enorme no plus size com fabricação própria.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano. Montamos a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L007', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de Ana Gonçalves Tricot. Vi que vocês trabalham com tricot desde 1980.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano. Montamos a loja de atacado e a de varejo, com pedido mínimo e tabela por CNPJ, e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L008', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de Atacadão das Malhas. Vi que vocês têm mais de 120 mil seguidores e loja de fábrica de tricot.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano. Montamos a loja de atacado e a de varejo, com pedido mínimo e tabela por CNPJ, e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L009', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de La Miller Tricot. Vi que vocês fabricam tricot no All Shopping com envio imediato.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano. Montamos a loja de atacado e a de varejo, com pedido mínimo e tabela por CNPJ, e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L010', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de Vida Fit. Vi que vocês fabricam fitness e vendem 100% no atacado.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano. Montamos a loja de atacado e a de varejo, com pedido mínimo e tabela por CNPJ, e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L011', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de De Pijama Brusque. Vi que vocês fabricam pijamas e já vendem online.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano. Montamos a loja de atacado, a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L012', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de Leleco Peteleco. Vi que vocês são fabricantes infantis com mais de 150 mil seguidores atendendo pelo WhatsApp.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano. Montamos a loja de atacado e a de varejo, com pedido mínimo e tabela por CNPJ, e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L013', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de Pega Mania. Vi que vocês produzem infantil e estão na maioria dos estados.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano. Refazemos a loja de atacado e a de varejo, com pedido mínimo e tabela por CNPJ, e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L014', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de Iduna Fitness. Vi que vocês têm loja de fábrica fitness vendendo para todo o Brasil.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano. Refazemos a loja de atacado, a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L015', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de Brulini Moda Íntima. Vi que vocês produzem moda íntima direto da fábrica.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano. Montamos a loja de atacado, a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L016', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de Summer Girl. Vi que vocês têm mais de 20 anos no atacado e selo ABVTEX.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano. Montamos a loja de atacado e a de varejo, com pedido mínimo e tabela por CNPJ, e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L017', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de Xá Plus. Vi que vocês atendem lojistas de plus size no Master Shopping.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano. Montamos a loja de atacado e a de varejo, com pedido mínimo e tabela por CNPJ, e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L018', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de Alekids. Vi que vocês têm quase 120 mil seguidores e coleções exclusivas no atacado.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano. Montamos a loja de atacado e a de varejo, com pedido mínimo e tabela por CNPJ, e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L019', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de Lunedi. Vi que vocês atendem lojistas do P ao 16 direto de Gaspar.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano. Montamos a loja de atacado e a de varejo, com pedido mínimo e tabela por CNPJ, e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L020', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de Rollu. Vi que vocês são uma indústria com 36 anos no infantil.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano. Montamos a loja de atacado e a de varejo, com pedido mínimo e tabela por CNPJ, e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L021', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de TMX Kids & Teens. Vi que vocês vendem bebê a juvenil no atacado e hoje o pedido é por e-mail.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano. Montamos a loja de atacado e a de varejo, com pedido mínimo e tabela por CNPJ, e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L022', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de Jidi Kids. Vi que vocês têm confecção infantil própria em Gaspar.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano. Montamos a loja de atacado e a de varejo, com pedido mínimo e tabela por CNPJ, e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L023', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de Serelepe Kids. Vi que vocês fabricam infantil em Gaspar desde 2003.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano. Montamos a loja de atacado e a de varejo, com pedido mínimo e tabela por CNPJ, e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L024', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de PHO Kids. Vi que vocês têm confecção própria e 64 mil seguidores no atacado infantil.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano. Refazemos a loja de atacado e a de varejo, com pedido mínimo e tabela por CNPJ, e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L025', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de DHC Atacado Infantil. Vi que vocês atendem atacado infantil em Gaspar.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano. Montamos a loja de atacado e a de varejo, com pedido mínimo e tabela por CNPJ, e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L026', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de Vanetex. Vi que vocês fabricam infantil e hoje dependem de Mercado Livre, Shein e TikTok.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano. Montamos a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L027', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de Lua da Moda Confecções. Vi que vocês têm confecção própria em Blumenau.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano. Montamos a loja de atacado, a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L028', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de AltSide. Vi que vocês estão começando uma marca fitness com fabricação própria.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano. Montamos a loja de atacado, a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L029', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de Kunsler. Vi que vocês fabricam moda íntima do infantil ao adulto.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano. Refazemos a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L030', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de Maria Guilhermina. Vi que vocês têm confecção própria e 35 mil seguidores.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano. Montamos a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L031', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de Outlet Arte D''Vestir. Vi que vocês vendem direto da fábrica no varejo com 37 mil seguidores.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano. Montamos a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L032', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de Rio Açu. Vi que vocês fabricam moda praia e lingerie desde 1991.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano. Refazemos a loja de atacado, a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L033', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de Ilhas Rio. Vi que vocês têm 36 anos de moda praia em Ilhota.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano. Refazemos a loja de atacado, a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L034', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de KSI. Vi que vocês produzem fitness, lingerie e pijamas desde 2005.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano. Refazemos a loja de atacado, a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L035', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de Julemar Moda Íntima. Vi que vocês têm quase 100 mil seguidores e já exportam.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano. Montamos a loja de atacado, a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L036', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de HP Moda Íntima. Vi que vocês já têm site para atacadista mas não para o consumidor final.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano. Montamos o que falta: a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L037', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de Dukali. Vi que vocês têm mais de 117 mil seguidores e vendem pelo WhatsApp.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano. Montamos a loja de atacado, a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L038', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de Diara. Vi que vocês estão desde 1997 com lojas em Ilhota e Brusque.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano. Refazemos a loja de atacado, a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L039', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de Atacadão da Moda Íntima (Two). Vi que vocês atendem atacado e varejo de moda íntima.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano. Refazemos a loja de atacado, a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L040', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de Pamella Nattacha. Vi que vocês têm confecção própria com showroom de atacado.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano. Montamos a loja de atacado e a de varejo, com pedido mínimo e tabela por CNPJ, e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L041', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de Camboriú. Vi que vocês estão desde 1995 com quase 160 mil seguidores.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano. Refazemos a loja de atacado, a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L042', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de Divina Forma Fitness. Vi que vocês fabricam fitness e enviam para o Brasil e exterior.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano. Refazemos a loja de atacado, a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L043', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de Robsur. Vi que vocês têm confecção própria desde 1991 e 3 lojas em Joinville.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano. Montamos a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L044', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de Dalbelli Confecções. Vi que vocês têm produção própria há mais de 30 anos.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano. Montamos a loja de atacado, a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L045', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de Ana Jullian Calçados. Vi que vocês fabricam calçados no polo de São João Batista.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano. Montamos a loja de atacado, a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L046', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de Rocksham Jeans. Vi que vocês fabricam jeans com 4 lojas e 68 mil seguidores.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano. Refazemos a loja de atacado, a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L047', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de Priori. Vi que vocês têm fabricação própria e 6 lojas físicas.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano. Refazemos a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L048', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de Talinda. Vi que vocês vendem do P ao G4 pelo WhatsApp com 4 lojas.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano. Montamos a loja de atacado, a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L049', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de Atacado de Brusque. Vi que vocês lançam coleção toda semana e têm mais de 100 mil seguidores.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano. Refazemos a loja de atacado, a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'),
  ('L050', 'Oi{dono}, tudo bem?

Aqui é da Psy Comunic, especialistas em criação de marcas de sucesso. Cheguei no seu perfil procurando quem está à frente de Miss Glamour. Vi que vocês estão há 15 anos no atacado feminino no Catarina Shopping.

Não somos agência de mídia: quem conduz a operação foi sócio de um e-commerce de R$ 17 milhões por ano. Montamos a loja de atacado e a de varejo, com pedido mínimo e tabela por CNPJ, e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos tocando todo mês depois do lançamento.

Faz sentido eu fazer um diagnóstico gratuito e te mostrar como poderíamos te ajudar?'))
update prospeccao p
   set mensagem_abertura = nova.mensagem
  from nova
 where p.codigo = nova.codigo
   and p.mensagem_abertura is distinct from nova.mensagem;
