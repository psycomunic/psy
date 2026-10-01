import { listarProjetos, listarContas, listarEquipe } from '@/lib/dados/consultas';
import { Kpi, Secao, AvisoProcedencia } from '../base';
import { ListaProjetos } from '../ListaProjetos';
import { SITUACOES_ABERTAS } from '@/lib/dados/tipos';
import { pode, type Papel } from '@/lib/papeis';

/* ================================================================== */
/* Projetos: o que está sendo entregue                                 */
/* ================================================================== */

/**
 * O módulo de projetos.
 *
 * ============================================================
 * POR QUE AO LADO DE TAREFAS, E NÃO DENTRO
 * ============================================================
 * Tarefa é item com prazo: faz, conclui, some. Projeto é entrega com
 * ciclo de vida, e as perguntas são diferentes. "O que eu faço hoje" é
 * tarefa. "O que eu ainda devo entregar, e o que voltou com alteração"
 * é projeto, e nenhuma lista de tarefas responde isso sem virar outra
 * coisa.
 *
 * ============================================================
 * OS QUATRO NÚMEROS DO TOPO
 * ============================================================
 * Cada um responde uma pergunta que alguém faz em voz alta:
 *
 *   na mão        quantos ainda são meus
 *   com alteração o que voltou e espera por mim
 *   atrasados     o que já deveria ter saído
 *   com cliente   o que não anda, e não é culpa minha
 *
 * O quarto existe para a conversa de segunda-feira: sem ele, projeto
 * parado esperando material do cliente parece projeto atrasado, e a
 * cobrança cai no lugar errado.
 */
export async function Projetos({ papel }: { papel: Papel }) {
  const [{ dados: projetos, procedencia }, { dados: contas }, { dados: equipe }] =
    await Promise.all([listarProjetos(), listarContas(), listarEquipe()]);

  const podeEditar = pode(papel, 'projetos', 'editar') && procedencia === 'banco';
  const podeExcluir = pode(papel, 'projetos', 'excluir') && procedencia === 'banco';

  const naMao = projetos.filter((p) => SITUACOES_ABERTAS.includes(p.situacao));
  const comAlteracao = projetos.filter((p) => p.situacao === 'alteracao');
  const comCliente = projetos.filter((p) => p.situacao === 'aguardando_cliente');

  /* Atraso só conta no que ainda está na mão. Projeto entregue com prazo
     vencido foi entregue depois, e isso é história, não alerta. */
  const atrasados = naMao.filter((p) => p.diasAteOPrazo !== null && p.diasAteOPrazo < 0);

  return (
    <>
      <AvisoProcedencia procedencia={procedencia} />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          rotulo="Na mão"
          valor={String(naMao.length)}
          apoio="Briefing, andamento, alteração e espera"
        />
        <Kpi
          rotulo="Com alteração"
          valor={String(comAlteracao.length)}
          apoio="Voltou com ajuste pedido. A vez é sua"
        />
        <Kpi
          rotulo="Atrasados"
          valor={String(atrasados.length)}
          apoio="Prazo vencido e ainda não entregue"
        />
        <Kpi
          rotulo="Com o cliente"
          valor={String(comCliente.length)}
          apoio="Parados esperando material, acesso ou resposta"
        />
      </div>

      <Secao
        titulo="Os projetos"
        apoio="Ordenados por situação e prazo. A situação se muda no próprio cartão."
      >
        <ListaProjetos
          projetos={projetos}
          podeEditar={podeEditar}
          podeExcluir={podeExcluir}
          contas={contas.map((c) => ({ id: c.id, nome: c.nome }))}
          equipe={equipe.filter((e) => e.ativo).map((e) => ({ id: e.id, nome: e.nome }))}
        />
      </Secao>
    </>
  );
}
