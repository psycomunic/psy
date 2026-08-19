import Link from 'next/link';
import { Marca } from './Marca';
import { navRodape } from '@/conteudo/navegacao';
import { marca } from '@/conteudo/marca';

export function Rodape() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-marinho-fundo">
      <div className="mx-auto max-w-[1280px] px-5 py-16 md:px-10">
        <div className="grid gap-12 md:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div>
            <Marca />
            <p className="mt-4 max-w-[28ch] text-sm leading-relaxed text-cinza">
              {marca.posicionamento}
            </p>
          </div>
          {navRodape.map((grupo) => (
            <nav key={grupo.titulo} aria-label={grupo.titulo}>
              <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-magenta-texto">
                {grupo.titulo}
              </h2>
              <ul className="mt-4 space-y-2.5">
                {grupo.itens.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="text-sm text-neve transition-colors hover:text-branco">
                      {item.rotulo}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* EDITAR: razão social, CNPJ e endereço. Asset pendente do
            cliente, listado na seção 14 do escopo. */}
        <p className="mt-14 border-t border-white/10 pt-6 text-xs text-cinza">
          © {new Date().getFullYear()} {marca.nome}. Razão social, CNPJ e endereço a preencher.
        </p>
      </div>
    </footer>
  );
}
