import test from 'node:test';
import assert from 'node:assert/strict';
import { handleLogin } from '../src/login.js';

test('rejects empty credentials', () => {
  const event = { preventDefault() {}, target: { email: { value: '' }, password: { value: '' } } };
  const result = handleLogin(event, () => ({ ok: true }));
  assert.deepEqual(result, { ok: false, error: 'Email and password are required' });
});
