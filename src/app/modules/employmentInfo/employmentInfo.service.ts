import { z } from 'zod';
import { UserRole } from '../../../../prisma/generated/prisma/client';
import { prisma } from '../../../../prisma/lib/prisma';
import { UserServices } from '../users/user.service';
import { AppError } from '../../errors/AppError';
import { employmentInfoSchema } from './employmentInfo.validation';
const saveEmploymentInfo = async (
  userId: string,
  actorRole: UserRole,
  payload: z.infer<typeof employmentInfoSchema>,
) => {
  const user = await UserServices.getUser(userId);
  UserServices.checkManagementRole(user.role, actorRole);
  if (user.role === 'STUDENT')
    throw new AppError(400, 'Employment info is only for staff accounts');
  if (!user.profile) throw new AppError(404, 'Staff profile not found');
  return prisma.employmentInfo.upsert({
    where: { profileId: user.profile.id },
    create: { profileId: user.profile.id, ...payload },
    update: payload,
  });
};
export const EmploymentInfoServices = { saveEmploymentInfo };
