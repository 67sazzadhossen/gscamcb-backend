import { z } from 'zod';
import { UserRole } from '../../../../prisma/generated/prisma/client';
import {
  updateStudentDraftSchema,
  createProspectSchema,
  admitStudentSchema,
  homeVisitSchema,
} from './student.validation';
export type TCreateProspect = z.infer<typeof createProspectSchema>;
export type TAdmitStudent = z.infer<typeof admitStudentSchema>;
export type THomeVisit = z.infer<typeof homeVisitSchema>;
export type TActor = { id: string; role: UserRole };

export type TUpdateStudentDraft = z.infer<typeof updateStudentDraftSchema>;

import {
  createStudentInfoSchema,
  updateStudentInfoSchema,
} from './studentInfo.validation';
export type TStudentDetails = Omit<
  z.infer<typeof createStudentInfoSchema>,
  'academicInfo' | 'paymentInfo'
>;
export type TUpdateStudentInfo = z.infer<typeof updateStudentInfoSchema>;
