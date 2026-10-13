import { z } from 'zod';
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
