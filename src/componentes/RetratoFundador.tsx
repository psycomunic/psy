import Image from 'next/image';
import { marca } from '@/conteudo/marca';
import { site } from '@/conteudo/site';

/**
 * O retrato do Angelo, ao lado das credenciais.
 *
 * ============================================================
 * ESTAVA ESCRITO DUAS VEZES, E DIVERGIU
 * ============================================================
 * A mesma figura vivia na home e em `/sobre`. Foi exatamente o que a
 * duplicação costuma cobrar: na troca de tema eu atualizei a da home e
 * esqueci a de `/sobre`, que ficou com a lavagem magenta e o véu
 * escuro do tema anterior, mais uma legenda pousada por cima da foto.
 * O véu apontava para `--marinho-fundo`, variável que já não existia,
 * então nem escurecia: era só marcação morta.
 *
 * ============================================================
 * NEM CORTE NEM VÉU
 * ============================================================
 * O arquivo chega em 1080x1350, que é 4:5 exato, a mesma proporção em
 * que ele aparece. O anterior era 3:2 deitado e a página cortava 480px
 * de largura, com o corte deslocado para 38% da esquerda para segurar
 * o "V" da Vinci dentro do quadro. Não se corta o que já veio no
 * formato certo.
 *
 * O véu escuro na base existia para a legenda pousar sobre a foto sem
 * caixa opaca. No tema claro a legenda vive embaixo da imagem, em
 * texto, que é a regra da galeria inteira.
 */
export function RetratoFundador({ className = '' }: { className?: string }) {
  return (
    <figure className={className}>
      <Image
        src="/imagens/angelo.jpg"
        alt={`${site.fundador}, fundador da ${marca.nome}, em um encontro da Vinci Society`}
        width={1080}
        height={1350}
        sizes="(max-width: 1024px) 92vw, 560px"
        className="aspect-[4/5] w-full rounded-[var(--raio)] object-cover"
      />

      <figcaption className="mt-5">
        <p className="font-display text-sub font-bold tracking-[-0.01em]">
          {site.fundador}
        </p>
        <p className="mt-1 text-sm text-tinta-fraca">
          Fundador da {marca.nome} · encontro da Vinci Society
        </p>
      </figcaption>
    </figure>
  );
}
