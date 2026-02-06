import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { verifyMetaSignature } from '../src/meta.js';

test('verifyMetaSignature accepts valid signature', () => {
  const rawBody = Buffer.from('{"hello":"world"}');
  const appSecret = 'test-secret';
  const signature = crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex');
  assert.equal(verifyMetaSignature({ rawBody, appSecret, signatureHeader: `sha256=${signature}` }), true);
});

test('verifyMetaSignature rejects invalid signature', () => {
  const rawBody = Buffer.from('{"hello":"world"}');
  assert.equal(verifyMetaSignature({ rawBody, appSecret: 'test-secret', signatureHeader: 'sha256=deadbeef' }), false);
});
