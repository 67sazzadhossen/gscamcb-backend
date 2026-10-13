import { academicInfoInclude } from '../academicInfo/academicInfo.const';
export const profileInclude = {
  name: true,
  presentAddress: true,
  permanentAddress: true,
  paymentInfo: true,
  academicInfo: { include: academicInfoInclude },
  image: true,
  guardian: { include: { name: true, address: true } },
  localGuardian: { include: { name: true, address: true } },
} as const;
