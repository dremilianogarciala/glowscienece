import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

process.env.META_APP_SECRET = 'test-secret';
process.env.META_VERIFY_TOKEN = 'verify-token';

const { createServer } = await import('../src/app.js');

function sign(payload) {
  return crypto.createHmac('sha256', 'test-secret').update(Buffer.from(JSON.stringify(payload))).digest('hex');
}

test('webhook accepts valid signed payload and deduplicates', async () => {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;

  const payload = {
    object: 'whatsapp_business_account',
    entry: [{ changes: [{ value: { messaging_product: 'whatsapp', contacts: [{ profile: { name: 'A' } }], messages: [{ id: 'm1', from: '57300', type: 'image', timestamp: `${Math.floor(Date.now()/1000)}` }] } }] }]
  };

  const sig = sign(payload);
  const res1 = await fetch(`http://127.0.0.1:${port}/api/webhook`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-hub-signature-256': `sha256=${sig}` },
    body: JSON.stringify(payload)
  });
  assert.equal(res1.status, 200);
  const b1 = await res1.json();
  assert.equal(b1.accepted, true);

  const res2 = await fetch(`http://127.0.0.1:${port}/api/webhook`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-hub-signature-256': `sha256=${sig}` },
    body: JSON.stringify(payload)
  });
  assert.equal(res2.status, 200);
  const b2 = await res2.json();
  assert.equal(b2.duplicate, true);

  server.close();
});
