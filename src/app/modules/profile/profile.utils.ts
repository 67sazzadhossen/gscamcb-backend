import type { Shift } from '../../../../prisma/generated/prisma/client';
import type { createProfileSchema } from './profile.validation';
import { z } from 'zod';
import { nameSchema, addressSchema } from './profile.validation';
export const addressRelation = (address: z.infer<typeof addressSchema>) => ({
  connectOrCreate: {
    where: { addressLine: address.addressLine },
    create: address,
  },
});
export const createPerson = <
  T extends {
    name: z.infer<typeof nameSchema>;
    address?: z.infer<typeof addressSchema>;
  },
>(
  person: T,
) => {
  const { name, address, ...fields } = person;
  return {
    ...fields,
    name: { create: name },
    ...(address ? { address: addressRelation(address) } : {}),
  };
};
export const updatePerson = <
  T extends {
    name: z.infer<typeof nameSchema>;
    address?: z.infer<typeof addressSchema>;
  },
>(
  person: T,
) => {
  const { name, address, ...fields } = person;
  return {
    ...fields,
    name: { update: name },
    ...(address ? { address: addressRelation(address) } : {}),
  };
};

type TPersonProfile = Omit<
  z.infer<typeof createProfileSchema>,
  'shift' | 'studentInfo' | 'employmentInfo'
> & { shift?: Shift };
export const createProfileData = (payload: TPersonProfile) => {
  const { image, presentAddress, permanentAddress, ...profile } = payload;
  return {
    ...createPerson(profile),
    ...(presentAddress
      ? { presentAddress: addressRelation(presentAddress) }
      : {}),
    ...(permanentAddress
      ? { permanentAddress: addressRelation(permanentAddress) }
      : {}),
    ...(image ? { image: { create: image } } : {}),
  };
};

export const updateProfileData = (
  payload: import('./profile.interface').TUpdateProfile,
) => {
  const { name, image, presentAddress, permanentAddress, ...profile } = payload;
  return {
    ...profile,
    ...(presentAddress
      ? { presentAddress: addressRelation(presentAddress) }
      : {}),
    ...(permanentAddress
      ? { permanentAddress: addressRelation(permanentAddress) }
      : {}),
    ...(name ? { name: { update: name } } : {}),
    ...(image ? { image: { upsert: { create: image, update: image } } } : {}),
  };
};
