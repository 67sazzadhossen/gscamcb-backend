import { prisma } from '../../../../prisma/lib/prisma';
import { AppError } from '../../errors/AppError';
import { getStudentProfile } from '../../utils/studentProfile';
import {
  TCreatePaymentInfo,
  TUpdatePaymentInfo,
} from './paymentInfo.interface';
const getPaymentInfo = async (userId: string) => {
  const profile = await getStudentProfile(userId);
  if (!profile.paymentInfo)
    throw new AppError(404, 'Student payment info not found');
  return profile.paymentInfo;
};
const updatePaymentInfo = async (
  userId: string,
  payload: TUpdatePaymentInfo,
) => {
  const info = await getPaymentInfo(userId);
  return prisma.paymentInfo.update({ where: { id: info.id }, data: payload });
};
const createPaymentInfo = async (
  userId: string,
  payload: TCreatePaymentInfo,
) => {
  const profile = await getStudentProfile(userId);
  if (profile.paymentInfo)
    throw new AppError(409, 'Student payment info already exists');
  return prisma.paymentInfo.create({
    data: { studentInfoId: profile.id, ...payload },
  });
};
export const PaymentInfoServices = {
  getPaymentInfo,
  updatePaymentInfo,
  createPaymentInfo,
};
