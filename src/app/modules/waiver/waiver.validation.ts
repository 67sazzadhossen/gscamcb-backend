import { z } from 'zod';
import {
  FeeType,
  DiscountType,
} from '../../../../prisma/generated/prisma/client';
export const createWaiverSchema = z
  .object({
    feeType: z.enum(FeeType),
    discountType: z.enum(DiscountType),
    value: z
      .union([z.string(), z.number()])
      .transform(String)
      .pipe(z.string().regex(/^\d{1,10}(?:\.\d{1,2})?$/)),
    startDate: z.iso.date().transform((value) => new Date(value)),
    endDate: z.iso
      .date()
      .transform((value) => new Date(value))
      .optional(),
    reason: z.string().trim().min(1).max(1000),
  })
  .strict()
  .refine(
    (data) =>
      Number(data.value) > 0 &&
      (data.discountType !== 'PERCENTAGE' || Number(data.value) <= 100),
    'Waiver must be positive; percentage cannot exceed 100',
  )
  .refine(
    (data) => !data.endDate || data.endDate >= data.startDate,
    'End date must not precede start date',
  );
export const decideWaiverSchema = z
  .object({ status: z.enum(['APPROVED', 'REJECTED', 'REVOKED']) })
  .strict();
