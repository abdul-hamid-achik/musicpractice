import tailwindcss from '@tailwindcss/vite';
import { alphaTab } from '@coderline/alphatab-vite';

/**
 * Security response headers applied to every route.
 *
 * Notes on individual entries:
 *  - `X-Content-Type-Options: nosniff` — prevent MIME-sniffing attacks.
 *  - `X-Frame-Options: DENY` — block clickjacking by disallowing framing.
 *  - `Referrer-Policy: strict-origin-when-cross-origin` — only send the
 *    origin (not the path) on cross-origin requests.
 *  - `Permissions-Policy` — explicitly disable sensors the app doesn't need
 *    so a compromised dependency cannot silently enable them.
 *  - `Strict-Transport-Security` — HSTS. Only enabled in production so local
 *    dev over plain HTTP is not broken.
 *  - `Content-Security-Policy` — `self` for most assets, allow Google Fonts,
 *    inline styles for Tailwind/Nuxt runtime, and `blob:` for audio
 *    synthesised in the browser (Tone.js).
 */
const isProduction = process.env.NODE_ENV === 'production';

const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'microphone=(), camera=(), geolocation=()',
  ...(isProduction ? { 'Strict-Transport-Security': 'max-age=31536000; includeSubDomains' } : {}),
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob:",
    "media-src 'self' blob:",
    "connect-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com",
    "frame-ancestors 'none'",
  ].join('; '),
};

export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  future: { compatibilityVersion: 4 },

  modules: ['@pinia/nuxt'],

  components: [{ path: '~/components', pathPrefix: false }],

  css: ['~/assets/css/main.css'],

  app: {
    head: {
      title: 'MusicPractice',
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', type: 'image/png', href: '/favicon.png' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&display=swap',
        },
      ],
    },
  },

  // Global response headers via Nitro route rules. Applied to every route
  // (pages, API, assets) so we don't have to remember to repeat them per
  // handler.
  routeRules: {
    '/**': {
      headers: securityHeaders,
    },
  },

  vite: {
    plugins: [tailwindcss() as any, ...(alphaTab() as any)],
    optimizeDeps: {
      include: ['tone'],
      exclude: ['@coderline/alphatab'],
    },
  },

  typescript: { strict: true },
});
