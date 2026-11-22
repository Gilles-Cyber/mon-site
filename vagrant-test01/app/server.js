// Petit serveur web sans dÃ©pendance externe (module http de Node).
const http = require('http');
const fs = require('fs');
const path = require('path');
const pkg = require('./package.json');

const PUBLIC = path.join(__dirname, 'public');
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png' };

function createServer() {
  return http.createServer((req, res) => {
    const url = req.url.split('?')[0];
    if (url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ status: 'ok' }));
    }
    if (url === '/api/info') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ name: pkg.name, version: pkg.version, author: 'Gilles Parfait' }));
    }
    const file = path.join(PUBLIC, url === '/' ? 'index.html' : url);
    if (!file.startsWith(PUBLIC)) { res.writeHead(403); return res.end('Interdit'); }
    fs.readFile(file, (err, data) => {
      if (err) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('Page introuvable'); }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
      res.end(data);
    });
  });
}

if (require.main === module) {
  const port = process.env.PORT || 3000;
  createServer().listen(port, () => console.log(`Serveur dÃ©marrÃ© sur le port ${port}`));
}

module.exports = { createServer };
