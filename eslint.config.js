import js from "@eslint/js";
import typescript from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";
import astro from "eslint-plugin-astro";
import globals from "globals";

export default [
  {
    ignores: ["dist/", "node_modules/", ".astro/", ".conductor/", ".context/"],
  },

  js.configs.recommended,

  // These presets are arrays in flat-config mode. Spreading the arrays is
  // important: reading `.rules` from `astro.configs.recommended` silently
  // enabled zero Astro rules in the previous configuration.
  ...astro.configs["flat/recommended"],
  ...astro.configs["flat/jsx-a11y-recommended"],

  {
    files: ["**/*.{js,mjs,cjs,ts,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: globals.node,
    },
    plugins: {
      "@typescript-eslint": typescript,
    },
    rules: {
      ...typescript.configs.recommended.rules,
      semi: ["error", "always"],
      quotes: ["error", "double", { allowTemplateLiterals: true }],
      "@typescript-eslint/triple-slash-reference": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "no-unused-vars": "off",
      "@typescript-eslint/no-require-imports": "off",
    },
  },

  // TypeScript catches undefined names itself. Keep ESLint's no-undef active
  // for JavaScript, which is not covered by the TypeScript compiler.
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "no-undef": "off",
    },
  },

  {
    files: ["**/*.astro"],
    rules: {
      "no-undef": "off",
    },
  },
];
