import { z } from 'zod';
import { updateProfileSchema } from './profile.validation';

export type TUpdateProfile = z.infer<typeof updateProfileSchema>;
