'use client';

import { useState } from 'react';

/**
 * Copiar um texto pronto.
 *
 * Mora em arquivo próprio porque duas telas precisam dele: a lista de
 * prospecção e a ficha do lead no funil. Importar um do outro arrastaria
 * a lista inteira para dentro do pacote do CRM.
 *
 * `navigator.clipboard` não existe fora de HTTPS e pode ser negado por
 * permissão. Quando falha, o botão NÃO finge que deu certo: avisa, e a
 * pessoa copia à mão do texto que está logo acima.
 */
export function BotaoCopiar({ texto, rotulo = 'Copiar mensagem' }: { texto: string; rotulo?: string }) {
  const [copiado, setCopiado] = useState<'nao' | 'sim' | 'falhou'>('nao');

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado('sim');
      setTimeout(() => setCopiado('nao'), 2500);
    } catch {
      setCopiado('falhou');
    }
  }

  return (
    <p className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={copiar}
        className="rounded-full border border-fio px-4 py-2 text-xs font-semibold text-neve transition-colors hover:bg-white/5"
      >
        {rotulo}
      </button>
      <span aria-live="polite" className="text-xs text-cinza">
        {copiado === 'sim' ? 'Copiada.' : null}
        {copiado === 'falhou' ? 'O navegador não deixou copiar. Selecione o texto acima.' : null}
      </span>
    </p>
  );
}
