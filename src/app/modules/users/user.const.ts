import { profileInclude } from '../profile/profile.const';
export const ROLE_CODES = {
  SUPER_ADMIN: '01',
  ADMIN: '02',
  TEACHER: '03',
  STUDENT: '04',
  ACCOUNTANT: '05',
  STAFF: '06',
} as const;
export const SHIFT_CODES = { MORNING: '1', DAY: '2' } as const;
export const userSelect = {
  id: true,
  userId: true,
  email: true,
  role: true,
  status: true,
  isDeleted: true,
  deletedAt: true,
  mustChangePassword: true,
  createdAt: true,
  updatedAt: true,
  profile: { include: profileInclude },
} as const;
