import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
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

// Inline CSS into HTML to eliminate render-blocking stylesheet request
function inlineCss() {
  return {
    name: 'inline-css',
    enforce: 'post',
    closeBundle() {
      const htmlPath = resolve('dist', 'index.html');
      let html = readFileSync(htmlPath, 'utf-8');
      const cssMatch = html.match(/<link rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/);
      if (cssMatch) {
        const cssHref = cssMatch[1];
        const cssPath = resolve('dist', cssHref.startsWith('/') ? cssHref.slice(1) : cssHref);
        try {
          const css = readFileSync(cssPath, 'utf-8');
          html = html.replace(cssMatch[0], `<style>${css}</style>`);
          writeFileSync(htmlPath, html);
          unlinkSync(cssPath);
        } catch {}
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), serveDistJson(), inlineCss()],
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    rollupOptions: {},
  },
  server: {
    port: 4173,
  },
});
