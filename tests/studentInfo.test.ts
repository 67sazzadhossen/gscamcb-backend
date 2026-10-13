import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createUserSchema } from '../src/app/modules/users/user.validation';
import { updateProfileSchema } from '../src/app/modules/profile/profile.validation';
import {
  createProspectSchema,
  updateStudentDraftSchema,
} from '../src/app/modules/student/student.validation';
import { updateStudentInfoSchema } from '../src/app/modules/student/studentInfo.validation';
const profile = {
  name: { firstName: 'Student', lastName: 'Name' },
  shift: 'MORNING',
};
test('student details have one owner and cannot be duplicated on common profile', () => {
  const studentInfo = {
    version: 'BANGLA',
    isCadet: true,
    usesTransport: false,
    birthRegistrationNumber: '001234',
    guardian: { name: { firstName: 'Guardian', lastName: 'Name' } },
  };
  assert.equal(
    createProspectSchema.safeParse({ ...profile, studentInfo }).success,
    true,
  );
  assert.equal(
    createProspectSchema.safeParse({
      ...profile,
      studentInfo,
      version: 'BANGLA',
    }).success,
    false,
  );
  for (const [field, value] of Object.entries(studentInfo))
    assert.equal(
      updateProfileSchema.safeParse({ [field]: value }).success,
      false,
    );
  assert.equal(
    updateProfileSchema.safeParse({
      phone: '01700000000',
      presentAddress: { addressLine: 'Home' },
    }).success,
    true,
  );
});
test('role creation rejects mixed student and employee relations', () => {
  assert.equal(
    createUserSchema.safeParse({
      role: 'TEACHER',
      email: 'teacher@example.com',
      profile: { ...profile, studentInfo: { isCadet: false } },
    }).success,
    false,
  );
  assert.equal(
    createUserSchema.safeParse({
      role: 'STUDENT',
      profile: {
        ...profile,
        studentInfo: {},
        employmentInfo: { designation: 'Staff' },
      },
    }).success,
    false,
  );
});
test('student-specific edits cannot replace collector or admission decisions', () => {
  assert.equal(
    updateStudentInfoSchema.safeParse({ usesTransport: true }).success,
    true,
  );
  for (const field of [
    'name',
    'shift',
    'collectedById',
    'admittedById',
    'admissionStatus',
    'monthlySalary',
    'academicInfo',
    'paymentInfo',
  ])
    assert.equal(
      updateStudentInfoSchema.safeParse({ [field]: 'unexpected' }).success,
      false,
    );
  assert.equal(
    updateStudentDraftSchema.safeParse({ studentInfo: { usesTransport: true } })
      .success,
    true,
  );
});
