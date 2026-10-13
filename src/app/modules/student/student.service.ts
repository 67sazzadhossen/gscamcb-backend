import { studentInfoInclude } from './studentInfo.const';
import { studentDetailsData } from './studentInfo.utils';
import { UserServices } from '../users/user.service';
import { deleteProfile } from '../../utils/deleteProfile';
import { prisma } from '../../../../prisma/lib/prisma';
import { AppError } from '../../errors/AppError';
import { initialPassword } from '../../utils/initialPassword';
import { hashPassword } from '../../utils/password';
import { generateUserId } from '../../utils/generateUserId';
import { updateProfileData } from '../profile/profile.utils';
import { profileInclude } from '../profile/profile.const';
import {
  validatePlacement,
  admissionDetails,
} from '../academicInfo/academicInfo.utils';
import { userSelect } from '../users/user.const';
import { listProspectsSchema } from './student.validation';
import {
  TUpdateStudentDraft,
  TUpdateStudentInfo,
  TCreateProspect,
  TAdmitStudent,
  THomeVisit,
  TActor,
} from './student.interface';
import { AdmissionStatus } from '../../../../prisma/generated/prisma/client';
const studentInclude = {
  ...profileInclude,
  user: {
    select: {
      id: true,
      role: true,
      userId: true,
      email: true,
      isDeleted: true,
    },
  },
} as const;
const accessibleStudent = async (
  profileId: string,
  actor: TActor,
  includeDeleted = false,
) => {
  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    include: studentInclude,
  });
  if (
    !profile ||
    (!includeDeleted && (profile.isDeleted || profile.user?.isDeleted)) ||
    !profile.studentInfo?.academicInfo ||
    (profile.user && profile.user.role !== 'STUDENT')
  )
    throw new AppError(404, 'Student not found');
  if (
    actor.role === 'TEACHER' &&
    profile.studentInfo!.collectedById !== actor.id
  )
    throw new AppError(403, 'You can only manage students you collected');
  return profile;
};
const createProspect = async (payload: TCreateProspect, actor: TActor) => {
  const { email, password, ...profile } = payload;
  const user = await UserServices.createUser(
    { email, password, role: 'STUDENT', profile },
    actor.role,
    actor.id,
  );
  return {
    ...user.profile!,
    user: {
      id: user.id,
      userId: user.userId,
      email: user.email,
      role: user.role,
    },
  };
};
const listProspects = async (
  query: unknown,
  actor: TActor,
  deleted = false,
) => {
  const { page, limit, admissionStatus } = listProspectsSchema.parse(query);
  const where = {
    studentInfo: {
      is: {
        ...(actor.role === 'TEACHER' ? { collectedById: actor.id } : {}),
        academicInfo: { is: { admissionStatus } },
      },
    },
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
      include: studentInclude,
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
  if (status === 'ADMITTED') return admitStudent(profileId, {}, actor);
  const profile = await accessibleStudent(profileId, actor);
  if (profile.studentInfo!.academicInfo!.admissionStatus === 'ADMITTED')
    throw new AppError(400, 'Use student status for admitted students');
  const changed = await prisma.academicInfo.updateMany({
    where: {
      studentInfoId: profile.studentInfo!.id,
      admissionStatus: { not: 'ADMITTED' },
    },
    data: { admissionStatus: status },
  });
  if (changed.count !== 1)
    throw new AppError(409, 'Admission state changed; refresh the student');
  return prisma.academicInfo.findUniqueOrThrow({
    where: { studentInfoId: profile.studentInfo!.id },
  });
};
const admitStudent = async (
  profileId: string,
  payload: TAdmitStudent,
  actor: TActor,
) => {
  if (!['SUPER_ADMIN', 'ADMIN'].includes(actor.role))
    throw new AppError(403, 'Only administrators can admit students');
  await accessibleStudent(profileId, actor);
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM profiles WHERE id = ${profileId}::uuid FOR UPDATE`;
    const profile = await tx.profile.findUniqueOrThrow({
      where: { id: profileId },
      include: studentInclude,
    });
    const stored = profile.studentInfo?.academicInfo;
    if (!stored || stored.admissionStatus === 'ADMITTED')
      throw new AppError(409, 'Student is already admitted');
    if (profile.isDeleted || profile.user?.isDeleted)
      throw new AppError(404, 'Student not found');
    const placement = payload.academicInfo ?? stored;
    const fees = payload.paymentInfo ?? profile.studentInfo?.paymentInfo;
    const shift = payload.shift ?? profile.shift;
    if (
      !shift ||
      !placement.admissionClassId ||
      !placement.currentClassId ||
      placement.academicYear === null
    )
      throw new AppError(
        400,
        'Complete shift, classes and academic year before admission',
      );
    if (profile.user && payload.shift && profile.shift !== payload.shift)
      throw new AppError(
        400,
        'Shift cannot change during admission; the student ID is already assigned',
      );
    if (!fees)
      throw new AppError(
        400,
        'Complete admission, annual and monthly fee settings before admission',
      );
    if (fees.academicYear !== placement.academicYear)
      throw new AppError(400, 'Payment and academic years must match');
    await validatePlacement(tx, {
      admissionClassId: placement.admissionClassId,
      currentClassId: placement.currentClassId,
      sectionId: placement.sectionId,
    });
    let accountId = profile.userId;
    if (!accountId) {
      const userId = await generateUserId(tx, 'STUDENT', shift);
      const account = await tx.user.create({
        data: {
          userId,
          email: payload.email,
          passwordHash: await hashPassword(initialPassword()),
          role: 'STUDENT',
        },
      });
      accountId = account.id;
      await tx.profile.update({
        where: { id: profileId },
        data: { userId: accountId, shift },
      });
    } else if (payload.email)
      await tx.user.update({
        where: { id: accountId },
        data: { email: payload.email },
      });
    const dates = admissionDetails({
      admissionDate: placement.admissionDate ?? undefined,
      admissionYear: placement.admissionYear ?? undefined,
    });
    await tx.academicInfo.update({
      where: { studentInfoId: profile.studentInfo!.id },
      data: {
        admissionClassId: placement.admissionClassId,
        currentClassId: placement.currentClassId,
        sectionId: placement.sectionId,
        rollNumber: placement.rollNumber,
        academicYear: placement.academicYear,
        ...dates,
        admittedById: actor.id,
      },
    });
    if (payload.paymentInfo)
      await tx.paymentInfo.upsert({
        where: { studentInfoId: profile.studentInfo!.id },
        create: {
          studentInfoId: profile.studentInfo!.id,
          ...payload.paymentInfo,
        },
        update: payload.paymentInfo,
      });
    return tx.user.findUniqueOrThrow({
      where: { id: accountId },
      select: userSelect,
    });
  });
};
const updateStudentDraft = async (
  profileId: string,
  payload: TUpdateStudentDraft,
  actor: TActor,
) => {
  await accessibleStudent(profileId, actor);
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM profiles WHERE id = ${profileId}::uuid FOR UPDATE`;
    const current = await tx.profile.findUniqueOrThrow({
      where: { id: profileId },
      include: studentInclude,
    });
    if (current.isDeleted || current.user?.isDeleted)
      throw new AppError(404, 'Student not found');
    if (current.studentInfo?.academicInfo?.admissionStatus === 'ADMITTED')
      throw new AppError(400, 'Use management endpoints for admitted students');
    const { studentInfo, email, ...profile } = payload;
    const { academicInfo, paymentInfo, ...details } = studentInfo ?? {};
    const year =
      academicInfo?.academicYear ??
      current.studentInfo?.academicInfo?.academicYear;
    const feeYear =
      paymentInfo?.academicYear ??
      current.studentInfo?.paymentInfo?.academicYear;
    if (year != null && feeYear != null && year !== feeYear)
      throw new AppError(400, 'Payment and academic years must match');
    if (academicInfo) await validatePlacement(tx, academicInfo);
    if (email && current.userId)
      await tx.user.update({ where: { id: current.userId }, data: { email } });
    return tx.profile.update({
      where: { id: profileId },
      data: {
        ...updateProfileData(profile),
        ...(studentInfo
          ? {
              studentInfo: {
                update: {
                  ...studentDetailsData(details, true),
                  ...(academicInfo
                    ? {
                        academicInfo: {
                          upsert: {
                            create: {
                              ...academicInfo,
                              admissionDate: null,
                              admissionYear: null,
                              admissionStatus: 'PROSPECT',
                              studentStatus: null,
                            },
                            update: {
                              ...academicInfo,
                              admissionDate: null,
                              admissionYear: null,
                              studentStatus: null,
                            },
                          },
                        },
                      }
                    : {}),
                  ...(paymentInfo
                    ? {
                        paymentInfo: {
                          upsert: { create: paymentInfo, update: paymentInfo },
                        },
                      }
                    : {}),
                },
              },
            }
          : {}),
      },
      include: studentInclude,
    });
  });
};
const updateStudentInfo = async (
  profileId: string,
  payload: TUpdateStudentInfo,
  actor: TActor,
) => {
  await accessibleStudent(profileId, actor);
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM profiles WHERE id = ${profileId}::uuid FOR UPDATE`;
    const profile = await tx.profile.findUniqueOrThrow({
      where: { id: profileId },
      include: studentInclude,
    });
    if (profile.isDeleted || profile.user?.isDeleted || !profile.studentInfo)
      throw new AppError(404, 'Student not found');
    if (
      actor.role === 'TEACHER' &&
      (profile.studentInfo.collectedById !== actor.id ||
        profile.studentInfo.academicInfo?.admissionStatus === 'ADMITTED')
    )
      throw new AppError(
        403,
        'Only administrators can edit admitted student information',
      );
    return tx.studentInfo.update({
      where: { id: profile.studentInfo.id },
      data: studentDetailsData(payload, true),
      include: studentInfoInclude,
    });
  });
};
const collectionSummary = async (actor: TActor, teacherUserId?: string) => {
  let collectorId = actor.id;
  if (teacherUserId) {
    if (!['SUPER_ADMIN', 'ADMIN'].includes(actor.role))
      throw new AppError(403, 'Only administrators can view another teacher');
    const teacher = await prisma.user.findUnique({
      where: { userId: teacherUserId },
    });
    if (!teacher || teacher.role !== 'TEACHER' || teacher.isDeleted)
      throw new AppError(404, 'Teacher not found');
    collectorId = teacher.id;
  }
  const groups = await prisma.academicInfo.groupBy({
    by: ['admissionStatus'],
    where: {
      studentInfo: {
        is: {
          collectedById: collectorId,
          profile: {
            is: {
              isDeleted: false,
              user: { is: { role: 'STUDENT', isDeleted: false } },
            },
          },
        },
      },
    },
    _count: { _all: true },
  });
  const statusCounts = Object.fromEntries(
    Object.values(AdmissionStatus).map((status) => [
      status,
      groups.find((group) => group.admissionStatus === status)?._count._all ??
        0,
    ]),
  );
  const totalCollected = groups.reduce(
    (sum, group) => sum + group._count._all,
    0,
  );
  return {
    totalCollected,
    totalAdmitted: statusCounts.ADMITTED,
    pending:
      statusCounts.PROSPECT +
      statusCounts.FOLLOW_UP +
      statusCounts.INTERESTED +
      statusCounts.APPLIED,
    statusCounts,
  };
};
const addHomeVisit = async (
  profileId: string,
  payload: THomeVisit,
  actor: TActor,
) => {
  const profile = await accessibleStudent(profileId, actor);
  return prisma.homeVisit.create({
    data: {
      studentInfoId: profile.studentInfo!.id,
      visitedById: actor.id,
      ...payload,
    },
  });
};
const listHomeVisits = async (profileId: string, actor: TActor) => {
  const profile = await accessibleStudent(profileId, actor);
  return prisma.homeVisit.findMany({
    where: { studentInfoId: profile.studentInfo!.id },
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
    include: studentInclude,
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
      include: studentInclude,
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
  updateStudentInfo,
  updateStudentDraft,
  collectionSummary,
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
