/**
 * O que aparece no instante do clique, enquanto o módulo carrega.
 *
 * ============================================================
 * POR QUE ELE EXISTE
 * ============================================================
 * Trocar de aba no menu é navegação do lado do cliente, e numa rota
 * dinâmica o Next segura a tela ANTERIOR até o conteúdo novo chegar.
 * Medido, isso é 1 a 3 segundos olhando para a página velha depois de
 * já ter clicado, o que se sente como clique que não funcionou.
 *
 * Com este arquivo, o esqueleto entra na hora e o menu nem pisca: ele
 * mora no layout do segmento pai, que não é refeito.
 *
 * ============================================================
 * BLOCOS, E NÃO UM RELÓGIO GIRANDO
 * ============================================================
 * Do tamanho do que vem depois. A forma já no lugar faz a chegada do
 * conteúdo parecer continuação, e não troca de tela. `animate-pulse`
 * diz que está vivo.
 *
 * `aria-hidden` na forma, com o aviso em texto ao lado: a barra cinza
 * não significa nada para quem usa leitor de tela, e a palavra sim.
 */
export default function Carregando() {
  return (
    <div>
      <p role="status" className="sr-only">
        Carregando
      </p>

      <div aria-hidden className="animate-pulse">
        <div className="h-3 w-24 rounded-full bg-white/[0.06]" />
        <div className="mt-3 h-8 w-56 rounded-lg bg-white/[0.06]" />

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-[136px] rounded-[var(--raio-p)] border border-fio bg-white/[0.02]"
            />
          ))}
        </div>

        <div className="mt-10 h-5 w-32 rounded-full bg-white/[0.06]" />
        <div className="mt-5 h-[52px] rounded-[var(--raio-p)] border border-fio bg-white/[0.02]" />

        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-[220px] rounded-[var(--raio-p)] border border-fio bg-white/[0.02]"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
