// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', '@nuxtjs/i18n'],
  components: [
    { path: '~/components/icons', pathPrefix: false },
    { path: '~/components/onboarding', pathPrefix: false },
    { path: '~/components', ignore: ['icons/**', 'onboarding/**'] },
  ],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL ?? '',
    allowSignup: process.env.NUXT_ALLOW_SIGNUP === 'true',
    smtpHost: process.env.NUXT_SMTP_HOST ?? 'localhost',
    smtpPort: process.env.NUXT_SMTP_PORT ?? '1025',
    smtpFrom: process.env.NUXT_SMTP_FROM ?? 'AccessMap <noreply@accessmap.local>',
    public: {
      appUrl: process.env.NUXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
    },
  },
  i18n: {
    locales: [
      { code: 'en', language: 'en-US', name: 'English', file: 'en.json' },
      { code: 'es', language: 'es-ES', name: 'Español', file: 'es.json' },
    ],
    defaultLocale: 'en',
    strategy: 'no_prefix',
    langDir: 'locales',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_locale',
      fallbackLocale: 'en',
    },
  },
})