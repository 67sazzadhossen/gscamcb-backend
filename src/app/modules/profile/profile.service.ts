import { updateProfileData } from './profile.utils';
import { prisma } from '../../../../prisma/lib/prisma';
import { AppError } from '../../errors/AppError';
import { UserServices } from '../users/user.service';
import { profileInclude } from './profile.const';
import { TUpdateProfile } from './profile.interface';
const getProfile = async (userId: string) => {
  const user = await UserServices.getUser(userId);
  if (!user.profile) throw new AppError(404, 'Profile not found');
  return user.profile;
};
const updateProfile = async (userId: string, payload: TUpdateProfile) => {
  const user = await UserServices.getUser(userId);
  if (!user.profile) throw new AppError(404, 'Profile not found');
  return prisma.profile.update({
    where: { userId: user.id },
    data: updateProfileData(payload),
    include: profileInclude,
  });
};
export const ProfileServices = { getProfile, updateProfile };
