/**
 * A cena de cada serviço, desenhada.
 *
 * ============================================================
 * ONDE ELA ENTRA
 * ============================================================
 * No lugar do print do entregável, enquanto ele não existir. Ocupa
 * exatamente a mesma caixa 4:3, então o dia em que a foto real chegar a
 * troca não mexe em layout nenhum.
 *
 * ============================================================
 * POR QUE DESENHO, E NÃO VÍDEO NEM GIF
 * ============================================================
 * Cada cena são alguns bytes de HTML e as regras que já estão no
 * globals.css. Um GIF por bloco custaria mais que toda a seção de
 * serviços, e esta página já carrega uma cena de vídeo de 17 MB: não
 * sobra orçamento para enfeite pesado.
 *
 * ============================================================
 * CADA UMA CONTA O QUE O SERVIÇO FAZ
 * ============================================================
 * Não são formas abstratas se mexendo. O anúncio aparece e a conversa
 * cai no WhatsApp. A busca é digitada e a empresa surge no topo. O pino
 * cai no mapa e a ficha da empresa aparece com as avaliações. É a
 * promessa do bloco, em movimento.
 *
 * Tudo `aria-hidden`: quem usa leitor de tela já recebeu a mesma coisa
 * no texto e na lista de entregas logo ao lado. Descrever a decoração
 * seria repetir.
 */

function Moldura({ children }: { children: React.ReactNode }) {
  return (
    <div aria-hidden className="cena-servico aspect-[4/3] w-full">
      <div className="absolute inset-0 grid place-items-center p-5 sm:p-6">{children}</div>
    </div>
  );
}

/** 1. O anúncio no feed, e a conversa que chega. */
function CenaAnuncio() {
  return (
    <Moldura>
      <div className="relative w-full max-w-[320px]">
        {/* O post patrocinado */}
        <div className="cena-post rounded-xl border border-fio bg-marinho-alto/70 p-3 shadow-[0_12px_30px_-12px_rgba(0,0,0,0.8)]">
          <div className="flex items-center gap-2">
            <span className="h-6 w-6 rounded-full bg-[linear-gradient(135deg,var(--magenta),#7C3AED)]" />
            <span className="h-2 w-16 rounded-full bg-white/25" />
            <span className="ml-auto rounded-full border border-magenta/50 px-2 py-0.5 font-mono text-[0.5rem] uppercase tracking-[0.1em] text-magenta-texto">
              Patrocinado
            </span>
          </div>
          <div className="mt-2.5 h-16 rounded-lg bg-[linear-gradient(135deg,color-mix(in_oklab,var(--magenta)_35%,transparent),color-mix(in_oklab,#2B6BFF_28%,transparent))]" />
          <div className="mt-2.5 h-2 w-3/4 rounded-full bg-white/18" />
          <div className="mt-1.5 h-2 w-1/2 rounded-full bg-white/12" />
        </div>

        {/* As mensagens caindo no WhatsApp */}
        <div className="mt-3 space-y-1.5">
          <div className="cena-balao ml-auto w-[78%] rounded-xl rounded-tr-sm bg-[#25D366]/85 px-3 py-2">
            <span className="block h-1.5 w-full rounded-full bg-black/25" />
            <span className="mt-1 block h-1.5 w-2/3 rounded-full bg-black/20" />
          </div>
          <div className="cena-balao-2 w-[60%] rounded-xl rounded-tl-sm border border-fio bg-marinho-alto/80 px-3 py-2">
            <span className="block h-1.5 w-full rounded-full bg-white/20" />
          </div>
        </div>
      </div>
    </Moldura>
  );
}

/** 2. A busca sendo digitada, e a empresa no topo. */
function CenaBusca() {
  return (
    <Moldura>
      <div className="w-full max-w-[330px]">
        {/* O campo de busca */}
        <div className="flex items-center gap-2.5 rounded-full border border-fio bg-marinho-alto/70 px-4 py-2.5 shadow-[0_12px_30px_-14px_rgba(0,0,0,0.8)]">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 flex-none text-cinza" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" strokeLinecap="round" />
          </svg>
          <span className="cena-digita font-mono text-[0.6rem] text-neve">
            eletricista em bragança
          </span>
          <span className="cena-cursor h-3 w-px flex-none bg-magenta" />
        </div>

        {/* Os resultados, com o anúncio no topo */}
        <div className="mt-3.5 space-y-2">
          <div className="cena-linha-1 rounded-lg border border-magenta/45 bg-magenta/10 p-2.5">
            <div className="flex items-center gap-2">
              <span className="rounded border border-magenta/50 px-1.5 py-px font-mono text-[0.48rem] uppercase tracking-[0.08em] text-magenta-texto">
                Anúncio
              </span>
              <span className="h-1.5 w-20 rounded-full bg-white/30" />
            </div>
            <span className="mt-1.5 block h-1.5 w-full rounded-full bg-white/15" />
          </div>
          <div className="cena-linha-2 rounded-lg border border-fio p-2.5">
            <span className="block h-1.5 w-2/3 rounded-full bg-white/14" />
            <span className="mt-1.5 block h-1.5 w-full rounded-full bg-white/8" />
          </div>
          <div className="cena-linha-3 rounded-lg border border-fio p-2.5">
            <span className="block h-1.5 w-1/2 rounded-full bg-white/14" />
          </div>
        </div>
      </div>
    </Moldura>
  );
}

/** 3. O pino no mapa, e a ficha da empresa. */
function CenaMapa() {
  return (
    <Moldura>
      <div className="relative w-full max-w-[300px]">
        <div className="relative grid place-items-center pb-2">
          {/* A onda que sai do pino quando ele encosta */}
          <span className="cena-onda absolute h-14 w-14 rounded-full border border-magenta" />
          <svg
            viewBox="0 0 24 24"
            className="cena-pino relative h-12 w-12 text-magenta drop-shadow-[0_6px_14px_rgba(228,21,95,0.55)]"
            fill="currentColor"
          >
            <path d="M12 2c-3.9 0-7 3.1-7 7 0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7Z" />
            <circle cx="12" cy="9" r="2.6" fill="var(--marinho-fundo)" />
          </svg>
        </div>

        {/* A ficha da empresa */}
        <div className="cena-ficha mt-1 rounded-xl border border-fio bg-marinho-alto/75 p-3 shadow-[0_12px_30px_-12px_rgba(0,0,0,0.8)]">
          <div className="flex items-center gap-2">
            <span className="h-7 w-7 rounded-lg bg-[linear-gradient(135deg,var(--magenta),#7C3AED)]" />
            <div className="min-w-0 flex-1">
              <span className="block h-2 w-24 rounded-full bg-white/28" />
              <span className="mt-1.5 block h-1.5 w-16 rounded-full bg-white/14" />
            </div>
          </div>
          <div className="mt-2.5 flex items-center gap-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <svg key={i} viewBox="0 0 24 24" className="cena-estrela h-3 w-3 text-magenta-texto" fill="currentColor">
                <path d="m12 3 2.6 5.6 6.1.8-4.5 4.2 1.2 6.1L12 16.8 6.6 19.7l1.2-6.1-4.5-4.2 6.1-.8L12 3Z" />
              </svg>
            ))}
            <span className="ml-1.5 h-1.5 w-8 rounded-full bg-white/18" />
          </div>
        </div>
      </div>
    </Moldura>
  );
}

const cenas: Record<string, () => React.ReactElement> = {
  instagram: CenaAnuncio,
  google: CenaBusca,
  'google-meu-negocio': CenaMapa,
};

export function CenaServico({ id }: { id: string }) {
  const Cena = cenas[id];
  return Cena ? <Cena /> : null;
}
