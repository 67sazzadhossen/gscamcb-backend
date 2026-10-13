import { z } from 'zod';
import {
  AdmissionStatus,
  Shift,
} from '../../../../prisma/generated/prisma/client';
import { createProfileSchema } from '../profile/profile.validation';
import { createAcademicInfoSchema } from '../academicInfo/academicInfo.validation';
import { createPaymentInfoSchema } from '../paymentInfo/paymentInfo.validation';
export const createProspectSchema = createProfileSchema
  .omit({ employmentInfo: true })
  .extend({
    email: z.email().trim().toLowerCase().optional(),
    password: z.string().min(8).max(72).optional(),
  })
  .strict();
export const updateStudentDraftSchema = createProfileSchema
  .omit({ shift: true, employmentInfo: true })
  .partial()
  .extend({ email: z.email().trim().toLowerCase().optional() })
  .strict()
  .refine((data) => Object.keys(data).length > 0, 'Provide student details');
export const updateAdmissionStatusSchema = z
  .object({ admissionStatus: z.enum(AdmissionStatus) })
  .strict();
export const listProspectsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  admissionStatus: z.enum(AdmissionStatus).optional(),
});
export const admitStudentSchema = z
  .object({
    email: z.email().trim().toLowerCase().optional(),
    shift: z.enum(Shift).optional(),
    academicInfo: createAcademicInfoSchema.optional(),
    paymentInfo: createPaymentInfoSchema.optional(),
  })
  .strict()
  .refine(
    (data) =>
      !data.paymentInfo ||
      !data.academicInfo ||
      data.paymentInfo.academicYear === data.academicInfo.academicYear,
    'Payment and academic years must match',
  );
export const homeVisitSchema = z
  .object({
    visitDate: z.iso
      .datetime({ offset: true })
      .transform((value) => new Date(value))
      .optional(),
    notes: z.string().trim().min(1).max(4000),
    nextFollowUpDate: z.iso
      .date()
      .transform((value) => new Date(value))
      .optional(),
  })
  .strict()
  .refine(
    (data) =>
      !data.nextFollowUpDate ||
      data.nextFollowUpDate.getTime() + 86400000 >
        (data.visitDate ?? new Date()).getTime(),
    'Follow-up date cannot be before the visit',
  );
