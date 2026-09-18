import { ImageResponse } from 'next/og';
import { site } from '@/conteudo/site';
import { braganca as u } from '@/conteudo/braganca';

/*
  Imagem de compartilhamento da unidade de Bragança.

  A global do site fala de e-commerce e mostra "sua loja não precisa de
  mais uma agência", que é a conversa errada aqui: quem recebe este link
  no WhatsApp tem uma clínica ou uma pousada, não uma loja virtual.

  A imagem é montada em código, como a do site, e lê o mesmo arquivo de
  conteúdo da página. Título e cidades nunca saem de sincronia com o que
  está escrito na tela.

  Sem foto da cidade: não existe imagem de Bragança no repositório, e
  pegar uma de banco de imagem para fingir localidade é o tipo de coisa
  que se descobre na primeira busca reversa. A região aparece pelo nome,
  que é o que importa em prévia de link.

  1200x630 é o que WhatsApp, Facebook e LinkedIn esperam.
*/
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = `${site.nome} em ${u.cidade}, ${u.estado}`;

const MARINHO = '#101F3F';
const MARINHO_FUNDO = '#0B1730';
const MAGENTA = '#E4155F';
const MAGENTA_TEXTO = '#FF6B96';
const NEVE = '#E8ECF5';
const CINZA = '#93A0BC';

export default function ImagemOG() {
  /* Seis cidades, e não as dezessete: em 1200px de largura a lista
     inteira vira uma linha de texto ilegível na prévia do WhatsApp. */
  const vizinhas = u.cidades.slice(1, 7);

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
          padding: '60px 72px',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -280,
            right: -200,
            width: 760,
            height: 760,
            borderRadius: 9999,
            background: `radial-gradient(circle, ${MAGENTA}66 0%, transparent 70%)`,
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 38, fontWeight: 800, color: '#fff', letterSpacing: -1.5 }}>
            Psy
          </div>
          <div style={{ width: 2, height: 25, background: MAGENTA }} />
          <div style={{ fontSize: 18, color: CINZA, letterSpacing: 6 }}>COMUNIC</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 2, background: MAGENTA }} />
            {/* Uma string so, e nao expressao + virgula + expressao: o
                Satori conta cada pedaco como um filho e exige display
                declarado a partir de dois. */}
            <div style={{ fontSize: 21, color: MAGENTA_TEXTO, letterSpacing: 4 }}>
              {`${u.cidade.toUpperCase()}, ${u.estado}`}
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              marginTop: 20,
              fontSize: 62,
              fontWeight: 800,
              color: '#fff',
              lineHeight: 1.06,
              letterSpacing: -2.4,
            }}
          >
            <div>Marketing digital para sua</div>
            {/* `display: flex` obrigatorio: o Satori, que desenha esta
                imagem, recusa div com mais de um filho sem display
                declarado. Texto solto ao lado de um span ja conta como
                dois, e o build quebra na geracao. */}
            <div style={{ display: 'flex', gap: 16 }}>
              <span>empresa ter</span>
              <span style={{ color: MAGENTA_TEXTO }}>mais clientes.</span>
            </div>
          </div>
          <div style={{ display: 'flex', marginTop: 20, fontSize: 25, color: NEVE }}>
            Anúncios no Instagram e no Google, e criação de sites
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {vizinhas.map((c) => (
              <div
                key={c}
                style={{
                  display: 'flex',
                  fontSize: 18,
                  color: CINZA,
                  border: '1px solid rgba(255,255,255,0.16)',
                  borderRadius: 999,
                  padding: '8px 18px',
                }}
              >
                {c}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', fontSize: 22, color: NEVE }}>{u.telefoneVisivel}</div>
        </div>
      </div>
    ),
    size,
  );
}
