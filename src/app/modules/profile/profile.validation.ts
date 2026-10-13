import { createStudentInfoSchema } from '../student/studentInfo.validation';
import { employmentInfoSchema } from '../employmentInfo/employmentInfo.validation';
import { z } from 'zod';
import { Shift } from '../../../../prisma/generated/prisma/client';
import { nameSchema, imageSchema, addressSchema } from './person.validation';
export {
  nameSchema,
  imageSchema,
  addressSchema,
  guardianSchema,
} from './person.validation';

export const profileFields = {
  nationality: z.string().trim().max(80).optional(),
  religion: z.string().trim().max(80).optional(),
  emergencyContactName: z.string().trim().max(120).optional(),
  emergencyContactPhone: z.string().trim().max(30).optional(),
  emergencyRelationship: z.string().trim().max(80).optional(),
  medicalNotes: z.string().trim().max(2000).optional(),
  name: nameSchema.optional(),
  image: imageSchema.optional(),
  phone: z.string().trim().max(30).optional(),
  presentAddress: addressSchema.optional(),
  permanentAddress: addressSchema.optional(),
  dateOfBirth: z.iso
    .date()
    .transform((value) => new Date(value))
    .optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  bloodGroup: z
    .enum([
      'A_POSITIVE',
      'A_NEGATIVE',
      'B_POSITIVE',
      'B_NEGATIVE',
      'AB_POSITIVE',
      'AB_NEGATIVE',
      'O_POSITIVE',
      'O_NEGATIVE',
    ])
    .optional(),
};

export const createProfileSchema = z
  .object({
    ...profileFields,
    name: nameSchema,
    shift: z.enum(Shift),
    employmentInfo: employmentInfoSchema.optional(),
    studentInfo: createStudentInfoSchema.optional(),
  })
  .strict();

export const updateProfileSchema = z
  .object(profileFields)
  .strict()
  .refine(
    (value) => Object.keys(value).length > 0,
    'Provide at least one profile field',
  );
