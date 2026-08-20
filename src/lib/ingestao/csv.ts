/**
 * Leitura de planilha de métrica.
 *
 * Enquanto as APIs não estão ligadas, é por aqui que o dado entra — e
 * mesmo depois vai continuar existindo, porque sempre há uma loja numa
 * plataforma sem API decente.
 *
 * Duas decisões guiam o arquivo inteiro:
 *
 * PRIMEIRA: nada é descartado em silêncio. Linha que não dá para ler
 * volta como erro com o número da linha. Planilha que importa "quase
 * tudo" produz um mês com receita menor do que a real, e ninguém
 * descobre olhando o gráfico.
 *
 * SEGUNDA: o formato é o brasileiro de verdade, não o ideal. Excel em
 * português exporta com ponto e vírgula, número com vírgula decimal e
 * data em dd/mm/aaaa. Exigir ISO e vírgula seria empurrar a conversão
 * para a pessoa, que é exatamente onde ela erra.
 */

import { paraNumero } from '../numero.ts';

export const PROVEDORES = [
  'planilha_loja',
  'planilha_midia',
  'planilha_sessao',
] as const;
export type ProvedorPlanilha = (typeof PROVEDORES)[number];

export const rotuloProvedor: Record<ProvedorPlanilha, string> = {
  planilha_loja: 'Loja: pedidos e receita',
  planilha_midia: 'Mídia: verba, cliques e atribuição',
  planilha_sessao: 'Analytics: sessões',
};

/** Uma linha pronta para `registrar_metricas`. */
export type LinhaMetrica = {
  dia: string;
  canal?: string;
  sessoes?: number;
  pedidos_captados?: number;
  pedidos_aprovados?: number;
  receita?: number;
  receita_bruta?: number;
  /** Parcela de frete JÁ CONTIDA em `receita`. Não somar as duas. */
  frete?: number;
  novos_clientes?: number;
  investimento?: number;
  cliques?: number;
  impressoes?: number;
  receita_atribuida?: number;
};

export type ErroLinha = { linha: number; motivo: string };

export type Leitura = {
  linhas: LinhaMetrica[];
  erros: ErroLinha[];
  /** Cabeçalhos que a planilha trouxe e o sistema não conhece. */
  ignoradas: string[];
};

/* ------------------------------------------------------------------ */
/* Cabeçalhos                                                          */
/* ------------------------------------------------------------------ */

/** Tira acento, espaço e maiúscula: "Receita Aprovada" e "receita_aprovada"
    são a mesma coluna, e discutir isso com quem monta a planilha é perder
    tempo dos dois lados. */
export function normalizar(cabecalho: string): string {
  return cabecalho
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toLowerCase()
    .replace(/[\s.-]+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

const APELIDOS: Record<string, keyof LinhaMetrica> = {
  dia: 'dia', data: 'dia', date: 'dia', day: 'dia',

  canal: 'canal', origem: 'canal', fonte: 'canal', source: 'canal',
  plataforma: 'canal', midia: 'canal',

  sessoes: 'sessoes', sessions: 'sessoes', visitas: 'sessoes',
  acessos: 'sessoes', usuarios: 'sessoes',

  pedidos: 'pedidos_captados',
  pedidos_captados: 'pedidos_captados',
  pedidos_gerados: 'pedidos_captados',
  pedidos_criados: 'pedidos_captados',
  orders: 'pedidos_captados',

  pedidos_aprovados: 'pedidos_aprovados',
  pedidos_pagos: 'pedidos_aprovados',
  aprovados: 'pedidos_aprovados',
  pedidos_faturados: 'pedidos_aprovados',

  receita: 'receita', faturamento: 'receita', revenue: 'receita',
  receita_aprovada: 'receita', faturamento_aprovado: 'receita',
  valor_aprovado: 'receita',

  receita_bruta: 'receita_bruta', faturamento_bruto: 'receita_bruta',
  receita_captada: 'receita_bruta',

  frete: 'frete', valor_frete: 'frete', frete_total: 'frete', shipping: 'frete',

  novos_clientes: 'novos_clientes', clientes_novos: 'novos_clientes',
  new_customers: 'novos_clientes', primeira_compra: 'novos_clientes',

  investimento: 'investimento', verba: 'investimento', custo: 'investimento',
  cost: 'investimento', spend: 'investimento', valor_gasto: 'investimento',
  valor_investido: 'investimento',

  cliques: 'cliques', clicks: 'cliques',
  impressoes: 'impressoes', impressions: 'impressoes',

  receita_atribuida: 'receita_atribuida',
  valor_conversao: 'receita_atribuida',
  conv_value: 'receita_atribuida',
  conversion_value: 'receita_atribuida',
  valor_de_conversao: 'receita_atribuida',
};

/* Só as chaves de valor. Um `keyof LinhaMetrica` aqui deixaria `dia`
   entrar na soma de `agrupar`, e somar duas datas não é erro que o
   TypeScript pegue sozinho. */
type ChaveValor = Exclude<keyof LinhaMetrica, 'dia' | 'canal'>;

const NUMERICAS: ChaveValor[] = [
  'sessoes', 'pedidos_captados', 'pedidos_aprovados', 'receita',
  'receita_bruta', 'frete', 'novos_clientes', 'investimento', 'cliques',
  'impressoes', 'receita_atribuida',
];

const INTEIRAS = new Set<ChaveValor>([
  'sessoes', 'pedidos_captados', 'pedidos_aprovados', 'novos_clientes',
  'cliques', 'impressoes',
]);

/* ------------------------------------------------------------------ */
/* Separador, linhas e campos                                          */
/* ------------------------------------------------------------------ */

/** Excel em português exporta com ponto e vírgula. Chutar vírgula
    transformaria a planilha inteira numa coluna só. */
export function separadorDe(primeiraLinha: string): string {
  const ponteVirgula = (primeiraLinha.match(/;/g) ?? []).length;
  const virgula = (primeiraLinha.match(/,/g) ?? []).length;
  const tab = (primeiraLinha.match(/\t/g) ?? []).length;
  if (tab > ponteVirgula && tab > virgula) return '\t';
  return ponteVirgula >= virgula ? ';' : ',';
}

/**
 * Divide uma linha respeitando aspas.
 *
 * `split(sep)` quebraria "Loja, matriz" em duas colunas e deslocaria
 * todas as seguintes — o tipo de erro que só aparece na coluna errada,
 * três colunas adiante.
 */
export function partirLinha(linha: string, sep: string): string[] {
  const campos: string[] = [];
  let atual = '';
  let dentroDeAspas = false;

  for (let i = 0; i < linha.length; i++) {
    const ch = linha[i];

    if (ch === '"') {
      /* Aspas duplas dentro de campo entre aspas são uma aspa literal. */
      if (dentroDeAspas && linha[i + 1] === '"') {
        atual += '"';
        i++;
      } else {
        dentroDeAspas = !dentroDeAspas;
      }
      continue;
    }

    if (ch === sep && !dentroDeAspas) {
      campos.push(atual.trim());
      atual = '';
      continue;
    }

    atual += ch;
  }

  campos.push(atual.trim());
  return campos;
}

/* ------------------------------------------------------------------ */
/* Data                                                                */
/* ------------------------------------------------------------------ */

/**
 * Converte para `aaaa-mm-dd`, ou devolve null.
 *
 * Aceita `dd/mm/aaaa` e `aaaa-mm-dd`. Não aceita `mm/dd/aaaa`: sem saber
 * a origem do arquivo, 03/04 é ambíguo, e adivinhar erra em dois terços
 * dos dias do ano de um jeito que ninguém percebe.
 */
export function paraDia(valor: string): string | null {
  const v = valor.trim();

  const iso = v.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return diaValido(+iso[1], +iso[2], +iso[3]);

  const br = v.match(/^(\d{1,2})[/](\d{1,2})[/](\d{4})$/);
  if (br) return diaValido(+br[3], +br[2], +br[1]);

  return null;
}

function diaValido(a: number, m: number, d: number): string | null {
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  const dt = new Date(Date.UTC(a, m - 1, d));
  /* 31/02 vira 03/03 no Date. Comparar de volta é o que pega. */
  if (dt.getUTCFullYear() !== a || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) {
    return null;
  }
  return `${a}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/* ------------------------------------------------------------------ */
/* A leitura                                                           */
/* ------------------------------------------------------------------ */

export function lerPlanilha(texto: string, provedor: ProvedorPlanilha): Leitura {
  const erros: ErroLinha[] = [];
  const linhas: LinhaMetrica[] = [];

  /* O BOM do Excel gruda no primeiro cabeçalho e transforma "dia" num
     "dia" com um caractere invisível na frente, que não casa com
     apelido nenhum. Comparado por código, e não escrito no arquivo:
     caractere invisível em código-fonte some no primeiro copiar e colar. */
  const semBom = texto.charCodeAt(0) === 0xfeff ? texto.slice(1) : texto;
  const limpo = semBom.replace(/\r\n?/g, '\n');
  const cruas = limpo.split('\n');

  const iCabecalho = cruas.findIndex((l) => l.trim() !== '');
  if (iCabecalho === -1) {
    return { linhas: [], erros: [{ linha: 0, motivo: 'Arquivo vazio.' }], ignoradas: [] };
  }

  const sep = separadorDe(cruas[iCabecalho]);
  const cabecalhos = partirLinha(cruas[iCabecalho], sep).map(normalizar);

  const campos = cabecalhos.map((h) => APELIDOS[h] ?? null);
  const ignoradas = cabecalhos.filter((h, i) => h !== '' && campos[i] === null);

  if (!campos.includes('dia')) {
    return {
      linhas: [],
      erros: [{
        linha: iCabecalho + 1,
        motivo: 'Nenhuma coluna de data. A planilha precisa de uma coluna "dia" ou "data".',
      }],
      ignoradas,
    };
  }

  const temAlgumValor = campos.some((c) => c !== null && c !== 'dia' && c !== 'canal');
  if (!temAlgumValor) {
    return {
      linhas: [],
      erros: [{
        linha: iCabecalho + 1,
        motivo: 'Nenhuma coluna de valor reconhecida. Confira os nomes das colunas.',
      }],
      ignoradas,
    };
  }

  for (let i = iCabecalho + 1; i < cruas.length; i++) {
    const bruta = cruas[i];
    if (bruta.trim() === '') continue;

    const nLinha = i + 1;
    const valores = partirLinha(bruta, sep);
    const linha: LinhaMetrica = { dia: '' };
    let falhou = false;

    for (let j = 0; j < campos.length; j++) {
      const campo = campos[j];
      if (!campo) continue;

      const bruto = (valores[j] ?? '').trim();

      if (campo === 'dia') {
        const dia = paraDia(bruto);
        if (!dia) {
          erros.push({
            linha: nLinha,
            motivo: `Data inválida: "${bruto}". Use dd/mm/aaaa ou aaaa-mm-dd.`,
          });
          falhou = true;
          break;
        }
        linha.dia = dia;
        continue;
      }

      if (campo === 'canal') {
        if (bruto !== '') linha.canal = normalizar(bruto);
        continue;
      }

      if (bruto === '') continue;

      const n = paraNumero(bruto);
      if (!Number.isFinite(n)) {
        erros.push({ linha: nLinha, motivo: `"${bruto}" não é número na coluna ${cabecalhos[j]}.` });
        falhou = true;
        break;
      }
      if (n < 0) {
        erros.push({ linha: nLinha, motivo: `Valor negativo em ${cabecalhos[j]}: ${bruto}.` });
        falhou = true;
        break;
      }

      linha[campo as ChaveValor] =
        INTEIRAS.has(campo as ChaveValor) ? Math.round(n) : Number(n.toFixed(2));
    }

    if (falhou) continue;

    /* Mídia sem canal não responde a única pergunta que a tabela de
       canal existe para responder: onde a verba foi. */
    if (provedor === 'planilha_midia' && !linha.canal) {
      erros.push({
        linha: nLinha,
        motivo: 'Planilha de mídia sem coluna "canal". Cada linha precisa dizer google, meta e assim por diante.',
      });
      continue;
    }

    const temValor = NUMERICAS.some((k) => linha[k] !== undefined);
    if (!temValor) {
      erros.push({ linha: nLinha, motivo: 'Linha sem nenhum valor preenchido.' });
      continue;
    }

    linhas.push(linha);
  }

  return { linhas, erros, ignoradas };
}

/**
 * Junta linhas do mesmo dia e canal.
 *
 * Exportação por campanha traz várias linhas para o mesmo dia. Mandar
 * como estão faria a segunda sobrescrever a primeira no `on conflict`, e
 * o dia terminaria com a verba de uma campanha só.
 */
export function agrupar(linhas: LinhaMetrica[]): LinhaMetrica[] {
  const mapa = new Map<string, LinhaMetrica>();

  for (const l of linhas) {
    const chave = `${l.dia}|${l.canal ?? ''}`;
    const atual = mapa.get(chave);

    if (!atual) {
      mapa.set(chave, { ...l });
      continue;
    }

    for (const k of NUMERICAS) {
      const v = l[k];
      if (v === undefined) continue;
      atual[k] = Number(((atual[k] ?? 0) + v).toFixed(2));
    }
  }

  return [...mapa.values()].sort((a, b) => a.dia.localeCompare(b.dia));
}
