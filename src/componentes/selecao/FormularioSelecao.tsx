'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { perguntas, selecao, type Pergunta } from '@/conteudo/selecao-braganca';
import { enviarInscricao } from '@/app/braganca-pa/selecao/acoes';

/**
 * O formulário de seleção, uma pergunta por tela (estilo Typeform).
 *
 * Abre por qualquer elemento com `data-sel-abrir` ou pelo endereço
 * `#inscricao`, então os botões da página continuam sendo links comuns
 * e funcionam até sem este script carregado (caem na âncora).
 *
 * Teclado: Enter avança, letras escolhem a opção (A, B, C...), setas
 * da barra de baixo voltam e avançam. Escolha única avança sozinha.
 *
 * A pergunta da verba é a única tela da apresentação com o valor
 * em reais. Isso é regra do projeto, ver `selecao-braganca.ts`.
 */

type Respostas = Record<string, string | string[]>;
const LETRAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function mascaraTelefone(v: string) {
  const n = v.replace(/\D/g, '').slice(0, 11);
  if (n.length <= 2) return n.length ? `(${n}` : '';
  if (n.length <= 7) return `(${n.slice(0, 2)}) ${n.slice(2)}`;
  return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
}

export function FormularioSelecao() {
  const [aberto, setAberto] = useState(false);
  /* -1 é a tela de boas-vindas; perguntas.length é a tela final. */
  const [passo, setPasso] = useState(-1);
  const [volta, setVolta] = useState(false);
  const [r, setR] = useState<Respostas>({});
  const [erro, setErro] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [enviando, iniciar] = useTransition();
  const [pisca, setPisca] = useState('');
  const abertoEm = useRef(0);
  const isca = useRef<HTMLInputElement>(null);
  const campo = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  const abrir = useCallback(() => {
    if (!abertoEm.current) abertoEm.current = Date.now();
    setAberto(true);
  }, []);
  const fechar = useCallback(() => {
    setAberto(false);
    if (location.hash === '#inscricao') history.replaceState(null, '', location.pathname + location.search);
  }, []);

  /* abre pelos botões da página e pelo endereço */
  useEffect(() => {
    const clique = (e: MouseEvent) => {
      const alvo = (e.target as HTMLElement).closest('[data-sel-abrir]');
      if (!alvo) return;
      e.preventDefault();
      abrir();
    };
    const hash = () => {
      if (location.hash === '#inscricao') abrir();
    };
    document.addEventListener('click', clique);
    window.addEventListener('hashchange', hash);
    hash();
    return () => {
      document.removeEventListener('click', clique);
      window.removeEventListener('hashchange', hash);
    };
  }, [abrir]);

  /* trava a página de trás enquanto o formulário está aberto */
  useEffect(() => {
    const raiz = document.documentElement;
    raiz.style.overflow = aberto ? 'hidden' : '';
    raiz.classList.toggle('sel-form-aberto', aberto);
    return () => {
      raiz.style.overflow = '';
      raiz.classList.remove('sel-form-aberto');
    };
  }, [aberto]);

  const atual: Pergunta | undefined = perguntas[passo];

  useEffect(() => {
    if (!aberto) return;
    const t = window.setTimeout(() => campo.current?.focus({ preventScroll: true }), 380);
    return () => window.clearTimeout(t);
  }, [passo, aberto]);

  const validar = useCallback(
    (p: Pergunta, valor: string | string[] | undefined): string => {
      if (p.tipo === 'texto') {
        const s = String(valor ?? '').trim();
        if (p.obrigatoria && s.length < (p.min ?? 1)) return 'Preencha para continuar.';
        return '';
      }
      if (p.tipo === 'longo') return String(valor ?? '').trim().length < 10 ? 'Escreva pelo menos uma frase.' : '';
      if (p.tipo === 'telefone') {
        const n = String(valor ?? '').replace(/\D/g, '');
        return n.length < 10 ? 'Informe o WhatsApp com DDD.' : '';
      }
      if (p.tipo === 'email') {
        const s = String(valor ?? '').trim();
        /* A mesma conferência roda no servidor. Esta aqui existe para a
           pessoa corrigir o dedo errado antes de enviar, e não para
           proteger nada. */
        return /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(s) ? '' : 'Confira o e-mail.';
      }
      if (p.tipo === 'multipla') return Array.isArray(valor) && valor.length ? '' : 'Marque pelo menos uma opção.';
      return valor ? '' : 'Escolha uma opção.';
    },
    [],
  );

  const enviar = useCallback(
    (respostas: Respostas) => {
      setErro('');
      iniciar(async () => {
        const res = await enviarInscricao(respostas, {
          isca: isca.current?.value ?? '',
          abertoEm: abertoEm.current,
        });
        if (res.ok) {
          setEnviado(true);
          setVolta(false);
          setPasso(perguntas.length);
        } else setErro(res.mensagem);
      });
    },
    [],
  );

  const avancar = useCallback(
    (respostas: Respostas = r) => {
      if (passo === -1) {
        setVolta(false);
        setPasso(0);
        return;
      }
      if (!atual) return;
      const msg = validar(atual, respostas[atual.id]);
      if (msg) {
        setErro(msg);
        return;
      }
      setErro('');
      if (passo === perguntas.length - 1) {
        enviar(respostas);
        return;
      }
      setVolta(false);
      setPasso((p) => p + 1);
    },
    [passo, atual, r, validar, enviar],
  );

  const voltar = useCallback(() => {
    setErro('');
    setVolta(true);
    setPasso((p) => Math.max(-1, p - 1));
  }, []);

  const escolher = useCallback(
    (p: Pergunta, valor: string) => {
      if (p.tipo === 'multipla') {
        setR((ant) => {
          const lista = Array.isArray(ant[p.id]) ? (ant[p.id] as string[]) : [];
          return { ...ant, [p.id]: lista.includes(valor) ? lista.filter((x) => x !== valor) : [...lista, valor] };
        });
        setErro('');
        return;
      }
      const novas = { ...r, [p.id]: valor };
      setR(novas);
      setErro('');
      setPisca(valor);
      window.setTimeout(() => {
        setPisca('');
        avancar(novas);
      }, 420);
    },
    [r, avancar],
  );

  /* teclado */
  useEffect(() => {
    if (!aberto) return;
    const tecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        fechar();
        return;
      }
      if (enviado) return;
      const emTextarea = (e.target as HTMLElement).tagName === 'TEXTAREA';
      if (e.key === 'Enter' && !(emTextarea && !e.metaKey && !e.ctrlKey)) {
        e.preventDefault();
        avancar();
        return;
      }
      if (!atual || (atual.tipo !== 'escolha' && atual.tipo !== 'multipla')) return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.key.length !== 1) return;
      const i = LETRAS.indexOf(e.key.toUpperCase());
      if (i >= 0 && i < atual.opcoes.length) escolher(atual, atual.opcoes[i].valor);
    };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [aberto, atual, avancar, escolher, fechar, enviado]);

  const progresso = enviado ? 1 : Math.max(0, passo) / perguntas.length;
  const zap = `https://wa.me/${selecao.whatsapp}?text=${encodeURIComponent('Olá! Acabei de me inscrever na seleção das 10 empresas de Bragança.')}`;

  return (
    <div
      className={`sel-form${aberto ? ' is-aberto' : ''}`}
      id="inscricao"
      role="dialog"
      aria-modal="true"
      aria-label="Inscrição na seleção das 10 empresas"
      inert={!aberto}
    >
      <div className="sel-form-progresso">
        <i style={{ transform: `scaleX(${progresso})` }} />
      </div>
      <div className="sel-form-topo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-psy.svg" alt="Psy Comunic" />
        <button type="button" className="sel-form-fechar" onClick={fechar} aria-label="Fechar inscrição">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      <div className="sel-form-palco">
        <input ref={isca} className="sel-isca" name="site_url" tabIndex={-1} autoComplete="off" aria-hidden="true" />

        {passo === -1 && (
          <div className="sel-pergunta" key="boas-vindas">
            <span className="sel-rotulo">Seleção · 10 empresas · Bragança, PA</span>
            <h2 style={{ marginTop: 24, fontSize: 'clamp(28px, 3.6vw, 48px)', fontWeight: 300, lineHeight: 1.1 }}>
              Vamos conhecer a sua empresa.
            </h2>
            <p>São {perguntas.length} perguntas rápidas, uma de cada vez. Leva uns 3 minutos.</p>
            <div className="sel-form-acoes">
              <button type="button" className="sel-botao sel-ok" onClick={() => avancar()}>
                Começar
              </button>
              <small>
                aperte <b>Enter ↵</b>
              </small>
            </div>
          </div>
        )}

        {atual && !enviado && (
          <div
            key={atual.id}
            className={`sel-pergunta${volta ? ' is-volta' : ''}${atual.id === 'verba' ? ' sel-pergunta--verba' : ''}`}
          >
            <div className="sel-pergunta-num">
              {passo + 1}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </div>
            <h2>{atual.titulo}</h2>
            {atual.apoio && <p>{atual.apoio}</p>}

            {(atual.tipo === 'texto' || atual.tipo === 'telefone' || atual.tipo === 'email') && (
              <input
                ref={(el) => {
                  campo.current = el;
                }}
                className="sel-campo"
                type={atual.tipo === 'telefone' ? 'tel' : atual.tipo === 'email' ? 'email' : 'text'}
                inputMode={atual.tipo === 'telefone' ? 'tel' : atual.tipo === 'email' ? 'email' : undefined}
                /* `none` no e-mail: o teclado do celular sobe a primeira
                   letra em maiúscula por padrão, e "Maico@" não é o que
                   a pessoa quis digitar. */
                autoCapitalize={atual.tipo === 'email' ? 'none' : undefined}
                spellCheck={atual.tipo === 'email' ? false : undefined}
                autoComplete={
                  atual.id === 'nome'
                    ? 'name'
                    : atual.id === 'telefone'
                      ? 'tel'
                      : atual.id === 'email'
                        ? 'email'
                        : atual.id === 'empresa'
                          ? 'organization'
                          : 'off'
                }
                placeholder={atual.placeholder}
                value={String(r[atual.id] ?? '')}
                onChange={(e) => {
                  const v = atual.tipo === 'telefone' ? mascaraTelefone(e.target.value) : e.target.value;
                  setR((a) => ({ ...a, [atual.id]: v }));
                  setErro('');
                }}
              />
            )}
            {atual.tipo === 'longo' && (
              <textarea
                ref={(el) => {
                  campo.current = el;
                }}
                className="sel-campo"
                placeholder={atual.placeholder}
                value={String(r[atual.id] ?? '')}
                maxLength={1000}
                onChange={(e) => {
                  setR((a) => ({ ...a, [atual.id]: e.target.value }));
                  setErro('');
                }}
              />
            )}
            {(atual.tipo === 'escolha' || atual.tipo === 'multipla') && (
              <div
                className={`sel-opcoes${atual.opcoes.length > 8 ? ' sel-opcoes--colunas' : ''}`}
                role={atual.tipo === 'multipla' ? 'group' : 'radiogroup'}
              >
                {atual.opcoes.map((o, i) => {
                  const marcada = atual.tipo === 'multipla'
                    ? Array.isArray(r[atual.id]) && (r[atual.id] as string[]).includes(o.valor)
                    : r[atual.id] === o.valor;
                  return (
                    <button
                      type="button"
                      key={o.valor}
                      className={`sel-opcao${marcada ? ' is-marcada' : ''}${pisca === o.valor ? ' is-pisca' : ''}`}
                      onClick={() => escolher(atual, o.valor)}
                      role={atual.tipo === 'multipla' ? 'checkbox' : 'radio'}
                      aria-checked={marcada}
                    >
                      <kbd>{LETRAS[i]}</kbd>
                      {o.rotulo}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="sel-erro" role="alert">{erro}</div>

            {(atual.tipo !== 'escolha') && (
              <div className="sel-form-acoes">
                <button type="button" className="sel-botao sel-ok" onClick={() => avancar()} disabled={enviando}>
                  {passo === perguntas.length - 1 ? (enviando ? 'Enviando...' : 'Enviar inscrição') : 'OK'}
                </button>
                <small>
                  {atual.tipo === 'longo' ? (
                    <>
                      <b>Ctrl + Enter ↵</b> para seguir
                    </>
                  ) : (
                    <>
                      aperte <b>Enter ↵</b>
                    </>
                  )}
                </small>
              </div>
            )}
          </div>
        )}

        {enviado && (
          <div className="sel-pergunta sel-fim" key="fim">
            <div className="sel-fim-selo">
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12l5 5L20 7" />
              </svg>
            </div>
            <h2>Inscrição recebida.</h2>
            <p>
              A equipe da Psy Comunic analisa cada inscrição e responde pelo WhatsApp em até 48 horas. Se a sua empresa for
              escolhida, a gente já marca a conversa para começar.
            </p>
            <a className="sel-botao sel-botao--fantasma" href={zap} target="_blank" rel="noopener noreferrer">
              Falar com a unidade de Bragança
            </a>
          </div>
        )}
      </div>

      <div className="sel-form-rodape">
        <span>{enviado ? 'Obrigado.' : passo >= 0 ? `${passo + 1} de ${perguntas.length}` : 'Leva uns 3 minutos'}</span>
        {!enviado && (
          <div className="sel-form-setas">
            <button type="button" onClick={voltar} disabled={passo < 0} aria-label="Pergunta anterior">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                <path d="M6 15l6-6 6 6" />
              </svg>
            </button>
            <button type="button" onClick={() => avancar()} disabled={enviando} aria-label="Próxima pergunta">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
