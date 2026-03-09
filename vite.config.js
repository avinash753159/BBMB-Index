import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import tailwindcss from '@tailwindcss/vite';
import { readFileSync, writeFileSync, unlinkSync, rmSync, mkdirSync, existsSync } from 'node:fs';
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

// Clean old hashed assets before build (emptyOutDir=false preserves data JSON files)
function cleanAssets() {
  return {
    name: 'clean-assets',
    buildStart() {
      const assetsDir = resolve('dist', 'assets');
      if (existsSync(assetsDir)) {
        rmSync(assetsDir, { recursive: true });
        mkdirSync(assetsDir, { recursive: true });
      }
    },
  };
}

export default defineConfig({
  plugins: [preact(), tailwindcss(), serveDistJson(), cleanAssets(), inlineCss()],
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    target: 'esnext',
    modulePreload: { polyfill: false },
  },
  server: {
    port: 4173,
  },
});
