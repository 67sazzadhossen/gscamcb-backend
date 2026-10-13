import jwt from 'jsonwebtoken';
import { prisma } from '../../../../prisma/lib/prisma';
import config from '../../config';
import { AppError } from '../../errors/AppError';
import { hashPassword, verifyPassword } from '../../utils/password';
import { userSelect } from '../users/user.const';
const login = async (identifier: string, password: string) => {
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ userId: identifier }, { email: identifier.toLowerCase() }],
    },
  });
  if (
    !user ||
    user.isDeleted ||
    user.status !== 'ACTIVE' ||
    !(await verifyPassword(password, user.passwordHash))
  )
    throw new AppError(401, 'Invalid credentials');
  const accessToken = jwt.sign({}, config.jwt_secret, {
    algorithm: 'HS256',
    subject: user.id,
    issuer: 'gscamcb-backend',
    audience: 'gscamcb-frontend',
    expiresIn: '1h',
  });
  const safeUser = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: userSelect,
  });
  return { accessToken, user: safeUser };
};
const changePassword = async (
  id: string,
  currentPassword: string,
  newPassword: string,
) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id } });
  if (!(await verifyPassword(currentPassword, user.passwordHash)))
    throw new AppError(401, 'Current password is incorrect');
  await prisma.user.update({
    where: { id },
    data: {
      passwordHash: await hashPassword(newPassword),
      mustChangePassword: false,
    },
  });
  return null;
};
export const AuthServices = { login, changePassword };
