import { prisma } from '../../prisma/lib/prisma';
import { UserRole } from '../../prisma/generated/prisma/client';
import { UserServices } from '../app/modules/users/user.service';
import { StudentServices } from '../app/modules/student/student.service';
import { initialPassword } from '../app/utils/initialPassword';
import { getUserIdPrefix } from '../app/utils/generateUserId';

async function main() {
  initialPassword();
  const admin = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN', status: 'ACTIVE', isDeleted: false },
  });
  if (!admin)
    throw new Error(
      'Create the configured super admin first with npm run seed:super-admin',
    );
  const results = [{ role: admin.role, userId: admin.userId, created: false }];
  for (const role of [
    'ADMIN',
    'TEACHER',
    'ACCOUNTANT',
    'STAFF',
    'STUDENT',
  ] as UserRole[]) {
    const existing = await prisma.user.findFirst({
      where: {
        role,
        status: 'ACTIVE',
        isDeleted: false,
        ...(role === 'STUDENT'
          ? {
              profile: {
                is: {
                  studentInfo: {
                    is: {
                      academicInfo: { is: { admissionStatus: 'ADMITTED' } },
                    },
                  },
                },
              },
            }
          : {}),
      },
      orderBy: { createdAt: 'asc' },
    });
    if (existing) {
      results.push({ role, userId: existing.userId, created: false });
      continue;
    }
    const email = `demo.${role.toLowerCase()}@example.com`;
    const previous = await prisma.user.findUnique({ where: { email } });
    if (
      previous &&
      (previous.role !== role ||
        previous.isDeleted ||
        previous.status !== 'ACTIVE')
    )
      throw new Error(
        `Demo ${role} email is already used by an unavailable or different account`,
      );
    let studentInfo;
    if (role === 'STUDENT') {
      const classroom = await prisma.class.upsert({
        where: { name: 'Demo Class' },
        create: { name: 'Demo Class' },
        update: {},
      });
      const section = await prisma.section.upsert({
        where: {
          classId_name: { classId: classroom.id, name: 'Demo Section' },
        },
        create: { classId: classroom.id, name: 'Demo Section' },
        update: {},
      });
      const academicYear = Number(
        '20' + getUserIdPrefix('STUDENT', 'MORNING').slice(0, 2),
      );
      studentInfo = {
        academicInfo: {
          admissionClassId: classroom.id,
          currentClassId: classroom.id,
          sectionId: section.id,
          academicYear,
        },
        paymentInfo: {
          admissionFee: '0',
          annualFee: '0',
          monthlyFee: '0',
          academicYear,
        },
      };
    }
    const teacher =
      role === 'STUDENT'
        ? await prisma.user.findFirstOrThrow({
            where: { role: 'TEACHER', isDeleted: false, status: 'ACTIVE' },
          })
        : admin;
    const user = previous
      ? await UserServices.getUser(previous.userId)
      : await UserServices.createUser(
          {
            role,
            email,
            profile: {
              name: {
                firstName: 'Demo',
                lastName: role.charAt(0) + role.slice(1).toLowerCase(),
              },
              shift: 'MORNING',
              ...(studentInfo
                ? { studentInfo }
                : {
                    employmentInfo: {
                      designation: role.charAt(0) + role.slice(1).toLowerCase(),
                    },
                  }),
            },
          },
          'SUPER_ADMIN',
          teacher.id,
        );
    if (role === 'STUDENT')
      await StudentServices.admitStudent(user.profile!.id, studentInfo!, {
        id: admin.id,
        role: 'SUPER_ADMIN',
      });
    results.push({ role, userId: user.userId, created: !previous });
  }
  console.table(results);
  console.log(
    'New demo accounts use DEFAULT_PASSWORD and require a password change. Existing accounts and passwords were preserved.',
  );
}
main()
  .catch((error) => {
    console.error(
      error instanceof Error ? error.message : 'Role account creation failed',
    );
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
