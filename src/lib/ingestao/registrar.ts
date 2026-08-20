import 'server-only';
import { clienteServico } from '@/lib/supabase/servico';
import type { LinhaMetrica } from './csv';

/**
 * A gravação de métrica, com registro do que aconteceu.
 *
 * Escreve com a service role porque `metrica_diaria` não tem política
 * de escrita nenhuma, de propósito: métrica não entra pela chave
 * pública em hipótese alguma. Por isso mesmo, o filtro que o RLS faria
 * tem que ser escrito na mão aqui — e é: toda gravação carrega a conta
 * explícita, e nada nesta função aceita "todas as contas".
 *
 * Toda passagem abre uma linha em `sincronizacao` ANTES de tentar e a
 * fecha depois, com sucesso ou com o erro. Fechar só no sucesso deixaria
 * a falha invisível, que é o estado em que "o dado está velho" não tem
 * resposta.
 */

export type Origem = 'cron' | 'manual' | 'importacao';

export type ResultadoIngestao = {
  ok: boolean;
  sincronizacaoId: number | null;
  lidas: number;
  gravadas: number;
  mensagem: string;
};

export async function gravarMetricas({
  contaId,
  provedor,
  linhas,
  origem,
  autorId = null,
  guardarBruto = true,
}: {
  contaId: string;
  provedor: string;
  linhas: LinhaMetrica[];
  origem: Origem;
  autorId?: string | null;
  guardarBruto?: boolean;
}): Promise<ResultadoIngestao> {
  const supabase = clienteServico();

  const dias = linhas.map((l) => l.dia).sort();
  const diaDe = dias[0] ?? null;
  const diaAte = dias[dias.length - 1] ?? null;

  const { data: sinc, error: erroSinc } = await supabase
    .from('sincronizacao')
    .insert({
      conta_id: contaId,
      provedor,
      origem,
      autor_id: autorId,
      dia_de: diaDe,
      dia_ate: diaAte,
      status: 'rodando',
      linhas_lidas: linhas.length,
    })
    .select('id')
    .single();

  if (erroSinc || !sinc) {
    return {
      ok: false,
      sincronizacaoId: null,
      lidas: linhas.length,
      gravadas: 0,
      mensagem: erroSinc?.message ?? 'Não foi possível abrir o registro de sincronização.',
    };
  }

  const sincronizacaoId = sinc.id as number;

  /* Fecha a linha do log SEMPRE, inclusive quando a gravação falha. */
  const fechar = async (
    status: 'sucesso' | 'erro',
    gravadas: number,
    erro: string | null,
  ) => {
    await supabase
      .from('sincronizacao')
      .update({
        status,
        linhas_gravadas: gravadas,
        erro,
        terminou_em: new Date().toISOString(),
      })
      .eq('id', sincronizacaoId);

    await supabase
      .from('integracao')
      .update(
        status === 'sucesso'
          ? { ultima_sync: new Date().toISOString(), ultima_sync_ok: new Date().toISOString(), ultimo_erro: null, erro_em: null }
          : { ultima_sync: new Date().toISOString(), ultimo_erro: erro, erro_em: new Date().toISOString() },
      )
      .eq('conta_id', contaId)
      .eq('provedor', provedor);
  };

  if (linhas.length === 0) {
    await fechar('erro', 0, 'Nenhuma linha para gravar.');
    return {
      ok: false,
      sincronizacaoId,
      lidas: 0,
      gravadas: 0,
      mensagem: 'Nenhuma linha para gravar.',
    };
  }

  /* A carga crua vai ANTES da gravação. Se o mapeamento derrubar a
     transação, o payload continua guardado e dá para reprocessar sem
     pedir de novo à origem, que quase sempre já não devolve o
     histórico. */
  if (guardarBruto) {
    const { error } = await supabase.from('metrica_bruta').insert({
      sincronizacao_id: sincronizacaoId,
      conta_id: contaId,
      provedor,
      dia: diaDe,
      carga: linhas,
    });
    /* Falhar em guardar o cru não impede gravar a métrica: perder o
       histórico de reprocessamento é ruim, perder o dado do dia é pior. */
    if (error) console.warn('metrica_bruta:', error.message);
  }

  const { data, error } = await supabase.rpc('registrar_metricas', {
    p_conta: contaId,
    p_provedor: provedor,
    p_linhas: linhas,
  });

  if (error) {
    await fechar('erro', 0, error.message);
    return {
      ok: false,
      sincronizacaoId,
      lidas: linhas.length,
      gravadas: 0,
      mensagem: error.message,
    };
  }

  const gravadas = Number(data ?? 0);
  await fechar('sucesso', gravadas, null);

  return {
    ok: true,
    sincronizacaoId,
    lidas: linhas.length,
    gravadas,
    mensagem:
      diaDe === diaAte
        ? `${gravadas} linha(s) gravadas em ${diaDe}.`
        : `${gravadas} linha(s) gravadas, de ${diaDe} a ${diaAte}.`,
  };
}
