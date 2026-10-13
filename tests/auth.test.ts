import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app';
import { loginSchema } from '../src/app/modules/auth/auth.validation';
test('login accepts only the eight-digit school ID and password', () => {
  assert.equal(
    loginSchema.safeParse({ userId: '26011001', password: 'Example123!' })
      .success,
    true,
  );
  for (const input of [
    { userId: 'demo@example.com', password: 'Example123!' },
    { identifier: '26011001', password: 'Example123!' },
    { userId: '2601100', password: 'Example123!' },
    { userId: '26011001', password: '' },
  ])
    assert.equal(loginSchema.safeParse(input).success, false);
});
test('email login fails validation before any database query', async () => {
  await request(app)
    .post('/api/v1/auth/login')
    .send({ userId: 'demo@example.com', password: 'Example123!' })
    .expect(400);
});
