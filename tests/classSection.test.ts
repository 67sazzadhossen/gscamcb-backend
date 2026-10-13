import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app';
import {
  sectionSchema,
  updateSectionSchema,
} from '../src/app/modules/section/section.validation';
import {
  createAcademicInfoSchema,
  promoteStudentSchema,
} from '../src/app/modules/academicInfo/academicInfo.validation';
const classId = '11111111-1111-4111-8111-111111111111';
const sectionId = '22222222-2222-4222-8222-222222222222';
test('academic placement accepts UUID relations and positive roll numbers', () => {
  const academic = {
    admissionClassId: classId,
    currentClassId: classId,
    sectionId,
    rollNumber: 1,
    academicYear: 2026,
  };
  assert.equal(createAcademicInfoSchema.safeParse(academic).success, true);
  assert.equal(
    createAcademicInfoSchema.safeParse({
      ...academic,
      currentClassId: 'Class 1',
    }).success,
    false,
  );
  assert.equal(
    createAcademicInfoSchema.safeParse({ ...academic, rollNumber: 0 }).success,
    false,
  );
  assert.equal(
    promoteStudentSchema.safeParse({
      currentClassId: classId,
      sectionId: null,
      rollNumber: null,
      academicYear: 2027,
    }).success,
    true,
  );
});
test('section class membership cannot be changed through rename updates', () => {
  assert.equal(sectionSchema.safeParse({ name: 'A', classId }).success, true);
  assert.equal(
    updateSectionSchema.safeParse({ name: 'B', classId }).success,
    false,
  );
});
test('class and section management reject unauthenticated access', async () => {
  for (const route of ['/api/v1/classes', '/api/v1/sections']) {
    await request(app).get(route).expect(401);
    await request(app).post(route).send({ name: 'A' }).expect(401);
  }
});
