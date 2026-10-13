import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app';
import { updateUserSchema } from '../src/app/modules/users/user.validation';
test('blocking uses account status without duplicate flags', () => {
  assert.equal(updateUserSchema.safeParse({ status: 'BLOCKED' }).success, true);
  assert.equal(updateUserSchema.safeParse({ status: 'ACTIVE' }).success, true);
  assert.equal(updateUserSchema.safeParse({ status: 'OTHER' }).success, false);
  assert.equal(updateUserSchema.safeParse({ isBlocked: true }).success, false);
  assert.equal(updateUserSchema.safeParse({ isDeleted: true }).success, false);
});
test('recycle bin and permanent deletion routes require authentication', async () => {
  await request(app).get('/api/v1/users/recycle-bin').expect(401);
  await request(app).delete('/api/v1/users/26041001').expect(401);
  await request(app).patch('/api/v1/users/26041001/restore').expect(401);
  await request(app).delete('/api/v1/users/26041001/permanent').expect(401);
  await request(app).get('/api/v1/students/recycle-bin').expect(401);
});
