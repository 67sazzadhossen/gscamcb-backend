import { prisma } from '../../../../prisma/lib/prisma';
import { getStudentProfile } from '../../utils/studentProfile';
import { AppError } from '../../errors/AppError';
import { TCreateWaiver, TDecideWaiver } from './waiver.interface';
const createWaiver = async (
  userId: string,
  payload: TCreateWaiver,
  requestedById: string,
) => {
  const profile = await getStudentProfile(userId);
  return prisma.waiver.create({
    data: { profileId: profile.id, requestedById, ...payload },
  });
};
const listWaivers = async (userId: string) => {
  const profile = await getStudentProfile(userId);
  return prisma.waiver.findMany({
    where: { profileId: profile.id },
    orderBy: { createdAt: 'desc' },
  });
};
const decideWaiver = (
  id: string,
  payload: TDecideWaiver,
  decidedById: string,
) =>
  prisma.$transaction(async (tx) => {
    const waiver = await tx.waiver.findUnique({
      where: { id },
      include: {
        profile: {
          select: { isDeleted: true, user: { select: { isDeleted: true } } },
        },
      },
    });
    if (!waiver || waiver.profile.isDeleted || waiver.profile.user?.isDeleted)
      throw new AppError(404, 'Waiver not found');
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${waiver.profileId + waiver.feeType}))::text`;
    const current = await tx.waiver.findUniqueOrThrow({ where: { id } });
    if (
      payload.status === 'REVOKED'
        ? current.status !== 'APPROVED'
        : current.status !== 'PENDING'
    )
      throw new AppError(409, 'Waiver has already been decided');
    if (payload.status === 'APPROVED') {
      const overlapping = await tx.waiver.findFirst({
        where: {
          id: { not: id },
          profileId: current.profileId,
          feeType: current.feeType,
          status: 'APPROVED',
          ...(current.endDate ? { startDate: { lte: current.endDate } } : {}),
          OR: [{ endDate: null }, { endDate: { gte: current.startDate } }],
        },
      });
      if (overlapping)
        throw new AppError(
          409,
          'An approved waiver already covers this fee and period',
        );
    }
    return tx.waiver.update({
      where: { id },
      data: { status: payload.status, decidedById, decidedAt: new Date() },
    });
  });
export const WaiverServices = { createWaiver, listWaivers, decideWaiver };
