import 'server-only';
import { clienteServico } from '@/lib/supabase/servico';
import { cifrarCom, decifrarCom, lerChave, final, ErroDeCripto } from '@/lib/cripto';

/**
 * As credenciais da agência: guardar, ler e nunca devolver em claro.
 *
 * Este é o ÚNICO arquivo que toca `process.env.CRIPTO_CHAVE`. Ele é
 * `server-only`, o que faz o build falhar se um componente de cliente
 * importar — e a variável não tem prefixo `NEXT_PUBLIC_`, que é
 * literalmente o que publicaria a chave no navegador.
 *
 * Nada aqui devolve segredo decifrado para fora do servidor. As funções
 * de leitura existem para a rotina de sincronização, que roda no mesmo
 * processo; as de escrita recebem o claro e devolvem só a pista.
 */

export const PROVEDORES_DE_API = [
  'meta_ads',
  'google_ads',
  'ga4',
  'hospedi',
  'whatsapp_alertas',
  'asaas',
] as const;
export type ProvedorApi = (typeof PROVEDORES_DE_API)[number];

export const rotuloProvedorApi: Record<ProvedorApi, string> = {
  meta_ads: 'Meta Ads (BM da agência)',
  google_ads: 'Google Ads (MCC da agência)',
  ga4: 'Google Analytics 4',
  hospedi: 'Hospedi (hospedi.app)',
  whatsapp_alertas: 'WhatsApp · Alertas de Saldo Baixo',
  asaas: 'Asaas (cobrança)',
};

/**
 * Que campos cada provedor exige.
 *
 * Está aqui, e não espalhado no formulário, porque é a mesma lista que
 * a validação e a tela precisam. Duas cópias divergem na primeira vez
 * que um provedor muda de requisito.
 */
export const CAMPOS_DO_PROVEDOR: Record<
  ProvedorApi,
  {
    chave: string;
    rotulo: string;
    segredo: boolean;
    obrigatorio: boolean;
    ajuda: string;
    valorPadrao?: string;
    /* Lista fechada vira <select> na tela. Existe para o campo
       'ambiente': ele era texto livre, e qualquer coisa diferente de
       'producao' cai em sandbox. Quem digitava 'produção' com acento
       continuava em sandbox sem nenhum aviso, achando que tinha
       virado a chave. */
    opcoes?: { valor: string; rotulo: string }[];
  }[]
> = {
  meta_ads: [
    {
      chave: 'access_token',
      rotulo: 'Token de acesso do usuário de sistema',
      segredo: true,
      obrigatorio: true,
      ajuda: 'BM > Configurações > Usuários de sistema > Gerar token, com ads_read.',
    },
  ],
  google_ads: [
    { chave: 'client_id', rotulo: 'Client ID', segredo: false, obrigatorio: true, ajuda: 'Google Cloud > Credenciais > ID do cliente OAuth.' },
    { chave: 'client_secret', rotulo: 'Client secret', segredo: true, obrigatorio: true, ajuda: 'Na mesma tela do Client ID.' },
    { chave: 'refresh_token', rotulo: 'Refresh token', segredo: true, obrigatorio: true, ajuda: 'Gerado uma vez, no consentimento OAuth com acesso offline.' },
    { chave: 'developer_token', rotulo: 'Developer token', segredo: true, obrigatorio: true, ajuda: 'Google Ads > Ferramentas > Central de API, na conta gerenciadora.' },
    { chave: 'login_customer_id', rotulo: 'ID da conta gerenciadora (MCC)', segredo: false, obrigatorio: false, ajuda: 'Só números. Sem ele a API recusa acesso à conta do cliente.' },
  ],
  ga4: [
    { chave: 'client_id', rotulo: 'Client ID', segredo: false, obrigatorio: true, ajuda: 'Pode ser o mesmo do Google Ads.' },
    { chave: 'client_secret', rotulo: 'Client secret', segredo: true, obrigatorio: true, ajuda: 'Pode ser o mesmo do Google Ads.' },
    { chave: 'refresh_token', rotulo: 'Refresh token', segredo: true, obrigatorio: true, ajuda: 'Precisa ter sido gerado com o escopo analytics.readonly.' },
  ],
  hospedi: [
    {
      chave: 'email',
      rotulo: 'E-mail de acesso na Hospedi',
      segredo: false,
      obrigatorio: true,
      ajuda: 'Conta admin em hospedi.app (enxerga várias hospedagens) ou o e-mail de login direto do chalé.',
    },
    {
      chave: 'senha',
      rotulo: 'Senha de acesso na Hospedi',
      segredo: true,
      obrigatorio: true,
      ajuda: 'Guardada cifrada com AES-256; nunca volta para a tela.',
    },
  ],
  whatsapp_alertas: [
    {
      chave: 'modo',
      rotulo: 'Canal de disparo',
      segredo: false,
      obrigatorio: true,
      opcoes: [
        { valor: 'cloud_api', rotulo: 'Opção A — WhatsApp Cloud API Oficial (Meta)' },
        { valor: 'webhook', rotulo: 'Opção B — Gateway / Webhook (Z-API, Evolution, Uazapi, n8n)' },
      ],
      ajuda: 'Comece pela Opção A (Meta Oficial). Se um dia preferir Z-API ou Evolution via QR Code, basta trocar aqui.',
    },
    {
      chave: 'destinatario',
      rotulo: 'WhatsApp que recebe os alertas de saldo',
      segredo: false,
      obrigatorio: true,
      valorPadrao: '5547992406661',
      ajuda: 'Com DDI 55 e DDD, só números. As demais notificações do sistema continuam apenas no sino do painel.',
    },
    {
      chave: 'piso_alerta',
      rotulo: 'Avisar quando o saldo cair abaixo de (R$)',
      segredo: false,
      obrigatorio: false,
      valorPadrao: '150',
      ajuda: 'Dispara quando o saldo pré-pago ficar menor que este valor OU durar menos de 3 dias pelo gasto médio.',
    },
    {
      chave: 'phone_number_id',
      rotulo: 'Phone Number ID da Meta (Opção A)',
      segredo: false,
      obrigatorio: false,
      ajuda: 'Apenas números (ex.: 1201735229697128). Se deixar em branco, o sistema localiza automaticamente o número Cloud API ativo na sua BM.',
    },
    {
      chave: 'access_token',
      rotulo: 'Token WhatsApp da Meta (opcional na Opção A)',
      segredo: true,
      obrigatorio: false,
      ajuda: 'Se deixar em branco, reutiliza automaticamente o token da Meta Ads já salvo acima (basta o usuário de sistema ter whatsapp_business_messaging).',
    },
    {
      chave: 'template_nome',
      rotulo: 'Nome do Template aprovado na Meta (opcional na Opção A)',
      segredo: false,
      obrigatorio: false,
      ajuda: 'Ex.: alerta_saldo_conta (padrão automático para entregar mesmo fora da janela de 24h) ou hello_world.',
    },
    {
      chave: 'template_idioma',
      rotulo: 'Idioma do Template (Opção A)',
      segredo: false,
      obrigatorio: false,
      valorPadrao: 'pt_BR',
      ajuda: 'Padrão pt_BR (para o template de teste hello_world da Meta, o sistema usa en_US automaticamente).',
    },
    {
      chave: 'webhook_url',
      rotulo: 'URL de envio HTTP POST (apenas Opção B)',
      segredo: false,
      obrigatorio: false,
      ajuda: 'Preencha somente se escolher a Opção B (endpoint send-text da Z-API, Evolution API, Uazapi ou n8n).',
    },
    {
      chave: 'webhook_token',
      rotulo: 'Token / API Key do Gateway (apenas Opção B)',
      segredo: true,
      obrigatorio: false,
      ajuda: 'Client-Token da Z-API, apikey da Evolution ou Bearer token do webhook.',
    },
  ],
  asaas: [
    {
      chave: 'api_key',
      rotulo: 'Chave de API',
      segredo: true,
      obrigatorio: true,
      ajuda: 'Asaas > Integrações > API. A chave de sandbox começa com \$aact_hmlg e a de produção com \$aact_prod.',
    },
    {
      chave: 'ambiente',
      rotulo: 'Ambiente',
      segredo: false,
      obrigatorio: true,
      opcoes: [
        { valor: 'sandbox', rotulo: 'Sandbox (teste, ninguém recebe cobrança)' },
        { valor: 'producao', rotulo: 'Produção (cobrança de verdade)' },
      ],
      ajuda: 'Chave de sandbox apontada para produção responde 401. O contrário emite cobrança de verdade.',
    },
    {
      chave: 'webhook_token',
      rotulo: 'Token do webhook',
      segredo: true,
      obrigatorio: false,
      ajuda: 'O mesmo que você configurar no Asaas em Integrações > Webhooks. Sem ele, a rota de retorno recusa tudo.',
    },
  ],
};

/** Campos que NÃO são segredo e ficam legíveis em `configuracao`. */
const ABERTOS = new Set([
  'client_id',
  'login_customer_id',
  'property_id',
  'ambiente',
  'email',
  'modo',
  'destinatario',
  'piso_alerta',
  'phone_number_id',
  'template_nome',
  'template_idioma',
  'webhook_url',
]);

function chave() {
  const bruta = process.env.CRIPTO_CHAVE;
  if (!bruta) {
    throw new ErroDeCripto(
      'CRIPTO_CHAVE ausente. Sem ela não há como guardar token de anúncio, ' +
        'e gravar em texto puro não é alternativa. ' +
        'Gere com: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64url\'))"',
    );
  }
  return lerChave(bruta);
}

/** `true` quando dá para cifrar. A tela usa para explicar o que falta. */
export function criptoConfigurada(): boolean {
  try {
    chave();
    return true;
  } catch {
    return false;
  }
}

/**
 * Grava a credencial de um provedor.
 *
 * Recebe os valores em claro, separa segredo de configuração, cifra o
 * primeiro e guarda uma pista do último token para dar para reconhecer
 * na tela sem exibi-lo.
 *
 * ============================================================
 * CAMPO EM BRANCO MANTÉM O QUE JÁ ESTAVA LÁ
 * ============================================================
 * Os segredos não voltam para a tela — é isso que faz a tela não ser
 * um lugar de onde se copia token. Mas a primeira versão desta função
 * SUBSTITUÍA o conjunto inteiro, e campo não preenchido virava campo
 * apagado.
 *
 * O estrago aparecia no pior momento possível. Trocar o Asaas de
 * sandbox para produção é preencher chave e ambiente; quem deixasse o
 * "token do webhook" em branco — por não ter o valor à mão, já que a
 * tela não o mostra — apagava o token sem nenhum aviso. As cobranças
 * continuariam saindo, e a confirmação de pagamento pararia de chegar:
 * a rota de retorno passaria a recusar tudo por falta de token, e o
 * painel diria que ninguém pagou.
 *
 * Falha silenciosa, com dinheiro de verdade, exatamente na virada.
 *
 * Agora branco significa "não mexi neste", que é o que qualquer um
 * assume ao olhar um formulário cujos valores não aparecem. Para
 * apagar de fato existe "Desligar e apagar token".
 */
export async function guardarCredencial({
  provedor,
  rotulo,
  valores,
}: {
  provedor: ProvedorApi;
  rotulo: string;
  valores: Record<string, string>;
}) {
  const k = chave();

  /* O que já está guardado, para poder preservar o que não foi
     preenchido de novo. */
  const supabaseLeitura = clienteServico();
  const { data: atual } = await supabaseLeitura
    .from('credencial_agencia')
    .select('segredo, configuracao')
    .eq('provedor', provedor)
    .eq('rotulo', rotulo)
    .maybeSingle();

  let segredosAntigos: Record<string, string> = {};
  if (atual?.segredo) {
    try {
      segredosAntigos = abrirSegredo(atual.segredo as string);
    } catch {
      /* Segredo ilegível (chave de cifra trocada, por exemplo). Não dá
         para preservar o que não se consegue ler, e travar aqui
         impediria justamente de gravar a credencial nova que
         consertaria a situação. */
      segredosAntigos = {};
    }
  }
  const configAntiga = (atual?.configuracao ?? {}) as Record<string, string>;

  const jaExiste = (chaveCampo: string) =>
    Boolean(segredosAntigos[chaveCampo]?.trim() || configAntiga[chaveCampo]?.trim());

  const faltando = CAMPOS_DO_PROVEDOR[provedor]
    .filter((c) => c.obrigatorio && !valores[c.chave]?.trim() && !jaExiste(c.chave))
    .map((c) => c.rotulo);

  if (faltando.length > 0) {
    throw new Error(`Faltou preencher: ${faltando.join(', ')}.`);
  }

  const segredos: Record<string, string> = { ...segredosAntigos };
  const configuracao: Record<string, string> = { ...configAntiga };

  /* Se já havia um valor não numérico gravado antes por autofill (ex.: "Principal"),
     higieniza ao salvar novamente. */
  if (
    provedor === 'whatsapp_alertas' &&
    configuracao.phone_number_id &&
    !/^\d{8,25}$/.test(configuracao.phone_number_id.trim())
  ) {
    delete configuracao.phone_number_id;
  }

  for (const campo of CAMPOS_DO_PROVEDOR[provedor]) {
    const v = valores[campo.chave]?.trim();
    if (!v) continue;

    if (provedor === 'whatsapp_alertas' && campo.chave === 'phone_number_id') {
      /* Ignora preenchimento automático de gerenciador de senhas (ex.: "Principal") */
      if (v.toLowerCase() === rotulo.toLowerCase()) continue;
      const soDigitos = v.replace(/\s+/g, '');
      if (!/^\d{8,25}$/.test(soDigitos)) {
        throw new Error(
          'O Phone Number ID da Meta precisa conter apenas números (ex.: 1201735229697128), ou deixe em branco para detecção automática.',
        );
      }
      configuracao[campo.chave] = soDigitos;
      continue;
    }

    if (ABERTOS.has(campo.chave)) configuracao[campo.chave] = v;
    else segredos[campo.chave] = v;
  }

  /* A pista sai do campo mais identificável do provedor: o token de
     acesso na Meta, o refresh token no Google.

     Ela nunca fica nula quando há segredo, porque a listagem usa
     "pista preenchida" como resposta para "tem segredo?" — justamente
     para não precisar buscar o token. Um provedor futuro sem nenhum
     campo reconhecível cai no genérico em vez de quebrar a invariante. */
  const paraPista =
    segredos.access_token ??
    segredos.refresh_token ??
    segredos.api_key ??
    segredos.senha ??
    segredos.webhook_token ??
    '';
  const pista = paraPista ? final(paraPista) : '••••';

  const supabase = clienteServico();

  const { error } = await supabase
    .from('credencial_agencia')
    .upsert(
      {
        provedor,
        rotulo,
        segredo: cifrarCom(k, JSON.stringify(segredos)),
        pista,
        configuracao,
        ativa: true,
      },
      { onConflict: 'provedor,rotulo' },
    );

  if (error) throw new Error(error.message);
}

/** Decifra o segredo guardado. Só para uso dentro do servidor. */
export function abrirSegredo(cifrado: string): Record<string, string> {
  const claro = decifrarCom(chave(), cifrado);
  const obj = JSON.parse(claro);
  if (!obj || typeof obj !== 'object') throw new ErroDeCripto('Segredo com formato inesperado.');
  return obj as Record<string, string>;
}

/** O que existe guardado, sem nada de segredo. */
export type CredencialResumo = {
  id: string;
  provedor: ProvedorApi;
  rotulo: string;
  pista: string | null;
  configuracao: Record<string, string>;
  ativa: boolean;
  temSegredo: boolean;
  atualizadoEm: string;
  /** Quantas lojas usam esta credencial. */
  lojas: number;
};

/**
 * Lista as credenciais para a tela.
 *
 * Lê com a service role porque `credencial_agencia` não tem política
 * nenhuma. O `select` NÃO inclui `segredo` — nem com apelido: o que
 * não é buscado não tem como vazar por um `console.log` mais adiante,
 * nem aparecer num dump de erro.
 *
 * Por isso "tem segredo?" é respondido pela `pista`, e não pelo token.
 * As duas colunas só são escritas juntas: `guardarCredencial` grava as
 * duas, `desligarCredencial` apaga as duas. Enquanto isso valer, pista
 * preenchida é o mesmo que segredo guardado.
 *
 * Quem chama precisa ter conferido que é administrador. Não há RLS
 * atrás disto para consertar um esquecimento.
 */
export async function listarCredenciais(): Promise<CredencialResumo[]> {
  const supabase = clienteServico();

  const { data, error } = await supabase
    .from('credencial_agencia')
    .select('id, provedor, rotulo, pista, configuracao, ativa, atualizado_em, integracao(count)')
    .order('provedor');

  if (error) return [];

  return (data ?? []).map((c) => ({
    id: c.id as string,
    provedor: c.provedor as ProvedorApi,
    rotulo: c.rotulo as string,
    pista: (c.pista as string) ?? null,
    configuracao: (c.configuracao as Record<string, string>) ?? {},
    ativa: Boolean(c.ativa),
    temSegredo: c.pista !== null,
    atualizadoEm: c.atualizado_em as string,
    lojas: Number((c.integracao as unknown as { count: number }[])?.[0]?.count ?? 0),
  }));
}
