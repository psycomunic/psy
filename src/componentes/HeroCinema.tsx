'use client';

import { useEffect, useRef } from 'react';
import { Botao } from './Botao';

/**
 * Hero Scroll Cinema: o astronauta, e a entrada pelo visor.
 *
 * ============================================================
 * A JORNADA
 * ============================================================
 * Começa num astronauta flutuando sobre a Terra, de corpo inteiro e
 * pequeno no quadro. A câmera avança enquanto ele gira e vira o rosto
 * para nós. Termina com o visor dourado ocupando a tela inteira,
 * refletindo a Terra e uma luz magenta. Tudo comandado pela rolagem:
 * desce, a câmera aproxima; volta, ela recua.
 *
 * ============================================================
 * AS QUATRO INTERAÇÕES QUE TIRAM ISTO DE "VÍDEO COM TEXTO POR CIMA"
 * ============================================================
 * 1. A MIRA. Quatro cantos em fio fino começam abertos nas bordas da
 *    tela e fecham sobre o capacete conforme a câmera aproxima: a
 *    câmera "travando o alvo". Quando o visor preenche a tela, a mira
 *    solta e desaparece.
 * 2. O TEXTO PROJETADO NO VIDRO. As três camadas de texto não fazem
 *    fade: cada caractere é decodificado, passando por glifos
 *    aleatórios até assentar, no ritmo da rolagem. Rolar para trás
 *    "desdecodifica". É leitura de telemetria projetada no visor.
 * 3. A ABERTURA. No fim, um círculo cresce a partir do centro do visor
 *    e vira o fundo da seção seguinte. O visitante entra no site pelo
 *    visor, sem corte.
 * 4. A PARALAXE DO MOUSE. Vídeo, mira e texto respondem ao cursor em
 *    intensidades diferentes. Parado, a cena continua respirando.
 *
 * O mesmo progresso p (0 a 1) comanda tudo: vídeo, mira, decodificação,
 * telemetria, barra lateral e abertura. Uma variável só.
 *
 * ============================================================
 * ARMADILHAS QUE ESTE CÓDIGO JÁ EVITA (não regridam)
 * ============================================================
 * - hero.mp4 tem TODO quadro como keyframe (x264 keyint=1). Sem isso o
 *   scroll engasga. Receita em ARQUITETURA.md, seção Scroll Cinema.
 * - Lê video.readyState no bind, além de escutar loadedmetadata.
 * - document.hidden: painel oculto não entrega requestAnimationFrame.
 * - prefers-reduced-motion NÃO colapsa a altura (zera o scrollable e o
 *   site parece quebrado): reduz a 100vh, mostra o frame final com o
 *   texto completo, sem decodificação.
 * - Tela de carregamento obrigatória, solta no canplaythrough, com
 *   fallback de 6 s.
 * - Nenhum ancestral com overflow:hidden (mata o sticky). É clip.
 */

/* Glifos usados na decodificação. Poucos e "de painel": números, barras
   e colchetes. Letras aleatórias pareceriam erro de digitação. */
const GLIFOS = '01<>/|[]{}=+*#';

/* Janela de opacidade: 0 fora de [a, b], 1 no miolo, rampa nas pontas. */
function janela(p: number, a: number, b: number, rampa = 0.06) {
  if (p <= a || p >= b) return 0;
  return Math.min(1, (p - a) / rampa, (b - p) / rampa);
}

/* Ruído determinístico: o mesmo (índice, tique) sempre dá o mesmo
   glifo. Assim rolar para trás refaz exatamente o mesmo caminho, em vez
   de piscar diferente a cada quadro. */
function glifo(i: number, tique: number) {
  const n = Math.abs(Math.sin(i * 12.9898 + tique * 78.233) * 43758.5453);
  return GLIFOS[Math.floor(n) % GLIFOS.length];
}

/**
 * Decodifica um texto até a fração f (0 a 1): os caracteres antes da
 * fronteira estão assentados, os 3 seguintes ainda giram, o resto está
 * em branco. Espaços e quebras nunca viram glifo: a largura da linha
 * ficaria pulando.
 */
function decodificar(texto: string, f: number, tique: number) {
  const total = texto.length;
  const fronteira = Math.floor(f * (total + 3));
  let saida = '';
  for (let i = 0; i < total; i++) {
    const c = texto[i];
    if (c === ' ' || c === '\n') saida += c;
    else if (i < fronteira) saida += c;
    else if (i < fronteira + 3) saida += glifo(i, tique);
    else saida += ' ';
  }
  return saida;
}

type Camada = {
  /* Faixa do progresso em que a camada está visível. */
  faixa: [number, number];
  /* Quanto do início da faixa é gasto decodificando. */
  entrada: number;
};

const CAMADAS: Camada[] = [
  { faixa: [-0.2, 0.3], entrada: 0.12 },
  { faixa: [0.3, 0.62], entrada: 0.12 },
  { faixa: [0.62, 1.2], entrada: 0.12 },
];

export function HeroCinema() {
  const secao = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const loader = useRef<HTMLDivElement>(null);
  const palco = useRef<HTMLDivElement>(null);
  const camadas = useRef<(HTMLDivElement | null)[]>([]);
  const mira = useRef<HTMLDivElement>(null);
  const abertura = useRef<HTMLDivElement>(null);
  const distancia = useRef<HTMLSpanElement>(null);
  const rotacao = useRef<HTMLSpanElement>(null);
  const relogio = useRef<HTMLSpanElement>(null);
  const sinal = useRef<HTMLSpanElement>(null);
  const barra = useRef<HTMLSpanElement>(null);
  const dica = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!secao.current || !video.current || !loader.current || !palco.current) return;
    const hero: HTMLElement = secao.current;
    const v: HTMLVideoElement = video.current;
    const l: HTMLDivElement = loader.current;
    const stage: HTMLDivElement = palco.current;

    const menosMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const toque = window.matchMedia('(hover: none)').matches;

    let duration = 0;
    let ready = false;
    let target = menosMovimento ? 1 : 0;
    let ticking = false;

    /* Mouse, normalizado de -1 a 1. Suavizado no apply para o
       movimento não acompanhar o cursor de forma seca. */
    let mx = 0, my = 0, sx = 0, sy = 0;
    let animando = false;
    let abrindo = false;

    /* Textos originais de cada elemento decodificável, lidos uma vez. */
    const decodificaveis = Array.from(
      stage.querySelectorAll<HTMLElement>('[data-decodifica]'),
    ).map((el) => ({ el, texto: el.textContent || '' }));

    function apply() {
      ticking = false;
      const p = target;

      if (duration && !menosMovimento) v.currentTime = p * duration;

      /* Suavização da paralaxe do mouse. */
      sx += (mx - sx) * 0.08;
      sy += (my - sy) * 0.08;
      const precisaContinuar = Math.abs(mx - sx) > 0.002 || Math.abs(my - sy) > 0.002;

      if (!toque && !menosMovimento) {
        v.style.transform = `translate3d(${sx * -10}px, ${sy * -8}px, 0) scale(1.04)`;
      }

      /* 1. A mira. Vai das bordas até um quadro em volta do capacete.
         O capacete começa à direita e acima do centro (frame A) e
         termina centrado (frame B): o centro da mira anda junto. */
      if (mira.current) {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const fecha = Math.min(1, p / 0.66);
        const suave = 1 - Math.pow(1 - fecha, 3);
        /* Tamanho final em px, ancorado na ALTURA da tela: o vídeo é
           16:9 em object-fit:cover, então no celular ele é cortado nas
           laterais e o capacete mantém a proporção com a altura. Uma
           caixa em % da largura ficaria estreita e alta no telefone. */
        const fim = Math.min(0.36 * vh, 0.82 * vw);
        const w = 0.92 * vw - (0.92 * vw - fim) * suave;
        const h = 0.88 * vh - (0.88 * vh - fim) * suave;
        const cx = (50 + (58 - 50) * (1 - suave)) / 100 * vw;
        const cy = (50 + (36 - 50) * (1 - suave)) / 100 * vh;
        const solta = p > 0.8 ? Math.max(0, 1 - (p - 0.8) / 0.07) : 1;
        const m = mira.current;
        m.style.left = `${(cx - w / 2).toFixed(1)}px`;
        m.style.top = `${(cy - h / 2).toFixed(1)}px`;
        m.style.width = `${w.toFixed(1)}px`;
        m.style.height = `${h.toFixed(1)}px`;
        m.style.opacity = String(menosMovimento ? 0 : solta * (p < 0.02 ? 0.55 : 1));
        m.style.transform = `translate3d(${sx * 14}px, ${sy * 10}px, 0)`;
        m.dataset.travada = fecha > 0.88 ? 'sim' : 'nao';
      }

      /* 2. Texto decodificado por camada. */
      camadas.current.forEach((el, i) => {
        if (!el) return;
        const c = CAMADAS[i];
        const vis = menosMovimento ? (i === 2 ? 1 : 0) : janela(p, c.faixa[0], c.faixa[1]);
        el.style.opacity = String(vis);
        el.style.pointerEvents = vis > 0.5 ? 'auto' : 'none';
        el.setAttribute('aria-hidden', vis > 0.5 ? 'false' : 'true');
        el.style.transform = `translate3d(${sx * 18}px, ${sy * 12}px, 0)`;
        if (vis === 0) return;
        if (i === 0 && abrindo) return;
        const f = menosMovimento ? 1 : Math.min(1, Math.max(0, (p - c.faixa[0]) / c.entrada));
        const tique = Math.floor(p * 400);
        decodificaveis
          .filter((d) => el.contains(d.el))
          .forEach((d) => {
            d.el.textContent = f >= 1 ? d.texto : decodificar(d.texto, f, tique);
          });
      });

      /* 3. A abertura: círculo que cresce do centro do visor. */
      if (abertura.current) {
        const a = Math.max(0, (p - 0.9) / 0.1);
        const r = a * 160;
        abertura.current.style.clipPath = `circle(${r}% at 50% 50%)`;
        abertura.current.style.setProperty('--r', `${r}%`);
        abertura.current.style.opacity = a > 0 ? '1' : '0';
      }

      /* Telemetria: distância até o visor, rotação, relógio, sinal. */
      if (distancia.current) {
        distancia.current.textContent = (120 * Math.pow(1 - p, 1.6)).toFixed(1).replace('.', ',');
      }
      if (rotacao.current) rotacao.current.textContent = String(Math.round(p * 38)).padStart(2, '0');
      if (relogio.current) {
        const s = Math.round(p * 300);
        relogio.current.textContent = `T+${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
      }
      if (sinal.current) sinal.current.textContent = `${Math.round(40 + p * 60)}%`;
      if (barra.current) barra.current.style.transform = `scaleY(${p})`;
      if (dica.current) dica.current.style.opacity = String(p < 0.03 ? 1 : 0);

      if (precisaContinuar && !animando) {
        animando = true;
        requestAnimationFrame(() => {
          animando = false;
          apply();
        });
      }
    }

    function onScroll() {
      const rect = hero.getBoundingClientRect();
      const scrollable = hero.offsetHeight - window.innerHeight;
      const p = scrollable > 0 ? -rect.top / scrollable : 0;
      target = menosMovimento ? 1 : Math.min(1, Math.max(0, p));
      if (document.hidden) apply();
      else if (!ticking) {
        ticking = true;
        requestAnimationFrame(apply);
      }
    }

    function onMouse(e: MouseEvent) {
      mx = (e.clientX / window.innerWidth) * 2 - 1;
      my = (e.clientY / window.innerHeight) * 2 - 1;
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(apply);
      }
    }

    /* Decodificação de abertura: a primeira camada não faz fade ao
       carregar, ela se escreve. Só roda se a pessoa ainda está no topo;
       quem chegou já rolado recebe o texto pronto pelo apply. */
    function decodificarAbertura() {
      if (menosMovimento || target > 0.05 || !camadas.current[0]) return;
      const alvo = camadas.current[0];
      const itens = decodificaveis.filter((d) => alvo.contains(d.el));
      const inicio = performance.now();
      abrindo = true;
      const passo = (t: number) => {
        const f = Math.min(1, (t - inicio) / 1500);
        const tique = Math.floor(t / 40);
        itens.forEach((d, i) => {
          const fi = Math.min(1, Math.max(0, (f - i * 0.12) / 0.7));
          d.el.textContent = fi >= 1 ? d.texto : decodificar(d.texto, fi, tique);
        });
        if (f < 1 && target <= 0.05) requestAnimationFrame(passo);
        else {
          abrindo = false;
          itens.forEach((d) => { d.el.textContent = d.texto; });
        }
      };
      requestAnimationFrame(passo);
    }

    function markReady() {
      if (ready) return;
      ready = true;
      duration = v.duration || 0;
      v.classList.add('is-ready');
      l.classList.add('is-gone');
      onScroll();
      decodificarAbertura();
    }

    if (v.readyState >= 1 && v.duration) duration = v.duration;
    if (v.readyState >= 4) markReady();
    const aoMeta = () => {
      duration = v.duration;
    };
    v.addEventListener('loadedmetadata', aoMeta);
    v.addEventListener('canplaythrough', markReady);
    const timer = window.setTimeout(markReady, 6000);

    /*
      DESTRAVA O VÍDEO NO IPHONE.

      O Safari do iOS não pinta quadro nenhum de um vídeo que nunca
      tocou: mexer em `currentTime` antes disso não mostra nada, e a
      cena fica preta ou parada no poster enquanto a rolagem acontece.
      Ele também trata `preload="auto"` como sugestão e costuma não
      buscar os dados sem um gesto da pessoa.

      Um play() seguido de pause() resolve os dois, mas só vale DENTRO
      de um gesto, então mora no primeiro toque. Fica restrito a
      aparelho de toque de propósito: no computador, tocar o vídeo no
      primeiro clique adiantaria o quadro e brigaria com a rolagem.

      O catch não é decorativo. play() e pause() em sequência rejeitam a
      promessa com AbortError, e sem tratar isso vira erro no console de
      todo iPhone que abrir o site.
    */
    function destravar() {
      const pr = v.play();
      if (pr && typeof pr.then === 'function') {
        pr.then(() => {
          v.pause();
          if (v.duration) duration = v.duration;
          markReady();
          apply();
        }).catch(() => {});
      }
    }
    if (toque) window.addEventListener('touchstart', destravar, { passive: true, once: true });

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    if (!toque) window.addEventListener('mousemove', onMouse, { passive: true });
    onScroll();

    return () => {
      v.removeEventListener('loadedmetadata', aoMeta);
      v.removeEventListener('canplaythrough', markReady);
      window.clearTimeout(timer);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('mousemove', onMouse);
    };
  }, []);

  return (
    <section ref={secao} id="lancamento" aria-label="Abertura" className="sc-hero relative">
      <div ref={palco} className="sc-sticky">
        <video
          ref={video}
          className="sc-video"
          src="/video/hero.mp4"
          poster="/imagens/hero-frame-a.jpg"
          muted
          playsInline
          preload="auto"
          aria-hidden
          tabIndex={-1}
        />

        <div aria-hidden className="sc-veu" />

        <div ref={loader} className="sc-loader" role="status" aria-live="polite">
          <span className="sc-loader-anel" aria-hidden />
          <span className="font-mono text-[0.68rem] uppercase tracking-[0.26em] text-cinza">
            Sincronizando com o traje
          </span>
        </div>

        {/* 1. A mira */}
        <div ref={mira} aria-hidden className="sc-mira">
          <span className="sc-mira-canto sc-mira-canto--a" />
          <span className="sc-mira-canto sc-mira-canto--b" />
          <span className="sc-mira-canto sc-mira-canto--c" />
          <span className="sc-mira-canto sc-mira-canto--d" />
          <span className="sc-mira-centro" />
          <span className="sc-mira-rotulo">
            <span className="sc-mira-rotulo--busca">Rastreando</span>
            <span className="sc-mira-rotulo--trava">Alvo travado</span>
          </span>
        </div>

        {/* 2. As três camadas de texto, projetadas no visor */}
        <div className="sc-conteudo mx-auto w-full max-w-[1320px] px-5 md:px-10">
          <div ref={(el) => { camadas.current[0] = el; }} className="sc-camada">
            <p className="sc-rotulo">
              <span aria-hidden className="h-px w-8 bg-magenta" />
              <span data-decodifica>Do zero ao lançamento, e todo mês depois</span>
            </p>
            <h1 className="sc-titulo mt-7 font-display font-extrabold tracking-[-0.045em]">
              <span data-decodifica>Sua loja não precisa</span>
              <br />
              <span data-decodifica>de mais uma agência.</span>
            </h1>
          </div>

          <div ref={(el) => { camadas.current[1] = el; }} className="sc-camada">
            <p className="sc-rotulo">
              <span aria-hidden className="h-px w-8 bg-magenta" />
              <span data-decodifica>Aproximando</span>
            </p>
            <p className="sc-titulo mt-7 font-display font-extrabold tracking-[-0.045em]">
              <span data-decodifica>Precisa de uma</span>
              <br />
              <span className="text-magenta-texto" data-decodifica>operação.</span>
            </p>
          </div>

          <div ref={(el) => { camadas.current[2] = el; }} className="sc-camada sc-camada--visor">
            <p className="sc-rotulo">
              <span aria-hidden className="h-px w-8 bg-magenta" />
              <span data-decodifica>Projeção no visor</span>
            </p>
            <p className="sc-titulo-p mt-6 font-display font-extrabold tracking-[-0.04em]">
              <span data-decodifica>Construímos a loja.</span>
              <br />
              <span data-decodifica>E ficamos para fazer ela vender.</span>
            </p>
            <p className="mt-7 max-w-[52ch] text-guia text-neve">
              A Psy Comunic <strong className="font-semibold text-branco">constrói a sua loja
              do zero até o lançamento</strong> e continua entregando todo mês depois dele.
              Gestão, tecnologia, marketing e logística rodando junto.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Botao href="/diagnostico">Quero meu diagnóstico gratuito</Botao>
              <Botao href="/como-trabalhamos" variante="secundario">
                Ver como trabalhamos
              </Botao>
            </div>
          </div>
        </div>

        {/* 3. A abertura para a próxima seção */}
        <div ref={abertura} aria-hidden className="sc-abertura">
          <div className="estrelas absolute inset-0" />
          <div className="brilho-magenta absolute -right-[18%] -top-[30%] h-[820px] w-[820px] opacity-35" />
        </div>

        {/* Telemetria */}
        <div aria-hidden className="sc-telemetria">
          <div className="sc-tele-item">
            <span className="sc-tele-rotulo">Distância</span>
            <span className="sc-tele-valor">
              <span ref={distancia} className="tabular">120,0</span>
              <span className="sc-tele-unidade">m</span>
            </span>
          </div>
          <div className="sc-tele-item">
            <span className="sc-tele-rotulo">Rotação</span>
            <span className="sc-tele-valor">
              <span ref={rotacao} className="tabular">00</span>
              <span className="sc-tele-unidade">°</span>
            </span>
          </div>
          <div className="sc-tele-item">
            <span className="sc-tele-rotulo">Sinal</span>
            <span className="sc-tele-valor">
              <span ref={sinal} className="tabular">40%</span>
            </span>
          </div>
          <div className="sc-tele-item">
            <span className="sc-tele-rotulo">Missão</span>
            <span className="sc-tele-valor">
              <span ref={relogio} className="tabular">T+00:00</span>
            </span>
          </div>
        </div>

        <div aria-hidden className="sc-barra">
          <span ref={barra} className="sc-barra-fio" />
        </div>

        <div ref={dica} aria-hidden className="sc-dica">
          <span className="sc-dica-seta" />
          <span className="font-mono text-[0.62rem] uppercase tracking-[0.26em] text-cinza">
            Role para aproximar
          </span>
        </div>
      </div>
    </section>
  );
}
