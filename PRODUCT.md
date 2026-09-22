# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primário: lojista de moda que já vende online.** Tem loja no ar, já
investe em mídia, e o faturamento não acompanha o que gasta. Chega ao
site pelo celular, quase sempre vindo de anúncio ou de indicação, no
meio do dia de trabalho. O trabalho dele ao chegar não é "conhecer uma
agência": é descobrir, em poucos minutos, se existe alguém que entenda
de loja de roupa e não só de anúncio.

Dois públicos secundários, cada um na sua rota, e a home não fala com
eles:

- `/trafego-pago`: empresa que já anuncia, de qualquer segmento, e não
  sabe o que voltou do que gastou.
- `/braganca-pa`: comércio local em Bragança e região, no Pará.
  Comércio, clínica, pousada. Nada de e-commerce.

## Product Purpose

A Psy Comunic constrói e opera e-commerce de moda: plataforma,
catálogo com grade e tabela de medidas, página de produto, tráfego
pago no Google e no Meta, e marketplaces.

O sucesso da home é UMA coisa: a pessoa pedir o diagnóstico gratuito.

## Positioning

Quem conduz a operação **foi sócio de um e-commerce que fatura R$ 17
milhões por ano**, mais de R$ 1 milhão por mês. Já respondeu por
estoque parado, boleto não pago, grade furada e entrega atrasada do
lado de quem paga a conta.

É o que um concorrente não copia sem mentir, e é por isso que a página
inteira se apoia nisso em vez de em adjetivo.

O segundo eixo: a Psy Comunic entrega **do zero ao lançamento e
continua entregando todo mês depois dele**. Um responsável, e não
quatro fornecedores apontando uns para os outros quando a venda cai.

## Operating Context

O trabalho roda em duas fases declaradas, com fim escrito para a
primeira (`src/conteudo/jornada.ts`): 9 entregas até a loja no ar
vendendo e medindo, 8 entregas contínuas depois.

Quatro frentes atendem junto: Gestão, Tecnologia, Marketing e
Atendimento & Logística (`src/conteudo/frentes.ts`).

A leitura de resultado sai do **faturamento aprovado da loja**, e não
do que cada plataforma de anúncio se atribui.

## Capabilities and Constraints

**O pedido vai direto para o WhatsApp.** Decidido nesta sessão: o CTA
principal abre a conversa, sem formulário no meio. O formulário de
análise continua existindo em `/trafego-pago`, que é outro público.

  Consequência assumida: sem formulário, o lead não nasce registrado no
  painel. O projeto já tem o remédio parcial em uso na página de
  Bragança: o link do WhatsApp dispara evento no GA4 com a seção de
  origem, o que preserva a atribuição mesmo sem o registro.

**Nenhum número de cliente sem autorização escrita e período de
referência declarado** (`src/conteudo/prova.ts`). Por isso `cases`
nasce vazio e continua vazio.

**Nenhum dado falso.** Sem mock, sem placeholder numérico, sem
depoimento inventado.

**Preço nunca no site público.** Escopo e investimento saem na
proposta, que é link único por cliente.

**Texto mora em `src/conteudo/*.ts`**, nunca espalhado no JSX. Dado
privado fica em `src/dados/` com `import 'server-only'` no topo.

Contraste WCAG AA auditado em todas as rotas, com sonda própria que
compõe a pilha de fundos com alfa. O gate é zero reprovação.

A barra de CTA fixa no celular é comportamento confirmado: a home tem
dezenas de telas de altura, e ela entra quando a abertura termina de
passar.

## Brand Commitments

**Nome:** Psy Comunic.

**Voz:** quem fala é a empresa, não o Angelo. Angelo Garcia aparece em
terceira pessoa e só quando a informação é sobre ele. **Sem travessão
no meio da frase.**

**O número é um só:** R$ 17 milhões por ano, ou mais de R$ 1 milhão por
mês. Nunca "milhões" solto, nunca "um dos maiores". Vive em
`faturamento`, em `marca.ts`.

**Nomes que não entram:** Casa Linda e Lar e Vida não são citadas como
e-commerces dos quais Angelo foi sócio. Continuam no portfólio, que é
outra afirmação.

**Grafias:** Vinci Society, Tay Dantas.

**Cores:** marinho `#0B1437`, rosa `#FF2E63`. Lidos do PDF do manual e
ainda **não confirmados** com os valores oficiais.

## Evidence on Hand

- 8 prints de loja em `public/imagens/sites/`, 560px de largura.
- 28 logos de marca em `public/imagens/marcas/`, silhuetas brancas,
  **sem mapeamento de qual arquivo é qual marca**. Entram como
  decorativos, e os nomes vão em texto à parte.
- Foto do Angelo no encontro da Vinci Society, e a foto da turma.
- Credenciais conferidas: 17+ anos de design; ex-sócio do e-commerce de
  R$ 17 milhões; mentoria com Tay Dantas, que é sócia e diretora de
  marca do G4 Educação e foi COO da Boca Rosa. **Fundadora do G4 ela
  não é**, e essa versão já foi recusada uma vez.

## Open Decisions

- **Prova de terceiro.** Perguntado nesta sessão e respondido "siga":
  seguir sem esperar. Os três espaços de depoimento em vídeo existem no
  código e aparecem sozinhos quando os arquivos chegarem em
  `public/video/`. Os selos de Google Partner e Meta Business Partner
  idem, em `public/imagens/parcerias/`.
- Hex oficiais da marca, por confirmar no manual.
- Razão social e CNPJ, para o rodapé e o dado estruturado.
- Licença comercial das fontes MADE Tommy, usadas na landing page
  antiga em `public/paginas-que-vendem/`, hoje na versão PERSONAL USE.
- Banner de consentimento LGPD, prometido pela política de privacidade,
  com o GA4 já no ar.
