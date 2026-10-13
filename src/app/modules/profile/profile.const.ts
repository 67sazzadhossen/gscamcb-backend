import { studentInfoInclude } from '../student/studentInfo.const';
export const profileInclude = {
  name: true,
  employmentInfo: true,
  studentInfo: { include: studentInfoInclude },
  presentAddress: true,
  permanentAddress: true,
  image: true,
} as const;
