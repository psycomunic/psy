'use client';

import { useRef, useState } from 'react';
import { clienteNavegador } from '@/lib/supabase/navegador';
import { pedirEnvioDeArquivo, registrarArquivo, removerArquivo } from '@/app/painel/acoes-postagem';
import type { ArquivoDaPostagem } from '@/lib/dados/tipos';

const BUCKET = 'midia';

/** 1,2 MB -> "1,2 MB". Arquivo sem tamanho conhecido não mostra nada. */
function peso(bytes: number | null) {
  if (bytes === null) return null;
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} kB`;
}

/**
 * Os arquivos de uma postagem.
 *
 * ============================================================
 * O ARQUIVO VAI DIRETO PARA O STORAGE
 * ============================================================
 * O servidor assina uma permissão de envio para um caminho, e o
 * navegador manda o arquivo sem passar pela aplicação. Server Action
 * tem limite de corpo de 1MB por padrão, e um Reels tem dezenas de
 * megabytes: por aqui não há teto prático, e a função não gasta tempo
 * servindo de cano.
 *
 * ============================================================
 * UM DE CADA VEZ, COM O NOME NA TELA
 * ============================================================
 * Enviar dez em paralelo deixa a barra de progresso mentir e, quando um
 * falha, ninguém sabe qual. Em fila, o que está subindo aparece pelo
 * nome, e o que falhou fica dito.
 *
 * ============================================================
 * SÓ DEPOIS DE CHEGAR É QUE VIRA LINHA NO BANCO
 * ============================================================
 * O registro acontece quando o envio termina. Linha apontando para
 * arquivo que não chegou vira miniatura quebrada para sempre; arquivo
 * no bucket sem linha a tela nem mostra, e some na próxima limpeza.
 */
export function Anexos({
  postagemId,
  arquivos,
  podeEditar,
}: {
  postagemId: string;
  arquivos: ArquivoDaPostagem[];
  podeEditar: boolean;
}) {
  const entrada = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState<string | null>(null);
  const [fila, setFila] = useState(0);
  const [erro, setErro] = useState<string | null>(null);

  async function enviar(lista: FileList) {
    setErro(null);
    const supabase = clienteNavegador();
    const arquivosParaEnviar = [...lista];
    setFila(arquivosParaEnviar.length);

    for (const arquivo of arquivosParaEnviar) {
      setEnviando(arquivo.name);
      try {
        const permissao = await pedirEnvioDeArquivo(postagemId, arquivo.name);
        if (!permissao.ok) {
          setErro(`${arquivo.name}: ${permissao.mensagem}`);
          break;
        }

        const { error } = await supabase.storage
          .from(BUCKET)
          .uploadToSignedUrl(permissao.caminho, permissao.token, arquivo, {
            contentType: arquivo.type || 'application/octet-stream',
          });

        if (error) {
          setErro(`${arquivo.name}: ${error.message}`);
          break;
        }

        const fd = new FormData();
        fd.set('postagem_id', postagemId);
        fd.set('caminho', permissao.caminho);
        fd.set('nome', arquivo.name);
        fd.set('tipo', arquivo.type || '');
        fd.set('tamanho', String(arquivo.size));
        const r = await registrarArquivo(null, fd);
        if (!r.ok) {
          setErro(`${arquivo.name}: ${r.mensagem}`);
          break;
        }
      } catch (e) {
        setErro(`${arquivo.name}: ${(e as Error).message}`);
        break;
      } finally {
        setFila((n) => n - 1);
      }
    }

    setEnviando(null);
    if (entrada.current) entrada.current.value = '';
  }

  async function remover(a: ArquivoDaPostagem) {
    setErro(null);
    const fd = new FormData();
    fd.set('id', a.id);
    fd.set('caminho', a.caminho);
    const r = await removerArquivo(null, fd);
    if (!r.ok) setErro(r.mensagem);
  }

  return (
    <div className="mt-4">
      {arquivos.length > 0 ? (
        <ul className="flex flex-wrap gap-2.5">
          {arquivos.map((a) => (
            <li key={a.id} className="group relative">
              <a
                href={a.url ?? undefined}
                target="_blank"
                rel="noopener"
                title={`${a.nome}${peso(a.tamanho) ? ` · ${peso(a.tamanho)}` : ''}`}
                className="block h-[86px] w-[86px] overflow-hidden rounded-xl border border-fio bg-marinho-alto/60"
              >
                {a.imagem && a.url ? (
                  /* `img` cru, e não `next/image`: o endereço é assinado e
                     muda a cada hora, então o otimizador guardaria uma
                     versão que vence e passaria a servir link morto. */
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.url} alt="" className="h-full w-full object-cover" />
                ) : a.video && a.url ? (
                  <video src={a.url} muted playsInline className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full flex-col items-center justify-center gap-1 p-2 text-center">
                    <span aria-hidden className="text-lg text-magenta-texto">▤</span>
                    <span className="line-clamp-2 text-[0.6rem] leading-tight text-cinza">
                      {a.nome}
                    </span>
                  </span>
                )}
              </a>

              {podeEditar ? (
                <button
                  type="button"
                  onClick={() => remover(a)}
                  aria-label={`Remover ${a.nome}`}
                  className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-fio bg-marinho-fundo text-cinza opacity-0 transition-opacity hover:text-branco focus:opacity-100 group-hover:opacity-100"
                >
                  <span aria-hidden className="text-sm leading-none">×</span>
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {podeEditar ? (
        <div className="mt-3">
          <input
            ref={entrada}
            type="file"
            multiple
            accept="image/*,video/*,.pdf"
            id={`arq-${postagemId}`}
            className="sr-only"
            onChange={(e) => {
              if (e.target.files?.length) enviar(e.target.files);
            }}
          />
          <label
            htmlFor={`arq-${postagemId}`}
            className="inline-flex min-h-[36px] cursor-pointer items-center gap-2 rounded-full border border-fio px-4 text-xs font-semibold text-neve transition-colors hover:bg-white/5"
          >
            <span aria-hidden className="text-sm leading-none">+</span>
            {arquivos.length > 0 ? 'Mais arquivos' : 'Anexar arquivos'}
          </label>

          {enviando ? (
            <p role="status" className="mt-2 text-xs text-cinza">
              <span aria-hidden className="mr-1.5 text-magenta-texto">●</span>
              Enviando {enviando}
              {fila > 1 ? ` e mais ${fila - 1}` : ''}...
            </p>
          ) : null}

          {erro ? (
            <p role="status" className="mt-2 text-xs font-semibold text-magenta-texto">
              <span aria-hidden className="mr-1.5">■</span>
              {erro}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
