import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  ssr: false,
  future: { compatibilityVersion: 4 },
  compatibilityDate: '2025-10-06',
  devtools: { enabled: false },
  modules: ['@pinia/nuxt'],

  vite: {
    plugins: [tailwindcss()]
  },

  app: {
    head: {
      title: 'RideGo — Move freely. Ride easily.',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Book rides instantly with RideGo — safe, affordable, and fast.' }
      ],
      link: [
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap'
        }
      ],
      script: [{ src: '/growise.js' }]
    }
  },

  css: ['~/assets/css/ridego.css'],

  runtimeConfig: {
    public: {
      growiseApiKey: process.env.NUXT_PUBLIC_GROWISE_API_KEY || '',
      growiseEndpoint: process.env.NUXT_PUBLIC_GROWISE_ENDPOINT || '',
      growiseGateway: process.env.NUXT_PUBLIC_GROWISE_GATEWAY || 'http://localhost:8082',
      appVersion: '1.0.0-ridego',
      devPanel: process.env.NUXT_PUBLIC_DEV_PANEL !== 'false'
    }
  }
})
