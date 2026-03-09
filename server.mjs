import http from 'node:http';
import { promises as fs } from 'node:fs';
import { createReadStream } from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { pipeline } from 'node:stream';

const root = process.cwd();
const distDir = path.join(root, 'dist');
const port = process.env.PORT || 4174;

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
};

const compressible = new Set(['.html', '.css', '.js', '.json', '.svg', '.txt']);

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? '/', `http://${request.headers.host}`);
    const pathname = url.pathname === '/' ? '/index.html' : url.pathname;
    const filePath = path.join(distDir, pathname);

    if (!filePath.startsWith(distDir)) {
      response.writeHead(403);
      response.end('Forbidden');
      return;
    }

    await fs.access(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const ct = contentTypes[ext] ?? 'application/octet-stream';
    const acceptEncoding = request.headers['accept-encoding'] || '';

    if (compressible.has(ext) && acceptEncoding.includes('gzip')) {
      response.writeHead(200, { 'content-type': ct, 'content-encoding': 'gzip', 'vary': 'Accept-Encoding' });
      pipeline(createReadStream(filePath), zlib.createGzip(), response, () => {});
    } else {
      const data = await fs.readFile(filePath);
      response.writeHead(200, { 'content-type': ct });
      response.end(data);
    }
  } catch (error) {
    response.writeHead(error.code === 'ENOENT' ? 404 : 500, { 'content-type': 'text/plain; charset=utf-8' });
    response.end(error.code === 'ENOENT' ? 'Not found' : 'Server error');
  }
});

server.listen(port, () => {
  console.log(`Dashboard available at http://127.0.0.1:${port}`);
});
