import Link from 'next/link';
import {
  listarContas,
  listarRelatorios,
  contatosPrincipaisDasContas,
} from '@/lib/dados/consultas';
import { rotuloStatusRelatorio } from '@/lib/dados/tipos';
import {
  resolverPerfil,
  resolverJanelaPeriodo,
  rotuloPerfilMetrica,
} from '@/lib/dominio/perfis-metrica';
import { emailConfigurado } from '@/lib/email/remetente';
import { AvisoProcedencia, Secao } from '../base';
import {
  FormRelatorio,
  CopiarLinkRelatorio,
  EnviarRelatorioWhatsApp,
  EnviarRelatorioEmail,
  AcoesCardRelatorio,
} from '../FormRelatorio';
import { CORES_SITUACAO } from '../paleta';
import { dinheiro } from '@/lib/formato';
import { hojeBR } from '@/lib/datas';
import { pode, type Papel } from '@/lib/papeis';

const COR_STATUS = {
  rascunho: CORES_SITUACAO.sem_dado,
  publicado: CORES_SITUACAO.saudavel,
  arquivado: CORES_SITUACAO.atencao,
} as const;

const FORMA_STATUS = {
  rascunho: '○',
  publicado: '●',
  arquivado: '▲',
} as const;

function intervaloBR(de: string, ate: string) {
  const f = (iso: string) => iso.split('-').reverse().join('/');
  return de === ate ? f(de) : `${f(de)} a ${f(ate)}`;
}

export async function Relatorios({
  papel,
  contaId,
  dePedido,
  atePedido,
  editarId,
}: {
  papel: Papel;
  contaId?: string;
  dePedido?: string;
  atePedido?: string;
  editarId?: string;
}) {
  const [{ dados: contas, procedencia }, { dados: relatorios }, contatos] = await Promise.all([
    listarContas(),
    listarRelatorios(contaId),
    contatosPrincipaisDasContas(),
  ]);

  const ehCliente = papel === 'cliente' || papel === 'cliente_leitura';
  const podeEditar = pode(papel, 'relatorios', 'editar') && procedencia === 'banco';
  const podeExcluir = pode(papel, 'relatorios', 'excluir') && procedencia === 'banco';

  const janelaPadrao = resolverJanelaPeriodo({
    periodo: dePedido && atePedido ? 'personalizado' : '30d',
    de: dePedido,
    ate: atePedido,
  });

  const emEdicao = editarId ? relatorios.find((r) => r.id === editarId) ?? null : null;

  const opcoesContas = contas.map((c) => {
    const p = resolverPerfil(c.perfilMetrica, c.tipo);
    return {
      id: c.id,
      nome: c.nome,
      segmento: c.segmento,
      perfilEfetivo: rotuloPerfilMetrica[p],
      contatoPadrao: contatos[c.id]?.nome ?? null,
    };
  });

  return (
    <>
      <AvisoProcedencia procedencia={procedencia} />

      {procedencia !== 'banco' ? (
        <p className="cartao mt-8 p-6 text-sm leading-relaxed text-cinza">
          O gerador de relatórios grava o snapshot e o link privado no banco de dados. Em modo de demonstração sem banco conectado, nenhum link externo é emitido.
        </p>
      ) : null}

      {podeEditar && !ehCliente ? (
        <div className="mt-8">
          <FormRelatorio
            contas={opcoesContas}
            contaInicial={contaId}
            deInicial={janelaPadrao.de}
            ateInicial={janelaPadrao.ate}
            hojeReferencia={hojeBR()}
            editando={emEdicao}
          />
        </div>
      ) : null}

      {/* Filtro rápido por cliente na listagem */}
      {!ehCliente && contas.length > 1 ? (
        <nav aria-label="Filtrar relatórios por cliente" className="mt-8 flex flex-wrap items-center gap-2">
          <Link
            href="/painel/relatorios"
            className={
              'rounded-full px-4 py-1.5 text-xs transition-colors ' +
              (!contaId
                ? 'bg-branco font-semibold text-marinho-fundo'
                : 'border border-fio text-neve hover:bg-white/[0.06]')
            }
          >
            Todos os clientes
          </Link>
          {contas.map((c) => (
            <Link
              key={c.id}
              href={`/painel/relatorios?conta=${c.id}`}
              className={
                'rounded-full px-3.5 py-1.5 text-xs transition-colors ' +
                (contaId === c.id
                  ? 'bg-magenta font-semibold text-branco'
                  : 'border border-fio text-cinza hover:text-neve')
              }
            >
              {c.nome}
            </Link>
          ))}
        </nav>
      ) : null}

      <Secao
        titulo={ehCliente ? 'Seus relatórios publicados' : 'Relatórios gerados'}
        apoio={
          ehCliente
            ? 'Cada documento abre em tela inteira com opção de impressão e salvamento em PDF.'
            : 'Publique o relatório para liberar o link externo, disparar o resumo pronto no WhatsApp ou enviar por e-mail.'
        }
      >
        {relatorios.length === 0 ? (
          <div className="cartao p-8 text-sm leading-relaxed text-cinza">
            {ehCliente
              ? 'Nenhum relatório publicado para a sua conta até o momento.'
              : 'Nenhum relatório gerado neste filtro. Use o botão "+ Novo relatório" acima (ou "Fechamento em lote" para preparar todos os clientes de uma vez).'}
          </div>
        ) : (
          <ul className="space-y-4">
            {relatorios.map((r) => {
              const publicado = r.status === 'publicado';
              const destaques = r.snapshot.cartoes.slice(0, 4);

              return (
                <li key={r.id} className="cartao space-y-5 p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="font-display text-xl font-extrabold tracking-[-0.02em] text-branco">
                          {r.cliente}
                        </h3>
                        <span className="rounded-full border border-fio bg-white/[0.03] px-3 py-0.5 font-mono text-[0.68rem] uppercase tracking-[0.12em] text-cinza">
                          {rotuloPerfilMetrica[r.perfilMetrica]}
                        </span>
                        <span
                          className="text-xs font-semibold"
                          style={{ color: COR_STATUS[r.status] }}
                        >
                          <span aria-hidden className="mr-1">{FORMA_STATUS[r.status]}</span>
                          {rotuloStatusRelatorio[r.status]}
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm text-neve">
                        {r.titulo}
                        <span className="ml-2 font-mono text-xs text-cinza">
                          ({intervaloBR(r.periodoDe, r.periodoAte)} · v{r.versao})
                        </span>
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      {publicado ? (
                        <Link
                          href={`/relatorio/${r.slug}?v=${r.versao}`}
                          target="_blank"
                          className="rounded-full bg-magenta px-4 py-1.5 text-xs font-semibold text-branco transition-colors hover:bg-magenta-forte"
                        >
                          Abrir / PDF ↗
                        </Link>
                      ) : null}
                      {!ehCliente && publicado ? (
                        <CopiarLinkRelatorio slug={r.slug} versao={r.versao} />
                      ) : null}
                      {!ehCliente ? (
                        <EnviarRelatorioWhatsApp
                          cliente={r.cliente}
                          contato={r.contato}
                          periodoDe={r.periodoDe}
                          periodoAte={r.periodoAte}
                          slug={r.slug}
                          versao={r.versao}
                          cartoes={r.snapshot.cartoes}
                          whatsapp={r.whatsappContato}
                          publicado={publicado}
                        />
                      ) : null}
                      {!ehCliente && emailConfigurado ? (
                        <EnviarRelatorioEmail
                          id={r.id}
                          emailSugerido={r.emailContato}
                          publicado={publicado}
                        />
                      ) : null}
                    </div>
                  </div>

                  {/* Prévia dos principais números guardados no snapshot */}
                  {destaques.length > 0 ? (
                    <dl className="grid gap-3 border-t border-fio pt-4 sm:grid-cols-2 lg:grid-cols-4">
                      {destaques.map((k) => (
                        <div key={k.chave} className="rounded-xl border border-fio bg-white/[0.02] px-4 py-3">
                          <dt className="font-mono text-[0.68rem] uppercase tracking-[0.12em] text-cinza">
                            {k.rotulo}
                          </dt>
                          <dd className="tabular mt-1 font-display text-lg font-bold text-branco">
                            {k.valor}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  ) : null}

                  {r.resultadoComercial?.receitaFechada ? (
                    <p className="text-xs text-[#4ADE80]">
                      ● Fechamento comercial incluído: {dinheiro(r.resultadoComercial.receitaFechada)}
                      {r.resultadoComercial.vendasFechadas
                        ? ` (${r.resultadoComercial.vendasFechadas} ${r.resultadoComercial.rotuloVenda ?? 'vendas'})`
                        : ''}
                    </p>
                  ) : null}

                  {r.resumoExecutivo ? (
                    <p className="max-w-[76ch] text-sm leading-relaxed text-cinza">
                      {r.resumoExecutivo}
                    </p>
                  ) : null}

                  {podeEditar && !ehCliente ? (
                    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-fio pt-4">
                      <AcoesCardRelatorio
                        id={r.id}
                        status={r.status}
                        podeExcluir={podeExcluir}
                      />
                      <Link
                        href={`/painel/relatorios?editar=${r.id}`}
                        className="text-xs font-semibold text-magenta-texto hover:underline"
                      >
                        Editar textos e seções →
                      </Link>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </Secao>
    </>
  );
}
