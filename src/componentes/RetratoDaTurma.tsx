import Image from 'next/image';

/**
 * A foto da turma da Vinci Society, discreta.
 *
 * ============================================================
 * ERA FUNDO DE CARTÃO, E CHAMAVA ATENÇÃO DEMAIS
 * ============================================================
 * Ela ocupava o cartão 03 inteiro, de fundo, a 42% de opacidade, com
 * um degradê por cima só para o texto continuar legível. Duas coisas
 * erradas ao mesmo tempo: foto atrás de parágrafo disputa com a frase
 * que deveria sustentar, e dos três cartões só aquele tinha imagem,
 * o que quebrava o peso igual que os três precisam ter.
 *
 * Aqui ela é o que é: a prova de que o encontro aconteceu. Pequena,
 * numa faixa própria, com legenda. Quem quiser ver, vê; quem estiver
 * lendo as credenciais não é interrompido.
 *
 * O arquivo é 3:2 e a caixa é 3:2: sem corte.
 */
export function RetratoDaTurma({ className = '' }: { className?: string }) {
  return (
    <figure
      className={
        'flex flex-col gap-6 border-t border-fio pt-10 sm:flex-row sm:items-center sm:gap-10 ' +
        className
      }
    >
      <Image
        src="/imagens/mentoria-vinci.jpg"
        alt="Turma de um encontro presencial da Vinci Society, com Angelo Garcia entre os participantes"
        width={1600}
        height={1067}
        sizes="(max-width: 640px) 92vw, 520px"
        loading="lazy"
        className="aspect-[3/2] w-full flex-none rounded-[var(--raio)] object-cover sm:max-w-[520px]"
      />
      <figcaption className="max-w-[42ch] leading-relaxed text-tinta-fraca">
        <span className="font-semibold text-tinta">Encontro presencial da Vinci Society.</span>{' '}
        É a mentoria de onde vem o método que a Psy Comunic aplica na aquisição, e a
        foto está aqui porque credencial que se afirma deveria poder ser vista.
      </figcaption>
    </figure>
  );
}
