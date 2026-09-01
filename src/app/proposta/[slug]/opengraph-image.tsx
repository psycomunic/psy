import { ImageResponse } from 'next/og';
import { buscarPropostaExibida } from '@/dados/propostas';

/**
 * A imagem que aparece quando o link da proposta é colado no WhatsApp.
 *
 * ============================================================
 * POR QUE ELA PRECISA SER PRÓPRIA
 * ============================================================
 * Sem isto, a prévia caía na imagem da home: "Sua loja não precisa de
 * mais uma agência". Quem recebia via um anúncio institucional no lugar
 * do documento que acabaram de mandar para ela, e a primeira impressão
 * do link era de mensagem em massa.
 *
 * Aqui vai o nome de quem recebe. É a diferença entre "olha o site da
 * agência" e "isto foi feito para você".
 *
 * ============================================================
 * O QUE NÃO ENTRA
 * ============================================================
 * Preço nenhum. A prévia aparece na lista de conversas, e no
 * encaminhamento para um grupo. O valor está DENTRO da proposta, que é
 * onde ele tem contexto, e não numa miniatura que qualquer um vê por
 * cima do ombro.
 *
 * Rascunho também não: `buscarPropostaExibida` só devolve o que já foi
 * publicado. Link de rascunho cai na imagem genérica, que é o certo,
 * porque a página em si responde 404.
 */

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Proposta comercial da Psy Comunic';

const MARINHO = '#101F3F';
const MARINHO_FUNDO = '#0B1730';
const MAGENTA = '#E4155F';
const MAGENTA_TEXTO = '#FF6B96';
const NEVE = '#E8ECF5';
const CINZA = '#93A0BC';

export default async function ImagemDaProposta({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = await buscarPropostaExibida(slug);

  const cliente = p?.cliente ?? 'Proposta comercial';

  /* Nome comprido quebra o layout em vez de encolher a fonte. Dois
     tamanhos resolvem os casos reais: "DMC" e "Carol Abreu Advocacia
     e Cursos Online". */
  const tamanho = cliente.length > 28 ? 58 : cliente.length > 18 ? 72 : 88;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: `linear-gradient(140deg, ${MARINHO} 0%, ${MARINHO_FUNDO} 100%)`,
          padding: '64px 72px',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -260,
            right: -180,
            width: 720,
            height: 720,
            borderRadius: 9999,
            background: `radial-gradient(circle, ${MAGENTA}66 0%, transparent 70%)`,
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 40, fontWeight: 800, color: '#fff', letterSpacing: -1.5 }}>
            Psy
          </div>
          <div style={{ width: 2, height: 26, background: MAGENTA }} />
          <div style={{ fontSize: 19, color: CINZA, letterSpacing: 6 }}>COMUNIC</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 21, color: MAGENTA_TEXTO, letterSpacing: 4 }}>
            PROPOSTA COMERCIAL
          </div>
          <div
            style={{
              display: 'flex',
              marginTop: 22,
              fontSize: tamanho,
              fontWeight: 800,
              color: '#fff',
              lineHeight: 1.05,
              letterSpacing: -2.5,
            }}
          >
            {cliente}
          </div>
          {p?.contato ? (
            <div style={{ display: 'flex', marginTop: 20, fontSize: 26, color: NEVE }}>
              Aos cuidados de {p.contato}
            </div>
          ) : null}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div
            style={{
              display: 'flex',
              fontSize: 20,
              color: NEVE,
              border: '1px solid rgba(255,255,255,0.16)',
              borderRadius: 999,
              padding: '10px 22px',
            }}
          >
            Documento privado
          </div>
          <div style={{ display: 'flex', fontSize: 20, color: CINZA }}>
            psycomunic.com.br
          </div>
        </div>
      </div>
    ),
    size,
  );
}
