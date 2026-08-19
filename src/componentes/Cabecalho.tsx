import Link from 'next/link';
import { Marca } from './Marca';
import { Botao } from './Botao';
import { navPrincipal } from '@/conteudo/navegacao';

export function Cabecalho() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-marinho/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-[1280px] items-center gap-8 px-5 py-4 md:px-10">
        <Marca />
        <nav aria-label="Navegação principal" className="ml-auto hidden items-center gap-7 lg:flex">
          {navPrincipal.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-neve transition-colors hover:text-branco"
            >
              {item.rotulo}
            </Link>
          ))}
        </nav>
        <div className="ml-auto lg:ml-0">
          <Botao href="/diagnostico">Diagnóstico gratuito</Botao>
        </div>
      </div>
    </header>
  );
}
