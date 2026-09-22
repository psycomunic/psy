import type { Metadata } from 'next';
import { Casca, TopoPagina, secao, canonical } from '@/componentes/Casca';
import { Botao } from '@/componentes/Botao';
import { linkWhatsapp, whatsapp } from '@/conteudo/navegacao';
import { urlAbsoluta, site } from '@/conteudo/site';

export const metadata: Metadata = {
  title: 'Contato',
  description:
    'WhatsApp, e-mail e Instagram da Psy Comunic. Resposta em até 24h úteis, e o diagnóstico da sua operação começa com o link da loja.',
  ...canonical('/contato'),
  openGraph: { url: urlAbsoluta('/contato'), type: 'website' },
};

/* 5547992406661 -> (47) 99240-6661 */
const telefoneVisivel = whatsapp.numero.replace(
  /^55(\d{2})(\d{5})(\d{4})$/,
  '($1) $2-$3',
);

const canais = [
  {
    nome: 'WhatsApp',
    detalhe: telefoneVisivel,
    texto: 'O caminho mais rápido. Manda o link da loja que a leitura começa por ali.',
    href: linkWhatsapp,
    externo: true,
    principal: true,
  },
  /*
    O e-mail saiu daqui como CANAL clicável.

    `mailto:` no celular, que é de onde vem a maior parte das visitas,
    abre o aplicativo de e-mail que a pessoa talvez não use, ou não abre
    nada. O pedido morre sem ninguém saber que existiu.

    No lugar entra o formulário, que registra o lead mesmo quando
    ninguém chama. O endereço continua no rodapé, como informação de
    contato: lá ele é referência, e não promessa de resposta.
  */
  {
    nome: 'Formulário',
    detalhe: 'Análise da sua conta',
    texto: 'Deixa os dados e a equipe abre a sua conta de anúncio antes de falar com você.',
    href: '/trafego-pago#analise',
    externo: false,
    principal: false,
  },
  {
    nome: 'Instagram',
    detalhe: '@reysonmkt',
    texto: 'Bastidor da operação e o que a Psy Comunic vem construindo.',
    href: site.contato.instagram,
    externo: true,
    principal: false,
  },
];

export default function Contato() {
  return (
    <Casca>
      <TopoPagina
        rotulo="Contato"
        titulo={<>Fale com a {site.nome}.</>}
        texto="Resposta em até 24h úteis. Não precisa preparar apresentação nem planilha: o endereço da loja já basta para a primeira conversa."
        trilha={[]}
      />

      <section className="py-12 md:py-16">
        <div className={secao}>
          <div className="grid gap-6 md:grid-cols-3">
            {canais.map((c) => (
              <a
                key={c.nome}
                href={c.href}
                /* Aba nova só para o que sai do site. Link interno
                   abrindo noutra aba deixa a pessoa com duas abas do
                   mesmo site e o botão voltar sem efeito. */
                {...(c.externo ? { target: '_blank', rel: 'noopener' } : {})}
                className={
                  'cartao group flex flex-col p-8 transition-all duration-500 hover:-translate-y-1 md:p-9 ' +
                  (c.principal ? 'border-magenta/45' : 'hover:border-magenta/35')
                }
              >
                <p className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-magenta-texto">
                  {c.nome}
                </p>
                <p className="mt-4 font-display text-xl font-bold tracking-[-0.02em] md:text-2xl">
                  {c.detalhe}
                </p>
                <p className="mt-4 grow leading-relaxed text-cinza">{c.texto}</p>
                <span className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-magenta-texto">
                  Abrir
                  <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">
                    →
                  </span>
                </span>
              </a>
            ))}
          </div>

          <div className="mt-12 flex flex-wrap gap-4">
            <Botao href={linkWhatsapp} externo>
              Pedir diagnóstico gratuito
            </Botao>
            {/*
              Era "Ver os planos", apontando para /planos.

              O botão não dava 404: existe um redirecionamento que joga
              /planos em /servicos. Mas /servicos não mostra plano
              nenhum, porque preço não vai para o site público. O clique
              funcionava e entregava outra coisa, que é pior que o erro
              honesto: a pessoa procura o que foi prometido, não acha, e
              conclui que o site está quebrado.
            */}
            <Botao href="/servicos" variante="secundario">
              Ver os serviços
            </Botao>
          </div>

          {/* EDITAR: razão social, CNPJ e endereço. Asset pendente do
              cliente. Endereço real aqui é o que destrava a busca local
              e o Perfil da Empresa no Google. */}
          <p className="mt-14 max-w-[58ch] text-sm leading-relaxed text-cinza">
            Razão social, CNPJ e endereço a preencher.
          </p>
        </div>
      </section>
    </Casca>
  );
}
