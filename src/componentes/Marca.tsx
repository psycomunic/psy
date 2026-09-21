import Link from 'next/link';

/**
 * O lockup da marca no cabeçalho.
 *
 * ============================================================
 * POR QUE NÃO É A LOGO OFICIAL INTEIRA
 * ============================================================
 * A logo oficial é empilhada: PSY grande e COMUNIC pequeno embaixo.
 * Medido no arquivo, COMUNIC ocupa 11,2% da altura total. Numa barra de
 * 81px a logo inteira caberia com 44px de altura, e aí COMUNIC sairia
 * com 4,9px. Para ele chegar a 9px, que é o mínimo para ler maiúscula
 * espacejada, a barra teria que ir a uns 112px em todas as páginas.
 *
 * Então aqui entra a MARCA (o PSY autêntico, vetor do arquivo oficial) e
 * o nome continua em texto, no tamanho em que se lê. É a redução que se
 * faz em espaço apertado, e é a mesma estrutura que já existia: a
 * diferença é que o PSY deixou de ser Bricolage Grotesque digitada e
 * passou a ser o desenho da marca.
 *
 * A logo inteira e correta vive em `public/logo-psy.svg`, para proposta,
 * documento e assinatura.
 *
 * ============================================================
 * ARQUIVO, E NÃO SVG COLADO AQUI
 * ============================================================
 * O desenho tem 8,7 KB. Colado no componente, ele viajaria dentro do
 * HTML de TODA página do site, toda vez. Como arquivo, o navegador
 * baixa uma vez e reaproveita.
 *
 * ============================================================
 * MÁSCARA, E NÃO <img>
 * ============================================================
 * O arquivo é `fill:white`, e o cabeçalho era marinho. Com o tema
 * claro a barra virou branca e a logo SUMIU: branco sobre branco.
 *
 * A máscara resolve de uma vez e para sempre: ela descarta a cor do
 * arquivo e usa só o recorte, então a logo herda a cor do texto em
 * volta. Marinho no cabeçalho branco, branca se um dia o cabeçalho
 * for escuro, sem um segundo arquivo para manter em dia.
 *
 * As medidas explícitas não são enfeite: sem elas a barra pula de
 * altura quando o desenho chega.
 */
export function Marca({ className = '' }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="Psy Comunic, início"
      className={`group inline-flex items-center gap-2.5 ${className}`}
    >
      {/* Decorativo: quem anuncia o destino é o aria-label do link.
          Repetir o nome aqui faria o leitor de tela dizer duas vezes
          a mesma coisa. */}
      <span
        aria-hidden
        className="block h-[24px] w-[52px] flex-none bg-tinta"
        style={{
          WebkitMaskImage: 'url(/logo-psy-marca.svg)',
          maskImage: 'url(/logo-psy-marca.svg)',
          WebkitMaskSize: 'contain',
          maskSize: 'contain',
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
          WebkitMaskPosition: 'left center',
          maskPosition: 'left center',
        }}
      />
      {/* Fio magenta entre a marca e o nome: o elemento gráfico que
          amarra o lockup à paleta. */}
      <span
        aria-hidden
        className="h-4 w-px bg-rosa transition-[height] duration-300 group-hover:h-5"
      />
      <span className="text-[0.8rem] font-medium leading-none text-tinta">
        Comunic
      </span>
    </Link>
  );
}
