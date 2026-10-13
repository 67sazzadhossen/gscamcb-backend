import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app';
import {
  createProspectSchema,
  updateAdmissionStatusSchema,
  admitStudentSchema,
  homeVisitSchema,
  updateStudentDraftSchema,
} from '../src/app/modules/student/student.validation';
import { admissionDetails } from '../src/app/modules/academicInfo/academicInfo.utils';
const classId = '11111111-1111-4111-8111-111111111111';
test('prospects require an ID shift but email, password and placement are optional', () => {
  const prospect = {
    name: { firstName: 'Student', lastName: 'Name' },
    phone: '01700000000',
    shift: 'MORNING',
  };
  assert.equal(createProspectSchema.safeParse(prospect).success, true);
  assert.equal(
    createProspectSchema.safeParse({
      ...prospect,
      email: 'student@example.com',
    }).success,
    true,
  );
  assert.equal(
    createProspectSchema.safeParse({
      ...prospect,
      paymentInfo: { monthlyFee: 1000 },
    }).success,
    false,
  );
});
test('status updates accept ADMITTED for service-level admin admission', () => {
  for (const admissionStatus of [
    'PROSPECT',
    'FOLLOW_UP',
    'INTERESTED',
    'APPLIED',
    'NOT_INTERESTED',
    'CANCELLED',
  ])
    assert.equal(
      updateAdmissionStatusSchema.safeParse({ admissionStatus }).success,
      true,
    );
  assert.equal(
    updateAdmissionStatusSchema.safeParse({ admissionStatus: 'ADMITTED' })
      .success,
    true,
  );
});
test('admission date/year are consistent and independent of current academic year', () => {
  const data = admissionDetails({
    admissionDate: new Date('2024-01-15'),
    admissionYear: 2024,
  });
  assert.equal(data.admissionYear, 2024);
  assert.equal(data.admissionStatus, 'ADMITTED');
  assert.equal(data.studentStatus, 'ACTIVE');
  assert.throws(
    () =>
      admissionDetails({
        admissionDate: new Date('2024-01-15'),
        admissionYear: 2025,
      }),
    /must match/,
  );
});
test('admission can use saved data and rejects conflicting supplied fee years', () => {
  const payload = {
    email: 'student@example.com',
    shift: 'MORNING',
    academicInfo: {
      admissionClassId: classId,
      currentClassId: classId,
      academicYear: 2026,
      admissionDate: '2026-01-15',
      admissionYear: 2026,
    },
    paymentInfo: {
      admissionFee: 5000,
      annualFee: 3000,
      monthlyFee: 1000,
      academicYear: 2026,
    },
  };
  assert.equal(admitStudentSchema.safeParse(payload).success, true);
  assert.equal(
    admitStudentSchema.safeParse({
      ...payload,
      paymentInfo: { ...payload.paymentInfo, academicYear: 2027 },
    }).success,
    false,
  );
});
test('visits validate follow-up date and forbid assigning another teacher', () => {
  const visit = {
    visitDate: '2026-10-14T09:00:00+06:00',
    notes: 'Guardian requested a follow-up.',
    nextFollowUpDate: '2026-10-15',
  };
  assert.equal(homeVisitSchema.safeParse(visit).success, true);
  assert.equal(
    homeVisitSchema.safeParse({ ...visit, nextFollowUpDate: '2026-10-13' })
      .success,
    false,
  );
  assert.equal(
    homeVisitSchema.safeParse({ ...visit, visitedById: classId }).success,
    false,
  );
});
test('prospect and home-visit endpoints require authentication', async () => {
  await request(app).post('/api/v1/students/prospects').send({}).expect(401);
  await request(app).get('/api/v1/students/prospects').expect(401);
  await request(app)
    .post(`/api/v1/students/prospects/${classId}/admit`)
    .send({})
    .expect(401);
});
test('personal and emergency fields are optional and registration preserves leading zeros', () => {
  const input = {
    name: { firstName: 'Student', lastName: 'Name' },
    shift: 'MORNING',
    studentInfo: { birthRegistrationNumber: '00123456789012345' },
    nationality: 'Bangladeshi',
    religion: 'Optional',
    emergencyContactName: 'Relative',
    emergencyContactPhone: '01700000000',
    emergencyRelationship: 'Uncle',
    medicalNotes: 'Allergy information',
  };
  const parsed = createProspectSchema.parse(input);
  assert.equal(
    parsed.studentInfo?.birthRegistrationNumber,
    input.studentInfo.birthRegistrationNumber,
  );
  assert.equal(
    createProspectSchema.safeParse({ name: input.name, shift: input.shift })
      .success,
    true,
  );
  assert.equal(
    createProspectSchema.safeParse({
      ...input,
      studentInfo: { birthRegistrationNumber: 'ABC' },
    }).success,
    false,
  );
});
test('clients cannot supply or overwrite the admission approver', async () => {
  const { createAcademicInfoSchema, updateAcademicInfoSchema } =
    await import('../src/app/modules/academicInfo/academicInfo.validation');
  const academicInfo = {
    admissionClassId: classId,
    currentClassId: classId,
    academicYear: 2026,
  };
  assert.equal(
    createAcademicInfoSchema.safeParse({
      ...academicInfo,
      admittedById: classId,
    }).success,
    false,
  );
  assert.equal(
    updateAcademicInfoSchema.safeParse({ admittedById: classId }).success,
    false,
  );
});

test('saved student edits cannot change identity, role or admission ownership', () => {
  assert.equal(admitStudentSchema.safeParse({}).success, true);
  assert.equal(
    createProspectSchema.safeParse({ name: { firstName: 'A', lastName: 'B' } })
      .success,
    false,
  );
  assert.equal(
    updateStudentDraftSchema.safeParse({ phone: '01700000000' }).success,
    true,
  );
  for (const field of [
    'shift',
    'role',
    'userId',
    'collectedById',
    'admittedById',
    'status',
    'employmentInfo',
  ]) {
    assert.equal(
      updateStudentDraftSchema.safeParse({ [field]: 'unexpected' }).success,
      false,
    );
  }
});
