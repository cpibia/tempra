import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'prompt',
      injectRegister: false,
      manifest: false,
      injectManifest: {
        // Il catalogo esercizi e le icone entrano nel precache.
        // Le immagini degli esercizi (26 MB) restano in cache a richiesta.
        globPatterns: ['**/*.{js,css,html,woff2,svg,json}'],
        globIgnores: ['**/img/ex/**'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
      },
      devOptions: { enabled: false, type: 'module' },
    }),
  ],
  resolve: {
    // Corrispondenza esatta: '@tempra/core' punta al sorgente, ma
    // '@tempra/core/data/exercises.json' deve restare un percorso a se'.
    alias: [
      { find: /^@tempra\/core$/, replacement: fileURLToPath(new URL('../../packages/core/src/index.ts', import.meta.url)) },
      { find: /^@tempra\/core\//, replacement: fileURLToPath(new URL('../../packages/core/src/', import.meta.url)) },
      { find: /^@\//, replacement: fileURLToPath(new URL('./src/', import.meta.url)) },
    ],
  },
  server: {
    port: 5173,
    host: true,
  },
  build: {
    target: 'es2022',
    // Le mappe dei sorgenti non vengono pubblicate: pesano piu' del codice
    // e si rigenerano in locale quando serve davvero indagare un errore.
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Il catalogo pesa circa 1 MB: chunk separato, cosi' resta in cache
          // anche quando il codice dell'applicazione cambia.
          if (id.includes('packages/core/src/data/exercises.json')) return 'catalog';
          if (id.includes('node_modules/react') || id.includes('node_modules/scheduler')) return 'react';
          return undefined;
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    // I test end to end girano con Playwright, non con Vitest.
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
  },
});
