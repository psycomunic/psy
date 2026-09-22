/**
 * O rastreio: o que acontece depois do botão.
 *
 * ============================================================
 * POR QUE ESTA PEÇA EXISTE
 * ============================================================
 * O botão abre o WhatsApp e a página some. Quem está com o dedo em
 * cima não sabe o que vem depois, e é essa dúvida que trava o clique,
 * não o preço nem o argumento.
 *
 * O propósito é EXPLICAÇÃO, que é a única razão pela qual uma página
 * de venda pode gastar movimento: ela demonstra como a coisa funciona.
 * Não é feedback e não é enfeite.
 *
 * ============================================================
 * TOCA UMA VEZ, E PARA
 * ============================================================
 * Laço infinito numa página de marketing é bateria de celular gasta
 * com decoração. O gatilho é a classe `.visivel`, que o observador de
 * revelação já aplica quando o bloco entra na tela: nenhum JavaScript
 * novo, nenhum observador a mais.
 *
 * A animação é CSS e não `requestAnimationFrame`: roda fora da thread
 * principal e continua lisa enquanto a página ainda carrega imagem,
 * que é exatamente o momento em que ela aparece no celular.
 *
 * Marcos e tempos vivem em globals.css, sob `.rastreio`.
 */
const MARCOS = [
  {
    n: '1',
    titulo: 'Você chama no WhatsApp',
    detalhe: 'Sem formulário e sem cadastro',
  },
  {
    n: '2',
    titulo: 'A gente olha a loja inteira',
    detalhe: 'Gestão, tecnologia, marketing e logística',
  },
  {
    n: '3',
    titulo: 'Você recebe as prioridades',
    detalhe: 'Por ordem de impacto no faturamento',
  },
];

export function Rastreio({ className = '' }: { className?: string }) {
  return (
    <section
      aria-label="O que acontece depois do pedido"
      className={'rastreio revelar ' + className}
    >
      <span className="campo-rotulo">Rastreio do pedido</span>

      <ol className="relative mt-6 grid gap-8 sm:grid-cols-3 sm:gap-6">
        {/*
          O fio que a linha percorre. Fica atrás dos marcos e some no
          celular, onde a lista empilha e um fio horizontal mentiria
          sobre a direção da leitura.
        */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-[7px] hidden h-px bg-fio sm:block"
        />
        <span
          aria-hidden
          className="rastreio-linha pointer-events-none absolute inset-x-0 top-[7px] hidden h-px bg-rosa sm:block"
        />

        {MARCOS.map((m) => (
          <li key={m.n} data-marco={m.n} className="relative">
            <span
              aria-hidden
              className="rastreio-ponto block h-[15px] w-[15px] rounded-full border-2 border-rosa bg-papel"
            />
            <div className="rastreio-texto mt-4">
              <p className="font-semibold">{m.titulo}</p>
              <p className="mt-1 text-sm leading-relaxed text-tinta-fraca">{m.detalhe}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
