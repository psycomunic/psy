import { redirect } from 'next/navigation';
import { eInterno, type Papel } from '@/lib/papeis';
import { bancoConfigurado } from '@/lib/supabase/ambiente';
import { sessaoAtual } from '@/lib/supabase/servidor';
import { MenuLateral } from '@/componentes/painel/MenuLateral';
import { resumoDaOperacao } from '@/lib/dados/operacao';
import { minhasNotificacoes } from '@/lib/dados/consultas';

export const metadata = {
  title: 'Painel',
  robots: { index: false, follow: false },
};

/**
 * A casca do painel: cenário, menu e o lugar onde o módulo entra.
 *
 * ============================================================
 * POR QUE ISTO VIROU UM LAYOUT
 * ============================================================
 * Estava tudo dentro da página do módulo. Como a página inteira é
 * refeita a cada navegação, trocar de aba no menu refazia o MENU
 * também: as mesmas consultas de contadores e avisos, o mesmo HTML, a
 * cada clique. E, pior, a tela só trocava quando tudo isso voltasse.
 *
 * Layout do segmento PAI não refaz quando o filho muda. Agora o menu é
 * montado uma vez por visita, e o clique troca só o conteúdo.
 *
 * ============================================================
 * E É O QUE PERMITE O `loading.tsx`
 * ============================================================
 * Com a casca aqui, o esqueleto do segmento filho aparece NA HORA do
 * clique, dentro do `<main>`, com o menu parado no lugar. Antes, um
 * `loading` teria de cobrir a tela inteira, menu incluído, e piscaria a
 * navegação a cada troca de aba.
 *
 * ============================================================
 * A SESSÃO É LIDA UMA VEZ, E NÃO DUAS
 * ============================================================
 * O layout precisa do papel para montar o menu, e a página precisa dele
 * para decidir o que mostrar. `sessaoAtual` é memorizada por
 * requisição, então as duas chamadas viram uma consulta só.
 */
export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  /*
    Sem banco, a maquete abre como administrador.

    Antes o papel vinha de `?papel=` na URL, e layout não recebe
    `searchParams`. A página continua lendo o parâmetro para o conteúdo
    dela; aqui o menu mostra o conjunto completo. Em produção o banco
    está ligado e nada disto vale.
  */
  let papel: Papel = 'administrador';
  let nome: string | null = null;

  if (bancoConfigurado) {
    const sessao = await sessaoAtual();
    if (!sessao) redirect('/entrar?destino=/painel');
    papel = sessao.papel;
    nome = sessao.nome;
  }

  /*
    Contadores e avisos ficam AQUI, e não dentro do `MenuLateral`:
    componente de menu que vai ao banco sozinho vira consulta escondida,
    e ninguém acha depois por que a rota ficou lenta.

    As duas juntas, e não uma depois da outra: não dependem uma da
    outra, e em sequência cada uma custava uma ida ao banco antes de a
    tela pintar.
  */
  const [resumo, avisos] = await Promise.all([
    eInterno(papel) && bancoConfigurado ? resumoDaOperacao() : Promise.resolve(null),
    bancoConfigurado
      ? minhasNotificacoes().then((r) => ({ ...r.dados, agora: new Date().toISOString() }))
      : Promise.resolve(undefined),
  ]);

  const contadores = resumo
    ? {
        tarefas: {
          n: resumo.tarefasAtrasadas,
          grave: true,
          titulo: 'Tarefas com prazo vencido',
        },
        crm: {
          n: resumo.leadsParados,
          titulo: 'Leads há mais de 7 dias no mesmo estágio',
        },
        configuracoes: {
          n: resumo.integracoesComErro,
          grave: true,
          titulo: 'Integrações com erro ou sem credencial',
        },
      }
    : {};

  return (
    <div className="relative flex min-h-screen flex-col lg:flex-row">
      {/* Aplica a preferência de menu antes da primeira pintura.
          `dangerouslySetInnerHTML` é o único jeito de embutir script
          numa árvore do React, e aqui o conteúdo é uma constante
          escrita à mão: nada vem de fora, nada vem do usuário. */}
      <script
        dangerouslySetInnerHTML={{
          __html:
            "try{if(localStorage.getItem('psy-menu')==='recolhido')" +
            "document.documentElement.dataset.menu='recolhido'}catch(e){}",
        }}
      />

      {/* Cenário fixo, igual ao do site. Não rola com o conteúdo: se
          rolasse, o brilho passaria correndo e viraria efeito barato.
          `overflow-hidden` recorta os brilhos: eles têm 680px de
          propósito, para o degradê sangrar fora da tela; sem o recorte
          ficam maiores que a janela e sujam qualquer medição de
          largura, mesmo sem criar rolagem. */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="grade absolute inset-0 opacity-50" />
        <div className="brilho-magenta absolute -right-[22%] -top-[28%] h-[680px] w-[680px] opacity-[0.22]" />
        <div className="brilho-frio absolute -left-[20%] bottom-[-24%] h-[600px] w-[600px] opacity-[0.16]" />
      </div>

      <MenuLateral
        papel={papel}
        nome={nome}
        bancoConfigurado={bancoConfigurado}
        contadores={contadores}
        avisos={avisos}
      />

      <main id="conteudo" className="relative z-10 min-w-0 flex-1 p-6 md:p-10">
        {children}
      </main>

      {/* Grão por cima de tudo. É o que separa "azul chapado" de
          superfície, e é a mesma camada do site. */}
      <div aria-hidden className="grao-camada" />
    </div>
  );
}
