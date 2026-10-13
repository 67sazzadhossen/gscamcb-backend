import { UserRole } from '../../../prisma/generated/prisma/client';
import { prisma } from '../../../prisma/lib/prisma';
import jwt from 'jsonwebtoken';
import config from '../config';
import catchAsync from '../utils/catchAsync';
import { AppError } from '../errors/AppError';
export const auth = (...roles: UserRole[]) =>
  catchAsync(async (req, _res, next) => {
    const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
    if (!token) throw new AppError(401, 'Please sign in');
    let subject: string;
    try {
      const decoded = jwt.verify(token, config.jwt_secret, {
        algorithms: ['HS256'],
        issuer: 'gscamcb-backend',
        audience: 'gscamcb-frontend',
      });
      if (typeof decoded === 'string' || typeof decoded.sub !== 'string')
        throw new Error('Invalid token');
      subject = decoded.sub;
    } catch {
      throw new AppError(401, 'Invalid or expired session');
    }
    const user = await prisma.user.findUnique({
      where: { id: subject },
      select: {
        id: true,
        userId: true,
        role: true,
        status: true,
        isDeleted: true,
        mustChangePassword: true,
        profile: {
          select: {
            studentInfo: {
              select: { academicInfo: { select: { admissionStatus: true } } },
            },
          },
        },
      },
    });
    if (
      !user ||
      user.isDeleted ||
      user.status !== 'ACTIVE' ||
      (user.role === 'STUDENT' &&
        user.profile?.studentInfo?.academicInfo?.admissionStatus !== 'ADMITTED')
    )
      throw new AppError(401, 'Account is unavailable');
    if (roles.length && !roles.includes(user.role))
      throw new AppError(403, 'You do not have permission for this action');
    if (roles.length && user.mustChangePassword)
      throw new AppError(
        403,
        'Change your initial password before managing accounts',
      );
    req.user = user;
    next();
  });
