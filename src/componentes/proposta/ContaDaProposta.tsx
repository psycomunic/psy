'use client';

import { useState } from 'react';
import { Slide } from './Slide';
import type { ServicoNoSlide } from './Servicos';

const emReais = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

/**
 * A tela da conta, com o complemento escolhido por quem lê.
 *
 * Marcar não contrata nada, e a tela diz isso: não há botão de compra
 * numa proposta, e fingir que há seria mentir sobre o que o clique faz.
 * O que a marca muda é o total e o texto que vai no WhatsApp.
 */
export function SlideDaConta({
  servicos,
  linkWhatsapp,
}: {
  servicos: ServicoNoSlide[];
  linkWhatsapp: string;
}) {
  const principais = servicos.filter((s) => s.papel === 'principal');
  const complementos = servicos.filter((s) => s.papel === 'complemento');

  /* Complemento nasce desmarcado. Vir marcado seria empurrar, e a
     pessoa descobriria o valor a mais só na hora de somar. */
  const [querem, setQuerem] = useState<Record<string, boolean>>({});

  const escolhidos = complementos.filter((c) => querem[c.id]);
  const total =
    principais.reduce((s, x) => s + x.fee, 0) + escolhidos.reduce((s, x) => s + x.fee, 0);

  const mensagem = encodeURIComponent(
    escolhidos.length > 0
      ? `Olá! Vi a proposta e quero seguir, incluindo ${escolhidos
          .map((c) => c.nome.toLowerCase())
          .join(' e ')}.`
      : 'Olá! Vi a proposta e quero seguir.',
  );
  const linkComEscolha = `${linkWhatsapp.split('?')[0]}?text=${mensagem}`;

  return (
    <Slide
      rotulo="A conta"
      titulo={
        <>
          Somando <span className="text-magenta-texto">tudo.</span>
        </>
      }
    >
      <ul className="divide-y divide-fio border-y border-fio">
        {principais.map((s) => (
          <li key={s.id} className="flex flex-wrap items-baseline justify-between gap-3 py-4">
            <span className="text-neve sm:text-[1.05rem]">{s.nome}</span>
            <span className="tabular font-semibold text-branco sm:text-[1.05rem]">
              {s.feeTexto}
            </span>
          </li>
        ))}

        {complementos.map((s) => (
          <li key={s.id}>
            {/*
              O rótulo inteiro é a área de toque, e tem 56px de altura.
              Um quadradinho de 16px é alvo para mouse, não para polegar:
              erra, marca sem querer, ou não marca nenhuma das vezes.
            */}
            <label className="flex min-h-[56px] cursor-pointer flex-wrap items-center justify-between gap-3 py-4">
              <span className="flex items-center gap-3.5">
                <input
                  type="checkbox"
                  checked={querem[s.id] ?? false}
                  onChange={(e) => setQuerem((a) => ({ ...a, [s.id]: e.target.checked }))}
                  className="h-6 w-6 flex-none accent-[var(--magenta)]"
                />
                <span className={querem[s.id] ? 'text-neve' : 'text-cinza'}>
                  {s.nome}
                  <span className="ml-2 font-mono text-[0.7rem] uppercase tracking-[0.12em] text-cinza">
                    opcional
                  </span>
                </span>
              </span>
              <span
                className={
                  'tabular font-semibold ' + (querem[s.id] ? 'text-branco' : 'text-cinza')
                }
              >
                {querem[s.id] ? s.feeTexto : `+ ${s.feeTexto}`}
              </span>
            </label>
          </li>
        ))}
      </ul>

      <p className="mt-7 flex flex-wrap items-baseline justify-between gap-3">
        <span className="font-display text-lg font-bold tracking-[-0.02em] sm:text-xl">
          Total por mês
        </span>
        <span className="tabular font-display text-3xl font-extrabold tracking-[-0.04em] text-magenta-texto sm:text-4xl">
          {emReais(total)}
        </span>
      </p>

      <p className="mt-6 max-w-[60ch] text-sm leading-relaxed text-cinza">
        A verba de mídia não está aqui e nunca entra nesta soma. Ela é sua, vai direto para o
        Google e para a Meta, e você define quanto investir.
      </p>

      {/* O botão longe do texto: 40px de folga. Colado, o polegar que
          vai rolar a tela acaba clicando nele. */}
      <div className="mt-10">
        <a
          href={linkComEscolha}
          target="_blank"
          rel="noopener"
          className="inline-flex min-h-[52px] w-full items-center justify-center rounded-full bg-magenta px-7 text-sm font-semibold text-branco transition-colors hover:bg-magenta-forte sm:w-auto"
        >
          {escolhidos.length > 0 ? 'Seguir com o que marquei' : 'Seguir com esta proposta'}
        </a>
      </div>
    </Slide>
  );
}

