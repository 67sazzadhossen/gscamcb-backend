import { z } from 'zod';
import { moneySchema } from '../../utils/money.validation';
import { EmploymentStatus } from '../../../../prisma/generated/prisma/client';
export const employmentInfoSchema = z
  .object({
    monthlySalary: moneySchema.optional(),
    designation: z.string().trim().min(1).max(120),
    department: z.string().trim().max(120).optional(),
    joiningDate: z.iso
      .date()
      .transform((value) => new Date(value))
      .optional(),
    qualification: z.string().trim().max(1000).optional(),
    specialization: z.string().trim().max(500).optional(),
    employmentStatus: z.enum(EmploymentStatus).optional(),
  })
  .strict();
