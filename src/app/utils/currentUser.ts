import { Request } from 'express';
import { AppError } from '../errors/AppError';
export const currentUser = (req: Request) => {
  if (!req.user) throw new AppError(401, 'Please sign in');
  return req.user;
};
