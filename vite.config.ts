import devtoolsJson from 'vite-plugin-devtools-json';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  preview: {
    allowedHosts: true
  },
  server: {
    fs: {
      // Allow serving files from one level up to the project root
      allow: [".."],
    },
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    },
    allowedHosts: true,
  }, plugins: [tailwindcss(), sveltekit(), devtoolsJson()],
  resolve: {
    alias: {
      "@": path.resolve("./"),
      "@static": path.resolve("./static"),
      "@src": path.resolve("./src"),
      "@routes": path.resolve("./src/routes"),
      $routes: path.resolve("./src/routes"),
      $lib: path.resolve("./src/lib"),
      $stores: path.resolve("./src/stores"),
      "@stores": path.resolve("./src/stores"),
      $utils: path.resolve("./utils"),
      "@utils": path.resolve("./utils"),
      "@config": path.resolve("./config"),
      "@components": path.resolve("./src/lib/components"),
      $components: path.resolve("./src/lib/components"),
    },

  },
  build: {
    outDir: path.join(__dirname, ".build"),
  },
},);
