'use client';

import { useRouter } from 'next/navigation';
import { clienteNavegador } from '@/lib/supabase/navegador';

export function Sair() {
  const router = useRouter();

  async function sair() {
    await clienteNavegador().auth.signOut();
    // refresh antes do push para o middleware enxergar o cookie apagado.
    router.refresh();
    router.push('/entrar');
  }

  return (
    <button
      type="button"
      onClick={sair}
      className="text-sm text-magenta-texto underline underline-offset-4"
    >
      Sair
    </button>
  );
}
