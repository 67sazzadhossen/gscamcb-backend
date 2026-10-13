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
  'shift' | 'academicInfo' | 'paymentInfo'
> & { shift?: Shift };
export const createProfileData = (payload: TPersonProfile) => {
  const {
    guardian,
    localGuardian,
    image,
    presentAddress,
    permanentAddress,
    ...profile
  } = payload;
  return {
    ...createPerson(profile),
    ...(presentAddress
      ? { presentAddress: addressRelation(presentAddress) }
      : {}),
    ...(permanentAddress
      ? { permanentAddress: addressRelation(permanentAddress) }
      : {}),
    ...(image ? { image: { create: image } } : {}),
    ...(guardian ? { guardian: { create: createPerson(guardian) } } : {}),
    ...(localGuardian
      ? { localGuardian: { create: createPerson(localGuardian) } }
      : {}),
  };
};
