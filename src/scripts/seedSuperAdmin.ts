import 'dotenv/config';
import { z } from 'zod';
import { prisma } from '../../prisma/lib/prisma';
import { UserServices } from '../app/modules/users/user.service';
const env = z
  .object({
    SUPER_ADMIN_NAME: z.string().min(1),
    SUPER_ADMIN_EMAIL: z.email(),
    DEFAULT_PASSWORD: z.string().min(8).max(72),
  })
  .parse(process.env);
async function main() {
  const parts = env.SUPER_ADMIN_NAME.trim().split(/\s+/);
  const firstName = parts.shift()!;
  const lastName = parts.pop() ?? firstName;
  const result = await UserServices.seedSuperAdmin({
    email: env.SUPER_ADMIN_EMAIL.toLowerCase(),
    password: env.DEFAULT_PASSWORD,
    profile: {
      name: { firstName, middleName: parts.join(' ') || undefined, lastName },
      shift: 'MORNING',
    },
  });
  console.log(
    `${result.created ? 'Created' : 'Existing'} super admin: ${result.user.userId} (${result.user.email})`,
  );
}
main()
  .catch(() => {
    console.error(
      'Super-admin seed failed. Check database access and seed configuration.',
    );
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
