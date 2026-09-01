import Link from 'next/link';
import { listarPropostas, leadPorId } from '@/lib/dados/consultas';
import { rotuloStatusProposta } from '@/lib/dados/tipos';
import { PLANOS, fichas, feeEmReais } from '@/dados/planos';
import { SERVICOS, fichasDeServico } from '@/dados/servicos';
import { AvisoProcedencia, Secao, Tabela, th, td } from '../base';
import {
  FormProposta,
  CopiarLink,
  BotaoStatus,
  BotaoApagarProposta,
} from '../FormProposta';
import { CORES_SITUACAO } from '../paleta';
import { diaLongo } from '@/lib/formato';
import { pode, type Papel } from '@/lib/papeis';

/**
 * Propostas: gerar o link, publicar, acompanhar.
 *
 * Este é um componente de SERVIDOR, e é o que torna possível o preço
 * aparecer aqui: `@/dados/planos` é `server-only`. O formulário, que é
 * de cliente, recebe os valores já formatados por prop — se ele
 * importasse o arquivo direto, o build quebraria, e é para quebrar.
 */

const CORES: Record<string, string> = {
  rascunho: CORES_SITUACAO.sem_dado,
  enviada: CORES_SITUACAO.atencao,
  em_analise: CORES_SITUACAO.atencao,
  aceita: CORES_SITUACAO.saudavel,
  recusada: CORES_SITUACAO.critico,
  expirada: CORES_SITUACAO.critico,
};

const FORMAS: Record<string, string> = {
  rascunho: '○',
  enviada: '▲',
  em_analise: '▲',
  aceita: '●',
  recusada: '■',
  expirada: '■',
};

export async function Propostas({
  papel,
  leadId,
  editarId,
}: {
  papel: Papel;
  leadId?: string;
  editarId?: string;
}) {
  const { dados: propostas, procedencia } = await listarPropostas();

  /* Proposta a partir do lead: o funil manda o id e o formulário nasce
     preenchido. Antes o nome da loja era digitado duas vezes, e pior
     que o trabalho repetido era a divergência — "Loja Aurora" no funil
     e "Aurora Store" na proposta viram dois clientes na cabeça de quem
     lê o relatório depois. */
  const lead = leadId ? await leadPorId(leadId) : null;

  /* A proposta que está sendo editada vem da mesma lista que a tela já
     carregou. Uma consulta a mais por id seria trabalho para buscar o
     que já está na memória. */
  const emEdicao = editarId ? propostas.find((x) => x.id === editarId) : null;
  const podeEditar = pode(papel, 'propostas', 'editar') && procedencia === 'banco';
  const podeExcluir = papel === 'administrador' && procedencia === 'banco';

  const opcoes = PLANOS.map((p) => ({
    id: p,
    nome: fichas[p].nome,
    fee: `${feeEmReais(p)}/mês`,
    paraQuem: fichas[p].paraQuem,
  }));

  /* O catálogo de serviços não leva preço: o valor é campo da proposta.
     Ver a explicação em `src/dados/servicos.ts`. */
  const opcoesDeServico = SERVICOS.map((s) => ({
    id: s,
    nome: fichasDeServico[s].nome,
    papel: fichasDeServico[s].papel,
    paraQuem: fichasDeServico[s].paraQuem,
    /* Sugerido, e nao fixo: o campo abre preenchido e continua
       editavel. A negociacao manda. */
    precoSugerido: fichasDeServico[s].precoSugerido ?? null,
  }));

  return (
    <>
      <AvisoProcedencia procedencia={procedencia} />

      {procedencia !== 'banco' ? (
        <p className="cartao mt-8 p-6 text-sm leading-relaxed text-cinza">
          O gerador precisa do banco: um link de proposta que não fica gravado em lugar
          nenhum não abre para o cliente. Esta tela não trabalha com dados de demonstração
          de propósito.
        </p>
      ) : null}

      {podeEditar ? (
        <div className="mt-8">
          <FormProposta
            planos={opcoes}
            servicos={opcoesDeServico}
            editando={
              emEdicao
                ? {
                    id: emEdicao.id,
                    cliente: emEdicao.cliente,
                    contato: emEdicao.contato,
                    resumo: emEdicao.resumo,
                    validadeDias: emEdicao.validadeDias,
                    plano: emEdicao.plano,
                    servicos: emEdicao.servicos,
                    diagnostico: emEdicao.diagnostico,
                    proximosPassos: emEdicao.proximosPassos,
                    status: emEdicao.status,
                  }
                : null
            }
            lead={
              lead
                ? {
                    id: lead.id,
                    cliente: lead.empresa ?? lead.nome,
                    contato: lead.nome,
                    fee: lead.valorFee,
                  }
                : null
            }
          />
        </div>
      ) : null}

      <Secao
        titulo="Propostas geradas"
        apoio="Rascunho não abre para ninguém. Publicar é um segundo ato, e recolher tira do ar sem apagar o histórico."
      >
        {propostas.length === 0 ? (
          <p className="cartao p-6 text-sm text-cinza">Nenhuma proposta gerada ainda.</p>
        ) : (
          <Tabela>
            <caption className="sr-only">Propostas geradas, com status e validade</caption>
            <thead>
              <tr>
                <th scope="col" className={th}>Cliente</th>
                <th scope="col" className={th}>O que foi proposto</th>
                <th scope="col" className={th}>Status</th>
                <th scope="col" className={th}>Validade</th>
                <th scope="col" className={th}>Link</th>
                {podeEditar ? <th scope="col" className={th}></th> : null}
              </tr>
            </thead>
            <tbody>
              {propostas.map((p) => {
                const vencida = p.diasParaVencer < 0;
                const chave = vencida && p.status !== 'aceita' ? 'expirada' : p.status;

                return (
                  <tr key={p.id}>
                    <th scope="row" className={`${td} font-normal`}>
                      <span className="font-semibold text-branco">{p.cliente}</span>
                      <span className="mt-1 block text-xs text-cinza">
                        {p.contato}
                        {p.autor ? ` · por ${p.autor}` : ''}
                      </span>
                    </th>
                    <td className={td}>
                      <span className="text-sm text-neve">
                        {p.plano
                          ? (fichas[p.plano as keyof typeof fichas]?.nome ?? p.plano)
                          : p.servicos.length > 0
                            ? p.servicos
                                .map((s2) => fichasDeServico[s2.id as keyof typeof fichasDeServico]?.nome ?? s2.id)
                                .join(" + ")
                            : '—'}
                      </span>
                    </td>
                    <td className={td}>
                      <span
                        className="text-sm font-semibold"
                        style={{ color: CORES[chave] ?? CORES_SITUACAO.sem_dado }}
                      >
                        <span aria-hidden className="mr-1.5">{FORMAS[chave] ?? '○'}</span>
                        {rotuloStatusProposta[chave as keyof typeof rotuloStatusProposta]}
                      </span>
                    </td>
                    <td className={`${td} tabular whitespace-nowrap text-sm`}>
                      {diaLongo(p.emitidaEm)}
                      <span className="mt-1 block text-xs text-cinza">
                        {vencida
                          ? `venceu há ${Math.abs(p.diasParaVencer)} dia(s)`
                          : `vence em ${p.diasParaVencer} dia(s)`}
                      </span>
                    </td>
                    <td className={td}>
                      {p.status === 'rascunho' ? (
                        <span className="text-xs text-cinza">não publicado</span>
                      ) : (
                        <CopiarLink slug={p.slug} versao={p.versao} />
                      )}
                    </td>
                    {podeEditar ? (
                      <td className={td}>
                        <div className="flex flex-wrap items-center gap-2">
                          {p.status === 'rascunho' ? (
                            <BotaoStatus id={p.id} status="enviada" rotulo="Publicar" />
                          ) : (
                            <BotaoStatus id={p.id} status="rascunho" rotulo="Recolher" />
                          )}
                          {p.status !== 'aceita' && p.status !== 'rascunho' ? (
                            <BotaoStatus id={p.id} status="aceita" rotulo="Marcar aceita" />
                          ) : null}

                          {/* Aceita não edita nem apaga: é o documento do
                              que foi combinado. As duas ações somem, e a
                              ação recusaria de todo jeito. */}
                          {p.status !== 'aceita' ? (
                            <Link
                              href={`/painel/propostas?editar=${p.id}`}
                              className="rounded-full border border-fio px-3 py-1.5 text-xs font-semibold text-neve transition-colors hover:bg-white/5"
                            >
                              Editar
                            </Link>
                          ) : null}

                          {podeExcluir && p.status !== 'aceita' ? (
                            <BotaoApagarProposta id={p.id} cliente={p.cliente} />
                          ) : null}
                        </div>
                      </td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </Tabela>
        )}
      </Secao>
    </>
  );
}
