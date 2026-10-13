import { z } from 'zod';
import {
  createAcademicInfoSchema,
  updateAcademicInfoSchema,
  promoteStudentSchema,
} from './academicInfo.validation';
export type TCreateAcademicInfo = z.infer<typeof createAcademicInfoSchema>;
export type TUpdateAcademicInfo = z.infer<typeof updateAcademicInfoSchema>;
export type TPromoteStudent = z.infer<typeof promoteStudentSchema>;
