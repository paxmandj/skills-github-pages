const http = require('http');
const fs = require('fs');
const path = require('path');
const { db } = require('./db');
const { buildApiRouter } = require('./routes/api');

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // escucha en todas las interfaces de red -> accesible desde otros dispositivos
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

const apiRouter = buildApiRouter(db);

function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  let filePath = path.join(PUBLIC_DIR, url.pathname === '/' ? 'index.html' : url.pathname);

  // Evitar path traversal
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end('Prohibido');
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // SPA fallback: si no es un archivo conocido y no tiene extensión, servir index.html
        if (!path.extname(filePath)) {
          return fs.readFile(path.join(PUBLIC_DIR, 'index.html'), (err2, indexContent) => {
            if (err2) { res.writeHead(404); return res.end('No encontrado'); }
            res.writeHead(200, { 'Content-Type': MIME_TYPES['.html'] });
            res.end(indexContent);
          });
        }
        res.writeHead(404);
        return res.end('No encontrado');
      }
      res.writeHead(500);
      return res.end('Error del servidor');
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    res.end(content);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname.startsWith('/api/')) {
    const handled = await apiRouter.handle(req, res, { db });
    if (!handled && !res.writableEnded) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Ruta de API no encontrada' }));
    }
    return;
  }

  serveStatic(req, res);
});

server.listen(PORT, HOST, () => {
  const nets = require('os').networkInterfaces();
  console.log('\n============================================');
  console.log('  Planificador de Servicios - Iglesia');
  console.log('============================================');
  console.log(`  Local:    http://localhost:${PORT}`);
  Object.values(nets).flat().forEach(net => {
    if (net.family === 'IPv4' && !net.internal) {
      console.log(`  Red:      http://${net.address}:${PORT}`);
    }
  });
  console.log('============================================\n');
});
