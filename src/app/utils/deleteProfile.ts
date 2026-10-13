import { Prisma } from '../../../prisma/generated/prisma/client';
export const deleteProfile = async (
  tx: Prisma.TransactionClient,
  profile: {
    id: string;
    nameId: string;
    presentAddressId?: string | null;
    permanentAddressId?: string | null;
    guardian: { nameId: string; addressId?: string | null } | null;
    localGuardian: { nameId: string; addressId?: string | null } | null;
  },
) => {
  const ids = [
    profile.nameId,
    profile.guardian?.nameId,
    profile.localGuardian?.nameId,
  ].filter((id): id is string => Boolean(id));
  const addressIds = [
    profile.presentAddressId,
    profile.permanentAddressId,
    profile.guardian?.addressId,
    profile.localGuardian?.addressId,
  ].filter((id): id is string => Boolean(id));
  await tx.profile.delete({ where: { id: profile.id } });
  await tx.name.deleteMany({
    where: {
      id: { in: ids },
      profile: null,
      guardian: null,
      localGuardian: null,
    },
  });
  await tx.address.deleteMany({
    where: {
      id: { in: addressIds },
      presentProfiles: { none: {} },
      permanentProfiles: { none: {} },
      guardians: { none: {} },
      localGuardians: { none: {} },
    },
  });
};
