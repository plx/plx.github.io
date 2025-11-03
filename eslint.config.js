import js from "@eslint/js";
import typescript from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";
import astro from "eslint-plugin-astro";
import astroParser from "astro-eslint-parser";

export default [
  // Base JavaScript configuration
  js.configs.recommended,
  
  // Global ignores
  {
    ignores: ["dist/", "node_modules/", ".astro/", ".conductor/"]
  },

  // JavaScript and TypeScript files
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
      globals: {
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        exports: "writable",
        module: "writable",
        require: "readonly",
        global: "readonly",
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        fetch: "readonly",
        URL: "readonly",
      }
    },
    plugins: {
      "@typescript-eslint": typescript,
    },
    rules: {
      ...typescript.configs.recommended.rules,
      semi: ["error", "always"],
      quotes: ["error", "double", { "allowTemplateLiterals": true }],
      "@typescript-eslint/triple-slash-reference": "off",
      "@typescript-eslint/no-unused-vars": ["error", { 
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_"
      }],
      "no-unused-vars": "off", // Handled by @typescript-eslint/no-unused-vars
      "no-undef": "off", // TypeScript handles this
      "@typescript-eslint/no-require-imports": "off", // Allow require in config files
    },
  },

  // Astro files
  {
    files: ["**/*.astro"],
    plugins: {
      astro: astro,
    },
    languageOptions: {
      parser: astroParser,
      parserOptions: {
        parser: typescriptParser,
        extraFileExtensions: [".astro"],
      },
      globals: {
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        exports: "writable",
        module: "writable",
        require: "readonly",
        global: "readonly",
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        fetch: "readonly",
        URL: "readonly",
        Astro: "readonly",
      }
    },
    rules: {
      ...astro.configs.recommended.rules,
      ...astro.configs["jsx-a11y-strict"].rules,
      "no-undef": "off", // TypeScript handles this
    },
  },
];