// Tailwind CSS v3 is applied through PostCSS directly. The previous
// @astrojs/tailwind integration (removed for Astro 7 compatibility) ran this
// exact pipeline — tailwindcss + autoprefixer — so the generated CSS is
// byte-for-byte identical. Astro/Vite auto-discovers this config.
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
