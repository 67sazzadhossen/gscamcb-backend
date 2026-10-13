import { z } from 'zod';
const fee = z
  .union([z.string(), z.number()])
  .transform(String)
  .pipe(
    z
      .string()
      .regex(
        /^\d{1,10}(?:\.\d{1,2})?$/,
        'Fee must be non-negative with at most two decimal places',
      ),
  );
export const createPaymentInfoSchema = z
  .object({
    admissionFee: fee,
    annualFee: fee,
    monthlyFee: fee,
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
