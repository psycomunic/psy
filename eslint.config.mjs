import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",

    /*
      A landing page antiga é um ARTEFATO PRESERVADO, e não código que
      mantemos. Ela foi movida inteira, sem uma linha alterada, e o
      CLAUDE.md proíbe convertê-la sem pedido explícito.

      Lintá-la produz aviso sobre código que ninguém vai tocar, e pior:
      convida alguém a "arrumar" e quebrar um efeito que depende de
      detalhe sutil. Ver as armadilhas de CSS no CLAUDE.md.
    */
    "public/paginas-que-vendem/**",
  ]),

  {
    rules: {
      /*
        Underscore quer dizer "não uso, e é de propósito".

        Server Action tem assinatura fixa: `(estadoAnterior, formData)`.
        Uma ação que não precisa do estado anterior — faturar o mês
        inteiro, conferir todas as cobranças — ainda tem de declarar o
        primeiro parâmetro, e a regra padrão reclamava dele.

        As opções eram pior: comentário de `eslint-disable` espalhado, ou
        inventar uso para um argumento que não serve. O prefixo já é a
        convenção do repositório inteiro (`_anterior` em toda ação); isto
        só faz o lint concordar com ela.
      */
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
]);

export default eslintConfig;
