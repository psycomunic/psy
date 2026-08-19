/**
 * Carrossel infinito com os logos das marcas atendidas.
 *
 * A emenda é invisível porque a fita contém a lista DUAS vezes e anda
 * exatamente -50%. No fim do ciclo a segunda cópia está onde a primeira
 * começou, e o salto de volta ao zero não aparece.
 *
 * Os arquivos são silhuetas brancas com fundo transparente, então não
 * precisam de máscara nem de recolorização: basta controlar a opacidade.
 * Entram como DECORATIVOS, `alt=""`, porque não existe mapeamento de
 * qual número é qual marca. Ver o comentário em conteudo/trabalhos.ts.
 * Os nomes vão em texto, para leitor de tela, em quem chama este
 * componente.
 *
 * Sem JS: é animação CSS. E `prefers-reduced-motion` a desliga, deixando
 * a fita parada.
 */
export function FitaMarcas({
  logos,
  duracao = 62,
  volta = false,
}: {
  logos: readonly string[];
  duracao?: number;
  volta?: boolean;
}) {
  const dobrado = [...logos, ...logos];

  return (
    <div className="fita-caixa esmaece-lados overflow-hidden py-2" aria-hidden>
      <div
        className={'fita items-center gap-14 md:gap-20' + (volta ? ' fita--volta' : '')}
        style={{ ['--duracao' as string]: `${duracao}s` }}
      >
        {dobrado.map((arquivo, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${arquivo}-${i}`}
            src={`/imagens/marcas/${arquivo}`}
            alt=""
            loading="lazy"
            decoding="async"
            /*
              Altura fixa e largura automática: os logos têm proporções
              muito diferentes (de 160x76 a 245x48). Travar a LARGURA
              deixaria uns gigantes e outros minúsculos; travar a altura
              é o que faz uma fileira de marcas parecer alinhada.

              max-width evita que um logo muito deitado ocupe meia fita.
            */
            className="h-7 w-auto max-w-[9.5rem] shrink-0 object-contain opacity-55 transition-opacity duration-300 hover:opacity-100 md:h-8"
          />
        ))}
      </div>
    </div>
  );
}
