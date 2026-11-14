import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@pinia/nuxt', '@pinia-orm/nuxt'],
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [tailwindcss()],
  },
  devServer: {
    host: 'localhost',
    port: 3000,
  },
  runtimeConfig: {
    public: {
      // Overridden at runtime by NUXT_PUBLIC_API_BASE.
      apiBase: 'http://localhost:8000',
      // The public address encoded in QR codes, e.g. https://menule.mevlutcandag.com (NUXT_PUBLIC_SITE_URL).
      // Empty: the address the owner opened the panel from.
      siteUrl: '',
    },
  },
  app: {
    head: {
      htmlAttrs: { lang: 'tr' },
      title: 'Menüle',
      meta: [
        { name: 'color-scheme', content: 'light' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        // Fonts are loaded where they're used: Archivo in layouts/default.vue (owner app),
        // each public theme's own font in its component.
      ],
    },
  },
})
