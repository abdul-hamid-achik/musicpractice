import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      imports: ['vue'],
      dirs: ['./app/composables'],
    }),
  ],
  test: {
    globals: true,
    environment: 'happy-dom',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['app/composables/**', 'app/stores/**', 'shared/**']
    }
  },
  resolve: {
    alias: {
      '~': new URL('./app', import.meta.url).pathname,
      '#shared': new URL('./shared', import.meta.url).pathname,
    }
  }
})
