import { z } from 'zod';
export const moneySchema = z
  .union([z.string(), z.number()])
  .transform(String)
  .pipe(
    z
      .string()
      .regex(
        /^\d{1,10}(?:\.\d{1,2})?$/,
        'Amount must be non-negative with at most two decimal places',
      ),
  );
