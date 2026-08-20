'use server';

import { revalidatePath } from 'next/cache';
import { sessaoAtual } from '@/lib/supabase/servidor';
import { pode } from '@/lib/papeis';
import { lerPlanilha, agrupar, PROVEDORES, type ProvedorPlanilha } from '@/lib/ingestao/csv';
import { gravarMetricas } from '@/lib/ingestao/registrar';
import type { Resultado } from './acoes';

/**
 * Importação de planilha de métrica.
 *
 * Grava com a SERVICE ROLE, e por isso a checagem de papel aqui é a
 * proteção de verdade, não um aviso: `metrica_diaria` não tem política
 * de escrita, então o Postgres não vai recusar nada em segunda
 * instância como faz no CRM. Esta é a primeira linha e a última.
 */

const LIMITE_BYTES = 4 * 1024 * 1024;

async function exigirImportador() {
  const sessao = await sessaoAtual();
  if (!sessao) throw new Error('Sessão expirada. Entre de novo.');
  if (!pode(sessao.papel, 'metricas', 'editar')) {
    throw new Error('Seu perfil não importa métrica.');
  }
  return sessao;
}

/**
 * Texto do arquivo, tentando UTF-8 e caindo para Windows-1252.
 *
 * Excel em português salva CSV na codificação do Windows por padrão.
 * Lido como UTF-8, "Impressões" vira "Impress�es" e o cabeçalho
 * deixa de casar com qualquer apelido — a planilha inteira entra como
 * "coluna desconhecida" e o usuário não tem como adivinhar por quê.
 */
function decodificar(bytes: ArrayBuffer): string {
  const utf8 = new TextDecoder('utf-8').decode(bytes);
  if (!utf8.includes('�')) return utf8;
  return new TextDecoder('windows-1252').decode(bytes);
}

export async function importarPlanilha(
  _anterior: Resultado | null,
  fd: FormData,
): Promise<Resultado> {
  try {
    const sessao = await exigirImportador();

    const contaId = String(fd.get('conta_id') ?? '');
    const provedor = String(fd.get('provedor') ?? '') as ProvedorPlanilha;
    const arquivo = fd.get('arquivo');

    if (!contaId) return { ok: false, mensagem: 'Escolha a loja.' };
    if (!PROVEDORES.includes(provedor)) {
      return { ok: false, mensagem: 'Escolha o tipo de planilha.' };
    }
    if (!(arquivo instanceof File) || arquivo.size === 0) {
      return { ok: false, mensagem: 'Escolha um arquivo CSV.' };
    }
    if (arquivo.size > LIMITE_BYTES) {
      return {
        ok: false,
        mensagem: 'Arquivo acima de 4 MB. Divida por mês e importe em partes.',
      };
    }

    const texto = decodificar(await arquivo.arrayBuffer());
    const leitura = lerPlanilha(texto, provedor);

    /* Nada entrou: devolve os primeiros erros com o número da linha, em
       vez de um "formato inválido" que não diz onde olhar. */
    if (leitura.linhas.length === 0) {
      const amostra = leitura.erros
        .slice(0, 3)
        .map((e) => (e.linha > 0 ? `linha ${e.linha}: ${e.motivo}` : e.motivo))
        .join(' · ');
      return {
        ok: false,
        mensagem: amostra || 'Nenhuma linha aproveitável na planilha.',
      };
    }

    const linhas = agrupar(leitura.linhas);

    const r = await gravarMetricas({
      contaId,
      provedor,
      linhas,
      origem: 'importacao',
      autorId: sessao.id,
    });

    if (!r.ok) return { ok: false, mensagem: r.mensagem };

    revalidatePath('/painel/metricas');
    revalidatePath('/painel/contas');
    revalidatePath('/painel/visao');

    /* Sucesso parcial se conta como sucesso, mas NUNCA sem dizer o que
       ficou de fora: importação que reporta só o que entrou faz o mês
       fechar menor do que foi, e ninguém procura o motivo. */
    const partes = [r.mensagem];
    if (leitura.erros.length > 0) {
      const linhasComErro = leitura.erros.map((e) => e.linha).join(', ');
      partes.push(
        `${leitura.erros.length} linha(s) NÃO entraram (${linhasComErro}): ${leitura.erros[0].motivo}`,
      );
    }
    if (leitura.ignoradas.length > 0) {
      partes.push(`Colunas ignoradas: ${leitura.ignoradas.join(', ')}.`);
    }

    return { ok: true, mensagem: partes.join(' ') };
  } catch (e) {
    return { ok: false, mensagem: (e as Error).message };
  }
}
