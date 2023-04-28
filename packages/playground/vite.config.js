import { defineConfig } from 'vite';

export default defineConfig({
	base: './',
	esbuild: {
		jsx: 'automatic',
		jsxImportSource: '@intrnl/velour',
	},
	build: {
		minify: 'terser',
		sourcemap: true,
		target: 'esnext',
		modulePreload: {
			polyfill: false,
		},
		rollupOptions: {
			input: {
				'main': './index.html',
				'1kpoints': './pages/1kpoints/index.html',
				'counter': './pages/counter/index.html',
				'dbmonster': './pages/dbmonster/index.html',
				'spiral': './pages/spiral/index.html',
				'todomvc': './pages/todomvc/index.html',
			},
		},
	},
});
