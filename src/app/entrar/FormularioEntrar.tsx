'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { clienteNavegador } from '@/lib/supabase/navegador';

/**
 * Login real. Sem cadastro aberto: quem entra na plataforma é convidado
 * por um admin. Formulário de cadastro público aqui criaria conta sem
 * papel e sem conta vinculada, ou seja, gente logada sem lugar nenhum.
 */
export function FormularioEntrar({ destino }: { destino: string }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function entrar(evento: React.FormEvent) {
    evento.preventDefault();
    setErro(null);
    setEnviando(true);

    const { error } = await clienteNavegador().auth.signInWithPassword({
      email,
      password: senha,
    });

    if (error) {
      // Mensagem única para email errado e senha errada, de propósito:
      // distinguir os dois casos conta a quem tenta quais emails existem
      // na base.
      setErro('Email ou senha incorretos.');
      setEnviando(false);
      return;
    }

    // refresh antes do push: o middleware precisa reler o cookie novo,
    // senão a navegação chega no painel com a sessão antiga e volta.
    router.refresh();
    router.push(destino);
  }

  return (
    <form onSubmit={entrar} className="mt-10 space-y-5">
      <div>
        <label htmlFor="email" className="block text-sm font-semibold text-neve">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-2 w-full rounded-2xl border border-white/15 bg-marinho-alto/60 px-5 py-3.5 text-branco outline-none focus:border-magenta"
        />
      </div>

      <div>
        <label htmlFor="senha" className="block text-sm font-semibold text-neve">
          Senha
        </label>
        <input
          id="senha"
          type="password"
          required
          autoComplete="current-password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className="mt-2 w-full rounded-2xl border border-white/15 bg-marinho-alto/60 px-5 py-3.5 text-branco outline-none focus:border-magenta"
        />
      </div>

      {erro ? (
        <p role="alert" className="rounded-2xl bg-magenta/15 px-5 py-3 text-sm text-magenta-texto">
          {erro}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={enviando}
        className="w-full rounded-full bg-magenta px-7 py-4 font-semibold text-branco transition-colors hover:bg-magenta-forte disabled:opacity-60"
      >
        {enviando ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  );
}
