/**
 * Carrossel infinito de marcas.
 *
 * A lista era um parágrafo de 26 nomes quebrando linha. Vinte e seis
 * nomes empilhados leem-se como texto, e ninguém lê texto: viram uma
 * mancha cinza. Em movimento, cada nome ganha vez.
 *
 * A emenda é invisível porque a fita contém a lista DUAS vezes e anda
 * exatamente -50%. No fim do ciclo a segunda cópia está onde a primeira
 * começou, e o salto de volta ao zero não aparece.
 *
 * Sem JS: é animação CSS. E `prefers-reduced-motion` a desliga, deixando
 * a fita parada e legível.
 */
export function FitaMarcas({
  itens,
  duracao = 62,
  volta = false,
}: {
  itens: readonly string[];
  duracao?: number;
  volta?: boolean;
}) {
  const dobrado = [...itens, ...itens];

  return (
    <div className="fita-caixa esmaece-lados overflow-hidden py-1.5">
      <div
        className={'fita gap-3' + (volta ? ' fita--volta' : '')}
        style={{ ['--duracao' as string]: `${duracao}s` }}
      >
        {dobrado.map((nome, i) => (
          <span
            key={`${nome}-${i}`}
            // aria-hidden na segunda metade: ela é cópia visual, e um
            // leitor de tela não deve anunciar 52 marcas quando são 26.
            aria-hidden={i >= itens.length}
            className="whitespace-nowrap rounded-full border border-fio bg-white/[0.03] px-5 py-2.5 font-mono text-[0.78rem] uppercase tracking-[0.14em] text-cinza transition-colors hover:border-magenta/50 hover:text-neve"
          >
            {nome}
          </span>
        ))}
      </div>
    </div>
  );
}
