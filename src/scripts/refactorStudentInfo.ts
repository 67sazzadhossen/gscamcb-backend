import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { prisma } from '../../prisma/lib/prisma';
import config from '../app/config';
const schemaName =
  new URL(config.database_url).searchParams.get('schema') ?? 'public';
const migrate = async () => {
  await prisma.$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${'gscamcb-student-info-refactor:' + schemaName}))::text`;
      const quotedSchema = '"' + schemaName.replaceAll('"', '""') + '"';
      await tx.$queryRaw`SELECT set_config('search_path', ${quotedSchema}, true)`;
      const columns = await tx.$queryRaw<
        { exists: boolean }[]
      >`SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = ${schemaName} AND table_name = 'profiles' AND column_name = 'isCadet') AS exists`;
      if (!columns[0].exists) {
        console.log(
          'StudentInfo migration already applied or fresh schema in use',
        );
        return;
      }
      await tx.$executeRawUnsafe(
        'LOCK TABLE profiles, users, academic_info, payment_info, guardians, local_guardians, home_visits, waivers IN ACCESS EXCLUSIVE MODE',
      );
      const statements = readFileSync(
        resolve('scripts/sql/separate-student-info.sql'),
        'utf8',
      )
        .split('-- migrate:statement')
        .slice(1);
      for (const statement of statements)
        await tx.$executeRawUnsafe(statement.trim());
      console.log(
        'StudentInfo migration applied; common profiles and student relations retained',
      );
    },
    { timeout: 120000, maxWait: 10000 },
  );
};
migrate()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
