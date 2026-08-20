import 'server-only';

/**
 * PROPOSTAS COMERCIAIS. ARQUIVO PRIVADO.
 *
 * O 'server-only' no topo nao e decorativo: ele faz o build FALHAR se
 * algum componente de cliente importar este arquivo. E a trava que
 * impede valor de proposta de vazar para o bundle publico, que e o
 * mesmo cuidado do criterio de aceite sobre precos no site.
 *
 * ATENCAO AO MODELO DE ACESSO: hoje a protecao da proposta e o link
 * secreto. Isso e obscuridade, nao seguranca. Quem tiver o link entra,
 * e link vaza em encaminhamento de e-mail e print de WhatsApp. Enquanto
 * o login nao estiver ligado ao banco, use slugs longos e trate o link
 * como confidencial. Ver PLATAFORMA.md.
 */
export type ItemInvestimento = {
  rotulo: string;
  valor: string;
  observacao?: string;
};

export type Proposta = {
  slug: string;
  cliente: string;
  contato: string;
  emitidaEm: string;      // ISO, ex: '2026-08-19'
  validadeDias: number;
  resumo: string;
  diagnostico: string[];
  escopo: { frente: string; itens: string[] }[];
  investimento: ItemInvestimento[];
  condicoes: string[];
  proximosPassos: string[];
};

/**
 * Propostas escritas à mão. VAZIO, e assim deve ficar.
 *
 * Aqui existia uma proposta de exemplo, com "Nome da loja", "Nome do
 * responsavel" e um fee de "R$ 0.000,00" marcado como EDITAR. Ela era
 * alcançável: quem abrisse /proposta/exemplo-9f3c1a7b2e via um
 * documento comercial da Psy Comunic com valor zerado e cliente
 * fictício. Documento falso servido por um endereço público é pior que
 * endereço quebrado.
 *
 * Proposta agora nasce no painel, em /painel/propostas, e vive no
 * banco. Este array continua existindo só para as propostas antigas,
 * escritas antes do gerador, e hoje não há nenhuma.
 */
export const propostas: Proposta[] = [];

export function buscarProposta(slug: string) {
  return propostas.find((p) => p.slug === slug) ?? null;
}

export function venceEm(p: Proposta) {
  const d = new Date(p.emitidaEm);
  d.setDate(d.getDate() + p.validadeDias);
  return d;
}

/* ------------------------------------------------------------------ */
/* A proposta gerada pelo painel                                       */
/* ------------------------------------------------------------------ */

import { bancoConfigurado } from '@/lib/supabase/ambiente';
import { clienteServidor } from '@/lib/supabase/servidor';
import type { Plano } from './planos';

/**
 * O formato unificado que a página consome.
 *
 * Existem duas origens: as propostas antigas, escritas à mão no array
 * acima, e as geradas pelo painel, que ficam no banco. A página não
 * deve saber de qual veio, então as duas chegam aqui no mesmo formato.
 *
 * A diferença real: a gerada NÃO carrega escopo nem investimento. Ela
 * carrega o PLANO, e o escopo sai de `src/dados/planos.ts` na hora de
 * renderizar. Copiar os itens do plano para dentro de cada proposta
 * faria a de ontem contradizer a de hoje na primeira vez que um item
 * mudasse — e ninguém iria atrás de corrigir vinte documentos.
 */
export type PropostaExibida = {
  cliente: string;
  contato: string;
  resumo: string;
  emitidaEm: string;
  validadeDias: number;
  diagnostico: string[];
  proximosPassos: string[];
  /** Presente na proposta gerada pelo painel. */
  plano: Plano | null;
  /** Presentes só nas propostas antigas, escritas à mão. */
  escopo: { frente: string; itens: string[] }[];
  investimento: ItemInvestimento[];
  condicoes: string[];
};

const doArquivo = (p: Proposta): PropostaExibida => ({
  cliente: p.cliente,
  contato: p.contato,
  resumo: p.resumo,
  emitidaEm: p.emitidaEm,
  validadeDias: p.validadeDias,
  diagnostico: p.diagnostico,
  proximosPassos: p.proximosPassos,
  plano: null,
  escopo: p.escopo,
  investimento: p.investimento,
  condicoes: p.condicoes,
});

/**
 * Busca no banco primeiro, e cai para o arquivo.
 *
 * `proposta_por_link()` é `security definer` e devolve UMA proposta,
 * só se o status for enviada, em análise ou aceita. Rascunho não abre:
 * gerar o link não publica nada, e é isso que torna seguro gerar o link
 * antes de terminar de escrever.
 */
export async function buscarPropostaExibida(
  slug: string,
): Promise<PropostaExibida | null> {
  if (bancoConfigurado) {
    const supabase = await clienteServidor();
    const { data } = await supabase.rpc('proposta_por_link', { p_slug: slug });
    const linha = Array.isArray(data) ? data[0] : null;

    if (linha) {
      const corpo = (linha.corpo ?? {}) as {
        plano?: Plano;
        diagnostico?: string[];
        proximosPassos?: string[];
      };

      return {
        cliente: linha.cliente as string,
        contato: linha.contato as string,
        resumo: linha.resumo as string,
        emitidaEm: linha.emitida_em as string,
        validadeDias: Number(linha.validade_dias ?? 15),
        diagnostico: corpo.diagnostico ?? [],
        proximosPassos: corpo.proximosPassos ?? [],
        plano: corpo.plano ?? null,
        escopo: [],
        investimento: [],
        condicoes: [],
      };
    }
  }

  const doFile = buscarProposta(slug);
  return doFile ? doArquivo(doFile) : null;
}

export function venceEmExibida(p: PropostaExibida) {
  const d = new Date(p.emitidaEm);
  d.setDate(d.getDate() + p.validadeDias);
  return d;
}
