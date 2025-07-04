import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const standaloneMode = process.env.BUILD_MODE === 'standalone';

export default defineConfig({
  plugins: [react(), tailwindcss(), tsconfigPaths()],
  build: standaloneMode ? {
    rollupOptions: {
      output: {
        manualChunks: undefined,
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]'
      }
    },
    cssCodeSplit: false,
    assetsInlineLimit: 0
  } : undefined 
});
