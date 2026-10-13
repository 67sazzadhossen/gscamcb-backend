import { z } from 'zod';
import { guardianSchema } from '../profile/person.validation';
import { createAcademicInfoSchema } from '../academicInfo/academicInfo.validation';
import { createPaymentInfoSchema } from '../paymentInfo/paymentInfo.validation';
export const studentInfoFields = {
  birthRegistrationNumber: z
    .string()
    .trim()
    .regex(/^\d{1,32}$/, 'Birth registration number must contain digits only')
    .optional(),
  version: z.enum(['ENGLISH', 'BANGLA']).optional(),
  isCadet: z.boolean().optional(),
  usesTransport: z.boolean().optional(),
  guardian: guardianSchema.optional(),
  localGuardian: guardianSchema.optional(),
};
export const updateStudentInfoSchema = z
  .object(studentInfoFields)
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    'Provide student information',
  );
export const createStudentInfoSchema = z
  .object({
    ...studentInfoFields,
    academicInfo: createAcademicInfoSchema.optional(),
    paymentInfo: createPaymentInfoSchema.optional(),
  })
  .strict()
  .refine(
    (data) =>
      !data.academicInfo ||
      !data.paymentInfo ||
      data.academicInfo.academicYear === data.paymentInfo.academicYear,
    'Payment and academic years must match',
  );
