import { prisma } from '../../../../prisma/lib/prisma';
import { AppError } from '../../errors/AppError';
const createSection = async (payload: { name: string; classId: string }) => {
  if (!(await prisma.class.findUnique({ where: { id: payload.classId } })))
    throw new AppError(404, 'Class not found');
  return prisma.section.create({ data: payload, include: { class: true } });
};
const listSections = (classId?: string) =>
  prisma.section.findMany({
    where: { classId },
    include: { class: true },
    orderBy: { name: 'asc' },
  });
const updateSection = (id: string, payload: { name: string }) =>
  prisma.section.update({ where: { id }, data: payload });
export const SectionServices = { createSection, listSections, updateSection };
