import test from 'node:test';
import assert from 'node:assert/strict';
import { routeAgent } from '../src/router.js';

test('routeAgent routes sales keywords', () => {
  assert.equal(routeAgent('Quiero una cotización').agentId, 'sales-agent');
});

test('routeAgent fallback', () => {
  assert.equal(routeAgent('hola').agentId, 'general-agent');
});
