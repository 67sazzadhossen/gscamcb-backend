import {
  UserRole,
  Shift,
  Prisma,
} from '../../../prisma/generated/prisma/client';
import { ROLE_CODES, SHIFT_CODES } from '../modules/users/user.const';
import { AppError } from '../errors/AppError';
export const getUserIdPrefix = (
  role: UserRole,
  shift: Shift,
  date = new Date(),
) => {
  const year = new Intl.DateTimeFormat('en', {
    timeZone: 'Asia/Dhaka',
    year: '2-digit',
  }).format(date);
  return `${year}${ROLE_CODES[role]}${SHIFT_CODES[shift]}`;
};
export const formatUserId = (prefix: string, serial: number) => {
  if (
    !/^\d{5}$/.test(prefix) ||
    !Number.isInteger(serial) ||
    serial < 1 ||
    serial > 999
  )
    throw new AppError(
      409,
      'User ID serial limit reached for this year, role, and shift',
    );
  return `${prefix}${String(serial).padStart(3, '0')}`;
};
export const generateUserId = async (
  tx: Prisma.TransactionClient,
  role: UserRole,
  shift: Shift,
) => {
  const prefix = getUserIdPrefix(role, shift);
  // PostgreSQL allocates the counter atomically, including concurrent first inserts.
  const rows = await tx.$queryRaw<
    { serial: number }[]
  >`INSERT INTO user_id_sequences (prefix, serial) VALUES (${prefix}, 1) ON CONFLICT (prefix) DO UPDATE SET serial = user_id_sequences.serial + 1 RETURNING serial`;
  return formatUserId(prefix, rows[0].serial);
};
