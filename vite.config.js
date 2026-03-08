import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Serve JSON data files from dist/ during dev
function serveDistJson() {
  return {
    name: 'serve-dist-json',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/dashboard-data.json' || req.url === '/pabrai_nav.json') {
          try {
            const filePath = resolve('dist', req.url.slice(1));
            const data = readFileSync(filePath, 'utf-8');
            res.setHeader('Content-Type', 'application/json');
            res.end(data);
            return;
          } catch { /* fall through */ }
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), serveDistJson()],
  build: {
    outDir: 'dist',
    emptyOutDir: false,
  },
  server: {
    port: 4173,
  },
});
