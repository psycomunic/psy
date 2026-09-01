'use client';

import { useState } from 'react';
import { Slide, Bloco } from './Slide';

/**
 * O slide da proposta de serviço avulso.
 *
 * ============================================================
 * POR QUE ELE NÃO É O SLIDE DE PLANO COM OUTRO TÍTULO
 * ============================================================
 * O slide de plano compara degraus: existe um acima e um abaixo, e a
 * pergunta que ele responde é "por que este e não o outro". Serviço
 * avulso não tem degrau. A pergunta aqui é outra: "o que eu recebo, e
 * o que não vem junto".
 *
 * Por isso cada serviço traz a lista do que entrega E a do que não
 * cobre. Dizer o que não está incluso antes de assinar custa uma linha;
 * descobrir depois custa a relação.
 *
 * ============================================================
 * O COMPLEMENTO É ESCOLHA DE QUEM LÊ
 * ============================================================
 * Complemento entra desmarcado e com o preço à vista, e quem lê decide
 * se quer. É por isso que este arquivo é componente de cliente.
 *
 * Marcar não contrata nada: não há botão de compra numa proposta, e
 * fingir que há seria mentir sobre o que o clique faz. O que a marca
 * muda é o total na tela e o texto que vai no WhatsApp, para a
 * conversa começar já sabendo o que a pessoa quis.
 */

export type ServicoNoSlide = {
  id: string;
  nome: string;
  papel: 'principal' | 'complemento';
  paraQuem: string;
  promessa: string;
  entregas: string[];
  naoInclui: string[];
  fee: number;
  feeTexto: string;
};

const emReais = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

export function SlideServicos({
  servicos,
  sempre,
  precoNaConta,
  linkWhatsapp,
}: {
  servicos: ServicoNoSlide[];
  sempre: string[];
  /* Quando existe a tabela de etapas, o preço aparece lá com as
     condições do período. Repetir aqui daria dois números para a mesma
     coisa, e o cliente perguntaria qual vale. */
  precoNaConta?: boolean;
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
    <>
      {servicos.map((s) => (
        <Slide
          key={s.id}
          rotulo={s.papel === 'complemento' ? 'Complemento, se você quiser' : 'O serviço'}
          titulo={
            <>
              {s.nome.split(' ').slice(0, -1).join(' ')}{' '}
              <span className="text-magenta-texto">{s.nome.split(' ').slice(-1)}.</span>
            </>
          }
        >
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
            <div>
              <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-cinza">
                {s.paraQuem}
              </p>
              <p className="mt-5 max-w-[54ch] text-guia leading-relaxed text-neve">
                {s.promessa}
              </p>

              {precoNaConta ? null : (
                <p className="tabular mt-8 font-display text-4xl font-extrabold tracking-[-0.04em] text-branco">
                  {s.feeTexto}
                  <span className="ml-2 text-base font-normal text-cinza">por mês</span>
                </p>
              )}

              {/* A escolha fica no slide do próprio complemento, e não
                  numa lista no fim: é aqui que a pessoa acabou de ler o
                  que ele entrega, e é aqui que ela decide. */}
              {s.papel === 'complemento' ? (
                <label
                  className={
                    'mt-8 flex cursor-pointer items-start gap-4 rounded-2xl border p-5 transition-colors ' +
                    (querem[s.id]
                      ? 'border-magenta bg-magenta/10'
                      : 'border-fio bg-white/[0.02] hover:bg-white/[0.05]')
                  }
                >
                  <input
                    type="checkbox"
                    checked={querem[s.id] ?? false}
                    onChange={(e) =>
                      setQuerem((a) => ({ ...a, [s.id]: e.target.checked }))
                    }
                    className="mt-0.5 h-5 w-5 flex-none accent-[var(--magenta)]"
                  />
                  <span className="min-w-0">
                    <span className="block font-semibold text-branco">
                      Quero incluir na proposta
                    </span>
                    <span className="mt-1.5 block text-sm leading-relaxed text-cinza">
                      Marcar aqui soma ao total e leva a sua escolha junto quando você
                      chamar no WhatsApp. Nada é contratado por este clique.
                    </span>
                  </span>
                </label>
              ) : null}
            </div>

            <div className="space-y-8">
              <Bloco>
                <p className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-magenta-texto">
                  O que entra
                </p>
                <ul className="mt-4 space-y-3">
                  {s.entregas.map((e) => (
                    <li key={e} className="flex gap-3 text-sm leading-relaxed text-neve">
                      <span aria-hidden className="mt-0.5 flex-none text-magenta-texto">●</span>
                      {e}
                    </li>
                  ))}
                </ul>
              </Bloco>

              {/* O que NÃO entra, dito aqui e não na primeira cobrança
                  de algo que o cliente achava incluso. */}
              <Bloco>
                <p className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-cinza">
                  O que não entra
                </p>
                <ul className="mt-4 space-y-3">
                  {s.naoInclui.map((e) => (
                    <li key={e} className="flex gap-3 text-sm leading-relaxed text-cinza">
                      <span aria-hidden className="mt-0.5 flex-none">—</span>
                      {e}
                    </li>
                  ))}
                </ul>
              </Bloco>
            </div>
          </div>
        </Slide>
      ))}

      {precoNaConta ? null : (
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
              <li key={s.id} className="flex flex-wrap items-baseline justify-between gap-4 py-5">
                <span className="text-guia text-neve">{s.nome}</span>
                <span className="tabular text-guia font-semibold text-branco">{s.feeTexto}</span>
              </li>
            ))}

            {complementos.map((s) => (
              <li key={s.id} className="py-5">
                <label className="flex cursor-pointer flex-wrap items-baseline justify-between gap-4">
                  <span className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={querem[s.id] ?? false}
                      onChange={(e) =>
                        setQuerem((a) => ({ ...a, [s.id]: e.target.checked }))
                      }
                      className="h-4 w-4 flex-none accent-[var(--magenta)]"
                    />
                    <span className={querem[s.id] ? 'text-guia text-neve' : 'text-guia text-cinza'}>
                      {s.nome}
                      <span className="ml-2 font-mono text-[0.7rem] uppercase tracking-[0.12em] text-cinza">
                        opcional
                      </span>
                    </span>
                  </span>
                  <span
                    className={
                      'tabular text-guia font-semibold ' +
                      (querem[s.id] ? 'text-branco' : 'text-cinza')
                    }
                  >
                    {querem[s.id] ? s.feeTexto : `+ ${s.feeTexto}`}
                  </span>
                </label>
              </li>
            ))}
          </ul>

          <p className="mt-8 flex flex-wrap items-baseline justify-between gap-4">
            <span className="font-display text-xl font-bold tracking-[-0.02em]">
              Total por mês
            </span>
            <span className="tabular font-display text-4xl font-extrabold tracking-[-0.04em] text-magenta-texto">
              {emReais(total)}
            </span>
          </p>

          <p className="mt-8 max-w-[60ch] text-sm leading-relaxed text-cinza">
            A verba de mídia não está aqui e nunca entra nesta soma. Ela é sua, vai direto
            para o Google e para a Meta, e você define quanto investir.
          </p>

          <a
            href={linkComEscolha}
            target="_blank"
            rel="noopener"
            className="mt-8 inline-flex items-center justify-center rounded-full bg-magenta px-7 py-3.5 text-sm font-semibold text-branco transition-colors hover:bg-magenta-forte"
          >
            {escolhidos.length > 0
              ? 'Seguir com o que marquei'
              : 'Seguir com esta proposta'}
          </a>
        </Slide>
      )}

      <Slide
        rotulo="Em qualquer caso"
        titulo={
          <>
            O que vale <span className="text-magenta-texto">sempre.</span>
          </>
        }
      >
        <ul className="grid gap-5 sm:grid-cols-2">
          {sempre.map((c) => (
            <li key={c} className="flex gap-3 text-guia leading-relaxed text-neve">
              <span aria-hidden className="mt-1 flex-none text-magenta-texto">●</span>
              {c}
            </li>
          ))}
        </ul>

        {complementos.length > 0 ? (
          <p className="mt-10 max-w-[62ch] text-sm leading-relaxed text-cinza">
            {complementos.map((c) => c.nome).join(' e ')} entra como complemento, é opcional,
            e pode sair depois sem mexer no resto.
          </p>
        ) : null}
      </Slide>
    </>
  );
}
