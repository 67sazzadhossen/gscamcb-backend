import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app';
import {
  addressSchema,
  createProfileSchema,
  updateProfileSchema,
} from '../src/app/modules/profile/profile.validation';
import { createWaiverSchema } from '../src/app/modules/waiver/waiver.validation';
test('addresses normalize formatting and replace the duplicate raw profile field', () => {
  assert.equal(
    addressSchema.parse({ addressLine: '  Cantonment,   Mymensingh  ' })
      .addressLine,
    'Cantonment, Mymensingh',
  );
  assert.equal(
    updateProfileSchema.safeParse({ address: 'Old format' }).success,
    false,
  );
  assert.equal(
    updateProfileSchema.safeParse({
      presentAddress: { addressLine: 'Present' },
      permanentAddress: { addressLine: 'Permanent' },
    }).success,
    true,
  );
  assert.equal(
    updateProfileSchema.safeParse({ usesTransport: 'false' }).success,
    false,
  );
  assert.equal(
    createProfileSchema.safeParse({
      name: { firstName: 'Student', lastName: 'Name' },
      shift: 'MORNING',
      presentAddress: { addressLine: 'Home' },
      studentInfo: {
        guardian: {
          name: { firstName: 'Parent', lastName: 'Name' },
          address: { addressLine: 'Home' },
        },
      },
    }).success,
    true,
  );
});
test('waivers validate a single amount/percentage value and validity period', () => {
  const waiver = {
    feeType: 'MONTHLY',
    discountType: 'PERCENTAGE',
    value: '25.50',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    reason: 'Scholarship',
  };
  assert.equal(createWaiverSchema.safeParse(waiver).success, true);
  assert.equal(
    createWaiverSchema.safeParse({ ...waiver, value: 101 }).success,
    false,
  );
  assert.equal(
    createWaiverSchema.safeParse({
      ...waiver,
      discountType: 'AMOUNT',
      value: '500.25',
    }).success,
    true,
  );
  assert.equal(
    createWaiverSchema.safeParse({ ...waiver, value: 0 }).success,
    false,
  );
  assert.equal(
    createWaiverSchema.safeParse({ ...waiver, endDate: '2025-01-01' }).success,
    false,
  );
  assert.equal(
    createWaiverSchema.safeParse({ ...waiver, status: 'APPROVED' }).success,
    false,
  );
});
test('students cannot insert waivers through self-profile updates', async () => {
  assert.equal(updateProfileSchema.safeParse({ waivers: [] }).success, false);
  await request(app).post('/api/v1/waivers/26041001').send({}).expect(401);
  await request(app)
    .patch('/api/v1/waivers/11111111-1111-4111-8111-111111111111/decision')
    .send({ status: 'APPROVED' })
    .expect(401);
});
