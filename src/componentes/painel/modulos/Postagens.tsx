import { listarPostagens, listarEquipe } from '@/lib/dados/consultas';
import { Kpi, Secao, AvisoProcedencia } from '../base';
import { ListaPostagens } from '../ListaPostagens';
import { PERFIS_SOCIAIS, SITUACOES_POST_ABERTAS, rotuloPerfilSocial } from '@/lib/dados/tipos';
import { pode, type Papel } from '@/lib/papeis';
import { hojeBR } from '@/lib/datas';

/* ================================================================== */
/* Postagens: o calendário de conteúdo                                 */
/* ================================================================== */

/** "2026-10". Mês inválido na URL cai no atual, em vez de quebrar. */
export function mesDaUrl(v: string | undefined): string {
  if (v && /^\d{4}-(0[1-9]|1[0-2])$/.test(v)) return v;
  return hojeBR().slice(0, 7);
}

/**
 * O módulo de postagens.
 *
 * ============================================================
 * UM MÊS POR VEZ
 * ============================================================
 * Calendário de conteúdo cresce para sempre. O recorte é o mês, com
 * setas para andar, e as postagens SEM DATA aparecem em qualquer mês:
 * são as ideias, e ideia que só existe no mês em que foi digitada é
 * ideia perdida.
 *
 * ============================================================
 * OS NÚMEROS SEPARAM OS DOIS PERFIS
 * ============================================================
 * Porque são duas vozes, e o trabalho de uma não compensa o da outra.
 * Um total somado diria "oito postagens este mês" com sete de um perfil
 * e uma do outro, e a semana pareceria resolvida.
 */
export async function Postagens({ papel, mes }: { papel: Papel; mes: string }) {
  const [{ dados: postagens, procedencia }, { dados: equipe }] = await Promise.all([
    listarPostagens(mes),
    listarEquipe(),
  ]);

  const podeEditar = pode(papel, 'postagens', 'editar') && procedencia === 'banco';
  const podeExcluir = pode(papel, 'postagens', 'excluir') && procedencia === 'banco';

  /* Só as COM data contam para o mês. As sem data vêm na lista para não
     sumirem, mas somá-las aqui faria o número do mês crescer com ideia
     que ainda não tem dia. */
  const doMes = postagens.filter((p) => p.data !== null);
  const naMao = postagens.filter((p) => SITUACOES_POST_ABERTAS.includes(p.situacao));
  const semData = postagens.filter((p) => p.data === null);

  return (
    <>
      <AvisoProcedencia procedencia={procedencia} />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PERFIS_SOCIAIS.map((perfil) => {
          const n = doMes.filter((p) => p.perfil === perfil);
          const publicadas = n.filter((p) => p.situacao === 'publicado').length;
          return (
            <Kpi
              key={perfil}
              rotulo={rotuloPerfilSocial[perfil]}
              valor={String(n.length)}
              apoio={`no mês · ${publicadas} ${publicadas === 1 ? 'publicada' : 'publicadas'}`}
            />
          );
        })}
        <Kpi
          rotulo="Dando trabalho"
          valor={String(naMao.length)}
          apoio="Da ideia ao pronto, ainda na sua mão"
        />
        <Kpi
          rotulo="Sem data"
          valor={String(semData.length)}
          apoio="Ideias esperando um dia no calendário"
        />
      </div>

      <Secao
        titulo="O mês"
        apoio="Agrupadas por dia. A situação se muda no próprio cartão, e os arquivos sobem direto para o armazenamento."
      >
        <ListaPostagens
          postagens={postagens}
          mes={mes}
          podeEditar={podeEditar}
          podeExcluir={podeExcluir}
          equipe={equipe.filter((e) => e.ativo).map((e) => ({ id: e.id, nome: e.nome }))}
        />
      </Secao>
    </>
  );
}
