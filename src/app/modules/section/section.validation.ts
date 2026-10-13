import { z } from 'zod';
import { classSchema } from '../class/class.validation';
export const sectionSchema = classSchema.extend({ classId: z.uuid() });
export const updateSectionSchema = classSchema;
