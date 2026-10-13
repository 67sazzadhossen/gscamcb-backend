import { academicInfoInclude } from './academicInfo.const';
import { validatePlacement, admissionDetails } from './academicInfo.utils';
import { prisma } from '../../../../prisma/lib/prisma';
import { AppError } from '../../errors/AppError';
import { getStudentProfile } from '../../utils/studentProfile';
import {
  TCreateAcademicInfo,
  TUpdateAcademicInfo,
  TPromoteStudent,
} from './academicInfo.interface';
const getAcademicInfo = async (userId: string) => {
  const profile = await getStudentProfile(userId);
  if (!profile.academicInfo)
    throw new AppError(404, 'Student academic info not found');
  return profile.academicInfo;
};
const createAcademicInfo = async (
  userId: string,
  payload: TCreateAcademicInfo,
  actorId: string,
) => {
  const profile = await getStudentProfile(userId);
  if (profile.academicInfo)
    throw new AppError(409, 'Academic info already exists');
  return prisma.$transaction(async (tx) => {
    await validatePlacement(tx, payload);
    return tx.academicInfo.create({
      data: {
        profileId: profile.id,
        ...payload,
        ...admissionDetails(payload),
        admittedById: actorId,
      },
      include: academicInfoInclude,
    });
  });
};
const updateAcademicInfo = async (
  userId: string,
  payload: TUpdateAcademicInfo,
) => {
  const info = await getAcademicInfo(userId);
  return prisma.$transaction(async (tx) => {
    const current = await tx.academicInfo.findUniqueOrThrow({
      where: { id: info.id },
    });
    if (!current.currentClassId)
      throw new AppError(400, 'Admit the student before editing placement');
    const classChanged =
      payload.currentClassId !== undefined &&
      payload.currentClassId !== current.currentClassId;
    const data = {
      ...payload,
      sectionId:
        payload.sectionId !== undefined
          ? payload.sectionId
          : classChanged
            ? null
            : current.sectionId,
      rollNumber:
        payload.rollNumber !== undefined
          ? payload.rollNumber
          : classChanged
            ? null
            : current.rollNumber,
    };
    await validatePlacement(tx, {
      currentClassId: payload.currentClassId ?? current.currentClassId,
      sectionId: data.sectionId,
    });
    return tx.academicInfo.update({
      where: { id: info.id },
      data,
      include: academicInfoInclude,
    });
  });
};
const promoteStudent = async (userId: string, payload: TPromoteStudent) => {
  const profile = await getStudentProfile(userId);
  return prisma.$transaction(async (tx) => {
    const info = await tx.academicInfo.findUnique({
      where: { profileId: profile.id },
    });
    if (!info) throw new AppError(404, 'Student academic info not found');
    if (
      info.admissionStatus !== 'ADMITTED' ||
      info.studentStatus !== 'ACTIVE' ||
      info.academicYear === null
    )
      throw new AppError(400, 'Only active admitted students can be promoted');
    if (payload.academicYear <= info.academicYear)
      throw new AppError(
        400,
        'Promotion year must be later than the current academic year',
      );
    await validatePlacement(tx, payload);
    const changed = await tx.academicInfo.updateMany({
      where: { id: info.id, academicYear: info.academicYear },
      data: {
        currentClassId: payload.currentClassId,
        sectionId: payload.sectionId ?? null,
        rollNumber: payload.rollNumber ?? null,
        academicYear: payload.academicYear,
      },
    });
    if (changed.count !== 1)
      throw new AppError(
        409,
        'Student was already promoted; refresh the record',
      );
    const fees = await tx.paymentInfo.findUnique({
      where: { profileId: profile.id },
    });
    if (payload.paymentInfo && !fees)
      throw new AppError(
        404,
        'Initialize student payment info before updating fees',
      );
    if (fees)
      await tx.paymentInfo.update({
        where: { id: fees.id },
        data: { ...payload.paymentInfo, academicYear: payload.academicYear },
      });
    return tx.profile.findUniqueOrThrow({
      where: { id: profile.id },
      include: {
        academicInfo: { include: academicInfoInclude },
        paymentInfo: true,
      },
    });
  });
};
export const AcademicInfoServices = {
  getAcademicInfo,
  createAcademicInfo,
  updateAcademicInfo,
  promoteStudent,
};
