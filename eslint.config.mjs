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
]);

export default eslintConfig;
