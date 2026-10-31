'use server';

import { clienteServico } from '@/lib/supabase/servico';
import { bancoConfigurado } from '@/lib/supabase/ambiente';
import { perguntas, NOTA_MAXIMA } from '@/conteudo/selecao-braganca';
import { enviarTodos, caixaDaAgencia, pareceEmail } from '@/lib/email/remetente';
import { inscricaoRecebida, avisoDeInscricao } from '@/lib/email/modelos';

/**
 * A inscrição da seleção "10 empresas" de Bragança vira lead no CRM.
 *
 * Mesmo caminho do formulário de tráfego (`trafego-pago/acoes.ts`): a
 * tabela `lead` continua fechada para a chave pública, e quem grava é
 * `registrar_lead_do_site`, chamada com a service role depois de
 * validar. As mesmas três defesas baratas contra robô: campo isca,
 * tempo mínimo e telefone repetido em dez minutos (no banco).
 *
 * ============================================================
 * A NOTA
 * ============================================================
 * Cada resposta fechada tem pontos em `selecao-braganca.ts`. A soma,
 * em porcentagem, vai na primeira linha da observação do lead:
 * "Nota 82/100". Com 40 inscrições para 10 vagas, é por ela que a
 * equipe começa a leitura. A nota é calculada AQUI, com a tabela do
 * servidor: o navegador manda só as respostas, e uma nota enviada
 * pelo cliente seria uma nota que qualquer um edita.
 */

export type ResultadoInscricao = { ok: boolean; mensagem: string };

function telefoneValido(bruto: string) {
  const n = bruto.replace(/\D/g, '');
  return n.length >= 10 && n.length <= 13;
}

export async function enviarInscricao(
  respostas: Record<string, string | string[]>,
  extras: { isca: string; abertoEm: number },
): Promise<ResultadoInscricao> {
  try {
    if ((extras.isca ?? '').trim() !== '') {
      return { ok: true, mensagem: 'Inscrição recebida.' };
    }
    if (Number.isFinite(extras.abertoEm) && extras.abertoEm > 0 && Date.now() - extras.abertoEm < 8000) {
      return { ok: false, mensagem: 'Confere as respostas e envia de novo, por favor.' };
    }

    const texto = (id: string) => {
      const v = respostas[id];
      return typeof v === 'string' ? v.trim().slice(0, 1200) : '';
    };

    const nome = texto('nome');
    const empresa = texto('empresa');
    const telefone = texto('telefone');
    const email = texto('email').toLowerCase();
    if (nome.length < 2) return { ok: false, mensagem: 'Faltou o seu nome.' };
    if (empresa.length < 2) return { ok: false, mensagem: 'Faltou o nome da empresa.' };
    if (!telefoneValido(telefone)) return { ok: false, mensagem: 'Informe um WhatsApp com DDD.' };
    if (!pareceEmail(email)) return { ok: false, mensagem: 'Confira o e-mail.' };

    /* Só entra o que existe na lista fechada. Valor inventado num POST
       manual não vira resposta nem ponto. */
    let pontos = 0;
    const linhas: string[] = [];
    for (const p of perguntas) {
      if (p.tipo === 'escolha') {
        const o = p.opcoes.find((x) => x.valor === texto(p.id));
        if (!o) return { ok: false, mensagem: 'Faltou responder uma pergunta.' };
        pontos += o.pontos;
        linhas.push(`${rotuloCurto(p.id)}: ${o.rotulo}.`);
      } else if (p.tipo === 'multipla') {
        const marcadas = Array.isArray(respostas[p.id]) ? (respostas[p.id] as string[]) : [];
        const ops = p.opcoes.filter((x) => marcadas.includes(x.valor));
        if (!ops.length) return { ok: false, mensagem: 'Faltou responder uma pergunta.' };
        pontos += ops.reduce((s, x) => s + x.pontos, 0);
        linhas.push(`${rotuloCurto(p.id)}: ${ops.map((x) => x.rotulo).join(', ')}.`);
      }
    }

    const nota = Math.round((pontos / NOTA_MAXIMA) * 100);
    const instagram = texto('instagram');
    const motivo = texto('motivo');
    const verba = texto('verba');

    if (!bancoConfigurado) {
      return { ok: false, mensagem: 'O formulário está fora do ar agora. Chame a equipe no WhatsApp.' };
    }

    const observacao = [
      `Nota ${nota}/100 na seleção "10 empresas" de Bragança.`,
      instagram ? `Instagram: ${instagram}.` : null,
      ...linhas,
      motivo ? `Por que merece a vaga: ${motivo}` : null,
      'Veio pela apresentação /braganca-pa/selecao.',
    ]
      .filter(Boolean)
      .join(' ');

    const supabase = clienteServico();
    const { data: leadId, error } = await supabase.rpc('registrar_lead_do_site', {
      p_nome: nome,
      p_empresa: empresa,
      p_telefone: telefone,
      p_email: email,
      /* Piso mensal da verba declarada: 35 por dia, 30 dias. */
      p_verba: verba === 'sim' || verba === 'proximo-mes' ? 1050 : null,
      p_origem: 'selecao-braganca',
      p_contexto: observacao,
    });

    if (error) {
      console.error('[inscrição bragança]', error.message);
      return { ok: false, mensagem: 'Não consegui registrar agora. Chame a equipe no WhatsApp que a gente resolve na hora.' };
    }

    /*
      A inscrição está gravada. Daqui para baixo, nada pode mudar a
      resposta que a pessoa vai ver.

      Os dois e-mails saem juntos: a confirmação para quem preencheu e o
      aviso para a agência. `enviarTodos` não levanta exceção e não
      devolve erro para cá de propósito, porque não existe decisão a
      tomar com essa informação: a inscrição não desaparece se o Resend
      estiver fora, e dizer "inscrição recebida, mas o e-mail falhou"
      seria assustar a pessoa com um problema que é da agência.

      A chave é o id do lead. `registrar_lead_do_site` devolve o MESMO
      lead quando o telefone repete em dez minutos, então clique duplo
      vira um envio só, e não dois e-mails iguais na caixa de quem
      acabou de se inscrever.
    */
    const chave = typeof leadId === 'string' ? leadId : undefined;

    await enviarTodos([
      {
        tipo: 'inscricao_recebida',
        chave,
        para: email,
        ...inscricaoRecebida({ nome, empresa }),
      },
      {
        tipo: 'aviso_inscricao',
        chave,
        para: caixaDaAgencia,
        ...avisoDeInscricao({
          nome,
          empresa,
          telefone,
          email,
          instagram: instagram || null,
          nota,
          respostas: linhas,
          motivo: motivo || null,
        }),
      },
    ]);

    return { ok: true, mensagem: 'Inscrição recebida.' };
  } catch (e) {
    console.error('[inscrição bragança]', (e as Error).message);
    return { ok: false, mensagem: 'Não consegui registrar agora. Chame a equipe no WhatsApp que a gente resolve na hora.' };
  }
}

function rotuloCurto(id: string) {
  const mapa: Record<string, string> = {
    segmento: 'Área',
    cidade: 'Cidade',
    tempo: 'Tempo de empresa',
    faturamento: 'Faturamento',
    origem: 'Clientes vêm de',
    anuncios: 'Anúncios',
    atendimento: 'Responde o WhatsApp',
    capacidade: 'Atende +30 clientes/mês',
    verba: 'Verba de R$ 35 a 50/dia',
    case: 'Autoriza case',
  };
  return mapa[id] ?? id;
}
