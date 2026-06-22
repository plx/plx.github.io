import defaultTheme from "tailwindcss/defaultTheme";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}",
  ],
  theme: {
    extend: {
      // Twilight semantic tokens (defined in src/styles/tokens.css).
      // These are backed by CSS variables that flip in `html.dark`, so
      // utilities like `bg-bg` / `text-fg` / `border-border` auto-theme
      // and we can drop almost all `dark:` color variants.
      //
      // NOTE: every token except `accent` bakes its own alpha, so
      // opacity modifiers (`text-fg/50`) do NOT work on them — use the
      // whole token. `accent` is published in channel-triplet form so
      // `text-accent`, `ring-accent`, `bg-accent/10`, etc. all work.
      colors: {
        bg: "var(--bg)",
        "bg-elevated": "var(--bg-elevated)",
        "bg-hover": "var(--bg-hover)",
        frost: "var(--bg-frost)",
        fg: "var(--fg)",
        "fg-strong": "var(--fg-strong)",
        muted: "var(--fg-muted)",
        border: "var(--border)",
        "border-hover": "var(--border-hover)",
        decoration: "var(--decoration)",
        "decoration-hover": "var(--decoration-hover)",
        accent: "rgb(var(--accent-rgb) / <alpha-value>)",
        "accent-soft": "var(--accent-soft)",
      },
      borderColor: {
        DEFAULT: "var(--border)",
      },
      fontFamily: {
        sans: ["Inter", ...defaultTheme.fontFamily.sans],
        serif: ["Source Serif 4", ...defaultTheme.fontFamily.serif],
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        DEFAULT: "var(--radius)",
        lg: "var(--radius-lg)",
        full: "var(--radius-full)",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
