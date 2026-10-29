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
      // GoWise Web SDK v2 (CDN) — same SDK as ShopEase / MedGo
      script: [{ src: 'https://cdn.thegrowise.com/web-v2/dist/growise.umd.js' }]
    }
  },

  css: ['~/assets/css/ridego.css'],

  runtimeConfig: {
    public: {
      growiseApiKey: process.env.NUXT_PUBLIC_GROWISE_API_KEY || '',
      growiseEnv: process.env.NUXT_PUBLIC_GROWISE_ENV || '',
      appVersion: '1.0.0-ridego',
      // The dev panel can override the API key and wipe identities. `nuxt dev` shows it
      // unless NUXT_PUBLIC_DEV_PANEL=false; production builds ignore that flag and need
      // NUXT_PUBLIC_DEV_PANEL_IN_PRODUCTION=true (see useDevPanelEnabled).
      devPanel: process.env.NUXT_PUBLIC_DEV_PANEL !== 'false',
      devPanelInProduction: process.env.NUXT_PUBLIC_DEV_PANEL_IN_PRODUCTION === 'true'
    }
  }
})
