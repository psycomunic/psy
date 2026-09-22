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
 * CADA UMA CONTA UMA HISTÓRIA, COM ORDEM
 * ============================================================
 * Não são formas abstratas se mexendo, e não é tudo aparecendo junto.
 * O anúncio entra, o coração enche, o botão de mensagem pisca, a
 * conversa desliza, a pessoa digita e a resposta sai com os dois tiques.
 * A busca é escrita letra a letra e os resultados descem, com o anúncio
 * no topo. A rua se desenha, o pino cai e a ficha da empresa sobe com
 * as avaliações e os botões de ligar e traçar rota.
 *
 * ============================================================
 * NADA AQUI AFIRMA NADA
 * ============================================================
 * Sem nome de cliente, sem nota, sem número de avaliações. O que tem
 * texto é ou rótulo de interface ("Patrocinado", "Ligar", "Rota") ou o
 * genérico "Sua empresa", que é justamente o convite. Nota inventada
 * numa ilustração continua sendo nota inventada.
 *
 * Tudo `aria-hidden`: quem usa leitor de tela já recebeu a mesma coisa
 * no texto e na lista de entregas ao lado. Descrever a decoração seria
 * repetir.
 */

/*
  Retrato no telefone, paisagem daí para cima.

  Medido: numa coluna de 292px o 4:3 dá uma caixa de 219px de altura, e a
  cena do anúncio precisa de 391. Ela era cortada no meio da conversa,
  que é justamente a parte que o bloco promete.

  A imagem do entregável usa as MESMAS proporções: se divergissem,
  trocar uma pela outra mudaria a altura do bloco.
*/
function Moldura({ children }: { children: React.ReactNode }) {
  return (
    <div aria-hidden className="cena-servico aspect-[3/4] w-full sm:aspect-[4/3]">
      <div className="absolute inset-0 grid place-items-center p-4 sm:p-5">{children}</div>
    </div>
  );
}

/** Barra cinza, o "texto" das telas. Repetida demais para ficar solta. */
function Barra({ w, claro = false }: { w: string; claro?: boolean }) {
  return (
    <span
      className={`block h-1.5 rounded-full ${claro ? 'bg-tinta/20' : 'bg-tinta/12'}`}
      style={{ width: w }}
    />
  );
}

/* ================================================================
   1. O anúncio no feed que vira conversa no WhatsApp
   ================================================================ */
function CenaAnuncio() {
  return (
    <Moldura>
      <div className="relative w-full max-w-[330px]">
        <div className="cena-post overflow-hidden rounded-xl border border-fio bg-papel-alt/80 shadow-[0_16px_36px_-14px_rgba(0,0,0,0.85)]">
          {/* Cabeçalho do post */}
          <div className="flex items-center gap-2 px-3 py-2">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-[conic-gradient(from_210deg,var(--exp-tarja),#F59E0B,#7C3AED,var(--exp-tarja))]">
              <span className="h-[22px] w-[22px] rounded-full bg-papel-alt" />
            </span>
            <span className="min-w-0">
              <span className="block text-[0.6rem] font-semibold leading-tight text-tinta">
                Sua empresa
              </span>
              <span className="block text-[0.5rem] leading-tight text-tinta-fraca">
                Bragança, PA
              </span>
            </span>
            <span className="ml-auto rounded-full border border-rosa/50 px-2 py-0.5 text-[0.46rem] text-acento">
              Patrocinado
            </span>
          </div>

          {/* A arte do anúncio */}
          <div className="relative h-[60px] bg-[linear-gradient(135deg,color-mix(in_oklab,var(--exp-tarja)_42%,transparent),color-mix(in_oklab,#2B6BFF_32%,transparent))]">
            <span className="absolute inset-0 bg-[linear-gradient(180deg,transparent_55%,rgba(6,9,26,0.55))]" />
            <span className="absolute bottom-2 left-3 right-3 flex flex-col gap-1">
              <Barra w="62%" claro />
              <Barra w="40%" />
            </span>
          </div>

          {/* Curtir, comentar, enviar */}
          <div className="flex items-center gap-3 px-3 pt-2">
            <svg viewBox="0 0 24 24" className="cena-curtir h-3.5 w-3.5" fill="currentColor">
              <path d="M12 20.5s-7.5-4.6-7.5-9.4A4.1 4.1 0 0 1 12 8.6a4.1 4.1 0 0 1 7.5 2.5c0 4.8-7.5 9.4-7.5 9.4Z" />
            </svg>
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-tinta-fraca" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 11.5a8 8 0 0 1-11.6 7.1L3 20.5l1.9-6.4A8 8 0 1 1 21 11.5Z" strokeLinejoin="round" />
            </svg>
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-tinta-fraca" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21.5 3 2.5 10.2l7.2 2.7 2.7 7.2L21.5 3Z" strokeLinejoin="round" />
            </svg>
          </div>

          {/* A legenda e o botão que leva para a conversa */}
          <div className="px-3 pt-2">
            <Barra w="78%" />
          </div>
          <div className="cena-cta mx-3 mb-2.5 mt-2.5 flex items-center justify-center gap-1.5 rounded-lg bg-rosa py-1.5">
            <svg viewBox="0 0 24 24" className="h-3 w-3 text-tinta" fill="currentColor">
              <path d="M12 2a10 10 0 0 0-8.7 15l-1.2 4.3 4.4-1.2A10 10 0 1 0 12 2Z" />
            </svg>
            <span className="text-[0.58rem] font-semibold text-tinta">Enviar mensagem</span>
          </div>
        </div>

        {/* A conversa que chega */}
        <div className="cena-zap mt-2 overflow-hidden rounded-xl border border-fio bg-papel-alt/95 shadow-[0_16px_36px_-14px_rgba(0,0,0,0.85)]">
          <div className="space-y-1.5 p-2">
            {/* Quem chegou pelo anúncio */}
            <div className="cena-balao w-[76%] rounded-lg rounded-tl-sm border border-fio bg-papel-alt/80 px-2.5 py-1">
              <span className="block text-[0.55rem] leading-snug text-tinta">
                Oi! Vi o anúncio, vocês atendem em Bragança?
              </span>
            </div>

            {/* O "digitando", que é o instante entre a pergunta e a resposta */}
            <div className="cena-digitando flex w-max items-center gap-1 rounded-lg bg-papel-alt/60 px-2.5 py-2">
              <span className="cena-ponto h-1 w-1 rounded-full bg-tinta-fraca" />
              <span className="cena-ponto h-1 w-1 rounded-full bg-tinta-fraca" />
              <span className="cena-ponto h-1 w-1 rounded-full bg-tinta-fraca" />
            </div>

            {/* A resposta */}
            <div className="cena-balao-2 ml-auto w-[70%] rounded-lg rounded-tr-sm bg-[#25D366]/85 px-2.5 py-1">
              <span className="block text-[0.55rem] leading-snug text-[#06210F]">
                Atendemos sim. Pode me contar o que precisa?
              </span>
              <span className="mt-0.5 flex items-center justify-end gap-1">
                <span className="text-[0.42rem] text-[#06210F]/60">agora</span>
                <svg viewBox="0 0 24 24" className="cena-tique h-2.5 w-2.5 text-[#0B4FA8]" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <path d="m2 13 4 4 8-9M10 17l8-9" />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </div>
    </Moldura>
  );
}

/* ================================================================
   2. A busca no Google, com a empresa no topo
   ================================================================ */
function CenaBusca() {
  return (
    <Moldura>
      <div className="w-full max-w-[340px]">
        <div className="flex items-center gap-2.5 rounded-full border border-fio bg-papel-alt/75 px-4 py-2.5 shadow-[0_14px_32px_-16px_rgba(0,0,0,0.85)]">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 flex-none text-tinta-fraca" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" strokeLinecap="round" />
          </svg>
          <span className="cena-digita text-[0.6rem] text-tinta">
            eletricista em bragança
          </span>
          <span className="cena-cursor h-3 w-px flex-none bg-rosa" />
        </div>

        <div className="mt-3 space-y-2">
          {/* O resultado patrocinado, que é o entregável */}
          <div className="cena-linha-1 rounded-lg border border-rosa/45 bg-rosa/[0.08] p-2.5">
            <div className="flex items-center gap-1.5">
              <span className="rounded border border-rosa/50 px-1.5 py-px text-[0.44rem] text-acento">
                Anúncio
              </span>
              <span className="text-[0.46rem] text-tinta-fraca">suaempresa.com.br</span>
            </div>
            <span className="mt-1.5 block text-[0.62rem] font-semibold leading-snug text-tinta">
              Sua empresa · Atendimento em Bragança e região
            </span>
            <span className="mt-1 block space-y-1">
              <Barra w="100%" />
              <Barra w="72%" />
            </span>
            {/* As extensões de chamada, que é o que faz o telefone tocar */}
            <div className="cena-acoes mt-2 flex gap-1.5">
              {['Ligar', 'Como chegar', 'WhatsApp'].map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-fio px-2 py-0.5 text-[0.44rem] text-tinta-fraca"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Os orgânicos, mais apagados: é o contraste que conta */}
          <div className="cena-linha-2 rounded-lg border border-fio p-2.5">
            <Barra w="58%" claro />
            <span className="mt-1.5 block space-y-1">
              <Barra w="100%" />
              <Barra w="45%" />
            </span>
          </div>
          <div className="cena-linha-3 rounded-lg border border-fio p-2.5">
            <Barra w="44%" claro />
            <span className="mt-1.5 block">
              <Barra w="80%" />
            </span>
          </div>
        </div>
      </div>
    </Moldura>
  );
}

/* ================================================================
   3. O perfil no Google e no Maps
   ================================================================ */
function CenaMapa() {
  return (
    <Moldura>
      <div className="relative w-full max-w-[320px]">
        {/* As ruas, desenhando-se antes do pino cair */}
        <svg
          viewBox="0 0 320 120"
          className="absolute inset-x-0 top-0 h-[120px] w-full text-acento/25"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        >
          <path className="cena-mapa-tracado" d="M-10 86 C60 86 76 40 140 40 S250 74 330 60" strokeDasharray="260" />
          <path className="cena-mapa-tracado" d="M52 -10 C52 40 92 58 92 130" strokeDasharray="260" opacity=".6" />
          <path className="cena-mapa-tracado" d="M230 -10 C230 34 200 52 214 130" strokeDasharray="260" opacity=".45" />
        </svg>

        <div className="relative grid place-items-center pb-1 pt-4">
          <span className="cena-onda absolute h-16 w-16 rounded-full border border-rosa" />
          <svg
            viewBox="0 0 24 24"
            className="cena-pino relative h-14 w-14 text-acento drop-shadow-[0_8px_16px_rgba(255,46,99,0.6)]"
            fill="currentColor"
          >
            <path d="M12 2c-3.9 0-7 3.1-7 7 0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7Z" />
            <circle cx="12" cy="9" r="2.6" fill="var(--bg)" />
          </svg>
        </div>

        {/* A ficha da empresa no Maps */}
        <div className="cena-ficha rounded-xl border border-fio bg-papel-alt/85 p-3 shadow-[0_16px_36px_-14px_rgba(0,0,0,0.85)]">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 flex-none place-items-center rounded-lg bg-[linear-gradient(135deg,var(--exp-tarja),#7C3AED)]">
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-tinta" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 9h16v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9Z" />
                <path d="M3 9l1.6-4.2A1 1 0 0 1 5.5 4h13a1 1 0 0 1 .9.8L21 9" />
              </svg>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[0.64rem] font-semibold leading-tight text-tinta">
                Sua empresa
              </span>
              <span className="mt-1 block">
                <Barra w="60%" />
              </span>
            </span>
            <span className="cena-chip flex-none rounded-full border border-[#25D366]/45 bg-[#25D366]/10 px-2 py-0.5 text-[0.44rem] text-[#25D366]">
              Aberto
            </span>
          </div>

          {/* As avaliações. Estrelas sem nota: nota inventada continua
              inventada, mesmo dentro de um desenho. */}
          <div className="mt-2.5 flex items-center gap-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <svg key={i} viewBox="0 0 24 24" className="cena-estrela h-3 w-3 text-acento" fill="currentColor">
                <path d="m12 3 2.6 5.6 6.1.8-4.5 4.2 1.2 6.1L12 16.8 6.6 19.7l1.2-6.1-4.5-4.2 6.1-.8L12 3Z" />
              </svg>
            ))}
            <span className="ml-1"><Barra w="34px" /></span>
          </div>

          {/* O que a pessoa faz a partir da ficha */}
          <div className="cena-acoes mt-3 grid grid-cols-3 gap-1.5">
            {[
              { t: 'Ligar', d: 'M5 4h3l1.5 4-2 1.5a12 12 0 0 0 5 5L14 12l4 1.5V17a2 2 0 0 1-2.2 2A15 15 0 0 1 3 6.2 2 2 0 0 1 5 4Z' },
              { t: 'Rota', d: 'M12 2 3 21l9-4 9 4L12 2Z' },
              { t: 'Site', d: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 0c2.5 2.3 3.8 5.3 3.8 9S14.5 18.7 12 21m0-18C9.5 5.3 8.2 8.3 8.2 12S9.5 18.7 12 21M3.5 9h17M3.5 15h17' },
            ].map((b) => (
              <span
                key={b.t}
                className="flex flex-col items-center gap-1 rounded-lg border border-fio py-1.5 text-acento"
              >
                <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
                  <path d={b.d} />
                </svg>
                <span className="text-[0.42rem] text-tinta-fraca">
                  {b.t}
                </span>
              </span>
            ))}
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
