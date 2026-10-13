import type { UserRole } from '../../../prisma/generated/prisma/client';
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        userId: string;
        role: UserRole;
        mustChangePassword: boolean;
      };
    }
  }
}
export {};
