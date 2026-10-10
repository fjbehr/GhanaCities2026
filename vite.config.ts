import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';
import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig(({ mode }) => {
	// The site's public address, built into the server. Without it adapter-node derives the
	// origin from request headers and assumes https://, which breaks absolute map-service URLs.
	const origin = loadEnv(mode, process.cwd(), '').ORIGIN || undefined;

	return {
		plugins: [
			sveltekit({
				compilerOptions: {
					// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
					runes: ({ filename }) =>
						filename.split(/[/\\]/).includes('node_modules') ? undefined : true
				},
				adapter: adapter(),
				paths: { origin }
			})
		],
		// Same port in dev and production (adapter-node defaults to 3000)
		server: { port: 3000, strictPort: true },
		preview: { port: 3000, strictPort: true },
		test: {
			expect: { requireAssertions: true },
			projects: [
				{
					extends: './vite.config.ts',
					test: {
						name: 'server',
						environment: 'node',
						include: ['src/**/*.{test,spec}.{js,ts}', 'pipeline/**/*.{test,spec}.ts'],
						exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
					}
				}
			]
		}
	};
});
