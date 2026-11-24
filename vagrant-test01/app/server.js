// Petit serveur web sans dépendance externe (module http de Node).
const http = require('http');
const fs = require('fs');
const path = require('path');
const pkg = require('./package.json');

const PUBLIC = path.join(__dirname, 'public');
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png' };

// --- Observabilité : compteurs au format Prometheus ---
const startTime = Date.now();
const counters = new Map(); // "route|code" -> nombre de requêtes

function routeLabel(url) {
  if (['/', '/health', '/api/info', '/metrics'].includes(url)) return url;
  return 'autre'; // évite d'avoir un label différent par URL
}

function renderMetrics() {
  const lines = [
    '# HELP http_requests_total Nombre de requêtes HTTP reçues.',
    '# TYPE http_requests_total counter',
  ];
  for (const [key, value] of counters) {
    const [route, code] = key.split('|');
    lines.push(`http_requests_total{route="${route}",code="${code}"} ${value}`);
  }
  lines.push(
    '# HELP app_uptime_seconds Durée de fonctionnement de l\'application.',
    '# TYPE app_uptime_seconds gauge',
    `app_uptime_seconds ${((Date.now() - startTime) / 1000).toFixed(0)}`,
    '# HELP app_info Informations sur la version de l\'application.',
    '# TYPE app_info gauge',
    `app_info{version="${pkg.version}"} 1`,
  );
  return lines.join('\n') + '\n';
}

function createServer() {
  return http.createServer((req, res) => {
    const url = req.url.split('?')[0];
    res.on('finish', () => {
      const key = `${routeLabel(url)}|${res.statusCode}`;
      counters.set(key, (counters.get(key) || 0) + 1);
    });

    if (url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ status: 'ok' }));
    }
    if (url === '/metrics') {
      res.writeHead(200, { 'Content-Type': 'text/plain; version=0.0.4; charset=utf-8' });
      return res.end(renderMetrics());
    }
    if (url === '/api/info') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ name: pkg.name, version: pkg.version, author: 'Gilles Parfait' }));
    }
    // Page d'accueil : l'application météo (index.html) si elle est présente,
    // sinon la page de présentation (apropos.html).
    let name = url;
    if (url === '/') name = fs.existsSync(path.join(PUBLIC, 'index.html')) ? 'index.html' : 'apropos.html';
    const file = path.join(PUBLIC, name);
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
  createServer().listen(port, () => console.log(`Serveur démarré sur le port ${port}`));
}

module.exports = { createServer };
