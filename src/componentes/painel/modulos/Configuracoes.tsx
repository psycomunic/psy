import {
  listarCredenciais,
  criptoConfigurada,
  CAMPOS_DO_PROVEDOR,
  PROVEDORES_DE_API,
  rotuloProvedorApi,
} from '@/lib/ingestao/credenciais';
import { bancoConfigurado } from '@/lib/supabase/ambiente';
import { Secao } from '../base';
import { estadoDaAgenda } from '@/lib/google/agenda';
import { AcoesDaAgenda } from '../GoogleAgenda';
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
const AVISOS_DO_GOOGLE: Record<string, { ok: boolean; texto: string }> = {
  conectado: { ok: true, texto: 'Agenda conectada. As tarefas com prazo já vão para lá.' },
  recusado: { ok: false, texto: 'Você recusou a permissão na tela do Google.' },
  sem_permissao: { ok: false, texto: 'Só o administrador conecta a agenda.' },
  sem_credencial: {
    ok: false,
    texto: 'Faltam GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET no servidor.',
  },
  estado_invalido: {
    ok: false,
    texto: 'A volta do Google não bateu com a ida. Tente conectar de novo.',
  },
  erro: { ok: false, texto: 'O Google recusou a autorização. Tente de novo.' },
};

export async function Configuracoes({ papel, aviso }: { papel: Papel; aviso?: string }) {
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
  const agenda = await estadoDaAgenda();
  const recado = aviso ? AVISOS_DO_GOOGLE[aviso] : null;

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
        titulo="Google Agenda"
        apoio="As tarefas com prazo viram evento de dia inteiro na sua agenda. O painel continua sendo onde elas se criam e se concluem."
      >
        <div className="cartao p-6">
          {recado ? (
            <p
              role="status"
              className={
                'mb-5 rounded-xl border px-4 py-3 text-sm ' +
                (recado.ok
                  ? 'border-[#4ADE80]/40 bg-[#4ADE80]/10 text-[#4ADE80]'
                  : 'border-magenta/40 bg-magenta/10 text-magenta-texto')
              }
            >
              {recado.texto}
            </p>
          ) : null}

          {!agenda.configurada ? (
            <>
              <p className="font-display text-base font-bold">Falta a credencial do app</p>
              <p className="mt-3 max-w-[70ch] text-sm leading-relaxed text-cinza">
                A conexão usa um aplicativo do Google criado uma vez, no Google Cloud, e as
                duas chaves dele ficam no servidor. Elas não são a sua senha e não dão
                acesso a nada sozinhas: é o seu consentimento, na tela do Google, que
                autoriza escrever na agenda.
              </p>
              <pre className="mt-4 overflow-x-auto rounded-xl border border-fio bg-marinho-fundo p-4 font-mono text-xs text-neve">
{`GOOGLE_CLIENT_ID=...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=...`}
              </pre>
              <p className="mt-3 text-sm leading-relaxed text-cinza">
                No Google Cloud, o endereço de retorno precisa ser exatamente este:
              </p>
              <pre className="mt-2 overflow-x-auto rounded-xl border border-fio bg-marinho-fundo p-4 font-mono text-xs text-neve">
{`${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.psycomunic.com.br'}/api/google/retorno`}
              </pre>
            </>
          ) : agenda.conectada ? (
            <>
              <p className="flex flex-wrap items-center gap-2 font-display text-base font-bold">
                <span aria-hidden style={{ color: '#4ADE80' }}>●</span>
                Conectada
                {agenda.email ? (
                  <span className="font-mono text-sm font-normal text-cinza">
                    {agenda.email}
                  </span>
                ) : null}
              </p>
              <p className="mt-3 max-w-[70ch] text-sm leading-relaxed text-cinza">
                Toda tarefa com prazo vira um evento de dia inteiro, e some da agenda quando
                a tarefa é apagada ou perde o prazo. A agenda não manda de volta: o que
                você mudar no Google não volta para cá, de propósito, porque sem regra de
                conflito escrita a sincronização de ida e volta duplica evento até alguém
                desligar.
              </p>
              <AcoesDaAgenda />
            </>
          ) : (
            <>
              <p className="font-display text-base font-bold">Não conectada</p>
              <p className="mt-3 max-w-[70ch] text-sm leading-relaxed text-cinza">
                Ao conectar, o Google vai perguntar se a Psy Comunic pode criar e alterar
                eventos na sua agenda. É só o que ela pede: não lê os seus compromissos nem
                mexe na lista de calendários.
              </p>
              <a
                href="/api/google/conectar"
                className="mt-4 inline-flex items-center gap-2.5 rounded-full bg-magenta px-6 py-3 text-sm font-semibold text-branco transition-colors hover:bg-magenta-forte"
              >
                Conectar o Google Agenda
                <span aria-hidden>→</span>
              </a>
            </>
          )}
        </div>
      </Secao>

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
