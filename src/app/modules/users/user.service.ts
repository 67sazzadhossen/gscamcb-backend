import { studentDetailsData } from '../student/studentInfo.utils';
import { initialPassword } from '../../utils/initialPassword';
import { deleteProfile } from '../../utils/deleteProfile';
import { validatePlacement } from '../academicInfo/academicInfo.utils';
import { createProfileData } from '../profile/profile.utils';
import { prisma } from '../../../../prisma/lib/prisma';
import {
  UserRole,
  UserStatus,
} from '../../../../prisma/generated/prisma/client';
import { AppError } from '../../errors/AppError';
import { hashPassword } from '../../utils/password';
import { generateUserId } from '../../utils/generateUserId';
import { userSelect } from './user.const';
import { TCreateUser, TUpdateUser } from './user.interface';
import { listUsersSchema } from './user.validation';
const createUser = async (
  payload: TCreateUser,
  actorRole: UserRole,
  actorId?: string,
) => {
  if (
    !['SUPER_ADMIN', 'ADMIN'].includes(actorRole) &&
    !(actorRole === 'TEACHER' && payload.role === 'STUDENT')
  )
    throw new AppError(403, 'You cannot create this role');
  if (payload.role !== 'STUDENT' && !payload.email)
    throw new AppError(400, 'Email is required for staff accounts');
  if (payload.role !== 'STUDENT' && payload.profile.studentInfo)
    throw new AppError(400, 'Student info is only for students');
  if (payload.role === 'STUDENT' && payload.profile.employmentInfo)
    throw new AppError(400, 'Students cannot have employment info');
  const passwordHash = await hashPassword(initialPassword(payload.password));
  return prisma.$transaction(async (tx) => {
    const userId = await generateUserId(
      tx,
      payload.role,
      payload.profile.shift,
    );
    const { studentInfo, employmentInfo, ...profile } = payload.profile;
    const { academicInfo, paymentInfo, ...details } = studentInfo ?? {};
    if (
      academicInfo &&
      paymentInfo &&
      academicInfo.academicYear !== paymentInfo.academicYear
    )
      throw new AppError(400, 'Payment and academic years must match');
    if (academicInfo) await validatePlacement(tx, academicInfo);
    return tx.user.create({
      data: {
        userId,
        email: payload.email,
        passwordHash,
        role: payload.role,
        profile: {
          create: {
            ...createProfileData(profile),
            ...(payload.role === 'STUDENT'
              ? {
                  studentInfo: {
                    create: {
                      ...studentDetailsData(details),
                      ...(actorId
                        ? { collectedBy: { connect: { id: actorId } } }
                        : {}),
                      academicInfo: {
                        create: {
                          ...academicInfo,
                          admissionDate: null,
                          admissionYear: null,
                          admissionStatus: 'PROSPECT',
                          studentStatus: null,
                        },
                      },
                      ...(paymentInfo
                        ? { paymentInfo: { create: paymentInfo } }
                        : {}),
                    },
                  },
                }
              : {}),
            ...(employmentInfo
              ? { employmentInfo: { create: employmentInfo } }
              : {}),
          },
        },
      },
      select: userSelect,
    });
  });
};
const getUser = async (userId: string, includeDeleted = false) => {
  const user = await prisma.user.findUnique({
    where: { userId },
    select: userSelect,
  });
  if (!user || (user.isDeleted && !includeDeleted))
    throw new AppError(404, 'User not found');
  return user;
};
const listUsers = async (query: unknown, isDeleted = false) => {
  const { page, limit, role, shift, status } = listUsersSchema.parse(query);
  const where = {
    isDeleted,
    role,
    status,
    ...(shift ? { profile: { is: { shift } } } : {}),
  };
  const [data, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      select: userSelect,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);
  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};
const checkManagementRole = (targetRole: UserRole, actorRole: UserRole) => {
  if (!['SUPER_ADMIN', 'ADMIN'].includes(actorRole))
    throw new AppError(403, 'Administrator access required');
};
const updateUser = async (
  userId: string,
  payload: TUpdateUser,
  actorRole: UserRole,
) => {
  const user = await getUser(userId);
  checkManagementRole(user.role, actorRole);
  return prisma.user.update({
    where: { userId },
    data: payload,
    select: userSelect,
  });
};
const seedSuperAdmin = async (payload: Omit<TCreateUser, 'role'>) => {
  const existing = await prisma.user.findUnique({
    where: { email: payload.email },
  });
  if (existing) {
    if (
      existing.role !== UserRole.SUPER_ADMIN ||
      existing.status !== UserStatus.ACTIVE ||
      existing.isDeleted
    )
      throw new AppError(
        409,
        'Seed email belongs to a different or blocked account',
      );
    return { created: false, user: await getUser(existing.userId) };
  }
  return {
    created: true,
    user: await createUser(
      { ...payload, role: UserRole.SUPER_ADMIN },
      UserRole.SUPER_ADMIN,
    ),
  };
};
const recycleUser = async (userId: string, actorRole: UserRole) => {
  const user = await getUser(userId);
  checkManagementRole(user.role, actorRole);
  return prisma.user.update({
    where: { userId },
    data: { isDeleted: true, deletedAt: new Date() },
    select: userSelect,
  });
};
const restoreUser = async (userId: string, actorRole: UserRole) => {
  const user = await getUser(userId, true);
  checkManagementRole(user.role, actorRole);
  if (!user.isDeleted)
    throw new AppError(409, 'Account is not in the recycle bin');
  const result = await prisma.user.updateMany({
    where: { id: user.id, isDeleted: true },
    data: { isDeleted: false, deletedAt: null },
  });
  if (result.count !== 1)
    throw new AppError(409, 'Account state changed; refresh the recycle bin');
  return getUser(userId);
};
const permanentlyDeleteUser = async (userId: string, actorRole: UserRole) => {
  const user = await getUser(userId, true);
  checkManagementRole(user.role, actorRole);
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM users WHERE id = ${user.id}::uuid FOR UPDATE`;
    const current = await tx.user.findUniqueOrThrow({
      where: { id: user.id },
      select: userSelect,
    });
    if (!current.isDeleted)
      throw new AppError(
        409,
        'Move the account to the recycle bin before permanent deletion',
      );
    const profile = current.profile;
    if (profile) await deleteProfile(tx, profile);
    await tx.user.delete({ where: { id: current.id } });
    return null;
  });
};
export const UserServices = {
  checkManagementRole,
  recycleUser,
  restoreUser,
  permanentlyDeleteUser,
  createUser,
  getUser,
  listUsers,
  updateUser,
  seedSuperAdmin,
};
