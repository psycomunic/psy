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
 *
 * ============================================================
 * DOIS TOTAIS, NUNCA UM
 * ============================================================
 * Construir uma loja é obra com fim. Gerir tráfego recomeça todo mês.
 * Somar os dois numa linha só e escrever "total por mês" embaixo
 * apresentaria um projeto de entrega única como mensalidade, que é o
 * pior erro possível num documento sobre dinheiro: quem lê acha que vai
 * pagar aquilo doze vezes, e a proposta morre sem ninguém dizer por quê.
 *
 * Então o fechamento é separado por `cobranca`. Quando a proposta tem só
 * um tipo, aparece só um total, e a tela continua tão simples quanto era.
 */
export function SlideDaConta({
  servicos,
  linkWhatsapp,
  avisoDeVerba,
}: {
  servicos: ServicoNoSlide[];
  linkWhatsapp: string;
  /** A nota sobre verba de mídia só faz sentido com tráfego dentro.
      Numa proposta só de site, ela fala da operação de outra pessoa. */
  avisoDeVerba: boolean;
}) {
  const principais = servicos.filter((s) => s.papel === 'principal');
  const complementos = servicos.filter((s) => s.papel === 'complemento');

  /* Complemento nasce desmarcado. Vir marcado seria empurrar, e a
     pessoa descobriria o valor a mais só na hora de somar. */
  const [querem, setQuerem] = useState<Record<string, boolean>>({});

  const escolhidos = complementos.filter((c) => querem[c.id]);
  const valendo = [...principais, ...escolhidos];

  const soma = (tipo: 'projeto' | 'mensal') =>
    valendo.filter((x) => x.cobranca === tipo).reduce((s, x) => s + x.fee, 0);

  const doProjeto = soma('projeto');
  const doMes = soma('mensal');
  const doisTotais = doProjeto > 0 && doMes > 0;

  const unidade = (s: ServicoNoSlide) => (s.cobranca === 'mensal' ? '/mês' : ' uma vez');

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
          Somando <span className="text-acento">tudo.</span>
        </>
      }
    >
      <ul className="divide-y divide-fio border-y border-fio">
        {principais.map((s) => (
          <li key={s.id} className="flex flex-wrap items-baseline justify-between gap-3 py-4">
            <span className="text-tinta sm:text-[1.05rem]">{s.nome}</span>
            <span className="tabular font-semibold text-tinta sm:text-[1.05rem]">
              {s.feeTexto}
              <span className="ml-0.5 text-sm font-normal text-tinta-fraca">{unidade(s)}</span>
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
                  className="h-6 w-6 flex-none accent-[var(--psy-pink)]"
                />
                <span className={querem[s.id] ? 'text-tinta' : 'text-tinta-fraca'}>
                  {s.nome}
                  <span className="ml-2 text-[0.7rem] text-tinta-fraca">
                    opcional
                  </span>
                </span>
              </span>
              <span
                className={
                  'tabular font-semibold ' + (querem[s.id] ? 'text-tinta' : 'text-tinta-fraca')
                }
              >
                {querem[s.id] ? s.feeTexto : `+ ${s.feeTexto}`}
                <span className="ml-0.5 text-sm font-normal text-tinta-fraca">{unidade(s)}</span>
              </span>
            </label>
          </li>
        ))}
      </ul>

      <div className={doisTotais ? 'mt-7 space-y-4' : 'mt-7'}>
        {doProjeto > 0 ? (
          <p className="flex flex-wrap items-baseline justify-between gap-3">
            <span className="font-display text-lg font-bold tracking-[-0.02em] sm:text-xl">
              {doisTotais ? 'Para construir, uma vez' : 'Total do projeto'}
            </span>
            <span className="tabular font-display text-3xl font-extrabold tracking-[-0.04em] text-acento sm:text-4xl">
              {emReais(doProjeto)}
            </span>
          </p>
        ) : null}

        {doMes > 0 ? (
          <p className="flex flex-wrap items-baseline justify-between gap-3">
            <span className="font-display text-lg font-bold tracking-[-0.02em] sm:text-xl">
              {doisTotais ? 'Depois, todo mês' : 'Total por mês'}
            </span>
            <span className="tabular font-display text-3xl font-extrabold tracking-[-0.04em] text-acento sm:text-4xl">
              {emReais(doMes)}
            </span>
          </p>
        ) : null}
      </div>

      {doisTotais ? (
        <p className="mt-5 max-w-[60ch] text-sm leading-relaxed text-tinta-fraca">
          São duas contas diferentes e elas não se somam. A de cima é a construção, cobrada
          uma vez. A de baixo é a operação, que recomeça todo mês e só começa depois que o
          que foi construído está no ar.
        </p>
      ) : null}

      {avisoDeVerba ? (
        <p className="mt-5 max-w-[60ch] text-sm leading-relaxed text-tinta-fraca">
          A verba de mídia não está aqui e nunca entra nesta soma. Ela é sua, vai direto para
          o Google e para a Meta, e você define quanto investir.
        </p>
      ) : null}

      {/* O botão longe do texto: 40px de folga. Colado, o polegar que
          vai rolar a tela acaba clicando nele. */}
      <div className="mt-10">
        <a
          href={linkComEscolha}
          target="_blank"
          rel="noopener"
          className="inline-flex min-h-[52px] w-full items-center justify-center rounded-full bg-rosa px-7 text-sm font-semibold text-branco transition-colors hover:bg-rosa-forte sm:w-auto"
        >
          {escolhidos.length > 0 ? 'Seguir com o que marquei' : 'Seguir com esta proposta'}
        </a>
      </div>
    </Slide>
  );
}
