import { redirect } from 'next/navigation';
import { eInterno, type Papel } from '@/lib/papeis';
import { bancoConfigurado } from '@/lib/supabase/ambiente';
import { sessaoAtual } from '@/lib/supabase/servidor';
import { MenuLateral } from '@/componentes/painel/MenuLateral';
import { BarraTopoPainel } from '@/componentes/painel/BarraTopoPainel';
import { resumoDaOperacao } from '@/lib/dados/operacao';
import { minhasNotificacoes, listarContas } from '@/lib/dados/consultas';
import { hojeBR } from '@/lib/datas';

export const metadata = {
  title: 'Painel · Psy Comunic',
  robots: { index: false, follow: false },
};

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  let papel: Papel = 'administrador';
  let nome: string | null = null;

  if (bancoConfigurado) {
    const sessao = await sessaoAtual();
    if (!sessao) redirect('/entrar?destino=/painel');
    papel = sessao.papel;
    nome = sessao.nome;
  }

  const [resumo, avisos, contasResp] = await Promise.all([
    eInterno(papel) && bancoConfigurado ? resumoDaOperacao() : Promise.resolve(null),
    bancoConfigurado
      ? minhasNotificacoes().then((r) => ({ ...r.dados, agora: new Date().toISOString() }))
      : Promise.resolve(undefined),
    listarContas().catch(() => ({ dados: [], procedencia: 'demonstracao' as const })),
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

  const hojeData = new Date(`${hojeBR()}T12:00:00Z`);
  const dataCurta = hojeData
    .toLocaleDateString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    })
    .replace(/\./g, '');

  const contasBusca = contasResp.dados.map((c) => ({
    id: c.id,
    nome: c.nome,
    segmento: c.segmento,
  }));

  return (
    <div
      data-painel-tema="claro"
      className="painel-casca relative flex min-h-screen flex-col lg:flex-row"
    >
      {/* Inicia SEMPRE no modo claro por padrão; só ativa o escuro quando
          o usuário tiver escolhido explicitamente 'escuro' no alternador. */}
      <script
        dangerouslySetInnerHTML={{
          __html:
            "try{" +
            "var m=localStorage.getItem('psy-menu');if(m==='recolhido')document.documentElement.dataset.menu='recolhido';" +
            "var t=localStorage.getItem('psy-tema-painel')==='escuro'?'escuro':'claro';" +
            "document.documentElement.dataset.painelTema=t;" +
            "var el=document.currentScript&&document.currentScript.parentElement;" +
            "if(el)el.setAttribute('data-painel-tema',t);" +
            "}catch(e){}",
        }}
      />

      <MenuLateral
        papel={papel}
        nome={nome}
        bancoConfigurado={bancoConfigurado}
        contadores={contadores}
      />

      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <BarraTopoPainel
          papel={papel}
          nome={nome}
          dataCurta={dataCurta}
          lojasAtivas={resumo?.lojasAtivas}
          tarefasAtrasadas={resumo?.tarefasAtrasadas}
          leadsAbertos={resumo?.leadsAbertos}
          contasBusca={contasBusca}
          avisos={avisos}
        />

        <main id="conteudo" className="min-w-0 flex-1 p-5 md:p-8 lg:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}
