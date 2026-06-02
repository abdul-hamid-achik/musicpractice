import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import AutoImport from 'unplugin-auto-import/vite';

/**
 * Vite plugin that replaces `import.meta.client` with `true` in source files.
 *
 * Why we need this:
 * - Vitest 3's `defines` option only sets `globalThis[key] = value`, it does
 *   NOT do string replacement on the source code.
 * - The top-level Vite `define` option is not forwarded to the Vitest runner.
 * - `import.meta.client` is a Nuxt build-time constant; without replacement
 *   it's `undefined` in tests, which makes every `if (!import.meta.client)`
 *   guard fire and skip the real code path.
 *
 * We only rewrite source code under `app/`, `server/`, and `shared/` —
 * test files keep the real `import.meta` so assertions can verify it.
 */
function replaceImportMetaClient(): import('vite').Plugin {
  return {
    name: 'vitest-replace-import-meta-client',
    enforce: 'pre',
    transform(code, id) {
      if (!/\.(ts|tsx|js|jsx|mjs|cjs|vue)$/.test(id)) return;
      if (id.includes('/node_modules/')) return;
      if (id.includes('/tests/')) return;
      if (id.includes('/dist/')) return;
      if (id.includes('/coverage/')) return;
      // Only rewrite app/, server/, shared/
      if (!/\/(app|server|shared)\//.test(id)) return;
      if (!code.includes('import.meta.client')) return;
      return {
        code: code.replace(/import\.meta\.client/g, 'true'),
        map: null,
      };
    },
  };
}

export default defineConfig({
  plugins: [
    replaceImportMetaClient(),
    vue(),
    AutoImport({
      imports: ['vue'],
      dirs: ['./app/composables'],
    }),
  ],
  test: {
    globals: true,
    environment: 'happy-dom',
    include: ['tests/**/*.test.ts', 'server/**/*.test.ts'],
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: [
        'app/composables/**',
        'app/stores/**',
        'app/components/**',
        'app/pages/**',
        'server/api/**',
        'server/utils/**',
        'shared/**',
      ],
    },
  },
  resolve: {
    alias: {
      '~': new URL('./app', import.meta.url).pathname,
      '#shared': new URL('./shared', import.meta.url).pathname,
    },
  },
});
