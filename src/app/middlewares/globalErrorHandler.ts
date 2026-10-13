import { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '../../../prisma/generated/prisma/client';
import config from '../config';
import { AppError } from '../errors/AppError';
import { handleZodError } from '../errors/handleZodError';
import { handlePrismaError } from '../errors/handlePrismaError';
import { TGenericErrorResponse } from '../types/error';

export const globalErrorHandler: ErrorRequestHandler = (
  error: unknown,
  _req,
  res,
  next,
) => {
  if (res.headersSent) return next(error);
  let result: TGenericErrorResponse = {
    statusCode: 500,
    message: 'Something went wrong',
    errorSources: [{ path: '', message: 'Something went wrong' }],
  };
  if (error instanceof ZodError) result = handleZodError(error);
  else if (error instanceof Prisma.PrismaClientKnownRequestError)
    result = handlePrismaError(error);
  else if (error instanceof Prisma.PrismaClientValidationError) {
    result = {
      statusCode: 400,
      message: 'Invalid database request',
      errorSources: [{ path: '', message: 'Invalid database request' }],
    };
  } else if (error instanceof AppError) {
    result = {
      statusCode: error.statusCode,
      message: error.message,
      errorSources: [{ path: '', message: error.message }],
    };
  } else if (
    error instanceof SyntaxError &&
    'status' in error &&
    error.status === 400
  ) {
    result = {
      statusCode: 400,
      message: 'Invalid JSON body',
      errorSources: [{ path: 'body', message: 'Invalid JSON body' }],
    };
  } else if (
    error instanceof Error &&
    'status' in error &&
    error.status === 413
  ) {
    result = {
      statusCode: 413,
      message: 'Request body is too large',
      errorSources: [{ path: 'body', message: 'Request body is too large' }],
    };
  } else if (error instanceof Error && config.node_env === 'development') {
    result.message = error.message;
    result.errorSources = [{ path: '', message: error.message }];
  }
  if (result.statusCode >= 500) console.error(error);
  res.status(result.statusCode).json({
    success: false,
    message: result.message,
    errorSources: result.errorSources,
    stack:
      config.node_env === 'development' && error instanceof Error
        ? error.stack
        : null,
  });
};
