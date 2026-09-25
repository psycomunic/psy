-- =====================================================================
-- 0038 - Oferta direta, com a call de diagnóstico no fim.
--
-- A DECISÃO É DE QUEM ESTÁ MANDANDO
--
-- A 0037 tinha tirado a oferta da abertura e deixado a mensagem curta,
-- terminando em pergunta. Quem envia testou e não quis: a abordagem
-- volta a oferecer, e a pedir a call.
--
-- Fica registrado o que ficou para trás, para a próxima pessoa que ler
-- não desfazer sem saber: a abertura cresce de 62 para cerca de 155
-- palavras, e a primeira mensagem passa a declarar intenção comercial.
-- Em troca, ela diz em cinco mensagens exatamente o que se faz e o que
-- se está pedindo, sem rodeio.
--
-- A SEQUÊNCIA
--
--   1  a saudação
--   2  quem é, e o que viu da marca
--   3  a oportunidade que se enxerga ali, COM O MOTIVO
--   4  os serviços, nas palavras do site
--   5  a call de 30 minutos, com o diagnóstico pronto
--
-- POR QUE A OPORTUNIDADE TEM MOTIVO ESCRITO
--
-- "Vejo uma grande oportunidade" sozinho é elogio vazio, e todo mundo
-- recebe igual. Com o motivo, vira leitura da operação daquela empresa,
-- e a leitura é justamente o que a call vai entregar:
--
--   só marketplaces  a comissão come a margem e o cliente é deles
--   já tem site      a loja funciona como vitrine, não como canal
--   só atacado       o mesmo produto vende direto, com margem maior
--   o resto          a venda depende de alguém estar disponível
--
-- OS SERVIÇOS SAEM DO SITE, E NÃO DE UMA LISTA INVENTADA
--
-- Catálogo com grade e tabela de medidas, página de produto, checkout,
-- ERP, marketplaces, transportadoras, e o tráfego no Google e no Meta
-- depois do lançamento. Tudo isso está em `src/conteudo/jornada.ts` e
-- em `src/conteudo/frentes.ts`, que é o que o site promete. A mensagem
-- não pode prometer mais do que a página.
--
-- `mensagem_oferta` SAI
--
-- Ela existiu por uma versão. Com a oferta de volta na abertura, o
-- bloco "quando ele responder" repetiria o que já foi dito, e campo que
-- duplica conteúdo é campo que um dia vai divergir dele.
-- =====================================================================

with nova(codigo, mensagem) as (values
  ('L001', 'Oi{dono}, tudo bem?

Meu nome é Angelo, da Psy Comunic. Vi Reiwiu Confecções aqui no Instagram e acabei chegando em você. Vocês têm fabricação própria há mais de 26 anos e 3 lojas em Brusque.

Olhando o que vocês já construíram, eu vejo uma oportunidade grande de e-commerce aí. Hoje a venda depende de alguém estar disponível para responder. Uma loja no ar vende nas 24 horas, para o Brasil inteiro, sem aumentar equipe.

Na Psy Comunic a gente monta e opera a loja inteira: a loja de atacado, a loja de varejo e o aplicativo da marca, com catálogo por grade e tabela de medidas, página de produto, checkout, ERP, marketplaces e transportadoras integrados, mais o tráfego no Google e no Meta todo mês depois do lançamento.

Topa marcar uma call de 30 minutos comigo? Eu faço o diagnóstico da operação de vocês antes e levo pronto, então você sai da conversa com o plano na mão.'),
  ('L002', 'Oi{dono}, tudo bem?

Meu nome é Angelo, da Psy Comunic. Vi Peka''s Jeans aqui no Instagram e acabei chegando em você. Vocês estão há 26 anos no jeans com loja de fábrica em Brusque.

Olhando o que vocês já construíram, eu vejo uma oportunidade grande de e-commerce aí. Hoje a venda depende de alguém estar disponível para responder. Uma loja no ar vende nas 24 horas, para o Brasil inteiro, sem aumentar equipe.

Na Psy Comunic a gente monta e opera a loja inteira: a loja de atacado, a loja de varejo e o aplicativo da marca, com catálogo por grade e tabela de medidas, página de produto, checkout, ERP, marketplaces e transportadoras integrados, mais o tráfego no Google e no Meta todo mês depois do lançamento.

Topa marcar uma call de 30 minutos comigo? Eu faço o diagnóstico da operação de vocês antes e levo pronto, então você sai da conversa com o plano na mão.'),
  ('L003', 'Oi{dono}, tudo bem?

Meu nome é Angelo, da Psy Comunic. Vi YouMen aqui no Instagram e acabei chegando em você. Vocês fabricam básicos masculinos e atendem atacado e varejo na FIP.

Olhando o que vocês já construíram, eu vejo uma oportunidade grande de e-commerce aí. Hoje a venda depende de alguém estar disponível para responder. Uma loja no ar vende nas 24 horas, para o Brasil inteiro, sem aumentar equipe.

Na Psy Comunic a gente monta e opera a loja inteira: a loja de atacado, a loja de varejo e o aplicativo da marca, com catálogo por grade e tabela de medidas, página de produto, checkout, ERP, marketplaces e transportadoras integrados, mais o tráfego no Google e no Meta todo mês depois do lançamento.

Topa marcar uma call de 30 minutos comigo? Eu faço o diagnóstico da operação de vocês antes e levo pronto, então você sai da conversa com o plano na mão.'),
  ('L004', 'Oi{dono}, tudo bem?

Meu nome é Angelo, da Psy Comunic. Vi Diamond Atacado aqui no Instagram e acabei chegando em você. Vocês têm fabricação própria e hoje vendem pelo direct.

Olhando o que vocês já construíram, eu vejo uma oportunidade grande de e-commerce aí. Hoje a venda depende de alguém estar disponível para responder. Uma loja no ar vende nas 24 horas, para o Brasil inteiro, sem aumentar equipe.

Na Psy Comunic a gente monta e opera a loja inteira: a loja de atacado, a loja de varejo e o aplicativo da marca, com catálogo por grade e tabela de medidas, página de produto, checkout, ERP, marketplaces e transportadoras integrados, mais o tráfego no Google e no Meta todo mês depois do lançamento.

Topa marcar uma call de 30 minutos comigo? Eu faço o diagnóstico da operação de vocês antes e levo pronto, então você sai da conversa com o plano na mão.'),
  ('L005', 'Oi{dono}, tudo bem?

Meu nome é Angelo, da Psy Comunic. Vi Fábrica de Camisetas Brusque aqui no Instagram e acabei chegando em você. Vocês fabricam camisetas e já enviam para todo o Brasil pelo WhatsApp.

Olhando o que vocês já construíram, eu vejo uma oportunidade grande de e-commerce aí. Hoje a venda depende de alguém estar disponível para responder. Uma loja no ar vende nas 24 horas, para o Brasil inteiro, sem aumentar equipe.

Na Psy Comunic a gente monta e opera a loja inteira: a loja de atacado, a loja de varejo e o aplicativo da marca, com catálogo por grade e tabela de medidas, página de produto, checkout, ERP, marketplaces e transportadoras integrados, mais o tráfego no Google e no Meta todo mês depois do lançamento.

Topa marcar uma call de 30 minutos comigo? Eu faço o diagnóstico da operação de vocês antes e levo pronto, então você sai da conversa com o plano na mão.'),
  ('L006', 'Oi{dono}, tudo bem?

Meu nome é Angelo, da Psy Comunic. Vi Mulher Única aqui no Instagram e acabei chegando em você. Vocês têm fabricação própria no plus size.

Olhando o que vocês já construíram, eu vejo uma oportunidade grande de e-commerce aí. Hoje a venda depende de alguém estar disponível para responder. Uma loja no ar vende nas 24 horas, para o Brasil inteiro, sem aumentar equipe.

Na Psy Comunic a gente monta e opera a loja inteira: a loja de varejo e o aplicativo da marca, com catálogo por grade e tabela de medidas, página de produto, checkout, ERP, marketplaces e transportadoras integrados, mais o tráfego no Google e no Meta todo mês depois do lançamento.

Topa marcar uma call de 30 minutos comigo? Eu faço o diagnóstico da operação de vocês antes e levo pronto, então você sai da conversa com o plano na mão.'),
  ('L007', 'Oi{dono}, tudo bem?

Meu nome é Angelo, da Psy Comunic. Vi Ana Gonçalves Tricot aqui no Instagram e acabei chegando em você. Vocês trabalham com tricot desde 1980.

Olhando o que vocês já construíram, eu vejo uma oportunidade grande de e-commerce aí. Vocês já atendem lojista, e o mesmo produto pode vender direto ao consumidor, com margem bem maior e sem depender de pedido mínimo.

Na Psy Comunic a gente monta e opera a loja inteira: a loja de atacado com pedido mínimo e tabela por CNPJ, a loja de varejo e o aplicativo da marca, com catálogo por grade e tabela de medidas, página de produto, checkout, ERP, marketplaces e transportadoras integrados, mais o tráfego no Google e no Meta todo mês depois do lançamento.

Topa marcar uma call de 30 minutos comigo? Eu faço o diagnóstico da operação de vocês antes e levo pronto, então você sai da conversa com o plano na mão.'),
  ('L008', 'Oi{dono}, tudo bem?

Meu nome é Angelo, da Psy Comunic. Vi Atacadão das Malhas aqui no Instagram e acabei chegando em você. Vocês têm loja de fábrica de tricot em Brusque.

Olhando o que vocês já construíram, eu vejo uma oportunidade grande de e-commerce aí. A loja que existe hoje funciona mais como vitrine do que como canal de venda, e é aí que costuma estar o maior salto.

Na Psy Comunic a gente monta e opera a loja inteira: a loja de atacado com pedido mínimo e tabela por CNPJ, a loja de varejo e o aplicativo da marca, com catálogo por grade e tabela de medidas, página de produto, checkout, ERP, marketplaces e transportadoras integrados, mais o tráfego no Google e no Meta todo mês depois do lançamento.

Topa marcar uma call de 30 minutos comigo? Eu faço o diagnóstico da operação de vocês antes e levo pronto, então você sai da conversa com o plano na mão.'),
  ('L009', 'Oi{dono}, tudo bem?

Meu nome é Angelo, da Psy Comunic. Vi La Miller Tricot aqui no Instagram e acabei chegando em você. Vocês fabricam tricot no All Shopping com envio imediato.

Olhando o que vocês já construíram, eu vejo uma oportunidade grande de e-commerce aí. Vocês já atendem lojista, e o mesmo produto pode vender direto ao consumidor, com margem bem maior e sem depender de pedido mínimo.

Na Psy Comunic a gente monta e opera a loja inteira: a loja de atacado com pedido mínimo e tabela por CNPJ, a loja de varejo e o aplicativo da marca, com catálogo por grade e tabela de medidas, página de produto, checkout, ERP, marketplaces e transportadoras integrados, mais o tráfego no Google e no Meta todo mês depois do lançamento.

Topa marcar uma call de 30 minutos comigo? Eu faço o diagnóstico da operação de vocês antes e levo pronto, então você sai da conversa com o plano na mão.'),
  ('L010', 'Oi{dono}, tudo bem?

Meu nome é Angelo, da Psy Comunic. Vi Vida Fit aqui no Instagram e acabei chegando em você. Vocês fabricam fitness e vendem 100% no atacado.

Olhando o que vocês já construíram, eu vejo uma oportunidade grande de e-commerce aí. Vocês já atendem lojista, e o mesmo produto pode vender direto ao consumidor, com margem bem maior e sem depender de pedido mínimo.

Na Psy Comunic a gente monta e opera a loja inteira: a loja de atacado com pedido mínimo e tabela por CNPJ, a loja de varejo e o aplicativo da marca, com catálogo por grade e tabela de medidas, página de produto, checkout, ERP, marketplaces e transportadoras integrados, mais o tráfego no Google e no Meta todo mês depois do lançamento.

Topa marcar uma call de 30 minutos comigo? Eu faço o diagnóstico da operação de vocês antes e levo pronto, então você sai da conversa com o plano na mão.'),
  ('L011', 'Oi{dono}, tudo bem?

Meu nome é Angelo, da Psy Comunic. Vi De Pijama Brusque aqui no Instagram e acabei chegando em você. Vocês fabricam pijamas e já vendem online.

Olhando o que vocês já construíram, eu vejo uma oportunidade grande de e-commerce aí. A loja que existe hoje funciona mais como vitrine do que como canal de venda, e é aí que costuma estar o maior salto.

Na Psy Comunic a gente monta e opera a loja inteira: a loja de atacado, a loja de varejo e o aplicativo da marca, com catálogo por grade e tabela de medidas, página de produto, checkout, ERP, marketplaces e transportadoras integrados, mais o tráfego no Google e no Meta todo mês depois do lançamento.

Topa marcar uma call de 30 minutos comigo? Eu faço o diagnóstico da operação de vocês antes e levo pronto, então você sai da conversa com o plano na mão.'),
  ('L012', 'Oi{dono}, tudo bem?

Meu nome é Angelo, da Psy Comunic. Vi Leleco Peteleco aqui no Instagram e acabei chegando em você. Vocês são fabricantes de moda infantil e atendem pelo WhatsApp.

Olhando o que vocês já construíram, eu vejo uma oportunidade grande de e-commerce aí. Vocês já atendem lojista, e o mesmo produto pode vender direto ao consumidor, com margem bem maior e sem depender de pedido mínimo.

Na Psy Comunic a gente monta e opera a loja inteira: a loja de atacado com pedido mínimo e tabela por CNPJ, a loja de varejo e o aplicativo da marca, com catálogo por grade e tabela de medidas, página de produto, checkout, ERP, marketplaces e transportadoras integrados, mais o tráfego no Google e no Meta todo mês depois do lançamento.

Topa marcar uma call de 30 minutos comigo? Eu faço o diagnóstico da operação de vocês antes e levo pronto, então você sai da conversa com o plano na mão.'),
  ('L013', 'Oi{dono}, tudo bem?

Meu nome é Angelo, da Psy Comunic. Vi Pega Mania aqui no Instagram e acabei chegando em você. Vocês produzem infantil e estão na maioria dos estados.

Olhando o que vocês já construíram, eu vejo uma oportunidade grande de e-commerce aí. A loja que existe hoje funciona mais como vitrine do que como canal de venda, e é aí que costuma estar o maior salto.

Na Psy Comunic a gente monta e opera a loja inteira: a loja de atacado com pedido mínimo e tabela por CNPJ, a loja de varejo e o aplicativo da marca, com catálogo por grade e tabela de medidas, página de produto, checkout, ERP, marketplaces e transportadoras integrados, mais o tráfego no Google e no Meta todo mês depois do lançamento.

Topa marcar uma call de 30 minutos comigo? Eu faço o diagnóstico da operação de vocês antes e levo pronto, então você sai da conversa com o plano na mão.'),
  ('L014', 'Oi{dono}, tudo bem?

Meu nome é Angelo, da Psy Comunic. Vi Iduna Fitness aqui no Instagram e acabei chegando em você. Vocês têm loja de fábrica fitness vendendo para todo o Brasil.

Olhando o que vocês já construíram, eu vejo uma oportunidade grande de e-commerce aí. A loja que existe hoje funciona mais como vitrine do que como canal de venda, e é aí que costuma estar o maior salto.

Na Psy Comunic a gente monta e opera a loja inteira: a loja de atacado, a loja de varejo e o aplicativo da marca, com catálogo por grade e tabela de medidas, página de produto, checkout, ERP, marketplaces e transportadoras integrados, mais o tráfego no Google e no Meta todo mês depois do lançamento.

Topa marcar uma call de 30 minutos comigo? Eu faço o diagnóstico da operação de vocês antes e levo pronto, então você sai da conversa com o plano na mão.'),
  ('L015', 'Oi{dono}, tudo bem?

Meu nome é Angelo, da Psy Comunic. Vi Brulini Moda Íntima aqui no Instagram e acabei chegando em você. Vocês produzem moda íntima direto da fábrica.

Olhando o que vocês já construíram, eu vejo uma oportunidade grande de e-commerce aí. Hoje a venda depende de alguém estar disponível para responder. Uma loja no ar vende nas 24 horas, para o Brasil inteiro, sem aumentar equipe.

Na Psy Comunic a gente monta e opera a loja inteira: a loja de atacado, a loja de varejo e o aplicativo da marca, com catálogo por grade e tabela de medidas, página de produto, checkout, ERP, marketplaces e transportadoras integrados, mais o tráfego no Google e no Meta todo mês depois do lançamento.

Topa marcar uma call de 30 minutos comigo? Eu faço o diagnóstico da operação de vocês antes e levo pronto, então você sai da conversa com o plano na mão.'),
  ('L016', 'Oi{dono}, tudo bem?

Meu nome é Angelo, da Psy Comunic. Vi Summer Girl aqui no Instagram e acabei chegando em você. Vocês têm mais de 20 anos no atacado e selo ABVTEX.

Olhando o que vocês já construíram, eu vejo uma oportunidade grande de e-commerce aí. Vocês já atendem lojista, e o mesmo produto pode vender direto ao consumidor, com margem bem maior e sem depender de pedido mínimo.

Na Psy Comunic a gente monta e opera a loja inteira: a loja de atacado com pedido mínimo e tabela por CNPJ, a loja de varejo e o aplicativo da marca, com catálogo por grade e tabela de medidas, página de produto, checkout, ERP, marketplaces e transportadoras integrados, mais o tráfego no Google e no Meta todo mês depois do lançamento.

Topa marcar uma call de 30 minutos comigo? Eu faço o diagnóstico da operação de vocês antes e levo pronto, então você sai da conversa com o plano na mão.'),
  ('L017', 'Oi{dono}, tudo bem?

Meu nome é Angelo, da Psy Comunic. Vi Xá Plus aqui no Instagram e acabei chegando em você. Vocês atendem lojistas de plus size no Master Shopping.

Olhando o que vocês já construíram, eu vejo uma oportunidade grande de e-commerce aí. Vocês já atendem lojista, e o mesmo produto pode vender direto ao consumidor, com margem bem maior e sem depender de pedido mínimo.

Na Psy Comunic a gente monta e opera a loja inteira: a loja de atacado com pedido mínimo e tabela por CNPJ, a loja de varejo e o aplicativo da marca, com catálogo por grade e tabela de medidas, página de produto, checkout, ERP, marketplaces e transportadoras integrados, mais o tráfego no Google e no Meta todo mês depois do lançamento.

Topa marcar uma call de 30 minutos comigo? Eu faço o diagnóstico da operação de vocês antes e levo pronto, então você sai da conversa com o plano na mão.'),
  ('L018', 'Oi{dono}, tudo bem?

Meu nome é Angelo, da Psy Comunic. Vi Alekids aqui no Instagram e acabei chegando em você. Vocês têm coleções exclusivas no atacado infantil.

Olhando o que vocês já construíram, eu vejo uma oportunidade grande de e-commerce aí. A loja que existe hoje funciona mais como vitrine do que como canal de venda, e é aí que costuma estar o maior salto.

Na Psy Comunic a gente monta e opera a loja inteira: a loja de atacado com pedido mínimo e tabela por CNPJ, a loja de varejo e o aplicativo da marca, com catálogo por grade e tabela de medidas, página de produto, checkout, ERP, marketplaces e transportadoras integrados, mais o tráfego no Google e no Meta todo mês depois do lançamento.

Topa marcar uma call de 30 minutos comigo? Eu faço o diagnóstico da operação de vocês antes e levo pronto, então você sai da conversa com o plano na mão.'),
  ('L019', 'Oi{dono}, tudo bem?

Meu nome é Angelo, da Psy Comunic. Vi Lunedi aqui no Instagram e acabei chegando em você. Vocês atendem lojistas do P ao 16 direto de Gaspar.

Olhando o que vocês já construíram, eu vejo uma oportunidade grande de e-commerce aí. Vocês já atendem lojista, e o mesmo produto pode vender direto ao consumidor, com margem bem maior e sem depender de pedido mínimo.

Na Psy Comunic a gente monta e opera a loja inteira: a loja de atacado com pedido mínimo e tabela por CNPJ, a loja de varejo e o aplicativo da marca, com catálogo por grade e tabela de medidas, página de produto, checkout, ERP, marketplaces e transportadoras integrados, mais o tráfego no Google e no Meta todo mês depois do lançamento.

Topa marcar uma call de 30 minutos comigo? Eu faço o diagnóstico da operação de vocês antes e levo pronto, então você sai da conversa com o plano na mão.'),
  ('L020', 'Oi{dono}, tudo bem?

Meu nome é Angelo, da Psy Comunic. Vi Rollu aqui no Instagram e acabei chegando em você. Vocês são uma indústria com 36 anos no infantil.

Olhando o que vocês já construíram, eu vejo uma oportunidade grande de e-commerce aí. Vocês já atendem lojista, e o mesmo produto pode vender direto ao consumidor, com margem bem maior e sem depender de pedido mínimo.

Na Psy Comunic a gente monta e opera a loja inteira: a loja de atacado com pedido mínimo e tabela por CNPJ, a loja de varejo e o aplicativo da marca, com catálogo por grade e tabela de medidas, página de produto, checkout, ERP, marketplaces e transportadoras integrados, mais o tráfego no Google e no Meta todo mês depois do lançamento.

Topa marcar uma call de 30 minutos comigo? Eu faço o diagnóstico da operação de vocês antes e levo pronto, então você sai da conversa com o plano na mão.'),
  ('L021', 'Oi{dono}, tudo bem?

Meu nome é Angelo, da Psy Comunic. Vi TMX Kids & Teens aqui no Instagram e acabei chegando em você. Vocês vendem bebê a juvenil no atacado e hoje o pedido é por e-mail.

Olhando o que vocês já construíram, eu vejo uma oportunidade grande de e-commerce aí. Vocês já atendem lojista, e o mesmo produto pode vender direto ao consumidor, com margem bem maior e sem depender de pedido mínimo.

Na Psy Comunic a gente monta e opera a loja inteira: a loja de atacado com pedido mínimo e tabela por CNPJ, a loja de varejo e o aplicativo da marca, com catálogo por grade e tabela de medidas, página de produto, checkout, ERP, marketplaces e transportadoras integrados, mais o tráfego no Google e no Meta todo mês depois do lançamento.

Topa marcar uma call de 30 minutos comigo? Eu faço o diagnóstico da operação de vocês antes e levo pronto, então você sai da conversa com o plano na mão.'),
  ('L022', 'Oi{dono}, tudo bem?

Meu nome é Angelo, da Psy Comunic. Vi Jidi Kids aqui no Instagram e acabei chegando em você. Vocês têm confecção infantil própria em Gaspar.

Olhando o que vocês já construíram, eu vejo uma oportunidade grande de e-commerce aí. Vocês já atendem lojista, e o mesmo produto pode vender direto ao consumidor, com margem bem maior e sem depender de pedido mínimo.

Na Psy Comunic a gente monta e opera a loja inteira: a loja de atacado com pedido mínimo e tabela por CNPJ, a loja de varejo e o aplicativo da marca, com catálogo por grade e tabela de medidas, página de produto, checkout, ERP, marketplaces e transportadoras integrados, mais o tráfego no Google e no Meta todo mês depois do lançamento.

Topa marcar uma call de 30 minutos comigo? Eu faço o diagnóstico da operação de vocês antes e levo pronto, então você sai da conversa com o plano na mão.'),
  ('L023', 'Oi{dono}, tudo bem?

Meu nome é Angelo, da Psy Comunic. Vi Serelepe Kids aqui no Instagram e acabei chegando em você. Vocês fabricam infantil em Gaspar desde 2003.

Olhando o que vocês já construíram, eu vejo uma oportunidade grande de e-commerce aí. Vocês já atendem lojista, e o mesmo produto pode vender direto ao consumidor, com margem bem maior e sem depender de pedido mínimo.

Na Psy Comunic a gente monta e opera a loja inteira: a loja de atacado com pedido mínimo e tabela por CNPJ, a loja de varejo e o aplicativo da marca, com catálogo por grade e tabela de medidas, página de produto, checkout, ERP, marketplaces e transportadoras integrados, mais o tráfego no Google e no Meta todo mês depois do lançamento.

Topa marcar uma call de 30 minutos comigo? Eu faço o diagnóstico da operação de vocês antes e levo pronto, então você sai da conversa com o plano na mão.'),
  ('L024', 'Oi{dono}, tudo bem?

Meu nome é Angelo, da Psy Comunic. Vi PHO Kids aqui no Instagram e acabei chegando em você. Vocês têm confecção própria no atacado infantil.

Olhando o que vocês já construíram, eu vejo uma oportunidade grande de e-commerce aí. A loja que existe hoje funciona mais como vitrine do que como canal de venda, e é aí que costuma estar o maior salto.

Na Psy Comunic a gente monta e opera a loja inteira: a loja de atacado com pedido mínimo e tabela por CNPJ, a loja de varejo e o aplicativo da marca, com catálogo por grade e tabela de medidas, página de produto, checkout, ERP, marketplaces e transportadoras integrados, mais o tráfego no Google e no Meta todo mês depois do lançamento.

Topa marcar uma call de 30 minutos comigo? Eu faço o diagnóstico da operação de vocês antes e levo pronto, então você sai da conversa com o plano na mão.'),
  ('L025', 'Oi{dono}, tudo bem?

Meu nome é Angelo, da Psy Comunic. Vi DHC Atacado Infantil aqui no Instagram e acabei chegando em você. Vocês atendem atacado infantil em Gaspar.

Olhando o que vocês já construíram, eu vejo uma oportunidade grande de e-commerce aí. Vocês já atendem lojista, e o mesmo produto pode vender direto ao consumidor, com margem bem maior e sem depender de pedido mínimo.

Na Psy Comunic a gente monta e opera a loja inteira: a loja de atacado com pedido mínimo e tabela por CNPJ, a loja de varejo e o aplicativo da marca, com catálogo por grade e tabela de medidas, página de produto, checkout, ERP, marketplaces e transportadoras integrados, mais o tráfego no Google e no Meta todo mês depois do lançamento.

Topa marcar uma call de 30 minutos comigo? Eu faço o diagnóstico da operação de vocês antes e levo pronto, então você sai da conversa com o plano na mão.'),
  ('L026', 'Oi{dono}, tudo bem?

Meu nome é Angelo, da Psy Comunic. Vi Vanetex aqui no Instagram e acabei chegando em você. Vocês fabricam infantil e hoje dependem de Mercado Livre, Shein e TikTok.

Olhando o que vocês já construíram, eu vejo uma oportunidade grande de e-commerce aí. No marketplace a comissão come a margem e o cliente acaba sendo deles, e não de vocês. A loja própria resolve as duas coisas.

Na Psy Comunic a gente monta e opera a loja inteira: a loja de varejo e o aplicativo da marca, com catálogo por grade e tabela de medidas, página de produto, checkout, ERP, marketplaces e transportadoras integrados, mais o tráfego no Google e no Meta todo mês depois do lançamento.

Topa marcar uma call de 30 minutos comigo? Eu faço o diagnóstico da operação de vocês antes e levo pronto, então você sai da conversa com o plano na mão.'),
  ('L027', 'Oi{dono}, tudo bem?

Meu nome é Angelo, da Psy Comunic. Vi Lua da Moda Confecções aqui no Instagram e acabei chegando em você. Vocês têm confecção própria em Blumenau.

Olhando o que vocês já construíram, eu vejo uma oportunidade grande de e-commerce aí. Hoje a venda depende de alguém estar disponível para responder. Uma loja no ar vende nas 24 horas, para o Brasil inteiro, sem aumentar equipe.

Na Psy Comunic a gente monta e opera a loja inteira: a loja de atacado, a loja de varejo e o aplicativo da marca, com catálogo por grade e tabela de medidas, página de produto, checkout, ERP, marketplaces e transportadoras integrados, mais o tráfego no Google e no Meta todo mês depois do lançamento.

Topa marcar uma call de 30 minutos comigo? Eu faço o diagnóstico da operação de vocês antes e levo pronto, então você sai da conversa com o plano na mão.'),
  ('L028', 'Oi{dono}, tudo bem?

Meu nome é Angelo, da Psy Comunic. Vi AltSide aqui no Instagram e acabei chegando em você. Vocês estão começando uma marca fitness com fabricação própria.

Olhando o que vocês já construíram, eu vejo uma oportunidade grande de e-commerce aí. A loja que existe hoje funciona mais como vitrine do que como canal de venda, e é aí que costuma estar o maior salto.

Na Psy Comunic a gente monta e opera a loja inteira: a loja de atacado, a loja de varejo e o aplicativo da marca, com catálogo por grade e tabela de medidas, página de produto, checkout, ERP, marketplaces e transportadoras integrados, mais o tráfego no Google e no Meta todo mês depois do lançamento.

Topa marcar uma call de 30 minutos comigo? Eu faço o diagnóstico da operação de vocês antes e levo pronto, então você sai da conversa com o plano na mão.'),
  ('L029', 'Oi{dono}, tudo bem?

Meu nome é Angelo, da Psy Comunic. Vi Kunsler aqui no Instagram e acabei chegando em você. Vocês fabricam moda íntima do infantil ao adulto.

Olhando o que vocês já construíram, eu vejo uma oportunidade grande de e-commerce aí. A loja que existe hoje funciona mais como vitrine do que como canal de venda, e é aí que costuma estar o maior salto.

Na Psy Comunic a gente monta e opera a loja inteira: a loja de varejo e o aplicativo da marca, com catálogo por grade e tabela de medidas, página de produto, checkout, ERP, marketplaces e transportadoras integrados, mais o tráfego no Google e no Meta todo mês depois do lançamento.

Topa marcar uma call de 30 minutos comigo? Eu faço o diagnóstico da operação de vocês antes e levo pronto, então você sai da conversa com o plano na mão.'),
  ('L030', 'Oi{dono}, tudo bem?

Meu nome é Angelo, da Psy Comunic. Vi Maria Guilhermina aqui no Instagram e acabei chegando em você. Vocês têm confecção própria de moda feminina.

Olhando o que vocês já construíram, eu vejo uma oportunidade grande de e-commerce aí. Hoje a venda depende de alguém estar disponível para responder. Uma loja no ar vende nas 24 horas, para o Brasil inteiro, sem aumentar equipe.

Na Psy Comunic a gente monta e opera a loja inteira: a loja de varejo e o aplicativo da marca, com catálogo por grade e tabela de medidas, página de produto, checkout, ERP, marketplaces e transportadoras integrados, mais o tráfego no Google e no Meta todo mês depois do lançamento.

Topa marcar uma call de 30 minutos comigo? Eu faço o diagnóstico da operação de vocês antes e levo pronto, então você sai da conversa com o plano na mão.'),
  ('L031', 'Oi{dono}, tudo bem?

Meu nome é Angelo, da Psy Comunic. Vi Outlet Arte D''Vestir aqui no Instagram e acabei chegando em você. Vocês vendem direto da fábrica no varejo.

Olhando o que vocês já construíram, eu vejo uma oportunidade grande de e-commerce aí. Hoje a venda depende de alguém estar disponível para responder. Uma loja no ar vende nas 24 horas, para o Brasil inteiro, sem aumentar equipe.

Na Psy Comunic a gente monta e opera a loja inteira: a loja de varejo e o aplicativo da marca, com catálogo por grade e tabela de medidas, página de produto, checkout, ERP, marketplaces e transportadoras integrados, mais o tráfego no Google e no Meta todo mês depois do lançamento.

Topa marcar uma call de 30 minutos comigo? Eu faço o diagnóstico da operação de vocês antes e levo pronto, então você sai da conversa com o plano na mão.'),
  ('L032', 'Oi{dono}, tudo bem?

Meu nome é Angelo, da Psy Comunic. Vi Rio Açu aqui no Instagram e acabei chegando em você. Vocês fabricam moda praia e lingerie desde 1991.

Olhando o que vocês já construíram, eu vejo uma oportunidade grande de e-commerce aí. A loja que existe hoje funciona mais como vitrine do que como canal de venda, e é aí que costuma estar o maior salto.

Na Psy Comunic a gente monta e opera a loja inteira: a loja de atacado, a loja de varejo e o aplicativo da marca, com catálogo por grade e tabela de medidas, página de produto, checkout, ERP, marketplaces e transportadoras integrados, mais o tráfego no Google e no Meta todo mês depois do lançamento.

Topa marcar uma call de 30 minutos comigo? Eu faço o diagnóstico da operação de vocês antes e levo pronto, então você sai da conversa com o plano na mão.'),
  ('L033', 'Oi{dono}, tudo bem?

Meu nome é Angelo, da Psy Comunic. Vi Ilhas Rio aqui no Instagram e acabei chegando em você. Vocês têm 36 anos de moda praia em Ilhota.

Olhando o que vocês já construíram, eu vejo uma oportunidade grande de e-commerce aí. A loja que existe hoje funciona mais como vitrine do que como canal de venda, e é aí que costuma estar o maior salto.

Na Psy Comunic a gente monta e opera a loja inteira: a loja de atacado, a loja de varejo e o aplicativo da marca, com catálogo por grade e tabela de medidas, página de produto, checkout, ERP, marketplaces e transportadoras integrados, mais o tráfego no Google e no Meta todo mês depois do lançamento.

Topa marcar uma call de 30 minutos comigo? Eu faço o diagnóstico da operação de vocês antes e levo pronto, então você sai da conversa com o plano na mão.'),
  ('L034', 'Oi{dono}, tudo bem?

Meu nome é Angelo, da Psy Comunic. Vi KSI aqui no Instagram e acabei chegando em você. Vocês produzem fitness, lingerie e pijamas desde 2005.

Olhando o que vocês já construíram, eu vejo uma oportunidade grande de e-commerce aí. A loja que existe hoje funciona mais como vitrine do que como canal de venda, e é aí que costuma estar o maior salto.

Na Psy Comunic a gente monta e opera a loja inteira: a loja de atacado, a loja de varejo e o aplicativo da marca, com catálogo por grade e tabela de medidas, página de produto, checkout, ERP, marketplaces e transportadoras integrados, mais o tráfego no Google e no Meta todo mês depois do lançamento.

Topa marcar uma call de 30 minutos comigo? Eu faço o diagnóstico da operação de vocês antes e levo pronto, então você sai da conversa com o plano na mão.'),
  ('L035', 'Oi{dono}, tudo bem?

Meu nome é Angelo, da Psy Comunic. Vi Julemar Moda Íntima aqui no Instagram e acabei chegando em você. Vocês fabricam moda íntima e já exportam.

Olhando o que vocês já construíram, eu vejo uma oportunidade grande de e-commerce aí. Hoje a venda depende de alguém estar disponível para responder. Uma loja no ar vende nas 24 horas, para o Brasil inteiro, sem aumentar equipe.

Na Psy Comunic a gente monta e opera a loja inteira: a loja de atacado, a loja de varejo e o aplicativo da marca, com catálogo por grade e tabela de medidas, página de produto, checkout, ERP, marketplaces e transportadoras integrados, mais o tráfego no Google e no Meta todo mês depois do lançamento.

Topa marcar uma call de 30 minutos comigo? Eu faço o diagnóstico da operação de vocês antes e levo pronto, então você sai da conversa com o plano na mão.'),
  ('L036', 'Oi{dono}, tudo bem?

Meu nome é Angelo, da Psy Comunic. Vi HP Moda Íntima aqui no Instagram e acabei chegando em você. Vocês já têm site para atacadista mas não para o consumidor final.

Olhando o que vocês já construíram, eu vejo uma oportunidade grande de e-commerce aí. A loja que existe hoje funciona mais como vitrine do que como canal de venda, e é aí que costuma estar o maior salto.

Na Psy Comunic a gente monta e opera a loja inteira: a loja de varejo que falta e o aplicativo da marca, com catálogo por grade e tabela de medidas, página de produto, checkout, ERP, marketplaces e transportadoras integrados, mais o tráfego no Google e no Meta todo mês depois do lançamento.

Topa marcar uma call de 30 minutos comigo? Eu faço o diagnóstico da operação de vocês antes e levo pronto, então você sai da conversa com o plano na mão.'),
  ('L037', 'Oi{dono}, tudo bem?

Meu nome é Angelo, da Psy Comunic. Vi Dukali aqui no Instagram e acabei chegando em você. Vocês fabricam moda íntima e vendem pelo WhatsApp.

Olhando o que vocês já construíram, eu vejo uma oportunidade grande de e-commerce aí. Hoje a venda depende de alguém estar disponível para responder. Uma loja no ar vende nas 24 horas, para o Brasil inteiro, sem aumentar equipe.

Na Psy Comunic a gente monta e opera a loja inteira: a loja de atacado, a loja de varejo e o aplicativo da marca, com catálogo por grade e tabela de medidas, página de produto, checkout, ERP, marketplaces e transportadoras integrados, mais o tráfego no Google e no Meta todo mês depois do lançamento.

Topa marcar uma call de 30 minutos comigo? Eu faço o diagnóstico da operação de vocês antes e levo pronto, então você sai da conversa com o plano na mão.'),
  ('L038', 'Oi{dono}, tudo bem?

Meu nome é Angelo, da Psy Comunic. Vi Diara aqui no Instagram e acabei chegando em você. Vocês estão desde 1997 com lojas em Ilhota e Brusque.

Olhando o que vocês já construíram, eu vejo uma oportunidade grande de e-commerce aí. A loja que existe hoje funciona mais como vitrine do que como canal de venda, e é aí que costuma estar o maior salto.

Na Psy Comunic a gente monta e opera a loja inteira: a loja de atacado, a loja de varejo e o aplicativo da marca, com catálogo por grade e tabela de medidas, página de produto, checkout, ERP, marketplaces e transportadoras integrados, mais o tráfego no Google e no Meta todo mês depois do lançamento.

Topa marcar uma call de 30 minutos comigo? Eu faço o diagnóstico da operação de vocês antes e levo pronto, então você sai da conversa com o plano na mão.'),
  ('L039', 'Oi{dono}, tudo bem?

Meu nome é Angelo, da Psy Comunic. Vi Atacadão da Moda Íntima (Two) aqui no Instagram e acabei chegando em você. Vocês atendem atacado e varejo de moda íntima.

Olhando o que vocês já construíram, eu vejo uma oportunidade grande de e-commerce aí. A loja que existe hoje funciona mais como vitrine do que como canal de venda, e é aí que costuma estar o maior salto.

Na Psy Comunic a gente monta e opera a loja inteira: a loja de atacado, a loja de varejo e o aplicativo da marca, com catálogo por grade e tabela de medidas, página de produto, checkout, ERP, marketplaces e transportadoras integrados, mais o tráfego no Google e no Meta todo mês depois do lançamento.

Topa marcar uma call de 30 minutos comigo? Eu faço o diagnóstico da operação de vocês antes e levo pronto, então você sai da conversa com o plano na mão.'),
  ('L040', 'Oi{dono}, tudo bem?

Meu nome é Angelo, da Psy Comunic. Vi Pamella Nattacha aqui no Instagram e acabei chegando em você. Vocês têm confecção própria com showroom de atacado.

Olhando o que vocês já construíram, eu vejo uma oportunidade grande de e-commerce aí. Vocês já atendem lojista, e o mesmo produto pode vender direto ao consumidor, com margem bem maior e sem depender de pedido mínimo.

Na Psy Comunic a gente monta e opera a loja inteira: a loja de atacado com pedido mínimo e tabela por CNPJ, a loja de varejo e o aplicativo da marca, com catálogo por grade e tabela de medidas, página de produto, checkout, ERP, marketplaces e transportadoras integrados, mais o tráfego no Google e no Meta todo mês depois do lançamento.

Topa marcar uma call de 30 minutos comigo? Eu faço o diagnóstico da operação de vocês antes e levo pronto, então você sai da conversa com o plano na mão.'),
  ('L041', 'Oi{dono}, tudo bem?

Meu nome é Angelo, da Psy Comunic. Vi Camboriú aqui no Instagram e acabei chegando em você. Vocês estão desde 1995 no fitness e na moda praia.

Olhando o que vocês já construíram, eu vejo uma oportunidade grande de e-commerce aí. A loja que existe hoje funciona mais como vitrine do que como canal de venda, e é aí que costuma estar o maior salto.

Na Psy Comunic a gente monta e opera a loja inteira: a loja de atacado, a loja de varejo e o aplicativo da marca, com catálogo por grade e tabela de medidas, página de produto, checkout, ERP, marketplaces e transportadoras integrados, mais o tráfego no Google e no Meta todo mês depois do lançamento.

Topa marcar uma call de 30 minutos comigo? Eu faço o diagnóstico da operação de vocês antes e levo pronto, então você sai da conversa com o plano na mão.'),
  ('L042', 'Oi{dono}, tudo bem?

Meu nome é Angelo, da Psy Comunic. Vi Divina Forma Fitness aqui no Instagram e acabei chegando em você. Vocês fabricam fitness e enviam para o Brasil e exterior.

Olhando o que vocês já construíram, eu vejo uma oportunidade grande de e-commerce aí. A loja que existe hoje funciona mais como vitrine do que como canal de venda, e é aí que costuma estar o maior salto.

Na Psy Comunic a gente monta e opera a loja inteira: a loja de atacado, a loja de varejo e o aplicativo da marca, com catálogo por grade e tabela de medidas, página de produto, checkout, ERP, marketplaces e transportadoras integrados, mais o tráfego no Google e no Meta todo mês depois do lançamento.

Topa marcar uma call de 30 minutos comigo? Eu faço o diagnóstico da operação de vocês antes e levo pronto, então você sai da conversa com o plano na mão.'),
  ('L043', 'Oi{dono}, tudo bem?

Meu nome é Angelo, da Psy Comunic. Vi Robsur aqui no Instagram e acabei chegando em você. Vocês têm confecção própria desde 1991 e 3 lojas em Joinville.

Olhando o que vocês já construíram, eu vejo uma oportunidade grande de e-commerce aí. Hoje a venda depende de alguém estar disponível para responder. Uma loja no ar vende nas 24 horas, para o Brasil inteiro, sem aumentar equipe.

Na Psy Comunic a gente monta e opera a loja inteira: a loja de varejo e o aplicativo da marca, com catálogo por grade e tabela de medidas, página de produto, checkout, ERP, marketplaces e transportadoras integrados, mais o tráfego no Google e no Meta todo mês depois do lançamento.

Topa marcar uma call de 30 minutos comigo? Eu faço o diagnóstico da operação de vocês antes e levo pronto, então você sai da conversa com o plano na mão.'),
  ('L044', 'Oi{dono}, tudo bem?

Meu nome é Angelo, da Psy Comunic. Vi Dalbelli Confecções aqui no Instagram e acabei chegando em você. Vocês têm produção própria há mais de 30 anos.

Olhando o que vocês já construíram, eu vejo uma oportunidade grande de e-commerce aí. Hoje a venda depende de alguém estar disponível para responder. Uma loja no ar vende nas 24 horas, para o Brasil inteiro, sem aumentar equipe.

Na Psy Comunic a gente monta e opera a loja inteira: a loja de atacado, a loja de varejo e o aplicativo da marca, com catálogo por grade e tabela de medidas, página de produto, checkout, ERP, marketplaces e transportadoras integrados, mais o tráfego no Google e no Meta todo mês depois do lançamento.

Topa marcar uma call de 30 minutos comigo? Eu faço o diagnóstico da operação de vocês antes e levo pronto, então você sai da conversa com o plano na mão.'),
  ('L045', 'Oi{dono}, tudo bem?

Meu nome é Angelo, da Psy Comunic. Vi Ana Jullian Calçados aqui no Instagram e acabei chegando em você. Vocês fabricam calçados no polo de São João Batista.

Olhando o que vocês já construíram, eu vejo uma oportunidade grande de e-commerce aí. Hoje a venda depende de alguém estar disponível para responder. Uma loja no ar vende nas 24 horas, para o Brasil inteiro, sem aumentar equipe.

Na Psy Comunic a gente monta e opera a loja inteira: a loja de atacado, a loja de varejo e o aplicativo da marca, com catálogo por grade e tabela de medidas, página de produto, checkout, ERP, marketplaces e transportadoras integrados, mais o tráfego no Google e no Meta todo mês depois do lançamento.

Topa marcar uma call de 30 minutos comigo? Eu faço o diagnóstico da operação de vocês antes e levo pronto, então você sai da conversa com o plano na mão.'),
  ('L046', 'Oi{dono}, tudo bem?

Meu nome é Angelo, da Psy Comunic. Vi Rocksham Jeans aqui no Instagram e acabei chegando em você. Vocês fabricam jeans e têm 4 lojas.

Olhando o que vocês já construíram, eu vejo uma oportunidade grande de e-commerce aí. A loja que existe hoje funciona mais como vitrine do que como canal de venda, e é aí que costuma estar o maior salto.

Na Psy Comunic a gente monta e opera a loja inteira: a loja de atacado, a loja de varejo e o aplicativo da marca, com catálogo por grade e tabela de medidas, página de produto, checkout, ERP, marketplaces e transportadoras integrados, mais o tráfego no Google e no Meta todo mês depois do lançamento.

Topa marcar uma call de 30 minutos comigo? Eu faço o diagnóstico da operação de vocês antes e levo pronto, então você sai da conversa com o plano na mão.'),
  ('L047', 'Oi{dono}, tudo bem?

Meu nome é Angelo, da Psy Comunic. Vi Priori aqui no Instagram e acabei chegando em você. Vocês têm fabricação própria e 6 lojas físicas.

Olhando o que vocês já construíram, eu vejo uma oportunidade grande de e-commerce aí. A loja que existe hoje funciona mais como vitrine do que como canal de venda, e é aí que costuma estar o maior salto.

Na Psy Comunic a gente monta e opera a loja inteira: a loja de varejo e o aplicativo da marca, com catálogo por grade e tabela de medidas, página de produto, checkout, ERP, marketplaces e transportadoras integrados, mais o tráfego no Google e no Meta todo mês depois do lançamento.

Topa marcar uma call de 30 minutos comigo? Eu faço o diagnóstico da operação de vocês antes e levo pronto, então você sai da conversa com o plano na mão.'),
  ('L048', 'Oi{dono}, tudo bem?

Meu nome é Angelo, da Psy Comunic. Vi Talinda aqui no Instagram e acabei chegando em você. Vocês vendem do P ao G4 pelo WhatsApp com 4 lojas.

Olhando o que vocês já construíram, eu vejo uma oportunidade grande de e-commerce aí. Hoje a venda depende de alguém estar disponível para responder. Uma loja no ar vende nas 24 horas, para o Brasil inteiro, sem aumentar equipe.

Na Psy Comunic a gente monta e opera a loja inteira: a loja de atacado, a loja de varejo e o aplicativo da marca, com catálogo por grade e tabela de medidas, página de produto, checkout, ERP, marketplaces e transportadoras integrados, mais o tráfego no Google e no Meta todo mês depois do lançamento.

Topa marcar uma call de 30 minutos comigo? Eu faço o diagnóstico da operação de vocês antes e levo pronto, então você sai da conversa com o plano na mão.'),
  ('L049', 'Oi{dono}, tudo bem?

Meu nome é Angelo, da Psy Comunic. Vi Atacado de Brusque aqui no Instagram e acabei chegando em você. Vocês lançam coleção toda semana.

Olhando o que vocês já construíram, eu vejo uma oportunidade grande de e-commerce aí. A loja que existe hoje funciona mais como vitrine do que como canal de venda, e é aí que costuma estar o maior salto.

Na Psy Comunic a gente monta e opera a loja inteira: a loja de atacado, a loja de varejo e o aplicativo da marca, com catálogo por grade e tabela de medidas, página de produto, checkout, ERP, marketplaces e transportadoras integrados, mais o tráfego no Google e no Meta todo mês depois do lançamento.

Topa marcar uma call de 30 minutos comigo? Eu faço o diagnóstico da operação de vocês antes e levo pronto, então você sai da conversa com o plano na mão.'),
  ('L050', 'Oi{dono}, tudo bem?

Meu nome é Angelo, da Psy Comunic. Vi Miss Glamour aqui no Instagram e acabei chegando em você. Vocês estão há 15 anos no atacado feminino no Catarina Shopping.

Olhando o que vocês já construíram, eu vejo uma oportunidade grande de e-commerce aí. Vocês já atendem lojista, e o mesmo produto pode vender direto ao consumidor, com margem bem maior e sem depender de pedido mínimo.

Na Psy Comunic a gente monta e opera a loja inteira: a loja de atacado com pedido mínimo e tabela por CNPJ, a loja de varejo e o aplicativo da marca, com catálogo por grade e tabela de medidas, página de produto, checkout, ERP, marketplaces e transportadoras integrados, mais o tráfego no Google e no Meta todo mês depois do lançamento.

Topa marcar uma call de 30 minutos comigo? Eu faço o diagnóstico da operação de vocês antes e levo pronto, então você sai da conversa com o plano na mão.'))
update prospeccao p
   set mensagem_abertura = nova.mensagem
  from nova
 where p.codigo = nova.codigo
   and p.mensagem_abertura is distinct from nova.mensagem;

alter table prospeccao drop column if exists mensagem_oferta;
