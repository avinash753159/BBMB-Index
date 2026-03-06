import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'dist',
    emptyOutDir: false,
  },
  server: {
    port: 4173,
    proxy: {
      '/dashboard-data.json': {
        target: 'http://localhost:4174',
        changeOrigin: true,
      },
      '/pabrai_nav.json': {
        target: 'http://localhost:4174',
        changeOrigin: true,
      },
    },
  },
});
