import { z } from 'zod';
import { StudentStatus } from '../../../../prisma/generated/prisma/client';
import { createPaymentInfoSchema } from '../paymentInfo/paymentInfo.validation';
const classId = z.uuid();
export const createAcademicInfoSchema = z
  .object({
    admissionDate: z.iso
      .date()
      .transform((value) => new Date(value))
      .optional(),
    admissionYear: z.number().int().min(2000).max(2100).optional(),
    studentStatus: z.enum(StudentStatus).optional(),
    admissionClassId: classId,
    currentClassId: classId,
    sectionId: z.uuid().nullable().optional(),
    rollNumber: z.number().int().positive().nullable().optional(),
    academicYear: z.number().int().min(2000).max(2100),
  })
  .strict();
export const updateAcademicInfoSchema = createAcademicInfoSchema
  .omit({ admissionClassId: true, admissionDate: true, admissionYear: true })
  .partial()
  .strict()
  .refine(
    (value) => Object.keys(value).length > 0,
    'Provide a class or academic year',
  );
export const promoteStudentSchema = z
  .object({
    currentClassId: classId,
    sectionId: z.uuid().nullable().optional(),
    rollNumber: z.number().int().positive().nullable().optional(),
    academicYear: z.number().int().min(2000).max(2100),
    paymentInfo: createPaymentInfoSchema
      .omit({ academicYear: true })
      .partial()
      .optional(),
  })
  .strict();
