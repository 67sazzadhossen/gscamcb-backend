import { RequestHandler } from 'express';
import { AppError } from '../errors/AppError';
export const notFound: RequestHandler = (_req, _res, next) =>
  next(new AppError(404, 'API route not found'));
