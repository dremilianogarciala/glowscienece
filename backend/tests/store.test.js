import test from 'node:test';
import assert from 'node:assert/strict';
import { TTLStore } from '../src/store.js';

test('TTLStore expires key', async () => {
  const store = new TTLStore(20);
  store.set('event-1', true);
  assert.equal(store.has('event-1'), true);
  await new Promise((resolve) => setTimeout(resolve, 30));
  assert.equal(store.has('event-1'), false);
});
