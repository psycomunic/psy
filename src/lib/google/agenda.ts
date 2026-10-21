import 'server-only';

import { clienteServico } from '@/lib/supabase/servico';
import { lerChave, cifrarCom, decifrarCom, final } from '@/lib/cripto';
import type { Tarefa } from '@/lib/dados/tipos';

/**
 * Google Agenda: autorização, token e escrita de evento.
 *
 * ============================================================
 * O QUE ESTA INTEGRAÇÃO FAZ, E O QUE ELA NÃO FAZ
 * ============================================================
 * Ela leva tarefa do painel para a agenda do Google, e só nessa
 * direção. Cada tarefa com prazo vira um evento de DIA INTEIRO, e o
 * painel continua sendo a fonte da verdade.
 *
 * O caminho de volta não existe de propósito, e não por preguiça:
 * quando os dois lados podem mudar a mesma coisa, alguém tem que
 * decidir quem vence num conflito, o que fazer quando o evento é
 * apagado no celular e como não duplicar a cada rodada. Isso é um
 * projeto, e não um detalhe, e sem essas regras escritas a
 * sincronização de ida e volta duplica evento até alguém desligar.
 *
 * ============================================================
 * DIA INTEIRO, E NÃO HORÁRIO
 * ============================================================
 * Tarefa aqui tem PRAZO, e prazo não tem hora. Inventar 09:00 criaria
 * um compromisso que não existe e ocuparia um horário que está livre.
 * Evento de dia inteiro vai para a faixa de cima do Google, onde
 * convive com as reuniões em vez de disputar espaço com elas.
 *
 * ============================================================
 * ONDE O SEGREDO MORA
 * ============================================================
 * Em `credencial_agencia`, cifrado com a mesma chave das credenciais
 * de anúncio, que não mora no banco. Dump de banco sozinho não vira
 * acesso à agenda de ninguém.
 *
 * O provedor aqui NÃO entra em `PROVEDORES_DE_API`: aquela lista
 * alimenta o formulário onde se cola token à mão, e este token não se
 * cola, se autoriza. A tabela aceita qualquer texto em `provedor`, que
 * é o que permite as duas coisas conviverem.
 */

const PROVEDOR = 'google_calendar';
const ROTULO = 'agenda';

const AUTORIZACAO = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN = 'https://oauth2.googleapis.com/token';
const EVENTOS = (calendario: string) =>
  `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendario)}/events`;

/**
 * Só eventos, e só os que este app criar.
 *
 * `calendar.events` deixa criar, alterar e apagar evento. NÃO deixa
 * ler a agenda inteira, nem mexer na lista de calendários. Pedir
 * `calendar` cheio seria pedir acesso a tudo para fazer uma coisa, e é
 * o que faz a tela de consentimento do Google assustar com razão.
 */
const ESCOPOS = ['https://www.googleapis.com/auth/calendar.events', 'openid', 'email'];

export type ConfigGoogle = {
  clientId: string;
  clientSecret: string;
  redirecionamento: string;
};

/**
 * As credenciais do APP, que são da Psy Comunic e não do usuário.
 *
 * Em variável de ambiente do servidor, nunca em `NEXT_PUBLIC_`: o
 * client secret no bundle do navegador é o segredo publicado.
 */
export function configGoogle(): ConfigGoogle | null {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  if (!clientId || !clientSecret || !site) return null;
  return {
    clientId,
    clientSecret,
    redirecionamento: `${site.replace(/\/$/, '')}/api/google/retorno`,
  };
}

function chave() {
  const bruta = process.env.CRIPTO_CHAVE;
  if (!bruta) throw new Error('CRIPTO_CHAVE não configurada: sem ela não dá para guardar o token.');
  return lerChave(bruta);
}

/** O endereço da tela de consentimento, com o estado anti-CSRF junto. */
export function urlDeAutorizacao(cfg: ConfigGoogle, estado: string): string {
  const p = new URLSearchParams({
    client_id: cfg.clientId,
    redirect_uri: cfg.redirecionamento,
    response_type: 'code',
    scope: ESCOPOS.join(' '),
    /* `offline` é o que devolve refresh token, e `consent` é o que
       garante que ele venha TODA vez. Sem o segundo, o Google manda o
       refresh só na primeira autorização da vida, e quem reconectar
       depois de um erro fica com uma credencial sem como renovar. */
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    state: estado,
  });
  return `${AUTORIZACAO}?${p.toString()}`;
}

type RespostaToken = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  id_token?: string;
  error?: string;
  error_description?: string;
};

async function pedirToken(cfg: ConfigGoogle, corpo: Record<string, string>) {
  const r = await fetch(TOKEN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(corpo).toString(),
  });
  const dados = (await r.json()) as RespostaToken;
  if (!r.ok || dados.error) {
    throw new Error(dados.error_description ?? dados.error ?? `Google respondeu ${r.status}`);
  }
  return dados;
}

/** O e-mail de quem autorizou, lido do `id_token` sem verificar
    assinatura: ele veio direto do Google nesta requisição, e serve
    só para mostrar na tela qual conta está ligada. */
function emailDoIdToken(idToken: string | undefined): string | null {
  if (!idToken) return null;
  try {
    const carga = idToken.split('.')[1];
    const json = JSON.parse(Buffer.from(carga, 'base64url').toString('utf8'));
    return (json.email as string) ?? null;
  } catch {
    return null;
  }
}

/** Troca o código da volta pelo refresh token, e guarda. */
export async function guardarAutorizacao(cfg: ConfigGoogle, codigo: string) {
  const dados = await pedirToken(cfg, {
    code: codigo,
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    redirect_uri: cfg.redirecionamento,
    grant_type: 'authorization_code',
  });

  if (!dados.refresh_token) {
    throw new Error(
      'O Google não devolveu refresh token. Remova o acesso do app em myaccount.google.com/permissions e autorize de novo.',
    );
  }

  const email = emailDoIdToken(dados.id_token);
  const supabase = clienteServico();
  const { error } = await supabase.from('credencial_agencia').upsert(
    {
      provedor: PROVEDOR,
      rotulo: ROTULO,
      segredo: cifrarCom(chave(), JSON.stringify({ refresh_token: dados.refresh_token })),
      pista: final(dados.refresh_token),
      configuracao: { email, calendario: 'primary' },
      ativa: true,
    },
    { onConflict: 'provedor,rotulo' },
  );
  if (error) throw new Error(error.message);
  return { email };
}

export type EstadoDaAgenda = {
  configurada: boolean;
  conectada: boolean;
  email: string | null;
  calendario: string;
};

export async function estadoDaAgenda(): Promise<EstadoDaAgenda> {
  const cfg = configGoogle();
  const supabase = clienteServico();
  const { data } = await supabase
    .from('credencial_agencia')
    .select('segredo, configuracao, ativa')
    .eq('provedor', PROVEDOR)
    .eq('rotulo', ROTULO)
    .maybeSingle();

  const conf = (data?.configuracao ?? {}) as { email?: string; calendario?: string };
  return {
    configurada: cfg !== null,
    conectada: Boolean(data?.ativa && data?.segredo),
    email: conf.email ?? null,
    calendario: conf.calendario ?? 'primary',
  };
}

export async function desconectarAgenda() {
  const supabase = clienteServico();
  /* Desliga E apaga o token, como as outras credenciais: guardar o
     segredo de uma integração que ninguém usa é manter o risco sem
     nenhum benefício. */
  const { error } = await supabase
    .from('credencial_agencia')
    .update({ ativa: false, segredo: null, pista: null })
    .eq('provedor', PROVEDOR)
    .eq('rotulo', ROTULO);
  if (error) throw new Error(error.message);
}

/**
 * Um access token válido, a partir do refresh guardado.
 *
 * Não guarda o access token: ele vale uma hora, e guardar algo que
 * expira em uma hora só cria uma segunda coisa para manter em dia.
 */
async function acessoValido(): Promise<{ token: string; calendario: string } | null> {
  const cfg = configGoogle();
  if (!cfg) return null;

  const supabase = clienteServico();
  const { data } = await supabase
    .from('credencial_agencia')
    .select('segredo, configuracao, ativa')
    .eq('provedor', PROVEDOR)
    .eq('rotulo', ROTULO)
    .maybeSingle();

  if (!data?.ativa || !data.segredo) return null;

  const segredo = JSON.parse(decifrarCom(chave(), data.segredo as string)) as {
    refresh_token: string;
  };
  const dados = await pedirToken(cfg, {
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    refresh_token: segredo.refresh_token,
    grant_type: 'refresh_token',
  });
  if (!dados.access_token) throw new Error('O Google não devolveu access token.');

  const conf = (data.configuracao ?? {}) as { calendario?: string };
  return { token: dados.access_token, calendario: conf.calendario ?? 'primary' };
}

/** O dia seguinte, em texto. O `end.date` do Google é EXCLUSIVO: sem
    isso, um evento de um dia aparece com zero dias de duração. */
function diaSeguinte(dia: string): string {
  const d = new Date(`${dia}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

function eventoDaTarefa(t: Tarefa) {
  const feita = t.status === 'concluida';
  return {
    summary: `${feita ? '✓ ' : ''}${t.titulo}`,
    description: [
      t.detalhe,
      t.conta ? `Cliente: ${t.conta}` : null,
      t.responsavel ? `Responsável: ${t.responsavel}` : null,
      'Criado pelo painel da Psy Comunic',
    ]
      .filter(Boolean)
      .join('\n'),
    start: { date: t.prazo },
    end: { date: diaSeguinte(t.prazo!) },
    /* Lembrete padrão do calendário, e não um nosso: quem já configurou
       como quer ser avisado não quer que um app decida por ele. */
    reminders: { useDefault: true },
    source: { title: 'Painel Psy Comunic', url: 'https://www.psycomunic.com.br/painel/tarefas' },
  };
}

export type ResultadoSinc = 'criado' | 'atualizado' | 'apagado' | 'sem_mudanca' | 'desligado';

/**
 * Leva UMA tarefa para a agenda.
 *
 * ============================================================
 * NUNCA DERRUBA A AÇÃO DE QUEM CHAMOU
 * ============================================================
 * Quem chama isto está salvando uma tarefa, e salvar a tarefa não pode
 * depender do Google estar no ar. Toda falha vira `null` e um aviso no
 * log do servidor; a tarefa já está gravada no banco de qualquer jeito.
 *
 * A consequência é conhecida e aceita: uma falha aqui deixa a agenda
 * desatualizada até a próxima vez que a tarefa for salva, ou até o
 * botão "Sincronizar tudo" ser usado.
 */
export async function sincronizarTarefa(
  t: Tarefa & { googleEventoId?: string | null },
): Promise<{ resultado: ResultadoSinc; eventoId: string | null } | null> {
  try {
    const acesso = await acessoValido();
    if (!acesso) return { resultado: 'desligado', eventoId: t.googleEventoId ?? null };

    const cabecalho = {
      Authorization: `Bearer ${acesso.token}`,
      'Content-Type': 'application/json',
    };
    const base = EVENTOS(acesso.calendario);

    /* Sem prazo não tem lugar numa agenda, e cancelada não é
       compromisso. Se havia evento, ele sai. */
    const deveExistir = t.prazo !== null && t.status !== 'cancelada';

    if (!deveExistir) {
      if (!t.googleEventoId) return { resultado: 'sem_mudanca', eventoId: null };
      const r = await fetch(`${base}/${encodeURIComponent(t.googleEventoId)}`, {
        method: 'DELETE',
        headers: cabecalho,
      });
      /* 410 é "já estava apagado", e 404 é "nunca existiu". Os dois
         são o estado que a gente queria, e não erro. */
      if (!r.ok && r.status !== 404 && r.status !== 410) {
        throw new Error(`Google respondeu ${r.status} ao apagar`);
      }
      return { resultado: 'apagado', eventoId: null };
    }

    const corpo = JSON.stringify(eventoDaTarefa(t));

    if (t.googleEventoId) {
      const r = await fetch(`${base}/${encodeURIComponent(t.googleEventoId)}`, {
        method: 'PATCH',
        headers: cabecalho,
        body: corpo,
      });
      if (r.ok) return { resultado: 'atualizado', eventoId: t.googleEventoId };
      /* Evento apagado no Google à mão: cria de novo, em vez de
         insistir num id que não existe mais. */
      if (r.status !== 404 && r.status !== 410) {
        throw new Error(`Google respondeu ${r.status} ao atualizar`);
      }
    }

    const r = await fetch(base, { method: 'POST', headers: cabecalho, body: corpo });
    if (!r.ok) throw new Error(`Google respondeu ${r.status} ao criar`);
    const criado = (await r.json()) as { id?: string };
    return { resultado: 'criado', eventoId: criado.id ?? null };
  } catch (e) {
    console.error('[google agenda]', (e as Error).message);
    return null;
  }
}

/** Apaga o evento de uma tarefa que deixou de existir. */
export async function apagarEvento(eventoId: string | null | undefined) {
  if (!eventoId) return;
  try {
    const acesso = await acessoValido();
    if (!acesso) return;
    await fetch(`${EVENTOS(acesso.calendario)}/${encodeURIComponent(eventoId)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${acesso.token}` },
    });
  } catch (e) {
    console.error('[google agenda]', (e as Error).message);
  }
}

/* ================================================================== */
/* A ponte entre uma tarefa gravada e a agenda                         */
/* ================================================================== */

/**
 * Lê a tarefa do banco e leva o estado dela para a agenda.
 *
 * Lê de novo em vez de receber os dados prontos de propósito: quem
 * chama acabou de gravar e tem em mãos o que MANDOU gravar, que não é
 * a mesma coisa que o que ficou lá. Gatilho de recorrência, valor
 * padrão de coluna e regra do banco acontecem depois do insert, e o
 * evento precisa refletir a linha, e não a intenção.
 *
 * Usa a chave de serviço porque `credencial_agencia` não tem política
 * de RLS nenhuma, e porque isto roda em ação de servidor, nunca perto
 * do navegador.
 */
export async function levarParaAgenda(tarefaId: string): Promise<void> {
  /* Sem credencial do app, nem vale a ida ao banco. Salvar tarefa é a
     ação mais frequente do painel, e uma consulta a mais em cada uma
     para descobrir o que já se sabe pelo ambiente é desperdício que
     aparece no relógio. */
  if (!configGoogle()) return;

  try {
    const supabase = clienteServico();
    const { data } = await supabase
      .from('tarefa')
      .select(
        'id, titulo, detalhe, status, prazo, prioridade, recorrencia, lembrar_dias, concluida_em, google_evento_id, conta:conta_id(nome), perfil:responsavel_id(nome)',
      )
      .eq('id', tarefaId)
      .maybeSingle();

    if (!data) return;

    const t = {
      id: data.id as string,
      titulo: data.titulo as string,
      detalhe: (data.detalhe as string) ?? null,
      conta: (data.conta as unknown as { nome: string } | null)?.nome ?? null,
      contaId: null,
      status: data.status as Tarefa['status'],
      responsavel: (data.perfil as unknown as { nome: string } | null)?.nome ?? null,
      responsavelId: null,
      prazo: (data.prazo as string) ?? null,
      prioridade: data.prioridade as Tarefa['prioridade'],
      recorrencia: data.recorrencia as Tarefa['recorrencia'],
      lembrarDias: Number(data.lembrar_dias ?? 0),
      concluidaEm: (data.concluida_em as string) ?? null,
      diasAtePrazo: null,
      googleEventoId: (data.google_evento_id as string) ?? null,
    };

    const r = await sincronizarTarefa(t);
    if (!r || r.resultado === 'desligado' || r.resultado === 'sem_mudanca') return;

    /* Grava o id só quando ele mudou. Escrita à toa em toda
       sincronização sujaria a auditoria de `tarefa` com linhas que não
       dizem nada. */
    if (r.eventoId !== t.googleEventoId) {
      await supabase
        .from('tarefa')
        .update({ google_evento_id: r.eventoId })
        .eq('id', tarefaId);
    }
  } catch (e) {
    console.error('[google agenda] levarParaAgenda:', (e as Error).message);
  }
}

/** O id do evento de uma tarefa, para apagar o evento ANTES de a
    tarefa sumir do banco e levar o id junto. */
export async function eventoDaTarefaId(tarefaId: string): Promise<string | null> {
  try {
    const supabase = clienteServico();
    const { data } = await supabase
      .from('tarefa')
      .select('google_evento_id')
      .eq('id', tarefaId)
      .maybeSingle();
    return (data?.google_evento_id as string) ?? null;
  } catch {
    return null;
  }
}

/**
 * Leva TODAS as tarefas que deveriam estar na agenda.
 *
 * Existe para o primeiro dia, quando a agenda acabou de ser conectada
 * e o passado inteiro está fora dela, e para depois de uma falha: a
 * sincronização de cada tarefa nunca derruba a ação de quem salvou, e
 * o preço disso é que uma falha deixa aquela tarefa para trás.
 *
 * Só as em aberto com prazo. Concluída de três meses atrás não precisa
 * virar compromisso retroativo na agenda de ninguém.
 */
export async function sincronizarTudo(): Promise<{ levadas: number; total: number }> {
  const supabase = clienteServico();
  const { data } = await supabase
    .from('tarefa')
    .select('id')
    .in('status', ['aberta', 'fazendo'])
    .not('prazo', 'is', null)
    .limit(500);

  const ids = (data ?? []).map((t) => t.id as string);
  let levadas = 0;
  for (const id of ids) {
    await levarParaAgenda(id);
    levadas++;
  }
  return { levadas, total: ids.length };
}
