'use client';

import { useActionState, useEffect, useRef } from 'react';
import { pedirAnalise, type ResultadoLead } from '@/app/trafego-pago/acoes';
import { FAIXAS_DE_VERBA, CANAIS_HOJE, formulario } from '@/conteudo/trafego';

/**
 * O formulário que vira lead no CRM.
 *
 * Poucos campos, e cada um com um motivo. Formulário longo numa página
 * de venda é onde a pessoa desiste: cada campo a mais é uma chance de
 * fechar a aba. Nome, empresa e WhatsApp são o mínimo para atender;
 * verba e canal existem porque mudam a conversa que vem depois.
 */

const campo =
  'w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3.5 text-sm text-branco ' +
  'outline-none transition-colors placeholder:text-cinza/70 focus:border-magenta focus:bg-white/[0.07]';
/* 12px, e não os 0,7rem que o resto do site usa em rótulo decorativo.
   Aqui o rótulo é funcional: quem não conseguir ler não preenche, e
   este formulário é o objetivo inteiro da página. */
const rotulo = 'block font-mono text-xs uppercase tracking-[0.16em] text-cinza';

export function FormAnalise() {
  const [estado, acao, pendente] = useActionState<ResultadoLead | null, FormData>(
    pedirAnalise,
    null,
  );

  /*
    O relógio de quando a página abriu, para o servidor recusar o que
    foi preenchido em menos de dois segundos e meio — que é robô.

    Marcado num efeito, e não na renderização: `Date.now()` durante o
    render é chamada impura, e o React proíbe com razão. O valor é lido
    no envio, que também não é render.

    Fica 0 quando o JavaScript não roda. O servidor trata 0 como
    "não sei" e pula a checagem de tempo, em vez de recusar quem está
    sem script.
  */
  const abertoEm = useRef(0);
  useEffect(() => {
    abertoEm.current = Date.now();
  }, []);

  if (estado?.ok) {
    return (
      <div
        role="status"
        className="cartao p-8 text-center md:p-10"
        aria-live="polite"
      >
        <p aria-hidden className="text-3xl">✓</p>
        <p className="mt-5 font-display text-2xl font-bold tracking-[-0.03em] text-branco">
          {estado.mensagem}
        </p>
        <p className="mx-auto mt-4 max-w-[46ch] leading-relaxed text-cinza">
          Se preferir adiantar, chame no WhatsApp e diga que preencheu o formulário. A
          conversa começa de onde você parou.
        </p>
      </div>
    );
  }

  return (
    <form
      /* O relógio entra AQUI, no envio, e não num input renderizado:
         ler `ref.current` durante o render é o que o React proíbe. */
      action={(fd) => {
        fd.set('aberto_em', String(abertoEm.current));
        return acao(fd);
      }}
      className="cartao space-y-5 p-6 md:p-8"
    >

      {/*
        A isca.

        Fora da tela e fora da ordem de tabulação, sem rótulo visível e
        com autocomplete desligado: ninguém preenche sem querer. Robô de
        formulário preenche tudo que encontra, e é assim que ele se
        entrega. `aria-hidden` mantém o leitor de tela longe também.
      */}
      <div aria-hidden className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden">
        <label htmlFor="site_url">Não preencha este campo</label>
        <input id="site_url" name="site_url" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="an-nome" className={rotulo}>Seu nome *</label>
          <input id="an-nome" name="nome" required autoComplete="name" className={`mt-2 ${campo}`} />
        </div>
        <div>
          <label htmlFor="an-empresa" className={rotulo}>Empresa *</label>
          <input
            id="an-empresa"
            name="empresa"
            required
            autoComplete="organization"
            className={`mt-2 ${campo}`}
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="an-tel" className={rotulo}>WhatsApp com DDD *</label>
          <input
            id="an-tel"
            name="telefone"
            required
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="47 99999-9999"
            className={`mt-2 ${campo}`}
          />
        </div>
        <div>
          <label htmlFor="an-email" className={rotulo}>E-mail</label>
          <input
            id="an-email"
            name="email"
            type="email"
            autoComplete="email"
            className={`mt-2 ${campo}`}
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="an-canal" className={rotulo}>Onde você anuncia hoje</label>
          <select id="an-canal" name="canal" defaultValue="ambos" className={`mt-2 ${campo}`}>
            {CANAIS_HOJE.map((c) => (
              <option key={c.valor} value={c.valor}>{c.rotulo}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="an-verba" className={rotulo}>Quanto investe por mês</label>
          <select id="an-verba" name="verba" defaultValue="" className={`mt-2 ${campo}`}>
            {FAIXAS_DE_VERBA.map((f) => (
              <option key={f.valor || 'nenhuma'} value={f.valor}>{f.rotulo}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="an-contexto" className={rotulo}>
          O que mais te incomoda hoje
        </label>
        <textarea
          id="an-contexto"
          name="contexto"
          rows={3}
          placeholder="Gasto todo mês e não sei de onde vêm os orçamentos que chegam."
          className={`mt-2 ${campo} resize-y`}
        />
      </div>

      {estado && !estado.ok ? (
        <p
          role="status"
          className="flex items-start gap-3 rounded-xl border border-magenta/40 bg-magenta/10 px-4 py-3 text-sm leading-relaxed text-magenta-texto"
        >
          <span aria-hidden className="mt-0.5">■</span>
          {estado.mensagem}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pendente}
        className="w-full rounded-full bg-magenta px-7 py-4 text-sm font-semibold text-branco transition-all duration-300 hover:bg-magenta-forte hover:shadow-[0_10px_40px_-8px_rgba(228,21,95,0.75)] disabled:opacity-60 sm:w-auto"
      >
        {pendente ? 'Enviando...' : 'Quero a análise da minha conta'}
      </button>

      <p className="text-xs leading-relaxed text-cinza">{formulario.rodape}</p>
    </form>
  );
}
