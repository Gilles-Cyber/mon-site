const test = require('node:test');
const assert = require('node:assert');
const { createServer } = require('../server');

let server, base;
test.before(async () => {
  server = createServer();
  await new Promise(r => server.listen(0, r));
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(() => server.close());

test('GET / renvoie la page avec le nom de l\'auteur', async () => {
  const res = await fetch(base + '/');
  assert.strictEqual(res.status, 200);
  assert.match(await res.text(), /Gilles Parfait/);
});

test('GET /health renvoie ok', async () => {
  const res = await fetch(base + '/health');
  assert.strictEqual(res.status, 200);
  assert.deepStrictEqual(await res.json(), { status: 'ok' });
});

test('GET /api/info renvoie la version', async () => {
  const body = await (await fetch(base + '/api/info')).json();
  assert.strictEqual(body.name, 'mon-site');
  assert.ok(body.version);
});

test('page inconnue -> 404', async () => {
  const res = await fetch(base + '/nexiste-pas');
  assert.strictEqual(res.status, 404);
});
