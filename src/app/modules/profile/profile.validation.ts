import { createAcademicInfoSchema } from '../academicInfo/academicInfo.validation';
import { createPaymentInfoSchema } from '../paymentInfo/paymentInfo.validation';
import { z } from 'zod';
import { Shift } from '../../../../prisma/generated/prisma/client';
const nameField = z.string().trim().min(1).max(120);

export const nameSchema = z
  .object({
    firstName: nameField,
    middleName: z.string().trim().max(120).optional(),
    lastName: nameField,
    bengaliFirstName: z.string().trim().max(120).optional(),
    bengaliMiddleName: z.string().trim().max(120).optional(),
    bengaliLastName: z.string().trim().max(120).optional(),
  })
  .strict();
export const imageSchema = z
  .object({ displayUrl: z.url(), publicId: z.string().trim().min(1).max(255) })
  .strict();
export const addressSchema = z
  .object({
    addressLine: z
      .string()
      .trim()
      .min(1)
      .max(500)
      .transform((value) => value.replace(/\s+/g, ' ')),
  })
  .strict();
export const guardianSchema = z
  .object({
    name: nameSchema,
    relationship: z.string().trim().max(80).optional(),
    phone: z.string().trim().max(30).optional(),
    email: z.email().trim().toLowerCase().optional(),
    address: addressSchema.optional(),
    occupation: z.string().trim().max(120).optional(),
  })
  .strict();

export const profileFields = {
  birthRegistrationNumber: z
    .string()
    .trim()
    .regex(/^\d{1,32}$/, 'Birth registration number must contain digits only')
    .optional(),
  nationality: z.string().trim().max(80).optional(),
  religion: z.string().trim().max(80).optional(),
  emergencyContactName: z.string().trim().max(120).optional(),
  emergencyContactPhone: z.string().trim().max(30).optional(),
  emergencyRelationship: z.string().trim().max(80).optional(),
  medicalNotes: z.string().trim().max(2000).optional(),
  name: nameSchema.optional(),
  image: imageSchema.optional(),
  version: z.enum(['ENGLISH', 'BANGLA']).optional(),
  isCadet: z.boolean().optional(),
  guardian: guardianSchema.optional(),
  localGuardian: guardianSchema.optional(),
  phone: z.string().trim().max(30).optional(),
  presentAddress: addressSchema.optional(),
  permanentAddress: addressSchema.optional(),
  usesTransport: z.boolean().optional(),
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
    paymentInfo: createPaymentInfoSchema.optional(),
    academicInfo: createAcademicInfoSchema.optional(),
  })
  .strict();

export const updateProfileSchema = z
  .object(profileFields)
  .strict()
  .refine(
    (value) => Object.keys(value).length > 0,
    'Provide at least one profile field',
  );
