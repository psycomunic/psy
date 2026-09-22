import {
  listarCredenciais,
  criptoConfigurada,
  CAMPOS_DO_PROVEDOR,
  PROVEDORES_DE_API,
  rotuloProvedorApi,
} from '@/lib/ingestao/credenciais';
import { bancoConfigurado } from '@/lib/supabase/ambiente';
import { Secao } from '../base';
import { FormCredencial, BotaoDesligarCredencial } from '../FormCredencial';
import { BotaoSincronizar } from '../FormFonte';
import { CORES_SITUACAO } from '../paleta';
import type { Papel } from '@/lib/papeis';

/**
 * Configurações: por enquanto, as credenciais da agência.
 *
 * Uma BM e uma conta gerenciadora do Google servem TODAS as lojas. Isso
 * concentra o risco de propósito: um segredo para rotacionar em vez de
 * trinta, e nenhum cliente precisando aprender a gerar token. O preço é
 * que o dia em que esse token vazar, vaza o acesso a todas as contas de
 * anúncio de uma vez — daí a cifra, e daí a chave morar fora do banco.
 */
export async function Configuracoes({ papel }: { papel: Papel }) {
  if (papel !== 'administrador') {
    return (
      <p className="cartao p-6 text-sm leading-relaxed text-cinza">
        As credenciais da agência são visíveis só para o administrador. Não é ausência de
        configuração: é o recorte de acesso funcionando.
      </p>
    );
  }

  if (!bancoConfigurado) {
    return (
      <p className="cartao p-6 text-sm leading-relaxed text-cinza">
        Sem banco configurado não há onde guardar credencial. Esta tela não trabalha com
        dados de demonstração de propósito: um formulário de token que finge gravar é pior
        que nenhum.
      </p>
    );
  }

  const pronta = criptoConfigurada();
  const credenciais = pronta ? await listarCredenciais() : [];

  const porProvedor = new Map(credenciais.filter((c) => c.ativa).map((c) => [c.provedor, c]));

  return (
    <>
      {!pronta ? (
        <div className="cartao border-magenta/40 bg-magenta/10 p-6">
          <p className="font-display text-lg font-bold text-magenta-texto">
            Falta a chave de cifra
          </p>
          <p className="mt-3 max-w-[68ch] text-sm leading-relaxed text-neve">
            Sem <code className="font-mono text-magenta-texto">CRIPTO_CHAVE</code> no
            ambiente não há como guardar token de anúncio, e gravar em texto puro não é
            alternativa: um dump de banco viraria acesso às contas de anúncio de todos os
            clientes de uma vez.
          </p>
          <pre className="mt-4 overflow-x-auto rounded-xl border border-fio bg-marinho-fundo p-4 font-mono text-xs text-neve">
{`node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`}
          </pre>
          <p className="mt-3 text-sm text-cinza">
            Guarde em <code className="font-mono">.env.local</code> e na Vercel. Trocar a
            chave depois torna ilegível tudo que já foi cifrado com a anterior.
          </p>
        </div>
      ) : null}

      <Secao
        titulo="Contas de origem"
        apoio="Um acesso da agência por provedor. As lojas dos clientes entram vinculadas a ele, e nenhum cliente gera token."
      >
        <ul className="grid gap-4">
          {PROVEDORES_DE_API.map((p) => {
            const c = porProvedor.get(p);
            return (
              <li key={p} className="cartao p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-display text-lg font-bold tracking-[-0.02em]">
                      {rotuloProvedorApi[p]}
                    </p>
                    {c ? (
                      <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[0.75rem] uppercase tracking-[0.12em] text-cinza">
                        <span>{c.rotulo}</span>
                        <span>token {c.pista}</span>
                        <span>
                          {c.lojas} {c.lojas === 1 ? 'loja vinculada' : 'lojas vinculadas'}
                        </span>
                      </p>
                    ) : (
                      <p className="mt-2 text-sm text-cinza">Nenhuma credencial guardada.</p>
                    )}
                  </div>

                  <p
                    className="text-xs font-semibold"
                    style={{ color: c ? CORES_SITUACAO.saudavel : CORES_SITUACAO.sem_dado }}
                  >
                    <span aria-hidden className="mr-1">{c ? '●' : '○'}</span>
                    {c ? 'conectada' : 'não conectada'}
                  </p>
                </div>

                {c && Object.keys(c.configuracao).length > 0 ? (
                  <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2 border-t border-fio pt-4 text-sm">
                    {Object.entries(c.configuracao).map(([k, v]) => (
                      <div key={k}>
                        <dt className="font-mono text-[0.75rem] uppercase tracking-[0.12em] text-cinza">
                          {k}
                        </dt>
                        <dd className="tabular mt-0.5 break-all text-neve">{v}</dd>
                      </div>
                    ))}
                  </dl>
                ) : null}

                {pronta ? (
                  <div className="mt-5 flex flex-wrap items-center gap-5">
                    <FormCredencial
                      provedor={p}
                      rotuloProvedor={rotuloProvedorApi[p]}
                      campos={CAMPOS_DO_PROVEDOR[p]}
                      jaExiste={Boolean(c)}
                    />
                    {c ? <BotaoDesligarCredencial id={c.id} rotulo={c.rotulo} /> : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </Secao>

      {porProvedor.size > 0 ? (
        <Secao
          titulo="Sincronização"
          apoio="Puxa Meta, Google Ads e GA4 de todas as lojas ativas. A janela termina ontem: dia pela metade desenha uma queda que não existe."
        >
          <div className="cartao p-6">
            <BotaoSincronizar />
            <p className="mt-5 max-w-[68ch] text-sm leading-relaxed text-cinza">
              Para rodar sozinho todo dia, aponte um cron para{' '}
              <code className="font-mono text-neve">GET /api/sincronizar</code> com o
              cabeçalho <code className="font-mono text-neve">x-psy-token</code>. O que
              falhar fica no diário de sincronização da ficha de cada loja, com o erro que
              a API devolveu.
            </p>
          </div>
        </Secao>
      ) : null}
    </>
  );
}
