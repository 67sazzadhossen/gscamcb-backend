import { prisma } from '../../../../prisma/lib/prisma';
const createClass = (payload: { name: string }) =>
  prisma.class.create({ data: payload });
const listClasses = () =>
  prisma.class.findMany({
    include: { sections: { orderBy: { name: 'asc' } } },
    orderBy: { createdAt: 'asc' },
  });
const updateClass = (id: string, payload: { name: string }) =>
  prisma.class.update({ where: { id }, data: payload });
export const ClassServices = { createClass, listClasses, updateClass };
