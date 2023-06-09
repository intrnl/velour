import * as fs from 'node:fs';

import * as esbuild from 'esbuild';
import { defineConfig } from 'rollup';

import pkg from './package.json' assert { type: 'json' };

let mangleFile = './mangle.json';
let mangleCache = {};

try {
	let source = fs.readFileSync(mangleFile, 'utf8');
	mangleCache = JSON.parse(source);
}
catch {}

let originalMangleCache = mangleCache;

export default defineConfig({
	input: {
		velour: './src/index.js',
	},
	output: {
		dir: './dist/',
	},
	plugins: [
		{
			name: 'esbuild',
			renderChunk (code) {
				let result = esbuild.transformSync(code, {
					sourcemap: true,
					mangleProps: /^_/,
					mangleCache: mangleCache,
					define: {
						'process.env.RUNTIME_VERSION': `"v${pkg.version}"`,
					},
				});

				mangleCache = result.mangleCache;

				return {
					code: result.code,
					map: result.map,
				};
			},
			closeBundle () {
				if (isObjectInequal(originalMangleCache, mangleCache)) {
					console.log('writing new mangle cache');
					fs.writeFileSync(mangleFile, JSON.stringify(mangleCache, null, '\t') + '\n');
				}
			},
		},
	],
});

function isObjectInequal (a, b) {
	for (let key in a) {
		if (!(key in b)) {
			return true;
		}
	}

	for (let key in b) {
		if (a[key] !== b[key]) {
			return true;
		}
	}

	return false;
}
