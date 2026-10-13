import { z } from 'zod';
import { createUserSchema, updateUserSchema } from './user.validation';
export type TCreateUser = z.infer<typeof createUserSchema>;
export type TUpdateUser = z.infer<typeof updateUserSchema>;
