import { z } from 'zod';
import {
  UserRole,
  Shift,
  UserStatus,
} from '../../../../prisma/generated/prisma/client';
import { createProfileSchema } from '../profile/profile.validation';
export const createUserSchema = z
  .object({
    email: z.email().trim().toLowerCase().optional(),
    password: z.string().min(8).max(72).optional(),
    role: z.enum(UserRole),
    profile: createProfileSchema,
  })
  .strict()
  .refine(
    (data) => data.role === 'STUDENT' || Boolean(data.email),
    'Email is required for staff accounts',
  )
  .refine(
    (data) => data.role !== 'STUDENT' || !data.profile.employmentInfo,
    'Students cannot have employment info',
  )
  .refine(
    (data) => data.role === 'STUDENT' || !data.profile.studentInfo,
    'Student info is only for students',
  );
export const updateUserSchema = z
  .object({
    email: z.email().trim().toLowerCase().optional(),
    status: z.enum(UserStatus).optional(),
  })
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    'Provide at least one user field',
  );

export const userIdSchema = z
  .string()
  .regex(/^\d{8}$/, 'User ID must contain exactly 8 digits');
export const listUsersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  role: z.enum(UserRole).optional(),
  shift: z.enum(Shift).optional(),
  status: z.enum(UserStatus).optional(),
});
