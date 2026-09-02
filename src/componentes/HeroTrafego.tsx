import Link from 'next/link';

/**
 * A abertura da página de tráfego, em tela cheia.
 *
 * ============================================================
 * O HOLOFOTE SAIU DAQUI
 * ============================================================
 * A parede de trabalhos com a luz que segue o cursor mudou para a
 * abertura da home, que é a porta de entrada do site. Repetir o mesmo
 * efeito nas duas páginas o gastaria: na segunda vez ninguém mexe o
 * mouse de novo. Aqui ficou o fundo padrão do site, e quem argumenta é
 * o texto.
 *
 * O componente vive em `ParedeHolofote` e não depende desta página.
 *
 * ============================================================
 * O CABEÇALHO TEM ALTURA, E ELA ENTRA NA CONTA
 * ============================================================
 * Ele é `sticky`, então ocupa espaço no fluxo: uma seção de `100svh`
 * logo abaixo termina exatamente uma altura de cabeçalho abaixo da
 * dobra, e o que sobra fica cortado em silêncio pelo `overflow-hidden`.
 * `--cabecalho` é medida e publicada pelo próprio cabeçalho, porque o
 * valor muda com a largura: 77px no telefone, 101px em 1024 e 81px em
 * 1440. Qualquer número escrito à mão erra em pelo menos um desses.
 *
 * ============================================================
 * NADA AQUI DEPENDE DE JAVASCRIPT
 * ============================================================
 * O título sobe por animação de CSS que roda no carregamento, e não por
 * observador. É a mesma regra do `Revelar`, e foi ela que já custou uma
 * página inteira invisível neste projeto.
 */
export function HeroTrafego({
  rotulo,
  titulo,
  texto,
  apoio,
  acao,
  linkWhatsapp,
}: {
  rotulo: string;
  /** Uma linha por entrada. Cada uma sobe separada. */
  titulo: string[];
  texto: string;
  apoio: string;
  acao: string;
  linkWhatsapp: string;
}) {
  return (
    <section
      aria-label="Abertura"
      className="relative isolate w-full overflow-hidden bg-marinho"
      style={{ minHeight: 'calc(100svh - var(--cabecalho, 81px))' }}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
        <div className="grade absolute inset-0 opacity-60" />
        <div className="brilho-magenta absolute -right-[16%] -top-[34%] h-[820px] w-[820px] opacity-45" />
        <div className="brilho-frio absolute -left-[22%] top-[28%] h-[680px] w-[680px] opacity-30" />
        <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-b from-transparent to-marinho" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[calc(100svh-var(--cabecalho,81px))] w-full max-w-[1320px] items-center px-5 pb-14 pt-16 md:px-10 md:pb-16 md:pt-20">
        <div className="max-w-[min(700px,100%)]">
          <p className="flex items-center gap-3 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-magenta-texto">
            <span aria-hidden className="h-px w-8 bg-magenta" />
            {rotulo}
          </p>

          <h1 className="hero-trafego mt-6 max-w-[15ch] font-display text-mostro font-extrabold tracking-[-0.04em]">
            {titulo.map((linha, i) => (
              <span key={linha} className="block" style={{ animationDelay: `${0.08 + i * 0.12}s` }}>
                {linha}
              </span>
            ))}
          </h1>

          <p className="mt-7 max-w-[46ch] text-guia leading-relaxed text-neve">{texto}</p>

          <div className="mt-9 flex flex-wrap items-center gap-3.5">
            <Link
              href="#analise"
              className="inline-flex min-h-[52px] items-center gap-2.5 rounded-full bg-magenta px-7 text-sm font-semibold text-branco transition-all duration-300 hover:-translate-y-0.5 hover:bg-magenta-forte hover:shadow-[0_10px_40px_-8px_rgba(228,21,95,0.75)]"
            >
              {acao}
              <span aria-hidden>→</span>
            </Link>
            <a
              href={linkWhatsapp}
              target="_blank"
              rel="noopener"
              className="inline-flex min-h-[52px] items-center gap-2.5 rounded-full px-7 text-sm font-semibold text-branco ring-1 ring-inset ring-white/20 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/5 hover:ring-white/45"
            >
              Falar no WhatsApp
              <span aria-hidden>→</span>
            </a>
          </div>

          <p className="mt-6 max-w-[42ch] text-sm leading-relaxed text-cinza">{apoio}</p>
        </div>
      </div>

      <style>{`
        .hero-trafego > span {
          animation: heroSobe .7s cubic-bezier(.22,.61,.36,1) both;
        }
        @keyframes heroSobe {
          from { opacity: 0; transform: translateY(22px); filter: blur(6px); }
          to   { opacity: 1; transform: none; filter: blur(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-trafego > span { animation: none; opacity: 1; transform: none; filter: none; }
        }
      `}</style>
    </section>
  );
}
