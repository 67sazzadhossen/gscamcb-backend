import { academicInfoInclude } from './academicInfo.const';
import { validatePlacement } from './academicInfo.utils';
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
) => {
  const profile = await getStudentProfile(userId);
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM profiles WHERE id = ${profile.profile.id}::uuid FOR UPDATE`;
    const current = await tx.academicInfo.findUnique({
      where: { studentInfoId: profile.id },
    });
    if (current?.admissionStatus === 'ADMITTED')
      throw new AppError(409, 'Academic info already exists');
    await validatePlacement(tx, payload);
    return tx.academicInfo.upsert({
      where: { studentInfoId: profile.id },
      create: {
        studentInfoId: profile.id,
        ...payload,
        admissionDate: null,
        admissionYear: null,
        admissionStatus: 'PROSPECT',
        studentStatus: null,
      },
      update: {
        ...payload,
        admissionDate: null,
        admissionYear: null,
        studentStatus: null,
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
    if (payload.studentStatus && current.admissionStatus !== 'ADMITTED')
      throw new AppError(
        400,
        'Admit the student before setting enrollment status',
      );
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
    const classId = payload.currentClassId ?? current.currentClassId;
    if (classId)
      await validatePlacement(tx, {
        currentClassId: classId,
        sectionId: data.sectionId,
      });
    else if (data.sectionId || data.rollNumber)
      throw new AppError(400, 'Select the current class first');
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
      where: { studentInfoId: profile.id },
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
      where: { studentInfoId: profile.id },
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
      where: { id: profile.profile.id },
      include: {
        studentInfo: {
          include: {
            academicInfo: { include: academicInfoInclude },
            paymentInfo: true,
          },
        },
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
