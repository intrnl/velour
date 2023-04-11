import { defineConfig } from 'vite';

export default defineConfig({
	base: './',
	esbuild: {
		jsx: 'automatic',
		jsxImportSource: '@intrnl/velour',
	},
	build: {
		rollupOptions: {
			input: {
				'main': './index.html',
				'1kpoints': './pages/1kpoints/index.html',
				'counter': './pages/counter/index.html',
				'dbmonster': './pages/dbmonster/index.html',
				'todomvc': './pages/todomvc/index.html',
			},
		},
	},
});
