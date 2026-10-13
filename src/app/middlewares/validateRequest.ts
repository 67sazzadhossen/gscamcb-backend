import { RequestHandler } from 'express';
import { z } from 'zod';
import catchAsync from '../utils/catchAsync';
// Match the GSCAM pattern: pass a schema describing the request body.
export const validateRequest = (schema: z.ZodType): RequestHandler =>
  catchAsync(async (req, _res, next) => {
    req.body = await schema.parseAsync(req.body);
    next();
  });
