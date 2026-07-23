// Tailwind CSS v3 is applied through PostCSS directly. The previous
// @astrojs/tailwind integration (removed for Astro 7 compatibility) ran this
// exact pipeline — tailwindcss + autoprefixer — so the generated styling is
// functionally identical even if minifier-level CSS differs. Astro/Vite
// auto-discovers this config.
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
