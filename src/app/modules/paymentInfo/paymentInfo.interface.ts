import { z } from 'zod';
import {
  createPaymentInfoSchema,
  updatePaymentInfoSchema,
} from './paymentInfo.validation';
export type TUpdatePaymentInfo = z.infer<typeof updatePaymentInfoSchema>;

export type TCreatePaymentInfo = z.infer<typeof createPaymentInfoSchema>;
