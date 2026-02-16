import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  future: { compatibilityVersion: 4 },

  modules: [
    '@pinia/nuxt',
  ],

  css: ['~/assets/css/main.css'],

  app: {
    head: {
      title: 'MusicPractice',
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap' }
      ]
    }
  },

  nitro: {
    experimental: { database: true }
  },

  vite: {
    plugins: [
      tailwindcss(),
    ],
    optimizeDeps: {
      include: ['tone'],
      exclude: ['@coderline/alphatab']
    }
  },

  typescript: { strict: true }
})
