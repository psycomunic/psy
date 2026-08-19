import Link from 'next/link';
import { Marca } from './Marca';
import { navRodape, linkWhatsapp, whatsapp } from '@/conteudo/navegacao';
import { marca } from '@/conteudo/marca';

const formatado = whatsapp.numero.replace(
  /^55(\d{2})(\d{5})(\d{4})$/,
  '($1) $2-$3',
);

export function Rodape() {
  return (
    <footer className="relative mt-auto overflow-hidden border-t border-fio bg-marinho-fundo">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="brilho-magenta absolute -bottom-64 left-1/2 h-[520px] w-[900px] -translate-x-1/2 opacity-[0.14]" />
      </div>

      <div className={'relative mx-auto w-full max-w-[1320px] px-5 py-20 md:px-10'}>
        <div className="grid gap-14 lg:grid-cols-[1.5fr_repeat(4,1fr)]">
          <div>
            <Marca />
            <p className="mt-5 max-w-[30ch] leading-relaxed text-cinza">
              {marca.posicionamento}
            </p>

            <div className="mt-8 space-y-2.5">
              <a
                href={linkWhatsapp}
                target="_blank"
                rel="noopener"
                className="block text-sm text-neve transition-colors hover:text-branco"
              >
                WhatsApp {formatado}
              </a>
              <a
                href="mailto:psycomunic@gmail.com"
                className="block text-sm text-neve transition-colors hover:text-branco"
              >
                psycomunic@gmail.com
              </a>
              <a
                href="https://instagram.com/reysonmkt"
                target="_blank"
                rel="noopener"
                className="block text-sm text-neve transition-colors hover:text-branco"
              >
                @reysonmkt
              </a>
            </div>
          </div>

          {navRodape.map((grupo) => (
            <nav key={grupo.titulo} aria-label={grupo.titulo}>
              <h2 className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-magenta-texto">
                {grupo.titulo}
              </h2>
              <ul className="mt-5 space-y-3">
                {grupo.itens.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm text-neve transition-colors hover:text-branco"
                    >
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
        <div className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-fio pt-8">
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-cinza">
            © {new Date().getFullYear()} {marca.nome}
          </p>
          <p className="text-xs text-cinza">
            Razão social, CNPJ e endereço a preencher.
          </p>
        </div>
      </div>
    </footer>
  );
}
