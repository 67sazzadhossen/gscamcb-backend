import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createUserSchema } from '../src/app/modules/users/user.validation';
import { employmentInfoSchema } from '../src/app/modules/employmentInfo/employmentInfo.validation';
const profile = {
  name: { firstName: 'Staff', lastName: 'Name' },
  shift: 'MORNING',
};
test('email is optional for all roles including staff and students', () => {
  assert.equal(
    createUserSchema.safeParse({ role: 'STUDENT', profile }).success,
    true,
  );
  for (const role of [
    'SUPER_ADMIN',
    'ADMIN',
    'TEACHER',
    'ACCOUNTANT',
    'STAFF',
  ]) {
    assert.equal(
      createUserSchema.safeParse({
        role,
        profile: {
          ...profile,
          employmentInfo: { designation: role, qualification: 'Graduate' },
        },
      }).success,
      true,
    );
    assert.equal(
      createUserSchema.safeParse({
        role,
        email: 'staff@example.com',
        profile: {
          ...profile,
          employmentInfo: { designation: role, qualification: 'Graduate' },
        },
      }).success,
      true,
    );
  }
});
test('employment data belongs to staff and rejects duplicate identity fields', () => {
  assert.equal(
    createUserSchema.safeParse({
      role: 'STUDENT',
      profile: { ...profile, employmentInfo: { designation: 'Student' } },
    }).success,
    false,
  );
  assert.equal(
    employmentInfoSchema.safeParse({
      designation: 'Teacher',
      joiningDate: '2026-01-01',
      employmentStatus: 'ON_LEAVE',
    }).success,
    true,
  );
  assert.equal(
    employmentInfoSchema.safeParse({
      designation: 'Teacher',
      name: 'Duplicate',
    }).success,
    false,
  );
});
