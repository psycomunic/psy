import Script from 'next/script';
import { site } from '@/conteudo/site';

/**
 * Google Analytics 4.
 *
 * ============================================================
 * O ID NÃO É SEGREDO, E POR ISSO ESTÁ NO CÓDIGO
 * ============================================================
 * A regra do projeto é que segredo fica no servidor. Um ID de medição
 * do GA4 não é segredo: ele sai no HTML de toda página, é visível em
 * "ver código-fonte" e serve só para dizer em qual propriedade os
 * eventos caem. Guardá-lo em variável de ambiente daria a ilusão de
 * proteção e uma configuração a mais para esquecer no deploy.
 *
 * ============================================================
 * `afterInteractive`, E NÃO `beforeInteractive`
 * ============================================================
 * Analytics não pode disputar a primeira pintura com o conteúdo. Com
 * `beforeInteractive` o script do Google entra antes do que a pessoa
 * veio ler, e o LCP paga por isso. Aqui ele entra depois da página
 * ficar utilizável, que é cedo o bastante para contar a visita.
 *
 * ============================================================
 * A POLÍTICA DE PRIVACIDADE FOI ATUALIZADA JUNTO
 * ============================================================
 * Ela afirmava, com todas as letras, que o site não usava rastreamento
 * de terceiros. Ligar o GA4 sem mexer nela deixaria uma afirmação falsa
 * publicada. A seção de Cookies foi reescrita no mesmo commit.
 *
 * Falta o aviso de consentimento na primeira visita, que a própria
 * política prometia. Ele é decisão de quem responde pela empresa, não
 * minha: mexe em todas as páginas e é escolha jurídica.
 */
export function Analytics() {
  if (!site.analytics.ga4) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${site.analytics.ga4}`}
        strategy="afterInteractive"
      />
      <Script id="ga4" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${site.analytics.ga4}');`}
      </Script>
    </>
  );
}
