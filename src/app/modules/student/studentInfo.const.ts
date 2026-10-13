import { academicInfoInclude } from '../academicInfo/academicInfo.const';
export const studentInfoInclude = {
  collectedBy: {
    select: { id: true, userId: true, profile: { select: { name: true } } },
  },
  academicInfo: { include: academicInfoInclude },
  paymentInfo: true,
  guardian: { include: { name: true, address: true } },
  localGuardian: { include: { name: true, address: true } },
} as const;
