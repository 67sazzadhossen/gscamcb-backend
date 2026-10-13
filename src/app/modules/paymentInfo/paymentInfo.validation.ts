import { z } from 'zod';
import { moneySchema } from '../../utils/money.validation';
export const createPaymentInfoSchema = z
  .object({
    admissionFee: moneySchema,
    annualFee: moneySchema,
    monthlyFee: moneySchema,
    academicYear: z.number().int().min(2000).max(2100),
  })
  .strict();
export const updatePaymentInfoSchema = createPaymentInfoSchema
  .partial()
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    'Provide at least one fee or year field',
  );
