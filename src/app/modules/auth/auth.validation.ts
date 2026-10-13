import { z } from 'zod';
import { userIdSchema } from '../users/user.validation';
export const loginSchema = z
  .object({
    userId: userIdSchema,
    password: z.string().min(1).max(72),
  })
  .strict();
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1).max(72),
    newPassword: z.string().min(8).max(72),
  })
  .strict()
  .refine(
    (data) => data.currentPassword !== data.newPassword,
    'New password must differ from current password',
  );
