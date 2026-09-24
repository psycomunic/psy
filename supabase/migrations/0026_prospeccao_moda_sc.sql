-- =====================================================================
-- 0026 - Carga da primeira lista de prospecção: 50 fábricas de moda
--        de Santa Catarina.
--
-- Levantamento manual, com código próprio (L001 a L050). Cada linha
-- vira DUAS: o lead no funil, em "novo", e a pesquisa em `prospeccao`.
--
-- POR QUE A CARGA É UMA MIGRAÇÃO
--
-- Porque é assim que este projeto escreve no banco. Não há chave de
-- serviço fora do servidor, e não há console aberto: a migração é o
-- caminho auditável, versionado e repetível.
--
-- RODAR DUAS VEZES NÃO DUPLICA NINGUÉM. O `where not exists` olha o
-- código da lista: se `L007` já está lá, o `insert` do lead não produz
-- linha, o CTE volta vazio, e o `insert` da pesquisa também não produz
-- nada. Sem `on conflict`, sem contar antes.
--
-- O QUE FICA EM CADA TABELA
--
-- `lead.nome` recebe o @ do Instagram, e não o nome da empresa. Ainda
-- não se sabe com quem se fala: o @ é a única identidade real que
-- existe hoje, e é por ele que a abordagem acontece. Inventar um nome
-- de contato seria dado falso; repetir a empresa nos dois campos faria
-- o card do funil dizer a mesma coisa duas vezes.
--
-- `origem` é 'Prospecção ativa' porque ninguém chegou: a agência foi
-- atrás. É o valor que o formulário do CRM já sugere.
--
-- Estágio, próximo passo e responsável ficam SÓ em `lead`. Canal,
-- prioridade, gancho e mensagem ficam SÓ em `prospeccao`.
-- =====================================================================

-- L001 · Reiwiu Confecções · Brusque/SC
with novo as (
  insert into lead (nome, empresa, origem, estagio, proximo_passo)
  select '@reiwiuconfeccoes', 'Reiwiu Confecções', 'Prospecção ativa', 'novo', 'Enviar DM de abertura'
   where not exists (select 1 from prospeccao where codigo = 'L001')
  returning id
)
insert into prospeccao
  (lead_id, codigo, instagram, instagram_url, cidade, uf, regiao, segmento,
   modelo_venda, fabricacao_propria, situacao_site, seguidores, prioridade,
   oportunidade, gancho, mensagem_abertura, perguntas, canal, notas)
select novo.id, 'L001', '@reiwiuconfeccoes', 'https://www.instagram.com/reiwiuconfeccoes/', 'Brusque', 'SC', 'Vale do Itajaí', 'Moda feminina/masculina',
       'Atacado e varejo', 'Sim', 'Verificar link da bio', 10000, 'A',
       'Novo e-commerce', 'Têm fabricação própria há mais de 26 anos e 3 lojas em Brusque', 'Oi, tudo bem? Aqui é o Angelo, da Vettor 28. Vi que vocês têm fabricação própria há mais de 26 anos e 3 lojas em Brusque. A gente monta loja online para fábricas de moda venderem direto ao cliente final e ao lojista, sem depender só do WhatsApp. Posso te mostrar como ficaria para a Reiwiu Confecções?', 'Hoje quanto das vendas vem do WhatsApp/Instagram? Já pensaram em ter loja online própria?', 'Instagram DM', null
  from novo;

-- L002 · Peka's Jeans · Brusque/SC
with novo as (
  insert into lead (nome, empresa, origem, estagio, proximo_passo)
  select '@pekasjeans', 'Peka''s Jeans', 'Prospecção ativa', 'novo', 'Enviar DM de abertura'
   where not exists (select 1 from prospeccao where codigo = 'L002')
  returning id
)
insert into prospeccao
  (lead_id, codigo, instagram, instagram_url, cidade, uf, regiao, segmento,
   modelo_venda, fabricacao_propria, situacao_site, seguidores, prioridade,
   oportunidade, gancho, mensagem_abertura, perguntas, canal, notas)
select novo.id, 'L002', '@pekasjeans', 'https://www.instagram.com/pekasjeans/', 'Brusque', 'SC', 'Vale do Itajaí', 'Jeans',
       'Atacado e varejo', 'Sim', 'Verificar link da bio', 4900, 'B',
       'Novo e-commerce', 'Estão há 26 anos no jeans com loja de fábrica em Brusque', 'Oi, tudo bem? Aqui é o Angelo, da Vettor 28. Vi que vocês estão há 26 anos no jeans com loja de fábrica em Brusque. A gente monta loja online para fábricas de moda venderem direto ao cliente final e ao lojista, sem depender só do WhatsApp. Posso te mostrar como ficaria para a Peka''s Jeans?', 'Hoje quanto das vendas vem do WhatsApp/Instagram? Já pensaram em ter loja online própria?', 'Instagram DM', null
  from novo;

-- L003 · YouMen · Brusque/SC
with novo as (
  insert into lead (nome, empresa, origem, estagio, proximo_passo)
  select '@youmen.brusque', 'YouMen', 'Prospecção ativa', 'novo', 'Enviar DM de abertura'
   where not exists (select 1 from prospeccao where codigo = 'L003')
  returning id
)
insert into prospeccao
  (lead_id, codigo, instagram, instagram_url, cidade, uf, regiao, segmento,
   modelo_venda, fabricacao_propria, situacao_site, seguidores, prioridade,
   oportunidade, gancho, mensagem_abertura, perguntas, canal, notas)
select novo.id, 'L003', '@youmen.brusque', 'https://www.instagram.com/youmen.brusque/', 'Brusque', 'SC', 'Vale do Itajaí', 'Moda masculina (básicos)',
       'Atacado e varejo', 'Sim', 'Verificar link da bio', 3100, 'B',
       'Novo e-commerce', 'Fabricam básicos masculinos e atendem atacado e varejo na FIP', 'Oi, tudo bem? Aqui é o Angelo, da Vettor 28. Vi que vocês fabricam básicos masculinos e atendem atacado e varejo na FIP. A gente monta loja online para fábricas de moda venderem direto ao cliente final e ao lojista, sem depender só do WhatsApp. Posso te mostrar como ficaria para a YouMen?', 'Hoje quanto das vendas vem do WhatsApp/Instagram? Já pensaram em ter loja online própria?', 'Instagram DM', null
  from novo;

-- L004 · Diamond Atacado · Brusque/SC
with novo as (
  insert into lead (nome, empresa, origem, estagio, proximo_passo)
  select '@atacado_diamond', 'Diamond Atacado', 'Prospecção ativa', 'novo', 'Enviar DM de abertura'
   where not exists (select 1 from prospeccao where codigo = 'L004')
  returning id
)
insert into prospeccao
  (lead_id, codigo, instagram, instagram_url, cidade, uf, regiao, segmento,
   modelo_venda, fabricacao_propria, situacao_site, seguidores, prioridade,
   oportunidade, gancho, mensagem_abertura, perguntas, canal, notas)
select novo.id, 'L004', '@atacado_diamond', 'https://www.instagram.com/atacado_diamond/', 'Brusque', 'SC', 'Vale do Itajaí', 'Moda (geral)',
       'Atacado e varejo', 'Sim', 'Vende pelo direct', 158, 'C',
       'Novo e-commerce', 'Têm fabricação própria e hoje vendem pelo direct', 'Oi, tudo bem? Aqui é o Angelo, da Vettor 28. Vi que vocês têm fabricação própria e hoje vendem pelo direct. A gente monta loja online para fábricas de moda venderem direto ao cliente final e ao lojista, sem depender só do WhatsApp. Posso te mostrar como ficaria para a Diamond Atacado?', 'Hoje quanto das vendas vem do WhatsApp/Instagram? Já pensaram em ter loja online própria?', 'Instagram DM', null
  from novo;

-- L005 · Fábrica de Camisetas Brusque · Brusque/SC
with novo as (
  insert into lead (nome, empresa, origem, estagio, proximo_passo)
  select '@fabricadecamisetasbrusque', 'Fábrica de Camisetas Brusque', 'Prospecção ativa', 'novo', 'Enviar DM de abertura'
   where not exists (select 1 from prospeccao where codigo = 'L005')
  returning id
)
insert into prospeccao
  (lead_id, codigo, instagram, instagram_url, cidade, uf, regiao, segmento,
   modelo_venda, fabricacao_propria, situacao_site, seguidores, prioridade,
   oportunidade, gancho, mensagem_abertura, perguntas, canal, notas)
select novo.id, 'L005', '@fabricadecamisetasbrusque', 'https://www.instagram.com/fabricadecamisetasbrusque/', 'Brusque', 'SC', 'Vale do Itajaí', 'Camisetas',
       'Atacado e varejo', 'Sim', 'Vende pelo WhatsApp', 1400, 'B',
       'Novo e-commerce', 'Fabricam camisetas e já enviam para todo o Brasil pelo WhatsApp', 'Oi, tudo bem? Aqui é o Angelo, da Vettor 28. Vi que vocês fabricam camisetas e já enviam para todo o Brasil pelo WhatsApp. A gente monta loja online para fábricas de moda venderem direto ao cliente final e ao lojista, sem depender só do WhatsApp. Posso te mostrar como ficaria para a Fábrica de Camisetas Brusque?', 'Hoje quanto das vendas vem do WhatsApp/Instagram? Já pensaram em ter loja online própria?', 'Instagram DM', null
  from novo;

-- L006 · Mulher Única · Brusque/SC
with novo as (
  insert into lead (nome, empresa, origem, estagio, proximo_passo)
  select '@mulherunica', 'Mulher Única', 'Prospecção ativa', 'novo', 'Enviar DM de abertura'
   where not exists (select 1 from prospeccao where codigo = 'L006')
  returning id
)
insert into prospeccao
  (lead_id, codigo, instagram, instagram_url, cidade, uf, regiao, segmento,
   modelo_venda, fabricacao_propria, situacao_site, seguidores, prioridade,
   oportunidade, gancho, mensagem_abertura, perguntas, canal, notas)
select novo.id, 'L006', '@mulherunica', 'https://www.instagram.com/mulherunica/', 'Brusque', 'SC', 'Vale do Itajaí', 'Plus size feminino',
       'Varejo', 'Sim', 'Verificar link da bio', 87000, 'A',
       'Novo e-commerce', 'Têm uma audiência enorme no plus size com fabricação própria', 'Oi, tudo bem? Aqui é o Angelo, da Vettor 28. Vi que vocês têm uma audiência enorme no plus size com fabricação própria. A gente monta loja online para fábricas de moda venderem direto ao cliente final e ao lojista, sem depender só do WhatsApp. Posso te mostrar como ficaria para a Mulher Única?', 'Hoje quanto das vendas vem do WhatsApp/Instagram? Já pensaram em ter loja online própria?', 'Instagram DM', null
  from novo;

-- L007 · Ana Gonçalves Tricot · Brusque/SC
with novo as (
  insert into lead (nome, empresa, origem, estagio, proximo_passo)
  select '@anagoncalvescatarinashopping', 'Ana Gonçalves Tricot', 'Prospecção ativa', 'novo', 'Enviar DM de abertura'
   where not exists (select 1 from prospeccao where codigo = 'L007')
  returning id
)
insert into prospeccao
  (lead_id, codigo, instagram, instagram_url, cidade, uf, regiao, segmento,
   modelo_venda, fabricacao_propria, situacao_site, seguidores, prioridade,
   oportunidade, gancho, mensagem_abertura, perguntas, canal, notas)
select novo.id, 'L007', '@anagoncalvescatarinashopping', 'https://www.instagram.com/anagoncalvescatarinashopping/', 'Brusque', 'SC', 'Vale do Itajaí', 'Tricot',
       'Atacado', 'Sim', 'Verificar link da bio', 14000, 'B',
       'Novo e-commerce', 'Trabalham com tricot desde 1980', 'Oi, tudo bem? Aqui é o Angelo, da Vettor 28. Vi que vocês trabalham com tricot desde 1980. A gente monta loja online para fábricas de moda venderem direto ao cliente final e ao lojista, sem depender só do WhatsApp. Posso te mostrar como ficaria para a Ana Gonçalves Tricot?', 'Hoje quanto das vendas vem do WhatsApp/Instagram? Já pensaram em ter loja online própria?', 'Instagram DM', null
  from novo;

-- L008 · Atacadão das Malhas · Brusque/SC
with novo as (
  insert into lead (nome, empresa, origem, estagio, proximo_passo)
  select '@atacadaodasmalhas', 'Atacadão das Malhas', 'Prospecção ativa', 'novo', 'Enviar DM de abertura'
   where not exists (select 1 from prospeccao where codigo = 'L008')
  returning id
)
insert into prospeccao
  (lead_id, codigo, instagram, instagram_url, cidade, uf, regiao, segmento,
   modelo_venda, fabricacao_propria, situacao_site, seguidores, prioridade,
   oportunidade, gancho, mensagem_abertura, perguntas, canal, notas)
select novo.id, 'L008', '@atacadaodasmalhas', 'https://www.instagram.com/atacadaodasmalhas/', 'Brusque', 'SC', 'Vale do Itajaí', 'Tricot',
       'Atacado', 'Sim', 'Tem link de compra (verificar)', 121000, 'A',
       'Novo e-commerce ou upgrade', 'Têm mais de 120 mil seguidores e loja de fábrica de tricot', 'Oi, tudo bem? Aqui é o Angelo, da Vettor 28. Vi que vocês têm mais de 120 mil seguidores e loja de fábrica de tricot. A gente monta loja online para fábricas de moda venderem direto ao cliente final e ao lojista, sem depender só do WhatsApp. Posso te mostrar como ficaria para a Atacadão das Malhas?', 'Hoje quanto das vendas vem do WhatsApp/Instagram? O que mais incomoda no site atual?', 'Instagram DM', null
  from novo;

-- L009 · La Miller Tricot · Brusque/SC
with novo as (
  insert into lead (nome, empresa, origem, estagio, proximo_passo)
  select '@lamilleratacado', 'La Miller Tricot', 'Prospecção ativa', 'novo', 'Enviar DM de abertura'
   where not exists (select 1 from prospeccao where codigo = 'L009')
  returning id
)
insert into prospeccao
  (lead_id, codigo, instagram, instagram_url, cidade, uf, regiao, segmento,
   modelo_venda, fabricacao_propria, situacao_site, seguidores, prioridade,
   oportunidade, gancho, mensagem_abertura, perguntas, canal, notas)
select novo.id, 'L009', '@lamilleratacado', 'https://www.instagram.com/lamilleratacado/', 'Brusque', 'SC', 'Vale do Itajaí', 'Tricot',
       'Atacado', 'Sim', 'Verificar link da bio', 19000, 'B',
       'Novo e-commerce', 'Fabricam tricot no All Shopping com envio imediato', 'Oi, tudo bem? Aqui é o Angelo, da Vettor 28. Vi que vocês fabricam tricot no All Shopping com envio imediato. A gente monta loja online para fábricas de moda venderem direto ao cliente final e ao lojista, sem depender só do WhatsApp. Posso te mostrar como ficaria para a La Miller Tricot?', 'Hoje quanto das vendas vem do WhatsApp/Instagram? Já pensaram em ter loja online própria?', 'Instagram DM', null
  from novo;

-- L010 · Vida Fit · Brusque/SC
with novo as (
  insert into lead (nome, empresa, origem, estagio, proximo_passo)
  select '@vidafitatacado', 'Vida Fit', 'Prospecção ativa', 'novo', 'Enviar DM de abertura'
   where not exists (select 1 from prospeccao where codigo = 'L010')
  returning id
)
insert into prospeccao
  (lead_id, codigo, instagram, instagram_url, cidade, uf, regiao, segmento,
   modelo_venda, fabricacao_propria, situacao_site, seguidores, prioridade,
   oportunidade, gancho, mensagem_abertura, perguntas, canal, notas)
select novo.id, 'L010', '@vidafitatacado', 'https://www.instagram.com/vidafitatacado/', 'Brusque', 'SC', 'Vale do Itajaí', 'Moda fitness',
       'Somente atacado', 'Sim', 'Verificar link da bio', 4800, 'B',
       'Novo e-commerce (B2B)', 'Fabricam fitness e vendem 100% no atacado', 'Oi, tudo bem? Aqui é o Angelo, da Vettor 28. Vi que vocês fabricam fitness e vendem 100% no atacado. A gente monta loja online de atacado para fábricas, com catálogo, pedido mínimo e área do lojista, tirando o pedido do WhatsApp. Posso te mostrar como ficaria para a Vida Fit?', 'Hoje quanto das vendas vem do WhatsApp/Instagram? Já pensaram em ter loja online própria?', 'Instagram DM', null
  from novo;

-- L011 · De Pijama Brusque · Brusque/SC
with novo as (
  insert into lead (nome, empresa, origem, estagio, proximo_passo)
  select '@loja.depijamabrusque', 'De Pijama Brusque', 'Prospecção ativa', 'novo', 'Enviar DM de abertura'
   where not exists (select 1 from prospeccao where codigo = 'L011')
  returning id
)
insert into prospeccao
  (lead_id, codigo, instagram, instagram_url, cidade, uf, regiao, segmento,
   modelo_venda, fabricacao_propria, situacao_site, seguidores, prioridade,
   oportunidade, gancho, mensagem_abertura, perguntas, canal, notas)
select novo.id, 'L011', '@loja.depijamabrusque', 'https://www.instagram.com/loja.depijamabrusque/', 'Brusque', 'SC', 'Vale do Itajaí', 'Pijamas',
       'Atacado e varejo', 'Sim', 'Tem link de compra (verificar)', 3000, 'B',
       'Novo e-commerce ou upgrade', 'Fabricam pijamas e já vendem online', 'Oi, tudo bem? Aqui é o Angelo, da Vettor 28. Vi que vocês fabricam pijamas e já vendem online. A gente monta loja online para fábricas de moda venderem direto ao cliente final e ao lojista, sem depender só do WhatsApp. Posso te mostrar como ficaria para a De Pijama Brusque?', 'Hoje quanto das vendas vem do WhatsApp/Instagram? O que mais incomoda no site atual?', 'Instagram DM', null
  from novo;

-- L012 · Leleco Peteleco · Brusque/SC
with novo as (
  insert into lead (nome, empresa, origem, estagio, proximo_passo)
  select '@lelecopeteleco.com.br', 'Leleco Peteleco', 'Prospecção ativa', 'novo', 'Enviar DM de abertura'
   where not exists (select 1 from prospeccao where codigo = 'L012')
  returning id
)
insert into prospeccao
  (lead_id, codigo, instagram, instagram_url, cidade, uf, regiao, segmento,
   modelo_venda, fabricacao_propria, situacao_site, seguidores, prioridade,
   oportunidade, gancho, mensagem_abertura, perguntas, canal, notas)
select novo.id, 'L012', '@lelecopeteleco.com.br', 'https://www.instagram.com/lelecopeteleco.com.br/', 'Brusque', 'SC', 'Vale do Itajaí', 'Infantil e juvenil',
       'Atacado', 'Sim', 'Vende pelo WhatsApp', 153000, 'A',
       'Novo e-commerce (B2B)', 'São fabricantes infantis com mais de 150 mil seguidores atendendo pelo WhatsApp', 'Oi, tudo bem? Aqui é o Angelo, da Vettor 28. Vi que vocês são fabricantes infantis com mais de 150 mil seguidores atendendo pelo WhatsApp. A gente monta loja online de atacado para fábricas, com catálogo, pedido mínimo e área do lojista, tirando o pedido do WhatsApp. Posso te mostrar como ficaria para a Leleco Peteleco?', 'Hoje quanto das vendas vem do WhatsApp/Instagram? Já pensaram em ter loja online própria?', 'Instagram DM', null
  from novo;

-- L013 · Pega Mania · Brusque/SC
with novo as (
  insert into lead (nome, empresa, origem, estagio, proximo_passo)
  select '@pega_mania', 'Pega Mania', 'Prospecção ativa', 'novo', 'Enviar DM de abertura'
   where not exists (select 1 from prospeccao where codigo = 'L013')
  returning id
)
insert into prospeccao
  (lead_id, codigo, instagram, instagram_url, cidade, uf, regiao, segmento,
   modelo_venda, fabricacao_propria, situacao_site, seguidores, prioridade,
   oportunidade, gancho, mensagem_abertura, perguntas, canal, notas)
select novo.id, 'L013', '@pega_mania', 'https://www.instagram.com/pega_mania/', 'Brusque', 'SC', 'Vale do Itajaí', 'Infantil',
       'Atacado', 'Sim', 'Tem site antigo', null, 'A',
       'Upgrade de site', 'Produzem infantil e estão na maioria dos estados', 'Oi, tudo bem? Aqui é o Angelo, da Vettor 28. Vi que vocês produzem infantil e estão na maioria dos estados. Queria te mostrar como a Pega Mania poderia vender mais com uma loja online mais rápida e bem estruturada. Posso te mandar uma ideia?', 'Hoje quanto das vendas vem do WhatsApp/Instagram? O que mais incomoda no site atual?', 'Instagram DM', null
  from novo;

-- L014 · Iduna Fitness · Brusque/SC
with novo as (
  insert into lead (nome, empresa, origem, estagio, proximo_passo)
  select '@idunafitness', 'Iduna Fitness', 'Prospecção ativa', 'novo', 'Enviar DM de abertura'
   where not exists (select 1 from prospeccao where codigo = 'L014')
  returning id
)
insert into prospeccao
  (lead_id, codigo, instagram, instagram_url, cidade, uf, regiao, segmento,
   modelo_venda, fabricacao_propria, situacao_site, seguidores, prioridade,
   oportunidade, gancho, mensagem_abertura, perguntas, canal, notas)
select novo.id, 'L014', '@idunafitness', 'https://www.instagram.com/idunafitness/', 'Brusque', 'SC', 'Vale do Itajaí', 'Moda fitness',
       'Atacado e varejo', 'Sim', 'Tem link de loja (verificar)', 31000, 'B',
       'Upgrade de site', 'Têm loja de fábrica fitness vendendo para todo o Brasil', 'Oi, tudo bem? Aqui é o Angelo, da Vettor 28. Vi que vocês têm loja de fábrica fitness vendendo para todo o Brasil. Queria te mostrar como a Iduna Fitness poderia vender mais com uma loja online mais rápida e bem estruturada. Posso te mandar uma ideia?', 'Hoje quanto das vendas vem do WhatsApp/Instagram? O que mais incomoda no site atual?', 'Instagram DM', null
  from novo;

-- L015 · Brulini Moda Íntima · Brusque/SC
with novo as (
  insert into lead (nome, empresa, origem, estagio, proximo_passo)
  select '@brulinimodaintima', 'Brulini Moda Íntima', 'Prospecção ativa', 'novo', 'Enviar DM de abertura'
   where not exists (select 1 from prospeccao where codigo = 'L015')
  returning id
)
insert into prospeccao
  (lead_id, codigo, instagram, instagram_url, cidade, uf, regiao, segmento,
   modelo_venda, fabricacao_propria, situacao_site, seguidores, prioridade,
   oportunidade, gancho, mensagem_abertura, perguntas, canal, notas)
select novo.id, 'L015', '@brulinimodaintima', 'https://www.instagram.com/brulinimodaintima/', 'Brusque', 'SC', 'Vale do Itajaí', 'Moda íntima',
       'Atacado e varejo', 'Sim', 'Verificar link da bio', null, 'B',
       'Novo e-commerce', 'Produzem moda íntima direto da fábrica', 'Oi, tudo bem? Aqui é o Angelo, da Vettor 28. Vi que vocês produzem moda íntima direto da fábrica. A gente monta loja online para fábricas de moda venderem direto ao cliente final e ao lojista, sem depender só do WhatsApp. Posso te mostrar como ficaria para a Brulini Moda Íntima?', 'Hoje quanto das vendas vem do WhatsApp/Instagram? Já pensaram em ter loja online própria?', 'Instagram DM', null
  from novo;

-- L016 · Summer Girl · Guabiruba/SC
with novo as (
  insert into lead (nome, empresa, origem, estagio, proximo_passo)
  select '@summergirlconfeccoes', 'Summer Girl', 'Prospecção ativa', 'novo', 'Enviar DM de abertura'
   where not exists (select 1 from prospeccao where codigo = 'L016')
  returning id
)
insert into prospeccao
  (lead_id, codigo, instagram, instagram_url, cidade, uf, regiao, segmento,
   modelo_venda, fabricacao_propria, situacao_site, seguidores, prioridade,
   oportunidade, gancho, mensagem_abertura, perguntas, canal, notas)
select novo.id, 'L016', '@summergirlconfeccoes', 'https://www.instagram.com/summergirlconfeccoes/', 'Guabiruba', 'SC', 'Vale do Itajaí', 'Moda feminina',
       'Atacado e private label', 'Sim', 'Instagram pouco ativo', 616, 'A',
       'Novo e-commerce (B2B)', 'Têm mais de 20 anos no atacado e selo ABVTEX', 'Oi, tudo bem? Aqui é o Angelo, da Vettor 28. Vi que vocês têm mais de 20 anos no atacado e selo ABVTEX. A gente monta loja online de atacado para fábricas, com catálogo, pedido mínimo e área do lojista, tirando o pedido do WhatsApp. Posso te mostrar como ficaria para a Summer Girl?', 'Hoje quanto das vendas vem do WhatsApp/Instagram? Já pensaram em ter loja online própria?', 'Instagram DM', null
  from novo;

-- L017 · Xá Plus · Brusque/SC
with novo as (
  insert into lead (nome, empresa, origem, estagio, proximo_passo)
  select '@xaplusatacado', 'Xá Plus', 'Prospecção ativa', 'novo', 'Enviar DM de abertura'
   where not exists (select 1 from prospeccao where codigo = 'L017')
  returning id
)
insert into prospeccao
  (lead_id, codigo, instagram, instagram_url, cidade, uf, regiao, segmento,
   modelo_venda, fabricacao_propria, situacao_site, seguidores, prioridade,
   oportunidade, gancho, mensagem_abertura, perguntas, canal, notas)
select novo.id, 'L017', '@xaplusatacado', 'https://www.instagram.com/xaplusatacado/', 'Brusque', 'SC', 'Vale do Itajaí', 'Plus size feminino',
       'Somente atacado', 'Confirmar', 'Verificar link da bio', 25000, 'B',
       'Novo e-commerce (B2B)', 'Atendem lojistas de plus size no Master Shopping', 'Oi, tudo bem? Aqui é o Angelo, da Vettor 28. Vi que vocês atendem lojistas de plus size no Master Shopping. A gente monta loja online de atacado para fábricas, com catálogo, pedido mínimo e área do lojista, tirando o pedido do WhatsApp. Posso te mostrar como ficaria para a Xá Plus?', 'Vocês fabricam as peças ou revendem? Hoje quanto das vendas vem do WhatsApp/Instagram? Já pensaram em ter loja online própria?', 'Instagram DM', null
  from novo;

-- L018 · Alekids · Gaspar/SC
with novo as (
  insert into lead (nome, empresa, origem, estagio, proximo_passo)
  select '@alekidsoficial', 'Alekids', 'Prospecção ativa', 'novo', 'Enviar DM de abertura'
   where not exists (select 1 from prospeccao where codigo = 'L018')
  returning id
)
insert into prospeccao
  (lead_id, codigo, instagram, instagram_url, cidade, uf, regiao, segmento,
   modelo_venda, fabricacao_propria, situacao_site, seguidores, prioridade,
   oportunidade, gancho, mensagem_abertura, perguntas, canal, notas)
select novo.id, 'L018', '@alekidsoficial', 'https://www.instagram.com/alekidsoficial/', 'Gaspar', 'SC', 'Vale do Itajaí', 'Infantil',
       'Somente atacado', 'Sim', 'Tem link (verificar)', 119000, 'A',
       'Novo e-commerce (B2B)', 'Têm quase 120 mil seguidores e coleções exclusivas no atacado', 'Oi, tudo bem? Aqui é o Angelo, da Vettor 28. Vi que vocês têm quase 120 mil seguidores e coleções exclusivas no atacado. A gente monta loja online de atacado para fábricas, com catálogo, pedido mínimo e área do lojista, tirando o pedido do WhatsApp. Posso te mostrar como ficaria para a Alekids?', 'Hoje quanto das vendas vem do WhatsApp/Instagram? O que mais incomoda no site atual?', 'Instagram DM', null
  from novo;

-- L019 · Lunedi · Gaspar/SC
with novo as (
  insert into lead (nome, empresa, origem, estagio, proximo_passo)
  select '@lunedioficial', 'Lunedi', 'Prospecção ativa', 'novo', 'Enviar DM de abertura'
   where not exists (select 1 from prospeccao where codigo = 'L019')
  returning id
)
insert into prospeccao
  (lead_id, codigo, instagram, instagram_url, cidade, uf, regiao, segmento,
   modelo_venda, fabricacao_propria, situacao_site, seguidores, prioridade,
   oportunidade, gancho, mensagem_abertura, perguntas, canal, notas)
select novo.id, 'L019', '@lunedioficial', 'https://www.instagram.com/lunedioficial/', 'Gaspar', 'SC', 'Vale do Itajaí', 'Infantil',
       'Atacado (CNPJ)', 'Sim', 'Verificar link da bio', 17000, 'B',
       'Novo e-commerce (B2B)', 'Atendem lojistas do P ao 16 direto de Gaspar', 'Oi, tudo bem? Aqui é o Angelo, da Vettor 28. Vi que vocês atendem lojistas do P ao 16 direto de Gaspar. A gente monta loja online de atacado para fábricas, com catálogo, pedido mínimo e área do lojista, tirando o pedido do WhatsApp. Posso te mostrar como ficaria para a Lunedi?', 'Hoje quanto das vendas vem do WhatsApp/Instagram? Já pensaram em ter loja online própria?', 'Instagram DM', null
  from novo;

-- L020 · Rollu · Gaspar/SC
with novo as (
  insert into lead (nome, empresa, origem, estagio, proximo_passo)
  select '@rolluoficial', 'Rollu', 'Prospecção ativa', 'novo', 'Enviar DM de abertura'
   where not exists (select 1 from prospeccao where codigo = 'L020')
  returning id
)
insert into prospeccao
  (lead_id, codigo, instagram, instagram_url, cidade, uf, regiao, segmento,
   modelo_venda, fabricacao_propria, situacao_site, seguidores, prioridade,
   oportunidade, gancho, mensagem_abertura, perguntas, canal, notas)
select novo.id, 'L020', '@rolluoficial', 'https://www.instagram.com/rolluoficial/', 'Gaspar', 'SC', 'Vale do Itajaí', 'Infantil',
       'Atacado', 'Sim', 'Catálogo para lojistas', 17000, 'B',
       'Novo e-commerce (B2B)', 'São uma indústria com 36 anos no infantil', 'Oi, tudo bem? Aqui é o Angelo, da Vettor 28. Vi que vocês são uma indústria com 36 anos no infantil. A gente monta loja online de atacado para fábricas, com catálogo, pedido mínimo e área do lojista, tirando o pedido do WhatsApp. Posso te mostrar como ficaria para a Rollu?', 'Hoje quanto das vendas vem do WhatsApp/Instagram? Já pensaram em ter loja online própria?', 'Instagram DM', null
  from novo;

-- L021 · TMX Kids & Teens · Gaspar/SC
with novo as (
  insert into lead (nome, empresa, origem, estagio, proximo_passo)
  select '@tmxkidseteens', 'TMX Kids & Teens', 'Prospecção ativa', 'novo', 'Enviar DM de abertura'
   where not exists (select 1 from prospeccao where codigo = 'L021')
  returning id
)
insert into prospeccao
  (lead_id, codigo, instagram, instagram_url, cidade, uf, regiao, segmento,
   modelo_venda, fabricacao_propria, situacao_site, seguidores, prioridade,
   oportunidade, gancho, mensagem_abertura, perguntas, canal, notas)
select novo.id, 'L021', '@tmxkidseteens', 'https://www.instagram.com/tmxkidseteens/', 'Gaspar', 'SC', 'Vale do Itajaí', 'Bebê a juvenil',
       'Somente atacado', 'Sim', 'Vendas por e-mail', 29000, 'A',
       'Novo e-commerce (B2B)', 'Vendem bebê a juvenil no atacado e hoje o pedido é por e-mail', 'Oi, tudo bem? Aqui é o Angelo, da Vettor 28. Vi que vocês vendem bebê a juvenil no atacado e hoje o pedido é por e-mail. A gente monta loja online de atacado para fábricas, com catálogo, pedido mínimo e área do lojista, tirando o pedido do WhatsApp. Posso te mostrar como ficaria para a TMX Kids & Teens?', 'Hoje quanto das vendas vem do WhatsApp/Instagram? Já pensaram em ter loja online própria?', 'Instagram DM', null
  from novo;

-- L022 · Jidi Kids · Gaspar/SC
with novo as (
  insert into lead (nome, empresa, origem, estagio, proximo_passo)
  select '@jidikids', 'Jidi Kids', 'Prospecção ativa', 'novo', 'Enviar DM de abertura'
   where not exists (select 1 from prospeccao where codigo = 'L022')
  returning id
)
insert into prospeccao
  (lead_id, codigo, instagram, instagram_url, cidade, uf, regiao, segmento,
   modelo_venda, fabricacao_propria, situacao_site, seguidores, prioridade,
   oportunidade, gancho, mensagem_abertura, perguntas, canal, notas)
select novo.id, 'L022', '@jidikids', 'https://www.instagram.com/jidikids/', 'Gaspar', 'SC', 'Vale do Itajaí', 'Infantil',
       'Somente atacado', 'Sim', 'Contato direto', 17000, 'B',
       'Novo e-commerce (B2B)', 'Têm confecção infantil própria em Gaspar', 'Oi, tudo bem? Aqui é o Angelo, da Vettor 28. Vi que vocês têm confecção infantil própria em Gaspar. A gente monta loja online de atacado para fábricas, com catálogo, pedido mínimo e área do lojista, tirando o pedido do WhatsApp. Posso te mostrar como ficaria para a Jidi Kids?', 'Hoje quanto das vendas vem do WhatsApp/Instagram? Já pensaram em ter loja online própria?', 'Instagram DM', null
  from novo;

-- L023 · Serelepe Kids · Gaspar/SC
with novo as (
  insert into lead (nome, empresa, origem, estagio, proximo_passo)
  select '@serelepekidsoficial', 'Serelepe Kids', 'Prospecção ativa', 'novo', 'Enviar DM de abertura'
   where not exists (select 1 from prospeccao where codigo = 'L023')
  returning id
)
insert into prospeccao
  (lead_id, codigo, instagram, instagram_url, cidade, uf, regiao, segmento,
   modelo_venda, fabricacao_propria, situacao_site, seguidores, prioridade,
   oportunidade, gancho, mensagem_abertura, perguntas, canal, notas)
select novo.id, 'L023', '@serelepekidsoficial', 'https://www.instagram.com/serelepekidsoficial/', 'Gaspar', 'SC', 'Vale do Itajaí', 'Infantil',
       'Atacado', 'Sim', 'Verificar link da bio', null, 'B',
       'Novo e-commerce ou upgrade', 'Fabricam infantil em Gaspar desde 2003', 'Oi, tudo bem? Aqui é o Angelo, da Vettor 28. Vi que vocês fabricam infantil em Gaspar desde 2003. A gente monta loja online para fábricas de moda venderem direto ao cliente final e ao lojista, sem depender só do WhatsApp. Posso te mostrar como ficaria para a Serelepe Kids?', 'Hoje quanto das vendas vem do WhatsApp/Instagram? Já pensaram em ter loja online própria?', 'Instagram DM', null
  from novo;

-- L024 · PHO Kids · Gaspar/SC
with novo as (
  insert into lead (nome, empresa, origem, estagio, proximo_passo)
  select '@phokidsoficial', 'PHO Kids', 'Prospecção ativa', 'novo', 'Enviar DM de abertura'
   where not exists (select 1 from prospeccao where codigo = 'L024')
  returning id
)
insert into prospeccao
  (lead_id, codigo, instagram, instagram_url, cidade, uf, regiao, segmento,
   modelo_venda, fabricacao_propria, situacao_site, seguidores, prioridade,
   oportunidade, gancho, mensagem_abertura, perguntas, canal, notas)
select novo.id, 'L024', '@phokidsoficial', 'https://www.instagram.com/phokidsoficial/', 'Gaspar', 'SC', 'Vale do Itajaí', 'Infantil (RN ao 16)',
       'Atacado', 'Sim', 'Tem link de compra (verificar)', 64000, 'A',
       'Upgrade de site', 'Têm confecção própria e 64 mil seguidores no atacado infantil', 'Oi, tudo bem? Aqui é o Angelo, da Vettor 28. Vi que vocês têm confecção própria e 64 mil seguidores no atacado infantil. Queria te mostrar como a PHO Kids poderia vender mais com uma loja online mais rápida e bem estruturada. Posso te mandar uma ideia?', 'Hoje quanto das vendas vem do WhatsApp/Instagram? O que mais incomoda no site atual?', 'Instagram DM', null
  from novo;

-- L025 · DHC Atacado Infantil · Gaspar/SC
with novo as (
  insert into lead (nome, empresa, origem, estagio, proximo_passo)
  select '@dhc_atacado', 'DHC Atacado Infantil', 'Prospecção ativa', 'novo', 'Enviar DM de abertura'
   where not exists (select 1 from prospeccao where codigo = 'L025')
  returning id
)
insert into prospeccao
  (lead_id, codigo, instagram, instagram_url, cidade, uf, regiao, segmento,
   modelo_venda, fabricacao_propria, situacao_site, seguidores, prioridade,
   oportunidade, gancho, mensagem_abertura, perguntas, canal, notas)
select novo.id, 'L025', '@dhc_atacado', 'https://www.instagram.com/dhc_atacado/', 'Gaspar', 'SC', 'Vale do Itajaí', 'Infantil',
       'Atacado', 'Confirmar', 'Verificar link da bio', null, 'C',
       'Novo e-commerce (B2B)', 'Atendem atacado infantil em Gaspar', 'Oi, tudo bem? Aqui é o Angelo, da Vettor 28. Vi que vocês atendem atacado infantil em Gaspar. A gente monta loja online de atacado para fábricas, com catálogo, pedido mínimo e área do lojista, tirando o pedido do WhatsApp. Posso te mostrar como ficaria para a DHC Atacado Infantil?', 'Vocês fabricam as peças ou revendem? Hoje quanto das vendas vem do WhatsApp/Instagram? Já pensaram em ter loja online própria?', 'Instagram DM', null
  from novo;

-- L026 · Vanetex · Blumenau/SC
with novo as (
  insert into lead (nome, empresa, origem, estagio, proximo_passo)
  select '@vanetexmodainfantil', 'Vanetex', 'Prospecção ativa', 'novo', 'Enviar DM de abertura'
   where not exists (select 1 from prospeccao where codigo = 'L026')
  returning id
)
insert into prospeccao
  (lead_id, codigo, instagram, instagram_url, cidade, uf, regiao, segmento,
   modelo_venda, fabricacao_propria, situacao_site, seguidores, prioridade,
   oportunidade, gancho, mensagem_abertura, perguntas, canal, notas)
select novo.id, 'L026', '@vanetexmodainfantil', 'https://www.instagram.com/vanetexmodainfantil/', 'Blumenau', 'SC', 'Vale do Itajaí', 'Infantil',
       'Varejo (marketplaces) e loja física', 'Sim', 'Só marketplaces', 4700, 'A',
       'Novo e-commerce', 'Fabricam infantil e hoje dependem de Mercado Livre, Shein e TikTok', 'Oi, tudo bem? Aqui é o Angelo, da Vettor 28. Vi que vocês fabricam infantil e hoje dependem de Mercado Livre, Shein e TikTok. A gente monta loja online para fábricas de moda venderem direto ao cliente final e ao lojista, sem depender só do WhatsApp. Posso te mostrar como ficaria para a Vanetex?', 'Hoje quanto das vendas vem do WhatsApp/Instagram? Já pensaram em ter loja online própria?', 'Instagram DM', null
  from novo;

-- L027 · Lua da Moda Confecções · Blumenau/SC
with novo as (
  insert into lead (nome, empresa, origem, estagio, proximo_passo)
  select '@luadamoda_', 'Lua da Moda Confecções', 'Prospecção ativa', 'novo', 'Enviar DM de abertura'
   where not exists (select 1 from prospeccao where codigo = 'L027')
  returning id
)
insert into prospeccao
  (lead_id, codigo, instagram, instagram_url, cidade, uf, regiao, segmento,
   modelo_venda, fabricacao_propria, situacao_site, seguidores, prioridade,
   oportunidade, gancho, mensagem_abertura, perguntas, canal, notas)
select novo.id, 'L027', '@luadamoda_', 'https://www.instagram.com/luadamoda_/', 'Blumenau', 'SC', 'Vale do Itajaí', 'Moda (geral)',
       'A confirmar', 'Sim', 'Verificar link da bio', null, 'C',
       'Novo e-commerce', 'Têm confecção própria em Blumenau', 'Oi, tudo bem? Aqui é o Angelo, da Vettor 28. Vi que vocês têm confecção própria em Blumenau. A gente monta loja online para fábricas de moda venderem direto ao cliente final e ao lojista, sem depender só do WhatsApp. Posso te mostrar como ficaria para a Lua da Moda Confecções?', 'Hoje quanto das vendas vem do WhatsApp/Instagram? Já pensaram em ter loja online própria?', 'Instagram DM', null
  from novo;

-- L028 · AltSide · Blumenau/SC
with novo as (
  insert into lead (nome, empresa, origem, estagio, proximo_passo)
  select '@altsideoficial', 'AltSide', 'Prospecção ativa', 'novo', 'Enviar DM de abertura'
   where not exists (select 1 from prospeccao where codigo = 'L028')
  returning id
)
insert into prospeccao
  (lead_id, codigo, instagram, instagram_url, cidade, uf, regiao, segmento,
   modelo_venda, fabricacao_propria, situacao_site, seguidores, prioridade,
   oportunidade, gancho, mensagem_abertura, perguntas, canal, notas)
select novo.id, 'L028', '@altsideoficial', 'https://www.instagram.com/altsideoficial/', 'Blumenau', 'SC', 'Vale do Itajaí', 'Moda fitness',
       'Atacado e varejo', 'Sim', 'Tem link de compra (verificar)', 492, 'C',
       'Novo e-commerce ou upgrade', 'Estão começando uma marca fitness com fabricação própria', 'Oi, tudo bem? Aqui é o Angelo, da Vettor 28. Vi que vocês estão começando uma marca fitness com fabricação própria. A gente monta loja online para fábricas de moda venderem direto ao cliente final e ao lojista, sem depender só do WhatsApp. Posso te mostrar como ficaria para a AltSide?', 'Hoje quanto das vendas vem do WhatsApp/Instagram? O que mais incomoda no site atual?', 'Instagram DM', null
  from novo;

-- L029 · Kunsler · Timbó/Indaial/SC
with novo as (
  insert into lead (nome, empresa, origem, estagio, proximo_passo)
  select '@kunsler_moda_intima', 'Kunsler', 'Prospecção ativa', 'novo', 'Enviar DM de abertura'
   where not exists (select 1 from prospeccao where codigo = 'L029')
  returning id
)
insert into prospeccao
  (lead_id, codigo, instagram, instagram_url, cidade, uf, regiao, segmento,
   modelo_venda, fabricacao_propria, situacao_site, seguidores, prioridade,
   oportunidade, gancho, mensagem_abertura, perguntas, canal, notas)
select novo.id, 'L029', '@kunsler_moda_intima', 'https://www.instagram.com/kunsler_moda_intima/', 'Timbó/Indaial', 'SC', 'Vale do Itajaí', 'Moda íntima',
       'Varejo', 'Sim', 'Tem loja online (verificar)', 7700, 'C',
       'Upgrade de site', 'Fabricam moda íntima do infantil ao adulto', 'Oi, tudo bem? Aqui é o Angelo, da Vettor 28. Vi que vocês fabricam moda íntima do infantil ao adulto. Queria te mostrar como a Kunsler poderia vender mais com uma loja online mais rápida e bem estruturada. Posso te mandar uma ideia?', 'Hoje quanto das vendas vem do WhatsApp/Instagram? O que mais incomoda no site atual?', 'Instagram DM', null
  from novo;

-- L030 · Maria Guilhermina · Indaial/SC
with novo as (
  insert into lead (nome, empresa, origem, estagio, proximo_passo)
  select '@lojamariaguilherminaindaial', 'Maria Guilhermina', 'Prospecção ativa', 'novo', 'Enviar DM de abertura'
   where not exists (select 1 from prospeccao where codigo = 'L030')
  returning id
)
insert into prospeccao
  (lead_id, codigo, instagram, instagram_url, cidade, uf, regiao, segmento,
   modelo_venda, fabricacao_propria, situacao_site, seguidores, prioridade,
   oportunidade, gancho, mensagem_abertura, perguntas, canal, notas)
select novo.id, 'L030', '@lojamariaguilherminaindaial', 'https://www.instagram.com/lojamariaguilherminaindaial/', 'Indaial', 'SC', 'Vale do Itajaí', 'Moda feminina',
       'Varejo', 'Sim', 'Verificar link da bio', 35000, 'A',
       'Novo e-commerce', 'Têm confecção própria e 35 mil seguidores', 'Oi, tudo bem? Aqui é o Angelo, da Vettor 28. Vi que vocês têm confecção própria e 35 mil seguidores. A gente monta loja online para fábricas de moda venderem direto ao cliente final e ao lojista, sem depender só do WhatsApp. Posso te mostrar como ficaria para a Maria Guilhermina?', 'Hoje quanto das vendas vem do WhatsApp/Instagram? Já pensaram em ter loja online própria?', 'Instagram DM', null
  from novo;

-- L031 · Outlet Arte D'Vestir · Indaial/SC
with novo as (
  insert into lead (nome, empresa, origem, estagio, proximo_passo)
  select '@outlet_artedvestir', 'Outlet Arte D''Vestir', 'Prospecção ativa', 'novo', 'Enviar DM de abertura'
   where not exists (select 1 from prospeccao where codigo = 'L031')
  returning id
)
insert into prospeccao
  (lead_id, codigo, instagram, instagram_url, cidade, uf, regiao, segmento,
   modelo_venda, fabricacao_propria, situacao_site, seguidores, prioridade,
   oportunidade, gancho, mensagem_abertura, perguntas, canal, notas)
select novo.id, 'L031', '@outlet_artedvestir', 'https://www.instagram.com/outlet_artedvestir/', 'Indaial', 'SC', 'Vale do Itajaí', 'Feminino, masculino e infantil',
       'Varejo', 'Sim', 'Loja física', 37000, 'A',
       'Novo e-commerce', 'Vendem direto da fábrica no varejo com 37 mil seguidores', 'Oi, tudo bem? Aqui é o Angelo, da Vettor 28. Vi que vocês vendem direto da fábrica no varejo com 37 mil seguidores. A gente monta loja online para fábricas de moda venderem direto ao cliente final e ao lojista, sem depender só do WhatsApp. Posso te mostrar como ficaria para a Outlet Arte D''Vestir?', 'Hoje quanto das vendas vem do WhatsApp/Instagram? Já pensaram em ter loja online própria?', 'Instagram DM', null
  from novo;

-- L032 · Rio Açu · Ilhota/SC
with novo as (
  insert into lead (nome, empresa, origem, estagio, proximo_passo)
  select '@rioacu.oficial', 'Rio Açu', 'Prospecção ativa', 'novo', 'Enviar DM de abertura'
   where not exists (select 1 from prospeccao where codigo = 'L032')
  returning id
)
insert into prospeccao
  (lead_id, codigo, instagram, instagram_url, cidade, uf, regiao, segmento,
   modelo_venda, fabricacao_propria, situacao_site, seguidores, prioridade,
   oportunidade, gancho, mensagem_abertura, perguntas, canal, notas)
select novo.id, 'L032', '@rioacu.oficial', 'https://www.instagram.com/rioacu.oficial/', 'Ilhota', 'SC', 'Vale do Itajaí', 'Moda praia e lingerie',
       'Atacado e varejo', 'Sim', 'Tem link de compra (verificar)', 29000, 'B',
       'Upgrade de site', 'Fabricam moda praia e lingerie desde 1991', 'Oi, tudo bem? Aqui é o Angelo, da Vettor 28. Vi que vocês fabricam moda praia e lingerie desde 1991. Queria te mostrar como a Rio Açu poderia vender mais com uma loja online mais rápida e bem estruturada. Posso te mandar uma ideia?', 'Hoje quanto das vendas vem do WhatsApp/Instagram? O que mais incomoda no site atual?', 'Instagram DM', null
  from novo;

-- L033 · Ilhas Rio · Ilhota/SC
with novo as (
  insert into lead (nome, empresa, origem, estagio, proximo_passo)
  select '@ilhasrio', 'Ilhas Rio', 'Prospecção ativa', 'novo', 'Enviar DM de abertura'
   where not exists (select 1 from prospeccao where codigo = 'L033')
  returning id
)
insert into prospeccao
  (lead_id, codigo, instagram, instagram_url, cidade, uf, regiao, segmento,
   modelo_venda, fabricacao_propria, situacao_site, seguidores, prioridade,
   oportunidade, gancho, mensagem_abertura, perguntas, canal, notas)
select novo.id, 'L033', '@ilhasrio', 'https://www.instagram.com/ilhasrio/', 'Ilhota', 'SC', 'Vale do Itajaí', 'Praia, esportiva e íntima',
       'Atacado e varejo', 'Sim', 'Tem loja online (verificar)', 40000, 'B',
       'Upgrade de site', 'Têm 36 anos de moda praia em Ilhota', 'Oi, tudo bem? Aqui é o Angelo, da Vettor 28. Vi que vocês têm 36 anos de moda praia em Ilhota. Queria te mostrar como a Ilhas Rio poderia vender mais com uma loja online mais rápida e bem estruturada. Posso te mandar uma ideia?', 'Hoje quanto das vendas vem do WhatsApp/Instagram? O que mais incomoda no site atual?', 'Instagram DM', null
  from novo;

-- L034 · KSI · Ilhota/SC
with novo as (
  insert into lead (nome, empresa, origem, estagio, proximo_passo)
  select '@loja_ksi', 'KSI', 'Prospecção ativa', 'novo', 'Enviar DM de abertura'
   where not exists (select 1 from prospeccao where codigo = 'L034')
  returning id
)
insert into prospeccao
  (lead_id, codigo, instagram, instagram_url, cidade, uf, regiao, segmento,
   modelo_venda, fabricacao_propria, situacao_site, seguidores, prioridade,
   oportunidade, gancho, mensagem_abertura, perguntas, canal, notas)
select novo.id, 'L034', '@loja_ksi', 'https://www.instagram.com/loja_ksi/', 'Ilhota', 'SC', 'Vale do Itajaí', 'Fitness, lingerie e pijamas',
       'Atacado e varejo', 'Sim', 'Tem link de compra (verificar)', 24000, 'B',
       'Upgrade de site', 'Produzem fitness, lingerie e pijamas desde 2005', 'Oi, tudo bem? Aqui é o Angelo, da Vettor 28. Vi que vocês produzem fitness, lingerie e pijamas desde 2005. Queria te mostrar como a KSI poderia vender mais com uma loja online mais rápida e bem estruturada. Posso te mandar uma ideia?', 'Hoje quanto das vendas vem do WhatsApp/Instagram? O que mais incomoda no site atual?', 'Instagram DM', null
  from novo;

-- L035 · Julemar Moda Íntima · Ilhota/SC
with novo as (
  insert into lead (nome, empresa, origem, estagio, proximo_passo)
  select '@julemarmodaintima', 'Julemar Moda Íntima', 'Prospecção ativa', 'novo', 'Enviar DM de abertura'
   where not exists (select 1 from prospeccao where codigo = 'L035')
  returning id
)
insert into prospeccao
  (lead_id, codigo, instagram, instagram_url, cidade, uf, regiao, segmento,
   modelo_venda, fabricacao_propria, situacao_site, seguidores, prioridade,
   oportunidade, gancho, mensagem_abertura, perguntas, canal, notas)
select novo.id, 'L035', '@julemarmodaintima', 'https://www.instagram.com/julemarmodaintima/', 'Ilhota', 'SC', 'Vale do Itajaí', 'Moda íntima',
       'Atacado e varejo', 'Sim', 'Verificar link da bio', 96000, 'A',
       'Novo e-commerce ou upgrade', 'Têm quase 100 mil seguidores e já exportam', 'Oi, tudo bem? Aqui é o Angelo, da Vettor 28. Vi que vocês têm quase 100 mil seguidores e já exportam. A gente monta loja online para fábricas de moda venderem direto ao cliente final e ao lojista, sem depender só do WhatsApp. Posso te mostrar como ficaria para a Julemar Moda Íntima?', 'Hoje quanto das vendas vem do WhatsApp/Instagram? Já pensaram em ter loja online própria?', 'Instagram DM', null
  from novo;

-- L036 · HP Moda Íntima · Ilhota/SC
with novo as (
  insert into lead (nome, empresa, origem, estagio, proximo_passo)
  select '@hp_modaintima', 'HP Moda Íntima', 'Prospecção ativa', 'novo', 'Enviar DM de abertura'
   where not exists (select 1 from prospeccao where codigo = 'L036')
  returning id
)
insert into prospeccao
  (lead_id, codigo, instagram, instagram_url, cidade, uf, regiao, segmento,
   modelo_venda, fabricacao_propria, situacao_site, seguidores, prioridade,
   oportunidade, gancho, mensagem_abertura, perguntas, canal, notas)
select novo.id, 'L036', '@hp_modaintima', 'https://www.instagram.com/hp_modaintima/', 'Ilhota', 'SC', 'Vale do Itajaí', 'Lingerie, pijamas e plus size',
       'Atacado e varejo', 'Sim', 'Site só para atacado', 66000, 'A',
       'Loja de varejo', 'Já têm site para atacadista mas não para o consumidor final', 'Oi, tudo bem? Aqui é o Angelo, da Vettor 28. Vi que vocês já têm site para atacadista mas não para o consumidor final. Queria te mostrar como a HP Moda Íntima poderia vender mais com uma loja online mais rápida e bem estruturada. Posso te mandar uma ideia?', 'Hoje quanto das vendas vem do WhatsApp/Instagram? O que mais incomoda no site atual?', 'Instagram DM', null
  from novo;

-- L037 · Dukali · Ilhota/SC
with novo as (
  insert into lead (nome, empresa, origem, estagio, proximo_passo)
  select '@dukalioficial', 'Dukali', 'Prospecção ativa', 'novo', 'Enviar DM de abertura'
   where not exists (select 1 from prospeccao where codigo = 'L037')
  returning id
)
insert into prospeccao
  (lead_id, codigo, instagram, instagram_url, cidade, uf, regiao, segmento,
   modelo_venda, fabricacao_propria, situacao_site, seguidores, prioridade,
   oportunidade, gancho, mensagem_abertura, perguntas, canal, notas)
select novo.id, 'L037', '@dukalioficial', 'https://www.instagram.com/dukalioficial/', 'Ilhota', 'SC', 'Vale do Itajaí', 'Moda íntima',
       'Varejo e atacado sem CNPJ', 'Sim', 'Vende pelo WhatsApp', 117000, 'A',
       'Novo e-commerce', 'Têm mais de 117 mil seguidores e vendem pelo WhatsApp', 'Oi, tudo bem? Aqui é o Angelo, da Vettor 28. Vi que vocês têm mais de 117 mil seguidores e vendem pelo WhatsApp. A gente monta loja online para fábricas de moda venderem direto ao cliente final e ao lojista, sem depender só do WhatsApp. Posso te mostrar como ficaria para a Dukali?', 'Hoje quanto das vendas vem do WhatsApp/Instagram? Já pensaram em ter loja online própria?', 'Instagram DM', null
  from novo;

-- L038 · Diara · Ilhota/Brusque/SC
with novo as (
  insert into lead (nome, empresa, origem, estagio, proximo_passo)
  select '@lojasdiara', 'Diara', 'Prospecção ativa', 'novo', 'Enviar DM de abertura'
   where not exists (select 1 from prospeccao where codigo = 'L038')
  returning id
)
insert into prospeccao
  (lead_id, codigo, instagram, instagram_url, cidade, uf, regiao, segmento,
   modelo_venda, fabricacao_propria, situacao_site, seguidores, prioridade,
   oportunidade, gancho, mensagem_abertura, perguntas, canal, notas)
select novo.id, 'L038', '@lojasdiara', 'https://www.instagram.com/lojasdiara/', 'Ilhota/Brusque', 'SC', 'Vale do Itajaí', 'Íntima, praia e linha noite',
       'Atacado e varejo', 'Confirmar', 'Tem loja online (verificar)', 27000, 'C',
       'Upgrade de site', 'Estão desde 1997 com lojas em Ilhota e Brusque', 'Oi, tudo bem? Aqui é o Angelo, da Vettor 28. Vi que vocês estão desde 1997 com lojas em Ilhota e Brusque. Queria te mostrar como a Diara poderia vender mais com uma loja online mais rápida e bem estruturada. Posso te mandar uma ideia?', 'Vocês fabricam as peças ou revendem? Hoje quanto das vendas vem do WhatsApp/Instagram? O que mais incomoda no site atual?', 'Instagram DM', null
  from novo;

-- L039 · Atacadão da Moda Íntima (Two) · Ilhota/Brusque/SC
with novo as (
  insert into lead (nome, empresa, origem, estagio, proximo_passo)
  select '@lojatwostylus', 'Atacadão da Moda Íntima (Two)', 'Prospecção ativa', 'novo', 'Enviar DM de abertura'
   where not exists (select 1 from prospeccao where codigo = 'L039')
  returning id
)
insert into prospeccao
  (lead_id, codigo, instagram, instagram_url, cidade, uf, regiao, segmento,
   modelo_venda, fabricacao_propria, situacao_site, seguidores, prioridade,
   oportunidade, gancho, mensagem_abertura, perguntas, canal, notas)
select novo.id, 'L039', '@lojatwostylus', 'https://www.instagram.com/lojatwostylus/', 'Ilhota/Brusque', 'SC', 'Vale do Itajaí', 'Moda íntima',
       'Atacado e varejo', 'Confirmar', 'Tem site (atacadotwo.com.br)', 25000, 'C',
       'Upgrade de site', 'Atendem atacado e varejo de moda íntima', 'Oi, tudo bem? Aqui é o Angelo, da Vettor 28. Vi que vocês atendem atacado e varejo de moda íntima. Queria te mostrar como a Atacadão da Moda Íntima (Two) poderia vender mais com uma loja online mais rápida e bem estruturada. Posso te mandar uma ideia?', 'Vocês fabricam as peças ou revendem? Hoje quanto das vendas vem do WhatsApp/Instagram? O que mais incomoda no site atual?', 'Instagram DM', null
  from novo;

-- L040 · Pamella Nattacha · Itajaí/SC
with novo as (
  insert into lead (nome, empresa, origem, estagio, proximo_passo)
  select '@pnconfeccao', 'Pamella Nattacha', 'Prospecção ativa', 'novo', 'Enviar DM de abertura'
   where not exists (select 1 from prospeccao where codigo = 'L040')
  returning id
)
insert into prospeccao
  (lead_id, codigo, instagram, instagram_url, cidade, uf, regiao, segmento,
   modelo_venda, fabricacao_propria, situacao_site, seguidores, prioridade,
   oportunidade, gancho, mensagem_abertura, perguntas, canal, notas)
select novo.id, 'L040', '@pnconfeccao', 'https://www.instagram.com/pnconfeccao/', 'Itajaí', 'SC', 'Litoral Norte', 'Moda feminina premium',
       'Atacado', 'Sim', 'Showroom físico', 12000, 'B',
       'Novo e-commerce (B2B)', 'Têm confecção própria com showroom de atacado', 'Oi, tudo bem? Aqui é o Angelo, da Vettor 28. Vi que vocês têm confecção própria com showroom de atacado. A gente monta loja online de atacado para fábricas, com catálogo, pedido mínimo e área do lojista, tirando o pedido do WhatsApp. Posso te mostrar como ficaria para a Pamella Nattacha?', 'Hoje quanto das vendas vem do WhatsApp/Instagram? Já pensaram em ter loja online própria?', 'Instagram DM', null
  from novo;

-- L041 · Camboriú · Balneário Camboriú/SC
with novo as (
  insert into lead (nome, empresa, origem, estagio, proximo_passo)
  select '@usecamboriu', 'Camboriú', 'Prospecção ativa', 'novo', 'Enviar DM de abertura'
   where not exists (select 1 from prospeccao where codigo = 'L041')
  returning id
)
insert into prospeccao
  (lead_id, codigo, instagram, instagram_url, cidade, uf, regiao, segmento,
   modelo_venda, fabricacao_propria, situacao_site, seguidores, prioridade,
   oportunidade, gancho, mensagem_abertura, perguntas, canal, notas)
select novo.id, 'L041', '@usecamboriu', 'https://www.instagram.com/usecamboriu/', 'Balneário Camboriú', 'SC', 'Litoral Norte', 'Fitness e praia',
       'Atacado e varejo', 'Confirmar', 'Tem link de compra (verificar)', 159000, 'B',
       'Upgrade de site', 'Estão desde 1995 com quase 160 mil seguidores', 'Oi, tudo bem? Aqui é o Angelo, da Vettor 28. Vi que vocês estão desde 1995 com quase 160 mil seguidores. Queria te mostrar como a Camboriú poderia vender mais com uma loja online mais rápida e bem estruturada. Posso te mandar uma ideia?', 'Vocês fabricam as peças ou revendem? Hoje quanto das vendas vem do WhatsApp/Instagram? O que mais incomoda no site atual?', 'Instagram DM', null
  from novo;

-- L042 · Divina Forma Fitness · Palhoça/SC
with novo as (
  insert into lead (nome, empresa, origem, estagio, proximo_passo)
  select '@divinaformafitness', 'Divina Forma Fitness', 'Prospecção ativa', 'novo', 'Enviar DM de abertura'
   where not exists (select 1 from prospeccao where codigo = 'L042')
  returning id
)
insert into prospeccao
  (lead_id, codigo, instagram, instagram_url, cidade, uf, regiao, segmento,
   modelo_venda, fabricacao_propria, situacao_site, seguidores, prioridade,
   oportunidade, gancho, mensagem_abertura, perguntas, canal, notas)
select novo.id, 'L042', '@divinaformafitness', 'https://www.instagram.com/divinaformafitness/', 'Palhoça', 'SC', 'Grande Florianópolis', 'Fitness e casual',
       'Atacado e varejo', 'Sim', 'Tem site (verificar)', 32000, 'B',
       'Upgrade de site', 'Fabricam fitness e enviam para o Brasil e exterior', 'Oi, tudo bem? Aqui é o Angelo, da Vettor 28. Vi que vocês fabricam fitness e enviam para o Brasil e exterior. Queria te mostrar como a Divina Forma Fitness poderia vender mais com uma loja online mais rápida e bem estruturada. Posso te mandar uma ideia?', 'Hoje quanto das vendas vem do WhatsApp/Instagram? O que mais incomoda no site atual?', 'Instagram DM', null
  from novo;

-- L043 · Robsur · Joinville/SC
with novo as (
  insert into lead (nome, empresa, origem, estagio, proximo_passo)
  select '@robsur.modamasculina', 'Robsur', 'Prospecção ativa', 'novo', 'Enviar DM de abertura'
   where not exists (select 1 from prospeccao where codigo = 'L043')
  returning id
)
insert into prospeccao
  (lead_id, codigo, instagram, instagram_url, cidade, uf, regiao, segmento,
   modelo_venda, fabricacao_propria, situacao_site, seguidores, prioridade,
   oportunidade, gancho, mensagem_abertura, perguntas, canal, notas)
select novo.id, 'L043', '@robsur.modamasculina', 'https://www.instagram.com/robsur.modamasculina/', 'Joinville', 'SC', 'Norte', 'Moda masculina e uniformes',
       'Varejo e uniformes', 'Sim', 'Vende pelo WhatsApp', 5000, 'B',
       'Novo e-commerce', 'Têm confecção própria desde 1991 e 3 lojas em Joinville', 'Oi, tudo bem? Aqui é o Angelo, da Vettor 28. Vi que vocês têm confecção própria desde 1991 e 3 lojas em Joinville. A gente monta loja online para fábricas de moda venderem direto ao cliente final e ao lojista, sem depender só do WhatsApp. Posso te mostrar como ficaria para a Robsur?', 'Hoje quanto das vendas vem do WhatsApp/Instagram? Já pensaram em ter loja online própria?', 'Instagram DM', null
  from novo;

-- L044 · Dalbelli Confecções · Criciúma/SC
with novo as (
  insert into lead (nome, empresa, origem, estagio, proximo_passo)
  select '@dalbelli', 'Dalbelli Confecções', 'Prospecção ativa', 'novo', 'Enviar DM de abertura'
   where not exists (select 1 from prospeccao where codigo = 'L044')
  returning id
)
insert into prospeccao
  (lead_id, codigo, instagram, instagram_url, cidade, uf, regiao, segmento,
   modelo_venda, fabricacao_propria, situacao_site, seguidores, prioridade,
   oportunidade, gancho, mensagem_abertura, perguntas, canal, notas)
select novo.id, 'L044', '@dalbelli', 'https://www.instagram.com/dalbelli/', 'Criciúma', 'SC', 'Sul', 'Moda (geral)',
       'Atacado e varejo', 'Sim', 'Verificar link da bio', 9700, 'B',
       'Novo e-commerce', 'Têm produção própria há mais de 30 anos', 'Oi, tudo bem? Aqui é o Angelo, da Vettor 28. Vi que vocês têm produção própria há mais de 30 anos. A gente monta loja online para fábricas de moda venderem direto ao cliente final e ao lojista, sem depender só do WhatsApp. Posso te mostrar como ficaria para a Dalbelli Confecções?', 'Hoje quanto das vendas vem do WhatsApp/Instagram? Já pensaram em ter loja online própria?', 'Instagram DM', null
  from novo;

-- L045 · Ana Jullian Calçados · São João Batista/SC
with novo as (
  insert into lead (nome, empresa, origem, estagio, proximo_passo)
  select '@anajulliancalcados', 'Ana Jullian Calçados', 'Prospecção ativa', 'novo', 'Enviar DM de abertura'
   where not exists (select 1 from prospeccao where codigo = 'L045')
  returning id
)
insert into prospeccao
  (lead_id, codigo, instagram, instagram_url, cidade, uf, regiao, segmento,
   modelo_venda, fabricacao_propria, situacao_site, seguidores, prioridade,
   oportunidade, gancho, mensagem_abertura, perguntas, canal, notas)
select novo.id, 'L045', '@anajulliancalcados', 'https://www.instagram.com/anajulliancalcados/', 'São João Batista', 'SC', 'Grande Florianópolis', 'Calçados femininos',
       'A confirmar', 'Sim', 'Verificar link da bio', null, 'B',
       'Novo e-commerce', 'Fabricam calçados no polo de São João Batista', 'Oi, tudo bem? Aqui é o Angelo, da Vettor 28. Vi que vocês fabricam calçados no polo de São João Batista. A gente monta loja online para fábricas de moda venderem direto ao cliente final e ao lojista, sem depender só do WhatsApp. Posso te mostrar como ficaria para a Ana Jullian Calçados?', 'Hoje quanto das vendas vem do WhatsApp/Instagram? Já pensaram em ter loja online própria?', 'Instagram DM', null
  from novo;

-- L046 · Rocksham Jeans · Brusque/Itajaí/SC
with novo as (
  insert into lead (nome, empresa, origem, estagio, proximo_passo)
  select '@rockshamjeans', 'Rocksham Jeans', 'Prospecção ativa', 'novo', 'Enviar DM de abertura'
   where not exists (select 1 from prospeccao where codigo = 'L046')
  returning id
)
insert into prospeccao
  (lead_id, codigo, instagram, instagram_url, cidade, uf, regiao, segmento,
   modelo_venda, fabricacao_propria, situacao_site, seguidores, prioridade,
   oportunidade, gancho, mensagem_abertura, perguntas, canal, notas)
select novo.id, 'L046', '@rockshamjeans', 'https://www.instagram.com/rockshamjeans/', 'Brusque/Itajaí', 'SC', 'Vale do Itajaí', 'Jeans',
       'Atacado e varejo', 'Sim', 'Tem site', 68000, 'C',
       'Upgrade de site', 'Fabricam jeans com 4 lojas e 68 mil seguidores', 'Oi, tudo bem? Aqui é o Angelo, da Vettor 28. Vi que vocês fabricam jeans com 4 lojas e 68 mil seguidores. Queria te mostrar como a Rocksham Jeans poderia vender mais com uma loja online mais rápida e bem estruturada. Posso te mandar uma ideia?', 'Hoje quanto das vendas vem do WhatsApp/Instagram? O que mais incomoda no site atual?', 'Instagram DM', null
  from novo;

-- L047 · Priori · SC (6 lojas)/SC
with novo as (
  insert into lead (nome, empresa, origem, estagio, proximo_passo)
  select '@priorimoda', 'Priori', 'Prospecção ativa', 'novo', 'Enviar DM de abertura'
   where not exists (select 1 from prospeccao where codigo = 'L047')
  returning id
)
insert into prospeccao
  (lead_id, codigo, instagram, instagram_url, cidade, uf, regiao, segmento,
   modelo_venda, fabricacao_propria, situacao_site, seguidores, prioridade,
   oportunidade, gancho, mensagem_abertura, perguntas, canal, notas)
select novo.id, 'L047', '@priorimoda', 'https://www.instagram.com/priorimoda/', 'SC (6 lojas)', 'SC', 'SC', 'Moda feminina',
       'Varejo', 'Sim', 'Tem loja online', 31000, 'C',
       'Upgrade de site', 'Têm fabricação própria e 6 lojas físicas', 'Oi, tudo bem? Aqui é o Angelo, da Vettor 28. Vi que vocês têm fabricação própria e 6 lojas físicas. Queria te mostrar como a Priori poderia vender mais com uma loja online mais rápida e bem estruturada. Posso te mandar uma ideia?', 'Hoje quanto das vendas vem do WhatsApp/Instagram? O que mais incomoda no site atual?', 'Instagram DM', null
  from novo;

-- L048 · Talinda · Brusque e litoral/SC
with novo as (
  insert into lead (nome, empresa, origem, estagio, proximo_passo)
  select '@talinda.oficial', 'Talinda', 'Prospecção ativa', 'novo', 'Enviar DM de abertura'
   where not exists (select 1 from prospeccao where codigo = 'L048')
  returning id
)
insert into prospeccao
  (lead_id, codigo, instagram, instagram_url, cidade, uf, regiao, segmento,
   modelo_venda, fabricacao_propria, situacao_site, seguidores, prioridade,
   oportunidade, gancho, mensagem_abertura, perguntas, canal, notas)
select novo.id, 'L048', '@talinda.oficial', 'https://www.instagram.com/talinda.oficial/', 'Brusque e litoral', 'SC', 'Vale do Itajaí', 'Moda feminina (P ao G4)',
       'Atacado e varejo', 'Confirmar', 'Vende pelo WhatsApp', 44000, 'B',
       'Novo e-commerce', 'Vendem do P ao G4 pelo WhatsApp com 4 lojas', 'Oi, tudo bem? Aqui é o Angelo, da Vettor 28. Vi que vocês vendem do P ao G4 pelo WhatsApp com 4 lojas. A gente monta loja online para fábricas de moda venderem direto ao cliente final e ao lojista, sem depender só do WhatsApp. Posso te mostrar como ficaria para a Talinda?', 'Vocês fabricam as peças ou revendem? Hoje quanto das vendas vem do WhatsApp/Instagram? Já pensaram em ter loja online própria?', 'Instagram DM', null
  from novo;

-- L049 · Atacado de Brusque · Brusque/SC
with novo as (
  insert into lead (nome, empresa, origem, estagio, proximo_passo)
  select '@atacadodebrusque', 'Atacado de Brusque', 'Prospecção ativa', 'novo', 'Enviar DM de abertura'
   where not exists (select 1 from prospeccao where codigo = 'L049')
  returning id
)
insert into prospeccao
  (lead_id, codigo, instagram, instagram_url, cidade, uf, regiao, segmento,
   modelo_venda, fabricacao_propria, situacao_site, seguidores, prioridade,
   oportunidade, gancho, mensagem_abertura, perguntas, canal, notas)
select novo.id, 'L049', '@atacadodebrusque', 'https://www.instagram.com/atacadodebrusque/', 'Brusque', 'SC', 'Vale do Itajaí', 'Moda feminina',
       'Atacado e varejo', 'Confirmar', 'Tem link de compra (verificar)', 109000, 'B',
       'Upgrade de site', 'Lançam coleção toda semana e têm mais de 100 mil seguidores', 'Oi, tudo bem? Aqui é o Angelo, da Vettor 28. Vi que vocês lançam coleção toda semana e têm mais de 100 mil seguidores. Queria te mostrar como a Atacado de Brusque poderia vender mais com uma loja online mais rápida e bem estruturada. Posso te mandar uma ideia?', 'Vocês fabricam as peças ou revendem? Hoje quanto das vendas vem do WhatsApp/Instagram? O que mais incomoda no site atual?', 'Instagram DM', null
  from novo;

-- L050 · Miss Glamour · Brusque/SC
with novo as (
  insert into lead (nome, empresa, origem, estagio, proximo_passo)
  select '@glamour_catarina', 'Miss Glamour', 'Prospecção ativa', 'novo', 'Enviar DM de abertura'
   where not exists (select 1 from prospeccao where codigo = 'L050')
  returning id
)
insert into prospeccao
  (lead_id, codigo, instagram, instagram_url, cidade, uf, regiao, segmento,
   modelo_venda, fabricacao_propria, situacao_site, seguidores, prioridade,
   oportunidade, gancho, mensagem_abertura, perguntas, canal, notas)
select novo.id, 'L050', '@glamour_catarina', 'https://www.instagram.com/glamour_catarina/', 'Brusque', 'SC', 'Vale do Itajaí', 'Moda feminina',
       'Atacado', 'Confirmar', 'Vende pelo WhatsApp', 14000, 'C',
       'Novo e-commerce (B2B)', 'Estão há 15 anos no atacado feminino no Catarina Shopping', 'Oi, tudo bem? Aqui é o Angelo, da Vettor 28. Vi que vocês estão há 15 anos no atacado feminino no Catarina Shopping. A gente monta loja online de atacado para fábricas, com catálogo, pedido mínimo e área do lojista, tirando o pedido do WhatsApp. Posso te mostrar como ficaria para a Miss Glamour?', 'Vocês fabricam as peças ou revendem? Hoje quanto das vendas vem do WhatsApp/Instagram? Já pensaram em ter loja online própria?', 'Instagram DM', null
  from novo;
-- ---------------------------------------------------------------------
-- O responsável, depois, e só se ele existir.
--
-- A lista diz "Angelo" em todas as 50 linhas, mas `responsavel_id`
-- aponta para `perfil`, e o perfil só existe depois que alguém entrou
-- na plataforma. Amarrar cada insert a essa busca faria a carga INTEIRA
-- não acontecer num banco recém-criado, que é justamente onde ela
-- precisa funcionar.
--
-- Por isso vem em separado, atinge só quem ainda está sem responsável,
-- e não faz nada se não houver administrador com esse nome. Rodar de
-- novo depois do primeiro acesso completa o que faltou.
-- ---------------------------------------------------------------------
update lead
   set responsavel_id = (
         select id from perfil
          where papel = 'administrador' and nome ilike 'angelo%'
          order by criado_em
          limit 1)
 where responsavel_id is null
   and id in (select lead_id from prospeccao where codigo like 'L0%')
   and exists (
         select 1 from perfil
          where papel = 'administrador' and nome ilike 'angelo%');
