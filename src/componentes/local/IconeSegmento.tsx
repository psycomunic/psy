/**
 * Ícones dos segmentos atendidos pela unidade local.
 *
 * Mesmo desenho dos ícones das frentes: traço geométrico de 1.5px, sem
 * preenchimento, no peso do fio que contorna os cards. É o que faz o
 * ícone parecer parte do desenho em vez de um adesivo colado por cima.
 *
 * `currentColor` de propósito: o ícone acompanha a cor do bloco no
 * hover sem uma linha de CSS a mais.
 *
 * Inline, e não arquivo: são seis desenhos de poucas centenas de bytes
 * numa página que já carrega uma cena de vídeo. Seis requisições a mais
 * custariam mais que o desenho inteiro.
 */
const tracos: Record<string, React.ReactNode> = {
  /* Comércio: a sacola, que é o gesto de comprar na rua. */
  comercio: (
    <>
      <path d="M4.5 8h15l-1.2 11.2a2 2 0 0 1-2 1.8H7.7a2 2 0 0 1-2-1.8L4.5 8Z" />
      <path d="M8.75 8V6.25a3.25 3.25 0 0 1 6.5 0V8" />
    </>
  ),
  /* Saúde: a cruz dentro do escudo do cuidado. */
  saude: (
    <>
      <path d="M12 3.2 20 6v5.4c0 4.4-3.2 7.7-8 9.4-4.8-1.7-8-5-8-9.4V6l8-2.8Z" />
      <path d="M12 9v6M9 12h6" />
    </>
  ),
  /* Alimentação: talher, o símbolo que ninguém precisa decifrar. */
  alimentacao: (
    <>
      <path d="M7 3v7a2.5 2.5 0 0 0 5 0V3" />
      <path d="M9.5 10v11" />
      <path d="M17 3c-1.6 1.2-2.5 3-2.5 5.2 0 1.6.9 2.6 2.5 2.8V21" />
    </>
  ),
  /* Turismo: o sol sobre a linha do mar, que aqui é Ajuruteua. */
  turismo: (
    <>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M12 2v1.5M12 13.5V15M18.5 8.5H17M7 8.5H5.5M16.6 4.4l-1 1M8.4 12.6l-1 1M16.6 12.6l-1-1M8.4 4.4l-1-1" />
      <path d="M3 19h4.5c1 0 1.4-1 2.5-1s1.5 1 2.5 1 1.4-1 2.5-1 1.5 1 2.5 1H21" />
    </>
  ),
  /* Serviços: a chave de boca, o ofício que conserta. */
  servicos: (
    <>
      <path d="M15.6 4.4a4.6 4.6 0 0 0-6 5.9L4 15.9a2 2 0 0 0 0 2.8l1.3 1.3a2 2 0 0 0 2.8 0l5.6-5.6a4.6 4.6 0 0 0 5.9-6l-2.7 2.7-2.6-.7-.7-2.6 2.7-2.7Z" />
    </>
  ),
  /* Escritórios: a pasta com o documento, o trabalho de mesa. */
  escritorios: (
    <>
      <rect x="4" y="3.5" width="16" height="17" rx="2" />
      <path d="M8.5 8h7M8.5 12h7M8.5 16h4" />
    </>
  ),
};

/** Normaliza "Alimentação" para "alimentacao", que é a chave do desenho. */
export const chaveDoSegmento = (nome: string) =>
  nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z]/g, '');

export function IconeSegmento({ grupo, className = '' }: { grupo: string; className?: string }) {
  const traco = tracos[chaveDoSegmento(grupo)];
  if (!traco) return null;

  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {traco}
    </svg>
  );
}
