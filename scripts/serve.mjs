import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve(process.argv.includes('--dist') ? 'dist' : '.');
const types = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8', '.md':'text/plain; charset=utf-8', '.txt':'text/plain; charset=utf-8', '.png':'image/png', '.svg':'image/svg+xml', '.webmanifest':'application/manifest+json' };
const port = Number(process.env.PORT || 4173);
const base = '/' + (process.env.APP_BASE_PATH || '').replace(/^\/+|\/+$/g, '');
http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    let name = decodeURIComponent(url.pathname);
    if (base !== '/') {
      if (!name.startsWith(base + '/')) { res.writeHead(404).end(); return; }
      name = name.slice(base.length);
    }
    const file = path.resolve(root, '.' + (name.endsWith('/') ? name + 'index.html' : name));
    if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(body);
  } catch { res.writeHead(404).end('Dosya bulunamadı'); }
}).listen(port, '0.0.0.0', () => console.log(`AkliKubbe: http://localhost:${port}${base === '/' ? '' : base + '/'}`));
