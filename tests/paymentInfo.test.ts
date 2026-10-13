import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createPaymentInfoSchema,
  updatePaymentInfoSchema,
} from '../src/app/modules/paymentInfo/paymentInfo.validation';
import { updateProfileSchema } from '../src/app/modules/profile/profile.validation';
const paymentInfo = {
  admissionFee: '5000.50',
  annualFee: 3000,
  monthlyFee: 1500,
  academicYear: 2026,
};
test('fees preserve two-decimal precision and reject invalid amounts', () => {
  assert.equal(
    createPaymentInfoSchema.parse(paymentInfo).admissionFee,
    '5000.50',
  );
  for (const fee of [-1, '1.234', 'NaN', '10000000000'])
    assert.equal(
      createPaymentInfoSchema.safeParse({ ...paymentInfo, monthlyFee: fee })
        .success,
      false,
    );
  assert.equal(
    createPaymentInfoSchema.safeParse({ ...paymentInfo, monthlyFee: 0 })
      .success,
    true,
  );
});
test('payment updates accept fees and year but reject academic fields', () => {
  assert.equal(
    updatePaymentInfoSchema.safeParse({
      academicYear: 2027,
      annualFee: 3500,
      monthlyFee: 1700,
    }).success,
    true,
  );
  assert.equal(
    updatePaymentInfoSchema.safeParse({
      admissionClassId: '22222222-2222-4222-8222-222222222222',
    }).success,
    false,
  );
  assert.equal(updatePaymentInfoSchema.safeParse({}).success, false);
});
test('students cannot change their own fees using profile updates', () => {
  assert.equal(updateProfileSchema.safeParse({ paymentInfo }).success, false);
});

test('academic info owns class fields and promotion keeps original admission class', async () => {
  const {
    createAcademicInfoSchema,
    updateAcademicInfoSchema,
    promoteStudentSchema,
  } = await import('../src/app/modules/academicInfo/academicInfo.validation');
  assert.equal(
    createAcademicInfoSchema.safeParse({
      admissionClassId: '11111111-1111-4111-8111-111111111111',
      currentClassId: '11111111-1111-4111-8111-111111111111',
      academicYear: 2026,
    }).success,
    true,
  );
  assert.equal(
    updateAcademicInfoSchema.safeParse({
      admissionClassId: '22222222-2222-4222-8222-222222222222',
    }).success,
    false,
  );
  assert.equal(
    promoteStudentSchema.safeParse({
      currentClassId: '22222222-2222-4222-8222-222222222222',
      academicYear: 2027,
      paymentInfo: { annualFee: '3500', monthlyFee: '1700' },
    }).success,
    true,
  );
  assert.equal(
    promoteStudentSchema.safeParse({
      currentClassId: '22222222-2222-4222-8222-222222222222',
      academicYear: 2027,
      admissionClassId: '22222222-2222-4222-8222-222222222222',
    }).success,
    false,
  );
  assert.equal(
    updateProfileSchema.safeParse({
      academicInfo: { currentClassId: '22222222-2222-4222-8222-222222222222' },
    }).success,
    false,
  );
});
