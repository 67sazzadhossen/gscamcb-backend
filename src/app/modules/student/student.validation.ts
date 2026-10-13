import { z } from 'zod';
import {
  AdmissionStatus,
  Shift,
} from '../../../../prisma/generated/prisma/client';
import { createProfileSchema } from '../profile/profile.validation';
import { createAcademicInfoSchema } from '../academicInfo/academicInfo.validation';
import { createPaymentInfoSchema } from '../paymentInfo/paymentInfo.validation';
const prospectStatuses = z.enum(AdmissionStatus).exclude(['ADMITTED']);
export const createProspectSchema = createProfileSchema
  .omit({ shift: true, academicInfo: true, paymentInfo: true })
  .extend({ shift: z.enum(Shift).optional() })
  .strict();
export const updateAdmissionStatusSchema = z
  .object({ admissionStatus: prospectStatuses })
  .strict();
export const listProspectsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  admissionStatus: z.enum(AdmissionStatus).optional(),
});
export const admitStudentSchema = z
  .object({
    email: z.email().trim().toLowerCase(),
    password: z.string().min(8).max(72).optional(),
    shift: z.enum(Shift),
    academicInfo: createAcademicInfoSchema,
    paymentInfo: createPaymentInfoSchema.optional(),
  })
  .strict()
  .refine(
    (data) =>
      !data.paymentInfo ||
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
