import Link from 'next/link';
import { listarProspeccao } from '@/lib/dados/consultas';
import { Kpi, Secao } from '../base';
import { ListaProspeccao } from '../ListaProspeccao';
import { PRIORIDADES_PROSPECCAO, explicaPrioridadeProspeccao } from '@/lib/dados/tipos';
import type { Papel } from '@/lib/papeis';

/* ================================================================== */
/* Prospecção ativa: quem ainda não sabe que a agência existe          */
/* ================================================================== */

/**
 * O módulo de prospecção.
 *
 * ============================================================
 * POR QUE NÃO É UMA ABA DO CRM
 * ============================================================
 * O CRM responde "como está o funil". Prospecção responde "para quem eu
 * falo hoje". São perguntas diferentes, e a segunda tem cinquenta
 * respostas empilhadas no primeiro estágio: jogadas no quadro, elas
 * afogariam a coluna "novo" e esconderiam quem já respondeu.
 *
 * O lead é o MESMO nos dois lugares. Marcar a abordagem aqui move o
 * card lá, porque é uma linha só de banco.
 *
 * ============================================================
 * SEM BANCO, SEM LISTA
 * ============================================================
 * Não há versão de demonstração. Uma lista de prospecção inventada
 * mostraria marcas que não existem com mensagem pronta para enviar, e
 * é o tipo de tela onde alguém copia antes de perceber.
 */
export async function Prospeccao({ papel }: { papel: Papel }) {
  const { dados: prospectos, procedencia } = await listarProspeccao();

  const podeEditar =
    ['administrador', 'gestor', 'comercial'].includes(papel) && procedencia === 'banco';

  const faltam = prospectos.filter((p) => p.aguardandoAbordagem);
  const porPrioridade = PRIORIDADES_PROSPECCAO.map((p) => ({
    prioridade: p,
    total: prospectos.filter((x) => x.prioridade === p).length,
    faltam: faltam.filter((x) => x.prioridade === p).length,
  }));

  if (prospectos.length === 0) {
    return (
      <p className="mt-8 rounded-xl border border-dashed border-fio px-5 py-10 text-center text-sm leading-relaxed text-cinza">
        Nenhuma lista de prospecção carregada.
        <br />
        As listas entram por migração, em <code>supabase/migrations/</code>, e aparecem aqui
        assim que o banco recebe a carga.
      </p>
    );
  }

  return (
    <>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          rotulo="Na lista"
          valor={String(prospectos.length)}
          apoio="Marcas levantadas para abordar"
        />
        <Kpi
          rotulo="Falta abordar"
          valor={String(faltam.length)}
          apoio="Ainda no estágio novo, sem primeira mensagem"
        />
        {porPrioridade
          .filter((p) => p.prioridade !== 'C')
          .map((p) => (
            <Kpi
              key={p.prioridade}
              rotulo={`Prioridade ${p.prioridade}`}
              valor={String(p.total)}
              apoio={`${explicaPrioridadeProspeccao[p.prioridade]} · ${p.faltam} sem contato`}
            />
          ))}
      </div>

      <Secao
        titulo="A lista"
        apoio="Ordenada por prioridade e alcance. Marcar a abordagem move o lead para Em contato, no funil."
        acao={
          <Link
            href="/painel/crm"
            className="rounded-full border border-fio px-5 py-2.5 text-sm text-neve transition-colors hover:bg-white/5"
          >
            Ver o funil
          </Link>
        }
      >
        <ListaProspeccao prospectos={prospectos} podeEditar={podeEditar} />
      </Secao>
    </>
  );
}
