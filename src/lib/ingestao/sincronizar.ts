import 'server-only';
import { clienteServico } from '@/lib/supabase/servico';
import { janela } from '@/lib/datas';
import { abrirSegredo } from './credenciais';
import { gravarMetricas } from './registrar';
import type { LinhaMetrica } from './csv';
import * as meta from './fontes/meta';
import * as google from './fontes/google';

/**
 * A rotina que puxa o dado das APIs.
 *
 * O join entre integração, credencial e loja é feito AQUI, e não numa
 * view: uma view com colunas chamadas `segredo_da_agencia` seria uma
 * superfície nova expondo token, criada só para poupar um join. A
 * service role não passa por RLS, então a consulta abaixo enxerga o que
 * precisa sem que exista objeto de banco algum com essa forma.
 *
 * Cada integração é tratada de forma INDEPENDENTE. Uma conta com token
 * vencido não pode impedir as outras trinta de sincronizar, e é por
 * isso que o try/catch está dentro do laço, e não em volta dele.
 */

export type ResultadoDaFonte = {
  integracaoId: string;
  contaNome: string;
  provedor: string;
  ok: boolean;
  gravadas: number;
  mensagem: string;
};

/* O `select` precisa ser um literal único: concatenar quebra a
   inferência de tipos do Supabase e tudo vira GenericStringError. */
const SELECT_FILA =
  'id, conta_id, provedor, identificador, janela_dias, ativa, segredo, credencial:credencial_id(id, segredo, configuracao, ativa), conta:conta_id(nome, situacao)';

type Fila = {
  id: string;
  conta_id: string;
  provedor: string;
  identificador: string | null;
  janela_dias: number;
  segredo: string | null;
  credencial: { id: string; segredo: string | null; configuracao: Record<string, unknown>; ativa: boolean } | null;
  conta: { nome: string; situacao: string } | null;
};

async function buscarEMapear(
  f: Fila,
  de: string,
  ate: string,
): Promise<{ bruto: unknown; linhas: LinhaMetrica[] }> {
  if (!f.identificador) {
    throw new Error('Falta o identificador da conta nesta integração.');
  }

  const cifrado = f.credencial?.segredo;
  if (!cifrado) {
    throw new Error('A credencial da agência para este provedor não está configurada.');
  }
  if (f.credencial && !f.credencial.ativa) {
    throw new Error('A credencial da agência está desligada.');
  }

  const segredo = abrirSegredo(cifrado);
  const configuracao = f.credencial?.configuracao ?? {};

  switch (f.provedor) {
    case 'meta_ads': {
      const bruto = await meta.buscar({
        segredo: segredo as unknown as meta.SegredoMeta,
        identificador: f.identificador,
        de,
        ate,
      });
      return { bruto, linhas: meta.mapear(bruto) };
    }

    case 'google_ads': {
      const bruto = await google.buscarAds({
        segredo: { ...(segredo as unknown as google.SegredoGoogle), ...pegarAbertos(configuracao) },
        configuracao,
        identificador: f.identificador,
        de,
        ate,
      });
      return { bruto, linhas: google.mapearAds(bruto) };
    }

    case 'ga4': {
      const bruto = await google.buscarGa4({
        segredo: { ...(segredo as unknown as google.SegredoGoogle), ...pegarAbertos(configuracao) },
        identificador: f.identificador,
        de,
        ate,
      });
      return { bruto, linhas: google.mapearGa4(bruto) };
    }

    default:
      /* Magazord, Shopify e as plataformas de loja entram por
         `/api/ingestao` ou por planilha, e não por aqui. Dizer isso é
         melhor do que falhar com "provedor desconhecido". */
      throw new Error(
        `Sem conector para "${f.provedor}". Esta fonte entra por planilha ou por /api/ingestao.`,
      );
  }
}

/** `client_id` e afins moram em `configuracao`, mas as funções da fonte
    esperam tudo junto no segredo. */
function pegarAbertos(c: Record<string, unknown>): Record<string, string> {
  const fora: Record<string, string> = {};
  for (const k of ['client_id', 'login_customer_id']) {
    if (typeof c[k] === 'string' && c[k]) fora[k] = c[k] as string;
  }
  return fora;
}

/**
 * Sincroniza uma integração. Nunca lança: o erro vira resultado.
 *
 * É o `gravarMetricas` que abre e fecha a linha em `sincronizacao`, mas
 * ele só entra em cena depois da busca. Uma falha ANTES disso — token
 * vencido, conta sem permissão — não passaria por ele, e sumiria do
 * log justamente no caso em que o log é a única pista. Por isso o
 * `catch` grava a falha na mão.
 */
export async function sincronizarUma(f: Fila): Promise<ResultadoDaFonte> {
  const contaNome = f.conta?.nome ?? 'loja';
  const { de, ate } = janela(f.janela_dias ?? 7);

  try {
    const { bruto, linhas } = await buscarEMapear(f, de, ate);

    if (linhas.length === 0) {
      await registrarFalha(f, de, ate, 'A fonte respondeu, mas sem nenhuma linha no período.');
      return {
        integracaoId: f.id,
        contaNome,
        provedor: f.provedor,
        ok: false,
        gravadas: 0,
        mensagem: 'Resposta vazia no período.',
      };
    }

    const r = await gravarMetricas({
      contaId: f.conta_id,
      provedor: f.provedor,
      linhas,
      origem: 'cron',
      bruto,
    });

    return {
      integracaoId: f.id,
      contaNome,
      provedor: f.provedor,
      ok: r.ok,
      gravadas: r.gravadas,
      mensagem: r.mensagem,
    };
  } catch (e) {
    const msg = (e as Error).message;
    await registrarFalha(f, de, ate, msg);
    return {
      integracaoId: f.id,
      contaNome,
      provedor: f.provedor,
      ok: false,
      gravadas: 0,
      mensagem: msg,
    };
  }
}

async function registrarFalha(f: Fila, de: string, ate: string, erro: string) {
  const supabase = clienteServico();
  const agora = new Date().toISOString();

  await supabase.from('sincronizacao').insert({
    conta_id: f.conta_id,
    provedor: f.provedor,
    origem: 'cron',
    dia_de: de,
    dia_ate: ate,
    status: 'erro',
    linhas_lidas: 0,
    linhas_gravadas: 0,
    erro,
    terminou_em: agora,
  });

  await supabase
    .from('integracao')
    .update({ ultima_sync: agora, ultimo_erro: erro, erro_em: agora })
    .eq('id', f.id);
}

/**
 * Roda todas as integrações ativas, ou só as de uma loja.
 *
 * Em série, de propósito. Google Ads e Meta contam requisição por
 * minuto, e trinta chamadas simultâneas na virada da madrugada é o
 * jeito mais rápido de tomar bloqueio de taxa em todas as contas ao
 * mesmo tempo.
 */
export async function sincronizar({
  contaId,
  integracaoId,
}: { contaId?: string; integracaoId?: string } = {}): Promise<ResultadoDaFonte[]> {
  const supabase = clienteServico();

  let consulta = supabase.from('integracao').select(SELECT_FILA).eq('ativa', true);
  if (contaId) consulta = consulta.eq('conta_id', contaId);
  if (integracaoId) consulta = consulta.eq('id', integracaoId);

  const { data, error } = await consulta;
  if (error) throw new Error(error.message);

  const fila = (data ?? []) as unknown as Fila[];

  const resultados: ResultadoDaFonte[] = [];
  for (const f of fila) {
    if (f.conta && !['ativa', 'onboarding'].includes(f.conta.situacao)) continue;
    resultados.push(await sincronizarUma(f));
  }

  return resultados;
}
