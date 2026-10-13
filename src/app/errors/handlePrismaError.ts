import { Prisma } from '../../../prisma/generated/prisma/client';
import { TGenericErrorResponse } from '../types/error';
export const handlePrismaError = (
  error: Prisma.PrismaClientKnownRequestError,
): TGenericErrorResponse => {
  const errors: Record<string, [number, string]> = {
    P2002: [409, 'A record with this value already exists'],
    P2025: [404, 'Record not found'],
    P2023: [400, 'Invalid record identifier or data'],
    P2000: [400, 'Value is too long'],
    P2003: [400, 'Related record does not exist'],
    P2014: [400, 'Invalid relation'],
  };
  const [statusCode, message] = errors[error.code] ?? [
    500,
    'Database operation failed',
  ];
  const target = error.meta?.target;
  return {
    statusCode,
    message,
    errorSources: [
      { path: Array.isArray(target) ? target.join(', ') : '', message },
    ],
  };
};
