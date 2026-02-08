import  {mdsvex}  from 'mdsvex';
import autoAdapters from '@sveltejs/adapter-auto';
import nodeAdapter from '@sveltejs/adapter-node';

import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { execSync } from "child_process"
import path from "path"


let adapter = autoAdapters

switch (process.env.ADAPTER_MODE) {
  case 'node':
    adapter = nodeAdapter;
    break;
  default:
    adapter = autoAdapters;
    break;
}


export let tag;
try {
  // Silence git stderr to avoid noisy "fatal: No names found" when no tags exist.
  tag = execSync(
    "git describe --tags 2>/dev/null || git rev-parse --short HEAD 2>/dev/null"
  )
    .toString()
    .trim();
} catch {
  tag = "v0.1.0-mia";
}

console.log({ tag });

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	//@ts-ignore
	preprocess: [vitePreprocess(), mdsvex()],
			csrf: {
			checkOrigin: false, //FIXME: CVE
		},
		// embedded: true,
		env: {
			dir: ".",
			publicPrefix: "PUBLIC_",
			privatePrefix: "",
		},
		files: {
			// assets: "static",
		},
		appDir: "app",
		version: {
			name: tag,
		},
		output: {
			preloadStrategy: "modulepreload",
		},
	kit: {
		// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
		// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
		// See https://svelte.dev/docs/kit/adapters for more information about adapters.
		// adapter: adapter()
		adapter: adapter(),
		alias: {
			"@": path.resolve("./"),
			"@public": path.resolve("./public"),
			"@src": path.resolve("./src"),
			"@lib": path.resolve("./src/lib"),
			"@config": path.resolve("./src/config"),
			"@components": path.resolve("./src/lib/components"),
			"@routes": path.resolve("./src/routes"),
			"@stores": path.resolve("./src/lib/stores"),
			"@utils": path.resolve("./src/lib/utils"),
			"@types": path.resolve("./src/lib/types"),
		},
	},

	extensions: ['.svelte', '.svx']
};

export default config;
