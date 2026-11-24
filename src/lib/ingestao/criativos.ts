import 'server-only';
import { bancoConfigurado } from '@/lib/supabase/ambiente';
import { clienteServico } from '@/lib/supabase/servico';
import { abrirSegredo } from './credenciais';
import * as meta from './fontes/meta';
import type { CriativoResumo } from '@/lib/dados/tipos';

/**
 * Busca os criativos com miniatura e status em tempo real para uma conta.
 *
 * Por que não gravamos URLs `fbcdn.net` em coluna permanente do Postgres?
 * A Meta assina cada URL de imagem/miniatura com expiração curta (`oe=...`).
 * Guardar o link estático faria as miniaturas quebrarem poucos dias depois.
 * Aqui lemos direto da Graph API com cache de servidor de 5 minutos, sempre
 * renovando as assinaturas de CDN e refletindo na hora se algum anúncio foi
 * pausado ou reprovado.
 */
export async function criativosDaContaPeriodo(
  contaId: string,
  de: string,
  ate: string,
): Promise<CriativoResumo[]> {
  if (!bancoConfigurado) return [];

  try {
    const supabase = clienteServico();
    const { data: integracao } = await supabase
      .from('integracao')
      .select('identificador, ativa, credencial:credencial_id(segredo, ativa)')
      .eq('conta_id', contaId)
      .eq('provedor', 'meta_ads')
      .eq('ativa', true)
      .maybeSingle();

    if (!integracao?.identificador) return [];

    const cred = integracao.credencial as unknown as {
      segredo: string | null;
      ativa: boolean;
    } | null;

    if (!cred?.segredo || !cred.ativa) return [];

    const segredo = abrirSegredo(cred.segredo) as unknown as meta.SegredoMeta;
    if (!segredo?.access_token) return [];

    return await meta.buscarCriativos({
      segredo,
      identificador: integracao.identificador as string,
      de,
      ate,
    });
  } catch (e) {
    console.warn('criativosDaContaPeriodo:', (e as Error).message);
    return [];
  }
}
