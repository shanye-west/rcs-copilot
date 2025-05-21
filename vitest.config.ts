import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'path';

export default defineConfig({
	plugins: [svelte({ hot: !process.env.VITEST })],
	resolve: {
		alias: [
			{ find: '$lib', replacement: resolve(__dirname, './src/lib') },
			{
				find: '$app/environment',
				replacement: resolve(__dirname, './src/lib/mocks/__mocks__/app-environment.js')
			},
			{
				find: '$env/static/public',
				replacement: resolve(__dirname, './src/lib/mocks/env-public.js')
			}
		]
	},
	test: {
		include: ['src/**/*.{test,spec}.{js,ts,svelte}'],
		environment: 'jsdom',
		setupFiles: ['./vitest-setup-client.ts', './vitest.setup.js'],
		globals: true,
		mockReset: true,
		clearMocks: true,
		restoreMocks: true,
		coverage: {
			reporter: ['text', 'json', 'html'],
			exclude: ['node_modules/**', 'src/app.d.ts', 'e2e/**', 'static/**']
		},
		deps: {
			inline: [/^svelte\//]
		}
	}
});
