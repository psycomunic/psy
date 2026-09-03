import { frentes } from '@/conteudo/frentes';

/**
 * O objeto focal da hero.
 *
 * A hero não tinha foco nenhum: era texto alinhado à esquerda e três
 * números. Falta um artefato para o olho pousar.
 *
 * Este painel é esse artefato, e usa CONTEÚDO REAL: as perguntas que
 * cada frente responde, tiradas de `frentes.duvidas`. Nada de gráfico
 * com número inventado. Um painel com "+312% de receita" ao lado do
 * nome de nenhum cliente é ficção com cara de case, e a regra de
 * compliance do escopo proíbe justamente isso: número no site só com
 * autorização escrita e período declarado.
 *
 * O que ele mostra é o que a Psy Comunic realmente entrega de graça: as
 * perguntas certas, nas quatro frentes.
 */
export function PainelDiagnostico() {
  return (
    <div className="relative">
      {/* Cartão fantasma atrás, deslocado. Duas camadas dão espessura ao
          objeto: uma só ficaria colada no fundo. */}
      <div
        aria-hidden
        className="absolute inset-x-6 -bottom-4 top-8 rounded-[var(--raio)] border border-fio bg-marinho-fundo/60"
      />

      <div className="cartao relative overflow-hidden backdrop-blur-sm">
        {/* Fio de luz na aresta superior */}
        <div aria-hidden className="aresta absolute inset-x-10 top-0 h-px" />

        {/* Barra de janela */}
        <div className="flex items-center gap-3 border-b border-fio px-6 py-4">
          <span aria-hidden className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-magenta/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
          </span>
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-cinza">
            Diagnóstico · 4 frentes
          </p>
          <span className="ml-auto flex items-center gap-2">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-magenta-texto" />
            <span className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-magenta-texto">
              Sem custo
            </span>
          </span>
        </div>

        {/* As quatro frentes com a pergunta que cada uma responde */}
        <ul className="divide-y divide-[var(--fio)]">
          {frentes.map((f, i) => (
            <li key={f.slug} className="group flex gap-4 px-6 py-5 transition-colors hover:bg-white/[0.03]">
              <span className="tabular mt-0.5 font-mono text-xs text-magenta-texto">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="min-w-0">
                <p className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-cinza">
                  {f.nome}
                </p>
                <p className="mt-1.5 text-[0.95rem] leading-snug text-neve">
                  {f.duvidas[0]}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <div className="border-t border-fio px-6 py-4">
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-cinza">
            As perguntas saem do diagnóstico. As respostas, da operação.
          </p>
        </div>
      </div>
    </div>
  );
}
