import test from 'node:test';
import assert from 'node:assert/strict';

process.env.META_APP_SECRET = 'test-secret';
const { createServer } = await import('../src/app.js');

test('health and messages endpoints respond', async () => {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;

  const health = await fetch(`http://127.0.0.1:${port}/healthz`);
  assert.equal(health.status, 200);
  const healthBody = await health.json();
  assert.equal(healthBody.status, 'ok');

  const msgs = await fetch(`http://127.0.0.1:${port}/api/messages`);
  assert.equal(msgs.status, 200);
  const body = await msgs.json();
  assert.equal(Array.isArray(body), true);

  server.close();
});
