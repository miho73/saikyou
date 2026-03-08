import {defineConfig} from 'vite';
import react from "@vitejs/plugin-react";
import {crx} from '@crxjs/vite-plugin';
import manifest from "./manifest.json";
import tailwindcss from "@tailwindcss/vite";
import svgr from "vite-plugin-svgr";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    svgr(),
    crx({manifest}),
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true
  },
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5173,
    },
    cors: {
      origin: '*',
    }
  }
});
