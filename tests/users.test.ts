import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app';
import { getUserIdPrefix, formatUserId } from '../src/app/utils/generateUserId';
import { ROLE_CODES, SHIFT_CODES } from '../src/app/modules/users/user.const';
import {
  createUserSchema,
  updateUserSchema,
} from '../src/app/modules/users/user.validation';
import { hashPassword, verifyPassword } from '../src/app/utils/password';

test('every role and shift produces the confirmed eight-digit ID', () => {
  for (const [role, roleCode] of Object.entries(ROLE_CODES)) {
    for (const [shift, shiftCode] of Object.entries(SHIFT_CODES)) {
      const prefix = getUserIdPrefix(
        role as keyof typeof ROLE_CODES,
        shift as keyof typeof SHIFT_CODES,
        new Date('2026-10-14T00:00:00Z'),
      );
      assert.equal(formatUserId(prefix, 1), `26${roleCode}${shiftCode}001`);
      assert.equal(formatUserId(prefix, 999).length, 8);
    }
  }
});
test('school year uses Dhaka timezone at the year boundary', () => {
  assert.equal(
    getUserIdPrefix('STUDENT', 'DAY', new Date('2026-12-31T18:00:00Z')),
    '27042',
  );
});
test('serial overflow is rejected rather than generating a ninth digit', () => {
  assert.throws(() => formatUserId('26041', 1000));
  assert.throws(() => formatUserId('26041', 0));
});
test('users cannot supply IDs or update roles through account updates', () => {
  const payload = {
    email: 'STUDENT@example.com',
    password: 'SchoolPassword123!',
    role: 'STUDENT',
    profile: {
      name: { firstName: ' Student ', lastName: 'Name' },
      shift: 'MORNING',
    },
  };
  assert.equal(createUserSchema.parse(payload).email, 'student@example.com');
  assert.equal(
    createUserSchema.safeParse({ ...payload, userId: '26041001' }).success,
    false,
  );
  assert.equal(
    updateUserSchema.safeParse({ role: 'SUPER_ADMIN' }).success,
    false,
  );
  assert.equal(updateUserSchema.safeParse({}).success, false);
});
test('passwords are hashed and verify only with the matching password', async () => {
  const password = 'SchoolPassword123!';
  const hash = await hashPassword(password);
  assert.notEqual(hash, password);
  assert.equal(await verifyPassword(password, hash), true);
  assert.equal(await verifyPassword('WrongPassword', hash), false);
});
test('user and profile routes require a session before database access', async () => {
  for (const route of [
    '/api/v1/users',
    '/api/v1/users/me',
    '/api/v1/profiles/me',
  ]) {
    const response = await request(app).get(route).expect(401);
    assert.equal(response.body.success, false);
  }
  await request(app)
    .post('/api/v1/users')
    .send({ role: 'SUPER_ADMIN' })
    .expect(401);
  await request(app)
    .get('/api/v1/users')
    .set('Authorization', 'Bearer invalid')
    .expect(401);
});

test('structured names are required, Bengali name parts remain optional', () => {
  const name = { firstName: 'Md', middleName: 'Sazzad', lastName: 'Hossen' };
  const payload = {
    email: 'teacher@example.com',
    password: 'SchoolPassword123!',
    role: 'TEACHER',
    profile: { name, shift: 'MORNING' },
  };
  assert.equal(createUserSchema.safeParse(payload).success, true);
  assert.equal(
    createUserSchema.safeParse({
      ...payload,
      profile: {
        ...payload.profile,
        name: {
          ...name,
          bengaliFirstName: 'মোঃ',
          bengaliMiddleName: 'সাজ্জাদ',
          bengaliLastName: 'হোসেন',
        },
      },
    }).success,
    true,
  );
  assert.equal(
    createUserSchema.safeParse({ ...payload, profile: { shift: 'MORNING' } })
      .success,
    false,
  );
  assert.equal(
    createUserSchema.safeParse({ ...payload, name: 'Old field' }).success,
    false,
  );
});
test('guardians reuse the nested name schema and retain addresses', () => {
  const guardian = {
    name: { firstName: 'Md', lastName: 'Karim' },
    address: { addressLine: 'Mymensingh' },
    relationship: 'Father',
  };
  const payload = {
    email: 'student@example.com',
    password: 'SchoolPassword123!',
    role: 'STUDENT',
    profile: {
      name: { firstName: 'Student', lastName: 'Name' },
      shift: 'MORNING',
      guardian,
      localGuardian: { ...guardian, relationship: 'Uncle' },
    },
  };
  assert.equal(createUserSchema.safeParse(payload).success, true);
  assert.equal(
    createUserSchema.safeParse({
      ...payload,
      profile: { ...payload.profile, guardian: { phone: '01700000000' } },
    }).success,
    false,
  );
});
test('version, cadet status, and Cloudinary image metadata are validated', () => {
  const payload = {
    email: 'student@example.com',
    password: 'SchoolPassword123!',
    role: 'STUDENT',
    profile: {
      name: { firstName: 'Student', lastName: 'Name' },
      shift: 'MORNING',
      version: 'ENGLISH',
      isCadet: true,
      image: {
        displayUrl: 'https://res.cloudinary.com/school/image/upload/photo.webp',
        publicId: 'school/photo',
      },
    },
  };
  assert.equal(createUserSchema.safeParse(payload).success, true);
  assert.equal(
    createUserSchema.safeParse({
      ...payload,
      profile: { ...payload.profile, version: 'BANGLA', isCadet: false },
    }).success,
    true,
  );
  assert.equal(
    createUserSchema.safeParse({
      ...payload,
      profile: { ...payload.profile, version: 'OTHER' },
    }).success,
    false,
  );
  assert.equal(
    createUserSchema.safeParse({
      ...payload,
      profile: { ...payload.profile, isCadet: 'false' },
    }).success,
    false,
  );
  assert.equal(
    createUserSchema.safeParse({
      ...payload,
      profile: {
        ...payload.profile,
        image: { displayUrl: 'https://example.com/photo' },
      },
    }).success,
    false,
  );
});
