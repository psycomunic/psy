import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { diagnosticarCriativos } from './diagnostico-criativos.ts';
import type { CriativoResumo } from '../dados/tipos.ts';

function baseCriativo(parcial: Partial<CriativoResumo> & { id: string; nome: string }): CriativoResumo {
  return {
    campanhaId: 'c1',
    campanhaNome: '[PSY][MENSAGEM]',
    conjuntoNome: 'Público Aberto',
    objetivo: 'mensagens',
    status: 'ativo',
    statusDetalhe: 'Rodando agora',
    formato: 'video',
    miniaturaUrl: 'https://scontent.xx.fbcdn.net/thumb.jpg',
    imagemUrl: null,
    titulo: null,
    corpo: null,
    investimento: 100,
    impressoes: 5000,
    alcance: 3500,
    cliquesLink: 60,
    ctr: 1.2,
    visitasPagina: 0,
    conversas: 15,
    leadsCaptados: 0,
    comprasAtribuidas: 0,
    receitaAtribuida: 0,
    engajamentos: 80,
    visualizacoesVideo: 1200,
    ...parcial,
  };
}

describe('Diagnóstico e ranking de criativos', () => {
  test('identifica criativo campeão, problema de gancho (CTR baixo) e problema pós-clique (CTR alto sem conversa)', () => {
    const lista: CriativoResumo[] = [
      baseCriativo({
        id: 'ad-campeao',
        nome: 'AD01 - Tour Chalé Hidro',
        investimento: 200,
        impressoes: 12000,
        alcance: 9000,
        cliquesLink: 216,
        ctr: 1.8,
        conversas: 40, // R$ 5,00/conversa
      }),
      baseCriativo({
        id: 'ad-gancho-fraco',
        nome: 'AD02 - Foto Estática Geral',
        formato: 'imagem',
        investimento: 150,
        impressoes: 10000,
        alcance: 8000,
        cliquesLink: 35,
        ctr: 0.35, // CTR muito abaixo da média
        conversas: 6, // R$ 25,00/conversa
      }),
      baseCriativo({
        id: 'ad-conversao-fraca',
        nome: 'AD03 - Vídeo Curiosidade',
        investimento: 160,
        impressoes: 8000,
        alcance: 6500,
        cliquesLink: 160,
        ctr: 2.0, // ótimo CTR, mas quase ninguém inicia conversa
        conversas: 5, // R$ 32,00/conversa
      }),
    ];

    const res = diagnosticarCriativos(lista, { tetoCustoResultado: 10 });

    assert.equal(res.campeaoId, 'ad-campeao');
    assert.equal(res.avaliacoes['ad-campeao'].classificacao, 'campeao');
    assert.equal(res.avaliacoes['ad-gancho-fraco'].classificacao, 'ajustar_gancho');
    assert.equal(res.avaliacoes['ad-conversao-fraca'].classificacao, 'ajustar_conversao');
    assert.ok(res.avaliacoes['ad-campeao'].nota > res.avaliacoes['ad-gancho-fraco'].nota);
    assert.ok(res.destaques.length >= 2);
  });

  test('detecta fadiga de público quando frequência passa de 2,85x com perda de eficiência', () => {
    const lista: CriativoResumo[] = [
      baseCriativo({
        id: 'ad-bom',
        nome: 'AD Novo',
        investimento: 120,
        impressoes: 6000,
        alcance: 5000, // freq 1.2x
        conversas: 24, // R$ 5,00
      }),
      baseCriativo({
        id: 'ad-cansado',
        nome: 'AD Antigo Saturado',
        investimento: 180,
        impressoes: 9600,
        alcance: 3000, // freq 3.2x
        ctr: 0.7,
        conversas: 9, // R$ 20,00
      }),
    ];

    const res = diagnosticarCriativos(lista);
    assert.equal(res.avaliacoes['ad-cansado'].classificacao, 'saturando');
    assert.match(res.avaliacoes['ad-cansado'].sugestao, /3 primeiros segundos|variação/i);
  });

  test('protege anúncio recém-publicado em fase de aprendizado', () => {
    const lista: CriativoResumo[] = [
      baseCriativo({
        id: 'ad-rodando',
        nome: 'AD Consolidado',
        investimento: 300,
        impressoes: 15000,
        conversas: 50,
      }),
      baseCriativo({
        id: 'ad-novo',
        nome: 'AD Subiu Hoje',
        investimento: 6,
        impressoes: 220,
        alcance: 200,
        cliquesLink: 3,
        ctr: 1.36,
        conversas: 0,
      }),
    ];

    const res = diagnosticarCriativos(lista);
    assert.equal(res.avaliacoes['ad-novo'].classificacao, 'aprendizado');
  });
});
