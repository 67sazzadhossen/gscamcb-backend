import { z } from 'zod';
import { UserRole } from '../../../../prisma/generated/prisma/client';
import {
  createProspectSchema,
  admitStudentSchema,
  homeVisitSchema,
} from './student.validation';
export type TCreateProspect = z.infer<typeof createProspectSchema>;
export type TAdmitStudent = z.infer<typeof admitStudentSchema>;
export type THomeVisit = z.infer<typeof homeVisitSchema>;
export type TActor = { id: string; role: UserRole };
