-- =====================================================================
-- 0037 - A abertura para de ser um script de venda.
--
-- O DIAGNÓSTICO NÃO ERAM AS PALAVRAS, ERA A FORMA
--
-- A sequência era: me apresento, dou minha credencial, digo tudo o que
-- a gente faz, peço uma reunião. Esse é o esqueleto de um script
-- comercial, e ele se reconhece mesmo com as palavras trocadas. Foi por
-- isso que trocar "a gente" por "eu" não resolveu: a forma continuava a
-- mesma.
--
-- Ninguém escreve assim para um estranho. Escreve curto, comenta uma
-- coisa que viu, e pergunta.
--
-- A OFERTA SAI DA ABERTURA E VIRA OUTRA MENSAGEM
--
-- `mensagem_oferta` é o que se manda DEPOIS que a pessoa responde. Ali
-- ela deixa de ser pitch e vira resposta, porque alguém perguntou.
--
-- Nada do que estava ali se perdeu: atacado, varejo, aplicativo,
-- marketplaces, ERP e transportadoras continuam escritos, com a mesma
-- variação por modelo de venda. Só mudaram de hora.
--
-- A ABERTURA CAI DE 136 PARA 62 PALAVRAS, e termina em PERGUNTA, que é
-- a única coisa que produz resposta. A pergunta varia com o que a
-- pesquisa já sabe:
--
--   só marketplaces   vendem só por marketplace, ou já têm loja própria?
--   já tem site       a loja fecha venda sozinha, ou o cliente chama alguém?
--   só atacado        vendem só para lojista, ou já pensaram em vender direto?
--   o resto           já vendem online, ou ainda é tudo WhatsApp e direct?
--
-- Perguntar "vocês vendem online?" para quem tem site é o jeito mais
-- rápido de provar que ninguém olhou o perfil.
--
-- E SAI O RESTO DO VOCABULÁRIO DE VENDEDOR
--
-- "Se fizer sentido", "sem compromisso nenhum", "diagnóstico gratuito"
-- na primeira mensagem. Cada uma dessas é uma frase que só aparece em
-- texto que quer vender, e três delas juntas entregam o roteiro antes
-- da segunda linha.
-- =====================================================================

alter table prospeccao add column if not exists mensagem_oferta text;

comment on column prospeccao.mensagem_oferta is
  'O que se manda DEPOIS que a pessoa responde. Fora da abertura de propósito: ali seria pitch, aqui é resposta.';

with nova(codigo, abertura, oferta) as (values
  ('L001', 'Oi{dono}, tudo bem?

Vi Reiwiu Confecções aqui no Instagram e acabei chegando em você. Vocês têm fabricação própria há mais de 26 anos e 3 lojas em Brusque.

Trabalho com e-commerce de moda, já fui sócio de um que fatura R$ 17 milhões por ano, então fico reparando nesse tipo de operação.

Vocês já vendem online, ou ainda é tudo WhatsApp e direct?', 'Hoje faço isso com a Psy Comunic. Montamos a loja de atacado, a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos junto todo mês depois do lançamento.

Quer que eu dê uma olhada na de vocês e te diga o que eu faria?'),
  ('L002', 'Oi{dono}, tudo bem?

Vi Peka''s Jeans aqui no Instagram e acabei chegando em você. Vocês estão há 26 anos no jeans com loja de fábrica em Brusque.

Trabalho com e-commerce de moda, já fui sócio de um que fatura R$ 17 milhões por ano, então fico reparando nesse tipo de operação.

Vocês já vendem online, ou ainda é tudo WhatsApp e direct?', 'Hoje faço isso com a Psy Comunic. Montamos a loja de atacado, a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos junto todo mês depois do lançamento.

Quer que eu dê uma olhada na de vocês e te diga o que eu faria?'),
  ('L003', 'Oi{dono}, tudo bem?

Vi YouMen aqui no Instagram e acabei chegando em você. Vocês fabricam básicos masculinos e atendem atacado e varejo na FIP.

Trabalho com e-commerce de moda, já fui sócio de um que fatura R$ 17 milhões por ano, então fico reparando nesse tipo de operação.

Vocês já vendem online, ou ainda é tudo WhatsApp e direct?', 'Hoje faço isso com a Psy Comunic. Montamos a loja de atacado, a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos junto todo mês depois do lançamento.

Quer que eu dê uma olhada na de vocês e te diga o que eu faria?'),
  ('L004', 'Oi{dono}, tudo bem?

Vi Diamond Atacado aqui no Instagram e acabei chegando em você. Vocês têm fabricação própria e hoje vendem pelo direct.

Trabalho com e-commerce de moda, já fui sócio de um que fatura R$ 17 milhões por ano, então fico reparando nesse tipo de operação.

Vocês já vendem online, ou ainda é tudo WhatsApp e direct?', 'Hoje faço isso com a Psy Comunic. Montamos a loja de atacado, a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos junto todo mês depois do lançamento.

Quer que eu dê uma olhada na de vocês e te diga o que eu faria?'),
  ('L005', 'Oi{dono}, tudo bem?

Vi Fábrica de Camisetas Brusque aqui no Instagram e acabei chegando em você. Vocês fabricam camisetas e já enviam para todo o Brasil pelo WhatsApp.

Trabalho com e-commerce de moda, já fui sócio de um que fatura R$ 17 milhões por ano, então fico reparando nesse tipo de operação.

Vocês já vendem online, ou ainda é tudo WhatsApp e direct?', 'Hoje faço isso com a Psy Comunic. Montamos a loja de atacado, a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos junto todo mês depois do lançamento.

Quer que eu dê uma olhada na de vocês e te diga o que eu faria?'),
  ('L006', 'Oi{dono}, tudo bem?

Vi Mulher Única aqui no Instagram e acabei chegando em você. Vocês têm fabricação própria no plus size.

Trabalho com e-commerce de moda, já fui sócio de um que fatura R$ 17 milhões por ano, então fico reparando nesse tipo de operação.

Vocês já vendem online, ou ainda é tudo WhatsApp e direct?', 'Hoje faço isso com a Psy Comunic. Montamos a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos junto todo mês depois do lançamento.

Quer que eu dê uma olhada na de vocês e te diga o que eu faria?'),
  ('L007', 'Oi{dono}, tudo bem?

Vi Ana Gonçalves Tricot aqui no Instagram e acabei chegando em você. Vocês trabalham com tricot desde 1980.

Trabalho com e-commerce de moda, já fui sócio de um que fatura R$ 17 milhões por ano, então fico reparando nesse tipo de operação.

Vocês vendem só para lojista, ou já pensaram em vender direto para o consumidor também?', 'Hoje faço isso com a Psy Comunic. Montamos a loja de atacado e a de varejo, com pedido mínimo e tabela por CNPJ, e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos junto todo mês depois do lançamento.

Quer que eu dê uma olhada na de vocês e te diga o que eu faria?'),
  ('L008', 'Oi{dono}, tudo bem?

Vi Atacadão das Malhas aqui no Instagram e acabei chegando em você. Vocês têm loja de fábrica de tricot em Brusque.

Trabalho com e-commerce de moda, já fui sócio de um que fatura R$ 17 milhões por ano, então fico reparando nesse tipo de operação.

A loja de vocês fecha venda sozinha hoje, ou o cliente ainda precisa chamar alguém?', 'Hoje faço isso com a Psy Comunic. Montamos a loja de atacado e a de varejo, com pedido mínimo e tabela por CNPJ, e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos junto todo mês depois do lançamento.

Quer que eu dê uma olhada na de vocês e te diga o que eu faria?'),
  ('L009', 'Oi{dono}, tudo bem?

Vi La Miller Tricot aqui no Instagram e acabei chegando em você. Vocês fabricam tricot no All Shopping com envio imediato.

Trabalho com e-commerce de moda, já fui sócio de um que fatura R$ 17 milhões por ano, então fico reparando nesse tipo de operação.

Vocês vendem só para lojista, ou já pensaram em vender direto para o consumidor também?', 'Hoje faço isso com a Psy Comunic. Montamos a loja de atacado e a de varejo, com pedido mínimo e tabela por CNPJ, e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos junto todo mês depois do lançamento.

Quer que eu dê uma olhada na de vocês e te diga o que eu faria?'),
  ('L010', 'Oi{dono}, tudo bem?

Vi Vida Fit aqui no Instagram e acabei chegando em você. Vocês fabricam fitness e vendem 100% no atacado.

Trabalho com e-commerce de moda, já fui sócio de um que fatura R$ 17 milhões por ano, então fico reparando nesse tipo de operação.

Vocês vendem só para lojista, ou já pensaram em vender direto para o consumidor também?', 'Hoje faço isso com a Psy Comunic. Montamos a loja de atacado e a de varejo, com pedido mínimo e tabela por CNPJ, e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos junto todo mês depois do lançamento.

Quer que eu dê uma olhada na de vocês e te diga o que eu faria?'),
  ('L011', 'Oi{dono}, tudo bem?

Vi De Pijama Brusque aqui no Instagram e acabei chegando em você. Vocês fabricam pijamas e já vendem online.

Trabalho com e-commerce de moda, já fui sócio de um que fatura R$ 17 milhões por ano, então fico reparando nesse tipo de operação.

A loja de vocês fecha venda sozinha hoje, ou o cliente ainda precisa chamar alguém?', 'Hoje faço isso com a Psy Comunic. Montamos a loja de atacado, a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos junto todo mês depois do lançamento.

Quer que eu dê uma olhada na de vocês e te diga o que eu faria?'),
  ('L012', 'Oi{dono}, tudo bem?

Vi Leleco Peteleco aqui no Instagram e acabei chegando em você. Vocês são fabricantes de moda infantil e atendem pelo WhatsApp.

Trabalho com e-commerce de moda, já fui sócio de um que fatura R$ 17 milhões por ano, então fico reparando nesse tipo de operação.

Vocês vendem só para lojista, ou já pensaram em vender direto para o consumidor também?', 'Hoje faço isso com a Psy Comunic. Montamos a loja de atacado e a de varejo, com pedido mínimo e tabela por CNPJ, e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos junto todo mês depois do lançamento.

Quer que eu dê uma olhada na de vocês e te diga o que eu faria?'),
  ('L013', 'Oi{dono}, tudo bem?

Vi Pega Mania aqui no Instagram e acabei chegando em você. Vocês produzem infantil e estão na maioria dos estados.

Trabalho com e-commerce de moda, já fui sócio de um que fatura R$ 17 milhões por ano, então fico reparando nesse tipo de operação.

A loja de vocês fecha venda sozinha hoje, ou o cliente ainda precisa chamar alguém?', 'Hoje faço isso com a Psy Comunic. Montamos a loja de atacado e a de varejo, com pedido mínimo e tabela por CNPJ, e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos junto todo mês depois do lançamento.

Quer que eu dê uma olhada na de vocês e te diga o que eu faria?'),
  ('L014', 'Oi{dono}, tudo bem?

Vi Iduna Fitness aqui no Instagram e acabei chegando em você. Vocês têm loja de fábrica fitness vendendo para todo o Brasil.

Trabalho com e-commerce de moda, já fui sócio de um que fatura R$ 17 milhões por ano, então fico reparando nesse tipo de operação.

A loja de vocês fecha venda sozinha hoje, ou o cliente ainda precisa chamar alguém?', 'Hoje faço isso com a Psy Comunic. Montamos a loja de atacado, a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos junto todo mês depois do lançamento.

Quer que eu dê uma olhada na de vocês e te diga o que eu faria?'),
  ('L015', 'Oi{dono}, tudo bem?

Vi Brulini Moda Íntima aqui no Instagram e acabei chegando em você. Vocês produzem moda íntima direto da fábrica.

Trabalho com e-commerce de moda, já fui sócio de um que fatura R$ 17 milhões por ano, então fico reparando nesse tipo de operação.

Vocês já vendem online, ou ainda é tudo WhatsApp e direct?', 'Hoje faço isso com a Psy Comunic. Montamos a loja de atacado, a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos junto todo mês depois do lançamento.

Quer que eu dê uma olhada na de vocês e te diga o que eu faria?'),
  ('L016', 'Oi{dono}, tudo bem?

Vi Summer Girl aqui no Instagram e acabei chegando em você. Vocês têm mais de 20 anos no atacado e selo ABVTEX.

Trabalho com e-commerce de moda, já fui sócio de um que fatura R$ 17 milhões por ano, então fico reparando nesse tipo de operação.

Vocês vendem só para lojista, ou já pensaram em vender direto para o consumidor também?', 'Hoje faço isso com a Psy Comunic. Montamos a loja de atacado e a de varejo, com pedido mínimo e tabela por CNPJ, e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos junto todo mês depois do lançamento.

Quer que eu dê uma olhada na de vocês e te diga o que eu faria?'),
  ('L017', 'Oi{dono}, tudo bem?

Vi Xá Plus aqui no Instagram e acabei chegando em você. Vocês atendem lojistas de plus size no Master Shopping.

Trabalho com e-commerce de moda, já fui sócio de um que fatura R$ 17 milhões por ano, então fico reparando nesse tipo de operação.

Vocês vendem só para lojista, ou já pensaram em vender direto para o consumidor também?', 'Hoje faço isso com a Psy Comunic. Montamos a loja de atacado e a de varejo, com pedido mínimo e tabela por CNPJ, e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos junto todo mês depois do lançamento.

Quer que eu dê uma olhada na de vocês e te diga o que eu faria?'),
  ('L018', 'Oi{dono}, tudo bem?

Vi Alekids aqui no Instagram e acabei chegando em você. Vocês têm coleções exclusivas no atacado infantil.

Trabalho com e-commerce de moda, já fui sócio de um que fatura R$ 17 milhões por ano, então fico reparando nesse tipo de operação.

A loja de vocês fecha venda sozinha hoje, ou o cliente ainda precisa chamar alguém?', 'Hoje faço isso com a Psy Comunic. Montamos a loja de atacado e a de varejo, com pedido mínimo e tabela por CNPJ, e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos junto todo mês depois do lançamento.

Quer que eu dê uma olhada na de vocês e te diga o que eu faria?'),
  ('L019', 'Oi{dono}, tudo bem?

Vi Lunedi aqui no Instagram e acabei chegando em você. Vocês atendem lojistas do P ao 16 direto de Gaspar.

Trabalho com e-commerce de moda, já fui sócio de um que fatura R$ 17 milhões por ano, então fico reparando nesse tipo de operação.

Vocês vendem só para lojista, ou já pensaram em vender direto para o consumidor também?', 'Hoje faço isso com a Psy Comunic. Montamos a loja de atacado e a de varejo, com pedido mínimo e tabela por CNPJ, e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos junto todo mês depois do lançamento.

Quer que eu dê uma olhada na de vocês e te diga o que eu faria?'),
  ('L020', 'Oi{dono}, tudo bem?

Vi Rollu aqui no Instagram e acabei chegando em você. Vocês são uma indústria com 36 anos no infantil.

Trabalho com e-commerce de moda, já fui sócio de um que fatura R$ 17 milhões por ano, então fico reparando nesse tipo de operação.

Vocês vendem só para lojista, ou já pensaram em vender direto para o consumidor também?', 'Hoje faço isso com a Psy Comunic. Montamos a loja de atacado e a de varejo, com pedido mínimo e tabela por CNPJ, e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos junto todo mês depois do lançamento.

Quer que eu dê uma olhada na de vocês e te diga o que eu faria?'),
  ('L021', 'Oi{dono}, tudo bem?

Vi TMX Kids & Teens aqui no Instagram e acabei chegando em você. Vocês vendem bebê a juvenil no atacado e hoje o pedido é por e-mail.

Trabalho com e-commerce de moda, já fui sócio de um que fatura R$ 17 milhões por ano, então fico reparando nesse tipo de operação.

Vocês vendem só para lojista, ou já pensaram em vender direto para o consumidor também?', 'Hoje faço isso com a Psy Comunic. Montamos a loja de atacado e a de varejo, com pedido mínimo e tabela por CNPJ, e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos junto todo mês depois do lançamento.

Quer que eu dê uma olhada na de vocês e te diga o que eu faria?'),
  ('L022', 'Oi{dono}, tudo bem?

Vi Jidi Kids aqui no Instagram e acabei chegando em você. Vocês têm confecção infantil própria em Gaspar.

Trabalho com e-commerce de moda, já fui sócio de um que fatura R$ 17 milhões por ano, então fico reparando nesse tipo de operação.

Vocês vendem só para lojista, ou já pensaram em vender direto para o consumidor também?', 'Hoje faço isso com a Psy Comunic. Montamos a loja de atacado e a de varejo, com pedido mínimo e tabela por CNPJ, e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos junto todo mês depois do lançamento.

Quer que eu dê uma olhada na de vocês e te diga o que eu faria?'),
  ('L023', 'Oi{dono}, tudo bem?

Vi Serelepe Kids aqui no Instagram e acabei chegando em você. Vocês fabricam infantil em Gaspar desde 2003.

Trabalho com e-commerce de moda, já fui sócio de um que fatura R$ 17 milhões por ano, então fico reparando nesse tipo de operação.

Vocês vendem só para lojista, ou já pensaram em vender direto para o consumidor também?', 'Hoje faço isso com a Psy Comunic. Montamos a loja de atacado e a de varejo, com pedido mínimo e tabela por CNPJ, e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos junto todo mês depois do lançamento.

Quer que eu dê uma olhada na de vocês e te diga o que eu faria?'),
  ('L024', 'Oi{dono}, tudo bem?

Vi PHO Kids aqui no Instagram e acabei chegando em você. Vocês têm confecção própria no atacado infantil.

Trabalho com e-commerce de moda, já fui sócio de um que fatura R$ 17 milhões por ano, então fico reparando nesse tipo de operação.

A loja de vocês fecha venda sozinha hoje, ou o cliente ainda precisa chamar alguém?', 'Hoje faço isso com a Psy Comunic. Montamos a loja de atacado e a de varejo, com pedido mínimo e tabela por CNPJ, e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos junto todo mês depois do lançamento.

Quer que eu dê uma olhada na de vocês e te diga o que eu faria?'),
  ('L025', 'Oi{dono}, tudo bem?

Vi DHC Atacado Infantil aqui no Instagram e acabei chegando em você. Vocês atendem atacado infantil em Gaspar.

Trabalho com e-commerce de moda, já fui sócio de um que fatura R$ 17 milhões por ano, então fico reparando nesse tipo de operação.

Vocês vendem só para lojista, ou já pensaram em vender direto para o consumidor também?', 'Hoje faço isso com a Psy Comunic. Montamos a loja de atacado e a de varejo, com pedido mínimo e tabela por CNPJ, e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos junto todo mês depois do lançamento.

Quer que eu dê uma olhada na de vocês e te diga o que eu faria?'),
  ('L026', 'Oi{dono}, tudo bem?

Vi Vanetex aqui no Instagram e acabei chegando em você. Vocês fabricam infantil e hoje dependem de Mercado Livre, Shein e TikTok.

Trabalho com e-commerce de moda, já fui sócio de um que fatura R$ 17 milhões por ano, então fico reparando nesse tipo de operação.

Vocês vendem só pelos marketplaces, ou já têm loja própria também?', 'Hoje faço isso com a Psy Comunic. Montamos a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos junto todo mês depois do lançamento.

Quer que eu dê uma olhada na de vocês e te diga o que eu faria?'),
  ('L027', 'Oi{dono}, tudo bem?

Vi Lua da Moda Confecções aqui no Instagram e acabei chegando em você. Vocês têm confecção própria em Blumenau.

Trabalho com e-commerce de moda, já fui sócio de um que fatura R$ 17 milhões por ano, então fico reparando nesse tipo de operação.

Vocês já vendem online, ou ainda é tudo WhatsApp e direct?', 'Hoje faço isso com a Psy Comunic. Montamos a loja de atacado, a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos junto todo mês depois do lançamento.

Quer que eu dê uma olhada na de vocês e te diga o que eu faria?'),
  ('L028', 'Oi{dono}, tudo bem?

Vi AltSide aqui no Instagram e acabei chegando em você. Vocês estão começando uma marca fitness com fabricação própria.

Trabalho com e-commerce de moda, já fui sócio de um que fatura R$ 17 milhões por ano, então fico reparando nesse tipo de operação.

A loja de vocês fecha venda sozinha hoje, ou o cliente ainda precisa chamar alguém?', 'Hoje faço isso com a Psy Comunic. Montamos a loja de atacado, a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos junto todo mês depois do lançamento.

Quer que eu dê uma olhada na de vocês e te diga o que eu faria?'),
  ('L029', 'Oi{dono}, tudo bem?

Vi Kunsler aqui no Instagram e acabei chegando em você. Vocês fabricam moda íntima do infantil ao adulto.

Trabalho com e-commerce de moda, já fui sócio de um que fatura R$ 17 milhões por ano, então fico reparando nesse tipo de operação.

A loja de vocês fecha venda sozinha hoje, ou o cliente ainda precisa chamar alguém?', 'Hoje faço isso com a Psy Comunic. Montamos a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos junto todo mês depois do lançamento.

Quer que eu dê uma olhada na de vocês e te diga o que eu faria?'),
  ('L030', 'Oi{dono}, tudo bem?

Vi Maria Guilhermina aqui no Instagram e acabei chegando em você. Vocês têm confecção própria de moda feminina.

Trabalho com e-commerce de moda, já fui sócio de um que fatura R$ 17 milhões por ano, então fico reparando nesse tipo de operação.

Vocês já vendem online, ou ainda é tudo WhatsApp e direct?', 'Hoje faço isso com a Psy Comunic. Montamos a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos junto todo mês depois do lançamento.

Quer que eu dê uma olhada na de vocês e te diga o que eu faria?'),
  ('L031', 'Oi{dono}, tudo bem?

Vi Outlet Arte D''Vestir aqui no Instagram e acabei chegando em você. Vocês vendem direto da fábrica no varejo.

Trabalho com e-commerce de moda, já fui sócio de um que fatura R$ 17 milhões por ano, então fico reparando nesse tipo de operação.

Vocês já vendem online, ou ainda é tudo WhatsApp e direct?', 'Hoje faço isso com a Psy Comunic. Montamos a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos junto todo mês depois do lançamento.

Quer que eu dê uma olhada na de vocês e te diga o que eu faria?'),
  ('L032', 'Oi{dono}, tudo bem?

Vi Rio Açu aqui no Instagram e acabei chegando em você. Vocês fabricam moda praia e lingerie desde 1991.

Trabalho com e-commerce de moda, já fui sócio de um que fatura R$ 17 milhões por ano, então fico reparando nesse tipo de operação.

A loja de vocês fecha venda sozinha hoje, ou o cliente ainda precisa chamar alguém?', 'Hoje faço isso com a Psy Comunic. Montamos a loja de atacado, a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos junto todo mês depois do lançamento.

Quer que eu dê uma olhada na de vocês e te diga o que eu faria?'),
  ('L033', 'Oi{dono}, tudo bem?

Vi Ilhas Rio aqui no Instagram e acabei chegando em você. Vocês têm 36 anos de moda praia em Ilhota.

Trabalho com e-commerce de moda, já fui sócio de um que fatura R$ 17 milhões por ano, então fico reparando nesse tipo de operação.

A loja de vocês fecha venda sozinha hoje, ou o cliente ainda precisa chamar alguém?', 'Hoje faço isso com a Psy Comunic. Montamos a loja de atacado, a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos junto todo mês depois do lançamento.

Quer que eu dê uma olhada na de vocês e te diga o que eu faria?'),
  ('L034', 'Oi{dono}, tudo bem?

Vi KSI aqui no Instagram e acabei chegando em você. Vocês produzem fitness, lingerie e pijamas desde 2005.

Trabalho com e-commerce de moda, já fui sócio de um que fatura R$ 17 milhões por ano, então fico reparando nesse tipo de operação.

A loja de vocês fecha venda sozinha hoje, ou o cliente ainda precisa chamar alguém?', 'Hoje faço isso com a Psy Comunic. Montamos a loja de atacado, a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos junto todo mês depois do lançamento.

Quer que eu dê uma olhada na de vocês e te diga o que eu faria?'),
  ('L035', 'Oi{dono}, tudo bem?

Vi Julemar Moda Íntima aqui no Instagram e acabei chegando em você. Vocês fabricam moda íntima e já exportam.

Trabalho com e-commerce de moda, já fui sócio de um que fatura R$ 17 milhões por ano, então fico reparando nesse tipo de operação.

Vocês já vendem online, ou ainda é tudo WhatsApp e direct?', 'Hoje faço isso com a Psy Comunic. Montamos a loja de atacado, a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos junto todo mês depois do lançamento.

Quer que eu dê uma olhada na de vocês e te diga o que eu faria?'),
  ('L036', 'Oi{dono}, tudo bem?

Vi HP Moda Íntima aqui no Instagram e acabei chegando em você. Vocês já têm site para atacadista mas não para o consumidor final.

Trabalho com e-commerce de moda, já fui sócio de um que fatura R$ 17 milhões por ano, então fico reparando nesse tipo de operação.

A loja de vocês fecha venda sozinha hoje, ou o cliente ainda precisa chamar alguém?', 'Hoje faço isso com a Psy Comunic. Montamos a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos junto todo mês depois do lançamento.

Quer que eu dê uma olhada na de vocês e te diga o que eu faria?'),
  ('L037', 'Oi{dono}, tudo bem?

Vi Dukali aqui no Instagram e acabei chegando em você. Vocês fabricam moda íntima e vendem pelo WhatsApp.

Trabalho com e-commerce de moda, já fui sócio de um que fatura R$ 17 milhões por ano, então fico reparando nesse tipo de operação.

Vocês já vendem online, ou ainda é tudo WhatsApp e direct?', 'Hoje faço isso com a Psy Comunic. Montamos a loja de atacado, a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos junto todo mês depois do lançamento.

Quer que eu dê uma olhada na de vocês e te diga o que eu faria?'),
  ('L038', 'Oi{dono}, tudo bem?

Vi Diara aqui no Instagram e acabei chegando em você. Vocês estão desde 1997 com lojas em Ilhota e Brusque.

Trabalho com e-commerce de moda, já fui sócio de um que fatura R$ 17 milhões por ano, então fico reparando nesse tipo de operação.

A loja de vocês fecha venda sozinha hoje, ou o cliente ainda precisa chamar alguém?', 'Hoje faço isso com a Psy Comunic. Montamos a loja de atacado, a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos junto todo mês depois do lançamento.

Quer que eu dê uma olhada na de vocês e te diga o que eu faria?'),
  ('L039', 'Oi{dono}, tudo bem?

Vi Atacadão da Moda Íntima (Two) aqui no Instagram e acabei chegando em você. Vocês atendem atacado e varejo de moda íntima.

Trabalho com e-commerce de moda, já fui sócio de um que fatura R$ 17 milhões por ano, então fico reparando nesse tipo de operação.

A loja de vocês fecha venda sozinha hoje, ou o cliente ainda precisa chamar alguém?', 'Hoje faço isso com a Psy Comunic. Montamos a loja de atacado, a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos junto todo mês depois do lançamento.

Quer que eu dê uma olhada na de vocês e te diga o que eu faria?'),
  ('L040', 'Oi{dono}, tudo bem?

Vi Pamella Nattacha aqui no Instagram e acabei chegando em você. Vocês têm confecção própria com showroom de atacado.

Trabalho com e-commerce de moda, já fui sócio de um que fatura R$ 17 milhões por ano, então fico reparando nesse tipo de operação.

Vocês vendem só para lojista, ou já pensaram em vender direto para o consumidor também?', 'Hoje faço isso com a Psy Comunic. Montamos a loja de atacado e a de varejo, com pedido mínimo e tabela por CNPJ, e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos junto todo mês depois do lançamento.

Quer que eu dê uma olhada na de vocês e te diga o que eu faria?'),
  ('L041', 'Oi{dono}, tudo bem?

Vi Camboriú aqui no Instagram e acabei chegando em você. Vocês estão desde 1995 no fitness e na moda praia.

Trabalho com e-commerce de moda, já fui sócio de um que fatura R$ 17 milhões por ano, então fico reparando nesse tipo de operação.

A loja de vocês fecha venda sozinha hoje, ou o cliente ainda precisa chamar alguém?', 'Hoje faço isso com a Psy Comunic. Montamos a loja de atacado, a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos junto todo mês depois do lançamento.

Quer que eu dê uma olhada na de vocês e te diga o que eu faria?'),
  ('L042', 'Oi{dono}, tudo bem?

Vi Divina Forma Fitness aqui no Instagram e acabei chegando em você. Vocês fabricam fitness e enviam para o Brasil e exterior.

Trabalho com e-commerce de moda, já fui sócio de um que fatura R$ 17 milhões por ano, então fico reparando nesse tipo de operação.

A loja de vocês fecha venda sozinha hoje, ou o cliente ainda precisa chamar alguém?', 'Hoje faço isso com a Psy Comunic. Montamos a loja de atacado, a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos junto todo mês depois do lançamento.

Quer que eu dê uma olhada na de vocês e te diga o que eu faria?'),
  ('L043', 'Oi{dono}, tudo bem?

Vi Robsur aqui no Instagram e acabei chegando em você. Vocês têm confecção própria desde 1991 e 3 lojas em Joinville.

Trabalho com e-commerce de moda, já fui sócio de um que fatura R$ 17 milhões por ano, então fico reparando nesse tipo de operação.

Vocês já vendem online, ou ainda é tudo WhatsApp e direct?', 'Hoje faço isso com a Psy Comunic. Montamos a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos junto todo mês depois do lançamento.

Quer que eu dê uma olhada na de vocês e te diga o que eu faria?'),
  ('L044', 'Oi{dono}, tudo bem?

Vi Dalbelli Confecções aqui no Instagram e acabei chegando em você. Vocês têm produção própria há mais de 30 anos.

Trabalho com e-commerce de moda, já fui sócio de um que fatura R$ 17 milhões por ano, então fico reparando nesse tipo de operação.

Vocês já vendem online, ou ainda é tudo WhatsApp e direct?', 'Hoje faço isso com a Psy Comunic. Montamos a loja de atacado, a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos junto todo mês depois do lançamento.

Quer que eu dê uma olhada na de vocês e te diga o que eu faria?'),
  ('L045', 'Oi{dono}, tudo bem?

Vi Ana Jullian Calçados aqui no Instagram e acabei chegando em você. Vocês fabricam calçados no polo de São João Batista.

Trabalho com e-commerce de moda, já fui sócio de um que fatura R$ 17 milhões por ano, então fico reparando nesse tipo de operação.

Vocês já vendem online, ou ainda é tudo WhatsApp e direct?', 'Hoje faço isso com a Psy Comunic. Montamos a loja de atacado, a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos junto todo mês depois do lançamento.

Quer que eu dê uma olhada na de vocês e te diga o que eu faria?'),
  ('L046', 'Oi{dono}, tudo bem?

Vi Rocksham Jeans aqui no Instagram e acabei chegando em você. Vocês fabricam jeans e têm 4 lojas.

Trabalho com e-commerce de moda, já fui sócio de um que fatura R$ 17 milhões por ano, então fico reparando nesse tipo de operação.

A loja de vocês fecha venda sozinha hoje, ou o cliente ainda precisa chamar alguém?', 'Hoje faço isso com a Psy Comunic. Montamos a loja de atacado, a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos junto todo mês depois do lançamento.

Quer que eu dê uma olhada na de vocês e te diga o que eu faria?'),
  ('L047', 'Oi{dono}, tudo bem?

Vi Priori aqui no Instagram e acabei chegando em você. Vocês têm fabricação própria e 6 lojas físicas.

Trabalho com e-commerce de moda, já fui sócio de um que fatura R$ 17 milhões por ano, então fico reparando nesse tipo de operação.

A loja de vocês fecha venda sozinha hoje, ou o cliente ainda precisa chamar alguém?', 'Hoje faço isso com a Psy Comunic. Montamos a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos junto todo mês depois do lançamento.

Quer que eu dê uma olhada na de vocês e te diga o que eu faria?'),
  ('L048', 'Oi{dono}, tudo bem?

Vi Talinda aqui no Instagram e acabei chegando em você. Vocês vendem do P ao G4 pelo WhatsApp com 4 lojas.

Trabalho com e-commerce de moda, já fui sócio de um que fatura R$ 17 milhões por ano, então fico reparando nesse tipo de operação.

Vocês já vendem online, ou ainda é tudo WhatsApp e direct?', 'Hoje faço isso com a Psy Comunic. Montamos a loja de atacado, a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos junto todo mês depois do lançamento.

Quer que eu dê uma olhada na de vocês e te diga o que eu faria?'),
  ('L049', 'Oi{dono}, tudo bem?

Vi Atacado de Brusque aqui no Instagram e acabei chegando em você. Vocês lançam coleção toda semana.

Trabalho com e-commerce de moda, já fui sócio de um que fatura R$ 17 milhões por ano, então fico reparando nesse tipo de operação.

A loja de vocês fecha venda sozinha hoje, ou o cliente ainda precisa chamar alguém?', 'Hoje faço isso com a Psy Comunic. Montamos a loja de atacado, a loja de varejo e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos junto todo mês depois do lançamento.

Quer que eu dê uma olhada na de vocês e te diga o que eu faria?'),
  ('L050', 'Oi{dono}, tudo bem?

Vi Miss Glamour aqui no Instagram e acabei chegando em você. Vocês estão há 15 anos no atacado feminino no Catarina Shopping.

Trabalho com e-commerce de moda, já fui sócio de um que fatura R$ 17 milhões por ano, então fico reparando nesse tipo de operação.

Vocês vendem só para lojista, ou já pensaram em vender direto para o consumidor também?', 'Hoje faço isso com a Psy Comunic. Montamos a loja de atacado e a de varejo, com pedido mínimo e tabela por CNPJ, e o aplicativo da marca, com marketplaces, ERP e transportadoras integrados, e seguimos junto todo mês depois do lançamento.

Quer que eu dê uma olhada na de vocês e te diga o que eu faria?'))
update prospeccao p
   set mensagem_abertura = nova.abertura,
       mensagem_oferta   = nova.oferta
  from nova
 where p.codigo = nova.codigo
   and (p.mensagem_abertura is distinct from nova.abertura
     or p.mensagem_oferta   is distinct from nova.oferta);
