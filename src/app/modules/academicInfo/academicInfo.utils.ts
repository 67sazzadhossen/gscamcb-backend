import { Prisma } from '../../../../prisma/generated/prisma/client';
import { AppError } from '../../errors/AppError';
export const validatePlacement = async (
  tx: Prisma.TransactionClient,
  placement: {
    admissionClassId?: string;
    currentClassId: string;
    sectionId?: string | null;
  },
) => {
  const ids = [
    ...new Set(
      [placement.admissionClassId, placement.currentClassId].filter(
        (id): id is string => Boolean(id),
      ),
    ),
  ];
  if ((await tx.class.count({ where: { id: { in: ids } } })) !== ids.length)
    throw new AppError(404, 'Selected class not found');
  if (placement.sectionId) {
    const section = await tx.section.findUnique({
      where: { id: placement.sectionId },
    });
    if (!section) throw new AppError(404, 'Selected section not found');
    if (section.classId !== placement.currentClassId)
      throw new AppError(
        400,
        'Selected section does not belong to the current class',
      );
  }
};

export const admissionDetails = (payload: {
  admissionDate?: Date;
  admissionYear?: number;
}) => {
  const dateText = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  const admissionDate =
    payload.admissionDate ?? new Date(`${dateText}T00:00:00Z`);
  const year = admissionDate.getUTCFullYear();
  if (payload.admissionYear !== undefined && payload.admissionYear !== year)
    throw new AppError(400, 'Admission year must match admission date');
  return {
    admissionDate,
    admissionYear: year,
    admissionStatus: 'ADMITTED' as const,
    studentStatus: 'ACTIVE' as const,
  };
};
