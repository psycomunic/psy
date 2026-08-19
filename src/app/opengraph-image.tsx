import { ImageResponse } from 'next/og';
import { site } from '@/conteudo/site';

/*
  Imagem de compartilhamento, gerada no build.

  Ela é montada em código em vez de ser um JPEG na pasta por um motivo
  prático: título e posicionamento mudam, e um arquivo de imagem não
  muda junto. Aqui o texto vem do mesmo `site.ts` que alimenta as meta
  tags, então nunca dessincroniza.

  1200x630 é o formato que WhatsApp, LinkedIn, Facebook e X esperam.
  Abaixo disso as prévias saem cortadas ou recusadas.
*/
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = `${site.nome} · operação de crescimento para e-commerce`;

const MARINHO = '#101F3F';
const MARINHO_FUNDO = '#0B1730';
const MAGENTA = '#E4155F';
const MAGENTA_TEXTO = '#FF6B96';
const NEVE = '#E8ECF5';
const CINZA = '#93A0BC';

export default function ImagemOG() {
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
        {/* Brilho magenta, o mesmo recurso da hero do site. */}
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

        {/* Marca */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 40, fontWeight: 800, color: '#fff', letterSpacing: -1.5 }}>
            Psy
          </div>
          <div style={{ width: 2, height: 26, background: MAGENTA }} />
          <div style={{ fontSize: 19, color: CINZA, letterSpacing: 6 }}>COMUNIC</div>
        </div>

        {/* Chamada */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 21, color: MAGENTA_TEXTO, letterSpacing: 4 }}>
            OPERAÇÃO DE CRESCIMENTO PARA E-COMMERCE
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              marginTop: 22,
              fontSize: 68,
              fontWeight: 800,
              color: '#fff',
              lineHeight: 1.05,
              letterSpacing: -2.5,
            }}
          >
            <div>Sua loja não precisa de</div>
            <div>mais uma agência.</div>
            <div style={{ color: MAGENTA_TEXTO }}>Precisa de uma operação.</div>
          </div>
        </div>

        {/* Rodapé: as quatro frentes, que são a tese do site */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          {['Gestão', 'Tecnologia', 'Marketing', 'Atendimento & Logística'].map((f) => (
            <div
              key={f}
              style={{
                display: 'flex',
                fontSize: 20,
                color: NEVE,
                border: '1px solid rgba(255,255,255,0.16)',
                borderRadius: 999,
                padding: '10px 22px',
              }}
            >
              {f}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
