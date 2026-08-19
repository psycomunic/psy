'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Marca } from './Marca';
import { Botao } from './Botao';
import { navPrincipal } from '@/conteudo/navegacao';

/**
 * Cabeçalho fixo com menu mobile.
 *
 * O menu mobile não existia: a navegação era `hidden lg:flex` sem
 * nenhum botão para abri-la, ou seja, no celular o site tinha zero
 * navegação.
 *
 * O fundo de vidro só aparece depois que a página rola. No topo o
 * cabeçalho é transparente e a hero respira inteira; a partir daí ele
 * ganha superfície para o texto não passar por baixo ilegível.
 */
export function Cabecalho() {
  const [rolou, setRolou] = useState(false);
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    const aoRolar = () => setRolou(window.scrollY > 24);
    aoRolar();
    window.addEventListener('scroll', aoRolar, { passive: true });
    return () => window.removeEventListener('scroll', aoRolar);
  }, []);

  // Trava a rolagem do fundo enquanto o menu está aberto. Sem isso a
  // página corre atrás do painel e a pessoa perde o lugar.
  useEffect(() => {
    document.body.style.overflow = aberto ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [aberto]);

  // Esc fecha. Painel que só fecha no X é armadilha de teclado.
  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAberto(false);
    };
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [aberto]);

  return (
    <header
      className={
        'sticky top-0 z-50 transition-all duration-300 ' +
        (rolou
          ? 'border-b border-fio bg-marinho/70 backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent')
      }
    >
      <div className="mx-auto flex max-w-[1320px] items-center gap-8 px-5 py-4 md:px-10">
        <Marca />

        <nav aria-label="Navegação principal" className="ml-auto hidden items-center gap-1 lg:flex">
          {navPrincipal.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-neve transition-colors hover:bg-white/5 hover:text-branco"
            >
              {item.rotulo}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden lg:ml-4 lg:block">
          <Botao href="/diagnostico">Diagnóstico gratuito</Botao>
        </div>

        {/* Botão do menu mobile. 44px de alvo, mínimo da WCAG para toque. */}
        <button
          type="button"
          onClick={() => setAberto((v) => !v)}
          aria-expanded={aberto}
          aria-controls="menu-mobile"
          className="ml-auto flex h-11 w-11 items-center justify-center rounded-full ring-1 ring-inset ring-white/20 transition-colors hover:bg-white/5 lg:hidden"
        >
          <span className="sr-only">{aberto ? 'Fechar menu' : 'Abrir menu'}</span>
          <span aria-hidden className="relative block h-3.5 w-5">
            <span
              className={
                'absolute left-0 block h-px w-full bg-branco transition-all duration-300 ' +
                (aberto ? 'top-1/2 rotate-45' : 'top-0')
              }
            />
            <span
              className={
                'absolute left-0 top-1/2 block h-px w-full bg-branco transition-opacity duration-200 ' +
                (aberto ? 'opacity-0' : 'opacity-100')
              }
            />
            <span
              className={
                'absolute left-0 block h-px w-full bg-branco transition-all duration-300 ' +
                (aberto ? 'top-1/2 -rotate-45' : 'top-full')
              }
            />
          </span>
        </button>
      </div>

      {/* Painel mobile */}
      <div
        id="menu-mobile"
        hidden={!aberto}
        className="border-t border-fio bg-marinho-fundo/95 backdrop-blur-xl lg:hidden"
      >
        <nav aria-label="Navegação principal, celular" className="px-5 py-6">
          <ul className="space-y-1">
            {navPrincipal.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setAberto(false)}
                  className="block rounded-2xl px-4 py-3.5 text-lg font-semibold text-neve transition-colors hover:bg-white/5 hover:text-branco"
                >
                  {item.rotulo}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-6">
            <Botao href="/diagnostico" className="w-full">
              Diagnóstico gratuito
            </Botao>
          </div>
        </nav>
      </div>
    </header>
  );
}
