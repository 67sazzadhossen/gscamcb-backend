import { createPerson, updatePerson, addressRelation } from './profile.utils';
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
  const {
    guardian,
    localGuardian,
    name,
    image,
    presentAddress,
    permanentAddress,
    ...profile
  } = payload;
  return prisma.profile.update({
    where: { userId: user.id },
    data: {
      ...profile,
      ...(presentAddress
        ? { presentAddress: addressRelation(presentAddress) }
        : {}),
      ...(permanentAddress
        ? { permanentAddress: addressRelation(permanentAddress) }
        : {}),
      ...(name ? { name: { update: name } } : {}),
      ...(image ? { image: { upsert: { create: image, update: image } } } : {}),
      ...(guardian
        ? {
            guardian: {
              upsert: {
                create: createPerson(guardian),
                update: updatePerson(guardian),
              },
            },
          }
        : {}),
      ...(localGuardian
        ? {
            localGuardian: {
              upsert: {
                create: createPerson(localGuardian),
                update: updatePerson(localGuardian),
              },
            },
          }
        : {}),
    },
    include: profileInclude,
  });
};
export const ProfileServices = { getProfile, updateProfile };
