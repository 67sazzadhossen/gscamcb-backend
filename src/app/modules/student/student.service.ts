import { UserServices } from '../users/user.service';
import { deleteProfile } from '../../utils/deleteProfile';
import { prisma } from '../../../../prisma/lib/prisma';
import { AppError } from '../../errors/AppError';
import config from '../../config';
import { hashPassword } from '../../utils/password';
import { generateUserId } from '../../utils/generateUserId';
import { profileInclude } from '../profile/profile.const';
import { createProfileData } from '../profile/profile.utils';
import {
  validatePlacement,
  admissionDetails,
} from '../academicInfo/academicInfo.utils';
import { userSelect } from '../users/user.const';
import { listProspectsSchema } from './student.validation';
import {
  TCreateProspect,
  TAdmitStudent,
  THomeVisit,
  TActor,
} from './student.interface';
import { AdmissionStatus } from '../../../../prisma/generated/prisma/client';
const accessibleStudent = async (
  profileId: string,
  actor: TActor,
  includeDeleted = false,
) => {
  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    include: {
      ...profileInclude,
      user: { select: { role: true, userId: true, isDeleted: true } },
    },
  });
  if (
    !profile ||
    (!includeDeleted && (profile.isDeleted || profile.user?.isDeleted)) ||
    !profile.academicInfo ||
    (profile.user && profile.user.role !== 'STUDENT')
  )
    throw new AppError(404, 'Student not found');
  if (actor.role === 'TEACHER' && profile.collectedById !== actor.id)
    throw new AppError(403, 'You can only manage students you collected');
  return profile;
};
const createProspect = (payload: TCreateProspect, actor: TActor) =>
  prisma.profile.create({
    data: {
      ...createProfileData(payload),
      collectedBy: { connect: { id: actor.id } },
      academicInfo: { create: { admissionStatus: 'PROSPECT' } },
    },
    include: profileInclude,
  });
const listProspects = async (
  query: unknown,
  actor: TActor,
  deleted = false,
) => {
  const { page, limit, admissionStatus } = listProspectsSchema.parse(query);
  const where = {
    ...(actor.role === 'TEACHER' ? { collectedById: actor.id } : {}),
    academicInfo: { is: { admissionStatus } },
    AND: deleted
      ? [{ OR: [{ isDeleted: true }, { user: { is: { isDeleted: true } } }] }]
      : [
          {
            isDeleted: false,
            OR: [{ userId: null }, { user: { is: { isDeleted: false } } }],
          },
        ],
    OR: [{ userId: null }, { user: { is: { role: 'STUDENT' as const } } }],
  };
  const [data, total] = await prisma.$transaction([
    prisma.profile.findMany({
      where,
      include: profileInclude,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.profile.count({ where }),
  ]);
  return { data, meta: { page, limit, total } };
};
const getStudent = (profileId: string, actor: TActor) =>
  accessibleStudent(profileId, actor);
const updateAdmissionStatus = async (
  profileId: string,
  status: AdmissionStatus,
  actor: TActor,
) => {
  const profile = await accessibleStudent(profileId, actor);
  if (profile.userId || profile.academicInfo!.admissionStatus === 'ADMITTED')
    throw new AppError(400, 'Use student status for admitted students');
  const changed = await prisma.academicInfo.updateMany({
    where: {
      profileId,
      admissionStatus: { not: 'ADMITTED' },
      profile: { userId: null },
    },
    data: { admissionStatus: status },
  });
  if (changed.count !== 1)
    throw new AppError(409, 'Admission state changed; refresh the student');
  return prisma.academicInfo.findUniqueOrThrow({ where: { profileId } });
};
const admitStudent = async (
  profileId: string,
  payload: TAdmitStudent,
  actor: TActor,
) => {
  if (!['SUPER_ADMIN', 'ADMIN'].includes(actor.role))
    throw new AppError(403, 'Only administrators can admit students');
  await accessibleStudent(profileId, actor);
  const password = payload.password ?? config.default_password;
  if (!password) throw new AppError(400, 'Provide an initial password');
  const passwordHash = await hashPassword(password);
  return prisma.$transaction(async (tx) => {
    const profile = await tx.profile.findUniqueOrThrow({
      where: { id: profileId },
      include: { academicInfo: true },
    });
    if (profile.userId || profile.academicInfo?.admissionStatus === 'ADMITTED')
      throw new AppError(409, 'Student is already admitted');
    await validatePlacement(tx, payload.academicInfo);
    const userId = await generateUserId(tx, 'STUDENT', payload.shift);
    const account = await tx.user.create({
      data: { userId, email: payload.email, passwordHash, role: 'STUDENT' },
    });
    const connected = await tx.profile.updateMany({
      where: { id: profileId, userId: null },
      data: { userId: account.id, shift: payload.shift },
    });
    if (connected.count !== 1)
      throw new AppError(409, 'Student is already admitted');
    await tx.academicInfo.update({
      where: { profileId },
      data: {
        ...payload.academicInfo,
        ...admissionDetails(payload.academicInfo),
        admittedById: actor.id,
      },
    });
    if (payload.paymentInfo)
      await tx.paymentInfo.create({
        data: { profileId, ...payload.paymentInfo },
      });
    return tx.user.findUniqueOrThrow({
      where: { id: account.id },
      select: userSelect,
    });
  });
};
const addHomeVisit = async (
  profileId: string,
  payload: THomeVisit,
  actor: TActor,
) => {
  await accessibleStudent(profileId, actor);
  return prisma.homeVisit.create({
    data: { profileId, visitedById: actor.id, ...payload },
  });
};
const listHomeVisits = async (profileId: string, actor: TActor) => {
  await accessibleStudent(profileId, actor);
  return prisma.homeVisit.findMany({
    where: { profileId },
    include: {
      visitedBy: {
        select: { id: true, userId: true, profile: { select: { name: true } } },
      },
    },
    orderBy: { visitDate: 'desc' },
  });
};
const checkRecycleAccess = (actor: TActor) => {
  if (!['SUPER_ADMIN', 'ADMIN'].includes(actor.role))
    throw new AppError(403, 'Administrator access required');
};
const recycleStudent = async (profileId: string, actor: TActor) => {
  checkRecycleAccess(actor);
  const profile = await accessibleStudent(profileId, actor);
  if (profile.user)
    return UserServices.recycleUser(profile.user.userId, actor.role);
  return prisma.profile.update({
    where: { id: profileId },
    data: { isDeleted: true, deletedAt: new Date() },
    include: profileInclude,
  });
};
const restoreStudent = async (profileId: string, actor: TActor) => {
  checkRecycleAccess(actor);
  const profile = await accessibleStudent(profileId, actor, true);
  if (profile.user)
    return UserServices.restoreUser(profile.user.userId, actor.role);
  if (!profile.isDeleted)
    throw new AppError(409, 'Student is not in the recycle bin');
  const result = await prisma.profile.updateMany({
    where: { id: profileId, userId: null, isDeleted: true },
    data: { isDeleted: false, deletedAt: null },
  });
  if (result.count !== 1)
    throw new AppError(409, 'Student state changed; refresh the recycle bin');
  return accessibleStudent(profileId, actor);
};
const permanentlyDeleteStudent = async (profileId: string, actor: TActor) => {
  checkRecycleAccess(actor);
  const profile = await accessibleStudent(profileId, actor, true);
  if (profile.user)
    return UserServices.permanentlyDeleteUser(profile.user.userId, actor.role);
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM profiles WHERE id = ${profileId}::uuid FOR UPDATE`;
    const current = await tx.profile.findUniqueOrThrow({
      where: { id: profileId },
      include: profileInclude,
    });
    if (!current.isDeleted || current.userId)
      throw new AppError(
        409,
        'Only saved prospects in the recycle bin can be permanently deleted here',
      );
    await deleteProfile(tx, current);
    return null;
  });
};
export const StudentServices = {
  recycleStudent,
  restoreStudent,
  permanentlyDeleteStudent,
  createProspect,
  listProspects,
  getStudent,
  updateAdmissionStatus,
  admitStudent,
  addHomeVisit,
  listHomeVisits,
};
