import { z } from 'zod';
import { createWaiverSchema, decideWaiverSchema } from './waiver.validation';
export type TCreateWaiver = z.infer<typeof createWaiverSchema>;
export type TDecideWaiver = z.infer<typeof decideWaiverSchema>;
