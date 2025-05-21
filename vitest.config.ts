import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'path';

export default defineConfig({
  plugins: [svelte({ hot: !process.env.VITEST })],
  test: {
    include: ['src/**/*.{test,spec}.{js,ts,svelte}'],
    environment: 'jsdom',
    setupFiles: ['./vitest-setup-client.ts'],
    globals: true,
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'src/app.d.ts',
        'e2e/**',
        'static/**'
      ]
    },
    alias: {
      $lib: resolve(__dirname, './src/lib'),
      $app: resolve(__dirname, './node_modules/@sveltejs/kit/src/runtime/app'),
      '$env/static/public': resolve(__dirname, './src/lib/mocks/env-public.js')
    }
  },
});
