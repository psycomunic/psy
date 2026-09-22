'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { clienteNavegador } from '@/lib/supabase/navegador';

/**
 * Login.
 *
 * Sem cadastro aberto, de propósito: quem entra é convidado pelo painel
 * de administração. Um formulário de "criar conta" aqui produziria
 * usuários sem papel e sem loja vinculada, que logam e não enxergam
 * nada, e ainda deixaria qualquer pessoa da internet criar acesso.
 */
export function FormularioEntrar({ destino }: { destino: string }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function entrar(evento: React.FormEvent) {
    evento.preventDefault();
    setErro(null);
    setEnviando(true);

    const { error } = await clienteNavegador().auth.signInWithPassword({
      email: email.trim(),
      password: senha,
    });

    if (error) {
      /*
        Mensagem única para e-mail inexistente e senha errada.

        Distinguir os dois transformaria esta tela num verificador de
        e-mails: quem quisesse saber quais clientes a Psy Comunic atende
        tentaria endereços até a mensagem mudar.

        A exceção é o limite de tentativas, que precisa ser dito, senão a
        pessoa fica repetindo a senha certa achando que errou.
      */
      setErro(
        /rate|too many/i.test(error.message)
          ? 'Muitas tentativas seguidas. Espere alguns minutos e tente de novo.'
          : 'E-mail ou senha incorretos.',
      );
      setEnviando(false);
      return;
    }

    /* refresh antes do push: o middleware precisa reler o cookie novo,
       senão a navegação chega no painel com a sessão antiga e volta. */
    router.refresh();
    router.push(destino);
  }

  const campo =
    'w-full rounded-2xl border border-fio bg-white/[0.03] px-5 py-3.5 text-branco ' +
    'outline-none transition-colors placeholder:text-cinza/60 focus:border-magenta focus:bg-white/[0.05]';

  return (
    <form onSubmit={entrar} className="mt-10 space-y-5" noValidate>
      <div>
        <label htmlFor="email" className="block text-sm font-semibold text-neve">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoFocus
          autoComplete="username"
          inputMode="email"
          placeholder="voce@empresa.com.br"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={erro ? true : undefined}
          className={`mt-2 ${campo}`}
        />
      </div>

      <div>
        <label htmlFor="senha" className="block text-sm font-semibold text-neve">
          Senha
        </label>
        <div className="relative mt-2">
          <input
            id="senha"
            name="senha"
            type={mostrarSenha ? 'text' : 'password'}
            required
            autoComplete="current-password"
            placeholder="••••••••••••"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            aria-invalid={erro ? true : undefined}
            className={`${campo} pr-24`}
          />
          {/* Ver a senha reduz erro de digitação em senha longa, que é
              justamente a que se quer incentivar. */}
          <button
            type="button"
            onClick={() => setMostrarSenha((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl px-3 py-2 font-mono text-[0.62rem] uppercase tracking-[0.12em] text-cinza transition-colors hover:bg-white/5 hover:text-neve"
          >
            {mostrarSenha ? 'ocultar' : 'ver'}
          </button>
        </div>
      </div>

      {/* role="alert" para o leitor de tela anunciar sem precisar de foco */}
      {erro ? (
        <p
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-magenta/40 bg-magenta/10 px-5 py-3.5 text-sm text-magenta-texto"
        >
          <span aria-hidden className="mt-0.5">■</span>
          {erro}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={enviando}
        className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-magenta px-7 py-4 font-semibold text-branco transition-all duration-300 hover:bg-magenta-forte hover:shadow-[0_10px_40px_-8px_rgba(228,21,95,0.75)] disabled:opacity-60 disabled:hover:shadow-none"
      >
        {enviando ? 'Entrando...' : 'Entrar'}
        {!enviando ? (
          <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">
            →
          </span>
        ) : null}
      </button>
    </form>
  );
}
