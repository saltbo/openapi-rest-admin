import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { resolve } from "path";

const standaloneMode = process.env.BUILD_MODE === 'standalone';

export default defineConfig({
  plugins: [react(), tailwindcss(), tsconfigPaths()],
  define: standaloneMode ? {
    'process.env': {},
    'process.env.NODE_ENV': JSON.stringify('production'),
    global: 'globalThis',
  } : undefined,
  build: standaloneMode ? {
    lib: {
      entry: resolve(__dirname, 'app/standalone.tsx'),
      name: 'OpenAPIRestAdmin',
      fileName: 'openapi-rest-admin',
      formats: ['umd']
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {},
        entryFileNames: 'assets/openapi-rest-admin.js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/openapi-rest-admin.[ext]',
        exports: 'named'
      }
    },
    cssCodeSplit: false,
    assetsInlineLimit: 0
  } : undefined 
});
